import { db } from "../db";
import {
  users,
  jobs,
  userInteractions,
  userJobPreferences,
  userSessions,
  Job,
  User,
  UserJobPreference
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

// -------------------------------------------------------------------------------------
// CONSTANTS & TYPES
// -------------------------------------------------------------------------------------

/**
 * Default weights for each component of the job match score.
 * These weights determine the maximum possible score for each component.
 * The sum of all weights equals 1.0 (100%).
 */
const DEFAULT_WEIGHTS = {
  category: 0.35,  // Category matching (max 35 points)
  location: 0.25,  // Location matching (max 25 points)
  skills: 0.20,    // Skills matching (max 20 points)
  interaction: 0.15, // Interaction history (max 15 points)
  content: 0.05    // Content engagement (max 5 points)
};

/**
 * Thresholds for determining engagement tiers based on the overall score.
 * Calibrated for a 0-100 scale.
 */
const TIER_THRESHOLDS = {
  low: 30,      // Score < 30 = Low
  medium: 55,   // Score 30-54 = Medium
  high: 75      // Score 55-74 = High; Score >= 75 = Premium
};

/**
 * User preferences data structure
 */
export interface UserPreferences {
  preferredCategories: number[];
  preferredLocations: string[];
  skills: string[];
  willingToRelocate: boolean;
}

/**
 * User interaction history data structure
 */
export interface UserInteractionHistory {
  views: number;
  applications: number;
  saves: number;
  shares: number;
  videoWatchDurationSec: number;
}

/**
 * Result of the job match calculation
 */
export interface JobMatchResult {
  score: number;
  tier: string;
  matchingFactors: string[];
}

// -------------------------------------------------------------------------------------
// PURE FUNCTIONS (NON-INTERACTIVE)
// -------------------------------------------------------------------------------------

/**
 * Computes the overall job match score by summing the pre-scaled component scores.
 * Each component score is already scaled to its maximum contribution (Method A).
 *
 * @param categoryScore - Category match score (0-35)
 * @param locationScore - Location match score (0-25)
 * @param skillsScore - Skills match score (0-20)
 * @param interactionScore - Interaction history score (0-15)
 * @param contentScore - Content engagement score (0-5)
 * @returns The overall job match score (0-100)
 */
function computeOverallScore(
  categoryScore: number,
  locationScore: number,
  skillsScore: number,
  interactionScore: number,
  contentScore: number
): number {
  // Simply sum the pre-scaled component scores (Method A)
  return categoryScore + locationScore + skillsScore + interactionScore + contentScore;
}

/**
 * Determines the engagement tier based on the overall score.
 *
 * @param score - The overall job match score (0-100)
 * @returns The engagement tier (Low, Medium, High, Premium)
 */
function getEngagementTier(score: number): string {
  if (score >= TIER_THRESHOLDS.high) return "Premium";
  if (score >= TIER_THRESHOLDS.medium) return "High";
  if (score >= TIER_THRESHOLDS.low) return "Medium";
  return "Low";
}

/**
 * Computes the category match score based on user preferences and job category.
 *
 * @param userPreferredCategories - User's preferred job categories
 * @param jobCategoryId - The job's category ID
 * @param hasHistory - Whether the user has interaction history with this category
 * @returns Category match score (0-35)
 */
function computeCategoryMatch(
  userPreferredCategories: number[],
  jobCategoryId: number,
  hasHistory: boolean
): number {
  // Top preference: exact category match
  if (userPreferredCategories.includes(jobCategoryId)) {
    return 35; // Perfect match (35 points)
  }

  // Secondary preference: has history with this category
  if (hasHistory) {
    return 25; // History match (25 points)
  }

  // No match or history
  return 5; // Low match (5 points)
}

/**
 * Computes the skills match score based on user skills and job required skills.
 *
 * @param userSkills - User's skills
 * @param jobSkills - Job's required skills
 * @returns Skills match score (0-20)
 */
function computeSkillsMatch(userSkills: string[], jobSkills: string[]): number {
  const maxScore = 20;

  // Handle edge case: no job skills specified
  if (!jobSkills || jobSkills.length === 0) {
    return 5; // Default low-medium score when no skills are specified
  }

  // Handle edge case: user has no skills
  if (!userSkills || userSkills.length === 0) {
    return 5; // Default low-medium score when user has no skills
  }

  // Find common skills using case-insensitive partial matching
  const common = userSkills.filter(skill =>
    jobSkills.some(jobSkill =>
      jobSkill.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(jobSkill.toLowerCase())
    )
  );

  // Calculate match ratio
  const ratio = common.length / Math.max(1, jobSkills.length);

  // Scale to max score and ensure it doesn't exceed the maximum
  return Math.min(maxScore, Math.round(ratio * maxScore));
}

/**
 * Computes the location match score based on user preferences and job location.
 *
 * @param userLocations - User's preferred locations
 * @param jobLocation - Job location
 * @param willingToRelocate - Whether the user is willing to relocate
 * @returns Location match score (0-25)
 */
function computeLocationMatch(
  userLocations: string[],
  jobLocation: string,
  willingToRelocate: boolean
): number {
  // Handle remote jobs specially
  if (jobLocation.toLowerCase() === 'remote') {
    // If user has explicitly preferred remote locations
    if (userLocations.some(loc => loc.toLowerCase() === 'remote')) {
      return 25; // Perfect match for remote preference
    }
    // Remote is generally accessible to most users
    return 20; // High score for remote jobs
  }

  // Perfect location match
  if (userLocations.some(loc => loc.toLowerCase() === jobLocation.toLowerCase())) {
    return 25; // Perfect match (25 points)
  }

  // Willing to relocate
  if (willingToRelocate) {
    return 15; // Moderate match (15 points)
  }

  // No match
  return 5; // Low match (5 points)
}

/**
 * Computes the interaction history score based on user's past interactions.
 *
 * @param history - User's interaction history
 * @returns Interaction history score (0-15)
 */
function computeInteractionScore(history: UserInteractionHistory): number {
  const maxScore = 15;

  // Adjusted weights for different interaction types
  const viewWeight = 0.2;       // 5 views = 1 point
  const applicationWeight = 5;  // 1 application = 5 points
  const saveWeight = 1;         // 1 save = 1 point
  const shareWeight = 2;        // 1 share = 2 points

  // Video points: 0.5 points per 30 minutes watched (clearer calculation)
  const videoPoints = Math.min(5, (history.videoWatchDurationSec / 1800) * 0.5);

  // Calculate base score from interactions
  const interactionPoints =
    history.views * viewWeight +
    history.applications * applicationWeight +
    history.saves * saveWeight +
    history.shares * shareWeight;

  // Combine and ensure it doesn't exceed the maximum
  return Math.min(maxScore, Math.round(interactionPoints + videoPoints));
}

// -------------------------------------------------------------------------------------
// INTERACTIVE FUNCTIONS (DATABASE ACCESS)
// -------------------------------------------------------------------------------------

/**
 * Retrieves user preferences from the database.
 *
 * @param userId - The user ID
 * @returns User preferences or null if not found
 */
async function getUserPreferences(userId: number): Promise<UserPreferences | null> {
  try {
    const [userPreference] = await db.select()
      .from(userJobPreferences)
      .where(eq(userJobPreferences.userId, userId));

    const [userData] = await db.select()
      .from(users)
      .where(eq(users.id, userId));

    // If neither user data nor preferences exist, return null
    if (!userData && !userPreference) {
      console.warn(`No user data or preferences found for user ID ${userId}`);
      return null;
    }

    return {
      preferredCategories: (userPreference?.preferredCategories as number[]) || [],
      preferredLocations: (userPreference?.preferredLocations as string[]) || [],
      skills: (userData?.skills as string[]) || [],
      willingToRelocate: userPreference?.willingToRelocate || userData?.willingToRelocate || false
    };
  } catch (error) {
    console.error(`Error fetching user preferences for user ID ${userId}:`, error);
    return null;
  }
}

/**
 * Retrieves user interaction history from the database.
 *
 * @param userId - The user ID
 * @returns User interaction history or null if an error occurs
 */
async function getUserInteractionHistory(userId: number): Promise<UserInteractionHistory | null> {
  try {
    const interactions = await db.select()
      .from(userInteractions)
      .where(eq(userInteractions.userId, userId));

    const views = interactions.filter(i => i.interactionType === 'view').length;
    const applications = interactions.filter(i => i.interactionType === 'apply').length;
    const saves = interactions.filter(i => i.interactionType === 'save').length;
    const shares = interactions.filter(i => i.interactionType === 'share').length;

    const videoWatchDurationSec = interactions
      .filter(i => i.interactionType === 'video_watch')
      .reduce((total, i) => total + (i.duration || 0), 0);

    return {
      views,
      applications,
      saves,
      shares,
      videoWatchDurationSec
    };
  } catch (error) {
    console.error(`Error fetching interaction history for user ID ${userId}:`, error);
    return null;
  }
}

/**
 * Computes the content engagement score based on user's interactions with content.
 *
 * @param userId - The user ID
 * @param jobCategoryId - The job category ID
 * @returns Content engagement score (0-5)
 */
async function computeContentEngagement(userId: number, jobCategoryId: number): Promise<number> {
  try {
    // Get video watch interactions for this category
    const videoInteractions = await db.select()
      .from(userInteractions)
      .where(and(
        eq(userInteractions.userId, userId),
        eq(userInteractions.interactionType, 'video_watch'),
        eq(userInteractions.categoryId, jobCategoryId)
      ));

    // Get other content interactions (e.g., article reads, course completions)
    const contentInteractions = await db.select()
      .from(userInteractions)
      .where(and(
        eq(userInteractions.userId, userId),
        eq(userInteractions.interactionType, 'content_view'),
        eq(userInteractions.categoryId, jobCategoryId)
      ));

    // Calculate engagement score based on interaction counts
    const watchCount = videoInteractions.length;
    const contentCount = contentInteractions.length;

    // Combine scores: 1 point per video (max 3), 0.5 points per content view (max 2)
    const videoScore = Math.min(3, watchCount);
    const contentScore = Math.min(2, contentCount * 0.5);

    return videoScore + contentScore;
  } catch (error) {
    console.error(`Error computing content engagement for user ID ${userId}:`, error);
    return 0; // Default to 0 on error
  }
}

// -------------------------------------------------------------------------------------
// MAIN SCORING FUNCTION
// -------------------------------------------------------------------------------------

/**
 * Calculates the enhanced job match score for a user and job.
 *
 * @param userId - The user ID
 * @param job - The job to match
 * @returns The job match result or null if scoring is impossible
 */
export async function calculateEnhancedJobMatchScore(
  userId: number,
  job: Job
): Promise<JobMatchResult | null> {
  try {
    // Get user data and preferences using Promise.all for parallel execution
    const [userPrefs, interactionHistory] = await Promise.all([
      getUserPreferences(userId),
      getUserInteractionHistory(userId)
    ]);

    // Handle case where essential data is missing
    if (!userPrefs || !interactionHistory) {
      console.warn(`Cannot calculate job match score for user ${userId} due to missing data`);
      return null;
    }

    // Check for category interaction history
    const categoryInteractions = await db.select()
      .from(userInteractions)
      .where(and(
        eq(userInteractions.userId, userId),
        eq(userInteractions.categoryId, job.categoryId)
      ));

    const hasHistoryWithCategory = categoryInteractions.length > 0;

    // Calculate component scores

    // 1. Category Matching (35%)
    const categoryScore = computeCategoryMatch(
      userPrefs.preferredCategories,
      job.categoryId,
      hasHistoryWithCategory
    );

    // 2. Location Matching (25%)
    const locationScore = computeLocationMatch(
      userPrefs.preferredLocations,
      job.location,
      userPrefs.willingToRelocate
    );

    // 3. Skills Matching (20%)
    // Extract skills from job description using regex
    const jobSkillsRaw = job.description
      .match(/skills?:?\s*(.*?)(?:\.|\n|$)/i)?.[1]?.split(/,|\sand\s/) || [];
    const jobSkills = jobSkillsRaw
      .map(skill => skill.trim())
      .filter(skill => skill.length > 2);

    const skillsScore = computeSkillsMatch(userPrefs.skills, jobSkills);

    // 4. Interaction History (15%)
    const interactionScore = computeInteractionScore(interactionHistory);

    // 5. Content Engagement (5%)
    const contentScore = await computeContentEngagement(userId, job.categoryId);

    // Calculate overall score (sum of pre-scaled component scores)
    const overallScore = computeOverallScore(
      categoryScore,
      locationScore,
      skillsScore,
      interactionScore,
      contentScore
    );

    // Determine engagement tier
    const tier = getEngagementTier(overallScore);

    // Track matching factors that significantly contributed to the score
    const matchingFactors: string[] = [];
    if (categoryScore > 15) matchingFactors.push('category');
    if (locationScore > 15) matchingFactors.push('location');
    if (skillsScore > 5) matchingFactors.push('skills');
    if (interactionScore > 5) matchingFactors.push('interaction_history');
    if (contentScore > 1) matchingFactors.push('wise_up_content');

    return {
      score: Math.round(overallScore), // Round to nearest integer
      tier,
      matchingFactors
    };
  } catch (error) {
    console.error('Error in enhanced job matching:', error);
    // Return null to indicate scoring failure
    return null;
  }
}