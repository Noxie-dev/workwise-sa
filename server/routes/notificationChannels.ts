import { Router } from "express";
import { z } from "zod";
import { smsService } from "../services/smsService";

const router = Router();

const smsPreviewSchema = z.object({
  to: z.string().min(8).max(20),
  body: z.string().min(1).max(320),
  category: z.enum(["job_alert", "application", "system"]).optional(),
});

router.get("/sms/status", (_req, res) => {
  res.json({
    channel: "sms",
    configured: smsService.isConfigured(),
    provider: process.env.SMS_PROVIDER || "stub",
  });
});

router.post("/sms/preview", async (req, res) => {
  const parsedBody = smsPreviewSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({
      message: "Invalid SMS payload",
      issues: parsedBody.error.issues,
    });
  }

  const result = await smsService.send(parsedBody.data);
  return res.status(result.status === "not_configured" ? 202 : 200).json(result);
});

export default router;
