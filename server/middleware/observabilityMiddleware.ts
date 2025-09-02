/**
 * Observability Middleware
 * Integrates tracing, logging, and metrics collection for comprehensive monitoring
 */

import { Request, Response, NextFunction } from 'express';
import { observabilityService } from '../services/observabilityService';
import { metricsService } from '../services/metricsService';
import { logger } from '../utils/logger';

// ============================================================================
// OBSERVABILITY MIDDLEWARE
// ============================================================================

/**
 * Main observability middleware that wraps all requests
 */
export const observabilityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const correlationId = observabilityService.getCorrelationId() || observabilityService.generateCorrelationId();
  
  // Set correlation ID for this request
  observabilityService.setCorrelationId(correlationId);
  
  // Start trace
  const span = observabilityService.startTrace('http_request', {
    'http.method': req.method,
    'http.url': req.url,
    'http.route': req.route?.path || req.path,
    'user.id': (req as any).user?.uid || 'anonymous',
    'correlation.id': correlationId
  });

  // Add correlation ID to response headers
  res.setHeader('X-Correlation-ID', correlationId);
  res.setHeader('X-Request-ID', correlationId);

  // Override response methods to track completion
  const originalSend = res.send;
  const originalJson = res.json;
  const originalEnd = res.end;

  const recordCompletion = (error?: Error) => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Record metrics
    metricsService.recordHttpRequest(req.method, req.path, statusCode, duration);

    // Add trace tags
    if (span) {
      observabilityService.addTraceTags(span, {
        'http.status_code': statusCode.toString(),
        'http.response_time': duration.toString(),
        'error': error ? 'true' : 'false'
      });
    }

    // Log request completion
    observabilityService.log('info', 'HTTP request completed', {
      method: req.method,
      path: req.path,
      statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: (req as any).user?.uid
    });

    // Finish trace
    observabilityService.finishTrace(span, error);
  };

  res.send = function(body: any) {
    recordCompletion();
    return originalSend.call(this, body);
  };

  res.json = function(body: any) {
    recordCompletion();
    return originalJson.call(this, body);
  };

  res.end = function(chunk?: any, encoding?: any) {
    recordCompletion();
    return originalEnd.call(this, chunk, encoding);
  };

  // Log request start
  observabilityService.log('info', 'HTTP request started', {
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: (req as any).user?.uid
  });

  next();
};

/**
 * Database operation tracing middleware
 */
export const traceDatabaseOperation = (operation: string, table: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const span = observabilityService.startTrace('database_operation', {
      'db.operation': operation,
      'db.table': table,
      'db.system': 'postgresql'
    });

    const startTime = Date.now();

    // Override next to track completion
    const originalNext = next;
    next = function(err?: any) {
      const duration = Date.now() - startTime;
      const success = !err;

      // Record metrics
      metricsService.recordDatabaseOperation(operation, table, success, duration);

      // Add trace tags
      if (span) {
        observabilityService.addTraceTags(span, {
          'db.success': success.toString(),
          'db.duration': duration.toString(),
          'error': err ? 'true' : 'false'
        });
      }

      // Log database operation
      observabilityService.log(success ? 'info' : 'error', `Database ${operation} on ${table}`, {
        operation,
        table,
        duration,
        success,
        error: err?.message
      });

      // Finish trace
      observabilityService.finishTrace(span, err);

      return originalNext.call(this, err);
    };

    return next;
  };
};

/**
 * Cache operation tracing middleware
 */
export const traceCacheOperation = (operation: string, hit: boolean) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const span = observabilityService.startTrace('cache_operation', {
      'cache.operation': operation,
      'cache.hit': hit.toString()
    });

    // Record metrics
    metricsService.recordCacheOperation(operation, hit);

    // Log cache operation
    observabilityService.log('debug', `Cache ${operation}`, {
      operation,
      hit,
      key: req.params.key || req.query.key
    });

    // Finish trace
    observabilityService.finishTrace(span);

    next();
  };
};

/**
 * Authentication operation tracing middleware
 */
export const traceAuthOperation = (operation: string, success: boolean) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const span = observabilityService.startTrace('auth_operation', {
      'auth.operation': operation,
      'auth.success': success.toString(),
      'user.id': (req as any).user?.uid || 'anonymous'
    });

    // Record metrics
    metricsService.recordAuthOperation(operation, success);

    // Log authentication operation
    observabilityService.log(success ? 'info' : 'warn', `Authentication ${operation}`, {
      operation,
      success,
      userId: (req as any).user?.uid,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Finish trace
    observabilityService.finishTrace(span);

    next();
  };
};

/**
 * Error tracking middleware
 */
export const errorTrackingMiddleware = (error: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error with full context
  observabilityService.log('error', 'Application error occurred', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
      headers: req.headers
    },
    user: {
      id: (req as any).user?.uid,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  // Record error metrics
  metricsService.incrementCounter('application_errors_total', {
    error_type: error.name,
    endpoint: req.path,
    method: req.method
  });

  next(error);
};

/**
 * Performance monitoring middleware
 */
export const performanceMonitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();
  const startCpu = process.cpuUsage();

  // Override response methods to track performance
  const originalSend = res.send;
  const originalJson = res.json;
  const originalEnd = res.end;

  const recordPerformance = () => {
    const duration = Date.now() - startTime;
    const endMemory = process.memoryUsage();
    const endCpu = process.cpuUsage(startCpu);

    // Record performance metrics
    metricsService.observeHistogram('request_performance_duration_seconds', duration / 1000, {
      method: req.method,
      path: req.path,
      status: res.statusCode.toString()
    });

    metricsService.observeHistogram('request_memory_usage_bytes', endMemory.heapUsed - startMemory.heapUsed, {
      method: req.method,
      path: req.path
    });

    // Log performance data
    observabilityService.log('debug', 'Request performance metrics', {
      duration,
      memoryDelta: endMemory.heapUsed - startMemory.heapUsed,
      cpuDelta: endCpu.user + endCpu.system,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode
    });
  };

  res.send = function(body: any) {
    recordPerformance();
    return originalSend.call(this, body);
  };

  res.json = function(body: any) {
    recordPerformance();
    return originalJson.call(this, body);
  };

  res.end = function(chunk?: any, encoding?: any) {
    recordPerformance();
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};