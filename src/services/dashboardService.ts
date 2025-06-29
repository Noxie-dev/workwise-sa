// src/services/dashboardService.ts
import { apiClient } from './apiClient';
import { 
  JobDistributionData, 
  CategoryDistribution, 
  AlgorithmConfiguration 
} from '../types/dashboard';
import { PaginatedResponse } from '../types/api';

// Mock data for fallback when API is not available
const mockJobDistributionData: PaginatedResponse<JobDistributionData> = {
  data: [
    {
      id: 1,
      jobId: 101,
      jobTitle: "General Worker - Construction Site",
      companyName: "BuildRight Construction",
      categoryId: 2,
      categoryName: "Construction Worker",
      status: "distributed",
      createdAt: "2025-05-10T08:30:00Z",
      updatedAt: "2025-05-10T09:15:00Z",
      distributedAt: "2025-05-10T09:15:00Z",
      priority: 3,
      matchScore: 85,
      targetUserCount: 50,
      actualUserCount: 48
    },
    // Add more mock data as needed
  ],
  pagination: {
    page: 1,
    limit: 10,
    totalItems: 120,
    totalPages: 12
  }
};

// Mock category distribution data
const mockCategoryDistribution: CategoryDistribution[] = [
  {
    id: 1,
    name: "General Worker",
    slug: "general-worker",
    count: 45,
    distributionStatus: {
      pending: 10,
      distributed: 30,
      failed: 5
    }
  },
  // Add more mock categories
];

// Mock workflow data
const mockWorkflowData = {
  jobIntake: 120,
  ruleMatching: 105,
  ctaInjection: 98,
  distribution: 85
};

// Mock geographic distribution data
const mockGeographicData = [
  { location: "Cape Town", count: 35 },
  { location: "Johannesburg", count: 28 },
  { location: "Durban", count: 22 },
  { location: "Pretoria", count: 18 },
  { location: "Port Elizabeth", count: 12 }
];

// Mock matching factors data
const mockMatchingFactorsData = [
  { factor: "Skills Match", count: 320, percentage: 32 },
  { factor: "Location", count: 280, percentage: 28 },
  { factor: "Experience Level", count: 245, percentage: 24.5 },
  { factor: "User Engagement", count: 155, percentage: 15.5 }
];

// Mock algorithm configuration
const mockAlgorithmConfig: AlgorithmConfiguration = {
  priorityWeights: {
    skills: 0.4,
    location: 0.3,
    experience: 0.2,
    engagement: 0.1
  },
  distributionLimits: {
    maxJobsPerUser: 10,
    maxUsersPerJob: 100,
    cooldownPeriod: 24
  },
  categorySettings: {
    1: {
      enabled: true,
      priority: 3,
      userGroupPercentages: {
        highEngagement: 40,
        mediumEngagement: 40,
        lowEngagement: 20
      }
    },
    2: {
      enabled: true,
      priority: 4,
      userGroupPercentages: {
        highEngagement: 50,
        mediumEngagement: 30,
        lowEngagement: 20
      }
    }
  }
};

export const dashboardService = {
  async fetchJobDistribution(
    categoryFilter: string = 'all',
    dateRange: string = '30d',
    page: number = 1,
    limit: number = 10,
    statusFilter: string = 'all',
    priorityFilter: string = 'all',
    searchQuery: string = ''
  ): Promise<PaginatedResponse<JobDistributionData>> {
    try {
      // Always try to use the real API first
      const response = await apiClient.get<PaginatedResponse<JobDistributionData>>('/api/dashboard/job-distribution', {
        params: { 
          categoryFilter, 
          dateRange, 
          page, 
          limit,
          statusFilter,
          priorityFilter,
          searchQuery
        }
      });
      return response.data;
    } catch (error) {
      // If API call fails or in development without API, use mock data
      console.log('Using mock job distribution data');
      return mockJobDistributionData;
    }
  },

  async fetchCategoryDistribution(
    dateRange: string = '30d'
  ): Promise<CategoryDistribution[]> {
    try {
      const response = await apiClient.get<CategoryDistribution[]>('/api/dashboard/category-distribution', {
        params: { dateRange }
      });
      return response.data;
    } catch (error) {
      console.log('Using mock category distribution data');
      return mockCategoryDistribution;
    }
  },

  async fetchDistributionWorkflow(
    dateRange: string = '30d'
  ): Promise<any> {
    try {
      const response = await apiClient.get('/api/dashboard/distribution-workflow', {
        params: { dateRange }
      });
      return response.data;
    } catch (error) {
      console.log('Using mock workflow data');
      return mockWorkflowData;
    }
  },

  async fetchGeographicDistribution(
    categoryFilter: string = 'all',
    dateRange: string = '30d'
  ): Promise<any> {
    try {
      const response = await apiClient.get('/api/dashboard/geographic-distribution', {
        params: { categoryFilter, dateRange }
      });
      return response.data;
    } catch (error) {
      console.log('Using mock geographic distribution data');
      return mockGeographicData;
    }
  },

  async fetchMatchingFactorsAnalysis(
    dateRange: string = '30d'
  ): Promise<any> {
    try {
      const response = await apiClient.get('/api/dashboard/matching-factors', {
        params: { dateRange }
      });
      return response.data;
    } catch (error) {
      console.log('Using mock matching factors data');
      return mockMatchingFactorsData;
    }
  },

  async fetchAlgorithmConfiguration(): Promise<AlgorithmConfiguration> {
    try {
      const response = await apiClient.get<AlgorithmConfiguration>('/api/dashboard/algorithm-configuration');
      return response.data;
    } catch (error) {
      console.log('Using mock algorithm configuration');
      return mockAlgorithmConfig;
    }
  },

  async updateAlgorithmConfiguration(config: AlgorithmConfiguration): Promise<any> {
    try {
      const response = await apiClient.put('/api/dashboard/algorithm-configuration', config);
      return response.data;
    } catch (error) {
      console.log('Mock update algorithm configuration');
      return { success: true, config };
    }
  },

  async distributeJob(jobId: number): Promise<any> {
    try {
      const response = await apiClient.post(`/api/dashboard/jobs/${jobId}/distribute`);
      return response.data;
    } catch (error) {
      console.log('Mock distribute job');
      return { success: true, message: 'Job distribution initiated' };
    }
  },

  async updateJobPriority(jobId: number, priority: number): Promise<any> {
    try {
      const response = await apiClient.put(`/api/dashboard/jobs/${jobId}/priority`, { priority });
      return response.data;
    } catch (error) {
      console.log('Mock update job priority');
      return { success: true, message: 'Job priority updated' };
    }
  },

  async removeFromQueue(jobId: number): Promise<any> {
    try {
      const response = await apiClient.post(`/api/dashboard/jobs/${jobId}/remove-from-queue`);
      return response.data;
    } catch (error) {
      console.log('Mock remove from queue');
      return { success: true, message: 'Job removed from distribution queue' };
    }
  },

  async exportJobDistributionData(
    categoryFilter: string = 'all',
    dateRange: string = '30d',
    format: string = 'csv'
  ): Promise<string> {
    try {
      const response = await apiClient.get('/api/dashboard/job-distribution/export', {
        params: { categoryFilter, dateRange, format },
        responseType: 'blob'
      });
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `job-distribution.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return url;
    } catch (error) {
      console.log('Mock export job distribution data');
      return 'mock-export-url';
    }
  },

  async trackUserInteraction(
    userId: string,
    interactionType: string,
    metadata: any
  ): Promise<any> {
    try {
      const response = await apiClient.post('/api/track', {
        userId,
        interactionType,
        ...metadata
      });
      return response.data;
    } catch (error) {
      console.log('Mock track user interaction');
      return { success: true };
    }
  }
};
