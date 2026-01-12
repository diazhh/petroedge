/**
 * Rule Chain Resolver Service
 * 
 * Resolves which Rule Chain to execute based on a 3-level hierarchy:
 * 1. Device Binding (customRuleChainId) - Highest priority
 * 2. Connectivity Profile (ruleChainId) - Medium priority
 * 3. Device Profile (defaultRuleChainId) - Lowest priority (fallback)
 * 
 * This allows flexible override at different levels:
 * - Device Profile: Default behavior for all devices of this type
 * - Connectivity Profile: Override for specific device↔template combinations
 * - Device Binding: Override for specific instances
 */

import Redis from 'ioredis';
import postgres from 'postgres';
import { logger } from '../utils/logger.js';
import { CONFIG } from '../config/index.js';

interface RuleChain {
  id: string;
  tenantId: string;
  name: string;
  nodes: any[];
  connections: any[];
  status: string;
  priority: number;
  config: any;
}

interface RuleChainResolution {
  ruleChainId: string;
  ruleChain: RuleChain;
  source: 'device_binding' | 'connectivity_profile' | 'device_profile' | 'default';
}

export class RuleChainResolverService {
  private redis: Redis;
  private db: postgres.Sql;
  
  // Cache TTL
  private readonly RULE_CHAIN_TTL = 600; // 10 minutes
  
  // Cache key prefix
  private readonly RULE_CHAIN_PREFIX = 'rule_chain:';
  
  // Default Rule Chain name for telemetry processing
  private readonly DEFAULT_TELEMETRY_CHAIN = 'ROOT_TELEMETRY_PROCESSING';

  constructor() {
    this.redis = new Redis({
      host: CONFIG.redis.host,
      port: CONFIG.redis.port,
      password: CONFIG.redis.password,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.db = postgres(CONFIG.postgres.url, {
      max: 10,
    });

    this.redis.on('connect', () => {
      logger.info('RuleChainResolverService: Redis connected');
    });

    this.redis.on('error', (error) => {
      logger.error('RuleChainResolverService: Redis error', { error });
    });
  }

  /**
   * Resolve Rule Chain based on 3-level hierarchy
   * 
   * Priority:
   * 1. Device Binding customRuleChainId (highest)
   * 2. Connectivity Profile ruleChainId
   * 3. Device Profile defaultRuleChainId
   * 4. Default ROOT_TELEMETRY_PROCESSING (fallback)
   */
  async resolveRuleChain(
    bindingCustomRuleChainId: string | undefined,
    connectivityProfileRuleChainId: string | undefined,
    deviceProfileDefaultRuleChainId: string | undefined,
    tenantId: string
  ): Promise<RuleChainResolution | null> {
    try {
      // Level 1: Device Binding custom rule chain (highest priority)
      if (bindingCustomRuleChainId) {
        const ruleChain = await this.getRuleChain(bindingCustomRuleChainId, tenantId);
        if (ruleChain) {
          logger.debug('Rule chain resolved from device binding', {
            ruleChainId: bindingCustomRuleChainId,
            ruleChainName: ruleChain.name,
          });
          return {
            ruleChainId: bindingCustomRuleChainId,
            ruleChain,
            source: 'device_binding',
          };
        }
      }

      // Level 2: Connectivity Profile rule chain
      if (connectivityProfileRuleChainId) {
        const ruleChain = await this.getRuleChain(connectivityProfileRuleChainId, tenantId);
        if (ruleChain) {
          logger.debug('Rule chain resolved from connectivity profile', {
            ruleChainId: connectivityProfileRuleChainId,
            ruleChainName: ruleChain.name,
          });
          return {
            ruleChainId: connectivityProfileRuleChainId,
            ruleChain,
            source: 'connectivity_profile',
          };
        }
      }

      // Level 3: Device Profile default rule chain
      if (deviceProfileDefaultRuleChainId) {
        const ruleChain = await this.getRuleChain(deviceProfileDefaultRuleChainId, tenantId);
        if (ruleChain) {
          logger.debug('Rule chain resolved from device profile', {
            ruleChainId: deviceProfileDefaultRuleChainId,
            ruleChainName: ruleChain.name,
          });
          return {
            ruleChainId: deviceProfileDefaultRuleChainId,
            ruleChain,
            source: 'device_profile',
          };
        }
      }

      // Level 4: Default ROOT_TELEMETRY_PROCESSING (fallback)
      const defaultRuleChain = await this.getDefaultTelemetryRuleChain(tenantId);
      if (defaultRuleChain) {
        logger.debug('Rule chain resolved to default ROOT_TELEMETRY_PROCESSING', {
          ruleChainId: defaultRuleChain.id,
          ruleChainName: defaultRuleChain.name,
        });
        return {
          ruleChainId: defaultRuleChain.id,
          ruleChain: defaultRuleChain,
          source: 'default',
        };
      }

      logger.error('No rule chain could be resolved', {
        bindingCustomRuleChainId,
        connectivityProfileRuleChainId,
        deviceProfileDefaultRuleChainId,
        tenantId,
      });
      return null;
    } catch (error) {
      logger.error('Error resolving rule chain', { error, tenantId });
      throw error;
    }
  }

  /**
   * Get Rule Chain by ID with cache
   */
  private async getRuleChain(ruleChainId: string, tenantId: string): Promise<RuleChain | null> {
    const cacheKey = `${this.RULE_CHAIN_PREFIX}${ruleChainId}`;

    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        logger.debug('Rule chain cache hit', { ruleChainId });
        return JSON.parse(cached);
      }

      // Cache miss - query database
      logger.debug('Rule chain cache miss', { ruleChainId });
      const result = await this.db`
        SELECT 
          id, tenant_id, name, nodes, connections, 
          status, priority, config
        FROM rules
        WHERE id = ${ruleChainId} AND tenant_id = ${tenantId} AND status = 'ACTIVE'
        LIMIT 1
      `;

      if (result.length === 0) {
        logger.warn('Rule chain not found or inactive', { ruleChainId, tenantId });
        return null;
      }

      const ruleChain: RuleChain = {
        id: result[0].id,
        tenantId: result[0].tenant_id,
        name: result[0].name,
        nodes: result[0].nodes || [],
        connections: result[0].connections || [],
        status: result[0].status,
        priority: result[0].priority || 0,
        config: result[0].config || {},
      };

      // Cache for future requests
      await this.redis.setex(cacheKey, this.RULE_CHAIN_TTL, JSON.stringify(ruleChain));

      return ruleChain;
    } catch (error) {
      logger.error('Error getting rule chain', { error, ruleChainId });
      throw error;
    }
  }

  /**
   * Get default ROOT_TELEMETRY_PROCESSING rule chain
   */
  private async getDefaultTelemetryRuleChain(tenantId: string): Promise<RuleChain | null> {
    const cacheKey = `${this.RULE_CHAIN_PREFIX}default:${tenantId}`;

    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        logger.debug('Default rule chain cache hit', { tenantId });
        return JSON.parse(cached);
      }

      // Cache miss - query database
      logger.debug('Default rule chain cache miss', { tenantId });
      const result = await this.db`
        SELECT 
          id, tenant_id, name, nodes, connections, 
          status, priority, config
        FROM rules
        WHERE name = ${this.DEFAULT_TELEMETRY_CHAIN} 
          AND tenant_id = ${tenantId} 
          AND status = 'ACTIVE'
        LIMIT 1
      `;

      if (result.length === 0) {
        logger.error('Default ROOT_TELEMETRY_PROCESSING rule chain not found', { tenantId });
        return null;
      }

      const ruleChain: RuleChain = {
        id: result[0].id,
        tenantId: result[0].tenant_id,
        name: result[0].name,
        nodes: result[0].nodes || [],
        connections: result[0].connections || [],
        status: result[0].status,
        priority: result[0].priority || 0,
        config: result[0].config || {},
      };

      // Cache for future requests
      await this.redis.setex(cacheKey, this.RULE_CHAIN_TTL, JSON.stringify(ruleChain));

      return ruleChain;
    } catch (error) {
      logger.error('Error getting default telemetry rule chain', { error, tenantId });
      throw error;
    }
  }

  /**
   * Invalidate cache for a specific rule chain
   */
  async invalidateRuleChain(ruleChainId: string): Promise<void> {
    try {
      const cacheKey = `${this.RULE_CHAIN_PREFIX}${ruleChainId}`;
      await this.redis.del(cacheKey);
      logger.debug('Rule chain cache invalidated', { ruleChainId });
    } catch (error) {
      logger.error('Error invalidating rule chain cache', { error, ruleChainId });
    }
  }

  /**
   * Invalidate default rule chain cache for a tenant
   */
  async invalidateDefaultRuleChain(tenantId: string): Promise<void> {
    try {
      const cacheKey = `${this.RULE_CHAIN_PREFIX}default:${tenantId}`;
      await this.redis.del(cacheKey);
      logger.debug('Default rule chain cache invalidated', { tenantId });
    } catch (error) {
      logger.error('Error invalidating default rule chain cache', { error, tenantId });
    }
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    await this.redis.quit();
    await this.db.end();
  }
}
