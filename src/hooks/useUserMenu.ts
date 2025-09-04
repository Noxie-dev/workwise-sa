import { useMemo } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { signOutUser } from '@/lib/firebase';

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
  const { currentUser, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Calculate user initials for avatar fallback
  const userInitials = useMemo(() => {
    if (!currentUser) return 'U';
    
    return currentUser.displayName
      ? currentUser.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
      : currentUser.email?.substring(0, 2).toUpperCase() || 'U';
  }, [currentUser]);

  // Check if user is an admin
  const isAdmin = useMemo(() => {
    if (!currentUser?.email) return false;
    
    // For demo purposes, consider users with these domains as admins
    const adminDomains = ['workwisesa.co.za', 'admin.workwisesa.co.za', 'admin.com'];
    
    // Also grant admin access to specific email addresses
    const adminEmails = ['phakikrwele@gmail.com'];
    
    return adminDomains.some(domain => currentUser.email.endsWith(domain)) ||
           adminEmails.includes(currentUser.email);
  }, [currentUser]);

  // Handle user logout
  const handleLogout = async (): Promise<void> => {
    try {
      await signOutUser();
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
        duration: 3000,
      });
      navigate('/');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to log out. Please try again.',
        duration: 3000,
      });
    }
  };

  return {
    isAuthenticated,
    userDisplayName: currentUser?.displayName || 'User',
    userEmail: currentUser?.email,
    userPhotoURL: currentUser?.photoURL,
    userInitials,
    isAdmin,
    handleLogout,
  };
}

export default useUserMenu;
