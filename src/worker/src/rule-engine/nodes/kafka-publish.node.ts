import { RuleNode, RuleNodeConfig, RuleNodeMessage, RuleNodeContext } from '../node-registry.js';

export interface KafkaPublishNodeConfig extends RuleNodeConfig {
  topic: string;
  key?: string;
  partition?: number;
}

export class KafkaPublishNode extends RuleNode {
  constructor(config: KafkaPublishNodeConfig) {
    super('kafka_publish', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage> {
    const config = this.config as KafkaPublishNodeConfig;
    
    this.log(context, 'info', 'Publishing message to Kafka', {
      topic: config.topic,
      key: config.key,
      messageId: message.id,
    });

    return {
      ...message,
      metadata: {
        ...message.metadata,
        kafkaPublish: {
          topic: config.topic,
          key: config.key,
          partition: config.partition,
          timestamp: new Date().toISOString(),
        },
      },
    };
  }
}
