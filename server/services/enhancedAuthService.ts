/**
 * Enhanced Authentication Service
 * Integrates multi-tier caching and advanced token refresh with rotation
 * Replaces the basic auth service with production-ready features
 */

import { 
  AppUser, 
  AuthResult, 
  AuthError, 
  RegisterData, 
  LoginData, 
  UserRole, 
  Permission,
  ROLE_PERMISSIONS,
  AUTH_ERROR_CODES,
  AuthErrorCode,
  UserUpdate,
  UserCreate
} from '../../shared/auth-types';

import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import * as admin from 'firebase-admin';
import { cacheService, cacheUserData, getCachedUserData, invalidateUserCache } from './cacheService';
import { tokenRefreshService } from './tokenRefreshService';
import { logger } from '../utils/logger';

// ============================================================================
// ENHANCED AUTHENTICATION SERVICE
// ============================================================================

export class EnhancedAuthService {
  private currentUser: AppUser | null = null;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenRefreshTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeService();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private async initializeService(): Promise<void> {
    try {
      // Initialize cache service
      await cacheService.initialize();
      
      // Check for existing session
      const storedTokens = this.getStoredTokens();
      if (storedTokens.accessToken && storedTokens.refreshToken) {
        const user = await this.verifyAndRefreshTokens(storedTokens.accessToken, storedTokens.refreshToken);
        if (user) {
          this.currentUser = user;
          this.accessToken = storedTokens.accessToken;
          this.refreshToken = storedTokens.refreshToken;
          this.startTokenRefresh();
        } else {
          this.clearStoredTokens();
        }
      }
    } catch (error) {
      logger.error('Failed to initialize enhanced auth service:', error);
      this.clearStoredTokens();
    }
  }

  // ============================================================================
  // AUTHENTICATION METHODS
  // ============================================================================

  async login(email: string, password: string, rememberMe: boolean = false): Promise<AuthResult> {
    try {
      // Validate input
      const validation = this.validateLoginData({ email, password, rememberMe });
      if (!validation.valid) {
        return this.createErrorResult(validation.error!);
      }

      // Check cache first for user data
      const cachedUser = await this.getCachedUserByEmail(email);
      if (cachedUser) {
        logger.info(`User ${email} found in cache`);
      }

      // Perform Firebase authentication
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Get or create user profile
      const user = await this.getOrCreateUserProfile(firebaseUser);
      
      // Generate tokens
      const tokens = await this.generateTokens(user.uid);
      
      // Update local state
      this.currentUser = user;
      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;
      
      // Store tokens if remember me is enabled
      if (rememberMe) {
        this.storeTokens(tokens.accessToken, tokens.refreshToken);
      }
      
      // Cache user data
      await cacheUserData(user.uid, user, 3600); // Cache for 1 hour
      
      // Start token refresh
      this.startTokenRefresh();
      
      // Update last login
      await this.updateLastLogin(user.uid);
      
      logger.info(`User ${email} logged in successfully`);
      
      return this.createSuccessResult('Login successful', user, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 3600
      });

    } catch (error: any) {
      logger.error('Login error:', error);
      return this.handleError(error, 'login');
    }
  }

  async loginWithGoogle(): Promise<AuthResult> {
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      
      // Add additional scopes if needed
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Get or create user profile
      const user = await this.getOrCreateUserProfile(firebaseUser);
      
      // Generate tokens
      const tokens = await this.generateTokens(user.uid);
      
      // Update local state
      this.currentUser = user;
      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;
      
      // Store tokens
      this.storeTokens(tokens.accessToken, tokens.refreshToken);
      
      // Cache user data
      await cacheUserData(user.uid, user, 3600);
      
      // Start token refresh
      this.startTokenRefresh();
      
      // Update last login
      await this.updateLastLogin(user.uid);
      
      logger.info(`User ${user.email} logged in with Google successfully`);
      
      return this.createSuccessResult('Google login successful', user, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 3600
      });

    } catch (error: any) {
      logger.error('Google login error:', error);
      return this.handleError(error, 'google-login');
    }
  }

  async loginWithEmailLink(email: string): Promise<AuthResult> {
    try {
      const validation = this.validateEmail(email);
      if (!validation.valid) {
        return this.createErrorResult(validation.error!);
      }

      // This would integrate with Firebase Auth email link
      // For now, return a placeholder
      return this.createErrorResult({
        code: AUTH_ERROR_CODES.OPERATION_NOT_ALLOWED,
        message: 'Email link authentication not yet implemented'
      });

    } catch (error: any) {
      logger.error('Email link login error:', error);
      return this.handleError(error, 'email-link-login');
    }
  }

  async register(userData: RegisterData): Promise<AuthResult> {
    try {
      // Validate input
      const validation = this.validateRegisterData(userData);
      if (!validation.valid) {
        return this.createErrorResult(validation.error!);
      }

      // Check if user already exists
      const existingUser = await this.getCachedUserByEmail(userData.email);
      if (existingUser) {
        return this.createErrorResult({
          code: AUTH_ERROR_CODES.EMAIL_ALREADY_IN_USE,
          message: 'An account with this email already exists'
        });
      }

      // Create Firebase user
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const firebaseUser = userCredential.user;

      // Update Firebase profile
      await updateProfile(firebaseUser, {
        displayName: userData.displayName,
      });

      // Create user profile in database
      const user = await this.createUserProfile(firebaseUser, userData);
      
      // Generate tokens
      const tokens = await this.generateTokens(user.uid);
      
      // Update local state
      this.currentUser = user;
      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;
      
      // Store tokens
      this.storeTokens(tokens.accessToken, tokens.refreshToken);
      
      // Cache user data
      await cacheUserData(user.uid, user, 3600);
      
      // Start token refresh
      this.startTokenRefresh();
      
      logger.info(`User ${userData.email} registered successfully`);
      
      return this.createSuccessResult('Registration successful', user, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 3600
      });

    } catch (error: any) {
      logger.error('Registration error:', error);
      return this.handleError(error, 'registration');
    }
  }

  async logout(): Promise<AuthResult> {
    try {
      // Revoke refresh token
      if (this.refreshToken) {
        await tokenRefreshService.revokeAllUserTokens(this.currentUser?.uid || '');
      }

      // Perform Firebase logout
      const auth = getAuth();
      await signOut(auth);
      
      // Clear local state
      this.currentUser = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.clearStoredTokens();
      this.stopTokenRefresh();
      
      // Invalidate user cache
      if (this.currentUser?.uid) {
        await invalidateUserCache(this.currentUser.uid);
      }
      
      logger.info('User logged out successfully');
      
      return this.createSuccessResult('Logged out successfully');

    } catch (error: any) {
      logger.error('Logout error:', error);
      return this.handleError(error, 'logout');
    }
  }

  async resetPassword(email: string): Promise<AuthResult> {
    try {
      const validation = this.validateEmail(email);
      if (!validation.valid) {
        return this.createErrorResult(validation.error!);
      }

      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      
      logger.info(`Password reset email sent to ${email}`);
      
      return this.createSuccessResult('Password reset email sent');

    } catch (error: any) {
      logger.error('Password reset error:', error);
      return this.handleError(error, 'password-reset');
    }
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  async getCurrentUser(): Promise<AppUser | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    // Try to get user from stored tokens
    const storedTokens = this.getStoredTokens();
    if (storedTokens.accessToken && storedTokens.refreshToken) {
      const user = await this.verifyAndRefreshTokens(storedTokens.accessToken, storedTokens.refreshToken);
      if (user) {
        this.currentUser = user;
        return user;
      }
    }

    return null;
  }

  async updateUser(updates: UserUpdate): Promise<AuthResult> {
    try {
      if (!this.currentUser) {
        return this.createErrorResult({
          code: AUTH_ERROR_CODES.INVALID_TOKEN,
          message: 'User not authenticated'
        });
      }

      // Update user in database
      const updatedUser = await this.updateUserProfile(this.currentUser.uid, updates);
      
      if (updatedUser) {
        this.currentUser = updatedUser;
        
        // Update cache
        await cacheUserData(updatedUser.uid, updatedUser, 3600);
        
        logger.info(`User ${updatedUser.uid} profile updated`);
        
        return this.createSuccessResult('Profile updated successfully', updatedUser);
      } else {
        return this.createErrorResult({
          code: AUTH_ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to update profile'
        });
      }

    } catch (error: any) {
      logger.error('User update error:', error);
      return this.handleError(error, 'user-update');
    }
  }

  async deleteUser(): Promise<AuthResult> {
    try {
      if (!this.currentUser) {
        return this.createErrorResult({
          code: AUTH_ERROR_CODES.INVALID_TOKEN,
          message: 'User not authenticated'
        });
      }

      // Revoke all tokens
      await tokenRefreshService.revokeAllUserTokens(this.currentUser.uid);
      
      // Delete user from database
      await this.deleteUserProfile(this.currentUser.uid);
      
      // Invalidate cache
      await invalidateUserCache(this.currentUser.uid);
      
      // Clear local state
      this.currentUser = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.clearStoredTokens();
      this.stopTokenRefresh();
      
      logger.info(`User ${this.currentUser.uid} deleted successfully`);
      
      return this.createSuccessResult('Account deleted successfully');

    } catch (error: any) {
      logger.error('User deletion error:', error);
      return this.handleError(error, 'user-deletion');
    }
  }

  // ============================================================================
  // TOKEN MANAGEMENT
  // ============================================================================

  async getToken(): Promise<string | null> {
    if (this.accessToken) {
      return this.accessToken;
    }

    const storedTokens = this.getStoredTokens();
    if (storedTokens.accessToken && storedTokens.refreshToken) {
      const user = await this.verifyAndRefreshTokens(storedTokens.accessToken, storedTokens.refreshToken);
      if (user) {
        this.accessToken = storedTokens.accessToken;
        return storedTokens.accessToken;
      }
    }

    return null;
  }

  async refreshToken(): Promise<string | null> {
    try {
      if (!this.refreshToken) {
        return null;
      }

      const result = await tokenRefreshService.refreshToken(this.refreshToken, {
        ipAddress: 'unknown', // Would get from request context
        userAgent: 'unknown'  // Would get from request context
      });

      if (result.success && result.accessToken) {
        this.accessToken = result.accessToken;
        
        if (result.refreshToken) {
          this.refreshToken = result.refreshToken;
          this.storeTokens(result.accessToken, result.refreshToken);
        }
        
        return result.accessToken;
      }

      return null;

    } catch (error) {
      logger.error('Token refresh failed:', error);
      return null;
    }
  }

  async verifyToken(token: string): Promise<AppUser | null> {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const user = await this.getCachedUserById(decodedToken.uid);
      return user;
    } catch (error) {
      logger.error('Token verification failed:', error);
      return null;
    }
  }

  // ============================================================================
  // AUTHORIZATION
  // ============================================================================

  hasPermission(permission: Permission): boolean {
    if (!this.currentUser) {
      return false;
    }

    return this.currentUser.permissions.includes(permission);
  }

  hasRole(role: UserRole): boolean {
    if (!this.currentUser) {
      return false;
    }

    return this.currentUser.role === role;
  }

  checkAccess(permissions: Permission[], roles?: UserRole[]): boolean {
    if (!this.currentUser) {
      return false;
    }

    // Check role-based access
    if (roles && roles.includes(this.currentUser.role)) {
      return true;
    }

    // Check permission-based access
    return permissions.some(permission => this.hasPermission(permission));
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  isAuthenticated(): boolean {
    return this.currentUser !== null && this.accessToken !== null;
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  getUserId(): string | null {
    return this.currentUser?.uid || null;
  }

  getUserRole(): UserRole | null {
    return this.currentUser?.role || null;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async verifyAndRefreshTokens(accessToken: string, refreshToken: string): Promise<AppUser | null> {
    try {
      // First try to verify the access token
      const decodedToken = await admin.auth().verifyIdToken(accessToken);
      const user = await this.getCachedUserById(decodedToken.uid);
      return user;
    } catch (error) {
      // Access token is invalid, try to refresh
      try {
        const result = await tokenRefreshService.refreshToken(refreshToken, {
          ipAddress: 'unknown',
          userAgent: 'unknown'
        });

        if (result.success && result.accessToken) {
          const decodedToken = await admin.auth().verifyIdToken(result.accessToken);
          const user = await this.getCachedUserById(decodedToken.uid);
          return user;
        }
      } catch (refreshError) {
        logger.error('Token refresh failed during verification:', refreshError);
      }
    }

    return null;
  }

  private async getCachedUserById(userId: string): Promise<AppUser | null> {
    try {
      // Try cache first
      const cachedUser = await getCachedUserData<AppUser>(userId);
      if (cachedUser) {
        return cachedUser;
      }

      // Fallback to database
      const user = await this.fetchUserFromDatabase(userId);
      if (user) {
        // Cache the result
        await cacheUserData(userId, user, 3600);
      }

      return user;
    } catch (error) {
      logger.error(`Error getting user ${userId}:`, error);
      return null;
    }
  }

  private async getCachedUserByEmail(email: string): Promise<AppUser | null> {
    try {
      // Try cache first
      const cachedUser = await cacheService.get<AppUser>(`user_email:${email}`);
      if (cachedUser) {
        return cachedUser;
      }

      // Fallback to database
      const user = await this.fetchUserFromDatabaseByEmail(email);
      if (user) {
        // Cache the result
        await cacheService.set(`user_email:${email}`, user, { ttl: 3600 });
      }

      return user;
    } catch (error) {
      logger.error(`Error getting user by email ${email}:`, error);
      return null;
    }
  }

  private async getOrCreateUserProfile(firebaseUser: any): Promise<AppUser> {
    // Try to get existing user
    let user = await this.getCachedUserById(firebaseUser.uid);
    
    if (!user) {
      // Create new user profile
      user = await this.createUserProfile(firebaseUser, {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || '',
        username: firebaseUser.email.split('@')[0],
        agreeTerms: true
      });
    }

    return user;
  }

  private async generateTokens(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Generate access token
      const accessToken = await admin.auth().createCustomToken(userId);
      
      // Generate refresh token (this would be handled by the token refresh service)
      const refreshToken = `rt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return { accessToken, refreshToken };
    } catch (error) {
      logger.error('Error generating tokens:', error);
      throw new Error('Failed to generate tokens');
    }
  }

  private startTokenRefresh(): void {
    this.stopTokenRefresh();
    
    // Refresh token every 50 minutes (tokens typically expire in 1 hour)
    this.tokenRefreshTimer = setInterval(async () => {
      await this.refreshToken();
    }, 50 * 60 * 1000);
  }

  private stopTokenRefresh(): void {
    if (this.tokenRefreshTimer) {
      clearInterval(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
  }

  private storeTokens(accessToken: string, refreshToken: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
    }
  }

  private getStoredTokens(): { accessToken: string | null; refreshToken: string | null } {
    if (typeof window !== 'undefined') {
      return {
        accessToken: localStorage.getItem('access_token'),
        refreshToken: localStorage.getItem('refresh_token')
      };
    }
    return { accessToken: null, refreshToken: null };
  }

  private clearStoredTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  private createSuccessResult(message: string, user?: AppUser, data?: any): AuthResult {
    return {
      success: true,
      message,
      user,
      data
    };
  }

  private createErrorResult(error: AuthError): AuthResult {
    return {
      success: false,
      error
    };
  }

  private handleError(error: any, operation: string): AuthResult {
    logger.error(`Auth error in ${operation}:`, error);
    
    const authError: AuthError = {
      code: error.code || AUTH_ERROR_CODES.INTERNAL_ERROR,
      message: error.message || 'An unexpected error occurred',
      details: error
    };

    return this.createErrorResult(authError);
  }

  // ============================================================================
  // VALIDATION METHODS
  // ============================================================================

  private validateLoginData(data: LoginData): { valid: boolean; error?: AuthError } {
    if (!data.email || !data.password) {
      return {
        valid: false,
        error: {
          code: AUTH_ERROR_CODES.VALIDATION_ERROR,
          message: 'Email and password are required'
        }
      };
    }

    if (!this.isValidEmail(data.email)) {
      return {
        valid: false,
        error: {
          code: AUTH_ERROR_CODES.INVALID_EMAIL,
          message: 'Invalid email format'
        }
      };
    }

    return { valid: true };
  }

  private validateRegisterData(data: RegisterData): { valid: boolean; error?: AuthError } {
    if (!data.email || !data.password || !data.displayName || !data.username) {
      return {
        valid: false,
        error: {
          code: AUTH_ERROR_CODES.VALIDATION_ERROR,
          message: 'All required fields must be filled'
        }
      };
    }

    if (!this.isValidEmail(data.email)) {
      return {
        valid: false,
        error: {
          code: AUTH_ERROR_CODES.INVALID_EMAIL,
          message: 'Invalid email format'
        }
      };
    }

    if (data.password.length < 6) {
      return {
        valid: false,
        error: {
          code: AUTH_ERROR_CODES.WEAK_PASSWORD,
          message: 'Password must be at least 6 characters long'
        }
      };
    }

    if (!data.agreeTerms) {
      return {
        valid: false,
        error: {
          code: AUTH_ERROR_CODES.VALIDATION_ERROR,
          message: 'You must agree to the terms and conditions'
        }
      };
    }

    return { valid: true };
  }

  private validateEmail(email: string): { valid: boolean; error?: AuthError } {
    if (!email) {
      return {
        valid: false,
        error: {
          code: AUTH_ERROR_CODES.VALIDATION_ERROR,
          message: 'Email is required'
        }
      };
    }

    if (!this.isValidEmail(email)) {
      return {
        valid: false,
        error: {
          code: AUTH_ERROR_CODES.INVALID_EMAIL,
          message: 'Invalid email format'
        }
      };
    }

    return { valid: true };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // ============================================================================
  // DATABASE INTEGRATION METHODS (TO BE IMPLEMENTED)
  // ============================================================================

  private async createUserProfile(firebaseUser: any, userData: RegisterData): Promise<AppUser> {
    // This would integrate with your database
    // For now, return a mock user
    const user: AppUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      emailVerified: firebaseUser.emailVerified,
      displayName: userData.displayName,
      photoURL: firebaseUser.photoURL,
      phoneNumber: firebaseUser.phoneNumber,
      role: 'user',
      permissions: ROLE_PERMISSIONS.user,
      profileComplete: false,
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        location: userData.location,
        bio: userData.bio,
        willingToRelocate: userData.willingToRelocate || false,
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
        notificationPreference: true
      }
    };

    // Cache the new user
    await cacheUserData(user.uid, user, 3600);
    
    return user;
  }

  private async fetchUserFromDatabase(userId: string): Promise<AppUser | null> {
    // This would query your database
    // For now, return null
    return null;
  }

  private async fetchUserFromDatabaseByEmail(email: string): Promise<AppUser | null> {
    // This would query your database
    // For now, return null
    return null;
  }

  private async updateUserProfile(userId: string, updates: UserUpdate): Promise<AppUser | null> {
    // This would update your database
    // For now, return null
    return null;
  }

  private async deleteUserProfile(userId: string): Promise<void> {
    // This would delete from your database
  }

  private async updateLastLogin(userId: string): Promise<void> {
    // This would update last login timestamp in database
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const enhancedAuthService = new EnhancedAuthService();