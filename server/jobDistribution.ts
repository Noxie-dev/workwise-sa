// server/jobDistribution.ts
import { Request, Response } from 'express';
import { db } from './db';
import { jobs, categories, users, userJobPreferences } from '@shared/schema';
import { eq, and, gte, lte, like, sql } from 'drizzle-orm';
import { storage } from './storage';

// Types for job distribution
export interface JobDistributionData {
  id: number;
  jobId: number;
  jobTitle: string;
  companyName: string;
  categoryId: number;
  categoryName: string;
  status: DistributionStatus;
  createdAt: string;
  updatedAt: string;
  distributedAt?: string;
  errorMessage?: string;
  priority: number;
  matchScore?: number;
  targetUserCount: number;
  actualUserCount: number;
}

export enum DistributionStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  IN_PROGRESS = 'in_progress',
  DISTRIBUTED = 'distributed',
  FAILED = 'failed'
}

export interface CategoryDistribution {
  id: number;
  name: string;
  slug: string;
  count: number;
  distributionStatus: {
    pending: number;
    distributed: number;
    failed: number;
  };
}

export interface AlgorithmConfiguration {
  priorityWeights: {
    skills: number;
    location: number;
    experience: number;
    engagement: number;
  };
  distributionLimits: {
    maxJobsPerUser: number;
    maxUsersPerJob: number;
    cooldownPeriod: number;
  };
  categorySettings: {
    [categoryId: number]: {
      enabled: boolean;
      priority: number;
      userGroupPercentages: {
        highEngagement: number;
        mediumEngagement: number;
        lowEngagement: number;
      };
    };
  };
}

// Default algorithm configuration
const DEFAULT_ALGORITHM_CONFIG: AlgorithmConfiguration = {
  priorityWeights: {
    skills: 0.4,
    location: 0.3,
    experience: 0.2,
    engagement: 0.1
  },
  distributionLimits: {
    maxJobsPerUser: 10,
    maxUsersPerJob: 100,
    cooldownPeriod: 24
  },
  categorySettings: {}
};

// Helper to get date range for queries
function getDateRange(dateRange: string) {
  const now = new Date();
  let startDate = new Date();
  
  switch (dateRange) {
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(now.getDate() - 90);
      break;
    default:
      startDate.setDate(now.getDate() - 30); // Default to 30 days
  }
  
  return { startDate, endDate: now };
}

/**
 * Get job distribution data with pagination and filtering
 */
export async function getJobDistribution(req: Request, res: Response) {
  try {
    const categoryFilter = req.query.categoryFilter as string || 'all';
    const dateRange = req.query.dateRange as string || '30d';
    const statusFilter = req.query.statusFilter as DistributionStatus | 'all' || 'all';
    const priorityFilter = req.query.priorityFilter as string || 'all';
    const searchQuery = req.query.searchQuery as string || '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // Get date range for filtering
    const { startDate, endDate } = getDateRange(dateRange);
    
    // Build query conditions
    let conditions = [
      gte(jobs.createdAt, startDate.toISOString()),
      lte(jobs.createdAt, endDate.toISOString())
    ];
    
    if (categoryFilter !== 'all') {
      const category = await db.select()
        .from(categories)
        .where(eq(categories.slug, categoryFilter))
        .limit(1);
      
      if (category.length > 0) {
        conditions.push(eq(jobs.categoryId, category[0].id));
      }
    }
    
    if (statusFilter !== 'all') {
      conditions.push(eq(jobs.distributionStatus, statusFilter));
    }
    
    if (priorityFilter !== 'all') {
      conditions.push(eq(jobs.priority, parseInt(priorityFilter)));
    }
    
    if (searchQuery) {
      conditions.push(
        sql`(${jobs.title} LIKE ${`%${searchQuery}%`} OR ${jobs.description} LIKE ${`%${searchQuery}%`})`
      );
    }
    
    // Get total count for pagination
    const totalCountResult = await db.select({ count: sql<number>`count(*)` })
      .from(jobs)
      .where(and(...conditions));
    
    const totalItems = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / limit);
    
    // Get job data with company information
    const jobsData = await db.select({
      id: jobs.id,
      jobId: jobs.id,
      jobTitle: jobs.title,
      companyId: jobs.companyId,
      categoryId: jobs.categoryId,
      status: jobs.distributionStatus,
      createdAt: jobs.createdAt,
      updatedAt: jobs.updatedAt,
      distributedAt: jobs.distributedAt,
      errorMessage: jobs.distributionError,
      priority: jobs.priority,
      matchScore: jobs.matchScore,
      targetUserCount: jobs.targetUserCount,
      actualUserCount: jobs.actualUserCount
    })
      .from(jobs)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(jobs.createdAt);
    
    // Get company and category names
    const enrichedJobsData: JobDistributionData[] = await Promise.all(
      jobsData.map(async (job) => {
        const company = await storage.getCompany(job.companyId);
        const category = await storage.getCategory(job.categoryId);
        
        return {
          ...job,
          companyName: company?.name || 'Unknown Company',
          categoryName: category?.name || 'Uncategorized'
        };
      })
    );
    
    res.json({
      data: enrichedJobsData,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching job distribution data:', error);
    res.status(500).json({ error: 'Failed to fetch job distribution data' });
  }
}

/**
 * Get category distribution statistics
 */
export async function getCategoryDistribution(req: Request, res: Response) {
  try {
    const dateRange = req.query.dateRange as string || '30d';
    
    // Get date range for filtering
    const { startDate, endDate } = getDateRange(dateRange);
    
    // Get all categories
    const categoriesData = await db.select().from(categories);
    
    // Get job counts for each category with distribution status
    const categoryDistribution: CategoryDistribution[] = await Promise.all(
      categoriesData.map(async (category) => {
        // Get total count
        const totalCountResult = await db.select({ count: sql<number>`count(*)` })
          .from(jobs)
          .where(
            and(
              eq(jobs.categoryId, category.id),
              gte(jobs.createdAt, startDate.toISOString()),
              lte(jobs.createdAt, endDate.toISOString())
            )
          );
        
        // Get counts by status
        const pendingCountResult = await db.select({ count: sql<number>`count(*)` })
          .from(jobs)
          .where(
            and(
              eq(jobs.categoryId, category.id),
              eq(jobs.distributionStatus, DistributionStatus.PENDING),
              gte(jobs.createdAt, startDate.toISOString()),
              lte(jobs.createdAt, endDate.toISOString())
            )
          );
        
        const distributedCountResult = await db.select({ count: sql<number>`count(*)` })
          .from(jobs)
          .where(
            and(
              eq(jobs.categoryId, category.id),
              eq(jobs.distributionStatus, DistributionStatus.DISTRIBUTED),
              gte(jobs.createdAt, startDate.toISOString()),
              lte(jobs.createdAt, endDate.toISOString())
            )
          );
        
        const failedCountResult = await db.select({ count: sql<number>`count(*)` })
          .from(jobs)
          .where(
            and(
              eq(jobs.categoryId, category.id),
              eq(jobs.distributionStatus, DistributionStatus.FAILED),
              gte(jobs.createdAt, startDate.toISOString()),
              lte(jobs.createdAt, endDate.toISOString())
            )
          );
        
        return {
          id: category.id,
          name: category.name,
          slug: category.slug,
          count: totalCountResult[0]?.count || 0,
          distributionStatus: {
            pending: pendingCountResult[0]?.count || 0,
            distributed: distributedCountResult[0]?.count || 0,
            failed: failedCountResult[0]?.count || 0
          }
        };
      })
    );
    
    res.json(categoryDistribution);
  } catch (error) {
    console.error('Error fetching category distribution:', error);
    res.status(500).json({ error: 'Failed to fetch category distribution' });
  }
}

/**
 * Get distribution workflow statistics
 */
export async function getDistributionWorkflow(req: Request, res: Response) {
  try {
    const dateRange = req.query.dateRange as string || '30d';
    
    // Get date range for filtering
    const { startDate, endDate } = getDateRange(dateRange);
    
    // Get counts for each workflow stage
    const jobIntakeCount = await db.select({ count: sql<number>`count(*)` })
      .from(jobs)
      .where(
        and(
          gte(jobs.createdAt, startDate.toISOString()),
          lte(jobs.createdAt, endDate.toISOString())
        )
      );
    
    const ruleMatchingCount = await db.select({ count: sql<number>`count(*)` })
      .from(jobs)
      .where(
        and(
          gte(jobs.createdAt, startDate.toISOString()),
          lte(jobs.createdAt, endDate.toISOString()),
          sql`${jobs.matchScore} IS NOT NULL`
        )
      );
    
    const ctaInjectionCount = await db.select({ count: sql<number>`count(*)` })
      .from(jobs)
      .where(
        and(
          gte(jobs.createdAt, startDate.toISOString()),
          lte(jobs.createdAt, endDate.toISOString()),
          sql`${jobs.ctaMessage} IS NOT NULL`
        )
      );
    
    const distributionCount = await db.select({ count: sql<number>`count(*)` })
      .from(jobs)
      .where(
        and(
          gte(jobs.createdAt, startDate.toISOString()),
          lte(jobs.createdAt, endDate.toISOString()),
          eq(jobs.distributionStatus, DistributionStatus.DISTRIBUTED)
        )
      );
    
    res.json({
      jobIntake: jobIntakeCount[0]?.count || 0,
      ruleMatching: ruleMatchingCount[0]?.count || 0,
      ctaInjection: ctaInjectionCount[0]?.count || 0,
      distribution: distributionCount[0]?.count || 0
    });
  } catch (error) {
    console.error('Error fetching distribution workflow stats:', error);
    res.status(500).json({ error: 'Failed to fetch distribution workflow stats' });
  }
}

/**
 * Get geographic distribution of jobs
 */
export async function getGeographicDistribution(req: Request, res: Response) {
  try {
    const dateRange = req.query.dateRange as string || '30d';
    const categoryFilter = req.query.categoryFilter as string || 'all';
    
    // Get date range for filtering
    const { startDate, endDate } = getDateRange(dateRange);
    
    // Build query conditions
    let conditions = [
      gte(jobs.createdAt, startDate.toISOString()),
      lte(jobs.createdAt, endDate.toISOString())
    ];
    
    if (categoryFilter !== 'all') {
      const category = await db.select()
        .from(categories)
        .where(eq(categories.slug, categoryFilter))
        .limit(1);
      
      if (category.length > 0) {
        conditions.push(eq(jobs.categoryId, category[0].id));
      }
    }
    
    // Get location data
    const locationData = await db.select({
      location: jobs.location,
      count: sql<number>`count(*)`
    })
      .from(jobs)
      .where(and(...conditions))
      .groupBy(jobs.location)
      .orderBy(sql`count(*) DESC`);
    
    res.json(locationData);
  } catch (error) {
    console.error('Error fetching geographic distribution:', error);
    res.status(500).json({ error: 'Failed to fetch geographic distribution' });
  }
}

/**
 * Get matching factors analysis
 */
export async function getMatchingFactorsAnalysis(req: Request, res: Response) {
  try {
    const dateRange = req.query.dateRange as string || '30d';
    
    // Get date range for filtering
    const { startDate, endDate } = getDateRange(dateRange);
    
    // This would typically come from your matching algorithm's analytics
    // For now, we'll return mock data that aligns with the expected format
    const matchingFactors = [
      { factor: 'Skills Match', count: 320, percentage: 32 },
      { factor: 'Location', count: 280, percentage: 28 },
      { factor: 'Experience Level', count: 245, percentage: 24.5 },
      { factor: 'User Engagement', count: 155, percentage: 15.5 }
    ];
    
    res.json(matchingFactors);
  } catch (error) {
    console.error('Error fetching matching factors analysis:', error);
    res.status(500).json({ error: 'Failed to fetch matching factors analysis' });
  }
}

/**
 * Get algorithm configuration
 */
export async function getAlgorithmConfiguration(req: Request, res: Response) {
  try {
    // In a real implementation, this would be stored in the database
    // For now, we'll return the default configuration
    res.json(DEFAULT_ALGORITHM_CONFIG);
  } catch (error) {
    console.error('Error fetching algorithm configuration:', error);
    res.status(500).json({ error: 'Failed to fetch algorithm configuration' });
  }
}

/**
 * Update algorithm configuration
 */
export async function updateAlgorithmConfiguration(req: Request, res: Response) {
  try {
    const config = req.body as AlgorithmConfiguration;
    
    // Validate configuration
    if (!config.priorityWeights || !config.distributionLimits) {
      return res.status(400).json({ error: 'Invalid configuration format' });
    }
    
    // In a real implementation, this would update the configuration in the database
    // For now, we'll just return success
    res.json({ success: true, config });
  } catch (error) {
    console.error('Error updating algorithm configuration:', error);
    res.status(500).json({ error: 'Failed to update algorithm configuration' });
  }
}

/**
 * Manually distribute a job
 */
export async function distributeJob(req: Request, res: Response) {
  try {
    const jobId = parseInt(req.params.jobId);
    
    if (isNaN(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }
    
    // Get the job
    const job = await storage.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // In a real implementation, this would trigger the distribution algorithm
    // For now, we'll just update the job status
    await db.update(jobs)
      .set({
        distributionStatus: DistributionStatus.IN_PROGRESS,
        updatedAt: new Date().toISOString()
      })
      .where(eq(jobs.id, jobId));
    
    // Simulate distribution process (in a real implementation, this would be a background job)
    setTimeout(async () => {
      try {
        // Update job with distribution results
        await db.update(jobs)
          .set({
            distributionStatus: DistributionStatus.DISTRIBUTED,
            distributedAt: new Date().toISOString(),
            actualUserCount: Math.floor(Math.random() * 50) + 10, // Random number for demo
            updatedAt: new Date().toISOString()
          })
          .where(eq(jobs.id, jobId));
      } catch (error) {
        console.error('Error completing job distribution:', error);
        
        // Update job with error status
        await db.update(jobs)
          .set({
            distributionStatus: DistributionStatus.FAILED,
            distributionError: 'Distribution process failed',
            updatedAt: new Date().toISOString()
          })
          .where(eq(jobs.id, jobId));
      }
    }, 2000);
    
    res.json({ success: true, message: 'Job distribution initiated' });
  } catch (error) {
    console.error('Error distributing job:', error);
    res.status(500).json({ error: 'Failed to distribute job' });
  }
}

/**
 * Update job priority
 */
export async function updateJobPriority(req: Request, res: Response) {
  try {
    const jobId = parseInt(req.params.jobId);
    const { priority } = req.body;
    
    if (isNaN(jobId) || !priority || priority < 1 || priority > 5) {
      return res.status(400).json({ error: 'Invalid job ID or priority' });
    }
    
    // Get the job
    const job = await storage.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Update job priority
    await db.update(jobs)
      .set({
        priority,
        updatedAt: new Date().toISOString()
      })
      .where(eq(jobs.id, jobId));
    
    res.json({ success: true, message: 'Job priority updated' });
  } catch (error) {
    console.error('Error updating job priority:', error);
    res.status(500).json({ error: 'Failed to update job priority' });
  }
}

/**
 * Remove job from distribution queue
 */
export async function removeFromQueue(req: Request, res: Response) {
  try {
    const jobId = parseInt(req.params.jobId);
    
    if (isNaN(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }
    
    // Get the job
    const job = await storage.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Update job status
    await db.update(jobs)
      .set({
        distributionStatus: DistributionStatus.PENDING, // Reset to pending
        updatedAt: new Date().toISOString()
      })
      .where(eq(jobs.id, jobId));
    
    res.json({ success: true, message: 'Job removed from distribution queue' });
  } catch (error) {
    console.error('Error removing job from queue:', error);
    res.status(500).json({ error: 'Failed to remove job from queue' });
  }
}

/**
 * Export job distribution data
 */
export async function exportJobDistributionData(req: Request, res: Response) {
  try {
    const categoryFilter = req.query.categoryFilter as string || 'all';
    const dateRange = req.query.dateRange as string || '30d';
    const format = req.query.format as string || 'csv';
    
    // Get date range for filtering
    const { startDate, endDate } = getDateRange(dateRange);
    
    // Build query conditions
    let conditions = [
      gte(jobs.createdAt, startDate.toISOString()),
      lte(jobs.createdAt, endDate.toISOString())
    ];
    
    if (categoryFilter !== 'all') {
      const category = await db.select()
        .from(categories)
        .where(eq(categories.slug, categoryFilter))
        .limit(1);
      
      if (category.length > 0) {
        conditions.push(eq(jobs.categoryId, category[0].id));
      }
    }
    
    // Get job data
    const jobsData = await db.select({
      id: jobs.id,
      title: jobs.title,
      companyId: jobs.companyId,
      categoryId: jobs.categoryId,
      status: jobs.distributionStatus,
      createdAt: jobs.createdAt,
      distributedAt: jobs.distributedAt,
      priority: jobs.priority,
      matchScore: jobs.matchScore,
      targetUserCount: jobs.targetUserCount,
      actualUserCount: jobs.actualUserCount
    })
      .from(jobs)
      .where(and(...conditions))
      .orderBy(jobs.createdAt);
    
    // Get company and category names
    const enrichedJobsData = await Promise.all(
      jobsData.map(async (job) => {
        const company = await storage.getCompany(job.companyId);
        const category = await storage.getCategory(job.categoryId);
        
        return {
          ...job,
          companyName: company?.name || 'Unknown Company',
          categoryName: category?.name || 'Uncategorized'
        };
      })
    );
    
    // Generate export data based on format
    if (format === 'csv') {
      let csvContent = 'Job ID,Title,Company,Category,Status,Created,Distributed,Priority,Match Score,Target Users,Actual Users\n';
      
      enrichedJobsData.forEach(job => {
        csvContent += `${job.id},"${job.title}","${job.companyName}","${job.categoryName}",${job.status},${job.createdAt},${job.distributedAt || ''},${job.priority},${job.matchScore || ''},${job.targetUserCount || ''},${job.actualUserCount || ''}\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=job-distribution.csv');
      res.send(csvContent);
    } else if (format === 'json') {
      res.json(enrichedJobsData);
    } else {
      res.status(400).json({ error: 'Unsupported export format' });
    }
  } catch (error) {
    console.error('Error exporting job distribution data:', error);
    res.status(500).json({ error: 'Failed to export job distribution data' });
  }
}
