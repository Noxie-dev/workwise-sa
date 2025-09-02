/**
 * Authentication Monitoring Service
 * Tracks authentication metrics, failed attempts, and security events
 * Provides insights for security monitoring and performance optimization
 */

import { logger } from '../utils/logger';
import { cacheService } from './cacheService';
import { tokenRefreshService } from './tokenRefreshService';

// ============================================================================
// MONITORING INTERFACES
// ============================================================================

interface AuthMetrics {
  // Login metrics
  totalLogins: number;
  successfulLogins: number;
  failedLogins: number;
  loginSuccessRate: number;
  
  // Token metrics
  totalTokenRefreshes: number;
  successfulTokenRefreshes: number;
  failedTokenRefreshes: number;
  tokenRefreshSuccessRate: number;
  
  // Security metrics
  suspiciousActivities: number;
  rateLimitedRequests: number;
  revokedTokens: number;
  
  // Performance metrics
  averageResponseTime: number;
  cacheHitRate: number;
  
  // Time-based metrics
  loginsLast24h: number;
  loginsLast7d: number;
  loginsLast30d: number;
}

interface SecurityEvent {
  id: string;
  type: 'FAILED_LOGIN' | 'SUSPICIOUS_ACTIVITY' | 'RATE_LIMITED' | 'TOKEN_REVOKED' | 'UNAUTHORIZED_ACCESS';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: number;
  details: {
    message: string;
    additionalData?: any;
  };
  resolved: boolean;
  resolvedAt?: number;
  resolvedBy?: string;
}

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  averageResponseTime: number;
  totalRequests: number;
  errorRate: number;
  cacheHitRate: number;
  lastUpdated: number;
}

// ============================================================================
// AUTHENTICATION MONITORING SERVICE
// ============================================================================

export class AuthMonitoringService {
  private metrics: AuthMetrics;
  private securityEvents: SecurityEvent[] = [];
  private performanceMetrics = new Map<string, PerformanceMetrics>();
  private isInitialized = false;

  constructor() {
    this.metrics = {
      totalLogins: 0,
      successfulLogins: 0,
      failedLogins: 0,
      loginSuccessRate: 0,
      totalTokenRefreshes: 0,
      successfulTokenRefreshes: 0,
      failedTokenRefreshes: 0,
      tokenRefreshSuccessRate: 0,
      suspiciousActivities: 0,
      rateLimitedRequests: 0,
      revokedTokens: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      loginsLast24h: 0,
      loginsLast7d: 0,
      loginsLast30d: 0
    };
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load existing metrics from cache
      await this.loadMetricsFromCache();
      
      // Start periodic tasks
      this.startPeriodicTasks();
      
      this.isInitialized = true;
      logger.info('✅ Authentication monitoring service initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize auth monitoring service:', error);
    }
  }

  // ============================================================================
  // METRICS TRACKING
  // ============================================================================

  /**
   * Track login attempt
   */
  async trackLogin(success: boolean, userId?: string, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      this.metrics.totalLogins++;
      
      if (success) {
        this.metrics.successfulLogins++;
        this.metrics.loginsLast24h++;
      } else {
        this.metrics.failedLogins++;
        
        // Record failed login event
        if (userId && ipAddress && userAgent) {
          await this.recordSecurityEvent({
            type: 'FAILED_LOGIN',
            severity: 'MEDIUM',
            userId,
            ipAddress,
            userAgent,
            details: {
              message: 'Failed login attempt'
            }
          });
        }
      }

      this.updateLoginSuccessRate();
      await this.saveMetricsToCache();

    } catch (error) {
      logger.error('Error tracking login:', error);
    }
  }

  /**
   * Track token refresh attempt
   */
  async trackTokenRefresh(success: boolean, userId?: string, ipAddress?: string): Promise<void> {
    try {
      this.metrics.totalTokenRefreshes++;
      
      if (success) {
        this.metrics.successfulTokenRefreshes++;
      } else {
        this.metrics.failedTokenRefreshes++;
        
        // Record failed refresh event
        if (userId && ipAddress) {
          await this.recordSecurityEvent({
            type: 'SUSPICIOUS_ACTIVITY',
            severity: 'HIGH',
            userId,
            ipAddress,
            userAgent: 'unknown',
            details: {
              message: 'Failed token refresh attempt'
            }
          });
        }
      }

      this.updateTokenRefreshSuccessRate();
      await this.saveMetricsToCache();

    } catch (error) {
      logger.error('Error tracking token refresh:', error);
    }
  }

  /**
   * Track rate limited request
   */
  async trackRateLimitedRequest(endpoint: string, ipAddress: string, userAgent: string): Promise<void> {
    try {
      this.metrics.rateLimitedRequests++;
      
      await this.recordSecurityEvent({
        type: 'RATE_LIMITED',
        severity: 'MEDIUM',
        ipAddress,
        userAgent,
        details: {
          message: `Rate limited request to ${endpoint}`
        }
      });

      await this.saveMetricsToCache();

    } catch (error) {
      logger.error('Error tracking rate limited request:', error);
    }
  }

  /**
   * Track token revocation
   */
  async trackTokenRevocation(userId: string, reason: string): Promise<void> {
    try {
      this.metrics.revokedTokens++;
      
      await this.recordSecurityEvent({
        type: 'TOKEN_REVOKED',
        severity: 'LOW',
        userId,
        ipAddress: 'unknown',
        userAgent: 'system',
        details: {
          message: `Token revoked: ${reason}`
        }
      });

      await this.saveMetricsToCache();

    } catch (error) {
      logger.error('Error tracking token revocation:', error);
    }
  }

  /**
   * Track suspicious activity
   */
  async trackSuspiciousActivity(
    type: string, 
    userId: string, 
    ipAddress: string, 
    userAgent: string, 
    details: any
  ): Promise<void> {
    try {
      this.metrics.suspiciousActivities++;
      
      await this.recordSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'HIGH',
        userId,
        ipAddress,
        userAgent,
        details: {
          message: `Suspicious activity: ${type}`,
          additionalData: details
        }
      });

      await this.saveMetricsToCache();

    } catch (error) {
      logger.error('Error tracking suspicious activity:', error);
    }
  }

  /**
   * Track performance metrics for an endpoint
   */
  async trackPerformance(
    endpoint: string, 
    method: string, 
    responseTime: number, 
    success: boolean,
    cacheHit: boolean
  ): Promise<void> {
    try {
      const key = `${method}:${endpoint}`;
      const existing = this.performanceMetrics.get(key) || {
        endpoint,
        method,
        averageResponseTime: 0,
        totalRequests: 0,
        errorRate: 0,
        cacheHitRate: 0,
        lastUpdated: Date.now()
      };

      // Update metrics
      existing.totalRequests++;
      existing.averageResponseTime = (existing.averageResponseTime + responseTime) / 2;
      
      if (!success) {
        existing.errorRate = (existing.errorRate * (existing.totalRequests - 1) + 1) / existing.totalRequests;
      } else {
        existing.errorRate = (existing.errorRate * (existing.totalRequests - 1)) / existing.totalRequests;
      }

      if (cacheHit) {
        existing.cacheHitRate = (existing.cacheHitRate * (existing.totalRequests - 1) + 1) / existing.totalRequests;
      } else {
        existing.cacheHitRate = (existing.cacheHitRate * (existing.totalRequests - 1)) / existing.totalRequests;
      }

      existing.lastUpdated = Date.now();
      this.performanceMetrics.set(key, existing);

      // Update global average response time
      this.updateAverageResponseTime();

    } catch (error) {
      logger.error('Error tracking performance:', error);
    }
  }

  // ============================================================================
  // SECURITY EVENT MANAGEMENT
  // ============================================================================

  private async recordSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    try {
      const securityEvent: SecurityEvent = {
        ...event,
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        resolved: false
      };

      this.securityEvents.push(securityEvent);

      // Keep only recent events (last 30 days)
      const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
      this.securityEvents = this.securityEvents.filter(e => e.timestamp > cutoff);

      // Log high severity events
      if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
        logger.warn('High severity security event detected', {
          eventId: securityEvent.id,
          type: event.type,
          severity: event.severity,
          userId: event.userId,
          ipAddress: event.ipAddress,
          message: event.details.message
        });
      }

      // Store in cache for persistence
      await cacheService.set(`security_events:${securityEvent.id}`, securityEvent, {
        ttl: 30 * 24 * 60 * 60 // 30 days
      });

    } catch (error) {
      logger.error('Error recording security event:', error);
    }
  }

  /**
   * Resolve a security event
   */
  async resolveSecurityEvent(eventId: string, resolvedBy: string): Promise<void> {
    try {
      const event = this.securityEvents.find(e => e.id === eventId);
      if (event) {
        event.resolved = true;
        event.resolvedAt = Date.now();
        event.resolvedBy = resolvedBy;

        // Update in cache
        await cacheService.set(`security_events:${eventId}`, event, {
          ttl: 30 * 24 * 60 * 60
        });

        logger.info(`Security event ${eventId} resolved by ${resolvedBy}`);
      }
    } catch (error) {
      logger.error(`Error resolving security event ${eventId}:`, error);
    }
  }

  // ============================================================================
  // METRICS CALCULATIONS
  // ============================================================================

  private updateLoginSuccessRate(): void {
    this.metrics.loginSuccessRate = this.metrics.totalLogins > 0 
      ? (this.metrics.successfulLogins / this.metrics.totalLogins) * 100 
      : 0;
  }

  private updateTokenRefreshSuccessRate(): void {
    this.metrics.tokenRefreshSuccessRate = this.metrics.totalTokenRefreshes > 0 
      ? (this.metrics.successfulTokenRefreshes / this.metrics.totalTokenRefreshes) * 100 
      : 0;
  }

  private updateAverageResponseTime(): void {
    const metrics = Array.from(this.performanceMetrics.values());
    if (metrics.length > 0) {
      this.metrics.averageResponseTime = metrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / metrics.length;
    }
  }

  private updateCacheHitRate(): void {
    const cacheStats = cacheService.getStats();
    this.metrics.cacheHitRate = cacheStats.hitRate;
  }

  // ============================================================================
  // DATA PERSISTENCE
  // ============================================================================

  private async loadMetricsFromCache(): Promise<void> {
    try {
      const cachedMetrics = await cacheService.get<AuthMetrics>('auth_metrics');
      if (cachedMetrics) {
        this.metrics = { ...this.metrics, ...cachedMetrics };
      }

      // Load recent security events
      const eventKeys = await this.getSecurityEventKeys();
      for (const key of eventKeys) {
        const event = await cacheService.get<SecurityEvent>(key);
        if (event) {
          this.securityEvents.push(event);
        }
      }

    } catch (error) {
      logger.error('Error loading metrics from cache:', error);
    }
  }

  private async saveMetricsToCache(): Promise<void> {
    try {
      await cacheService.set('auth_metrics', this.metrics, { ttl: 7 * 24 * 60 * 60 }); // 7 days
    } catch (error) {
      logger.error('Error saving metrics to cache:', error);
    }
  }

  private async getSecurityEventKeys(): Promise<string[]> {
    // This would typically query a database or use Redis SCAN
    // For now, return empty array
    return [];
  }

  // ============================================================================
  // PERIODIC TASKS
  // ============================================================================

  private startPeriodicTasks(): void {
    // Update cache hit rate every 5 minutes
    setInterval(() => {
      this.updateCacheHitRate();
    }, 5 * 60 * 1000);

    // Save metrics every 10 minutes
    setInterval(async () => {
      await this.saveMetricsToCache();
    }, 10 * 60 * 1000);

    // Reset daily counters at midnight
    setInterval(() => {
      this.resetDailyCounters();
    }, 24 * 60 * 60 * 1000);

    // Clean up old data every hour
    setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000);
  }

  private resetDailyCounters(): void {
    this.metrics.loginsLast24h = 0;
    // Move 24h data to 7d, 7d to 30d, etc.
    this.metrics.loginsLast7d = this.metrics.loginsLast24h;
    this.metrics.loginsLast30d = this.metrics.loginsLast7d;
  }

  private cleanupOldData(): void {
    // Remove old security events
    const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
    this.securityEvents = this.securityEvents.filter(e => e.timestamp > cutoff);

    // Remove old performance metrics
    const performanceCutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
    for (const [key, metric] of this.performanceMetrics.entries()) {
      if (metric.lastUpdated < performanceCutoff) {
        this.performanceMetrics.delete(key);
      }
    }
  }

  // ============================================================================
  // REPORTING AND ANALYTICS
  // ============================================================================

  /**
   * Get current metrics
   */
  getMetrics(): AuthMetrics {
    return { ...this.metrics };
  }

  /**
   * Get security events
   */
  getSecurityEvents(severity?: string, resolved?: boolean): SecurityEvent[] {
    let events = [...this.securityEvents];

    if (severity) {
      events = events.filter(e => e.severity === severity);
    }

    if (resolved !== undefined) {
      events = events.filter(e => e.resolved === resolved);
    }

    return events.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics[] {
    return Array.from(this.performanceMetrics.values());
  }

  /**
   * Get security dashboard data
   */
  getSecurityDashboard(): {
    metrics: AuthMetrics;
    recentEvents: SecurityEvent[];
    topEndpoints: PerformanceMetrics[];
    alerts: SecurityEvent[];
  } {
    const recentEvents = this.getSecurityEvents().slice(0, 10);
    const alerts = this.getSecurityEvents(undefined, false).filter(e => 
      e.severity === 'HIGH' || e.severity === 'CRITICAL'
    );
    const topEndpoints = this.getPerformanceMetrics()
      .sort((a, b) => b.totalRequests - a.totalRequests)
      .slice(0, 10);

    return {
      metrics: this.getMetrics(),
      recentEvents,
      topEndpoints,
      alerts
    };
  }

  /**
   * Generate security report
   */
  generateSecurityReport(days: number = 7): {
    summary: {
      totalEvents: number;
      criticalEvents: number;
      highEvents: number;
      resolvedEvents: number;
    };
    trends: {
      logins: number;
      failedLogins: number;
      tokenRefreshes: number;
      rateLimitedRequests: number;
    };
    recommendations: string[];
  } {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const recentEvents = this.securityEvents.filter(e => e.timestamp > cutoff);

    const summary = {
      totalEvents: recentEvents.length,
      criticalEvents: recentEvents.filter(e => e.severity === 'CRITICAL').length,
      highEvents: recentEvents.filter(e => e.severity === 'HIGH').length,
      resolvedEvents: recentEvents.filter(e => e.resolved).length
    };

    const trends = {
      logins: this.metrics.loginsLast24h,
      failedLogins: this.metrics.failedLogins,
      tokenRefreshes: this.metrics.totalTokenRefreshes,
      rateLimitedRequests: this.metrics.rateLimitedRequests
    };

    const recommendations: string[] = [];
    
    if (summary.criticalEvents > 0) {
      recommendations.push('Immediate attention required: Critical security events detected');
    }
    
    if (this.metrics.loginSuccessRate < 80) {
      recommendations.push('Consider reviewing authentication flow: Low login success rate');
    }
    
    if (this.metrics.rateLimitedRequests > 100) {
      recommendations.push('High rate limiting activity: Consider adjusting rate limits');
    }

    return { summary, trends, recommendations };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const authMonitoringService = new AuthMonitoringService();