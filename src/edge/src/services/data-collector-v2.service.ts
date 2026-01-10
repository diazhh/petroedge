/**
 * Data Collector Service V2
 * Uses ProtocolFactory to support multiple protocol drivers
 */

import { kafkaService } from './kafka.service.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { ProtocolFactory } from './protocols/protocol-factory.service.js';
import {
  IProtocolDriver,
  TagConfig,
  TagValue,
} from './protocols/protocol-interface.js';

export interface TelemetryReading {
  tagId: string;
  assetId: string;
  value: number | boolean | string;
  unit?: string;
  quality: 'good' | 'bad' | 'uncertain';
  timestamp: string;
}

export class DataCollectorServiceV2 {
  private tags: Map<string, TagConfig> = new Map();
  private drivers: Map<string, IProtocolDriver> = new Map();
  private lastValues: Map<string, number | boolean | string> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;
  private buffer: TelemetryReading[] = [];

  /**
   * Register a tag for data collection
   */
  registerTag(tag: TagConfig): void {
    this.tags.set(tag.tagId, tag);
    logger.info('Tag registered', {
      tagId: tag.tagId,
      assetId: tag.assetId,
      protocol: tag.protocol,
      scanRate: tag.scanRate,
    });
  }

  /**
   * Register multiple tags
   */
  registerTags(tags: TagConfig[]): void {
    tags.forEach((tag) => this.registerTag(tag));
  }

  /**
   * Initialize protocol drivers based on registered tags
   */
  private async initializeDrivers(): Promise<void> {
    const driverConfigs = new Map<string, any>();

    // Group tags by protocol - for now use single connection per protocol
    for (const tag of this.tags.values()) {
      const key = `${tag.protocol}:${config.modbus.host}`;
      
      if (!driverConfigs.has(key)) {
        const connectionConfig: any = {
          host: config.modbus.host,
          port: config.modbus.port,
          timeout: config.modbus.timeout,
          retryAttempts: 3,
        };

        // Add protocol-specific config
        if (tag.protocol === 'modbus') {
          connectionConfig.unitId = tag.protocolConfig.unitId;
        } else if (tag.protocol === 'ethernet-ip') {
          connectionConfig.slot = tag.protocolConfig.slot;
        } else if (tag.protocol === 's7') {
          connectionConfig.rack = tag.protocolConfig.rack;
          connectionConfig.slot = tag.protocolConfig.slot;
        } else if (tag.protocol === 'opcua') {
          connectionConfig.endpointUrl = tag.protocolConfig.nodeId; // TODO: Fix this
        }

        driverConfigs.set(key, {
          protocol: tag.protocol,
          connection: connectionConfig,
        });
      }
    }

    // Create drivers
    for (const [key, driverConfig] of driverConfigs.entries()) {
      try {
        const driver = ProtocolFactory.createDriver(driverConfig);
        await driver.connect();
        this.drivers.set(key, driver);
        logger.info(`Driver initialized: ${key}`);
      } catch (error: any) {
        logger.error(`Failed to initialize driver ${key}`, error);
      }
    }
  }

  /**
   * Get driver for a tag
   */
  private getDriverForTag(tag: TagConfig): IProtocolDriver | undefined {
    const key = `${tag.protocol}:${config.modbus.host}`;
    return this.drivers.get(key);
  }

  /**
   * Start data collection for all registered tags
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Data collector already running');
      return;
    }

    logger.info('Starting data collector V2...');

    // Initialize protocol drivers
    await this.initializeDrivers();

    // Start polling for each tag
    for (const [tagId, tag] of this.tags.entries()) {
      if (tag.enabled !== false) {
        this.startTagPolling(tagId, tag);
      }
    }

    // Start periodic buffer flush
    this.startBufferFlush();

    this.isRunning = true;
    logger.info(`Data collector V2 started with ${this.tags.size} tags and ${this.drivers.size} drivers`);
  }

  /**
   * Start polling for a specific tag
   */
  private startTagPolling(tagId: string, tag: TagConfig): void {
    const scanRate = tag.scanRate || config.dataCollection.pollingIntervalMs;
    
    const interval = setInterval(async () => {
      try {
        const reading = await this.readTag(tag);
        if (reading) {
          this.processReading(reading, tag);
        }
      } catch (error: any) {
        logger.error('Error reading tag', {
          tagId,
          error: error.message,
        });
      }
    }, scanRate);

    this.pollingIntervals.set(tagId, interval);
  }

  /**
   * Read a tag value using the appropriate driver
   */
  private async readTag(tag: TagConfig): Promise<TagValue | null> {
    const driver = this.getDriverForTag(tag);
    
    if (!driver) {
      logger.error(`No driver found for tag ${tag.tagId}`);
      return null;
    }

    if (!driver.isConnected()) {
      logger.warn(`Driver not connected for tag ${tag.tagId}`);
      return null;
    }

    try {
      return await driver.readTag(tag);
    } catch (error: any) {
      logger.error(`Failed to read tag ${tag.tagId}`, error);
      return null;
    }
  }

  /**
   * Process a reading and apply deadband filter
   */
  private processReading(tagValue: TagValue, tag: TagConfig): void {
    if (tagValue.quality === 'bad') {
      // Publish bad quality reading
      this.addToBuffer({
        tagId: tag.tagId,
        assetId: tag.assetId || '',
        value: 0,
        unit: tag.unit,
        quality: 'bad',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const value = tagValue.value;

    // Apply deadband filter
    if (tag.deadband !== undefined && typeof value === 'number') {
      const lastValue = this.lastValues.get(tag.tagId);
      if (lastValue !== undefined && typeof lastValue === 'number') {
        const change = Math.abs(value - lastValue);
        if (change < tag.deadband) {
          // Skip publishing, change too small
          return;
        }
      }
    }

    // Update last value
    this.lastValues.set(tag.tagId, value);

    // Add to buffer
    this.addToBuffer({
      tagId: tag.tagId,
      assetId: tag.assetId || '',
      value,
      unit: tag.unit,
      quality: tagValue.quality,
      timestamp: tagValue.timestamp.toISOString(),
    });
  }

  /**
   * Add reading to buffer
   */
  private addToBuffer(reading: TelemetryReading): void {
    this.buffer.push(reading);

    // Flush if buffer is full
    if (this.buffer.length >= config.dataCollection.batchSize) {
      this.flushBuffer();
    }
  }

  /**
   * Start periodic buffer flush
   */
  private startBufferFlush(): void {
    setInterval(() => {
      if (this.buffer.length > 0) {
        this.flushBuffer();
      }
    }, config.dataCollection.pollingIntervalMs * 10); // Flush every 10 polling cycles
  }

  /**
   * Flush buffer to Kafka
   */
  private async flushBuffer(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    const readings = [...this.buffer];
    this.buffer = [];

    try {
      await kafkaService.publishTelemetryBatch(readings);
      logger.debug(`Flushed ${readings.length} telemetry readings to Kafka`);
    } catch (error: any) {
      logger.error('Failed to flush telemetry buffer', {
        error: error.message,
        count: readings.length,
      });

      // Put readings back in buffer for retry
      this.buffer.unshift(...readings);

      // Prevent buffer overflow
      if (this.buffer.length > config.dataCollection.bufferSize) {
        const overflow = this.buffer.length - config.dataCollection.bufferSize;
        this.buffer.splice(0, overflow);
        logger.warn(`Buffer overflow, dropped ${overflow} oldest readings`);
      }
    }
  }

  /**
   * Stop data collection
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping data collector V2...');

    // Stop all polling intervals
    for (const [tagId, interval] of this.pollingIntervals.entries()) {
      clearInterval(interval);
      logger.debug(`Stopped polling for tag: ${tagId}`);
    }
    this.pollingIntervals.clear();

    // Flush remaining buffer
    await this.flushBuffer();

    // Disconnect all drivers
    for (const [key, driver] of this.drivers.entries()) {
      try {
        await driver.disconnect();
        logger.info(`Driver disconnected: ${key}`);
      } catch (error: any) {
        logger.error(`Error disconnecting driver ${key}`, error);
      }
    }
    this.drivers.clear();

    this.isRunning = false;
    logger.info('Data collector V2 stopped');
  }

  /**
   * Get collector statistics
   */
  getStats() {
    const driversStatus = Array.from(this.drivers.entries()).map(([key, driver]) => ({
      key,
      connected: driver.isConnected(),
      protocol: driver.getProtocolName(),
    }));

    return {
      isRunning: this.isRunning,
      tagsCount: this.tags.size,
      driversCount: this.drivers.size,
      bufferSize: this.buffer.length,
      drivers: driversStatus,
    };
  }

  /**
   * Get health status of all drivers
   */
  async getDriversHealth() {
    const health = [];
    
    for (const [key, driver] of this.drivers.entries()) {
      try {
        const driverHealth = await driver.healthCheck();
        health.push({
          key,
          protocol: driver.getProtocolName(),
          ...driverHealth,
        });
      } catch (error: any) {
        health.push({
          key,
          protocol: driver.getProtocolName(),
          connected: false,
          error: error.message,
        });
      }
    }

    return health;
  }
}

// Singleton instance
export const dataCollectorServiceV2 = new DataCollectorServiceV2();
