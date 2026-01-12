/**
 * Telemetry Mapping Consumer
 * 
 * Consumes telemetry from Data Sources (PLCs, RTUs, sensors) and processes
 * them through the Data Source → Digital Twin mapping pipeline.
 * 
 * Flow:
 * 1. Consume from Kafka topic 'telemetry.raw'
 * 2. Resolve Device Binding + Connectivity Profile + Device Profile
 * 3. Resolve Rule Chain (3-level hierarchy)
 * 4. Execute Rule Chain (data_source_input → ... → save_to_digital_twin)
 * 5. Handle errors and DLQ
 */

import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { MappingResolverService } from '../services/mapping-resolver.service.js';
import { RuleChainResolverService } from '../services/rule-chain-resolver.service.js';
import { RuleEngineExecutorService } from '../services/rule-engine-executor.service.js';
import { CONFIG } from '../config/index.js';

// Telemetry message schema from Data Sources
const DataSourceTelemetrySchema = z.object({
  dataSourceId: z.string().uuid(),
  gatewayId: z.string(),
  tenantId: z.string().uuid(),
  timestamp: z.string().datetime(),
  data: z.record(z.union([z.number(), z.string(), z.boolean()])),
  metadata: z.record(z.any()).optional(),
});

export type DataSourceTelemetry = z.infer<typeof DataSourceTelemetrySchema>;

export interface TelemetryMappingConsumerConfig {
  kafkaBrokers: string[];
  groupId: string;
  topic: string;
  mappingResolverService?: MappingResolverService;
  ruleChainResolverService?: RuleChainResolverService;
  ruleEngineExecutorService?: RuleEngineExecutorService;
}

/**
 * Telemetry Mapping Consumer
 * 
 * Orchestrates the complete flow from Data Source telemetry to Digital Twin updates
 */
export class TelemetryMappingConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private config: TelemetryMappingConsumerConfig;
  private isRunning = false;
  
  private mappingResolverService: MappingResolverService;
  private ruleChainResolverService: RuleChainResolverService;
  private ruleEngineExecutorService: RuleEngineExecutorService;

  constructor(config: TelemetryMappingConsumerConfig) {
    this.config = config;
    
    this.kafka = new Kafka({
      clientId: 'worker-telemetry-mapping-consumer',
      brokers: config.kafkaBrokers,
    });
    
    this.consumer = this.kafka.consumer({ 
      groupId: config.groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });
    
    // Initialize services
    this.mappingResolverService = config.mappingResolverService || new MappingResolverService();
    this.ruleChainResolverService = config.ruleChainResolverService || new RuleChainResolverService();
    this.ruleEngineExecutorService = config.ruleEngineExecutorService || new RuleEngineExecutorService();
  }

  /**
   * Start consumer
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('TelemetryMappingConsumer already running');
      return;
    }

    logger.info('Starting TelemetryMappingConsumer...', {
      topic: this.config.topic,
      groupId: this.config.groupId,
      brokers: this.config.kafkaBrokers,
    });

    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: this.config.topic,
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: this.handleMessage.bind(this),
      autoCommit: true,
      autoCommitInterval: 5000,
      autoCommitThreshold: 100,
    });

    this.isRunning = true;
    logger.info('TelemetryMappingConsumer started successfully');
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;
    const startTime = Date.now();

    try {
      if (!message.value) {
        logger.warn('Received empty message', { topic, partition });
        return;
      }

      const rawData = message.value.toString();
      const data = JSON.parse(rawData);

      // Validate message
      const telemetry = DataSourceTelemetrySchema.parse(data);

      logger.debug('Processing data source telemetry', {
        topic,
        dataSourceId: telemetry.dataSourceId,
        gatewayId: telemetry.gatewayId,
        dataKeys: Object.keys(telemetry.data),
      });

      // Process telemetry through mapping pipeline
      await this.processTelemetry(telemetry);

      const processingTime = Date.now() - startTime;
      logger.debug('Telemetry processed successfully', {
        dataSourceId: telemetry.dataSourceId,
        processingTimeMs: processingTime,
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      if (error instanceof z.ZodError) {
        logger.error('Invalid telemetry message format', {
          topic,
          partition,
          errors: error.errors,
          processingTimeMs: processingTime,
        });
      } else {
        logger.error('Error processing telemetry message', {
          topic,
          partition,
          error,
          processingTimeMs: processingTime,
        });
      }
      
      // TODO: Send to Dead Letter Queue (DLQ) for failed messages
      // await this.sendToDLQ(message, error);
    }
  }

  /**
   * Process telemetry through the mapping pipeline
   */
  private async processTelemetry(telemetry: DataSourceTelemetry): Promise<void> {
    try {
      // Step 1: Resolve Device Binding + Connectivity Profile + Device Profile
      logger.debug('Resolving mapping', { dataSourceId: telemetry.dataSourceId });
      
      const resolvedMapping = await this.mappingResolverService.resolveMapping(
        telemetry.dataSourceId,
        telemetry.tenantId
      );

      if (!resolvedMapping) {
        logger.warn('No device binding found for data source', {
          dataSourceId: telemetry.dataSourceId,
          tenantId: telemetry.tenantId,
        });
        return;
      }

      logger.debug('Mapping resolved', {
        dataSourceId: telemetry.dataSourceId,
        bindingId: resolvedMapping.binding.id,
        connectivityProfileCode: resolvedMapping.connectivityProfile.code,
        deviceProfileCode: resolvedMapping.deviceProfile.code,
      });

      // Step 2: Resolve Rule Chain (3-level hierarchy)
      logger.debug('Resolving rule chain', { dataSourceId: telemetry.dataSourceId });
      
      const ruleChainResolution = await this.ruleChainResolverService.resolveRuleChain(
        resolvedMapping.binding.customRuleChainId,
        resolvedMapping.connectivityProfile.ruleChainId,
        resolvedMapping.deviceProfile.defaultRuleChainId,
        telemetry.tenantId
      );

      if (!ruleChainResolution) {
        logger.error('No rule chain could be resolved', {
          dataSourceId: telemetry.dataSourceId,
          tenantId: telemetry.tenantId,
        });
        return;
      }

      logger.debug('Rule chain resolved', {
        dataSourceId: telemetry.dataSourceId,
        ruleChainId: ruleChainResolution.ruleChainId,
        ruleChainName: ruleChainResolution.ruleChain.name,
        source: ruleChainResolution.source,
      });

      // Step 3: Execute Rule Chain
      logger.debug('Executing rule chain', {
        dataSourceId: telemetry.dataSourceId,
        ruleChainId: ruleChainResolution.ruleChainId,
      });

      // Prepare message for rule engine
      const ruleEngineMessage = {
        data: telemetry.data,
        metadata: {
          ...telemetry.metadata,
          dataSourceId: telemetry.dataSourceId,
          gatewayId: telemetry.gatewayId,
          tenantId: telemetry.tenantId,
          timestamp: telemetry.timestamp,
          binding: resolvedMapping.binding,
          connectivityProfile: resolvedMapping.connectivityProfile,
          deviceProfile: resolvedMapping.deviceProfile,
          digitalTwinInstance: resolvedMapping.digitalTwinInstance,
          messageType: 'POST_TELEMETRY',
          originatorType: 'DATA_SOURCE',
        },
      };

      // Execute rule chain
      // Convert rule chain to Rule format expected by executor
      const rule = {
        id: ruleChainResolution.ruleChain.id,
        tenantId: ruleChainResolution.ruleChain.tenantId,
        name: ruleChainResolution.ruleChain.name,
        description: `Rule chain for data source mapping`,
        isActive: ruleChainResolution.ruleChain.status === 'ACTIVE',
        triggerType: 'telemetry_change',
        configuration: {
          nodes: ruleChainResolution.ruleChain.nodes,
          connections: ruleChainResolution.ruleChain.connections,
        },
      };

      const executionContext = {
        assetId: telemetry.dataSourceId,
        tenantId: telemetry.tenantId,
        triggerType: 'telemetry_change' as const,
        data: ruleEngineMessage,
        timestamp: telemetry.timestamp,
      };

      await this.ruleEngineExecutorService.executeRule(rule, executionContext);

      logger.info('Telemetry processed through rule chain', {
        dataSourceId: telemetry.dataSourceId,
        ruleChainName: ruleChainResolution.ruleChain.name,
        ruleChainSource: ruleChainResolution.source,
      });

    } catch (error) {
      logger.error('Error in telemetry processing pipeline', {
        error,
        dataSourceId: telemetry.dataSourceId,
        tenantId: telemetry.tenantId,
      });
      throw error;
    }
  }

  /**
   * Stop consumer
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping TelemetryMappingConsumer...');
    
    try {
      await this.consumer.disconnect();
      await this.mappingResolverService.close();
      await this.ruleChainResolverService.close();
      
      this.isRunning = false;
      logger.info('TelemetryMappingConsumer stopped successfully');
    } catch (error) {
      logger.error('Error stopping TelemetryMappingConsumer', { error });
      throw error;
    }
  }

  /**
   * Get consumer status
   */
  getStatus(): { isRunning: boolean; topic: string; groupId: string } {
    return {
      isRunning: this.isRunning,
      topic: this.config.topic,
      groupId: this.config.groupId,
    };
  }
}
