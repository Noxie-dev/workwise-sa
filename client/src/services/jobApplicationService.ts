import api, { endpoints } from '../lib/api';

export interface JobApplicationData {
  coverLetter?: string;
  resumeUrl?: string;
  notes?: string;
}

export interface JobApplication {
  id: number;
  userId: number;
  jobId: number;
  status: 'applied' | 'reviewed' | 'interview' | 'rejected' | 'hired';
  appliedAt: string;
  updatedAt: string;
  resumeUrl?: string;
  coverLetter?: string;
  notes?: string;
}

export interface JobApplicationsResponse {
  applications: JobApplication[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApplicationResponse {
  success: boolean;
  message: string;
  application: JobApplication;
}

class JobApplicationService {
  /**
   * Apply for a job
   */
  async applyForJob(jobId: string, applicationData: JobApplicationData): Promise<ApplicationResponse> {
    try {
      const response = await api.post(endpoints.applications.create(jobId), applicationData);
      return response.data;
    } catch (error) {
      console.error('Failed to apply for job:', error);
      throw error;
    }
  }

  /**
   * Get user's job applications
   */
  async getUserApplications(options?: {
    page?: number;
    limit?: number;
    status?: string;
    jobId?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<JobApplicationsResponse> {
    try {
      const params = new URLSearchParams();
      if (options?.page) params.append('page', options.page.toString());
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.status) params.append('status', options.status);
      if (options?.jobId) params.append('jobId', options.jobId.toString());
      if (options?.sortBy) params.append('sortBy', options.sortBy);
      if (options?.sortOrder) params.append('sortOrder', options.sortOrder);

      const response = await api.get(`${endpoints.applications.list}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get user applications:', error);
      throw error;
    }
  }

  /**
   * Get specific job application
   */
  async getApplication(applicationId: string): Promise<{ application: JobApplication }> {
    try {
      const response = await api.get(endpoints.applications.detail(applicationId));
      return response.data;
    } catch (error) {
      console.error('Failed to get application:', error);
      throw error;
    }
  }

  /**
   * Update job application (usually status update by employer)
   */
  async updateApplication(
    applicationId: string, 
    updates: { status?: string; notes?: string }
  ): Promise<ApplicationResponse> {
    try {
      const response = await api.put(endpoints.applications.update(applicationId), updates);
      return response.data;
    } catch (error) {
      console.error('Failed to update application:', error);
      throw error;
    }
  }

  /**
   * Withdraw job application
   */
  async withdrawApplication(applicationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete(endpoints.applications.delete(applicationId));
      return response.data;
    } catch (error) {
      console.error('Failed to withdraw application:', error);
      throw error;
    }
  }

  /**
   * Get applications for a specific job (for employers)
   */
  async getJobApplications(jobId: string, options?: {
    page?: number;
    limit?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<JobApplicationsResponse> {
    try {
      const params = new URLSearchParams();
      if (options?.page) params.append('page', options.page.toString());
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.status) params.append('status', options.status);
      if (options?.sortBy) params.append('sortBy', options.sortBy);
      if (options?.sortOrder) params.append('sortOrder', options.sortOrder);

      const response = await api.get(`${endpoints.applications.byJob(jobId)}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get job applications:', error);
      throw error;
    }
  }

  /**
   * Check if user has already applied for a job
   */
  async hasApplied(jobId: string): Promise<boolean> {
    try {
      const applications = await this.getUserApplications({ jobId: parseInt(jobId), limit: 1 });
      return applications.applications.length > 0;
    } catch (error) {
      console.error('Failed to check application status:', error);
      return false;
    }
  }

  /**
   * Get application status for a job
   */
  async getApplicationStatus(jobId: string): Promise<JobApplication | null> {
    try {
      const applications = await this.getUserApplications({ jobId: parseInt(jobId), limit: 1 });
      return applications.applications.length > 0 ? applications.applications[0] : null;
    } catch (error) {
      console.error('Failed to get application status:', error);
      return null;
    }
  }
}

export const jobApplicationService = new JobApplicationService();
export default jobApplicationService;
