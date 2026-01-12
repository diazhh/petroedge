import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';

export interface AcknowledgeConfig extends RuleNodeConfig {
  acknowledgeToKafka?: boolean; // Send ack to Kafka (default: false)
  ackTopic?: string; // Kafka topic for acknowledgments (optional)
}

/**
 * Acknowledge Node
 * 
 * Acknowledges message processing.
 * Can send acknowledgments to Kafka or other systems.
 * 
 * Config:
 * - acknowledgeToKafka: Send ack to Kafka topic (default: false)
 * - ackTopic: Kafka topic for acks (optional, default: 'acks')
 * 
 * Used to confirm that a message has been successfully processed.
 * Useful for tracking and monitoring.
 */
export class AcknowledgeNode extends RuleNode {
  constructor(config: AcknowledgeConfig) {
    super('acknowledge', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as AcknowledgeConfig;

    const ackMessage = {
      messageId: message.metadata?.messageId,
      acknowledgedAt: new Date().toISOString(),
      ruleChainId: context.ruleChainId,
      nodeId: context.nodeId,
    };

    if (config.acknowledgeToKafka) {
      const topic = config.ackTopic || 'acks';
      // TODO: Publish to Kafka when kafka service is available
      this.log(context, 'info', `Would publish ack to Kafka topic: ${topic}`, ackMessage);
    }

    this.log(context, 'info', 'Message acknowledged', ackMessage);

    return {
      ...message,
      metadata: {
        ...message.metadata,
        acknowledged: true,
        acknowledgedAt: ackMessage.acknowledgedAt,
      },
    };
  }
}
