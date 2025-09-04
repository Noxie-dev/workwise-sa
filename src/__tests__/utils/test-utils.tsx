import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../contexts/AuthContext';
import { HelmetProvider } from 'react-helmet-async';

// Mock the auth context
jest.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: jest.fn().mockReturnValue({
    currentUser: null,
    isLoading: false,
    isAuthenticated: false,
  }),
}));

/**
 * Creates a new QueryClient for testing
 */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: Infinity,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {},
    },
  });

/**
 * A wrapper component that provides a QueryClient for testing
 */
export function createWrapper() {
  const testQueryClient = createTestQueryClient();
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
  );
}

/**
 * A wrapper component that provides all common providers for testing
 */
export function AllTheProviders({ children }: { children: React.ReactNode }) {
  const testQueryClient = createTestQueryClient();
  
  return (
    <HelmetProvider>
      <QueryClientProvider client={testQueryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

/**
 * Custom render function that includes common providers
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render method
export { customRender as render };
