/**
 * Unified Authentication Context
 * This context provides a comprehensive authentication system using the unified auth service
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  AppUser, 
  AuthResult, 
  AuthStatus, 
  RegisterData, 
  LoginData,
  AuthContextType as IAuthContextType
} from './auth-types';
import { unifiedAuthService } from './unified-auth-service';
import { firebaseAuthAdapterUnified } from './firebase-auth-adapter-unified';

// ============================================================================
// AUTH CONTEXT
// ============================================================================

const AuthContext = createContext<IAuthContextType | null>(null);

// ============================================================================
// AUTH PROVIDER
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = unifiedAuthService.onAuthStateChange((user, authStatus) => {
      setUser(user);
      setStatus(authStatus);
      setIsLoading(false);
    });

    // Also listen to Firebase auth state for compatibility
    const firebaseUnsubscribe = firebaseAuthAdapterUnified.onAuthStateChanged((firebaseUser) => {
      setFirebaseUser(firebaseUser);
    });

    return () => {
      unsubscribe();
      firebaseUnsubscribe();
    };
  }, []);

  // ============================================================================
  // AUTH METHODS
  // ============================================================================

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      const result = await firebaseAuthAdapterUnified.loginWithEmailPassword(email, password);
      
      if (result.success && result.user) {
        // Update the unified service with the result
        setUser(result.user);
        setStatus('authenticated');
      }
      
      return result;
    } catch (error) {
      setStatus('error');
      return {
        success: false,
        error: {
          code: 'auth/login-failed',
          message: error instanceof Error ? error.message : 'Login failed'
        }
      };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      const result = await firebaseAuthAdapterUnified.loginWithGoogle();
      
      if (result.success && result.user) {
        setUser(result.user);
        setStatus('authenticated');
      }
      
      return result;
    } catch (error) {
      setStatus('error');
      return {
        success: false,
        error: {
          code: 'auth/google-login-failed',
          message: error instanceof Error ? error.message : 'Google login failed'
        }
      };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmailLink = async (email: string): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      const result = await firebaseAuthAdapterUnified.loginWithEmailLink(email);
      return result;
    } catch (error) {
      setStatus('error');
      return {
        success: false,
        error: {
          code: 'auth/email-link-failed',
          message: error instanceof Error ? error.message : 'Email link login failed'
        }
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      const result = await firebaseAuthAdapterUnified.registerWithEmailPassword(userData);
      
      if (result.success && result.user) {
        setUser(result.user);
        setStatus('authenticated');
      }
      
      return result;
    } catch (error) {
      setStatus('error');
      return {
        success: false,
        error: {
          code: 'auth/registration-failed',
          message: error instanceof Error ? error.message : 'Registration failed'
        }
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await firebaseAuthAdapterUnified.logout();
      setUser(null);
      setFirebaseUser(null);
      setStatus('unauthenticated');
    } catch (error) {
      console.error('Logout error:', error);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      const result = await firebaseAuthAdapterUnified.resetPassword(email);
      return result;
    } catch (error) {
      setStatus('error');
      return {
        success: false,
        error: {
          code: 'auth/password-reset-failed',
          message: error instanceof Error ? error.message : 'Password reset failed'
        }
      };
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<AppUser>): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      const result = await firebaseAuthAdapterUnified.updateUserProfile(updates);
      
      if (result.success && result.user) {
        setUser(result.user);
      }
      
      return result;
    } catch (error) {
      setStatus('error');
      return {
        success: false,
        error: {
          code: 'auth/profile-update-failed',
          message: error instanceof Error ? error.message : 'Profile update failed'
        }
      };
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const currentUser = await firebaseAuthAdapterUnified.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setStatus('authenticated');
      } else {
        setUser(null);
        setStatus('unauthenticated');
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      setStatus('error');
    }
  };

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  const isAuthenticated = status === 'authenticated' && user !== null;
  const isAdmin = user?.role === 'admin';

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission as any);
  };

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: IAuthContextType = {
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
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// AUTH HOOK
// ============================================================================

export const useAuth = (): IAuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// ============================================================================
// AUTH GUARD COMPONENTS
// ============================================================================

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  permissions?: string[];
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback = <div>Access denied</div>,
  requireAuth = true,
  requireAdmin = false,
  permissions = []
}) => {
  const { isAuthenticated, isAdmin, hasPermission, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (requireAuth && !isAuthenticated) {
    return <>{fallback}</>;
  }

  if (requireAdmin && !isAdmin) {
    return <>{fallback}</>;
  }

  if (permissions.length > 0 && !permissions.every(permission => hasPermission(permission))) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// ============================================================================
// EXPORTS
// ============================================================================

export default AuthContext;