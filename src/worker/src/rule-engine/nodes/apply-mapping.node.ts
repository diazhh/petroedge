import { RuleNode, RuleNodeConfig, RuleNodeMessage, RuleNodeContext } from '../node-registry.js';
import { evaluate } from 'mathjs';

/**
 * Apply Mapping Node
 * 
 * Applies telemetry mappings from Connectivity Profile.
 * Transforms values using optional transform expressions.
 * 
 * Input: Message with telemetry values and connectivityProfile
 * Output: Array of { thingId, feature, property, value, transform }
 */

export interface ApplyMappingNodeConfig extends RuleNodeConfig {
  applyTransforms: boolean; // Execute transform expressions
}

interface TelemetryMapping {
  sourceKey: string;
  target: {
    component: string; // 'root' or component code
    feature: string;
    property: string;
  };
  transform?: string; // Optional mathjs expression
}

interface ResolvedMapping {
  thingId: string;
  feature: string;
  property: string;
  value: any;
  sourceKey: string;
}

export class ApplyMappingNode extends RuleNode {
  constructor(config: ApplyMappingNodeConfig) {
    super('apply_mapping', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage> {
    const config = this.config as ApplyMappingNodeConfig;
    const binding = message.metadata?.binding;
    const connectivityProfile = message.metadata?.connectivityProfile;

    if (!binding || !connectivityProfile) {
      this.log(context, 'warn', 'Missing binding or connectivity profile in metadata');
      throw new Error('Missing binding or connectivity profile');
    }

    // Get mappings (custom mappings override connectivity profile mappings)
    const mappings: TelemetryMapping[] = binding.customMappings || connectivityProfile.mappings || [];

    if (mappings.length === 0) {
      this.log(context, 'warn', 'No mappings defined');
      return message;
    }

    // Get digital twin instance to resolve component Thing IDs
    let digitalTwinInstance: any = null;
    if (context.db) {
      const result = await context.db.query(
        `SELECT root_thing_id, component_thing_ids FROM digital_twin_instances WHERE id = $1`,
        [binding.digitalTwinId]
      );

      if (result.rows.length > 0) {
        digitalTwinInstance = result.rows[0];
      }
    }

    if (!digitalTwinInstance) {
      this.log(context, 'warn', 'Digital twin instance not found', { digitalTwinId: binding.digitalTwinId });
      throw new Error(`Digital twin instance ${binding.digitalTwinId} not found`);
    }

    const resolvedMappings: ResolvedMapping[] = [];

    // Apply each mapping
    for (const mapping of mappings) {
      const sourceValue = message.data[mapping.sourceKey];

      if (sourceValue === undefined || sourceValue === null) {
        this.log(context, 'debug', 'Source key not found in telemetry', { sourceKey: mapping.sourceKey });
        continue;
      }

      // Apply transform if configured
      let value = sourceValue;
      if (config.applyTransforms && mapping.transform) {
        try {
          value = evaluate(mapping.transform, { value: sourceValue, msg: message.data });
        } catch (error: any) {
          this.log(context, 'error', 'Transform expression failed', {
            sourceKey: mapping.sourceKey,
            transform: mapping.transform,
            error: error.message,
          });
          value = sourceValue; // Fallback to original value
        }
      }

      // Resolve Thing ID
      let thingId: string;
      if (mapping.target.component === 'root') {
        thingId = digitalTwinInstance.root_thing_id;
      } else {
        const componentThingIds = digitalTwinInstance.component_thing_ids || {};
        thingId = componentThingIds[mapping.target.component];

        if (!thingId) {
          this.log(context, 'warn', 'Component Thing ID not found', {
            component: mapping.target.component,
            availableComponents: Object.keys(componentThingIds),
          });
          continue;
        }
      }

      resolvedMappings.push({
        thingId,
        feature: mapping.target.feature,
        property: mapping.target.property,
        value,
        sourceKey: mapping.sourceKey,
      });
    }

    this.log(context, 'info', 'Mappings applied', {
      totalMappings: mappings.length,
      resolvedMappings: resolvedMappings.length,
    });

    // Enrich message with resolved mappings
    return {
      ...message,
      metadata: {
        ...message.metadata,
        resolvedMappings,
      },
    };
  }
}
