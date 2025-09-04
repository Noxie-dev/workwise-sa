/**
 * API Configuration
 * Handles different environments (development, production, Netlify)
 */

const getApiBaseUrl = (): string => {
  // Check if we're in production or on Netlify
  if (import.meta.env.PROD || window.location.hostname.includes('netlify.app')) {
    // Use Netlify functions in production
    return '';
  }
  
  // Use local backend server in development
  return 'http://localhost:4000';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  
  // API Endpoints
  ENDPOINTS: {
    CATEGORIES: '/api/categories',
    COMPANIES: '/api/companies',
    JOBS: {
      PREVIEWS: '/api/jobs/previews',
      DETAILS: (id: number) => `/api/jobs/${id}`,
    },
    JOB_APPLICATIONS: '/api/job-applications',
    CV_GENERATE: '/api/cv/generate-template',
    ANALYTICS: {
      HIRING_TRENDS: '/api/analytics/hiring-trends',
      TOP_HIRING: '/api/companies/top-hiring',
      HIRING_METRICS: (companyId: number) => `/api/companies/${companyId}/hiring-metrics`,
    }
  }
};

/**
 * Helper function to build full API URLs
 */
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

/**
 * Helper function to check if we should use mock data
 */
export const shouldUseMockData = (): boolean => {
  return import.meta.env.PROD || window.location.hostname.includes('netlify.app');
};
