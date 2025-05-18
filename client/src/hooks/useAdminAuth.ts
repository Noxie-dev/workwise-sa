import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Permission type for admin features
 */
export type AdminPermission = 
  | 'dashboard:view'
  | 'marketing:view' 
  | 'analytics:view'
  | 'users:view'
  | 'settings:view'
  | 'content:view'
  | 'security:view';

/**
 * Hook that provides admin authentication and permission utilities
 * @returns Object with admin status and permission checking function
 */
export function useAdminAuth() {
  const { currentUser } = useAuth();

  // Check if user is an admin
  const isAdmin = useMemo(() => {
    if (!currentUser?.email) return false;
    
    // For demo purposes, consider users with these domains as admins
    const adminDomains = ['workwisesa.co.za', 'admin.workwisesa.co.za', 'admin.com'];
    
    // Also grant admin access to specific email addresses
    const adminEmails = ['phakikrwele@gmail.com'];
    
    return adminDomains.some(domain => currentUser.email?.endsWith(domain)) ||
           adminEmails.includes(currentUser.email);
  }, [currentUser]);

  /**
   * Check if the current admin user has a specific permission
   * @param permission The permission to check
   * @returns Boolean indicating if user has the permission
   */
  const hasPermission = (permission: AdminPermission): boolean => {
    if (!isAdmin) return false;

    // In a real app, this would check against user roles and permissions in a database
    // For demo purposes, we'll grant all permissions to admins
    // You could implement more granular permission checks here
    
    // Example of more granular permission checks:
    // const userPermissions = ['dashboard:view', 'marketing:view']; // Would come from user data
    // return userPermissions.includes(permission);
    
    return true;
  };

  return {
    isAdmin,
    hasPermission
  };
}

export default useAdminAuth;
