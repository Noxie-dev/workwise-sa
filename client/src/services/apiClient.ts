import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Configuration for the API client
 */
interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Error response from the API
 */
export interface ApiErrorResponse {
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  public readonly code?: string;
  public readonly status?: number;
  public readonly details?: unknown;

  constructor(message: string, status?: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Creates and configures an Axios instance for API requests
 */
const createApiClient = (config: ApiClientConfig): AxiosInstance => {
  const client = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout || 30000,
    headers: {
      'Content-Type': 'application/json',
      ...config.headers,
    },
  });

  // Request interceptor - add auth token
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - handle errors
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const { response } = error;
      
      // Handle network errors
      if (!response) {
        return Promise.reject(
          new ApiError('Network error. Please check your connection.', 0)
        );
      }

      // Parse error response
      const errorData = response.data as ApiErrorResponse;
      const status = response.status;
      const message = errorData?.message || 'An unexpected error occurred';
      const code = errorData?.code;
      const details = errorData?.details;

      // Handle authentication errors
      if (status === 401) {
        // Clear token and redirect to login if needed
        localStorage.removeItem('auth_token');
        // You might want to redirect to login page here
      }

      return Promise.reject(new ApiError(message, status, code, details));
    }
  );

  return client;
};

// Create the default API client
const apiClient = createApiClient({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

export default apiClient;
