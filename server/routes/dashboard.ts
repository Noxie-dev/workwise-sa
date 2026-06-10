import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { companies, jobApplications, jobs } from "@shared/schema";
import { z } from "zod";
import {
  jobDistributionPayloadSchema,
  jobRecommendationSchema,
  paginatedResponseSchema,
  skillsAnalysisPayloadSchema,
} from "@shared/platform-contracts";
import { db } from "../db";
import { verifyFirebaseToken } from "../middleware/auth";
import { resolveAuthenticatedDatabaseUser } from "../services/authenticatedUser";

const router = Router();

function toIsoMonth(dateLike: Date | string | null | undefined) {
  const date = dateLike ? new Date(dateLike) : new Date();
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function truncateDescription(description: string) {
  return description.length > 140 ? `${description.slice(0, 137)}...` : description;
}

function inferMatchScore(title: string, userSkills: string[]) {
  const titleWords = title.toLowerCase().split(/\s+/);
  const overlap = userSkills.filter((skill) =>
    titleWords.some((word) => word.includes(skill.toLowerCase()) || skill.toLowerCase().includes(word))
  ).length;

  return Math.max(55, Math.min(98, 60 + overlap * 12));
}

function extractUserSkills(skillPayload: unknown): string[] {
  if (Array.isArray(skillPayload)) {
    return skillPayload
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item && typeof item === "object" && "skill" in item && typeof item.skill === "string") {
          return item.skill;
        }

        return null;
      })
      .filter((value): value is string => Boolean(value));
  }

  if (skillPayload && typeof skillPayload === "object" && "skills" in skillPayload) {
    return extractUserSkills((skillPayload as { skills?: unknown }).skills);
  }

  return [];
}

router.use(verifyFirebaseToken);

router.get("/job-distribution", async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.max(Number(req.query.limit || 10), 1);

    const jobRows = await db.select().from(jobs).orderBy(desc(jobs.createdAt));
    const categoryCounts = new Map<string, number>();
    const locationCounts = new Map<string, number>();
    const trendCounts = new Map<string, number>();

    jobRows.forEach((job) => {
      const categoryName = `Category ${job.categoryId}`;
      categoryCounts.set(categoryName, (categoryCounts.get(categoryName) || 0) + 1);
      locationCounts.set(job.location, (locationCounts.get(job.location) || 0) + 1);
      trendCounts.set(toIsoMonth(job.createdAt), (trendCounts.get(toIsoMonth(job.createdAt)) || 0) + 1);
    });

    res.json(paginatedResponseSchema(jobDistributionPayloadSchema).parse({
      data: {
        categories: Array.from(categoryCounts.entries())
          .map(([category, count]) => ({ category, count }))
          .slice((page - 1) * limit, page * limit),
        locations: Array.from(locationCounts.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, limit),
        trends: Array.from(trendCounts.entries())
          .map(([date, applications]) => ({ date, applications }))
          .sort((a, b) => a.date.localeCompare(b.date)),
      },
      pagination: {
        page,
        limit,
        totalItems: categoryCounts.size,
        totalPages: Math.max(1, Math.ceil(categoryCounts.size / limit)),
      },
    }));
  } catch (error) {
    next(error);
  }
});

router.get("/job-recommendations", async (req, res, next) => {
  try {
    const authUser = (req as any).user;
    const dbUser = await resolveAuthenticatedDatabaseUser(authUser);
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.max(Number(req.query.limit || req.query.recommendationLimit || 10), 1);

    const [jobRows, companyRows] = await Promise.all([
      db.select().from(jobs).orderBy(desc(jobs.createdAt)),
      db.select().from(companies),
    ]);

    const companyMap = new Map<number, any>((companyRows as any[]).map((company) => [company.id, company]));
    const userSkills = extractUserSkills(dbUser.skills);

    res.json(paginatedResponseSchema(z.array(jobRecommendationSchema)).parse({
      data: jobRows.slice((page - 1) * limit, page * limit).map((job) => ({
        id: String(job.id),
        title: job.title,
        company: companyMap.get(job.companyId)?.name || "Unknown company",
        match: inferMatchScore(job.title, userSkills),
        location: job.location,
        type: job.jobType,
        postedDate: job.createdAt ? new Date(job.createdAt).toISOString().slice(0, 10) : "",
        description: truncateDescription(job.description),
        skills: userSkills.slice(0, 3),
      })),
      pagination: {
        page,
        limit,
        totalItems: jobRows.length,
        totalPages: Math.max(1, Math.ceil(jobRows.length / limit)),
      },
    }));
  } catch (error) {
    next(error);
  }
});

router.get("/skills-analysis", async (req, res, next) => {
  try {
    const authUser = (req as any).user;
    const dbUser = await resolveAuthenticatedDatabaseUser(authUser);
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.max(Number(req.query.limit || 10), 1);

    const jobRows = await db.select().from(jobs).orderBy(desc(jobs.createdAt));
    const keywords = ["javascript", "python", "react", "sql", "customer service", "sales", "excel"];
    const marketDemand = keywords.map((skill) => ({
      skill: skill.replace(/\b\w/g, (char) => char.toUpperCase()),
      demand: jobRows.filter((job) => `${job.title} ${job.description}`.toLowerCase().includes(skill)).length,
      growth: Math.min(25, 5 + jobRows.filter((job) => `${job.title} ${job.description}`.toLowerCase().includes(skill)).length * 3),
    })).sort((a, b) => b.demand - a.demand);

    const userSkills = extractUserSkills(dbUser.skills).map((skill) => ({
      skill,
      level: "Active",
    }));

    const recommendations = marketDemand
      .filter((item) => !userSkills.some((skill) => skill.skill.toLowerCase() === item.skill.toLowerCase()))
      .slice(0, 3)
      .map((item) => ({
        skill: item.skill,
        reason: `Demand is visible across current job inventory for ${item.skill}.`,
      }));

    res.json(paginatedResponseSchema(skillsAnalysisPayloadSchema).parse({
      data: {
        marketDemand: marketDemand.slice((page - 1) * limit, page * limit),
        userSkills,
        recommendations,
      },
      pagination: {
        page,
        limit,
        totalItems: marketDemand.length,
        totalPages: Math.max(1, Math.ceil(marketDemand.length / limit)),
      },
    }));
  } catch (error) {
    next(error);
  }
});

router.get("/application-history", async (req, res, next) => {
  try {
    const authUser = (req as any).user;
    const dbUser = await resolveAuthenticatedDatabaseUser(authUser);
    const applicationRows = await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.userId, dbUser.id))
      .orderBy(desc(jobApplications.appliedAt));

    res.json({ applications: applicationRows });
  } catch (error) {
    next(error);
  }
});

export default router;
