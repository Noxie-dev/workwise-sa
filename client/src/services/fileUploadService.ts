import { API_URL } from '@/lib/env';

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
      console.log('Uploading professional image to:', uploadUrl);
      console.log('API_URL:', API_URL);
      console.log('File:', file.name, file.size, file.type);
      console.log('User ID:', userId);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      console.log('Upload response status:', response.status);
      console.log('Upload response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to upload professional image`);
      }

      const data = await response.json();
      console.log('Upload success:', data);
      return data.data.fileUrl;
    } catch (error) {
      console.error('Error uploading professional image:', error);
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
      console.log('Uploading profile image to:', uploadUrl);
      console.log('API_URL:', API_URL);
      console.log('File:', file.name, file.size, file.type);
      console.log('User ID:', userId);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      console.log('Upload response status:', response.status);
      console.log('Upload response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to upload profile image`);
      }

      const data = await response.json();
      console.log('Upload success:', data);
      return data.data.fileUrl;
    } catch (error) {
      console.error('Error uploading profile image:', error);
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
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload CV');
      }

      const data = await response.json();
      return data.data.fileUrl;
    } catch (error) {
      console.error('Error uploading CV:', error);
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
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error uploading file:', error);
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
      const response = await fetch(`${API_URL}/api/files/user/${userId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get user files');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error getting user files:', error);
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
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete file');
      }

      const data = await response.json();
      return data.data.deleted;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
};
