/**
 * Legacy Authentication Service
 * @deprecated This service is being replaced by the unified auth system
 * Use the new unified auth service instead: @shared/unified-auth-service
 * 
 * MIGRATION GUIDE:
 * - Replace imports from this file with @shared/unified-auth-service
 * - Use unifiedAuthService instead of individual functions
 * - Update your components to use the new auth context
 */

import { API_URL } from '@/lib/env';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { AuthResult } from '@shared/auth-types';

// Legacy type for backward compatibility
interface AuthResponse {
  success: boolean;
  message?: string;
  user?: any;
}

/**
 * @deprecated Use the enhanced auth context instead
 * Logs in a user with email and password
 */
export async function loginWithEmailPassword(email: string, password: string): Promise<AuthResponse> {
  try {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    return {
      success: true,
      user: userCredential.user,
    };
  } catch (error: any) {
    console.error('Login error:', error);
    return {
      success: false,
      message: error.message || 'Failed to login',
    };
  }
}

/**
 * @deprecated Use the enhanced auth context instead
 * Registers a new user with email and password
 */
export async function registerWithEmailPassword(email: string, password: string, displayName: string): Promise<AuthResponse> {
  try {
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update the user's profile with display name
    await updateProfile(userCredential.user, {
      displayName,
    });
    
    return {
      success: true,
      user: userCredential.user,
    };
  } catch (error: any) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: error.message || 'Failed to register',
    };
  }
}

/**
 * @deprecated Use the enhanced auth context instead
 * Logs out the current user
 */
export async function logout(): Promise<AuthResponse> {
  try {
    const auth = getAuth();
    await signOut(auth);
    
    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Logout error:', error);
    return {
      success: false,
      message: error.message || 'Failed to logout',
    };
  }
}

/**
 * @deprecated Use the enhanced auth context instead
 * Sends a password reset email
 */
export async function resetPassword(email: string): Promise<AuthResponse> {
  try {
    const auth = getAuth();
    await sendPasswordResetEmail(auth, email);
    
    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Password reset error:', error);
    return {
      success: false,
      message: error.message || 'Failed to send password reset email',
    };
  }
}

/**
 * Checks if a user's profile is complete
 * @param userId User ID to check
 * @returns Promise with boolean indicating if profile is complete
 */
export async function checkProfileCompletion(userId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/profile/check-completion/${userId}`, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to check profile completion');
    }
    
    const data = await response.json();
    return data.isComplete;
  } catch (error: any) {
    console.error('Profile completion check error:', error);
    // Default to false if there's an error
    return false;
  }
}
