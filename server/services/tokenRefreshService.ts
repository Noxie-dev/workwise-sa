/**
 * Enhanced Token Refresh Service
 * Implements refresh token rotation, strict validation, and monitoring
 * for failed refresh attempts with rate limiting
 */

import * as admin from 'firebase-admin';
import { logger } from '../utils/logger';
import { cacheService } from './cacheService';
import { rateLimiters } from '../../src/middleware/rateLimit';

// ============================================================================
// TOKEN REFRESH CONFIGURATION
// ============================================================================

interface TokenRefreshConfig {
  // Token rotation settings
  rotation: {
    enabled: boolean;
    maxRefreshAttempts: number;
    refreshTokenLifetime: number; // seconds
    accessTokenLifetime: number; // seconds
  };
  // Rate limiting settings
  rateLimit: {
    maxRefreshAttemptsPerMinute: number;
    maxRefreshAttemptsPerHour: number;
    maxRefreshAttemptsPerDay: number;
    lockoutDuration: number; // seconds
  };
  // Monitoring settings
  monitoring: {
    trackFailedAttempts: boolean;
    alertThreshold: number; // Failed attempts before alert
    retentionPeriod: number; // days
  };
}

// ============================================================================
// TOKEN REFRESH INTERFACES
// ============================================================================

interface RefreshTokenData {
  userId: string;
  tokenId: string;
  issuedAt: number;
  expiresAt: number;
  lastUsed: number;
  usageCount: number;
  isRevoked: boolean;
  deviceInfo?: {
    userAgent: string;
    ipAddress: string;
    deviceId?: string;
  };
}

interface RefreshAttempt {
  userId: string;
  timestamp: number;
  success: boolean;
  error?: string;
  ipAddress: string;
  userAgent: string;
  tokenId?: string;
}

interface TokenRefreshResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

interface RefreshStats {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  rateLimitedAttempts: number;
  rotatedTokens: number;
  revokedTokens: number;
  successRate: number;
}

// ============================================================================
// ENHANCED TOKEN REFRESH SERVICE
// ============================================================================

export class TokenRefreshService {
  private config: TokenRefreshConfig;
  private stats: RefreshStats = {
    totalAttempts: 0,
    successfulAttempts: 0,
    failedAttempts: 0,
    rateLimitedAttempts: 0,
    rotatedTokens: 0,
    revokedTokens: 0,
    successRate: 0
  };
  private refreshAttempts = new Map<string, RefreshAttempt[]>();
  private revokedTokens = new Set<string>();

  constructor() {
    this.config = {
      rotation: {
        enabled: true,
        maxRefreshAttempts: 5,
        refreshTokenLifetime: 30 * 24 * 60 * 60, // 30 days
        accessTokenLifetime: 60 * 60 // 1 hour
      },
      rateLimit: {
        maxRefreshAttemptsPerMinute: 10,
        maxRefreshAttemptsPerHour: 50,
        maxRefreshAttemptsPerDay: 200,
        lockoutDuration: 15 * 60 // 15 minutes
      },
      monitoring: {
        trackFailedAttempts: true,
        alertThreshold: 5,
        retentionPeriod: 30 // 30 days
      }
    };
  }

  // ============================================================================
  // TOKEN REFRESH OPERATIONS
  // ============================================================================

  /**
   * Refresh access token with rotation and validation
   */
  async refreshToken(
    refreshToken: string,
    requestInfo: {
      ipAddress: string;
      userAgent: string;
      deviceId?: string;
    }
  ): Promise<TokenRefreshResult> {
    this.stats.totalAttempts++;

    try {
      // Rate limiting check
      const rateLimitResult = await this.checkRateLimit(requestInfo.ipAddress, requestInfo.userAgent);
      if (!rateLimitResult.allowed) {
        this.stats.rateLimitedAttempts++;
        this.updateSuccessRate();
        return {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many refresh attempts. Please try again later.',
            details: {
              retryAfter: rateLimitResult.retryAfter,
              limit: rateLimitResult.limit
            }
          }
        };
      }

      // Validate refresh token
      const tokenValidation = await this.validateRefreshToken(refreshToken);
      if (!tokenValidation.valid) {
        await this.recordFailedAttempt(null, requestInfo, tokenValidation.error);
        this.stats.failedAttempts++;
        this.updateSuccessRate();
        return {
          success: false,
          error: tokenValidation.error
        };
      }

      const tokenData = tokenValidation.data!;

      // Check if token is revoked
      if (this.revokedTokens.has(tokenData.tokenId)) {
        await this.recordFailedAttempt(tokenData.userId, requestInfo, {
          code: 'TOKEN_REVOKED',
          message: 'Refresh token has been revoked'
        });
        this.stats.failedAttempts++;
        this.updateSuccessRate();
        return {
          success: false,
          error: {
            code: 'TOKEN_REVOKED',
            message: 'Refresh token has been revoked'
          }
        };
      }

      // Check token usage limits
      if (tokenData.usageCount >= this.config.rotation.maxRefreshAttempts) {
        await this.revokeToken(tokenData.tokenId, 'MAX_USAGE_EXCEEDED');
        await this.recordFailedAttempt(tokenData.userId, requestInfo, {
          code: 'TOKEN_EXHAUSTED',
          message: 'Refresh token has exceeded maximum usage'
        });
        this.stats.failedAttempts++;
        this.updateSuccessRate();
        return {
          success: false,
          error: {
            code: 'TOKEN_EXHAUSTED',
            message: 'Refresh token has exceeded maximum usage'
          }
        };
      }

      // Generate new access token
      const accessToken = await this.generateAccessToken(tokenData.userId);
      
      // Rotate refresh token if enabled
      let newRefreshToken: string | undefined;
      if (this.config.rotation.enabled) {
        newRefreshToken = await this.rotateRefreshToken(tokenData, requestInfo);
        this.stats.rotatedTokens++;
      } else {
        // Update usage count for existing token
        await this.updateTokenUsage(tokenData.tokenId);
      }

      // Record successful attempt
      await this.recordSuccessfulAttempt(tokenData.userId, requestInfo, tokenData.tokenId);
      this.stats.successfulAttempts++;
      this.updateSuccessRate();

      return {
        success: true,
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: this.config.rotation.accessTokenLifetime
      };

    } catch (error) {
      logger.error('Token refresh error:', error);
      await this.recordFailedAttempt(null, requestInfo, {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error during token refresh'
      });
      this.stats.failedAttempts++;
      this.updateSuccessRate();
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error during token refresh'
        }
      };
    }
  }

  /**
   * Revoke a refresh token
   */
  async revokeToken(tokenId: string, reason: string = 'MANUAL_REVOCATION'): Promise<void> {
    try {
      this.revokedTokens.add(tokenId);
      
      // Remove from cache
      await cacheService.delete(`refresh_token:${tokenId}`);
      
      // Log revocation
      logger.info(`Refresh token revoked: ${tokenId}, reason: ${reason}`);
      
      this.stats.revokedTokens++;

    } catch (error) {
      logger.error(`Error revoking token ${tokenId}:`, error);
    }
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeAllUserTokens(userId: string, reason: string = 'USER_LOGOUT'): Promise<void> {
    try {
      // Get all active tokens for user
      const userTokens = await this.getUserActiveTokens(userId);
      
      // Revoke each token
      for (const tokenId of userTokens) {
        await this.revokeToken(tokenId, reason);
      }

      logger.info(`All tokens revoked for user ${userId}, reason: ${reason}`);

    } catch (error) {
      logger.error(`Error revoking all tokens for user ${userId}:`, error);
    }
  }

  // ============================================================================
  // RATE LIMITING
  // ============================================================================

  private async checkRateLimit(ipAddress: string, userAgent: string): Promise<{
    allowed: boolean;
    retryAfter?: number;
    limit?: number;
  }> {
    const key = `refresh_limit:${ipAddress}`;
    
    try {
      // Check current rate limit status
      const attempts = await cacheService.get<number[]>(key) || [];
      const now = Date.now();
      
      // Filter attempts within time windows
      const lastMinute = attempts.filter(t => now - t < 60 * 1000);
      const lastHour = attempts.filter(t => now - t < 60 * 60 * 1000);
      const lastDay = attempts.filter(t => now - t < 24 * 60 * 60 * 1000);

      // Check rate limits
      if (lastMinute.length >= this.config.rateLimit.maxRefreshAttemptsPerMinute) {
        return {
          allowed: false,
          retryAfter: 60,
          limit: this.config.rateLimit.maxRefreshAttemptsPerMinute
        };
      }

      if (lastHour.length >= this.config.rateLimit.maxRefreshAttemptsPerHour) {
        return {
          allowed: false,
          retryAfter: 3600,
          limit: this.config.rateLimit.maxRefreshAttemptsPerHour
        };
      }

      if (lastDay.length >= this.config.rateLimit.maxRefreshAttemptsPerDay) {
        return {
          allowed: false,
          retryAfter: 86400,
          limit: this.config.rateLimit.maxRefreshAttemptsPerDay
        };
      }

      // Add current attempt
      attempts.push(now);
      
      // Keep only recent attempts (last 24 hours)
      const recentAttempts = attempts.filter(t => now - t < 24 * 60 * 60 * 1000);
      
      // Store updated attempts
      await cacheService.set(key, recentAttempts, { ttl: 24 * 60 * 60 });

      return { allowed: true };

    } catch (error) {
      logger.error('Rate limit check error:', error);
      // Allow on error to avoid blocking legitimate users
      return { allowed: true };
    }
  }

  // ============================================================================
  // TOKEN VALIDATION AND MANAGEMENT
  // ============================================================================

  private async validateRefreshToken(token: string): Promise<{
    valid: boolean;
    data?: RefreshTokenData;
    error?: { code: string; message: string };
  }> {
    try {
      // Check if token is revoked
      const tokenId = this.extractTokenId(token);
      if (this.revokedTokens.has(tokenId)) {
        return {
          valid: false,
          error: {
            code: 'TOKEN_REVOKED',
            message: 'Refresh token has been revoked'
          }
        };
      }

      // Get token data from cache
      const tokenData = await cacheService.get<RefreshTokenData>(`refresh_token:${tokenId}`);
      if (!tokenData) {
        return {
          valid: false,
          error: {
            code: 'TOKEN_NOT_FOUND',
            message: 'Refresh token not found or expired'
          }
        };
      }

      // Check if token is expired
      if (Date.now() > tokenData.expiresAt) {
        await this.revokeToken(tokenId, 'EXPIRED');
        return {
          valid: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Refresh token has expired'
          }
        };
      }

      // Check if token is revoked in data
      if (tokenData.isRevoked) {
        return {
          valid: false,
          error: {
            code: 'TOKEN_REVOKED',
            message: 'Refresh token has been revoked'
          }
        };
      }

      return {
        valid: true,
        data: tokenData
      };

    } catch (error) {
      logger.error('Token validation error:', error);
      return {
        valid: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Error validating refresh token'
        }
      };
    }
  }

  private async generateAccessToken(userId: string): Promise<string> {
    try {
      // Generate custom access token with Firebase Admin SDK
      const customToken = await admin.auth().createCustomToken(userId, {
        purpose: 'access_token',
        issued_at: Date.now()
      });

      return customToken;

    } catch (error) {
      logger.error('Error generating access token:', error);
      throw new Error('Failed to generate access token');
    }
  }

  private async rotateRefreshToken(
    oldTokenData: RefreshTokenData,
    requestInfo: { ipAddress: string; userAgent: string; deviceId?: string }
  ): Promise<string> {
    try {
      // Generate new refresh token
      const newTokenId = this.generateTokenId();
      const newToken = this.generateRefreshToken(newTokenId);
      
      // Create new token data
      const newTokenData: RefreshTokenData = {
        userId: oldTokenData.userId,
        tokenId: newTokenId,
        issuedAt: Date.now(),
        expiresAt: Date.now() + (this.config.rotation.refreshTokenLifetime * 1000),
        lastUsed: Date.now(),
        usageCount: 0,
        isRevoked: false,
        deviceInfo: {
          userAgent: requestInfo.userAgent,
          ipAddress: requestInfo.ipAddress,
          deviceId: requestInfo.deviceId
        }
      };

      // Store new token
      await cacheService.set(`refresh_token:${newTokenId}`, newTokenData, {
        ttl: this.config.rotation.refreshTokenLifetime
      });

      // Revoke old token
      await this.revokeToken(oldTokenData.tokenId, 'ROTATED');

      return newToken;

    } catch (error) {
      logger.error('Error rotating refresh token:', error);
      throw new Error('Failed to rotate refresh token');
    }
  }

  private async updateTokenUsage(tokenId: string): Promise<void> {
    try {
      const tokenData = await cacheService.get<RefreshTokenData>(`refresh_token:${tokenId}`);
      if (tokenData) {
        tokenData.usageCount++;
        tokenData.lastUsed = Date.now();
        
        await cacheService.set(`refresh_token:${tokenId}`, tokenData, {
          ttl: this.config.rotation.refreshTokenLifetime
        });
      }
    } catch (error) {
      logger.error(`Error updating token usage for ${tokenId}:`, error);
    }
  }

  private async getUserActiveTokens(userId: string): Promise<string[]> {
    try {
      // This would typically query a database for all active tokens
      // For now, we'll use a simplified approach with cache
      const userTokensKey = `user_tokens:${userId}`;
      const tokens = await cacheService.get<string[]>(userTokensKey) || [];
      return tokens;
    } catch (error) {
      logger.error(`Error getting active tokens for user ${userId}:`, error);
      return [];
    }
  }

  // ============================================================================
  // MONITORING AND TRACKING
  // ============================================================================

  private async recordSuccessfulAttempt(
    userId: string,
    requestInfo: { ipAddress: string; userAgent: string },
    tokenId: string
  ): Promise<void> {
    if (!this.config.monitoring.trackFailedAttempts) return;

    const attempt: RefreshAttempt = {
      userId,
      timestamp: Date.now(),
      success: true,
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
      tokenId
    };

    await this.storeRefreshAttempt(attempt);
  }

  private async recordFailedAttempt(
    userId: string | null,
    requestInfo: { ipAddress: string; userAgent: string },
    error: { code: string; message: string }
  ): Promise<void> {
    if (!this.config.monitoring.trackFailedAttempts) return;

    const attempt: RefreshAttempt = {
      userId: userId || 'unknown',
      timestamp: Date.now(),
      success: false,
      error: error.message,
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent
    };

    await this.storeRefreshAttempt(attempt);

    // Check for suspicious activity
    await this.checkSuspiciousActivity(requestInfo.ipAddress, userId);
  }

  private async storeRefreshAttempt(attempt: RefreshAttempt): Promise<void> {
    try {
      const key = `refresh_attempts:${attempt.userId}`;
      const attempts = await cacheService.get<RefreshAttempt[]>(key) || [];
      
      attempts.push(attempt);
      
      // Keep only recent attempts
      const cutoff = Date.now() - (this.config.monitoring.retentionPeriod * 24 * 60 * 60 * 1000);
      const recentAttempts = attempts.filter(a => a.timestamp > cutoff);
      
      await cacheService.set(key, recentAttempts, {
        ttl: this.config.monitoring.retentionPeriod * 24 * 60 * 60
      });

    } catch (error) {
      logger.error('Error storing refresh attempt:', error);
    }
  }

  private async checkSuspiciousActivity(ipAddress: string, userId: string | null): Promise<void> {
    try {
      const key = `failed_attempts:${ipAddress}`;
      const attempts = await cacheService.get<number[]>(key) || [];
      
      attempts.push(Date.now());
      
      // Check if threshold exceeded
      const recentAttempts = attempts.filter(t => Date.now() - t < 60 * 60 * 1000); // Last hour
      
      if (recentAttempts.length >= this.config.monitoring.alertThreshold) {
        logger.warn(`Suspicious refresh activity detected`, {
          ipAddress,
          userId,
          attempts: recentAttempts.length,
          threshold: this.config.monitoring.alertThreshold
        });
        
        // Could trigger additional security measures here
        // e.g., temporary IP blocking, user notification, etc.
      }
      
      await cacheService.set(key, recentAttempts, { ttl: 60 * 60 });

    } catch (error) {
      logger.error('Error checking suspicious activity:', error);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private generateTokenId(): string {
    return `rt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRefreshToken(tokenId: string): string {
    // Generate a secure refresh token
    const payload = {
      id: tokenId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    };
    
    // In a real implementation, this would be signed with a secret
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
  }

  private extractTokenId(token: string): string {
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64url').toString());
      return payload.id;
    } catch (error) {
      return token; // Fallback to using the token itself as ID
    }
  }

  private updateSuccessRate(): void {
    this.stats.successRate = this.stats.totalAttempts > 0 
      ? (this.stats.successfulAttempts / this.stats.totalAttempts) * 100 
      : 0;
  }

  // ============================================================================
  // MONITORING AND STATISTICS
  // ============================================================================

  /**
   * Get refresh statistics
   */
  getStats(): RefreshStats {
    return { ...this.stats };
  }

  /**
   * Get failed refresh attempts for monitoring
   */
  async getFailedAttempts(userId?: string, hours: number = 24): Promise<RefreshAttempt[]> {
    try {
      if (userId) {
        const key = `refresh_attempts:${userId}`;
        const attempts = await cacheService.get<RefreshAttempt[]>(key) || [];
        const cutoff = Date.now() - (hours * 60 * 60 * 1000);
        return attempts.filter(a => !a.success && a.timestamp > cutoff);
      } else {
        // Get all failed attempts (would need database query in production)
        return [];
      }
    } catch (error) {
      logger.error('Error getting failed attempts:', error);
      return [];
    }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      rateLimitedAttempts: 0,
      rotatedTokens: 0,
      revokedTokens: 0,
      successRate: 0
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const tokenRefreshService = new TokenRefreshService();