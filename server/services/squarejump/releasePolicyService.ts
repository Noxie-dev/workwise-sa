import { RELEASE_POLICY_VERSION } from '@shared/squarejump-contracts';

export type ReleaseAudience = 'subscriber' | 'member' | 'public';

export type ReleaseSchedule = {
  verifiedAt: Date;
  subscriberReleaseAt: Date;
  memberReleaseAt: Date;
  publicReleaseAt: Date;
  expiresAt: Date | null;
  policyVersion: string;
  urgencyRule: 'not-eligible' | 'immediate' | 'three-hour' | 'six-hour' | 'standard';
};

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function createReleaseSchedule(input: {
  verifiedAt: Date;
  expiresAt?: Date | null;
  earlyAccessEligible?: boolean;
}): ReleaseSchedule {
  const { verifiedAt } = input;
  const expiresAt = input.expiresAt ?? null;
  if (input.earlyAccessEligible === false) {
    return {
      verifiedAt,
      subscriberReleaseAt: verifiedAt,
      memberReleaseAt: verifiedAt,
      publicReleaseAt: verifiedAt,
      expiresAt,
      policyVersion: RELEASE_POLICY_VERSION,
      urgencyRule: 'not-eligible',
    };
  }
  const remainingHours = expiresAt
    ? (expiresAt.getTime() - verifiedAt.getTime()) / (60 * 60 * 1000)
    : Number.POSITIVE_INFINITY;

  let memberDelay = 12;
  let publicDelay = 18;
  let urgencyRule: ReleaseSchedule['urgencyRule'] = 'standard';
  if (remainingHours < 24) {
    memberDelay = 0;
    publicDelay = 0;
    urgencyRule = 'immediate';
  } else if (remainingHours < 48) {
    memberDelay = 3;
    publicDelay = 3;
    urgencyRule = 'three-hour';
  } else if (remainingHours < 72) {
    memberDelay = 6;
    publicDelay = 6;
    urgencyRule = 'six-hour';
  }

  return {
    verifiedAt,
    subscriberReleaseAt: verifiedAt,
    memberReleaseAt: addHours(verifiedAt, memberDelay),
    publicReleaseAt: addHours(verifiedAt, publicDelay),
    expiresAt,
    policyVersion: RELEASE_POLICY_VERSION,
    urgencyRule,
  };
}

export function releaseState(
  schedule: Pick<
    ReleaseSchedule,
    'subscriberReleaseAt' | 'memberReleaseAt' | 'publicReleaseAt' | 'expiresAt'
  >,
  audience: ReleaseAudience,
  now = new Date()
): 'scheduled' | 'eligible' | 'expired' {
  if (schedule.expiresAt && now >= schedule.expiresAt) return 'expired';
  const releaseAt =
    audience === 'subscriber'
      ? schedule.subscriberReleaseAt
      : audience === 'member'
        ? schedule.memberReleaseAt
        : schedule.publicReleaseAt;
  return now >= releaseAt ? 'eligible' : 'scheduled';
}

function safeDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isJobVisibleToAudience(
  job: {
    status: string;
    riskStatus?: string | null;
    subscriberReleaseAt?: Date | string | null;
    memberReleaseAt?: Date | string | null;
    publicReleaseAt?: Date | string | null;
    expiresAt?: Date | string | null;
  },
  audience: ReleaseAudience,
  now = new Date()
): boolean {
  if (job.status !== 'active' || job.riskStatus === 'quarantined') return false;
  const expiresAt = safeDate(job.expiresAt);
  if (expiresAt && now >= expiresAt) return false;
  const releaseAt = safeDate(
    audience === 'subscriber'
      ? job.subscriberReleaseAt
      : audience === 'member'
        ? job.memberReleaseAt
        : job.publicReleaseAt
  );
  return !releaseAt || now >= releaseAt;
}
