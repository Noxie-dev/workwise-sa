import type { Express } from "express";
import { z } from "zod";
import { insertUserSchema, type Category, type Company } from "@shared/schema";
import { storage } from "../storage";
import { validate } from "../middleware/validation";
import { ApiError, ErrorType, Errors } from "../middleware/errorHandler";
import { verifyFirebaseToken } from "../middleware/auth";
import { resolveAuthenticatedDatabaseUser } from "../services/authenticatedUser";

const getCategorySchema = z.object({ params: z.object({ slug: z.string() }) });
const getCompanySchema = z.object({ params: z.object({ slug: z.string() }) });
const searchJobsSchema = z.object({ query: z.object({ q: z.string() }) });
const getJobsByCompanySchema = z.object({ params: z.object({ id: z.string().regex(/^\d+$/) }) });
const getJobsByCategorySchema = z.object({ params: z.object({ id: z.string().regex(/^\d+$/) }) });
const getJobSchema = z.object({ params: z.object({ id: z.string().regex(/^\d+$/) }) });
const applyForJobSchema = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/) }),
  body: z.object({
    coverLetter: z.string().optional(),
    resumeUrl: z.url().optional(),
    notes: z.string().optional(),
  }),
});

const DEV_FALLBACK_CATEGORIES: Category[] = [
  { id: 1, name: "General Worker", icon: "user", slug: "general-worker", jobCount: 245 },
  { id: 2, name: "Construction Worker", icon: "hammer", slug: "construction-worker", jobCount: 178 },
  { id: 3, name: "Picker / Packer", icon: "package", slug: "picker-packer", jobCount: 132 },
  { id: 4, name: "Warehouse Assistant", icon: "warehouse", slug: "warehouse-assistant", jobCount: 98 },
  { id: 5, name: "Cashier", icon: "credit-card", slug: "cashier", jobCount: 167 },
  { id: 6, name: "Cleaner", icon: "sparkles", slug: "cleaner", jobCount: 203 },
  { id: 7, name: "Security Guard", icon: "shield", slug: "security-guard", jobCount: 145 },
  { id: 8, name: "Admin Clerk", icon: "file-text", slug: "admin-clerk", jobCount: 112 },
];

const DEV_FALLBACK_COMPANIES: Company[] = [
  { id: 1, name: "TechSA", logo: "https://via.placeholder.com/150", location: "Cape Town, Western Cape", slug: "techsa", openPositions: 12 },
  { id: 2, name: "Invest Group SA", logo: "https://via.placeholder.com/150", location: "Johannesburg, Gauteng", slug: "invest-group-sa", openPositions: 8 },
  { id: 3, name: "EcoEnergy", logo: "https://via.placeholder.com/150", location: "Durban, KwaZulu-Natal", slug: "ecoenergy", openPositions: 6 },
  { id: 4, name: "GrowSA", logo: "https://via.placeholder.com/150", location: "Pretoria, Gauteng", slug: "growsa", openPositions: 5 },
  { id: 5, name: "HealthPlus", logo: "https://via.placeholder.com/150", location: "Johannesburg, Gauteng", slug: "healthplus", openPositions: 14 },
];

const isDatabaseUnavailableError = (error: unknown): boolean => {
  const err = error as any;
  const codes = [
    err?.code,
    err?.cause?.code,
    err?.details?.code,
    err?.details?.cause?.code,
  ].filter(Boolean);

  if (codes.includes("ECONNREFUSED")) {
    return true;
  }

  const message = String(err?.message || "");
  if (/ECONNREFUSED|connect.*5432|Failed query/i.test(message)) {
    return true;
  }

  return err instanceof ApiError && err.type === ErrorType.DATABASE;
};

const tryRespondWithDevMock = (
  routeLabel: string,
  error: unknown,
  res: any,
  payload: unknown,
): boolean => {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  if (!isDatabaseUnavailableError(error)) {
    return false;
  }

  console.warn(`[dev-mock] ${routeLabel}: database unavailable, returning mock data`);
  res.setHeader("X-Workwise-Data-Source", "mock-fallback");
  res.json(payload);
  return true;
};

export function registerPublicApiRoutes(app: Express) {
  app.get("/api/categories", async (_req, res, next) => {
    try {
      res.json(await storage.getCategories());
    } catch (error) {
      if (tryRespondWithDevMock("/api/categories", error, res, DEV_FALLBACK_CATEGORIES)) {
        return;
      }
      next(error);
    }
  });

  app.get("/api/categories/:slug", validate(getCategorySchema), async (req, res, next) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        throw Errors.notFound("Category not found");
      }
      res.json(category);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/companies", async (_req, res, next) => {
    try {
      res.json(await storage.getCompanies());
    } catch (error) {
      if (tryRespondWithDevMock("/api/companies", error, res, DEV_FALLBACK_COMPANIES)) {
        return;
      }
      next(error);
    }
  });

  app.get("/api/companies/:slug", validate(getCompanySchema), async (req, res, next) => {
    try {
      const company = await storage.getCompanyBySlug(req.params.slug);
      if (!company) {
        throw Errors.notFound("Company not found");
      }
      res.json(company);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/jobs", async (_req, res, next) => {
    try {
      res.json(await storage.getJobsWithCompanies());
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/jobs/featured", async (_req, res, next) => {
    try {
      res.json(await storage.getFeaturedJobs());
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/jobs/search", validate(searchJobsSchema), async (req, res, next) => {
    try {
      const query = (req.query.q as string) || "";
      res.json(await storage.searchJobs(query));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/jobs/company/:id", validate(getJobsByCompanySchema), async (req, res, next) => {
    try {
      const companyId = parseInt(req.params.id, 10);
      if (Number.isNaN(companyId)) {
        throw Errors.validation("Invalid company ID");
      }
      res.json(await storage.getJobsByCompany(companyId));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/jobs/category/:id", validate(getJobsByCategorySchema), async (req, res, next) => {
    try {
      const categoryId = parseInt(req.params.id, 10);
      if (Number.isNaN(categoryId)) {
        throw Errors.validation("Invalid category ID");
      }
      res.json(await storage.getJobsByCategory(categoryId));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/jobs/:id", validate(getJobSchema), async (req, res, next) => {
    try {
      const jobId = parseInt(req.params.id, 10);
      if (Number.isNaN(jobId)) {
        throw Errors.validation("Invalid job ID");
      }

      const job = await storage.getJob(jobId);
      if (!job) {
        throw Errors.notFound("Job not found");
      }

      const company = await storage.getCompany(job.companyId);
      if (!company) {
        throw Errors.notFound("Company not found");
      }

      const category = await storage.getCategory(job.categoryId);
      const descriptionSegments = job.description
        .split(/\r?\n|\. /)
        .map((segment) => segment.trim())
        .filter(Boolean);

      res.json({
        id: job.id,
        title: job.title,
        location: job.location,
        jobType: job.jobType,
        workMode: job.workMode,
        category: {
          id: category?.id ?? job.categoryId,
          name: category?.name ?? "General",
        },
        company: {
          id: company.id,
          name: company.name,
          location: company.location,
          logo: company.logo,
        },
        shortDescription: job.description.length > 140 ? `${job.description.slice(0, 137)}...` : job.description,
        tags: [category?.name, job.jobType, job.workMode].filter(Boolean),
        postedDate: job.createdAt,
        isRemote: /remote/i.test(job.workMode),
        experienceLevel: /senior|manager|lead/i.test(job.title) ? "senior" : /junior|entry|assistant|intern/i.test(job.title) ? "entry" : "mid",
        featured: Boolean(job.isFeatured),
        details: {
          id: job.id,
          fullDescription: job.description,
          requirements: descriptionSegments.slice(0, 3).length ? descriptionSegments.slice(0, 3) : ["Relevant experience", "Strong communication skills", "Reliable work ethic"],
          responsibilities: descriptionSegments.slice(3, 6).length ? descriptionSegments.slice(3, 6) : ["Perform role-specific responsibilities", "Collaborate with the team", "Deliver consistent results"],
          benefits: ["Market-related salary", "Growth opportunities", "Supportive team environment"],
          applicationInstructions: "Submit your application through WorkWise SA with your latest CV and any supporting notes.",
          companyDetails: {
            about: `${company.name} is hiring in ${company.location || job.location}.`,
            industry: category?.name ?? "General",
          },
          salaryDetails: job.salary ? {
            currency: "ZAR",
            negotiable: true,
            displayText: job.salary,
          } : undefined,
          createdAt: job.createdAt,
          updatedAt: job.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/jobs/:id/apply", verifyFirebaseToken, validate(applyForJobSchema), async (req, res, next) => {
    try {
      const jobId = parseInt(req.params.id, 10);
      const { coverLetter, resumeUrl, notes } = req.body;
      const authUser = (req as any).user;

      if (Number.isNaN(jobId)) {
        throw Errors.validation("Invalid job ID");
      }

      const job = await storage.getJob(jobId);
      if (!job) {
        throw Errors.notFound("Job not found");
      }

      const dbUser = await resolveAuthenticatedDatabaseUser(authUser);
      const userId = dbUser.id;
      const existingApplication = await storage.getJobApplicationByUserAndJob(userId, jobId);
      if (existingApplication) {
        throw Errors.conflict("You have already applied for this job");
      }

      const application = await storage.createJobApplication({
        userId,
        jobId,
        coverLetter,
        resumeUrl,
        notes,
        status: "applied",
      });

      await storage.createUserInteraction({
        userId,
        interactionType: "apply",
        jobId,
        interactionTime: new Date(),
        metadata: { applicationId: application.id },
      });

      res.status(201).json({
        success: true,
        message: "Job application submitted successfully",
        application,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/users/register", validate(z.object({ body: insertUserSchema })), async (req, res, next) => {
    try {
      const userData = req.body;
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        throw Errors.conflict("Username already exists");
      }

      const newUser = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
}
