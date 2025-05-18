import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Return type for useUserMenu hook
 */
interface UseUserMenuResult {
  /**
   * Whether the user is authenticated
   */
  isAuthenticated: boolean;
  
  /**
   * Display name for the user (or null if not available)
   */
  userDisplayName: string | null;
  
  /**
   * Function to handle user logout
   */
  handleLogout: () => Promise<void>;
  
  /**
   * Whether the menu is open
   */
  isMenuOpen: boolean;
  
  /**
   * Function to toggle the menu open/closed
   */
  toggleMenu: () => void;
  
  /**
   * Function to close the menu
   */
  closeMenu: () => void;
}

/**
 * Custom hook for user menu functionality
 * 
 * Handles authentication state, user information, and menu toggling
 */
export function useUserMenu(): UseUserMenuResult {
  const { currentUser, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);
  
  // Set user display name based on available information
  useEffect(() => {
    if (currentUser) {
      setUserDisplayName(
        currentUser.displayName || 
        currentUser.email?.split('@')[0] || 
        'User'
      );
    } else {
      setUserDisplayName(null);
    }
  }, [currentUser]);
  
  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setLocation('/');
      closeMenu();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [logout, setLocation]);
  
  // Toggle menu
  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);
  
  // Close menu
  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);
  
  return {
    isAuthenticated: !!currentUser,
    userDisplayName,
    handleLogout,
    isMenuOpen,
    toggleMenu,
    closeMenu
  };
}
