import { profileService, ProfileData, CVScanResponse, ImageEnhancementResponse, AIPromptResponse } from './profileService';
import apiClient from './apiClient';

// Mock the apiClient
jest.mock('./apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
  },
}));

describe('profileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should fetch profile data for a user', async () => {
      const mockProfileData: ProfileData = {
        personal: {
          fullName: 'John Doe',
          phoneNumber: '1234567890',
          location: 'Cape Town',
        },
        education: {
          highestEducation: 'Bachelor',
          schoolName: 'University of Cape Town',
        },
        experience: {
          hasExperience: true,
          jobTitle: 'Software Developer',
          employer: 'Tech Company',
        },
        skills: {
          skills: ['JavaScript', 'React'],
          languages: ['English', 'Afrikaans'],
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockProfileData });

      const result = await profileService.getProfile('user123');

      expect(apiClient.get).toHaveBeenCalledWith('/profile/user123');
      expect(result).toEqual(mockProfileData);
    });

    it('should handle errors when fetching profile data', async () => {
      const errorMessage = 'Failed to fetch profile';
      (apiClient.get as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(profileService.getProfile('user123')).rejects.toThrow(errorMessage);
      expect(apiClient.get).toHaveBeenCalledWith('/profile/user123');
    });
  });

  describe('updateProfile', () => {
    it('should update profile data for a user', async () => {
      const mockProfileData: Partial<ProfileData> = {
        personal: {
          fullName: 'John Doe',
          phoneNumber: '1234567890',
          location: 'Cape Town',
        },
      };

      (apiClient.put as jest.Mock).mockResolvedValue({ data: {} });

      await profileService.updateProfile('user123', mockProfileData);

      expect(apiClient.put).toHaveBeenCalledWith('/profile/user123', mockProfileData);
    });

    it('should handle errors when updating profile data', async () => {
      const errorMessage = 'Failed to update profile';
      (apiClient.put as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(profileService.updateProfile('user123', {})).rejects.toThrow(errorMessage);
      expect(apiClient.put).toHaveBeenCalledWith('/profile/user123', {});
    });
  });

  describe('scanCV', () => {
    it('should scan a CV file and return extracted data', async () => {
      const mockFile = new File(['dummy content'], 'cv.pdf', { type: 'application/pdf' });
      const mockResponse: CVScanResponse = {
        success: true,
        data: {
          extractedData: {
            personal: {
              fullName: 'John Doe',
              phoneNumber: '1234567890',
              location: 'Cape Town',
            },
          },
          warnings: [],
          confidence: [],
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await profileService.scanCV(mockFile);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/scan-cv',
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('enhanceImage', () => {
    it('should enhance an image file and return the enhanced image', async () => {
      const mockFile = new File(['dummy content'], 'image.jpg', { type: 'image/jpeg' });
      const mockResponse: ImageEnhancementResponse = {
        success: true,
        data: {
          enhancedImage: 'base64encodedimage',
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await profileService.enhanceImage(mockFile);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/enhance-image',
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('processAIPrompt', () => {
    it('should process an AI prompt and return suggested improvements', async () => {
      const mockPrompt = 'Improve my profile';
      const mockCvData: Partial<ProfileData> = {
        personal: {
          fullName: 'John Doe',
          phoneNumber: '1234567890',
          location: 'Cape Town',
        },
      };
      const mockWarnings = [
        {
          type: 'missing',
          section: 'education',
          message: 'Education section is incomplete',
        },
      ];
      const mockResponse: AIPromptResponse = {
        success: true,
        data: {
          personal: {
            fullName: 'John Doe',
            phoneNumber: '1234567890',
            location: 'Cape Town',
            bio: 'Experienced software developer with a passion for creating user-friendly applications.',
          },
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await profileService.processAIPrompt(mockPrompt, mockCvData, mockWarnings);

      expect(apiClient.post).toHaveBeenCalledWith('/api/process-ai-prompt', {
        prompt: mockPrompt,
        cvData: mockCvData,
        warnings: mockWarnings,
      });
      expect(result).toEqual(mockResponse);
    });
  });
});
