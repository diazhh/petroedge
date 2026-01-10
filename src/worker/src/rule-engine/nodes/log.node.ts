import { RuleNode, RuleNodeConfig, RuleNodeMessage, RuleNodeContext } from '../node-registry.js';

export interface LogNodeConfig extends RuleNodeConfig {
  level: 'info' | 'warn' | 'error';
  message?: string;
}

export class LogNode extends RuleNode {
  constructor(config: LogNodeConfig) {
    super('log', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage> {
    const config = this.config as LogNodeConfig;
    const logMessage = config.message || 'Rule node log';
    
    this.log(context, config.level, logMessage, {
      messageId: message.id,
      messageType: message.type,
      data: message.data,
    });

    return message;
  }
}
