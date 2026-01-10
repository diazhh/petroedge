import { RuleNode, RuleNodeConfig, RuleNodeMessage, RuleNodeContext } from '../node-registry.js';

export interface CreateAlarmNodeConfig extends RuleNodeConfig {
  severity: 'info' | 'warning' | 'error' | 'critical';
  alarmType: string;
  messageTemplate: string;
  clearPrevious?: boolean;
}

export class CreateAlarmNode extends RuleNode {
  constructor(config: CreateAlarmNodeConfig) {
    super('create_alarm', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage> {
    const config = this.config as CreateAlarmNodeConfig;
    
    const alarmMessage = this.interpolateTemplate(config.messageTemplate, message.data);
    
    const alarm = {
      id: `alarm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: config.alarmType,
      severity: config.severity,
      message: alarmMessage,
      originatorId: message.data.originatorId || message.id,
      tenantId: context.tenantId,
      timestamp: new Date().toISOString(),
      data: message.data,
      cleared: false,
    };

    this.log(context, config.severity === 'critical' ? 'error' : 'warn', 'Alarm created', {
      alarmId: alarm.id,
      alarmType: alarm.type,
      severity: alarm.severity,
      message: alarm.message,
    });

    return {
      ...message,
      type: 'alarm',
      data: {
        ...message.data,
        alarm,
      },
    };
  }

  private interpolateTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\${(\w+)}/g, (_, key) => {
      return data[key] !== undefined ? String(data[key]) : `\${${key}}`;
    });
  }
}
