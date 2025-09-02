/**
 * User Context - Split from Auth Context
 * Manages only user data to reduce re-renders
 * Components that only need user info won't re-render when permissions change
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { AppUser, UserUpdate } from '@shared/auth-types';

// ============================================================================
// USER CONTEXT TYPES
// ============================================================================

interface UserContextType {
  // User data
  user: AppUser | null;
  firebaseUser: any;
  
  // User state
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // User actions
  setUser: (user: AppUser | null) => void;
  setFirebaseUser: (firebaseUser: any) => void;
  updateUser: (updates: UserUpdate) => void;
  clearUser: () => void;
  
  // Computed user properties
  userDisplayName: string;
  userInitials: string;
  isProfileComplete: boolean;
  userRole: string;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const UserContext = createContext<UserContextType | null>(null);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface UserProviderProps {
  children: React.ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [user, setUserState] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUserState] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const isAuthenticated = useMemo(() => !!user, [user]);

  const userDisplayName = useMemo(() => {
    return user?.displayName || user?.email?.split('@')[0] || 'User';
  }, [user]);

  const userInitials = useMemo(() => {
    if (!user?.displayName) return 'U';
    return user.displayName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [user]);

  const isProfileComplete = useMemo(() => {
    return user?.profileComplete || false;
  }, [user]);

  const userRole = useMemo(() => {
    if (!user) return 'Guest';
    
    const roleMap: Record<string, string> = {
      user: 'User',
      admin: 'Administrator',
      moderator: 'Moderator',
      employer: 'Employer'
    };
    
    return roleMap[user.role] || 'User';
  }, [user]);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const setUser = useCallback((newUser: AppUser | null) => {
    setUserState(newUser);
    setIsLoading(false);
  }, []);

  const setFirebaseUser = useCallback((newFirebaseUser: any) => {
    setFirebaseUserState(newFirebaseUser);
  }, []);

  const updateUser = useCallback((updates: UserUpdate) => {
    setUserState(prevUser => {
      if (!prevUser) return null;
      
      return {
        ...prevUser,
        ...updates,
        metadata: {
          ...prevUser.metadata,
          ...updates.metadata
        },
        updatedAt: new Date()
      };
    });
  }, []);

  const clearUser = useCallback(() => {
    setUserState(null);
    setFirebaseUserState(null);
    setIsLoading(false);
  }, []);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: UserContextType = useMemo(() => ({
    // User data
    user,
    firebaseUser,
    
    // User state
    isLoading,
    isAuthenticated,
    
    // User actions
    setUser,
    setFirebaseUser,
    updateUser,
    clearUser,
    
    // Computed user properties
    userDisplayName,
    userInitials,
    isProfileComplete,
    userRole
  }), [
    user,
    firebaseUser,
    isLoading,
    isAuthenticated,
    setUser,
    setFirebaseUser,
    updateUser,
    clearUser,
    userDisplayName,
    userInitials,
    isProfileComplete,
    userRole
  ]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  
  return context;
};

// ============================================================================
// SELECTIVE HOOKS FOR PERFORMANCE
// ============================================================================

/**
 * Hook that only subscribes to user data changes
 * Use this when you only need user info, not permissions
 */
export const useUserData = () => {
  const { user, firebaseUser, isLoading, isAuthenticated } = useUser();
  
  return useMemo(() => ({
    user,
    firebaseUser,
    isLoading,
    isAuthenticated
  }), [user, firebaseUser, isLoading, isAuthenticated]);
};

/**
 * Hook that only subscribes to user display properties
 * Use this for UI components that show user info
 */
export const useUserDisplay = () => {
  const { userDisplayName, userInitials, isProfileComplete, userRole } = useUser();
  
  return useMemo(() => ({
    userDisplayName,
    userInitials,
    isProfileComplete,
    userRole
  }), [userDisplayName, userInitials, isProfileComplete, userRole]);
};

/**
 * Hook that only subscribes to user profile completion status
 * Use this for profile completion indicators
 */
export const useProfileStatus = () => {
  const { isProfileComplete, user } = useUser();
  
  const profileCompletionPercentage = useMemo(() => {
    if (!user) return 0;
    
    const requiredFields = [
      user.displayName,
      user.metadata?.location,
      user.metadata?.bio
    ];
    
    const completedFields = requiredFields.filter(field => 
      field && field.trim().length > 0
    ).length;
    
    return Math.round((completedFields / requiredFields.length) * 100);
  }, [user]);
  
  return useMemo(() => ({
    isProfileComplete,
    profileCompletionPercentage,
    needsCompletion: !isProfileComplete
  }), [isProfileComplete, profileCompletionPercentage]);
};