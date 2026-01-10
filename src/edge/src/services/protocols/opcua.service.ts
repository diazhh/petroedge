/**
 * OPC-UA Protocol Driver
 * Generic driver for any OPC-UA server
 */

import {
  OPCUAClient,
  MessageSecurityMode,
  SecurityPolicy,
  AttributeIds,
  ClientSession,
  ClientSubscription,
  DataValue,
} from 'node-opcua';
import { logger } from '../../utils/logger.js';
import {
  BaseProtocolDriver,
  TagConfig,
  TagValue,
  TagMetadata,
  ConnectionConfig,
  DataType,
} from './protocol-interface.js';

export interface OpcuaConfig extends ConnectionConfig {
  endpointUrl: string;
  securityMode?: 'None' | 'Sign' | 'SignAndEncrypt';
  securityPolicy?: string;
  username?: string;
  password?: string;
}

export class OpcuaService extends BaseProtocolDriver {
  private client: OPCUAClient;
  private session?: ClientSession;
  private subscription?: ClientSubscription;
  private config: OpcuaConfig;
  private reconnectTimer?: NodeJS.Timeout;

  constructor(config: OpcuaConfig) {
    super(config);
    this.config = config;

    const securityMode = this.mapSecurityMode(config.securityMode || 'None');
    const securityPolicy = config.securityPolicy || SecurityPolicy.None;

    this.client = OPCUAClient.create({
      applicationName: 'SCADA Edge Gateway',
      connectionStrategy: {
        initialDelay: 1000,
        maxRetry: 3,
      },
      securityMode,
      securityPolicy,
      endpointMustExist: false,
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect(this.config.endpointUrl);
      
      if (this.config.username && this.config.password) {
        this.session = await this.client.createSession({
          type: 1, // UserName
          userName: this.config.username,
          password: this.config.password,
        });
      } else {
        this.session = await this.client.createSession();
      }

      this.connected = true;
      logger.info(`OPC-UA connected to ${this.config.endpointUrl}`);
    } catch (error) {
      this.connected = false;
      this.recordError(error as Error);
      logger.error('OPC-UA connection failed', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = undefined;
      }

      if (this.subscription) {
        await this.subscription.terminate();
        this.subscription = undefined;
      }

      if (this.session) {
        await this.session.close();
        this.session = undefined;
      }

      await this.client.disconnect();
      this.connected = false;
      logger.info('OPC-UA disconnected');
    } catch (error) {
      logger.error('OPC-UA disconnect error', error);
      throw error;
    }
  }

  async readTag(tagConfig: TagConfig): Promise<TagValue> {
    if (!this.connected || !this.session) {
      throw new Error('OPC-UA not connected');
    }

    try {
      const nodeId = tagConfig.protocolConfig.nodeId;
      if (!nodeId) {
        throw new Error('Node ID is required for OPC-UA');
      }

      const dataValue = await this.session.read({
        nodeId,
        attributeId: AttributeIds.Value,
      });

      this.recordSuccess();

      const quality = this.mapOpcuaQuality(dataValue.statusCode.value);

      return {
        tagId: tagConfig.tagId,
        value: dataValue.value.value,
        quality,
        timestamp: dataValue.sourceTimestamp || new Date(),
        source: 'opcua',
      };
    } catch (error) {
      this.recordError(error as Error);
      logger.error(`Failed to read tag ${tagConfig.tagId}`, error);
      
      return {
        tagId: tagConfig.tagId,
        value: 0,
        quality: 'bad',
        timestamp: new Date(),
        source: 'opcua',
      };
    }
  }

  async readTags(tagConfigs: TagConfig[]): Promise<TagValue[]> {
    if (!this.connected || !this.session) {
      throw new Error('OPC-UA not connected');
    }

    try {
      const nodesToRead = tagConfigs.map(config => ({
        nodeId: config.protocolConfig.nodeId!,
        attributeId: AttributeIds.Value,
      }));

      const dataValues = await this.session.read(nodesToRead);

      this.recordSuccess();

      return tagConfigs.map((config, index) => {
        const dataValue = dataValues[index];
        const quality = this.mapOpcuaQuality(dataValue.statusCode.value);

        return {
          tagId: config.tagId,
          value: dataValue.value.value,
          quality,
          timestamp: dataValue.sourceTimestamp || new Date(),
          source: 'opcua',
        };
      });
    } catch (error) {
      this.recordError(error as Error);
      logger.error('Failed to read tag list', error);
      
      return tagConfigs.map(config => ({
        tagId: config.tagId,
        value: 0,
        quality: 'bad' as const,
        timestamp: new Date(),
        source: 'opcua',
      }));
    }
  }

  async writeTag(tagConfig: TagConfig, value: any): Promise<void> {
    if (!this.connected || !this.session) {
      throw new Error('OPC-UA not connected');
    }

    try {
      const nodeId = tagConfig.protocolConfig.nodeId;
      if (!nodeId) {
        throw new Error('Node ID is required for OPC-UA');
      }

      await this.session.write({
        nodeId,
        attributeId: AttributeIds.Value,
        value: {
          value: {
            dataType: this.mapDataTypeToOpcua(tagConfig.protocolConfig.dataType as DataType),
            value,
          },
        },
      });

      logger.info(`Wrote value ${value} to node ${nodeId}`);
    } catch (error) {
      this.recordError(error as Error);
      logger.error(`Failed to write tag ${tagConfig.tagId}`, error);
      throw error;
    }
  }

  async discoverTags(): Promise<TagMetadata[]> {
    if (!this.connected || !this.session) {
      throw new Error('OPC-UA not connected');
    }

    try {
      // Browse from Objects folder
      const browseResult = await this.session.browse('ns=0;i=85'); // ObjectsFolder
      
      const metadata: TagMetadata[] = [];
      
      for (const reference of browseResult.references || []) {
        metadata.push({
          tagId: reference.nodeId.toString(),
          name: reference.browseName.name || '',
          dataType: 'float32', // Default, would need to read actual type
          description: reference.displayName.text || '',
        });
      }

      logger.info(`Discovered ${metadata.length} nodes from OPC-UA server`);
      return metadata;
    } catch (error) {
      this.recordError(error as Error);
      logger.error('Failed to discover tags', error);
      return [];
    }
  }

  getProtocolName(): string {
    return 'OPC-UA';
  }

  protected async performHealthCheckPing(): Promise<void> {
    if (this.session) {
      try {
        // Read server status to check connection
        await this.session.read({
          nodeId: 'ns=0;i=2259', // Server_ServerStatus
          attributeId: AttributeIds.Value,
        });
      } catch (error) {
        // Ignore error, just checking connectivity
      }
    }
  }

  private mapSecurityMode(mode: string): MessageSecurityMode {
    switch (mode) {
      case 'Sign':
        return MessageSecurityMode.Sign;
      case 'SignAndEncrypt':
        return MessageSecurityMode.SignAndEncrypt;
      default:
        return MessageSecurityMode.None;
    }
  }

  private mapOpcuaQuality(statusCode: number): 'good' | 'bad' | 'uncertain' {
    // OPC-UA status codes: 0x00000000 = Good, 0x40000000 = Uncertain, 0x80000000 = Bad
    if (statusCode === 0) return 'good';
    if ((statusCode & 0x80000000) !== 0) return 'bad';
    if ((statusCode & 0x40000000) !== 0) return 'uncertain';
    return 'good';
  }

  private mapDataTypeToOpcua(dataType: DataType): number {
    // OPC-UA DataType enum values
    switch (dataType) {
      case 'boolean':
        return 1; // Boolean
      case 'int16':
        return 4; // Int16
      case 'uint16':
        return 5; // UInt16
      case 'int32':
        return 6; // Int32
      case 'uint32':
        return 7; // UInt32
      case 'float32':
        return 10; // Float
      case 'float64':
        return 11; // Double
      case 'string':
        return 12; // String
      default:
        return 10; // Default to Float
    }
  }

  /**
   * Enable automatic reconnection
   */
  enableAutoReconnect(intervalMs: number = 5000): void {
    this.reconnectTimer = setInterval(async () => {
      if (!this.connected) {
        logger.info('Attempting to reconnect to OPC-UA...');
        try {
          await this.connect();
        } catch (error) {
          logger.warn('Reconnection failed, will retry');
        }
      }
    }, intervalMs);
  }

  /**
   * Create a subscription for monitoring data changes (alternative to polling)
   */
  async createSubscription(tagConfigs: TagConfig[], callback: (tagValue: TagValue) => void): Promise<void> {
    if (!this.connected || !this.session) {
      throw new Error('OPC-UA not connected');
    }

    try {
      this.subscription = await this.session.createSubscription2({
        requestedPublishingInterval: 1000,
        requestedLifetimeCount: 100,
        requestedMaxKeepAliveCount: 10,
        maxNotificationsPerPublish: 100,
        publishingEnabled: true,
        priority: 10,
      });

      for (const tagConfig of tagConfigs) {
        const nodeId = tagConfig.protocolConfig.nodeId;
        if (!nodeId) continue;

        const monitoredItem = await this.subscription.monitor(
          {
            nodeId,
            attributeId: AttributeIds.Value,
          },
          {
            samplingInterval: tagConfig.scanRate || 1000,
            discardOldest: true,
            queueSize: 10,
          },
          0 // TimestampsToReturn.Both
        );

        (monitoredItem as any).on('changed', (dataValue: DataValue) => {
          const quality = this.mapOpcuaQuality(dataValue.statusCode.value);
          callback({
            tagId: tagConfig.tagId,
            value: dataValue.value.value,
            quality,
            timestamp: dataValue.sourceTimestamp || new Date(),
            source: 'opcua',
          });
        });
      }

      logger.info(`Created OPC-UA subscription for ${tagConfigs.length} tags`);
    } catch (error) {
      this.recordError(error as Error);
      logger.error('Failed to create subscription', error);
      throw error;
    }
  }
}
