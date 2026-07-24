// @ts-nocheck
import { Router, type Request } from "express";
import bcrypt from "bcrypt";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { publicUserRegistrationSchema } from "@shared/schema";
import {
  wiseup_ad_impressions,
  wiseup_ads,
  wiseup_bookmarks,
  wiseup_content,
} from "@shared/wiseup-schema";
import { jobIngestBatchSchema } from "@shared/job-ingest-schema";
import { publicUserProfileUpdateSchema } from "@shared/schema";
import { storage } from "../storage";
import { db } from "../db";
import squareJumpRoutes from "./squareJump";
import {
  generateProfessionalSummary,
  generateJobDescription,
  translateText,
} from "../ai";
import {
  analyzeImage,
  generateJobDescriptionWithClaude,
  generateProfessionalSummaryWithClaude,
  translateTextWithClaude,
} from "../anthropic";
import { generateCVPDF } from "../services/cvTemplateService";
import { ingestJobs } from "../services/jobIngestionService";
import { secretManager } from "../services/secretManager";
import { authenticate, authorize, authorizeOwnership, type AuthenticatedRequest } from "../middleware/auth";
import { rateLimiters } from "../../src/middleware/rateLimit";
import { isJobVisibleToAudience } from "../services/squarejump/releasePolicyService";

const v1Router = Router();

const bookmarkSchema = z.object({
  wiseUpItemId: z.string(),
  itemType: z.enum(["content", "ad"]),
});

const ingestBodySchema = z.union([
  jobIngestBatchSchema,
  z.object({ jobs: jobIngestBatchSchema }),
]);

function hasValidIngestToken(req: Request) {
  const configuredToken = process.env.SCRAPING_INGEST_TOKEN;
  if (!configuredToken) {
    return false;
  }

  const headerValue = req.header("x-ingest-token") ?? req.header("authorization");
  if (!headerValue) {
    return false;
  }

  const normalized = headerValue.replace(/^Bearer\s+/i, "");
  return normalized === configuredToken;
}

function calculateTopHiringCompanies(companies: any[], limit: number) {
  const WEIGHTS = {
    OPEN_POSITIONS: 25,
    HIRING_ACTIVITY: 20,
    COMPANY_QUALITY: 15,
    HIRING_VELOCITY: 15,
    INDUSTRY_DEMAND: 10,
    GROWTH_RATE: 10,
    URGENCY: 5,
  };

  return companies
    .map((company) => {
      const positionScore = Math.min(company.openPositions / 100, 1) * WEIGHTS.OPEN_POSITIONS;

      let activityScore = 0;
      if (company.isHiringNow) activityScore += 5;
      if (company.recentHires) activityScore += Math.min(company.recentHires / 20, 1) * 10;
      if (company.jobPostingFrequency) {
        activityScore += Math.min(company.jobPostingFrequency / 5, 1) * 5;
      }
      activityScore = Math.min(activityScore, WEIGHTS.HIRING_ACTIVITY);

      const ratingScore = (company.rating / 5) * 10;
      const responseScore = company.applicationResponseRate
        ? (company.applicationResponseRate / 100) * 5
        : 0;
      const qualityScore = Math.min(ratingScore + responseScore, WEIGHTS.COMPANY_QUALITY);

      const velocityScore = company.hiringVelocity
        ? Math.max(0, (30 - company.hiringVelocity) / 30) * WEIGHTS.HIRING_VELOCITY
        : 0;

      const demandScore = company.industryDemand
        ? (company.industryDemand / 10) * WEIGHTS.INDUSTRY_DEMAND
        : WEIGHTS.INDUSTRY_DEMAND * 0.5;

      const growthScore = Math.min(company.growthRate / 25, 1) * WEIGHTS.GROWTH_RATE;
      const urgencyScore = company.urgentPositions
        ? Math.min(company.urgentPositions / 10, 1) * WEIGHTS.URGENCY
        : 0;

      const totalScore =
        positionScore +
        activityScore +
        qualityScore +
        velocityScore +
        demandScore +
        growthScore +
        urgencyScore;

      return {
        ...company,
        hiringScore: Math.round(totalScore),
        scoreBreakdown: {
          positionScore: Math.round(positionScore),
          activityScore: Math.round(activityScore),
          qualityScore: Math.round(qualityScore),
          velocityScore: Math.round(velocityScore),
          demandScore: Math.round(demandScore),
        },
      };
    })
    .sort((a, b) => b.hiringScore - a.hiringScore)
    .slice(0, limit)
    .map((company, index) => ({
      ...company,
      rank: index + 1,
    }));
}

function isValidHiringMetrics(metrics: Record<string, unknown>): boolean {
  const validFields = [
    "openPositions",
    "recentHires",
    "jobPostingFrequency",
    "applicationResponseRate",
    "hiringVelocity",
    "industryDemand",
    "urgentPositions",
    "isHiringNow",
  ];

  return Object.keys(metrics).some((key) => validFields.includes(key));
}

async function buildCVTemplate(req: Request, res: any) {
  const cvData = req.body;
  const { personalInfo, professionalSummary, experience, education, skills } = cvData;

  if (
    !personalInfo?.fullName ||
    !professionalSummary ||
    !experience?.length ||
    !education?.length ||
    !skills?.length
  ) {
    return res.status(400).json({ message: "Missing required CV information" });
  }

  const pdfBuffer = await generateCVPDF(cvData);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="cv-${personalInfo.fullName.replace(/\s+/g, "_")}.pdf"`
  );
  res.send(pdfBuffer);
}

v1Router.use(rateLimiters.general);

v1Router.get("/categories", async (_req, res) => {
  try {
    res.json(await storage.getCategories());
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

v1Router.get("/categories/:slug", async (req, res) => {
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

v1Router.get("/companies", async (_req, res) => {
  try {
    res.json(await storage.getCompanies());
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ message: "Failed to fetch companies" });
  }
});

v1Router.get("/companies/:slug", async (req, res) => {
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

v1Router.get("/jobs", async (_req, res) => {
  try {
    const jobs = await storage.getJobsWithCompanies();
    res.json(jobs.filter((job) => isJobVisibleToAudience(job, "public")));
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
});

v1Router.get("/jobs/featured", async (_req, res) => {
  try {
    const jobs = await storage.getFeaturedJobs();
    res.json(jobs.filter((job) => isJobVisibleToAudience(job, "public")));
  } catch (error) {
    console.error("Error fetching featured jobs:", error);
    res.status(500).json({ message: "Failed to fetch featured jobs" });
  }
});

v1Router.get("/jobs/search", async (req, res) => {
  try {
    const query = (req.query.q as string) || "";
    const jobs = await storage.searchJobs(query);
    res.json(jobs.filter((job) => isJobVisibleToAudience(job, "public")));
  } catch (error) {
    console.error("Error searching jobs:", error);
    res.status(500).json({ message: "Failed to search jobs" });
  }
});

// SquareJUMP owns the canonical authenticated recommendation and event
// surfaces. Mount it before /jobs/:id so "recommendations" is never parsed as
// a numeric job identifier.
v1Router.use("/", squareJumpRoutes);

v1Router.get("/jobs/company/:id", async (req, res) => {
  try {
    const companyId = parseInt(req.params.id, 10);
    if (Number.isNaN(companyId)) {
      return res.status(400).json({ message: "Invalid company ID" });
    }
    const jobs = await storage.getJobsByCompany(companyId);
    res.json(jobs.filter((job) => isJobVisibleToAudience(job, "public")));
  } catch (error) {
    console.error("Error fetching jobs by company:", error);
    res.status(500).json({ message: "Failed to fetch jobs by company" });
  }
});

v1Router.get("/jobs/category/:id", async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id, 10);
    if (Number.isNaN(categoryId)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }
    const jobs = await storage.getJobsByCategory(categoryId);
    res.json(jobs.filter((job) => isJobVisibleToAudience(job, "public")));
  } catch (error) {
    console.error("Error fetching jobs by category:", error);
    res.status(500).json({ message: "Failed to fetch jobs by category" });
  }
});

v1Router.get("/jobs/:id", async (req, res) => {
  try {
    const jobId = parseInt(req.params.id, 10);
    if (Number.isNaN(jobId)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    const job = await storage.getJob(jobId);
    if (!job || !isJobVisibleToAudience(job, "public")) {
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

v1Router.post("/jobs/ingest", async (req, res) => {
  if (!hasValidIngestToken(req)) {
    return res.status(401).json({ message: "Invalid ingest token" });
  }

  const parsed = ingestBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid ingestion payload",
      errors: parsed.error.issues,
    });
  }

  try {
    const jobs = Array.isArray(parsed.data) ? parsed.data : parsed.data.jobs;
    if (jobs.length > 500) {
      return res.status(413).json({ message: "Batch size exceeds maximum of 500 jobs" });
    }

    res.status(200).json(await ingestJobs(jobs));
  } catch (error) {
    res.status(500).json({
      message: "Failed to ingest jobs",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

v1Router.post("/users/login", rateLimiters.auth, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!password) {
      return res.status(400).json({
        error: { type: "ValidationError", message: "Password is required", details: { field: "password" } },
      });
    }

    let user;
    if (username) {
      user = await storage.getUserByUsername(username);
    } else if (email) {
      const users = await storage.getUsers();
      user = users.find((item) => item.email === email);
    } else {
      return res.status(400).json({
        error: {
          type: "ValidationError",
          message: "Username or email is required",
          details: { field: "username_or_email" },
        },
      });
    }

    if (!user?.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        error: { type: "AuthenticationError", message: "Invalid credentials", details: {} },
      });
    }

    const { password: _password, ...userWithoutPassword } = user;
    res.json({ success: true, data: userWithoutPassword, message: "Login successful" });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ error: { type: "ServerError", message: "Failed to login", details: {} } });
  }
});

v1Router.post("/users/register", rateLimiters.auth, async (req, res) => {
  try {
    const userData = publicUserRegistrationSchema.parse(req.body);

    if (userData.username) {
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({
          error: { type: "ConflictError", message: "Username already exists", details: { field: "username" } },
        });
      }
    }

    const existingUsers = await storage.getUsers();
    if (existingUsers.some((user) => user.email === userData.email)) {
      return res.status(409).json({
        error: { type: "ConflictError", message: "Email already exists", details: { field: "email" } },
      });
    }

    const passwordHash = await bcrypt.hash(userData.password, 12);
    const newUser = await storage.createUser({
      ...userData,
      password: passwordHash,
      firebaseUid: null,
      role: "user",
    });
    const { password: _password, ...userWithoutPassword } = newUser;
    res.status(201).json({
      success: true,
      data: userWithoutPassword,
      message: "User registered successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          type: "ValidationError",
          message: "Invalid user data",
          details: error.issues.reduce((acc, issue) => {
            acc[issue.path.join(".")] = issue.message;
            return acc;
          }, {} as Record<string, string>),
        },
      });
    }

    console.error("Error registering user:", error);
    res.status(500).json({
      error: { type: "ServerError", message: "Failed to register user", details: {} },
    });
  }
});

v1Router.get("/users/:userId", authenticate, authorizeOwnership("userId"), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

v1Router.put("/users/:userId", authenticate, authorizeOwnership("userId"), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const parsedUpdates = publicUserProfileUpdateSchema.safeParse(req.body);
    if (!parsedUpdates.success) {
      return res.status(400).json({
        message: "Invalid profile update",
        errors: parsedUpdates.error.issues,
      });
    }

    const updatedUser = await storage.updateUser(userId, parsedUpdates.data);
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
});

v1Router.get("/users", authenticate, authorize(["admin"]), async (_req, res) => {
  try {
    const users = await storage.getUsers();
    res.json(users.map(({ password, ...user }) => user));
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

v1Router.delete("/users/:userId", authenticate, authorize(["admin"]), async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const success = await storage.deleteUser(userId);
    if (!success) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(204).end();
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

v1Router.get("/companies/top-hiring", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 3;
    const companies = await storage.getCompaniesWithHiringMetrics();
    res.json({
      success: true,
      data: {
        companies: calculateTopHiringCompanies(companies, limit),
        lastUpdated: new Date().toISOString(),
        algorithm: {
          version: "1.0",
          factors: [
            "Open positions (25%)",
            "Hiring activity (20%)",
            "Company quality (15%)",
            "Hiring velocity (15%)",
            "Industry demand (10%)",
            "Growth rate (10%)",
            "Urgency (5%)",
          ],
        },
      },
    });
  } catch (error) {
    console.error("Error fetching top hiring companies:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch top hiring companies",
      error: process.env.NODE_ENV === "development" && error instanceof Error ? error.message : undefined,
    });
  }
});

v1Router.get("/analytics/hiring-trends", async (_req, res) => {
  try {
    res.json({ success: true, data: await storage.getHiringTrends() });
  } catch (error) {
    console.error("Error fetching hiring trends:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch hiring trends",
      error: process.env.NODE_ENV === "development" && error instanceof Error ? error.message : undefined,
    });
  }
});

v1Router.patch("/companies/:id/hiring-metrics", async (req, res) => {
  try {
    const companyId = parseInt(req.params.id, 10);
    const metrics = req.body;
    if (Number.isNaN(companyId) || !isValidHiringMetrics(metrics)) {
      return res.status(400).json({ success: false, message: "Invalid hiring metrics data" });
    }

    const updated = await storage.updateCompanyHiringMetrics(companyId, metrics);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    res.json({ success: true, message: "Hiring metrics updated successfully" });
  } catch (error) {
    console.error("Error updating hiring metrics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update hiring metrics",
      error: process.env.NODE_ENV === "development" && error instanceof Error ? error.message : undefined,
    });
  }
});

const cvRouter = Router();
cvRouter.use(authenticate, rateLimiters.ai);

cvRouter.post("/generate-summary", async (req, res) => {
  try {
    const { name, skills, experience, education, language = "English" } = req.body;
    if (!name || !skills || !experience || !education) {
      return res.status(400).json({ message: "Missing required fields for generating a professional summary" });
    }
    res.json({
      summary: await generateProfessionalSummary({ name, skills, experience, education, language }),
    });
  } catch (error) {
    console.error("Error generating professional summary:", error);
    res.status(500).json({
      message: "Failed to generate professional summary",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

cvRouter.post("/generate-job-description", async (req, res) => {
  try {
    const { jobInfo, language = "English" } = req.body;
    if (!jobInfo || !jobInfo.jobTitle || !jobInfo.employer) {
      return res.status(400).json({ message: "Missing required job information" });
    }
    res.json({ description: await generateJobDescription(jobInfo, language) });
  } catch (error) {
    console.error("Error generating job description:", error);
    res.status(500).json({
      message: "Failed to generate job description",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

cvRouter.post("/translate", async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    if (!text || !targetLanguage) {
      return res.status(400).json({ message: "Missing text or target language" });
    }
    res.json({ translatedText: await translateText(text, targetLanguage) });
  } catch (error) {
    console.error("Error translating text:", error);
    res.status(500).json({
      message: "Failed to translate text",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

cvRouter.post("/claude/generate-summary", async (req, res) => {
  try {
    if (!(await secretManager.getSecret("ANTHROPIC_API_KEY"))) {
      return res.status(500).json({ message: "Anthropic API key is not configured" });
    }

    const { name, skills, experience, education, language = "English" } = req.body;
    if (!name || !skills || !experience || !education) {
      return res.status(400).json({ message: "Missing required fields for generating a professional summary" });
    }

    res.json({
      summary: await generateProfessionalSummaryWithClaude({
        name,
        skills,
        experience,
        education,
        language,
      }),
    });
  } catch (error) {
    console.error("Error generating professional summary with Claude:", error);
    res.status(500).json({
      message: "Failed to generate professional summary with Claude",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

cvRouter.post("/claude/generate-job-description", async (req, res) => {
  try {
    if (!(await secretManager.getSecret("ANTHROPIC_API_KEY"))) {
      return res.status(500).json({ message: "Anthropic API key is not configured" });
    }

    const { jobInfo, language = "English" } = req.body;
    if (!jobInfo || !jobInfo.jobTitle || !jobInfo.employer) {
      return res.status(400).json({ message: "Missing required job information" });
    }

    res.json({ description: await generateJobDescriptionWithClaude(jobInfo, language) });
  } catch (error) {
    console.error("Error generating job description with Claude:", error);
    res.status(500).json({
      message: "Failed to generate job description with Claude",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

cvRouter.post("/claude/translate", async (req, res) => {
  try {
    if (!(await secretManager.getSecret("ANTHROPIC_API_KEY"))) {
      return res.status(500).json({ message: "Anthropic API key is not configured" });
    }

    const { text, targetLanguage } = req.body;
    if (!text || !targetLanguage) {
      return res.status(400).json({ message: "Missing text or target language" });
    }

    res.json({ translatedText: await translateTextWithClaude(text, targetLanguage) });
  } catch (error) {
    console.error("Error translating text with Claude:", error);
    res.status(500).json({
      message: "Failed to translate text with Claude",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

cvRouter.post("/claude/analyze-image", async (req, res) => {
  try {
    if (!(await secretManager.getSecret("ANTHROPIC_API_KEY"))) {
      return res.status(500).json({ message: "Anthropic API key is not configured" });
    }

    const imageUrl = req.body.imageUrl ?? req.body.image;
    if (!imageUrl) {
      return res.status(400).json({ message: "Missing image URL" });
    }

    res.json({ analysis: await analyzeImage(imageUrl) });
  } catch (error) {
    console.error("Error analyzing image with Claude:", error);
    res.status(500).json({
      message: "Failed to analyze image with Claude",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

cvRouter.post("/generate-template", buildCVTemplate);
cvRouter.post("/cv/generate-template", buildCVTemplate);

v1Router.use("/cv", cvRouter);
const wiseupRouter = Router();

wiseupRouter.get("/content", async (req, res) => {
  try {
    const maxItems = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const contentItems = await db.select().from(wiseup_content).orderBy(desc(wiseup_content.createdAt)).limit(maxItems);
    res.json(contentItems);
  } catch (error) {
    console.error("Error fetching content:", error);
    res.status(500).json({ message: "Failed to fetch content" });
  }
});

wiseupRouter.get("/ads", async (req, res) => {
  try {
    const maxItems = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
    const adItems = await db
      .select()
      .from(wiseup_ads)
      .where(eq(wiseup_ads.active, true))
      .limit(maxItems);
    res.json(adItems);
  } catch (error) {
    console.error("Error fetching ads:", error);
    res.status(500).json({ message: "Failed to fetch ads" });
  }
});

wiseupRouter.post("/ads/impression", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { adId } = req.body;
    if (!adId) {
      return res.status(400).json({ message: "Ad ID is required" });
    }

    await db.insert(wiseup_ad_impressions).values({
      adId: Number(adId),
      userId: req.user?.uid || "anonymous",
      platform: "web",
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error tracking ad impression:", error);
    res.status(500).json({ message: "Failed to track ad impression" });
  }
});

wiseupRouter.get("/bookmarks", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const bookmarks = await db
      .select()
      .from(wiseup_bookmarks)
      .where(eq(wiseup_bookmarks.userId, req.user.uid))
      .orderBy(desc(wiseup_bookmarks.bookmarkedAt));

    const items = await Promise.all(
      bookmarks.map(async (bookmark) => {
        if (bookmark.itemType === "content") {
          const [content] = await db
            .select()
            .from(wiseup_content)
            .where(eq(wiseup_content.id, parseInt(bookmark.wiseUpItemId, 10)));
          return content;
        }

        const [ad] = await db
          .select()
          .from(wiseup_ads)
          .where(eq(wiseup_ads.id, parseInt(bookmark.wiseUpItemId, 10)));
        return ad;
      })
    );

    res.json(items.filter(Boolean));
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    res.status(500).json({ message: "Failed to fetch bookmarks" });
  }
});

wiseupRouter.post("/bookmarks", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const validatedData = bookmarkSchema.parse(req.body);
    const [existingBookmark] = await db
      .select()
      .from(wiseup_bookmarks)
      .where(
        and(
          eq(wiseup_bookmarks.userId, req.user.uid),
          eq(wiseup_bookmarks.wiseUpItemId, validatedData.wiseUpItemId),
          eq(wiseup_bookmarks.itemType, validatedData.itemType)
        )
      );

    if (existingBookmark) {
      return res.status(409).json({ message: "Item already bookmarked" });
    }

    const [newBookmark] = await db
      .insert(wiseup_bookmarks)
      .values({
        userId: req.user.uid,
        wiseUpItemId: validatedData.wiseUpItemId,
        itemType: validatedData.itemType,
        bookmarkedAt: new Date(),
      })
      .returning();

    res.status(201).json(newBookmark);
  } catch (error) {
    console.error("Error adding bookmark:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid request data", errors: error.issues });
    }
    res.status(500).json({ message: "Failed to add bookmark" });
  }
});

wiseupRouter.delete("/bookmarks/:id", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const bookmarkId = parseInt(req.params.id, 10);
    const [bookmark] = await db
      .select()
      .from(wiseup_bookmarks)
      .where(and(eq(wiseup_bookmarks.id, bookmarkId), eq(wiseup_bookmarks.userId, req.user.uid)));

    if (!bookmark) {
      return res.status(404).json({ message: "Bookmark not found" });
    }

    await db.delete(wiseup_bookmarks).where(eq(wiseup_bookmarks.id, bookmarkId));
    res.json({ success: true });
  } catch (error) {
    console.error("Error removing bookmark:", error);
    res.status(500).json({ message: "Failed to remove bookmark" });
  }
});

v1Router.use("/wiseup", wiseupRouter);

export default v1Router;
