import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';

export interface EntityTypeFilterConfig extends RuleNodeConfig {
  entityTypes: string[]; // Allowed entity types (required)
  entityTypeKey?: string; // Key to get entity type (default: 'entityType')
}

/**
 * Entity Type Filter Node
 * 
 * Filters messages based on entity type.
 * Only allows messages from specified entity types.
 * 
 * Config:
 * - entityTypes: Array of allowed entity types (required)
 * - entityTypeKey: Key to get entity type from message (default: 'entityType')
 * 
 * Common entity types:
 * - 'well', 'field', 'tank', 'pipeline', 'compressor', 'separator'
 * - 'sensor', 'actuator', 'gateway', 'controller'
 * 
 * Example:
 * Filter to only process well and field messages
 */
export class EntityTypeFilterNode extends RuleNode {
  constructor(config: EntityTypeFilterConfig) {
    super('entity_type_filter', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as EntityTypeFilterConfig;
    const entityTypeKey = config.entityTypeKey || 'entityType';

    if (!config.entityTypes || !Array.isArray(config.entityTypes) || config.entityTypes.length === 0) {
      this.log(context, 'error', 'No entity types configured');
      return null;
    }

    const entityType = message.data[entityTypeKey] || message.metadata?.entityType;
    
    if (!entityType) {
      this.log(context, 'warn', `Entity type not found at ${entityTypeKey}`);
      return null;
    }

    const isAllowed = config.entityTypes.includes(entityType);

    if (!isAllowed) {
      this.log(context, 'info', `Entity type ${entityType} not in allowed list`, {
        entityType,
        allowedTypes: config.entityTypes,
      });
      return null;
    }

    return message;
  }
}
