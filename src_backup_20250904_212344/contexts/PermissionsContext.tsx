/**
 * Permissions Context - Split from Auth Context
 * Manages only permissions and authorization to reduce re-renders
 * Components that only need permissions won't re-render when user data changes
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Permission, UserRole, ROLE_PERMISSIONS } from '@shared/auth-types';

// ============================================================================
// PERMISSIONS CONTEXT TYPES
// ============================================================================

interface PermissionsContextType {
  // Permission data
  permissions: Permission[];
  role: UserRole | null;
  
  // Permission actions
  setPermissions: (permissions: Permission[], role: UserRole) => void;
  clearPermissions: () => void;
  
  // Permission checks
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  
  // Computed permission properties
  isAdmin: boolean;
  isModerator: boolean;
  isEmployer: boolean;
  isUser: boolean;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const PermissionsContext = createContext<PermissionsContextType | null>(null);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface PermissionsProviderProps {
  children: React.ReactNode;
}

export const PermissionsProvider: React.FC<PermissionsProviderProps> = ({ children }) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [permissions, setPermissionsState] = useState<Permission[]>([]);
  const [role, setRoleState] = useState<UserRole | null>(null);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const isAdmin = useMemo(() => role === 'admin', [role]);
  const isModerator = useMemo(() => role === 'moderator', [role]);
  const isEmployer = useMemo(() => role === 'employer', [role]);
  const isUser = useMemo(() => role === 'user', [role]);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const setPermissions = useCallback((newPermissions: Permission[], newRole: UserRole) => {
    setPermissionsState(newPermissions);
    setRoleState(newRole);
  }, []);

  const clearPermissions = useCallback(() => {
    setPermissionsState([]);
    setRoleState(null);
  }, []);

  // ============================================================================
  // PERMISSION CHECKS
  // ============================================================================

  const hasPermission = useCallback((permission: Permission): boolean => {
    return permissions.includes(permission);
  }, [permissions]);

  const hasAnyPermission = useCallback((permissionList: Permission[]): boolean => {
    return permissionList.some(permission => permissions.includes(permission));
  }, [permissions]);

  const hasAllPermissions = useCallback((permissionList: Permission[]): boolean => {
    return permissionList.every(permission => permissions.includes(permission));
  }, [permissions]);

  const hasRole = useCallback((checkRole: UserRole): boolean => {
    return role === checkRole;
  }, [role]);

  const hasAnyRole = useCallback((roleList: UserRole[]): boolean => {
    return role !== null && roleList.includes(role);
  }, [role]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: PermissionsContextType = useMemo(() => ({
    // Permission data
    permissions,
    role,
    
    // Permission actions
    setPermissions,
    clearPermissions,
    
    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    
    // Computed permission properties
    isAdmin,
    isModerator,
    isEmployer,
    isUser
  }), [
    permissions,
    role,
    setPermissions,
    clearPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isAdmin,
    isModerator,
    isEmployer,
    isUser
  ]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PermissionsContext.Provider value={contextValue}>
      {children}
    </PermissionsContext.Provider>
  );
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export const usePermissions = (): PermissionsContextType => {
  const context = useContext(PermissionsContext);
  
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  
  return context;
};

// ============================================================================
// SELECTIVE HOOKS FOR PERFORMANCE
// ============================================================================

/**
 * Hook that only subscribes to role changes
 * Use this when you only need to check user role
 */
export const useRole = () => {
  const { role, isAdmin, isModerator, isEmployer, isUser } = usePermissions();
  
  return useMemo(() => ({
    role,
    isAdmin,
    isModerator,
    isEmployer,
    isUser
  }), [role, isAdmin, isModerator, isEmployer, isUser]);
};

/**
 * Hook that only subscribes to specific permission changes
 * Use this when you only need to check specific permissions
 */
export const usePermissionCheck = (permission: Permission) => {
  const { hasPermission } = usePermissions();
  
  return useMemo(() => hasPermission(permission), [hasPermission, permission]);
};

/**
 * Hook that only subscribes to multiple permission changes
 * Use this when you need to check multiple permissions
 */
export const useMultiplePermissionCheck = (permissionList: Permission[]) => {
  const { hasAnyPermission, hasAllPermissions } = usePermissions();
  
  return useMemo(() => ({
    hasAny: hasAnyPermission(permissionList),
    hasAll: hasAllPermissions(permissionList)
  }), [hasAnyPermission, hasAllPermissions, permissionList]);
};

/**
 * Hook for admin-specific permissions
 * Use this for admin-only components
 */
export const useAdminPermissions = () => {
  const { isAdmin, hasPermission } = usePermissions();
  
  return useMemo(() => ({
    isAdmin,
    canManageUsers: hasPermission('admin:users'),
    canManageSettings: hasPermission('admin:settings'),
    canViewAnalytics: hasPermission('admin:analytics'),
    canManageContent: hasPermission('admin:content'),
    canManageSecurity: hasPermission('admin:security')
  }), [isAdmin, hasPermission]);
};

/**
 * Hook for employer-specific permissions
 * Use this for employer-only components
 */
export const useEmployerPermissions = () => {
  const { isEmployer, hasPermission } = usePermissions();
  
  return useMemo(() => ({
    isEmployer,
    canCreateJobs: hasPermission('jobs:create'),
    canEditJobs: hasPermission('jobs:edit'),
    canDeleteJobs: hasPermission('jobs:delete'),
    canSendNotifications: hasPermission('notifications:send')
  }), [isEmployer, hasPermission]);
};

/**
 * Hook for job-related permissions
 * Use this for job-related components
 */
export const useJobPermissions = () => {
  const { hasPermission } = usePermissions();
  
  return useMemo(() => ({
    canViewJobs: hasPermission('jobs:view'),
    canApplyToJobs: hasPermission('jobs:apply'),
    canCreateJobs: hasPermission('jobs:create'),
    canEditJobs: hasPermission('jobs:edit'),
    canDeleteJobs: hasPermission('jobs:delete')
  }), [hasPermission]);
};

/**
 * Hook for profile-related permissions
 * Use this for profile-related components
 */
export const useProfilePermissions = () => {
  const { hasPermission } = usePermissions();
  
  return useMemo(() => ({
    canViewProfile: hasPermission('profile:view'),
    canEditProfile: hasPermission('profile:edit')
  }), [hasPermission]);
};