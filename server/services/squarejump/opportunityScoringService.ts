import { OPPORTUNITY_POLICY_VERSION } from '@shared/squarejump-contracts';

export const OPPORTUNITY_WEIGHTS = {
  listingQuality: 25,
  employerTrust: 20,
  freshness: 15,
  engagementQuality: 15,
  applicationPerformance: 10,
  sourceReliability: 10,
  marketSignal: 5,
} as const;

export type OpportunityPenalty = {
  type: string;
  value: number;
  severe?: boolean;
};

export type OpportunityFeatures = {
  titlePresent: boolean;
  dutiesPresent: boolean;
  requirementsPresent: boolean;
  employmentTypePresent: boolean;
  usableLocation: boolean;
  salaryPresent: boolean;
  applicationInstructionsPresent: boolean;
  closingDatePresent: boolean;
  organisationIdentified: boolean;
  applicationLinkHealthy: boolean;
  readableFormatting: boolean;
  employerVerified: boolean;
  verifiedDomain: boolean;
  employerHistoryScore: number;
  employerReportRateScore: number;
  ageHours: number;
  categoryHalfLifeHours?: number;
  engagementQuality: number;
  applicationPerformance: number;
  sourceReliability: number;
  marketSignal: number;
  penalties?: OpportunityPenalty[];
};

export type OpportunityScoreResult = {
  score: number;
  components: Record<keyof typeof OPPORTUNITY_WEIGHTS, number>;
  penalties: OpportunityPenalty[];
  policyVersion: string;
  riskStatus: 'clear' | 'penalised' | 'quarantined';
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function calculateFreshness(ageHours: number, halfLifeHours = 168): number {
  if (ageHours <= 0) return 100;
  return clamp(100 * 2 ** (-ageHours / Math.max(1, halfLifeHours)));
}

export function calculateOpportunityScore(
  features: OpportunityFeatures,
  options: { weights?: Partial<typeof OPPORTUNITY_WEIGHTS>; policyVersion?: string } = {},
): OpportunityScoreResult {
  const listingSignals = [
    features.titlePresent,
    features.dutiesPresent,
    features.requirementsPresent,
    features.employmentTypePresent,
    features.usableLocation,
    features.salaryPresent,
    features.applicationInstructionsPresent,
    features.closingDatePresent,
    features.organisationIdentified,
    features.applicationLinkHealthy,
    features.readableFormatting,
  ].map(present => (present ? 100 : 0));

  const components = {
    listingQuality: clamp(average(listingSignals)),
    employerTrust: clamp(
      average([
        features.employerVerified ? 100 : 35,
        features.verifiedDomain ? 100 : 35,
        features.employerHistoryScore,
        features.employerReportRateScore,
      ])
    ),
    freshness: calculateFreshness(features.ageHours, features.categoryHalfLifeHours),
    engagementQuality: clamp(features.engagementQuality),
    applicationPerformance: clamp(features.applicationPerformance),
    sourceReliability: clamp(features.sourceReliability),
    marketSignal: clamp(features.marketSignal),
  };

  const weights = { ...OPPORTUNITY_WEIGHTS, ...options.weights };
  const weighted = Object.entries(weights).reduce((total, [key, weight]) => {
    return total + (components[key as keyof typeof components] * weight) / 100;
  }, 0);
  const penalties = features.penalties ?? [];
  const penaltyTotal = penalties.reduce((sum, penalty) => sum + Math.max(0, penalty.value), 0);
  const quarantined = penalties.some(penalty => penalty.severe);

  return {
    score: quarantined ? 0 : Math.round(clamp(weighted - penaltyTotal)),
    components: Object.fromEntries(
      Object.entries(components).map(([key, value]) => [key, Math.round(value)])
    ) as OpportunityScoreResult['components'],
    penalties,
    policyVersion: options.policyVersion ?? OPPORTUNITY_POLICY_VERSION,
    riskStatus: quarantined ? 'quarantined' : penaltyTotal > 0 ? 'penalised' : 'clear',
  };
}
