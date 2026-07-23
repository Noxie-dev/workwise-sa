
import { Request, Response, NextFunction } from 'express';
import { auth } from '../firebase';
import { resolveAuthenticatedDatabaseUser } from '../services/authenticatedUser';

export type AuthenticatedRequest = Request & {
  user?: {
    uid: string;
    email?: string;
    role?: string;
    userId?: number;
  };
};

export const verifyFirebaseToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(token);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    if (error instanceof Error && /unavailable/i.test(error.message)) {
      return res.status(503).json({ error: 'Authentication service unavailable' });
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const authenticate = verifyFirebaseToken;

export const authorize = (requiredRoles: string[] = ['admin']) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const dbUser = await resolveAuthenticatedDatabaseUser(req.user);
      if (!requiredRoles.includes(dbUser.role ?? 'user')) {
        return res.status(403).json({ error: `Requires one of these roles: ${requiredRoles.join(', ')}` });
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export const authorizeOwnership = (userIdParam: string = 'userId') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const resourceUserId = Number.parseInt(req.params[userIdParam], 10);
    if (Number.isNaN(resourceUserId)) {
      return res.status(400).json({ error: 'Invalid owner ID' });
    }

    try {
      const dbUser = await resolveAuthenticatedDatabaseUser(req.user);
      if (dbUser.role === 'admin' || dbUser.id === resourceUserId) {
        return next();
      }

      return res.status(403).json({ error: 'You can only access your own resources' });
    } catch (error) {
      return next(error);
    }
  };
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if ((req as any).user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to perform this action' });
  }
  next();
};
