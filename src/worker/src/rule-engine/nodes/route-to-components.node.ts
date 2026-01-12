import { RuleNode, RuleNodeConfig, RuleNodeMessage, RuleNodeContext } from '../node-registry.js';

/**
 * Route to Components Node
 * 
 * Routes telemetry data to multiple Things (fan-out).
 * Groups resolved mappings by Thing ID and creates separate messages.
 * 
 * Input: Message with resolvedMappings array
 * Output: Multiple messages, one per Thing destination
 */

export interface RouteToComponentsNodeConfig extends RuleNodeConfig {
  // No additional config needed
}

interface ResolvedMapping {
  thingId: string;
  feature: string;
  property: string;
  value: any;
  sourceKey: string;
}

export class RouteToComponentsNode extends RuleNode {
  constructor(config: RouteToComponentsNodeConfig) {
    super('route_to_components', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage[]> {
    const resolvedMappings: ResolvedMapping[] = message.metadata?.resolvedMappings || [];

    if (resolvedMappings.length === 0) {
      this.log(context, 'warn', 'No resolved mappings to route');
      return [message];
    }

    // Group mappings by Thing ID
    const mappingsByThing = new Map<string, ResolvedMapping[]>();

    for (const mapping of resolvedMappings) {
      if (!mappingsByThing.has(mapping.thingId)) {
        mappingsByThing.set(mapping.thingId, []);
      }
      mappingsByThing.get(mapping.thingId)!.push(mapping);
    }

    // Create one message per Thing
    const outputMessages: RuleNodeMessage[] = [];

    for (const [thingId, mappings] of mappingsByThing.entries()) {
      // Group by feature
      const featureUpdates: Record<string, Record<string, any>> = {};

      for (const mapping of mappings) {
        if (!featureUpdates[mapping.feature]) {
          featureUpdates[mapping.feature] = {};
        }
        featureUpdates[mapping.feature][mapping.property] = mapping.value;
      }

      const routedMessage: RuleNodeMessage = {
        ...message,
        data: {
          thingId,
          features: featureUpdates,
        },
        metadata: {
          ...message.metadata,
          targetThingId: thingId,
          featureCount: Object.keys(featureUpdates).length,
          propertyCount: mappings.length,
        },
      };

      outputMessages.push(routedMessage);
    }

    this.log(context, 'info', 'Routed to components', {
      totalThings: mappingsByThing.size,
      totalMappings: resolvedMappings.length,
    });

    return outputMessages;
  }
}
