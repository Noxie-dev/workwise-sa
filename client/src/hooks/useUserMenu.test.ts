import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUserMenu } from './useUserMenu';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { signOutUser } from '@/lib/firebase';

// Mock dependencies
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({
  signOutUser: vi.fn(),
}));

vi.mock('wouter', () => ({
  useLocation: () => ['/current-path', vi.fn()],
}));

describe('useUserMenu', () => {
  const mockNavigate = vi.fn();
  const mockToast = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    (useAuth as any).mockReturnValue({
      currentUser: null,
      isAuthenticated: false,
    });
    
    (useToast as any).mockReturnValue({
      toast: mockToast,
    });
    
    (useLocation as any) = vi.fn().mockReturnValue(['/', mockNavigate]);
  });
  
  it('should return unauthenticated state when user is not logged in', () => {
    const { result } = renderHook(() => useUserMenu());
    
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.userDisplayName).toBe('User');
    expect(result.current.userEmail).toBeNull();
    expect(result.current.userPhotoURL).toBeNull();
    expect(result.current.userInitials).toBe('U');
    expect(result.current.isAdmin).toBe(false);
  });
  
  it('should return authenticated user data when user is logged in', () => {
    (useAuth as any).mockReturnValue({
      currentUser: {
        displayName: 'John Doe',
        email: 'john@example.com',
        photoURL: 'https://example.com/photo.jpg',
      },
      isAuthenticated: true,
    });
    
    const { result } = renderHook(() => useUserMenu());
    
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userDisplayName).toBe('John Doe');
    expect(result.current.userEmail).toBe('john@example.com');
    expect(result.current.userPhotoURL).toBe('https://example.com/photo.jpg');
    expect(result.current.userInitials).toBe('JD');
    expect(result.current.isAdmin).toBe(false);
  });
  
  it('should identify admin users correctly', () => {
    (useAuth as any).mockReturnValue({
      currentUser: {
        displayName: 'Admin User',
        email: 'admin@workwisesa.co.za',
        photoURL: null,
      },
      isAuthenticated: true,
    });
    
    const { result } = renderHook(() => useUserMenu());
    
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isAdmin).toBe(true);
  });
  
  it('should handle logout successfully', async () => {
    (signOutUser as any).mockResolvedValue(undefined);
    
    const { result } = renderHook(() => useUserMenu());
    
    await act(async () => {
      await result.current.handleLogout();
    });
    
    expect(signOutUser).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
      duration: 3000,
    });
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
  
  it('should handle logout errors', async () => {
    const error = new Error('Logout failed');
    (signOutUser as any).mockRejectedValue(error);
    
    const { result } = renderHook(() => useUserMenu());
    
    await act(async () => {
      await result.current.handleLogout();
    });
    
    expect(signOutUser).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith({
      variant: 'destructive',
      title: 'Error',
      description: 'Failed to log out. Please try again.',
      duration: 3000,
    });
  });
});
