/**
 * Common interface for all protocol drivers
 * Provides abstraction layer for different industrial protocols
 */

export type ProtocolType = 
  | 'modbus' 
  | 'ethernet-ip' 
  | 's7' 
  | 'opcua' 
  | 'fins' 
  | 'mc-protocol';

export type DataType = 
  | 'boolean' 
  | 'int16' 
  | 'uint16' 
  | 'int32' 
  | 'uint32' 
  | 'float32' 
  | 'float64' 
  | 'string';

export type QualityCode = 'good' | 'bad' | 'uncertain';

export interface TagConfig {
  tagId: string;
  assetId?: string;
  description?: string;
  protocol: ProtocolType;
  protocolConfig: ProtocolSpecificConfig;
  unit?: string;
  scanRate?: number;
  deadband?: number;
  enabled?: boolean;
}

export interface ProtocolSpecificConfig {
  // Modbus
  unitId?: number;
  registerType?: 'coil' | 'discrete' | 'holding' | 'input';
  address?: number;
  quantity?: number;
  dataType?: DataType;

  // EtherNet/IP (Allen-Bradley)
  tagName?: string;
  slot?: number;

  // S7 (Siemens)
  rack?: number;
  dbNumber?: number;
  offset?: number;
  bitOffset?: number;

  // OPC-UA
  nodeId?: string;
  namespaceIndex?: number;

  // FINS (Omron)
  memoryArea?: string;
  memoryAddress?: number;

  // MC Protocol (Mitsubishi)
  deviceCode?: string;
  deviceNumber?: number;
}

export interface TagValue {
  tagId: string;
  value: number | string | boolean;
  quality: QualityCode;
  timestamp: Date;
  source?: string;
}

export interface TagMetadata {
  tagId: string;
  name: string;
  dataType: DataType;
  description?: string;
  unit?: string;
  minValue?: number;
  maxValue?: number;
}

export interface ProtocolHealth {
  connected: boolean;
  latencyMs: number;
  errorCount: number;
  lastError?: string;
  lastSuccessfulRead?: Date;
}

export interface ConnectionConfig {
  host: string;
  port?: number;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Common interface that all protocol drivers must implement
 */
export interface IProtocolDriver {
  /**
   * Connect to the device/server
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the device/server
   */
  disconnect(): Promise<void>;

  /**
   * Check if currently connected
   */
  isConnected(): boolean;

  /**
   * Read a single tag value
   */
  readTag(tagConfig: TagConfig): Promise<TagValue>;

  /**
   * Read multiple tags in one operation (if protocol supports it)
   */
  readTags(tagConfigs: TagConfig[]): Promise<TagValue[]>;

  /**
   * Write a value to a tag (optional, not all protocols support writing)
   */
  writeTag?(tagConfig: TagConfig, value: any): Promise<void>;

  /**
   * Discover available tags (optional, not all protocols support discovery)
   */
  discoverTags?(): Promise<TagMetadata[]>;

  /**
   * Get health status of the connection
   */
  healthCheck(): Promise<ProtocolHealth>;

  /**
   * Get protocol name
   */
  getProtocolName(): string;
}

/**
 * Base class with common functionality for protocol drivers
 */
export abstract class BaseProtocolDriver implements IProtocolDriver {
  protected connected: boolean = false;
  protected errorCount: number = 0;
  protected lastError?: string;
  protected lastSuccessfulRead?: Date;
  protected connectionConfig: ConnectionConfig;

  constructor(config: ConnectionConfig) {
    this.connectionConfig = config;
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract readTag(tagConfig: TagConfig): Promise<TagValue>;
  abstract getProtocolName(): string;

  isConnected(): boolean {
    return this.connected;
  }

  async readTags(tagConfigs: TagConfig[]): Promise<TagValue[]> {
    // Default implementation: read tags sequentially
    // Subclasses can override for batch operations
    const results: TagValue[] = [];
    for (const config of tagConfigs) {
      try {
        const value = await this.readTag(config);
        results.push(value);
      } catch (error) {
        results.push({
          tagId: config.tagId,
          value: 0,
          quality: 'bad',
          timestamp: new Date(),
          source: this.getProtocolName(),
        });
      }
    }
    return results;
  }

  async healthCheck(): Promise<ProtocolHealth> {
    const startTime = Date.now();
    let latencyMs = 0;

    if (this.connected) {
      try {
        // Ping test - subclasses can override
        await this.performHealthCheckPing();
        latencyMs = Date.now() - startTime;
      } catch (error) {
        latencyMs = Date.now() - startTime;
      }
    }

    return {
      connected: this.connected,
      latencyMs,
      errorCount: this.errorCount,
      lastError: this.lastError,
      lastSuccessfulRead: this.lastSuccessfulRead,
    };
  }

  protected async performHealthCheckPing(): Promise<void> {
    // Default: no-op, subclasses can implement specific ping
  }

  protected recordError(error: Error | string): void {
    this.errorCount++;
    this.lastError = error instanceof Error ? error.message : error;
  }

  protected recordSuccess(): void {
    this.lastSuccessfulRead = new Date();
  }
}
