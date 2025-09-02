/**
 * Enhanced job types for WorkWise SA
 * Aligned with Netlify functions and React Query hooks
 */

export type Job = {
  id: number;
  title: string;
  company: {
    id: number;
    name: string;
    location?: string | null;
    logo?: string | null;
  };
  location?: string | null;
  salary?: string | null;
  description?: string | null;
  jobType: string;
  workMode: string;
  category: {
    id: number;
    name: string;
  };
  shortDescription: string;
  tags: string[];
  postedDate: Date;
  isRemote: boolean;
  experienceLevel: 'entry' | 'mid' | 'senior';
  featured: boolean;
};

export type JobPreview = Pick<Job, 'id' | 'title' | 'company' | 'location' | 'postedDate' | 'jobType' | 'workMode' | 'category' | 'shortDescription' | 'tags' | 'isRemote' | 'experienceLevel' | 'featured'>;

export type JobDetails = {
  id: number;
  fullDescription: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  applicationInstructions: string;
  companyDetails: {
    about: string;
    website?: string;
    size?: string;
    industry: string;
  };
  salaryDetails?: {
    displayText: string;
    currency: string;
    negotiable: boolean;
  };
  createdAt: Date;
};

export type JobWithDetails = JobPreview & {
  details: JobDetails;
};

export type Application = {
  id: number;
  jobId: number;
  applicantName: string;
  applicantEmail: string;
  resumeUrl: string;
  status: string;
  submittedAt: string;
  coverLetter?: string;
  notes?: string;
};

export type JobApplicationInput = {
  jobId: number;
  coverLetter?: string;
  resumeUrl?: string;
  customAnswers?: Record<string, string>;
};

export type JobSearchParams = {
  query?: string;
  categoryId?: number;
  location?: string;
  jobType?: string;
  workMode?: string;
  experienceLevel?: string;
  page?: number;
  limit?: number;
  featured?: boolean;
};

export type JobSearchResponse = {
  jobs: JobPreview[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type JobApplicationResponse = {
  applicationId: number;
  appliedAt: Date;
  message: string;
};

export type UserApplicationsResponse = {
  applications: Array<{
    id: number;
    jobId: number;
    status: string;
    appliedAt: Date;
    coverLetter?: string;
    resumeUrl?: string;
    notes?: string;
    job: {
      title: string;
      location: string;
      jobType: string;
      company: {
        name: string;
        logo?: string;
      };
    };
  }>;
};

// API Response types for Netlify functions
export type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
};

export type JobPreviewsResponse = ApiResponse<JobSearchResponse>;
export type JobDetailsResponse = ApiResponse<JobWithDetails>;
export type JobApplicationSubmitResponse = ApiResponse<JobApplicationResponse>;
export type UserApplicationsResponse = ApiResponse<UserApplicationsResponse>;
