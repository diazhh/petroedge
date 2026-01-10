import { RuleNode, RuleNodeConfig, RuleNodeMessage, RuleNodeContext } from '../node-registry.js';
import { dittoClient } from '@/services/ditto-client.service.js';

export interface FetchAssetAttributesNodeConfig extends RuleNodeConfig {
  thingIdField: string;
  outputField: string;
  attributeKeys?: string[];
}

export class FetchAssetAttributesNode extends RuleNode {
  constructor(config: FetchAssetAttributesNodeConfig) {
    super('fetch_asset_attributes', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage> {
    const config = this.config as FetchAssetAttributesNodeConfig;
    const thingId = message.data[config.thingIdField];

    if (!thingId) {
      this.log(context, 'warn', 'Thing ID not found in message', { field: config.thingIdField });
      return message;
    }

    try {
      const attributes = await dittoClient.getThingAttributes(thingId);

      if (!attributes) {
        this.log(context, 'warn', 'Thing not found in Ditto', { thingId });
        return message;
      }

      let filteredAttributes = attributes;
      if (config.attributeKeys && config.attributeKeys.length > 0) {
        filteredAttributes = {};
        for (const key of config.attributeKeys) {
          if (attributes[key] !== undefined) {
            filteredAttributes[key] = attributes[key];
          }
        }
      }

      this.log(context, 'info', 'Fetched attributes from Ditto', {
        thingId,
        attributeCount: Object.keys(filteredAttributes).length,
      });

      return {
        ...message,
        data: {
          ...message.data,
          [config.outputField]: filteredAttributes,
        },
      };
    } catch (error) {
      this.log(context, 'error', 'Error fetching attributes from Ditto', {
        thingId,
        error: (error as Error).message,
      });
      return message;
    }
  }
}
