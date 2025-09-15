import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

/**
 * Error types
 */
export enum ErrorType {
  VALIDATION = 'ValidationError',
  AUTHENTICATION = 'AuthenticationError',
  AUTHORIZATION = 'AuthorizationError',
  NOT_FOUND = 'NotFoundError',
  CONFLICT = 'ConflictError',
  INTERNAL = 'InternalServerError',
  EXTERNAL_SERVICE = 'ExternalServiceError',
  DATABASE = 'DatabaseError',
}

/**
 * Custom API error class
 */
export class ApiError extends Error {
  statusCode: number;
  type: ErrorType;
  details?: any;
  
  constructor(
    message: string, 
    statusCode: number = 500, 
    type: ErrorType = ErrorType.INTERNAL,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.details = details;
    this.name = this.constructor.name;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
  
  /**
   * Convert to a response object
   */
  toResponse() {
    return {
      error: {
        type: this.type,
        message: this.message,
        ...(this.details ? { details: this.details } : {})
      }
    };
  }
}

/**
 * Factory methods for common error types
 */
export const Errors = {
  validation: (message: string, details?: any) => 
    new ApiError(message, 400, ErrorType.VALIDATION, details),
    
  authentication: (message: string = 'Authentication required') => 
    new ApiError(message, 401, ErrorType.AUTHENTICATION),
    
  authorization: (message: string = 'Permission denied') => 
    new ApiError(message, 403, ErrorType.AUTHORIZATION),
    
  notFound: (message: string = 'Resource not found') => 
    new ApiError(message, 404, ErrorType.NOT_FOUND),
    
  conflict: (message: string = 'Resource already exists') => 
    new ApiError(message, 409, ErrorType.CONFLICT),
    
  internal: (message: string = 'Internal server error') => 
    new ApiError(message, 500, ErrorType.INTERNAL),
    
  externalService: (message: string, details?: any) => 
    new ApiError(message, 502, ErrorType.EXTERNAL_SERVICE, details),
    
  database: (message: string, details?: any) => 
    new ApiError(message, 500, ErrorType.DATABASE, details),
    
  forbidden: (message: string = 'Access forbidden') => 
    new ApiError(message, 403, ErrorType.AUTHORIZATION),
    
  rateLimited: (message: string = 'Rate limit exceeded') => 
    new ApiError(message, 429, ErrorType.VALIDATION),
    
  badRequest: (message: string = 'Bad request') => 
    new ApiError(message, 400, ErrorType.VALIDATION),
};

/**
 * Request ID middleware to add a unique ID to each request
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] || 
                   req.headers['x-correlation-id'] || 
                   `req-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
                   
  // Add request ID to request object
  (req as any).requestId = requestId;
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId as string);
  
  next();
};

/**
 * Error handler middleware
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Get request ID
  const requestId = (req as any).requestId || 'unknown';
  
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const apiError = Errors.validation('Validation error', err.issues);
    
    logger.warn('Validation error', {
      requestId,
      path: req.path,
      method: req.method,
      errors: err.issues,
    });
    
    return res.status(apiError.statusCode).json(apiError.toResponse());
  }
  
  // Handle API errors
  if (err instanceof ApiError) {
    // Log based on severity - use bound methods to preserve context
    if (err.statusCode >= 500) {
      logger.error(err.message, {
        requestId,
        path: req.path,
        method: req.method,
        type: err.type,
        statusCode: err.statusCode,
        ...(err.details ? { details: err.details } : {}),
        ...(err.stack ? { stack: err.stack } : {}),
      });
    } else {
      logger.warn(err.message, {
        requestId,
        path: req.path,
        method: req.method,
        type: err.type,
        statusCode: err.statusCode,
        ...(err.details ? { details: err.details } : {}),
        ...(err.stack ? { stack: err.stack } : {}),
      });
    }
    
    return res.status(err.statusCode).json(err.toResponse());
  }
  
  // Handle unknown errors by attempting to infer type and wrapping in ApiError
  let inferredStatusCode = err.statusCode || err.status || 500;
  let inferredErrorType: ErrorType = ErrorType.INTERNAL;
  let inferredMessage = err.message || 'Internal server error';
  let inferredDetails = err.details;

  // Attempt to infer error type based on status code or common error names
  if (inferredStatusCode === 400) {
    inferredErrorType = ErrorType.VALIDATION;
  } else if (inferredStatusCode === 401) {
    inferredErrorType = ErrorType.AUTHENTICATION;
  } else if (inferredStatusCode === 403) {
    inferredErrorType = ErrorType.AUTHORIZATION;
  } else if (inferredStatusCode === 404) {
    inferredErrorType = ErrorType.NOT_FOUND;
  } else if (inferredStatusCode === 409) {
    inferredErrorType = ErrorType.CONFLICT;
  } else if (inferredStatusCode === 502) {
    inferredErrorType = ErrorType.EXTERNAL_SERVICE;
  } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    inferredStatusCode = 401;
    inferredErrorType = ErrorType.AUTHENTICATION;
    inferredMessage = 'Authentication failed';
  } else if (err.name === 'ForbiddenError') {
    inferredStatusCode = 403;
    inferredErrorType = ErrorType.AUTHORIZATION;
    inferredMessage = 'Permission denied';
  }
  // Add more specific checks here if other common error types are known (e.g., database errors by name/code)

  const apiError = new ApiError(
    inferredMessage,
    inferredStatusCode,
    inferredErrorType,
    inferredDetails || (process.env.NODE_ENV !== 'production' ? { originalError: err.message, stack: err.stack } : undefined)
  );

  logger.error('Unhandled error caught by generic handler', {
    requestId,
    path: req.path,
    method: req.method,
    type: apiError.type,
    statusCode: apiError.statusCode,
    error: err.message, // Original error message for logging
    stack: err.stack,   // Original stack for logging
    ...(apiError.details ? { details: apiError.details } : {}),
  });

  const isProduction = process.env.NODE_ENV === 'production';
  const responseError = isProduction && apiError.statusCode >= 500
    ? Errors.internal('Internal server error') // Generic message for 5xx in production
    : apiError; // Use the inferred or original ApiError for response

  return res.status(responseError.statusCode).json(responseError.toResponse());
};

/**
 * Not found middleware
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(Errors.notFound(`Route not found: ${req.method} ${req.path}`));
};
