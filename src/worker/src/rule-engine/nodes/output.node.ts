import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';

export interface OutputConfig extends RuleNodeConfig {
  outputName?: string; // Name of this output (optional)
  logOutput?: boolean; // Log output messages (default: false)
}

/**
 * Output Node
 * 
 * Exit point for rule chains.
 * Marks the end of processing and optionally logs results.
 * 
 * Config:
 * - outputName: Name of this output for identification (optional)
 * - logOutput: Log output messages for debugging (default: false)
 * 
 * This is typically the last node in a rule chain.
 * Messages that reach this node have completed processing.
 */
export class OutputNode extends RuleNode {
  constructor(config: OutputConfig) {
    super('output', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as OutputConfig;

    if (config.logOutput) {
      this.log(context, 'info', `Output: ${config.outputName || 'default'}`, {
        messageId: message.metadata?.messageId,
        dataKeys: Object.keys(message.data),
      });
    }

    // Mark as processed
    return {
      ...message,
      metadata: {
        ...message.metadata,
        processed: true,
        outputName: config.outputName,
        completedAt: new Date().toISOString(),
      },
    };
  }
}
