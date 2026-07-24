export type NotificationEligibilityInput = {
  opportunityScore: number;
  matchScore: number;
  active: boolean;
  applicationPathHealthy: boolean;
  alreadyNotified: boolean;
  channelConsented: boolean;
  withinFrequencyCap: boolean;
  riskStatus: string;
  opportunityThreshold?: number;
  matchThreshold?: number;
};

export function notificationEligibility(input: NotificationEligibilityInput) {
  const reasons: string[] = [];
  if (input.opportunityScore < (input.opportunityThreshold ?? 70))
    reasons.push('opportunity_score');
  if (input.matchScore < (input.matchThreshold ?? 75)) reasons.push('match_score');
  if (!input.active) reasons.push('inactive');
  if (!input.applicationPathHealthy) reasons.push('application_path');
  if (input.alreadyNotified) reasons.push('duplicate');
  if (!input.channelConsented) reasons.push('consent');
  if (!input.withinFrequencyCap) reasons.push('frequency_cap');
  if (input.riskStatus !== 'clear') reasons.push('risk');
  return { eligible: reasons.length === 0, reasons };
}
