import React from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './app';
import '@/styles/index.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

/**
 * Main entry point for the WorkWise SA application
 * Sets up React 18 with StrictMode, HelmetProvider for SEO, and QueryClientProvider for data fetching
 */

// Find the root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element with id "root". Please check your HTML file.');
}

// Create the root using React 18's createRoot API
const root = createRoot(rootElement);

// Render the application
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        {/* Main App component */}
        <App />
        
        {/* React Query Devtools - only in development */}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
        )}
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>
);
