import {
  companies,
  jobRequirements,
  jobScoreHistory,
  jobScores,
  jobSourceRecords,
  jobs,
  squareJumpAuditLog,
} from '@shared/schema';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { calculateOpportunityScore, OPPORTUNITY_WEIGHTS, type OpportunityPenalty } from './opportunityScoringService';
import { getActivePolicy, numericPolicyWeights } from './scorePolicyRepository';

export async function recalculateOpportunityScore(
  juid: string,
  reason: string,
  actorUserId?: number
) {
  const [row] = await db
    .select({
      job: jobs,
      company: companies,
      source: jobSourceRecords,
    })
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .leftJoin(jobSourceRecords, eq(jobSourceRecords.jobId, jobs.id))
    .where(eq(jobs.juid, juid));
  if (!row) throw new Error('Job not found');

  const requirements = await db
    .select({ id: jobRequirements.id })
    .from(jobRequirements)
    .where(eq(jobRequirements.jobId, row.job.id));
  const referenceAt = row.job.verifiedAt ?? row.job.createdAt ?? new Date();
  const opportunityPolicy = await getActivePolicy('opportunity');
  const ageHours = Math.max(0, (Date.now() - new Date(referenceAt).getTime()) / 3_600_000);
  const penalties: OpportunityPenalty[] = [];
  if (row.job.riskStatus === 'quarantined') {
    penalties.push({ type: 'existing_quarantine', value: 100, severe: true });
  }
  if (!row.source?.applyUrl) penalties.push({ type: 'missing_application_link', value: 8 });
  if (row.job.applicationLinkStatus === 'broken') {
    penalties.push({ type: 'broken_application_link', value: 100, severe: true });
  }

  const score = calculateOpportunityScore({
    titlePresent: Boolean(row.job.title.trim()),
    dutiesPresent: row.job.description.length >= 80,
    requirementsPresent: requirements.length > 0,
    employmentTypePresent: Boolean(row.job.jobType),
    usableLocation: Boolean(row.job.location.trim()),
    salaryPresent: Boolean(row.job.salary),
    applicationInstructionsPresent: Boolean(row.source?.applyUrl),
    closingDatePresent: Boolean(row.job.expiresAt),
    organisationIdentified: Boolean(row.company.name),
    applicationLinkHealthy: row.job.applicationLinkStatus === 'verified',
    readableFormatting: row.job.description.length <= 10_000,
    employerVerified: row.company.verificationStatus === 'verified',
    verifiedDomain: Boolean(row.company.verifiedDomain),
    employerHistoryScore: row.company.trustStatus === 'trusted' ? 90 : 50,
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

  const now = new Date();
  const record = {
    jobId: row.job.id,
    scoreType: 'opportunity',
    scoreValue: score.score,
    componentScores: score.components,
    penalties: score.penalties,
    policyVersion: score.policyVersion,
    featureSnapshot: {
      sourceId: row.source?.sourceId ?? null,
      applicationLinkStatus: row.job.applicationLinkStatus,
    },
    calculatedAt: now,
  };

  await db.transaction(async (transaction: typeof db) => {
    const [existing] = await transaction
      .select({ id: jobScores.id })
      .from(jobScores)
      .where(eq(jobScores.jobId, row.job.id));
    if (existing) {
      await transaction.update(jobScores).set(record).where(eq(jobScores.id, existing.id));
    } else {
      await transaction.insert(jobScores).values(record);
    }
    await transaction.insert(jobScoreHistory).values({
      ...record,
      calculationReason: reason,
    });
    await transaction
      .update(jobs)
      .set({
        riskStatus: score.riskStatus,
        status: score.riskStatus === 'quarantined' ? 'quarantined' : row.job.status,
      })
      .where(eq(jobs.id, row.job.id));
    await transaction.insert(squareJumpAuditLog).values({
      actorUserId: actorUserId ?? null,
      action: 'job.recalculate',
      entityType: 'job',
      entityId: juid,
      afterState: score,
      metadata: { reason },
      createdAt: now,
    });
  });

  return score;
}
