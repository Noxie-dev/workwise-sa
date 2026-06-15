import { desc, eq } from 'drizzle-orm';
import type { JobPreview, JobSearchParams, JobSearchResponse } from '@shared/job-types';
import {
  categories,
  userInteractions,
  userJobPreferences,
  type Category,
  type JobWithCompany,
  type User,
  type UserInteraction,
  type UserJobPreference,
} from '@shared/schema';
import { db } from '../db';
import { storage } from '../storage';

type MatchUser = Pick<
  User,
  | 'id'
  | 'location'
  | 'willingToRelocate'
  | 'preferences'
  | 'experience'
  | 'skills'
  | 'engagementScore'
>;

type JobCandidate = JobWithCompany & {
  category?: Category;
};

type ScoredJob = {
  job: JobCandidate;
  score: number;
  reasons: string[];
};

type JobMatcherContext = {
  user?: MatchUser;
  preferences?: UserJobPreference;
  interactions: UserInteraction[];
  interactedJobs: Map<number, JobCandidate>;
};

const STOP_WORDS = new Set([
  'and',
  'the',
  'for',
  'with',
  'this',
  'that',
  'from',
  'job',
  'work',
  'role',
  'team',
  'will',
  'you',
  'your',
  'our',
  'are',
  'have',
  'has',
  'all',
]);

const PROVINCE_ALIASES: Record<string, string[]> = {
  gauteng: ['gauteng', 'johannesburg', 'joburg', 'pretoria', 'sandton', 'soweto', 'midrand'],
  'western cape': ['western cape', 'cape town', 'stellenbosch', 'paarl', 'george'],
  'kwazulu-natal': ['kwazulu-natal', 'kwazulu natal', 'kzn', 'durban', 'pietermaritzburg'],
  'eastern cape': ['eastern cape', 'gqeberha', 'port elizabeth', 'east london', 'mthatha'],
  'free state': ['free state', 'bloemfontein'],
  limpopo: ['limpopo', 'polokwane'],
  mpumalanga: ['mpumalanga', 'nelspruit', 'mbombela'],
  'north west': ['north west', 'rustenburg', 'mahikeng'],
  'northern cape': ['northern cape', 'kimberley'],
};

const INTERACTION_WEIGHTS: Record<string, number> = {
  apply: 1,
  save: 0.8,
  share: 0.55,
  view: 0.35,
  video_watch: 0.25,
};

const compact = (value?: string | null) => (value || '').toLowerCase().trim();

const tokenize = (value?: string | null): string[] =>
  compact(value)
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map(token => token.trim())
    .filter(token => token.length > 2 && !STOP_WORDS.has(token));

const unique = <T>(values: T[]) => Array.from(new Set(values));

const toArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const normalizeNumber = (value: string) => {
  const multiplier = /k\b/i.test(value) ? 1000 : 1;
  const numeric = Number(value.replace(/[^\d.]/g, ''));
  return Number.isFinite(numeric) ? Math.round(numeric * multiplier) : undefined;
};

export function parseZarSalary(salary?: string | null): JobPreview['salaryPreview'] | undefined {
  if (!salary?.trim()) return undefined;

  const normalized = salary.replace(/\s+/g, ' ').trim();
  const numbers = normalized.match(/(?:r\s*)?\d[\d\s,.]*(?:k)?/gi) || [];
  const parsed = numbers.map(normalizeNumber).filter((value): value is number => !!value);
  const sorted = [...parsed].sort((left, right) => left - right);

  return {
    min: sorted[0],
    max: sorted.length > 1 ? sorted[sorted.length - 1] : sorted[0],
    currency: 'ZAR',
    negotiable: /negotiable|market|competitive/i.test(normalized),
    displayText: /^r/i.test(normalized) ? normalized : normalized.replace(/^/, 'R '),
  };
}

const inferExperienceLevel = (title: string): JobPreview['experienceLevel'] => {
  const normalized = compact(title);
  if (/senior|lead|manager|principal|head/.test(normalized)) return 'senior';
  if (/junior|entry|intern|graduate|assistant|learner/.test(normalized)) return 'entry';
  return 'mid';
};

const detectProvince = (location?: string | null): string | undefined => {
  const normalized = compact(location);
  if (!normalized) return undefined;
  return Object.entries(PROVINCE_ALIASES).find(([, aliases]) =>
    aliases.some(alias => normalized.includes(alias))
  )?.[0];
};

const isRemoteJob = (job: JobCandidate) =>
  /remote/i.test([job.workMode, job.location, job.title].filter(Boolean).join(' '));

const extractTextValues = (value: unknown): string[] => {
  if (!value) return [];
  if (typeof value === 'string') return [value];
  if (typeof value === 'number' || typeof value === 'boolean') return [String(value)];
  if (Array.isArray(value)) return value.flatMap(extractTextValues);
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap(extractTextValues);
  }
  return [];
};

const extractUserSignals = (user?: MatchUser) => {
  if (!user) {
    return { tokens: new Set<string>(), phrases: [] as string[] };
  }

  const values = [
    ...extractTextValues(user.experience),
    ...extractTextValues(user.skills),
    ...extractTextValues(user.preferences),
  ];
  const phrases = unique(values.map(value => value.trim()).filter(value => value.length > 2));

  return {
    tokens: new Set(phrases.flatMap(tokenize)),
    phrases,
  };
};

const textForJob = (job: JobCandidate) =>
  [job.title, job.description, job.location, job.jobType, job.workMode, job.company?.name, job.category?.name]
    .filter(Boolean)
    .join(' ');

const scoreTextOverlap = (candidateTokens: string[], signalTokens: Set<string>, cap: number) => {
  if (!candidateTokens.length || !signalTokens.size) return 0;
  const matches = candidateTokens.filter(token => signalTokens.has(token)).length;
  return Math.min(cap, (matches / Math.max(signalTokens.size, 6)) * cap * 2);
};

const getPreferredCategoryIds = (preferences?: UserJobPreference, user?: MatchUser): number[] => {
  const explicit = toArray(preferences?.preferredCategories)
    .map(value => Number(value))
    .filter(Number.isFinite);
  const fromUser = toArray((user?.preferences as Record<string, unknown> | null)?.preferredCategories)
    .map(value => Number(value))
    .filter(Number.isFinite);
  return unique([...explicit, ...fromUser]);
};

const getPreferredLocations = (preferences?: UserJobPreference, user?: MatchUser): string[] => {
  const explicit = toArray(preferences?.preferredLocations).filter(
    (value): value is string => typeof value === 'string'
  );
  const fromUser = toArray((user?.preferences as Record<string, unknown> | null)?.preferredLocations).filter(
    (value): value is string => typeof value === 'string'
  );
  return unique([user?.location, ...explicit, ...fromUser].filter(Boolean) as string[]);
};

const getPreferredJobTypes = (preferences?: UserJobPreference, user?: MatchUser): string[] => {
  const explicit = toArray(preferences?.preferredJobTypes).filter(
    (value): value is string => typeof value === 'string'
  );
  const fromUser = toArray((user?.preferences as Record<string, unknown> | null)?.preferredJobTypes).filter(
    (value): value is string => typeof value === 'string'
  );
  return unique([...explicit, ...fromUser]);
};

const interactionAgeFactor = (interaction: UserInteraction) => {
  const when = interaction.interactionTime ? new Date(interaction.interactionTime).getTime() : Date.now();
  const ageDays = Math.max(0, (Date.now() - when) / 86_400_000);
  return Math.pow(0.5, ageDays / 30);
};

const buildInteractionSignals = (context: JobMatcherContext) => {
  const categoryAffinity = new Map<number, number>();
  const tokenAffinity = new Map<string, number>();
  const appliedJobIds = new Set<number>();

  context.interactions.forEach(interaction => {
    const baseWeight = INTERACTION_WEIGHTS[interaction.interactionType] ?? 0.2;
    const weight = baseWeight * interactionAgeFactor(interaction);

    if (interaction.interactionType === 'apply' && interaction.jobId) {
      appliedJobIds.add(interaction.jobId);
    }

    if (interaction.categoryId) {
      categoryAffinity.set(
        interaction.categoryId,
        (categoryAffinity.get(interaction.categoryId) || 0) + weight
      );
    }

    if (interaction.jobId) {
      const job = context.interactedJobs.get(interaction.jobId);
      if (job?.categoryId) {
        categoryAffinity.set(job.categoryId, (categoryAffinity.get(job.categoryId) || 0) + weight);
      }
      tokenize(textForJob(job as JobCandidate)).forEach(token => {
        tokenAffinity.set(token, (tokenAffinity.get(token) || 0) + weight);
      });
    }
  });

  return { categoryAffinity, tokenAffinity, appliedJobIds };
};

const scoreLocation = (
  job: JobCandidate,
  context: JobMatcherContext,
  params: JobSearchParams,
  reasons: string[]
) => {
  const requestedLocation = params.location || context.user?.location;
  const preferredLocations = getPreferredLocations(context.preferences, context.user);
  const jobLocation = compact(job.location);
  const jobProvince = detectProvince(job.location);
  const requestedProvince = detectProvince(requestedLocation);
  const preferredProvince = preferredLocations.map(detectProvince).find(Boolean);
  const willingToRelocate =
    context.preferences?.willingToRelocate ?? context.user?.willingToRelocate ?? false;

  if (requestedLocation && jobLocation.includes(compact(requestedLocation))) {
    reasons.push(`Location match: ${job.location}`);
    return 22;
  }

  if (jobProvince && (jobProvince === requestedProvince || jobProvince === preferredProvince)) {
    reasons.push(`Same province: ${jobProvince}`);
    return 17;
  }

  if (isRemoteJob(job)) {
    reasons.push('Remote-friendly role');
    return params.includeRemote === false ? 6 : 14;
  }

  if (preferredLocations.some(location => jobLocation.includes(compact(location)))) {
    reasons.push('Matches a preferred location');
    return 16;
  }

  if (willingToRelocate) {
    reasons.push('Included because you are open to relocation');
    return 8;
  }

  return context.user ? 2 : 6;
};

const scoreSalary = (
  job: JobCandidate,
  context: JobMatcherContext,
  params: JobSearchParams,
  reasons: string[]
) => {
  const salaryPreview = parseZarSalary(job.salary);
  const minimum = params.minSalary || context.preferences?.minSalary;
  if (!salaryPreview || !minimum) return 0;

  if ((salaryPreview.max || salaryPreview.min || 0) >= minimum) {
    reasons.push(`Meets your ZAR salary target`);
    return 8;
  }

  return -6;
};

const scoreJob = (
  job: JobCandidate,
  context: JobMatcherContext,
  params: JobSearchParams,
  interactionSignals = buildInteractionSignals(context)
): ScoredJob => {
  const reasons: string[] = [];
  const jobTokens = tokenize(textForJob(job));
  const userSignals = extractUserSignals(context.user);
  const preferredCategories = getPreferredCategoryIds(context.preferences, context.user);
  const preferredJobTypes = getPreferredJobTypes(context.preferences, context.user);
  const queryTokens = tokenize(params.query);

  let score = 0;

  if (params.query) {
    const queryScore = scoreTextOverlap(jobTokens, new Set(queryTokens), 18);
    score += queryScore;
    if (queryScore >= 8) reasons.push(`Relevant to "${params.query}"`);
  }

  score += scoreLocation(job, context, params, reasons);

  if (preferredCategories.includes(job.categoryId)) {
    score += 14;
    reasons.push(`Preferred category: ${job.category?.name || 'job category'}`);
  }

  if (preferredJobTypes.some(type => compact(type) === compact(job.jobType))) {
    score += 7;
    reasons.push(`Preferred job type: ${job.jobType}`);
  }

  const profileScore = scoreTextOverlap(jobTokens, userSignals.tokens, 22);
  score += profileScore;
  if (profileScore >= 7) {
    reasons.push('Similar to your skills and past employment');
  }

  const categoryAffinity = interactionSignals.categoryAffinity.get(job.categoryId) || 0;
  const tokenAffinity = jobTokens.reduce(
    (sum, token) => sum + (interactionSignals.tokenAffinity.get(token) || 0),
    0
  );
  const interactionScore = Math.min(18, categoryAffinity * 8 + tokenAffinity * 1.8);
  score += interactionScore;
  if (interactionScore >= 6) {
    reasons.push('Similar to jobs you viewed, saved, or applied to');
  }

  score += scoreSalary(job, context, params, reasons);

  const ageDays = job.createdAt ? (Date.now() - new Date(job.createdAt).getTime()) / 86_400_000 : 90;
  score += Math.max(0, 8 - ageDays / 7);
  if (job.isFeatured) score += 5;

  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));

  return {
    job,
    score: normalizedScore,
    reasons: unique(reasons).slice(0, 4),
  };
};

const toPreview = (scoredJob: ScoredJob, includeMatch: boolean): JobPreview => {
  const { job, score, reasons } = scoredJob;
  const shortDescription =
    job.description.length > 150 ? `${job.description.slice(0, 147)}...` : job.description;
  const matchLabel =
    score >= 75 ? 'Strong match' : score >= 52 ? 'Good match' : ('Possible match' as const);

  return {
    id: job.id,
    title: job.title,
    company: {
      id: job.company.id,
      name: job.company.name,
      location: job.company.location || undefined,
    },
    location: job.location,
    jobType: job.jobType,
    workMode: job.workMode,
    category: {
      id: job.category?.id ?? job.categoryId,
      name: job.category?.name ?? 'General',
    },
    shortDescription,
    tags: unique([job.category?.name, job.jobType, job.workMode].filter(Boolean) as string[]),
    postedDate: job.createdAt || new Date(),
    isRemote: isRemoteJob(job),
    experienceLevel: inferExperienceLevel(job.title),
    featured: Boolean(job.isFeatured),
    salaryPreview: parseZarSalary(job.salary),
    match: includeMatch
      ? {
          score,
          label: matchLabel,
          reasons: reasons.length ? reasons : ['Ranked by current job relevance'],
        }
      : undefined,
  };
};

const parseBoolean = (value: unknown) => value === true || value === 'true';

const shouldIncludeJob = (job: JobCandidate, params: JobSearchParams) => {
  if (job.status !== 'active') return false;
  if (params.featured && !job.isFeatured) return false;
  if (params.categoryId && job.categoryId !== params.categoryId) return false;
  if (params.jobType && compact(job.jobType) !== compact(params.jobType)) return false;
  if (params.workMode && compact(job.workMode) !== compact(params.workMode)) return false;
  if (params.experienceLevel && inferExperienceLevel(job.title) !== params.experienceLevel) return false;

  if (params.location) {
    const requested = compact(params.location);
    const jobProvince = detectProvince(job.location);
    const requestedProvince = detectProvince(params.location);
    const locationMatches =
      compact(job.location).includes(requested) ||
      (Boolean(jobProvince) && jobProvince === requestedProvince) ||
      (params.includeRemote !== false && isRemoteJob(job));
    if (!locationMatches) return false;
  }

  if (params.minSalary) {
    const salaryPreview = parseZarSalary(job.salary);
    const availableSalary = salaryPreview?.max || salaryPreview?.min || 0;
    if (availableSalary && availableSalary < params.minSalary) return false;
  }

  if (params.query) {
    const queryTokens = tokenize(params.query);
    const jobText = compact(textForJob(job));
    const jobTokens = jobTokensForFiltering(job);
    const matchesQuery = queryTokens.some(
      token => jobText.includes(token) || jobTokens.some(jobToken => jobToken.includes(token))
    );
    if (queryTokens.length && !matchesQuery) return false;
  }

  return true;
};

const jobTokensForFiltering = (job: JobCandidate) => tokenize(textForJob(job));

const buildContext = async (user?: MatchUser): Promise<JobMatcherContext> => {
  if (!user) {
    return { interactions: [], interactedJobs: new Map() };
  }

  const [preferences] = await db
    .select()
    .from(userJobPreferences)
    .where(eq(userJobPreferences.userId, user.id));
  const interactions = await db
    .select()
    .from(userInteractions)
    .where(eq(userInteractions.userId, user.id))
    .orderBy(desc(userInteractions.interactionTime))
    .limit(200);
  const interactedJobs = new Map<number, JobCandidate>();

  return { user, preferences, interactions, interactedJobs };
};

const attachCategories = async (jobList: JobWithCompany[]): Promise<JobCandidate[]> => {
  const allCategories = (await db.select().from(categories)) as Category[];
  const categoryById = new Map(allCategories.map(category => [category.id, category]));
  return jobList.map(job => ({ ...job, category: categoryById.get(job.categoryId) }));
};

export async function getJobPreviewMatches(
  params: JobSearchParams = {},
  user?: MatchUser
): Promise<JobSearchResponse> {
  const page = Math.max(Number(params.page || 1), 1);
  const limit = Math.min(Math.max(Number(params.limit || 20), 1), 100);
  const normalizedParams: JobSearchParams = {
    ...params,
    page,
    limit,
    includeRemote: params.includeRemote !== false,
    personalized: parseBoolean(params.personalized) || Boolean(user),
    sort: params.sort || (user ? 'relevance' : 'newest'),
  };
  const context = await buildContext(user);
  const jobsWithCompanies = await attachCategories(await storage.getJobsWithCompanies());
  const interactedJobIds = new Set(
    context.interactions
      .map(interaction => interaction.jobId)
      .filter((id): id is number => Boolean(id))
  );
  jobsWithCompanies.forEach(job => {
    if (interactedJobIds.has(job.id)) {
      context.interactedJobs.set(job.id, job);
    }
  });
  const candidates = jobsWithCompanies.filter(job => shouldIncludeJob(job, normalizedParams));
  const signals = buildInteractionSignals(context);
  const includeMatch = Boolean(user) || normalizedParams.sort === 'relevance' || Boolean(params.query);
  const scoredJobs = candidates
    .map(job => scoreJob(job, context, normalizedParams, signals))
    .sort((left, right) => {
      if (normalizedParams.sort === 'newest' && !user) {
        return (
          new Date(right.job.createdAt || 0).getTime() -
          new Date(left.job.createdAt || 0).getTime()
        );
      }
      return (
        right.score - left.score ||
        Number(right.job.isFeatured) - Number(left.job.isFeatured) ||
        new Date(right.job.createdAt || 0).getTime() - new Date(left.job.createdAt || 0).getTime()
      );
    });

  const total = scoredJobs.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const offset = (page - 1) * limit;

  return {
    jobs: scoredJobs.slice(offset, offset + limit).map(job => toPreview(job, includeMatch)),
    total,
    page,
    limit,
    totalPages,
  };
}

export async function getPersonalizedJobPreviews(
  userId: number,
  params: JobSearchParams = {}
): Promise<JobSearchResponse> {
  const user = await storage.getUser(userId);
  return getJobPreviewMatches({ ...params, personalized: true, sort: 'relevance' }, user);
}
