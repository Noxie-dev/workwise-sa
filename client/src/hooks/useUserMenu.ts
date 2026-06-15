import { useMemo } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Interface for useUserMenu hook return values
 */
export interface UseUserMenuResult {
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** The user's display name or fallback */
  userDisplayName: string;
  /** The user's email address */
  userEmail: string | null;
  /** The user's photo URL */
  userPhotoURL: string | null;
  /** The user's initials for avatar fallback */
  userInitials: string;
  /** Whether the user has admin privileges */
  isAdmin: boolean;
  /** Function to handle user logout */
  handleLogout: () => Promise<void>;
}

/**
 * Custom hook for user menu functionality
 *
 * Provides user information, authentication status, admin status,
 * and logout functionality for the UserMenu component.
 *
 * @returns {UseUserMenuResult} User menu data and functions
 */
export function useUserMenu(): UseUserMenuResult {
  const { currentUser, isAuthenticated, role } = useAuth();
  const [, navigate] = useLocation();

  // Calculate user initials for avatar fallback
  const userInitials = useMemo(() => {
    if (!currentUser) return 'U';

    return currentUser.displayName
      ? currentUser.displayName
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
      : currentUser.email?.substring(0, 2).toUpperCase() || 'U';
  }, [currentUser]);

  // Check if user is an admin
  const isAdmin = useMemo(() => {
    return role === 'admin';
  }, [role]);

  // Handle user logout
  const handleLogout = async (): Promise<void> => {
    navigate('/logout');
  };

  return {
    isAuthenticated,
    userDisplayName: currentUser?.displayName || 'User',
    userEmail: currentUser?.email ?? null,
    userPhotoURL: currentUser?.photoURL ?? null,
    userInitials,
    isAdmin,
    handleLogout,
  };
}

export default useUserMenu;
