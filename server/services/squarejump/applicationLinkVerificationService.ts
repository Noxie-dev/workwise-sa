import { jobReleaseEvents, jobScores, jobSourceRecords, jobs } from '@shared/schema';
import { and, eq, ne } from 'drizzle-orm';
import { db } from '../../db';
import { createReleaseSchedule } from './releasePolicyService';

async function checkUrl(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
    if (response.ok) return true;
    if ([405, 403].includes(response.status)) {
      const fallback = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal });
      return fallback.ok;
    }
    return false;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function verifyApplicationLinks(limit = 100) {
  const rows = await db
    .select({ job: jobs, source: jobSourceRecords, score: jobScores })
    .from(jobs)
    .innerJoin(jobSourceRecords, eq(jobSourceRecords.jobId, jobs.id))
    .leftJoin(jobScores, and(eq(jobScores.jobId, jobs.id), eq(jobScores.scoreType, 'opportunity')))
    .where(and(eq(jobs.status, 'active'), ne(jobs.applicationLinkStatus, 'verified')))
    .limit(Math.min(500, Math.max(1, limit)));
  let verified = 0;
  let broken = 0;
  for (const row of rows) {
    if (!row.source.applyUrl) continue;
    const healthy = await checkUrl(row.source.applyUrl);
    const now = new Date();
    await db.transaction(async transaction => {
      await transaction.update(jobs).set({
        applicationLinkStatus: healthy ? 'verified' : 'broken',
        verifiedAt: now,
      }).where(eq(jobs.id, row.job.id));
      if (!healthy) {
        broken += 1;
        return;
      }
      verified += 1;
      const eligible = row.job.riskStatus === 'clear' && (row.score?.scoreValue ?? 0) >= 70;
      const schedule = createReleaseSchedule({
        verifiedAt: now,
        expiresAt: row.job.expiresAt,
        earlyAccessEligible: eligible,
      });
      await transaction.update(jobs).set({
        subscriberReleaseAt: schedule.subscriberReleaseAt,
        memberReleaseAt: schedule.memberReleaseAt,
        publicReleaseAt: schedule.publicReleaseAt,
        releasePolicyVersion: schedule.policyVersion,
      }).where(eq(jobs.id, row.job.id));
      await transaction.update(jobReleaseEvents).set({
        releaseAt: schedule.publicReleaseAt,
        availableAt: schedule.publicReleaseAt,
        status: 'scheduled',
        attemptCount: 0,
        lockedAt: null,
        lastError: null,
      }).where(and(eq(jobReleaseEvents.jobId, row.job.id), eq(jobReleaseEvents.audience, 'public')));
      await transaction.update(jobReleaseEvents).set({
        releaseAt: schedule.memberReleaseAt,
        availableAt: schedule.memberReleaseAt,
        status: 'scheduled',
        attemptCount: 0,
        lockedAt: null,
        lastError: null,
      }).where(and(eq(jobReleaseEvents.jobId, row.job.id), eq(jobReleaseEvents.audience, 'member')));
      await transaction.update(jobReleaseEvents).set({
        releaseAt: schedule.subscriberReleaseAt,
        availableAt: schedule.subscriberReleaseAt,
        status: 'scheduled',
        attemptCount: 0,
        lockedAt: null,
        lastError: null,
      }).where(and(eq(jobReleaseEvents.jobId, row.job.id), eq(jobReleaseEvents.audience, 'subscriber')));
    });
  }
  return { checked: rows.length, verified, broken };
}
