import apiClient from './apiClient';

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
  ): Promise<any> {
    try {
      // Real API call here
      const response = await apiClient.get<any>('/api/employer/dashboard', {
        params: { userId, dateRange, status }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching employer dashboard:', error);
      // Mock data as a fallback
      return {
        stats: {
          totalJobs: 5,
          activeJobs: 3,
          totalApplications: 120,
          totalViews: 3200,
        },
        charts: {
          applications: [
            { date: '2025-07-01', applications: 30 },
            { date: '2025-07-02', applications: 45 },
            { date: '2025-07-03', applications: 28 },
            { date: '2025-07-04', applications: 25 },
            { date: '2025-07-05', applications: 32 },
          ],
          jobPerformance: [
            { jobTitle: 'Software Developer', views: 1500, applications: 45 },
            { jobTitle: 'Marketing Manager', views: 1000, applications: 30 },
            { jobTitle: 'Graphic Designer', views: 700, applications: 20 },
          ],
        },
        recentActivity: [
          { title: 'New Application', description: 'John Doe applied for Software Developer', timestamp: '10 min ago' },
          { title: 'Job Updated', description: 'Marketing Manager was updated', timestamp: '2 hours ago' },
          { title: 'New View', description: 'Your job Software Developer was viewed 10 times', timestamp: '1 day ago' },
        ],
      };
    }
  },

  /**
   * Get list of jobs for an employer
   */
  async fetchEmployerJobs(
    userId: string,
    status: string
  ): Promise<any[]> {
    try {
      // Real API call here
      const response = await apiClient.get<any[]>('/api/employer/jobs', {
        params: { userId, status }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching employer jobs:', error);
      // Mock data as a fallback
      return [
        { id: 'job1', title: 'Software Developer', location: 'Cape Town', type: 'Full-time', applications: 10, views: 500, postedDate: '2025-07-01', status: 'active' },
        { id: 'job2', title: 'Marketing Manager', location: 'Johannesburg', type: 'Part-time', applications: 5, views: 200, postedDate: '2025-07-05', status: 'paused' },
        { id: 'job3', title: 'Graphic Designer', location: 'Durban', type: 'Freelance', applications: 3, views: 300, postedDate: '2025-07-08', status: 'closed' },
      ];
    }
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
