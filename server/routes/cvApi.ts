import type { Express } from "express";
import { z } from "zod";
import { generateProfessionalSummary, generateJobDescription, translateText } from "../ai";
import {
  generateProfessionalSummaryWithClaude,
  generateJobDescriptionWithClaude,
  translateTextWithClaude,
  analyzeImage,
} from "../anthropic";
import { Errors } from "../middleware/errorHandler";
import { validate } from "../middleware/validation";
import { secretManager } from "../services/secretManager";

const generateSummarySchema = z.object({
  body: z.object({
    name: z.string(),
    skills: z.array(z.string()),
    experience: z.array(z.any()),
    education: z.array(z.any()),
    language: z.string().optional(),
  }),
});

const generateJobDescriptionSchema = z.object({
  body: z.object({
    jobInfo: z.any(),
    language: z.string().optional(),
  }),
});

const translateSchema = z.object({
  body: z.object({
    text: z.string(),
    targetLanguage: z.string(),
  }),
});

const analyzeImageSchema = z.object({
  body: z.object({
    image: z.string(),
  }),
});

export function registerCvApiRoutes(app: Express) {
  app.post("/api/cv/generate-summary", validate(generateSummarySchema), async (req, res, next) => {
    try {
      const { name, skills, experience, education, language } = req.body;
      if (!name || !skills || !experience || !education) {
        throw Errors.validation("Missing required fields for generating a professional summary");
      }

      res.json({
        summary: await generateProfessionalSummary({ name, skills, experience, education, language }),
      });
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

      res.json({ description: await generateJobDescription(jobInfo, language) });
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

      res.json({ translatedText: await translateText(text, targetLanguage) });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/cv/claude/generate-summary", validate(generateSummarySchema), async (req, res, next) => {
    try {
      if (!(await secretManager.getSecret("ANTHROPIC_API_KEY"))) {
        throw Errors.externalService("Anthropic API key is not configured");
      }

      const { name, skills, experience, education, language } = req.body;
      if (!name || !skills || !experience || !education) {
        throw Errors.validation("Missing required fields for generating a professional summary");
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
      next(error);
    }
  });

  app.post("/api/cv/claude/generate-job-description", validate(generateJobDescriptionSchema), async (req, res, next) => {
    try {
      if (!(await secretManager.getSecret("ANTHROPIC_API_KEY"))) {
        throw Errors.externalService("Anthropic API key is not configured");
      }

      const { jobInfo, language } = req.body;
      if (!jobInfo || !jobInfo.jobTitle || !jobInfo.employer) {
        throw Errors.validation("Missing required job information");
      }

      res.json({ description: await generateJobDescriptionWithClaude(jobInfo, language) });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/cv/claude/translate", validate(translateSchema), async (req, res, next) => {
    try {
      if (!(await secretManager.getSecret("ANTHROPIC_API_KEY"))) {
        throw Errors.externalService("Anthropic API key is not configured");
      }

      const { text, targetLanguage } = req.body;
      if (!text || !targetLanguage) {
        throw Errors.validation("Missing text or target language");
      }

      res.json({ translatedText: await translateTextWithClaude(text, targetLanguage) });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/cv/claude/analyze-image", validate(analyzeImageSchema), async (req, res, next) => {
    try {
      if (!(await secretManager.getSecret("ANTHROPIC_API_KEY"))) {
        throw Errors.externalService("Anthropic API key is not configured");
      }

      const { image } = req.body;
      if (!image) {
        throw Errors.validation("Missing image data");
      }

      res.json({ analysis: await analyzeImage(image) });
    } catch (error) {
      next(error);
    }
  });
}
