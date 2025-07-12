import { db } from '../db';
import {
  users,
  jobs,
  companies,
  categories,
  userInteractions,
  userJobPreferences,
  JobWithCompany,
  User
} from '@shared/schema';
import { eq, and, desc, sql, inArray, or, like } from 'drizzle-orm';

/**
 * Machine Learning-based Job Matching Service
 * Implements advanced algorithms for job-candidate matching
 */

export interface UserVector {
  userId: number;
  skillsVector: number[];
  locationPreferences: string[];
  categoryPreferences: number[];
  experienceLevel: number;
  engagementScore: number;
  lastActiveScore: number;
}

export interface JobVector {
  jobId: number;
  skillsRequired: string[];
  location: string;
  categoryId: number;
  seniorityLevel: number;
  popularityScore: number;
  recentnessScore: number;
}

export interface MatchResult {
  jobId: number;
  score: number;
  confidence: number;
  reasons: string[];
  job?: JobWithCompany;
}

export interface MLJobMatchingOptions {
  algorithm: 'cosine' | 'euclidean' | 'hybrid';
  includeHistoricalData: boolean;
  weightRecency: boolean;
  maxResults: number;
  minConfidence: number;
}

/**
 * Enhanced ML Job Matching Service
 */
export class MLJobMatchingService {
  private skillsEmbeddings: Map<string, number[]> = new Map();
  private jobVectors: Map<number, JobVector> = new Map();
  private userVectors: Map<number, UserVector> = new Map();
  
  // Common skills for embedding (simplified approach)
  private commonSkills = [
    'javascript', 'python', 'java', 'react', 'nodejs', 'sql', 'html', 'css',
    'typescript', 'docker', 'kubernetes', 'aws', 'azure', 'mongodb', 'postgresql',
    'machine learning', 'data analysis', 'project management', 'communication',
    'teamwork', 'leadership', 'problem solving', 'agile', 'scrum', 'git'
  ];

  constructor() {
    this.initializeSkillsEmbeddings();
  }

  /**
   * Initialize skills embeddings (simplified approach)
   * In a real implementation, you would use pre-trained embeddings
   */
  private initializeSkillsEmbeddings(): void {
    this.commonSkills.forEach((skill, index) => {
      // Create a simple embedding where each skill gets a unique position
      const embedding = new Array(this.commonSkills.length).fill(0);
      embedding[index] = 1;
      this.skillsEmbeddings.set(skill.toLowerCase(), embedding);
    });
  }

  /**
   * Convert skills array to vector representation
   */
  private skillsToVector(skills: string[]): number[] {
    const vector = new Array(this.commonSkills.length).fill(0);
    
    skills.forEach(skill => {
      const skillLower = skill.toLowerCase();
      const index = this.commonSkills.findIndex(commonSkill => 
        commonSkill.includes(skillLower) || skillLower.includes(commonSkill)
      );
      
      if (index !== -1) {
        vector[index] = 1;
      }
    });
    
    return vector;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
    const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Calculate Euclidean distance between two vectors
   */
  private euclideanDistance(vectorA: number[], vectorB: number[]): number {
    const distance = Math.sqrt(
      vectorA.reduce((sum, a, i) => sum + Math.pow(a - vectorB[i], 2), 0)
    );
    
    // Convert to similarity score (0-1, where 1 is most similar)
    return 1 / (1 + distance);
  }

  /**
   * Generate user vector from profile and preferences
   */
  async generateUserVector(userId: number): Promise<UserVector | null> {
    try {
      // Get user data
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) return null;

      // Get user preferences
      const [preferences] = await db.select()
        .from(userJobPreferences)
        .where(eq(userJobPreferences.userId, userId));

      // Get user interactions for engagement analysis
      const interactions = await db.select()
        .from(userInteractions)
        .where(eq(userInteractions.userId, userId));

      // Extract skills from user profile
      const userSkills = (user.skills as string[]) || [];
      const skillsVector = this.skillsToVector(userSkills);

      // Calculate experience level (0-1 scale)
      const experienceData = (user.experience as any[]) || [];
      const experienceLevel = Math.min(1, experienceData.length * 0.2);

      // Calculate engagement score
      const engagementScore = Math.min(1, (user.engagementScore || 0) / 300);

      // Calculate last active score (recency)
      const lastActive = user.lastActive ? new Date(user.lastActive).getTime() : 0;
      const now = Date.now();
      const daysSinceActive = (now - lastActive) / (1000 * 60 * 60 * 24);
      const lastActiveScore = Math.max(0, 1 - daysSinceActive / 30); // Decay over 30 days

      const userVector: UserVector = {
        userId,
        skillsVector,
        locationPreferences: (preferences?.preferredLocations as string[]) || [user.location || ''],
        categoryPreferences: (preferences?.preferredCategories as number[]) || [],
        experienceLevel,
        engagementScore,
        lastActiveScore
      };

      this.userVectors.set(userId, userVector);
      return userVector;
    } catch (error) {
      console.error('Error generating user vector:', error);
      return null;
    }
  }

  /**
   * Generate job vector from job data
   */
  async generateJobVector(jobId: number): Promise<JobVector | null> {
    try {
      // Get job with company data
      const [jobData] = await db.select()
        .from(jobs)
        .innerJoin(companies, eq(jobs.companyId, companies.id))
        .where(eq(jobs.id, jobId));

      if (!jobData) return null;

      const job = jobData.jobs;
      
      // Extract skills from job description
      const skillsRequired = this.extractSkillsFromDescription(job.description);
      
      // Calculate seniority level based on job title and description
      const seniorityLevel = this.calculateSeniorityLevel(job.title, job.description);
      
      // Calculate popularity score based on interactions
      const popularityScore = await this.calculateJobPopularityScore(jobId);
      
      // Calculate recency score
      const createdAt = new Date(job.createdAt).getTime();
      const now = Date.now();
      const daysOld = (now - createdAt) / (1000 * 60 * 60 * 24);
      const recentnessScore = Math.max(0, 1 - daysOld / 30); // Decay over 30 days

      const jobVector: JobVector = {
        jobId,
        skillsRequired,
        location: job.location,
        categoryId: job.categoryId,
        seniorityLevel,
        popularityScore,
        recentnessScore
      };

      this.jobVectors.set(jobId, jobVector);
      return jobVector;
    } catch (error) {
      console.error('Error generating job vector:', error);
      return null;
    }
  }

  /**
   * Extract skills from job description using pattern matching
   */
  private extractSkillsFromDescription(description: string): string[] {
    const extractedSkills: string[] = [];
    const descriptionLower = description.toLowerCase();
    
    this.commonSkills.forEach(skill => {
      if (descriptionLower.includes(skill)) {
        extractedSkills.push(skill);
      }
    });
    
    // Additional pattern matching for common skill patterns
    const skillPatterns = [
      /(?:experience with|knowledge of|proficient in|skilled in)\s+([^,.]+)/gi,
      /(?:technologies|tech stack|tools):\s*([^.]+)/gi,
      /(?:required skills|must have|essential):\s*([^.]+)/gi
    ];
    
    skillPatterns.forEach(pattern => {
      const matches = description.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const skills = match.split(/[,&]/).map(s => s.trim().toLowerCase());
          skills.forEach(skill => {
            if (skill.length > 2 && this.commonSkills.includes(skill)) {
              extractedSkills.push(skill);
            }
          });
        });
      }
    });
    
    return [...new Set(extractedSkills)]; // Remove duplicates
  }

  /**
   * Calculate seniority level from job title and description
   */
  private calculateSeniorityLevel(title: string, description: string): number {
    const text = (title + ' ' + description).toLowerCase();
    
    // Senior level indicators
    if (text.includes('senior') || text.includes('lead') || text.includes('principal') || 
        text.includes('architect') || text.includes('manager')) {
      return 0.8;
    }
    
    // Mid level indicators
    if (text.includes('mid') || text.includes('intermediate') || 
        text.includes('experienced') || /\d+\+?\s*years/.test(text)) {
      return 0.6;
    }
    
    // Junior level indicators
    if (text.includes('junior') || text.includes('entry') || text.includes('graduate') || 
        text.includes('intern') || text.includes('trainee')) {
      return 0.2;
    }
    
    // Default mid-level
    return 0.5;
  }

  /**
   * Calculate job popularity score based on interactions
   */
  private async calculateJobPopularityScore(jobId: number): Promise<number> {
    try {
      const interactions = await db.select()
        .from(userInteractions)
        .where(eq(userInteractions.jobId, jobId));
      
      const views = interactions.filter(i => i.interactionType === 'view').length;
      const applications = interactions.filter(i => i.interactionType === 'apply').length;
      const saves = interactions.filter(i => i.interactionType === 'save').length;
      
      // Weighted popularity score
      const popularityScore = (views * 0.1 + applications * 2 + saves * 0.5) / 10;
      
      return Math.min(1, popularityScore);
    } catch (error) {
      console.error('Error calculating job popularity:', error);
      return 0;
    }
  }

  /**
   * Calculate match score between user and job vectors
   */
  private calculateMatchScore(
    userVector: UserVector, 
    jobVector: JobVector, 
    algorithm: 'cosine' | 'euclidean' | 'hybrid'
  ): { score: number; confidence: number; reasons: string[] } {
    const reasons: string[] = [];
    let totalScore = 0;
    let confidence = 0;

    // 1. Skills similarity (40% weight)
    const jobSkillsVector = this.skillsToVector(jobVector.skillsRequired);
    let skillsSimilarity = 0;
    
    if (algorithm === 'cosine' || algorithm === 'hybrid') {
      skillsSimilarity = this.cosineSimilarity(userVector.skillsVector, jobSkillsVector);
    } else {
      skillsSimilarity = this.euclideanDistance(userVector.skillsVector, jobSkillsVector);
    }
    
    const skillsScore = skillsSimilarity * 40;
    totalScore += skillsScore;
    
    if (skillsSimilarity > 0.7) {
      reasons.push('Strong skills match');
      confidence += 0.3;
    } else if (skillsSimilarity > 0.4) {
      reasons.push('Good skills alignment');
      confidence += 0.2;
    }

    // 2. Location match (20% weight)
    const locationMatch = userVector.locationPreferences.includes(jobVector.location) ||
                         jobVector.location.toLowerCase() === 'remote' ||
                         userVector.locationPreferences.includes('remote');
    
    const locationScore = locationMatch ? 20 : 5;
    totalScore += locationScore;
    
    if (locationMatch) {
      reasons.push('Location preference match');
      confidence += 0.2;
    }

    // 3. Category preference match (15% weight)
    const categoryMatch = userVector.categoryPreferences.includes(jobVector.categoryId);
    const categoryScore = categoryMatch ? 15 : 3;
    totalScore += categoryScore;
    
    if (categoryMatch) {
      reasons.push('Category preference match');
      confidence += 0.15;
    }

    // 4. Experience level alignment (15% weight)
    const experienceDiff = Math.abs(userVector.experienceLevel - jobVector.seniorityLevel);
    const experienceScore = (1 - experienceDiff) * 15;
    totalScore += experienceScore;
    
    if (experienceDiff < 0.2) {
      reasons.push('Experience level alignment');
      confidence += 0.15;
    }

    // 5. User engagement bonus (5% weight)
    const engagementScore = userVector.engagementScore * 5;
    totalScore += engagementScore;

    // 6. Job popularity and recency bonus (5% weight)
    const jobQualityScore = (jobVector.popularityScore + jobVector.recentnessScore) * 2.5;
    totalScore += jobQualityScore;

    // Normalize confidence score
    confidence = Math.min(1, confidence);
    
    return {
      score: Math.min(100, totalScore),
      confidence,
      reasons
    };
  }

  /**
   * Find matching jobs for a user using ML algorithms
   */
  async findMatchingJobs(
    userId: number, 
    options: MLJobMatchingOptions = {
      algorithm: 'hybrid',
      includeHistoricalData: true,
      weightRecency: true,
      maxResults: 20,
      minConfidence: 0.3
    }
  ): Promise<MatchResult[]> {
    try {
      // Generate user vector
      const userVector = await this.generateUserVector(userId);
      if (!userVector) {
        console.error('Could not generate user vector');
        return [];
      }

      // Get all available jobs
      const allJobs = await db.select()
        .from(jobs)
        .innerJoin(companies, eq(jobs.companyId, companies.id))
        .orderBy(desc(jobs.createdAt));

      const matchResults: MatchResult[] = [];

      // Calculate match scores for each job
      for (const jobData of allJobs) {
        const job = jobData.jobs;
        const company = jobData.companies;
        
        // Generate job vector
        const jobVector = await this.generateJobVector(job.id);
        if (!jobVector) continue;

        // Calculate match score
        const matchResult = this.calculateMatchScore(userVector, jobVector, options.algorithm);
        
        // Apply confidence filter
        if (matchResult.confidence < options.minConfidence) continue;

        // Create result object
        const result: MatchResult = {
          jobId: job.id,
          score: matchResult.score,
          confidence: matchResult.confidence,
          reasons: matchResult.reasons,
          job: {
            ...job,
            company
          }
        };

        matchResults.push(result);
      }

      // Sort by score (descending) and limit results
      return matchResults
        .sort((a, b) => b.score - a.score)
        .slice(0, options.maxResults);

    } catch (error) {
      console.error('Error in ML job matching:', error);
      return [];
    }
  }

  /**
   * Get similar users based on vector similarity
   */
  async findSimilarUsers(userId: number, limit: number = 10): Promise<number[]> {
    try {
      const targetUserVector = await this.generateUserVector(userId);
      if (!targetUserVector) return [];

      // Get all users
      const allUsers = await db.select().from(users);
      const similarities: { userId: number; similarity: number }[] = [];

      for (const user of allUsers) {
        if (user.id === userId) continue;

        const userVector = await this.generateUserVector(user.id);
        if (!userVector) continue;

        const similarity = this.cosineSimilarity(
          targetUserVector.skillsVector,
          userVector.skillsVector
        );

        similarities.push({ userId: user.id, similarity });
      }

      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(s => s.userId);

    } catch (error) {
      console.error('Error finding similar users:', error);
      return [];
    }
  }

  /**
   * Get collaborative filtering recommendations
   */
  async getCollaborativeRecommendations(userId: number, limit: number = 10): Promise<MatchResult[]> {
    try {
      // Find similar users
      const similarUsers = await this.findSimilarUsers(userId, 20);
      
      if (similarUsers.length === 0) {
        return [];
      }

      // Get jobs that similar users have interacted with positively
      const recommendedJobIds = await db.select()
        .from(userInteractions)
        .where(
          and(
            inArray(userInteractions.userId, similarUsers),
            or(
              eq(userInteractions.interactionType, 'apply'),
              eq(userInteractions.interactionType, 'save')
            )
          )
        );

      // Get unique job IDs
      const jobIds = [...new Set(recommendedJobIds
        .filter(interaction => interaction.jobId)
        .map(interaction => interaction.jobId!)
      )];

      // Generate match results for these jobs
      const userVector = await this.generateUserVector(userId);
      if (!userVector) return [];

      const results: MatchResult[] = [];

      for (const jobId of jobIds.slice(0, limit)) {
        const jobVector = await this.generateJobVector(jobId);
        if (!jobVector) continue;

        const matchResult = this.calculateMatchScore(userVector, jobVector, 'hybrid');
        
        // Get job details
        const [jobData] = await db.select()
          .from(jobs)
          .innerJoin(companies, eq(jobs.companyId, companies.id))
          .where(eq(jobs.id, jobId));

        if (jobData) {
          results.push({
            jobId,
            score: matchResult.score,
            confidence: matchResult.confidence,
            reasons: [...matchResult.reasons, 'Similar users recommendation'],
            job: {
              ...jobData.jobs,
              company: jobData.companies
            }
          });
        }
      }

      return results.sort((a, b) => b.score - a.score);

    } catch (error) {
      console.error('Error in collaborative filtering:', error);
      return [];
    }
  }

  /**
   * Clear cached vectors (useful for testing or data updates)
   */
  clearCache(): void {
    this.jobVectors.clear();
    this.userVectors.clear();
  }
}

// Create singleton instance
export const mlJobMatchingService = new MLJobMatchingService();
