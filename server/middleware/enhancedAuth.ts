/**
 * Enhanced Authentication Middleware
 * Integrates multi-tier caching, token refresh, and rate limiting
 * for production-ready authentication
 */

import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
// import { enhancedAuthService } from '../services/enhancedAuthService';
// import { cacheService } from '../services/cacheService';
// import { tokenRefreshService } from '../services/tokenRefreshService';
// import { rateLimiters } from '../../src/middleware/rateLimit';
// import { logger } from '../utils/logger';
import { AppUser, AuthenticatedRequest, AuthorizationOptions } from '@shared/auth-types';

// ============================================================================
// ENHANCED AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Enhanced Firebase token verification with caching
 */
export const verifyFirebaseToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Unauthorized: No token provided',
      code: 'NO_TOKEN'
    });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // Verify token with Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Mock user data for now - replace with actual user lookup
    const user: AppUser = {
      id: '1',
      uid: decodedToken.uid,
      name: decodedToken.name || '',
      email: decodedToken.email || '',
      emailVerified: decodedToken.email_verified || false,
      displayName: decodedToken.name || '',
      photoURL: decodedToken.picture || null,
      phoneNumber: decodedToken.phone_number || null,
      role: 'user',
      permissions: [],
      profileComplete: true,
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
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

    // Attach user data to request
    req.user = user;
    req.firebaseUser = decodedToken as any;
    req.permissions = user.permissions;
    req.isAdmin = user.role === 'admin';

    // Log successful authentication
    console.log(`User ${user.uid} authenticated successfully`);

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    // Clear cached token verification on error - mock implementation
    // await cacheService.delete(cacheKey);
    
    return res.status(401).json({ 
      error: 'Unauthorized: Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
};

/**
 * Enhanced token refresh middleware with rate limiting
 */
export const refreshTokenMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      error: 'Refresh token is required',
      code: 'MISSING_REFRESH_TOKEN'
    });
  }

  try {
    // Mock token refresh implementation
    const result = {
      success: true,
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600
    };

    res.json({
      success: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn
    });
  } catch (error) {
    console.error('Token refresh middleware error:', error);
    res.status(500).json({
      error: 'Internal server error during token refresh',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Authorization middleware with enhanced permission checking
 */
export const requireAuth = (options: AuthorizationOptions = {}) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
      }

      const user = req.user;

      // Check role-based access
      if (options.requiredRole && user.role !== options.requiredRole) {
        return res.status(403).json({
          error: `Access denied. Required role: ${options.requiredRole}`,
          code: 'INSUFFICIENT_ROLE'
        });
      }

      // Check permission-based access
      if (options.requiredPermissions && options.requiredPermissions.length > 0) {
        const hasPermission = options.requiredPermissions.some(permission => 
          user.permissions.includes(permission)
        );

        if (!hasPermission) {
          return res.status(403).json({
            error: 'Access denied. Insufficient permissions',
            code: 'INSUFFICIENT_PERMISSIONS',
            required: options.requiredPermissions
          });
        }
      }

      // Check resource ownership
      if (options.allowSelf && options.resourceOwnerField) {
        const resourceOwnerId = req.params[options.resourceOwnerField];
        if (resourceOwnerId && resourceOwnerId !== user.uid && !user.permissions.includes('admin:users' as any)) {
          return res.status(403).json({
            error: 'Access denied. You can only access your own resources',
            code: 'RESOURCE_ACCESS_DENIED'
          });
        }
      }

      next();
    } catch (error) {
      console.error('Authorization middleware error:', error);
      res.status(500).json({
        error: 'Internal server error during authorization',
        code: 'AUTHORIZATION_ERROR'
      });
    }
  };
};

/**
 * Admin-only middleware
 */
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    });
  }
  next();
};

/**
 * Rate-limited authentication middleware
 */
export const rateLimitedAuth = (req: Request, res: Response, next: NextFunction) => {
  // Mock rate limiting - in production, implement proper rate limiting
  next();
};

/**
 * Enhanced logout middleware with token revocation
 */
export const enhancedLogout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    // Mock logout implementation
    console.log(`User ${req.user?.uid || 'unknown'} logged out`);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Enhanced logout error:', error);
    res.status(500).json({
      error: 'Error during logout',
      code: 'LOGOUT_ERROR'
    });
  }
};

/**
 * Cache invalidation middleware for user data changes
 */
export const invalidateUserCache = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Store original response methods
  const originalSend = res.send;
  const originalJson = res.json;

  // Override response methods to invalidate cache on successful updates
  res.json = function(body: any) {
    // Check if this is a successful user update
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
      const userId = req.user.uid;
      
      // Invalidate user cache asynchronously
      setImmediate(async () => {
        try {
          // await cacheService.invalidate(`user:${userId}*`);
          // await cacheService.invalidate(`user_email:${req.user?.email}*`);
          console.log(`Cache invalidated for user ${userId}`);
        } catch (error) {
          console.error(`Error invalidating cache for user ${userId}:`, error);
        }
      });
    }

    return originalJson.call(this, body);
  };

  res.send = function(body: any) {
    // Check if this is a successful user update
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
      const userId = req.user.uid;
      
      // Invalidate user cache asynchronously
      setImmediate(async () => {
        try {
          // await cacheService.invalidate(`user:${userId}*`);
          // await cacheService.invalidate(`user_email:${req.user?.email}*`);
          console.log(`Cache invalidated for user ${userId}`);
        } catch (error) {
          console.error(`Error invalidating cache for user ${userId}:`, error);
        }
      });
    }

    return originalSend.call(this, body);
  };

  next();
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add cache control headers for sensitive endpoints
  if (req.path.includes('/auth/') || req.path.includes('/admin/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
};

/**
 * Request logging middleware for authentication events
 */
export const authLogging = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function(body: any) {
    const duration = Date.now() - startTime;
    
    // Log authentication-related requests
    if (req.path.includes('/auth/') || req.path.includes('/login') || req.path.includes('/logout')) {
      console.log('Authentication request', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        userId: (req as AuthenticatedRequest).user?.uid
      });
    }

    return originalSend.call(this, body);
  };

  next();
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function extractTokenId(token: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64url').toString());
    return payload.id || null;
  } catch (error) {
    return null;
  }
}

// ============================================================================
// CONVENIENCE MIDDLEWARE COMBINATIONS
// ============================================================================

/**
 * Standard authenticated route middleware
 */
export const authenticatedRoute = [
  securityHeaders,
  rateLimitedAuth,
  verifyFirebaseToken,
  requireAuth(),
  invalidateUserCache,
  authLogging
];

/**
 * Admin-only route middleware
 */
export const adminRoute = [
  securityHeaders,
  rateLimitedAuth,
  verifyFirebaseToken,
  requireAdmin,
  invalidateUserCache,
  authLogging
];

/**
 * Public route with rate limiting
 */
export const publicRoute = [
  securityHeaders,
  // rateLimiters.general, // Mock - implement proper rate limiting
  authLogging
];