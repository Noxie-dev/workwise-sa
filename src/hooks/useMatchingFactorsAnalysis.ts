// src/hooks/useMatchingFactorsAnalysis.ts
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';

interface MatchingFactor {
  factor: string;
  count: number;
  percentage: number;
}

export const useMatchingFactorsAnalysis = (dateRange: string = '30d') => {
  return useQuery<MatchingFactor[], Error>({
    queryKey: ['matchingFactors', dateRange],
    queryFn: () => dashboardService.fetchMatchingFactorsAnalysis(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};
