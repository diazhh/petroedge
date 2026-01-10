import { RuleNode, RuleNodeConfig, RuleNodeMessage, RuleNodeContext } from '../node-registry.js';

export interface KafkaInputNodeConfig extends RuleNodeConfig {
  topic: string;
}

export class KafkaInputNode extends RuleNode {
  constructor(config: KafkaInputNodeConfig) {
    super('kafka_input', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage> {
    this.log(context, 'info', 'Processing Kafka input message', { topic: (this.config as KafkaInputNodeConfig).topic });
    return message;
  }
}
