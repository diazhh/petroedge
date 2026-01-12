import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';

export interface InputConfig extends RuleNodeConfig {
  messageType?: string; // Expected message type (optional)
  validateSchema?: boolean; // Validate message schema (default: false)
}

/**
 * Input Node
 * 
 * Entry point for rule chains.
 * Receives messages from Kafka topics or other sources.
 * 
 * Config:
 * - messageType: Expected message type for filtering (optional)
 * - validateSchema: Validate message structure (default: false)
 * 
 * This is typically the first node in a rule chain.
 * It passes messages through to the next nodes.
 */
export class InputNode extends RuleNode {
  constructor(config: InputConfig) {
    super('input', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as InputConfig;

    // Filter by message type if configured
    if (config.messageType) {
      const messageType = message.metadata?.messageType || message.data.messageType;
      if (messageType !== config.messageType) {
        this.log(context, 'info', `Message type ${messageType} does not match expected ${config.messageType}`);
        return null;
      }
    }

    // Basic validation
    if (config.validateSchema) {
      if (!message.data || typeof message.data !== 'object') {
        this.log(context, 'warn', 'Invalid message structure: data is missing or not an object');
        return null;
      }
    }

    // Pass through
    return message;
  }
}
