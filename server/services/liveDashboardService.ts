/**
 * Live Dashboard Service
 * Real-time monitoring with WebSocket connections for instant updates
 * Tracks auth flows, performance metrics, and system health
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { EventEmitter } from 'events';
import { metricsService } from './metricsService';
import { cacheService } from './cacheService';
import { batchQueue } from './batchService';
import { authMonitoringService } from './authMonitoringService';
import { tokenRefreshService } from './tokenRefreshService';
import { observabilityService } from './observabilityService';
import { logger } from '../utils/logger';

// ============================================================================
// LIVE DASHBOARD INTERFACES
// ============================================================================

interface DashboardMetrics {
  timestamp: number;
  auth: {
    activeSessions: number;
    loginSuccessRate: number;
    tokenRefreshRate: number;
    failedAttempts: number;
    suspiciousActivity: number;
  };
  performance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    cacheHitRate: number;
  };
  system: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    uptime: number;
  };
  database: {
    connectionPool: number;
    queryTime: number;
    batchQueueSize: number;
    failedQueries: number;
  };
  alerts: {
    active: number;
    critical: number;
    resolved: number;
  };
}

interface AuthFlowEvent {
  id: string;
  timestamp: number;
  type: 'login' | 'logout' | 'token_refresh' | 'password_reset' | 'registration';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  duration: number;
  error?: string;
  metadata: Record<string, any>;
}

interface AlertEvent {
  id: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  message: string;
  resolved: boolean;
  duration?: number;
}

// ============================================================================
// LIVE DASHBOARD SERVICE
// ============================================================================

export class LiveDashboardService extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private metricsInterval: NodeJS.Timeout | null = null;
  private authFlowEvents: AuthFlowEvent[] = [];
  private alertEvents: AlertEvent[] = [];
  private isRunning = false;

  constructor() {
    super();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  async initialize(server: Server): Promise<void> {
    try {
      // Create WebSocket server
      this.wss = new WebSocketServer({ 
        server,
        path: '/ws/dashboard'
      });

      // Handle WebSocket connections
      this.wss.on('connection', (ws: WebSocket) => {
        this.handleConnection(ws);
      });

      // Start metrics collection
      this.startMetricsCollection();

      // Start auth flow monitoring
      this.startAuthFlowMonitoring();

      // Start alert monitoring
      this.startAlertMonitoring();

      this.isRunning = true;
      logger.info('✅ Live Dashboard Service initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize Live Dashboard Service:', error);
      throw error;
    }
  }

  // ============================================================================
  // WEBSOCKET CONNECTION MANAGEMENT
  // ============================================================================

  private handleConnection(ws: WebSocket): void {
    this.clients.add(ws);
    logger.info(`Dashboard client connected. Total clients: ${this.clients.size}`);

    // Send initial data
    this.sendInitialData(ws);

    // Handle client messages
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleClientMessage(ws, message);
      } catch (error) {
        logger.error('Invalid WebSocket message:', error);
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      this.clients.delete(ws);
      logger.info(`Dashboard client disconnected. Total clients: ${this.clients.size}`);
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
      this.clients.delete(ws);
    });
  }

  private sendInitialData(ws: WebSocket): void {
    const initialData = {
      type: 'initial_data',
      data: {
        metrics: this.getCurrentMetrics(),
        authFlows: this.authFlowEvents.slice(-50), // Last 50 events
        alerts: this.alertEvents.slice(-20), // Last 20 alerts
        timestamp: Date.now()
      }
    };

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(initialData));
    }
  }

  private handleClientMessage(ws: WebSocket, message: any): void {
    switch (message.type) {
      case 'subscribe':
        // Client wants to subscribe to specific metrics
        this.handleSubscription(ws, message.data);
        break;
      case 'get_historical':
        // Client wants historical data
        this.sendHistoricalData(ws, message.data);
        break;
      case 'ping':
        // Heartbeat
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
      default:
        logger.warn('Unknown message type:', message.type);
    }
  }

  private handleSubscription(ws: WebSocket, subscription: any): void {
    // Handle client subscriptions to specific metrics
    logger.info('Client subscription:', subscription);
  }

  private sendHistoricalData(ws: WebSocket, request: any): void {
    const historicalData = {
      type: 'historical_data',
      data: {
        timeRange: request.timeRange,
        metrics: this.getHistoricalMetrics(request.timeRange),
        authFlows: this.getHistoricalAuthFlows(request.timeRange),
        alerts: this.getHistoricalAlerts(request.timeRange)
      }
    };

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(historicalData));
    }
  }

  // ============================================================================
  // METRICS COLLECTION
  // ============================================================================

  private startMetricsCollection(): void {
    // Collect metrics every 5 seconds
    this.metricsInterval = setInterval(() => {
      this.collectAndBroadcastMetrics();
    }, 5000);
  }

  private async collectAndBroadcastMetrics(): Promise<void> {
    try {
      const metrics = await this.getCurrentMetrics();
      
      // Broadcast to all connected clients
      this.broadcast({
        type: 'metrics_update',
        data: metrics,
        timestamp: Date.now()
      });

      // Emit event for other services
      this.emit('metrics_update', metrics);

    } catch (error) {
      logger.error('Failed to collect metrics:', error);
    }
  }

  private async getCurrentMetrics(): Promise<DashboardMetrics> {
    const authStats = authMonitoringService.getMetrics();
    const tokenStats = tokenRefreshService.getStats();
    const cacheStats = cacheService.getStats();
    const batchStats = batchQueue.getStats();
    const activeAlerts = observabilityService.getActiveAlerts();

    return {
      timestamp: Date.now(),
      auth: {
        activeSessions: authStats.totalLogins - authStats.failedLogins,
        loginSuccessRate: authStats.loginSuccessRate,
        tokenRefreshRate: tokenStats.successRate,
        failedAttempts: authStats.failedLogins,
        suspiciousActivity: authStats.suspiciousActivities
      },
      performance: {
        responseTime: metricsService.getMetricValue('http_request_duration_seconds') || 0,
        throughput: metricsService.getMetricValue('http_requests_total') || 0,
        errorRate: this.calculateErrorRate(),
        cacheHitRate: cacheStats.hitRate
      },
      system: {
        memoryUsage: process.memoryUsage().heapUsed,
        cpuUsage: this.getCpuUsage(),
        diskUsage: this.getDiskUsage(),
        uptime: process.uptime()
      },
      database: {
        connectionPool: 10, // Placeholder
        queryTime: metricsService.getMetricValue('database_operation_duration_seconds') || 0,
        batchQueueSize: batchStats.queueStats.reduce((sum, q) => sum + q.size, 0),
        failedQueries: metricsService.getMetricValue('database_operations_failed_total') || 0
      },
      alerts: {
        active: activeAlerts.length,
        critical: activeAlerts.filter(a => a.severity === 'critical').length,
        resolved: observabilityService.getAlertHistory().filter(a => a.resolved).length
      }
    };
  }

  private calculateErrorRate(): number {
    const totalRequests = metricsService.getMetricValue('http_requests_total') || 0;
    const failedRequests = metricsService.getMetricValue('http_requests_failed_total') || 0;
    return totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;
  }

  private getCpuUsage(): number {
    const usage = process.cpuUsage();
    return (usage.user + usage.system) / 1000000; // Convert to percentage
  }

  private getDiskUsage(): number {
    // Placeholder - would integrate with actual disk monitoring
    return 0;
  }

  // ============================================================================
  // AUTH FLOW MONITORING
  // ============================================================================

  private startAuthFlowMonitoring(): void {
    // Listen for auth events
    this.on('auth_event', (event: AuthFlowEvent) => {
      this.handleAuthFlowEvent(event);
    });
  }

  private handleAuthFlowEvent(event: AuthFlowEvent): void {
    // Add to events array
    this.authFlowEvents.push(event);

    // Keep only last 1000 events
    if (this.authFlowEvents.length > 1000) {
      this.authFlowEvents = this.authFlowEvents.slice(-1000);
    }

    // Broadcast to clients
    this.broadcast({
      type: 'auth_flow_event',
      data: event,
      timestamp: Date.now()
    });

    // Check for suspicious patterns
    this.checkSuspiciousPatterns(event);
  }

  private checkSuspiciousPatterns(event: AuthFlowEvent): void {
    if (!event.success) {
      // Check for rapid failed attempts from same IP
      const recentFailures = this.authFlowEvents.filter(e => 
        e.ipAddress === event.ipAddress && 
        !e.success && 
        Date.now() - e.timestamp < 60000 // Last minute
      );

      if (recentFailures.length >= 5) {
        this.triggerAlert({
          id: `suspicious_${event.ipAddress}_${Date.now()}`,
          timestamp: Date.now(),
          severity: 'high',
          type: 'suspicious_auth_activity',
          message: `Suspicious authentication activity detected from ${event.ipAddress}`,
          resolved: false,
          metadata: {
            ipAddress: event.ipAddress,
            failureCount: recentFailures.length,
            timeWindow: '1 minute'
          }
        });
      }
    }
  }

  // ============================================================================
  // ALERT MONITORING
  // ============================================================================

  private startAlertMonitoring(): void {
    // Listen for alert events
    this.on('alert_event', (event: AlertEvent) => {
      this.handleAlertEvent(event);
    });
  }

  private handleAlertEvent(event: AlertEvent): void {
    // Add to alerts array
    this.alertEvents.push(event);

    // Keep only last 500 alerts
    if (this.alertEvents.length > 500) {
      this.alertEvents = this.alertEvents.slice(-500);
    }

    // Broadcast to clients
    this.broadcast({
      type: 'alert_event',
      data: event,
      timestamp: Date.now()
    });
  }

  private triggerAlert(alert: AlertEvent): void {
    this.emit('alert_event', alert);
  }

  // ============================================================================
  // BROADCASTING
  // ============================================================================

  private broadcast(message: any): void {
    const messageStr = JSON.stringify(message);
    
    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr);
        } catch (error) {
          logger.error('Failed to send message to client:', error);
          this.clients.delete(ws);
        }
      }
    });
  }

  // ============================================================================
  // HISTORICAL DATA
  // ============================================================================

  private getHistoricalMetrics(timeRange: number): DashboardMetrics[] {
    // Placeholder - would implement actual historical data storage
    return [];
  }

  private getHistoricalAuthFlows(timeRange: number): AuthFlowEvent[] {
    const cutoff = Date.now() - timeRange;
    return this.authFlowEvents.filter(event => event.timestamp >= cutoff);
  }

  private getHistoricalAlerts(timeRange: number): AlertEvent[] {
    const cutoff = Date.now() - timeRange;
    return this.alertEvents.filter(alert => alert.timestamp >= cutoff);
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Record an auth flow event
   */
  recordAuthFlow(event: Omit<AuthFlowEvent, 'id' | 'timestamp'>): void {
    const authEvent: AuthFlowEvent = {
      ...event,
      id: `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    this.emit('auth_event', authEvent);
  }

  /**
   * Get current dashboard state
   */
  async getDashboardState(): Promise<{
    metrics: DashboardMetrics;
    authFlows: AuthFlowEvent[];
    alerts: AlertEvent[];
    connectedClients: number;
  }> {
    return {
      metrics: await this.getCurrentMetrics(),
      authFlows: this.authFlowEvents.slice(-100),
      alerts: this.alertEvents.slice(-50),
      connectedClients: this.clients.size
    };
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    averageResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
    activeSessions: number;
    systemHealth: 'healthy' | 'degraded' | 'unhealthy';
  } {
    const metrics = this.getCurrentMetrics();
    
    let systemHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (metrics.performance.errorRate > 10 || metrics.auth.loginSuccessRate < 80) {
      systemHealth = 'unhealthy';
    } else if (metrics.performance.errorRate > 5 || metrics.auth.loginSuccessRate < 90) {
      systemHealth = 'degraded';
    }

    return {
      averageResponseTime: metrics.performance.responseTime,
      errorRate: metrics.performance.errorRate,
      cacheHitRate: metrics.performance.cacheHitRate,
      activeSessions: metrics.auth.activeSessions,
      systemHealth
    };
  }

  // ============================================================================
  // SHUTDOWN
  // ============================================================================

  async shutdown(): Promise<void> {
    try {
      this.isRunning = false;

      // Stop metrics collection
      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
        this.metricsInterval = null;
      }

      // Close WebSocket server
      if (this.wss) {
        this.wss.close();
        this.wss = null;
      }

      // Close all client connections
      this.clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
      this.clients.clear();

      logger.info('Live Dashboard Service shutdown complete');
    } catch (error) {
      logger.error('Error during Live Dashboard Service shutdown:', error);
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const liveDashboardService = new LiveDashboardService();