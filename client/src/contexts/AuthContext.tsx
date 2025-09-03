import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { authService } from '@/services/authService';
import { AuthContextType, UserProfile, SecuritySettings } from '@/types/auth';

/**
 * Authentication Context
 * Provides authentication state and methods throughout the application
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Load user profile
          const profile = await authService.getUserProfile(firebaseUser.uid);
          setUserProfile(profile);
          
          // Load security settings
          const settings = await authService.getSecuritySettings();
          setSecuritySettings(settings);
        } catch (error) {
          console.error('Error loading user data:', error);
          // Set default values if loading fails
          setUserProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
            phoneNumber: firebaseUser.phoneNumber || '',
            twoFactorEnabled: false,
            createdAt: new Date(),
            lastLoginAt: new Date(),
            provider: firebaseUser.providerData.map(p => p.providerId),
            isVerified: firebaseUser.emailVerified
          });
          
          setSecuritySettings({
            twoFactorEnabled: false,
            twoFactorMethod: 'whatsapp',
            backupCodes: [],
            trustedDevices: [],
            loginNotifications: true,
            suspiciousActivityAlerts: true
          });
        }
      } else {
        setUserProfile(null);
        setSecuritySettings(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      const user = await authService.signInWithEmail(email, password);
      setUser(user);
    } catch (error: any) {
      throw new Error(error.message || 'Sign in failed');
    }
  };

  // Sign in with Google
  const signInWithGoogle = async (): Promise<void> => {
    try {
      const user = await authService.signInWithGoogle();
      setUser(user);
    } catch (error: any) {
      throw new Error(error.message || 'Google sign in failed');
    }
  };

  // Sign in with Facebook
  const signInWithFacebook = async (): Promise<void> => {
    try {
      const user = await authService.signInWithFacebook();
      setUser(user);
    } catch (error: any) {
      throw new Error(error.message || 'Facebook sign in failed');
    }
  };

  // Sign out
  const signOut = async (): Promise<void> => {
    try {
      await authService.signOut();
      setUser(null);
      setUserProfile(null);
      setSecuritySettings(null);
    } catch (error: any) {
      throw new Error(error.message || 'Sign out failed');
    }
  };

  // Send 2FA code
  const sendTwoFactorCode = async (phoneNumber: string) => {
    try {
      return await authService.sendTwoFactorCode({ phoneNumber });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send 2FA code');
    }
  };

  // Verify 2FA code
  const verifyTwoFactorCode = async (phoneNumber: string, code: string) => {
    try {
      return await authService.verifyTwoFactorCode({ phoneNumber, code });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to verify 2FA code');
    }
  };

  // Enable 2FA
  const enableTwoFactor = async (phoneNumber: string): Promise<void> => {
    try {
      await authService.enableTwoFactor(phoneNumber);
      
      // Update local state
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          twoFactorEnabled: true,
          phoneNumber
        });
      }
      
      if (securitySettings) {
        setSecuritySettings({
          ...securitySettings,
          twoFactorEnabled: true
        });
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to enable 2FA');
    }
  };

  // Disable 2FA
  const disableTwoFactor = async (): Promise<void> => {
    try {
      await authService.disableTwoFactor();
      
      // Update local state
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          twoFactorEnabled: false,
          twoFactorMethod: undefined
        });
      }
      
      if (securitySettings) {
        setSecuritySettings({
          ...securitySettings,
          twoFactorEnabled: false
        });
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to disable 2FA');
    }
  };

  // Update user profile
  const updateProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    try {
      await authService.updateUserProfile(updates);
      
      // Update local state
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          ...updates
        });
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile');
    }
  };

  // Reset password
  const resetPassword = async (email: string): Promise<void> => {
    try {
      await authService.resetPassword(email);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to reset password');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signInWithGoogle,
    signInWithFacebook,
    signOut,
    sendTwoFactorCode,
    verifyTwoFactorCode,
    enableTwoFactor,
    disableTwoFactor,
    updateProfile,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use authentication context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Hook to get current user
 */
export const useCurrentUser = (): User | null => {
  const { user } = useAuth();
  return user;
};

/**
 * Hook to check if user is authenticated
 */
export const useIsAuthenticated = (): boolean => {
  const { user } = useAuth();
  return !!user;
};

/**
 * Hook to get user profile
 */
export const useUserProfile = (): UserProfile | null => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      authService.getUserProfile(user.uid)
        .then(setProfile)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  return profile;
};

/**
 * Hook to get security settings
 */
export const useSecuritySettings = (): SecuritySettings | null => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      authService.getSecuritySettings()
        .then(setSettings)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setSettings(null);
      setLoading(false);
    }
  }, [user]);

  return settings;
};

export default AuthContext;