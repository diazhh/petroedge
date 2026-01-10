import { RuleNode, RuleNodeConfig, RuleNodeMessage, RuleNodeContext } from '../node-registry.js';

export interface MathNodeConfig extends RuleNodeConfig {
  operation: 'add' | 'subtract' | 'multiply' | 'divide' | 'power' | 'sqrt' | 'abs' | 'round' | 'ceil' | 'floor';
  operands: string[];
  outputField: string;
}

export class MathNode extends RuleNode {
  constructor(config: MathNodeConfig) {
    super('math', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage> {
    const config = this.config as MathNodeConfig;
    
    const values = config.operands.map(field => {
      const value = message.data[field];
      return typeof value === 'number' ? value : parseFloat(value);
    }).filter(v => !isNaN(v));

    if (values.length === 0) {
      this.log(context, 'warn', 'No valid numeric operands found', { operands: config.operands });
      return message;
    }

    let result: number;
    
    switch (config.operation) {
      case 'add':
        result = values.reduce((a, b) => a + b, 0);
        break;
      case 'subtract':
        result = values.reduce((a, b) => a - b);
        break;
      case 'multiply':
        result = values.reduce((a, b) => a * b, 1);
        break;
      case 'divide':
        result = values.reduce((a, b) => a / b);
        break;
      case 'power':
        result = Math.pow(values[0], values[1] || 2);
        break;
      case 'sqrt':
        result = Math.sqrt(values[0]);
        break;
      case 'abs':
        result = Math.abs(values[0]);
        break;
      case 'round':
        result = Math.round(values[0]);
        break;
      case 'ceil':
        result = Math.ceil(values[0]);
        break;
      case 'floor':
        result = Math.floor(values[0]);
        break;
      default:
        result = values[0];
    }

    this.log(context, 'info', 'Math operation executed', {
      operation: config.operation,
      operands: values,
      result,
    });

    return {
      ...message,
      data: {
        ...message.data,
        [config.outputField]: result,
      },
    };
  }
}
