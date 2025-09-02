import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { jobApplicationService, JobApplication } from '@/services/jobApplicationService';
import { useToast } from '@/hooks/use-toast';

interface UseApplicationsOptions {
  page?: number;
  limit?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useApplications(options: UseApplicationsOptions = {}) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch applications
  const {
    data: applicationsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['userApplications', options],
    queryFn: () => jobApplicationService.getUserApplications(options),
    enabled: !!currentUser,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Withdraw application mutation
  const withdrawApplicationMutation = useMutation({
    mutationFn: (applicationId: number) => 
      jobApplicationService.withdrawApplication(applicationId.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userApplications'] });
      toast({
        title: "Application Withdrawn",
        description: "Your application has been successfully withdrawn.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to withdraw application.",
        variant: "destructive",
      });
    },
  });

  // Update application mutation
  const updateApplicationMutation = useMutation({
    mutationFn: ({ applicationId, updates }: { 
      applicationId: number; 
      updates: { status?: string; notes?: string } 
    }) => 
      jobApplicationService.updateApplication(applicationId.toString(), updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userApplications'] });
      toast({
        title: "Application Updated",
        description: "Your application has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update application.",
        variant: "destructive",
      });
    },
  });

  // Check if user has applied for a job
  const checkApplicationStatus = async (jobId: string): Promise<JobApplication | null> => {
    try {
      return await jobApplicationService.getApplicationStatus(jobId);
    } catch (error) {
      console.error('Failed to check application status:', error);
      return null;
    }
  };

  // Get application statistics
  const getApplicationStats = () => {
    const applications = applicationsData?.applications || [];
    return {
      total: applications.length,
      applied: applications.filter(app => app.status === 'applied').length,
      reviewed: applications.filter(app => app.status === 'reviewed').length,
      interview: applications.filter(app => app.status === 'interview').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
      hired: applications.filter(app => app.status === 'hired').length,
    };
  };

  return {
    applications: applicationsData?.applications || [],
    pagination: applicationsData?.pagination,
    isLoading,
    error,
    refetch,
    withdrawApplication: withdrawApplicationMutation.mutate,
    isWithdrawing: withdrawApplicationMutation.isPending,
    updateApplication: updateApplicationMutation.mutate,
    isUpdating: updateApplicationMutation.isPending,
    checkApplicationStatus,
    getApplicationStats,
  };
}

export default useApplications;