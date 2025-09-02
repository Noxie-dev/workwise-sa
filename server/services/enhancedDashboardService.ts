/**
 * Enhanced Live Dashboard Service
 * Production-ready, scalable dashboard with robust error handling,
 * data persistence, and horizontal scaling support
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { EventEmitter } from 'events';
import { Redis } from 'redis';
import { metricsService } from './metricsService';
import { cacheService } from './cacheService';
import { batchQueue } from './batchService';
import { authMonitoringService } from './authMonitoringService';
import { tokenRefreshService } from './tokenRefreshService';
import { observabilityService } from './observabilityService';
import { logger } from '../utils/logger';

// ============================================================================
// ENHANCED INTERFACES
// ============================================================================

interface DashboardConfig {
  maxClients: number;
  metricsInterval: number;
  dataRetentionHours: number;
  maxEventsPerType: number;
  enablePersistence: boolean;
  enableHorizontalScaling: boolean;
  redisConfig?: {
    host: string;
    port: number;
    password?: string;
  };
}

interface ClientSession {
  id: string;
  ws: WebSocket;
  subscriptions: Set<string>;
  lastPing: number;
  metadata: {
    userAgent?: string;
    ip?: string;
    userId?: string;
  };
}

interface MetricsSnapshot {
  timestamp: number;
  metrics: any;
  version: number;
}

interface EventStore {
  authFlows: Map<string, any[]>;
  alerts: Map<string, any[]>;
  metrics: Map<string, MetricsSnapshot[]>;
}

// ============================================================================
// ENHANCED LIVE DASHBOARD SERVICE
// ============================================================================

export class EnhancedDashboardService extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientSession> = new Map();
  private redis: Redis | null = null;
  private config: DashboardConfig;
  private eventStore: EventStore;
  private metricsInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private metricsVersion = 0;

  constructor(config: Partial<DashboardConfig> = {}) {
    super();
    
    this.config = {
      maxClients: 1000,
      metricsInterval: 5000,
      dataRetentionHours: 24,
      maxEventsPerType: 10000,
      enablePersistence: true,
      enableHorizontalScaling: false,
      ...config
    };

    this.eventStore = {
      authFlows: new Map(),
      alerts: new Map(),
      metrics: new Map()
    };

    // Set up error handling
    this.setupErrorHandling();
  }

  // ============================================================================
  // INITIALIZATION WITH ROBUST ERROR HANDLING
  // ============================================================================

  async initialize(server: Server): Promise<void> {
    try {
      // Initialize Redis for horizontal scaling
      if (this.config.enableHorizontalScaling && this.config.redisConfig) {
        await this.initializeRedis();
      }

      // Create WebSocket server with robust configuration
      this.wss = new WebSocketServer({ 
        server,
        path: '/ws/dashboard',
        maxPayload: 1024 * 1024, // 1MB max payload
        perMessageDeflate: {
          threshold: 1024,
          concurrencyLimit: 10,
          memLevel: 7
        }
      });

      // Set up WebSocket server event handlers
      this.setupWebSocketServer();

      // Start background processes
      this.startMetricsCollection();
      this.startCleanupProcess();
      this.startHealthChecks();

      // Load historical data if persistence is enabled
      if (this.config.enablePersistence) {
        await this.loadHistoricalData();
      }

      this.isRunning = true;
      logger.info('✅ Enhanced Live Dashboard Service initialized', {
        maxClients: this.config.maxClients,
        persistence: this.config.enablePersistence,
        horizontalScaling: this.config.enableHorizontalScaling
      });

    } catch (error) {
      logger.error('❌ Failed to initialize Enhanced Dashboard Service:', error);
      throw error;
    }
  }

  private async initializeRedis(): Promise<void> {
    try {
      this.redis = new Redis({
        host: this.config.redisConfig!.host,
        port: this.config.redisConfig!.port,
        password: this.config.redisConfig!.password,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });

      this.redis.on('error', (error) => {
        logger.error('Redis connection error:', error);
        // Continue without Redis if it fails
        this.redis = null;
      });

      this.redis.on('connect', () => {
        logger.info('✅ Redis connected for dashboard scaling');
      });

      await this.redis.connect();
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      this.redis = null;
    }
  }

  private setupWebSocketServer(): void {
    if (!this.wss) return;

    this.wss.on('connection', (ws: WebSocket, request) => {
      this.handleConnection(ws, request);
    });

    this.wss.on('error', (error) => {
      logger.error('WebSocket server error:', error);
    });

    this.wss.on('close', () => {
      logger.info('WebSocket server closed');
    });
  }

  private setupErrorHandling(): void {
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception in dashboard service:', error);
      this.broadcastError('system_error', 'An unexpected error occurred');
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection in dashboard service:', reason);
      this.broadcastError('system_error', 'An unexpected error occurred');
    });
  }

  // ============================================================================
  // ROBUST CONNECTION MANAGEMENT
  // ============================================================================

  private handleConnection(ws: WebSocket, request: any): void {
    // Check client limit
    if (this.clients.size >= this.config.maxClients) {
      logger.warn('Client limit reached, rejecting connection');
      ws.close(1013, 'Server overloaded');
      return;
    }

    const clientId = this.generateClientId();
    const clientSession: ClientSession = {
      id: clientId,
      ws,
      subscriptions: new Set(),
      lastPing: Date.now(),
      metadata: {
        userAgent: request.headers['user-agent'],
        ip: request.connection.remoteAddress
      }
    };

    this.clients.set(clientId, clientSession);
    
    logger.info(`Dashboard client connected`, {
      clientId,
      totalClients: this.clients.size,
      ip: clientSession.metadata.ip
    });

    // Set up client event handlers
    this.setupClientHandlers(clientSession);

    // Send initial data
    this.sendInitialData(clientSession);

    // Start ping/pong for connection health
    this.startClientHealthCheck(clientSession);
  }

  private setupClientHandlers(session: ClientSession): void {
    const { ws, id } = session;

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleClientMessage(session, message);
      } catch (error) {
        logger.error(`Invalid message from client ${id}:`, error);
        this.sendError(session, 'invalid_message', 'Invalid message format');
      }
    });

    ws.on('close', (code: number, reason: Buffer) => {
      this.handleClientDisconnect(session, code, reason.toString());
    });

    ws.on('error', (error) => {
      logger.error(`WebSocket error for client ${id}:`, error);
      this.handleClientDisconnect(session, 1006, 'Connection error');
    });

    ws.on('pong', () => {
      session.lastPing = Date.now();
    });
  }

  private handleClientDisconnect(session: ClientSession, code: number, reason: string): void {
    this.clients.delete(session.id);
    
    logger.info(`Dashboard client disconnected`, {
      clientId: session.id,
      code,
      reason,
      totalClients: this.clients.size
    });

    // Clean up subscriptions
    session.subscriptions.clear();
  }

  private startClientHealthCheck(session: ClientSession): void {
    const healthCheckInterval = setInterval(() => {
      if (!this.clients.has(session.id)) {
        clearInterval(healthCheckInterval);
        return;
      }

      const timeSinceLastPing = Date.now() - session.lastPing;
      
      if (timeSinceLastPing > 30000) { // 30 seconds timeout
        logger.warn(`Client ${session.id} health check failed, disconnecting`);
        session.ws.close(1000, 'Health check timeout');
        clearInterval(healthCheckInterval);
        return;
      }

      // Send ping
      if (session.ws.readyState === WebSocket.OPEN) {
        session.ws.ping();
      }
    }, 10000); // Check every 10 seconds
  }

  // ============================================================================
  // SCALABLE METRICS COLLECTION
  // ============================================================================

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(async () => {
      try {
        await this.collectAndDistributeMetrics();
      } catch (error) {
        logger.error('Metrics collection error:', error);
      }
    }, this.config.metricsInterval);
  }

  private async collectAndDistributeMetrics(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Collect metrics in parallel for better performance
      const [metrics, authStats, tokenStats, cacheStats, batchStats] = await Promise.all([
        this.getCurrentMetrics(),
        authMonitoringService.getMetrics(),
        tokenRefreshService.getStats(),
        cacheService.getStats(),
        batchQueue.getStats()
      ]);

      this.metricsVersion++;
      const metricsSnapshot: MetricsSnapshot = {
        timestamp: Date.now(),
        metrics: {
          ...metrics,
          auth: authStats,
          token: tokenStats,
          cache: cacheStats,
          batch: batchStats
        },
        version: this.metricsVersion
      };

      // Store metrics for persistence
      if (this.config.enablePersistence) {
        await this.storeMetrics(metricsSnapshot);
      }

      // Distribute to clients
      this.distributeMetrics(metricsSnapshot);

      // Emit for other services
      this.emit('metrics_update', metricsSnapshot);

      const collectionTime = Date.now() - startTime;
      if (collectionTime > 1000) {
        logger.warn(`Metrics collection took ${collectionTime}ms`);
      }

    } catch (error) {
      logger.error('Failed to collect metrics:', error);
      this.broadcastError('metrics_error', 'Failed to collect metrics');
    }
  }

  private async storeMetrics(snapshot: MetricsSnapshot): Promise<void> {
    try {
      // Store in memory
      const key = `metrics:${Math.floor(snapshot.timestamp / 60000)}`; // Group by minute
      if (!this.eventStore.metrics.has(key)) {
        this.eventStore.metrics.set(key, []);
      }
      
      const metricsArray = this.eventStore.metrics.get(key)!;
      metricsArray.push(snapshot);
      
      // Keep only recent metrics
      if (metricsArray.length > 60) { // Keep 60 snapshots per minute
        metricsArray.splice(0, metricsArray.length - 60);
      }

      // Store in Redis if available
      if (this.redis) {
        await this.redis.setex(
          `dashboard:metrics:${key}`,
          3600, // 1 hour TTL
          JSON.stringify(metricsArray)
        );
      }

    } catch (error) {
      logger.error('Failed to store metrics:', error);
    }
  }

  private distributeMetrics(snapshot: MetricsSnapshot): void {
    const message = {
      type: 'metrics_update',
      data: snapshot,
      timestamp: Date.now()
    };

    // Distribute to subscribed clients
    this.clients.forEach(session => {
      if (session.subscriptions.has('metrics') && session.ws.readyState === WebSocket.OPEN) {
        try {
          session.ws.send(JSON.stringify(message));
        } catch (error) {
          logger.error(`Failed to send metrics to client ${session.id}:`, error);
          this.clients.delete(session.id);
        }
      }
    });
  }

  // ============================================================================
  // DATA PERSISTENCE AND RECOVERY
  // ============================================================================

  private async loadHistoricalData(): Promise<void> {
    try {
      if (this.redis) {
        // Load recent metrics from Redis
        const keys = await this.redis.keys('dashboard:metrics:*');
        for (const key of keys.slice(-10)) { // Load last 10 minutes
          const data = await this.redis.get(key);
          if (data) {
            const metrics = JSON.parse(data);
            this.eventStore.metrics.set(key.replace('dashboard:metrics:', ''), metrics);
          }
        }
      }

      logger.info('Historical data loaded successfully');
    } catch (error) {
      logger.error('Failed to load historical data:', error);
    }
  }

  private startCleanupProcess(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldData();
    }, 300000); // Clean up every 5 minutes
  }

  private cleanupOldData(): void {
    const cutoff = Date.now() - (this.config.dataRetentionHours * 60 * 60 * 1000);
    
    // Clean up old metrics
    for (const [key, metrics] of this.eventStore.metrics.entries()) {
      const filtered = metrics.filter(m => m.timestamp > cutoff);
      if (filtered.length === 0) {
        this.eventStore.metrics.delete(key);
      } else {
        this.eventStore.metrics.set(key, filtered);
      }
    }

    // Clean up old auth flows
    for (const [key, flows] of this.eventStore.authFlows.entries()) {
      const filtered = flows.filter(f => f.timestamp > cutoff);
      if (filtered.length === 0) {
        this.eventStore.authFlows.delete(key);
      } else {
        this.eventStore.authFlows.set(key, filtered);
      }
    }

    // Clean up old alerts
    for (const [key, alerts] of this.eventStore.alerts.entries()) {
      const filtered = alerts.filter(a => a.timestamp > cutoff);
      if (filtered.length === 0) {
        this.eventStore.alerts.delete(key);
      } else {
        this.eventStore.alerts.set(key, filtered);
      }
    }

    logger.debug('Data cleanup completed');
  }

  // ============================================================================
  // HEALTH MONITORING
  // ============================================================================

  private startHealthChecks(): void {
    setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Health check every 30 seconds
  }

  private performHealthCheck(): void {
    const health = {
      timestamp: Date.now(),
      clients: this.clients.size,
      maxClients: this.config.maxClients,
      redisConnected: this.redis ? this.redis.status === 'ready' : false,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };

    // Check for issues
    if (this.clients.size > this.config.maxClients * 0.9) {
      logger.warn('Dashboard approaching client limit', health);
    }

    if (this.config.enableHorizontalScaling && this.redis && this.redis.status !== 'ready') {
      logger.error('Redis connection lost', health);
    }

    // Emit health status
    this.emit('health_check', health);
  }

  // ============================================================================
  // MESSAGE HANDLING
  // ============================================================================

  private handleClientMessage(session: ClientSession, message: any): void {
    try {
      switch (message.type) {
        case 'subscribe':
          this.handleSubscription(session, message.data);
          break;
        case 'unsubscribe':
          this.handleUnsubscription(session, message.data);
          break;
        case 'get_historical':
          this.sendHistoricalData(session, message.data);
          break;
        case 'ping':
          this.sendPong(session);
          break;
        case 'get_status':
          this.sendStatus(session);
          break;
        default:
          logger.warn(`Unknown message type from client ${session.id}:`, message.type);
          this.sendError(session, 'unknown_message_type', `Unknown message type: ${message.type}`);
      }
    } catch (error) {
      logger.error(`Error handling message from client ${session.id}:`, error);
      this.sendError(session, 'message_processing_error', 'Failed to process message');
    }
  }

  private handleSubscription(session: ClientSession, subscription: any): void {
    const { type, filters } = subscription;
    
    if (typeof type !== 'string') {
      this.sendError(session, 'invalid_subscription', 'Subscription type must be a string');
      return;
    }

    session.subscriptions.add(type);
    
    logger.info(`Client ${session.id} subscribed to ${type}`, { filters });
    
    // Send confirmation
    this.sendMessage(session, {
      type: 'subscription_confirmed',
      data: { type, filters }
    });
  }

  private handleUnsubscription(session: ClientSession, subscription: any): void {
    const { type } = subscription;
    session.subscriptions.delete(type);
    
    logger.info(`Client ${session.id} unsubscribed from ${type}`);
    
    this.sendMessage(session, {
      type: 'unsubscription_confirmed',
      data: { type }
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sendMessage(session: ClientSession, message: any): void {
    if (session.ws.readyState === WebSocket.OPEN) {
      try {
        session.ws.send(JSON.stringify(message));
      } catch (error) {
        logger.error(`Failed to send message to client ${session.id}:`, error);
        this.clients.delete(session.id);
      }
    }
  }

  private sendError(session: ClientSession, code: string, message: string): void {
    this.sendMessage(session, {
      type: 'error',
      data: { code, message, timestamp: Date.now() }
    });
  }

  private broadcastError(code: string, message: string): void {
    const errorMessage = {
      type: 'error',
      data: { code, message, timestamp: Date.now() }
    };

    this.clients.forEach(session => {
      this.sendMessage(session, errorMessage);
    });
  }

  private sendInitialData(session: ClientSession): void {
    const initialData = {
      type: 'initial_data',
      data: {
        config: {
          maxClients: this.config.maxClients,
          metricsInterval: this.config.metricsInterval,
          features: {
            persistence: this.config.enablePersistence,
            horizontalScaling: this.config.enableHorizontalScaling
          }
        },
        status: {
          connectedClients: this.clients.size,
          uptime: process.uptime(),
          version: this.metricsVersion
        },
        timestamp: Date.now()
      }
    };

    this.sendMessage(session, initialData);
  }

  private sendPong(session: ClientSession): void {
    this.sendMessage(session, {
      type: 'pong',
      timestamp: Date.now()
    });
  }

  private sendStatus(session: ClientSession): void {
    this.sendMessage(session, {
      type: 'status',
      data: {
        connectedClients: this.clients.size,
        maxClients: this.config.maxClients,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        redisConnected: this.redis ? this.redis.status === 'ready' : false
      }
    });
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Get dashboard statistics
   */
  getDashboardStats(): {
    connectedClients: number;
    maxClients: number;
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    redisConnected: boolean;
    metricsVersion: number;
  } {
    return {
      connectedClients: this.clients.size,
      maxClients: this.config.maxClients,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      redisConnected: this.redis ? this.redis.status === 'ready' : false,
      metricsVersion: this.metricsVersion
    };
  }

  /**
   * Broadcast message to all clients
   */
  broadcast(message: any): void {
    const messageStr = JSON.stringify(message);
    
    this.clients.forEach(session => {
      this.sendMessage(session, message);
    });
  }

  /**
   * Broadcast to specific subscription type
   */
  broadcastToSubscribers(type: string, message: any): void {
    this.clients.forEach(session => {
      if (session.subscriptions.has(type)) {
        this.sendMessage(session, message);
      }
    });
  }

  // ============================================================================
  // SHUTDOWN
  // ============================================================================

  async shutdown(): Promise<void> {
    try {
      this.isRunning = false;

      // Stop background processes
      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
        this.metricsInterval = null;
      }

      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
      }

      // Close Redis connection
      if (this.redis) {
        await this.redis.quit();
        this.redis = null;
      }

      // Close WebSocket server
      if (this.wss) {
        this.wss.close();
        this.wss = null;
      }

      // Close all client connections
      this.clients.forEach(session => {
        if (session.ws.readyState === WebSocket.OPEN) {
          session.ws.close(1000, 'Server shutdown');
        }
      });
      this.clients.clear();

      logger.info('Enhanced Dashboard Service shutdown complete');
    } catch (error) {
      logger.error('Error during Enhanced Dashboard Service shutdown:', error);
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const enhancedDashboardService = new EnhancedDashboardService({
  maxClients: 1000,
  metricsInterval: 5000,
  dataRetentionHours: 24,
  maxEventsPerType: 10000,
  enablePersistence: true,
  enableHorizontalScaling: true
});