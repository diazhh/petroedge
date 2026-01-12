import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';
import axios from 'axios';
import { CONFIG } from '../../config/index.js';

export interface DeleteRelationConfig extends RuleNodeConfig {
  fromAssetKey?: string; // Key to get source asset ID (default: 'assetId')
  toAssetKey: string; // Key to get target asset ID (required)
  relationType: string; // Type of relation (required)
}

/**
 * Delete Relation Node
 * 
 * Deletes a relationship between two assets via Backend API.
 * 
 * Config:
 * - fromAssetKey: Key to get source asset ID (default: 'assetId')
 * - toAssetKey: Key to get target asset ID (required)
 * - relationType: Type of relation (required)
 * 
 * Example:
 * Remove connection between assets when condition changes
 */
export class DeleteRelationNode extends RuleNode {
  constructor(config: DeleteRelationConfig) {
    super('delete_relation', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as DeleteRelationConfig;
    const fromAssetKey = config.fromAssetKey || 'assetId';

    const fromAssetId = message.data[fromAssetKey];
    const toAssetId = message.data[config.toAssetKey];

    if (!fromAssetId || !toAssetId) {
      this.log(context, 'warn', 'Source or target asset ID not found');
      return null;
    }

    if (!config.relationType) {
      this.log(context, 'error', 'Relation type not configured');
      return null;
    }

    try {
      // Delete relation via Backend API
      const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3000';
      await axios.delete(`${backendUrl}/api/v1/assets/relations`, {
        data: {
          fromAssetId,
          toAssetId,
          relationType: config.relationType,
        },
      });

      this.log(context, 'info', 'Relation deleted', {
        fromAssetId,
        toAssetId,
        relationType: config.relationType,
      });

      return {
        ...message,
        data: {
          ...message.data,
          relationDeleted: true,
        },
      };
    } catch (error) {
      this.log(context, 'error', 'Failed to delete relation', { error, fromAssetId, toAssetId });
      return null;
    }
  }
}
