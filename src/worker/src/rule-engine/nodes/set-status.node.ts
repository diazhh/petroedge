import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';
import { DittoClientService } from '../../services/ditto-client.service.js';

export interface SetStatusConfig extends RuleNodeConfig {
  assetIdKey?: string; // Key to get asset ID (default: 'assetId')
  status: string; // New status value (required)
  statusAttribute?: string; // Attribute name for status (default: 'status')
  thingIdPrefix?: string; // Prefix for Ditto Thing ID (default: 'com.scadaerp:')
}

/**
 * Set Status Node
 * 
 * Updates the status attribute of an asset in Ditto Digital Twin.
 * Common statuses: 'active', 'inactive', 'maintenance', 'alarm', 'offline'
 * 
 * Config:
 * - assetIdKey: Key to get asset ID (default: 'assetId')
 * - status: New status value (required)
 * - statusAttribute: Attribute name for status (default: 'status')
 * - thingIdPrefix: Prefix for Ditto Thing ID (default: 'com.scadaerp:')
 * 
 * Example:
 * Set device to 'maintenance' when maintenance alarm is triggered
 */
export class SetStatusNode extends RuleNode {
  private dittoClient: DittoClientService;

  constructor(config: SetStatusConfig) {
    super('set_status', config);
    this.dittoClient = new DittoClientService();
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as SetStatusConfig;
    const assetIdKey = config.assetIdKey || 'assetId';
    const statusAttribute = config.statusAttribute || 'status';
    const thingIdPrefix = config.thingIdPrefix || 'com.scadaerp:';

    if (!config.status) {
      this.log(context, 'error', 'Status value not configured');
      return null;
    }

    const assetId = message.data[assetIdKey];
    if (!assetId) {
      this.log(context, 'warn', `Asset ID not found in message.data.${assetIdKey}`);
      return null;
    }

    try {
      // Construct Ditto Thing ID
      const thingId = assetId.includes(':') ? assetId : `${thingIdPrefix}${assetId}`;

      // Update status attribute in Ditto
      await this.dittoClient.updateThingAttribute(thingId, statusAttribute, config.status);

      this.log(context, 'info', 'Status updated', {
        assetId,
        status: config.status,
        attribute: statusAttribute,
      });

      return {
        ...message,
        data: {
          ...message.data,
          statusUpdated: true,
          newStatus: config.status,
        },
      };
    } catch (error) {
      this.log(context, 'error', 'Failed to update status', { error, assetId });
      return null;
    }
  }
}
