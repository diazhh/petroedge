import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';
import { DittoClientService, DittoFeature } from '../../services/ditto-client.service.js';

export interface FetchAssetMetadataConfig extends RuleNodeConfig {
  assetIdKey?: string; // Key in message.data to get asset ID (default: 'assetId')
  outputKey?: string; // Key to store metadata (default: 'assetMetadata')
  thingIdPrefix?: string; // Prefix for Ditto Thing ID (default: 'com.scadaerp:')
}

/**
 * Fetch Asset Metadata Node
 * 
 * Enriches message with complete asset metadata from Ditto Digital Twin:
 * - Thing attributes (name, description, status, location, etc.)
 * - Feature properties
 * - Policy information
 * 
 * Config:
 * - assetIdKey: Key to get asset ID from message (default: 'assetId')
 * - outputKey: Where to store metadata (default: 'assetMetadata')
 * - thingIdPrefix: Prefix for Ditto Thing ID (default: 'com.scadaerp:')
 */
export class FetchAssetMetadataNode extends RuleNode {
  private dittoClient: DittoClientService;

  constructor(config: FetchAssetMetadataConfig) {
    super('fetch_asset_metadata', config);
    this.dittoClient = new DittoClientService();
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as FetchAssetMetadataConfig;
    const assetIdKey = config.assetIdKey || 'assetId';
    const outputKey = config.outputKey || 'assetMetadata';
    const thingIdPrefix = config.thingIdPrefix || 'com.scadaerp:';

    const assetId = message.data[assetIdKey];
    if (!assetId) {
      this.log(context, 'warn', `Asset ID not found in message.data.${assetIdKey}`);
      return null;
    }

    try {
      // Construct Ditto Thing ID
      const thingId = assetId.includes(':') ? assetId : `${thingIdPrefix}${assetId}`;

      // Fetch Thing from Ditto
      const thing = await this.dittoClient.getThing(thingId);

      if (!thing) {
        this.log(context, 'warn', `Thing not found: ${thingId}`);
        return null;
      }

      // Extract metadata from Thing
      const metadata: any = {
        thingId: thing.thingId,
        attributes: thing.attributes || {},
        features: {},
      };

      // Extract feature properties
      if (thing.features) {
        for (const [featureName, feature] of Object.entries(thing.features)) {
          const dittoFeature = feature as DittoFeature;
          metadata.features[featureName] = dittoFeature.properties || {};
        }
      }

      // Add metadata to message
      return {
        ...message,
        data: {
          ...message.data,
          [outputKey]: metadata,
        },
      };
    } catch (error) {
      this.log(context, 'error', 'Failed to fetch asset metadata', { error, assetId });
      return null;
    }
  }
}
