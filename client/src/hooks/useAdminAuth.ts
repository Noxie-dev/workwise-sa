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
  const { role } = useAuth();

  // Check if user is an admin
  const isAdmin = useMemo(() => {
    return role === 'admin';
  }, [role]);

  /**
   * Check if the current admin user has a specific permission
   * @param permission The permission to check
   * @returns Boolean indicating if user has the permission
   */
  const hasPermission = (permission: AdminPermission): boolean => {
    if (!isAdmin) return false;

    return true;
  };

  return {
    isAdmin,
    hasPermission,
  };
}

export default useAdminAuth;
