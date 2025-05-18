import { Router, Request, Response } from 'express';
import {
  getJobRecommendations,
  isEligibleForEarlyNotifications,
  sendJobNotificationToUser,
  trackUserInteraction,
  startUserSession,
  endUserSession,
  personalizedJobSearch,
  calculateUserEngagementScore,
  getUserEngagementTier
} from './jobRecommendation';
import { db } from './db';
import { users, userJobPreferences } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Create a new router instance
const router = Router();

/**
 * Get personalized job recommendations for authenticated user
 * GET /api/recommendations/jobs
 */
router.get('/jobs', async (req: Request, res: Response) => {
  try {
    // In a real application, we would get the authenticated user ID
    // For example sake, we're expecting it as a query parameter
    const userId = parseInt(req.query.userId as string);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Valid userId is required' });
    }
    
    // Parse optional parameters
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const includeApplied = req.query.includeApplied === 'true';
    const includeRelocation = req.query.includeRelocation !== 'false';
    const maxDistance = req.query.maxDistance ? parseInt(req.query.maxDistance as string) : 50;
    
    const recommendations = await getJobRecommendations(userId, {
      limit,
      includeApplied,
      includeRelocation,
      maxDistance
    });
    
    res.json(recommendations);
  } catch (error) {
    console.error('Error getting job recommendations:', error);
    res.status(500).json({ error: 'Failed to get job recommendations' });
  }
});

/**
 * Search jobs with personalized ranking
 * GET /api/recommendations/search
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.query.userId as string);
    const query = req.query.q as string;
    
    if (isNaN(userId) || !query) {
      return res.status(400).json({ error: 'Valid userId and query are required' });
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    
    const results = await personalizedJobSearch(userId, query, { limit });
    
    res.json(results);
  } catch (error) {
    console.error('Error searching jobs:', error);
    res.status(500).json({ error: 'Failed to search jobs' });
  }
});

/**
 * Track user interaction (view, apply, etc.)
 * POST /api/recommendations/track
 */
router.post('/track', async (req: Request, res: Response) => {
  try {
    const { userId, interactionType, jobId, videoId, categoryId, duration, metadata } = req.body;
    
    if (!userId || !interactionType) {
      return res.status(400).json({ error: 'userId and interactionType are required' });
    }
    
    await trackUserInteraction(userId, interactionType, {
      jobId,
      videoId,
      categoryId,
      duration,
      metadata
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking user interaction:', error);
    res.status(500).json({ error: 'Failed to track user interaction' });
  }
});

/**
 * Start a new user session
 * POST /api/recommendations/session/start
 */
router.post('/session/start', async (req: Request, res: Response) => {
  try {
    const { userId, device, ipAddress } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const sessionId = await startUserSession(userId, { device, ipAddress });
    
    res.json({ sessionId });
  } catch (error) {
    console.error('Error starting user session:', error);
    res.status(500).json({ error: 'Failed to start user session' });
  }
});

/**
 * End a user session
 * POST /api/recommendations/session/end
 */
router.post('/session/end', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }
    
    await endUserSession(sessionId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error ending user session:', error);
    res.status(500).json({ error: 'Failed to end user session' });
  }
});

/**
 * Get user engagement score and tier
 * GET /api/recommendations/engagement
 */
router.get('/engagement', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.query.userId as string);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Valid userId is required' });
    }
    
    // First check if user exists
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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
      nextTierThreshold: getNextTierThreshold(engagementScore)
    });
  } catch (error) {
    console.error('Error getting user engagement:', error);
    res.status(500).json({ error: 'Failed to get user engagement information' });
  }
});

/**
 * Update user job preferences
 * PUT /api/recommendations/preferences
 */
router.put('/preferences', async (req: Request, res: Response) => {
  try {
    const { userId, preferredCategories, preferredLocations, preferredJobTypes, willingToRelocate, minSalary } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    // Check if preference exists
    const [existingPreference] = await db.select()
      .from(userJobPreferences)
      .where(eq(userJobPreferences.userId, userId));
      
    if (existingPreference) {
      // Update existing preference
      await db.update(userJobPreferences)
        .set({
          preferredCategories,
          preferredLocations,
          preferredJobTypes,
          willingToRelocate,
          minSalary,
          updatedAt: new Date()
        })
        .where(eq(userJobPreferences.userId, userId));
    } else {
      // Create new preference
      await db.insert(userJobPreferences)
        .values({
          userId,
          preferredCategories,
          preferredLocations,
          preferredJobTypes,
          willingToRelocate,
          minSalary,
          updatedAt: new Date()
        });
    }
    
    // Update user's willing to relocate flag
    if (willingToRelocate !== undefined) {
      await db.update(users)
        .set({ willingToRelocate })
        .where(eq(users.id, userId));
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating user job preferences:', error);
    res.status(500).json({ error: 'Failed to update user job preferences' });
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