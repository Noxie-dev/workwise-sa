import crypto from 'crypto';
import {
  companies,
  jobClassifications,
  jobRequirements,
  jobScores,
  jobSourceRecords,
  jobs,
  recommendationExposures,
  userJobMatches,
  userJobPreferences,
  userMatchProfiles,
  users,
} from '@shared/schema';
import {
  matchProfileSchema,
  type MatchProfile,
  type RecommendationQuery,
  type ClassifiedRequirement,
} from '@shared/squarejump-contracts';
import { and, desc, eq, inArray, isNull, lte, ne, or, sql } from 'drizzle-orm';
import { db } from '../../db';
import { entitlementService } from '../entitlementService';
import { userExplanation } from './explanationService';
import { calculateMatchScore } from './matchScoringService';
import { MATCH_WEIGHTS } from './matchScoringService';
import { OPPORTUNITY_WEIGHTS } from './opportunityScoringService';
import { getActivePolicy, numericPolicyWeights } from './scorePolicyRepository';
import { calculatePlacementScore } from './placementService';

type RecommendationRow = {
  job: typeof jobs.$inferSelect;
  company: typeof companies.$inferSelect;
  score: typeof jobScores.$inferSelect | null;
  classification: typeof jobClassifications.$inferSelect | null;
  source: typeof jobSourceRecords.$inferSelect | null;
};

type RecommendationCursor = {
  placementScore: number;
  createdAt: string;
  jobId: number;
  policyVersions: string;
};

const cursorSecret = () =>
  process.env.SQUAREJUMP_CURSOR_SECRET ??
  process.env.SESSION_SECRET ??
  'squarejump-development-cursor-secret';

function encodeCursor(cursor: RecommendationCursor): string {
  const payload = Buffer.from(JSON.stringify(cursor)).toString('base64url');
  const signature = crypto.createHmac('sha256', cursorSecret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function decodeCursor(value: string, policyVersions: string): RecommendationCursor {
  const [payload, signature] = value.split('.');
  if (!payload || !signature) throw new Error('Invalid recommendation cursor');
  const expected = crypto.createHmac('sha256', cursorSecret()).update(payload).digest('base64url');
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== providedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
    throw new Error('Invalid recommendation cursor signature');
  }
  let parsed: RecommendationCursor;
  try {
    parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as RecommendationCursor;
  } catch {
    throw new Error('Invalid recommendation cursor payload');
  }
  if (
    !Number.isInteger(parsed.placementScore) ||
    !Number.isInteger(parsed.jobId) ||
    !parsed.createdAt ||
    parsed.policyVersions !== policyVersions
  ) {
    throw new Error('Recommendation cursor is stale or malformed');
  }
  return parsed;
}

function arrayValue(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string')
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

function objectValue(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value))
    return value as Record<string, unknown>;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
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

  const userPreferences = objectValue(user?.preferences);
  return matchProfileSchema.parse({
    preferredCategoryCodes: [],
    preferredOccupationCodes: [],
    preferredLocationCodes: arrayValue(legacy?.preferredLocations),
    travelRadiusKm: 50,
    workModes: arrayValue(userPreferences.workMode),
    employmentTypes: arrayValue(legacy?.preferredJobTypes),
    minimumSalaryCents: legacy?.minSalary ? legacy.minSalary * 100 : null,
    skills: arrayValue(user?.skills),
    qualifications: [],
    licences: [],
    certifications: [],
    behaviouralPersonalisationEnabled: true,
  });
}

function validDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function visibleAt(job: typeof jobs.$inferSelect, subscriber: boolean, now: Date): boolean {
  if (job.status !== 'active' || job.riskStatus === 'quarantined') return false;
  const expiresAt = validDate(job.expiresAt);
  if (expiresAt && expiresAt <= now) return false;
  const releaseAt = validDate(subscriber ? job.subscriberReleaseAt : job.memberReleaseAt);
  return !releaseAt || releaseAt <= now;
}

export async function getSquareJumpRecommendations(userId: number, query: RecommendationQuery) {
  const [profile, entitlements, opportunityPolicy, matchPolicy, placementPolicy] = await Promise.all([
    getProfile(userId),
    entitlementService.getEntitlementsForUser(userId),
    getActivePolicy('opportunity'),
    getActivePolicy('match'),
    getActivePolicy('placement'),
  ]);

  const now = new Date();
  const releaseAt = entitlements.workwisePlusActive ? jobs.subscriberReleaseAt : jobs.memberReleaseAt;
  const filters = [
    eq(jobs.status, 'active'),
    ne(jobs.riskStatus, 'quarantined'),
    or(isNull(releaseAt), lte(releaseAt, now)),
  ];
  if (query.category) filters.push(eq(jobs.primaryCategoryCode, query.category));
  if (query.location) filters.push(sql`lower(${jobs.location}) like ${`%${query.location.toLowerCase()}%`}`);
  if (query.employmentType) filters.push(eq(jobs.jobType, query.employmentType));
  const rows = await db
    .select({
      job: jobs,
      company: companies,
      score: jobScores,
      classification: jobClassifications,
      source: jobSourceRecords,
    })
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .leftJoin(
      jobScores,
      and(eq(jobScores.jobId, jobs.id), eq(jobScores.scoreType, 'opportunity'))
    )
    .leftJoin(jobClassifications, eq(jobClassifications.jobId, jobs.id))
    .leftJoin(jobSourceRecords, eq(jobSourceRecords.jobId, jobs.id))
    .where(and(...filters))
    .orderBy(desc(jobs.createdAt), desc(jobs.id))
    .limit(Math.min(2000, Math.max(500, query.limit * 20)));
  const typedRows = rows as RecommendationRow[];
  const uniqueRows = Array.from(
    new Map<number, RecommendationRow>(typedRows.map(row => [row.job.id, row])).values()
  );
  const candidateRows = uniqueRows.filter(row => {
    if (!visibleAt(row.job, entitlements.workwisePlusActive, now)) return false;
    if (query.category && row.job.primaryCategoryCode !== query.category) return false;
    if (query.location && !row.job.location.toLowerCase().includes(query.location.toLowerCase()))
      return false;
    if (query.employmentType && row.job.jobType !== query.employmentType) return false;
    return true;
  });

  const candidateIds = candidateRows.map(row => row.job.id);
  const requirementRows = candidateIds.length
    ? await db.select().from(jobRequirements).where(inArray(jobRequirements.jobId, candidateIds))
    : [];
  const requirementsByJob = new Map<number, ClassifiedRequirement[]>();
  for (const requirement of requirementRows) {
    const current = requirementsByJob.get(requirement.jobId) ?? [];
    current.push({
      type: requirement.requirementType as ClassifiedRequirement['type'],
      code: requirement.code ?? undefined,
      label: requirement.label,
      necessity: requirement.necessity as ClassifiedRequirement['necessity'],
      confidence: requirement.confidence,
      source: requirement.source as ClassifiedRequirement['source'],
    });
    requirementsByJob.set(requirement.jobId, current);
  }

  const policyVersions = [
    opportunityPolicy?.version ?? 'opportunity-v1.0',
    matchPolicy?.version ?? 'match-v1.0',
    placementPolicy?.version ?? 'placement-v1.0',
  ].join('|');
  const ranked = candidateRows
    .map(row => {
      const opportunityScore = row.score?.scoreValue ?? 50;
      const opportunityComponents = objectValue(row.score?.componentScores);
      const match = calculateMatchScore(profile, {
        primaryCategoryCode: row.job.primaryCategoryCode ?? 'OTH',
        secondaryCategoryCodes: arrayValue(row.classification?.secondaryCategoryCodes),
        occupationCode: row.classification?.occupationCode,
        locationCode: row.job.locationCode,
        workMode: row.job.workMode,
        employmentType: row.job.jobType,
        salaryCents: salaryCents(row.job.salary),
        requirements: requirementsByJob.get(row.job.id) ?? [],
      }, {}, {
        weights: numericPolicyWeights(matchPolicy?.weights, MATCH_WEIGHTS) as Partial<typeof MATCH_WEIGHTS>,
        policyVersion: matchPolicy?.version,
      });
      const placementScore = calculatePlacementScore({
        matchScore: match.score,
        opportunityScore,
        freshness: Number(opportunityComponents.freshness ?? 50),
        weights: numericPolicyWeights(
          placementPolicy?.weights,
          { match: 55, opportunity: 25, freshness: 10, session: 5, exploration: 5 },
        ) as { match: number; opportunity: number; freshness: number; session: number; exploration: number },
      });
      return { row, match, opportunityScore, placementScore };
    })
    .filter(item => item.match.score >= query.minimumMatch)
    .sort((left, right) => {
      const scoreDifference = right.placementScore - left.placementScore;
      if (scoreDifference !== 0) return scoreDifference;
      const leftCreated = new Date(left.row.job.createdAt ?? 0).getTime();
      const rightCreated = new Date(right.row.job.createdAt ?? 0).getTime();
      if (rightCreated !== leftCreated) return rightCreated - leftCreated;
      return right.row.job.id - left.row.job.id;
    });

  const cursor = query.cursor ? decodeCursor(query.cursor, policyVersions) : null;
  const afterCursor = cursor
    ? ranked.filter(item => {
        const itemCreatedAt = new Date(item.row.job.createdAt ?? 0).getTime();
        const cursorCreatedAt = new Date(cursor.createdAt).getTime();
        if (item.placementScore !== cursor.placementScore) return item.placementScore < cursor.placementScore;
        if (itemCreatedAt !== cursorCreatedAt) return itemCreatedAt < cursorCreatedAt;
        return item.row.job.id < cursor.jobId;
      })
    : ranked;
  const page = afterCursor.slice(0, query.limit);

  const exposures = page.map((item, index) => ({
    userId,
    jobId: item.row.job.id,
    trackingToken: crypto.randomBytes(24).toString('base64url'),
    surface: query.surface,
    position: index + 1,
    releaseStage: entitlements.workwisePlusActive ? 'subscriber' : 'member',
    exposedAt: now,
  }));
  if (exposures.length) await db.insert(recommendationExposures).values(exposures);

  if (page.length) {
    await db
      .insert(userJobMatches)
      .values(page.map(item => ({
        userId,
        jobId: item.row.job.id,
        matchScore: item.match.score,
        placementScore: item.placementScore,
        componentScores: item.match.components,
        reasons: item.match.reasons,
        missingRequirements: item.match.missingRequirements,
        policyVersion: item.match.policyVersion,
        calculatedAt: now,
      })))
      .onConflictDoUpdate({
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
  }

  return {
    items: page.map((item, index) => ({
      job: {
        ...item.row.job,
        company: item.row.company,
        applyUrl: item.row.source?.applyUrl ?? null,
      },
      opportunityScore: item.opportunityScore,
      placementScore: item.placementScore,
      ...userExplanation({
        match: item.match,
        earlyAccessEndsAt: entitlements.workwisePlusActive ? item.row.job.memberReleaseAt : null,
        applicationLinkVerified: item.row.job.applicationLinkStatus === 'verified',
      }),
      releaseState: entitlements.workwisePlusActive ? 'subscriber' : 'member',
      trackingToken: exposures[index].trackingToken,
    })),
    nextCursor:
      page.length > 0 && afterCursor.length > page.length
        ? encodeCursor({
            placementScore: page[page.length - 1].placementScore,
            createdAt: new Date(page[page.length - 1].row.job.createdAt ?? 0).toISOString(),
            jobId: page[page.length - 1].row.job.id,
            policyVersions,
          })
        : null,
    policyVersions: {
      match: matchPolicy?.version ?? 'match-v1.0',
      placement: placementPolicy?.version ?? 'placement-v1.0',
      opportunity: opportunityPolicy?.version ?? 'opportunity-v1.0',
      },
  };
}
