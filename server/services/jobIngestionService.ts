import { storage } from "../storage";
import { type InsertCategory, type InsertCompany, type InsertJob } from "@shared/schema";
import { type JobIngest } from "@shared/job-ingest-schema";
import { buildFingerprints } from "./squarejump/deduplicationService";
import { createOrganisationUid } from "./squarejump/identityService";
import { calculateOpportunityScore, OPPORTUNITY_WEIGHTS, type OpportunityPenalty } from "./squarejump/opportunityScoringService";
import { createReleaseSchedule } from "./squarejump/releasePolicyService";
import { extractRequirements } from "./squarejump/requirementsService";
import {
  deleteCanonicalJobAfterFailedIngest,
  createCanonicalJobWithSquareJumpArtifacts,
  findFingerprintOccurrence,
  findSourceOccurrence,
  persistMergedSourceOccurrence,
} from "./squarejump/squareJumpRepository";
import { assertSourceMayIngest } from "./squarejump/sourceRegistryService";
import { categoryName, classifyJob, normalizeJobLocation } from "./squarejump/taxonomyService";
import { getActivePolicy, numericPolicyWeights } from "./squarejump/scorePolicyRepository";

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
  results?: Array<{
    externalId: string;
    sourceSite: string;
    status: "inserted" | "duplicate" | "failed";
    juid?: string;
  }>;
};

const categoryKeywordMap: Record<string, string[]> = {
  retail: ["cashier", "retail", "sales assistant", "shop assistant", "store"],
  security: ["security", "guard", "cctv", "loss prevention"],
  hospitality: ["waiter", "bartender", "hospitality", "kitchen", "restaurant", "hotel"],
  cleaning: ["cleaner", "cleaning", "housekeeping", "domestic"],
  warehouse: ["warehouse", "picker", "packer", "forklift", "inventory"],
  logistics: ["driver", "courier", "delivery", "code 10", "code 14"],
  admin: ["admin", "clerk", "receptionist", "office", "data capture"],
  general: ["general worker", "labourer", "laborer", "assistant", "helper"],
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureCompany(companyName: string, location: string) {
  const slug = slugify(companyName);
  const existing = await storage.getCompanyBySlug(slug);
  if (existing) {
    return existing;
  }

  const companyInput: InsertCompany = {
    organisationUid: createOrganisationUid(),
    name: companyName,
    slug,
    location,
    logo: null,
    openPositions: 0,
  };

  return storage.createCompany(companyInput);
}

async function ensureCategory(job: JobIngest, canonicalCategoryName?: string) {
  const categories = await storage.getCategories();
  const haystack = `${job.title} ${job.description}`.toLowerCase();

  if (canonicalCategoryName) {
    const canonical = categories.find(
      (category) => category.name.toLowerCase() === canonicalCategoryName.toLowerCase()
    );
    if (canonical) return canonical;
  }

  for (const category of categories) {
    if (haystack.includes(category.name.toLowerCase())) {
      return category;
    }
  }

  for (const [slug, keywords] of Object.entries(categoryKeywordMap)) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      const existing = categories.find((category) => category.slug === slug);
      if (existing) {
        return existing;
      }
    }
  }

  const existingOther = categories.find(
    (category) => category.slug === "other" || category.name.toLowerCase() === "other"
  );
  if (existingOther) {
    return existingOther;
  }

  const categoryInput: InsertCategory = {
    name: "Other",
    slug: "other",
    icon: "briefcase",
    jobCount: 0,
  };

  return storage.createCategory(categoryInput);
}

function normalizeNullable(value: string | null): string | null {
  return value && value.trim() ? value.trim() : null;
}

function defaultJobType(jobType: string | null): string {
  return normalizeNullable(jobType) ?? "Full-time";
}

function defaultWorkMode(workMode: string | null): string {
  return normalizeNullable(workMode) ?? "On-site";
}

export async function ingestJobs(payload: JobIngest[]): Promise<JobIngestionSummary> {
  const summary: JobIngestionSummary = {
    inserted: 0,
    duplicates: 0,
    failed: 0,
    errors: [],
    results: [],
  };

  for (const job of payload) {
    let createdJobId: number | null = null;
    try {
      assertSourceMayIngest(job.sourceSite);

      const sourceOccurrence = await findSourceOccurrence(job.sourceSite, job.externalId);
      if (sourceOccurrence) {
        const canonicalJob = await storage.getJob(sourceOccurrence.jobId);
        const fingerprints = buildFingerprints(job);
        await persistMergedSourceOccurrence({
          jobId: sourceOccurrence.jobId,
          job,
          fingerprints,
          duplicateConfidence: 100,
        });
        summary.duplicates += 1;
        summary.results?.push({
          externalId: job.externalId,
          sourceSite: job.sourceSite,
          status: "duplicate",
          juid: canonicalJob?.juid,
        });
        continue;
      }

      // Preserve duplicate recognition for source occurrences ingested before
      // the SquareJUMP migration.
      const existingBySource = await storage.getJobIngestRecordBySource(job.sourceSite, job.externalId);
      if (existingBySource) {
        summary.duplicates += 1;
        const canonicalJob = await storage.getJob(existingBySource.jobId);
        const fingerprints = buildFingerprints(job);
        await persistMergedSourceOccurrence({
          jobId: existingBySource.jobId,
          job,
          fingerprints,
          duplicateConfidence: 100,
        });
        summary.results?.push({
          externalId: job.externalId,
          sourceSite: job.sourceSite,
          status: "duplicate",
          juid: canonicalJob?.juid,
        });
        continue;
      }

      const fingerprints = buildFingerprints(job);
      const fingerprintOccurrence = await findFingerprintOccurrence(fingerprints);
      const duplicateConfidence = fingerprintOccurrence
        ? fingerprintOccurrence.exactFingerprint === fingerprints.exact ? 97 : 70
        : 0;

      if (fingerprintOccurrence && duplicateConfidence >= 95) {
        await persistMergedSourceOccurrence({
          jobId: fingerprintOccurrence.jobId,
          job,
          fingerprints,
          duplicateConfidence,
        });
        summary.duplicates += 1;
        summary.results?.push({
          externalId: job.externalId,
          sourceSite: job.sourceSite,
          status: "duplicate",
          juid: (await storage.getJob(fingerprintOccurrence.jobId))?.juid,
        });
        continue;
      }

      const classification = classifyJob({
        title: job.title,
        description: job.description,
      });
      const normalizedLocation = normalizeJobLocation(job.location);
      const requirements = extractRequirements(`${job.title}\n${job.description}`);

      const company = await ensureCompany(job.companyName, job.location);
      const category = await ensureCategory(job, categoryName(classification.primaryCategoryCode));

      const verifiedAt = new Date();
      const opportunityPolicy = await getActivePolicy('opportunity');
      const ageHours = job.postedAt
        ? Math.max(0, (verifiedAt.getTime() - new Date(job.postedAt).getTime()) / 3_600_000)
        : 0;
      const penalties: OpportunityPenalty[] = [];
      if (!job.applyUrl) penalties.push({ type: "missing_application_link", value: 8 });
      if (classification.status === "review") {
        penalties.push({ type: "classification_review", value: 5 });
      }
      const opportunity = calculateOpportunityScore({
        titlePresent: Boolean(job.title.trim()),
        dutiesPresent: job.description.length >= 80,
        requirementsPresent: requirements.length > 0,
        employmentTypePresent: Boolean(job.jobType),
        usableLocation: Boolean(job.location.trim()),
        salaryPresent: Boolean(job.salaryText),
        applicationInstructionsPresent: Boolean(job.applyUrl),
        closingDatePresent: false,
        organisationIdentified: Boolean(job.companyName.trim()),
        applicationLinkHealthy: false,
        readableFormatting: job.description.length <= 10_000,
        employerVerified: false,
        verifiedDomain: false,
        employerHistoryScore: 50,
        employerReportRateScore: 50,
        ageHours,
        engagementQuality: 50,
        applicationPerformance: 50,
        sourceReliability: 80,
        marketSignal: 50,
        penalties,
      }, {
        weights: numericPolicyWeights(opportunityPolicy?.weights, OPPORTUNITY_WEIGHTS) as Partial<typeof OPPORTUNITY_WEIGHTS>,
        policyVersion: opportunityPolicy?.version,
      });
      // Scraped links start unverified. Until a link verifier and local
      // category/location percentile both approve early access, withholding
      // the job from free/public users would be an unjustified distortion.
      const releaseSchedule = createReleaseSchedule({
        verifiedAt,
        earlyAccessEligible: false,
      });

      const insertJob: InsertJob = {
        title: job.title,
        description: job.description,
        location: job.location,
        countryCode: "ZA",
        provinceCode: normalizedLocation.provinceCode,
        locationCode: normalizedLocation.locationCode,
        primaryCategoryCode: classification.primaryCategoryCode,
        salary: normalizeNullable(job.salaryText),
        jobType: defaultJobType(job.jobType),
        workMode: defaultWorkMode(job.workMode),
        companyId: company.id,
        categoryId: category.id,
        status: opportunity.riskStatus === "quarantined" ? "quarantined" : "active",
        riskStatus: opportunity.riskStatus,
        applicationLinkStatus: job.applyUrl ? "unverified" : "missing",
        verifiedAt,
        subscriberReleaseAt: releaseSchedule.subscriberReleaseAt,
        memberReleaseAt: releaseSchedule.memberReleaseAt,
        publicReleaseAt: releaseSchedule.publicReleaseAt,
        releasePolicyVersion: releaseSchedule.policyVersion,
        isFeatured: false,
      };

      const createdJob = await createCanonicalJobWithSquareJumpArtifacts({
        insertJob,
        artifacts: {
          job,
          fingerprints,
          classification,
          requirements,
          opportunity,
          releaseSchedule,
          duplicateConfidence,
          candidateSourceRecordId: fingerprintOccurrence?.id ?? null,
        },
      });
      createdJobId = createdJob.id;

      summary.inserted += 1;
      summary.results?.push({
        externalId: job.externalId,
        sourceSite: job.sourceSite,
        status: "inserted",
        juid: createdJob.juid,
      });
    } catch (error) {
      if (createdJobId != null) {
        try {
          await deleteCanonicalJobAfterFailedIngest(createdJobId);
        } catch {
          // The original persistence failure is the actionable error. Cleanup
          // failure remains visible through the orphan-job operational metric.
        }
      }
      summary.failed += 1;
      summary.errors.push({
        externalId: job.externalId,
        sourceSite: job.sourceSite,
        message: error instanceof Error ? error.message : "Unknown ingestion error",
      });
      summary.results?.push({
        externalId: job.externalId,
        sourceSite: job.sourceSite,
        status: "failed",
      });
    }
  }

  return summary;
}
