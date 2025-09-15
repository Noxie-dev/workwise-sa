// src/hooks/useAlgorithmConfiguration.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { AlgorithmConfiguration } from '../types/dashboard';

export const useAlgorithmConfiguration = () => {
  const queryClient = useQueryClient();
  
  const query = useQuery<AlgorithmConfiguration, Error>({
    queryKey: ['algorithmConfiguration'],
    queryFn: () => dashboardService.fetchAlgorithmConfiguration(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
  
  const mutation = useMutation({
    mutationFn: (config: AlgorithmConfiguration) => 
      dashboardService.updateAlgorithmConfiguration(config),
    onSuccess: () => {
      // Invalidate and refetch the algorithm configuration
      queryClient.invalidateQueries({ queryKey: ['algorithmConfiguration'] });
    },
  });
  
  return {
    ...query,
    updateConfig: mutation.mutate,
    isUpdating: mutation.isPending,
    updateError: mutation.error,
  };
};
