import { Kafka, Producer, Consumer, Admin, logLevel } from 'kafkajs';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class KafkaService {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumers: Map<string, Consumer> = new Map();
  private admin: Admin | null = null;

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
        allowAutoTopicCreation: true,
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
   * Initialize Kafka consumer
   */
  async initConsumer(groupId: string, topics: string[]): Promise<Consumer> {
    try {
      const consumer = this.kafka.consumer({
        groupId,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
      });

      await consumer.connect();
      await consumer.subscribe({ topics, fromBeginning: false });

      this.consumers.set(groupId, consumer);
      logger.info(`Kafka consumer connected: ${groupId}`, { topics });

      return consumer;
    } catch (error) {
      logger.error(`Failed to connect Kafka consumer: ${groupId}`, error);
      throw error;
    }
  }

  /**
   * Initialize Kafka admin client
   */
  async initAdmin(): Promise<void> {
    try {
      this.admin = this.kafka.admin();
      await this.admin.connect();
      logger.info('Kafka admin connected successfully');
    } catch (error) {
      logger.error('Failed to connect Kafka admin', error);
      throw error;
    }
  }

  /**
   * Publish message to Kafka topic
   */
  async publish(topic: string, message: any, key?: string): Promise<void> {
    if (!this.producer) {
      throw new Error('Kafka producer not initialized');
    }

    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: key || null,
            value: JSON.stringify(message),
            timestamp: Date.now().toString(),
          },
        ],
      });

      logger.debug(`Message published to topic: ${topic}`, { key });
    } catch (error) {
      logger.error(`Failed to publish message to topic: ${topic}`, error);
      throw error;
    }
  }

  /**
   * Publish batch of messages to Kafka topic
   */
  async publishBatch(topic: string, messages: Array<{ key?: string; value: any }>): Promise<void> {
    if (!this.producer) {
      throw new Error('Kafka producer not initialized');
    }

    try {
      await this.producer.send({
        topic,
        messages: messages.map((msg) => ({
          key: msg.key || null,
          value: JSON.stringify(msg.value),
          timestamp: Date.now().toString(),
        })),
      });

      logger.debug(`Batch of ${messages.length} messages published to topic: ${topic}`);
    } catch (error) {
      logger.error(`Failed to publish batch to topic: ${topic}`, error);
      throw error;
    }
  }

  /**
   * Create Kafka topics
   */
  async createTopics(topics: Array<{ topic: string; numPartitions?: number; replicationFactor?: number }>): Promise<void> {
    if (!this.admin) {
      await this.initAdmin();
    }

    try {
      const created = await this.admin!.createTopics({
        topics: topics.map((t) => ({
          topic: t.topic,
          numPartitions: t.numPartitions || 6,
          replicationFactor: t.replicationFactor || 1,
        })),
      });

      if (created) {
        logger.info('Kafka topics created successfully', { topics: topics.map((t) => t.topic) });
      } else {
        logger.info('Kafka topics already exist', { topics: topics.map((t) => t.topic) });
      }
    } catch (error) {
      logger.error('Failed to create Kafka topics', error);
      throw error;
    }
  }

  /**
   * List all Kafka topics
   */
  async listTopics(): Promise<string[]> {
    if (!this.admin) {
      await this.initAdmin();
    }

    try {
      const topics = await this.admin!.listTopics();
      return topics;
    } catch (error) {
      logger.error('Failed to list Kafka topics', error);
      throw error;
    }
  }

  /**
   * Delete Kafka topics
   */
  async deleteTopics(topics: string[]): Promise<void> {
    if (!this.admin) {
      await this.initAdmin();
    }

    try {
      await this.admin!.deleteTopics({ topics });
      logger.info('Kafka topics deleted successfully', { topics });
    } catch (error) {
      logger.error('Failed to delete Kafka topics', error);
      throw error;
    }
  }

  /**
   * Disconnect all Kafka clients
   */
  async disconnect(): Promise<void> {
    try {
      if (this.producer) {
        await this.producer.disconnect();
        logger.info('Kafka producer disconnected');
      }

      for (const [groupId, consumer] of this.consumers.entries()) {
        await consumer.disconnect();
        logger.info(`Kafka consumer disconnected: ${groupId}`);
      }

      if (this.admin) {
        await this.admin.disconnect();
        logger.info('Kafka admin disconnected');
      }
    } catch (error) {
      logger.error('Error disconnecting Kafka clients', error);
      throw error;
    }
  }

  /**
   * Get producer instance
   */
  getProducer(): Producer {
    if (!this.producer) {
      throw new Error('Kafka producer not initialized');
    }
    return this.producer;
  }

  /**
   * Get consumer instance
   */
  getConsumer(groupId: string): Consumer | undefined {
    return this.consumers.get(groupId);
  }
}

// Singleton instance
export const kafkaService = new KafkaService();
