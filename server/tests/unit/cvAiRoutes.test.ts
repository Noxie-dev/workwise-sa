import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../middleware/auth", () => ({
  verifyFirebaseToken: (req: any, _res: any, next: (error?: unknown) => void) => {
    req.user = { uid: "firebase-user-1", email: "candidate@example.com" };
    next();
  },
}));

vi.mock("../../services/authenticatedUser", () => ({
  resolveAuthenticatedDatabaseUser: vi.fn(),
}));

vi.mock("../../services/entitlementService", () => ({
  entitlementService: {
    getEntitlementsForUser: vi.fn(),
  },
}));

vi.mock("../../services/aiUsageMeterService", () => ({
  aiUsageMeterService: {
    reserveUsage: vi.fn(),
    completeUsage: vi.fn(),
    failUsage: vi.fn(),
    createGeneratedDocument: vi.fn(),
  },
}));

vi.mock("../../services/aiDocumentGenerationService", () => ({
  aiDocumentGenerationService: {
    generateCv: vi.fn(),
    generateCoverLetter: vi.fn(),
  },
}));

import { registerCvApiRoutes } from "../../routes/cvApi";
import { errorHandler } from "../../middleware/errorHandler";
import { resolveAuthenticatedDatabaseUser } from "../../services/authenticatedUser";
import { entitlementService } from "../../services/entitlementService";
import { aiUsageMeterService } from "../../services/aiUsageMeterService";
import { aiDocumentGenerationService } from "../../services/aiDocumentGenerationService";

const mockedResolveUser = vi.mocked(resolveAuthenticatedDatabaseUser);
const mockedEntitlements = vi.mocked(entitlementService);
const mockedMeter = vi.mocked(aiUsageMeterService);
const mockedGeneration = vi.mocked(aiDocumentGenerationService);

function createApp() {
  const app = express();
  app.use(express.json());
  registerCvApiRoutes(app);
  app.use(errorHandler);
  return app;
}

describe("AI CV routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedResolveUser.mockResolvedValue({ id: 7, email: "candidate@example.com" } as any);
    mockedEntitlements.getEntitlementsForUser.mockResolvedValue({
      canGenerateCv: true,
      canGenerateCoverLetter: true,
      hasUnlimitedAiCv: false,
      hasUnlimitedAiCoverLetters: false,
      adsEnabled: true,
      candidatePromotionLite: false,
      remainingFreeCvGenerations: 3,
      remainingFreeCoverLetterGenerations: 3,
      workwisePlusActive: false,
    });
  });

  it("reserves usage, generates structured CV content, and completes the usage event", async () => {
    mockedMeter.reserveUsage.mockResolvedValue({
      usageEvent: { id: 101 },
      replay: false,
    } as any);
    mockedGeneration.generateCv.mockResolvedValue({
      title: "Candidate CV",
      content: { personalInfo: { fullName: "Candidate" }, skills: ["Retail"] },
      model: "gemini",
      tokens: 250,
      costEstimateCents: 1,
    } as any);
    mockedMeter.completeUsage.mockResolvedValue({ id: 101, success: true } as any);
    mockedMeter.createGeneratedDocument.mockResolvedValue({
      id: 201,
      content: { personalInfo: { fullName: "Candidate" }, skills: ["Retail"] },
    } as any);

    const response = await request(createApp())
      .post("/api/cv/ai/generate")
      .set("Authorization", "Bearer token")
      .send({ language: "English", idempotencyKey: "cv-test-key-1" });

    expect(response.status).toBe(201);
    expect(response.body.document.id).toBe(201);
    expect(mockedMeter.reserveUsage).toHaveBeenCalledWith(expect.objectContaining({
      userId: 7,
      documentType: "cv",
      idempotencyKey: "cv-test-key-1",
    }));
    expect(mockedMeter.completeUsage).toHaveBeenCalledWith(expect.objectContaining({
      usageEventId: 101,
    }));
  });

  it("returns forbidden when entitlement quota is exhausted", async () => {
    mockedMeter.reserveUsage.mockRejectedValue(Object.assign(new Error("AI generation quota exhausted or feature disabled"), {
      statusCode: 403,
    }));

    const response = await request(createApp())
      .post("/api/cv/ai/generate")
      .set("Authorization", "Bearer token")
      .send({ language: "English", idempotencyKey: "cv-test-key-2" });

    expect(response.status).toBe(403);
    expect(mockedGeneration.generateCv).not.toHaveBeenCalled();
  });

  it("generates a metered job-specific cover letter", async () => {
    mockedMeter.reserveUsage.mockResolvedValue({
      usageEvent: { id: 102 },
      replay: false,
    } as any);
    mockedGeneration.generateCoverLetter.mockResolvedValue({
      title: "Cover Letter",
      content: "Dear Hiring Manager,\n\nI am excited to apply.",
      model: "gemini",
      tokens: 180,
      costEstimateCents: 1,
    } as any);
    mockedMeter.completeUsage.mockResolvedValue({ id: 102, success: true } as any);
    mockedMeter.createGeneratedDocument.mockResolvedValue({
      id: 202,
      content: { coverLetter: "Dear Hiring Manager,\n\nI am excited to apply." },
    } as any);

    const response = await request(createApp())
      .post("/api/cv/ai/cover-letter")
      .set("Authorization", "Bearer token")
      .send({ jobId: 45, tone: "professional", idempotencyKey: "cover-test-key-1" });

    expect(response.status).toBe(201);
    expect(response.body.document.id).toBe(202);
    expect(response.body.document.content.coverLetter).toContain("Dear Hiring Manager");
    expect(mockedMeter.reserveUsage).toHaveBeenCalledWith(expect.objectContaining({
      userId: 7,
      documentType: "cover_letter",
      jobId: 45,
    }));
    expect(mockedGeneration.generateCoverLetter).toHaveBeenCalledWith(7, 45, "professional");
  });
});
