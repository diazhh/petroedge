import { redisService } from '../../../common/redis/index.js';
import { logger } from '../../../common/utils/logger.js';

/**
 * Telemetry Cache Service
 * Manages current telemetry values in Redis for fast access
 */
export class TelemetryCacheService {
  private readonly KEY_PREFIX = 'telemetry';
  private readonly ASSET_PREFIX = 'asset';
  private readonly DEFAULT_TTL = 300; // 5 minutes

  /**
   * Generate Redis key for asset telemetry
   */
  private getAssetKey(assetId: string): string {
    return `${this.KEY_PREFIX}:${this.ASSET_PREFIX}:${assetId}`;
  }

  /**
   * Generate Redis key for specific telemetry point
   */
  private getTelemetryKey(assetId: string, telemetryKey: string): string {
    return `${this.KEY_PREFIX}:${this.ASSET_PREFIX}:${assetId}:${telemetryKey}`;
  }

  /**
   * Set current telemetry value for an asset
   */
  async setTelemetry(
    assetId: string,
    telemetryKey: string,
    value: {
      value: number | string | boolean;
      unit?: string;
      quality?: string;
      time: string;
      source?: string;
    },
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    try {
      const key = this.getTelemetryKey(assetId, telemetryKey);
      await redisService.setJSON(key, value, ttl);
      
      // Also update the asset's telemetry hash for quick lookup of all keys
      const assetKey = this.getAssetKey(assetId);
      await redisService.hSet(assetKey, telemetryKey, JSON.stringify(value));
      await redisService.expire(assetKey, ttl);

      logger.debug('Telemetry cached in Redis', { assetId, telemetryKey });
    } catch (error) {
      logger.error('Failed to cache telemetry in Redis', { error, assetId, telemetryKey });
      // Don't throw - cache failures shouldn't break the flow
    }
  }

  /**
   * Set multiple telemetry values for an asset (batch)
   */
  async setTelemetryBatch(
    assetId: string,
    telemetryData: Record<string, {
      value: number | string | boolean;
      unit?: string;
      quality?: string;
      time: string;
      source?: string;
    }>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    try {
      const assetKey = this.getAssetKey(assetId);
      const hashData: Record<string, string> = {};

      // Set individual keys and prepare hash data
      for (const [telemetryKey, value] of Object.entries(telemetryData)) {
        const key = this.getTelemetryKey(assetId, telemetryKey);
        await redisService.setJSON(key, value, ttl);
        hashData[telemetryKey] = JSON.stringify(value);
      }

      // Update asset hash with all telemetry
      await redisService.hSetMultiple(assetKey, hashData);
      await redisService.expire(assetKey, ttl);

      logger.debug('Batch telemetry cached in Redis', { assetId, count: Object.keys(telemetryData).length });
    } catch (error) {
      logger.error('Failed to cache batch telemetry in Redis', { error, assetId });
    }
  }

  /**
   * Get current telemetry value for specific key
   */
  async getTelemetry(assetId: string, telemetryKey: string): Promise<any | null> {
    try {
      const key = this.getTelemetryKey(assetId, telemetryKey);
      return await redisService.getJSON(key);
    } catch (error) {
      logger.error('Failed to get telemetry from Redis', { error, assetId, telemetryKey });
      return null;
    }
  }

  /**
   * Get all current telemetry for an asset
   */
  async getAllTelemetry(assetId: string): Promise<Record<string, any>> {
    try {
      const assetKey = this.getAssetKey(assetId);
      const hashData = await redisService.hGetAll(assetKey);

      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(hashData)) {
        try {
          result[key] = JSON.parse(value);
        } catch {
          result[key] = value;
        }
      }

      return result;
    } catch (error) {
      logger.error('Failed to get all telemetry from Redis', { error, assetId });
      return {};
    }
  }

  /**
   * Get multiple telemetry keys for an asset
   */
  async getTelemetryKeys(assetId: string, telemetryKeys: string[]): Promise<Record<string, any>> {
    try {
      const result: Record<string, any> = {};

      for (const telemetryKey of telemetryKeys) {
        const value = await this.getTelemetry(assetId, telemetryKey);
        if (value !== null) {
          result[telemetryKey] = value;
        }
      }

      return result;
    } catch (error) {
      logger.error('Failed to get telemetry keys from Redis', { error, assetId, telemetryKeys });
      return {};
    }
  }

  /**
   * Delete telemetry for an asset
   */
  async deleteTelemetry(assetId: string, telemetryKey?: string): Promise<void> {
    try {
      if (telemetryKey) {
        // Delete specific telemetry key
        const key = this.getTelemetryKey(assetId, telemetryKey);
        await redisService.del(key);
        
        const assetKey = this.getAssetKey(assetId);
        await redisService.hDel(assetKey, telemetryKey);
      } else {
        // Delete all telemetry for asset
        const assetKey = this.getAssetKey(assetId);
        const keys = await redisService.hKeys(assetKey);
        
        const keysToDelete = keys.map(k => this.getTelemetryKey(assetId, k));
        keysToDelete.push(assetKey);
        
        if (keysToDelete.length > 0) {
          await redisService.del(...keysToDelete);
        }
      }

      logger.debug('Telemetry deleted from Redis', { assetId, telemetryKey });
    } catch (error) {
      logger.error('Failed to delete telemetry from Redis', { error, assetId, telemetryKey });
    }
  }

  /**
   * Check if telemetry exists in cache
   */
  async hasTelemetry(assetId: string, telemetryKey?: string): Promise<boolean> {
    try {
      if (telemetryKey) {
        const key = this.getTelemetryKey(assetId, telemetryKey);
        const exists = await redisService.exists(key);
        return exists > 0;
      } else {
        const assetKey = this.getAssetKey(assetId);
        const exists = await redisService.exists(assetKey);
        return exists > 0;
      }
    } catch (error) {
      logger.error('Failed to check telemetry existence in Redis', { error, assetId, telemetryKey });
      return false;
    }
  }

  /**
   * Get telemetry keys for an asset
   */
  async getAssetTelemetryKeys(assetId: string): Promise<string[]> {
    try {
      const assetKey = this.getAssetKey(assetId);
      return await redisService.hKeys(assetKey);
    } catch (error) {
      logger.error('Failed to get asset telemetry keys from Redis', { error, assetId });
      return [];
    }
  }

  /**
   * Get TTL for telemetry cache
   */
  async getTTL(assetId: string, telemetryKey?: string): Promise<number> {
    try {
      const key = telemetryKey 
        ? this.getTelemetryKey(assetId, telemetryKey)
        : this.getAssetKey(assetId);
      return await redisService.ttl(key);
    } catch (error) {
      logger.error('Failed to get TTL from Redis', { error, assetId, telemetryKey });
      return -1;
    }
  }

  /**
   * Refresh TTL for telemetry cache
   */
  async refreshTTL(assetId: string, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const assetKey = this.getAssetKey(assetId);
      await redisService.expire(assetKey, ttl);

      // Also refresh individual keys
      const keys = await redisService.hKeys(assetKey);
      for (const telemetryKey of keys) {
        const key = this.getTelemetryKey(assetId, telemetryKey);
        await redisService.expire(key, ttl);
      }

      logger.debug('Telemetry TTL refreshed', { assetId, ttl });
    } catch (error) {
      logger.error('Failed to refresh TTL in Redis', { error, assetId });
    }
  }

  /**
   * Clear all telemetry cache (use with caution!)
   */
  async clearAll(): Promise<void> {
    try {
      const pattern = `${this.KEY_PREFIX}:${this.ASSET_PREFIX}:*`;
      const deleted = await redisService.delPattern(pattern);
      logger.info('All telemetry cache cleared', { deleted });
    } catch (error) {
      logger.error('Failed to clear telemetry cache', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalAssets: number;
    totalKeys: number;
  }> {
    try {
      const pattern = `${this.KEY_PREFIX}:${this.ASSET_PREFIX}:*`;
      const keys = await redisService.keys(pattern);
      
      // Count unique assets (keys that don't have a telemetry key suffix)
      const assetKeys = keys.filter(k => {
        const parts = k.split(':');
        return parts.length === 3; // telemetry:asset:{assetId}
      });

      return {
        totalAssets: assetKeys.length,
        totalKeys: keys.length,
      };
    } catch (error) {
      logger.error('Failed to get cache stats', error);
      return { totalAssets: 0, totalKeys: 0 };
    }
  }
}

// Singleton instance
export const telemetryCacheService = new TelemetryCacheService();
