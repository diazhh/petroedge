import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';
import axios from 'axios';
import { CONFIG } from '../../config/index.js';

export interface CreateRelationConfig extends RuleNodeConfig {
  fromAssetKey?: string; // Key to get source asset ID (default: 'assetId')
  toAssetKey: string; // Key to get target asset ID (required)
  relationType: string; // Type of relation (required)
  relationMetadata?: Record<string, string>; // Additional metadata (optional)
}

/**
 * Create Relation Node
 * 
 * Creates a relationship between two assets via Backend API.
 * 
 * Config:
 * - fromAssetKey: Key to get source asset ID (default: 'assetId')
 * - toAssetKey: Key to get target asset ID (required)
 * - relationType: Type of relation (required)
 * - relationMetadata: Additional metadata as key-value pairs (optional)
 * 
 * Common relation types:
 * - 'parent_of', 'child_of', 'connected_to', 'feeds_into'
 * - 'controls', 'monitors', 'depends_on'
 */
export class CreateRelationNode extends RuleNode {
  constructor(config: CreateRelationConfig) {
    super('create_relation', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as CreateRelationConfig;
    const fromAssetKey = config.fromAssetKey || 'assetId';

    const fromAssetId = message.data[fromAssetKey];
    const toAssetId = message.data[config.toAssetKey];

    if (!fromAssetId || !toAssetId) {
      this.log(context, 'warn', 'Source or target asset ID not found', {
        fromAssetKey,
        toAssetKey: config.toAssetKey,
      });
      return null;
    }

    if (!config.relationType) {
      this.log(context, 'error', 'Relation type not configured');
      return null;
    }

    try {
      // Build metadata
      const metadata: Record<string, any> = {};
      if (config.relationMetadata) {
        for (const [key, messagePath] of Object.entries(config.relationMetadata)) {
          const value = this.getNestedValue(message, messagePath);
          if (value !== undefined) {
            metadata[key] = value;
          }
        }
      }

      // Create relation via Backend API
      const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3000';
      await axios.post(`${backendUrl}/api/v1/assets/relations`, {
        fromAssetId,
        toAssetId,
        relationType: config.relationType,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      });

      this.log(context, 'info', 'Relation created', {
        fromAssetId,
        toAssetId,
        relationType: config.relationType,
      });

      return {
        ...message,
        data: {
          ...message.data,
          relationCreated: true,
          relationId: `${fromAssetId}:${config.relationType}:${toAssetId}`,
        },
      };
    } catch (error) {
      this.log(context, 'error', 'Failed to create relation', { error, fromAssetId, toAssetId });
      return null;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
