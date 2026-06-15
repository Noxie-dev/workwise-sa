import { Router, Request, Response, NextFunction } from 'express';
import {
  isEligibleForEarlyNotifications,
  sendJobNotificationToUser,
  trackUserInteraction,
  startUserSession,
  endUserSession,
  calculateUserEngagementScore,
  getUserEngagementTier,
} from './jobRecommendation';
import { db } from './db';
import { users, userJobPreferences } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { Errors } from './middleware/errorHandler';
import { type AuthenticatedRequest, verifyFirebaseToken } from './middleware/auth';
import { resolveAuthenticatedDatabaseUser } from './services/authenticatedUser';
import { getPersonalizedJobPreviews } from './services/jobMatchingService';

// Create a new router instance
const router = Router();

router.use(verifyFirebaseToken);

async function authenticatedUserId(req: Request) {
  const user = await resolveAuthenticatedDatabaseUser((req as AuthenticatedRequest).user!);
  return user.id;
}

/**
 * Get personalized job recommendations for authenticated user
 * GET /api/recommendations/jobs
 */
router.get('/jobs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await authenticatedUserId(req);

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const recommendations = await getPersonalizedJobPreviews(userId, {
      limit,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      query: (req.query.q || req.query.query) as string | undefined,
      location: req.query.location as string | undefined,
      jobType: req.query.jobType as string | undefined,
      workMode: req.query.workMode as string | undefined,
      sort: 'relevance',
    });

    res.json(recommendations);
  } catch (error) {
    next(error);
  }
});

/**
 * Search jobs with personalized ranking
 * GET /api/recommendations/search
 */
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query.q as string;

    if (!query) {
      throw Errors.validation('Query is required');
    }
    const userId = await authenticatedUserId(req);

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const results = await getPersonalizedJobPreviews(userId, {
      query,
      limit,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      location: req.query.location as string | undefined,
      sort: 'relevance',
    });

    res.json(results);
  } catch (error) {
    next(error);
  }
});

/**
 * Track user interaction (view, apply, etc.)
 * POST /api/recommendations/track
 */
router.post('/track', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { interactionType, jobId, videoId, categoryId, duration, metadata } = req.body;

    if (!interactionType) {
      throw Errors.validation('interactionType is required');
    }
    const userId = await authenticatedUserId(req);

    await trackUserInteraction(userId, interactionType, {
      jobId,
      videoId,
      categoryId,
      duration,
      metadata,
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * Start a new user session
 * POST /api/recommendations/session/start
 */
router.post('/session/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { device, ipAddress } = req.body;
    const userId = await authenticatedUserId(req);

    const sessionId = await startUserSession(userId, { device, ipAddress });

    res.json({ sessionId });
  } catch (error) {
    next(error);
  }
});

/**
 * End a user session
 * POST /api/recommendations/session/end
 */
router.post('/session/end', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      throw Errors.validation('sessionId is required');
    }

    await endUserSession(sessionId);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * Get user engagement score and tier
 * GET /api/recommendations/engagement
 */
router.get('/engagement', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await authenticatedUserId(req);

    // First check if user exists
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      throw Errors.notFound('User not found');
    }

    // Get or calculate engagement score
    let engagementScore = user.engagementScore;

    // If score is not set, calculate it
    if (engagementScore === 0) {
      engagementScore = await calculateUserEngagementScore(userId);
    }

    // Get engagement tier
    const tier = getUserEngagementTier(engagementScore);

    // Check eligibility for early notifications
    const eligibleForEarlyAccess = await isEligibleForEarlyNotifications(userId);

    res.json({
      userId,
      engagementScore,
      tier,
      eligibleForEarlyAccess,
      nextTierThreshold: getNextTierThreshold(engagementScore),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Update user job preferences
 * PUT /api/recommendations/preferences
 */
router.put('/preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      preferredCategories,
      preferredLocations,
      preferredJobTypes,
      willingToRelocate,
      minSalary,
    } = req.body;

    const userId = await authenticatedUserId(req);

    // Check if preference exists
    const [existingPreference] = await db
      .select()
      .from(userJobPreferences)
      .where(eq(userJobPreferences.userId, userId));

    if (existingPreference) {
      // Update existing preference
      await db
        .update(userJobPreferences)
        .set({
          preferredCategories,
          preferredLocations,
          preferredJobTypes,
          willingToRelocate,
          minSalary,
          updatedAt: new Date(),
        })
        .where(eq(userJobPreferences.userId, userId));
    } else {
      // Create new preference
      await db.insert(userJobPreferences).values({
        userId,
        preferredCategories,
        preferredLocations,
        preferredJobTypes,
        willingToRelocate,
        minSalary,
        updatedAt: new Date(),
      });
    }

    // Update user's willing to relocate flag
    if (willingToRelocate !== undefined) {
      await db.update(users).set({ willingToRelocate }).where(eq(users.id, userId));
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * Get next tier threshold based on current engagement score
 */
function getNextTierThreshold(currentScore: number): number {
  if (currentScore < 50) {
    return 50; // Medium tier
  } else if (currentScore < 150) {
    return 150; // High tier
  } else if (currentScore < 300) {
    return 300; // Premium tier
  } else {
    return -1; // Already at highest tier
  }
}

export default router;
