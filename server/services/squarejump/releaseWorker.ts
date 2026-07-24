import {
  jobReleaseEvents,
  jobs,
  notificationConsents,
  squareJumpAuditLog,
  squareJumpNotificationDeliveries,
  userJobMatches,
  userNotifications,
} from '@shared/schema';
import { and, asc, eq, gte, lte, or, isNull } from 'drizzle-orm';
import { db } from '../../db';
import { featureFlagService } from '../featureFlagService';

async function deliverInAppNotifications(event: typeof jobReleaseEvents.$inferSelect, now: Date) {
  const recipients = await db
    .select({
      userId: userJobMatches.userId,
      jobId: userJobMatches.jobId,
      matchScore: userJobMatches.matchScore,
      title: jobs.title,
    })
    .from(userJobMatches)
    .innerJoin(
      notificationConsents,
      and(
        eq(notificationConsents.userId, userJobMatches.userId),
        eq(notificationConsents.channel, 'in-app'),
        eq(notificationConsents.consentStatus, 'granted'),
      ),
    )
    .innerJoin(jobs, eq(jobs.id, userJobMatches.jobId))
    .where(and(eq(userJobMatches.jobId, event.jobId), gte(userJobMatches.matchScore, 75)));

  let delivered = 0;
  for (const recipient of recipients) {
    const dedupeKey = `${event.idempotencyKey}:user:${recipient.userId}:in-app`;
    await db.transaction(async transaction => {
      const [created] = await transaction
        .insert(squareJumpNotificationDeliveries)
        .values({
          userId: recipient.userId,
          jobId: recipient.jobId,
          channel: 'in-app',
          releaseStage: event.audience,
          reason: 'squarejump_release_match',
          dedupeKey,
          status: 'queued',
          attemptCount: 1,
          queuedAt: now,
        })
        .onConflictDoNothing({ target: squareJumpNotificationDeliveries.dedupeKey })
        .returning({ id: squareJumpNotificationDeliveries.id });
      if (!created) return;

      await transaction.insert(userNotifications).values({
        userId: recipient.userId,
        type: 'job_match',
        content: `A ${event.audience} SquareJUMP release matches you: ${recipient.title}`,
        jobId: recipient.jobId,
        isRead: false,
        createdAt: now,
        sentAt: now,
      });
      await transaction
        .update(squareJumpNotificationDeliveries)
        .set({ status: 'delivered', deliveredAt: now })
        .where(eq(squareJumpNotificationDeliveries.id, created.id));
      delivered += 1;
    });
  }
  return delivered;
}

/**
 * Claims durable release records with a conditional state transition. The job
 * visibility query uses persisted release timestamps, so replay is idempotent.
 */
export async function processDueReleaseEvents(now = new Date(), limit = 100) {
  if (!(await featureFlagService.isEnabled('ENABLE_SQUAREJUMP_RELEASES'))) {
    return { selected: 0, processed: 0, disabled: true };
  }
  const staleBefore = new Date(now.getTime() - 5 * 60 * 1000);
  await db
    .update(jobReleaseEvents)
    .set({
      status: 'scheduled',
      lockedAt: null,
      lastError: 'Recovered stale worker claim',
    })
    .where(
      and(eq(jobReleaseEvents.status, 'processing'), lte(jobReleaseEvents.lockedAt, staleBefore))
    );

  const due = await db
    .select()
    .from(jobReleaseEvents)
    .where(
      and(
        eq(jobReleaseEvents.status, 'scheduled'),
        lte(jobReleaseEvents.releaseAt, now),
        or(isNull(jobReleaseEvents.availableAt), lte(jobReleaseEvents.availableAt, now))
      )
    )
    .orderBy(asc(jobReleaseEvents.releaseAt))
    .limit(limit);

  let processed = 0;
  for (const event of due) {
    const [claimed] = await db
      .update(jobReleaseEvents)
      .set({
        status: 'processing',
        lockedAt: now,
        attemptCount: event.attemptCount + 1,
      })
      .where(and(eq(jobReleaseEvents.id, event.id), eq(jobReleaseEvents.status, 'scheduled')))
      .returning();
    if (!claimed) continue;

    try {
      const notificationsDelivered = await deliverInAppNotifications(claimed, now);
      await db
        .update(jobReleaseEvents)
        .set({
          status: 'completed',
          processedAt: now,
          lockedAt: null,
          lastError: null,
        })
        .where(eq(jobReleaseEvents.id, event.id));
      await db.insert(squareJumpAuditLog).values({
        action: 'release.complete',
        entityType: 'job_release',
        entityId: event.idempotencyKey,
          afterState: {
            audience: event.audience,
            processedAt: now.toISOString(),
            notificationsDelivered,
          },
        createdAt: now,
      });
      processed += 1;
    } catch (error) {
      const deadLetter = claimed.attemptCount >= 5;
      await db
        .update(jobReleaseEvents)
        .set({
          status: deadLetter ? 'dead_letter' : 'scheduled',
          availableAt: new Date(now.getTime() + Math.min(300, 2 ** claimed.attemptCount) * 1000),
          lockedAt: null,
          lastError: error instanceof Error ? error.message : 'Unknown release worker error',
        })
        .where(eq(jobReleaseEvents.id, event.id));
    }
  }
  return { selected: due.length, processed };
}
