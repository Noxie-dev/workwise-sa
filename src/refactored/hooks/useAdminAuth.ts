import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Permission type for admin functionality
 */
export type AdminPermission = 
  | 'dashboard:view'
  | 'jobs:manage'
  | 'users:manage'
  | 'marketing:manage'
  | 'settings:manage';

/**
 * Return type for useAdminAuth hook
 */
interface UseAdminAuthResult {
  /**
   * Whether the current user has admin privileges
   */
  isAdmin: boolean;
  
  /**
   * Whether admin status is still being checked
   */
  isLoading: boolean;
  
  /**
   * Function to check if user has a specific permission
   */
  hasPermission: (permission: AdminPermission) => boolean;
}

/**
 * Custom hook for admin authentication and permissions
 * 
 * Checks if the current user has admin privileges and specific permissions
 */
export function useAdminAuth(): UseAdminAuthResult {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  
  // Check admin status when user changes
  useEffect(() => {
    const checkAdminStatus = async () => {
      setIsLoading(true);
      
      if (!currentUser) {
        setIsAdmin(false);
        setPermissions([]);
        setIsLoading(false);
        return;
      }
      
      try {
        // In a real implementation, this would call an API to check admin status
        // For now, we'll use a simple check based on email domain or UID
        const isAdminUser = 
          currentUser.email?.endsWith('@workwisesa.com') || 
          ['admin1', 'admin2'].includes(currentUser.uid);
        
        setIsAdmin(isAdminUser);
        
        if (isAdminUser) {
          // In a real implementation, this would fetch permissions from an API
          setPermissions([
            'dashboard:view',
            'jobs:manage',
            'users:manage',
            'marketing:manage',
            'settings:manage'
          ]);
        } else {
          setPermissions([]);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        setPermissions([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [currentUser]);
  
  // Check if user has a specific permission
  const hasPermission = (permission: AdminPermission): boolean => {
    return permissions.includes(permission);
  };
  
  return {
    isAdmin,
    isLoading,
    hasPermission
  };
}
