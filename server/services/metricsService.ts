/**
 * Prometheus Metrics Service
 * Collects and exposes application metrics for monitoring
 * Integrates with Prometheus for metrics collection and Grafana for visualization
 */

import { logger } from '../utils/logger';
import { cacheService } from './cacheService';
import { batchQueue } from './batchService';
import { authMonitoringService } from './authMonitoringService';
import { tokenRefreshService } from './tokenRefreshService';

// ============================================================================
// METRICS INTERFACES
// ============================================================================

interface MetricValue {
  value: number;
  labels?: Record<string, string>;
  timestamp?: number;
}

interface CounterMetric {
  name: string;
  help: string;
  type: 'counter';
  values: MetricValue[];
}

interface GaugeMetric {
  name: string;
  help: string;
  type: 'gauge';
  values: MetricValue[];
}

interface HistogramMetric {
  name: string;
  help: string;
  type: 'histogram';
  buckets: number[];
  values: Array<{
    bucket: string;
    count: number;
    labels?: Record<string, string>;
  }>;
  sum: number;
  count: number;
}

interface SummaryMetric {
  name: string;
  help: string;
  type: 'summary';
  quantiles: Array<{
    quantile: number;
    value: number;
    labels?: Record<string, string>;
  }>;
  sum: number;
  count: number;
}

type Metric = CounterMetric | GaugeMetric | HistogramMetric | SummaryMetric;

// ============================================================================
// PROMETHEUS METRICS SERVICE
// ============================================================================

export class PrometheusMetricsService {
  private metrics: Map<string, Metric> = new Map();
  private isInitialized = false;
  private collectionInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeMetrics();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private initializeMetrics(): void {
    // HTTP Metrics
    this.registerCounter('http_requests_total', 'Total number of HTTP requests', {});
    this.registerCounter('http_requests_failed_total', 'Total number of failed HTTP requests', {});
    this.registerHistogram('http_request_duration_seconds', 'HTTP request duration in seconds', [0.1, 0.5, 1, 2, 5, 10]);
    this.registerGauge('http_requests_in_flight', 'Current number of HTTP requests being processed', {});

    // Database Metrics
    this.registerCounter('database_operations_total', 'Total number of database operations', {});
    this.registerCounter('database_operations_failed_total', 'Total number of failed database operations', {});
    this.registerHistogram('database_operation_duration_seconds', 'Database operation duration in seconds', [0.01, 0.05, 0.1, 0.5, 1, 2]);
    this.registerGauge('database_connections_active', 'Number of active database connections', {});
    this.registerGauge('database_connections_idle', 'Number of idle database connections', {});

    // Cache Metrics
    this.registerCounter('cache_operations_total', 'Total number of cache operations', {});
    this.registerCounter('cache_hits_total', 'Total number of cache hits', {});
    this.registerCounter('cache_misses_total', 'Total number of cache misses', {});
    this.registerGauge('cache_size_bytes', 'Current cache size in bytes', {});
    this.registerGauge('cache_entries_count', 'Current number of cache entries', {});

    // Authentication Metrics
    this.registerCounter('auth_requests_total', 'Total number of authentication requests', {});
    this.registerCounter('auth_requests_failed_total', 'Total number of failed authentication requests', {});
    this.registerCounter('auth_logins_total', 'Total number of login attempts', {});
    this.registerCounter('auth_logins_failed_total', 'Total number of failed login attempts', {});
    this.registerCounter('auth_token_refreshes_total', 'Total number of token refresh attempts', {});
    this.registerCounter('auth_token_refreshes_failed_total', 'Total number of failed token refresh attempts', {});
    this.registerGauge('auth_active_sessions', 'Number of active user sessions', {});

    // Batch Processing Metrics
    this.registerCounter('batch_operations_total', 'Total number of batch operations', {});
    this.registerCounter('batch_operations_failed_total', 'Total number of failed batch operations', {});
    this.registerGauge('batch_queue_size', 'Current batch queue size', {});
    this.registerHistogram('batch_processing_duration_seconds', 'Batch processing duration in seconds', [0.1, 0.5, 1, 2, 5, 10]);
    this.registerGauge('batch_operations_pending', 'Number of pending batch operations', {});

    // System Metrics
    this.registerGauge('system_memory_usage_bytes', 'Current memory usage in bytes', {});
    this.registerGauge('system_cpu_usage_percent', 'Current CPU usage percentage', {});
    this.registerGauge('system_disk_usage_bytes', 'Current disk usage in bytes', {});
    this.registerGauge('system_uptime_seconds', 'System uptime in seconds', {});

    // Business Metrics
    this.registerCounter('users_registered_total', 'Total number of user registrations', {});
    this.registerCounter('jobs_created_total', 'Total number of jobs created', {});
    this.registerCounter('job_applications_total', 'Total number of job applications', {});
    this.registerGauge('active_users_count', 'Number of active users', {});
    this.registerGauge('active_jobs_count', 'Number of active jobs', {});

    this.isInitialized = true;
    this.startMetricsCollection();
  }

  // ============================================================================
  // METRIC REGISTRATION
  // ============================================================================

  private registerCounter(name: string, help: string, labels: Record<string, string>): void {
    this.metrics.set(name, {
      name,
      help,
      type: 'counter',
      values: [{ value: 0, labels }]
    });
  }

  private registerGauge(name: string, help: string, labels: Record<string, string>): void {
    this.metrics.set(name, {
      name,
      help,
      type: 'gauge',
      values: [{ value: 0, labels }]
    });
  }

  private registerHistogram(name: string, help: string, buckets: number[]): void {
    this.metrics.set(name, {
      name,
      help,
      type: 'histogram',
      buckets,
      values: buckets.map(bucket => ({
        bucket: bucket.toString(),
        count: 0,
        labels: {}
      })),
      sum: 0,
      count: 0
    });
  }

  private registerSummary(name: string, help: string, quantiles: number[]): void {
    this.metrics.set(name, {
      name,
      help,
      type: 'summary',
      quantiles: quantiles.map(quantile => ({
        quantile,
        value: 0,
        labels: {}
      })),
      sum: 0,
      count: 0
    });
  }

  // ============================================================================
  // METRIC UPDATES
  // ============================================================================

  incrementCounter(name: string, labels?: Record<string, string>, value: number = 1): void {
    const metric = this.metrics.get(name) as CounterMetric;
    if (!metric) {
      logger.warn(`Counter metric ${name} not found`);
      return;
    }

    const existingValue = metric.values.find(v => 
      JSON.stringify(v.labels || {}) === JSON.stringify(labels || {})
    );

    if (existingValue) {
      existingValue.value += value;
    } else {
      metric.values.push({ value, labels });
    }
  }

  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name) as GaugeMetric;
    if (!metric) {
      logger.warn(`Gauge metric ${name} not found`);
      return;
    }

    const existingValue = metric.values.find(v => 
      JSON.stringify(v.labels || {}) === JSON.stringify(labels || {})
    );

    if (existingValue) {
      existingValue.value = value;
    } else {
      metric.values.push({ value, labels });
    }
  }

  observeHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name) as HistogramMetric;
    if (!metric) {
      logger.warn(`Histogram metric ${name} not found`);
      return;
    }

    metric.sum += value;
    metric.count++;

    // Update bucket counts
    for (const bucketValue of metric.values) {
      const bucket = parseFloat(bucketValue.bucket);
      if (value <= bucket) {
        bucketValue.count++;
      }
    }
  }

  observeSummary(name: string, value: number, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name) as SummaryMetric;
    if (!metric) {
      logger.warn(`Summary metric ${name} not found`);
      return;
    }

    metric.sum += value;
    metric.count++;

    // Update quantiles (simplified implementation)
    for (const quantile of metric.quantiles) {
      if (Math.random() < quantile.quantile) {
        quantile.value = value;
      }
    }
  }

  // ============================================================================
  // METRICS COLLECTION
  // ============================================================================

  private startMetricsCollection(): void {
    // Collect metrics every 30 seconds
    this.collectionInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.collectApplicationMetrics();
    }, 30000);

    logger.info('Prometheus metrics collection started');
  }

  private collectSystemMetrics(): void {
    try {
      // Memory usage
      const memUsage = process.memoryUsage();
      this.setGauge('system_memory_usage_bytes', memUsage.heapUsed, { type: 'heap' });
      this.setGauge('system_memory_usage_bytes', memUsage.heapTotal, { type: 'heap_total' });
      this.setGauge('system_memory_usage_bytes', memUsage.rss, { type: 'rss' });

      // CPU usage (simplified)
      const cpuUsage = process.cpuUsage();
      this.setGauge('system_cpu_usage_percent', (cpuUsage.user + cpuUsage.system) / 1000000, {});

      // Uptime
      this.setGauge('system_uptime_seconds', process.uptime(), {});

    } catch (error) {
      logger.error('Error collecting system metrics:', error);
    }
  }

  private collectApplicationMetrics(): void {
    try {
      // Cache metrics
      const cacheStats = cacheService.getStats();
      this.setGauge('cache_hits_total', cacheStats.hits, {});
      this.setGauge('cache_misses_total', cacheStats.misses, {});
      this.setGauge('cache_entries_count', cacheStats.memoryHits + cacheStats.redisHits, {});

      // Batch processing metrics
      const batchStats = batchQueue.getStats();
      this.setGauge('batch_queue_size', batchStats.queueStats.reduce((sum, q) => sum + q.size, 0), {});
      this.setGauge('batch_operations_pending', batchStats.queueStats.reduce((sum, q) => sum + q.size, 0), {});

      // Authentication metrics
      const authStats = authMonitoringService.getMetrics();
      this.setGauge('auth_logins_total', authStats.totalLogins, {});
      this.setGauge('auth_logins_failed_total', authStats.failedLogins, {});
      this.setGauge('auth_active_sessions', authStats.totalLogins - authStats.failedLogins, {});

      // Token refresh metrics
      const tokenStats = tokenRefreshService.getStats();
      this.setGauge('auth_token_refreshes_total', tokenStats.totalAttempts, {});
      this.setGauge('auth_token_refreshes_failed_total', tokenStats.failedAttempts, {});

    } catch (error) {
      logger.error('Error collecting application metrics:', error);
    }
  }

  // ============================================================================
  // PROMETHEUS FORMAT EXPORT
  // ============================================================================

  exportPrometheusFormat(): string {
    const lines: string[] = [];
    
    for (const metric of this.metrics.values()) {
      // Add help text
      lines.push(`# HELP ${metric.name} ${metric.help}`);
      lines.push(`# TYPE ${metric.name} ${metric.type}`);
      
      switch (metric.type) {
        case 'counter':
        case 'gauge':
          for (const value of metric.values) {
            const labels = value.labels ? 
              `{${Object.entries(value.labels).map(([k, v]) => `${k}="${v}"`).join(',')}}` : 
              '';
            lines.push(`${metric.name}${labels} ${value.value}`);
          }
          break;
          
        case 'histogram':
          const histMetric = metric as HistogramMetric;
          for (const value of histMetric.values) {
            const labels = value.labels ? 
              `{${Object.entries(value.labels).map(([k, v]) => `${k}="${v}"`).join(',')},le="${value.bucket}"}` : 
              `{le="${value.bucket}"}`;
            lines.push(`${metric.name}_bucket${labels} ${value.count}`);
          }
          lines.push(`${metric.name}_sum ${histMetric.sum}`);
          lines.push(`${metric.name}_count ${histMetric.count}`);
          break;
          
        case 'summary':
          const sumMetric = metric as SummaryMetric;
          for (const quantile of sumMetric.quantiles) {
            const labels = quantile.labels ? 
              `{${Object.entries(quantile.labels).map(([k, v]) => `${k}="${v}"`).join(',')},quantile="${quantile.quantile}"}` : 
              `{quantile="${quantile.quantile}"}`;
            lines.push(`${metric.name}${labels} ${quantile.value}`);
          }
          lines.push(`${metric.name}_sum ${sumMetric.sum}`);
          lines.push(`${metric.name}_count ${sumMetric.count}`);
          break;
      }
      
      lines.push(''); // Empty line between metrics
    }
    
    return lines.join('\n');
  }

  // ============================================================================
  // METRIC QUERIES
  // ============================================================================

  getMetric(name: string): Metric | undefined {
    return this.metrics.get(name);
  }

  getAllMetrics(): Map<string, Metric> {
    return new Map(this.metrics);
  }

  getMetricValue(name: string, labels?: Record<string, string>): number | undefined {
    const metric = this.metrics.get(name);
    if (!metric || (metric.type !== 'counter' && metric.type !== 'gauge')) {
      return undefined;
    }

    const counterOrGauge = metric as CounterMetric | GaugeMetric;
    const value = counterOrGauge.values.find(v => 
      JSON.stringify(v.labels || {}) === JSON.stringify(labels || {})
    );

    return value?.value;
  }

  // ============================================================================
  // CUSTOM METRICS
  // ============================================================================

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(method: string, path: string, statusCode: number, duration: number): void {
    const labels = { method, path, status: statusCode.toString() };
    
    this.incrementCounter('http_requests_total', labels);
    this.observeHistogram('http_request_duration_seconds', duration / 1000, labels);
    
    if (statusCode >= 400) {
      this.incrementCounter('http_requests_failed_total', labels);
    }
  }

  /**
   * Record database operation metrics
   */
  recordDatabaseOperation(operation: string, table: string, success: boolean, duration: number): void {
    const labels = { operation, table };
    
    this.incrementCounter('database_operations_total', labels);
    this.observeHistogram('database_operation_duration_seconds', duration / 1000, labels);
    
    if (!success) {
      this.incrementCounter('database_operations_failed_total', labels);
    }
  }

  /**
   * Record cache operation metrics
   */
  recordCacheOperation(operation: string, hit: boolean): void {
    const labels = { operation };
    
    this.incrementCounter('cache_operations_total', labels);
    
    if (hit) {
      this.incrementCounter('cache_hits_total', labels);
    } else {
      this.incrementCounter('cache_misses_total', labels);
    }
  }

  /**
   * Record authentication metrics
   */
  recordAuthOperation(operation: string, success: boolean): void {
    const labels = { operation };
    
    this.incrementCounter('auth_requests_total', labels);
    
    if (!success) {
      this.incrementCounter('auth_requests_failed_total', labels);
    }
    
    if (operation === 'login') {
      this.incrementCounter('auth_logins_total', {});
      if (!success) {
        this.incrementCounter('auth_logins_failed_total', {});
      }
    }
    
    if (operation === 'token_refresh') {
      this.incrementCounter('auth_token_refreshes_total', {});
      if (!success) {
        this.incrementCounter('auth_token_refreshes_failed_total', {});
      }
    }
  }

  /**
   * Record batch operation metrics
   */
  recordBatchOperation(operation: string, count: number, success: boolean, duration: number): void {
    const labels = { operation };
    
    this.incrementCounter('batch_operations_total', labels, count);
    this.observeHistogram('batch_processing_duration_seconds', duration / 1000, labels);
    
    if (!success) {
      this.incrementCounter('batch_operations_failed_total', labels, count);
    }
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  shutdown(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
    
    logger.info('Prometheus metrics service shutdown');
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const metricsService = new PrometheusMetricsService();