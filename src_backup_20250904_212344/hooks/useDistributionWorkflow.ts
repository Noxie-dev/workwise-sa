// src/hooks/useDistributionWorkflow.ts
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';

interface WorkflowData {
  jobIntake: number;
  ruleMatching: number;
  ctaInjection: number;
  distribution: number;
}

export const useDistributionWorkflow = (dateRange: string = '30d') => {
  return useQuery<WorkflowData, Error>({
    queryKey: ['distributionWorkflow', dateRange],
    queryFn: () => dashboardService.fetchDistributionWorkflow(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};
