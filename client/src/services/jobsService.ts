import apiClient from './apiClient';
import { Job, JobWithCompany, Company, Category } from '../../../shared/schema';

/**
 * Parameters for searching jobs
 */
export interface JobSearchParams {
  query?: string;
  categoryId?: number;
  location?: string;
  jobType?: string;
  workMode?: string;
  page?: number;
  limit?: number;
}

/**
 * Response for job search
 */
export interface JobSearchResponse {
  jobs: JobWithCompany[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Service for job-related API calls
 */
export const jobsService = {
  /**
   * Get all jobs with company information
   */
  async getJobs(): Promise<JobWithCompany[]> {
    const response = await apiClient.get<JobWithCompany[]>('/jobs');
    return response.data;
  },

  /**
   * Get a single job by ID with company information
   */
  async getJobById(id: number): Promise<JobWithCompany> {
    const response = await apiClient.get<JobWithCompany>(`/jobs/${id}`);
    return response.data;
  },

  /**
   * Search for jobs with filters
   */
  async searchJobs(params: JobSearchParams): Promise<JobSearchResponse> {
    const response = await apiClient.get<JobSearchResponse>('/jobs/search', { params });
    return response.data;
  },

  /**
   * Get featured jobs
   */
  async getFeaturedJobs(limit = 6): Promise<JobWithCompany[]> {
    const response = await apiClient.get<JobWithCompany[]>('/jobs/featured', { params: { limit } });
    return response.data;
  },

  /**
   * Get all job categories
   */
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/categories');
    return response.data;
  },

  /**
   * Get a category by ID with its jobs
   */
  async getCategoryWithJobs(categoryId: number): Promise<{ category: Category; jobs: JobWithCompany[] }> {
    const response = await apiClient.get<{ category: Category; jobs: JobWithCompany[] }>(
      `/categories/${categoryId}/jobs`
    );
    return response.data;
  },

  /**
   * Get all companies
   */
  async getCompanies(): Promise<Company[]> {
    const response = await apiClient.get<Company[]>('/companies');
    return response.data;
  },

  /**
   * Get a company by ID with its jobs
   */
  async getCompanyWithJobs(companyId: number): Promise<{ company: Company; jobs: Job[] }> {
    const response = await apiClient.get<{ company: Company; jobs: Job[] }>(
      `/companies/${companyId}/jobs`
    );
    return response.data;
  },

  /**
   * Toggle job favorite status
   */
  async toggleFavorite(jobId: number, isFavorite: boolean): Promise<void> {
    if (isFavorite) {
      await apiClient.post(`/jobs/${jobId}/favorite`);
    } else {
      await apiClient.delete(`/jobs/${jobId}/favorite`);
    }
  },

  /**
   * Get user's favorite jobs
   */
  async getFavoriteJobs(): Promise<JobWithCompany[]> {
    const response = await apiClient.get<JobWithCompany[]>('/jobs/favorites');
    return response.data;
  },

  /**
   * Apply for a job
   */
  async applyForJob(jobId: number, applicationData: {
    resumeUrl?: string;
    coverLetter?: string;
    notes?: string;
  }): Promise<{ applicationId: number }> {
    const response = await apiClient.post<{ applicationId: number }>(
      `/jobs/${jobId}/apply`,
      applicationData
    );
    return response.data;
  }
};

export default jobsService;
