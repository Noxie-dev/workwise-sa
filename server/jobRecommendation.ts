import { db } from "./db";
import {
  users,
  jobs,
  categories,
  companies,
  userInteractions,
  userJobPreferences,
  userSessions,
  userNotifications,
  User,
  Job,
  JobWithCompany
} from "@shared/schema";
import { eq, and, desc, sql, inArray, like, or } from "drizzle-orm";
import { calculateEnhancedJobMatchScore } from './services/enhancedJobScoring';

/**
 * Job Recommendation Algorithm for WorkWise.SA
 *
 * This module implements an intelligent job matching algorithm that pairs users
 * with relevant job opportunities based on multiple factors:
 *
 * 1. User's chosen job categories
 * 2. User profile information (location, skills, experience)
 * 3. Engagement with advertisements
 * 4. Content consumption in Wise-Up section
 * 5. Overall platform engagement (frequency of login, session time)
 *
 * High-engagement users receive early access to new job listings
 * and personalized job recommendations via push notifications.
 */

// Engagement score thresholds
const ENGAGEMENT_THRESHOLDS = {
  LOW: 0,     // New user or minimal engagement
  MEDIUM: 50, // Regular user with some engagement
  HIGH: 150,  // Active user with significant engagement
  PREMIUM: 300 // Power user with very high engagement
};

// Scoring weights for different recommendation factors
const RECOMMENDATION_WEIGHTS = {
  CATEGORY_MATCH: 35,       // Weight for matching job category
  LOCATION_MATCH: 25,       // Weight for location match
  SKILLS_MATCH: 20,         // Weight for skills match
  INTERACTION_HISTORY: 15,  // Weight for job interaction history
  WISE_UP_CONTENT: 5        // Weight for Wise-Up content engagement
};

// Types for job recommendation algorithm
interface RecommendationScore {
  jobId: number;
  score: number;
  matchingFactors: string[];
}

interface JobRecommendationOptions {
  limit?: number;
  includeApplied?: boolean;
  includeRelocation?: boolean;
  maxDistance?: number; // in km
}

/**
 * Calculate engagement score for a user based on platform activity
 */
export async function calculateUserEngagementScore(userId: number): Promise<number> {
  try {
    // Get user sessions (login frequency, duration)
    const sessions = await db.select().from(userSessions).where(eq(userSessions.userId, userId));

    // Get user interactions (job views, applications, video watches)
    const interactions = await db.select().from(userInteractions).where(eq(userInteractions.userId, userId));

    let score = 0;

    // Score based on number of sessions (login frequency)
    score += sessions.length * 2;

    // Score based on session duration
    const totalDuration = sessions.reduce((sum: number, session: any) => {
      return sum + (session.duration || 0);
    }, 0);
    score += Math.floor(totalDuration / 3600) * 5; // 5 points per hour spent on site

    // Score based on interactions
    interactions.forEach((interaction: any) => {
      switch (interaction.interactionType) {
        case 'view':
          score += 1;
          break;
        case 'apply':
          score += 10;
          break;
        case 'save':
          score += 3;
          break;
        case 'share':
          score += 5;
          break;
        case 'video_watch':
          // Score based on percentage of video watched
          const videoDuration = interaction.duration || 0;
          if (videoDuration > 30) {
            score += 2;
          }
          break;
        default:
          score += 1;
      }
    });

    // Update user's engagement score in database
    await db.update(users)
      .set({ engagementScore: score })
      .where(eq(users.id, userId));

    return score;
  } catch (error) {
    console.error('Error calculating user engagement score:', error);
    return 0;
  }
}

/**
 * Get user's engagement tier based on their engagement score
 */
export function getUserEngagementTier(engagementScore: number): 'low' | 'medium' | 'high' | 'premium' {
  if (engagementScore >= ENGAGEMENT_THRESHOLDS.PREMIUM) {
    return 'premium';
  } else if (engagementScore >= ENGAGEMENT_THRESHOLDS.HIGH) {
    return 'high';
  } else if (engagementScore >= ENGAGEMENT_THRESHOLDS.MEDIUM) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Get jobs a user has already applied for
 */
async function getUserAppliedJobs(userId: number): Promise<number[]> {
  const appliedJobInteractions = await db.select()
    .from(userInteractions)
    .where(and(
      eq(userInteractions.userId, userId),
      eq(userInteractions.interactionType, 'apply')
    ));

  return appliedJobInteractions
    .filter((interaction: any) => interaction.jobId !== null)
    .map((interaction: any) => interaction.jobId as number);
}

/**
 * Calculate category match score based on user's preferred categories and interactions
 */
async function calculateCategoryMatchScore(userId: number, job: Job): Promise<number> {
  // Get user preferences
  const [userPreference] = await db.select()
    .from(userJobPreferences)
    .where(eq(userJobPreferences.userId, userId));

  // If user has no preferences, return a medium score
  if (!userPreference || !userPreference.preferredCategories) {
    return 15; // Medium score if no preferences set
  }

  const preferredCategories = userPreference.preferredCategories as number[];

  // Exact category match
  if (preferredCategories.includes(job.categoryId)) {
    return 35; // Perfect match
  }

  // Get user interactions with categories
  const categoryInteractions = await db.select()
    .from(userInteractions)
    .where(and(
      eq(userInteractions.userId, userId),
      eq(userInteractions.categoryId, job.categoryId)
    ));

  if (categoryInteractions.length > 0) {
    return 25; // User has interacted with this category before
  }

  return 5; // Low match
}

/**
 * Calculate location match score
 */
async function calculateLocationMatchScore(userId: number, job: Job): Promise<number> {
  // Get user data and preferences
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const [userPreference] = await db.select()
    .from(userJobPreferences)
    .where(eq(userJobPreferences.userId, userId));

  // No location info available
  if (!user || !user.location) {
    return 10; // Default score if no location info
  }

  // Perfect location match
  if (user.location === job.location) {
    return 25; // Perfect match
  }

  // Willing to relocate
  const isWillingToRelocate = userPreference?.willingToRelocate || user.willingToRelocate;
  if (isWillingToRelocate) {
    return 15; // Moderate score if willing to relocate
  }

  // Check if job location is in preferred locations
  if (userPreference?.preferredLocations) {
    const preferredLocations = userPreference.preferredLocations as string[];
    if (preferredLocations.includes(job.location)) {
      return 20; // High score for preferred location
    }
  }

  // Low match
  return 5;
}

/**
 * Calculate interaction history score based on user's previous interactions with similar jobs
 */
async function calculateInteractionHistoryScore(userId: number, job: Job): Promise<number> {
  // Get interactions with same category
  const categoryInteractions = await db.select()
    .from(userInteractions)
    .where(and(
      eq(userInteractions.userId, userId),
      eq(userInteractions.categoryId, job.categoryId)
    ));

  // Get interactions with similar jobs
  const jobInteractions = await db.select()
    .from(userInteractions)
    .innerJoin(jobs, eq(userInteractions.jobId, jobs.id))
    .where(and(
      eq(userInteractions.userId, userId),
      eq(jobs.categoryId, job.categoryId)
    ));

  const interactionScore = categoryInteractions.length * 2 + jobInteractions.length * 3;

  // Maximum score cap
  return Math.min(interactionScore, 15);
}

/**
 * Calculate Wise-Up content engagement score
 */
async function calculateWiseUpContentScore(userId: number, job: Job): Promise<number> {
  // Get video interactions related to this job category
  // We're checking for videos that might be tagged with the same category
  const videoInteractions = await db.select()
    .from(userInteractions)
    .where(and(
      eq(userInteractions.userId, userId),
      eq(userInteractions.interactionType, 'video_watch'),
      eq(userInteractions.categoryId, job.categoryId)
    ));

  // Score based on number of relevant videos watched
  const watchCount = videoInteractions.length;

  // Maximum score cap
  return Math.min(watchCount * 1.5, 5);
}

/**
 * Calculate total job match score with enhanced algorithm
 * Falls back to original implementation if enhanced algorithm fails or returns null
 *
 * @param userId - The user ID
 * @param job - The job to match
 * @returns The recommendation score object
 */
async function calculateJobMatchScore(userId: number, job: Job): Promise<RecommendationScore> {
  try {
    // Try using the enhanced algorithm first
    const enhancedResult = await calculateEnhancedJobMatchScore(userId, job);

    // If the enhanced algorithm returns a valid result, use it
    if (enhancedResult !== null) {
      return {
        jobId: job.id,
        score: enhancedResult.score,
        matchingFactors: enhancedResult.matchingFactors
      };
    }

    // If enhanced algorithm returns null, fall back to original implementation
    console.log(`Enhanced scoring returned null for user ${userId} and job ${job.id}, falling back to original implementation`);
    return await calculateFallbackScore(userId, job);
  } catch (error) {
    console.error('Enhanced scoring failed, falling back to original implementation:', error);
    return await calculateFallbackScore(userId, job);
  }
}

/**
 * Calculate job match score using the original implementation
 * Used as a fallback when the enhanced algorithm fails
 *
 * @param userId - The user ID
 * @param job - The job to match
 * @returns The recommendation score object
 */
async function calculateFallbackScore(userId: number, job: Job): Promise<RecommendationScore> {
  // Use original implementation
  const categoryScore = await calculateCategoryMatchScore(userId, job);
  const locationScore = await calculateLocationMatchScore(userId, job);
  const interactionScore = await calculateInteractionHistoryScore(userId, job);
  const wiseUpScore = await calculateWiseUpContentScore(userId, job);

  // Calculate total score
  const totalScore = categoryScore + locationScore + interactionScore + wiseUpScore;

  // Track which factors contributed to the match
  const matchingFactors: string[] = [];

  if (categoryScore > 15) matchingFactors.push('category');
  if (locationScore > 15) matchingFactors.push('location');
  if (interactionScore > 8) matchingFactors.push('interaction_history');
  if (wiseUpScore > 2) matchingFactors.push('wise_up_content');

  return {
    jobId: job.id,
    score: totalScore,
    matchingFactors
  };
}

/**
 * Get personalized job recommendations for a user
 */
export async function getJobRecommendations(
  userId: number,
  options: JobRecommendationOptions = {}
): Promise<JobWithCompany[]> {
  const {
    limit = 10,
    includeApplied = false,
    includeRelocation = true,
    maxDistance = 50
  } = options;

  try {
    // Get user engagement score or calculate if not available
    let [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Calculate engagement score if not set
    if (user.engagementScore === 0) {
      user.engagementScore = await calculateUserEngagementScore(userId);
    }

    // Get all available jobs
    const allJobs = await db.select().from(jobs);

    // Get jobs user has already applied for
    const appliedJobIds = includeApplied ? [] : await getUserAppliedJobs(userId);

    // Filter out already applied jobs
    const potentialJobs = allJobs.filter((job: any) => !appliedJobIds.includes(job.id));

    // Calculate match scores
    const scorePromises = potentialJobs.map((job: any) => calculateJobMatchScore(userId, job));
    const jobScores = await Promise.all(scorePromises);

    // Sort by score descending
    const sortedJobScores = jobScores.sort((a, b) => b.score - a.score);

    // Get top recommendations
    const topJobIds = sortedJobScores.slice(0, limit).map(score => score.jobId);

    // Fetch full job details with company info
    const recommendedJobs = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        description: jobs.description,
        location: jobs.location,
        salary: jobs.salary,
        jobType: jobs.jobType,
        workMode: jobs.workMode,
        companyId: jobs.companyId,
        categoryId: jobs.categoryId,
        isFeatured: jobs.isFeatured,
        createdAt: jobs.createdAt,
        company: companies
      })
      .from(jobs)
      .innerJoin(companies, eq(jobs.companyId, companies.id))
      .where(inArray(jobs.id, topJobIds))
      .orderBy(desc(jobs.createdAt));

    return recommendedJobs;
  } catch (error) {
    console.error('Error getting job recommendations:', error);
    return [];
  }
}

/**
 * Check if a user is eligible for early job notifications
 */
export async function isEligibleForEarlyNotifications(userId: number): Promise<boolean> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));

  if (!user) {
    return false;
  }

  // Calculate engagement tier
  const tier = getUserEngagementTier(user.engagementScore);

  // Only high and premium tier users get early notifications
  return tier === 'high' || tier === 'premium';
}

/**
 * Send personalized job notification to user
 */
export async function sendJobNotificationToUser(
  userId: number,
  jobId: number
): Promise<boolean> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const [job] = await db
      .select()
      .from(jobs)
      .innerJoin(companies, eq(jobs.companyId, companies.id))
      .where(eq(jobs.id, jobId));

    if (!user || !job) {
      return false;
    }

    // Check if user has notification preferences enabled
    if (!user.notificationPreference) {
      return false;
    }

    // Generate notification content
    const content = `New job opportunity: ${job.title} at ${job.company.name} in ${job.location}`;

    // Create notification record
    await db.insert(userNotifications).values({
      userId: user.id,
      type: 'job_match',
      content,
      jobId: job.id,
      isRead: false
    });

    // In a real app, we would send a push notification here
    console.log(`Sending push notification to user ${userId}: ${content}`);

    return true;
  } catch (error) {
    console.error('Error sending job notification:', error);
    return false;
  }
}

/**
 * Add a new interaction record for a user
 */
export async function trackUserInteraction(
  userId: number,
  interactionType: string,
  data: {
    jobId?: number;
    videoId?: string;
    categoryId?: number;
    duration?: number;
    metadata?: any;
  }
): Promise<void> {
  try {
    // Create interaction record
    await db.insert(userInteractions).values({
      userId,
      interactionType,
      interactionTime: new Date(),
      jobId: data.jobId,
      videoId: data.videoId,
      categoryId: data.categoryId,
      duration: data.duration,
      metadata: data.metadata ? data.metadata : undefined
    });

    // Update engagement score when interaction happens
    await calculateUserEngagementScore(userId);
  } catch (error) {
    console.error('Error tracking user interaction:', error);
  }
}

/**
 * Start a new user session
 */
export async function startUserSession(
  userId: number,
  data: {
    device?: string;
    ipAddress?: string;
  }
): Promise<number> {
  try {
    const [session] = await db.insert(userSessions)
      .values({
        userId,
        startTime: new Date(),
        device: data.device,
        ipAddress: data.ipAddress
      })
      .returning();

    // Update user's last active timestamp
    await db.update(users)
      .set({ lastActive: new Date() })
      .where(eq(users.id, userId));

    return session?.id || 0;
  } catch (error) {
    console.error('Error starting user session:', error);
    return 0;
  }
}

/**
 * End a user session
 */
export async function endUserSession(sessionId: number): Promise<void> {
  try {
    const [session] = await db.select()
      .from(userSessions)
      .where(eq(userSessions.id, sessionId));

    if (!session) {
      return;
    }

    const startTime = new Date(session.startTime).getTime();
    const endTime = new Date().getTime();
    const duration = Math.floor((endTime - startTime) / 1000); // Duration in seconds

    await db.update(userSessions)
      .set({
        endTime: new Date(),
        duration
      })
      .where(eq(userSessions.id, sessionId));

    // Update engagement score when session ends
    await calculateUserEngagementScore(session.userId);
  } catch (error) {
    console.error('Error ending user session:', error);
  }
}

/**
 * Search jobs with personalized ranking based on user preferences
 */
export async function personalizedJobSearch(
  userId: number,
  query: string,
  options: JobRecommendationOptions = {}
): Promise<JobWithCompany[]> {
  const { limit = 20 } = options;

  try {
    // Split query into keywords
    const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2);

    // Get user preferences
    const [userPreference] = await db.select()
      .from(userJobPreferences)
      .where(eq(userJobPreferences.userId, userId));

    // Get user info including preferences
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Build where clause for search
    const whereConditions = keywords.map(keyword =>
      or(
        like(jobs.title, `%${keyword}%`),
        like(jobs.description, `%${keyword}%`),
        like(companies.name, `%${keyword}%`)
      )
    );

    // Perform the base search
    const searchResults = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        description: jobs.description,
        location: jobs.location,
        salary: jobs.salary,
        jobType: jobs.jobType,
        workMode: jobs.workMode,
        companyId: jobs.companyId,
        categoryId: jobs.categoryId,
        isFeatured: jobs.isFeatured,
        createdAt: jobs.createdAt,
        company: companies
      })
      .from(jobs)
      .innerJoin(companies, eq(jobs.companyId, companies.id))
      .where(and(...whereConditions))
      .limit(50); // Get more than we need for personalized ranking

    // If no user preferences, just return the search results
    if (!userPreference) {
      return searchResults.slice(0, limit);
    }

    // Personalize the results
    const scorePromises = searchResults.map(async (job: any) => {
      const jobData = {
        id: job.id,
        title: job.title,
        description: job.description,
        location: job.location,
        salary: job.salary,
        jobType: job.jobType,
        workMode: job.workMode,
        companyId: job.companyId,
        categoryId: job.categoryId,
        isFeatured: job.isFeatured,
        createdAt: job.createdAt,
        externalId: null,
        source: null,
        ingestedAt: null
      };

      const matchScore = await calculateJobMatchScore(userId, jobData);

      return {
        job,
        score: matchScore.score
      };
    });

    const scoredResults = await Promise.all(scorePromises);

    // Sort by score
    scoredResults.sort((a, b) => b.score - a.score);

    // Return top results
    return scoredResults.slice(0, limit).map(result => result.job);
  } catch (error) {
    console.error('Error in personalized job search:', error);
    return [];
  }
}