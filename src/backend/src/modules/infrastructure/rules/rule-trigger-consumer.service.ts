import { kafkaService } from '../../../common/kafka/kafka.service.js';
import { ruleEngineService } from './rule-engine.service.js';
import { logger } from '../../../common/utils/logger.js';
import type { EachMessagePayload } from 'kafkajs';
import { z } from 'zod';

// Schema for telemetry change event
const telemetryChangeEventSchema = z.object({
  tenantId: z.string().uuid(),
  assetId: z.string().uuid(),
  assetTypeId: z.string().uuid(),
  telemetryKey: z.string(),
  value: z.any(),
  timestamp: z.string().datetime(),
});

// Schema for attribute change event
const attributeChangeEventSchema = z.object({
  tenantId: z.string().uuid(),
  assetId: z.string().uuid(),
  assetTypeId: z.string().uuid(),
  attributeKey: z.string(),
  oldValue: z.any(),
  newValue: z.any(),
  timestamp: z.string().datetime(),
});

export class RuleTriggerConsumerService {
  private isRunning = false;
  private readonly CONSUMER_GROUP_ID = 'rule-trigger-engine-group';
  private readonly TOPICS = [
    'scada.telemetry.validated',
    'assets.attributes.changed',
    'assets.status.changed',
  ];

  /**
   * Start the Kafka consumer for rule triggers
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Rule trigger consumer is already running');
      return;
    }

    try {
      logger.info('Starting rule trigger Kafka consumer...');

      const consumer = await kafkaService.initConsumer(this.CONSUMER_GROUP_ID, this.TOPICS);

      await consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      this.isRunning = true;
      logger.info('Rule trigger Kafka consumer started successfully', { topics: this.TOPICS });
    } catch (error) {
      logger.error('Failed to start rule trigger Kafka consumer', error);
      throw error;
    }
  }

  /**
   * Stop the Kafka consumer
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      const consumer = kafkaService.getConsumer(this.CONSUMER_GROUP_ID);
      if (consumer) {
        await consumer.disconnect();
        this.isRunning = false;
        logger.info('Rule trigger Kafka consumer stopped');
      }
    } catch (error) {
      logger.error('Error stopping rule trigger Kafka consumer', error);
      throw error;
    }
  }

  /**
   * Handle incoming Kafka message
   */
  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    try {
      if (!message.value) {
        logger.warn('Received empty message', { topic, partition });
        return;
      }

      const rawMessage = message.value.toString();
      const parsedMessage = JSON.parse(rawMessage);

      if (topic === 'scada.telemetry.validated') {
        await this.handleTelemetryChange(parsedMessage);
      } else if (topic === 'assets.attributes.changed') {
        await this.handleAttributeChange(parsedMessage);
      } else if (topic === 'assets.status.changed') {
        await this.handleStatusChange(parsedMessage);
      }
    } catch (error: any) {
      logger.error('Error processing rule trigger message', {
        error: error.message,
        topic,
        partition,
        offset: message.offset,
      });
    }
  }

  /**
   * Handle telemetry change event
   */
  private async handleTelemetryChange(message: any): Promise<void> {
    try {
      const event = telemetryChangeEventSchema.parse(message);

      // Find applicable rules
      const applicableRules = await ruleEngineService.findApplicableRules(
        event.tenantId,
        event.assetTypeId
      );

      if (applicableRules.length === 0) {
        return;
      }

      // Execute each applicable rule
      for (const rule of applicableRules) {
        try {
          // Check if rule has telemetry_change trigger
          const nodes = rule.nodes as any[];
          const hasTelemetryTrigger = nodes.some(
            (n: any) => n.type === 'telemetry_change' && 
            (!n.config.telemetryKey || n.config.telemetryKey === event.telemetryKey)
          );

          if (!hasTelemetryTrigger) {
            continue;
          }

          // Execute rule
          await ruleEngineService.executeRule(
            rule.id,
            event.assetId,
            event.tenantId,
            'telemetry_change',
            {
              telemetryKey: event.telemetryKey,
              value: event.value,
              timestamp: event.timestamp,
            }
          );

          logger.debug('Rule executed on telemetry change', {
            ruleId: rule.id,
            assetId: event.assetId,
            telemetryKey: event.telemetryKey,
          });
        } catch (error: any) {
          logger.error('Error executing rule on telemetry change', {
            ruleId: rule.id,
            assetId: event.assetId,
            error: error.message,
          });
        }
      }
    } catch (error: any) {
      logger.error('Error handling telemetry change for rules', {
        error: error.message,
        message,
      });
    }
  }

  /**
   * Handle attribute change event
   */
  private async handleAttributeChange(message: any): Promise<void> {
    try {
      const event = attributeChangeEventSchema.parse(message);

      // Find applicable rules
      const applicableRules = await ruleEngineService.findApplicableRules(
        event.tenantId,
        event.assetTypeId
      );

      if (applicableRules.length === 0) {
        return;
      }

      // Execute each applicable rule
      for (const rule of applicableRules) {
        try {
          // Check if rule has attribute_change trigger
          const nodes = rule.nodes as any[];
          const hasAttributeTrigger = nodes.some(
            (n: any) => n.type === 'attribute_change' &&
            (!n.config.attributeKey || n.config.attributeKey === event.attributeKey)
          );

          if (!hasAttributeTrigger) {
            continue;
          }

          // Execute rule
          await ruleEngineService.executeRule(
            rule.id,
            event.assetId,
            event.tenantId,
            'attribute_change',
            {
              attributeKey: event.attributeKey,
              oldValue: event.oldValue,
              newValue: event.newValue,
              timestamp: event.timestamp,
            }
          );

          logger.debug('Rule executed on attribute change', {
            ruleId: rule.id,
            assetId: event.assetId,
            attributeKey: event.attributeKey,
          });
        } catch (error: any) {
          logger.error('Error executing rule on attribute change', {
            ruleId: rule.id,
            assetId: event.assetId,
            error: error.message,
          });
        }
      }
    } catch (error: any) {
      logger.error('Error handling attribute change for rules', {
        error: error.message,
        message,
      });
    }
  }

  /**
   * Handle status change event
   */
  private async handleStatusChange(message: any): Promise<void> {
    try {
      const { tenantId, assetId, assetTypeId, oldStatus, newStatus } = message;

      // Find applicable rules
      const applicableRules = await ruleEngineService.findApplicableRules(
        tenantId,
        assetTypeId
      );

      if (applicableRules.length === 0) {
        return;
      }

      // Execute each applicable rule
      for (const rule of applicableRules) {
        try {
          // Check if rule has status_change trigger
          const nodes = rule.nodes as any[];
          const hasStatusTrigger = nodes.some((n: any) => n.type === 'status_change');

          if (!hasStatusTrigger) {
            continue;
          }

          // Execute rule
          await ruleEngineService.executeRule(
            rule.id,
            assetId,
            tenantId,
            'status_change',
            {
              oldStatus,
              newStatus,
              timestamp: new Date().toISOString(),
            }
          );

          logger.debug('Rule executed on status change', {
            ruleId: rule.id,
            assetId,
            oldStatus,
            newStatus,
          });
        } catch (error: any) {
          logger.error('Error executing rule on status change', {
            ruleId: rule.id,
            assetId,
            error: error.message,
          });
        }
      }
    } catch (error: any) {
      logger.error('Error handling status change for rules', {
        error: error.message,
        message,
      });
    }
  }
}

export const ruleTriggerConsumerService = new RuleTriggerConsumerService();
