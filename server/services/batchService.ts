/**
 * Database Batch Service
 * Implements request batching to reduce DB round-trips
 * Queues operations and commits them in batches for optimal performance
 */

import { logger } from '../utils/logger';
import { cacheService } from './cacheService';

// ============================================================================
// BATCH OPERATION TYPES
// ============================================================================

export interface BatchOperation {
  id: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE' | 'UPSERT';
  table: string;
  data: any;
  where?: any;
  timestamp: number;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  retryCount: number;
  maxRetries: number;
}

export interface BatchConfig {
  maxBatchSize: number;
  maxWaitTime: number; // milliseconds
  maxRetries: number;
  retryDelay: number; // milliseconds
  enablePriority: boolean;
  enableDeduplication: boolean;
}

export interface BatchResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors: Array<{
    operationId: string;
    error: string;
  }>;
  executionTime: number;
}

// ============================================================================
// BATCH QUEUE MANAGER
// ============================================================================

export class BatchQueueManager {
  private queues: Map<string, BatchOperation[]> = new Map();
  private config: BatchConfig;
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private isProcessing = false;
  private stats = {
    totalProcessed: 0,
    totalFailed: 0,
    totalBatches: 0,
    averageBatchSize: 0,
    averageExecutionTime: 0
  };

  constructor(config: Partial<BatchConfig> = {}) {
    this.config = {
      maxBatchSize: 100,
      maxWaitTime: 1000, // 1 second
      maxRetries: 3,
      retryDelay: 1000,
      enablePriority: true,
      enableDeduplication: true,
      ...config
    };
  }

  // ============================================================================
  // QUEUE OPERATIONS
  // ============================================================================

  /**
   * Add operation to batch queue
   */
  async addOperation(operation: Omit<BatchOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const operationId = this.generateOperationId();
    const fullOperation: BatchOperation = {
      ...operation,
      id: operationId,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: operation.maxRetries || this.config.maxRetries
    };

    // Deduplicate if enabled
    if (this.config.enableDeduplication) {
      const existing = this.findDuplicateOperation(fullOperation);
      if (existing) {
        logger.debug(`Deduplicating operation ${operationId}`, { existingId: existing.id });
        return existing.id;
      }
    }

    // Add to appropriate queue
    const queueKey = this.getQueueKey(operation.table, operation.type);
    if (!this.queues.has(queueKey)) {
      this.queues.set(queueKey, []);
    }

    const queue = this.queues.get(queueKey)!;
    queue.push(fullOperation);

    // Sort by priority if enabled
    if (this.config.enablePriority) {
      queue.sort((a, b) => this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority));
    }

    // Schedule processing if batch is ready
    this.scheduleProcessing(queueKey);

    logger.debug(`Added operation ${operationId} to queue ${queueKey}`, {
      queueSize: queue.length,
      priority: operation.priority
    });

    return operationId;
  }

  /**
   * Process batch for a specific queue
   */
  private async processBatch(queueKey: string): Promise<BatchResult> {
    const queue = this.queues.get(queueKey);
    if (!queue || queue.length === 0) {
      return {
        success: true,
        processedCount: 0,
        failedCount: 0,
        errors: [],
        executionTime: 0
      };
    }

    const startTime = Date.now();
    const batchSize = Math.min(queue.length, this.config.maxBatchSize);
    const batch = queue.splice(0, batchSize);
    
    logger.info(`Processing batch for ${queueKey}`, {
      batchSize,
      remainingInQueue: queue.length
    });

    try {
      const result = await this.executeBatch(batch);
      
      // Update stats
      this.updateStats(result, Date.now() - startTime);
      
      // Reschedule if there are more operations
      if (queue.length > 0) {
        this.scheduleProcessing(queueKey);
      }

      return result;
    } catch (error) {
      logger.error(`Batch processing failed for ${queueKey}:`, error);
      
      // Retry failed operations
      await this.retryFailedOperations(batch);
      
      return {
        success: false,
        processedCount: 0,
        failedCount: batch.length,
        errors: batch.map(op => ({
          operationId: op.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })),
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Execute batch operations
   */
  private async executeBatch(operations: BatchOperation[]): Promise<BatchResult> {
    const startTime = Date.now();
    const errors: Array<{ operationId: string; error: string }> = [];
    let processedCount = 0;
    let failedCount = 0;

    // Group operations by type for optimal execution
    const groupedOps = this.groupOperationsByType(operations);

    for (const [type, ops] of groupedOps.entries()) {
      try {
        const result = await this.executeOperationGroup(type, ops);
        processedCount += result.processedCount;
        failedCount += result.failedCount;
        errors.push(...result.errors);
      } catch (error) {
        logger.error(`Failed to execute ${type} operations:`, error);
        failedCount += ops.length;
        errors.push(...ops.map(op => ({
          operationId: op.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })));
      }
    }

    return {
      success: failedCount === 0,
      processedCount,
      failedCount,
      errors,
      executionTime: Date.now() - startTime
    };
  }

  /**
   * Execute operations of the same type
   */
  private async executeOperationGroup(type: string, operations: BatchOperation[]): Promise<BatchResult> {
    const startTime = Date.now();
    const errors: Array<{ operationId: string; error: string }> = [];
    let processedCount = 0;
    let failedCount = 0;

    try {
      switch (type) {
        case 'INSERT':
          await this.executeBulkInsert(operations);
          processedCount = operations.length;
          break;
        case 'UPDATE':
          await this.executeBulkUpdate(operations);
          processedCount = operations.length;
          break;
        case 'DELETE':
          await this.executeBulkDelete(operations);
          processedCount = operations.length;
          break;
        case 'UPSERT':
          await this.executeBulkUpsert(operations);
          processedCount = operations.length;
          break;
        default:
          throw new Error(`Unsupported operation type: ${type}`);
      }
    } catch (error) {
      logger.error(`Failed to execute ${type} operations:`, error);
      failedCount = operations.length;
      errors.push(...operations.map(op => ({
        operationId: op.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })));
    }

    return {
      success: failedCount === 0,
      processedCount,
      failedCount,
      errors,
      executionTime: Date.now() - startTime
    };
  }

  // ============================================================================
  // DATABASE OPERATIONS
  // ============================================================================

  private async executeBulkInsert(operations: BatchOperation[]): Promise<void> {
    // Group by table
    const tableGroups = new Map<string, BatchOperation[]>();
    
    for (const op of operations) {
      if (!tableGroups.has(op.table)) {
        tableGroups.set(op.table, []);
      }
      tableGroups.get(op.table)!.push(op);
    }

    // Execute bulk inserts for each table
    for (const [table, ops] of tableGroups.entries()) {
      const data = ops.map(op => op.data);
      await this.performBulkInsert(table, data);
      
      // Invalidate cache for affected tables
      await this.invalidateTableCache(table);
    }
  }

  private async executeBulkUpdate(operations: BatchOperation[]): Promise<void> {
    // Group by table
    const tableGroups = new Map<string, BatchOperation[]>();
    
    for (const op of operations) {
      if (!tableGroups.has(op.table)) {
        tableGroups.set(op.table, []);
      }
      tableGroups.get(op.table)!.push(op);
    }

    // Execute bulk updates for each table
    for (const [table, ops] of tableGroups.entries()) {
      await this.performBulkUpdate(table, ops);
      
      // Invalidate cache for affected tables
      await this.invalidateTableCache(table);
    }
  }

  private async executeBulkDelete(operations: BatchOperation[]): Promise<void> {
    // Group by table
    const tableGroups = new Map<string, BatchOperation[]>();
    
    for (const op of operations) {
      if (!tableGroups.has(op.table)) {
        tableGroups.set(op.table, []);
      }
      tableGroups.get(op.table)!.push(op);
    }

    // Execute bulk deletes for each table
    for (const [table, ops] of tableGroups.entries()) {
      const ids = ops.map(op => op.where?.id || op.data.id).filter(Boolean);
      if (ids.length > 0) {
        await this.performBulkDelete(table, ids);
        
        // Invalidate cache for affected tables
        await this.invalidateTableCache(table);
      }
    }
  }

  private async executeBulkUpsert(operations: BatchOperation[]): Promise<void> {
    // Group by table
    const tableGroups = new Map<string, BatchOperation[]>();
    
    for (const op of operations) {
      if (!tableGroups.has(op.table)) {
        tableGroups.set(op.table, []);
      }
      tableGroups.get(op.table)!.push(op);
    }

    // Execute bulk upserts for each table
    for (const [table, ops] of tableGroups.entries()) {
      const data = ops.map(op => op.data);
      await this.performBulkUpsert(table, data);
      
      // Invalidate cache for affected tables
      await this.invalidateTableCache(table);
    }
  }

  // ============================================================================
  // DATABASE IMPLEMENTATION (TO BE CONNECTED TO ACTUAL DB)
  // ============================================================================

  private async performBulkInsert(table: string, data: any[]): Promise<void> {
    // This would integrate with your actual database
    // For now, simulate the operation
    logger.info(`Bulk insert into ${table}`, { count: data.length });
    
    // Simulate database operation
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
  }

  private async performBulkUpdate(table: string, operations: BatchOperation[]): Promise<void> {
    // This would integrate with your actual database
    logger.info(`Bulk update on ${table}`, { count: operations.length });
    
    // Simulate database operation
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
  }

  private async performBulkDelete(table: string, ids: any[]): Promise<void> {
    // This would integrate with your actual database
    logger.info(`Bulk delete from ${table}`, { count: ids.length });
    
    // Simulate database operation
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
  }

  private async performBulkUpsert(table: string, data: any[]): Promise<void> {
    // This would integrate with your actual database
    logger.info(`Bulk upsert into ${table}`, { count: data.length });
    
    // Simulate database operation
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
  }

  // ============================================================================
  // CACHE INVALIDATION
  // ============================================================================

  private async invalidateTableCache(table: string): Promise<void> {
    try {
      await cacheService.invalidate(`${table}:*`);
      logger.debug(`Invalidated cache for table ${table}`);
    } catch (error) {
      logger.error(`Failed to invalidate cache for table ${table}:`, error);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getQueueKey(table: string, type: string): string {
    return `${table}_${type}`;
  }

  private getPriorityValue(priority: string): number {
    const priorityMap = {
      'CRITICAL': 4,
      'HIGH': 3,
      'NORMAL': 2,
      'LOW': 1
    };
    return priorityMap[priority as keyof typeof priorityMap] || 2;
  }

  private findDuplicateOperation(operation: BatchOperation): BatchOperation | null {
    const queueKey = this.getQueueKey(operation.table, operation.type);
    const queue = this.queues.get(queueKey);
    
    if (!queue) return null;

    // Simple deduplication based on table, type, and data hash
    const dataHash = JSON.stringify(operation.data);
    
    return queue.find(op => 
      op.table === operation.table &&
      op.type === operation.type &&
      JSON.stringify(op.data) === dataHash
    ) || null;
  }

  private groupOperationsByType(operations: BatchOperation[]): Map<string, BatchOperation[]> {
    const groups = new Map<string, BatchOperation[]>();
    
    for (const op of operations) {
      if (!groups.has(op.type)) {
        groups.set(op.type, []);
      }
      groups.get(op.type)!.push(op);
    }
    
    return groups;
  }

  private scheduleProcessing(queueKey: string): void {
    // Clear existing timer
    const existingTimer = this.timers.get(queueKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Schedule new processing
    const timer = setTimeout(async () => {
      await this.processBatch(queueKey);
      this.timers.delete(queueKey);
    }, this.config.maxWaitTime);

    this.timers.set(queueKey, timer);
  }

  private async retryFailedOperations(operations: BatchOperation[]): Promise<void> {
    for (const op of operations) {
      if (op.retryCount < op.maxRetries) {
        op.retryCount++;
        
        // Add back to queue with delay
        setTimeout(() => {
          this.addOperation(op);
        }, this.config.retryDelay * op.retryCount);
      } else {
        logger.error(`Operation ${op.id} exceeded max retries`, {
          retryCount: op.retryCount,
          maxRetries: op.maxRetries
        });
      }
    }
  }

  private updateStats(result: BatchResult, executionTime: number): void {
    this.stats.totalProcessed += result.processedCount;
    this.stats.totalFailed += result.failedCount;
    this.stats.totalBatches++;
    
    // Update averages
    const totalOps = this.stats.totalProcessed + this.stats.totalFailed;
    this.stats.averageBatchSize = totalOps / this.stats.totalBatches;
    this.stats.averageExecutionTime = 
      (this.stats.averageExecutionTime * (this.stats.totalBatches - 1) + executionTime) / 
      this.stats.totalBatches;
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Get queue statistics
   */
  getStats() {
    const queueStats = Array.from(this.queues.entries()).map(([key, queue]) => ({
      queueKey: key,
      size: queue.length,
      oldestOperation: queue.length > 0 ? Math.min(...queue.map(op => op.timestamp)) : null
    }));

    return {
      ...this.stats,
      activeQueues: this.queues.size,
      queueStats,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Force process all pending operations
   */
  async flushAll(): Promise<BatchResult[]> {
    const results: BatchResult[] = [];
    
    for (const queueKey of this.queues.keys()) {
      const result = await this.processBatch(queueKey);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Clear all queues
   */
  clearAll(): void {
    this.queues.clear();
    
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    
    logger.info('All batch queues cleared');
  }

  /**
   * Shutdown the batch service
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down batch service...');
    
    // Process remaining operations
    await this.flushAll();
    
    // Clear timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    
    logger.info('Batch service shutdown complete');
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Batch insert operations
 */
export async function batchInsert(table: string, data: any[], priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL' = 'NORMAL'): Promise<string[]> {
  const operationIds: string[] = [];
  
  for (const item of data) {
    const id = await batchQueue.addOperation({
      type: 'INSERT',
      table,
      data: item,
      priority
    });
    operationIds.push(id);
  }
  
  return operationIds;
}

/**
 * Batch update operations
 */
export async function batchUpdate(table: string, updates: Array<{ where: any; data: any }>, priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL' = 'NORMAL'): Promise<string[]> {
  const operationIds: string[] = [];
  
  for (const update of updates) {
    const id = await batchQueue.addOperation({
      type: 'UPDATE',
      table,
      data: update.data,
      where: update.where,
      priority
    });
    operationIds.push(id);
  }
  
  return operationIds;
}

/**
 * Batch delete operations
 */
export async function batchDelete(table: string, ids: any[], priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL' = 'NORMAL'): Promise<string[]> {
  const operationIds: string[] = [];
  
  for (const id of ids) {
    const operationId = await batchQueue.addOperation({
      type: 'DELETE',
      table,
      data: { id },
      where: { id },
      priority
    });
    operationIds.push(operationId);
  }
  
  return operationIds;
}

/**
 * Batch upsert operations
 */
export async function batchUpsert(table: string, data: any[], priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL' = 'NORMAL'): Promise<string[]> {
  const operationIds: string[] = [];
  
  for (const item of data) {
    const id = await batchQueue.addOperation({
      type: 'UPSERT',
      table,
      data: item,
      priority
    });
    operationIds.push(id);
  }
  
  return operationIds;
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const batchQueue = new BatchQueueManager({
  maxBatchSize: 100,
  maxWaitTime: 1000,
  maxRetries: 3,
  retryDelay: 1000,
  enablePriority: true,
  enableDeduplication: true
});