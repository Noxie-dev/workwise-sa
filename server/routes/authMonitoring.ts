/**
 * Authentication Monitoring API Routes
 * Provides endpoints for monitoring authentication metrics and security events
 */

import { Router, Request, Response } from 'express';
import { authMonitoringService } from '../services/authMonitoringService';
import { cacheService } from '../services/cacheService';
import { tokenRefreshService } from '../services/tokenRefreshService';
import { requireAdmin, verifyFirebaseToken } from '../middleware/enhancedAuth';
import { logger } from '../utils/logger';

const router = Router();

// ============================================================================
// MONITORING ENDPOINTS
// ============================================================================

/**
 * Get authentication metrics
 */
router.get('/metrics', verifyFirebaseToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const metrics = authMonitoringService.getMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error getting auth metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve authentication metrics'
    });
  }
});

/**
 * Get security events
 */
router.get('/security-events', verifyFirebaseToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { severity, resolved, limit = 50 } = req.query;
    
    let events = authMonitoringService.getSecurityEvents(
      severity as string,
      resolved === 'true' ? true : resolved === 'false' ? false : undefined
    );

    // Apply limit
    if (limit) {
      events = events.slice(0, parseInt(limit as string));
    }

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    logger.error('Error getting security events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve security events'
    });
  }
});

/**
 * Get performance metrics
 */
router.get('/performance', verifyFirebaseToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const performanceMetrics = authMonitoringService.getPerformanceMetrics();
    res.json({
      success: true,
      data: performanceMetrics
    });
  } catch (error) {
    logger.error('Error getting performance metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve performance metrics'
    });
  }
});

/**
 * Get security dashboard data
 */
router.get('/dashboard', verifyFirebaseToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const dashboard = authMonitoringService.getSecurityDashboard();
    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    logger.error('Error getting security dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve security dashboard'
    });
  }
});

/**
 * Generate security report
 */
router.get('/report', verifyFirebaseToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { days = 7 } = req.query;
    const report = authMonitoringService.generateSecurityReport(parseInt(days as string));
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error generating security report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate security report'
    });
  }
});

/**
 * Resolve a security event
 */
router.post('/security-events/:eventId/resolve', verifyFirebaseToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { resolvedBy } = req.body;
    
    if (!resolvedBy) {
      return res.status(400).json({
        success: false,
        error: 'resolvedBy is required'
      });
    }

    await authMonitoringService.resolveSecurityEvent(eventId, resolvedBy);
    
    res.json({
      success: true,
      message: 'Security event resolved successfully'
    });
  } catch (error) {
    logger.error('Error resolving security event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve security event'
    });
  }
});

// ============================================================================
// CACHE MONITORING ENDPOINTS
// ============================================================================

/**
 * Get cache statistics
 */
router.get('/cache/stats', verifyFirebaseToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const stats = cacheService.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cache statistics'
    });
  }
});

/**
 * Get cache health status
 */
router.get('/cache/health', verifyFirebaseToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const health = await cacheService.getHealth();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('Error getting cache health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cache health status'
    });
  }
});

/**
 * Clear cache
 */
router.post('/cache/clear', verifyFirebaseToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { pattern } = req.body;
    
    if (pattern) {
      await cacheService.invalidate(pattern);
      res.json({
        success: true,
        message: `Cache cleared for pattern: ${pattern}`
      });
    } else {
      await cacheService.clearAll();
      res.json({
        success: true,
        message: 'All caches cleared'
      });
    }
  } catch (error) {
    logger.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache'
    });
  }
});

// ============================================================================
// TOKEN REFRESH MONITORING ENDPOINTS
// ============================================================================

/**
 * Get token refresh statistics
 */
router.get('/token-refresh/stats', verifyFirebaseToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const stats = tokenRefreshService.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting token refresh stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve token refresh statistics'
    });
  }
});

/**
 * Get failed refresh attempts
 */
router.get('/token-refresh/failed-attempts', verifyFirebaseToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId, hours = 24 } = req.query;
    
    const failedAttempts = await tokenRefreshService.getFailedAttempts(
      userId as string,
      parseInt(hours as string)
    );
    
    res.json({
      success: true,
      data: failedAttempts
    });
  } catch (error) {
    logger.error('Error getting failed refresh attempts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve failed refresh attempts'
    });
  }
});

/**
 * Reset token refresh statistics
 */
router.post('/token-refresh/reset-stats', verifyFirebaseToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    tokenRefreshService.resetStats();
    res.json({
      success: true,
      message: 'Token refresh statistics reset successfully'
    });
  } catch (error) {
    logger.error('Error resetting token refresh stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset token refresh statistics'
    });
  }
});

// ============================================================================
// SYSTEM HEALTH ENDPOINT
// ============================================================================

/**
 * Get overall system health
 */
router.get('/health', verifyFirebaseToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const [cacheHealth, authMetrics, tokenStats] = await Promise.all([
      cacheService.getHealth(),
      authMonitoringService.getMetrics(),
      tokenRefreshService.getStats()
    ]);

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        cache: {
          status: cacheHealth.redis.connected ? 'healthy' : 'degraded',
          memory: cacheHealth.memory,
          redis: cacheHealth.redis
        },
        authentication: {
          status: authMetrics.loginSuccessRate > 80 ? 'healthy' : 'degraded',
          metrics: {
            loginSuccessRate: authMetrics.loginSuccessRate,
            totalLogins: authMetrics.totalLogins,
            failedLogins: authMetrics.failedLogins
          }
        },
        tokenRefresh: {
          status: tokenStats.successRate > 90 ? 'healthy' : 'degraded',
          metrics: {
            successRate: tokenStats.successRate,
            totalAttempts: tokenStats.totalAttempts,
            failedAttempts: tokenStats.failedAttempts
          }
        }
      },
      alerts: authMonitoringService.getSecurityEvents(undefined, false)
        .filter(e => e.severity === 'HIGH' || e.severity === 'CRITICAL')
        .slice(0, 5)
    };

    // Determine overall status
    const serviceStatuses = Object.values(health.services).map(s => s.status);
    if (serviceStatuses.includes('degraded')) {
      health.status = 'degraded';
    }
    if (health.alerts.length > 0) {
      health.status = 'degraded';
    }

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('Error getting system health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve system health'
    });
  }
});

export default router;