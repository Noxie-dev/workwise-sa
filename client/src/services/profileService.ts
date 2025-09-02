import apiClient from './apiClient';
import { User } from 'firebase/auth';

/**
 * Profile data interface
 */
export interface ProfileData {
  personal: {
    fullName: string;
    phoneNumber: string;
    location: string;
    idNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    bio?: string;
    profilePicture?: string;
    professionalImage?: string;
  };
  education: {
    highestEducation: string;
    schoolName: string;
    yearCompleted?: string;
    achievements?: string;
    additionalCourses?: string;
  };
  experience: {
    hasExperience: boolean;
    currentlyEmployed?: boolean;
    jobTitle?: string;
    employer?: string;
    startDate?: string;
    endDate?: string;
    jobDescription?: string;
    previousExperience?: string;
    volunteerWork?: string;
    references?: string;
  };
  skills: {
    skills?: string[];
    customSkills?: string;
    languages?: string[];
    hasDriversLicense?: boolean;
    hasTransport?: boolean;
    cvUpload?: string;
    createCV?: boolean;
  };
}

/**
 * CV scan response interface
 */
export interface CVScanResponse {
  success: boolean;
  data: {
    extractedData: {
      personal?: {
        fullName?: string;
        phoneNumber?: string;
        location?: string;
        idNumber?: string;
        dateOfBirth?: string;
        gender?: string;
        bio?: string;
      };
      education?: {
        highestEducation?: string;
        schoolName?: string;
        yearCompleted?: string;
        achievements?: string;
      };
      experience?: {
        jobTitle?: string;
        employer?: string;
        jobDescription?: string;
      };
      skills?: {
        skills?: string[];
        languages?: string[];
      };
    };
    warnings?: Array<{
      type: 'handwritten' | 'scratched' | 'missing' | 'unclear';
      section: string;
      message: string;
      suggestedFix?: string;
    }>;
    confidence?: Array<{
      section: string;
      confidence: number;
      notes?: string;
    }>;
  };
  error?: string;
}

/**
 * Image enhancement response interface
 */
export interface ImageEnhancementResponse {
  success: boolean;
  data: {
    enhancedImage: string;
  };
  error?: string;
}

/**
 * AI prompt processing response interface
 */
export interface AIPromptResponse {
  success: boolean;
  data: Partial<ProfileData>;
  error?: string;
}

/**
 * Service for profile-related API calls
 */
export const profileService = {
  /**
   * Get user profile data
   */
  async getProfile(userId: string): Promise<ProfileData> {
    const response = await apiClient.get<{success: boolean; data: ProfileData}>(`/profile/${userId}`);
    return response.data.data;
  },

  /**
   * Update user profile data
   */
  async updateProfile(userId: string, data: Partial<ProfileData>): Promise<void> {
    await apiClient.put(`/profile/${userId}`, data);
  },

  /**
   * Scan CV to extract information
   */
  async scanCV(file: File): Promise<CVScanResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('enhancedScan', 'true');

    const response = await apiClient.post<CVScanResponse>('/api/scan-cv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  /**
   * Enhance profile image
   */
  async enhanceImage(file: File): Promise<ImageEnhancementResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ImageEnhancementResponse>('/api/enhance-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  /**
   * Process AI prompt for profile improvements
   */
  async processAIPrompt(
    prompt: string, 
    cvData: Partial<ProfileData>, 
    warnings: Array<{
      type: string;
      section: string;
      message: string;
      suggestedFix?: string;
    }>
  ): Promise<AIPromptResponse> {
    const response = await apiClient.post<AIPromptResponse>('/api/process-ai-prompt', {
      prompt,
      cvData,
      warnings,
    });
    
    return response.data;
  },
};

export default profileService;
