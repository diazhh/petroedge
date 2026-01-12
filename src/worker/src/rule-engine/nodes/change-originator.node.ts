import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';

export interface ChangeOriginatorConfig extends RuleNodeConfig {
  newOriginatorKey: string; // Key to get new originator ID
  originatorType?: string; // Type of new originator (asset, well, field, etc.)
  updateMetadata?: boolean; // Update metadata with old originator (default: true)
}

/**
 * Change Originator Node
 * 
 * Changes the originator (source) of a message.
 * Useful for:
 * - Routing messages to different assets
 * - Aggregating data from children to parent
 * - Re-attributing telemetry
 * 
 * Config:
 * - newOriginatorKey: Key to get new originator ID (required)
 * - originatorType: Type of new originator (optional)
 * - updateMetadata: Store old originator in metadata (default: true)
 * 
 * Example:
 * Change originator from sensor to well when aggregating sensor data
 */
export class ChangeOriginatorNode extends RuleNode {
  constructor(config: ChangeOriginatorConfig) {
    super('change_originator', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as ChangeOriginatorConfig;
    const updateMetadata = config.updateMetadata !== false;

    const newOriginatorId = this.getNestedValue(message.data, config.newOriginatorKey);
    if (!newOriginatorId) {
      this.log(context, 'warn', `New originator ID not found at ${config.newOriginatorKey}`);
      return null;
    }

    // Store old originator in metadata if requested
    const newMetadata = updateMetadata
      ? {
          ...message.metadata,
          previousOriginator: {
            assetId: message.data.assetId,
            thingId: message.data.thingId,
            type: message.data.originatorType,
            timestamp: message.timestamp,
          },
        }
      : message.metadata;

    // Update message with new originator
    return {
      ...message,
      data: {
        ...message.data,
        assetId: newOriginatorId,
        thingId: newOriginatorId,
        originatorType: config.originatorType || message.data.originatorType,
      },
      metadata: newMetadata,
    };
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
