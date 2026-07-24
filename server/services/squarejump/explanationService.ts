import type { MatchScoreResult } from './matchScoringService';
import type { OpportunityScoreResult } from './opportunityScoringService';

export function userExplanation(input: {
  match: MatchScoreResult;
  earlyAccessEndsAt?: Date | null;
  applicationLinkVerified?: boolean;
}) {
  const reasons = [...input.match.reasons];
  if (input.applicationLinkVerified) reasons.push('The application link was recently verified');
  return {
    matchScore: input.match.score,
    reasons,
    missingRequirements: input.match.missingRequirements,
    earlyAccessEndsAt: input.earlyAccessEndsAt?.toISOString() ?? null,
  };
}

export function internalExplanation(opportunity: OpportunityScoreResult) {
  return {
    policyVersion: opportunity.policyVersion,
    opportunityScore: opportunity.score,
    components: opportunity.components,
    penalties: opportunity.penalties,
    riskStatus: opportunity.riskStatus,
  };
}
