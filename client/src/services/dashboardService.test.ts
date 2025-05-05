import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dashboardService } from './dashboardService';
import apiClient from './apiClient';

// Mock the apiClient
vi.mock('./apiClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('dashboardService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore all mocks after each test
    vi.restoreAllMocks();
  });

  describe('fetchJobDistribution', () => {
    it('should fetch job distribution data from the API', async () => {
      // Mock API response
      const mockResponse = {
        data: {
          data: {
            categories: [
              { category: 'IT', count: 250 },
              { category: 'Retail', count: 180 },
            ],
            locations: [
              { name: 'Johannesburg', value: 300 },
              { name: 'Cape Town', value: 220 },
            ],
            trends: [
              { date: '2025-01', applications: 450 },
              { date: '2025-02', applications: 480 },
            ],
          },
          pagination: {
            page: 1,
            limit: 10,
            totalItems: 2,
            totalPages: 1
          }
        },
      };

      // Setup the mock to return our mock response
      (apiClient.get as any).mockResolvedValue(mockResponse);

      // Call the service method
      const result = await dashboardService.fetchJobDistribution('all', '30d', 1, 10);

      // Verify the API was called with the correct parameters
      expect(apiClient.get).toHaveBeenCalledWith('/api/dashboard/job-distribution', {
        params: { categoryFilter: 'all', dateRange: '30d', page: 1, limit: 10 },
      });

      // Verify the result matches our mock data
      expect(result).toEqual(mockResponse.data);
    });

    it('should return mock data if API call fails', async () => {
      // Setup the mock to throw an error
      (apiClient.get as any).mockRejectedValue(new Error('API error'));

      // Call the service method
      const result = await dashboardService.fetchJobDistribution('all', '30d', 1, 10);

      // Verify the API was called
      expect(apiClient.get).toHaveBeenCalled();

      // Verify we got mock data back
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.categories).toBeDefined();
      expect(result.data.locations).toBeDefined();
      expect(result.data.trends).toBeDefined();
      expect(result.pagination).toBeDefined();
    });
  });

  describe('fetchJobRecommendations', () => {
    it('should fetch job recommendations from the API', async () => {
      // Mock API response
      const mockResponse = {
        data: {
          data: [
            {
              id: 'job123',
              title: 'Software Developer',
              company: 'Tech Co',
              match: 85,
              location: 'Cape Town',
              type: 'Full-time',
              postedDate: '2025-04-15',
              description: 'Entry-level software developer position.',
              skills: ['JavaScript', 'React', 'Node.js'],
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            totalItems: 1,
            totalPages: 1
          }
        },
      };

      // Setup the mock to return our mock response
      (apiClient.get as any).mockResolvedValue(mockResponse);

      // Call the service method
      const result = await dashboardService.fetchJobRecommendations(3, 'user123', 1, 10);

      // Verify the API was called with the correct parameters
      expect(apiClient.get).toHaveBeenCalledWith('/api/dashboard/job-recommendations', {
        params: { recommendationLimit: 3, userId: 'user123', page: 1, limit: 10 },
      });

      // Verify the result matches our mock data
      expect(result).toEqual(mockResponse.data);
    });

    it('should return mock data if API call fails', async () => {
      // Setup the mock to throw an error
      (apiClient.get as any).mockRejectedValue(new Error('API error'));

      // Call the service method
      const result = await dashboardService.fetchJobRecommendations(3, undefined, 1, 10);

      // Verify the API was called
      expect(apiClient.get).toHaveBeenCalled();

      // Verify we got mock data back
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0].id).toBeDefined();
      expect(result.data[0].title).toBeDefined();
      expect(result.pagination).toBeDefined();
    });
  });

  describe('fetchSkillsAnalysis', () => {
    it('should fetch skills analysis data from the API', async () => {
      // Mock API response
      const mockResponse = {
        data: {
          data: {
            marketDemand: [
              { skill: 'JavaScript', demand: 85, growth: 12 },
              { skill: 'Python', demand: 78, growth: 18 },
            ],
            userSkills: [
              { skill: 'JavaScript', level: 'Intermediate' },
              { skill: 'HTML/CSS', level: 'Advanced' },
            ],
            recommendations: [
              { skill: 'React', reason: 'High demand in your preferred job categories' },
              { skill: 'Python', reason: 'Fastest growing skill in the market' },
            ],
          },
          pagination: {
            page: 1,
            limit: 10,
            totalItems: 2,
            totalPages: 1
          }
        },
      };

      // Setup the mock to return our mock response
      (apiClient.get as any).mockResolvedValue(mockResponse);

      // Call the service method
      const result = await dashboardService.fetchSkillsAnalysis('user123', 1, 10);

      // Verify the API was called with the correct parameters
      expect(apiClient.get).toHaveBeenCalledWith('/api/dashboard/skills-analysis', {
        params: { userId: 'user123', page: 1, limit: 10 },
      });

      // Verify the result matches our mock data
      expect(result).toEqual(mockResponse.data);
    });

    it('should return mock data if API call fails', async () => {
      // Setup the mock to throw an error
      (apiClient.get as any).mockRejectedValue(new Error('API error'));

      // Call the service method
      const result = await dashboardService.fetchSkillsAnalysis('user123', 1, 10);

      // Verify the API was called
      expect(apiClient.get).toHaveBeenCalled();

      // Verify we got mock data back
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.marketDemand).toBeDefined();
      expect(result.data.userSkills).toBeDefined();
      expect(result.data.recommendations).toBeDefined();
      expect(result.pagination).toBeDefined();
    });
  });
});
