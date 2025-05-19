// src/hooks/useCategoryDistribution.ts
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { CategoryDistribution } from '../types/dashboard';

export const useCategoryDistribution = (dateRange: string = '30d') => {
  return useQuery<CategoryDistribution[], Error>({
    queryKey: ['categoryDistribution', dateRange],
    queryFn: () => dashboardService.fetchCategoryDistribution(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};
