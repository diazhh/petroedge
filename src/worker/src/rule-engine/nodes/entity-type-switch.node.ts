import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';

export interface EntityTypeSwitchConfig extends RuleNodeConfig {
  entityTypeKey?: string; // Key to get entity type (default: 'entityType')
}

/**
 * Entity Type Switch Node
 * 
 * Routes messages to different outputs based on entity type.
 * Each entity type gets its own output connection.
 * 
 * Config:
 * - entityTypeKey: Key to get entity type from message (default: 'entityType')
 * 
 * Outputs:
 * - Named by entity type (e.g., 'well', 'field', 'tank')
 * - 'other' for unmatched types
 * 
 * Example:
 * Route wells to one chain, fields to another
 */
export class EntityTypeSwitchNode extends RuleNode {
  constructor(config: EntityTypeSwitchConfig) {
    super('entity_type_switch', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as EntityTypeSwitchConfig;
    const entityTypeKey = config.entityTypeKey || 'entityType';

    const entityType = message.data[entityTypeKey] || message.metadata?.entityType;
    
    if (!entityType) {
      this.log(context, 'warn', `Entity type not found at ${entityTypeKey}`);
      // Route to 'other' output
      return {
        ...message,
        metadata: {
          ...message.metadata,
          outputRoute: 'other',
        },
      };
    }

    // Route to output named by entity type
    return {
      ...message,
      metadata: {
        ...message.metadata,
        outputRoute: entityType,
      },
    };
  }
}
