import crypto from 'crypto';
import { storage } from '../storage';
import { type InsertCategory, type InsertCompany, type InsertJob } from '@shared/schema';
import { type JobIngest } from '@shared/job-ingest-schema';

type IngestError = {
  externalId: string;
  sourceSite: string;
  message: string;
};

export type JobIngestionSummary = {
  inserted: number;
  duplicates: number;
  failed: number;
  errors: IngestError[];
};

const categoryKeywordMap: Record<string, string[]> = {
  retail: ['cashier', 'retail', 'sales assistant', 'shop assistant', 'store'],
  security: ['security', 'guard', 'cctv', 'loss prevention'],
  hospitality: ['waiter', 'bartender', 'hospitality', 'kitchen', 'restaurant', 'hotel'],
  cleaning: ['cleaner', 'cleaning', 'housekeeping', 'domestic'],
  warehouse: ['warehouse', 'picker', 'packer', 'forklift', 'inventory'],
  logistics: ['driver', 'courier', 'delivery', 'code 10', 'code 14'],
  admin: ['admin', 'clerk', 'receptionist', 'office', 'data capture'],
  general: ['general worker', 'labourer', 'laborer', 'assistant', 'helper'],
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function computeFingerprint(job: JobIngest): string {
  return crypto
    .createHash('sha256')
    .update(
      `${job.title.toLowerCase()}|${job.companyName.toLowerCase()}|${job.location.toLowerCase()}`
    )
    .digest('hex');
}

async function ensureCompany(companyName: string, location: string) {
  const slug = slugify(companyName);
  const existing = await storage.getCompanyBySlug(slug);
  if (existing) {
    return existing;
  }

  const companyInput: InsertCompany = {
    name: companyName,
    slug,
    location,
    logo: null,
    openPositions: 0,
  };

  return storage.createCompany(companyInput);
}

async function ensureCategory(job: JobIngest) {
  const categories = await storage.getCategories();
  const haystack = `${job.title} ${job.description}`.toLowerCase();

  for (const category of categories) {
    if (haystack.includes(category.name.toLowerCase())) {
      return category;
    }
  }

  for (const [slug, keywords] of Object.entries(categoryKeywordMap)) {
    if (keywords.some(keyword => haystack.includes(keyword))) {
      const existing = categories.find(category => category.slug === slug);
      if (existing) {
        return existing;
      }
    }
  }

  const existingOther = categories.find(
    category => category.slug === 'other' || category.name.toLowerCase() === 'other'
  );
  if (existingOther) {
    return existingOther;
  }

  const categoryInput: InsertCategory = {
    name: 'Other',
    slug: 'other',
    icon: 'briefcase',
    jobCount: 0,
  };

  return storage.createCategory(categoryInput);
}

function normalizeNullable(value: string | null): string | null {
  return value && value.trim() ? value.trim() : null;
}

function defaultJobType(jobType: string | null): string {
  return normalizeNullable(jobType) ?? 'Full-time';
}

function defaultWorkMode(workMode: string | null): string {
  return normalizeNullable(workMode) ?? 'On-site';
}

export async function ingestJobs(payload: JobIngest[]): Promise<JobIngestionSummary> {
  const summary: JobIngestionSummary = {
    inserted: 0,
    duplicates: 0,
    failed: 0,
    errors: [],
  };

  for (const job of payload) {
    try {
      const existingBySource = await storage.getJobIngestRecordBySource(
        job.sourceSite,
        job.externalId
      );
      if (existingBySource) {
        summary.duplicates += 1;
        continue;
      }

      const fingerprint = computeFingerprint(job);
      const existingByFingerprint = await storage.getJobIngestRecordByFingerprint(fingerprint);
      if (existingByFingerprint) {
        summary.duplicates += 1;
        continue;
      }

      const company = await ensureCompany(job.companyName, job.location);
      const category = await ensureCategory(job);

      const insertJob: InsertJob = {
        title: job.title,
        description: job.description,
        location: job.location,
        salary: normalizeNullable(job.salaryText),
        jobType: defaultJobType(job.jobType),
        workMode: defaultWorkMode(job.workMode),
        companyId: company.id,
        categoryId: category.id,
        isFeatured: false,
      };

      const createdJob = await storage.createJob(insertJob);
      await storage.createJobIngestRecord({
        jobId: createdJob.id,
        sourceSite: job.sourceSite,
        sourceUrl: job.sourceUrl,
        externalId: job.externalId,
        applyUrl: normalizeNullable(job.applyUrl),
        postedAt: job.postedAt ? new Date(job.postedAt) : null,
        fingerprint,
        metadata: job.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      summary.inserted += 1;
    } catch (error) {
      summary.failed += 1;
      summary.errors.push({
        externalId: job.externalId,
        sourceSite: job.sourceSite,
        message: error instanceof Error ? error.message : 'Unknown ingestion error',
      });
    }
  }

  return summary;
}
