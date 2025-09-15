/**
 * Optimized Auth Provider - Combines Split Contexts
 * Provides all auth functionality while minimizing re-renders
 * by splitting concerns across multiple contexts
 */

import React, { useCallback, useEffect } from 'react';
import { UserProvider, useUser } from './UserContext';
import { PermissionsProvider, usePermissions } from './PermissionsContext';
import { AuthActionsProvider } from './AuthActionsContext';
import { firebaseAuthAdapter } from '@shared/firebase-auth-adapter';
import { AppUser, Permission, UserRole } from '@shared/auth-types';

// ============================================================================
// CONTEXT COORDINATOR COMPONENT
// ============================================================================

interface AuthContextCoordinatorProps {
  children: React.ReactNode;
}

const AuthContextCoordinator: React.FC<AuthContextCoordinatorProps> = ({ children }) => {
  const { setUser, setFirebaseUser, clearUser } = useUser();
  const { setPermissions, clearPermissions } = usePermissions();

  // ============================================================================
  // COORDINATED ACTIONS
  // ============================================================================

  const handleUserChange = useCallback((user: AppUser | null) => {
    if (user) {
      setUser(user);
      setPermissions(user.permissions, user.role);
    } else {
      clearUser();
      clearPermissions();
    }
  }, [setUser, setPermissions, clearUser, clearPermissions]);

  const handlePermissionsChange = useCallback((permissions: Permission[], role: UserRole | null) => {
    if (permissions.length > 0 && role) {
      setPermissions(permissions, role);
    } else {
      clearPermissions();
    }
  }, [setPermissions, clearPermissions]);

  // ============================================================================
  // FIREBASE AUTH STATE LISTENER
  // ============================================================================

  useEffect(() => {
    const unsubscribe = firebaseAuthAdapter.onAuthStateChanged((appUser) => {
      if (appUser) {
        handleUserChange(appUser);
      } else {
        handleUserChange(null);
      }
    });

    return unsubscribe;
  }, [handleUserChange]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <AuthActionsProvider 
      onUserChange={handleUserChange}
      onPermissionsChange={handlePermissionsChange}
    >
      {children}
    </AuthActionsProvider>
  );
};

// ============================================================================
// MAIN OPTIMIZED AUTH PROVIDER
// ============================================================================

interface OptimizedAuthProviderProps {
  children: React.ReactNode;
}

export const OptimizedAuthProvider: React.FC<OptimizedAuthProviderProps> = ({ children }) => {
  return (
    <UserProvider>
      <PermissionsProvider>
        <AuthContextCoordinator>
          {children}
        </AuthContextCoordinator>
      </PermissionsProvider>
    </UserProvider>
  );
};

// ============================================================================
// UNIFIED AUTH HOOK
// ============================================================================

/**
 * Unified auth hook that provides access to all auth functionality
 * This hook combines all three contexts for backward compatibility
 */
export const useOptimizedAuth = () => {
  const userContext = useUser();
  const permissionsContext = usePermissions();
  const authActionsContext = useAuthActions();

  return {
    // User data
    user: userContext.user,
    firebaseUser: userContext.firebaseUser,
    userDisplayName: userContext.userDisplayName,
    userInitials: userContext.userInitials,
    isProfileComplete: userContext.isProfileComplete,
    userRole: userContext.userRole,
    
    // Auth state
    status: authActionsContext.status,
    isLoading: authActionsContext.isLoading,
    isAuthenticated: userContext.isAuthenticated,
    
    // Permissions
    permissions: permissionsContext.permissions,
    role: permissionsContext.role,
    isAdmin: permissionsContext.isAdmin,
    isModerator: permissionsContext.isModerator,
    isEmployer: permissionsContext.isEmployer,
    isUser: permissionsContext.isUser,
    
    // Permission checks
    hasPermission: permissionsContext.hasPermission,
    hasAnyPermission: permissionsContext.hasAnyPermission,
    hasAllPermissions: permissionsContext.hasAllPermissions,
    hasRole: permissionsContext.hasRole,
    hasAnyRole: permissionsContext.hasAnyRole,
    
    // Auth actions
    login: authActionsContext.login,
    loginWithGoogle: authActionsContext.loginWithGoogle,
    loginWithEmailLink: authActionsContext.loginWithEmailLink,
    register: authActionsContext.register,
    logout: authActionsContext.logout,
    resetPassword: authActionsContext.resetPassword,
    updateProfile: authActionsContext.updateProfile,
    refreshUser: authActionsContext.refreshUser
  };
};

// ============================================================================
// PERFORMANCE OPTIMIZED HOOKS
// ============================================================================

/**
 * Hook for components that only need user data
 * Will not re-render when permissions change
 */
export const useUserOnly = () => {
  return useUser();
};

/**
 * Hook for components that only need permissions
 * Will not re-render when user data changes
 */
export const usePermissionsOnly = () => {
  return usePermissions();
};

/**
 * Hook for components that only need auth actions
 * Will not re-render when user/permissions change
 */
export const useAuthActionsOnly = () => {
  return useAuthActions();
};

// ============================================================================
// BACKWARD COMPATIBILITY
// ============================================================================

/**
 * @deprecated Use OptimizedAuthProvider instead
 */
export const EnhancedAuthProvider = OptimizedAuthProvider;

/**
 * @deprecated Use useOptimizedAuth instead
 */
export const useEnhancedAuth = useOptimizedAuth;