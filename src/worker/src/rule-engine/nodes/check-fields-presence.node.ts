import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';

export interface CheckFieldsPresenceConfig extends RuleNodeConfig {
  fields: string[]; // Fields to check (required)
  checkAllFields?: boolean; // All fields must exist (default: true)
  outputKey?: string; // Key to store result (default: 'fieldsPresent')
}

/**
 * Check Fields Presence Node
 * 
 * Verifies that specified fields exist in the message.
 * Can check for all fields or any field.
 * 
 * Config:
 * - fields: Array of field paths to check (required)
 * - checkAllFields: If true, all fields must exist; if false, at least one (default: true)
 * - outputKey: Where to store result object (default: 'fieldsPresent')
 * 
 * Output includes:
 * - allPresent: boolean
 * - presentFields: string[]
 * - missingFields: string[]
 * 
 * Message passes if:
 * - checkAllFields=true: all fields present
 * - checkAllFields=false: at least one field present
 */
export class CheckFieldsPresenceNode extends RuleNode {
  constructor(config: CheckFieldsPresenceConfig) {
    super('check_fields_presence', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as CheckFieldsPresenceConfig;
    const checkAllFields = config.checkAllFields !== false;
    const outputKey = config.outputKey || 'fieldsPresent';

    if (!config.fields || !Array.isArray(config.fields) || config.fields.length === 0) {
      this.log(context, 'error', 'No fields configured for checking');
      return null;
    }

    const presentFields: string[] = [];
    const missingFields: string[] = [];

    // Check each field
    for (const field of config.fields) {
      const value = this.getNestedValue(message.data, field);
      if (value !== undefined && value !== null) {
        presentFields.push(field);
      } else {
        missingFields.push(field);
      }
    }

    const allPresent = missingFields.length === 0;
    const anyPresent = presentFields.length > 0;

    // Determine if message should pass
    const shouldPass = checkAllFields ? allPresent : anyPresent;

    if (!shouldPass) {
      this.log(context, 'info', 'Fields check failed', {
        checkAllFields,
        presentFields,
        missingFields,
      });
      return null;
    }

    // Add result to message
    return {
      ...message,
      data: {
        ...message.data,
        [outputKey]: {
          allPresent,
          presentFields,
          missingFields,
          checkedFields: config.fields.length,
        },
      },
    };
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
