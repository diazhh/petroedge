import { RuleNode, RuleNodeConfig, RuleNodeMessage, RuleNodeContext } from '../node-registry.js';

export interface OriginatorTypeFilterNodeConfig extends RuleNodeConfig {
  allowedTypes: string[];
}

export class OriginatorTypeFilterNode extends RuleNode {
  constructor(config: OriginatorTypeFilterNodeConfig) {
    super('originator_type_filter', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    try {
      const config = this.config as OriginatorTypeFilterNodeConfig;
      const originatorType = message.data.originatorType || message.type;

      if (!originatorType) {
        this.log(context, 'warn', 'No originator type found in message');
        return null;
      }

      const isAllowed = config.allowedTypes.includes(originatorType);

      if (isAllowed) {
        this.log(context, 'info', 'Originator type allowed', { originatorType });
        return message;
      } else {
        this.log(context, 'info', 'Originator type filtered out', {
          originatorType,
          allowedTypes: config.allowedTypes,
        });
        return null;
      }
    } catch (error) {
      this.log(context, 'error', 'Originator type filter error', { error: (error as Error).message });
      return null;
    }
  }
}
