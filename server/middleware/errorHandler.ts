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
    const apiError = Errors.validation('Validation error', err.errors);
    
    logger.warn({
      message: 'Validation error',
      requestId,
      path: req.path,
      method: req.method,
      errors: err.errors,
    });
    
    return res.status(apiError.statusCode).json(apiError.toResponse());
  }
  
  // Handle API errors
  if (err instanceof ApiError) {
    // Log based on severity
    const logMethod = err.statusCode >= 500 ? logger.error : logger.warn;
    
    logMethod({
      message: err.message,
      requestId,
      path: req.path,
      method: req.method,
      type: err.type,
      statusCode: err.statusCode,
      ...(err.details ? { details: err.details } : {}),
      ...(err.stack ? { stack: err.stack } : {}),
    });
    
    return res.status(err.statusCode).json(err.toResponse());
  }
  
  // Handle unknown errors
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  logger.error({
    message: 'Unhandled error',
    requestId,
    path: req.path,
    method: req.method,
    error: message,
    stack: err.stack,
  });
  
  // In production, don't expose error details
  const isProduction = process.env.NODE_ENV === 'production';
  
  return res.status(statusCode).json({
    error: {
      type: ErrorType.INTERNAL,
      message: isProduction ? 'Internal server error' : message,
      requestId,
    }
  });
};

/**
 * Not found middleware
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(Errors.notFound(`Route not found: ${req.method} ${req.path}`));
};
