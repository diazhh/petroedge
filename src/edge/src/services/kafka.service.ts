import { Kafka, Producer, logLevel } from 'kafkajs';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class KafkaService {
  private kafka: Kafka;
  private producer: Producer | null = null;

  constructor() {
    this.kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
      logLevel: logLevel.ERROR,
      retry: {
        initialRetryTime: 300,
        retries: 8,
      },
    });
  }

  /**
   * Initialize Kafka producer
   */
  async initProducer(): Promise<void> {
    try {
      this.producer = this.kafka.producer({
        allowAutoTopicCreation: false,
        transactionTimeout: 30000,
      });

      await this.producer.connect();
      logger.info('Kafka producer connected successfully');
    } catch (error) {
      logger.error('Failed to connect Kafka producer', error);
      throw error;
    }
  }

  /**
   * Publish telemetry data to Kafka
   */
  async publishTelemetry(data: any): Promise<void> {
    if (!this.producer) {
      throw new Error('Kafka producer not initialized');
    }

    try {
      await this.producer.send({
        topic: 'scada.telemetry.raw',
        messages: [
          {
            key: data.assetId || null,
            value: JSON.stringify({
              ...data,
              gatewayId: config.gateway.id,
              gatewayName: config.gateway.name,
              siteName: config.gateway.siteName,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });

      logger.debug('Telemetry published to Kafka', { assetId: data.assetId });
    } catch (error) {
      logger.error('Failed to publish telemetry to Kafka', error);
      throw error;
    }
  }

  /**
   * Publish batch of telemetry data
   */
  async publishTelemetryBatch(dataArray: any[]): Promise<void> {
    if (!this.producer) {
      throw new Error('Kafka producer not initialized');
    }

    try {
      const messages = dataArray.map((data) => ({
        key: data.assetId || null,
        value: JSON.stringify({
          ...data,
          gatewayId: config.gateway.id,
          gatewayName: config.gateway.name,
          siteName: config.gateway.siteName,
          timestamp: new Date().toISOString(),
        }),
      }));

      await this.producer.send({
        topic: 'scada.telemetry.raw',
        messages,
      });

      logger.debug(`Batch of ${dataArray.length} telemetry records published to Kafka`);
    } catch (error) {
      logger.error('Failed to publish telemetry batch to Kafka', error);
      throw error;
    }
  }

  /**
   * Publish generic message to Kafka topic
   */
  async publish(topic: string, data: any, key?: string): Promise<void> {
    if (!this.producer) {
      throw new Error('Kafka producer not initialized');
    }

    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: key || null,
            value: JSON.stringify(data),
          },
        ],
      });

      logger.debug(`Message published to Kafka topic: ${topic}`, { key });
    } catch (error) {
      logger.error(`Failed to publish message to Kafka topic: ${topic}`, error);
      throw error;
    }
  }

  /**
   * Disconnect Kafka producer
   */
  async disconnect(): Promise<void> {
    try {
      if (this.producer) {
        await this.producer.disconnect();
        logger.info('Kafka producer disconnected');
      }
    } catch (error) {
      logger.error('Error disconnecting Kafka producer', error);
      throw error;
    }
  }
}

// Singleton instance
export const kafkaService = new KafkaService();
