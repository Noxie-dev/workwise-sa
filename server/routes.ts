import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertCategorySchema, insertCompanySchema, insertJobSchema } from "@shared/schema";
import { z } from "zod";
import { generateProfessionalSummary, generateJobDescription, translateText } from "./ai";
import { 
  generateProfessionalSummaryWithClaude, 
  generateJobDescriptionWithClaude, 
  translateTextWithClaude,
  analyzeImage
} from "./anthropic";
import { aiServiceManager } from "./services/aiServiceManager";
import { mlJobMatchingService } from "./services/mlJobMatching";
import recommendationRoutes from "./recommendationRoutes";
import fileRoutes from "./routes/files";
import profileRoutes from "./routes/profile";
import { ApiError, Errors } from './middleware/errorHandler';
import { secretManager } from './services/secretManager';

import { validate } from "./middleware/validation";

// Schemas for validation
const getCategorySchema = z.object({ params: z.object({ slug: z.string() }) });
const getCompanySchema = z.object({ params: z.object({ slug: z.string() }) });
const searchJobsSchema = z.object({ query: z.object({ q: z.string() }) });
const getJobsByCompanySchema = z.object({ params: z.object({ id: z.string().regex(/^\d+$/) }) });
const getJobsByCategorySchema = z.object({ params: z.object({ id: z.string().regex(/^\d+$/) }) });
const getJobSchema = z.object({ params: z.object({ id: z.string().regex(/^\d+$/) }) });
const generateSummarySchema = z.object({ body: z.object({ name: z.string(), skills: z.array(z.string()), experience: z.array(z.any()), education: z.array(z.any()), language: z.string().optional() }) });
const generateJobDescriptionSchema = z.object({ body: z.object({ jobInfo: z.any(), language: z.string().optional() }) });
const translateSchema = z.object({ body: z.object({ text: z.string(), targetLanguage: z.string() }) });
const analyzeImageSchema = z.object({ body: z.object({ image: z.string() }) });

export async function registerRoutes(app: Express): Promise<Server> {
  // Categories routes
  app.get("/api/categories", async (req, res, next) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
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

  // Companies routes
  app.get("/api/companies", async (req, res, next) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
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

  // Jobs routes
  app.get("/api/jobs", async (req, res, next) => {
    try {
      const jobs = await storage.getJobsWithCompanies();
      res.json(jobs);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/jobs/featured", async (req, res, next) => {
    try {
      const featuredJobs = await storage.getFeaturedJobs();
      res.json(featuredJobs);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/jobs/search", validate(searchJobsSchema), async (req, res, next) => {
    try {
      const query = req.query.q as string || '';
      const results = await storage.searchJobs(query);
      res.json(results);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/jobs/company/:id", validate(getJobsByCompanySchema), async (req, res, next) => {
    try {
      const companyId = parseInt(req.params.id);
      if (isNaN(companyId)) {
        throw Errors.validation("Invalid company ID");
      }
      const jobs = await storage.getJobsByCompany(companyId);
      res.json(jobs);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/jobs/category/:id", validate(getJobsByCategorySchema), async (req, res, next) => {
    try {
      const categoryId = parseInt(req.params.id);
      if (isNaN(categoryId)) {
        throw Errors.validation("Invalid category ID");
      }
      const jobs = await storage.getJobsByCategory(categoryId);
      res.json(jobs);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/jobs/:id", validate(getJobSchema), async (req, res, next) => {
    try {
      const jobId = parseInt(req.params.id);
      if (isNaN(jobId)) {
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
      
      res.json({ ...job, company });
    } catch (error) {
      next(error);
    }
  });

  // Job Application endpoints
  
  // Apply for a job
  app.post("/api/jobs/:id/apply", validate(z.object({ 
    params: z.object({ id: z.string().regex(/^\d+$/) }),
    body: z.object({
      coverLetter: z.string().optional(),
      resumeUrl: z.url().optional(),
      notes: z.string().optional(),
    })
  })), async (req, res, next) => {
    try {
      // This would need authentication middleware to get userId
      // For now, we'll assume user authentication is handled elsewhere
      const jobId = parseInt(req.params.id);
      const { coverLetter, resumeUrl, notes } = req.body;
      
      if (isNaN(jobId)) {
        throw Errors.validation("Invalid job ID");
      }
      
      // Check if job exists
      const job = await storage.getJob(jobId);
      if (!job) {
        throw Errors.notFound("Job not found");
      }
      
      // TODO: Get userId from authentication
      // const userId = req.user.id;
      const userId = 1; // Placeholder for testing
      
      // Check if user has already applied
      const existingApplication = await storage.getJobApplicationByUserAndJob(userId, jobId);
      if (existingApplication) {
        throw Errors.conflict("You have already applied for this job");
      }
      
      // Create job application
      const application = await storage.createJobApplication({
        userId,
        jobId,
        coverLetter,
        resumeUrl,
        notes,
        status: 'applied',
      });
      
      // Log user interaction
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
  });

  // User routes
  app.post("/api/users/register", validate(z.object({ body: insertUserSchema })), async (req, res, next) => {
    try {
      const userData = req.body;
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        throw Errors.conflict("Username already exists");
      }
      
      const newUser = await storage.createUser(userData);
      
      // Don't return the password in the response
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  // AI-powered CV generation routes
  app.post("/api/cv/generate-summary", validate(generateSummarySchema), async (req, res, next) => {
    try {
      const { name, skills, experience, education, language } = req.body;
      
      if (!name || !skills || !experience || !education) {
        throw Errors.validation("Missing required fields for generating a professional summary");
      }
      
      const summary = await generateProfessionalSummary({
        name,
        skills,
        experience,
        education,
        language
      });
      
      res.json({ summary });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/cv/generate-job-description", validate(generateJobDescriptionSchema), async (req, res, next) => {
    try {
      const { jobInfo, language } = req.body;
      
      if (!jobInfo || !jobInfo.jobTitle || !jobInfo.employer) {
        throw Errors.validation("Missing required job information");
      }
      
      const description = await generateJobDescription(jobInfo, language);
      
      res.json({ description });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/cv/translate", validate(translateSchema), async (req, res, next) => {
    try {
      const { text, targetLanguage } = req.body;
      
      if (!text || !targetLanguage) {
        throw Errors.validation("Missing text or target language");
      }
      
      const translatedText = await translateText(text, targetLanguage);
      
      res.json({ translatedText });
    } catch (error) {
      next(error);
    }
  });
  
  // Anthropic Claude-powered CV generation routes
  app.post("/api/cv/claude/generate-summary", validate(generateSummarySchema), async (req, res, next) => {
    try {
      const anthropicApiKey = await secretManager.getSecret('ANTHROPIC_API_KEY');
      if (!anthropicApiKey) {
        throw Errors.externalService("Anthropic API key is not configured");
      }

      const { name, skills, experience, education, language } = req.body;
      
      if (!name || !skills || !experience || !education) {
        throw Errors.validation("Missing required fields for generating a professional summary");
      }
      
      const summary = await generateProfessionalSummaryWithClaude({
        name,
        skills,
        experience,
        education,
        language
      });
      
      res.json({ summary });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/cv/claude/generate-job-description", validate(generateJobDescriptionSchema), async (req, res, next) => {
    try {
      const anthropicApiKey = await secretManager.getSecret('ANTHROPIC_API_KEY');
      if (!anthropicApiKey) {
        throw Errors.externalService("Anthropic API key is not configured");
      }

      const { jobInfo, language } = req.body;
      
      if (!jobInfo || !jobInfo.jobTitle || !jobInfo.employer) {
        throw Errors.validation("Missing required job information");
      }
      
      const description = await generateJobDescriptionWithClaude(jobInfo, language);
      
      res.json({ description });
    }
    catch (error) {
      next(error);
    }
  });

  app.post("/api/cv/claude/translate", validate(translateSchema), async (req, res, next) => {
    try {
      const anthropicApiKey = await secretManager.getSecret('ANTHROPIC_API_KEY');
      if (!anthropicApiKey) {
        throw Errors.externalService("Anthropic API key is not configured");
      }

      const { text, targetLanguage } = req.body;
      
      if (!text || !targetLanguage) {
        throw Errors.validation("Missing text or target language");
      }
      
      const translatedText = await translateTextWithClaude(text, targetLanguage);
      
      res.json({ translatedText });
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/cv/claude/analyze-image", validate(analyzeImageSchema), async (req, res, next) => {
    try {
      const anthropicApiKey = await secretManager.getSecret('ANTHROPIC_API_KEY');
      if (!anthropicApiKey) {
        throw Errors.externalService("Anthropic API key is not configured");
      }

      const { image } = req.body;
      
      if (!image) {
        throw Errors.validation("Missing image data");
      }
      
      const analysis = await analyzeImage(image);
      
      res.json({ analysis });
    } catch (error) {
      next(error);
    }
  });
  
  // Register job recommendation routes
  app.use('/api/recommendations', recommendationRoutes);
  
  // Register file upload routes
  app.use('/api/files', fileRoutes);
  
  // Register profile routes
  app.use('/api/profile', profileRoutes);
  
  const httpServer = createServer(app);
  return httpServer;
}
