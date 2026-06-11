import { Router } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { auth } from '../firebase';
import { verifyFirebaseToken } from '../middleware/auth';
import { Errors } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';
import { resolveAuthenticatedDatabaseUser } from '../services/authenticatedUser';
import { billingService } from '../services/billingService';
import { entitlementService } from '../services/entitlementService';
import { proInterest } from '@shared/schema';

const router = Router();
const col = (column: unknown) => column as any;

const checkoutSchema = z.object({
  body: z.object({
    planCode: z.literal('workwise_plus').default('workwise_plus'),
  }),
});

const proInterestSchema = z.object({
  body: z.object({
    email: z.email(),
    source: z.string().min(1).max(80).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
});

async function resolveOptionalUser(req: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const decoded = await auth.verifyIdToken(authHeader.split('Bearer ')[1]);
  return resolveAuthenticatedDatabaseUser(decoded);
}

router.get('/plans', async (_req, res, next) => {
  try {
    res.json({ plans: await billingService.getPlans() });
  } catch (error) {
    next(error);
  }
});

router.get('/subscription', verifyFirebaseToken, async (req, res, next) => {
  try {
    const dbUser = await resolveAuthenticatedDatabaseUser((req as any).user);
    const subscription = await billingService.getCurrentSubscription(dbUser.id);
    res.json({
      subscription,
      entitlements: await entitlementService.getEntitlementsForUser(dbUser.id),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/checkout', verifyFirebaseToken, validate(checkoutSchema), async (req, res, next) => {
  try {
    const planCode = req.body.planCode || 'workwise_plus';
    if (planCode !== 'workwise_plus') {
      throw Errors.validation('Only WorkWise Plus checkout is available in Phase 1');
    }

    const dbUser = await resolveAuthenticatedDatabaseUser((req as any).user);
    const checkout = await billingService.createPayfastCheckout({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
    });

    res.status(201).json(checkout);
  } catch (error) {
    next(error);
  }
});

router.post('/subscriptions/cancel', verifyFirebaseToken, async (req, res, next) => {
  try {
    const dbUser = await resolveAuthenticatedDatabaseUser((req as any).user);
    const subscription = await billingService.cancelCurrentSubscription(dbUser.id);
    res.json({
      subscription,
      entitlements: await entitlementService.getEntitlementsForUser(dbUser.id),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/payfast/itn', async (req, res, next) => {
  try {
    await billingService.handlePayfastItn(req.body || {});
    res.status(200).send('OK');
  } catch (error) {
    next(error);
  }
});

router.post('/pro-interest', validate(proInterestSchema), async (req, res, next) => {
  try {
    const dbUser = await resolveOptionalUser(req);
    const existing = await db
      .select()
      .from(proInterest)
      .where(eq(col(proInterest.email), req.body.email))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(proInterest).values({
        userId: dbUser?.id,
        email: req.body.email,
        source: req.body.source || 'plus_page',
        metadata: req.body.metadata,
      });
    }

    res.status(202).json({ accepted: true });
  } catch (error) {
    next(error);
  }
});

export default router;
