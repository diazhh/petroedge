import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';
import { DittoClientService } from '@/services/ditto-client.service.js';

export interface OriginatorAttributesConfig extends RuleNodeConfig {
  attributes?: string[]; // Specific attributes to fetch (optional, fetches all if not specified)
  outputKey?: string; // Key to store attributes (default: 'originatorAttributes')
  featureName?: string; // Feature name in Ditto (default: 'attributes')
}

/**
 * Originator Attributes Node
 * 
 * Enriches message with attributes from the originator (source entity).
 * Fetches from Eclipse Ditto Thing features.
 * 
 * Config:
 * - attributes: Array of attribute names to fetch (optional, fetches all if not specified)
 * - outputKey: Where to store attributes (default: 'originatorAttributes')
 * - featureName: Feature name in Ditto (default: 'attributes')
 * 
 * Originator is determined from:
 * - message.data.thingId
 * - message.data.assetId
 * - message.metadata.originator
 */
export class OriginatorAttributesNode extends RuleNode {
  private dittoClient: DittoClientService;

  constructor(config: OriginatorAttributesConfig) {
    super('originator_attributes', config);
    this.dittoClient = new DittoClientService();
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as OriginatorAttributesConfig;
    const outputKey = config.outputKey || 'originatorAttributes';
    const featureName = config.featureName || 'attributes';

    const originatorId = message.data.thingId || message.data.assetId || message.metadata?.originator;
    
    if (!originatorId) {
      this.log(context, 'warn', 'Originator ID not found in message');
      return null;
    }

    try {
      // Fetch feature properties from Ditto
      const properties = await this.dittoClient.getFeatureProperties(originatorId, featureName);
      
      if (!properties) {
        this.log(context, 'warn', `Feature ${featureName} not found for originator ${originatorId}`);
        return message; // Pass through without enrichment
      }

      let attributes = properties;

      // Filter to specific attributes if configured
      if (config.attributes && Array.isArray(config.attributes) && config.attributes.length > 0) {
        const filtered: Record<string, any> = {};
        for (const attr of config.attributes) {
          if (properties[attr] !== undefined) {
            filtered[attr] = properties[attr];
          }
        }
        attributes = filtered;
      }

      return {
        ...message,
        data: {
          ...message.data,
          [outputKey]: attributes,
        },
      };
    } catch (error) {
      this.log(context, 'error', 'Failed to fetch originator attributes', { error, originatorId });
      return null;
    }
  }
}
