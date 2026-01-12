import { RuleNode, RuleNodeConfig, RuleNodeMessage, RuleNodeContext } from '../node-registry.js';

/**
 * Resolve Binding Node
 * 
 * Resolves Device Binding, Connectivity Profile, and Device Profile for a data source.
 * Caches results in Redis for performance.
 * 
 * Input: Message with dataSourceId
 * Output: Message enriched with binding, connectivityProfile, deviceProfile
 */

export interface ResolveBindingNodeConfig extends RuleNodeConfig {
  cacheInRedis: boolean; // Cache bindings for performance
  cacheTTL?: number; // Cache TTL in seconds (default: 300)
}

interface DeviceBinding {
  id: string;
  dataSourceId: string;
  digitalTwinId: string;
  connectivityProfileId: string;
  customRuleChainId?: string;
  customMappings?: any[];
  isActive: boolean;
}

interface ConnectivityProfile {
  id: string;
  code: string;
  deviceProfileId: string;
  assetTemplateId: string;
  ruleChainId?: string;
  mappings: any[];
}

interface DeviceProfile {
  id: string;
  code: string;
  defaultRuleChainId?: string;
  telemetrySchema: Record<string, any>;
}

export class ResolveBindingNode extends RuleNode {
  constructor(config: ResolveBindingNodeConfig) {
    super('resolve_binding', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage> {
    const config = this.config as ResolveBindingNodeConfig;
    const dataSourceId = message.metadata?.dataSourceId;

    if (!dataSourceId) {
      this.log(context, 'warn', 'No dataSourceId in message metadata');
      throw new Error('Missing dataSourceId in message metadata');
    }

    // Check cache first
    let binding: DeviceBinding | null = null;
    const cacheKey = `binding:${dataSourceId}`;

    if (config.cacheInRedis && context.redis) {
      const cached = await context.redis.get(cacheKey);
      if (cached) {
        binding = JSON.parse(cached);
        this.log(context, 'debug', 'Binding retrieved from cache', { dataSourceId });
      }
    }

    // Fetch from database if not cached
    if (!binding && context.db) {
      const result = await context.db.query(
        `SELECT db.*, cp.code as connectivity_profile_code, cp.device_profile_id, cp.asset_template_id, 
                cp.rule_chain_id as connectivity_rule_chain_id, cp.mappings,
                dp.code as device_profile_code, dp.default_rule_chain_id, dp.telemetry_schema
         FROM device_bindings db
         JOIN connectivity_profiles cp ON db.connectivity_profile_id = cp.id
         JOIN device_profiles dp ON cp.device_profile_id = dp.id
         WHERE db.data_source_id = $1 AND db.is_active = true
         LIMIT 1`,
        [dataSourceId]
      );

      if (result.rows.length === 0) {
        this.log(context, 'warn', 'No active binding found for data source', { dataSourceId });
        throw new Error(`No active binding found for data source ${dataSourceId}`);
      }

      const row = result.rows[0];
      binding = {
        id: row.id,
        dataSourceId: row.data_source_id,
        digitalTwinId: row.digital_twin_id,
        connectivityProfileId: row.connectivity_profile_id,
        customRuleChainId: row.custom_rule_chain_id,
        customMappings: row.custom_mappings,
        isActive: row.is_active,
      };

      const connectivityProfile: ConnectivityProfile = {
        id: row.connectivity_profile_id,
        code: row.connectivity_profile_code,
        deviceProfileId: row.device_profile_id,
        assetTemplateId: row.asset_template_id,
        ruleChainId: row.connectivity_rule_chain_id,
        mappings: row.mappings || [],
      };

      const deviceProfile: DeviceProfile = {
        id: row.device_profile_id,
        code: row.device_profile_code,
        defaultRuleChainId: row.default_rule_chain_id,
        telemetrySchema: row.telemetry_schema || {},
      };

      // Cache result
      if (config.cacheInRedis && context.redis) {
        const cacheTTL = config.cacheTTL || 300;
        await context.redis.setex(
          cacheKey,
          cacheTTL,
          JSON.stringify({
            binding,
            connectivityProfile,
            deviceProfile,
          })
        );
      }

      // Enrich message
      const enrichedMessage: RuleNodeMessage = {
        ...message,
        metadata: {
          ...message.metadata,
          binding,
          connectivityProfile,
          deviceProfile,
        },
      };

      this.log(context, 'info', 'Binding resolved', {
        dataSourceId,
        digitalTwinId: binding.digitalTwinId,
        connectivityProfileCode: connectivityProfile.code,
        deviceProfileCode: deviceProfile.code,
      });

      return enrichedMessage;
    }

    // If binding was cached, still need to enrich message
    const enrichedMessage: RuleNodeMessage = {
      ...message,
      metadata: {
        ...message.metadata,
        binding,
      },
    };

    return enrichedMessage;
  }
}
