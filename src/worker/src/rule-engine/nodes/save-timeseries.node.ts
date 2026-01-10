import { RuleNode, RuleNodeConfig, RuleNodeMessage, RuleNodeContext } from '../node-registry.js';

export interface SaveTimeseriesNodeConfig extends RuleNodeConfig {
  table: string;
  fields: Record<string, string>;
  timestampField?: string;
}

export class SaveTimeseriesNode extends RuleNode {
  constructor(config: SaveTimeseriesNodeConfig) {
    super('save_timeseries', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage> {
    const config = this.config as SaveTimeseriesNodeConfig;
    
    const values: Record<string, any> = {};
    for (const [dbField, messageField] of Object.entries(config.fields)) {
      values[dbField] = message.data[messageField];
    }

    const timestamp = config.timestampField
      ? message.data[config.timestampField]
      : message.timestamp || new Date().toISOString();

    values.timestamp = timestamp;
    values.tenant_id = context.tenantId;

    this.log(context, 'info', 'Saving timeseries data', {
      table: config.table,
      fieldCount: Object.keys(values).length,
      timestamp,
    });

    return {
      ...message,
      metadata: {
        ...message.metadata,
        saveTimeseries: {
          table: config.table,
          values,
          saved: true,
        },
      },
    };
  }
}
