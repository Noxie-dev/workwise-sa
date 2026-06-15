import { Router } from 'express';
import { desc, eq } from 'drizzle-orm';
import {
  categories,
  companies,
  jobApplications,
  jobs,
  userInteractions,
  users,
} from '@shared/schema';
import {
  employerApplicationSummarySchema,
  employerDashboardSchema,
  employerJobDetailSchema,
  employerJobFormSchema,
  employerJobSummarySchema,
  employerJobStatusSchema,
  type EmployerJobForm,
  type EmployerJobStatus,
} from '@shared/platform-contracts';
import type { User } from '@shared/schema';
import { db } from '../db';
import { verifyFirebaseToken } from '../middleware/auth';
import { Errors } from '../middleware/errorHandler';
import { assertRole, resolveAuthenticatedDatabaseUser } from '../services/authenticatedUser';

const router = Router();

const employerJobCreateSchema = employerJobFormSchema;
const employerJobUpdateSchema = employerJobFormSchema;
type EmployerJobRow = typeof jobs.$inferSelect;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function titleFromSlug(value: string) {
  return value
    .split('-')
    .filter(Boolean)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function composeSalary(payload: EmployerJobForm) {
  if (!payload.salaryMin && !payload.salaryMax) {
    return payload.isSalaryNegotiable ? 'Negotiable' : null;
  }

  if (payload.salaryMin && payload.salaryMax) {
    return `R${payload.salaryMin} - R${payload.salaryMax}${payload.isSalaryNegotiable ? ' (Negotiable)' : ''}`;
  }

  if (payload.salaryMin) {
    return `From R${payload.salaryMin}${payload.isSalaryNegotiable ? ' (Negotiable)' : ''}`;
  }

  return `Up to R${payload.salaryMax}${payload.isSalaryNegotiable ? ' (Negotiable)' : ''}`;
}

function composeDescription(payload: EmployerJobForm) {
  return [
    payload.description.trim(),
    payload.responsibilities.trim() ? `Responsibilities:\n${payload.responsibilities.trim()}` : '',
    payload.requirements.trim() ? `Requirements:\n${payload.requirements.trim()}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

function isAdmin(user: Pick<User, 'role'>) {
  return user.role === 'admin';
}

function scopeJobsToUser(jobRows: EmployerJobRow[], user: User): EmployerJobRow[] {
  return isAdmin(user) ? jobRows : jobRows.filter(job => job.ownerUserId === user.id);
}

function assertCanManageJob(job: EmployerJobRow, user: User) {
  if (!isAdmin(user) && job.ownerUserId !== user.id) {
    throw Errors.forbidden('You do not have permission to manage this job');
  }
}

function getDateRangeStart(dateRange: unknown) {
  const now = new Date();
  const value = typeof dateRange === 'string' ? dateRange : '30d';
  const daysByRange: Record<string, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365,
  };
  const days = daysByRange[value] ?? daysByRange['30d'];
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function isOnOrAfter(dateLike: Date | string | null | undefined, start: Date) {
  if (!dateLike) {
    return false;
  }

  return new Date(dateLike).getTime() >= start.getTime();
}

function applyStatusFilter<T extends { status?: string | null }>(rows: T[], status: string) {
  return status === 'all' ? rows : rows.filter(row => row.status === status);
}

function parsePostingMetadata(value: unknown): Partial<EmployerJobForm> {
  if (!value) {
    return {};
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }

  if (typeof value === 'object') {
    return value as Partial<EmployerJobForm>;
  }

  return {};
}

function composePostingMetadata(payload: EmployerJobForm) {
  return {
    applicationDeadline: payload.applicationDeadline || null,
    companyBio: payload.companyBio,
    contactName: payload.contactName,
    contactEmail: payload.contactEmail,
    contactPhone: payload.contactPhone,
    website: payload.website,
    howToApply: payload.howToApply,
    applicationEmail: payload.applicationEmail,
    applicationUrl: payload.applicationUrl,
    customInstructions: payload.customInstructions,
    isConfidential: payload.isConfidential,
    screenerQuestions: payload.screenerQuestions,
  };
}

async function findOrCreateCompany(payload: EmployerJobForm) {
  const companySlug = slugify(payload.companyName) || 'company';
  const [existingCompany] = await db
    .select()
    .from(companies)
    .where(eq(companies.slug, companySlug))
    .limit(1);
  if (existingCompany) {
    return existingCompany;
  }

  const [createdCompany] = await db
    .insert(companies)
    .values({
      name: payload.companyName,
      logo: typeof payload.companyLogo === 'string' ? payload.companyLogo : null,
      location: payload.location || null,
      slug: companySlug,
      openPositions: 0,
    })
    .returning();

  return createdCompany;
}

async function findOrCreateCategory(payload: EmployerJobForm) {
  const categorySlug = slugify(payload.category) || 'general';
  const [existingCategory] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, categorySlug))
    .limit(1);
  if (existingCategory) {
    return existingCategory;
  }

  const [createdCategory] = await db
    .insert(categories)
    .values({
      name: titleFromSlug(categorySlug),
      icon: 'briefcase',
      slug: categorySlug,
      jobCount: 0,
    })
    .returning();

  return createdCategory;
}

function mapJobForm(
  job: typeof jobs.$inferSelect,
  payload: EmployerJobForm,
  companyId: number,
  categoryId: number
) {
  return employerJobDetailSchema.parse({
    id: String(job.id),
    companyId,
    categoryId,
    ownerUserId: job.ownerUserId ?? null,
    status: job.status as EmployerJobStatus,
    createdAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
    ...payload,
    companyLogo: payload.companyLogo ?? null,
  });
}

function toSummaryStatus(value: string | null | undefined): EmployerJobStatus {
  return employerJobStatusSchema.parse(value || 'active');
}

function toRelativeTime(dateLike: Date | string | null | undefined) {
  if (!dateLike) {
    return 'just now';
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

router.get('/dashboard', async (req, res, next) => {
  try {
    const authUser = (req as any).user;
    const dbUser = await resolveAuthenticatedDatabaseUser(authUser);
    assertRole(dbUser, ['admin', 'employer']);

    const statusFilter = String(req.query.status || 'all');
    const dateRangeStart = getDateRangeStart(req.query.dateRange);
    const [allJobRows, allApplicationRows, allInteractionRows] = await Promise.all([
      db.select().from(jobs).orderBy(desc(jobs.createdAt)),
      db.select().from(jobApplications).orderBy(desc(jobApplications.appliedAt)),
      db.select().from(userInteractions).orderBy(desc(userInteractions.interactionTime)),
    ]);
    const scopedJobs = scopeJobsToUser(allJobRows, dbUser);
    const dateFilteredJobs = scopedJobs.filter(job => isOnOrAfter(job.createdAt, dateRangeStart));
    const filteredJobs = applyStatusFilter(dateFilteredJobs, statusFilter);
    const filteredJobIds = new Set(filteredJobs.map(job => job.id));
    const applicationRows = allApplicationRows.filter(
      application =>
        filteredJobIds.has(application.jobId) && isOnOrAfter(application.appliedAt, dateRangeStart)
    );
    const interactionRows = allInteractionRows.filter(
      interaction =>
        interaction.jobId !== null &&
        filteredJobIds.has(interaction.jobId) &&
        isOnOrAfter(interaction.interactionTime, dateRangeStart)
    );

    const applicationTrend = new Map<string, number>();
    applicationRows.forEach(application => {
      const key = new Date(application.appliedAt).toISOString().slice(0, 10);
      applicationTrend.set(key, (applicationTrend.get(key) || 0) + 1);
    });

    const jobPerformance = filteredJobs.slice(0, 8).map(job => ({
      jobTitle: job.title,
      views: interactionRows.filter(
        interaction => interaction.jobId === job.id && interaction.interactionType === 'view'
      ).length,
      applications: applicationRows.filter(application => application.jobId === job.id).length,
    }));

    const recentActivity = applicationRows.slice(0, 5).map(application => ({
      title: 'New Application',
      description: `Application ${application.id} received for job ${application.jobId}`,
      timestamp: toRelativeTime(application.appliedAt),
    }));

    const activeJobs = filteredJobs.filter(job => job.status === 'active').length;

    res.json(
      employerDashboardSchema.parse({
        scope: isAdmin(dbUser) ? 'platform' : 'employer',
        stats: {
          totalJobs: filteredJobs.length,
          activeJobs,
          totalApplications: applicationRows.length,
          totalViews: interactionRows.filter(interaction => interaction.interactionType === 'view')
            .length,
        },
        charts: {
          applications: Array.from(applicationTrend.entries())
            .map(([date, applications]) => ({ date, applications }))
            .sort((a, b) => a.date.localeCompare(b.date)),
          jobPerformance,
        },
        recentActivity,
      })
    );
  } catch (error) {
    next(error);
  }
});

router.get('/jobs', async (req, res, next) => {
  try {
    const authUser = (req as any).user;
    const dbUser = await resolveAuthenticatedDatabaseUser(authUser);
    assertRole(dbUser, ['admin', 'employer']);

    const statusFilter = String(req.query.status || 'all');
    const [allJobRows, companyRows, applicationRows, interactionRows] = await Promise.all([
      db.select().from(jobs).orderBy(desc(jobs.createdAt)),
      db.select().from(companies),
      db.select().from(jobApplications),
      db.select().from(userInteractions),
    ]);
    const jobRows = applyStatusFilter(scopeJobsToUser(allJobRows, dbUser), statusFilter);

    const companyMap = new Map<number, any>(
      (companyRows as any[]).map(company => [company.id, company])
    );
    const enrichedJobs = jobRows.map(job => ({
      id: String(job.id),
      title: job.title,
      location: job.location,
      type: job.jobType,
      company: companyMap.get(job.companyId)?.name || 'Unknown company',
      ownerUserId: job.ownerUserId ?? null,
      applications: applicationRows.filter(application => application.jobId === job.id).length,
      views: interactionRows.filter(
        interaction => interaction.jobId === job.id && interaction.interactionType === 'view'
      ).length,
      postedDate: job.createdAt ? new Date(job.createdAt).toISOString().slice(0, 10) : '',
      status: toSummaryStatus(job.status),
    }));

    res.json(enrichedJobs.map(item => employerJobSummarySchema.parse(item)));
  } catch (error) {
    next(error);
  }
});

router.get('/jobs/:jobId', async (req, res, next) => {
  try {
    const authUser = (req as any).user;
    const dbUser = await resolveAuthenticatedDatabaseUser(authUser);
    assertRole(dbUser, ['admin', 'employer']);

    const jobId = Number(req.params.jobId);
    if (Number.isNaN(jobId)) {
      throw Errors.validation('Invalid job ID');
    }

    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (!job) {
      throw Errors.notFound('Job not found');
    }
    assertCanManageJob(job, dbUser);

    const [company, category] = await Promise.all([
      db
        .select()
        .from(companies)
        .where(eq(companies.id, job.companyId))
        .then(rows => rows[0]),
      db
        .select()
        .from(categories)
        .where(eq(categories.id, job.categoryId))
        .then(rows => rows[0]),
    ]);

    const sections = job.description.split(/\n\n+/);
    const description =
      sections.find(
        section => !section.startsWith('Responsibilities:') && !section.startsWith('Requirements:')
      ) || job.description;
    const responsibilities =
      sections
        .find(section => section.startsWith('Responsibilities:'))
        ?.replace(/^Responsibilities:\n?/, '') || '';
    const requirements =
      sections
        .find(section => section.startsWith('Requirements:'))
        ?.replace(/^Requirements:\n?/, '') || '';
    const postingMetadata = parsePostingMetadata(job.employerPostingMetadata);

    res.json(
      employerJobDetailSchema.parse({
        id: String(job.id),
        companyId: job.companyId,
        categoryId: job.categoryId,
        ownerUserId: job.ownerUserId ?? null,
        status: toSummaryStatus(job.status),
        createdAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
        title: job.title,
        category: category?.slug || 'general',
        jobType: job.jobType,
        location: job.location === 'Remote' ? '' : job.location,
        isRemote: /remote/i.test(job.workMode),
        applicationDeadline: postingMetadata.applicationDeadline ?? null,
        salaryMin: '',
        salaryMax: '',
        isSalaryNegotiable: job.salary?.toLowerCase().includes('negotiable') ?? false,
        description,
        responsibilities,
        requirements,
        companyName: company?.name || '',
        companyLogo: company?.logo || null,
        companyBio: postingMetadata.companyBio ?? '',
        contactName: postingMetadata.contactName ?? dbUser.name ?? '',
        contactEmail: postingMetadata.contactEmail ?? dbUser.email ?? '',
        contactPhone: postingMetadata.contactPhone ?? dbUser.phoneNumber ?? '',
        website: postingMetadata.website ?? '',
        howToApply: postingMetadata.howToApply ?? 'email',
        applicationEmail: postingMetadata.applicationEmail ?? dbUser.email ?? '',
        applicationUrl: postingMetadata.applicationUrl ?? '',
        customInstructions: postingMetadata.customInstructions ?? '',
        isConfidential: postingMetadata.isConfidential ?? false,
        isDraft: job.status === 'draft',
        screenerQuestions: postingMetadata.screenerQuestions ?? [],
      })
    );
  } catch (error) {
    next(error);
  }
});

router.post('/jobs', async (req, res, next) => {
  try {
    const authUser = (req as any).user;
    const dbUser = await resolveAuthenticatedDatabaseUser(authUser);
    assertRole(dbUser, ['admin', 'employer']);

    const payload = employerJobCreateSchema.parse(req.body);
    const [company, category] = await Promise.all([
      findOrCreateCompany(payload),
      findOrCreateCategory(payload),
    ]);

    const [job] = await db
      .insert(jobs)
      .values({
        title: payload.title,
        description: composeDescription(payload),
        location: payload.isRemote ? 'Remote' : payload.location,
        salary: composeSalary(payload),
        jobType: payload.jobType,
        workMode: payload.isRemote ? 'Remote' : 'On-site',
        companyId: company.id,
        categoryId: category.id,
        ownerUserId: dbUser.id,
        employerPostingMetadata: composePostingMetadata(payload),
        status: payload.isDraft ? 'draft' : 'active',
        isFeatured: false,
      })
      .returning();

    res.status(201).json(mapJobForm(job, payload, company.id, category.id));
  } catch (error) {
    next(error);
  }
});

router.put('/jobs/:jobId', async (req, res, next) => {
  try {
    const authUser = (req as any).user;
    const dbUser = await resolveAuthenticatedDatabaseUser(authUser);
    assertRole(dbUser, ['admin', 'employer']);

    const jobId = Number(req.params.jobId);
    if (Number.isNaN(jobId)) {
      throw Errors.validation('Invalid job ID');
    }

    const payload = employerJobUpdateSchema.parse(req.body);
    const [existingJob] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (!existingJob) {
      throw Errors.notFound('Job not found');
    }
    assertCanManageJob(existingJob, dbUser);

    const [company, category] = await Promise.all([
      findOrCreateCompany(payload),
      findOrCreateCategory(payload),
    ]);

    const nextStatus = payload.isDraft
      ? 'draft'
      : existingJob.status === 'draft'
        ? 'active'
        : existingJob.status;

    const [updatedJob] = await db
      .update(jobs)
      .set({
        title: payload.title,
        description: composeDescription(payload),
        location: payload.isRemote ? 'Remote' : payload.location,
        salary: composeSalary(payload),
        jobType: payload.jobType,
        workMode: payload.isRemote ? 'Remote' : 'On-site',
        companyId: company.id,
        categoryId: category.id,
        employerPostingMetadata: composePostingMetadata(payload),
        status: nextStatus,
      })
      .where(eq(jobs.id, jobId))
      .returning();

    res.json(mapJobForm(updatedJob, payload, company.id, category.id));
  } catch (error) {
    next(error);
  }
});

router.patch('/jobs/:jobId/status', async (req, res, next) => {
  try {
    const authUser = (req as any).user;
    const dbUser = await resolveAuthenticatedDatabaseUser(authUser);
    assertRole(dbUser, ['admin', 'employer']);

    const jobId = Number(req.params.jobId);
    if (Number.isNaN(jobId)) {
      throw Errors.validation('Invalid job ID');
    }

    const status = employerJobStatusSchema.parse(req.body?.status);
    const [existingJob] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (!existingJob) {
      throw Errors.notFound('Job not found');
    }
    assertCanManageJob(existingJob, dbUser);

    const [updatedJob] = await db
      .update(jobs)
      .set({ status })
      .where(eq(jobs.id, jobId))
      .returning();
    if (!updatedJob) {
      throw Errors.notFound('Job not found');
    }

    res.json({ success: true, jobId: String(updatedJob.id), status });
  } catch (error) {
    next(error);
  }
});

router.get('/applications', async (req, res, next) => {
  try {
    const authUser = (req as any).user;
    const dbUser = await resolveAuthenticatedDatabaseUser(authUser);
    assertRole(dbUser, ['admin', 'employer']);

    const statusFilter = String(req.query.status || 'all');
    const selectedJobId = req.query.jobId ? Number(req.query.jobId) : null;
    if (req.query.jobId && Number.isNaN(selectedJobId)) {
      throw Errors.validation('Invalid job ID');
    }

    const dateRangeStart = getDateRangeStart(req.query.dateRange);
    const [allApplicationRows, userRows, allJobRows] = await Promise.all([
      db.select().from(jobApplications).orderBy(desc(jobApplications.appliedAt)),
      db.select().from(users),
      db.select().from(jobs),
    ]);
    const scopedJobs = applyStatusFilter(scopeJobsToUser(allJobRows, dbUser), statusFilter);
    const scopedJobIds = new Set(scopedJobs.map(job => job.id));
    const applicationRows = allApplicationRows.filter(
      application =>
        scopedJobIds.has(application.jobId) &&
        (!selectedJobId || application.jobId === selectedJobId) &&
        isOnOrAfter(application.appliedAt, dateRangeStart)
    );

    const userMap = new Map<number, any>((userRows as any[]).map(user => [user.id, user]));
    const jobMap = new Map<number, any>((scopedJobs as any[]).map(job => [job.id, job]));

    res.json(
      applicationRows.slice(0, 25).map(application => {
        const applicant = userMap.get(application.userId);
        const job = jobMap.get(application.jobId);

        return employerApplicationSummarySchema.parse({
          id: String(application.id),
          applicantName: applicant?.name || 'Unknown applicant',
          applicantEmail: applicant?.email || '',
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
