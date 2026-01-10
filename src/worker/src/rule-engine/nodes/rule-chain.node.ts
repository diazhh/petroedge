import { RuleNode, RuleNodeConfig, RuleNodeMessage, RuleNodeContext } from '../node-registry.js';

export interface RuleChainNodeConfig extends RuleNodeConfig {
  targetChainId: string;
  passMetadata?: boolean;
}

export class RuleChainNode extends RuleNode {
  constructor(config: RuleChainNodeConfig) {
    super('rule_chain', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage> {
    const config = this.config as RuleChainNodeConfig;

    this.log(context, 'info', 'Invoking rule chain', {
      currentChain: context.ruleChainId,
      targetChain: config.targetChainId,
    });

    const chainMessage: RuleNodeMessage = {
      ...message,
      metadata: config.passMetadata
        ? message.metadata
        : {
            ...message.metadata,
            sourceChainId: context.ruleChainId,
            sourceNodeId: context.nodeId,
          },
    };

    return {
      ...chainMessage,
      metadata: {
        ...chainMessage.metadata,
        invokeChain: {
          targetChainId: config.targetChainId,
          sourceChainId: context.ruleChainId,
          invoked: true,
        },
      },
    };
  }
}
