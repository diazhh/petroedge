import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';

export interface LookupTableConfig extends RuleNodeConfig {
  inputKey: string; // Key to get lookup value
  outputKey?: string; // Key to store result (default: 'lookupResult')
  table: Record<string, any>; // Lookup table (key-value pairs)
  defaultValue?: any; // Default if key not found
  caseSensitive?: boolean; // Case sensitive lookup (default: true)
}

/**
 * Lookup Table Node
 * 
 * Performs key-value lookup from a static table.
 * Useful for:
 * - Status code to description mapping
 * - Alarm severity mapping
 * - Unit conversions
 * - Category classifications
 * 
 * Config:
 * - inputKey: Key to get lookup value (required)
 * - outputKey: Where to store result (default: 'lookupResult')
 * - table: Lookup table object (required)
 * - defaultValue: Value if key not found (optional)
 * - caseSensitive: Case sensitive matching (default: true)
 * 
 * Example table:
 * {
 *   "ACTIVE": "Well is producing",
 *   "INACTIVE": "Well is shut-in",
 *   "MAINTENANCE": "Well under maintenance"
 * }
 */
export class LookupTableNode extends RuleNode {
  constructor(config: LookupTableConfig) {
    super('lookup_table', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as LookupTableConfig;
    const outputKey = config.outputKey || 'lookupResult';
    const caseSensitive = config.caseSensitive !== false;

    if (!config.table || typeof config.table !== 'object') {
      this.log(context, 'error', 'Lookup table not configured or invalid');
      return null;
    }

    const lookupValue = this.getNestedValue(message.data, config.inputKey);
    if (lookupValue === undefined || lookupValue === null) {
      this.log(context, 'warn', `Lookup value not found at ${config.inputKey}`);
      return null;
    }

    let result: any;
    const lookupKey = String(lookupValue);

    if (caseSensitive) {
      result = config.table[lookupKey];
    } else {
      // Case-insensitive lookup
      const lowerKey = lookupKey.toLowerCase();
      const matchingKey = Object.keys(config.table).find(
        k => k.toLowerCase() === lowerKey
      );
      result = matchingKey ? config.table[matchingKey] : undefined;
    }

    // Use default value if not found
    if (result === undefined) {
      if (config.defaultValue !== undefined) {
        result = config.defaultValue;
        this.log(context, 'info', `Lookup key not found, using default: ${lookupKey}`);
      } else {
        this.log(context, 'warn', `Lookup key not found and no default: ${lookupKey}`);
        return null;
      }
    }

    return {
      ...message,
      data: {
        ...message.data,
        [outputKey]: result,
      },
    };
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
