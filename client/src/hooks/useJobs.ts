import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, post } from '@/lib/api';
import type { 
  JobPreview, 
  JobWithDetails, 
  JobApplicationInput, 
  JobSearchParams,
  JobSearchResponse,
  JobPreviewsResponse,
  JobDetailsResponse,
  JobApplicationSubmitResponse,
  UserApplicationsResponse
} from '@/types/jobs';

/**
 * Enhanced job previews hook with search and filtering
 */
export function useJobPreviews(params: JobSearchParams = {}) {
  return useQuery({
    queryKey: ['jobs', 'previews', params],
    queryFn: async () => {
      const queryString = new URLSearchParams();
      
      // Add search parameters
      if (params.query) queryString.append('query', params.query);
      if (params.categoryId) queryString.append('categoryId', params.categoryId.toString());
      if (params.location) queryString.append('location', params.location);
      if (params.jobType) queryString.append('jobType', params.jobType);
      if (params.workMode) queryString.append('workMode', params.workMode);
      if (params.experienceLevel) queryString.append('experienceLevel', params.experienceLevel);
      if (params.page) queryString.append('page', params.page.toString());
      if (params.limit) queryString.append('limit', params.limit.toString());
      if (params.featured !== undefined) queryString.append('featured', params.featured.toString());
      
      const path = `/jobPreviews${queryString.toString() ? `?${queryString.toString()}` : ''}`;
      const response = await get<JobPreviewsResponse>(path);
      return response.data;
    },
    staleTime: 30_000, // 30 seconds - jobs change frequently
    gcTime: 5 * 60_000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Enhanced job details hook for authenticated users
 */
export function useJobDetails(id?: number) {
  return useQuery({
    enabled: !!id,
    queryKey: ['jobs', 'details', id],
    queryFn: async () => {
      if (!id) throw new Error('Job ID is required');
      
      // For authenticated users, we need to pass the job ID in the path
      // The Netlify function expects it in the path, not as a query parameter
      const response = await get<JobDetailsResponse>(`/jobDetails/${id}`);
      return response.data;
    },
    staleTime: 5 * 60_000, // 5 minutes - job details don't change as often
    gcTime: 10 * 60_000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Enhanced job application submission hook
 */
export function useSubmitApplication() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: ['jobs', 'apply'],
    mutationFn: async (payload: JobApplicationInput) => {
      const response = await post<JobApplicationSubmitResponse, JobApplicationInput>(
        '/jobApplications', 
        payload
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['jobs', 'previews'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'details', variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ['user', 'applications'] });
      
      // Show success message (you can integrate with your toast system)
      console.log('Application submitted successfully:', data.message);
    },
    onError: (error: Error) => {
      // Handle error (you can integrate with your toast system)
      console.error('Application submission failed:', error.message);
    },
    retry: 1,
  });
}

/**
 * Hook for fetching user's job applications
 */
export function useUserApplications() {
  return useQuery({
    queryKey: ['user', 'applications'],
    queryFn: async () => {
      const response = await get<UserApplicationsResponse>('/jobApplications');
      return response.data;
    },
    staleTime: 2 * 60_000, // 2 minutes - applications can change frequently
    gcTime: 5 * 60_000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Hook for featured jobs (optimized for homepage)
 */
export function useFeaturedJobs(limit: number = 6) {
  return useQuery({
    queryKey: ['jobs', 'featured', limit],
    queryFn: async () => {
      const response = await get<JobPreviewsResponse>(`/jobPreviews?featured=true&limit=${limit}`);
      return response.data;
    },
    staleTime: 5 * 60_000, // 5 minutes
    gcTime: 10 * 60_000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Hook for recent jobs
 */
export function useRecentJobs(limit: number = 10) {
  return useQuery({
    queryKey: ['jobs', 'recent', limit],
    queryFn: async () => {
      const response = await get<JobPreviewsResponse>(`/jobPreviews?limit=${limit}&page=1`);
      return response.data;
    },
    staleTime: 2 * 60_000, // 2 minutes
    gcTime: 5 * 60_000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Hook for jobs by category
 */
export function useJobsByCategory(categoryId: number, limit: number = 20) {
  return useQuery({
    enabled: !!categoryId,
    queryKey: ['jobs', 'category', categoryId, limit],
    queryFn: async () => {
      const response = await get<JobPreviewsResponse>(`/jobPreviews?categoryId=${categoryId}&limit=${limit}`);
      return response.data;
    },
    staleTime: 5 * 60_000, // 5 minutes
    gcTime: 10 * 60_000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Hook for jobs by location
 */
export function useJobsByLocation(location: string, limit: number = 20) {
  return useQuery({
    enabled: !!location,
    queryKey: ['jobs', 'location', location, limit],
    queryFn: async () => {
      const response = await get<JobPreviewsResponse>(`/jobPreviews?location=${encodeURIComponent(location)}&limit=${limit}`);
      return response.data;
    },
    staleTime: 5 * 60_000, // 5 minutes
    gcTime: 10 * 60_000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Hook for remote jobs
 */
export function useRemoteJobs(limit: number = 20) {
  return useQuery({
    queryKey: ['jobs', 'remote', limit],
    queryFn: async () => {
      const response = await get<JobPreviewsResponse>(`/jobPreviews?workMode=Remote&limit=${limit}`);
      return response.data;
    },
    staleTime: 5 * 60_000, // 5 minutes
    gcTime: 10 * 60_000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}


