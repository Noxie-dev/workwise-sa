import { Router } from 'express';
import { z } from 'zod';
import {
  jobEventSchema,
  matchProfileSchema,
  policySimulationSchema,
  recommendationQuerySchema,
} from '@shared/squarejump-contracts';
import {
  jobEvents,
  jobs,
  notificationConsents,
  recommendationExposures,
  userInteractions,
  userMatchProfiles,
} from '@shared/schema';
import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { authenticate, authorize, type AuthenticatedRequest } from '../middleware/auth';
import { resolveAuthenticatedDatabaseUser } from '../services/authenticatedUser';
import {
  activatePolicy,
  rollbackPolicy,
  saveDraftPolicy,
  simulatePolicyImpact,
  validatePolicyWeights,
} from '../services/squarejump/scorePolicyRepository';
import { getSquareJumpRecommendations } from '../services/squarejump/squareJumpRecommendationService';
import { recalculateOpportunityScore } from '../services/squarejump/opportunityRescoringService';
import {
  listDuplicateCandidates,
  resolveDuplicateCandidate,
  type DuplicateDecision,
} from '../services/squarejump/duplicateReviewService';
import { featureFlagService } from '../services/featureFlagService';

const router = Router();

const notificationChannelSchema = z.enum(['in-app', 'email', 'whatsapp']);
const notificationConsentSchema = z
  .object({
    consent: z.boolean(),
    mode: z.enum([
      'instant',
      'morning-digest',
      'afternoon-digest',
      'daily-digest',
      'weekly-digest',
      'in-app-only',
      'paused',
    ]),
  })
  .strict();

const duplicateDecisionSchema = z.object({
  decision: z.enum(['merge', 'reject', 'sibling']),
  canonicalJobId: z.number().int().positive().optional(),
}).strict();

router.get('/jobs/recommendations', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!(await featureFlagService.isEnabled('ENABLE_SQUAREJUMP'))) {
      return res.status(503).json({ message: 'SquareJUMP is temporarily unavailable' });
    }
    const parsed = recommendationQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: 'Invalid recommendation query', errors: parsed.error.issues });
    }
    const user = await resolveAuthenticatedDatabaseUser(req.user ?? {});
    return res.json(await getSquareJumpRecommendations(user.id, parsed.data));
  } catch (error) {
    return next(error);
  }
});

router.put('/jobs/match-profile', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const parsed = matchProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: 'Invalid match profile', errors: parsed.error.issues });
    }
    const user = await resolveAuthenticatedDatabaseUser(req.user ?? {});
    const values = {
      userId: user.id,
      ...parsed.data,
      updatedAt: new Date(),
    };
    const [existing] = await db
      .select({ id: userMatchProfiles.id })
      .from(userMatchProfiles)
      .where(eq(userMatchProfiles.userId, user.id));
    if (existing) {
      await db
        .update(userMatchProfiles)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(userMatchProfiles.userId, user.id));
    } else {
      await db.insert(userMatchProfiles).values(values);
    }
    return res.json({ success: true, profile: parsed.data });
  } catch (error) {
    return next(error);
  }
});

router.get('/notification-consents', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await resolveAuthenticatedDatabaseUser(req.user ?? {});
    const consents = await db
      .select()
      .from(notificationConsents)
      .where(eq(notificationConsents.userId, user.id));
    return res.json({ consents });
  } catch (error) {
    return next(error);
  }
});

router.put(
  '/notification-consents/:channel',
  authenticate,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const channel = notificationChannelSchema.safeParse(req.params.channel);
      const body = notificationConsentSchema.safeParse(req.body);
      if (!channel.success || !body.success) {
        return res.status(400).json({
          message: 'Invalid notification consent',
          errors: [
            ...(channel.success ? [] : channel.error.issues),
            ...(body.success ? [] : body.error.issues),
          ],
        });
      }
      const user = await resolveAuthenticatedDatabaseUser(req.user ?? {});
      const [existing] = await db
        .select()
        .from(notificationConsents)
        .where(
          and(
            eq(notificationConsents.userId, user.id),
            eq(notificationConsents.channel, channel.data)
          )
        );
      const now = new Date();
      const values = {
        consentStatus: body.data.consent ? 'granted' : 'withdrawn',
        notificationMode: body.data.mode,
        consentedAt: body.data.consent ? now : (existing?.consentedAt ?? null),
        consentSource: 'authenticated_settings',
        policyVersion: 'notification-consent-v1',
        withdrawnAt: body.data.consent ? null : now,
        updatedAt: now,
      };
      if (existing) {
        await db
          .update(notificationConsents)
          .set(values)
          .where(eq(notificationConsents.id, existing.id));
      } else {
        await db.insert(notificationConsents).values({
          userId: user.id,
          channel: channel.data,
          ...values,
        });
      }
      return res.json({
        channel: channel.data,
        consentStatus: values.consentStatus,
        mode: values.notificationMode,
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.post('/job-events', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const parsed = jobEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid job event', errors: parsed.error.issues });
    }
    const user = await resolveAuthenticatedDatabaseUser(req.user ?? {});
    const [job] = await db.select().from(jobs).where(eq(jobs.juid, parsed.data.jobJuid));
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const [exposure] = await db
      .select()
      .from(recommendationExposures)
      .where(
        and(
          eq(recommendationExposures.trackingToken, parsed.data.trackingToken),
          eq(recommendationExposures.jobId, job.id),
          eq(recommendationExposures.userId, user.id)
        )
      );
    if (!exposure) return res.status(400).json({ message: 'Invalid exposure token' });

    const eventKey = [
      'event',
      user.id,
      job.id,
      parsed.data.eventType,
      parsed.data.trackingToken,
    ].join(':');
    const [existingEvent] = await db
      .select({ id: jobEvents.id })
      .from(jobEvents)
      .where(eq(jobEvents.eventKey, eventKey));
    if (existingEvent) return res.status(202).json({ accepted: true, duplicate: true });

    const [insertedEvent] = await db
      .insert(jobEvents)
      .values({
        userId: user.id,
        jobId: job.id,
        eventType: parsed.data.eventType,
        trackingToken: parsed.data.trackingToken,
        eventKey,
        durationSeconds: parsed.data.durationSeconds,
        metadata: parsed.data.metadata,
        occurredAt: new Date(),
      })
      .onConflictDoNothing({ target: jobEvents.eventKey })
      .returning({ id: jobEvents.id });
    if (!insertedEvent) return res.status(202).json({ accepted: true, duplicate: true });
    await db.insert(userInteractions).values({
      userId: user.id,
      interactionType: parsed.data.eventType,
      jobId: job.id,
      categoryId: job.categoryId,
      duration: parsed.data.durationSeconds,
      metadata: {
        ...parsed.data.metadata,
        exposureToken: parsed.data.trackingToken,
        position: exposure.position,
        surface: exposure.surface,
      },
      interactionTime: new Date(),
    });
    return res.status(202).json({ accepted: true });
  } catch (error) {
    return next(error);
  }
});

router.post(
  '/admin/squarejump/policies/simulate',
  authenticate,
  authorize(['admin']),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const parsed = policySimulationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ message: 'Invalid score policy', errors: parsed.error.issues });
      }
      const validation = validatePolicyWeights(parsed.data);
      if (!validation.valid) return res.status(400).json(validation);
      const user = await resolveAuthenticatedDatabaseUser(req.user ?? {});
      const draft = await saveDraftPolicy(parsed.data, user.id);
      const simulation = await simulatePolicyImpact(parsed.data);
      return res.status(201).json({
        policy: draft,
        simulation: { status: 'completed', ...simulation },
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  '/admin/squarejump/policies/:id/activate',
  authenticate,
  authorize(['admin']),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const policyId = Number.parseInt(req.params.id, 10);
      if (Number.isNaN(policyId)) return res.status(400).json({ message: 'Invalid policy ID' });
      const user = await resolveAuthenticatedDatabaseUser(req.user ?? {});
      return res.json({ policy: await activatePolicy(policyId, user.id) });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  '/admin/squarejump/policies/:id/rollback',
  authenticate,
  authorize(['admin']),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const policyId = Number.parseInt(req.params.id, 10);
      if (Number.isNaN(policyId)) return res.status(400).json({ message: 'Invalid policy ID' });
      const user = await resolveAuthenticatedDatabaseUser(req.user ?? {});
      return res.json({ policy: await rollbackPolicy(policyId, user.id) });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  '/admin/squarejump/jobs/:juid/recalculate',
  authenticate,
  authorize(['admin']),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = await resolveAuthenticatedDatabaseUser(req.user ?? {});
      const score = await recalculateOpportunityScore(
        req.params.juid,
        typeof req.body?.reason === 'string' ? req.body.reason : 'admin_request',
        user.id
      );
      return res.json({ juid: req.params.juid, score });
    } catch (error) {
      return next(error);
    }
  }
);

router.get(
  '/admin/squarejump/duplicates',
  authenticate,
  authorize(['admin']),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status : 'pending';
      const limit = typeof req.query.limit === 'string' ? Number.parseInt(req.query.limit, 10) : 100;
      return res.json({ candidates: await listDuplicateCandidates(status, Number.isFinite(limit) ? limit : 100) });
    } catch (error) {
      return next(error);
    }
  },
);

router.post(
  '/admin/squarejump/duplicates/:id/resolve',
  authenticate,
  authorize(['admin']),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const candidateId = Number.parseInt(req.params.id, 10);
      const parsed = duplicateDecisionSchema.safeParse(req.body);
      if (Number.isNaN(candidateId) || !parsed.success) {
        return res.status(400).json({ message: 'Invalid duplicate resolution', errors: parsed.success ? [] : parsed.error.issues });
      }
      const user = await resolveAuthenticatedDatabaseUser(req.user ?? {});
      const candidate = await resolveDuplicateCandidate({
        candidateId,
        actorUserId: user.id,
        decision: parsed.data.decision as DuplicateDecision,
        canonicalJobId: parsed.data.canonicalJobId,
      });
      return res.json({ candidate });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
