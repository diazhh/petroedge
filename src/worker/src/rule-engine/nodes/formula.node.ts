import { RuleNode, RuleNodeConfig, RuleNodeMessage, RuleNodeContext } from '../node-registry.js';
import { evaluate } from 'mathjs';

export interface FormulaNodeConfig extends RuleNodeConfig {
  formula: string;
  outputField: string;
  variables?: Record<string, string>;
}

export class FormulaNode extends RuleNode {
  constructor(config: FormulaNodeConfig) {
    super('formula', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage> {
    const config = this.config as FormulaNodeConfig;
    
    const scope: Record<string, any> = {};
    
    if (config.variables) {
      for (const [varName, fieldName] of Object.entries(config.variables)) {
        scope[varName] = message.data[fieldName];
      }
    } else {
      Object.assign(scope, message.data);
    }

    try {
      const result = evaluate(config.formula, scope);
      
      this.log(context, 'info', 'Formula evaluated', {
        formula: config.formula,
        scope,
        result,
      });

      return {
        ...message,
        data: {
          ...message.data,
          [config.outputField]: result,
        },
      };
    } catch (error) {
      this.log(context, 'error', 'Formula evaluation error', {
        formula: config.formula,
        error: (error as Error).message,
      });
      return message;
    }
  }
}
