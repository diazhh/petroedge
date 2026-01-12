/**
 * Mapping Resolver Service
 * 
 * Resolves Device Bindings, Connectivity Profiles, and Device Profiles
 * with Redis caching for high-performance telemetry processing.
 * 
 * Cache Strategy:
 * - Device Bindings: 5 min TTL (frequently accessed)
 * - Connectivity Profiles: 10 min TTL (less volatile)
 * - Device Profiles: 10 min TTL (less volatile)
 */

import Redis from 'ioredis';
import postgres from 'postgres';
import { logger } from '../utils/logger.js';
import { CONFIG } from '../config/index.js';

interface DeviceBinding {
  id: string;
  tenantId: string;
  dataSourceId: string;
  digitalTwinId: string;
  connectivityProfileId: string;
  customRuleChainId?: string;
  customMappings?: any;
  isActive: boolean;
}

interface ConnectivityProfile {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  deviceProfileId: string;
  assetTemplateId: string;
  ruleChainId?: string;
  mappings: any[];
  isActive: boolean;
}

interface DeviceProfile {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  transportType: string;
  telemetrySchema: any;
  defaultRuleChainId?: string;
  isActive: boolean;
}

interface ResolvedMapping {
  binding: DeviceBinding;
  connectivityProfile: ConnectivityProfile;
  deviceProfile: DeviceProfile;
  digitalTwinInstance?: any;
}

export class MappingResolverService {
  private redis: Redis;
  private db: postgres.Sql;
  
  // Cache TTLs (seconds)
  private readonly BINDING_TTL = 300; // 5 minutes
  private readonly PROFILE_TTL = 600; // 10 minutes
  
  // Cache key prefixes
  private readonly BINDING_PREFIX = 'mapping:binding:';
  private readonly CONNECTIVITY_PROFILE_PREFIX = 'mapping:connectivity:';
  private readonly DEVICE_PROFILE_PREFIX = 'mapping:device_profile:';
  private readonly DIGITAL_TWIN_PREFIX = 'mapping:digital_twin:';

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
      logger.info('MappingResolverService: Redis connected');
    });

    this.redis.on('error', (error) => {
      logger.error('MappingResolverService: Redis error', { error });
    });
  }

  /**
   * Resolve complete mapping for a data source
   * Returns binding + connectivity profile + device profile
   */
  async resolveMapping(dataSourceId: string, tenantId: string): Promise<ResolvedMapping | null> {
    try {
      // 1. Get Device Binding (with cache)
      const binding = await this.getDeviceBinding(dataSourceId, tenantId);
      if (!binding) {
        logger.warn('Device binding not found', { dataSourceId, tenantId });
        return null;
      }

      if (!binding.isActive) {
        logger.warn('Device binding is inactive', { dataSourceId, bindingId: binding.id });
        return null;
      }

      // 2. Get Connectivity Profile (with cache)
      const connectivityProfile = await this.getConnectivityProfile(
        binding.connectivityProfileId,
        tenantId
      );
      if (!connectivityProfile) {
        logger.warn('Connectivity profile not found', {
          connectivityProfileId: binding.connectivityProfileId,
          bindingId: binding.id,
        });
        return null;
      }

      // 3. Get Device Profile (with cache)
      const deviceProfile = await this.getDeviceProfile(
        connectivityProfile.deviceProfileId,
        tenantId
      );
      if (!deviceProfile) {
        logger.warn('Device profile not found', {
          deviceProfileId: connectivityProfile.deviceProfileId,
          connectivityProfileId: connectivityProfile.id,
        });
        return null;
      }

      // 4. Get Digital Twin Instance (with cache)
      const digitalTwinInstance = await this.getDigitalTwinInstance(
        binding.digitalTwinId,
        tenantId
      );

      logger.debug('Mapping resolved successfully', {
        dataSourceId,
        bindingId: binding.id,
        connectivityProfileId: connectivityProfile.id,
        deviceProfileId: deviceProfile.id,
      });

      return {
        binding,
        connectivityProfile,
        deviceProfile,
        digitalTwinInstance,
      };
    } catch (error) {
      logger.error('Error resolving mapping', { error, dataSourceId, tenantId });
      throw error;
    }
  }

  /**
   * Get Device Binding with cache
   */
  private async getDeviceBinding(dataSourceId: string, tenantId: string): Promise<DeviceBinding | null> {
    const cacheKey = `${this.BINDING_PREFIX}${dataSourceId}`;

    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        logger.debug('Device binding cache hit', { dataSourceId });
        return JSON.parse(cached);
      }

      // Cache miss - query database
      logger.debug('Device binding cache miss', { dataSourceId });
      const result = await this.db`
        SELECT 
          id, tenant_id, data_source_id, digital_twin_id, 
          connectivity_profile_id, custom_rule_chain_id, 
          custom_mappings, is_active
        FROM device_bindings
        WHERE data_source_id = ${dataSourceId} AND tenant_id = ${tenantId} AND is_active = true
        LIMIT 1
      `;

      if (result.length === 0) {
        return null;
      }

      const binding: DeviceBinding = {
        id: result[0].id,
        tenantId: result[0].tenant_id,
        dataSourceId: result[0].data_source_id,
        digitalTwinId: result[0].digital_twin_id,
        connectivityProfileId: result[0].connectivity_profile_id,
        customRuleChainId: result[0].custom_rule_chain_id,
        customMappings: result[0].custom_mappings,
        isActive: result[0].is_active,
      };

      // Cache for future requests
      await this.redis.setex(cacheKey, this.BINDING_TTL, JSON.stringify(binding));

      return binding;
    } catch (error) {
      logger.error('Error getting device binding', { error, dataSourceId });
      throw error;
    }
  }

  /**
   * Get Connectivity Profile with cache
   */
  private async getConnectivityProfile(profileId: string, tenantId: string): Promise<ConnectivityProfile | null> {
    const cacheKey = `${this.CONNECTIVITY_PROFILE_PREFIX}${profileId}`;

    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        logger.debug('Connectivity profile cache hit', { profileId });
        return JSON.parse(cached);
      }

      // Cache miss - query database
      logger.debug('Connectivity profile cache miss', { profileId });
      const result = await this.db`
        SELECT 
          id, tenant_id, code, name, device_profile_id, 
          asset_template_id, rule_chain_id, mappings, is_active
        FROM connectivity_profiles
        WHERE id = ${profileId} AND tenant_id = ${tenantId}
        LIMIT 1
      `;

      if (result.length === 0) {
        return null;
      }

      const profile: ConnectivityProfile = {
        id: result[0].id,
        tenantId: result[0].tenant_id,
        code: result[0].code,
        name: result[0].name,
        deviceProfileId: result[0].device_profile_id,
        assetTemplateId: result[0].asset_template_id,
        ruleChainId: result[0].rule_chain_id,
        mappings: result[0].mappings || [],
        isActive: result[0].is_active,
      };

      // Cache for future requests
      await this.redis.setex(cacheKey, this.PROFILE_TTL, JSON.stringify(profile));

      return profile;
    } catch (error) {
      logger.error('Error getting connectivity profile', { error, profileId });
      throw error;
    }
  }

  /**
   * Get Device Profile with cache
   */
  private async getDeviceProfile(profileId: string, tenantId: string): Promise<DeviceProfile | null> {
    const cacheKey = `${this.DEVICE_PROFILE_PREFIX}${profileId}`;

    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        logger.debug('Device profile cache hit', { profileId });
        return JSON.parse(cached);
      }

      // Cache miss - query database
      logger.debug('Device profile cache miss', { profileId });
      const result = await this.db`
        SELECT 
          id, tenant_id, code, name, transport_type, 
          telemetry_schema, default_rule_chain_id, is_active
        FROM device_profiles
        WHERE id = ${profileId} AND tenant_id = ${tenantId}
        LIMIT 1
      `;

      if (result.length === 0) {
        return null;
      }

      const profile: DeviceProfile = {
        id: result[0].id,
        tenantId: result[0].tenant_id,
        code: result[0].code,
        name: result[0].name,
        transportType: result[0].transport_type,
        telemetrySchema: result[0].telemetry_schema || {},
        defaultRuleChainId: result[0].default_rule_chain_id,
        isActive: result[0].is_active,
      };

      // Cache for future requests
      await this.redis.setex(cacheKey, this.PROFILE_TTL, JSON.stringify(profile));

      return profile;
    } catch (error) {
      logger.error('Error getting device profile', { error, profileId });
      throw error;
    }
  }

  /**
   * Get Digital Twin Instance with cache
   */
  private async getDigitalTwinInstance(instanceId: string, tenantId: string): Promise<any | null> {
    const cacheKey = `${this.DIGITAL_TWIN_PREFIX}${instanceId}`;

    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        logger.debug('Digital twin instance cache hit', { instanceId });
        return JSON.parse(cached);
      }

      // Cache miss - query database
      logger.debug('Digital twin instance cache miss', { instanceId });
      const result = await this.db`
        SELECT 
          id, tenant_id, asset_template_id, code, name, 
          root_thing_id, component_thing_ids
        FROM digital_twin_instances
        WHERE id = ${instanceId} AND tenant_id = ${tenantId}
        LIMIT 1
      `;

      if (result.length === 0) {
        return null;
      }

      const instance = {
        id: result[0].id,
        tenantId: result[0].tenant_id,
        assetTemplateId: result[0].asset_template_id,
        code: result[0].code,
        name: result[0].name,
        rootThingId: result[0].root_thing_id,
        componentThingIds: result[0].component_thing_ids || {},
      };

      // Cache for future requests
      await this.redis.setex(cacheKey, this.PROFILE_TTL, JSON.stringify(instance));

      return instance;
    } catch (error) {
      logger.error('Error getting digital twin instance', { error, instanceId });
      throw error;
    }
  }

  /**
   * Invalidate cache for a specific data source binding
   */
  async invalidateBinding(dataSourceId: string): Promise<void> {
    try {
      const cacheKey = `${this.BINDING_PREFIX}${dataSourceId}`;
      await this.redis.del(cacheKey);
      logger.debug('Device binding cache invalidated', { dataSourceId });
    } catch (error) {
      logger.error('Error invalidating binding cache', { error, dataSourceId });
    }
  }

  /**
   * Invalidate cache for a connectivity profile
   */
  async invalidateConnectivityProfile(profileId: string): Promise<void> {
    try {
      const cacheKey = `${this.CONNECTIVITY_PROFILE_PREFIX}${profileId}`;
      await this.redis.del(cacheKey);
      logger.debug('Connectivity profile cache invalidated', { profileId });
    } catch (error) {
      logger.error('Error invalidating connectivity profile cache', { error, profileId });
    }
  }

  /**
   * Invalidate cache for a device profile
   */
  async invalidateDeviceProfile(profileId: string): Promise<void> {
    try {
      const cacheKey = `${this.DEVICE_PROFILE_PREFIX}${profileId}`;
      await this.redis.del(cacheKey);
      logger.debug('Device profile cache invalidated', { profileId });
    } catch (error) {
      logger.error('Error invalidating device profile cache', { error, profileId });
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
