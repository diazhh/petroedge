import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';

export interface OriginatorFieldsConfig extends RuleNodeConfig {
  fields: string[]; // Fields to extract from originator
  outputKey?: string; // Key to store extracted fields (default: 'originatorFields')
  includeMetadata?: boolean; // Include metadata fields (default: false)
}

/**
 * Originator Fields Node
 * 
 * Extracts specific fields from the message originator/metadata.
 * Useful for enriching messages with originator context without
 * fetching from database.
 * 
 * Config:
 * - fields: Array of field names to extract (required)
 * - outputKey: Where to store extracted fields (default: 'originatorFields')
 * - includeMetadata: Include all metadata fields (default: false)
 * 
 * Example fields: ['tenantId', 'assetId', 'assetType', 'location']
 */
export class OriginatorFieldsNode extends RuleNode {
  constructor(config: OriginatorFieldsConfig) {
    super('originator_fields', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as OriginatorFieldsConfig;
    const outputKey = config.outputKey || 'originatorFields';
    const includeMetadata = config.includeMetadata === true;

    if (!config.fields || !Array.isArray(config.fields) || config.fields.length === 0) {
      this.log(context, 'error', 'No fields configured for extraction');
      return null;
    }

    const extracted: Record<string, any> = {};

    // Extract from message.data
    for (const field of config.fields) {
      const value = this.getNestedValue(message.data, field);
      if (value !== undefined) {
        extracted[field] = value;
      }
    }

    // Include metadata if requested
    if (includeMetadata && message.metadata) {
      extracted._metadata = message.metadata;
    }

    // Add tenant and rule chain context
    extracted._context = {
      tenantId: context.tenantId,
      ruleChainId: context.ruleChainId,
      nodeId: context.nodeId,
    };

    return {
      ...message,
      data: {
        ...message.data,
        [outputKey]: extracted,
      },
    };
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
