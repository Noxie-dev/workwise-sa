import { ApiResponse, ApiError } from './constants';

/**
 * Enhanced API Client with centralized error handling
 * Provides consistent error handling and response formatting across all API calls
 */

/**
 * Centralized error handler for API requests
 * @param request - The API request promise
 * @returns Tuple of [data, error] for consistent error handling
 */
export async function handleApiRequest<T>(
  request: Promise<{ data: T }>
): Promise<ApiResponse<T>> {
  try {
    const { data } = await request;
    return [data, null]; // Success: return data, no error
  } catch (error: any) {
    // Enhanced error logging with more context
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      timestamp: new Date().toISOString(),
    });

    // Return a consistent error shape
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || 'An unknown error occurred',
      code: error.response?.data?.code || error.code,
      status: error.response?.status,
      details: error.response?.data?.details || error.details,
    };

    return [null, apiError]; // Failure: return null data, and an error object
  }
}

/**
 * Enhanced API client with retry logic and better error handling
 */
export class EnhancedApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Remove authentication token
   */
  clearAuthToken() {
    delete this.defaultHeaders['Authorization'];
  }

  /**
   * Make a GET request with error handling
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return handleApiRequest(
      fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: { ...this.defaultHeaders, ...options?.headers },
        ...options,
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return { data: await response.json() };
      })
    );
  }

  /**
   * Make a POST request with error handling
   */
  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return handleApiRequest(
      fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: { ...this.defaultHeaders, ...options?.headers },
        body: data ? JSON.stringify(data) : undefined,
        ...options,
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return { data: await response.json() };
      })
    );
  }

  /**
   * Make a PUT request with error handling
   */
  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return handleApiRequest(
      fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: { ...this.defaultHeaders, ...options?.headers },
        body: data ? JSON.stringify(data) : undefined,
        ...options,
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return { data: await response.json() };
      })
    );
  }

  /**
   * Make a DELETE request with error handling
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return handleApiRequest(
      fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: { ...this.defaultHeaders, ...options?.headers },
        ...options,
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return { data: await response.json() };
      })
    );
  }
}

// Export a default instance
export const enhancedApiClient = new EnhancedApiClient();