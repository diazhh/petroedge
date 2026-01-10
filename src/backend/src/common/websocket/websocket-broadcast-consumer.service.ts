import { kafkaService } from '../kafka/kafka.service.js';
import { websocketGateway } from './websocket-gateway.service.js';
import { logger } from '../utils/logger.js';
import type { EachMessagePayload } from 'kafkajs';
import { z } from 'zod';

// Schema for telemetry broadcast message
const telemetryBroadcastSchema = z.object({
  assetId: z.string().uuid(),
  assetType: z.string().optional(),
  telemetryKey: z.string(),
  value: z.any(),
  unit: z.string().optional(),
  quality: z.string().optional(),
  timestamp: z.string().datetime(),
});

// Schema for alarm broadcast message
const alarmBroadcastSchema = z.object({
  tenantId: z.string().uuid(),
  assetId: z.string().uuid().optional(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']),
  message: z.string(),
  code: z.string().optional(),
  timestamp: z.string().datetime(),
});

// Schema for calculation result broadcast
const calculationBroadcastSchema = z.object({
  assetId: z.string().uuid(),
  calculationType: z.string(),
  result: z.any(),
  timestamp: z.string().datetime(),
});

export class WebSocketBroadcastConsumerService {
  private isRunning = false;
  private readonly CONSUMER_GROUP_ID = 'websocket-broadcast-group';
  private readonly TOPICS = [
    'scada.telemetry.validated',
    'alarms.critical',
    'alarms.warnings',
    'well-test.calculations',
    'drilling.calculations',
    'production.calculations',
    'assets.status.changed',
    'events.system',
  ];

  /**
   * Start the Kafka consumer for WebSocket broadcasts
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('WebSocket broadcast consumer is already running');
      return;
    }

    try {
      logger.info('Starting WebSocket broadcast Kafka consumer...');

      const consumer = await kafkaService.initConsumer(this.CONSUMER_GROUP_ID, this.TOPICS);

      await consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      this.isRunning = true;
      logger.info('WebSocket broadcast Kafka consumer started successfully', { topics: this.TOPICS });
    } catch (error) {
      logger.error('Failed to start WebSocket broadcast Kafka consumer', error);
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
        logger.info('WebSocket broadcast Kafka consumer stopped');
      }
    } catch (error) {
      logger.error('Error stopping WebSocket broadcast Kafka consumer', error);
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

      // Route message to appropriate handler based on topic
      if (topic === 'scada.telemetry.validated') {
        await this.handleTelemetryBroadcast(parsedMessage);
      } else if (topic === 'alarms.critical' || topic === 'alarms.warnings') {
        await this.handleAlarmBroadcast(parsedMessage);
      } else if (topic.endsWith('.calculations')) {
        await this.handleCalculationBroadcast(parsedMessage, topic);
      } else if (topic === 'assets.status.changed') {
        await this.handleStatusChangeBroadcast(parsedMessage);
      } else if (topic === 'events.system') {
        await this.handleSystemEventBroadcast(parsedMessage);
      }
    } catch (error: any) {
      logger.error('Error processing WebSocket broadcast message', {
        error: error.message,
        topic,
        partition,
        offset: message.offset,
      });
    }
  }

  /**
   * Handle telemetry broadcast
   */
  private async handleTelemetryBroadcast(message: any): Promise<void> {
    try {
      const data = telemetryBroadcastSchema.parse(message);

      // Broadcast to asset-specific room
      const room = `asset:${data.assetId}`;
      websocketGateway.broadcast(room, 'telemetry:update', {
        assetId: data.assetId,
        telemetryKey: data.telemetryKey,
        value: data.value,
        unit: data.unit,
        quality: data.quality,
        timestamp: data.timestamp,
      });

      // Also broadcast to asset type room if available
      if (data.assetType) {
        const typeRoom = `${data.assetType.toLowerCase()}:${data.assetId}`;
        websocketGateway.broadcast(typeRoom, 'telemetry:update', {
          assetId: data.assetId,
          telemetryKey: data.telemetryKey,
          value: data.value,
          unit: data.unit,
          quality: data.quality,
          timestamp: data.timestamp,
        });
      }

      logger.debug('Telemetry broadcast sent', { assetId: data.assetId, key: data.telemetryKey });
    } catch (error: any) {
      logger.error('Error handling telemetry broadcast', error);
    }
  }

  /**
   * Handle alarm broadcast
   */
  private async handleAlarmBroadcast(message: any): Promise<void> {
    try {
      const data = alarmBroadcastSchema.parse(message);

      // Broadcast to tenant alarms room
      const tenantRoom = `alarms:${data.tenantId}`;
      websocketGateway.broadcast(tenantRoom, 'alarm:new', {
        severity: data.severity,
        message: data.message,
        code: data.code,
        assetId: data.assetId,
        timestamp: data.timestamp,
      });

      // If alarm is for specific asset, also broadcast to asset room
      if (data.assetId) {
        const assetRoom = `asset:${data.assetId}`;
        websocketGateway.broadcast(assetRoom, 'alarm:new', {
          severity: data.severity,
          message: data.message,
          code: data.code,
          timestamp: data.timestamp,
        });
      }

      logger.debug('Alarm broadcast sent', { tenantId: data.tenantId, severity: data.severity });
    } catch (error: any) {
      logger.error('Error handling alarm broadcast', error);
    }
  }

  /**
   * Handle calculation result broadcast
   */
  private async handleCalculationBroadcast(message: any, _topic: string): Promise<void> {
    try {
      const data = calculationBroadcastSchema.parse(message);

      // Broadcast to asset-specific room
      const room = `asset:${data.assetId}`;
      websocketGateway.broadcast(room, 'calculation:result', {
        assetId: data.assetId,
        calculationType: data.calculationType,
        result: data.result,
        timestamp: data.timestamp,
      });

      logger.debug('Calculation broadcast sent', { assetId: data.assetId, type: data.calculationType });
    } catch (error: any) {
      logger.error('Error handling calculation broadcast', error);
    }
  }

  /**
   * Handle asset status change broadcast
   */
  private async handleStatusChangeBroadcast(message: any): Promise<void> {
    try {
      const { assetId, oldStatus, newStatus, timestamp } = message;

      if (!assetId || !newStatus) {
        logger.warn('Invalid status change message', message);
        return;
      }

      // Broadcast to asset-specific room
      const room = `asset:${assetId}`;
      websocketGateway.broadcast(room, 'status:changed', {
        assetId,
        oldStatus,
        newStatus,
        timestamp,
      });

      logger.debug('Status change broadcast sent', { assetId, newStatus });
    } catch (error: any) {
      logger.error('Error handling status change broadcast', error);
    }
  }

  /**
   * Handle system event broadcast
   */
  private async handleSystemEventBroadcast(message: any): Promise<void> {
    try {
      const { tenantId, eventType, data, timestamp } = message;

      if (!tenantId || !eventType) {
        logger.warn('Invalid system event message', message);
        return;
      }

      // Broadcast to tenant events room
      const room = `events:${tenantId}`;
      websocketGateway.broadcast(room, 'event:system', {
        eventType,
        data,
        timestamp,
      });

      logger.debug('System event broadcast sent', { tenantId, eventType });
    } catch (error: any) {
      logger.error('Error handling system event broadcast', error);
    }
  }
}

export const websocketBroadcastConsumer = new WebSocketBroadcastConsumerService();
