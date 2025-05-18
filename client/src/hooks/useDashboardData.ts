import { useQuery } from '@tanstack/react-query';
import {
  dashboardService,
  JobDistributionData,
  JobRecommendation,
  SkillsAnalysisData,
  PaginatedResponse
} from '@/services/dashboardService';

/**
 * Hook for fetching job distribution data with pagination
 */
export const useJobDistribution = (
  categoryFilter: string = 'all',
  dateRange: string = '30d',
  page: number = 1,
  limit: number = 10
) => {
  return useQuery<PaginatedResponse<JobDistributionData>, Error>({
    queryKey: ['jobDistribution', categoryFilter, dateRange, page, limit],
    queryFn: () => dashboardService.fetchJobDistribution(categoryFilter, dateRange, page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    keepPreviousData: true, // Keep previous data while fetching new page
  });
};

/**
 * Hook for fetching job recommendations with pagination
 */
export const useJobRecommendations = (
  limit: number = 3,
  userId?: string,
  page: number = 1,
  pageLimit: number = 10
) => {
  return useQuery<PaginatedResponse<JobRecommendation[]>, Error>({
    queryKey: ['jobRecommendations', limit, userId, page, pageLimit],
    queryFn: () => dashboardService.fetchJobRecommendations(limit, userId, page, pageLimit),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    keepPreviousData: true, // Keep previous data while fetching new page
  });
};

/**
 * Hook for fetching skills analysis data with pagination
 */
export const useSkillsAnalysis = (
  userId?: string,
  page: number = 1,
  limit: number = 10
) => {
  return useQuery<PaginatedResponse<SkillsAnalysisData>, Error>({
    queryKey: ['skillsAnalysis', userId, page, limit],
    queryFn: () => dashboardService.fetchSkillsAnalysis(userId, page, limit),
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    keepPreviousData: true, // Keep previous data while fetching new page
  });
};

/**
 * Hook for fetching all dashboard data at once with pagination
 */
export const useDashboardData = (
  categoryFilter: string = 'all',
  dateRange: string = '30d',
  limit: number = 3,
  userId?: string,
  page: number = 1,
  pageSize: number = 10
) => {
  const jobDistribution = useJobDistribution(categoryFilter, dateRange, page, pageSize);
  const jobRecommendations = useJobRecommendations(limit, userId, page, pageSize);
  const skillsAnalysis = useSkillsAnalysis(userId, page, pageSize);

  return {
    jobDistribution,
    jobRecommendations,
    skillsAnalysis,
    isLoading: jobDistribution.isLoading || jobRecommendations.isLoading || skillsAnalysis.isLoading,
    isError: jobDistribution.isError || jobRecommendations.isError || skillsAnalysis.isError,
    error: jobDistribution.error || jobRecommendations.error || skillsAnalysis.error,

    // Export data functionality
    exportData: {
      jobDistribution: () => {
        if (jobDistribution.data) {
          dashboardService.exportDashboardData(jobDistribution.data.data, 'job-distribution.csv');
        }
      },
      jobRecommendations: () => {
        if (jobRecommendations.data) {
          dashboardService.exportDashboardData(jobRecommendations.data.data, 'job-recommendations.csv');
        }
      },
      skillsAnalysis: () => {
        if (skillsAnalysis.data) {
          dashboardService.exportDashboardData(skillsAnalysis.data.data, 'skills-analysis.csv');
        }
      },
      all: () => {
        if (jobDistribution.data && jobRecommendations.data && skillsAnalysis.data) {
          // Export all data as a combined dataset
          const combinedData = {
            jobDistribution: jobDistribution.data.data,
            jobRecommendations: jobRecommendations.data.data,
            skillsAnalysis: skillsAnalysis.data.data
          };

          // Convert to JSON and download
          const jsonStr = JSON.stringify(combinedData, null, 2);
          const blob = new Blob([jsonStr], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.setAttribute('href', url);
          link.setAttribute('download', 'dashboard-data.json');
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    }
  };
};

export default useDashboardData;
