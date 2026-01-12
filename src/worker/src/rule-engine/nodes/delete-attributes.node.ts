import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';
import { DittoClientService } from '@/services/ditto-client.service.js';

export interface DeleteAttributesConfig extends RuleNodeConfig {
  thingIdKey?: string; // Key to get thing ID (default: 'thingId' or 'assetId')
  attributes: string[]; // Attribute names to delete (required)
  featureName?: string; // Feature name (default: 'attributes')
}

/**
 * Delete Attributes Node
 * 
 * Deletes specified attributes from Eclipse Ditto Thing.
 * Removes attributes from the attributes feature.
 * 
 * Config:
 * - thingIdKey: Key to get thing ID (default: 'thingId' or 'assetId')
 * - attributes: Array of attribute names to delete (required)
 * - featureName: Feature name in Ditto (default: 'attributes')
 * 
 * Example:
 * Delete temporary or obsolete attributes
 */
export class DeleteAttributesNode extends RuleNode {
  private dittoClient: DittoClientService;

  constructor(config: DeleteAttributesConfig) {
    super('delete_attributes', config);
    this.dittoClient = new DittoClientService();
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as DeleteAttributesConfig;
    const thingIdKey = config.thingIdKey || 'thingId';
    const featureName = config.featureName || 'attributes';

    const thingId = message.data[thingIdKey] || message.data.assetId;
    if (!thingId) {
      this.log(context, 'warn', 'Thing ID not found in message');
      return null;
    }

    if (!config.attributes || !Array.isArray(config.attributes) || config.attributes.length === 0) {
      this.log(context, 'error', 'No attributes configured for deletion');
      return null;
    }

    try {
      // Delete each attribute by setting to null
      const updates: Record<string, null> = {};
      for (const attr of config.attributes) {
        updates[attr] = null;
      }

      await this.dittoClient.updateFeatureProperties(thingId, featureName, updates);

      this.log(context, 'info', `Deleted ${config.attributes.length} attributes from Ditto`, {
        thingId,
        featureName,
        attributes: config.attributes,
      });

      return message;
    } catch (error) {
      this.log(context, 'error', 'Failed to delete attributes', { error, thingId });
      return null;
    }
  }
}
