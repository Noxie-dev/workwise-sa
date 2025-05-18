import axios from 'axios';

// Create an axios instance with the base URL from environment variables
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/.netlify/functions',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error cases
    if (error.response) {
      // Server responded with a status code outside of 2xx range
      console.error('API Error:', error.response.status, error.response.data);
      
      // Handle authentication errors
      if (error.response.status === 401) {
        // Redirect to login or refresh token
        console.log('Authentication error - redirecting to login');
        // window.location.href = '/login';
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('API Error: No response received', error.request);
    } else {
      // Something else happened while setting up the request
      console.error('API Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Auth endpoints
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    user: '/api/auth/user',
  },
  
  // Job endpoints
  jobs: {
    list: '/api/jobs',
    featured: '/api/jobs/featured',
    detail: (id: string) => `/api/jobs/${id}`,
    apply: (id: string) => `/api/jobs/${id}/apply`,
    search: '/api/jobs/search',
  },
  
  // Category endpoints
  categories: {
    list: '/categories',
  },
  
  // Company endpoints
  companies: {
    list: '/api/companies',
    detail: (id: string) => `/api/companies/${id}`,
  },
  
  // User profile endpoints
  profile: {
    get: '/api/profile',
    update: '/api/profile',
    uploadImage: '/api/profile/image',
  },
  
  // CV endpoints
  cv: {
    generate: '/api/cv/generate',
    generateSummary: '/api/cv/generate-summary',
    generateJobDescription: '/api/cv/generate-job-description',
    translate: '/api/cv/translate',
    analyzeImage: '/api/cv/claude/analyze-image',
  },
  
  // Recommendation endpoints
  recommendations: {
    jobs: '/api/recommendations/jobs',
    search: '/api/recommendations/search',
    track: '/api/recommendations/track',
  },
};

export default api;
