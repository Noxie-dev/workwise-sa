import React, { lazy, Suspense } from 'react';

interface LazyLoadOptions {
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

/**
 * Helper function to lazy load components with Suspense
 * 
 * @param importFn - Dynamic import function
 * @param options - Options for lazy loading
 * @returns Lazy loaded component with Suspense
 */
export function lazyLoad<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
) {
  const LazyComponent = lazy(importFn);
  const { fallback = <div>Loading...</div>, errorFallback = <div>Error loading component</div> } = options;

  return (props: React.ComponentProps<T>) => {
    return (
      <Suspense fallback={fallback}>
        <ErrorBoundary fallback={errorFallback}>
          <LazyComponent {...props} />
        </ErrorBoundary>
      </Suspense>
    );
  };
}

// Simple error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}