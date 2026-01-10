import { kafkaService } from '../../../common/kafka/kafka.service.js';
import { telemetryService } from './telemetry.service.js';
import { logger } from '../../../common/utils/logger.js';
import type { EachMessagePayload } from 'kafkajs';
import { z } from 'zod';

// Schema for telemetry message from Kafka
const kafkaTelemetryMessageSchema = z.object({
  tenantId: z.string().uuid(),
  assetId: z.string().uuid(),
  telemetryKey: z.string().min(1).max(100),
  valueNumeric: z.number().optional(),
  valueText: z.string().optional(),
  valueBoolean: z.boolean().optional(),
  quality: z.enum(['GOOD', 'BAD', 'UNCERTAIN', 'SIMULATED']).optional().default('GOOD'),
  source: z.enum(['SENSOR', 'MANUAL', 'CALCULATED', 'IMPORTED', 'EDGE']).optional().default('SENSOR'),
  sourceId: z.string().max(100).optional(),
  unit: z.string().max(30).optional(),
  time: z.string().datetime().optional(),
});

const kafkaTelemetryBatchSchema = z.object({
  tenantId: z.string().uuid(),
  points: z.array(
    z.object({
      assetId: z.string().uuid(),
      telemetryKey: z.string().min(1).max(100),
      valueNumeric: z.number().optional(),
      valueText: z.string().optional(),
      valueBoolean: z.boolean().optional(),
      quality: z.enum(['GOOD', 'BAD', 'UNCERTAIN', 'SIMULATED']).optional(),
      source: z.enum(['SENSOR', 'MANUAL', 'CALCULATED', 'IMPORTED', 'EDGE']).optional(),
      sourceId: z.string().max(100).optional(),
      unit: z.string().max(30).optional(),
      time: z.string().datetime().optional(),
    })
  ),
});

export class TelemetryConsumerService {
  private isRunning = false;
  private readonly CONSUMER_GROUP_ID = 'telemetry-ingest-group';
  private readonly TOPICS = ['scada.telemetry.raw', 'scada.telemetry.validated'];

  /**
   * Start the Kafka consumer for telemetry ingestion
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Telemetry consumer is already running');
      return;
    }

    try {
      logger.info('Starting telemetry Kafka consumer...');

      const consumer = await kafkaService.initConsumer(this.CONSUMER_GROUP_ID, this.TOPICS);

      await consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      this.isRunning = true;
      logger.info('Telemetry Kafka consumer started successfully', { topics: this.TOPICS });
    } catch (error) {
      logger.error('Failed to start telemetry Kafka consumer', error);
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
        logger.info('Telemetry Kafka consumer stopped');
      }
    } catch (error) {
      logger.error('Error stopping telemetry Kafka consumer', error);
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

      // Determine if it's a single point or batch
      if (parsedMessage.points && Array.isArray(parsedMessage.points)) {
        await this.handleBatchMessage(parsedMessage, topic, partition);
      } else {
        await this.handleSingleMessage(parsedMessage, topic, partition);
      }
    } catch (error: any) {
      logger.error('Error processing telemetry message', {
        error: error.message,
        topic,
        partition,
        offset: message.offset,
      });
      // Don't throw - we don't want to stop the consumer on individual message errors
    }
  }

  /**
   * Handle single telemetry point message
   */
  private async handleSingleMessage(message: any, topic: string, partition: number): Promise<void> {
    try {
      const validated = kafkaTelemetryMessageSchema.parse(message);

      await telemetryService.ingestTelemetry(validated.tenantId, {
        assetId: validated.assetId,
        telemetryKey: validated.telemetryKey,
        valueNumeric: validated.valueNumeric,
        valueText: validated.valueText,
        valueBoolean: validated.valueBoolean,
        quality: validated.quality,
        source: validated.source,
        sourceId: validated.sourceId,
        unit: validated.unit,
        time: validated.time,
      });

      logger.debug('Telemetry point ingested from Kafka', {
        topic,
        partition,
        assetId: validated.assetId,
        telemetryKey: validated.telemetryKey,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        logger.error('Invalid telemetry message format', {
          error: error.errors,
          topic,
          partition,
        });
      } else {
        logger.error('Error ingesting single telemetry point', {
          error: error.message,
          topic,
          partition,
        });
      }
    }
  }

  /**
   * Handle batch telemetry message
   */
  private async handleBatchMessage(message: any, topic: string, partition: number): Promise<void> {
    try {
      const validated = kafkaTelemetryBatchSchema.parse(message);

      const result = await telemetryService.batchIngestTelemetry(validated.tenantId, {
        points: validated.points.map(p => ({
          ...p,
          quality: p.quality || 'GOOD',
          source: p.source || 'SENSOR',
        })),
      });

      logger.debug('Telemetry batch ingested from Kafka', {
        topic,
        partition,
        ingested: result.ingested,
        errors: result.errors.length,
      });

      if (result.errors.length > 0) {
        logger.warn('Some telemetry points failed to ingest', {
          topic,
          partition,
          errors: result.errors,
        });
      }
    } catch (error: any) {
      if (error.name === 'ZodError') {
        logger.error('Invalid batch telemetry message format', {
          error: error.errors,
          topic,
          partition,
        });
      } else {
        logger.error('Error ingesting batch telemetry', {
          error: error.message,
          topic,
          partition,
        });
      }
    }
  }

  /**
   * Check if consumer is running
   */
  isConsumerRunning(): boolean {
    return this.isRunning;
  }
}

// Singleton instance
export const telemetryConsumerService = new TelemetryConsumerService();
