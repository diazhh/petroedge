/**
 * S7 Protocol Driver for Siemens PLCs
 * Supports S7-300, S7-400, S7-1200, S7-1500
 */

import { S7Client } from 'node-snap7';
import { logger } from '../../utils/logger.js';
import {
  BaseProtocolDriver,
  TagConfig,
  TagValue,
  ConnectionConfig,
  DataType,
} from './protocol-interface.js';

export interface S7Config extends ConnectionConfig {
  rack?: number; // PLC rack number (default: 0)
  slot?: number; // PLC slot number (default: 1)
}

export class S7Service extends BaseProtocolDriver {
  private client: S7Client;
  private config: S7Config;
  private reconnectTimer?: NodeJS.Timeout;

  constructor(config: S7Config) {
    super(config);
    this.config = config;
    this.client = new S7Client();
  }

  async connect(): Promise<void> {
    try {
      const rack = this.config.rack ?? 0;
      const slot = this.config.slot ?? 1;
      
      await this.client.ConnectTo(this.config.host, rack, slot);
      this.connected = true;
      logger.info(`S7 connected to ${this.config.host} (Rack: ${rack}, Slot: ${slot})`);
    } catch (error) {
      this.connected = false;
      this.recordError(error as Error);
      logger.error('S7 connection failed', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = undefined;
      }
      await this.client.Disconnect();
      this.connected = false;
      logger.info('S7 disconnected');
    } catch (error) {
      logger.error('S7 disconnect error', error);
      throw error;
    }
  }

  async readTag(tagConfig: TagConfig): Promise<TagValue> {
    if (!this.connected) {
      throw new Error('S7 not connected');
    }

    try {
      const { dbNumber, offset, dataType } = tagConfig.protocolConfig;
      
      if (dbNumber === undefined || offset === undefined) {
        throw new Error('DB number and offset are required for S7');
      }

      const length = this.getDataTypeLength(dataType as DataType);
      const buffer = await this.client.DBRead(dbNumber, offset, length);
      
      const value = this.parseBuffer(buffer, dataType as DataType, 0);
      this.recordSuccess();

      return {
        tagId: tagConfig.tagId,
        value,
        quality: 'good',
        timestamp: new Date(),
        source: 's7',
      };
    } catch (error) {
      this.recordError(error as Error);
      logger.error(`Failed to read tag ${tagConfig.tagId}`, error);
      
      return {
        tagId: tagConfig.tagId,
        value: 0,
        quality: 'bad',
        timestamp: new Date(),
        source: 's7',
      };
    }
  }

  async writeTag(tagConfig: TagConfig, value: any): Promise<void> {
    if (!this.connected) {
      throw new Error('S7 not connected');
    }

    try {
      const { dbNumber, offset, dataType } = tagConfig.protocolConfig;
      
      if (dbNumber === undefined || offset === undefined) {
        throw new Error('DB number and offset are required for S7');
      }

      const buffer = this.createBuffer(value, dataType as DataType);
      await this.client.DBWrite(dbNumber, offset, buffer.length, buffer);

      logger.info(`Wrote value ${value} to DB${dbNumber}.DBX${offset}`);
    } catch (error) {
      this.recordError(error as Error);
      logger.error(`Failed to write tag ${tagConfig.tagId}`, error);
      throw error;
    }
  }

  getProtocolName(): string {
    return 'S7';
  }

  protected async performHealthCheckPing(): Promise<void> {
    try {
      // Read 1 byte from DB1 to check connection
      await this.client.DBRead(1, 0, 1);
    } catch (error) {
      // Ignore error, just checking connectivity
    }
  }

  private getDataTypeLength(dataType: DataType): number {
    switch (dataType) {
      case 'boolean':
        return 1;
      case 'int16':
      case 'uint16':
        return 2;
      case 'int32':
      case 'uint32':
      case 'float32':
        return 4;
      case 'float64':
        return 8;
      default:
        return 4;
    }
  }

  private parseBuffer(buffer: Buffer, dataType: DataType, offset: number): number | boolean {
    switch (dataType) {
      case 'boolean':
        return buffer.readUInt8(offset) !== 0;
      case 'int16':
        return buffer.readInt16BE(offset);
      case 'uint16':
        return buffer.readUInt16BE(offset);
      case 'int32':
        return buffer.readInt32BE(offset);
      case 'uint32':
        return buffer.readUInt32BE(offset);
      case 'float32':
        return buffer.readFloatBE(offset);
      case 'float64':
        return buffer.readDoubleBE(offset);
      default:
        return buffer.readFloatBE(offset);
    }
  }

  private createBuffer(value: any, dataType: DataType): Buffer {
    const length = this.getDataTypeLength(dataType);
    const buffer = Buffer.alloc(length);

    switch (dataType) {
      case 'boolean':
        buffer.writeUInt8(value ? 1 : 0, 0);
        break;
      case 'int16':
        buffer.writeInt16BE(value, 0);
        break;
      case 'uint16':
        buffer.writeUInt16BE(value, 0);
        break;
      case 'int32':
        buffer.writeInt32BE(value, 0);
        break;
      case 'uint32':
        buffer.writeUInt32BE(value, 0);
        break;
      case 'float32':
        buffer.writeFloatBE(value, 0);
        break;
      case 'float64':
        buffer.writeDoubleBE(value, 0);
        break;
    }

    return buffer;
  }

  /**
   * Enable automatic reconnection
   */
  enableAutoReconnect(intervalMs: number = 5000): void {
    this.reconnectTimer = setInterval(async () => {
      if (!this.connected) {
        logger.info('Attempting to reconnect to S7...');
        try {
          await this.connect();
        } catch (error) {
          logger.warn('Reconnection failed, will retry');
        }
      }
    }, intervalMs);
  }
}
