import { modbusService, ModbusReadResult } from './modbus.service.js';
import { kafkaService } from './kafka.service.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export interface TagConfig {
  tagId: string;
  assetId: string;
  description: string;
  protocol: 'modbus';
  modbusConfig: {
    unitId: number;
    registerType: 'holding' | 'input' | 'coil' | 'discrete';
    address: number;
    quantity: number;
    dataType: 'int16' | 'uint16' | 'int32' | 'uint32' | 'float32' | 'boolean';
  };
  unit?: string;
  scanRate: number; // milliseconds
  deadband?: number; // Only publish if change exceeds this value
}

export interface TelemetryReading {
  tagId: string;
  assetId: string;
  value: number | boolean;
  unit?: string;
  quality: 'good' | 'bad' | 'uncertain';
  timestamp: string;
}

export class DataCollectorService {
  private tags: Map<string, TagConfig> = new Map();
  private lastValues: Map<string, number | boolean> = new Map();
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
   * Start data collection for all registered tags
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Data collector already running');
      return;
    }

    logger.info('Starting data collector...');

    // Connect to Modbus if enabled
    if (config.modbus.enabled) {
      try {
        await modbusService.connect();
      } catch (error) {
        logger.error('Failed to connect to Modbus, will retry automatically');
      }
    }

    // Start polling for each tag
    for (const [tagId, tag] of this.tags.entries()) {
      this.startTagPolling(tagId, tag);
    }

    // Start periodic buffer flush
    this.startBufferFlush();

    this.isRunning = true;
    logger.info(`Data collector started with ${this.tags.size} tags`);
  }

  /**
   * Start polling for a specific tag
   */
  private startTagPolling(tagId: string, tag: TagConfig): void {
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
    }, tag.scanRate);

    this.pollingIntervals.set(tagId, interval);
  }

  /**
   * Read a tag value from the device
   */
  private async readTag(tag: TagConfig): Promise<ModbusReadResult | null> {
    if (tag.protocol === 'modbus') {
      return await this.readModbusTag(tag);
    }
    return null;
  }

  /**
   * Read a Modbus tag
   */
  private async readModbusTag(tag: TagConfig): Promise<ModbusReadResult | null> {
    const { unitId, registerType, address, quantity } = tag.modbusConfig;

    try {
      let result: ModbusReadResult;

      switch (registerType) {
        case 'holding':
          result = await modbusService.readHoldingRegisters(address, quantity, unitId);
          break;
        case 'input':
          result = await modbusService.readInputRegisters(address, quantity, unitId);
          break;
        case 'coil':
          result = await modbusService.readCoils(address, quantity, unitId);
          break;
        case 'discrete':
          result = await modbusService.readDiscreteInputs(address, quantity, unitId);
          break;
        default:
          throw new Error(`Unknown register type: ${registerType}`);
      }

      return result;
    } catch (error: any) {
      logger.error('Failed to read Modbus tag', {
        tagId: tag.tagId,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Process a reading and apply data type conversion
   */
  private processReading(result: ModbusReadResult, tag: TagConfig): void {
    if (result.quality === 'bad' || result.values.length === 0) {
      // Publish bad quality reading
      this.addToBuffer({
        tagId: tag.tagId,
        assetId: tag.assetId,
        value: 0,
        unit: tag.unit,
        quality: 'bad',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Convert raw registers to actual value based on data type
    let value: number | boolean;

    switch (tag.modbusConfig.dataType) {
      case 'int16':
        value = result.values[0] > 32767 ? result.values[0] - 65536 : result.values[0];
        break;
      case 'uint16':
        value = result.values[0];
        break;
      case 'int32':
        value = modbusService.registersToInt32(result.values);
        break;
      case 'uint32':
        value = modbusService.registersToInt32(result.values);
        if (value < 0) value += 4294967296;
        break;
      case 'float32':
        value = modbusService.registersToFloat32(result.values);
        break;
      case 'boolean':
        value = result.values[0] === 1;
        break;
      default:
        value = result.values[0];
    }

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
      assetId: tag.assetId,
      value,
      unit: tag.unit,
      quality: result.quality,
      timestamp: result.timestamp.toISOString(),
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

    logger.info('Stopping data collector...');

    // Stop all polling intervals
    for (const [tagId, interval] of this.pollingIntervals.entries()) {
      clearInterval(interval);
      logger.debug(`Stopped polling for tag: ${tagId}`);
    }
    this.pollingIntervals.clear();

    // Flush remaining buffer
    await this.flushBuffer();

    // Disconnect from Modbus
    if (config.modbus.enabled) {
      await modbusService.disconnect();
    }

    this.isRunning = false;
    logger.info('Data collector stopped');
  }

  /**
   * Get collector statistics
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      tagsCount: this.tags.size,
      bufferSize: this.buffer.length,
      modbusConnected: modbusService.isClientConnected(),
    };
  }
}

// Singleton instance
export const dataCollectorService = new DataCollectorService();
