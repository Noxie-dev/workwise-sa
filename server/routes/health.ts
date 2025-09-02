/**
 * Health Check Routes
 * Provides health check endpoints for Docker containers and load balancers
 */

import { Router, Request, Response } from 'express';
import { cacheService } from '../services/cacheService';
import { batchQueue } from '../services/batchService';
import { authMonitoringService } from '../services/authMonitoringService';
import { tokenRefreshService } from '../services/tokenRefreshService';
import { metricsService } from '../services/metricsService';
import { logger } from '../utils/logger';

const router = Router();

// ============================================================================
// HEALTH CHECK ENDPOINTS
// ============================================================================

/**
 * Basic health check endpoint
 * Used by Docker health checks and load balancers
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    res.status(200).json(health);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

/**
 * Detailed health check endpoint
 * Includes all service dependencies
 */
router.get('/health/detailed', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        cache: await checkCacheHealth(),
        batch: await checkBatchHealth(),
        auth: await checkAuthHealth(),
        metrics: await checkMetricsHealth()
      },
      system: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version
      },
      responseTime: Date.now() - startTime
    };

    // Determine overall health status
    const serviceStatuses = Object.values(health.services).map(s => s.status);
    if (serviceStatuses.includes('unhealthy')) {
      health.status = 'degraded';
    }
    if (serviceStatuses.includes('error')) {
      health.status = 'unhealthy';
    }

    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Detailed health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Readiness check endpoint
 * Used by Kubernetes readiness probes
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    const readiness = {
      ready: true,
      timestamp: new Date().toISOString(),
      checks: {
        cache: await checkCacheHealth(),
        batch: await checkBatchHealth(),
        auth: await checkAuthHealth()
      }
    };

    // Check if all critical services are ready
    const criticalServices = Object.values(readiness.checks);
    const allReady = criticalServices.every(check => 
      check.status === 'healthy' || check.status === 'degraded'
    );

    if (!allReady) {
      readiness.ready = false;
      return res.status(503).json(readiness);
    }

    res.status(200).json(readiness);
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      ready: false,
      timestamp: new Date().toISOString(),
      error: 'Readiness check failed'
    });
  }
});

/**
 * Liveness check endpoint
 * Used by Kubernetes liveness probes
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid
  });
});

// ============================================================================
// SERVICE HEALTH CHECKS
// ============================================================================

async function checkCacheHealth(): Promise<{ status: string; details?: any }> {
  try {
    const health = await cacheService.getHealth();
    
    if (health.redis.connected && health.memory.size < health.memory.maxSize) {
      return {
        status: 'healthy',
        details: {
          memory: health.memory,
          redis: health.redis
        }
      };
    } else if (health.memory.size < health.memory.maxSize) {
      return {
        status: 'degraded',
        details: {
          memory: health.memory,
          redis: health.redis,
          warning: 'Redis not connected, using memory cache only'
        }
      };
    } else {
      return {
        status: 'unhealthy',
        details: {
          memory: health.memory,
          redis: health.redis,
          error: 'Memory cache full'
        }
      };
    }
  } catch (error) {
    return {
      status: 'error',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

async function checkBatchHealth(): Promise<{ status: string; details?: any }> {
  try {
    const stats = batchQueue.getStats();
    
    if (stats.queueStats.every(q => q.size < 1000)) {
      return {
        status: 'healthy',
        details: {
          totalProcessed: stats.totalProcessed,
          totalFailed: stats.totalFailed,
          activeQueues: stats.activeQueues,
          queueStats: stats.queueStats
        }
      };
    } else {
      return {
        status: 'degraded',
        details: {
          totalProcessed: stats.totalProcessed,
          totalFailed: stats.totalFailed,
          activeQueues: stats.activeQueues,
          queueStats: stats.queueStats,
          warning: 'Large batch queues detected'
        }
      };
    }
  } catch (error) {
    return {
      status: 'error',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

async function checkAuthHealth(): Promise<{ status: string; details?: any }> {
  try {
    const authStats = authMonitoringService.getMetrics();
    const tokenStats = tokenRefreshService.getStats();
    
    const loginSuccessRate = authStats.totalLogins > 0 ? 
      (authStats.successfulLogins / authStats.totalLogins) * 100 : 100;
    
    const tokenRefreshSuccessRate = tokenStats.totalAttempts > 0 ?
      (tokenStats.successfulAttempts / tokenStats.totalAttempts) * 100 : 100;

    if (loginSuccessRate > 90 && tokenRefreshSuccessRate > 95) {
      return {
        status: 'healthy',
        details: {
          loginSuccessRate,
          tokenRefreshSuccessRate,
          totalLogins: authStats.totalLogins,
          activeSessions: authStats.totalLogins - authStats.failedLogins
        }
      };
    } else if (loginSuccessRate > 80 && tokenRefreshSuccessRate > 90) {
      return {
        status: 'degraded',
        details: {
          loginSuccessRate,
          tokenRefreshSuccessRate,
          totalLogins: authStats.totalLogins,
          activeSessions: authStats.totalLogins - authStats.failedLogins,
          warning: 'Authentication success rates below optimal levels'
        }
      };
    } else {
      return {
        status: 'unhealthy',
        details: {
          loginSuccessRate,
          tokenRefreshSuccessRate,
          totalLogins: authStats.totalLogins,
          activeSessions: authStats.totalLogins - authStats.failedLogins,
          error: 'Authentication success rates critically low'
        }
      };
    }
  } catch (error) {
    return {
      status: 'error',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

async function checkMetricsHealth(): Promise<{ status: string; details?: any }> {
  try {
    const metrics = metricsService.getAllMetrics();
    
    if (metrics.size > 0) {
      return {
        status: 'healthy',
        details: {
          totalMetrics: metrics.size,
          metrics: Array.from(metrics.keys())
        }
      };
    } else {
      return {
        status: 'degraded',
        details: {
          totalMetrics: 0,
          warning: 'No metrics collected yet'
        }
      };
    }
  } catch (error) {
    return {
      status: 'error',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

export default router;