import { Request, Router } from "express";
import { z } from "zod";
import { jobIngestBatchSchema } from "@shared/job-ingest-schema";
import { ingestJobs } from "../../../../server/services/jobIngestionService";

const ingestBodySchema = z.union([
  jobIngestBatchSchema,
  z.object({ jobs: jobIngestBatchSchema }),
]);

function hasValidIngestToken(req: Request) {
  const configuredToken = process.env.SCRAPING_INGEST_TOKEN;
  if (!configuredToken) {
    return true;
  }

  const headerValue = req.header("x-ingest-token") ?? req.header("authorization");
  if (!headerValue) {
    return false;
  }

  const normalized = headerValue.replace(/^Bearer\s+/i, "");
  return normalized === configuredToken;
}

export function registerJobIngestRoutes(router: Router) {
  router.post("/jobs/ingest", async (req, res) => {
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
        return res.status(413).json({
          message: "Batch size exceeds maximum of 500 jobs",
        });
      }
      const summary = await ingestJobs(jobs);
      return res.status(200).json(summary);
    } catch (error) {
      return res.status(500).json({
        message: "Failed to ingest jobs",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
}
