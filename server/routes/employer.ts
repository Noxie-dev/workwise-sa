import { Router } from "express";
import { and, desc, eq, gte, inArray, isNull, lt, or } from "drizzle-orm";
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
import { createJuid, createPublicJobRef } from "../services/squarejump/identityService";

const router = Router();

const employerJobCreateSchema = employerJobFormSchema;
const employerJobUpdateSchema = employerJobFormSchema;

async function withTransaction<T>(callback: (transaction: any) => Promise<T>): Promise<T> {
  if (typeof db.transaction === "function") {
    return db.transaction(callback);
  }
  // Unit-test doubles may not implement Drizzle's transaction method.
  return callback(db);
}

async function fetchOrderedRows(table: any, condition: any, orderColumn: any) {
  const baseQuery: any = db.select().from(table);
  const filteredQuery = condition && typeof baseQuery.where === "function"
    ? baseQuery.where(condition)
    : baseQuery;
  // Keeps lightweight unit-test query doubles compatible while production uses
  // the filtered Drizzle query before ordering.
  return typeof filteredQuery.orderBy === "function"
    ? filteredQuery.orderBy(desc(orderColumn))
    : baseQuery.orderBy(desc(orderColumn));
}

const allowedJobStatusTransitions: Record<string, readonly string[]> = {
  draft: ["draft", "active"],
  active: ["active", "paused", "closed"],
  paused: ["paused", "active", "closed"],
  closed: ["closed", "archived"],
  archived: ["archived"],
};

function assertValidJobStatusTransition(current: string, next: string) {
  if (!allowedJobStatusTransitions[current]?.includes(next)) {
    throw Errors.conflict(`Invalid job status transition: ${current} -> ${next}`);
  }
}

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

async function findOrCreateCompany(payload: EmployerJobForm, transaction: any = db) {
  const companySlug = slugify(payload.companyName) || "company";
  const [existingCompany] = await transaction.select().from(companies).where(eq(companies.slug, companySlug)).limit(1);
  if (existingCompany) {
    if (!existingCompany.bio && payload.companyBio) {
      const [updatedCompany] = await transaction
        .update(companies)
        .set({ bio: payload.companyBio })
        .where(eq(companies.id, existingCompany.id))
        .returning();
      return updatedCompany || existingCompany;
    }
    return existingCompany;
  }

  const [createdCompany] = await transaction.insert(companies).values({
    name: payload.companyName,
    logo: typeof payload.companyLogo === "string" ? payload.companyLogo : null,
    bio: payload.companyBio || null,
    location: payload.location || null,
    slug: companySlug,
    openPositions: 0,
  }).returning();

  return createdCompany;
}

async function findOrCreateCategory(payload: EmployerJobForm, transaction: any = db) {
  const categorySlug = slugify(payload.category) || "general";
  const [existingCategory] = await transaction.select().from(categories).where(eq(categories.slug, categorySlug)).limit(1);
  if (existingCategory) {
    return existingCategory;
  }

  const [createdCategory] = await transaction.insert(categories).values({
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

    const statusFilter = String(req.query.status || "all");
    const dateRange = String(req.query.dateRange || "30d");
    const rangeMatch = dateRange.match(/^(\d+)d$/);
    const since = rangeMatch ? new Date(Date.now() - Number(rangeMatch[1]) * 24 * 60 * 60 * 1000) : null;

    const jobRows = await fetchOrderedRows(
      jobs,
      dbUser.role === "admin" ? null : eq(jobs.createdByUserId, dbUser.id),
      jobs.createdAt,
    );
    const ownedJobRows = scopeEmployerJobs(dbUser, jobRows);
    const scopedJobRows = statusFilter === "all"
      ? ownedJobRows
      : ownedJobRows.filter((job) => job.status === statusFilter);
    const scopedJobIds = new Set(scopedJobRows.map((job) => job.id));
    const scopedIds = Array.from(scopedJobIds) as number[];
    const [applicationRows, interactionRows] = scopedIds.length === 0
      ? [[], []]
      : await Promise.all([
          fetchOrderedRows(
            jobApplications,
            since ? and(inArray(jobApplications.jobId, scopedIds), gte(jobApplications.appliedAt, since)) : inArray(jobApplications.jobId, scopedIds),
            jobApplications.appliedAt,
          ),
          fetchOrderedRows(
            userInteractions,
            since
              ? and(or(isNull(userInteractions.jobId), inArray(userInteractions.jobId, scopedIds)), gte(userInteractions.interactionTime, since))
              : or(isNull(userInteractions.jobId), inArray(userInteractions.jobId, scopedIds)),
            userInteractions.interactionTime,
          ),
        ]);
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
    const requestedLimit = Number(req.query.limit);
    const hasCursorPaging = req.query.cursor !== undefined || Number.isFinite(requestedLimit);
    const pageSize = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 50;
    const cursor = req.query.cursor ? Number(req.query.cursor) : null;
    let pagedJobQuery: any = db.select().from(jobs);
    const pageConditions: any[] = [];
    if (dbUser.role !== "admin") {
      pageConditions.push(eq(jobs.createdByUserId, dbUser.id));
    }
    if (hasCursorPaging && statusFilter !== "all") {
      pageConditions.push(eq(jobs.status, statusFilter));
    }
    if (cursor !== null && Number.isInteger(cursor) && cursor > 0) {
      pageConditions.push(lt(jobs.id, cursor));
    }
    if (pageConditions.length > 0) {
      pagedJobQuery = pagedJobQuery.where(and(...pageConditions));
    }
    const jobRowsPromise = hasCursorPaging
      ? pagedJobQuery.orderBy(desc(jobs.id)).limit(pageSize + 1)
      : db.select().from(jobs).orderBy(desc(jobs.createdAt));
    const [rawJobRows, companyRows, applicationRows, interactionRows] = await Promise.all([
      jobRowsPromise,
      db.select().from(companies),
      db.select().from(jobApplications),
      db.select().from(userInteractions),
    ]);
    const hasNextPage = hasCursorPaging && rawJobRows.length > pageSize;
    const jobRows = hasCursorPaging ? rawJobRows.slice(0, pageSize) : rawJobRows;
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

    if (hasCursorPaging && hasNextPage && typeof res.setHeader === "function") {
      res.setHeader("X-Next-Cursor", String(jobRows[jobRows.length - 1]?.id || ""));
    }
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
      applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline).toISOString().slice(0, 10) : null,
      salaryMin: job.salary?.match(/From R([\d.]+)/)?.[1] || job.salary?.match(/R([\d.]+)\s*-/)?.[1] || "",
      salaryMax: job.salary?.match(/Up to R([\d.]+)/)?.[1] || job.salary?.match(/- R([\d.]+)/)?.[1] || "",
      isSalaryNegotiable: job.salary?.toLowerCase().includes("negotiable") ?? false,
      description,
      responsibilities,
      requirements,
      companyName: company?.name || "",
      companyLogo: company?.logo || null,
      companyBio: company?.bio || "",
      contactName: job.contactName || dbUser.name || "",
      contactEmail: job.contactEmail || dbUser.email || "",
      contactPhone: job.contactPhone || dbUser.phoneNumber || "",
      website: job.website || "",
      howToApply: job.howToApply || "email",
      applicationEmail: job.applicationEmail || "",
      applicationUrl: job.applicationUrl || "",
      customInstructions: job.customInstructions || "",
      isConfidential: job.isConfidential,
      isDraft: job.status === "draft",
      screenerQuestions: Array.isArray(job.screenerQuestions) ? job.screenerQuestions : [],
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
    const result = await withTransaction(async (transaction: any) => {
      const company = await findOrCreateCompany(payload, transaction);
      const category = await findOrCreateCategory(payload, transaction);
      const [job] = await transaction.insert(jobs).values({
        juid: createJuid(),
        publicJobRef: createPublicJobRef({ categoryCode: payload.category }),
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
        applicationDeadline: payload.applicationDeadline ? new Date(payload.applicationDeadline) : null,
        contactName: payload.contactName,
        contactEmail: payload.contactEmail,
        contactPhone: payload.contactPhone || null,
        website: payload.website || null,
        howToApply: payload.howToApply,
        applicationEmail: payload.applicationEmail || null,
        applicationUrl: payload.applicationUrl || null,
        customInstructions: payload.customInstructions || null,
        isConfidential: payload.isConfidential,
        screenerQuestions: payload.screenerQuestions,
      }).returning();
      return mapJobForm(job, payload, company.id, category.id);
    });

    res.status(201).json(result);
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

    const nextStatus = payload.isDraft
      ? "draft"
      : existingJob.status === "draft"
        ? "active"
        : existingJob.status;
    assertValidJobStatusTransition(existingJob.status, nextStatus);

    const result = await withTransaction(async (transaction: any) => {
      const company = await findOrCreateCompany(payload, transaction);
      const category = await findOrCreateCategory(payload, transaction);
      const [updatedJob] = await transaction.update(jobs).set({
        title: payload.title,
        description: composeDescription(payload),
        location: payload.isRemote ? "Remote" : payload.location,
        salary: composeSalary(payload),
        jobType: payload.jobType,
        workMode: payload.isRemote ? "Remote" : "On-site",
        companyId: company.id,
        categoryId: category.id,
        status: nextStatus,
        applicationDeadline: payload.applicationDeadline ? new Date(payload.applicationDeadline) : null,
        contactName: payload.contactName,
        contactEmail: payload.contactEmail,
        contactPhone: payload.contactPhone || null,
        website: payload.website || null,
        howToApply: payload.howToApply,
        applicationEmail: payload.applicationEmail || null,
        applicationUrl: payload.applicationUrl || null,
        customInstructions: payload.customInstructions || null,
        isConfidential: payload.isConfidential,
        screenerQuestions: payload.screenerQuestions,
      }).where(eq(jobs.id, jobId)).returning();
      return mapJobForm(updatedJob, payload, company.id, category.id);
    });

    res.json(result);
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
    assertValidJobStatusTransition(existingJob.status, status);
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
