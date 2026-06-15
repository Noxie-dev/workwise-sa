import { z } from 'zod';

export const employerJobStatusSchema = z.enum(['draft', 'active', 'paused', 'closed', 'archived']);

export const employerJobFormSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  jobType: z.string().min(1),
  location: z.string().default(''),
  isRemote: z.boolean().default(false),
  applicationDeadline: z.string().optional().nullable(),
  salaryMin: z.string().default(''),
  salaryMax: z.string().default(''),
  isSalaryNegotiable: z.boolean().default(false),
  description: z.string().min(1),
  responsibilities: z.string().default(''),
  requirements: z.string().default(''),
  companyName: z.string().min(1),
  companyLogo: z.string().optional().nullable(),
  companyBio: z.string().default(''),
  contactName: z.string().min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string().default(''),
  website: z.string().default(''),
  howToApply: z.enum(['email', 'url', 'custom']).default('email'),
  applicationEmail: z.string().default(''),
  applicationUrl: z.string().default(''),
  customInstructions: z.string().default(''),
  isConfidential: z.boolean().default(false),
  isDraft: z.boolean().default(false),
  screenerQuestions: z.array(z.string()).default([]),
});

export const employerJobDetailSchema = employerJobFormSchema.extend({
  id: z.string(),
  companyId: z.number().int().min(1),
  categoryId: z.number().int().min(1),
  ownerUserId: z.number().int().min(1).nullable().optional(),
  status: employerJobStatusSchema,
  createdAt: z.union([z.string(), z.null()]).optional(),
});

export const employerJobStatusUpdateSchema = z.object({
  status: employerJobStatusSchema,
});

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
  categories: z.array(
    z.object({
      category: z.string(),
      count: z.number().int().min(0),
    })
  ),
  locations: z.array(
    z.object({
      name: z.string(),
      value: z.number().int().min(0),
    })
  ),
  trends: z.array(
    z.object({
      date: z.string(),
      applications: z.number().int().min(0),
    })
  ),
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
  marketDemand: z.array(
    z.object({
      skill: z.string(),
      demand: z.number().int().min(0),
      growth: z.number().int().min(0),
    })
  ),
  userSkills: z.array(
    z.object({
      skill: z.string(),
      level: z.string(),
    })
  ),
  recommendations: z.array(
    z.object({
      skill: z.string(),
      reason: z.string(),
    })
  ),
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
    applications: z.array(
      z.object({
        date: z.string(),
        applications: z.number().int().min(0),
      })
    ),
    jobPerformance: z.array(
      z.object({
        jobTitle: z.string(),
        views: z.number().int().min(0),
        applications: z.number().int().min(0),
      })
    ),
  }),
  recentActivity: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      timestamp: z.string(),
    })
  ),
});

export const employerJobSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  location: z.string(),
  type: z.string(),
  company: z.string(),
  ownerUserId: z.number().int().min(1).nullable().optional(),
  applications: z.number().int().min(0),
  views: z.number().int().min(0),
  postedDate: z.string(),
  status: employerJobStatusSchema,
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
export type EmployerJobStatus = z.infer<typeof employerJobStatusSchema>;
export type EmployerJobForm = z.infer<typeof employerJobFormSchema>;
export type EmployerJobDetail = z.infer<typeof employerJobDetailSchema>;
export type EmployerJobStatusUpdate = z.infer<typeof employerJobStatusUpdateSchema>;
