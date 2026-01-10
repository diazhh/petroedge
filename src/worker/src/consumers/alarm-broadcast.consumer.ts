import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { AlarmSchema, type Alarm } from '../services/alarm.service.js';

export interface AlarmBroadcastConsumerConfig {
  kafkaBroker: string;
  groupId: string;
  topics: string[];
}

/**
 * Alarm Broadcast Consumer
 * 
 * Consume alarmas desde Kafka y las broadcast vía WebSocket:
 * - Alarmas críticas → broadcast inmediato
 * - Alarmas warning/error → broadcast normal
 * - Alarmas info → broadcast opcional
 */
export class AlarmBroadcastConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private config: AlarmBroadcastConsumerConfig;
  private isRunning = false;
  private websocketGateway: any; // WebSocketGatewayService

  constructor(config: AlarmBroadcastConsumerConfig, websocketGateway?: any) {
    this.config = config;
    this.websocketGateway = websocketGateway;
    this.kafka = new Kafka({
      clientId: 'worker-alarm-broadcast-consumer',
      brokers: [config.kafkaBroker],
    });
    this.consumer = this.kafka.consumer({ groupId: config.groupId });
  }

  /**
   * Iniciar consumer
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Alarm broadcast consumer already running');
      return;
    }

    logger.info('Starting alarm broadcast consumer...', {
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
    logger.info('Alarm broadcast consumer started');
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

      // Validar alarma
      const alarm = AlarmSchema.parse(data);

      logger.debug('Processing alarm for broadcast', {
        topic,
        alarmId: alarm.id,
        severity: alarm.severity,
        type: alarm.type,
      });

      // Broadcast alarma
      await this.broadcastAlarm(alarm);

    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Invalid alarm message format', {
          topic,
          errors: error.errors,
        });
      } else {
        logger.error('Error processing alarm message', {
          topic,
          error,
        });
      }
    }
  }

  /**
   * Broadcast alarma vía WebSocket
   */
  private async broadcastAlarm(alarm: Alarm): Promise<void> {
    if (!this.websocketGateway) {
      logger.warn('WebSocket gateway not available for alarm broadcast');
      return;
    }

    try {
      // Broadcast a room del tenant
      this.websocketGateway.broadcastToTenant(
        alarm.tenantId,
        'alarm',
        alarm
      );

      // Si la alarma está asociada a un asset, broadcast también a ese room
      if (alarm.assetId) {
        this.websocketGateway.broadcastToAsset(
          alarm.assetId,
          'alarm',
          alarm
        );
      }

      // Si es crítica, broadcast a room especial de alarmas críticas
      if (alarm.severity === 'critical') {
        this.websocketGateway.broadcastToRoom(
          `alarms:critical:${alarm.tenantId}`,
          'critical_alarm',
          alarm
        );
      }

      logger.debug('Alarm broadcasted', {
        alarmId: alarm.id,
        severity: alarm.severity,
        tenantId: alarm.tenantId,
      });

    } catch (error) {
      logger.error('Error broadcasting alarm', {
        alarmId: alarm.id,
        error,
      });
    }
  }

  /**
   * Detener consumer
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping alarm broadcast consumer...');
    await this.consumer.disconnect();
    this.isRunning = false;
    logger.info('Alarm broadcast consumer stopped');
  }
}
