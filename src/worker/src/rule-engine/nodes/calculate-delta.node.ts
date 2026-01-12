import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';

export interface CalculateDeltaConfig extends RuleNodeConfig {
  inputKey: string; // Key to get current value
  outputKey?: string; // Key to store delta (default: 'delta')
  deltaType?: 'absolute' | 'percentage' | 'both'; // Type of delta (default: 'absolute')
  storeHistory?: boolean; // Store previous value in message (default: false)
}

/**
 * Calculate Delta Node
 * 
 * Calculates the difference between current and previous values.
 * Maintains state in memory per asset/key combination.
 * 
 * Delta types:
 * - absolute: current - previous
 * - percentage: ((current - previous) / previous) * 100
 * - both: { absolute, percentage }
 * 
 * Config:
 * - inputKey: Key to get current value (required)
 * - outputKey: Where to store delta (default: 'delta')
 * - deltaType: Type of delta calculation (default: 'absolute')
 * - storeHistory: Include previous value in output (default: false)
 */
export class CalculateDeltaNode extends RuleNode {
  private previousValues = new Map<string, number>();

  constructor(config: CalculateDeltaConfig) {
    super('calculate_delta', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as CalculateDeltaConfig;
    const outputKey = config.outputKey || 'delta';
    const deltaType = config.deltaType || 'absolute';
    const storeHistory = config.storeHistory === true;

    const currentValue = this.getNestedValue(message.data, config.inputKey);
    if (typeof currentValue !== 'number') {
      this.log(context, 'warn', `Value at ${config.inputKey} is not a number: ${currentValue}`);
      return null;
    }

    // Create unique key for this asset/metric combination
    const assetId = message.data.assetId || message.data.thingId || 'unknown';
    const stateKey = `${assetId}:${config.inputKey}`;

    const previousValue = this.previousValues.get(stateKey);

    // Store current value for next execution
    this.previousValues.set(stateKey, currentValue);

    // If no previous value, can't calculate delta
    if (previousValue === undefined) {
      this.log(context, 'info', `No previous value for ${stateKey}, storing current value`);
      return message; // Pass through without delta
    }

    // Calculate delta
    let deltaResult: any;
    const absoluteDelta = currentValue - previousValue;

    if (deltaType === 'absolute') {
      deltaResult = absoluteDelta;
    } else if (deltaType === 'percentage') {
      if (previousValue === 0) {
        deltaResult = previousValue === currentValue ? 0 : Infinity;
      } else {
        deltaResult = (absoluteDelta / previousValue) * 100;
      }
    } else if (deltaType === 'both') {
      const percentageDelta = previousValue === 0
        ? (previousValue === currentValue ? 0 : Infinity)
        : (absoluteDelta / previousValue) * 100;

      deltaResult = {
        absolute: absoluteDelta,
        percentage: percentageDelta,
      };
    }

    // Build output
    const output: any = {
      current: currentValue,
      delta: deltaResult,
    };

    if (storeHistory) {
      output.previous = previousValue;
    }

    return {
      ...message,
      data: {
        ...message.data,
        [outputKey]: output,
      },
    };
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
