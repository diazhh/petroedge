import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';

export interface DelayConfig extends RuleNodeConfig {
  delayMs?: number; // Fixed delay in milliseconds
  delayFromMessage?: string; // Key to get delay from message
  maxDelayMs?: number; // Maximum allowed delay (default: 60000)
}

/**
 * Delay Node
 * 
 * Delays message processing by specified time.
 * Useful for:
 * - Rate limiting
 * - Debouncing
 * - Scheduled actions
 * - Testing
 * 
 * Config:
 * - delayMs: Fixed delay in ms (optional)
 * - delayFromMessage: Key to get delay from message (optional)
 * - maxDelayMs: Maximum delay allowed (default: 60000ms = 1min)
 * 
 * Note: Uses setTimeout, so delays are approximate.
 * For precise scheduling, use a dedicated scheduler.
 */
export class DelayNode extends RuleNode {
  constructor(config: DelayConfig) {
    super('delay', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as DelayConfig;
    const maxDelayMs = config.maxDelayMs || 60000;

    let delayMs: number;

    if (config.delayFromMessage) {
      const delayValue = this.getNestedValue(message.data, config.delayFromMessage);
      if (typeof delayValue !== 'number') {
        this.log(context, 'warn', `Delay value not a number: ${delayValue}`);
        return null;
      }
      delayMs = delayValue;
    } else if (config.delayMs !== undefined) {
      delayMs = config.delayMs;
    } else {
      this.log(context, 'error', 'No delay configured');
      return null;
    }

    // Enforce max delay
    if (delayMs > maxDelayMs) {
      this.log(context, 'warn', `Delay ${delayMs}ms exceeds max ${maxDelayMs}ms, capping`);
      delayMs = maxDelayMs;
    }

    if (delayMs < 0) {
      this.log(context, 'warn', 'Negative delay not allowed');
      return null;
    }

    this.log(context, 'info', `Delaying message by ${delayMs}ms`);

    // Wait for specified time
    await new Promise(resolve => setTimeout(resolve, delayMs));

    return message;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
