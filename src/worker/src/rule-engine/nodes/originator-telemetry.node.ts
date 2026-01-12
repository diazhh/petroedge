import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';
import { DittoClientService } from '@/services/ditto-client.service.js';

export interface OriginatorTelemetryConfig extends RuleNodeConfig {
  telemetryKeys?: string[]; // Specific telemetry keys to fetch (optional, fetches all if not specified)
  outputKey?: string; // Key to store telemetry (default: 'originatorTelemetry')
  featureName?: string; // Feature name in Ditto (default: 'telemetry')
}

/**
 * Originator Telemetry Node
 * 
 * Enriches message with telemetry data from the originator (source entity).
 * Fetches from Eclipse Ditto Thing telemetry feature.
 * 
 * Config:
 * - telemetryKeys: Array of telemetry keys to fetch (optional, fetches all if not specified)
 * - outputKey: Where to store telemetry (default: 'originatorTelemetry')
 * - featureName: Feature name in Ditto (default: 'telemetry')
 * 
 * Originator is determined from:
 * - message.data.thingId
 * - message.data.assetId
 * - message.metadata.originator
 */
export class OriginatorTelemetryNode extends RuleNode {
  private dittoClient: DittoClientService;

  constructor(config: OriginatorTelemetryConfig) {
    super('originator_telemetry', config);
    this.dittoClient = new DittoClientService();
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as OriginatorTelemetryConfig;
    const outputKey = config.outputKey || 'originatorTelemetry';
    const featureName = config.featureName || 'telemetry';

    const originatorId = message.data.thingId || message.data.assetId || message.metadata?.originator;
    
    if (!originatorId) {
      this.log(context, 'warn', 'Originator ID not found in message');
      return null;
    }

    try {
      // Fetch telemetry feature from Ditto
      const properties = await this.dittoClient.getFeatureProperties(originatorId, featureName);
      
      if (!properties) {
        this.log(context, 'warn', `Telemetry feature not found for originator ${originatorId}`);
        return message; // Pass through without enrichment
      }

      let telemetry = properties;

      // Filter to specific keys if configured
      if (config.telemetryKeys && Array.isArray(config.telemetryKeys) && config.telemetryKeys.length > 0) {
        const filtered: Record<string, any> = {};
        for (const key of config.telemetryKeys) {
          if (properties[key] !== undefined) {
            filtered[key] = properties[key];
          }
        }
        telemetry = filtered;
      }

      return {
        ...message,
        data: {
          ...message.data,
          [outputKey]: telemetry,
        },
      };
    } catch (error) {
      this.log(context, 'error', 'Failed to fetch originator telemetry', { error, originatorId });
      return null;
    }
  }
}
