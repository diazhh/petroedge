import Redis from 'ioredis';
import { logger } from '../utils/logger.js';
import { CONFIG } from '../config/index.js';

export interface CachedTelemetry {
  assetId: string;
  tenantId: string;
  timestamp: string;
  tags: Record<string, any>;
}

/**
 * Redis Cache Service
 * 
 * Gestiona el cache de datos en tiempo real en Redis
 */
export class RedisCacheService {
  private client: Redis;
  private readonly TELEMETRY_TTL = 300; // 5 minutos
  private readonly TELEMETRY_PREFIX = 'telemetry:';
  private readonly ASSET_STATUS_PREFIX = 'asset:status:';

  constructor() {
    this.client = new Redis({
      host: CONFIG.redis.host,
      port: CONFIG.redis.port,
      password: CONFIG.redis.password,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      logger.info('Redis connected');
    });

    this.client.on('error', (error) => {
      logger.error('Redis error', { error });
    });
  }

  /**
   * Guardar telemetría en cache
   */
  async cacheTelemetry(telemetry: CachedTelemetry): Promise<void> {
    try {
      const key = `${this.TELEMETRY_PREFIX}${telemetry.assetId}`;
      
      await this.client.setex(
        key,
        this.TELEMETRY_TTL,
        JSON.stringify(telemetry)
      );

      logger.debug('Telemetry cached in Redis', {
        assetId: telemetry.assetId,
        ttl: this.TELEMETRY_TTL,
      });
    } catch (error) {
      logger.error('Error caching telemetry', {
        error,
        assetId: telemetry.assetId,
      });
      throw error;
    }
  }

  /**
   * Obtener telemetría desde cache
   */
  async getTelemetry(assetId: string): Promise<CachedTelemetry | null> {
    try {
      const key = `${this.TELEMETRY_PREFIX}${assetId}`;
      const data = await this.client.get(key);

      if (!data) {
        return null;
      }

      return JSON.parse(data);
    } catch (error) {
      logger.error('Error getting cached telemetry', { error, assetId });
      return null;
    }
  }

  /**
   * Actualizar estado de asset
   */
  async updateAssetStatus(assetId: string, status: Record<string, any>): Promise<void> {
    try {
      const key = `${this.ASSET_STATUS_PREFIX}${assetId}`;
      
      await this.client.setex(
        key,
        this.TELEMETRY_TTL,
        JSON.stringify({
          ...status,
          updatedAt: new Date().toISOString(),
        })
      );

      logger.debug('Asset status updated in Redis', { assetId });
    } catch (error) {
      logger.error('Error updating asset status', { error, assetId });
      throw error;
    }
  }

  /**
   * Obtener estado de asset
   */
  async getAssetStatus(assetId: string): Promise<Record<string, any> | null> {
    try {
      const key = `${this.ASSET_STATUS_PREFIX}${assetId}`;
      const data = await this.client.get(key);

      if (!data) {
        return null;
      }

      return JSON.parse(data);
    } catch (error) {
      logger.error('Error getting asset status', { error, assetId });
      return null;
    }
  }

  /**
   * Invalidar cache de asset
   */
  async invalidateAsset(assetId: string): Promise<void> {
    try {
      await this.client.del(
        `${this.TELEMETRY_PREFIX}${assetId}`,
        `${this.ASSET_STATUS_PREFIX}${assetId}`
      );

      logger.debug('Asset cache invalidated', { assetId });
    } catch (error) {
      logger.error('Error invalidating asset cache', { error, assetId });
    }
  }

  /**
   * Cerrar conexión
   */
  async close(): Promise<void> {
    await this.client.quit();
  }
}
