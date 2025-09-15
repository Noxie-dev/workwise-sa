/**
 * Enhanced Authentication Middleware
 * This middleware provides comprehensive authentication and authorization
 * with proper error handling, role-based access control, and security features.
 */

import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { Errors } from './errorHandler';
import { storage } from '../storage';
import { 
  AppUser, 
  AuthenticatedRequest, 
  AuthorizationOptions, 
  Permission,
  UserRole,
  ROLE_PERMISSIONS,
  AUTH_ERROR_CODES
} from '@shared/auth-types';

// ============================================================================
// ENHANCED AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Enhanced authentication middleware that verifies Firebase tokens
 * and enriches the request with comprehensive user information
 */
export const authenticate = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(Errors.authentication('Missing or invalid authorization header'));
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return next(Errors.authentication('Missing authentication token'));
    }
    
    // Verify the token with Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    if (!decodedToken.uid) {
      return next(Errors.authentication('Invalid token: missing user ID'));
    }
    
    // Get user information from database
    const userRecord = await storage.getUserByFirebaseId(decodedToken.uid);
    
    if (!userRecord) {
      return next(Errors.authentication('User not found in database'));
    }
    
    // Create comprehensive user object
    const appUser: AppUser = {
      id: userRecord.id.toString(),
      uid: decodedToken.uid,
      email: decodedToken.email || userRecord.email,
      emailVerified: decodedToken.email_verified || false,
      displayName: decodedToken.name || userRecord.name,
      name: decodedToken.name || userRecord.name,
      photoURL: decodedToken.picture || null,
      phoneNumber: decodedToken.phone_number || null,
      role: (userRecord.role as UserRole) || 'user',
      permissions: ROLE_PERMISSIONS[(userRecord.role as UserRole) || 'user'],
      profileComplete: isProfileComplete(userRecord),
      lastLoginAt: new Date(),
      createdAt: userRecord.createdAt || new Date(),
      updatedAt: new Date(),
      metadata: {
        location: userRecord.location || undefined,
        bio: userRecord.bio || undefined,
        willingToRelocate: false,
        preferences: {
          preferredCategories: [],
          preferredLocations: [],
          preferredJobTypes: [],
          workMode: ['remote']
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
    
    // Attach user information to request
    req.user = appUser;
    req.isAdmin = appUser.role === 'admin';
    req.permissions = appUser.permissions;
    
    // Update last active timestamp
    // Update last active timestamp (implement if needed)
    // await storage.updateUserLastActive(userRecord.id);
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    // Handle specific Firebase errors
    if ((error as any)?.code === 'auth/id-token-expired') {
      return next(Errors.authentication('Token has expired'));
    } else if ((error as any)?.code === 'auth/id-token-revoked') {
      return next(Errors.authentication('Token has been revoked'));
    } else if ((error as any)?.code === 'auth/invalid-id-token') {
      return next(Errors.authentication('Invalid token format'));
    }
    
    return next(Errors.authentication('Token verification failed'));
  }
};

// ============================================================================
// AUTHORIZATION MIDDLEWARE
// ============================================================================

/**
 * Enhanced authorization middleware with flexible permission and role checking
 */
export const authorize = (options: AuthorizationOptions = {}) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // Ensure user is authenticated
    if (!req.user) {
      return next(Errors.authentication('Authentication required'));
    }
    
    const { requiredPermissions = [], requiredRole, allowSelf = false, resourceOwnerField = 'userId' } = options;
    
    // Check role-based access
    if (requiredRole && req.user.role !== requiredRole) {
      // Allow admin to bypass role restrictions
      if (req.user.role !== 'admin') {
        return next(Errors.authorization(`Requires role: ${requiredRole}`));
      }
    }
    
    // Check permission-based access
    if (requiredPermissions.length > 0) {
      const hasRequiredPermission = requiredPermissions.some(permission => 
        req.user!.permissions.includes(permission)
      );
      
      if (!hasRequiredPermission) {
        return next(Errors.authorization(`Requires one of these permissions: ${requiredPermissions.join(', ')}`));
      }
    }
    
    // Check resource ownership
    if (allowSelf) {
      const resourceUserId = parseInt(req.params[resourceOwnerField]);
      
      // Allow admin to access any resource
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Check if user is accessing their own resource
      if (isNaN(resourceUserId) || req.user.uid !== resourceUserId.toString()) {
        return next(Errors.authorization('You can only access your own resources'));
      }
    }
    
    next();
  };
};

// ============================================================================
// ROLE-SPECIFIC MIDDLEWARE
// ============================================================================

/**
 * Middleware to ensure user has admin role
 */
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(Errors.authentication('Authentication required'));
  }
  
  if (req.user.role !== 'admin') {
    return next(Errors.authorization('Admin access required'));
  }
  
  next();
};

/**
 * Middleware to ensure user has moderator or admin role
 */
export const requireModerator = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(Errors.authentication('Authentication required'));
  }
  
  if (!['admin', 'moderator'].includes(req.user.role)) {
    return next(Errors.authorization('Moderator or admin access required'));
  }
  
  next();
};

/**
 * Middleware to ensure user has employer or admin role
 */
export const requireEmployer = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(Errors.authentication('Authentication required'));
  }
  
  if (!['admin', 'employer'].includes(req.user.role)) {
    return next(Errors.authorization('Employer or admin access required'));
  }
  
  next();
};

// ============================================================================
// PERMISSION-SPECIFIC MIDDLEWARE
// ============================================================================

/**
 * Middleware factory for specific permissions
 */
export const requirePermission = (permission: Permission) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(Errors.authentication('Authentication required'));
    }
    
    if (!req.user.permissions.includes(permission)) {
      return next(Errors.authorization(`Requires permission: ${permission}`));
    }
    
    next();
  };
};

/**
 * Middleware factory for multiple permissions (user needs ALL permissions)
 */
export const requireAllPermissions = (permissions: Permission[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(Errors.authentication('Authentication required'));
    }
    
    const hasAllPermissions = permissions.every(permission => 
      req.user!.permissions.includes(permission)
    );
    
    if (!hasAllPermissions) {
      return next(Errors.authorization(`Requires all permissions: ${permissions.join(', ')}`));
    }
    
    next();
  };
};

/**
 * Middleware factory for multiple permissions (user needs ANY permission)
 */
export const requireAnyPermission = (permissions: Permission[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(Errors.authentication('Authentication required'));
    }
    
    const hasAnyPermission = permissions.some(permission => 
      req.user!.permissions.includes(permission)
    );
    
    if (!hasAnyPermission) {
      return next(Errors.authorization(`Requires any of these permissions: ${permissions.join(', ')}`));
    }
    
    next();
  };
};

// ============================================================================
// RESOURCE OWNERSHIP MIDDLEWARE
// ============================================================================

/**
 * Middleware to ensure user can only access their own resources
 */
export const requireOwnership = (userIdParam: string = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(Errors.authentication('Authentication required'));
    }
    
    const resourceUserId = parseInt(req.params[userIdParam]);
    
    // Allow admin to access any resource
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check if user is accessing their own resource
    if (isNaN(resourceUserId) || req.user.uid !== resourceUserId.toString()) {
      return next(Errors.authorization('You can only access your own resources'));
    }
    
    next();
  };
};

// ============================================================================
// PROFILE COMPLETION MIDDLEWARE
// ============================================================================

/**
 * Middleware to ensure user has completed their profile
 */
export const requireCompleteProfile = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(Errors.authentication('Authentication required'));
  }
  
  if (!req.user.profileComplete) {
    return next(Errors.authorization('Profile completion required'));
  }
  
  next();
};

// ============================================================================
// EMAIL VERIFICATION MIDDLEWARE
// ============================================================================

/**
 * Middleware to ensure user has verified their email
 */
export const requireEmailVerification = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(Errors.authentication('Authentication required'));
  }
  
  if (!req.user.emailVerified) {
    return next(Errors.authorization('Email verification required'));
  }
  
  next();
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================


/**
 * Check if user profile is complete
 */
function isProfileComplete(userRecord: any): boolean {
  const requiredFields = ['name', 'email', 'location'];
  
  return requiredFields.every(field => {
    const value = userRecord[field];
    return value && value.trim().length > 0;
  });
}


// ============================================================================
// EXPORTS
// ============================================================================
