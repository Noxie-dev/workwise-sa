import { useEffect, useReducer, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet-async';
import JobSearch from '@/components/JobSearch';
import JobCard from '@/components/JobCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { JobWithCompany } from '@shared/schema';
import { jobsService, JobSearchParams } from '@/services/jobsService';
import { useToast } from '@/hooks/use-toast';

// Action types for the reducer
enum JobsActionType {
  SET_SEARCH_PARAMS = 'SET_SEARCH_PARAMS',
  SET_SEARCH_QUERY = 'SET_SEARCH_QUERY',
  TOGGLE_FAVORITE = 'TOGGLE_FAVORITE',
}

// Action interfaces
interface SetSearchParamsAction {
  type: JobsActionType.SET_SEARCH_PARAMS;
  payload: URLSearchParams;
}

interface SetSearchQueryAction {
  type: JobsActionType.SET_SEARCH_QUERY;
  payload: string;
}

interface ToggleFavoriteAction {
  type: JobsActionType.TOGGLE_FAVORITE;
  payload: { jobId: number; isFavorite: boolean };
}

// Union type for all actions
type JobsAction = SetSearchParamsAction | SetSearchQueryAction | ToggleFavoriteAction;

// State interface
interface JobsState {
  searchParams: URLSearchParams;
  searchQuery: string;
  favorites: Set<number>;
}

// Initial state
const initialState: JobsState = {
  searchParams: new URLSearchParams(),
  searchQuery: '',
  favorites: new Set<number>(),
};

// Reducer function
const jobsReducer = (state: JobsState, action: JobsAction): JobsState => {
  switch (action.type) {
    case JobsActionType.SET_SEARCH_PARAMS:
      return {
        ...state,
        searchParams: action.payload,
      };
    case JobsActionType.SET_SEARCH_QUERY:
      return {
        ...state,
        searchQuery: action.payload,
      };
    case JobsActionType.TOGGLE_FAVORITE: {
      const newFavorites = new Set(state.favorites);
      if (action.payload.isFavorite) {
        newFavorites.add(action.payload.jobId);
      } else {
        newFavorites.delete(action.payload.jobId);
      }
      return {
        ...state,
        favorites: newFavorites,
      };
    }
    default:
      return state;
  }
};

/**
 * Jobs page component that displays job listings with search functionality
 */
const Jobs: React.FC = () => {
  const [location] = useLocation();
  const [state, dispatch] = useReducer(jobsReducer, initialState);
  const { toast } = useToast();

  // Extract state variables for easier access
  const { searchParams, searchQuery, favorites } = state;

  // Update search params and query when location changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    dispatch({ type: JobsActionType.SET_SEARCH_PARAMS, payload: params });
    dispatch({ type: JobsActionType.SET_SEARCH_QUERY, payload: params.get('q') || '' });
  }, [location]);

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback(async (jobId: number, isFavorite: boolean) => {
    try {
      // Optimistically update UI
      dispatch({
        type: JobsActionType.TOGGLE_FAVORITE,
        payload: { jobId, isFavorite },
      });

      // Call API to update favorite status
      await jobsService.toggleFavorite(jobId, isFavorite);

      // Show success message
      toast({
        title: isFavorite ? 'Job added to favorites' : 'Job removed from favorites',
        description: isFavorite
          ? 'You can view your favorites in your profile'
          : 'The job has been removed from your favorites',
      });
    } catch (error) {
      // Revert UI change on error
      dispatch({
        type: JobsActionType.TOGGLE_FAVORITE,
        payload: { jobId, isFavorite: !isFavorite },
      });

      // Show error message
      toast({
        variant: 'destructive',
        title: 'Failed to update favorites',
        description: 'Please try again later',
      });
    }
  }, [toast]);

  // Prepare search parameters
  const searchParamsObj: JobSearchParams = {
    query: searchQuery,
    page: 1,
    limit: 20,
  };

  // Fetch jobs with search query if provided
  const { data, isLoading, error } = useQuery({
    queryKey: ['jobs', 'search', searchParamsObj],
    queryFn: () => jobsService.searchJobs(searchParamsObj),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const renderJobSkeleton = () => (
    Array(6).fill(0).map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow-card overflow-hidden">
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
  );

  return (
    <>
      <Helmet>
        <title>Browse Jobs | WorkWise SA</title>
        <meta name="description" content="Find job opportunities in South Africa. Search, filter and apply for jobs across all industries." />
      </Helmet>

      <main className="flex-grow bg-light py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Find Your Dream Job</h1>
            <p className="text-muted">Browse through our comprehensive list of jobs across South Africa</p>
          </div>

          <JobSearch initialQuery={searchQuery} className="mb-8" />

          {searchQuery && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">
                Search Results {jobs && `(${jobs.length})`}
              </h2>
              {searchQuery && (
                <p className="text-muted">
                  Showing results for: <span className="font-medium">{searchQuery}</span>
                </p>
              )}
            </div>
          )}

          {error ? (
            <div className="text-center p-8 bg-white rounded-lg shadow">
              <p className="text-red-500 mb-4">Failed to load jobs. Please try again later.</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? renderJobSkeleton() : (
                data?.jobs?.length ? (
                  data.jobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onFavoriteToggle={handleFavoriteToggle}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center p-8 bg-white rounded-lg shadow">
                    <p className="text-xl font-medium mb-2">No jobs found</p>
                    <p className="text-muted mb-4">Try adjusting your search criteria</p>
                    {data && data.total === 0 && searchQuery && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          dispatch({ type: JobsActionType.SET_SEARCH_QUERY, payload: '' });
                          window.history.pushState({}, '', '/jobs');
                        }}
                      >
                        Clear search
                      </Button>
                    )}
                  </div>
                )
              )}
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === data.page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set('page', page.toString());
                      window.history.pushState({}, '', `/jobs?${newParams.toString()}`);
                      window.dispatchEvent(new Event('popstate'));
                    }}
                  >
                    {page}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Jobs;
