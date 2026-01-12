import { RuleNode, RuleNodeConfig, RuleNodeMessage, RuleNodeContext } from '../node-registry.js';

/**
 * Data Source Input Node
 * 
 * Entry point for telemetry from Edge Gateway data sources.
 * Automatically enriches message with dataSourceId and gatewayId.
 * 
 * Input: Raw telemetry from Kafka topic 'telemetry.raw'
 * Output: Enriched message with metadata
 */

export interface DataSourceInputNodeConfig extends RuleNodeConfig {
  topic: string; // 'telemetry.raw'
}

export class DataSourceInputNode extends RuleNode {
  constructor(config: DataSourceInputNodeConfig) {
    super('data_source_input', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage> {
    const config = this.config as DataSourceInputNodeConfig;

    // Enrich message with data source metadata
    const enrichedMessage: RuleNodeMessage = {
      ...message,
      metadata: {
        ...message.metadata,
        dataSourceId: message.metadata?.dataSourceId || message.data.dataSourceId,
        gatewayId: message.metadata?.gatewayId || message.data.gatewayId,
        messageType: 'POST_TELEMETRY',
        source: 'data_source',
      },
    };

    this.log(context, 'info', 'Data source input received', {
      topic: config.topic,
      dataSourceId: enrichedMessage.metadata.dataSourceId,
      gatewayId: enrichedMessage.metadata.gatewayId,
      telemetryKeys: Object.keys(message.data).length,
    });

    return enrichedMessage;
  }
}
