import { createClient, RedisClientType } from 'redis';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class RedisService {
  private client: RedisClientType | null = null;
  private isConnected = false;

  /**
   * Initialize Redis client and connect
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      logger.warn('Redis client already connected');
      return;
    }

    try {
      this.client = createClient({
        socket: {
          host: config.redis.host,
          port: config.redis.port,
        },
        password: config.redis.password,
      });

      this.client.on('error', (err: Error) => {
        logger.error('Redis client error', err);
      });

      this.client.on('connect', () => {
        logger.debug('Redis client connecting...');
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        logger.warn('Redis client reconnecting...');
      });

      this.client.on('end', () => {
        logger.info('Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      logger.info('✅ Redis connected successfully');
    } catch (error) {
      logger.error('Failed to connect to Redis', error);
      throw error;
    }
  }

  /**
   * Disconnect Redis client
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      logger.info('Redis disconnected');
    }
  }

  /**
   * Get Redis client instance
   */
  getClient(): RedisClientType {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }
    return this.client;
  }

  /**
   * Check if Redis is connected
   */
  isReady(): boolean {
    return this.isConnected;
  }

  // ============================================================================
  // KEY-VALUE OPERATIONS
  // ============================================================================

  /**
   * Set a key-value pair with optional TTL
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const client = this.getClient();
    if (ttlSeconds) {
      await client.setEx(key, ttlSeconds, value);
    } else {
      await client.set(key, value);
    }
  }

  /**
   * Get value by key
   */
  async get(key: string): Promise<string | null> {
    const client = this.getClient();
    return await client.get(key);
  }

  /**
   * Delete key(s)
   */
  async del(...keys: string[]): Promise<number> {
    const client = this.getClient();
    return await client.del(keys);
  }

  /**
   * Check if key exists
   */
  async exists(...keys: string[]): Promise<number> {
    const client = this.getClient();
    return await client.exists(keys);
  }

  /**
   * Set expiration on key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    const client = this.getClient();
    const result = await client.expire(key, seconds);
    return result === 1;
  }

  /**
   * Get TTL of key
   */
  async ttl(key: string): Promise<number> {
    const client = this.getClient();
    return await client.ttl(key);
  }

  // ============================================================================
  // HASH OPERATIONS
  // ============================================================================

  /**
   * Set hash field
   */
  async hSet(key: string, field: string, value: string): Promise<number> {
    const client = this.getClient();
    return await client.hSet(key, field, value);
  }

  /**
   * Set multiple hash fields
   */
  async hSetMultiple(key: string, data: Record<string, string>): Promise<number> {
    const client = this.getClient();
    return await client.hSet(key, data);
  }

  /**
   * Get hash field
   */
  async hGet(key: string, field: string): Promise<string | undefined> {
    const client = this.getClient();
    const result = await client.hGet(key, field);
    return result ?? undefined;
  }

  /**
   * Get all hash fields
   */
  async hGetAll(key: string): Promise<Record<string, string>> {
    const client = this.getClient();
    return await client.hGetAll(key);
  }

  /**
   * Delete hash field(s)
   */
  async hDel(key: string, ...fields: string[]): Promise<number> {
    const client = this.getClient();
    return await client.hDel(key, fields);
  }

  /**
   * Check if hash field exists
   */
  async hExists(key: string, field: string): Promise<boolean> {
    const client = this.getClient();
    const result = await client.hExists(key, field);
    return result === 1;
  }

  /**
   * Get all hash keys
   */
  async hKeys(key: string): Promise<string[]> {
    const client = this.getClient();
    return await client.hKeys(key);
  }

  /**
   * Get hash length
   */
  async hLen(key: string): Promise<number> {
    const client = this.getClient();
    return await client.hLen(key);
  }

  // ============================================================================
  // SET OPERATIONS
  // ============================================================================

  /**
   * Add member(s) to set
   */
  async sAdd(key: string, ...members: string[]): Promise<number> {
    const client = this.getClient();
    return await client.sAdd(key, members);
  }

  /**
   * Get all set members
   */
  async sMembers(key: string): Promise<string[]> {
    const client = this.getClient();
    return await client.sMembers(key);
  }

  /**
   * Check if member exists in set
   */
  async sIsMember(key: string, member: string): Promise<boolean> {
    const client = this.getClient();
    const result = await client.sIsMember(key, member);
    return result === 1;
  }

  /**
   * Remove member(s) from set
   */
  async sRem(key: string, ...members: string[]): Promise<number> {
    const client = this.getClient();
    return await client.sRem(key, members);
  }

  /**
   * Get set cardinality (size)
   */
  async sCard(key: string): Promise<number> {
    const client = this.getClient();
    return await client.sCard(key);
  }

  // ============================================================================
  // SORTED SET OPERATIONS
  // ============================================================================

  /**
   * Add member to sorted set with score
   */
  async zAdd(key: string, score: number, member: string): Promise<number> {
    const client = this.getClient();
    return await client.zAdd(key, { score, value: member });
  }

  /**
   * Get sorted set range by score
   */
  async zRangeByScore(key: string, min: number, max: number): Promise<string[]> {
    const client = this.getClient();
    return await client.zRangeByScore(key, min, max);
  }

  /**
   * Remove members from sorted set by score range
   */
  async zRemRangeByScore(key: string, min: number, max: number): Promise<number> {
    const client = this.getClient();
    return await client.zRemRangeByScore(key, min, max);
  }

  /**
   * Get sorted set cardinality
   */
  async zCard(key: string): Promise<number> {
    const client = this.getClient();
    return await client.zCard(key);
  }

  // ============================================================================
  // JSON OPERATIONS (for complex objects)
  // ============================================================================

  /**
   * Set JSON object
   */
  async setJSON(key: string, value: any, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  /**
   * Get JSON object
   */
  async getJSON<T = any>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Failed to parse JSON from Redis key: ${key}`, error);
      return null;
    }
  }

  // ============================================================================
  // PATTERN OPERATIONS
  // ============================================================================

  /**
   * Get keys matching pattern
   */
  async keys(pattern: string): Promise<string[]> {
    const client = this.getClient();
    return await client.keys(pattern);
  }

  /**
   * Delete keys matching pattern
   */
  async delPattern(pattern: string): Promise<number> {
    const keys = await this.keys(pattern);
    if (keys.length === 0) return 0;
    return await this.del(...keys);
  }

  // ============================================================================
  // UTILITY OPERATIONS
  // ============================================================================

  /**
   * Ping Redis server
   */
  async ping(): Promise<string> {
    const client = this.getClient();
    return await client.ping();
  }

  /**
   * Flush all data (use with caution!)
   */
  async flushAll(): Promise<string> {
    const client = this.getClient();
    return await client.flushAll();
  }

  /**
   * Get database size
   */
  async dbSize(): Promise<number> {
    const client = this.getClient();
    return await client.dbSize();
  }
}

// Singleton instance
export const redisService = new RedisService();
