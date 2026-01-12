import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';
import axios from 'axios';

export interface FetchRelatedAssetsConfig extends RuleNodeConfig {
  assetIdKey?: string; // Key in message.data to get asset ID (default: 'assetId')
  outputKey?: string; // Key to store related assets (default: 'relatedAssets')
  relationType?: string; // Type of relation to fetch (optional)
}

/**
 * Fetch Related Assets Node
 * 
 * Fetches related assets via Backend API based on asset relations.
 * 
 * Config:
 * - assetIdKey: Key to get asset ID from message (default: 'assetId')
 * - outputKey: Where to store related assets (default: 'relatedAssets')
 * - relationType: Filter by specific relation type (optional)
 */
export class FetchRelatedAssetsNode extends RuleNode {
  constructor(config: FetchRelatedAssetsConfig) {
    super('fetch_related_assets', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as FetchRelatedAssetsConfig;
    const assetIdKey = config.assetIdKey || 'assetId';
    const outputKey = config.outputKey || 'relatedAssets';

    const assetId = message.data[assetIdKey];
    if (!assetId) {
      this.log(context, 'warn', `Asset ID not found in message.data.${assetIdKey}`);
      return null;
    }

    try {
      // Fetch related assets via Backend API
      const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3000';
      const params: any = { assetId };
      if (config.relationType) {
        params.relationType = config.relationType;
      }

      const response = await axios.get(`${backendUrl}/api/v1/assets/relations`, { params });
      const related = response.data.data || [];

      this.log(context, 'info', `Fetched ${related.length} related assets`, { assetId });

      // Add related assets to message
      return {
        ...message,
        data: {
          ...message.data,
          [outputKey]: related,
        },
      };
    } catch (error) {
      this.log(context, 'error', 'Failed to fetch related assets', { error, assetId });
      return null;
    }
  }
}
