import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';

export interface MergeConfig extends RuleNodeConfig {
  timeout?: number; // Timeout to wait for all inputs (ms, default: 5000)
  expectedInputs?: number; // Number of inputs to wait for (default: 2)
  mergeStrategy?: 'first' | 'last' | 'all' | 'merge'; // How to merge (default: 'merge')
}

/**
 * Merge Node
 * 
 * Merges multiple message flows into one.
 * Waits for messages from multiple sources and combines them.
 * 
 * Strategies:
 * - first: Return first message received
 * - last: Return last message received
 * - all: Return array of all messages
 * - merge: Deep merge all message data
 * 
 * Config:
 * - timeout: Max wait time in ms (default: 5000)
 * - expectedInputs: Number of inputs to wait for (default: 2)
 * - mergeStrategy: How to combine messages (default: 'merge')
 * 
 * Note: This is a simplified implementation.
 * For production, use a proper state management system.
 */
export class MergeNode extends RuleNode {
  private pendingMerges = new Map<string, Array<RuleNodeMessage>>();

  constructor(config: MergeConfig) {
    super('merge', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | RuleNodeMessage[] | null> {
    const config = this.config as MergeConfig;
    const timeout = config.timeout || 5000;
    const expectedInputs = config.expectedInputs || 2;
    const strategy = config.mergeStrategy || 'merge';

    // Create merge key (could be based on correlation ID, asset ID, etc.)
    const mergeKey = message.data.correlationId || message.data.assetId || context.ruleChainId;
    const stateKey = `${mergeKey}:${context.nodeId}`;

    // Get or create pending messages array
    let pending = this.pendingMerges.get(stateKey);
    if (!pending) {
      pending = [];
      this.pendingMerges.set(stateKey, pending);

      // Set timeout to clear pending messages
      setTimeout(() => {
        this.pendingMerges.delete(stateKey);
        this.log(context, 'warn', 'Merge timeout, clearing pending messages', { mergeKey });
      }, timeout);
    }

    // Add current message
    pending.push(message);

    // Check if we have all expected inputs
    if (pending.length < expectedInputs) {
      this.log(context, 'info', `Waiting for more inputs (${pending.length}/${expectedInputs})`, { mergeKey });
      return null; // Wait for more messages
    }

    // We have all inputs, perform merge
    const messages = [...pending];
    this.pendingMerges.delete(stateKey);

    this.log(context, 'info', `Merging ${messages.length} messages`, { strategy });

    switch (strategy) {
      case 'first':
        return messages[0];

      case 'last':
        return messages[messages.length - 1];

      case 'all':
        return messages;

      case 'merge':
      default:
        // Deep merge all message data
        const mergedData = messages.reduce((acc, msg) => {
          return this.deepMerge(acc, msg.data);
        }, {});

        return {
          ...messages[0],
          data: mergedData,
          metadata: {
            ...messages[0].metadata,
            mergedFrom: messages.length,
            mergedAt: new Date().toISOString(),
          },
        };
    }
  }

  private deepMerge(target: any, source: any): any {
    const output = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        output[key] = this.deepMerge(output[key] || {}, source[key]);
      } else {
        output[key] = source[key];
      }
    }

    return output;
  }
}
