import { RuleNode, RuleNodeConfig, RuleNodeMessage, RuleNodeContext } from '../node-registry.js';

export interface SwitchCase {
  condition: string;
  output: string;
}

export interface SwitchNodeConfig extends RuleNodeConfig {
  cases: SwitchCase[];
  defaultOutput?: string;
}

export class SwitchNode extends RuleNode {
  constructor(config: SwitchNodeConfig) {
    super('switch', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    try {
      const config = this.config as SwitchNodeConfig;

      for (const switchCase of config.cases) {
        const conditionFunction = new Function(
          'msg',
          'ctx',
          `return (${switchCase.condition})(msg, ctx);`
        ) as any;

        const result = conditionFunction(message, context);

        if (result) {
          this.log(context, 'info', 'Switch case matched', {
            output: switchCase.output,
            condition: switchCase.condition,
          });
          return {
            ...message,
            metadata: {
              ...message.metadata,
              switchOutput: switchCase.output,
            },
          };
        }
      }

      if (config.defaultOutput) {
        this.log(context, 'info', 'Using default switch output', {
          output: config.defaultOutput,
        });
        return {
          ...message,
          metadata: {
            ...message.metadata,
            switchOutput: config.defaultOutput,
          },
        };
      }

      this.log(context, 'info', 'No switch case matched and no default');
      return null;
    } catch (error) {
      this.log(context, 'error', 'Switch node error', { error: (error as Error).message });
      return null;
    }
  }
}
