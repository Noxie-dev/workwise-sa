/**
 * Firebase Authentication Adapter
 * This adapter integrates the centralized auth service with Firebase Authentication
 * providing a clean separation between business logic and Firebase implementation.
 */

import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  onAuthStateChanged,
  User as FirebaseUser,
  ActionCodeSettings
} from 'firebase/auth';
import { 
  AppUser, 
  AuthResult, 
  AuthError, 
  RegisterData, 
  UserRole, 
  Permission,
  ROLE_PERMISSIONS,
  AUTH_ERROR_CODES,
  UserUpdate
} from './auth-types';

// ============================================================================
// FIREBASE AUTH ADAPTER
// ============================================================================

export class FirebaseAuthAdapter {
  private auth = getAuth();
  private googleProvider = new GoogleAuthProvider();
  private actionCodeSettings: ActionCodeSettings = {
    url: 'http://localhost:3000/auth/verify',
    handleCodeInApp: true
  };

  constructor() {
    this.setupGoogleProvider();
    this.setupActionCodeSettings();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private setupGoogleProvider(): void {
    this.googleProvider.addScope('email');
    this.googleProvider.addScope('profile');
  }

  private setupActionCodeSettings(): void {
    this.actionCodeSettings = {
      url: this.getEmailLinkUrl(),
      handleCodeInApp: true,
      iOS: {
        bundleId: process.env.VITE_IOS_BUNDLE_ID || 'com.workwise.app'
      },
      android: {
        packageName: process.env.VITE_ANDROID_PACKAGE_NAME || 'com.workwise.app',
        installApp: true,
        minimumVersion: '12'
      },
      dynamicLinkDomain: process.env.VITE_FIREBASE_DYNAMIC_LINK_DOMAIN || 'workwise.page.link'
    };
  }

  private getEmailLinkUrl(): string {
    return process.env.VITE_AUTH_EMAIL_LINK_SIGN_IN_URL || 
           `${window.location.origin}/auth/email-signin-complete`;
  }

  // ============================================================================
  // AUTHENTICATION METHODS
  // ============================================================================

  async loginWithEmailPassword(email: string, password: string): Promise<AuthResult> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const appUser = await this.convertFirebaseUserToAppUser(userCredential.user);
      
      return {
        success: true,
        message: 'Login successful',
        user: appUser,
        data: { token: await userCredential.user.getIdToken() }
      };
    } catch (error: any) {
      return this.handleFirebaseError(error, 'login');
    }
  }

  async loginWithGoogle(): Promise<AuthResult> {
    try {
      const result = await signInWithPopup(this.auth, this.googleProvider);
      const appUser = await this.convertFirebaseUserToAppUser(result.user);
      
      return {
        success: true,
        message: 'Google login successful',
        user: appUser,
        data: { token: await result.user.getIdToken() }
      };
    } catch (error: any) {
      return this.handleFirebaseError(error, 'google-login');
    }
  }

  async loginWithEmailLink(email: string): Promise<AuthResult> {
    try {
      await sendSignInLinkToEmail(this.auth, email, this.actionCodeSettings);
      
      // Store email for verification
      if (typeof window !== 'undefined') {
        localStorage.setItem('emailForSignIn', email);
      }
      
      return {
        success: true,
        message: 'Sign-in link sent to your email'
      };
    } catch (error: any) {
      return this.handleFirebaseError(error, 'email-link-login');
    }
  }

  async completeEmailLinkSignIn(email: string, link: string): Promise<AuthResult> {
    try {
      if (!isSignInWithEmailLink(this.auth, link)) {
        return {
          success: false,
          error: {
            code: AUTH_ERROR_CODES.INVALID_TOKEN,
            message: 'Invalid sign-in link'
          }
        };
      }

      const result = await signInWithEmailLink(this.auth, email, link);
      const appUser = await this.convertFirebaseUserToAppUser(result.user);
      
      // Clear stored email
      if (typeof window !== 'undefined') {
        localStorage.removeItem('emailForSignIn');
      }
      
      return {
        success: true,
        message: 'Email link sign-in successful',
        user: appUser,
        data: { token: await result.user.getIdToken() }
      };
    } catch (error: any) {
      return this.handleFirebaseError(error, 'email-link-completion');
    }
  }

  async registerWithEmailPassword(userData: RegisterData): Promise<AuthResult> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth, 
        userData.email, 
        userData.password
      );

      // Update user profile
      await updateProfile(userCredential.user, {
        displayName: userData.displayName
      });

      // Create app user with additional data
      const appUser = await this.convertFirebaseUserToAppUser(userCredential.user, {
        // username: userData.username,
        location: userData.location,
        bio: userData.bio,
        willingToRelocate: userData.willingToRelocate || false
      });

      return {
        success: true,
        message: 'Registration successful',
        user: appUser,
        data: { token: await userCredential.user.getIdToken() }
      };
    } catch (error: any) {
      return this.handleFirebaseError(error, 'registration');
    }
  }

  async logout(): Promise<AuthResult> {
    try {
      await signOut(this.auth);
      return {
        success: true,
        message: 'Logout successful'
      };
    } catch (error: any) {
      return this.handleFirebaseError(error, 'logout');
    }
  }

  async resetPassword(email: string): Promise<AuthResult> {
    try {
      await sendPasswordResetEmail(this.auth, email);
      return {
        success: true,
        message: 'Password reset email sent'
      };
    } catch (error: any) {
      return this.handleFirebaseError(error, 'password-reset');
    }
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  async updateUserProfile(updates: UserUpdate): Promise<AuthResult> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        return {
          success: false,
          error: {
            code: AUTH_ERROR_CODES.INVALID_TOKEN,
            message: 'No authenticated user'
          }
        };
      }

      // Update Firebase profile
      if (updates.displayName || updates.photoURL) {
        await updateProfile(currentUser, {
          displayName: updates.displayName || undefined,
          photoURL: updates.photoURL || undefined
        });
      }

      // Convert to app user
      const appUser = await this.convertFirebaseUserToAppUser(currentUser);
      
      return {
        success: true,
        message: 'Profile updated successfully',
        user: appUser
      };
    } catch (error: any) {
      return this.handleFirebaseError(error, 'profile-update');
    }
  }

  async getCurrentUser(): Promise<AppUser | null> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      return null;
    }

    return await this.convertFirebaseUserToAppUser(currentUser);
  }

  async getToken(): Promise<string | null> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      return null;
    }

    try {
      return await currentUser.getIdToken();
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  }

  async refreshToken(): Promise<string | null> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      return null;
    }

    try {
      return await currentUser.getIdToken(true); // Force refresh
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
  }

  // ============================================================================
  // AUTH STATE LISTENING
  // ============================================================================

  onAuthStateChanged(callback: (user: AppUser | null) => void): () => void {
    return onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser) {
        const appUser = await this.convertFirebaseUserToAppUser(firebaseUser);
        callback(appUser);
      } else {
        callback(null);
      }
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  getStoredEmailForSignIn(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('emailForSignIn');
    }
    return null;
  }

  clearStoredEmailForSignIn(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('emailForSignIn');
    }
  }

  isSignInWithEmailLink(link: string): boolean {
    return isSignInWithEmailLink(this.auth, link);
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async convertFirebaseUserToAppUser(
    firebaseUser: FirebaseUser, 
    additionalData?: Partial<AppUser>
  ): Promise<AppUser> {
    // Get user role and permissions (this would typically come from your backend)
    const role = await this.getUserRole(firebaseUser.uid);
    const permissions = ROLE_PERMISSIONS[role];

    const appUser: AppUser = {
      uid: firebaseUser.uid,
      id: firebaseUser.uid || '1',
      email: firebaseUser.email || '',
      emailVerified: firebaseUser.emailVerified,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      phoneNumber: firebaseUser.phoneNumber,
      role,
      permissions,
      profileComplete: await this.isProfileComplete(firebaseUser.uid),
      lastLoginAt: new Date(),
      createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
      updatedAt: new Date(),
      metadata: {
        willingToRelocate: false,
        preferences: {
          preferredCategories: [],
          preferredLocations: [],
          preferredJobTypes: [],
          workMode: ['remote', 'on-site', 'hybrid']
        },
        experience: {
          yearsOfExperience: 0,
          previousPositions: []
        },
        education: {
          highestDegree: '',
          fieldOfStudy: '',
          institution: '',
          additionalCertifications: []
        },
        skills: [],
        engagementScore: 0,
        notificationPreference: true,
        ...additionalData?.metadata
      },
      ...additionalData
    };

    return appUser;
  }

  private async getUserRole(uid: string): Promise<UserRole> {
    // This would typically fetch from your backend/database
    // For now, return default role
    return 'user';
  }

  private async isProfileComplete(uid: string): Promise<boolean> {
    // This would typically check against your backend/database
    // For now, return false to indicate profile needs completion
    return false;
  }

  private handleFirebaseError(error: any, operation: string): AuthResult {
    console.error(`Firebase auth error in ${operation}:`, error);

    let authError: AuthError;

    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        authError = {
          code: AUTH_ERROR_CODES.USER_NOT_FOUND,
          message: 'Invalid email or password'
        };
        break;
      case 'auth/email-already-in-use':
        authError = {
          code: AUTH_ERROR_CODES.EMAIL_ALREADY_IN_USE,
          message: 'This email is already registered'
        };
        break;
      case 'auth/weak-password':
        authError = {
          code: AUTH_ERROR_CODES.WEAK_PASSWORD,
          message: 'Password is too weak'
        };
        break;
      case 'auth/invalid-email':
        authError = {
          code: AUTH_ERROR_CODES.INVALID_EMAIL,
          message: 'Invalid email address'
        };
        break;
      case 'auth/too-many-requests':
        authError = {
          code: AUTH_ERROR_CODES.TOO_MANY_REQUESTS,
          message: 'Too many failed attempts. Please try again later'
        };
        break;
      case 'auth/network-request-failed':
        authError = {
          code: AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED,
          message: 'Network error. Please check your connection'
        };
        break;
      case 'auth/operation-not-allowed':
        authError = {
          code: AUTH_ERROR_CODES.OPERATION_NOT_ALLOWED,
          message: 'This sign-in method is not enabled'
        };
        break;
      case 'auth/popup-closed-by-user':
        authError = {
          code: AUTH_ERROR_CODES.POPUP_CLOSED_BY_USER,
          message: 'Sign-in popup was closed'
        };
        break;
      case 'auth/popup-blocked':
        authError = {
          code: AUTH_ERROR_CODES.POPUP_BLOCKED,
          message: 'Sign-in popup was blocked by browser'
        };
        break;
      case 'auth/cancelled-popup-request':
        authError = {
          code: AUTH_ERROR_CODES.CANCELLED_POPUP_REQUEST,
          message: 'Multiple popup requests detected'
        };
        break;
      default:
        authError = {
          code: AUTH_ERROR_CODES.INTERNAL_ERROR,
          message: error.message || 'An unexpected error occurred'
        };
    }

    return {
      success: false,
      error: authError
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const firebaseAuthAdapter = new FirebaseAuthAdapter();