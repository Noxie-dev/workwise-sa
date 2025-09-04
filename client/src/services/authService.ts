/**
 * Legacy Authentication Service for WorkWise SA
 * @deprecated This service is being replaced by the unified auth system
 * Use the new unified auth service instead: @shared/unified-auth-service
 * 
 * MIGRATION GUIDE:
 * - Replace imports from this file with @shared/unified-auth-service
 * - Use unifiedAuthService instead of this class
 * - Update your components to use the new auth context
 */

import { 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { enhancedApiClient } from '@/lib/apiClient';
import {
  TwoFactorAuthRequest,
  TwoFactorAuthResponse,
  TwoFactorVerificationRequest,
  TwoFactorVerificationResponse,
  SSOLoginRequest,
  SSOLoginResponse,
  UserProfile,
  SecuritySettings,
  PhoneNumberValidationResult,
  ValidationResult,
  SUPPORTED_COUNTRIES
} from '@/types/auth';

/**
 * Authentication Service Class
 * Handles all authentication-related operations
 */
class AuthService {
  private baseUrl = '/api/auth';

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  /**
   * Sign in with Google SSO
   */
  async signInWithGoogle(): Promise<User> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  /**
   * Sign in with Facebook SSO
   */
  async signInWithFacebook(): Promise<User> {
    try {
      const provider = new FacebookAuthProvider();
      provider.addScope('email');
      
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error: any) {
      console.error('Facebook sign in error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out');
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  /**
   * Send 2FA code via WhatsApp
   */
  async sendTwoFactorCode(request: TwoFactorAuthRequest): Promise<TwoFactorAuthResponse> {
    try {
      const [data, error] = await enhancedApiClient.post<TwoFactorAuthResponse>(
        `${this.baseUrl}/send-2fa-code`,
        request
      );

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('No response data received');
      }

      return data;
    } catch (error: any) {
      console.error('Send 2FA code error:', error);
      return {
        success: false,
        message: error.message || 'Failed to send verification code',
        error: error.message
      };
    }
  }

  /**
   * Verify 2FA code
   */
  async verifyTwoFactorCode(request: TwoFactorVerificationRequest): Promise<TwoFactorVerificationResponse> {
    try {
      const [data, error] = await enhancedApiClient.post<TwoFactorVerificationResponse>(
        `${this.baseUrl}/verify-2fa-code`,
        request
      );

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('No response data received');
      }

      return data;
    } catch (error: any) {
      console.error('Verify 2FA code error:', error);
      return {
        success: false,
        message: error.message || 'Failed to verify code',
        verified: false,
        error: error.message
      };
    }
  }

  /**
   * Enable 2FA for user
   */
  async enableTwoFactor(phoneNumber: string): Promise<void> {
    try {
      const [data, error] = await enhancedApiClient.post(
        `${this.baseUrl}/enable-2fa`,
        { phoneNumber }
      );

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error('Enable 2FA error:', error);
      throw new Error(error.message || 'Failed to enable 2FA');
    }
  }

  /**
   * Disable 2FA for user
   */
  async disableTwoFactor(): Promise<void> {
    try {
      const [data, error] = await enhancedApiClient.post(
        `${this.baseUrl}/disable-2fa`
      );

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error('Disable 2FA error:', error);
      throw new Error(error.message || 'Failed to disable 2FA');
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const [data, error] = await enhancedApiClient.get<UserProfile>(
        `${this.baseUrl}/profile/${userId}`
      );

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('User profile not found');
      }

      return data;
    } catch (error: any) {
      console.error('Get user profile error:', error);
      throw new Error(error.message || 'Failed to get user profile');
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    try {
      const [data, error] = await enhancedApiClient.put(
        `${this.baseUrl}/profile`,
        updates
      );

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error('Update user profile error:', error);
      throw new Error(error.message || 'Failed to update user profile');
    }
  }

  /**
   * Get security settings
   */
  async getSecuritySettings(): Promise<SecuritySettings> {
    try {
      const [data, error] = await enhancedApiClient.get<SecuritySettings>(
        `${this.baseUrl}/security-settings`
      );

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Security settings not found');
      }

      return data;
    } catch (error: any) {
      console.error('Get security settings error:', error);
      throw new Error(error.message || 'Failed to get security settings');
    }
  }

  /**
   * Update security settings
   */
  async updateSecuritySettings(settings: Partial<SecuritySettings>): Promise<void> {
    try {
      const [data, error] = await enhancedApiClient.put(
        `${this.baseUrl}/security-settings`,
        settings
      );

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error('Update security settings error:', error);
      throw new Error(error.message || 'Failed to update security settings');
    }
  }

  /**
   * Validate phone number
   */
  validatePhoneNumber(phoneNumber: string): PhoneNumberValidationResult {
    const errors: string[] = [];
    
    // Remove all non-digit characters except +
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Check if it starts with +
    if (!cleaned.startsWith('+')) {
      errors.push('Phone number must start with country code (e.g., +27)');
    }
    
    // Check minimum length
    if (cleaned.length < 10) {
      errors.push('Phone number is too short');
    }
    
    // Check maximum length
    if (cleaned.length > 15) {
      errors.push('Phone number is too long');
    }
    
    // Validate South African number format
    if (cleaned.startsWith('+27')) {
      const saNumber = cleaned.substring(3);
      if (saNumber.length !== 9 || !saNumber.startsWith('0')) {
        errors.push('Invalid South African phone number format');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      formatted: cleaned,
      country: this.getCountryFromPhoneNumber(cleaned),
      countryCode: this.getCountryCodeFromPhoneNumber(cleaned)
    };
  }

  /**
   * Validate email address
   */
  validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
      errors.push('Email is required');
    } else if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): ValidationResult {
    const errors: string[] = [];
    
    if (!password) {
      errors.push('Password is required');
    } else {
      if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
      }
      if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }
      if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }
      if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Format phone number for display
   */
  formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    if (cleaned.startsWith('+27')) {
      const saNumber = cleaned.substring(3);
      if (saNumber.length === 9) {
        return `+27 ${saNumber.substring(0, 2)} ${saNumber.substring(2, 5)} ${saNumber.substring(5)}`;
      }
    }
    
    return cleaned;
  }

  /**
   * Get country from phone number
   */
  private getCountryFromPhoneNumber(phoneNumber: string): string {
    for (const country of SUPPORTED_COUNTRIES) {
      if (phoneNumber.startsWith(country.dialCode)) {
        return country.name;
      }
    }
    return 'Unknown';
  }

  /**
   * Get country code from phone number
   */
  private getCountryCodeFromPhoneNumber(phoneNumber: string): string {
    for (const country of SUPPORTED_COUNTRIES) {
      if (phoneNumber.startsWith(country.dialCode)) {
        return country.code;
      }
    }
    return 'ZZ';
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      'auth/user-not-found': 'No account found with this email address',
      'auth/wrong-password': 'Incorrect password',
      'auth/email-already-in-use': 'An account with this email already exists',
      'auth/weak-password': 'Password is too weak',
      'auth/invalid-email': 'Invalid email address',
      'auth/user-disabled': 'This account has been disabled',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Please check your connection',
      'auth/popup-closed-by-user': 'Sign-in popup was closed',
      'auth/cancelled-popup-request': 'Sign-in was cancelled',
      'auth/popup-blocked': 'Popup was blocked by browser',
      'auth/account-exists-with-different-credential': 'An account already exists with this email but different sign-in method',
    };

    return errorMessages[errorCode] || 'An unexpected error occurred';
  }

  /**
   * Check if user has 2FA enabled
   */
  async hasTwoFactorEnabled(userId: string): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(userId);
      return profile.twoFactorEnabled;
    } catch (error) {
      console.error('Check 2FA status error:', error);
      return false;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!auth.currentUser;
  }

  /**
   * Get user ID token
   */
  async getIdToken(): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (user) {
        return await user.getIdToken();
      }
      return null;
    } catch (error) {
      console.error('Get ID token error:', error);
      return null;
    }
  }
}

// Export a singleton instance
export const authService = new AuthService();
export default authService;