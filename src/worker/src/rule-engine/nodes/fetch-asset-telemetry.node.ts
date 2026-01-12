import { RuleNode, RuleNodeConfig, RuleNodeMessage, RuleNodeContext } from '../node-registry.js';
import { DittoClientService } from '../../services/ditto-client.service.js';

export interface FetchAssetTelemetryNodeConfig extends RuleNodeConfig {
  thingIdField: string;
  featureId: string;
  outputField: string;
  propertyKeys?: string[];
}

export class FetchAssetTelemetryNode extends RuleNode {
  private dittoClient: DittoClientService;

  constructor(config: FetchAssetTelemetryNodeConfig) {
    super('fetch_asset_telemetry', config);
    this.dittoClient = new DittoClientService();
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage> {
    const config = this.config as FetchAssetTelemetryNodeConfig;
    const thingId = message.data[config.thingIdField];

    if (!thingId) {
      this.log(context, 'warn', 'Thing ID not found in message', { field: config.thingIdField });
      return message;
    }

    try {
      const properties = await this.dittoClient.getFeatureProperties(thingId, config.featureId);

      if (!properties) {
        this.log(context, 'warn', 'Feature not found in Ditto', { thingId, featureId: config.featureId });
        return message;
      }

      let filteredProperties = properties;
      if (config.propertyKeys && config.propertyKeys.length > 0) {
        filteredProperties = {};
        for (const key of config.propertyKeys) {
          if (properties[key] !== undefined) {
            filteredProperties[key] = properties[key];
          }
        }
      }

      this.log(context, 'info', 'Fetched telemetry from Ditto', {
        thingId,
        featureId: config.featureId,
        propertyCount: Object.keys(filteredProperties).length,
      });

      return {
        ...message,
        data: {
          ...message.data,
          [config.outputField]: filteredProperties,
        },
      };
    } catch (error) {
      this.log(context, 'error', 'Error fetching telemetry from Ditto', {
        thingId,
        featureId: config.featureId,
        error: (error as Error).message,
      });
      return message;
    }
  }
}
