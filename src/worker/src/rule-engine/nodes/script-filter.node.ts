import { RuleNode, RuleNodeConfig, RuleNodeMessage, RuleNodeContext } from '../node-registry.js';

export interface ScriptFilterNodeConfig extends RuleNodeConfig {
  script: string;
}

export class ScriptFilterNode extends RuleNode {
  private filterFunction: (msg: RuleNodeMessage, ctx: RuleNodeContext) => boolean;

  constructor(config: ScriptFilterNodeConfig) {
    super('script_filter', config);
    
    const script = (config as ScriptFilterNodeConfig).script;
    this.filterFunction = new Function('msg', 'ctx', `return (${script})(msg, ctx);`) as any;
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    try {
      const result = this.filterFunction(message, context);
      
      if (result) {
        this.log(context, 'info', 'Filter passed', { messageId: message.id });
        return message;
      } else {
        this.log(context, 'info', 'Filter rejected', { messageId: message.id });
        return null;
      }
    } catch (error) {
      this.log(context, 'error', 'Script filter error', { error: (error as Error).message });
      return null;
    }
  }
}
