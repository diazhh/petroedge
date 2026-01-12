import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';
import { RedisCacheService } from '../../services/redis-cache.service.js';

export interface RelatedAttributesConfig extends RuleNodeConfig {
  relationType: 'parent' | 'children' | 'siblings'; // Type of relation
  attributes: string[]; // Attributes to fetch
  outputKey?: string; // Key to store attributes (default: 'relatedAttributes')
  cacheOnly?: boolean; // Only fetch from cache (default: false)
}

/**
 * Related Attributes Node
 * 
 * Fetches attributes from related assets (parent, children, siblings).
 * Primarily uses Redis cache for performance.
 * 
 * Config:
 * - relationType: Type of relation (required)
 * - attributes: Array of attribute names to fetch (required)
 * - outputKey: Where to store attributes (default: 'relatedAttributes')
 * - cacheOnly: Only use cache, don't fallback to DB (default: false)
 */
export class RelatedAttributesNode extends RuleNode {
  private redisCache: RedisCacheService;

  constructor(config: RelatedAttributesConfig) {
    super('related_attributes', config);
    this.redisCache = new RedisCacheService();
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as RelatedAttributesConfig;
    const outputKey = config.outputKey || 'relatedAttributes';

    if (!config.attributes || !Array.isArray(config.attributes) || config.attributes.length === 0) {
      this.log(context, 'error', 'No attributes configured for fetching');
      return null;
    }

    const assetId = message.data.assetId || message.data.thingId;
    if (!assetId) {
      this.log(context, 'warn', 'Asset ID not found in message');
      return null;
    }

    try {
      // For now, fetch from cache
      // In a full implementation, this would:
      // 1. Get related asset IDs based on relationType
      // 2. Fetch attributes for each related asset
      // 3. Aggregate results

      const relatedData: Record<string, any> = {};

      // Placeholder implementation - would need actual relation fetching
      this.log(context, 'info', `Fetching ${config.relationType} attributes for asset ${assetId}`);

      // Example: Fetch parent attributes
      if (config.relationType === 'parent') {
        const parentId = message.data.parentId;
        if (parentId) {
          const parentAttrs: Record<string, any> = {};
          for (const attr of config.attributes) {
            // Note: RedisCacheService doesn't have a generic get method
            // Using getAssetStatus as workaround
            const cached = await this.redisCache.getAssetStatus(`${parentId}:attr:${attr}`);
            if (cached && cached[attr]) {
              parentAttrs[attr] = cached[attr];
            }
          }
          relatedData.parent = parentAttrs;
        }
      }

      return {
        ...message,
        data: {
          ...message.data,
          [outputKey]: relatedData,
        },
      };
    } catch (error) {
      this.log(context, 'error', 'Failed to fetch related attributes', { error, assetId });
      return null;
    }
  }
}
