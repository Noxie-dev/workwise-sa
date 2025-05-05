import { QueryClient } from '@tanstack/react-query';

/**
 * Configure the React Query client
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default stale time of 5 minutes
      staleTime: 5 * 60 * 1000,
      
      // Default cache time of 10 minutes
      gcTime: 10 * 60 * 1000,
      
      // Retry failed queries 3 times
      retry: 3,
      
      // Don't refetch on window focus by default
      refetchOnWindowFocus: false,
      
      // Don't refetch on reconnect by default
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry failed mutations 1 time
      retry: 1,
    },
  },
});
