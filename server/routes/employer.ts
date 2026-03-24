import { Router } from "express";
import { desc } from "drizzle-orm";
import { companies, jobApplications, jobs, userInteractions, users } from "@shared/schema";
import {
  employerApplicationSummarySchema,
  employerDashboardSchema,
  employerJobSummarySchema,
} from "@shared/platform-contracts";
import { db } from "../db";
import { verifyFirebaseToken } from "../middleware/auth";
import { assertRole, resolveAuthenticatedDatabaseUser } from "../services/authenticatedUser";

const router = Router();

function toRelativeTime(dateLike: Date | string | null | undefined) {
  if (!dateLike) {
    return "just now";
  }

  const now = Date.now();
  const time = new Date(dateLike).getTime();
  const diffMinutes = Math.max(1, Math.floor((now - time) / (1000 * 60)));

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hours ago`;
  }

  return `${Math.floor(diffHours / 24)} days ago`;
}

router.use(verifyFirebaseToken);

router.get("/dashboard", async (req, res, next) => {
  try {
    const authUser = (req as any).user;
    const dbUser = await resolveAuthenticatedDatabaseUser(authUser);
    assertRole(dbUser, ["admin", "employer"]);

    const [jobRows, applicationRows, interactionRows] = await Promise.all([
      db.select().from(jobs).orderBy(desc(jobs.createdAt)),
      db.select().from(jobApplications).orderBy(desc(jobApplications.appliedAt)),
      db.select().from(userInteractions).orderBy(desc(userInteractions.interactionTime)),
    ]);

    const applicationTrend = new Map<string, number>();
    applicationRows.forEach((application) => {
      const key = new Date(application.appliedAt).toISOString().slice(0, 10);
      applicationTrend.set(key, (applicationTrend.get(key) || 0) + 1);
    });

    const jobPerformance = jobRows.slice(0, 8).map((job) => ({
      jobTitle: job.title,
      views: interactionRows.filter((interaction) => interaction.jobId === job.id && interaction.interactionType === "view").length,
      applications: applicationRows.filter((application) => application.jobId === job.id).length,
    }));

    const recentActivity = applicationRows.slice(0, 5).map((application) => ({
      title: "New Application",
      description: `Application ${application.id} received for job ${application.jobId}`,
      timestamp: toRelativeTime(application.appliedAt),
    }));

    res.json(employerDashboardSchema.parse({
      scope: "platform",
      stats: {
        totalJobs: jobRows.length,
        activeJobs: jobRows.length,
        totalApplications: applicationRows.length,
        totalViews: interactionRows.filter((interaction) => interaction.interactionType === "view").length,
      },
      charts: {
        applications: Array.from(applicationTrend.entries())
          .map(([date, applications]) => ({ date, applications }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        jobPerformance,
      },
      recentActivity,
    }));
  } catch (error) {
    next(error);
  }
});

router.get("/jobs", async (req, res, next) => {
  try {
    const authUser = (req as any).user;
    const dbUser = await resolveAuthenticatedDatabaseUser(authUser);
    assertRole(dbUser, ["admin", "employer"]);

    const statusFilter = String(req.query.status || "all");
    const [jobRows, companyRows, applicationRows, interactionRows] = await Promise.all([
      db.select().from(jobs).orderBy(desc(jobs.createdAt)),
      db.select().from(companies),
      db.select().from(jobApplications),
      db.select().from(userInteractions),
    ]);

    const companyMap = new Map(companyRows.map((company) => [company.id, company]));
    const enrichedJobs = jobRows.map((job) => ({
      id: String(job.id),
      title: job.title,
      location: job.location,
      type: job.jobType,
      company: companyMap.get(job.companyId)?.name || "Unknown company",
      applications: applicationRows.filter((application) => application.jobId === job.id).length,
      views: interactionRows.filter((interaction) => interaction.jobId === job.id && interaction.interactionType === "view").length,
      postedDate: job.createdAt ? new Date(job.createdAt).toISOString().slice(0, 10) : "",
      status: "active",
    }));

    const payload = statusFilter === "all"
        ? enrichedJobs
        : enrichedJobs.filter((job) => job.status === statusFilter);

    res.json(payload.map((item) => employerJobSummarySchema.parse(item)));
  } catch (error) {
    next(error);
  }
});

router.get("/applications", async (req, res, next) => {
  try {
    const authUser = (req as any).user;
    const dbUser = await resolveAuthenticatedDatabaseUser(authUser);
    assertRole(dbUser, ["admin", "employer"]);

    const [applicationRows, userRows, jobRows] = await Promise.all([
      db.select().from(jobApplications).orderBy(desc(jobApplications.appliedAt)),
      db.select().from(users),
      db.select().from(jobs),
    ]);

    const userMap = new Map(userRows.map((user) => [user.id, user]));
    const jobMap = new Map(jobRows.map((job) => [job.id, job]));

    res.json(
      applicationRows.slice(0, 25).map((application) => {
        const applicant = userMap.get(application.userId);
        const job = jobMap.get(application.jobId);

        return employerApplicationSummarySchema.parse({
          id: String(application.id),
          applicantName: applicant?.name || "Unknown applicant",
          applicantEmail: applicant?.email || "",
          jobTitle: job?.title || `Job ${application.jobId}`,
          status: application.status,
          appliedAt: application.appliedAt,
          notes: application.notes,
        });
      })
    );
  } catch (error) {
    next(error);
  }
});

export default router;
