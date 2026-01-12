import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';
import { RedisCacheService } from '../../services/redis-cache.service.js';

export interface MessageCountConfig extends RuleNodeConfig {
  counterKey: string; // Redis key for counter (required)
  interval?: number; // Time window in seconds (default: 60)
  outputKey?: string; // Key to store count (default: 'messageCount')
  resetOnOutput?: boolean; // Reset counter after output (default: false)
}

/**
 * Message Count Node
 * 
 * Counts messages within a time window using Redis.
 * Useful for rate limiting, anomaly detection, or statistics.
 * 
 * Config:
 * - counterKey: Redis key for counter (required)
 * - interval: Time window in seconds (default: 60)
 * - outputKey: Where to store count (default: 'messageCount')
 * - resetOnOutput: Reset counter after output (default: false)
 * 
 * Example:
 * Count messages per device to detect flooding or anomalies
 */
export class MessageCountNode extends RuleNode {
  private redisCache: RedisCacheService;

  constructor(config: MessageCountConfig) {
    super('message_count', config);
    this.redisCache = new RedisCacheService();
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as MessageCountConfig;
    const interval = config.interval || 60;
    const outputKey = config.outputKey || 'messageCount';

    if (!config.counterKey) {
      this.log(context, 'error', 'Counter key not configured');
      return null;
    }

    try {
      // Build Redis key with timestamp bucket
      const now = Date.now();
      const bucket = Math.floor(now / (interval * 1000));
      const redisKey = `counter:${config.counterKey}:${bucket}`;

      // Use Redis client directly for counter operations
      // Note: RedisCacheService doesn't expose increment/expire methods
      // This is a simplified implementation using cache methods
      const currentCount = await this.redisCache.getAssetStatus(redisKey);
      const count = currentCount ? (currentCount.count || 0) + 1 : 1;
      
      await this.redisCache.updateAssetStatus(redisKey, { count });

      this.log(context, 'info', `Message count: ${count}`, { counterKey: config.counterKey, bucket });

      // Reset counter if configured
      if (config.resetOnOutput) {
        await this.redisCache.invalidateAsset(redisKey);
      }

      // Add count to message
      return {
        ...message,
        data: {
          ...message.data,
          [outputKey]: count,
          counterKey: config.counterKey,
          bucket,
        },
      };
    } catch (error) {
      this.log(context, 'error', 'Failed to count messages', { error, counterKey: config.counterKey });
      return null;
    }
  }
}
