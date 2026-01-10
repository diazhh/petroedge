import { RuleNode, RuleNodeConfig, RuleNodeMessage, RuleNodeContext } from '../node-registry.js';

export interface ThresholdFilterNodeConfig extends RuleNodeConfig {
  field: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
  threshold: number;
}

export class ThresholdFilterNode extends RuleNode {
  constructor(config: ThresholdFilterNodeConfig) {
    super('threshold_filter', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as ThresholdFilterNodeConfig;
    const value = message.data[config.field];

    if (typeof value !== 'number') {
      this.log(context, 'warn', 'Field is not a number', { field: config.field, value });
      return null;
    }

    let passed = false;
    switch (config.operator) {
      case 'gt':
        passed = value > config.threshold;
        break;
      case 'gte':
        passed = value >= config.threshold;
        break;
      case 'lt':
        passed = value < config.threshold;
        break;
      case 'lte':
        passed = value <= config.threshold;
        break;
      case 'eq':
        passed = value === config.threshold;
        break;
      case 'neq':
        passed = value !== config.threshold;
        break;
    }

    if (passed) {
      this.log(context, 'info', 'Threshold filter passed', {
        field: config.field,
        value,
        operator: config.operator,
        threshold: config.threshold,
      });
      return message;
    } else {
      this.log(context, 'info', 'Threshold filter rejected', {
        field: config.field,
        value,
        operator: config.operator,
        threshold: config.threshold,
      });
      return null;
    }
  }
}
