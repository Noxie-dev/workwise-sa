import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Default query client configuration
 */
const defaultQueryClientOptions = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
};

/**
 * Props for the QueryProvider component
 */
interface QueryProviderProps {
  children: React.ReactNode;
  options?: typeof defaultQueryClientOptions;
}

/**
 * QueryProvider component that wraps the application with React Query's QueryClientProvider
 */
export const QueryProvider: React.FC<QueryProviderProps> = ({ 
  children, 
  options = defaultQueryClientOptions 
}) => {
  // Create a client
  const [queryClient] = React.useState(() => new QueryClient(options));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export default QueryProvider;
