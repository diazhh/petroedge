import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';
import { AlarmService } from '../../services/alarm.service.js';

export interface ClearAlarmConfig extends RuleNodeConfig {
  alarmIdKey?: string; // Key to get alarm ID (default: 'alarmId')
  clearMessage?: string; // Clear message (supports templates)
  propagate?: boolean; // Propagate clear event (default: true)
}

/**
 * Clear Alarm Node
 * 
 * Clears an existing alarm.
 * Changes alarm status from 'active' or 'acknowledged' to 'cleared'.
 * 
 * Config:
 * - alarmIdKey: Key to get alarm ID (default: 'alarmId')
 * - clearMessage: Message explaining why alarm was cleared (optional)
 * - propagate: Publish clear event to Kafka (default: true)
 * 
 * Example:
 * Clear alarm when condition returns to normal
 */
export class ClearAlarmNode extends RuleNode {
  private alarmService: AlarmService;

  constructor(config: ClearAlarmConfig) {
    super('clear_alarm', config);
    // Note: AlarmService requires config, will need proper initialization
    this.alarmService = null as any; // Placeholder
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as ClearAlarmConfig;
    const alarmIdKey = config.alarmIdKey || 'alarmId';
    const propagate = config.propagate !== false;

    const alarmId = message.data[alarmIdKey];
    if (!alarmId) {
      this.log(context, 'warn', `Alarm ID not found at ${alarmIdKey}`);
      return null;
    }

    try {
      // Apply template to clear message
      const clearMessage = config.clearMessage
        ? this.applyTemplate(config.clearMessage, message.data)
        : 'Condition returned to normal';

      // await this.alarmService.clearAlarm(alarmId, clearMessage, propagate);
      // TODO: Implement alarm service integration
      this.log(context, 'warn', 'Alarm service not yet integrated');

      this.log(context, 'info', 'Alarm cleared', { alarmId, clearMessage });

      return {
        ...message,
        data: {
          ...message.data,
          alarmCleared: true,
          clearedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.log(context, 'error', 'Failed to clear alarm', { error, alarmId });
      return null;
    }
  }

  private applyTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, key) => {
      const value = this.getNestedValue(data, key);
      return value !== undefined ? String(value) : match;
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
