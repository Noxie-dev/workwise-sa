import {
  jobClassifications,
  jobDuplicateCandidates,
  jobRequirements,
  jobScoreHistory,
  jobScores,
  jobSourceRecords,
  jobReleaseEvents,
  jobs,
} from '@shared/schema';
import type { JobIngest } from '@shared/job-ingest-schema';
import type { InsertJob } from '@shared/schema';
import { createJuid, createPublicJobRef } from './identityService';
import type { ClassificationResult, ClassifiedRequirement } from '@shared/squarejump-contracts';
import { and, eq, or } from 'drizzle-orm';
import { db, getSqliteConnection, isSqliteDatabase } from '../../db';
import type { JobFingerprints } from './deduplicationService';
import type { OpportunityScoreResult } from './opportunityScoringService';
import type { ReleaseSchedule } from './releasePolicyService';

export async function findSourceOccurrence(sourceId: string, externalJobId: string) {
  const [record] = await db
    .select()
    .from(jobSourceRecords)
    .where(
      and(
        eq(jobSourceRecords.sourceId, sourceId),
        eq(jobSourceRecords.externalJobId, externalJobId)
      )
    );
  return record;
}

export async function findFingerprintOccurrence(fingerprints: JobFingerprints) {
  const predicates = [eq(jobSourceRecords.contentFingerprint, fingerprints.content)];
  if (fingerprints.exact) predicates.unshift(eq(jobSourceRecords.exactFingerprint, fingerprints.exact));
  const [record] = await db
    .select()
    .from(jobSourceRecords)
    .where(or(...predicates));
  return record;
}

export async function persistMergedSourceOccurrence(input: {
  jobId: number;
  job: JobIngest;
  fingerprints: JobFingerprints;
  duplicateConfidence: number;
}) {
  const now = new Date();
  if (isSqliteDatabase()) {
    const sqlite = getSqliteConnection();
    sqlite
      .prepare(
        `UPDATE job_source_records
         SET last_seen_at = ?, source_url = ?, apply_url = ?,
             source_published_at = ?, raw_payload_hash = ?,
             normalised_payload_hash = ?, duplicate_confidence = ?, metadata = ?
         WHERE job_id = ? AND source_id = ? AND external_job_id = ?`
      )
      .run(
        now.toISOString(),
        input.job.sourceUrl,
        input.job.applyUrl,
        input.job.postedAt,
        input.fingerprints.normalisedPayload,
        input.fingerprints.normalisedPayload,
        input.duplicateConfidence,
        JSON.stringify(input.job.metadata),
        input.jobId,
        input.job.sourceSite,
        input.job.externalId,
      );
    const existing = sqlite
      .prepare('SELECT id FROM job_source_records WHERE source_id = ? AND external_job_id = ?')
      .get(input.job.sourceSite, input.job.externalId) as { id?: number } | undefined;
    if (!existing) {
      sqlite
        .prepare(
          `INSERT INTO job_source_records (
            job_id, source_id, external_job_id, source_url, apply_url,
            source_published_at, first_seen_at, last_seen_at,
            normalised_payload_hash, exact_fingerprint, content_fingerprint,
            source_reference, ingest_status, duplicate_confidence, metadata
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          input.jobId,
          input.job.sourceSite,
          input.job.externalId,
          input.job.sourceUrl,
          input.job.applyUrl,
          input.job.postedAt,
          now.toISOString(),
          now.toISOString(),
          input.fingerprints.normalisedPayload,
          input.fingerprints.exact,
          input.fingerprints.content,
          `${input.job.sourceSite}:${input.job.externalId}`,
          'merged',
          input.duplicateConfidence,
          JSON.stringify(input.job.metadata),
        );
    }
    return;
  }

  const existing = await findSourceOccurrence(input.job.sourceSite, input.job.externalId);
  if (existing) {
    await db
      .update(jobSourceRecords)
      .set({
        lastSeenAt: now,
        sourceUrl: input.job.sourceUrl,
        applyUrl: input.job.applyUrl,
        sourcePublishedAt: input.job.postedAt ? new Date(input.job.postedAt) : null,
        normalisedPayloadHash: input.fingerprints.normalisedPayload,
        exactFingerprint: input.fingerprints.exact,
        contentFingerprint: input.fingerprints.content,
        duplicateConfidence: input.duplicateConfidence,
        metadata: input.job.metadata,
        ingestStatus: 'merged',
      })
      .where(eq(jobSourceRecords.id, existing.id));
    return;
  }
  await db.insert(jobSourceRecords).values({
    jobId: input.jobId,
    sourceId: input.job.sourceSite,
    externalJobId: input.job.externalId,
    sourceUrl: input.job.sourceUrl,
    applyUrl: input.job.applyUrl,
    sourcePublishedAt: input.job.postedAt ? new Date(input.job.postedAt) : null,
    firstSeenAt: now,
    lastSeenAt: now,
    normalisedPayloadHash: input.fingerprints.normalisedPayload,
    exactFingerprint: input.fingerprints.exact,
    contentFingerprint: input.fingerprints.content,
    sourceReference: `${input.job.sourceSite}:${input.job.externalId}`,
    ingestStatus: 'merged',
    duplicateConfidence: input.duplicateConfidence,
    metadata: input.job.metadata,
  });
}

export function persistSquareJumpArtifacts(input: {
  jobId: number;
  job: JobIngest;
  fingerprints: JobFingerprints;
  classification: ClassificationResult;
  requirements: ClassifiedRequirement[];
  opportunity: OpportunityScoreResult;
  releaseSchedule: ReleaseSchedule | null;
  duplicateConfidence?: number;
  candidateSourceRecordId?: number | null;
  transaction?: any;
  sqliteTransaction?: any;
}) {
  const now = new Date();
  if (isSqliteDatabase()) {
    const sqlite = getSqliteConnection();
    const asJson = (value: unknown) => JSON.stringify(value ?? null);
    const persistBody = () => {
      sqlite
        .prepare(
          `
        INSERT INTO job_source_records (
          job_id, source_id, external_job_id, source_url, apply_url,
          source_published_at, first_seen_at, last_seen_at,
          normalised_payload_hash, exact_fingerprint, content_fingerprint,
          source_reference, ingest_status, duplicate_confidence, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
        )
        .run(
          input.jobId,
          input.job.sourceSite,
          input.job.externalId,
          input.job.sourceUrl,
          input.job.applyUrl,
          input.job.postedAt,
          now.toISOString(),
          now.toISOString(),
          input.fingerprints.normalisedPayload,
          input.fingerprints.exact,
          input.fingerprints.content,
          `${input.job.sourceSite}:${input.job.externalId}`,
          'accepted',
          input.duplicateConfidence ?? 0,
          asJson(input.job.metadata)
        );

      if (
        input.candidateSourceRecordId &&
        (input.duplicateConfidence ?? 0) >= 60 &&
        (input.duplicateConfidence ?? 0) < 95
      ) {
        sqlite
          .prepare(
            `
          INSERT INTO job_duplicate_candidates (
            job_id, candidate_source_record_id, confidence, evidence, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?)
        `
          )
          .run(
            input.jobId,
            input.candidateSourceRecordId,
            input.duplicateConfidence,
            asJson({ contentFingerprint: true, autoMerged: false }),
            'pending',
            now.toISOString()
          );
      }

      sqlite
        .prepare(
          `
        INSERT INTO job_classifications (
          job_id, primary_category_code, secondary_category_codes,
          occupation_code, taxonomy_version, classifier_name,
          classifier_version, confidence, classification_source, status,
          classified_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
        )
        .run(
          input.jobId,
          input.classification.primaryCategoryCode,
          asJson(input.classification.secondaryCategoryCodes),
          input.classification.occupationCode ?? null,
          input.classification.taxonomyVersion,
          'squarejump-rules',
          '1.0',
          input.classification.confidence,
          input.classification.source,
          input.classification.status,
          now.toISOString()
        );

      const requirementStatement = sqlite.prepare(`
        INSERT INTO job_requirements (
          job_id, requirement_type, code, label, necessity, confidence,
          source, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const requirement of input.requirements) {
        requirementStatement.run(
          input.jobId,
          requirement.type,
          requirement.code ?? null,
          requirement.label,
          requirement.necessity,
          requirement.confidence,
          requirement.source,
          now.toISOString()
        );
      }

      const snapshot = {
        sourceId: input.job.sourceSite,
        classificationConfidence: input.classification.confidence,
      };
      sqlite
        .prepare(
          `
        INSERT INTO job_scores (
          job_id, score_type, score_value, component_scores, penalties,
          policy_version, feature_snapshot, calculated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
        )
        .run(
          input.jobId,
          'opportunity',
          input.opportunity.score,
          asJson(input.opportunity.components),
          asJson(input.opportunity.penalties),
          input.opportunity.policyVersion,
          asJson(snapshot),
          now.toISOString()
        );
      sqlite
        .prepare(
          `
        INSERT INTO job_score_history (
          job_id, score_type, score_value, component_scores, penalties,
          policy_version, feature_snapshot, calculation_reason, calculated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
        )
        .run(
          input.jobId,
          'opportunity',
          input.opportunity.score,
          asJson(input.opportunity.components),
          asJson(input.opportunity.penalties),
          input.opportunity.policyVersion,
          asJson(snapshot),
          'initial_ingest',
          now.toISOString()
        );

      if (input.releaseSchedule) {
        const releases = [
          ['subscriber', input.releaseSchedule.subscriberReleaseAt],
          ['member', input.releaseSchedule.memberReleaseAt],
          ['public', input.releaseSchedule.publicReleaseAt],
        ] as const;
        const releaseStatement = sqlite.prepare(`
          INSERT INTO job_release_events (
            job_id, audience, release_at, policy_version, idempotency_key,
            status, attempt_count, available_at, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const [audience, releaseAt] of releases) {
          releaseStatement.run(
            input.jobId,
            audience,
            releaseAt.toISOString(),
            input.releaseSchedule.policyVersion,
            `release:${input.jobId}:${audience}:${releaseAt.toISOString()}`,
            'scheduled',
            0,
            releaseAt.toISOString(),
            now.toISOString()
          );
        }
      }
    };
    const persist = input.sqliteTransaction ? persistBody : sqlite.transaction(persistBody);
    persist();
    return;
  }

  const transactionRunner = input.transaction ?? db;
  return transactionRunner.transaction(async (transaction: typeof db) => {
    await transaction.insert(jobSourceRecords).values({
      jobId: input.jobId,
      sourceId: input.job.sourceSite,
      externalJobId: input.job.externalId,
      sourceUrl: input.job.sourceUrl,
      applyUrl: input.job.applyUrl,
      sourcePublishedAt: input.job.postedAt ? new Date(input.job.postedAt) : null,
      firstSeenAt: now,
      lastSeenAt: now,
      normalisedPayloadHash: input.fingerprints.normalisedPayload,
      exactFingerprint: input.fingerprints.exact,
      contentFingerprint: input.fingerprints.content,
      sourceReference: `${input.job.sourceSite}:${input.job.externalId}`,
      ingestStatus: 'accepted',
      duplicateConfidence: input.duplicateConfidence ?? 0,
      metadata: input.job.metadata,
    });

    if (
      input.candidateSourceRecordId &&
      (input.duplicateConfidence ?? 0) >= 60 &&
      (input.duplicateConfidence ?? 0) < 95
    ) {
      await transaction.insert(jobDuplicateCandidates).values({
        jobId: input.jobId,
        candidateSourceRecordId: input.candidateSourceRecordId,
        confidence: input.duplicateConfidence ?? 0,
        evidence: {
          contentFingerprint: true,
          autoMerged: false,
        },
        status: 'pending',
        createdAt: now,
      });
    }

    await transaction.insert(jobClassifications).values({
      jobId: input.jobId,
      primaryCategoryCode: input.classification.primaryCategoryCode,
      secondaryCategoryCodes: input.classification.secondaryCategoryCodes,
      occupationCode: input.classification.occupationCode ?? null,
      taxonomyVersion: input.classification.taxonomyVersion,
      classifierName: 'squarejump-rules',
      classifierVersion: '1.0',
      confidence: input.classification.confidence,
      classificationSource: input.classification.source,
      status: input.classification.status,
      classifiedAt: now,
    });

    if (input.requirements.length > 0) {
      await transaction.insert(jobRequirements).values(
        input.requirements.map(requirement => ({
          jobId: input.jobId,
          requirementType: requirement.type,
          code: requirement.code ?? null,
          label: requirement.label,
          necessity: requirement.necessity,
          confidence: requirement.confidence,
          source: requirement.source,
          createdAt: now,
        }))
      );
    }

    const scoreRecord = {
      jobId: input.jobId,
      scoreType: 'opportunity',
      scoreValue: input.opportunity.score,
      componentScores: input.opportunity.components,
      penalties: input.opportunity.penalties,
      policyVersion: input.opportunity.policyVersion,
      featureSnapshot: {
        sourceId: input.job.sourceSite,
        classificationConfidence: input.classification.confidence,
      },
      calculatedAt: now,
    };
    await transaction.insert(jobScores).values(scoreRecord);
    await transaction.insert(jobScoreHistory).values({
      ...scoreRecord,
      calculationReason: 'initial_ingest',
    });

    if (input.releaseSchedule) {
      const releases = [
        ['subscriber', input.releaseSchedule.subscriberReleaseAt],
        ['member', input.releaseSchedule.memberReleaseAt],
        ['public', input.releaseSchedule.publicReleaseAt],
      ] as const;
      await transaction.insert(jobReleaseEvents).values(
        releases.map(([audience, releaseAt]) => ({
          jobId: input.jobId,
          audience,
          releaseAt,
          policyVersion: input.releaseSchedule!.policyVersion,
          idempotencyKey: `release:${input.jobId}:${audience}:${releaseAt.toISOString()}`,
          status: 'scheduled',
          attemptCount: 0,
          availableAt: releaseAt,
          createdAt: now,
        }))
      );
    }
  });
}

/**
 * Canonical job creation and all SquareJUMP artifacts commit as one unit.
 * Existing company/category resolution happens before this boundary because
 * those records are shared lookup entities; failed canonical writes cannot
 * leave a job, source record, score, or release event partially persisted.
 */
export async function createCanonicalJobWithSquareJumpArtifacts(input: {
  insertJob: InsertJob;
  artifacts: Omit<Parameters<typeof persistSquareJumpArtifacts>[0], 'jobId'>;
}) {
  const identity = {
    juid: input.insertJob.juid ?? createJuid(),
    publicJobRef: input.insertJob.publicJobRef ?? createPublicJobRef({
      provinceCode: input.insertJob.provinceCode,
      categoryCode: input.insertJob.primaryCategoryCode,
    }),
  };

  if (isSqliteDatabase()) {
    const sqlite = getSqliteConnection();
    let createdJob: any;
    const persist = sqlite.transaction(() => {
      const createdAt = new Date().toISOString();
      const result = sqlite.prepare(`
        INSERT INTO jobs (
          juid, public_job_ref, title, description, location, country_code,
          province_code, municipality_code, location_code, primary_category_code,
          salary, job_type, work_mode, company_id, category_id, created_by_user_id,
          status, risk_status, application_link_status, verified_at,
          subscriber_release_at, member_release_at, public_release_at, expires_at,
          release_policy_version, is_featured, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        identity.juid,
        identity.publicJobRef,
        input.insertJob.title,
        input.insertJob.description,
        input.insertJob.location,
        input.insertJob.countryCode ?? 'ZA',
        input.insertJob.provinceCode ?? null,
        input.insertJob.municipalityCode ?? null,
        input.insertJob.locationCode ?? null,
        input.insertJob.primaryCategoryCode ?? null,
        input.insertJob.salary ?? null,
        input.insertJob.jobType,
        input.insertJob.workMode,
        input.insertJob.companyId,
        input.insertJob.categoryId,
        input.insertJob.createdByUserId ?? null,
        input.insertJob.status ?? 'active',
        input.insertJob.riskStatus ?? 'clear',
        input.insertJob.applicationLinkStatus ?? 'unverified',
        input.insertJob.verifiedAt?.toISOString() ?? null,
        input.insertJob.subscriberReleaseAt?.toISOString() ?? null,
        input.insertJob.memberReleaseAt?.toISOString() ?? null,
        input.insertJob.publicReleaseAt?.toISOString() ?? null,
        input.insertJob.expiresAt?.toISOString() ?? null,
        input.insertJob.releasePolicyVersion ?? null,
        input.insertJob.isFeatured ? 1 : 0,
        createdAt,
      );
      const row = sqlite.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid);
      createdJob = {
        id: Number(row.id),
        juid: row.juid,
        publicJobRef: row.public_job_ref,
        title: row.title,
        description: row.description,
        location: row.location,
        countryCode: row.country_code,
        provinceCode: row.province_code,
        municipalityCode: row.municipality_code,
        locationCode: row.location_code,
        primaryCategoryCode: row.primary_category_code,
        salary: row.salary,
        jobType: row.job_type,
        workMode: row.work_mode,
        companyId: row.company_id,
        categoryId: row.category_id,
        createdByUserId: row.created_by_user_id,
        status: row.status,
        riskStatus: row.risk_status,
        applicationLinkStatus: row.application_link_status,
        verifiedAt: row.verified_at,
        subscriberReleaseAt: row.subscriber_release_at,
        memberReleaseAt: row.member_release_at,
        publicReleaseAt: row.public_release_at,
        expiresAt: row.expires_at,
        releasePolicyVersion: row.release_policy_version,
        isFeatured: Boolean(row.is_featured),
        createdAt: row.created_at,
      };
      persistSquareJumpArtifacts({ ...input.artifacts, jobId: createdJob.id, sqliteTransaction: sqlite });
    });
    persist();
    return createdJob;
  }

  return db.transaction(async (transaction: typeof db) => {
    const [createdJob] = await transaction.insert(jobs).values({
      ...input.insertJob,
      ...identity,
      createdAt: new Date(),
    }).returning();
    await persistSquareJumpArtifacts({ ...input.artifacts, jobId: createdJob.id, transaction });
    return createdJob;
  });
}

export async function deleteCanonicalJobAfterFailedIngest(jobId: number) {
  await db.delete(jobs).where(eq(jobs.id, jobId));
}
