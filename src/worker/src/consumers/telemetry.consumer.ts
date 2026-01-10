import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { TimeSeriesService } from '../services/timeseries.service.js';
import { RedisCacheService } from '../services/redis-cache.service.js';

// Telemetry message schema
const TelemetryMessageSchema = z.object({
  assetId: z.string().uuid(),
  tenantId: z.string().uuid(),
  timestamp: z.string().datetime(),
  tags: z.record(z.object({
    value: z.union([z.number(), z.string(), z.boolean()]),
    quality: z.enum(['good', 'bad', 'uncertain']).optional(),
    unit: z.string().optional(),
  })),
  source: z.string().optional(),
});

export type TelemetryMessage = z.infer<typeof TelemetryMessageSchema>;

export interface TelemetryConsumerConfig {
  kafkaBroker: string;
  groupId: string;
  topics: string[];
  timeSeriesService?: TimeSeriesService;
  redisCacheService?: RedisCacheService;
}

/**
 * Telemetry Consumer
 * 
 * Consume mensajes de telemetría desde Kafka y:
 * 1. Persiste en TimescaleDB
 * 2. Actualiza cache en Redis
 * 3. Dispara Rule Engine si hay reglas aplicables
 */
export class TelemetryConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private config: TelemetryConsumerConfig;
  private isRunning = false;
  private timeSeriesService: TimeSeriesService;
  private redisCacheService: RedisCacheService;

  constructor(config: TelemetryConsumerConfig) {
    this.config = config;
    this.kafka = new Kafka({
      clientId: 'worker-telemetry-consumer',
      brokers: [config.kafkaBroker],
    });
    this.consumer = this.kafka.consumer({ groupId: config.groupId });
    this.timeSeriesService = config.timeSeriesService || new TimeSeriesService();
    this.redisCacheService = config.redisCacheService || new RedisCacheService();
  }

  /**
   * Iniciar consumer
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Telemetry consumer already running');
      return;
    }

    logger.info('Starting telemetry consumer...', {
      topics: this.config.topics,
      groupId: this.config.groupId,
    });

    await this.consumer.connect();
    await this.consumer.subscribe({
      topics: this.config.topics,
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: this.handleMessage.bind(this),
    });

    this.isRunning = true;
    logger.info('Telemetry consumer started');
  }

  /**
   * Procesar mensaje
   */
  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    try {
      if (!message.value) {
        logger.warn('Received empty message', { topic, partition });
        return;
      }

      const rawData = message.value.toString();
      const data = JSON.parse(rawData);

      // Validar mensaje
      const telemetry = TelemetryMessageSchema.parse(data);

      logger.debug('Processing telemetry message', {
        topic,
        assetId: telemetry.assetId,
        tagCount: Object.keys(telemetry.tags).length,
      });

      // Procesar telemetría
      await this.processTelemetry(telemetry);

    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Invalid telemetry message format', {
          topic,
          errors: error.errors,
        });
      } else {
        logger.error('Error processing telemetry message', {
          topic,
          error,
        });
      }
    }
  }

  /**
   * Procesar telemetría
   */
  private async processTelemetry(telemetry: TelemetryMessage): Promise<void> {
    try {
      // 1. Persistir en TimescaleDB
      await this.timeSeriesService.saveTelemetry({
        assetId: telemetry.assetId,
        tenantId: telemetry.tenantId,
        timestamp: new Date(telemetry.timestamp),
        tags: telemetry.tags,
        source: telemetry.source,
      });

      // 2. Actualizar cache en Redis
      await this.redisCacheService.cacheTelemetry({
        assetId: telemetry.assetId,
        tenantId: telemetry.tenantId,
        timestamp: telemetry.timestamp,
        tags: telemetry.tags,
      });

      logger.debug('Telemetry processed', {
        assetId: telemetry.assetId,
        timestamp: telemetry.timestamp,
        tagCount: Object.keys(telemetry.tags).length,
      });
    } catch (error) {
      logger.error('Error processing telemetry', {
        error,
        assetId: telemetry.assetId,
      });
      throw error;
    }
  }

  /**
   * Detener consumer
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping telemetry consumer...');
    await this.consumer.disconnect();
    this.isRunning = false;
    logger.info('Telemetry consumer stopped');
  }
}
