import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileSetup } from '@/pages/ProfileSetup';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

// Mock the auth context
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

// Mock the useLocation hook
jest.mock('wouter', () => ({
  useLocation: () => ['', jest.fn()],
}));

describe('ProfileSetup Component', () => {
  const mockCurrentUser = {
    uid: '123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
    updateProfile: jest.fn(),
  };

  const mockToast = {
    toast: jest.fn(),
  };

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      currentUser: mockCurrentUser,
      isLoading: false,
    });

    (useToast as jest.Mock).mockReturnValue(mockToast);
  });

  describe('CV Preview and Auto-population', () => {
    it('should show CV preview dialog after successful scan', async () => {
      render(<ProfileSetup />);

      // Mock file upload
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByTestId('cv-upload');
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Mock scan response
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                extractedData: {
                  personal: {
                    fullName: 'John Doe',
                    phoneNumber: '1234567890',
                    location: 'Johannesburg',
                    bio: 'Test bio',
                  },
                  education: {
                    highestEducation: 'Bachelor',
                    schoolName: 'Test University',
                    yearCompleted: '2020',
                  },
                  experience: {
                    jobTitle: 'Developer',
                    employer: 'Test Company',
                  },
                  skills: ['JavaScript', 'React'],
                },
                warnings: [],
                confidence: [
                  { section: 'personal', confidence: 0.9 },
                  { section: 'education', confidence: 0.8 },
                ],
              },
            }),
        })
      );

      // Click scan button
      fireEvent.click(screen.getByText('Scan with AI'));

      // Wait for preview dialog to appear
      await waitFor(() => {
        expect(screen.getByText('CV Scan Results')).toBeInTheDocument();
      });

      // Check if form fields are populated
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Johannesburg')).toBeInTheDocument();
    });

    it('should show warnings for unclear sections', async () => {
      render(<ProfileSetup />);

      // Mock file upload
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByTestId('cv-upload');
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Mock scan response with warnings
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                extractedData: {
                  personal: {
                    fullName: 'John Doe',
                  },
                },
                warnings: [
                  {
                    type: 'handwritten',
                    section: 'Education',
                    message: 'Could not read education section clearly',
                    suggestedFix: 'Please manually enter your education details',
                  },
                ],
                confidence: [
                  { section: 'education', confidence: 0.3 },
                ],
              },
            }),
        })
      );

      // Click scan button
      fireEvent.click(screen.getByText('Scan with AI'));

      // Wait for preview dialog to appear
      await waitFor(() => {
        expect(screen.getByText('Attention Required')).toBeInTheDocument();
      });

      // Check if warning is displayed
      expect(screen.getByText('Could not read education section clearly')).toBeInTheDocument();
      expect(screen.getByText('Please manually enter your education details')).toBeInTheDocument();
    });

    it('should handle AI prompt for corrections', async () => {
      render(<ProfileSetup />);

      // Mock file upload and scan
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByTestId('cv-upload');
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Mock scan response
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                extractedData: {
                  personal: {
                    fullName: 'John Doe',
                  },
                },
                warnings: [],
                confidence: [],
              },
            }),
        })
      );

      // Click scan button
      fireEvent.click(screen.getByText('Scan with AI'));

      // Wait for preview dialog
      await waitFor(() => {
        expect(screen.getByText('CV Scan Results')).toBeInTheDocument();
      });

      // Enter AI prompt
      const promptInput = screen.getByPlaceholderText('Describe any issues or ask for help with specific sections...');
      fireEvent.change(promptInput, { target: { value: 'Please correct my name to John Smith' } });

      // Mock AI prompt response
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                personal: {
                  fullName: 'John Smith',
                },
              },
            }),
        })
      );

      // Click AI assistance button
      fireEvent.click(screen.getByText('Get AI Assistance'));

      // Wait for changes to be applied
      await waitFor(() => {
        expect(screen.getByDisplayValue('John Smith')).toBeInTheDocument();
      });
    });

    it('should update profile after approval', async () => {
      render(<ProfileSetup />);

      // Mock file upload and scan
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByTestId('cv-upload');
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Mock scan response
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                extractedData: {
                  personal: {
                    fullName: 'John Doe',
                    phoneNumber: '1234567890',
                  },
                },
                warnings: [],
                confidence: [],
              },
            }),
        })
      );

      // Click scan button
      fireEvent.click(screen.getByText('Scan with AI'));

      // Wait for preview dialog
      await waitFor(() => {
        expect(screen.getByText('CV Scan Results')).toBeInTheDocument();
      });

      // Click continue button
      fireEvent.click(screen.getByText('Continue to Skills'));

      // Mock profile update response
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              success: true,
              profileImageUrl: 'https://example.com/new-photo.jpg',
            }),
        })
      );

      // Click complete profile button
      fireEvent.click(screen.getByText('Complete Profile Setup'));

      // Wait for profile update
      await waitFor(() => {
        expect(mockCurrentUser.updateProfile).toHaveBeenCalledWith({
          displayName: 'John Doe',
          photoURL: 'https://example.com/new-photo.jpg',
        });
      });
    });
  });
}); 