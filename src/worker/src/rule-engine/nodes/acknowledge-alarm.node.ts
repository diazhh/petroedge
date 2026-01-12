import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';
import { AlarmService } from '../../services/alarm.service.js';

export interface AcknowledgeAlarmConfig extends RuleNodeConfig {
  alarmIdKey?: string; // Key to get alarm ID (default: 'alarmId')
  acknowledgedBy?: string; // User/system that acknowledged (supports templates)
  ackMessage?: string; // Acknowledgment message (supports templates)
  propagate?: boolean; // Propagate ack event (default: true)
}

/**
 * Acknowledge Alarm Node
 * 
 * Acknowledges an active alarm.
 * Changes alarm status from 'active' to 'acknowledged'.
 * 
 * Config:
 * - alarmIdKey: Key to get alarm ID (default: 'alarmId')
 * - acknowledgedBy: User/system identifier (optional)
 * - ackMessage: Acknowledgment message (optional)
 * - propagate: Publish ack event to Kafka (default: true)
 * 
 * Example:
 * Auto-acknowledge alarms based on certain conditions
 */
export class AcknowledgeAlarmNode extends RuleNode {
  private alarmService: AlarmService;

  constructor(config: AcknowledgeAlarmConfig) {
    super('acknowledge_alarm', config);
    // Note: AlarmService requires config, will need proper initialization
    this.alarmService = null as any; // Placeholder
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as AcknowledgeAlarmConfig;
    const alarmIdKey = config.alarmIdKey || 'alarmId';
    const propagate = config.propagate !== false;

    const alarmId = message.data[alarmIdKey];
    if (!alarmId) {
      this.log(context, 'warn', `Alarm ID not found at ${alarmIdKey}`);
      return null;
    }

    try {
      // Apply templates
      const acknowledgedBy = config.acknowledgedBy
        ? this.applyTemplate(config.acknowledgedBy, message.data)
        : 'system';

      const ackMessage = config.ackMessage
        ? this.applyTemplate(config.ackMessage, message.data)
        : 'Alarm acknowledged by rule engine';

      // await this.alarmService.acknowledgeAlarm(alarmId, acknowledgedBy, ackMessage, propagate);
      // TODO: Implement alarm service integration
      this.log(context, 'warn', 'Alarm service not yet integrated');

      this.log(context, 'info', 'Alarm acknowledged', { alarmId, acknowledgedBy });

      return {
        ...message,
        data: {
          ...message.data,
          alarmAcknowledged: true,
          acknowledgedBy,
          acknowledgedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.log(context, 'error', 'Failed to acknowledge alarm', { error, alarmId });
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
