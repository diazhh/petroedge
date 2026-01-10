import { z } from 'zod';
import { logger } from '@/utils/logger.js';

export const RuleNodeMessageSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.record(z.any()),
  metadata: z.record(z.any()).optional(),
  timestamp: z.string().datetime(),
});

export type RuleNodeMessage = z.infer<typeof RuleNodeMessageSchema>;

export interface RuleNodeContext {
  nodeId: string;
  ruleChainId: string;
  tenantId: string;
  logger: typeof logger;
}

export interface RuleNodeConfig {
  [key: string]: any;
}

export abstract class RuleNode {
  constructor(
    public readonly type: string,
    public readonly config: RuleNodeConfig
  ) {}

  abstract execute(
    message: RuleNodeMessage,
    context: RuleNodeContext
  ): Promise<RuleNodeMessage | RuleNodeMessage[] | null>;

  protected log(context: RuleNodeContext, level: 'info' | 'warn' | 'error', msg: string, meta?: any) {
    context.logger[level]({ nodeId: context.nodeId, ruleChainId: context.ruleChainId, ...meta }, msg);
  }
}

export class NodeRegistry {
  private nodes = new Map<string, new (config: RuleNodeConfig) => RuleNode>();

  register(type: string, nodeClass: new (config: RuleNodeConfig) => RuleNode) {
    if (this.nodes.has(type)) {
      logger.warn({ type }, 'Node type already registered, overwriting');
    }
    this.nodes.set(type, nodeClass);
    logger.info({ type }, 'Registered rule node type');
  }

  create(type: string, config: RuleNodeConfig): RuleNode {
    const NodeClass = this.nodes.get(type);
    if (!NodeClass) {
      throw new Error(`Unknown node type: ${type}`);
    }
    return new NodeClass(config);
  }

  getRegisteredTypes(): string[] {
    return Array.from(this.nodes.keys());
  }
}

export const nodeRegistry = new NodeRegistry();
