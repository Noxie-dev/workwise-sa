import { useEffect, useReducer, useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet-async';
import JobSearch from '@/components/JobSearch';
import JobPreviewCard from '@/components/JobPreviewCard';
import AuthPromptModal from '@/components/AuthPromptModal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { JobPreview, JobSearchParams } from '../../../shared/job-types';
import { tieredJobsService } from '@/services/tieredJobsService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Action types for the reducer
enum JobsActionType {
  SET_SEARCH_PARAMS = 'SET_SEARCH_PARAMS',
  SET_SEARCH_QUERY = 'SET_SEARCH_QUERY',
  SET_AUTH_MODAL = 'SET_AUTH_MODAL',
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

interface SetAuthModalAction {
  type: JobsActionType.SET_AUTH_MODAL;
  payload: { isOpen: boolean; job?: JobPreview };
}

// Union type for all actions
type JobsAction = SetSearchParamsAction | SetSearchQueryAction | SetAuthModalAction;

// State interface
interface JobsState {
  searchParams: URLSearchParams;
  searchQuery: string;
  authModal: {
    isOpen: boolean;
    job?: JobPreview;
  };
}

// Initial state
const initialState: JobsState = {
  searchParams: new URLSearchParams(),
  searchQuery: '',
  authModal: {
    isOpen: false,
    job: undefined,
  },
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
    case JobsActionType.SET_AUTH_MODAL:
      return {
        ...state,
        authModal: action.payload,
      };
    default:
      return state;
  }
};

/**
 * Jobs page component that displays job listings with tiered access
 */
const Jobs: React.FC = () => {
  const [location, navigate] = useLocation();
  const [state, dispatch] = useReducer(jobsReducer, initialState);
  const { user } = useAuth();
  const { toast } = useToast();

  // Extract state variables for easier access
  const { searchParams, searchQuery, authModal } = state;

  // Update search params and query when location changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    dispatch({ type: JobsActionType.SET_SEARCH_PARAMS, payload: params });
    dispatch({ type: JobsActionType.SET_SEARCH_QUERY, payload: params.get('q') || '' });
  }, [location]);

  // Handle job card click
  const handleJobClick = useCallback((job: JobPreview) => {
    if (!user) {
      // Show authentication modal for anonymous users
      dispatch({
        type: JobsActionType.SET_AUTH_MODAL,
        payload: { isOpen: true, job },
      });
    } else {
      // Navigate directly to job details for authenticated users
      navigate(`/jobs/${job.id}`);
    }
  }, [user, navigate]);

  // Handle auth modal close
  const handleAuthModalClose = useCallback(() => {
    dispatch({
      type: JobsActionType.SET_AUTH_MODAL,
      payload: { isOpen: false, job: undefined },
    });
  }, []);

  // Handle sign up from modal
  const handleSignUp = useCallback(() => {
    handleAuthModalClose();
    navigate('/register');
  }, [navigate, handleAuthModalClose]);

  // Handle sign in from modal
  const handleSignIn = useCallback(() => {
    handleAuthModalClose();
    navigate('/login');
  }, [navigate, handleAuthModalClose]);

  // Prepare search parameters
  const searchParamsObj: JobSearchParams = {
    query: searchQuery,
    page: parseInt(searchParams.get('page') || '1'),
    limit: 20,
    categoryId: searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!) : undefined,
    location: searchParams.get('location') || undefined,
    jobType: searchParams.get('jobType') || undefined,
    workMode: searchParams.get('workMode') || undefined,
  };

  // Fetch job previews (public access)
  const { data, isLoading, error } = useQuery({
    queryKey: ['job-previews', searchParamsObj],
    queryFn: () => tieredJobsService.getJobPreviews(searchParamsObj),
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
                Search Results {data?.jobs && `(${data.jobs.length})`}
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
                    <JobPreviewCard
                      key={job.id}
                      job={job}
                      onClick={() => handleJobClick(job)}
                      showAuthPrompt={!user}
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

          {/* Authentication Modal */}
          <AuthPromptModal
            isOpen={authModal.isOpen}
            onClose={handleAuthModalClose}
            job={authModal.job}
            onSignUp={handleSignUp}
            onSignIn={handleSignIn}
          />

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
