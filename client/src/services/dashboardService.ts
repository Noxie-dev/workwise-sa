import apiClient from './apiClient';

// Pagination interface
export interface PaginationMetadata {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

// Generic paginated response interface
export interface PaginatedResponse<T> {
  data: T;
  pagination: PaginationMetadata;
}

// Types for dashboard data
export interface JobDistributionData {
  categories: { category: string; count: number }[];
  locations: { name: string; value: number }[];
  trends: { date: string; applications: number }[];
}

export interface JobRecommendation {
  id: string;
  title: string;
  company: string;
  match: number;
  location: string;
  type: string;
  postedDate: string;
  description: string;
  skills: string[];
}

export interface SkillsAnalysisData {
  marketDemand: {
    skill: string;
    demand: number;
    growth: number;
  }[];
  userSkills: {
    skill: string;
    level: string;
  }[];
  recommendations: {
    skill: string;
    reason: string;
  }[];
}

// Mock data for development
const MOCK_JOB_DISTRIBUTION: JobDistributionData = {
  categories: [
    { category: "Retail", count: 180 },
    { category: "IT", count: 250 },
    { category: "Healthcare", count: 120 },
    { category: "Finance", count: 90 },
    { category: "Education", count: 75 },
  ],
  locations: [
    { name: "Johannesburg", value: 300 },
    { name: "Cape Town", value: 220 },
    { name: "Durban", value: 150 },
    { name: "Pretoria", value: 120 },
    { name: "Port Elizabeth", value: 80 },
  ],
  trends: [
    { date: "2025-01", applications: 450 },
    { date: "2025-02", applications: 480 },
    { date: "2025-03", applications: 520 },
    { date: "2025-04", applications: 510 },
    { date: "2025-05", applications: 550 },
  ]
};

const MOCK_JOB_RECOMMENDATIONS: JobRecommendation[] = [
  {
    id: "job123",
    title: "Software Developer",
    company: "Tech Co",
    match: 85,
    location: "Cape Town",
    type: "Full-time",
    postedDate: "2025-04-15",
    description: "Entry-level software developer position with opportunities to work on exciting projects.",
    skills: ["JavaScript", "React", "Node.js"]
  },
  {
    id: "job124",
    title: "Retail Assistant",
    company: "ShopRight",
    match: 78,
    location: "Johannesburg",
    type: "Part-time",
    postedDate: "2025-04-18",
    description: "Customer-facing retail position with flexible hours and competitive pay.",
    skills: ["Customer Service", "Cash Handling", "Inventory Management"]
  },
  {
    id: "job125",
    title: "Administrative Clerk",
    company: "Business Solutions",
    match: 92,
    location: "Pretoria",
    type: "Full-time",
    postedDate: "2025-04-10",
    description: "Administrative support role in a fast-paced office environment.",
    skills: ["MS Office", "Filing", "Data Entry"]
  }
];

// Mock skills analysis data
const MOCK_SKILLS_ANALYSIS: SkillsAnalysisData = {
  marketDemand: [
    { skill: 'JavaScript', demand: 85, growth: 12 },
    { skill: 'Python', demand: 78, growth: 18 },
    { skill: 'React', demand: 72, growth: 15 },
    { skill: 'Data Analysis', demand: 68, growth: 22 },
    { skill: 'Project Management', demand: 65, growth: 8 },
    { skill: 'SQL', demand: 60, growth: 5 },
  ],
  userSkills: [
    { skill: 'JavaScript', level: 'Intermediate' },
    { skill: 'HTML/CSS', level: 'Advanced' },
    { skill: 'Communication', level: 'Advanced' },
  ],
  recommendations: [
    { skill: 'React', reason: 'High demand in your preferred job categories' },
    { skill: 'Python', reason: 'Fastest growing skill in the market' },
    { skill: 'SQL', reason: 'Complements your existing JavaScript skills' }
  ]
};

/**
 * Service for dashboard-related API calls
 */
export const dashboardService = {
  /**
   * Get job distribution data with pagination
   */
  async fetchJobDistribution(
    categoryFilter: string = 'all',
    dateRange: string = '30d',
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<JobDistributionData>> {
    try {
      // Always try to use the real API first
      const response = await apiClient.get<PaginatedResponse<JobDistributionData>>('/api/dashboard/job-distribution', {
        params: { categoryFilter, dateRange, page, limit }
      });
      return response.data;
    } catch (error) {
      // If API call fails or in development without API, use mock data
      console.log('Using mock job distribution data');
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay

      // Create a mock paginated response
      return {
        data: MOCK_JOB_DISTRIBUTION,
        pagination: {
          page,
          limit,
          totalItems: MOCK_JOB_DISTRIBUTION.categories.length,
          totalPages: Math.ceil(MOCK_JOB_DISTRIBUTION.categories.length / limit)
        }
      };
    }
  },

  /**
   * Get job recommendations with pagination
   */
  async fetchJobRecommendations(
    limit: number = 3,
    userId?: string,
    page: number = 1,
    pageLimit: number = 10
  ): Promise<PaginatedResponse<JobRecommendation[]>> {
    try {
      // Always try to use the real API first
      const response = await apiClient.get<PaginatedResponse<JobRecommendation[]>>('/api/dashboard/job-recommendations', {
        params: { recommendationLimit: limit, userId, page, limit: pageLimit }
      });
      return response.data;
    } catch (error) {
      // If API call fails or in development without API, use mock data
      console.log('Using mock job recommendations data');
      await new Promise(resolve => setTimeout(resolve, 600)); // Simulate network delay

      // Create a mock paginated response
      const startIndex = (page - 1) * pageLimit;
      const endIndex = Math.min(startIndex + pageLimit, MOCK_JOB_RECOMMENDATIONS.length);

      return {
        data: MOCK_JOB_RECOMMENDATIONS.slice(startIndex, endIndex),
        pagination: {
          page,
          limit: pageLimit,
          totalItems: MOCK_JOB_RECOMMENDATIONS.length,
          totalPages: Math.ceil(MOCK_JOB_RECOMMENDATIONS.length / pageLimit)
        }
      };
    }
  },

  /**
   * Get skills analysis data with pagination
   */
  async fetchSkillsAnalysis(
    userId?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<SkillsAnalysisData>> {
    try {
      // Always try to use the real API first
      const response = await apiClient.get<PaginatedResponse<SkillsAnalysisData>>('/api/dashboard/skills-analysis', {
        params: { userId, page, limit }
      });
      return response.data;
    } catch (error) {
      // If API call fails or in development without API, use mock data
      console.log('Using mock skills analysis data');
      await new Promise(resolve => setTimeout(resolve, 700)); // Simulate network delay

      // Create a mock paginated response
      return {
        data: MOCK_SKILLS_ANALYSIS,
        pagination: {
          page,
          limit,
          totalItems: MOCK_SKILLS_ANALYSIS.marketDemand.length,
          totalPages: Math.ceil(MOCK_SKILLS_ANALYSIS.marketDemand.length / limit)
        }
      };
    }
  },

  /**
   * Export dashboard data to CSV
   */
  exportDashboardData(data: any, filename: string = 'dashboard-data.csv'): void {
    // Convert data to CSV format
    let csvContent = '';

    // Handle different data types
    if (data.categories) {
      // Job distribution data
      csvContent = 'Category,Count\n';
      data.categories.forEach((item: { category: string; count: number }) => {
        csvContent += `${item.category},${item.count}\n`;
      });
    } else if (Array.isArray(data) && data[0]?.title) {
      // Job recommendations
      csvContent = 'Title,Company,Match,Location,Type,Posted Date\n';
      data.forEach((item: JobRecommendation) => {
        csvContent += `"${item.title}","${item.company}",${item.match},"${item.location}","${item.type}","${item.postedDate}"\n`;
      });
    } else if (data.marketDemand) {
      // Skills analysis
      csvContent = 'Skill,Demand,Growth\n';
      data.marketDemand.forEach((item: { skill: string; demand: number; growth: number }) => {
        csvContent += `"${item.skill}",${item.demand},${item.growth}\n`;
      });
    }

    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export default dashboardService;
