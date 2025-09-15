// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { Errors } from '../../server/middleware/errorHandler';
import { db } from '../../server/db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Extended Request interface to include user information
export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: string;
    userId?: number;
  };
}

/**
 * Authentication middleware to verify Firebase token
 * and attach user information to the request
 */
export const authenticate = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(Errors.authentication('Missing or invalid authorization token'));
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return next(Errors.authentication('Missing token'));
    }
    
    // Verify the token with Firebase
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    if (!decodedToken.uid) {
      return next(Errors.authentication('Invalid token'));
    }
    
    // Attach basic user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
    
    // If we have a database, try to get additional user info
    try {
      // Find user by Firebase UID
      const [userRecord] = await db
        .select()
        .from(users)
        .where(eq(users.firebaseUid, decodedToken.uid));
      
      if (userRecord) {
        req.user.userId = userRecord.id;
        req.user.role = userRecord.role || 'user';
      }
    } catch (dbError) {
      console.error('Error fetching user from database:', dbError);
      // Continue even if database lookup fails
    }
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return next(Errors.authentication('Invalid or expired token'));
  }
};

/**
 * Authorization middleware to check if user has required role
 * @param requiredRoles Array of roles that are allowed to access the route
 */
export const authorize = (requiredRoles: string[] = ['admin']) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // First ensure user is authenticated
    if (!req.user) {
      return next(Errors.authentication('Authentication required'));
    }
    
    // Check if user has one of the required roles
    if (!req.user.role || !requiredRoles.includes(req.user.role)) {
      return next(Errors.authorization(`Requires one of these roles: ${requiredRoles.join(', ')}`));
    }
    
    next();
  };
};

/**
 * Middleware to ensure user is accessing only their own resources
 * @param userIdParam Name of the route parameter containing the user ID
 */
export const authorizeOwnership = (userIdParam: string = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // First ensure user is authenticated
    if (!req.user) {
      return next(Errors.authentication('Authentication required'));
    }
    
    const resourceUserId = parseInt(req.params[userIdParam]);
    
    // If user is admin, allow access regardless of ownership
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check if user is accessing their own resource
    if (isNaN(resourceUserId) || req.user.userId !== resourceUserId) {
      return next(Errors.authorization('You can only access your own resources'));
    }
    
    next();
  };
};
