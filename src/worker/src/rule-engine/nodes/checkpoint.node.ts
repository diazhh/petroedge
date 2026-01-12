import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';

export interface CheckpointConfig extends RuleNodeConfig {
  checkpointName: string; // Name of this checkpoint (required)
  logCheckpoint?: boolean; // Log checkpoint events (default: true)
  storeState?: boolean; // Store message state at checkpoint (default: false)
}

/**
 * Checkpoint Node
 * 
 * Creates a checkpoint in the rule chain execution.
 * Useful for debugging and monitoring complex rule chains.
 * 
 * Config:
 * - checkpointName: Name of this checkpoint (required)
 * - logCheckpoint: Log when checkpoint is reached (default: true)
 * - storeState: Store message state for recovery (default: false)
 * 
 * Checkpoints help track message flow through complex rule chains.
 * Can be used for debugging, monitoring, and recovery.
 */
export class CheckpointNode extends RuleNode {
  constructor(config: CheckpointConfig) {
    super('checkpoint', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as CheckpointConfig;

    if (!config.checkpointName) {
      this.log(context, 'error', 'Checkpoint name not configured');
      return null;
    }

    const checkpointData = {
      checkpointName: config.checkpointName,
      timestamp: new Date().toISOString(),
      messageId: message.metadata?.messageId,
      ruleChainId: context.ruleChainId,
      nodeId: context.nodeId,
    };

    if (config.logCheckpoint !== false) {
      this.log(context, 'info', `Checkpoint: ${config.checkpointName}`, checkpointData);
    }

    // Add checkpoint to message metadata
    const checkpoints = message.metadata?.checkpoints || [];
    checkpoints.push(checkpointData);

    return {
      ...message,
      metadata: {
        ...message.metadata,
        checkpoints,
        lastCheckpoint: config.checkpointName,
      },
    };
  }
}
