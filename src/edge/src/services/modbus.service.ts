import ModbusRTU from 'modbus-serial';
import { logger } from '../utils/logger.js';
import {
  BaseProtocolDriver,
  TagConfig,
  TagValue,
  ConnectionConfig,
  DataType,
} from './protocols/protocol-interface.js';

export interface ModbusConfig extends ConnectionConfig {
  unitId?: number;
}

export class ModbusService extends BaseProtocolDriver {
  private client: ModbusRTU;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private readonly RECONNECT_INTERVAL = 5000; // 5 seconds
  private modbusConfig: ModbusConfig;

  constructor(modbusConfig: ModbusConfig) {
    super(modbusConfig);
    this.modbusConfig = modbusConfig;
    this.client = new ModbusRTU();
  }

  /**
   * Connect to Modbus TCP device
   */
  async connect(): Promise<void> {
    if (this.connected) {
      logger.warn('Modbus client already connected');
      return;
    }

    try {
      await this.client.connectTCP(this.modbusConfig.host, {
        port: this.modbusConfig.port || 502,
      });

      this.client.setTimeout(this.modbusConfig.timeout || 5000);
      this.connected = true;

      logger.info('Modbus TCP connected successfully', {
        host: this.modbusConfig.host,
        port: this.modbusConfig.port,
      });

      // Clear reconnect timer if exists
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    } catch (error: any) {
      this.connected = false;
      this.recordError(error);
      logger.error('Failed to connect to Modbus TCP', {
        error: error.message,
        host: this.modbusConfig.host,
        port: this.modbusConfig.port,
      });

      // Schedule reconnection
      this.scheduleReconnect();
      throw error;
    }
  }

  /**
   * Schedule automatic reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return; // Already scheduled
    }

    this.reconnectTimer = setTimeout(async () => {
      logger.info('Attempting to reconnect to Modbus TCP...');
      this.reconnectTimer = null;
      try {
        await this.connect();
      } catch (error) {
        // Will schedule another reconnect
      }
    }, this.RECONNECT_INTERVAL);
  }

  /**
   * Read a tag using the common interface
   */
  async readTag(tagConfig: TagConfig): Promise<TagValue> {
    if (!this.connected) {
      throw new Error('Modbus client not connected');
    }

    const { unitId, registerType, address, quantity, dataType } = tagConfig.protocolConfig;

    if (address === undefined || quantity === undefined) {
      throw new Error('Address and quantity are required for Modbus');
    }

    try {
      this.client.setID(unitId || this.modbusConfig.unitId || 1);

      let rawValues: number[];

      switch (registerType) {
        case 'holding':
          rawValues = (await this.client.readHoldingRegisters(address, quantity)).data;
          break;
        case 'input':
          rawValues = (await this.client.readInputRegisters(address, quantity)).data;
          break;
        case 'coil':
          rawValues = (await this.client.readCoils(address, quantity)).data.map(v => v ? 1 : 0);
          break;
        case 'discrete':
          rawValues = (await this.client.readDiscreteInputs(address, quantity)).data.map(v => v ? 1 : 0);
          break;
        default:
          throw new Error(`Unknown register type: ${registerType}`);
      }

      const value = this.convertValue(rawValues, dataType as DataType);
      this.recordSuccess();

      return {
        tagId: tagConfig.tagId,
        value,
        quality: 'good',
        timestamp: new Date(),
        source: 'modbus',
      };
    } catch (error: any) {
      this.connected = false;
      this.recordError(error);
      this.scheduleReconnect();

      logger.error('Failed to read Modbus tag', {
        tagId: tagConfig.tagId,
        error: error.message,
      });

      return {
        tagId: tagConfig.tagId,
        value: 0,
        quality: 'bad',
        timestamp: new Date(),
        source: 'modbus',
      };
    }
  }

  /**
   * Convert raw register values to typed value
   */
  private convertValue(registers: number[], dataType: DataType): number | boolean {
    switch (dataType) {
      case 'int16':
        return registers[0] > 32767 ? registers[0] - 65536 : registers[0];
      case 'uint16':
        return registers[0];
      case 'int32':
        return this.registersToInt32(registers);
      case 'uint32':
        const int32 = this.registersToInt32(registers);
        return int32 < 0 ? int32 + 4294967296 : int32;
      case 'float32':
        return this.registersToFloat32(registers);
      case 'boolean':
        return registers[0] === 1;
      default:
        return registers[0];
    }
  }

  getProtocolName(): string {
    return 'Modbus TCP';
  }

  protected async performHealthCheckPing(): Promise<void> {
    // Read 1 register from address 0 to check connection
    try {
      await this.client.readHoldingRegisters(0, 1);
    } catch (error) {
      // Ignore error, just checking connectivity
    }
  }

  /**
   * Read holding registers (function code 3) - Legacy method
   */
  async readHoldingRegisters(
    startAddress: number,
    quantity: number,
    unitId: number = 1
  ): Promise<{ values: number[]; quality: 'good' | 'bad' }> {
    if (!this.connected) {
      throw new Error('Modbus client not connected');
    }

    try {
      this.client.setID(unitId);
      const data = await this.client.readHoldingRegisters(startAddress, quantity);

      return {
        values: data.data,
        quality: 'good',
      };
    } catch (error: any) {
      logger.error('Failed to read holding registers', {
        error: error.message,
        startAddress,
        quantity,
        unitId,
      });

      this.connected = false;
      this.scheduleReconnect();

      return {
        values: [],
        quality: 'bad',
      };
    }
  }


  /**
   * Convert 2 registers to float32 (IEEE 754)
   */
  registersToFloat32(registers: number[]): number {
    if (registers.length < 2) {
      throw new Error('Need at least 2 registers to convert to float32');
    }

    const buffer = Buffer.allocUnsafe(4);
    buffer.writeUInt16BE(registers[0], 0);
    buffer.writeUInt16BE(registers[1], 2);
    return buffer.readFloatBE(0);
  }

  /**
   * Convert 2 registers to int32
   */
  registersToInt32(registers: number[]): number {
    if (registers.length < 2) {
      throw new Error('Need at least 2 registers to convert to int32');
    }

    const buffer = Buffer.allocUnsafe(4);
    buffer.writeUInt16BE(registers[0], 0);
    buffer.writeUInt16BE(registers[1], 2);
    return buffer.readInt32BE(0);
  }


  /**
   * Disconnect from Modbus device
   */
  async disconnect(): Promise<void> {
    try {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      if (this.client.isOpen) {
        this.client.close(() => {
          logger.info('Modbus TCP disconnected');
        });
      }

      this.connected = false;
    } catch (error: any) {
      logger.error('Error disconnecting Modbus client', error);
    }
  }
}
