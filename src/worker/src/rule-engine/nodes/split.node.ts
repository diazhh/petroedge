import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';

export interface SplitConfig extends RuleNodeConfig {
  splitBy?: 'array' | 'keys' | 'count'; // How to split (default: 'array')
  arrayKey?: string; // Key containing array to split (for splitBy='array')
  count?: number; // Number of splits (for splitBy='count')
  preserveOriginal?: boolean; // Include original message in each split (default: false)
}

/**
 * Split Node
 * 
 * Splits one message into multiple messages.
 * Useful for:
 * - Processing array items individually
 * - Fan-out patterns
 * - Parallel processing
 * 
 * Split strategies:
 * - array: Split array into individual items
 * - keys: Split object keys into separate messages
 * - count: Duplicate message N times
 * 
 * Config:
 * - splitBy: Split strategy (default: 'array')
 * - arrayKey: Key containing array (for array split)
 * - count: Number of duplicates (for count split)
 * - preserveOriginal: Keep original data in each split (default: false)
 * 
 * Example:
 * Input: { sensors: [{id:1}, {id:2}] }
 * Output: [{ sensor: {id:1} }, { sensor: {id:2} }]
 */
export class SplitNode extends RuleNode {
  constructor(config: SplitConfig) {
    super('split', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | RuleNodeMessage[] | null> {
    const config = this.config as SplitConfig;
    const splitBy = config.splitBy || 'array';
    const preserveOriginal = config.preserveOriginal === true;

    try {
      let splitMessages: RuleNodeMessage[];

      switch (splitBy) {
        case 'array':
          splitMessages = this.splitByArray(message, config, preserveOriginal, context);
          break;

        case 'keys':
          splitMessages = this.splitByKeys(message, preserveOriginal, context);
          break;

        case 'count':
          splitMessages = this.splitByCount(message, config, context);
          break;

        default:
          this.log(context, 'error', `Unknown split strategy: ${splitBy}`);
          return null;
      }

      this.log(context, 'info', `Split message into ${splitMessages.length} messages`, { splitBy });

      return splitMessages;
    } catch (error) {
      this.log(context, 'error', 'Failed to split message', { error });
      return null;
    }
  }

  private splitByArray(
    message: RuleNodeMessage,
    config: SplitConfig,
    preserveOriginal: boolean,
    context: RuleNodeContext
  ): RuleNodeMessage[] {
    if (!config.arrayKey) {
      this.log(context, 'error', 'arrayKey not configured for array split');
      return [];
    }

    const array = this.getNestedValue(message.data, config.arrayKey);
    if (!Array.isArray(array)) {
      this.log(context, 'warn', `Value at ${config.arrayKey} is not an array`);
      return [];
    }

    return array.map((item, index) => ({
      ...message,
      id: `${message.id}-split-${index}`,
      data: preserveOriginal
        ? { ...message.data, splitItem: item, splitIndex: index }
        : { splitItem: item, splitIndex: index, originalId: message.id },
      metadata: {
        ...message.metadata,
        splitFrom: message.id,
        splitIndex: index,
        splitTotal: array.length,
      },
    }));
  }

  private splitByKeys(
    message: RuleNodeMessage,
    preserveOriginal: boolean,
    context: RuleNodeContext
  ): RuleNodeMessage[] {
    const keys = Object.keys(message.data);

    return keys.map((key, index) => ({
      ...message,
      id: `${message.id}-split-${index}`,
      data: preserveOriginal
        ? { ...message.data, splitKey: key, splitValue: message.data[key] }
        : { splitKey: key, splitValue: message.data[key], originalId: message.id },
      metadata: {
        ...message.metadata,
        splitFrom: message.id,
        splitIndex: index,
        splitTotal: keys.length,
      },
    }));
  }

  private splitByCount(
    message: RuleNodeMessage,
    config: SplitConfig,
    context: RuleNodeContext
  ): RuleNodeMessage[] {
    const count = config.count || 2;

    if (count < 1 || count > 100) {
      this.log(context, 'error', `Invalid count: ${count} (must be 1-100)`);
      return [];
    }

    return Array.from({ length: count }, (_, index) => ({
      ...message,
      id: `${message.id}-split-${index}`,
      metadata: {
        ...message.metadata,
        splitFrom: message.id,
        splitIndex: index,
        splitTotal: count,
      },
    }));
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
