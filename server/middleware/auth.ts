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

function extractBearerToken(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const [scheme, token, ...extra] = authHeader.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== 'bearer' || !token || extra.length > 0) {
    return null;
  }

  return token;
}

export const verifyFirebaseToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = extractBearerToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token, true);
    (req as AuthenticatedRequest).user = {
      ...decodedToken,
      uid: decodedToken.uid,
      email: typeof decodedToken.email === 'string' ? decodedToken.email : undefined,
      role: typeof decodedToken.role === 'string' ? decodedToken.role : undefined,
    };
    next();
  } catch (error: any) {
    if (error instanceof Error && /unavailable/i.test(error.message)) {
      return res.status(503).json({ error: 'Authentication service unavailable' });
    }

    const code = typeof error?.code === 'string' ? error.code : '';
    if (code.includes('id-token-expired')) {
      return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }

    if (code.includes('id-token-revoked')) {
      return res.status(401).json({ error: 'Session revoked. Please sign in again.' });
    }

    return res.status(401).json({ error: 'Invalid authentication token' });
  }
};

export const authenticate = verifyFirebaseToken;

export const authorize = (requiredRoles: string[] = ['admin']) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.role || !requiredRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: `Requires one of these roles: ${requiredRoles.join(', ')}` });
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
  if ((req as AuthenticatedRequest).user?.role !== 'admin') {
    return res
      .status(403)
      .json({ error: 'Forbidden: You do not have permission to perform this action' });
  }
  next();
};
