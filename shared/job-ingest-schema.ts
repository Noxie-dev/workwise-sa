import { z } from "zod";

export const jobIngestSchema = z.object({
  schemaVersion: z.literal("job-ingest.v1").default("job-ingest.v1"),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(10000),
  companyName: z.string().trim().min(1).max(200),
  location: z.string().trim().min(1).max(200),
  salaryText: z.string().trim().max(200).nullable(),
  jobType: z.string().trim().max(100).nullable(),
  workMode: z.string().trim().max(100).nullable(),
  sourceSite: z.string().trim().min(1).max(100),
  sourceUrl: z.string().url(),
  externalId: z.string().trim().min(1).max(200),
  postedAt: z.string().datetime().nullable(),
  applyUrl: z.string().url().nullable(),
  metadata: z.object({
    isAnonymized: z.boolean(),
    complianceVersion: z.string().trim().min(1).max(50),
  }),
});

export const jobIngestBatchSchema = z.array(jobIngestSchema).min(1).max(1000);

export type JobIngest = z.infer<typeof jobIngestSchema>;
export type JobIngestBatch = z.infer<typeof jobIngestBatchSchema>;
