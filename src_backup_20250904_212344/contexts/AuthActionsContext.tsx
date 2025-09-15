/**
 * Auth Actions Context - Split from Auth Context
 * Manages only authentication actions to reduce re-renders
 * Components that only need auth actions won't re-render when user/permissions change
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { 
  AuthResult, 
  RegisterData, 
  UserUpdate,
  AuthStatus 
} from '@shared/auth-types';
import { firebaseAuthAdapter } from '@shared/firebase-auth-adapter';

// ============================================================================
// AUTH ACTIONS CONTEXT TYPES
// ============================================================================

interface AuthActionsContextType {
  // Auth state
  status: AuthStatus;
  isLoading: boolean;
  
  // Auth actions
  login: (email: string, password: string, rememberMe?: boolean) => Promise<AuthResult>;
  loginWithGoogle: () => Promise<AuthResult>;
  loginWithEmailLink: (email: string) => Promise<AuthResult>;
  register: (userData: RegisterData) => Promise<AuthResult>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updateProfile: (updates: UserUpdate) => Promise<AuthResult>;
  refreshUser: () => Promise<void>;
  
  // Auth state management
  setStatus: (status: AuthStatus) => void;
  setIsLoading: (loading: boolean) => void;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const AuthActionsContext = createContext<AuthActionsContextType | null>(null);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface AuthActionsProviderProps {
  children: React.ReactNode;
  onUserChange?: (user: any) => void;
  onPermissionsChange?: (permissions: any[], role: any) => void;
}

export const AuthActionsProvider: React.FC<AuthActionsProviderProps> = ({ 
  children, 
  onUserChange,
  onPermissionsChange 
}) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [status, setStatusState] = useState<AuthStatus>('loading');
  const [isLoading, setIsLoadingState] = useState(true);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const setStatus = useCallback((newStatus: AuthStatus) => {
    setStatusState(newStatus);
  }, []);

  const setIsLoading = useCallback((loading: boolean) => {
    setIsLoadingState(loading);
  }, []);

  // ============================================================================
  // AUTHENTICATION METHODS
  // ============================================================================

  const login = useCallback(async (email: string, password: string, rememberMe?: boolean): Promise<AuthResult> => {
    setIsLoading(true);
    setStatus('loading');

    try {
      const result = await firebaseAuthAdapter.loginWithEmailPassword(email, password);
      
      if (result.success && result.user) {
        setStatus('authenticated');
        onUserChange?.(result.user);
        onPermissionsChange?.(result.user.permissions, result.user.role);
      } else {
        setStatus('error');
      }
      
      return result;
    } catch (error) {
      setStatus('error');
      return {
        success: false,
        error: {
          code: 'auth/internal-error',
          message: 'An unexpected error occurred during login'
        }
      };
    } finally {
      setIsLoading(false);
    }
  }, [onUserChange, onPermissionsChange]);

  const loginWithGoogle = useCallback(async (): Promise<AuthResult> => {
    setIsLoading(true);
    setStatus('loading');

    try {
      const result = await firebaseAuthAdapter.loginWithGoogle();
      
      if (result.success && result.user) {
        setStatus('authenticated');
        onUserChange?.(result.user);
        onPermissionsChange?.(result.user.permissions, result.user.role);
      } else {
        setStatus('error');
      }
      
      return result;
    } catch (error) {
      setStatus('error');
      return {
        success: false,
        error: {
          code: 'auth/internal-error',
          message: 'An unexpected error occurred during Google login'
        }
      };
    } finally {
      setIsLoading(false);
    }
  }, [onUserChange, onPermissionsChange]);

  const loginWithEmailLink = useCallback(async (email: string): Promise<AuthResult> => {
    setIsLoading(true);
    setStatus('loading');

    try {
      const result = await firebaseAuthAdapter.loginWithEmailLink(email);
      
      if (result.success) {
        setStatus('authenticated');
      } else {
        setStatus('error');
      }
      
      return result;
    } catch (error) {
      setStatus('error');
      return {
        success: false,
        error: {
          code: 'auth/internal-error',
          message: 'An unexpected error occurred during email link login'
        }
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (userData: RegisterData): Promise<AuthResult> => {
    setIsLoading(true);
    setStatus('loading');

    try {
      const result = await firebaseAuthAdapter.registerWithEmailPassword(userData);
      
      if (result.success && result.user) {
        setStatus('authenticated');
        onUserChange?.(result.user);
        onPermissionsChange?.(result.user.permissions, result.user.role);
      } else {
        setStatus('error');
      }
      
      return result;
    } catch (error) {
      setStatus('error');
      return {
        success: false,
        error: {
          code: 'auth/internal-error',
          message: 'An unexpected error occurred during registration'
        }
      };
    } finally {
      setIsLoading(false);
    }
  }, [onUserChange, onPermissionsChange]);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    try {
      await firebaseAuthAdapter.logout();
      setStatus('unauthenticated');
      onUserChange?.(null);
      onPermissionsChange?.([], null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if logout fails
      setStatus('unauthenticated');
      onUserChange?.(null);
      onPermissionsChange?.([], null);
    } finally {
      setIsLoading(false);
    }
  }, [onUserChange, onPermissionsChange]);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    setIsLoading(true);

    try {
      const result = await firebaseAuthAdapter.resetPassword(email);
      return result;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'auth/internal-error',
          message: 'An unexpected error occurred during password reset'
        }
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: UserUpdate): Promise<AuthResult> => {
    setIsLoading(true);

    try {
      const result = await firebaseAuthAdapter.updateUserProfile(updates);
      
      if (result.success && result.user) {
        onUserChange?.(result.user);
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'auth/internal-error',
          message: 'An unexpected error occurred during profile update'
        }
      };
    } finally {
      setIsLoading(false);
    }
  }, [onUserChange]);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const currentUser = await firebaseAuthAdapter.getCurrentUser();
      if (currentUser) {
        setStatus('authenticated');
        onUserChange?.(currentUser);
        onPermissionsChange?.(currentUser.permissions, currentUser.role);
      } else {
        setStatus('unauthenticated');
        onUserChange?.(null);
        onPermissionsChange?.([], null);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setStatus('error');
    }
  }, [onUserChange, onPermissionsChange]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: AuthActionsContextType = useMemo(() => ({
    // Auth state
    status,
    isLoading,
    
    // Auth actions
    login,
    loginWithGoogle,
    loginWithEmailLink,
    register,
    logout,
    resetPassword,
    updateProfile,
    refreshUser,
    
    // Auth state management
    setStatus,
    setIsLoading
  }), [
    status,
    isLoading,
    login,
    loginWithGoogle,
    loginWithEmailLink,
    register,
    logout,
    resetPassword,
    updateProfile,
    refreshUser,
    setStatus,
    setIsLoading
  ]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <AuthActionsContext.Provider value={contextValue}>
      {children}
    </AuthActionsContext.Provider>
  );
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export const useAuthActions = (): AuthActionsContextType => {
  const context = useContext(AuthActionsContext);
  
  if (!context) {
    throw new Error('useAuthActions must be used within an AuthActionsProvider');
  }
  
  return context;
};

// ============================================================================
// SELECTIVE HOOKS FOR PERFORMANCE
// ============================================================================

/**
 * Hook that only subscribes to auth status changes
 * Use this when you only need to check authentication status
 */
export const useAuthStatus = () => {
  const { status, isLoading } = useAuthActions();
  
  return useMemo(() => ({
    status,
    isLoading,
    isAuthenticated: status === 'authenticated',
    isUnauthenticated: status === 'unauthenticated',
    isError: status === 'error'
  }), [status, isLoading]);
};

/**
 * Hook that only subscribes to loading state changes
 * Use this for loading indicators
 */
export const useAuthLoading = () => {
  const { isLoading } = useAuthActions();
  
  return isLoading;
};