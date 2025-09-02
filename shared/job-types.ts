import { z } from "zod";
import { Job, Company, Category } from "./schema";

/**
 * Job Preview - Basic information shown to anonymous users
 */
export interface JobPreview {
  id: number;
  title: string;
  company: {
    id: number;
    name: string;
    location?: string;
  };
  location: string;
  jobType: string;
  workMode: string;
  category: {
    id: number;
    name: string;
  };
  shortDescription: string; // Truncated description (100-150 chars)
  tags: string[];
  postedDate: Date;
  isRemote: boolean;
  experienceLevel: 'entry' | 'mid' | 'senior';
  featured: boolean;
  // NO sensitive information like full description, requirements, salary details, etc.
}

/**
 * Job Details - Full job specifications (authenticated users only)
 */
export interface JobDetails {
  id: number; // Same as job ID
  fullDescription: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  applicationInstructions: string;
  contactEmail?: string;
  applicationDeadline?: Date;
  companyDetails: {
    about: string;
    website?: string;
    size?: string;
    industry: string;
  };
  salaryDetails?: {
    min?: number;
    max?: number;
    currency: string;
    negotiable: boolean;
    displayText: string; // e.g., "R25,000 - R35,000"
  };
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Complete Job Information (for authenticated users)
 */
export interface JobWithDetails extends JobPreview {
  details: JobDetails;
}

/**
 * Job Application data
 */
export interface JobApplication {
  id: number;
  jobId: number;
  userId: string;
  appliedAt: Date;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired';
  coverLetter?: string;
  resumeUrl?: string;
  customAnswers?: Record<string, string>; // For custom application questions
}

/**
 * Job Search Parameters
 */
export interface JobSearchParams {
  query?: string;
  categoryId?: number;
  location?: string;
  jobType?: string;
  workMode?: string;
  experienceLevel?: string;
  page?: number;
  limit?: number;
  featured?: boolean;
}

/**
 * Job Search Response for previews
 */
export interface JobSearchResponse {
  jobs: JobPreview[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Validation schemas
 */
export const jobApplicationSchema = z.object({
  jobId: z.number(),
  coverLetter: z.string().optional(),
  resumeUrl: z.url().optional(),
  customAnswers: z.record(z.string(), z.string()).optional(),
});

export const jobSearchParamsSchema = z.object({
  query: z.string().optional(),
  categoryId: z.number().optional(),
  location: z.string().optional(),
  jobType: z.string().optional(),
  workMode: z.string().optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior']).optional(),
  page: z.number().min(1).prefault(1),
  limit: z.number().min(1).max(100).prefault(20),
  featured: z.boolean().optional(),
});

export type JobApplicationInput = z.infer<typeof jobApplicationSchema>;
export type JobSearchParamsInput = z.infer<typeof jobSearchParamsSchema>;