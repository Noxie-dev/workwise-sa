import { renderHook } from '@testing-library/react-hooks';
import { useAdminAuth } from './useAdminAuth';
import { useAuth } from '@/contexts/AuthContext';

// Mock the useAuth hook
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('useAdminAuth', () => {
  // Test case: Returns isAdmin=false when user is not logged in
  test('returns isAdmin=false when user is not logged in', () => {
    // Mock the useAuth hook to return null user
    (useAuth as jest.Mock).mockReturnValue({
      currentUser: null,
    });

    const { result } = renderHook(() => useAdminAuth());
    
    expect(result.current.isAdmin).toBe(false);
  });

  // Test case: Returns isAdmin=false for non-admin email domains
  test('returns isAdmin=false for non-admin email domains', () => {
    // Mock the useAuth hook to return a user with non-admin email
    (useAuth as jest.Mock).mockReturnValue({
      currentUser: {
        email: 'user@example.com',
      },
    });

    const { result } = renderHook(() => useAdminAuth());
    
    expect(result.current.isAdmin).toBe(false);
  });

  // Test case: Returns isAdmin=true for admin email domains
  test('returns isAdmin=true for admin email domains', () => {
    // Mock the useAuth hook to return a user with admin domain email
    (useAuth as jest.Mock).mockReturnValue({
      currentUser: {
        email: 'admin@workwisesa.co.za',
      },
    });

    const { result } = renderHook(() => useAdminAuth());
    
    expect(result.current.isAdmin).toBe(true);
  });

  // Test case: Returns isAdmin=true for specific admin emails
  test('returns isAdmin=true for specific admin emails', () => {
    // Mock the useAuth hook to return a user with specific admin email
    (useAuth as jest.Mock).mockReturnValue({
      currentUser: {
        email: 'phakikrwele@gmail.com',
      },
    });

    const { result } = renderHook(() => useAdminAuth());
    
    expect(result.current.isAdmin).toBe(true);
  });

  // Test case: hasPermission returns false when user is not an admin
  test('hasPermission returns false when user is not an admin', () => {
    // Mock the useAuth hook to return a non-admin user
    (useAuth as jest.Mock).mockReturnValue({
      currentUser: {
        email: 'user@example.com',
      },
    });

    const { result } = renderHook(() => useAdminAuth());
    
    expect(result.current.hasPermission('dashboard:view')).toBe(false);
  });

  // Test case: hasPermission returns true for admin users
  test('hasPermission returns true for admin users', () => {
    // Mock the useAuth hook to return an admin user
    (useAuth as jest.Mock).mockReturnValue({
      currentUser: {
        email: 'admin@workwisesa.co.za',
      },
    });

    const { result } = renderHook(() => useAdminAuth());
    
    // For demo purposes, all permissions return true for admin users
    expect(result.current.hasPermission('dashboard:view')).toBe(true);
    expect(result.current.hasPermission('marketing:view')).toBe(true);
    expect(result.current.hasPermission('analytics:view')).toBe(true);
  });
});
