import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';

export interface AlarmStatusFilterConfig extends RuleNodeConfig {
  allowedStatuses: string[]; // Allowed alarm statuses (required)
  statusKey?: string; // Key to get alarm status (default: 'alarmStatus')
}

/**
 * Alarm Status Filter Node
 * 
 * Filters messages based on alarm status.
 * Only allows messages with specified alarm statuses.
 * 
 * Config:
 * - allowedStatuses: Array of allowed statuses (required)
 * - statusKey: Key to get status from message (default: 'alarmStatus')
 * 
 * Common alarm statuses:
 * - 'active': Alarm is currently active
 * - 'acknowledged': Alarm has been acknowledged
 * - 'cleared': Alarm has been cleared
 * - 'unacknowledged': Alarm not yet acknowledged
 * 
 * Example:
 * Filter to only process active alarms
 */
export class AlarmStatusFilterNode extends RuleNode {
  constructor(config: AlarmStatusFilterConfig) {
    super('alarm_status_filter', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as AlarmStatusFilterConfig;
    const statusKey = config.statusKey || 'alarmStatus';

    if (!config.allowedStatuses || !Array.isArray(config.allowedStatuses) || config.allowedStatuses.length === 0) {
      this.log(context, 'error', 'No alarm statuses configured');
      return null;
    }

    const alarmStatus = message.data[statusKey] || message.metadata?.alarmStatus;
    
    if (!alarmStatus) {
      this.log(context, 'warn', `Alarm status not found at ${statusKey}`);
      return null;
    }

    const isAllowed = config.allowedStatuses.includes(alarmStatus);

    if (!isAllowed) {
      this.log(context, 'info', `Alarm status ${alarmStatus} not in allowed list`, {
        alarmStatus,
        allowedStatuses: config.allowedStatuses,
      });
      return null;
    }

    return message;
  }
}
