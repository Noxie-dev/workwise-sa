import { Router } from 'express';
import { adEventSchema, adPlacementSchema, defaultAdSlots } from '@shared/monetization';
import { adCampaigns } from '@shared/schema';
import { logger } from '../utils/logger';
import { auth } from '../firebase';
import { resolveAuthenticatedDatabaseUser } from '../services/authenticatedUser';
import { entitlementService } from '../services/entitlementService';
import { db } from '../db';
import { and, desc, eq, sql } from 'drizzle-orm';

const router = Router();

async function resolveOptionalUser(req: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const decoded = await auth.verifyIdToken(authHeader.split('Bearer ')[1]);
  return resolveAuthenticatedDatabaseUser(decoded);
}

router.get('/slots/:placement', async (req, res, next) => {
  const parsedPlacement = adPlacementSchema.safeParse(req.params.placement);
  if (!parsedPlacement.success) {
    return res.status(400).json({ message: 'Invalid ad placement' });
  }

  try {
    const dbUser = await resolveOptionalUser(req);
    const entitlements = await entitlementService.getEntitlementsForUser(dbUser?.id);
    const slot = defaultAdSlots[parsedPlacement.data];
    const now = new Date();
    const [campaign] = await db
      .select()
      .from(adCampaigns)
      .where(
        and(
          eq(adCampaigns.placement, parsedPlacement.data),
          eq(adCampaigns.status, 'active'),
          sql`(${adCampaigns.startAt} IS NULL OR ${adCampaigns.startAt} <= ${now})`,
          sql`(${adCampaigns.endAt} IS NULL OR ${adCampaigns.endAt} >= ${now})`
        )
      )
      .orderBy(desc(adCampaigns.updatedAt))
      .limit(1);

    return res.json({
      ...slot,
      enabled: slot.enabled,
      canSkip: Boolean(entitlements.workwisePlusActive),
      creative: campaign
        ? {
            id: campaign.id,
            advertiserName: campaign.advertiserName,
            title: campaign.title,
            description: campaign.description,
            creativeType: campaign.creativeType || 'display',
            imageUrl: campaign.imageUrl,
            videoUrl: campaign.videoUrl,
            embedUrl: campaign.embedUrl,
            targetUrl: campaign.targetUrl,
            budgetCents: campaign.budgetCents,
            currency: campaign.currency,
            startAt: campaign.startAt?.toISOString() ?? null,
            endAt: campaign.endAt?.toISOString() ?? null,
            impressions: campaign.impressions,
            clicks: campaign.clicks,
          }
        : undefined,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/events', async (req, res, next) => {
  const parsedEvent = adEventSchema.safeParse(req.body);
  if (!parsedEvent.success) {
    return res.status(400).json({
      message: 'Invalid ad event payload',
      issues: parsedEvent.error.issues,
    });
  }

  try {
    const numericCreativeId = Number(parsedEvent.data.creativeId);
    if (Number.isInteger(numericCreativeId)) {
      const metric =
        parsedEvent.data.eventType === 'click'
          ? { clicks: sql`${adCampaigns.clicks} + 1` }
          : parsedEvent.data.eventType === 'impression'
            ? { impressions: sql`${adCampaigns.impressions} + 1` }
            : {};

      if (Object.keys(metric).length) {
        await db
          .update(adCampaigns)
          .set({ ...metric, updatedAt: new Date() })
          .where(eq(adCampaigns.id, numericCreativeId));
      }
    }

    logger.info('Monetization event received', {
      placement: parsedEvent.data.placement,
      eventType: parsedEvent.data.eventType,
      creativeId: parsedEvent.data.creativeId,
      sessionId: parsedEvent.data.sessionId,
    });

    return res.status(202).json({
      accepted: true,
      persisted: Number.isInteger(numericCreativeId),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
