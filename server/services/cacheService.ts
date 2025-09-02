/**
 * Multi-Tier Cache Service
 * Implements a three-tier caching strategy:
 * 1. In-memory cache (μs latency) - for frequently accessed data
 * 2. Redis cache (ms latency) - for distributed caching
 * 3. Database fallback - when cache misses occur
 */

import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';
import { secretManager } from './secretManager';

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

interface CacheConfig {
  // In-memory cache settings
  memory: {
    maxSize: number;
    defaultTTL: number; // seconds
  };
  // Redis cache settings
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
    defaultTTL: number; // seconds
    retryDelayOnFailover: number;
    maxRetriesPerRequest: number;
  };
  // Cache invalidation settings
  invalidation: {
    enableAutoInvalidation: boolean;
    invalidationPatterns: string[];
  };
}

// ============================================================================
// CACHE INTERFACES
// ============================================================================

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  memoryHits: number;
  redisHits: number;
  dbFallbacks: number;
  totalRequests: number;
  hitRate: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // For cache invalidation by tags
  skipMemory?: boolean; // Skip in-memory cache
  skipRedis?: boolean; // Skip Redis cache
}

// ============================================================================
// MULTI-TIER CACHE SERVICE
// ============================================================================

export class MultiTierCacheService {
  private redisClient: RedisClientType | null = null;
  private memoryCache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    memoryHits: 0,
    redisHits: 0,
    dbFallbacks: 0,
    totalRequests: 0,
    hitRate: 0
  };
  private isInitialized = false;

  constructor() {
    this.config = {
      memory: {
        maxSize: 1000, // Maximum number of entries in memory cache
        defaultTTL: 300 // 5 minutes
      },
      redis: {
        host: 'localhost',
        port: 6379,
        db: 0,
        defaultTTL: 3600, // 1 hour
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3
      },
      invalidation: {
        enableAutoInvalidation: true,
        invalidationPatterns: ['user:*', 'session:*', 'token:*']
      }
    };
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize Redis connection
      await this.initializeRedis();
      
      // Start cleanup processes
      this.startMemoryCleanup();
      this.startStatsReset();
      
      this.isInitialized = true;
      logger.info('✅ Multi-tier cache service initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize cache service:', error);
      // Continue without Redis if it fails
      this.isInitialized = true;
    }
  }

  private async initializeRedis(): Promise<void> {
    try {
      const redisUrl = await secretManager.getSecret('REDIS_URL');
      
      if (redisUrl) {
        this.redisClient = createClient({
          url: redisUrl as string,
          retry_delay_on_failover: this.config.redis.retryDelayOnFailover,
          max_attempts: this.config.redis.maxRetriesPerRequest,
          socket: {
            reconnectStrategy: (retries) => {
              if (retries > 10) {
                logger.warn('Redis connection failed after 10 retries, giving up');
                return new Error('Redis connection failed');
              }
              return Math.min(retries * 50, 1000);
            }
          }
        });

        this.redisClient.on('error', (err) => {
          logger.error('Redis client error:', err);
        });

        this.redisClient.on('connect', () => {
          logger.info('✅ Redis client connected');
        });

        this.redisClient.on('disconnect', () => {
          logger.warn('Redis client disconnected');
        });

        await this.redisClient.connect();
      } else {
        logger.warn('No Redis URL provided, running without Redis cache');
      }
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      this.redisClient = null;
    }
  }

  // ============================================================================
  // CACHE OPERATIONS
  // ============================================================================

  /**
   * Get data from cache with multi-tier fallback
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    this.stats.totalRequests++;

    try {
      // Tier 1: In-memory cache (fastest)
      if (!options.skipMemory) {
        const memoryResult = this.getFromMemory<T>(key);
        if (memoryResult !== null) {
          this.stats.hits++;
          this.stats.memoryHits++;
          this.updateHitRate();
          return memoryResult;
        }
      }

      // Tier 2: Redis cache
      if (!options.skipRedis && this.redisClient) {
        const redisResult = await this.getFromRedis<T>(key);
        if (redisResult !== null) {
          this.stats.hits++;
          this.stats.redisHits++;
          this.updateHitRate();
          
          // Store in memory cache for faster future access
          if (!options.skipMemory) {
            this.setInMemory(key, redisResult, options.ttl);
          }
          
          return redisResult;
        }
      }

      // Cache miss
      this.stats.misses++;
      this.updateHitRate();
      return null;

    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  /**
   * Set data in cache with multi-tier storage
   */
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    try {
      const ttl = options.ttl || this.config.memory.defaultTTL;

      // Store in memory cache
      if (!options.skipMemory) {
        this.setInMemory(key, data, ttl);
      }

      // Store in Redis cache
      if (!options.skipRedis && this.redisClient) {
        await this.setInRedis(key, data, ttl);
      }

      // Handle cache tags for invalidation
      if (options.tags && options.tags.length > 0) {
        await this.addToTaggedCache(key, options.tags);
      }

    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete data from all cache tiers
   */
  async delete(key: string): Promise<void> {
    try {
      // Remove from memory cache
      this.memoryCache.delete(key);

      // Remove from Redis cache
      if (this.redisClient) {
        await this.redisClient.del(key);
      }

    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Invalidate cache by pattern or tags
   */
  async invalidate(pattern: string): Promise<void> {
    try {
      // Clear memory cache entries matching pattern
      const memoryKeys = Array.from(this.memoryCache.keys());
      const matchingMemoryKeys = memoryKeys.filter(key => this.matchesPattern(key, pattern));
      matchingMemoryKeys.forEach(key => this.memoryCache.delete(key));

      // Clear Redis cache entries matching pattern
      if (this.redisClient) {
        const redisKeys = await this.redisClient.keys(pattern);
        if (redisKeys.length > 0) {
          await this.redisClient.del(redisKeys);
        }
      }

      logger.info(`Invalidated cache entries matching pattern: ${pattern}`);

    } catch (error) {
      logger.error(`Cache invalidation error for pattern ${pattern}:`, error);
    }
  }

  /**
   * Get or set pattern - fetch from cache or execute function and cache result
   */
  async getOrSet<T>(
    key: string, 
    fetchFunction: () => Promise<T>, 
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch from source
    this.stats.dbFallbacks++;
    const data = await fetchFunction();
    
    // Cache the result
    await this.set(key, data, options);
    
    return data;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    // Check if expired
    if (this.isExpired(entry)) {
      this.memoryCache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.data as T;
  }

  private setInMemory<T>(key: string, data: T, ttl: number): void {
    // Check memory cache size limit
    if (this.memoryCache.size >= this.config.memory.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl * 1000, // Convert to milliseconds
      accessCount: 1,
      lastAccessed: Date.now()
    };

    this.memoryCache.set(key, entry);
  }

  private async getFromRedis<T>(key: string): Promise<T | null> {
    if (!this.redisClient) return null;

    try {
      const data = await this.redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Redis get error for key ${key}:`, error);
      return null;
    }
  }

  private async setInRedis<T>(key: string, data: T, ttl: number): Promise<void> {
    if (!this.redisClient) return;

    try {
      await this.redisClient.setEx(key, ttl, JSON.stringify(data));
    } catch (error) {
      logger.error(`Redis set error for key ${key}:`, error);
    }
  }

  private async addToTaggedCache(key: string, tags: string[]): Promise<void> {
    if (!this.redisClient) return;

    try {
      for (const tag of tags) {
        await this.redisClient.sAdd(`tag:${tag}`, key);
        await this.redisClient.expire(`tag:${tag}`, this.config.redis.defaultTTL);
      }
    } catch (error) {
      logger.error(`Redis tag error for key ${key}:`, error);
    }
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictLeastRecentlyUsed(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }

  private matchesPattern(key: string, pattern: string): boolean {
    // Simple pattern matching - can be enhanced with glob patterns
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(key);
    }
    return key === pattern;
  }

  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? (this.stats.hits / this.stats.totalRequests) * 100 
      : 0;
  }

  // ============================================================================
  // MAINTENANCE AND MONITORING
  // ============================================================================

  private startMemoryCleanup(): void {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.memoryCache.entries()) {
        if (this.isExpired(entry)) {
          this.memoryCache.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  private startStatsReset(): void {
    // Reset stats every hour
    setInterval(() => {
      this.stats = {
        hits: 0,
        misses: 0,
        memoryHits: 0,
        redisHits: 0,
        dbFallbacks: 0,
        totalRequests: 0,
        hitRate: 0
      };
    }, 60 * 60 * 1000);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache health status
   */
  async getHealth(): Promise<{
    memory: { size: number; maxSize: number };
    redis: { connected: boolean; error?: string };
    stats: CacheStats;
  }> {
    let redisConnected = false;
    let redisError: string | undefined;

    if (this.redisClient) {
      try {
        await this.redisClient.ping();
        redisConnected = true;
      } catch (error) {
        redisError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return {
      memory: {
        size: this.memoryCache.size,
        maxSize: this.config.memory.maxSize
      },
      redis: {
        connected: redisConnected,
        error: redisError
      },
      stats: this.getStats()
    };
  }

  /**
   * Clear all caches
   */
  async clearAll(): Promise<void> {
    try {
      // Clear memory cache
      this.memoryCache.clear();

      // Clear Redis cache
      if (this.redisClient) {
        await this.redisClient.flushDb();
      }

      logger.info('All caches cleared');
    } catch (error) {
      logger.error('Error clearing caches:', error);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    try {
      if (this.redisClient) {
        await this.redisClient.quit();
      }
      logger.info('Cache service shutdown complete');
    } catch (error) {
      logger.error('Error during cache service shutdown:', error);
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const cacheService = new MultiTierCacheService();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Cache user data with automatic invalidation
 */
export async function cacheUserData<T>(userId: string, data: T, ttl: number = 3600): Promise<void> {
  const key = `user:${userId}`;
  await cacheService.set(key, data, {
    ttl,
    tags: ['user', `user:${userId}`]
  });
}

/**
 * Get cached user data
 */
export async function getCachedUserData<T>(userId: string): Promise<T | null> {
  const key = `user:${userId}`;
  return await cacheService.get<T>(key);
}

/**
 * Invalidate user cache
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  await cacheService.invalidate(`user:${userId}*`);
}

/**
 * Cache session data
 */
export async function cacheSessionData<T>(sessionId: string, data: T, ttl: number = 1800): Promise<void> {
  const key = `session:${sessionId}`;
  await cacheService.set(key, data, {
    ttl,
    tags: ['session', `session:${sessionId}`]
  });
}

/**
 * Get cached session data
 */
export async function getCachedSessionData<T>(sessionId: string): Promise<T | null> {
  const key = `session:${sessionId}`;
  return await cacheService.get<T>(key);
}

/**
 * Invalidate session cache
 */
export async function invalidateSessionCache(sessionId: string): Promise<void> {
  await cacheService.invalidate(`session:${sessionId}*`);
}