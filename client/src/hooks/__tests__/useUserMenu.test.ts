import { renderHook, act } from '@testing-library/react';
import { useUserMenu } from '../useUserMenu';
import { signOutUser } from '@/lib/firebase';

// Mock dependencies
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

jest.mock('wouter', () => ({
  useLocation: jest.fn(),
}));

jest.mock('@/lib/firebase', () => ({
  signOutUser: jest.fn(),
}));

// Import the mocked dependencies
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockUseLocation = useLocation as jest.MockedFunction<typeof useLocation>;
const mockSignOutUser = signOutUser as jest.MockedFunction<typeof signOutUser>;

describe('useUserMenu Hook', () => {
  const mockToast = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseToast.mockReturnValue({ toast: mockToast });
    mockUseLocation.mockReturnValue(['/', mockNavigate]);
  });

  it('returns default values when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      isEmailVerified: false,
    });

    const { result } = renderHook(() => useUserMenu());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.userDisplayName).toBe('User');
    expect(result.current.userEmail).toBe(null);
    expect(result.current.userPhotoURL).toBe(null);
    expect(result.current.userInitials).toBe('U');
    expect(result.current.isAdmin).toBe(false);
  });

  it('returns user data when authenticated', () => {
    const mockUser = {
      displayName: 'John Doe',
      email: 'john.doe@example.com',
      photoURL: 'https://example.com/photo.jpg',
      uid: 'user123',
      emailVerified: true,
    };

    mockUseAuth.mockReturnValue({
      currentUser: mockUser,
      isAuthenticated: true,
      isLoading: false,
      isEmailVerified: true,
    });

    const { result } = renderHook(() => useUserMenu());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userDisplayName).toBe('John Doe');
    expect(result.current.userEmail).toBe('john.doe@example.com');
    expect(result.current.userPhotoURL).toBe('https://example.com/photo.jpg');
    expect(result.current.userInitials).toBe('JD');
    expect(result.current.isAdmin).toBe(false);
  });

  it('generates correct initials from display name', () => {
    const mockUser = {
      displayName: 'John Michael Doe',
      email: 'john.doe@example.com',
      photoURL: null,
      uid: 'user123',
      emailVerified: true,
    };

    mockUseAuth.mockReturnValue({
      currentUser: mockUser,
      isAuthenticated: true,
      isLoading: false,
      isEmailVerified: true,
    });

    const { result } = renderHook(() => useUserMenu());

    expect(result.current.userInitials).toBe('JMD');
  });

  it('generates initials from email when no display name', () => {
    const mockUser = {
      displayName: null,
      email: 'john.doe@example.com',
      photoURL: null,
      uid: 'user123',
      emailVerified: true,
    };

    mockUseAuth.mockReturnValue({
      currentUser: mockUser,
      isAuthenticated: true,
      isLoading: false,
      isEmailVerified: true,
    });

    const { result } = renderHook(() => useUserMenu());

    expect(result.current.userInitials).toBe('JO');
  });

  it('identifies admin users by domain', () => {
    const mockUser = {
      displayName: 'Admin User',
      email: 'admin@workwisesa.co.za',
      photoURL: null,
      uid: 'admin123',
      emailVerified: true,
    };

    mockUseAuth.mockReturnValue({
      currentUser: mockUser,
      isAuthenticated: true,
      isLoading: false,
      isEmailVerified: true,
    });

    const { result } = renderHook(() => useUserMenu());

    expect(result.current.isAdmin).toBe(true);
  });

  it('identifies admin users by specific email', () => {
    const mockUser = {
      displayName: 'Admin User',
      email: 'phakikrwele@gmail.com',
      photoURL: null,
      uid: 'admin123',
      emailVerified: true,
    };

    mockUseAuth.mockReturnValue({
      currentUser: mockUser,
      isAuthenticated: true,
      isLoading: false,
      isEmailVerified: true,
    });

    const { result } = renderHook(() => useUserMenu());

    expect(result.current.isAdmin).toBe(true);
  });

  it('handles successful logout', async () => {
    mockUseAuth.mockReturnValue({
      currentUser: {
        displayName: 'John Doe',
        email: 'john.doe@example.com',
        photoURL: null,
        uid: 'user123',
        emailVerified: true,
      },
      isAuthenticated: true,
      isLoading: false,
      isEmailVerified: true,
    });

    mockSignOutUser.mockResolvedValue(undefined);

    const { result } = renderHook(() => useUserMenu());

    await act(async () => {
      await result.current.handleLogout();
    });

    expect(mockSignOutUser).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
      duration: 3000,
    });
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('handles logout error', async () => {
    mockUseAuth.mockReturnValue({
      currentUser: {
        displayName: 'John Doe',
        email: 'john.doe@example.com',
        photoURL: null,
        uid: 'user123',
        emailVerified: true,
      },
      isAuthenticated: true,
      isLoading: false,
      isEmailVerified: true,
    });

    const errorMessage = 'Network error';
    mockSignOutUser.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useUserMenu());

    await act(async () => {
      await result.current.handleLogout();
    });

    expect(mockSignOutUser).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith({
      variant: 'destructive',
      title: 'Error',
      description: 'Failed to log out. Please try again.',
      duration: 3000,
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('handles user with no email', () => {
    const mockUser = {
      displayName: 'John Doe',
      email: null,
      photoURL: null,
      uid: 'user123',
      emailVerified: false,
    };

    mockUseAuth.mockReturnValue({
      currentUser: mockUser,
      isAuthenticated: true,
      isLoading: false,
      isEmailVerified: false,
    });

    const { result } = renderHook(() => useUserMenu());

    expect(result.current.userEmail).toBe(null);
    expect(result.current.userInitials).toBe('JD');
    expect(result.current.isAdmin).toBe(false);
  });

  it('handles user with empty display name', () => {
    const mockUser = {
      displayName: '',
      email: 'test@example.com',
      photoURL: null,
      uid: 'user123',
      emailVerified: true,
    };

    mockUseAuth.mockReturnValue({
      currentUser: mockUser,
      isAuthenticated: true,
      isLoading: false,
      isEmailVerified: true,
    });

    const { result } = renderHook(() => useUserMenu());

    expect(result.current.userInitials).toBe('TE');
  });

  it('memoizes initials calculation', () => {
    const mockUser = {
      displayName: 'John Doe',
      email: 'john.doe@example.com',
      photoURL: null,
      uid: 'user123',
      emailVerified: true,
    };

    mockUseAuth.mockReturnValue({
      currentUser: mockUser,
      isAuthenticated: true,
      isLoading: false,
      isEmailVerified: true,
    });

    const { result, rerender } = renderHook(() => useUserMenu());

    const firstInitials = result.current.userInitials;
    
    // Re-render with same user
    rerender();
    
    const secondInitials = result.current.userInitials;
    
    expect(firstInitials).toBe(secondInitials);
    expect(firstInitials).toBe('JD');
  });

  it('memoizes admin status calculation', () => {
    const mockUser = {
      displayName: 'Admin User',
      email: 'admin@workwisesa.co.za',
      photoURL: null,
      uid: 'admin123',
      emailVerified: true,
    };

    mockUseAuth.mockReturnValue({
      currentUser: mockUser,
      isAuthenticated: true,
      isLoading: false,
      isEmailVerified: true,
    });

    const { result, rerender } = renderHook(() => useUserMenu());

    const firstAdminStatus = result.current.isAdmin;
    
    // Re-render with same user
    rerender();
    
    const secondAdminStatus = result.current.isAdmin;
    
    expect(firstAdminStatus).toBe(secondAdminStatus);
    expect(firstAdminStatus).toBe(true);
  });

  it('handles all admin domains correctly', () => {
    const adminDomains = ['workwisesa.co.za', 'admin.workwisesa.co.za', 'admin.com'];

    adminDomains.forEach((domain) => {
      const mockUser = {
        displayName: 'Admin User',
        email: `admin@${domain}`,
        photoURL: null,
        uid: 'admin123',
        emailVerified: true,
      };

      mockUseAuth.mockReturnValue({
        currentUser: mockUser,
        isAuthenticated: true,
        isLoading: false,
        isEmailVerified: true,
      });

      const { result } = renderHook(() => useUserMenu());

      expect(result.current.isAdmin).toBe(true);
    });
  });

  it('does not identify regular users as admin', () => {
    const mockUser = {
      displayName: 'Regular User',
      email: 'user@example.com',
      photoURL: null,
      uid: 'user123',
      emailVerified: true,
    };

    mockUseAuth.mockReturnValue({
      currentUser: mockUser,
      isAuthenticated: true,
      isLoading: false,
      isEmailVerified: true,
    });

    const { result } = renderHook(() => useUserMenu());

    expect(result.current.isAdmin).toBe(false);
  });
});
