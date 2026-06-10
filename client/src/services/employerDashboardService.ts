import apiClient from './apiClient';
import type {
  EmployerApplicationSummary,
  EmployerDashboard,
  EmployerJobDetail,
  EmployerJobForm,
  EmployerJobSummary,
  EmployerJobStatus,
} from '@shared/platform-contracts';

/**
 * Service for employer dashboard-related API calls
 */
export const employerDashboardService = {
  /**
   * Get employer dashboard data
   */
  async fetchEmployerDashboard(
    userId?: string,
    dateRange?: string,
    status?: string
  ): Promise<EmployerDashboard> {
    const response = await apiClient.get<EmployerDashboard>('/employer/dashboard', {
      params: { userId, dateRange, status }
    });
    return response.data;
  },

  /**
   * Get list of jobs for an employer
   */
  async fetchEmployerJobs(
    userId: string,
    status: string
  ): Promise<EmployerJobSummary[]> {
    const response = await apiClient.get<EmployerJobSummary[]>('/employer/jobs', {
      params: { userId, status }
    });
    return response.data;
  },

  async fetchEmployerApplications(): Promise<EmployerApplicationSummary[]> {
    const response = await apiClient.get<EmployerApplicationSummary[]>('/employer/applications');
    return response.data;
  },

  async fetchEmployerJob(jobId: string): Promise<EmployerJobDetail> {
    const response = await apiClient.get<EmployerJobDetail>(`/employer/jobs/${jobId}`);
    return response.data;
  },

  async createEmployerJob(payload: EmployerJobForm): Promise<EmployerJobDetail> {
    const response = await apiClient.post<EmployerJobDetail>('/employer/jobs', payload);
    return response.data;
  },

  async updateEmployerJob(jobId: string, payload: EmployerJobForm): Promise<EmployerJobDetail> {
    const response = await apiClient.put<EmployerJobDetail>(`/employer/jobs/${jobId}`, payload);
    return response.data;
  },

  async updateEmployerJobStatus(jobId: string, status: EmployerJobStatus): Promise<{ success: boolean; jobId: string; status: EmployerJobStatus }> {
    const response = await apiClient.patch<{ success: boolean; jobId: string; status: EmployerJobStatus }>(`/employer/jobs/${jobId}/status`, { status });
    return response.data;
  },

  /**
   * Export dashboard data
   */
  exportDashboardData(data: any, filename: string = 'employer-dashboard.csv'): void {
    // Convert data to CSV for download
    let csvContent = 'Job Title,Views,Applications\n';
    data.charts.jobPerformance.forEach((item: { jobTitle: string, views: number, applications: number }) => {
      csvContent += `${item.jobTitle},${item.views},${item.applications}\n`;
    });

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
