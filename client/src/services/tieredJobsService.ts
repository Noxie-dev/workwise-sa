import apiClient from './apiClient';
import { JobPreview, JobWithDetails, JobSearchParams, JobSearchResponse, JobApplication, JobApplicationInput } from '../../../shared/job-types';
import { auth } from '@/lib/firebase';
import { mockJobs, mockCompanies, mockCategories } from '@/services/mockData';

const useMockPublicData = import.meta.env.VITE_USE_MOCK_PUBLIC_DATA !== 'false';

const inferExperienceLevel = (title: string): JobPreview['experienceLevel'] => {
  const t = title.toLowerCase();
  if (t.includes('senior') || t.includes('lead') || t.includes('manager')) return 'senior';
  if (t.includes('junior') || t.includes('intern') || t.includes('entry') || t.includes('assistant')) return 'entry';
  return 'mid';
};

const toMockJobPreviews = (): JobPreview[] => {
  return mockJobs.map((job) => {
    const companyMatch = mockCompanies.find((company) => company.name === job.company);
    const categoryMatch = mockCategories.find((category) => category.name === job.category);
    const postedDate = new Date(job.postedDate);
    const description = job.description || '';

    return {
      id: job.id,
      title: job.title,
      company: {
        id: companyMatch?.id ?? job.id,
        name: companyMatch?.name ?? job.company,
        location: companyMatch?.location ?? job.location,
      },
      location: job.location,
      jobType: job.type || 'Full-time',
      workMode: /remote/i.test(job.location) ? 'Remote' : 'On-site',
      category: {
        id: categoryMatch?.id ?? 0,
        name: categoryMatch?.name ?? job.category,
      },
      shortDescription: description.length > 140 ? `${description.slice(0, 137)}...` : description,
      tags: [job.category, job.type].filter(Boolean),
      postedDate: Number.isNaN(postedDate.getTime()) ? new Date() : postedDate,
      isRemote: /remote/i.test(job.location),
      experienceLevel: inferExperienceLevel(job.title),
      featured: Boolean(job.isFeatured),
    };
  });
};

const buildMockJobPreviewsResponse = (params: JobSearchParams = {}): JobSearchResponse => {
  let jobs = toMockJobPreviews();

  if (params.featured) {
    jobs = jobs.filter((job) => job.featured);
  }

  if (params.query) {
    const q = params.query.toLowerCase();
    jobs = jobs.filter((job) =>
      job.title.toLowerCase().includes(q) ||
      job.company.name.toLowerCase().includes(q) ||
      job.location.toLowerCase().includes(q) ||
      job.category.name.toLowerCase().includes(q) ||
      job.shortDescription.toLowerCase().includes(q),
    );
  }

  if (params.location) {
    const location = params.location.toLowerCase();
    jobs = jobs.filter((job) => job.location.toLowerCase().includes(location));
  }

  if (params.jobType) {
    const jobType = params.jobType.toLowerCase();
    jobs = jobs.filter((job) => job.jobType.toLowerCase() === jobType);
  }

  if (params.workMode) {
    const workMode = params.workMode.toLowerCase();
    jobs = jobs.filter((job) => job.workMode.toLowerCase() === workMode);
  }

  if (typeof params.categoryId === 'number') {
    jobs = jobs.filter((job) => job.category.id === params.categoryId);
  }

  const page = Math.max(params.page ?? 1, 1);
  const limit = Math.max(params.limit ?? 20, 1);
  const total = jobs.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const start = (page - 1) * limit;
  const pagedJobs = jobs.slice(start, start + limit);

  return {
    jobs: pagedJobs,
    total,
    page,
    limit,
    totalPages,
  };
};

const getFallbackJobPreviews = (params: JobSearchParams, reason: unknown): JobSearchResponse => {
  console.warn('Using mock job previews data:', reason);
  return buildMockJobPreviewsResponse(params);
};

const isJsonResponse = (response: Response) => {
  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('application/json');
};

/**
 * Service for tiered job access - handles both public previews and authenticated details
 */
export const tieredJobsService = {
  /**
   * Get job previews (public access - no authentication required)
   */
  async getJobPreviews(params: JobSearchParams = {}): Promise<JobSearchResponse> {
    if (import.meta.env.DEV && useMockPublicData) {
      return buildMockJobPreviewsResponse(params);
    }

    try {
      const query = new URLSearchParams(
        Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)])),
      );
      const response = await fetch(`/.netlify/functions/jobPreviews?${query}`);

      if (!response.ok) {
        return getFallbackJobPreviews(params, `HTTP ${response.status}`);
      }

      if (!isJsonResponse(response)) {
        const bodyPreview = (await response.text()).slice(0, 80);
        return getFallbackJobPreviews(params, `Non-JSON response: ${bodyPreview}`);
      }

      return await response.json();
    } catch (error) {
      return getFallbackJobPreviews(params, error);
    }
  },

  /**
   * Get full job details (authenticated access required)
   */
  async getJobDetails(jobId: number): Promise<JobWithDetails> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Authentication required to view full job details');
      }

      const token = await user.getIdToken();
      const response = await fetch(`/.netlify/functions/jobDetails/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to view full job details');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching job details:', error);
      throw error;
    }
  },

  /**
   * Apply for a job (authenticated access required)
   */
  async applyForJob(applicationData: JobApplicationInput): Promise<{ applicationId: number; appliedAt: Date; message: string }> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Authentication required to apply for jobs');
      }

      const token = await user.getIdToken();
      const response = await fetch('/.netlify/functions/jobApplications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error applying for job:', error);
      throw error;
    }
  },

  /**
   * Get user's job applications (authenticated access required)
   */
  async getUserApplications(): Promise<{ applications: JobApplication[] }> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Authentication required to view applications');
      }

      const token = await user.getIdToken();
      const response = await fetch('/.netlify/functions/jobApplications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user applications:', error);
      throw error;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!auth.currentUser;
  },

  /**
   * Get current user
   */
  getCurrentUser() {
    return auth.currentUser;
  }
};

export default tieredJobsService;
