import {
  companies,
  jobClassifications,
  jobRequirements,
  jobScores,
  jobSourceRecords,
  jobs,
  userJobMatches,
  userJobPreferences,
  userMatchProfiles,
  users,
} from '@shared/schema';
import {
  matchProfileSchema,
  type ClassifiedRequirement,
  type MatchProfile,
  type RecommendationQuery,
} from '@shared/squarejump-contracts';
import { and, asc, desc, eq, gte, gt, inArray, isNull, lt, lte, ne, or, sql } from 'drizzle-orm';
import { db } from '../../db';
import { entitlementService } from '../entitlementService';
import { calculateMatchScore, MATCH_WEIGHTS } from './matchScoringService';
import { calculatePlacementScore } from './placementService';
import { calculateFreshness } from './opportunityScoringService';
import { getActivePolicy, numericPolicyWeights } from './scorePolicyRepository';

function arrayValue(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function objectValue(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function salaryCents(value: string | null): number | null {
  if (!value) return null;
  const match = value.replace(/,/g, '').match(/(\d+(?:\.\d{1,2})?)/);
  return match ? Math.round(Number(match[1]) * 100) : null;
}

async function getProfile(userId: number): Promise<MatchProfile> {
  const [[profile], [legacy], [user]] = await Promise.all([
    db.select().from(userMatchProfiles).where(eq(userMatchProfiles.userId, userId)),
    db.select().from(userJobPreferences).where(eq(userJobPreferences.userId, userId)),
    db.select().from(users).where(eq(users.id, userId)),
  ]);
  if (profile) {
    return matchProfileSchema.parse({
      preferredCategoryCodes: arrayValue(profile.preferredCategoryCodes),
      preferredOccupationCodes: arrayValue(profile.preferredOccupationCodes),
      preferredLocationCodes: arrayValue(profile.preferredLocationCodes),
      travelRadiusKm: profile.travelRadiusKm,
      workModes: arrayValue(profile.workModes),
      employmentTypes: arrayValue(profile.employmentTypes),
      minimumSalaryCents: profile.minimumSalaryCents,
      skills: arrayValue(profile.skills),
      qualifications: arrayValue(profile.qualifications),
      licences: arrayValue(profile.licences),
      certifications: arrayValue(profile.certifications),
      behaviouralPersonalisationEnabled: profile.behaviouralPersonalisationEnabled,
    });
  }
  const preferences = objectValue(user?.preferences);
  return matchProfileSchema.parse({
    preferredCategoryCodes: [],
    preferredOccupationCodes: [],
    preferredLocationCodes: arrayValue(legacy?.preferredLocations),
    travelRadiusKm: 50,
    workModes: arrayValue(preferences.workMode),
    employmentTypes: arrayValue(legacy?.preferredJobTypes),
    minimumSalaryCents: legacy?.minSalary ? legacy.minSalary * 100 : null,
    skills: arrayValue(user?.skills),
    qualifications: [],
    licences: [],
    certifications: [],
    behaviouralPersonalisationEnabled: true,
  });
}

function requirementsByJob(rows: Array<typeof jobRequirements.$inferSelect>) {
  const result = new Map<number, ClassifiedRequirement[]>();
  for (const row of rows) {
    const values = result.get(row.jobId) ?? [];
    values.push({
      type: row.requirementType as ClassifiedRequirement['type'],
      code: row.code ?? undefined,
      label: row.label,
      necessity: row.necessity as ClassifiedRequirement['necessity'],
      confidence: row.confidence,
      source: row.source as ClassifiedRequirement['source'],
    });
    result.set(row.jobId, values);
  }
  return result;
}

export async function materializeUserJobMatches(userId: number, batchSize = 500) {
  const [profile, entitlements, matchPolicy, placementPolicy] = await Promise.all([
    getProfile(userId),
    entitlementService.getEntitlementsForUser(userId),
    getActivePolicy('match'),
    getActivePolicy('placement'),
  ]);
  const now = new Date();
  const releaseAt = entitlements.workwisePlusActive ? jobs.subscriberReleaseAt : jobs.memberReleaseAt;
  const weights = numericPolicyWeights(matchPolicy?.weights, MATCH_WEIGHTS) as Partial<typeof MATCH_WEIGHTS>;
  const placementWeights = numericPolicyWeights(
    placementPolicy?.weights,
    { match: 55, opportunity: 25, freshness: 10, session: 5, exploration: 5 },
  ) as { match: number; opportunity: number; freshness: number; session: number; exploration: number };
  let lastJobId = 0;
  let materialized = 0;
  while (true) {
    const batch = await db
      .select({ job: jobs, score: jobScores, classification: jobClassifications })
      .from(jobs)
      .leftJoin(jobScores, and(eq(jobScores.jobId, jobs.id), eq(jobScores.scoreType, 'opportunity')))
      .leftJoin(jobClassifications, eq(jobClassifications.jobId, jobs.id))
      .where(and(
        gt(jobs.id, lastJobId),
        eq(jobs.status, 'active'),
        ne(jobs.riskStatus, 'quarantined'),
        or(isNull(releaseAt), lte(releaseAt, now)),
      ))
      .orderBy(asc(jobs.id))
      .limit(batchSize);
    if (!batch.length) break;
    lastJobId = batch[batch.length - 1].job.id;
    const ids = batch.map(row => row.job.id);
    const requirements = await db.select().from(jobRequirements).where(inArray(jobRequirements.jobId, ids));
    const byJob = requirementsByJob(requirements);
    const values = batch.map(row => {
      const match = calculateMatchScore(profile, {
        primaryCategoryCode: row.job.primaryCategoryCode ?? 'OTH',
        secondaryCategoryCodes: arrayValue(row.classification?.secondaryCategoryCodes),
        occupationCode: row.classification?.occupationCode,
        locationCode: row.job.locationCode,
        workMode: row.job.workMode,
        employmentType: row.job.jobType,
        salaryCents: salaryCents(row.job.salary),
        requirements: byJob.get(row.job.id) ?? [],
      }, {}, { weights, policyVersion: matchPolicy?.version });
      const components = objectValue(row.score?.componentScores);
      const placement = calculatePlacementScore({
        matchScore: match.score,
        opportunityScore: row.score?.scoreValue ?? 50,
        freshness: Number(components.freshness ?? calculateFreshness(0)),
        weights: placementWeights,
      });
      return {
        userId,
        jobId: row.job.id,
        matchScore: match.score,
        placementScore: placement,
        componentScores: match.components,
        reasons: match.reasons,
        missingRequirements: match.missingRequirements,
        policyVersion: match.policyVersion,
        calculatedAt: now,
      };
    });
    await db.insert(userJobMatches).values(values).onConflictDoUpdate({
      target: [userJobMatches.userId, userJobMatches.jobId],
      set: {
        matchScore: sql`excluded.match_score`,
        placementScore: sql`excluded.placement_score`,
        componentScores: sql`excluded.component_scores`,
        reasons: sql`excluded.reasons`,
        missingRequirements: sql`excluded.missing_requirements`,
        policyVersion: sql`excluded.policy_version`,
        calculatedAt: now,
      },
    });
    materialized += values.length;
  }
  return { userId, materialized };
}

export async function refreshAllUserJobMatches(batchSize = 500) {
  const allUsers = await db.select({ id: users.id }).from(users).orderBy(asc(users.id));
  let materialized = 0;
  for (const user of allUsers) {
    materialized += (await materializeUserJobMatches(user.id, batchSize)).materialized;
  }
  return { users: allUsers.length, materialized };
}

export async function getMaterializedRecommendations(
  userId: number,
  query: RecommendationQuery,
  cursor?: { placementScore: number; createdAt: string; jobId: number },
) {
  const [entitlements, matchPolicy, placementPolicy, opportunityPolicy] = await Promise.all([
    entitlementService.getEntitlementsForUser(userId),
    getActivePolicy('match'),
    getActivePolicy('placement'),
    getActivePolicy('opportunity'),
  ]);
  const now = new Date();
  const releaseAt = entitlements.workwisePlusActive ? jobs.subscriberReleaseAt : jobs.memberReleaseAt;
  const policyVersions = [
    opportunityPolicy?.version ?? 'opportunity-v1.0',
    matchPolicy?.version ?? 'match-v1.0',
    placementPolicy?.version ?? 'placement-v1.0',
  ].join('|');
  const filters = [
    eq(userJobMatches.userId, userId),
    gte(userJobMatches.matchScore, query.minimumMatch),
    eq(jobs.status, 'active'),
    ne(jobs.riskStatus, 'quarantined'),
    or(isNull(releaseAt), lte(releaseAt, now)),
  ];
  if (query.category) filters.push(eq(jobs.primaryCategoryCode, query.category));
  if (query.location) filters.push(sql`lower(${jobs.location}) like ${`%${query.location.toLowerCase()}%`}`);
  if (query.employmentType) filters.push(eq(jobs.jobType, query.employmentType));
  if (cursor) {
    filters.push(or(
      lt(userJobMatches.placementScore, cursor.placementScore),
      and(
        eq(userJobMatches.placementScore, cursor.placementScore),
        lt(jobs.createdAt, new Date(cursor.createdAt)),
      ),
      and(
        eq(userJobMatches.placementScore, cursor.placementScore),
        eq(jobs.createdAt, new Date(cursor.createdAt)),
        lt(jobs.id, cursor.jobId),
      ),
    ));
  }
  const rows = await db
    .select({ match: userJobMatches, job: jobs, company: companies, score: jobScores, source: jobSourceRecords })
    .from(userJobMatches)
    .innerJoin(jobs, eq(jobs.id, userJobMatches.jobId))
    .innerJoin(companies, eq(companies.id, jobs.companyId))
    .leftJoin(jobScores, and(eq(jobScores.jobId, jobs.id), eq(jobScores.scoreType, 'opportunity')))
    .leftJoin(jobSourceRecords, eq(jobSourceRecords.jobId, jobs.id))
    .where(and(...filters))
    .orderBy(desc(userJobMatches.placementScore), desc(jobs.createdAt), desc(jobs.id))
    .limit(query.limit + 1);
  return { rows, entitlements, policyVersions, now };
}
