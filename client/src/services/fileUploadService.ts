import { API_URL } from '@/lib/env';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseUploadError(response: Response, fallback: string) {
  const text = await response.text();
  if (!text) return fallback;

  try {
    const errorData = JSON.parse(text);
    return errorData.error?.message || errorData.error || errorData.message || fallback;
  } catch {
    return text;
  }
}

/**
 * Service for handling file uploads to PostgreSQL storage
 */
export const fileUploadService = {
  /**
   * Upload a professional image to PostgreSQL storage
   * @param file The image file to upload
   * @param userId The user ID to associate with the image
   * @returns The download URL of the uploaded image
   */
  async uploadProfessionalImage(file: File, userId: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const uploadUrl = `${API_URL}/api/files/upload-professional-image`;

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await parseUploadError(response, 'Failed to upload professional image'));
      }

      const data = await response.json();
      return data.data.fileUrl;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Upload a profile image to PostgreSQL storage
   * @param file The image file to upload
   * @param userId The user ID to associate with the image
   * @returns The download URL of the uploaded image
   */
  async uploadProfileImage(file: File, userId: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const uploadUrl = `${API_URL}/api/files/upload-profile-image`;

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await parseUploadError(response, 'Failed to upload profile image'));
      }

      const data = await response.json();
      return data.data.fileUrl;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Upload a CV file to PostgreSQL storage
   * @param file The CV file to upload
   * @param userId The user ID to associate with the CV
   * @returns The download URL of the uploaded CV
   */
  async uploadCV(file: File, userId: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const response = await fetch(`${API_URL}/api/files/upload-cv`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await parseUploadError(response, 'Failed to upload CV'));
      }

      const data = await response.json();
      return data.data.fileUrl;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Upload a generic file
   * @param file The file to upload
   * @param userId The user ID to associate with the file
   * @param fileType The type of file
   * @returns The file data including the download URL
   */
  async uploadFile(file: File, userId: string, fileType: string): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      formData.append('fileType', fileType);

      const response = await fetch(`${API_URL}/api/files/upload`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await parseUploadError(response, 'Failed to upload file'));
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all files for a user
   * @param userId The user ID
   * @returns Array of file data
   */
  async getUserFiles(userId: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_URL}/api/files/user/${userId}`, {
        headers: authHeaders(),
      });

      if (!response.ok) {
        throw new Error(await parseUploadError(response, 'Failed to get user files'));
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a file
   * @param fileId The ID of the file to delete
   * @returns Boolean indicating success
   */
  async deleteFile(fileId: number): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/api/files/${fileId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });

      if (!response.ok) {
        throw new Error(await parseUploadError(response, 'Failed to delete file'));
      }

      const data = await response.json();
      return data.data.deleted;
    } catch (error) {
      throw error;
    }
  },
};
