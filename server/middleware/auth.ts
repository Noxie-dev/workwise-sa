
import { Request, Response, NextFunction } from 'express';
import { auth } from '../firebase';

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
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.role || !requiredRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Requires one of these roles: ${requiredRoles.join(', ')}` });
    }

    next();
  };
};

export const authorizeOwnership = (userIdParam: string = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const resourceUserId = Number.parseInt(req.params[userIdParam], 10);
    if (req.user.role === 'admin' || req.user.userId === resourceUserId) {
      return next();
    }

    return res.status(403).json({ error: 'You can only access your own resources' });
  };
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if ((req as any).user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to perform this action' });
  }
  next();
};
