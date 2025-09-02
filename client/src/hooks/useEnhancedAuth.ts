/**
 * Enhanced Authentication Hooks
 * This file provides custom hooks for authentication functionality
 * with proper error handling, loading states, and type safety.
 */

import { useCallback, useMemo } from 'react';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { 
  Permission, 
  UserRole, 
  UserUpdate, 
  RegisterData,
  AuthResult 
} from '@shared/auth-types';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// MAIN AUTH HOOK
// ============================================================================

/**
 * Enhanced authentication hook with additional utilities
 */
export const useAuth = () => {
  const auth = useEnhancedAuth();
  const { toast } = useToast();

  // ============================================================================
  // ENHANCED AUTHENTICATION METHODS WITH TOAST NOTIFICATIONS
  // ============================================================================

  const loginWithToast = useCallback(async (email: string, password: string, rememberMe?: boolean) => {
    const result = await auth.login(email, password, rememberMe);
    
    if (result.success) {
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: result.error?.message || "An error occurred during login",
      });
    }
    
    return result;
  }, [auth, toast]);

  const loginWithGoogleWithToast = useCallback(async () => {
    const result = await auth.loginWithGoogle();
    
    if (result.success) {
      toast({
        title: "Google Login Successful",
        description: "Welcome back!",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Google Login Failed",
        description: result.error?.message || "An error occurred during Google login",
      });
    }
    
    return result;
  }, [auth, toast]);

  const registerWithToast = useCallback(async (userData: RegisterData) => {
    const result = await auth.register(userData);
    
    if (result.success) {
      toast({
        title: "Registration Successful",
        description: "Your account has been created successfully!",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: result.error?.message || "An error occurred during registration",
      });
    }
    
    return result;
  }, [auth, toast]);

  const logoutWithToast = useCallback(async () => {
    await auth.logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
  }, [auth, toast]);

  const resetPasswordWithToast = useCallback(async (email: string) => {
    const result = await auth.resetPassword(email);
    
    if (result.success) {
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for reset instructions",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Password Reset Failed",
        description: result.error?.message || "An error occurred while sending reset email",
      });
    }
    
    return result;
  }, [auth, toast]);

  const updateProfileWithToast = useCallback(async (updates: UserUpdate) => {
    const result = await auth.updateProfile(updates);
    
    if (result.success) {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Profile Update Failed",
        description: result.error?.message || "An error occurred while updating profile",
      });
    }
    
    return result;
  }, [auth, toast]);

  // ============================================================================
  // ENHANCED AUTHORIZATION UTILITIES
  // ============================================================================

  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    if (!auth.user) return false;
    return permissions.some(permission => auth.hasPermission(permission));
  }, [auth]);

  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    if (!auth.user) return false;
    return permissions.every(permission => auth.hasPermission(permission));
  }, [auth]);

  const hasRole = useCallback((role: UserRole): boolean => {
    return auth.user?.role === role;
  }, [auth.user]);

  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    if (!auth.user) return false;
    return roles.includes(auth.user.role);
  }, [auth.user]);

  // ============================================================================
  // USER INFORMATION UTILITIES
  // ============================================================================

  const userDisplayName = useMemo(() => {
    return auth.user?.displayName || auth.user?.email?.split('@')[0] || 'User';
  }, [auth.user]);

  const userInitials = useMemo(() => {
    if (!auth.user?.displayName) return 'U';
    return auth.user.displayName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [auth.user]);

  const isProfileComplete = useMemo(() => {
    return auth.user?.profileComplete || false;
  }, [auth.user]);

  const userRoleDisplay = useMemo(() => {
    if (!auth.user) return 'Guest';
    
    const roleMap: Record<UserRole, string> = {
      user: 'User',
      admin: 'Administrator',
      moderator: 'Moderator',
      employer: 'Employer'
    };
    
    return roleMap[auth.user.role] || 'User';
  }, [auth.user]);

  // ============================================================================
  // RETURN ENHANCED AUTH OBJECT
  // ============================================================================

  return {
    // Original auth properties
    ...auth,
    
    // Enhanced methods with toast notifications
    loginWithToast,
    loginWithGoogleWithToast,
    registerWithToast,
    logoutWithToast,
    resetPasswordWithToast,
    updateProfileWithToast,
    
    // Enhanced authorization utilities
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    
    // User information utilities
    userDisplayName,
    userInitials,
    isProfileComplete,
    userRoleDisplay
  };
};

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook for admin-specific functionality
 */
export const useAdminAuth = () => {
  const auth = useAuth();
  
  const isAdmin = useMemo(() => auth.isAdmin, [auth.isAdmin]);
  
  const canManageUsers = useMemo(() => 
    auth.hasPermission('admin:users'), [auth.hasPermission]
  );
  
  const canManageSettings = useMemo(() => 
    auth.hasPermission('admin:settings'), [auth.hasPermission]
  );
  
  const canViewAnalytics = useMemo(() => 
    auth.hasPermission('admin:analytics'), [auth.hasPermission]
  );
  
  const canManageContent = useMemo(() => 
    auth.hasPermission('admin:content'), [auth.hasPermission]
  );
  
  const canManageSecurity = useMemo(() => 
    auth.hasPermission('admin:security'), [auth.hasPermission]
  );
  
  return {
    isAdmin,
    canManageUsers,
    canManageSettings,
    canViewAnalytics,
    canManageContent,
    canManageSecurity
  };
};

/**
 * Hook for employer-specific functionality
 */
export const useEmployerAuth = () => {
  const auth = useAuth();
  
  const isEmployer = useMemo(() => auth.hasRole('employer'), [auth.hasRole]);
  
  const canCreateJobs = useMemo(() => 
    auth.hasPermission('jobs:create'), [auth.hasPermission]
  );
  
  const canEditJobs = useMemo(() => 
    auth.hasPermission('jobs:edit'), [auth.hasPermission]
  );
  
  const canDeleteJobs = useMemo(() => 
    auth.hasPermission('jobs:delete'), [auth.hasPermission]
  );
  
  const canSendNotifications = useMemo(() => 
    auth.hasPermission('notifications:send'), [auth.hasPermission]
  );
  
  return {
    isEmployer,
    canCreateJobs,
    canEditJobs,
    canDeleteJobs,
    canSendNotifications
  };
};

/**
 * Hook for user profile management
 */
export const useProfileAuth = () => {
  const auth = useAuth();
  
  const canEditProfile = useMemo(() => 
    auth.hasPermission('profile:edit'), [auth.hasPermission]
  );
  
  const canViewProfile = useMemo(() => 
    auth.hasPermission('profile:view'), [auth.hasPermission]
  );
  
  const needsProfileCompletion = useMemo(() => 
    !auth.isProfileComplete, [auth.isProfileComplete]
  );
  
  const profileCompletionPercentage = useMemo(() => {
    if (!auth.user) return 0;
    
    const requiredFields = [
      auth.user.displayName,
      auth.user.metadata?.location,
      auth.user.metadata?.bio
    ];
    
    const completedFields = requiredFields.filter(field => 
      field && field.trim().length > 0
    ).length;
    
    return Math.round((completedFields / requiredFields.length) * 100);
  }, [auth.user]);
  
  return {
    canEditProfile,
    canViewProfile,
    needsProfileCompletion,
    profileCompletionPercentage
  };
};

/**
 * Hook for job-related permissions
 */
export const useJobAuth = () => {
  const auth = useAuth();
  
  const canViewJobs = useMemo(() => 
    auth.hasPermission('jobs:view'), [auth.hasPermission]
  );
  
  const canApplyToJobs = useMemo(() => 
    auth.hasPermission('jobs:apply'), [auth.hasPermission]
  );
  
  const canCreateJobs = useMemo(() => 
    auth.hasPermission('jobs:create'), [auth.hasPermission]
  );
  
  const canEditJobs = useMemo(() => 
    auth.hasPermission('jobs:edit'), [auth.hasPermission]
  );
  
  const canDeleteJobs = useMemo(() => 
    auth.hasPermission('jobs:delete'), [auth.hasPermission]
  );
  
  return {
    canViewJobs,
    canApplyToJobs,
    canCreateJobs,
    canEditJobs,
    canDeleteJobs
  };
};

/**
 * Hook for checking if user can access a specific resource
 */
export const useResourceAccess = () => {
  const auth = useAuth();
  
  const canAccessResource = useCallback((
    resourceOwnerId: string,
    requiredPermissions?: Permission[],
    requiredRoles?: UserRole[]
  ): boolean => {
    if (!auth.user) return false;
    
    // Check if user is the resource owner
    if (auth.user.uid === resourceOwnerId) return true;
    
    // Check if user has admin role
    if (auth.isAdmin) return true;
    
    // Check required permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasRequiredPermission = requiredPermissions.some(permission => 
        auth.hasPermission(permission)
      );
      if (!hasRequiredPermission) return false;
    }
    
    // Check required roles
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.includes(auth.user.role);
      if (!hasRequiredRole) return false;
    }
    
    return true;
  }, [auth]);
  
  return {
    canAccessResource
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

export default useAuth;