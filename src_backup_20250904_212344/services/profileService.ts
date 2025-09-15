/**
 * Profile Service
 * Handles all API calls related to user profiles
 */

import { API_URL } from '@/lib/env';

// Type for profile update response
interface ProfileUpdateResponse {
  success: boolean;
  message?: string;
  profileImageUrl?: string;
  cvUrl?: string;
}

// Type for profile update parameters
interface ProfileUpdateParams {
  profileData: {
    personal: any;
    education: any;
    experience: any;
    skills: any;
  };
  profileImage?: File;
  cvFile?: File;
}

/**
 * Updates the user's profile
 * @param params Profile data and files to update
 * @returns Promise with the update response
 */
export async function updateProfile(params: ProfileUpdateParams): Promise<ProfileUpdateResponse> {
  try {
    const { profileData, profileImage, cvFile } = params;
    
    // Create FormData for file uploads
    const formData = new FormData();
    
    // Add profile data as JSON
    formData.append('profileData', JSON.stringify(profileData));
    
    // Add files if they exist
    if (profileImage) {
      formData.append('profileImage', profileImage);
    }
    
    if (cvFile) {
      formData.append('cvFile', cvFile);
    }
    
    // Make API call
    const response = await fetch(`${API_URL}/api/profile/update`, {
      method: 'POST',
      body: formData,
      credentials: 'include', // Include cookies for authentication
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update profile');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Profile update error:', error);
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
    };
  }
}

/**
 * Gets the user's profile data
 * @param userId User ID to fetch profile for
 * @returns Promise with the profile data
 */
export async function getProfile(userId: string): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/profile/${userId}`, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch profile');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    throw error;
  }
}

/**
 * Scans a CV file and extracts information
 * @param file CV file to scan
 * @returns Promise with the extracted data
 */
export async function scanCV(file: File): Promise<any> {
  try {
    const formData = new FormData();
    formData.append('cvFile', file);
    
    const response = await fetch(`${API_URL}/api/profile/scan-cv`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to scan CV');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('CV scan error:', error);
    throw error;
  }
}

/**
 * Uploads a profile image
 * @param file Image file to upload
 * @returns Promise with the image URL
 */
export async function uploadProfileImage(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('profileImage', file);
    
    const response = await fetch(`${API_URL}/api/profile/upload-image`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload profile image');
    }
    
    const data = await response.json();
    return data.imageUrl;
  } catch (error: any) {
    console.error('Profile image upload error:', error);
    throw error;
  }
}
