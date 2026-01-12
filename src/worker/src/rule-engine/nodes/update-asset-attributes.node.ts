import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';
import { DittoClientService } from '../../services/ditto-client.service.js';

export interface UpdateAssetAttributesConfig extends RuleNodeConfig {
  thingIdKey?: string; // Key to get thing ID (default: 'thingId' or 'assetId')
  attributes: Record<string, string | { key: string; value?: any }>; // Attributes to update
  featureName?: string; // Feature name (default: 'attributes')
}

/**
 * Update Asset Attributes Node
 * 
 * Updates attributes in Eclipse Ditto Thing.
 * Can update multiple attributes in a single operation.
 * 
 * Config:
 * - thingIdKey: Key to get thing ID (default: 'thingId' or 'assetId')
 * - attributes: Object with attribute updates (required)
 * - featureName: Feature name in Ditto (default: 'attributes')
 * 
 * Attributes format:
 * {
 *   "status": "data.newStatus",           // Get from message.data.newStatus
 *   "lastUpdate": { key: "timestamp" },   // Get from message.timestamp
 *   "operator": { value: "system" }       // Static value
 * }
 */
export class UpdateAssetAttributesNode extends RuleNode {
  private dittoClient: DittoClientService;

  constructor(config: UpdateAssetAttributesConfig) {
    super('update_asset_attributes', config);
    this.dittoClient = new DittoClientService();
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as UpdateAssetAttributesConfig;
    const thingIdKey = config.thingIdKey || 'thingId';
    const featureName = config.featureName || 'attributes';

    const thingId = message.data[thingIdKey] || message.data.assetId;
    if (!thingId) {
      this.log(context, 'warn', 'Thing ID not found in message');
      return null;
    }

    if (!config.attributes || typeof config.attributes !== 'object') {
      this.log(context, 'error', 'Attributes not configured');
      return null;
    }

    try {
      const updates: Record<string, any> = {};

      // Build updates object
      for (const [attrName, attrConfig] of Object.entries(config.attributes)) {
        if (typeof attrConfig === 'string') {
          // Simple path reference
          const value = this.getNestedValue(message, attrConfig);
          if (value !== undefined) {
            updates[attrName] = value;
          }
        } else if (typeof attrConfig === 'object') {
          // Complex config
          if (attrConfig.value !== undefined) {
            // Static value
            updates[attrName] = attrConfig.value;
          } else if (attrConfig.key) {
            // Dynamic value from message
            const value = this.getNestedValue(message, attrConfig.key);
            if (value !== undefined) {
              updates[attrName] = value;
            }
          }
        }
      }

      if (Object.keys(updates).length === 0) {
        this.log(context, 'warn', 'No attributes to update');
        return message;
      }

      // Update in Ditto
      await this.dittoClient.patchFeatureProperties(thingId, featureName, updates);

      this.log(context, 'info', `Updated ${Object.keys(updates).length} attributes in Ditto`, {
        thingId,
        attributes: Object.keys(updates),
      });

      return message;
    } catch (error) {
      this.log(context, 'error', 'Failed to update asset attributes', { error, thingId });
      return null;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
