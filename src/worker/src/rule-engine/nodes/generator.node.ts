import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';

export interface GeneratorConfig extends RuleNodeConfig {
  intervalMs: number; // Interval in milliseconds (required)
  messageTemplate: Record<string, any>; // Template for generated messages (required)
  maxMessages?: number; // Maximum messages to generate (optional, 0 = infinite)
}

/**
 * Generator Node
 * 
 * Generates periodic messages at specified intervals.
 * Useful for testing, simulations, and scheduled tasks.
 * 
 * Config:
 * - intervalMs: Interval between messages in milliseconds (required)
 * - messageTemplate: Template object for generated messages (required)
 * - maxMessages: Max messages to generate (optional, 0 = infinite)
 * 
 * Note: This is a simplified implementation.
 * For production, use a proper scheduler service.
 * 
 * Example:
 * Generate heartbeat messages every 60 seconds
 */
export class GeneratorNode extends RuleNode {
  private intervalId: NodeJS.Timeout | null = null;
  private messageCount = 0;

  constructor(config: GeneratorConfig) {
    super('generator', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as GeneratorConfig;

    if (!config.intervalMs || config.intervalMs <= 0) {
      this.log(context, 'error', 'Invalid interval configured');
      return null;
    }

    if (!config.messageTemplate) {
      this.log(context, 'error', 'Message template not configured');
      return null;
    }

    // Start generator if not already running
    if (!this.intervalId) {
      this.startGenerator(config, context);
    }

    // Pass through original message
    return message;
  }

  private startGenerator(config: GeneratorConfig, context: RuleNodeContext) {
    const maxMessages = config.maxMessages || 0;

    this.intervalId = setInterval(() => {
      // Check if we've reached max messages
      if (maxMessages > 0 && this.messageCount >= maxMessages) {
        this.stopGenerator();
        this.log(context, 'info', 'Generator stopped: max messages reached', {
          messageCount: this.messageCount,
        });
        return;
      }

      // Generate message from template
      const generatedMessage: RuleNodeMessage = {
        data: {
          ...config.messageTemplate,
          generatedAt: new Date().toISOString(),
          sequenceNumber: this.messageCount,
        },
        timestamp: new Date().toISOString(),
        metadata: {
          messageType: 'generated',
          generator: context.nodeId,
        },
      };

      this.messageCount++;

      this.log(context, 'info', 'Message generated', {
        sequenceNumber: this.messageCount,
      });

      // TODO: Publish to next node or Kafka topic
      // For now, just log
    }, config.intervalMs);

    this.log(context, 'info', 'Generator started', {
      intervalMs: config.intervalMs,
      maxMessages: maxMessages || 'infinite',
    });
  }

  private stopGenerator() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Cleanup on node destruction
  destroy() {
    this.stopGenerator();
  }
}
