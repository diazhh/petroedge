import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';

export interface AggregateConfig extends RuleNodeConfig {
  inputKey: string; // Key to get values for aggregation
  outputKey?: string; // Key to store result (default: 'aggregateResult')
  operation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'first' | 'last'; // Aggregation operation
  windowSize?: number; // Number of values to aggregate (default: 10)
  windowType?: 'count' | 'time'; // Window type (default: 'count')
  timeWindowMs?: number; // Time window in ms (if windowType=time)
}

/**
 * Aggregate Node
 * 
 * Performs aggregation over a sliding window of values.
 * Maintains state in memory per asset/key combination.
 * 
 * Operations:
 * - sum: Sum of all values
 * - avg: Average of all values
 * - min: Minimum value
 * - max: Maximum value
 * - count: Count of values
 * - first: First value in window
 * - last: Last value in window
 * 
 * Config:
 * - inputKey: Key to get value (required)
 * - outputKey: Where to store result (default: 'aggregateResult')
 * - operation: Aggregation operation (required)
 * - windowSize: Number of values (default: 10)
 * - windowType: 'count' or 'time' (default: 'count')
 * - timeWindowMs: Time window in ms (if windowType=time)
 */
export class AggregateNode extends RuleNode {
  private windows = new Map<string, Array<{ value: number; timestamp: number }>>();

  constructor(config: AggregateConfig) {
    super('aggregate', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as AggregateConfig;
    const outputKey = config.outputKey || 'aggregateResult';
    const windowSize = config.windowSize || 10;
    const windowType = config.windowType || 'count';

    const value = this.getNestedValue(message.data, config.inputKey);
    if (typeof value !== 'number') {
      this.log(context, 'warn', `Value at ${config.inputKey} is not a number: ${value}`);
      return null;
    }

    // Create unique key for this asset/metric combination
    const assetId = message.data.assetId || message.data.thingId || 'unknown';
    const stateKey = `${assetId}:${config.inputKey}`;

    // Get or create window
    let window = this.windows.get(stateKey);
    if (!window) {
      window = [];
      this.windows.set(stateKey, window);
    }

    // Add new value
    const timestamp = Date.parse(message.timestamp);
    window.push({ value, timestamp });

    // Trim window based on type
    if (windowType === 'count') {
      if (window.length > windowSize) {
        window.shift();
      }
    } else if (windowType === 'time' && config.timeWindowMs) {
      const cutoffTime = timestamp - config.timeWindowMs;
      while (window.length > 0 && window[0].timestamp < cutoffTime) {
        window.shift();
      }
    }

    // Calculate aggregate
    let result: number;
    const values = window.map(w => w.value);

    switch (config.operation) {
      case 'sum':
        result = values.reduce((acc, v) => acc + v, 0);
        break;
      case 'avg':
        result = values.reduce((acc, v) => acc + v, 0) / values.length;
        break;
      case 'min':
        result = Math.min(...values);
        break;
      case 'max':
        result = Math.max(...values);
        break;
      case 'count':
        result = values.length;
        break;
      case 'first':
        result = values[0];
        break;
      case 'last':
        result = values[values.length - 1];
        break;
      default:
        this.log(context, 'error', `Unknown operation: ${config.operation}`);
        return null;
    }

    return {
      ...message,
      data: {
        ...message.data,
        [outputKey]: {
          value: result,
          operation: config.operation,
          windowSize: values.length,
          currentValue: value,
        },
      },
    };
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
