import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';
import { DittoClientService } from '../../services/ditto-client.service.js';

export interface DeviceAttributesConfig extends RuleNodeConfig {
  deviceIdKey?: string; // Key to get device ID (default: 'deviceId')
  outputKey?: string; // Key to store attributes (default: 'deviceAttributes')
  attributeKeys?: string[]; // Specific attributes to fetch (optional)
  thingIdPrefix?: string; // Prefix for Ditto Thing ID (default: 'com.scadaerp:')
}

/**
 * Device Attributes Node
 * 
 * Enriches message with device attributes from Ditto Digital Twin.
 * Fetches static configuration and metadata about the device.
 * 
 * Config:
 * - deviceIdKey: Key to get device ID (default: 'deviceId')
 * - outputKey: Where to store attributes (default: 'deviceAttributes')
 * - attributeKeys: Specific attributes to fetch (optional)
 * - thingIdPrefix: Prefix for Ditto Thing ID (default: 'com.scadaerp:')
 * 
 * Example:
 * Enrich telemetry with device model, firmware version, location
 */
export class DeviceAttributesNode extends RuleNode {
  private dittoClient: DittoClientService;

  constructor(config: DeviceAttributesConfig) {
    super('device_attributes', config);
    this.dittoClient = new DittoClientService();
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as DeviceAttributesConfig;
    const deviceIdKey = config.deviceIdKey || 'deviceId';
    const outputKey = config.outputKey || 'deviceAttributes';
    const thingIdPrefix = config.thingIdPrefix || 'com.scadaerp:';

    const deviceId = message.data[deviceIdKey] || message.metadata?.deviceId;
    if (!deviceId) {
      this.log(context, 'warn', `Device ID not found in message.data.${deviceIdKey} or metadata`);
      return null;
    }

    try {
      // Construct Ditto Thing ID
      const thingId = deviceId.includes(':') ? deviceId : `${thingIdPrefix}${deviceId}`;

      // Fetch Thing attributes from Ditto
      const attributes = await this.dittoClient.getThingAttributes(thingId);

      if (!attributes) {
        this.log(context, 'warn', `Device attributes not found: ${thingId}`);
        return null;
      }

      // Filter to specific keys if configured
      let filteredAttributes = attributes;
      if (config.attributeKeys && config.attributeKeys.length > 0) {
        filteredAttributes = {};
        for (const key of config.attributeKeys) {
          if (attributes[key] !== undefined) {
            filteredAttributes[key] = attributes[key];
          }
        }
      }

      this.log(context, 'info', `Enriched with ${Object.keys(filteredAttributes).length} device attributes`, { deviceId });

      // Add device attributes to message
      return {
        ...message,
        data: {
          ...message.data,
          [outputKey]: filteredAttributes,
        },
      };
    } catch (error) {
      this.log(context, 'error', 'Failed to fetch device attributes', { error, deviceId });
      return null;
    }
  }
}
