import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';
import { DittoClientService } from '@/services/ditto-client.service.js';

export interface SaveAttributesConfig extends RuleNodeConfig {
  thingIdKey?: string; // Key to get thing ID (default: 'thingId' or 'assetId')
  attributes: Record<string, string>; // Mapping of attribute names to message keys
  featureName?: string; // Feature name (default: 'attributes')
}

/**
 * Save Attributes Node
 * 
 * Saves attributes to Eclipse Ditto Thing.
 * Updates the attributes feature with values from the message.
 * 
 * Config:
 * - thingIdKey: Key to get thing ID (default: 'thingId' or 'assetId')
 * - attributes: Mapping of attribute names to message data keys (required)
 * - featureName: Feature name in Ditto (default: 'attributes')
 * 
 * Example attributes config:
 * {
 *   "status": "data.status",
 *   "lastUpdate": "timestamp",
 *   "operator": "data.operator"
 * }
 */
export class SaveAttributesNode extends RuleNode {
  private dittoClient: DittoClientService;

  constructor(config: SaveAttributesConfig) {
    super('save_attributes', config);
    this.dittoClient = new DittoClientService();
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as SaveAttributesConfig;
    const thingIdKey = config.thingIdKey || 'thingId';
    const featureName = config.featureName || 'attributes';

    const thingId = message.data[thingIdKey] || message.data.assetId;
    if (!thingId) {
      this.log(context, 'warn', 'Thing ID not found in message');
      return null;
    }

    if (!config.attributes || typeof config.attributes !== 'object') {
      this.log(context, 'error', 'Attributes mapping not configured');
      return null;
    }

    try {
      const updates: Record<string, any> = {};

      // Build updates from message data
      for (const [attrName, messagePath] of Object.entries(config.attributes)) {
        const value = this.getNestedValue(message, messagePath);
        if (value !== undefined) {
          updates[attrName] = value;
        }
      }

      if (Object.keys(updates).length === 0) {
        this.log(context, 'warn', 'No attributes to save');
        return message;
      }

      // Update feature properties in Ditto
      await this.dittoClient.updateFeatureProperties(thingId, featureName, updates);

      this.log(context, 'info', `Saved ${Object.keys(updates).length} attributes to Ditto`, {
        thingId,
        featureName,
        attributes: Object.keys(updates),
      });

      return message;
    } catch (error) {
      this.log(context, 'error', 'Failed to save attributes', { error, thingId });
      return null;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
