import {
  MATCH_POLICY_VERSION,
  type ClassifiedRequirement,
  type MatchProfile,
} from '@shared/squarejump-contracts';

export const MATCH_WEIGHTS = {
  category: 25,
  location: 20,
  requirements: 20,
  skills: 10,
  employmentType: 10,
  salary: 5,
  behavioural: 5,
  exploration: 5,
} as const;

export type MatchableJob = {
  primaryCategoryCode: string;
  secondaryCategoryCodes?: string[];
  occupationCode?: string | null;
  locationCode?: string | null;
  workMode: string;
  employmentType: string;
  salaryCents?: number | null;
  skills?: string[];
  requirements?: ClassifiedRequirement[];
};

export type MatchContext = {
  distanceKm?: number | null;
  behaviouralCompatibility?: number;
  exploration?: number;
};

export type MatchScoreResult = {
  score: number;
  components: Record<keyof typeof MATCH_WEIGHTS, number>;
  reasons: string[];
  missingRequirements: string[];
  policyVersion: string;
};

function normalize(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function includesNormalized(values: string[], expected: string): boolean {
  const target = normalize(expected);
  return values.some(value => normalize(value) === target);
}

function overlapScore(expected: string[], actual: string[]): number {
  if (!expected.length) return 50;
  const actualSet = new Set(actual.map(normalize));
  return Math.round(
    (100 * expected.filter(item => actualSet.has(normalize(item))).length) / expected.length
  );
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

export function calculateMatchScore(
  profile: MatchProfile,
  job: MatchableJob,
  context: MatchContext = {},
  options: { weights?: Partial<typeof MATCH_WEIGHTS>; policyVersion?: string } = {},
): MatchScoreResult {
  const jobCategories = [job.primaryCategoryCode, ...(job.secondaryCategoryCodes ?? [])];
  const category =
    profile.preferredCategoryCodes.length === 0
      ? 50
      : profile.preferredCategoryCodes.some(code => jobCategories.includes(code))
        ? 100
        : 0;

  let location = 50;
  if (job.workMode.toLowerCase() === 'remote' && profile.workModes.includes('remote')) {
    location = 100;
  } else if (job.locationCode && profile.preferredLocationCodes.includes(job.locationCode)) {
    location = 100;
  } else if (context.distanceKm != null) {
    location =
      context.distanceKm <= profile.travelRadiusKm
        ? Math.max(60, 100 - (context.distanceKm / Math.max(1, profile.travelRadiusKm)) * 40)
        : 0;
  }

  const requirements = job.requirements ?? [];
  const missingRequirements: string[] = [];
  let satisfied = 0;
  let evaluated = 0;
  for (const requirement of requirements) {
    if (requirement.necessity === 'inferred' || requirement.necessity === 'unknown') continue;
    evaluated += 1;
    const userValues =
      requirement.type === 'licence'
        ? profile.licences
        : requirement.type === 'certification'
          ? profile.certifications
          : requirement.type === 'qualification'
            ? profile.qualifications
            : profile.skills;
    const hasRequirement =
      includesNormalized(userValues, requirement.code ?? requirement.label) ||
      includesNormalized(userValues, requirement.label);
    if (hasRequirement) satisfied += 1;
    else if (requirement.necessity === 'mandatory') missingRequirements.push(requirement.label);
  }
  const requirementScore = evaluated === 0 ? 70 : (100 * satisfied) / evaluated;
  const skills = overlapScore(job.skills ?? [], profile.skills);
  const employmentType =
    profile.employmentTypes.length === 0
      ? 50
      : includesNormalized(profile.employmentTypes, job.employmentType)
        ? 100
        : 0;
  const salary =
    profile.minimumSalaryCents == null || job.salaryCents == null
      ? 50
      : job.salaryCents >= profile.minimumSalaryCents
        ? 100
        : 0;
  const behavioural = profile.behaviouralPersonalisationEnabled
    ? clamp(context.behaviouralCompatibility ?? 50)
    : 50;
  const exploration = clamp(context.exploration ?? 50);

  const components = {
    category,
    location,
    requirements: requirementScore,
    skills,
    employmentType,
    salary,
    behavioural,
    exploration,
  };

  const weights = { ...MATCH_WEIGHTS, ...options.weights };
  let score = Object.entries(weights).reduce((total, [key, weight]) => {
    return total + (components[key as keyof typeof components] * weight) / 100;
  }, 0);
  if (missingRequirements.length > 0) score = Math.min(score, 25);

  const reasons: string[] = [];
  if (category === 100) reasons.push(`Matches your ${job.primaryCategoryCode} category preference`);
  if (location >= 60) {
    reasons.push(
      context.distanceKm == null
        ? 'Matches your location or work-mode preference'
        : `Approximately ${Math.round(context.distanceKm)} km away`
    );
  }
  if (requirementScore >= 70 && evaluated > 0)
    reasons.push('Matches the assessed job requirements');
  if (employmentType === 100) reasons.push(`${job.employmentType} work matches your preference`);

  return {
    score: Math.round(clamp(score)),
    components: Object.fromEntries(
      Object.entries(components).map(([key, value]) => [key, Math.round(clamp(value))])
    ) as MatchScoreResult['components'],
    reasons,
    missingRequirements,
    policyVersion: options.policyVersion ?? MATCH_POLICY_VERSION,
  };
}
