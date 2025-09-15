// src/hooks/useJobDistribution.ts
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { JobDistributionData } from '../types/dashboard';
import { PaginatedResponse } from '../types/api';

export const useJobDistribution = (
  categoryFilter: string = 'all',
  dateRange: string = '30d',
  page: number = 1,
  limit: number = 10,
  statusFilter: string = 'all',
  priorityFilter: string = 'all',
  searchQuery: string = ''
) => {
  return useQuery<PaginatedResponse<JobDistributionData>, Error>({
    queryKey: ['jobDistribution', categoryFilter, dateRange, page, limit, statusFilter, priorityFilter, searchQuery],
    queryFn: () => dashboardService.fetchJobDistribution(
      categoryFilter, 
      dateRange, 
      page, 
      limit, 
      statusFilter, 
      priorityFilter, 
      searchQuery
    ),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    keepPreviousData: true, // Keep previous data while fetching new page
  });
};
