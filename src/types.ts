/**
 * Common types used throughout the application
 */

/**
 * Generic API response structure
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Company information
 */
export interface Company {
  id: number;
  name: string;
  logo: string;
  location: string;
  slug: string;
  openPositions: number;
  description?: string;
  industry?: string;
  size?: string;
  website?: string;
  foundedYear?: number;
}

/**
 * Job information
 */
export interface Job {
  id: number;
  title: string;
  description: string;
  location: string;
  salary: string;
  jobType: string; // full-time, part-time, etc.
  workMode: string; // remote, hybrid, on-site
  companyId: number;
  categoryId: number;
  isFeatured: boolean;
  createdAt: Date;
  requirements?: string[];
}

/**
 * Job with company information
 */
export interface JobWithCompany extends Job {
  company: Company;
}

/**
 * Category information
 */
export interface Category {
  id: number;
  name: string;
  slug: string;
  count: number;
  icon?: string;
}

/**
 * User profile information
 */
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  name: string;
  location?: string;
  bio?: string;
  phoneNumber?: string;
  willingToRelocate?: boolean;
  preferences?: Record<string, any>;
  experience?: Record<string, any>[];
  education?: Record<string, any>[];
  skills?: string[];
  notificationPreference: boolean;
  createdAt: Date;
}

/**
 * Job application status
 */
export type ApplicationStatus = 'pending' | 'reviewing' | 'interview' | 'rejected' | 'accepted';

/**
 * Job application
 */
export interface JobApplication {
  id: number;
  jobId: number;
  userId: number;
  status: ApplicationStatus;
  appliedAt: Date;
  resumeUrl?: string;
  coverLetter?: string;
  notes?: string;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: PaginationMeta;
}

/**
 * Search parameters for jobs
 */
export interface JobSearchParams {
  query?: string;
  location?: string;
  category?: string;
  jobType?: string;
  workMode?: string;
  minSalary?: number;
  maxSalary?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * File upload response
 */
export interface FileUploadResponse {
  id: number;
  originalName: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  fileType: string;
}

/**
 * Notification
 */
export interface Notification {
  id: string;
  userId: number;
  title: string;
  message: string;
  type: 'job' | 'application' | 'system';
  read: boolean;
  createdAt: Date;
  link?: string;
  metadata?: Record<string, any>;
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  applicationsCount: number;
  viewedJobsCount: number;
  savedJobsCount: number;
  interviewsCount: number;
  offersCount: number;
}

/**
 * Error response
 */
export interface ErrorResponse {
  status: number;
  message: string;
  details?: Record<string, any>;
}
