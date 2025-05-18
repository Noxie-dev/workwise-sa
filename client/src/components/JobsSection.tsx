import React, { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import JobCard from './JobCard';
import { useJobFavorites } from '../hooks/useJobFavorites';
import { ApiResponse, JobWithCompany, Company } from '../types';

// Define the API response structure
interface ApiJob {
  id: number;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  salary: string;
  type: string; // full-time, part-time, etc.
  category: string;
  description: string;
  requirements: string[];
  postedDate: string;
  isFeatured: boolean;
}

/**
 * Props for JobsSection component
 */
interface JobsSectionProps {
  title?: string;
  subtitle?: string;
  maxDisplay?: number;
  filter?: {
    featured?: boolean;
    category?: string;
    location?: string;
  };
  className?: string;
}

/**
 * JobsSection component
 *
 * Displays a grid of job cards with featured opportunities
 *
 * @param title - Section title
 * @param subtitle - Section subtitle
 * @param maxDisplay - Maximum number of jobs to display
 * @param filter - Optional filters to apply
 * @param className - Additional CSS classes
 */
const JobsSection: React.FC<JobsSectionProps> = ({
  title = "Featured Opportunities",
  subtitle = "Discover top employment opportunities from leading companies in South Africa",
  maxDisplay = 6,
  filter,
  className,
}) => {
  const { favorites, toggleFavorite } = useJobFavorites();

  // Build query key with filter parameters for proper caching
  const queryKey = React.useMemo(() => {
    const key = ['/api/jobs'];
    if (filter?.featured) key.push('featured');
    if (filter?.category) key.push(`category=${filter.category}`);
    if (filter?.location) key.push(`location=${filter.location}`);
    return key;
  }, [filter]);

  // Fetch jobs data with React Query
  const { data: jobsResponse, isLoading, error } = useQuery<ApiResponse<ApiJob[]>>({
    queryKey,
    queryFn: async () => {
      try {
        // Build the actual API URL with filter parameters
        let url = '/api/jobs/featured';
        const params = new URLSearchParams();

        if (filter?.category) params.append('category', filter.category);
        if (filter?.location) params.append('location', filter.location);
        if (filter?.featured) params.append('featured', 'true');

        const queryString = params.toString();
        if (queryString) url += `?${queryString}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch jobs');
        }

        return response.json();
      } catch (error) {
        console.error('Error fetching jobs:', error);
        // Return error response structure
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    },
    // If we're in a production build, don't refetch on window focus
    refetchOnWindowFocus: process.env.NODE_ENV !== 'production',
  });

  // Map API response to the expected JobWithCompany format
  const jobs = React.useMemo(() => {
    if (!jobsResponse?.success || !jobsResponse.data) return [];

    return jobsResponse.data
      .map(apiJob => {
        // Create a company object from the API data
        const company: Company = {
          id: apiJob.id, // Using job ID as company ID for simplicity
          name: apiJob.company,
          logo: apiJob.companyLogo,
          location: apiJob.location,
          slug: apiJob.company.toLowerCase().replace(/\\s+/g, '-'),
          openPositions: 1
        };

        // Map to JobWithCompany format
        return {
          id: apiJob.id,
          title: apiJob.title,
          description: apiJob.description,
          location: apiJob.location,
          salary: apiJob.salary,
          jobType: apiJob.type,
          workMode: 'On-site', // Default value since API doesn't provide this
          companyId: apiJob.id, // Using job ID as company ID for simplicity
          categoryId: 1, // Default value
          isFeatured: apiJob.isFeatured,
          createdAt: new Date(apiJob.postedDate),
          requirements: apiJob.requirements,
          company: company
        } as JobWithCompany;
      })
      .slice(0, maxDisplay); // Only take the number we want to display
  }, [jobsResponse, maxDisplay]);

  // Handle favorite toggle with callback
  const handleFavoriteToggle = useCallback((jobId: number, isFavorite: boolean) => {
    toggleFavorite(jobId);
  }, [toggleFavorite]);

  // Render skeleton loaders for jobs
  const renderJobSkeletons = useCallback(() => (
    Array(maxDisplay).fill(0).map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow-card overflow-hidden" data-testid="job-skeleton">
        <div className="p-4 border-b border-border">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <Skeleton className="w-12 h-12 rounded-md mr-3" />
              <div>
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
        <div className="p-4">
          <div className="mb-3">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>
    ))
  ), [maxDisplay]);

  // Render error state
  if (error || jobsResponse?.success === false) {
    return (
      <section className="py-10 md:py-16 bg-light">
        <div className="container mx-auto px-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {jobsResponse?.error || 'Failed to load jobs. Please try again later.'}
            </AlertDescription>
          </Alert>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-10 md:py-16 bg-light ${className || ''}`}>
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{title}</h2>
          <p className="text-muted">{subtitle}</p>
        </div>

        <ErrorBoundary>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="jobs-grid">
            {isLoading ? renderJobSkeletons() : (
              jobs.length > 0 ? (
                jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    initialFavoriteState={favorites.includes(job.id)}
                    onFavoriteToggle={handleFavoriteToggle}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-10">
                  <p className="text-muted">No jobs found matching your criteria.</p>
                </div>
              )
            )}
          </div>
        </ErrorBoundary>

        <div className="text-center mt-10">
          <Button
            variant="outline"
            asChild
            className="inline-flex items-center justify-center border-primary text-primary hover:bg-primary hover:text-white transition-colors"
          >
            <Link href="/jobs">
              Browse All Jobs <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default JobsSection;
