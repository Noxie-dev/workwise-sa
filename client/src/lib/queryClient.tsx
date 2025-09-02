import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

/**
 * Enhanced query client configuration optimized for job operations
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 seconds - jobs data changes frequently
      gcTime: 5 * 60_000, // 5 minutes garbage collection
      refetchOnWindowFocus: false,
      retry: 2, // Retry failed queries twice
    },
    mutations: { 
      retry: 1, // Retry failed mutations once
    },
  },
});

/**
 * QueryClient provider component with enhanced configuration
 */
export function WithQueryClient({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

// Keep existing exports for backward compatibility
export async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => any =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }: { queryKey: any }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };
