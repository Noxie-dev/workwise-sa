import { describe, expect, it } from 'vitest';
import { jobIngestSchema } from '@shared/job-ingest-schema';
import { matchProfileSchema } from '@shared/squarejump-contracts';
import {
  buildFingerprints,
  calculateDuplicateConfidence,
  duplicateAction,
} from '../../services/squarejump/deduplicationService';
import { createJuid, createPublicJobRef } from '../../services/squarejump/identityService';
import { calculateMatchScore } from '../../services/squarejump/matchScoringService';
import { calculateOpportunityScore } from '../../services/squarejump/opportunityScoringService';
import { calculatePlacementScore } from '../../services/squarejump/placementService';
import { createReleaseSchedule } from '../../services/squarejump/releasePolicyService';
import { extractRequirements } from '../../services/squarejump/requirementsService';
import { validatePolicyWeights } from '../../services/squarejump/scorePolicyRepository';
import { classifyJob, normalizeJobLocation } from '../../services/squarejump/taxonomyService';

function ingestJob() {
  return jobIngestSchema.parse({
    title: 'Security Officer',
    description: 'Must have PSIRA Grade C and guard the customer site.',
    companyName: 'Example Security (Pty) Ltd',
    location: 'Cape Town',
    salaryText: 'R8 000 per month',
    jobType: 'Full-time',
    workMode: 'On-site',
    sourceSite: 'gumtree',
    sourceUrl: 'https://example.test/jobs/123',
    externalId: '123',
    postedAt: '2026-07-20T00:00:00.000Z',
    applyUrl: 'https://example.test/apply/123?utm_source=feed',
    metadata: { isAnonymized: true, complianceVersion: 'POPIA_v1' },
  });
}

describe('SquareJUMP identity and deduplication', () => {
  it('creates opaque, time-sortable identities without mutable routing data', () => {
    const juid = createJuid(new Date('2026-07-24T00:00:00.000Z'));
    expect(juid).toMatch(/^juid_sq_[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(juid).not.toContain('SEC');
    expect(
      createPublicJobRef({
        provinceCode: 'WC',
        categoryCode: 'SEC',
        now: new Date('2026-07-24T00:00:00.000Z'),
      })
    ).toMatch(/^TS-JB-WC-SEC-20260724-[0-9A-HJKMNP-TV-Z]{6}$/);
  });

  it('uses separate exact and content fingerprints and strips tracking parameters', () => {
    const first = buildFingerprints(ingestJob());
    const second = buildFingerprints({
      ...ingestJob(),
      sourceSite: 'partner-feed',
      externalId: 'different-source-id',
      applyUrl: 'https://example.test/apply/123?utm_campaign=other',
    });
    expect(first.exact).toBe(second.exact);
    expect(first.content).toBe(second.content);
    expect(
      buildFingerprints({ ...ingestJob(), applyUrl: null }).exact
    ).toBe('');
    expect(duplicateAction(70, false)).toBe('review');
    expect(
      calculateDuplicateConfidence({
        externalIdMatches: true,
        applicationUrlMatches: false,
        exactFingerprintMatches: false,
        contentFingerprintMatches: false,
        organisationMatches: true,
        locationMatches: true,
      })
    ).toBe(100);
  });
});

describe('SquareJUMP classification, scoring, and release', () => {
  it('normalizes common South African job locations for structured matching', () => {
    expect(normalizeJobLocation('Security officer - Cape Town')).toEqual({
      locationCode: 'CPT',
      provinceCode: 'WC',
    });
    expect(normalizeJobLocation('Remote / nationwide')).toEqual({
      locationCode: null,
      provinceCode: null,
    });
  });

  it('classifies deterministically and extracts mandatory requirements', () => {
    const classification = classifyJob(ingestJob());
    const requirements = extractRequirements(ingestJob().description);
    expect(classification.primaryCategoryCode).toBe('SEC');
    expect(classification.confidence).toBeGreaterThanOrEqual(90);
    expect(requirements).toContainEqual(
      expect.objectContaining({
        code: 'PSIRA-C',
        necessity: 'mandatory',
      })
    );
  });

  it('separates opportunity quality from personal relevance and caps missing hard requirements', () => {
    const opportunity = calculateOpportunityScore({
      titlePresent: true,
      dutiesPresent: true,
      requirementsPresent: true,
      employmentTypePresent: true,
      usableLocation: true,
      salaryPresent: true,
      applicationInstructionsPresent: true,
      closingDatePresent: true,
      organisationIdentified: true,
      applicationLinkHealthy: true,
      readableFormatting: true,
      employerVerified: true,
      verifiedDomain: true,
      employerHistoryScore: 80,
      employerReportRateScore: 90,
      ageHours: 4,
      engagementQuality: 60,
      applicationPerformance: 60,
      sourceReliability: 90,
      marketSignal: 50,
    });
    const profile = matchProfileSchema.parse({
      preferredCategoryCodes: ['SEC'],
      preferredLocationCodes: ['CPT'],
      workModes: ['on-site'],
      employmentTypes: ['Full-time'],
      skills: [],
      qualifications: [],
      licences: [],
      certifications: [],
    });
    const match = calculateMatchScore(profile, {
      primaryCategoryCode: 'SEC',
      locationCode: 'CPT',
      workMode: 'on-site',
      employmentType: 'Full-time',
      requirements: extractRequirements(ingestJob().description),
    });
    expect(opportunity.score).toBeGreaterThan(70);
    expect(match.score).toBeLessThanOrEqual(25);
    expect(match.missingRequirements).toEqual(['PSIRA Grade C']);
    expect(
      calculatePlacementScore({
        matchScore: match.score,
        opportunityScore: opportunity.score,
        freshness: opportunity.components.freshness,
      })
    ).toBeLessThan(opportunity.score);
  });

  it('quarantines severe risks instead of treating them as ordinary penalties', () => {
    const result = calculateOpportunityScore({
      titlePresent: true,
      dutiesPresent: true,
      requirementsPresent: true,
      employmentTypePresent: true,
      usableLocation: true,
      salaryPresent: true,
      applicationInstructionsPresent: true,
      closingDatePresent: true,
      organisationIdentified: true,
      applicationLinkHealthy: false,
      readableFormatting: true,
      employerVerified: true,
      verifiedDomain: true,
      employerHistoryScore: 80,
      employerReportRateScore: 80,
      ageHours: 1,
      engagementQuality: 50,
      applicationPerformance: 50,
      sourceReliability: 80,
      marketSignal: 50,
      penalties: [{ type: 'suspected_fraud', value: 100, severe: true }],
    });
    expect(result).toMatchObject({ score: 0, riskStatus: 'quarantined' });
  });

  it('shortens exclusivity for urgent jobs and validates policy totals', () => {
    const verifiedAt = new Date('2026-07-24T00:00:00.000Z');
    const schedule = createReleaseSchedule({
      verifiedAt,
      expiresAt: new Date('2026-07-25T12:00:00.000Z'),
    });
    expect(schedule.urgencyRule).toBe('three-hour');
    expect(schedule.publicReleaseAt.toISOString()).toBe('2026-07-24T03:00:00.000Z');
    const unverified = createReleaseSchedule({ verifiedAt, earlyAccessEligible: false });
    expect(unverified.urgencyRule).toBe('not-eligible');
    expect(unverified.publicReleaseAt).toEqual(verifiedAt);
    expect(
      validatePolicyWeights({
        policyType: 'placement',
        version: 'test-v1',
        weights: { match: 55, opportunity: 25, freshness: 10, session: 5, exploration: 5 },
        thresholds: {},
      }).valid
    ).toBe(true);
  });
});
