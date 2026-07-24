export type PlacementInputs = {
  matchScore: number;
  opportunityScore: number;
  freshness: number;
  sessionIntent?: number;
  exploration?: number;
  weights?: Partial<{
    match: number;
    opportunity: number;
    freshness: number;
    session: number;
    exploration: number;
  }>;
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

export function calculatePlacementScore(input: PlacementInputs): number {
  const weights = {
    match: 55,
    opportunity: 25,
    freshness: 10,
    session: 5,
    exploration: 5,
    ...input.weights,
  };
  return Math.round(
    clamp(
      clamp(input.matchScore) * weights.match / 100 +
        clamp(input.opportunityScore) * weights.opportunity / 100 +
        clamp(input.freshness) * weights.freshness / 100 +
        clamp(input.sessionIntent ?? 50) * weights.session / 100 +
        clamp(input.exploration ?? 50) * weights.exploration / 100
    )
  );
}
