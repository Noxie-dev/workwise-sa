import type { Express } from 'express';
import { z } from 'zod';
import { insertUserSchema } from '@shared/schema';
import { storage } from '../storage';
import { validate } from '../middleware/validation';
import { Errors } from '../middleware/errorHandler';
import { verifyFirebaseToken } from '../middleware/auth';
import { resolveAuthenticatedDatabaseUser } from '../services/authenticatedUser';
import { auth } from '../firebase';
import { getJobPreviewMatches } from '../services/jobMatchingService';

const getCategorySchema = z.object({ params: z.object({ slug: z.string() }) });
const getCompanySchema = z.object({ params: z.object({ slug: z.string() }) });
const searchJobsSchema = z.object({ query: z.object({ q: z.string() }) });
const getJobsByCompanySchema = z.object({ params: z.object({ id: z.string().regex(/^\d+$/) }) });
const getJobsByCategorySchema = z.object({ params: z.object({ id: z.string().regex(/^\d+$/) }) });
const getJobSchema = z.object({ params: z.object({ id: z.string().regex(/^\d+$/) }) });
const numericQuery = z
  .union([z.string(), z.number()])
  .optional()
  .transform(value => {
    if (value === undefined || value === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  });
const booleanQuery = z
  .union([z.string(), z.boolean()])
  .optional()
  .transform(value => value === true || value === 'true');
const jobPreviewsSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    query: z.string().optional(),
    categoryId: numericQuery,
    location: z.string().optional(),
    jobType: z.string().optional(),
    workMode: z.string().optional(),
    experienceLevel: z.enum(['entry', 'mid', 'senior']).optional(),
    page: numericQuery,
    limit: numericQuery,
    featured: booleanQuery,
    minSalary: numericQuery,
    sort: z.enum(['relevance', 'newest']).optional(),
    personalized: booleanQuery,
    includeRemote: booleanQuery,
  }),
});
const applyForJobSchema = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/) }),
  body: z.object({
    coverLetter: z.string().optional(),
    resumeUrl: z.url().optional(),
    notes: z.string().optional(),
  }),
});

async function resolveOptionalAuthenticatedUser(req: any) {
  const header = req.headers.authorization || '';
  const token = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return undefined;

  try {
    const decodedToken = await auth.verifyIdToken(token);
    return await resolveAuthenticatedDatabaseUser({
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      role: typeof decodedToken.role === 'string' ? decodedToken.role : undefined,
    });
  } catch (error) {
    console.warn('Ignoring invalid optional job preview auth token:', (error as Error).message);
    return undefined;
  }
}

const toOptionalNumber = (value: unknown) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toOptionalBoolean = (value: unknown) => {
  if (value === undefined || value === null || value === '') return undefined;
  return value === true || value === 'true';
};

export function registerPublicApiRoutes(app: Express) {
  app.get('/api/categories', async (_req, res, next) => {
    try {
      res.json(await storage.getCategories());
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/categories/:slug', validate(getCategorySchema), async (req, res, next) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        throw Errors.notFound('Category not found');
      }
      res.json(category);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/companies', async (_req, res, next) => {
    try {
      res.json(await storage.getCompanies());
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/companies/:slug', validate(getCompanySchema), async (req, res, next) => {
    try {
      const company = await storage.getCompanyBySlug(req.params.slug);
      if (!company) {
        throw Errors.notFound('Company not found');
      }
      res.json(company);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/jobs', async (_req, res, next) => {
    try {
      const jobs = await storage.getJobsWithCompanies();
      res.json(jobs.filter(job => job.status === 'active'));
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/jobs/featured', async (_req, res, next) => {
    try {
      const jobs = await storage.getFeaturedJobs();
      res.json(jobs.filter(job => job.status === 'active'));
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/job-previews', validate(jobPreviewsSchema), async (req, res, next) => {
    try {
      const dbUser = await resolveOptionalAuthenticatedUser(req);
      const query = req.query as Record<string, any>;
      const response = await getJobPreviewMatches(
        {
          query: query.query || query.q || undefined,
          categoryId: toOptionalNumber(query.categoryId),
          location: query.location || undefined,
          jobType: query.jobType || undefined,
          workMode: query.workMode || undefined,
          experienceLevel: query.experienceLevel || undefined,
          page: toOptionalNumber(query.page) || 1,
          limit: toOptionalNumber(query.limit) || 20,
          featured: toOptionalBoolean(query.featured),
          minSalary: toOptionalNumber(query.minSalary),
          sort: query.sort,
          personalized: toOptionalBoolean(query.personalized),
          includeRemote: toOptionalBoolean(query.includeRemote),
        },
        dbUser
      );

      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/jobs/search', validate(searchJobsSchema), async (req, res, next) => {
    try {
      const query = (req.query.q as string) || '';
      const jobs = await storage.searchJobs(query);
      res.json(jobs.filter(job => job.status === 'active'));
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/jobs/company/:id', validate(getJobsByCompanySchema), async (req, res, next) => {
    try {
      const companyId = parseInt(req.params.id, 10);
      if (Number.isNaN(companyId)) {
        throw Errors.validation('Invalid company ID');
      }
      const jobs = await storage.getJobsByCompany(companyId);
      res.json(jobs.filter(job => job.status === 'active'));
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/jobs/category/:id', validate(getJobsByCategorySchema), async (req, res, next) => {
    try {
      const categoryId = parseInt(req.params.id, 10);
      if (Number.isNaN(categoryId)) {
        throw Errors.validation('Invalid category ID');
      }
      const jobs = await storage.getJobsByCategory(categoryId);
      res.json(jobs.filter(job => job.status === 'active'));
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/jobs/:id', validate(getJobSchema), async (req, res, next) => {
    try {
      const jobId = parseInt(req.params.id, 10);
      if (Number.isNaN(jobId)) {
        throw Errors.validation('Invalid job ID');
      }

      const job = await storage.getJob(jobId);
      if (!job) {
        throw Errors.notFound('Job not found');
      }
      if (job.status !== 'active') {
        throw Errors.notFound('Job not found');
      }

      const company = await storage.getCompany(job.companyId);
      if (!company) {
        throw Errors.notFound('Company not found');
      }

      const category = await storage.getCategory(job.categoryId);
      const descriptionSegments = job.description
        .split(/\r?\n|\. /)
        .map(segment => segment.trim())
        .filter(Boolean);

      res.json({
        id: job.id,
        title: job.title,
        location: job.location,
        jobType: job.jobType,
        workMode: job.workMode,
        category: {
          id: category?.id ?? job.categoryId,
          name: category?.name ?? 'General',
        },
        company: {
          id: company.id,
          name: company.name,
          location: company.location,
          logo: company.logo,
        },
        shortDescription:
          job.description.length > 140 ? `${job.description.slice(0, 137)}...` : job.description,
        tags: [category?.name, job.jobType, job.workMode].filter(Boolean),
        postedDate: job.createdAt,
        isRemote: /remote/i.test(job.workMode),
        experienceLevel: /senior|manager|lead/i.test(job.title)
          ? 'senior'
          : /junior|entry|assistant|intern/i.test(job.title)
            ? 'entry'
            : 'mid',
        featured: Boolean(job.isFeatured),
        details: {
          id: job.id,
          fullDescription: job.description,
          requirements: descriptionSegments.slice(0, 3).length
            ? descriptionSegments.slice(0, 3)
            : ['Relevant experience', 'Strong communication skills', 'Reliable work ethic'],
          responsibilities: descriptionSegments.slice(3, 6).length
            ? descriptionSegments.slice(3, 6)
            : [
                'Perform role-specific responsibilities',
                'Collaborate with the team',
                'Deliver consistent results',
              ],
          benefits: [
            'Market-related salary',
            'Growth opportunities',
            'Supportive team environment',
          ],
          applicationInstructions:
            'Submit your application through WorkWise SA with your latest CV and any supporting notes.',
          companyDetails: {
            about: `${company.name} is hiring in ${company.location || job.location}.`,
            industry: category?.name ?? 'General',
          },
          salaryDetails: job.salary
            ? {
                currency: 'ZAR',
                negotiable: true,
                displayText: job.salary,
              }
            : undefined,
          createdAt: job.createdAt,
          updatedAt: job.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  app.post(
    '/api/jobs/:id/apply',
    verifyFirebaseToken,
    validate(applyForJobSchema),
    async (req, res, next) => {
      try {
        const jobId = parseInt(req.params.id, 10);
        const { coverLetter, resumeUrl, notes } = req.body;
        const authUser = (req as any).user;

        if (Number.isNaN(jobId)) {
          throw Errors.validation('Invalid job ID');
        }

        const job = await storage.getJob(jobId);
        if (!job) {
          throw Errors.notFound('Job not found');
        }
        if (job.status !== 'active') {
          throw Errors.notFound('Job not available for applications');
        }

        const dbUser = await resolveAuthenticatedDatabaseUser(authUser);
        const userId = dbUser.id;
        const existingApplication = await storage.getJobApplicationByUserAndJob(userId, jobId);
        if (existingApplication) {
          throw Errors.conflict('You have already applied for this job');
        }

        const application = await storage.createJobApplication({
          userId,
          jobId,
          coverLetter,
          resumeUrl,
          notes,
          status: 'applied',
        });

        await storage.createUserInteraction({
          userId,
          interactionType: 'apply',
          jobId,
          interactionTime: new Date(),
          metadata: { applicationId: application.id },
        });

        res.status(201).json({
          success: true,
          message: 'Job application submitted successfully',
          application,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  app.post(
    '/api/users/register',
    validate(z.object({ body: insertUserSchema })),
    async (req, res, next) => {
      try {
        const userData = req.body;
        const existingUser = await storage.getUserByUsername(userData.username);
        if (existingUser) {
          throw Errors.conflict('Username already exists');
        }

        const newUser = await storage.createUser(userData);
        const { password, ...userWithoutPassword } = newUser;
        res.status(201).json(userWithoutPassword);
      } catch (error) {
        next(error);
      }
    }
  );
}
