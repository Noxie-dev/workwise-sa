import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { categories, companies, jobApplications, jobs, userInteractions, users } from "@shared/schema";
import {
  employerApplicationSummarySchema,
  employerDashboardSchema,
  employerJobDetailSchema,
  employerJobFormSchema,
  employerJobSummarySchema,
  employerJobStatusSchema,
  type EmployerJobForm,
  type EmployerJobStatus,
} from "@shared/platform-contracts";
import { db } from "../db";
import { verifyFirebaseToken } from "../middleware/auth";
import { Errors } from "../middleware/errorHandler";
import { assertRole, resolveAuthenticatedDatabaseUser } from "../services/authenticatedUser";

const router = Router();

const employerJobCreateSchema = employerJobFormSchema;
const employerJobUpdateSchema = employerJobFormSchema;

function assertEmployerJobAccess(dbUser: { id: number; role?: string | null }, job: typeof jobs.$inferSelect) {
  if (dbUser.role !== "admin" && job.createdByUserId !== dbUser.id) {
    throw Errors.forbidden("You can only access jobs owned by your employer account");
  }
}

function scopeEmployerJobs(dbUser: { id: number; role?: string | null }, jobRows: typeof jobs.$inferSelect[]) {
  return dbUser.role === "admin"
    ? jobRows
    : jobRows.filter((job) => job.createdByUserId === dbUser.id);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function titleFromSlug(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function composeSalary(payload: EmployerJobForm) {
  if (!payload.salaryMin && !payload.salaryMax) {
    return payload.isSalaryNegotiable ? "Negotiable" : null;
  }

  if (payload.salaryMin && payload.salaryMax) {
    return `R${payload.salaryMin} - R${payload.salaryMax}${payload.isSalaryNegotiable ? " (Negotiable)" : ""}`;
  }

  if (payload.salaryMin) {
    return `From R${payload.salaryMin}${payload.isSalaryNegotiable ? " (Negotiable)" : ""}`;
  }

  return `Up to R${payload.salaryMax}${payload.isSalaryNegotiable ? " (Negotiable)" : ""}`;
}

function composeDescription(payload: EmployerJobForm) {
  return [
    payload.description.trim(),
    payload.responsibilities.trim() ? `Responsibilities:\n${payload.responsibilities.trim()}` : "",
    payload.requirements.trim() ? `Requirements:\n${payload.requirements.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function findOrCreateCompany(payload: EmployerJobForm) {
  const companySlug = slugify(payload.companyName) || "company";
  const [existingCompany] = await db.select().from(companies).where(eq(companies.slug, companySlug)).limit(1);
  if (existingCompany) {
    return existingCompany;
  }

  const [createdCompany] = await db.insert(companies).values({
    name: payload.companyName,
    logo: typeof payload.companyLogo === "string" ? payload.companyLogo : null,
    location: payload.location || null,
    slug: companySlug,
    openPositions: 0,
  }).returning();

  return createdCompany;
}

async function findOrCreateCategory(payload: EmployerJobForm) {
  const categorySlug = slugify(payload.category) || "general";
  const [existingCategory] = await db.select().from(categories).where(eq(categories.slug, categorySlug)).limit(1);
  if (existingCategory) {
    return existingCategory;
  }

  const [createdCategory] = await db.insert(categories).values({
    name: titleFromSlug(categorySlug),
    icon: "briefcase",
    slug: categorySlug,
    jobCount: 0,
  }).returning();

  return createdCategory;
}

function mapJobForm(job: typeof jobs.$inferSelect, payload: EmployerJobForm, companyId: number, categoryId: number) {
  return employerJobDetailSchema.parse({
    id: String(job.id),
    companyId,
    categoryId,
    status: job.status as EmployerJobStatus,
    createdAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
    ...payload,
    companyLogo: payload.companyLogo ?? null,
  });
}

function toSummaryStatus(value: string | null | undefined): EmployerJobStatus {
  return employerJobStatusSchema.parse(value || "active");
}

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
    const scopedJobRows = scopeEmployerJobs(dbUser, jobRows);
    const scopedJobIds = new Set(scopedJobRows.map((job) => job.id));
    const scopedApplicationRows = applicationRows.filter((application) => scopedJobIds.has(application.jobId));
    const scopedInteractionRows = interactionRows.filter((interaction) => !interaction.jobId || scopedJobIds.has(interaction.jobId));

    const applicationTrend = new Map<string, number>();
    scopedApplicationRows.forEach((application) => {
      const key = new Date(application.appliedAt).toISOString().slice(0, 10);
      applicationTrend.set(key, (applicationTrend.get(key) || 0) + 1);
    });

    const jobPerformance = scopedJobRows.slice(0, 8).map((job) => ({
      jobTitle: job.title,
      views: scopedInteractionRows.filter((interaction) => interaction.jobId === job.id && interaction.interactionType === "view").length,
      applications: scopedApplicationRows.filter((application) => application.jobId === job.id).length,
    }));

    const recentActivity = scopedApplicationRows.slice(0, 5).map((application) => ({
      title: "New Application",
      description: `Application ${application.id} received for job ${application.jobId}`,
      timestamp: toRelativeTime(application.appliedAt),
    }));

    const activeJobs = scopedJobRows.filter((job) => job.status === "active").length;

    res.json(employerDashboardSchema.parse({
      scope: "platform",
      stats: {
        totalJobs: scopedJobRows.length,
        activeJobs,
        totalApplications: scopedApplicationRows.length,
        totalViews: scopedInteractionRows.filter((interaction) => interaction.interactionType === "view").length,
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
    const scopedJobRows = scopeEmployerJobs(dbUser, jobRows);
    const scopedJobIds = new Set(scopedJobRows.map((job) => job.id));
    const scopedApplicationRows = applicationRows.filter((application) => scopedJobIds.has(application.jobId));
    const scopedInteractionRows = interactionRows.filter((interaction) => scopedJobIds.has(interaction.jobId));

    const companyMap = new Map<number, any>((companyRows as any[]).map((company) => [company.id, company]));
    const enrichedJobs = scopedJobRows.map((job) => ({
      id: String(job.id),
      title: job.title,
      location: job.location,
      type: job.jobType,
      company: companyMap.get(job.companyId)?.name || "Unknown company",
      applications: scopedApplicationRows.filter((application) => application.jobId === job.id).length,
      views: scopedInteractionRows.filter((interaction) => interaction.jobId === job.id && interaction.interactionType === "view").length,
      postedDate: job.createdAt ? new Date(job.createdAt).toISOString().slice(0, 10) : "",
      status: toSummaryStatus(job.status),
    }));

    const payload = statusFilter === "all"
        ? enrichedJobs
        : enrichedJobs.filter((job) => job.status === statusFilter);

    res.json(payload.map((item) => employerJobSummarySchema.parse(item)));
  } catch (error) {
    next(error);
  }
});

router.get("/jobs/:jobId", async (req, res, next) => {
  try {
    const authUser = (req as any).user;
    const dbUser = await resolveAuthenticatedDatabaseUser(authUser);
    assertRole(dbUser, ["admin", "employer"]);

    const jobId = Number(req.params.jobId);
    if (Number.isNaN(jobId)) {
      throw Errors.validation("Invalid job ID");
    }

    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (!job) {
      throw Errors.notFound("Job not found");
    }
    assertEmployerJobAccess(dbUser, job);

    const [company, category] = await Promise.all([
      db.select().from(companies).where(eq(companies.id, job.companyId)).then((rows) => rows[0]),
      db.select().from(categories).where(eq(categories.id, job.categoryId)).then((rows) => rows[0]),
    ]);

    const sections = job.description.split(/\n\n+/);
    const description = sections.find((section) => !section.startsWith("Responsibilities:") && !section.startsWith("Requirements:")) || job.description;
    const responsibilities = sections.find((section) => section.startsWith("Responsibilities:"))?.replace(/^Responsibilities:\n?/, "") || "";
    const requirements = sections.find((section) => section.startsWith("Requirements:"))?.replace(/^Requirements:\n?/, "") || "";

    res.json(employerJobDetailSchema.parse({
      id: String(job.id),
      companyId: job.companyId,
      categoryId: job.categoryId,
      status: toSummaryStatus(job.status),
      createdAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
      title: job.title,
      category: category?.slug || "general",
      jobType: job.jobType,
      location: job.location === "Remote" ? "" : job.location,
      isRemote: /remote/i.test(job.workMode),
      applicationDeadline: null,
      salaryMin: "",
      salaryMax: "",
      isSalaryNegotiable: job.salary?.toLowerCase().includes("negotiable") ?? false,
      description,
      responsibilities,
      requirements,
      companyName: company?.name || "",
      companyLogo: company?.logo || null,
      companyBio: "",
      contactName: dbUser.name || "",
      contactEmail: dbUser.email || "",
      contactPhone: dbUser.phoneNumber || "",
      website: "",
      howToApply: "email",
      applicationEmail: dbUser.email || "",
      applicationUrl: "",
      customInstructions: "",
      isConfidential: false,
      isDraft: job.status === "draft",
      screenerQuestions: [],
    }));
  } catch (error) {
    next(error);
  }
});

router.post("/jobs", async (req, res, next) => {
  try {
    const authUser = (req as any).user;
    const dbUser = await resolveAuthenticatedDatabaseUser(authUser);
    assertRole(dbUser, ["admin", "employer"]);

    const payload = employerJobCreateSchema.parse(req.body);
    const [company, category] = await Promise.all([
      findOrCreateCompany(payload),
      findOrCreateCategory(payload),
    ]);

    const [job] = await db.insert(jobs).values({
      title: payload.title,
      description: composeDescription(payload),
      location: payload.isRemote ? "Remote" : payload.location,
      salary: composeSalary(payload),
      jobType: payload.jobType,
      workMode: payload.isRemote ? "Remote" : "On-site",
      companyId: company.id,
      categoryId: category.id,
      createdByUserId: dbUser.id,
      status: payload.isDraft ? "draft" : "active",
      isFeatured: false,
    }).returning();

    res.status(201).json(mapJobForm(job, payload, company.id, category.id));
  } catch (error) {
    next(error);
  }
});

router.put("/jobs/:jobId", async (req, res, next) => {
  try {
    const authUser = (req as any).user;
    const dbUser = await resolveAuthenticatedDatabaseUser(authUser);
    assertRole(dbUser, ["admin", "employer"]);

    const jobId = Number(req.params.jobId);
    if (Number.isNaN(jobId)) {
      throw Errors.validation("Invalid job ID");
    }

    const payload = employerJobUpdateSchema.parse(req.body);
    const [existingJob] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (!existingJob) {
      throw Errors.notFound("Job not found");
    }
    assertEmployerJobAccess(dbUser, existingJob);

    const [company, category] = await Promise.all([
      findOrCreateCompany(payload),
      findOrCreateCategory(payload),
    ]);

    const nextStatus = payload.isDraft
      ? "draft"
      : existingJob.status === "draft"
        ? "active"
        : existingJob.status;

    const [updatedJob] = await db.update(jobs).set({
      title: payload.title,
      description: composeDescription(payload),
      location: payload.isRemote ? "Remote" : payload.location,
      salary: composeSalary(payload),
      jobType: payload.jobType,
      workMode: payload.isRemote ? "Remote" : "On-site",
      companyId: company.id,
      categoryId: category.id,
      status: nextStatus,
    }).where(eq(jobs.id, jobId)).returning();

    res.json(mapJobForm(updatedJob, payload, company.id, category.id));
  } catch (error) {
    next(error);
  }
});

router.patch("/jobs/:jobId/status", async (req, res, next) => {
  try {
    const authUser = (req as any).user;
    const dbUser = await resolveAuthenticatedDatabaseUser(authUser);
    assertRole(dbUser, ["admin", "employer"]);

    const jobId = Number(req.params.jobId);
    if (Number.isNaN(jobId)) {
      throw Errors.validation("Invalid job ID");
    }

    const status = employerJobStatusSchema.parse(req.body?.status);
    const [existingJob] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (!existingJob) {
      throw Errors.notFound("Job not found");
    }
    assertEmployerJobAccess(dbUser, existingJob);
    const [updatedJob] = await db.update(jobs).set({ status }).where(eq(jobs.id, jobId)).returning();
    if (!updatedJob) {
      throw Errors.notFound("Job not found");
    }

    res.json({ success: true, jobId: String(updatedJob.id), status });
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
    const scopedJobRows = scopeEmployerJobs(dbUser, jobRows);
    const scopedJobIds = new Set(scopedJobRows.map((job) => job.id));
    const scopedApplicationRows = applicationRows.filter((application) => scopedJobIds.has(application.jobId));

    const userMap = new Map<number, any>((userRows as any[]).map((user) => [user.id, user]));
    const jobMap = new Map<number, any>((jobRows as any[]).map((job) => [job.id, job]));

    res.json(
      scopedApplicationRows.slice(0, 25).map((application) => {
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
