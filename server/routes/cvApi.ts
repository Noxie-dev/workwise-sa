import type { Express } from "express";
import crypto from "crypto";
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
import { verifyFirebaseToken } from "../middleware/auth";
import { resolveAuthenticatedDatabaseUser } from "../services/authenticatedUser";
import { entitlementService } from "../services/entitlementService";
import { aiUsageMeterService } from "../services/aiUsageMeterService";
import { aiDocumentGenerationService } from "../services/aiDocumentGenerationService";

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

const aiCvGenerateSchema = z.object({
  body: z.object({
    language: z.string().optional(),
    idempotencyKey: z.string().min(8).max(120).optional(),
  }),
});

const aiCoverLetterGenerateSchema = z.object({
  body: z.object({
    jobId: z.coerce.number().int().positive(),
    tone: z.string().min(3).max(40).optional(),
    idempotencyKey: z.string().min(8).max(120).optional(),
  }),
});

function idempotencyKey(req: any, fallbackPrefix: string) {
  return req.body.idempotencyKey || req.header("x-idempotency-key") || `${fallbackPrefix}-${crypto.randomUUID()}`;
}

export function registerCvApiRoutes(app: Express) {
  app.post("/api/cv/ai/generate", verifyFirebaseToken, validate(aiCvGenerateSchema), async (req, res, next) => {
    let usageEventId: number | undefined;
    const startedAt = Date.now();

    try {
      const dbUser = await resolveAuthenticatedDatabaseUser((req as any).user);
      const entitlements = await entitlementService.getEntitlementsForUser(dbUser.id);
      const reservation = await aiUsageMeterService.reserveUsage({
        userId: dbUser.id,
        documentType: "cv",
        idempotencyKey: idempotencyKey(req, "cv"),
        entitlements,
      });

      if (reservation.replay) {
        if (reservation.existingDocument) {
          return res.json({
            document: reservation.existingDocument,
            entitlements: await entitlementService.getEntitlementsForUser(dbUser.id),
            replay: true,
          });
        }

        throw Errors.conflict("A generation with this idempotency key is already in progress or failed");
      }

      usageEventId = reservation.usageEvent.id;
      const generated = await aiDocumentGenerationService.generateCv(dbUser.id, req.body.language || "English");
      await aiUsageMeterService.completeUsage({
        usageEventId,
        model: generated.model,
        tokens: generated.tokens,
        costEstimateCents: generated.costEstimateCents,
        generationTimeMs: Date.now() - startedAt,
        metadata: { language: req.body.language || "English" },
      });
      const document = await aiUsageMeterService.createGeneratedDocument({
        userId: dbUser.id,
        usageEventId,
        documentType: "cv",
        title: generated.title,
        content: generated.content,
        model: generated.model,
      });

      res.status(201).json({
        document,
        entitlements: await entitlementService.getEntitlementsForUser(dbUser.id),
        replay: false,
      });
    } catch (error: any) {
      if (usageEventId) {
        await aiUsageMeterService.failUsage(usageEventId, error.message || "AI CV generation failed", Date.now() - startedAt);
      }
      next(error);
    }
  });

  app.post("/api/cv/ai/cover-letter", verifyFirebaseToken, validate(aiCoverLetterGenerateSchema), async (req, res, next) => {
    let usageEventId: number | undefined;
    const startedAt = Date.now();

    try {
      const jobId = Number(req.body.jobId);
      const dbUser = await resolveAuthenticatedDatabaseUser((req as any).user);
      const entitlements = await entitlementService.getEntitlementsForUser(dbUser.id);
      const reservation = await aiUsageMeterService.reserveUsage({
        userId: dbUser.id,
        documentType: "cover_letter",
        idempotencyKey: idempotencyKey(req, `cover-${jobId}`),
        jobId,
        entitlements,
      });

      if (reservation.replay) {
        if (reservation.existingDocument) {
          return res.json({
            document: reservation.existingDocument,
            entitlements: await entitlementService.getEntitlementsForUser(dbUser.id),
            replay: true,
          });
        }

        throw Errors.conflict("A generation with this idempotency key is already in progress or failed");
      }

      usageEventId = reservation.usageEvent.id;
      const generated = await aiDocumentGenerationService.generateCoverLetter(
        dbUser.id,
        jobId,
        req.body.tone || "professional",
      );
      await aiUsageMeterService.completeUsage({
        usageEventId,
        model: generated.model,
        tokens: generated.tokens,
        costEstimateCents: generated.costEstimateCents,
        generationTimeMs: generated.generationTimeMs || Date.now() - startedAt,
        metadata: { tone: req.body.tone || "professional", jobId },
      });
      const document = await aiUsageMeterService.createGeneratedDocument({
        userId: dbUser.id,
        usageEventId,
        documentType: "cover_letter",
        jobId,
        title: generated.title,
        content: generated.content,
        model: generated.model,
      });

      res.status(201).json({
        document,
        entitlements: await entitlementService.getEntitlementsForUser(dbUser.id),
        replay: false,
      });
    } catch (error: any) {
      if (usageEventId) {
        await aiUsageMeterService.failUsage(usageEventId, error.message || "AI cover-letter generation failed", Date.now() - startedAt);
      }
      next(error);
    }
  });

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
