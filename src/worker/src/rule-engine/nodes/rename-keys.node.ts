import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';

export interface RenameKeysConfig extends RuleNodeConfig {
  mappings: Record<string, string>; // Old key -> New key mappings
  removeOriginal?: boolean; // Remove original keys (default: true)
  scope?: 'data' | 'metadata' | 'both'; // Where to apply renames (default: 'data')
}

/**
 * Rename Keys Node
 * 
 * Renames keys in message data or metadata.
 * Useful for:
 * - Normalizing field names from different sources
 * - Adapting to different API schemas
 * - Cleaning up legacy field names
 * 
 * Config:
 * - mappings: Object with old->new key mappings (required)
 * - removeOriginal: Remove original keys after rename (default: true)
 * - scope: Where to apply ('data', 'metadata', 'both') (default: 'data')
 * 
 * Example mappings:
 * {
 *   "temp": "temperature",
 *   "pres": "pressure",
 *   "flow_rate": "flowRate"
 * }
 */
export class RenameKeysNode extends RuleNode {
  constructor(config: RenameKeysConfig) {
    super('rename_keys', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as RenameKeysConfig;
    const removeOriginal = config.removeOriginal !== false;
    const scope = config.scope || 'data';

    if (!config.mappings || typeof config.mappings !== 'object') {
      this.log(context, 'error', 'Mappings not configured or invalid');
      return null;
    }

    const newMessage = { ...message };

    // Apply to data
    if (scope === 'data' || scope === 'both') {
      newMessage.data = this.applyRenames(message.data, config.mappings, removeOriginal);
    }

    // Apply to metadata
    if ((scope === 'metadata' || scope === 'both') && message.metadata) {
      newMessage.metadata = this.applyRenames(message.metadata, config.mappings, removeOriginal);
    }

    return newMessage;
  }

  private applyRenames(
    obj: Record<string, any>,
    mappings: Record<string, string>,
    removeOriginal: boolean
  ): Record<string, any> {
    const result = { ...obj };

    for (const [oldKey, newKey] of Object.entries(mappings)) {
      if (oldKey in result) {
        // Support nested keys with dot notation
        if (newKey.includes('.')) {
          this.setNestedValue(result, newKey, result[oldKey]);
        } else {
          result[newKey] = result[oldKey];
        }

        if (removeOriginal && oldKey !== newKey) {
          delete result[oldKey];
        }
      }
    }

    return result;
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }

    current[parts[parts.length - 1]] = value;
  }
}
