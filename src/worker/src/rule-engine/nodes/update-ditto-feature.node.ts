import { RuleNode, RuleNodeConfig, RuleNodeMessage, RuleNodeContext } from '../node-registry.js';
import { dittoClient } from '@/services/ditto-client.service.js';

export interface UpdateDittoFeatureNodeConfig extends RuleNodeConfig {
  thingIdField: string;
  featureId: string;
  properties: Record<string, string>;
  merge?: boolean;
}

export class UpdateDittoFeatureNode extends RuleNode {
  constructor(config: UpdateDittoFeatureNodeConfig) {
    super('update_ditto_feature', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage> {
    const config = this.config as UpdateDittoFeatureNodeConfig;
    const thingId = message.data[config.thingIdField];

    if (!thingId) {
      this.log(context, 'warn', 'Thing ID not found in message', { field: config.thingIdField });
      return message;
    }

    const properties: Record<string, any> = {};
    for (const [propKey, messageField] of Object.entries(config.properties)) {
      const value = message.data[messageField];
      if (value !== undefined) {
        properties[propKey] = value;
      }
    }

    if (Object.keys(properties).length === 0) {
      this.log(context, 'warn', 'No properties to update', { thingId });
      return message;
    }

    try {
      if (config.merge) {
        await dittoClient.patchFeatureProperties(thingId, config.featureId, properties);
      } else {
        await dittoClient.updateFeatureProperties(thingId, config.featureId, properties);
      }

      this.log(context, 'info', 'Updated Ditto feature', {
        thingId,
        featureId: config.featureId,
        propertyCount: Object.keys(properties).length,
        merge: config.merge,
      });

      return {
        ...message,
        metadata: {
          ...message.metadata,
          dittoUpdate: {
            thingId,
            featureId: config.featureId,
            updated: true,
          },
        },
      };
    } catch (error) {
      this.log(context, 'error', 'Error updating Ditto feature', {
        thingId,
        featureId: config.featureId,
        error: (error as Error).message,
      });
      return message;
    }
  }
}
