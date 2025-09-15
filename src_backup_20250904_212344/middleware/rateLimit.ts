// src/middleware/rateLimit.ts
import { Request, Response, NextFunction } from 'express';
import { Errors } from '../../server/middleware/errorHandler';

interface RateLimitOptions {
  windowMs: number;       // Time window in milliseconds
  maxRequests: number;    // Maximum number of requests allowed in the window
  message?: string;       // Custom message to send when rate limit is exceeded
  statusCode?: number;    // Status code to send when rate limit is exceeded
  keyGenerator?: (req: Request) => string; // Function to generate a unique key for the request
  skip?: (req: Request) => boolean;        // Function to determine if rate limiting should be skipped
  headers?: boolean;      // Whether to add rate limit headers to responses
}

// In-memory store for rate limiting
// In production, this should be replaced with Redis or another distributed store
const rateLimitStore: Record<string, { count: number, resetTime: number }> = {};

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const key in rateLimitStore) {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  }
}, 60000); // Clean up every minute

/**
 * Rate limiting middleware factory
 * @param options Rate limiting options
 */
export const rateLimit = (options: RateLimitOptions) => {
  const {
    windowMs = 60000, // Default: 1 minute
    maxRequests = 100, // Default: 100 requests per minute
    message = 'Too many requests, please try again later',
    statusCode = 429,
    headers = true,
    keyGenerator = (req: Request) => {
      // Default: IP address + route
      return `${req.ip}:${req.originalUrl}`;
    },
    skip = (req: Request) => false // Default: don't skip any requests
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting if specified
    if (skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();

    // Initialize or reset if window has expired
    if (!rateLimitStore[key] || rateLimitStore[key].resetTime < now) {
      rateLimitStore[key] = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    // Increment request count
    rateLimitStore[key].count += 1;
    const current = rateLimitStore[key].count;
    const remaining = Math.max(0, maxRequests - current);
    const resetTime = rateLimitStore[key].resetTime;

    // Set rate limit headers if enabled
    if (headers) {
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', remaining.toString());
      res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
    }

    // If rate limit exceeded
    if (current > maxRequests) {
      if (headers) {
        res.setHeader('Retry-After', Math.ceil((resetTime - now) / 1000).toString());
      }
      
      return next(Errors.validation(message, { 
        retryAfter: Math.ceil((resetTime - now) / 1000),
        limit: maxRequests,
        windowMs
      }));
    }

    next();
  };
};

/**
 * Predefined rate limiters for common scenarios
 */
export const rateLimiters = {
  // General API rate limiter (100 requests per minute)
  general: rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 100,
    message: 'Too many requests, please try again later'
  }),
  
  // Strict rate limiter for sensitive operations (10 requests per minute)
  strict: rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: 'Too many sensitive operations, please try again later'
  }),
  
  // Authentication rate limiter (20 requests per minute)
  auth: rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 20,
    message: 'Too many authentication attempts, please try again later',
    keyGenerator: (req: Request) => `auth:${req.ip}`
  }),
  
  // AI operations rate limiter (5 requests per minute)
  ai: rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 5,
    message: 'Too many AI operations, please try again later'
  })
};
