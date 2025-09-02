import apiClient from './apiClient';
import { JobPreview, JobWithDetails, JobSearchParams, JobSearchResponse, JobApplication, JobApplicationInput } from '../../../shared/job-types';
import { auth } from '@/lib/firebase';

/**
 * Service for tiered job access - handles both public previews and authenticated details
 */
export const tieredJobsService = {
  /**
   * Get job previews (public access - no authentication required)
   */
  async getJobPreviews(params: JobSearchParams = {}): Promise<JobSearchResponse> {
    try {
      const response = await fetch('/.netlify/functions/jobPreviews?' + new URLSearchParams({
        ...Object.fromEntries(
          Object.entries(params).map(([key, value]) => [key, String(value)])
        )
      }));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching job previews:', error);
      throw error;
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