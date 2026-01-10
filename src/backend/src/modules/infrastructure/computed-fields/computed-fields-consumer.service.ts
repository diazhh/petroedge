import { kafkaService } from '../../../common/kafka/kafka.service.js';
import { computedFieldsService } from './computed-fields.service.js';
import { assetTypesRepository } from '../assets/assets.repository.js';
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

export class ComputedFieldsConsumerService {
  private isRunning = false;
  private readonly CONSUMER_GROUP_ID = 'computed-fields-engine-group';
  private readonly TOPICS = [
    'scada.telemetry.validated',
    'assets.attributes.changed',
  ];

  // Cache of computed field definitions by asset type
  private computedFieldsCache = new Map<string, any[]>();

  /**
   * Start the Kafka consumer for computed fields calculation
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Computed fields consumer is already running');
      return;
    }

    try {
      logger.info('Starting computed fields Kafka consumer...');

      const consumer = await kafkaService.initConsumer(this.CONSUMER_GROUP_ID, this.TOPICS);

      await consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      this.isRunning = true;
      logger.info('Computed fields Kafka consumer started successfully', { topics: this.TOPICS });
    } catch (error) {
      logger.error('Failed to start computed fields Kafka consumer', error);
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
        logger.info('Computed fields Kafka consumer stopped');
      }
    } catch (error) {
      logger.error('Error stopping computed fields Kafka consumer', error);
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
      }
    } catch (error: any) {
      logger.error('Error processing computed fields message', {
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

      // Get computed field definitions for this asset type
      const computedFields = await this.getComputedFieldsForAssetType(
        event.tenantId,
        event.assetTypeId
      );

      if (computedFields.length === 0) {
        return; // No computed fields defined for this asset type
      }

      // Recalculate fields that depend on this telemetry
      await computedFieldsService.recalculateOnChange(
        event.tenantId,
        event.assetId,
        `telemetry.${event.telemetryKey}`,
        computedFields
      );

      logger.debug('Computed fields recalculated on telemetry change', {
        assetId: event.assetId,
        telemetryKey: event.telemetryKey,
      });
    } catch (error: any) {
      logger.error('Error handling telemetry change for computed fields', {
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

      // Get computed field definitions for this asset type
      const computedFields = await this.getComputedFieldsForAssetType(
        event.tenantId,
        event.assetTypeId
      );

      if (computedFields.length === 0) {
        return;
      }

      // Recalculate fields that depend on this attribute
      await computedFieldsService.recalculateOnChange(
        event.tenantId,
        event.assetId,
        `attributes.${event.attributeKey}`,
        computedFields
      );

      logger.debug('Computed fields recalculated on attribute change', {
        assetId: event.assetId,
        attributeKey: event.attributeKey,
      });
    } catch (error: any) {
      logger.error('Error handling attribute change for computed fields', {
        error: error.message,
        message,
      });
    }
  }

  /**
   * Get computed field definitions for an asset type (with caching)
   */
  private async getComputedFieldsForAssetType(
    tenantId: string,
    assetTypeId: string
  ): Promise<any[]> {
    // Check cache first
    const cacheKey = `${tenantId}:${assetTypeId}`;
    if (this.computedFieldsCache.has(cacheKey)) {
      return this.computedFieldsCache.get(cacheKey)!;
    }

    // Fetch from database
    const assetType = await assetTypesRepository.findById(tenantId, assetTypeId);
    if (!assetType) {
      return [];
    }

    // Extract computed fields from asset type schema
    const computedFields = (assetType.computedFields as any[]) || [];

    // Cache for 5 minutes
    this.computedFieldsCache.set(cacheKey, computedFields);
    setTimeout(() => {
      this.computedFieldsCache.delete(cacheKey);
    }, 5 * 60 * 1000);

    return computedFields;
  }

  /**
   * Clear the computed fields cache
   */
  clearCache(): void {
    this.computedFieldsCache.clear();
  }
}

export const computedFieldsConsumerService = new ComputedFieldsConsumerService();
