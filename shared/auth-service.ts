/**
 * Centralized Authentication Service
 * This service provides a unified interface for all authentication operations
 * across the application, handling both client and server-side authentication.
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
} from './auth-types';

// ============================================================================
// AUTHENTICATION SERVICE INTERFACE
// ============================================================================

export interface IAuthService {
  // Authentication methods
  login(email: string, password: string, rememberMe?: boolean): Promise<AuthResult>;
  loginWithGoogle(): Promise<AuthResult>;
  loginWithEmailLink(email: string): Promise<AuthResult>;
  register(userData: RegisterData): Promise<AuthResult>;
  logout(): Promise<AuthResult>;
  resetPassword(email: string): Promise<AuthResult>;
  
  // User management
  getCurrentUser(): Promise<AppUser | null>;
  updateUser(updates: UserUpdate): Promise<AuthResult>;
  deleteUser(): Promise<AuthResult>;
  
  // Token management
  getToken(): Promise<string | null>;
  refreshToken(): Promise<string | null>;
  verifyToken(token: string): Promise<AppUser | null>;
  
  // Authorization
  hasPermission(permission: Permission): boolean;
  hasRole(role: UserRole): boolean;
  checkAccess(permissions: Permission[], roles?: UserRole[]): boolean;
  
  // Utility methods
  isAuthenticated(): boolean;
  isAdmin(): boolean;
  getUserId(): string | null;
  getUserRole(): UserRole | null;
}

// ============================================================================
// AUTHENTICATION SERVICE IMPLEMENTATION
// ============================================================================

export class AuthService implements IAuthService {
  private currentUser: AppUser | null = null;
  private token: string | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeService();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private async initializeService(): Promise<void> {
    try {
      // Check for existing session
      const storedToken = this.getStoredToken();
      if (storedToken) {
        const user = await this.verifyToken(storedToken);
        if (user) {
          this.currentUser = user;
          this.token = storedToken;
          this.startTokenRefresh();
        } else {
          this.clearStoredToken();
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth service:', error);
      this.clearStoredToken();
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

      // Perform login (this would integrate with your Firebase client)
      const result = await this.performLogin(email, password);
      
      if (result.success && result.user) {
        this.currentUser = result.user;
        this.token = result.token;
        
        // Store token if remember me is enabled
        if (rememberMe) {
          this.storeToken(result.token);
        }
        
        this.startTokenRefresh();
      }
      
      return result;
    } catch (error) {
      return this.handleError(error, 'login');
    }
  }

  async loginWithGoogle(): Promise<AuthResult> {
    try {
      const result = await this.performGoogleLogin();
      
      if (result.success && result.user) {
        this.currentUser = result.user;
        this.token = result.token;
        this.storeToken(result.token);
        this.startTokenRefresh();
      }
      
      return result;
    } catch (error) {
      return this.handleError(error, 'google-login');
    }
  }

  async loginWithEmailLink(email: string): Promise<AuthResult> {
    try {
      const validation = this.validateEmail(email);
      if (!validation.valid) {
        return this.createErrorResult(validation.error!);
      }

      const result = await this.performEmailLinkLogin(email);
      return result;
    } catch (error) {
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

      // Perform registration
      const result = await this.performRegistration(userData);
      
      if (result.success && result.user) {
        this.currentUser = result.user;
        this.token = result.token;
        this.storeToken(result.token);
        this.startTokenRefresh();
      }
      
      return result;
    } catch (error) {
      return this.handleError(error, 'registration');
    }
  }

  async logout(): Promise<AuthResult> {
    try {
      // Perform logout
      await this.performLogout();
      
      // Clear local state
      this.currentUser = null;
      this.token = null;
      this.clearStoredToken();
      this.stopTokenRefresh();
      
      return this.createSuccessResult('Logged out successfully');
    } catch (error) {
      return this.handleError(error, 'logout');
    }
  }

  async resetPassword(email: string): Promise<AuthResult> {
    try {
      const validation = this.validateEmail(email);
      if (!validation.valid) {
        return this.createErrorResult(validation.error!);
      }

      const result = await this.performPasswordReset(email);
      return result;
    } catch (error) {
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

    // Try to get user from token
    const token = this.getStoredToken();
    if (token) {
      const user = await this.verifyToken(token);
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

      const result = await this.performUserUpdate(updates);
      
      if (result.success && result.user) {
        this.currentUser = result.user;
      }
      
      return result;
    } catch (error) {
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

      const result = await this.performUserDeletion();
      
      if (result.success) {
        this.currentUser = null;
        this.token = null;
        this.clearStoredToken();
        this.stopTokenRefresh();
      }
      
      return result;
    } catch (error) {
      return this.handleError(error, 'user-deletion');
    }
  }

  // ============================================================================
  // TOKEN MANAGEMENT
  // ============================================================================

  async getToken(): Promise<string | null> {
    if (this.token) {
      return this.token;
    }

    const storedToken = this.getStoredToken();
    if (storedToken) {
      const user = await this.verifyToken(storedToken);
      if (user) {
        this.token = storedToken;
        return storedToken;
      }
    }

    return null;
  }

  async refreshToken(): Promise<string | null> {
    try {
      if (!this.currentUser) {
        return null;
      }

      const newToken = await this.performTokenRefresh();
      if (newToken) {
        this.token = newToken;
        this.storeToken(newToken);
        return newToken;
      }

      return null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  async verifyToken(token: string): Promise<AppUser | null> {
    try {
      const result = await this.performTokenVerification(token);
      return result;
    } catch (error) {
      console.error('Token verification failed:', error);
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
    return this.currentUser !== null && this.token !== null;
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

  private startTokenRefresh(): void {
    this.stopTokenRefresh();
    
    // Refresh token every 50 minutes (tokens typically expire in 1 hour)
    this.refreshTimer = setInterval(async () => {
      await this.refreshToken();
    }, 50 * 60 * 1000);
  }

  private stopTokenRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private storeToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  private getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private clearStoredToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
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
    console.error(`Auth error in ${operation}:`, error);
    
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

    if (data.password !== data.confirmPassword) {
      return {
        valid: false,
        error: {
          code: AUTH_ERROR_CODES.VALIDATION_ERROR,
          message: 'Passwords do not match'
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
  // FIREBASE INTEGRATION METHODS (TO BE IMPLEMENTED)
  // ============================================================================

  private async performLogin(email: string, password: string): Promise<AuthResult> {
    // This would integrate with Firebase Auth
    // For now, return a placeholder
    throw new Error('Firebase integration not implemented');
  }

  private async performGoogleLogin(): Promise<AuthResult> {
    // This would integrate with Firebase Auth Google provider
    throw new Error('Firebase integration not implemented');
  }

  private async performEmailLinkLogin(email: string): Promise<AuthResult> {
    // This would integrate with Firebase Auth email link
    throw new Error('Firebase integration not implemented');
  }

  private async performRegistration(userData: RegisterData): Promise<AuthResult> {
    // This would integrate with Firebase Auth
    throw new Error('Firebase integration not implemented');
  }

  private async performLogout(): Promise<void> {
    // This would integrate with Firebase Auth
    throw new Error('Firebase integration not implemented');
  }

  private async performPasswordReset(email: string): Promise<AuthResult> {
    // This would integrate with Firebase Auth
    throw new Error('Firebase integration not implemented');
  }

  private async performUserUpdate(updates: UserUpdate): Promise<AuthResult> {
    // This would integrate with your backend API
    throw new Error('Backend integration not implemented');
  }

  private async performUserDeletion(): Promise<AuthResult> {
    // This would integrate with your backend API
    throw new Error('Backend integration not implemented');
  }

  private async performTokenRefresh(): Promise<string | null> {
    // This would integrate with Firebase Auth
    throw new Error('Firebase integration not implemented');
  }

  private async performTokenVerification(token: string): Promise<AppUser | null> {
    // This would integrate with Firebase Admin SDK
    throw new Error('Firebase integration not implemented');
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const authService = new AuthService();