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
import recommendationRoutes from "./recommendationRoutes";

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
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:slug", validate(getCategorySchema), async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Companies routes
  app.get("/api/companies", async (req, res) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.get("/api/companies/:slug", validate(getCompanySchema), async (req, res) => {
    try {
      const company = await storage.getCompanyBySlug(req.params.slug);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  // Jobs routes
  app.get("/api/jobs", async (req, res) => {
    try {
      const jobs = await storage.getJobsWithCompanies();
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/featured", async (req, res) => {
    try {
      const featuredJobs = await storage.getFeaturedJobs();
      res.json(featuredJobs);
    } catch (error) {
      console.error("Error fetching featured jobs:", error);
      res.status(500).json({ message: "Failed to fetch featured jobs" });
    }
  });

  app.get("/api/jobs/search", validate(searchJobsSchema), async (req, res) => {
    try {
      const query = req.query.q as string || '';
      const results = await storage.searchJobs(query);
      res.json(results);
    } catch (error) {
      console.error("Error searching jobs:", error);
      res.status(500).json({ message: "Failed to search jobs" });
    }
  });

  app.get("/api/jobs/company/:id", validate(getJobsByCompanySchema), async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const jobs = await storage.getJobsByCompany(companyId);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs by company:", error);
      res.status(500).json({ message: "Failed to fetch jobs by company" });
    }
  });

  app.get("/api/jobs/category/:id", validate(getJobsByCategorySchema), async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const jobs = await storage.getJobsByCategory(categoryId);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs by category:", error);
      res.status(500).json({ message: "Failed to fetch jobs by category" });
    }
  });

  app.get("/api/jobs/:id", validate(getJobSchema), async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      const company = await storage.getCompany(job.companyId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      res.json({ ...job, company });
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  // User routes
  app.post("/api/users/register", validate(z.object({ body: insertUserSchema })), async (req, res) => {
    try {
      const userData = req.body;
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const newUser = await storage.createUser(userData);
      
      // Don't return the password in the response
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid user data", 
          errors: error.errors 
        });
      }
      
      console.error("Error registering user:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  // AI-powered CV generation routes
  app.post("/api/cv/generate-summary", validate(generateSummarySchema), async (req, res) => {
    try {
      const { name, skills, experience, education, language } = req.body;
      
      const summary = await generateProfessionalSummary({
        name,
        skills,
        experience,
        education,
        language
      });
      
      res.json({ summary });
    } catch (error) {
      console.error("Error generating professional summary:", error);
      res.status(500).json({ 
        message: "Failed to generate professional summary",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/cv/generate-job-description", validate(generateJobDescriptionSchema), async (req, res) => {
    try {
      const { jobInfo, language } = req.body;
      
      const description = await generateJobDescription(jobInfo, language);
      
      res.json({ description });
    } catch (error) {
      console.error("Error generating job description:", error);
      res.status(500).json({ 
        message: "Failed to generate job description",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/cv/translate", validate(translateSchema), async (req, res) => {
    try {
      const { text, targetLanguage } = req.body;
      
      const translatedText = await translateText(text, targetLanguage);
      
      res.json({ translatedText });
    } catch (error) {
      console.error("Error translating text:", error);
      res.status(500).json({ 
        message: "Failed to translate text",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Anthropic Claude-powered CV generation routes
  app.post("/api/cv/claude/generate-summary", validate(generateSummarySchema), async (req, res) => {
    try {
      if (!await secretManager.getSecret('ANTHROPIC_API_KEY')) {
        return res.status(500).json({ 
          message: "Anthropic API key is not configured"
        });
      }

      const { name, skills, experience, education, language } = req.body;
      
      const summary = await generateProfessionalSummaryWithClaude({
        name,
        skills,
        experience,
        education,
        language
      });
      
      res.json({ summary });
    } catch (error) {
      console.error("Error generating professional summary with Claude:", error);
      res.status(500).json({ 
        message: "Failed to generate professional summary with Claude",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/cv/claude/generate-job-description", validate(generateJobDescriptionSchema), async (req, res) => {
    try {
      if (!await secretManager.getSecret('ANTHROPIC_API_KEY')) {
        return res.status(500).json({ 
          message: "Anthropic API key is not configured"
        });
      }

      const { jobInfo, language } = req.body;
      
      const description = await generateJobDescriptionWithClaude(jobInfo, language);
      
      res.json({ description });
    } catch (error) {
      console.error("Error generating job description with Claude:", error);
      res.status(500).json({ 
        message: "Failed to generate job description with Claude",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/cv/claude/translate", validate(translateSchema), async (req, res) => {
    try {
      if (!await secretManager.getSecret('ANTHROPIC_API_KEY')) {
        return res.status(500).json({ 
          message: "Anthropic API key is not configured"
        });
      }

      const { text, targetLanguage } = req.body;
      
      const translatedText = await translateTextWithClaude(text, targetLanguage);
      
      res.json({ translatedText });
    } catch (error) {
      console.error("Error translating text with Claude:", error);
      res.status(500).json({ 
        message: "Failed to translate text with Claude",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  app.post("/api/cv/claude/analyze-image", validate(analyzeImageSchema), async (req, res) => {
    try {
      if (!await secretManager.getSecret('ANTHROPIC_API_KEY')) {
        return res.status(500).json({ 
          message: "Anthropic API key is not configured"
        });
      }

      const { image } = req.body;
      
      const analysis = await analyzeImage(image);
      
      res.json({ analysis });
    } catch (error) {
      console.error("Error analyzing image with Claude:", error);
      res.status(500).json({ 
        message: "Failed to analyze image with Claude",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Register job recommendation routes
  app.use('/api/recommendations', recommendationRoutes);
  
  const httpServer = createServer(app);
  return httpServer;
}
