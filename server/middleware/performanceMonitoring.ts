/**
 * Performance Monitoring Middleware
 * Tracks request performance, database operations, and system metrics
 * Integrates with Prometheus for metrics collection
 */

import { Request, Response, NextFunction } from 'express';
import { metricsService } from '../services/metricsService';
import { logger } from '../utils/logger';

// ============================================================================
// PERFORMANCE MONITORING INTERFACES
// ============================================================================

interface PerformanceContext {
  startTime: number;
  requestId: string;
  method: string;
  path: string;
  userAgent: string;
  ipAddress: string;
  userId?: string;
  databaseOperations: Array<{
    operation: string;
    table: string;
    startTime: number;
    duration?: number;
    success?: boolean;
  }>;
  cacheOperations: Array<{
    operation: string;
    hit: boolean;
    timestamp: number;
  }>;
}

// ============================================================================
// PERFORMANCE MONITORING MIDDLEWARE
// ============================================================================

/**
 * Request performance monitoring middleware
 */
export const performanceMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Create performance context
  const perfContext: PerformanceContext = {
    startTime,
    requestId,
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent') || 'unknown',
    ipAddress: req.ip,
    userId: (req as any).user?.uid,
    databaseOperations: [],
    cacheOperations: []
  };

  // Attach to request for use in other middleware
  (req as any).perfContext = perfContext;

  // Track request start
  metricsService.setGauge('http_requests_in_flight', 1, {
    method: req.method,
    path: req.path
  });

  // Override response methods to track completion
  const originalSend = res.send;
  const originalJson = res.json;
  const originalEnd = res.end;

  const recordCompletion = () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Record HTTP metrics
    metricsService.recordHttpRequest(req.method, req.path, statusCode, duration);

    // Record database operation metrics
    for (const dbOp of perfContext.databaseOperations) {
      if (dbOp.duration !== undefined && dbOp.success !== undefined) {
        metricsService.recordDatabaseOperation(
          dbOp.operation,
          dbOp.table,
          dbOp.success,
          dbOp.duration
        );
      }
    }

    // Record cache operation metrics
    for (const cacheOp of perfContext.cacheOperations) {
      metricsService.recordCacheOperation(cacheOp.operation, cacheOp.hit);
    }

    // Update in-flight requests
    metricsService.setGauge('http_requests_in_flight', -1, {
      method: req.method,
      path: req.path
    });

    // Log performance data
    logger.info('Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode,
      duration,
      userId: perfContext.userId,
      databaseOperations: perfContext.databaseOperations.length,
      cacheOperations: perfContext.cacheOperations.length,
      userAgent: perfContext.userAgent,
      ipAddress: perfContext.ipAddress
    });
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

  next();
};

/**
 * Database operation tracking middleware
 */
export const trackDatabaseOperation = (operation: string, table: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const perfContext: PerformanceContext = (req as any).perfContext;
    if (!perfContext) {
      return next();
    }

    const startTime = Date.now();
    const dbOp = {
      operation,
      table,
      startTime
    };

    perfContext.databaseOperations.push(dbOp);

    // Override next to track completion
    const originalNext = next;
    next = function(err?: any) {
      const duration = Date.now() - startTime;
      const success = !err;

      dbOp.duration = duration;
      dbOp.success = success;

      if (err) {
        logger.error(`Database operation failed: ${operation} on ${table}`, {
          requestId: perfContext.requestId,
          error: err.message,
          duration
        });
      }

      return originalNext.call(this, err);
    };

    return next;
  };
};

/**
 * Cache operation tracking middleware
 */
export const trackCacheOperation = (operation: string, hit: boolean) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const perfContext: PerformanceContext = (req as any).perfContext;
    if (!perfContext) {
      return next();
    }

    perfContext.cacheOperations.push({
      operation,
      hit,
      timestamp: Date.now()
    });

    next();
  };
};

/**
 * Authentication operation tracking middleware
 */
export const trackAuthOperation = (operation: string, success: boolean) => {
  return (req: Request, res: Response, next: NextFunction) => {
    metricsService.recordAuthOperation(operation, success);
    
    if (!success) {
      logger.warn(`Authentication operation failed: ${operation}`, {
        requestId: (req as any).perfContext?.requestId,
        userId: (req as any).user?.uid,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    next();
  };
};

/**
 * Batch operation tracking middleware
 */
export const trackBatchOperation = (operation: string, count: number, success: boolean, duration: number) => {
  metricsService.recordBatchOperation(operation, count, success, duration);
  
  if (!success) {
    logger.error(`Batch operation failed: ${operation}`, {
      count,
      duration,
      error: 'Batch processing failed'
    });
  }
};

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Measure execution time of a function
 */
export function measureExecutionTime<T>(
  fn: () => Promise<T>,
  operation: string,
  labels?: Record<string, string>
): Promise<T> {
  const startTime = Date.now();
  
  return fn()
    .then(result => {
      const duration = Date.now() - startTime;
      metricsService.observeHistogram('operation_duration_seconds', duration / 1000, {
        operation,
        ...labels
      });
      return result;
    })
    .catch(error => {
      const duration = Date.now() - startTime;
      metricsService.observeHistogram('operation_duration_seconds', duration / 1000, {
        operation,
        status: 'error',
        ...labels
      });
      throw error;
    });
}

/**
 * Measure database operation
 */
export async function measureDatabaseOperation<T>(
  operation: () => Promise<T>,
  operationType: string,
  table: string
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    
    metricsService.recordDatabaseOperation(operationType, table, true, duration);
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    metricsService.recordDatabaseOperation(operationType, table, false, duration);
    
    logger.error(`Database operation failed: ${operationType} on ${table}`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration
    });
    
    throw error;
  }
}

/**
 * Measure cache operation
 */
export function measureCacheOperation<T>(
  operation: () => Promise<T>,
  operationType: string,
  hit: boolean
): Promise<T> {
  metricsService.recordCacheOperation(operationType, hit);
  
  return operation();
}

/**
 * Create performance timer
 */
export class PerformanceTimer {
  private startTime: number;
  private operation: string;
  private labels: Record<string, string>;

  constructor(operation: string, labels: Record<string, string> = {}) {
    this.startTime = Date.now();
    this.operation = operation;
    this.labels = labels;
  }

  end(): number {
    const duration = Date.now() - this.startTime;
    metricsService.observeHistogram('operation_duration_seconds', duration / 1000, {
      operation: this.operation,
      ...this.labels
    });
    return duration;
  }

  endWithError(): number {
    const duration = Date.now() - this.startTime;
    metricsService.observeHistogram('operation_duration_seconds', duration / 1000, {
      operation: this.operation,
      status: 'error',
      ...this.labels
    });
    return duration;
  }
}

// ============================================================================
// PERFORMANCE MONITORING ROUTES
// ============================================================================

/**
 * Get performance metrics endpoint
 */
export const getPerformanceMetrics = (req: Request, res: Response) => {
  try {
    const metrics = metricsService.exportPrometheusFormat();
    
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
  } catch (error) {
    logger.error('Error getting performance metrics:', error);
    res.status(500).json({
      error: 'Failed to retrieve performance metrics'
    });
  }
};

/**
 * Get performance summary endpoint
 */
export const getPerformanceSummary = (req: Request, res: Response) => {
  try {
    const summary = {
      http: {
        requestsTotal: metricsService.getMetricValue('http_requests_total'),
        requestsFailed: metricsService.getMetricValue('http_requests_failed_total'),
        averageResponseTime: metricsService.getMetricValue('http_request_duration_seconds')
      },
      database: {
        operationsTotal: metricsService.getMetricValue('database_operations_total'),
        operationsFailed: metricsService.getMetricValue('database_operations_failed_total'),
        averageOperationTime: metricsService.getMetricValue('database_operation_duration_seconds')
      },
      cache: {
        hitsTotal: metricsService.getMetricValue('cache_hits_total'),
        missesTotal: metricsService.getMetricValue('cache_misses_total'),
        hitRate: (() => {
          const hits = metricsService.getMetricValue('cache_hits_total') || 0;
          const misses = metricsService.getMetricValue('cache_misses_total') || 0;
          const total = hits + misses;
          return total > 0 ? (hits / total) * 100 : 0;
        })()
      },
      auth: {
        requestsTotal: metricsService.getMetricValue('auth_requests_total'),
        requestsFailed: metricsService.getMetricValue('auth_requests_failed_total'),
        activeSessions: metricsService.getMetricValue('auth_active_sessions')
      },
      system: {
        memoryUsage: metricsService.getMetricValue('system_memory_usage_bytes'),
        cpuUsage: metricsService.getMetricValue('system_cpu_usage_percent'),
        uptime: metricsService.getMetricValue('system_uptime_seconds')
      }
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Error getting performance summary:', error);
    res.status(500).json({
      error: 'Failed to retrieve performance summary'
    });
  }
};

// ============================================================================
// PERFORMANCE ALERTS
// ============================================================================

/**
 * Check performance thresholds and generate alerts
 */
export const checkPerformanceThresholds = () => {
  const alerts: Array<{
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    value: number;
    threshold: number;
  }> = [];

  // Check response time threshold
  const avgResponseTime = metricsService.getMetricValue('http_request_duration_seconds');
  if (avgResponseTime && avgResponseTime > 2) { // 2 seconds
    alerts.push({
      type: 'response_time',
      severity: avgResponseTime > 5 ? 'CRITICAL' : 'HIGH',
      message: `Average response time is ${avgResponseTime.toFixed(2)}s`,
      value: avgResponseTime,
      threshold: 2
    });
  }

  // Check error rate threshold
  const totalRequests = metricsService.getMetricValue('http_requests_total') || 0;
  const failedRequests = metricsService.getMetricValue('http_requests_failed_total') || 0;
  const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;
  
  if (errorRate > 5) { // 5% error rate
    alerts.push({
      type: 'error_rate',
      severity: errorRate > 20 ? 'CRITICAL' : errorRate > 10 ? 'HIGH' : 'MEDIUM',
      message: `Error rate is ${errorRate.toFixed(2)}%`,
      value: errorRate,
      threshold: 5
    });
  }

  // Check memory usage threshold
  const memoryUsage = metricsService.getMetricValue('system_memory_usage_bytes');
  if (memoryUsage && memoryUsage > 1024 * 1024 * 1024) { // 1GB
    alerts.push({
      type: 'memory_usage',
      severity: memoryUsage > 2 * 1024 * 1024 * 1024 ? 'CRITICAL' : 'HIGH',
      message: `Memory usage is ${(memoryUsage / 1024 / 1024 / 1024).toFixed(2)}GB`,
      value: memoryUsage,
      threshold: 1024 * 1024 * 1024
    });
  }

  // Check cache hit rate threshold
  const cacheHits = metricsService.getMetricValue('cache_hits_total') || 0;
  const cacheMisses = metricsService.getMetricValue('cache_misses_total') || 0;
  const cacheHitRate = (cacheHits + cacheMisses) > 0 ? (cacheHits / (cacheHits + cacheMisses)) * 100 : 100;
  
  if (cacheHitRate < 80) { // 80% hit rate
    alerts.push({
      type: 'cache_hit_rate',
      severity: cacheHitRate < 50 ? 'HIGH' : 'MEDIUM',
      message: `Cache hit rate is ${cacheHitRate.toFixed(2)}%`,
      value: cacheHitRate,
      threshold: 80
    });
  }

  return alerts;
};

/**
 * Get performance alerts endpoint
 */
export const getPerformanceAlerts = (req: Request, res: Response) => {
  try {
    const alerts = checkPerformanceThresholds();
    
    res.json({
      success: true,
      data: {
        alerts,
        count: alerts.length,
        criticalCount: alerts.filter(a => a.severity === 'CRITICAL').length,
        highCount: alerts.filter(a => a.severity === 'HIGH').length
      }
    });
  } catch (error) {
    logger.error('Error getting performance alerts:', error);
    res.status(500).json({
      error: 'Failed to retrieve performance alerts'
    });
  }
};