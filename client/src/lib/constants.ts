/**
 * API Endpoints Constants
 * Centralized location for all API routes to avoid magic strings
 * and provide a single source of truth for endpoint management
 */

export const ApiEndpoints = {
  // AI Services
  AI: {
    ANALYZE_SUITABILITY: '/ai/analyze-suitability',
    GENERATE_COVER_LETTER: '/ai/generate-cover-letter',
  },
  
  // Job Applications
  APPLICATIONS: {
    LIST: '/api/jobApplications',
    CREATE: '/api/jobApplications',
    DETAIL: (id: string) => `/api/jobApplications/${id}`,
    UPDATE: (id: string) => `/api/jobApplications/${id}`,
    DELETE: (id: string) => `/api/jobApplications/${id}`,
    BY_JOB: (jobId: string) => `/api/jobApplications/job/${jobId}`,
  },
  
  // Jobs
  JOBS: {
    LIST: '/api/jobs',
    DETAIL: (id: string) => `/api/jobs/${id}`,
    CREATE: '/api/jobs',
    UPDATE: (id: string) => `/api/jobs/${id}`,
    DELETE: (id: string) => `/api/jobs/${id}`,
    SEARCH: '/api/jobs/search',
  },
  
  // User Profile
  PROFILE: {
    GET: '/api/profile',
    UPDATE: '/api/profile',
    PICTURE: '/api/profile/picture',
    SKILLS: '/api/profile/skills',
    EXPERIENCE: '/api/profile/experience',
    EDUCATION: '/api/profile/education',
  },
  
  // Employer
  EMPLOYER: {
    DASHBOARD: '/api/employer/dashboard',
    JOBS: '/api/employer/jobs',
    APPLICATIONS: '/api/employer/applications',
  },
  
  // Billing
  BILLING: {
    SUBSCRIPTION: '/api/billing/subscription',
    INVOICES: '/api/billing/invoices',
    PAYMENT_METHODS: '/api/billing/payment-methods',
  },
  
  // Notifications
  NOTIFICATIONS: {
    LIST: '/api/notifications',
    MARK_READ: (id: string) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: '/api/notifications/read-all',
  },
} as const;

/**
 * API Error Types
 */
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, any>;
}

/**
 * API Response wrapper for consistent error handling
 */
export type ApiResponse<T> = [T | null, ApiError | null];

/**
 * Competition Level Display Mapping
 */
export const CompetitionLevelDisplay = {
  low: 'Low Competition',
  medium: 'Medium Competition', 
  high: 'High Competition',
} as const;

/**
 * Competition Level Colors for UI
 */
export const CompetitionLevelColors = {
  low: 'text-green-600 bg-green-50',
  medium: 'text-yellow-600 bg-yellow-50',
  high: 'text-red-600 bg-red-50',
} as const;