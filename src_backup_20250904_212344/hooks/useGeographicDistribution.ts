// src/hooks/useGeographicDistribution.ts
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';

interface LocationData {
  location: string;
  count: number;
}

export const useGeographicDistribution = (
  categoryFilter: string = 'all',
  dateRange: string = '30d'
) => {
  return useQuery<LocationData[], Error>({
    queryKey: ['geographicDistribution', categoryFilter, dateRange],
    queryFn: () => dashboardService.fetchGeographicDistribution(categoryFilter, dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};
