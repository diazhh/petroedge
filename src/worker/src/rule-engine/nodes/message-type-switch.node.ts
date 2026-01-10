import { RuleNode, RuleNodeConfig, RuleNodeMessage, RuleNodeContext } from '../node-registry.js';

export interface MessageTypeSwitchNodeConfig extends RuleNodeConfig {
  routes: Record<string, string>;
}

export class MessageTypeSwitchNode extends RuleNode {
  constructor(config: MessageTypeSwitchNodeConfig) {
    super('message_type_switch', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage> {
    const config = this.config as MessageTypeSwitchNodeConfig;
    const messageType = message.type;

    const route = config.routes[messageType] || config.routes['default'];

    this.log(context, 'info', 'Message type switch', {
      messageType,
      route: route || 'no_route',
    });

    return {
      ...message,
      metadata: {
        ...message.metadata,
        route,
      },
    };
  }
}
