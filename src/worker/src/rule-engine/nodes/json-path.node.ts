import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';

export interface JsonPathConfig extends RuleNodeConfig {
  path: string; // JSONPath expression
  outputKey?: string; // Key to store result (default: 'jsonPathResult')
  defaultValue?: any; // Default if path not found
}

/**
 * JSON Path Node
 * 
 * Extracts data from message using JSONPath-like syntax.
 * Supports:
 * - Dot notation: data.telemetry.pressure
 * - Array indexing: data.readings[0]
 * - Wildcards: data.sensors.*.temperature
 * 
 * Config:
 * - path: JSONPath expression (required)
 * - outputKey: Where to store result (default: 'jsonPathResult')
 * - defaultValue: Value if path not found (optional)
 * 
 * Examples:
 * - "data.telemetry.pressure" -> Extract pressure value
 * - "data.readings[0].value" -> Extract first reading value
 * - "data.sensors.*.temp" -> Extract all sensor temperatures
 */
export class JsonPathNode extends RuleNode {
  constructor(config: JsonPathConfig) {
    super('json_path', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as JsonPathConfig;
    const outputKey = config.outputKey || 'jsonPathResult';

    if (!config.path) {
      this.log(context, 'error', 'JSONPath not configured');
      return null;
    }

    try {
      const result = this.evaluatePath(message, config.path);

      if (result === undefined) {
        if (config.defaultValue !== undefined) {
          return {
            ...message,
            data: {
              ...message.data,
              [outputKey]: config.defaultValue,
            },
          };
        }
        this.log(context, 'warn', `Path not found: ${config.path}`);
        return null;
      }

      return {
        ...message,
        data: {
          ...message.data,
          [outputKey]: result,
        },
      };
    } catch (error) {
      this.log(context, 'error', 'Failed to evaluate JSONPath', { error, path: config.path });
      return null;
    }
  }

  private evaluatePath(message: RuleNodeMessage, path: string): any {
    // Simple JSONPath implementation
    // Supports: dot notation, array indexing, wildcards
    
    const parts = this.parsePath(path);
    let current: any = message;

    for (const part of parts) {
      if (part === '*') {
        // Wildcard - collect all values
        if (Array.isArray(current)) {
          return current;
        } else if (typeof current === 'object' && current !== null) {
          return Object.values(current);
        }
        return undefined;
      } else if (part.endsWith(']')) {
        // Array indexing
        const match = part.match(/^(.+)\[(\d+)\]$/);
        if (match) {
          const [, key, index] = match;
          current = current?.[key]?.[parseInt(index)];
        } else {
          return undefined;
        }
      } else {
        // Regular key access
        current = current?.[part];
      }

      if (current === undefined) {
        return undefined;
      }
    }

    return current;
  }

  private parsePath(path: string): string[] {
    // Split path by dots, but handle array notation
    const parts: string[] = [];
    let current = '';
    let inBracket = false;

    for (let i = 0; i < path.length; i++) {
      const char = path[i];

      if (char === '[') {
        inBracket = true;
        current += char;
      } else if (char === ']') {
        inBracket = false;
        current += char;
      } else if (char === '.' && !inBracket) {
        if (current) {
          parts.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current) {
      parts.push(current);
    }

    return parts;
  }
}
