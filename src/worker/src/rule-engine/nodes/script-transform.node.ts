import { RuleNode, RuleNodeConfig, RuleNodeMessage, RuleNodeContext } from '../node-registry.js';

export interface ScriptTransformNodeConfig extends RuleNodeConfig {
  script: string;
}

export class ScriptTransformNode extends RuleNode {
  private transformFunction: (msg: RuleNodeMessage, ctx: RuleNodeContext) => RuleNodeMessage;

  constructor(config: ScriptTransformNodeConfig) {
    super('script_transform', config);
    
    const script = (config as ScriptTransformNodeConfig).script;
    this.transformFunction = new Function('msg', 'ctx', `return (${script})(msg, ctx);`) as any;
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage> {
    try {
      const transformed = this.transformFunction(message, context);
      this.log(context, 'info', 'Message transformed', { messageId: message.id });
      return transformed;
    } catch (error) {
      this.log(context, 'error', 'Script transform error', { error: (error as Error).message });
      return message;
    }
  }
}
