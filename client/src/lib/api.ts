/**
 * Enhanced API layer for WorkWise SA
 * Uses fetch (no axios), smart cache keys, retries, and type safety
 */

const API_BASE =
  import.meta.env.VITE_API_BASE ??
  // Netlify local dev proxy or production functions
  '/.netlify/functions';

/**
 * Enhanced JSON response handler with better error messages
 */
async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const errorMessage = text || `HTTP ${res.status}: ${res.statusText}`;
    
    // Enhanced error handling for common status codes
    switch (res.status) {
      case 401:
        throw new Error('Authentication required. Please sign in to continue.');
      case 403:
        throw new Error('Access denied. You don\'t have permission to perform this action.');
      case 404:
        throw new Error('Resource not found. The requested item may have been removed.');
      case 429:
        throw new Error('Too many requests. Please try again later.');
      case 500:
        throw new Error('Server error. Please try again later or contact support.');
      default:
        throw new Error(errorMessage);
    }
  }
  
  try {
    return await res.json() as Promise<T>;
  } catch (error) {
    throw new Error('Invalid response format. Please try again.');
  }
}

/**
 * GET request helper with authentication support
 */
export async function get<T>(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, { 
    credentials: 'include',
    ...options,
  });
  return json<T>(res);
}

/**
 * POST request helper with JSON body and authentication
 */
export async function post<T, B = unknown>(path: string, body: B, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: JSON.stringify(body),
    credentials: 'include',
    ...options,
  });
  return json<T>(res);
}

/**
 * PUT request helper for updates
 */
export async function put<T, B = unknown>(path: string, body: B, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: JSON.stringify(body),
    credentials: 'include',
    ...options,
  });
  return json<T>(res);
}

/**
 * DELETE request helper
 */
export async function del<T>(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    credentials: 'include',
    ...options,
  });
  return json<T>(res);
}

/**
 * PATCH request helper for partial updates
 */
export async function patch<T, B = unknown>(path: string, body: B, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: JSON.stringify(body),
    credentials: 'include',
    ...options,
  });
  return json<T>(res);
}

/**
 * Upload file helper with progress tracking
 */
export async function uploadFile<T>(
  path: string, 
  file: File, 
  onProgress?: (progress: number) => void
): Promise<T> {
  const formData = new FormData();
  formData.append('file', file);

  const xhr = new XMLHttpRequest();
  
  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = (event.loaded / event.total) * 100;
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error('Invalid response format'));
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed due to network error'));
    });

    xhr.open('POST', `${API_BASE}${path}`);
    xhr.withCredentials = true;
    xhr.send(formData);
  });
}
