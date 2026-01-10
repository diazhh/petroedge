/**
 * Config Sync Service (Edge Gateway)
 * 
 * Consumes configuration changes from Cloud via Kafka and applies them to the Edge Gateway.
 * Handles dynamic reconfiguration of data sources and tags without restarting the gateway.
 */

import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { dataCollectorServiceV2 } from './data-collector-v2.service.js';
import { TagConfig } from './protocols/protocol-interface.js';

interface EdgeGatewayConfig {
  gatewayId: string;
  version: number;
  dataSources: Array<{
    id: string;
    name: string;
    protocol: string;
    connectionConfig: {
      host: string;
      port: number;
      [key: string]: any;
    };
    scanRate: number;
    enabled: boolean;
    tags: Array<{
      id: string;
      name: string;
      address: string;
      dataType: string;
      unit?: string;
      scanRate?: number;
      scaleFactor?: number;
      offset?: number;
      enabled: boolean;
    }>;
  }>;
  settings: {
    scanRate: number;
    bufferSize: number;
    reconnectInterval: number;
    logLevel: string;
  };
  updatedAt: Date;
}

interface ConfigChangeMessage {
  gatewayId: string;
  tenantId: string;
  version: number;
  config: EdgeGatewayConfig;
  timestamp: string;
}

export class ConfigSyncService {
  private kafka: Kafka;
  private consumer: Consumer | null = null;
  private currentVersion: number = 0;
  private isRunning: boolean = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: `edge-gateway-${config.gateway.id}`,
      brokers: config.kafka.brokers,
      retry: {
        retries: 8,
        initialRetryTime: 300,
        maxRetryTime: 30000,
      },
    });
  }

  /**
   * Start consuming configuration changes from Kafka
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Config Sync Service already running');
      return;
    }

    try {
      this.consumer = this.kafka.consumer({
        groupId: `edge-gateway-config-${config.gateway.id}`,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
      });

      await this.consumer.connect();
      logger.info('✅ Config Sync consumer connected to Kafka');

      // Subscribe to config change topic
      await this.consumer.subscribe({
        topic: 'edge.config.changed',
        fromBeginning: false, // Only new messages
      });

      // Start consuming messages
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleConfigChange(payload);
        },
      });

      this.isRunning = true;
      logger.info('✅ Config Sync Service started successfully');
    } catch (error) {
      logger.error('❌ Failed to start Config Sync Service', error);
      throw error;
    }
  }

  /**
   * Handle incoming configuration change message
   */
  private async handleConfigChange(payload: EachMessagePayload): Promise<void> {
    const { message } = payload;

    try {
      if (!message.value) {
        logger.warn('Received empty config change message');
        return;
      }

      const configMessage: ConfigChangeMessage = JSON.parse(message.value.toString());

      // Check if this message is for this gateway
      if (configMessage.gatewayId !== config.gateway.id) {
        logger.debug(`Config change for different gateway: ${configMessage.gatewayId}`);
        return;
      }

      // Check version to avoid applying old configs
      if (configMessage.version <= this.currentVersion) {
        logger.debug(`Ignoring old config version: ${configMessage.version} (current: ${this.currentVersion})`);
        return;
      }

      logger.info(`📥 Received config change v${configMessage.version}`, {
        dataSourcesCount: configMessage.config.dataSources.length,
        previousVersion: this.currentVersion,
      });

      // Apply configuration
      await this.applyConfiguration(configMessage.config);

      // Update current version
      this.currentVersion = configMessage.version;

      logger.info(`✅ Configuration v${configMessage.version} applied successfully`);
    } catch (error) {
      logger.error('Failed to handle config change', error);
      // Don't throw - continue processing other messages
    }
  }

  /**
   * Apply configuration to the Edge Gateway
   */
  private async applyConfiguration(config: EdgeGatewayConfig): Promise<void> {
    try {
      // Convert data sources to TagConfig format
      const tags: TagConfig[] = [];

      for (const dataSource of config.dataSources) {
        if (!dataSource.enabled) {
          continue;
        }

        for (const tag of dataSource.tags) {
          if (!tag.enabled) {
            continue;
          }

          const tagConfig: TagConfig = {
            tagId: tag.id,
            assetId: tag.id, // Use tag ID as asset ID for now
            description: tag.name,
            protocol: dataSource.protocol as any,
            protocolConfig: this.buildProtocolConfig(dataSource, tag),
            unit: tag.unit,
            scanRate: tag.scanRate || dataSource.scanRate,
            deadband: tag.scaleFactor ? undefined : 0.1, // Use deadband instead of scaleFactor
            enabled: tag.enabled,
          };

          tags.push(tagConfig);
        }
      }

      logger.info(`🔄 Applying configuration: ${tags.length} tags from ${config.dataSources.length} data sources`);

      // Stop current data collector
      await dataCollectorServiceV2.stop();

      // Register new tags
      dataCollectorServiceV2.registerTags(tags);

      // Restart data collector with new configuration
      await dataCollectorServiceV2.start();

      logger.info('✅ Data collector restarted with new configuration');
    } catch (error) {
      logger.error('Failed to apply configuration', error);
      throw error;
    }
  }

  /**
   * Build protocol-specific configuration
   */
  private buildProtocolConfig(dataSource: any, tag: any): any {
    const baseConfig = {
      host: dataSource.connectionConfig.host,
      port: dataSource.connectionConfig.port,
    };

    switch (dataSource.protocol.toLowerCase()) {
      case 'modbus':
      case 'modbus_tcp':
        return {
          ...baseConfig,
          unitId: dataSource.connectionConfig.unitId || 1,
          registerType: this.parseModbusRegisterType(tag.address),
          address: this.parseModbusAddress(tag.address),
          quantity: this.getModbusQuantity(tag.dataType),
          dataType: tag.dataType,
        };

      case 'ethernet_ip':
      case 'ethernetip':
        return {
          ...baseConfig,
          slot: dataSource.connectionConfig.slot || 0,
          tagName: tag.address,
        };

      case 's7':
      case 'siemens':
        return {
          ...baseConfig,
          rack: dataSource.connectionConfig.rack || 0,
          slot: dataSource.connectionConfig.slot || 1,
          area: this.parseS7Area(tag.address),
          dbNumber: this.parseS7DbNumber(tag.address),
          offset: this.parseS7Offset(tag.address),
          dataType: tag.dataType,
        };

      case 'opcua':
      case 'opc_ua':
        return {
          ...baseConfig,
          endpoint: dataSource.connectionConfig.endpoint || `opc.tcp://${baseConfig.host}:${baseConfig.port}`,
          securityMode: dataSource.connectionConfig.securityMode || 'None',
          nodeId: tag.address,
        };

      default:
        return baseConfig;
    }
  }

  /**
   * Parse Modbus register type from address string
   * Examples: "40001" -> "holding", "30001" -> "input"
   */
  private parseModbusRegisterType(address: string): string {
    const addr = parseInt(address);
    if (addr >= 40001 && addr <= 49999) return 'holding';
    if (addr >= 30001 && addr <= 39999) return 'input';
    if (addr >= 10001 && addr <= 19999) return 'coil';
    if (addr >= 1 && addr <= 9999) return 'discrete';
    return 'holding'; // default
  }

  /**
   * Parse Modbus address (remove register type prefix)
   */
  private parseModbusAddress(address: string): number {
    const addr = parseInt(address);
    if (addr >= 40001) return addr - 40001;
    if (addr >= 30001) return addr - 30001;
    if (addr >= 10001) return addr - 10001;
    return addr;
  }

  /**
   * Get Modbus quantity based on data type
   */
  private getModbusQuantity(dataType: string): number {
    switch (dataType.toLowerCase()) {
      case 'float32':
      case 'int32':
      case 'uint32':
        return 2;
      case 'int16':
      case 'uint16':
      case 'boolean':
      default:
        return 1;
    }
  }

  /**
   * Parse S7 area from address string
   * Examples: "DB1.DBD0" -> "DB", "MW10" -> "M"
   */
  private parseS7Area(address: string): string {
    if (address.startsWith('DB')) return 'DB';
    if (address.startsWith('M')) return 'M';
    if (address.startsWith('I')) return 'I';
    if (address.startsWith('Q')) return 'Q';
    return 'DB'; // default
  }

  /**
   * Parse S7 DB number from address string
   * Example: "DB1.DBD0" -> 1
   */
  private parseS7DbNumber(address: string): number {
    const match = address.match(/DB(\d+)/);
    return match ? parseInt(match[1]) : 1;
  }

  /**
   * Parse S7 offset from address string
   * Example: "DB1.DBD0" -> 0, "MW10" -> 10
   */
  private parseS7Offset(address: string): number {
    const match = address.match(/[A-Z]+(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Get current configuration version
   */
  getCurrentVersion(): number {
    return this.currentVersion;
  }

  /**
   * Stop consuming configuration changes
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      if (this.consumer) {
        await this.consumer.disconnect();
        this.consumer = null;
      }

      this.isRunning = false;
      logger.info('Config Sync Service stopped');
    } catch (error) {
      logger.error('Error stopping Config Sync Service', error);
      throw error;
    }
  }
}

// Singleton instance
export const configSyncService = new ConfigSyncService();
