/**
 * Centralized Authentication Types and Interfaces
 * This file contains all authentication-related type definitions
 * used across the application for consistency and type safety.
 */

import { User as FirebaseUser } from 'firebase/auth';

// ============================================================================
// CORE AUTH TYPES
// ============================================================================

/**
 * User roles in the system
 */
export type UserRole = 'user' | 'admin' | 'moderator' | 'employer';

/**
 * Authentication providers supported by the system
 */
export type AuthProvider = 'email' | 'google' | 'email-link';

/**
 * Authentication status
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

/**
 * Permission types for role-based access control
 */
export type Permission = 
  | 'dashboard:view'
  | 'profile:view'
  | 'profile:edit'
  | 'jobs:view'
  | 'jobs:apply'
  | 'jobs:create'
  | 'jobs:edit'
  | 'jobs:delete'
  | 'admin:view'
  | 'admin:users'
  | 'admin:settings'
  | 'admin:analytics'
  | 'admin:content'
  | 'admin:security'
  | 'marketing:view'
  | 'marketing:edit'
  | 'notifications:view'
  | 'notifications:send';

// ============================================================================
// USER INTERFACES
// ============================================================================

/**
 * Core user interface that extends Firebase user with additional properties
 */
export interface AppUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  role: UserRole;
  permissions: Permission[];
  profileComplete: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  metadata: UserMetadata;
}

/**
 * User metadata for additional information
 */
export interface UserMetadata {
  location?: string;
  bio?: string;
  willingToRelocate: boolean;
  preferences: UserPreferences;
  experience: UserExperience;
  education: UserEducation;
  skills: string[];
  engagementScore: number;
  notificationPreference: boolean;
}

/**
 * User preferences for job matching
 */
export interface UserPreferences {
  preferredCategories: number[];
  preferredLocations: string[];
  preferredJobTypes: string[];
  minSalary?: number;
  maxSalary?: number;
  workMode: ('remote' | 'on-site' | 'hybrid')[];
}

/**
 * User experience information
 */
export interface UserExperience {
  yearsOfExperience: number;
  currentPosition?: string;
  currentCompany?: string;
  previousPositions: Array<{
    title: string;
    company: string;
    startDate: Date;
    endDate?: Date;
    description?: string;
  }>;
}

/**
 * User education information
 */
export interface UserEducation {
  highestDegree: string;
  fieldOfStudy: string;
  institution: string;
  graduationYear?: number;
  additionalCertifications: string[];
}

// ============================================================================
// AUTHENTICATION INTERFACES
// ============================================================================

/**
 * Authentication context interface
 */
export interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  status: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasPermission: (permission: Permission) => boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  loginWithGoogle: () => Promise<AuthResult>;
  loginWithEmailLink: (email: string) => Promise<AuthResult>;
  register: (userData: RegisterData) => Promise<AuthResult>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updateProfile: (updates: Partial<AppUser>) => Promise<AuthResult>;
  refreshUser: () => Promise<void>;
}

/**
 * Registration data interface
 */
export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  username: string;
  location?: string;
  bio?: string;
  willingToRelocate?: boolean;
  agreeTerms: boolean;
}

/**
 * Login data interface
 */
export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// ============================================================================
// API RESPONSE INTERFACES
// ============================================================================

/**
 * Standard authentication result interface
 */
export interface AuthResult {
  success: boolean;
  message?: string;
  user?: AppUser;
  error?: AuthError;
  data?: any;
}

/**
 * Authentication error interface
 */
export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

// ============================================================================
// MIDDLEWARE INTERFACES
// ============================================================================

/**
 * Authenticated request interface for server middleware
 */
export interface AuthenticatedRequest {
  user?: AppUser;
  firebaseUser?: FirebaseUser;
  permissions?: Permission[];
  isAdmin?: boolean;
}

/**
 * Authorization options for middleware
 */
export interface AuthorizationOptions {
  requiredPermissions?: Permission[];
  requiredRole?: UserRole;
  allowSelf?: boolean;
  resourceOwnerField?: string;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Input validation schemas for authentication
 */
export interface AuthValidationSchemas {
  login: {
    email: string;
    password: string;
    rememberMe?: boolean;
  };
  register: {
    email: string;
    password: string;
    confirmPassword: string;
    displayName: string;
    username: string;
    location?: string;
    bio?: string;
    willingToRelocate?: boolean;
    agreeTerms: boolean;
  };
  resetPassword: {
    email: string;
  };
  updateProfile: {
    displayName?: string;
    location?: string;
    bio?: string;
    willingToRelocate?: boolean;
    preferences?: Partial<UserPreferences>;
  };
}

// ============================================================================
// CONFIGURATION INTERFACES
// ============================================================================

/**
 * Authentication configuration interface
 */
export interface AuthConfig {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  providers: {
    email: boolean;
    google: boolean;
    emailLink: boolean;
  };
  security: {
    passwordMinLength: number;
    requireEmailVerification: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
  };
  features: {
    rememberMe: boolean;
    passwordReset: boolean;
    profileCompletion: boolean;
    roleBasedAccess: boolean;
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type guard to check if a user has a specific role
 */
export type UserWithRole<T extends UserRole> = AppUser & { role: T };

/**
 * Type for partial user updates
 */
export type UserUpdate = Partial<Pick<AppUser, 'displayName' | 'photoURL' | 'phoneNumber'>> & {
  metadata?: Partial<UserMetadata>;
};

/**
 * Type for user creation
 */
export type UserCreate = Pick<AppUser, 'uid' | 'email' | 'displayName' | 'role'> & {
  metadata?: Partial<UserMetadata>;
};

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default permissions for each role
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [
    'dashboard:view',
    'profile:view',
    'profile:edit',
    'jobs:view',
    'jobs:apply',
    'notifications:view'
  ],
  moderator: [
    'dashboard:view',
    'profile:view',
    'profile:edit',
    'jobs:view',
    'jobs:apply',
    'jobs:create',
    'jobs:edit',
    'admin:content',
    'notifications:view'
  ],
  employer: [
    'dashboard:view',
    'profile:view',
    'profile:edit',
    'jobs:view',
    'jobs:create',
    'jobs:edit',
    'jobs:delete',
    'notifications:view',
    'notifications:send'
  ],
  admin: [
    'dashboard:view',
    'profile:view',
    'profile:edit',
    'jobs:view',
    'jobs:apply',
    'jobs:create',
    'jobs:edit',
    'jobs:delete',
    'admin:view',
    'admin:users',
    'admin:settings',
    'admin:analytics',
    'admin:content',
    'admin:security',
    'marketing:view',
    'marketing:edit',
    'notifications:view',
    'notifications:send'
  ]
};

/**
 * Authentication error codes
 */
export const AUTH_ERROR_CODES = {
  // Firebase Auth errors
  USER_NOT_FOUND: 'auth/user-not-found',
  WRONG_PASSWORD: 'auth/wrong-password',
  EMAIL_ALREADY_IN_USE: 'auth/email-already-in-use',
  WEAK_PASSWORD: 'auth/weak-password',
  INVALID_EMAIL: 'auth/invalid-email',
  TOO_MANY_REQUESTS: 'auth/too-many-requests',
  NETWORK_REQUEST_FAILED: 'auth/network-request-failed',
  OPERATION_NOT_ALLOWED: 'auth/operation-not-allowed',
  POPUP_CLOSED_BY_USER: 'auth/popup-closed-by-user',
  POPUP_BLOCKED: 'auth/popup-blocked',
  CANCELLED_POPUP_REQUEST: 'auth/cancelled-popup-request',
  
  // Custom application errors
  INVALID_TOKEN: 'auth/invalid-token',
  TOKEN_EXPIRED: 'auth/token-expired',
  INSUFFICIENT_PERMISSIONS: 'auth/insufficient-permissions',
  PROFILE_INCOMPLETE: 'auth/profile-incomplete',
  ACCOUNT_DISABLED: 'auth/account-disabled',
  EMAIL_NOT_VERIFIED: 'auth/email-not-verified',
  VALIDATION_ERROR: 'auth/validation-error',
  INTERNAL_ERROR: 'auth/internal-error'
} as const;

export type AuthErrorCode = typeof AUTH_ERROR_CODES[keyof typeof AUTH_ERROR_CODES];