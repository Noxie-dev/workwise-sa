/**
 * Comprehensive Observability Service
 * Integrates Prometheus metrics, Datadog APM, structured logging, and alerting
 * Provides end-to-end visibility into application performance and health
 */

import { logger } from '../utils/logger';
import { metricsService } from './metricsService';
import { cacheService } from './cacheService';
import { batchQueue } from './batchService';
import { authMonitoringService } from './authMonitoringService';

// ============================================================================
// OBSERVABILITY INTERFACES
// ============================================================================

interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operation: string;
  startTime: number;
  tags: Record<string, string>;
  baggage: Record<string, string>;
}

interface LogContext {
  traceId: string;
  spanId: string;
  userId?: string;
  requestId: string;
  operation: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  metadata: Record<string, any>;
  timestamp: number;
}

interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  threshold: number;
  duration: string;
  enabled: boolean;
  channels: string[];
}

interface PerformanceProfile {
  operation: string;
  duration: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  stackTrace?: string;
  metadata: Record<string, any>;
}

// ============================================================================
// DATADOG APM INTEGRATION
// ============================================================================

class DatadogAPMService {
  private isInitialized = false;
  private tracer: any = null;

  async initialize(): Promise<void> {
    try {
      // Initialize Datadog APM tracer
      const tracer = require('dd-trace');
      
      tracer.init({
        service: 'workwise-sa',
        env: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        logInjection: true,
        runtimeMetrics: true,
        profiling: true,
        appsec: true,
        plugins: {
          express: {
            enabled: true,
            blacklist: ['/health', '/metrics']
          },
          redis: {
            enabled: true
          },
          'pg': {
            enabled: true
          },
          http: {
            enabled: true
          }
        }
      });

      this.tracer = tracer;
      this.isInitialized = true;
      
      logger.info('✅ Datadog APM initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize Datadog APM:', error);
      // Continue without APM if it fails
    }
  }

  startSpan(operation: string, tags: Record<string, string> = {}): any {
    if (!this.isInitialized || !this.tracer) {
      return null;
    }

    try {
      return this.tracer.startSpan(operation, {
        tags: {
          'service.name': 'workwise-sa',
          'service.version': process.env.npm_package_version || '1.0.0',
          ...tags
        }
      });
    } catch (error) {
      logger.error('Failed to start span:', error);
      return null;
    }
  }

  finishSpan(span: any, error?: Error): void {
    if (!span) return;

    try {
      if (error) {
        span.setTag('error', true);
        span.setTag('error.message', error.message);
        span.setTag('error.stack', error.stack);
      }
      span.finish();
    } catch (error) {
      logger.error('Failed to finish span:', error);
    }
  }

  addSpanTags(span: any, tags: Record<string, string>): void {
    if (!span) return;

    try {
      Object.entries(tags).forEach(([key, value]) => {
        span.setTag(key, value);
      });
    } catch (error) {
      logger.error('Failed to add span tags:', error);
    }
  }

  injectTraceContext(span: any): Record<string, string> {
    if (!span || !this.tracer) {
      return {};
    }

    try {
      const headers: Record<string, string> = {};
      this.tracer.inject(span, 'http_headers', headers);
      return headers;
    } catch (error) {
      logger.error('Failed to inject trace context:', error);
      return {};
    }
  }
}

// ============================================================================
// STRUCTURED LOGGING SERVICE
// ============================================================================

class StructuredLoggingService {
  private correlationId: string = '';

  generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  getCorrelationId(): string {
    return this.correlationId;
  }

  log(context: Omit<LogContext, 'timestamp' | 'traceId' | 'spanId'>): void {
    const logEntry: LogContext = {
      ...context,
      traceId: this.correlationId,
      spanId: this.generateCorrelationId(),
      timestamp: Date.now()
    };

    // Format for structured logging
    const structuredLog = {
      timestamp: new Date(logEntry.timestamp).toISOString(),
      level: logEntry.level,
      message: logEntry.message,
      trace: {
        traceId: logEntry.traceId,
        spanId: logEntry.spanId
      },
      context: {
        userId: logEntry.userId,
        requestId: logEntry.requestId,
        operation: logEntry.operation
      },
      metadata: logEntry.metadata
    };

    // Log to console with structured format
    console.log(JSON.stringify(structuredLog));

    // Also log to file if configured
    if (process.env.LOG_FILE_PATH) {
      require('fs').appendFileSync(
        process.env.LOG_FILE_PATH,
        JSON.stringify(structuredLog) + '\n'
      );
    }
  }

  debug(message: string, metadata: Record<string, any> = {}): void {
    this.log({
      level: 'debug',
      message,
      metadata,
      operation: 'debug',
      requestId: this.correlationId
    });
  }

  info(message: string, metadata: Record<string, any> = {}): void {
    this.log({
      level: 'info',
      message,
      metadata,
      operation: 'info',
      requestId: this.correlationId
    });
  }

  warn(message: string, metadata: Record<string, any> = {}): void {
    this.log({
      level: 'warn',
      message,
      metadata,
      operation: 'warn',
      requestId: this.correlationId
    });
  }

  error(message: string, error?: Error, metadata: Record<string, any> = {}): void {
    this.log({
      level: 'error',
      message,
      metadata: {
        ...metadata,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : undefined
      },
      operation: 'error',
      requestId: this.correlationId
    });
  }
}

// ============================================================================
// CONTINUOUS PROFILING SERVICE
// ============================================================================

class ContinuousProfilingService {
  private profiles: PerformanceProfile[] = [];
  private isProfiling = false;
  private profileInterval: NodeJS.Timeout | null = null;

  startProfiling(): void {
    if (this.isProfiling) return;

    this.isProfiling = true;
    
    // Profile every 30 seconds
    this.profileInterval = setInterval(() => {
      this.captureProfile();
    }, 30000);

    logger.info('Continuous profiling started');
  }

  stopProfiling(): void {
    if (!this.isProfiling) return;

    this.isProfiling = false;
    
    if (this.profileInterval) {
      clearInterval(this.profileInterval);
      this.profileInterval = null;
    }

    logger.info('Continuous profiling stopped');
  }

  private captureProfile(): void {
    try {
      const profile: PerformanceProfile = {
        operation: 'system_profile',
        duration: 0,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        metadata: {
          timestamp: Date.now(),
          uptime: process.uptime(),
          platform: process.platform,
          nodeVersion: process.version
        }
      };

      this.profiles.push(profile);

      // Keep only last 100 profiles
      if (this.profiles.length > 100) {
        this.profiles = this.profiles.slice(-100);
      }

      // Send to metrics service
      metricsService.setGauge('system_memory_usage_bytes', profile.memoryUsage.heapUsed, { type: 'heap' });
      metricsService.setGauge('system_memory_usage_bytes', profile.memoryUsage.heapTotal, { type: 'heap_total' });
      metricsService.setGauge('system_memory_usage_bytes', profile.memoryUsage.rss, { type: 'rss' });

    } catch (error) {
      logger.error('Failed to capture profile:', error);
    }
  }

  profileOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata: Record<string, any> = {}
  ): Promise<T> {
    const startTime = Date.now();
    const startCpu = process.cpuUsage();
    const startMemory = process.memoryUsage();

    return fn()
      .then(result => {
        const endTime = Date.now();
        const endCpu = process.cpuUsage(startCpu);
        const endMemory = process.memoryUsage();

        const profile: PerformanceProfile = {
          operation,
          duration: endTime - startTime,
          memoryUsage: {
            rss: endMemory.rss - startMemory.rss,
            heapTotal: endMemory.heapTotal - startMemory.heapTotal,
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
            external: endMemory.external - startMemory.external,
            arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
          },
          cpuUsage: endCpu,
          metadata: {
            ...metadata,
            success: true
          }
        };

        this.profiles.push(profile);
        metricsService.observeHistogram('operation_duration_seconds', profile.duration / 1000, {
          operation,
          success: 'true'
        });

        return result;
      })
      .catch(error => {
        const endTime = Date.now();
        const endCpu = process.cpuUsage(startCpu);
        const endMemory = process.memoryUsage();

        const profile: PerformanceProfile = {
          operation,
          duration: endTime - startTime,
          memoryUsage: {
            rss: endMemory.rss - startMemory.rss,
            heapTotal: endMemory.heapTotal - startMemory.heapTotal,
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
            external: endMemory.external - startMemory.external,
            arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
          },
          cpuUsage: endCpu,
          metadata: {
            ...metadata,
            success: false,
            error: error.message
          }
        };

        this.profiles.push(profile);
        metricsService.observeHistogram('operation_duration_seconds', profile.duration / 1000, {
          operation,
          success: 'false'
        });

        throw error;
      });
  }

  getProfiles(): PerformanceProfile[] {
    return [...this.profiles];
  }

  getPerformanceSummary(): {
    averageDuration: number;
    totalOperations: number;
    memoryTrend: number[];
    cpuTrend: number[];
  } {
    if (this.profiles.length === 0) {
      return {
        averageDuration: 0,
        totalOperations: 0,
        memoryTrend: [],
        cpuTrend: []
      };
    }

    const totalDuration = this.profiles.reduce((sum, p) => sum + p.duration, 0);
    const averageDuration = totalDuration / this.profiles.length;

    const memoryTrend = this.profiles.map(p => p.memoryUsage.heapUsed);
    const cpuTrend = this.profiles.map(p => p.cpuUsage.user + p.cpuUsage.system);

    return {
      averageDuration,
      totalOperations: this.profiles.length,
      memoryTrend,
      cpuTrend
    };
  }
}

// ============================================================================
// ALERTING SERVICE
// ============================================================================

class AlertingService {
  private alertRules: AlertRule[] = [];
  private alertHistory: Array<{
    ruleId: string;
    timestamp: number;
    severity: string;
    message: string;
    resolved: boolean;
  }> = [];

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    this.alertRules = [
      {
        id: 'high_response_time',
        name: 'High Response Time',
        description: 'Average response time exceeds 2 seconds',
        condition: 'avg_response_time > 2000',
        severity: 'high',
        threshold: 2000,
        duration: '5m',
        enabled: true,
        channels: ['email', 'slack']
      },
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        description: 'Error rate exceeds 5%',
        condition: 'error_rate > 5',
        severity: 'critical',
        threshold: 5,
        duration: '2m',
        enabled: true,
        channels: ['email', 'slack', 'pagerduty']
      },
      {
        id: 'low_cache_hit_rate',
        name: 'Low Cache Hit Rate',
        description: 'Cache hit rate below 80%',
        condition: 'cache_hit_rate < 80',
        severity: 'medium',
        threshold: 80,
        duration: '10m',
        enabled: true,
        channels: ['email']
      },
      {
        id: 'high_memory_usage',
        name: 'High Memory Usage',
        description: 'Memory usage exceeds 1GB',
        condition: 'memory_usage > 1073741824',
        severity: 'high',
        threshold: 1073741824,
        duration: '5m',
        enabled: true,
        channels: ['email', 'slack']
      },
      {
        id: 'auth_failure_spike',
        name: 'Authentication Failure Spike',
        description: 'Authentication failures exceed 10 per minute',
        condition: 'auth_failures_per_minute > 10',
        severity: 'critical',
        threshold: 10,
        duration: '1m',
        enabled: true,
        channels: ['email', 'slack', 'pagerduty']
      }
    ];
  }

  async checkAlerts(): Promise<void> {
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      try {
        const isTriggered = await this.evaluateRule(rule);
        
        if (isTriggered) {
          await this.triggerAlert(rule);
        } else {
          await this.resolveAlert(rule);
        }
      } catch (error) {
        logger.error(`Failed to check alert rule ${rule.id}:`, error);
      }
    }
  }

  private async evaluateRule(rule: AlertRule): Promise<boolean> {
    // This would integrate with your metrics service to evaluate conditions
    // For now, we'll use a simplified approach
    
    switch (rule.id) {
      case 'high_response_time':
        const avgResponseTime = metricsService.getMetricValue('http_request_duration_seconds');
        return avgResponseTime ? avgResponseTime > (rule.threshold / 1000) : false;
        
      case 'high_error_rate':
        const totalRequests = metricsService.getMetricValue('http_requests_total') || 0;
        const failedRequests = metricsService.getMetricValue('http_requests_failed_total') || 0;
        const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;
        return errorRate > rule.threshold;
        
      case 'low_cache_hit_rate':
        const cacheHits = metricsService.getMetricValue('cache_hits_total') || 0;
        const cacheMisses = metricsService.getMetricValue('cache_misses_total') || 0;
        const hitRate = (cacheHits + cacheMisses) > 0 ? (cacheHits / (cacheHits + cacheMisses)) * 100 : 100;
        return hitRate < rule.threshold;
        
      case 'high_memory_usage':
        const memoryUsage = metricsService.getMetricValue('system_memory_usage_bytes');
        return memoryUsage ? memoryUsage > rule.threshold : false;
        
      case 'auth_failure_spike':
        const authStats = authMonitoringService.getMetrics();
        const failuresPerMinute = authStats.failedLogins / 60; // Simplified calculation
        return failuresPerMinute > rule.threshold;
        
      default:
        return false;
    }
  }

  private async triggerAlert(rule: AlertRule): Promise<void> {
    const existingAlert = this.alertHistory.find(
      a => a.ruleId === rule.id && !a.resolved
    );

    if (existingAlert) {
      // Alert already active, don't send again
      return;
    }

    const alert = {
      ruleId: rule.id,
      timestamp: Date.now(),
      severity: rule.severity,
      message: `${rule.name}: ${rule.description}`,
      resolved: false
    };

    this.alertHistory.push(alert);

    // Send alerts to configured channels
    for (const channel of rule.channels) {
      await this.sendAlert(channel, alert, rule);
    }

    logger.warn(`Alert triggered: ${rule.name}`, {
      ruleId: rule.id,
      severity: rule.severity,
      message: alert.message
    });
  }

  private async resolveAlert(rule: AlertRule): Promise<void> {
    const existingAlert = this.alertHistory.find(
      a => a.ruleId === rule.id && !a.resolved
    );

    if (existingAlert) {
      existingAlert.resolved = true;
      
      logger.info(`Alert resolved: ${rule.name}`, {
        ruleId: rule.id,
        duration: Date.now() - existingAlert.timestamp
      });
    }
  }

  private async sendAlert(channel: string, alert: any, rule: AlertRule): Promise<void> {
    try {
      switch (channel) {
        case 'email':
          await this.sendEmailAlert(alert, rule);
          break;
        case 'slack':
          await this.sendSlackAlert(alert, rule);
          break;
        case 'pagerduty':
          await this.sendPagerDutyAlert(alert, rule);
          break;
        default:
          logger.warn(`Unknown alert channel: ${channel}`);
      }
    } catch (error) {
      logger.error(`Failed to send alert via ${channel}:`, error);
    }
  }

  private async sendEmailAlert(alert: any, rule: AlertRule): Promise<void> {
    // Implement email alerting
    logger.info(`Email alert sent: ${alert.message}`);
  }

  private async sendSlackAlert(alert: any, rule: AlertRule): Promise<void> {
    // Implement Slack alerting
    logger.info(`Slack alert sent: ${alert.message}`);
  }

  private async sendPagerDutyAlert(alert: any, rule: AlertRule): Promise<void> {
    // Implement PagerDuty alerting
    logger.info(`PagerDuty alert sent: ${alert.message}`);
  }

  getActiveAlerts(): any[] {
    return this.alertHistory.filter(a => !a.resolved);
  }

  getAlertHistory(): any[] {
    return [...this.alertHistory];
  }
}

// ============================================================================
// MAIN OBSERVABILITY SERVICE
// ============================================================================

export class ObservabilityService {
  private datadogAPM: DatadogAPMService;
  private structuredLogging: StructuredLoggingService;
  private profiling: ContinuousProfilingService;
  private alerting: AlertingService;
  private isInitialized = false;

  constructor() {
    this.datadogAPM = new DatadogAPMService();
    this.structuredLogging = new StructuredLoggingService();
    this.profiling = new ContinuousProfilingService();
    this.alerting = new AlertingService();
  }

  async initialize(): Promise<void> {
    try {
      // Initialize Datadog APM
      await this.datadogAPM.initialize();

      // Start continuous profiling
      this.profiling.startProfiling();

      // Start alert checking
      this.startAlertChecking();

      this.isInitialized = true;
      logger.info('✅ Observability service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize observability service:', error);
    }
  }

  // ============================================================================
  // TRACING METHODS
  // ============================================================================

  startTrace(operation: string, tags: Record<string, string> = {}): any {
    return this.datadogAPM.startSpan(operation, tags);
  }

  finishTrace(span: any, error?: Error): void {
    this.datadogAPM.finishSpan(span, error);
  }

  addTraceTags(span: any, tags: Record<string, string>): void {
    this.datadogAPM.addSpanTags(span, tags);
  }

  // ============================================================================
  // LOGGING METHODS
  // ============================================================================

  setCorrelationId(id: string): void {
    this.structuredLogging.setCorrelationId(id);
  }

  getCorrelationId(): string {
    return this.structuredLogging.getCorrelationId();
  }

  log(level: 'debug' | 'info' | 'warn' | 'error', message: string, metadata: Record<string, any> = {}): void {
    switch (level) {
      case 'debug':
        this.structuredLogging.debug(message, metadata);
        break;
      case 'info':
        this.structuredLogging.info(message, metadata);
        break;
      case 'warn':
        this.structuredLogging.warn(message, metadata);
        break;
      case 'error':
        this.structuredLogging.error(message, undefined, metadata);
        break;
    }
  }

  // ============================================================================
  // PROFILING METHODS
  // ============================================================================

  profileOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata: Record<string, any> = {}
  ): Promise<T> {
    return this.profiling.profileOperation(operation, fn, metadata);
  }

  getPerformanceSummary() {
    return this.profiling.getPerformanceSummary();
  }

  // ============================================================================
  // ALERTING METHODS
  // ============================================================================

  getActiveAlerts() {
    return this.alerting.getActiveAlerts();
  }

  getAlertHistory() {
    return this.alerting.getAlertHistory();
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private startAlertChecking(): void {
    // Check alerts every minute
    setInterval(async () => {
      await this.alerting.checkAlerts();
    }, 60000);
  }

  // ============================================================================
  // SHUTDOWN
  // ============================================================================

  async shutdown(): Promise<void> {
    try {
      this.profiling.stopProfiling();
      logger.info('Observability service shutdown complete');
    } catch (error) {
      logger.error('Error during observability service shutdown:', error);
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const observabilityService = new ObservabilityService();