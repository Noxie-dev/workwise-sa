import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService, type CompanySearchParams } from '@/services/companyService';

export const useCompanies = (params: CompanySearchParams = {}) => {
  return useQuery({
    queryKey: ['companies', params],
    queryFn: () => companyService.searchCompanies(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCompany = (id: number) => {
  return useQuery({
    queryKey: ['company', id],
    queryFn: () => companyService.getCompanyById(id),
    enabled: !!id,
  });
};

export const useCompanyBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['company', 'slug', slug],
    queryFn: () => companyService.getCompanyBySlug(slug),
    enabled: !!slug,
  });
};

export const useCompanyJobs = (companyId: number, params: { page?: number; limit?: number } = {}) => {
  return useQuery({
    queryKey: ['company-jobs', companyId, params],
    queryFn: () => companyService.getCompanyJobs(companyId, params),
    enabled: !!companyId,
  });
};

export const useCompanyInsights = () => {
  return useQuery({
    queryKey: ['company-insights'],
    queryFn: () => companyService.getCompanyInsights(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useFollowCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (companyId: number) => companyService.followCompany(companyId),
    onSuccess: () => {
      // Invalidate and refetch company data
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company'] });
    },
  });
};

export const useUnfollowCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (companyId: number) => companyService.unfollowCompany(companyId),
    onSuccess: () => {
      // Invalidate and refetch company data
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company'] });
    },
  });
};

export const useCreateCompanyAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: companyService.createCompanyAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-alerts'] });
    },
  });
};

export const useCompanyAlerts = (userId: number) => {
  return useQuery({
    queryKey: ['company-alerts', userId],
    queryFn: () => companyService.getCompanyAlerts(userId),
    enabled: !!userId,
  });
};

export const useGenerateCompanySummary = () => {
  return useMutation({
    mutationFn: (companyId: number) => companyService.generateCompanySummary(companyId),
  });
};

export const useGenerateCoverLetter = () => {
  return useMutation({
    mutationFn: ({ companyId, jobId, userProfile }: { 
      companyId: number; 
      jobId: number; 
      userProfile: any; 
    }) => companyService.generateCoverLetter(companyId, jobId, userProfile),
  });
};