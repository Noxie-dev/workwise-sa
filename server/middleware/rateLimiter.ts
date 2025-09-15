import { Request, Response, NextFunction } from 'express';
import { Errors } from './errorHandler';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Simple in-memory rate limiter middleware
 * @param maxRequests Maximum number of requests allowed
 * @param windowMs Time window in seconds
 * @returns Express middleware function
 */
export const rateLimiter = (maxRequests: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - (windowMs * 1000);

    // Clean up old entries
    if (store[key] && store[key].resetTime < windowStart) {
      delete store[key];
    }

    // Initialize or update counter
    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + (windowMs * 1000)
      };
    } else {
      store[key].count++;
    }

    // Check if limit exceeded
    if (store[key].count > maxRequests) {
      return next(Errors.rateLimited(`Too many requests. Limit: ${maxRequests} per ${windowMs} seconds`));
    }

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': Math.max(0, maxRequests - store[key].count).toString(),
      'X-RateLimit-Reset': new Date(store[key].resetTime).toISOString()
    });

    next();
  };
};

export default rateLimiter;
