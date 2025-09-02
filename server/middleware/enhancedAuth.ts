/**
 * Enhanced Authentication Middleware
 * Integrates multi-tier caching, token refresh, and rate limiting
 * for production-ready authentication
 */

import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { enhancedAuthService } from '../services/enhancedAuthService';
import { cacheService } from '../services/cacheService';
import { tokenRefreshService } from '../services/tokenRefreshService';
import { rateLimiters } from '../../src/middleware/rateLimit';
import { logger } from '../utils/logger';
import { AppUser, AuthenticatedRequest, AuthorizationOptions } from '../../shared/auth-types';

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
    // Check cache first for token verification
    const cacheKey = `token_verify:${token}`;
    let decodedToken = await cacheService.get<any>(cacheKey);
    
    if (!decodedToken) {
      // Verify token with Firebase Admin SDK
      decodedToken = await admin.auth().verifyIdToken(token);
      
      // Cache the verification result for 5 minutes
      await cacheService.set(cacheKey, decodedToken, { ttl: 300 });
    }

    // Get user data from cache or database
    const user = await enhancedAuthService.getCurrentUser();
    if (!user) {
      return res.status(401).json({ 
        error: 'Unauthorized: User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Attach user data to request
    req.user = user;
    req.firebaseUser = decodedToken;
    req.permissions = user.permissions;
    req.isAdmin = user.role === 'admin';

    // Log successful authentication
    logger.info(`User ${user.uid} authenticated successfully`, {
      userId: user.uid,
      email: user.email,
      role: user.role,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    next();
  } catch (error) {
    logger.error('Token verification error:', error);
    
    // Clear cached token verification on error
    const cacheKey = `token_verify:${token}`;
    await cacheService.delete(cacheKey);
    
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
    // Apply rate limiting for token refresh
    const rateLimitKey = `refresh_limit:${req.ip}`;
    const attempts = await cacheService.get<number[]>(rateLimitKey) || [];
    const now = Date.now();
    const recentAttempts = attempts.filter(t => now - t < 60 * 1000); // Last minute

    if (recentAttempts.length >= 10) { // Max 10 refresh attempts per minute
      return res.status(429).json({
        error: 'Too many refresh attempts. Please try again later.',
        code: 'RATE_LIMITED',
        retryAfter: 60
      });
    }

    // Record this attempt
    attempts.push(now);
    await cacheService.set(rateLimitKey, attempts, { ttl: 60 });

    // Attempt token refresh
    const result = await tokenRefreshService.refreshToken(refreshToken, {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || 'unknown',
      deviceId: req.headers['x-device-id'] as string
    });

    if (result.success) {
      res.json({
        success: true,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn
      });
    } else {
      res.status(401).json({
        error: result.error?.message || 'Token refresh failed',
        code: result.error?.code || 'REFRESH_FAILED'
      });
    }
  } catch (error) {
    logger.error('Token refresh middleware error:', error);
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
      logger.error('Authorization middleware error:', error);
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
  // Apply general rate limiting
  rateLimiters.auth(req, res, (err) => {
    if (err) {
      return res.status(429).json({
        error: 'Too many authentication attempts',
        code: 'RATE_LIMITED'
      });
    }
    next();
  });
};

/**
 * Enhanced logout middleware with token revocation
 */
export const enhancedLogout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Revoke the specific refresh token
      const tokenId = extractTokenId(refreshToken);
      if (tokenId) {
        await tokenRefreshService.revokeToken(tokenId, 'USER_LOGOUT');
      }
    } else if (req.user) {
      // Revoke all tokens for the user
      await tokenRefreshService.revokeAllUserTokens(req.user.uid, 'USER_LOGOUT');
    }

    // Clear user cache
    if (req.user) {
      await cacheService.invalidate(`user:${req.user.uid}*`);
    }

    // Log logout
    logger.info(`User ${req.user?.uid || 'unknown'} logged out`, {
      userId: req.user?.uid,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Enhanced logout error:', error);
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
          await cacheService.invalidate(`user:${userId}*`);
          await cacheService.invalidate(`user_email:${req.user?.email}*`);
          logger.info(`Cache invalidated for user ${userId}`);
        } catch (error) {
          logger.error(`Error invalidating cache for user ${userId}:`, error);
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
          await cacheService.invalidate(`user:${userId}*`);
          await cacheService.invalidate(`user_email:${req.user?.email}*`);
          logger.info(`Cache invalidated for user ${userId}`);
        } catch (error) {
          logger.error(`Error invalidating cache for user ${userId}:`, error);
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
      logger.info('Authentication request', {
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
  rateLimiters.general,
  authLogging
];