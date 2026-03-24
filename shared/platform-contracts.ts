import { z } from "zod";

export const paginationMetadataSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  totalItems: z.number().int().min(0),
  totalPages: z.number().int().min(1),
});

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    pagination: paginationMetadataSchema,
  });

export const jobDistributionPayloadSchema = z.object({
  categories: z.array(z.object({
    category: z.string(),
    count: z.number().int().min(0),
  })),
  locations: z.array(z.object({
    name: z.string(),
    value: z.number().int().min(0),
  })),
  trends: z.array(z.object({
    date: z.string(),
    applications: z.number().int().min(0),
  })),
});

export const jobRecommendationSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  match: z.number().min(0).max(100),
  location: z.string(),
  type: z.string(),
  postedDate: z.string(),
  description: z.string(),
  skills: z.array(z.string()),
});

export const skillsAnalysisPayloadSchema = z.object({
  marketDemand: z.array(z.object({
    skill: z.string(),
    demand: z.number().int().min(0),
    growth: z.number().int().min(0),
  })),
  userSkills: z.array(z.object({
    skill: z.string(),
    level: z.string(),
  })),
  recommendations: z.array(z.object({
    skill: z.string(),
    reason: z.string(),
  })),
});

export const employerDashboardSchema = z.object({
  scope: z.string(),
  stats: z.object({
    totalJobs: z.number().int().min(0),
    activeJobs: z.number().int().min(0),
    totalApplications: z.number().int().min(0),
    totalViews: z.number().int().min(0),
  }),
  charts: z.object({
    applications: z.array(z.object({
      date: z.string(),
      applications: z.number().int().min(0),
    })),
    jobPerformance: z.array(z.object({
      jobTitle: z.string(),
      views: z.number().int().min(0),
      applications: z.number().int().min(0),
    })),
  }),
  recentActivity: z.array(z.object({
    title: z.string(),
    description: z.string(),
    timestamp: z.string(),
  })),
});

export const employerJobSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  location: z.string(),
  type: z.string(),
  company: z.string(),
  applications: z.number().int().min(0),
  views: z.number().int().min(0),
  postedDate: z.string(),
  status: z.string(),
});

export const employerApplicationSummarySchema = z.object({
  id: z.string(),
  applicantName: z.string(),
  applicantEmail: z.string(),
  jobTitle: z.string(),
  status: z.string(),
  appliedAt: z.union([z.string(), z.date()]),
  notes: z.string().nullable().optional(),
});

export const adminAnalyticsSchema = z.object({
  overview: z.object({
    totalUsers: z.number().int().min(0),
    activeUsers: z.number().int().min(0),
    jobListings: z.number().int().min(0),
    applications: z.number().int().min(0),
  }),
  userActivity: z.object({
    daily: z.array(z.number().int().min(0)),
    weekly: z.array(z.number().int().min(0)),
    monthly: z.array(z.number().int().min(0)),
  }),
  jobMetrics: z.object({
    categories: z.array(z.string()),
    counts: z.array(z.number().int().min(0)),
  }),
  conversionRates: z.object({
    viewToApplication: z.number().min(0),
    applicationToInterview: z.number().min(0),
    interviewToHire: z.number().min(0),
  }),
});

export type PaginationMetadata = z.infer<typeof paginationMetadataSchema>;
export type JobDistributionPayload = z.infer<typeof jobDistributionPayloadSchema>;
export type JobRecommendation = z.infer<typeof jobRecommendationSchema>;
export type SkillsAnalysisPayload = z.infer<typeof skillsAnalysisPayloadSchema>;
export type EmployerDashboard = z.infer<typeof employerDashboardSchema>;
export type EmployerJobSummary = z.infer<typeof employerJobSummarySchema>;
export type EmployerApplicationSummary = z.infer<typeof employerApplicationSummarySchema>;
export type AdminAnalytics = z.infer<typeof adminAnalyticsSchema>;
