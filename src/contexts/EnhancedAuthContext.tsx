/**
 * Enhanced Authentication Context
 * This context provides a comprehensive authentication state management system
 * with proper error handling, loading states, and role-based access control.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { 
  AppUser, 
  AuthContextType, 
  AuthStatus, 
  AuthResult, 
  RegisterData, 
  Permission,
  UserUpdate
} from '@shared/auth-types';
import { firebaseAuthAdapter } from '@shared/firebase-auth-adapter';

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const EnhancedAuthContext = createContext<AuthContextType | null>(null);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface EnhancedAuthProviderProps {
  children: React.ReactNode;
}

export const EnhancedAuthProvider: React.FC<EnhancedAuthProviderProps> = ({ children }) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [isLoading, setIsLoading] = useState(true);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const isAuthenticated = useMemo(() => !!user, [user]);
  
  const isAdmin = useMemo(() => {
    return user?.role === 'admin';
  }, [user]);

  // ============================================================================
  // AUTHENTICATION METHODS
  // ============================================================================

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    setIsLoading(true);
    setStatus('loading');

    try {
      const result = await firebaseAuthAdapter.loginWithEmailPassword(email, password);
      
      if (result.success && result.user) {
        setUser(result.user);
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
          message: 'An unexpected error occurred during login'
        }
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async (): Promise<AuthResult> => {
    setIsLoading(true);
    setStatus('loading');

    try {
      const result = await firebaseAuthAdapter.loginWithGoogle();
      
      if (result.success && result.user) {
        setUser(result.user);
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
          message: 'An unexpected error occurred during Google login'
        }
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

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
        setUser(result.user);
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
          message: 'An unexpected error occurred during registration'
        }
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    try {
      await firebaseAuthAdapter.logout();
      setUser(null);
      setFirebaseUser(null);
      setStatus('unauthenticated');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if logout fails
      setUser(null);
      setFirebaseUser(null);
      setStatus('unauthenticated');
    } finally {
      setIsLoading(false);
    }
  }, []);

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
        setUser(result.user);
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
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const currentUser = await firebaseAuthAdapter.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setStatus('authenticated');
      } else {
        setUser(null);
        setStatus('unauthenticated');
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setStatus('error');
    }
  }, []);

  // ============================================================================
  // AUTHORIZATION METHODS
  // ============================================================================

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  }, [user]);

  // ============================================================================
  // AUTH STATE LISTENER
  // ============================================================================

  useEffect(() => {
    const unsubscribe = firebaseAuthAdapter.onAuthStateChanged((appUser) => {
      if (appUser) {
        setUser(appUser);
        setStatus('authenticated');
      } else {
        setUser(null);
        setStatus('unauthenticated');
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: AuthContextType = useMemo(() => ({
    user,
    firebaseUser,
    status,
    isLoading,
    isAuthenticated,
    isAdmin,
    hasPermission,
    login,
    loginWithGoogle,
    loginWithEmailLink,
    register,
    logout,
    resetPassword,
    updateProfile,
    refreshUser
  }), [
    user,
    firebaseUser,
    status,
    isLoading,
    isAuthenticated,
    isAdmin,
    hasPermission,
    login,
    loginWithGoogle,
    loginWithEmailLink,
    register,
    logout,
    resetPassword,
    updateProfile,
    refreshUser
  ]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <EnhancedAuthContext.Provider value={contextValue}>
      {children}
    </EnhancedAuthContext.Provider>
  );
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export const useEnhancedAuth = (): AuthContextType => {
  const context = useContext(EnhancedAuthContext);
  
  if (!context) {
    throw new Error('useEnhancedAuth must be used within an EnhancedAuthProvider');
  }
  
  return context;
};

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useEnhancedAuth instead
 */
export const useAuth = useEnhancedAuth;

/**
 * Legacy provider for backward compatibility
 * @deprecated Use EnhancedAuthProvider instead
 */
export const AuthProvider = EnhancedAuthProvider;