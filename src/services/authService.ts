/**
 * Authentication Service
 * Handles all API calls related to authentication
 */

import { API_URL } from '@/lib/env';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, updateProfile } from 'firebase/auth';

// Type for login response
interface AuthResponse {
  success: boolean;
  message?: string;
  user?: any;
}

/**
 * Logs in a user with email and password
 * @param email User's email
 * @param password User's password
 * @returns Promise with the login response
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
 * Registers a new user with email and password
 * @param email User's email
 * @param password User's password
 * @param displayName User's display name
 * @returns Promise with the registration response
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
 * Logs out the current user
 * @returns Promise with the logout response
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
 * Sends a password reset email
 * @param email User's email
 * @returns Promise with the reset response
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
