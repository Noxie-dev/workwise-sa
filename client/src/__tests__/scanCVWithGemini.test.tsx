import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import ProfileSetup from '@/pages/ProfileSetup';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/components/ui/toast';

// Mock the toast hook
jest.mock('../hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

// Mock the auth context
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock fetch globally
global.fetch = jest.fn();

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <AuthProvider>
      <ToastProvider>
        {ui}
        <Toaster />
      </ToastProvider>
    </AuthProvider>
  );
};

describe('scanCVWithGemini', () => {
  const mockToast = {
    toast: jest.fn(),
  };

  const mockCurrentUser = {
    uid: '123',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  beforeEach(() => {
    (useToast as jest.Mock).mockReturnValue(mockToast);
    (useAuth as jest.Mock).mockReturnValue({
      currentUser: mockCurrentUser,
      isLoading: false,
    });

    // Reset mocks
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should show error toast when no CV file is selected', async () => {
    renderWithProviders(<ProfileSetup />);
    
    // Click scan button without uploading a file
    fireEvent.click(screen.getByText('Scan with AI'));
    
    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "No CV File",
        description: "Please upload a CV file first before scanning.",
      });
    });
  });

  it('should handle successful CV scan', async () => {
    renderWithProviders(<ProfileSetup />);
    
    // Mock file upload
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByTestId('cv-upload');
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Mock successful scan response
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              extractedData: {
                personal: {
                  fullName: 'John Doe',
                  phoneNumber: '1234567890',
                  location: 'Johannesburg',
                },
                education: {
                  highestEducation: 'Bachelor',
                  schoolName: 'Test University',
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

    // Wait for success toast
    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith({
        title: "CV Scanned Successfully",
        description: "Your information has been extracted. Please review and make any necessary adjustments.",
      });
    });

    // Check if preview dialog is shown
    expect(screen.getByText('CV Scan Results')).toBeInTheDocument();
  });

  it('should handle scan errors', async () => {
    renderWithProviders(<ProfileSetup />);
    
    // Mock file upload
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByTestId('cv-upload');
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Mock failed scan response
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            success: false,
            error: "Failed to process CV",
          }),
      })
    );

    // Click scan button
    fireEvent.click(screen.getByText('Scan with AI'));

    // Wait for error toast
    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "Scanning Failed",
        description: "HTTP error! status: 500",
      });
    });
  });

  it('should handle network errors', async () => {
    renderWithProviders(<ProfileSetup />);
    
    // Mock file upload
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByTestId('cv-upload');
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Mock network error
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('Network error'))
    );

    // Click scan button
    fireEvent.click(screen.getByText('Scan with AI'));

    // Wait for error toast
    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "Scanning Failed",
        description: "Network error",
      });
    });
  });

  it('should handle invalid JSON response', async () => {
    renderWithProviders(<ProfileSetup />);
    
    // Mock file upload
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByTestId('cv-upload');
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Mock invalid JSON response
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      })
    );

    // Click scan button
    fireEvent.click(screen.getByText('Scan with AI'));

    // Wait for error toast
    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "Scanning Failed",
        description: "Invalid JSON",
      });
    });
  });
}); 