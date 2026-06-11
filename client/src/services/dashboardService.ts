import apiClient from './apiClient';
import type {
  JobDistributionPayload as JobDistributionData,
  JobRecommendation,
  PaginationMetadata,
  SkillsAnalysisPayload as SkillsAnalysisData,
} from '@shared/platform-contracts';

// Generic paginated response interface
export interface PaginatedResponse<T> {
  data: T;
  pagination: PaginationMetadata;
}

/**
 * Service for dashboard-related API calls
 */
export const dashboardService = {
  /**
   * Get job distribution data with pagination
   */
  async fetchJobDistribution(
    categoryFilter: string = 'all',
    dateRange: string = '30d',
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<JobDistributionData>> {
    const response = await apiClient.get<PaginatedResponse<JobDistributionData>>(
      '/dashboard/job-distribution',
      {
        params: { categoryFilter, dateRange, page, limit },
      }
    );
    return response.data;
  },

  /**
   * Get job recommendations with pagination
   */
  async fetchJobRecommendations(
    limit: number = 3,
    userId?: string,
    page: number = 1,
    pageLimit: number = 10
  ): Promise<PaginatedResponse<JobRecommendation[]>> {
    const response = await apiClient.get<PaginatedResponse<JobRecommendation[]>>(
      '/dashboard/job-recommendations',
      {
        params: { recommendationLimit: limit, userId, page, limit: pageLimit },
      }
    );
    return response.data;
  },

  /**
   * Get skills analysis data with pagination
   */
  async fetchSkillsAnalysis(
    userId?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<SkillsAnalysisData>> {
    const response = await apiClient.get<PaginatedResponse<SkillsAnalysisData>>(
      '/dashboard/skills-analysis',
      {
        params: { userId, page, limit },
      }
    );
    return response.data;
  },

  /**
   * Export dashboard data to CSV
   */
  exportDashboardData(data: any, filename: string = 'dashboard-data.csv'): void {
    // Convert data to CSV format
    let csvContent = '';

    // Handle different data types
    if (data.categories) {
      // Job distribution data
      csvContent = 'Category,Count\n';
      data.categories.forEach((item: { category: string; count: number }) => {
        csvContent += `${item.category},${item.count}\n`;
      });
    } else if (Array.isArray(data) && data[0]?.title) {
      // Job recommendations
      csvContent = 'Title,Company,Match,Location,Type,Posted Date\n';
      data.forEach((item: JobRecommendation) => {
        csvContent += `"${item.title}","${item.company}",${item.match},"${item.location}","${item.type}","${item.postedDate}"\n`;
      });
    } else if (data.marketDemand) {
      // Skills analysis
      csvContent = 'Skill,Demand,Growth\n';
      data.marketDemand.forEach((item: { skill: string; demand: number; growth: number }) => {
        csvContent += `"${item.skill}",${item.demand},${item.growth}\n`;
      });
    }

    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

export default dashboardService;
