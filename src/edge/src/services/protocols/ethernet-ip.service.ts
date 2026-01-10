/**
 * EtherNet/IP Protocol Driver for Allen-Bradley PLCs
 * Supports ControlLogix, CompactLogix, Micro800 series
 */

import { Controller, Tag, TagList } from 'ethernet-ip';
import { logger } from '../../utils/logger.js';
import {
  BaseProtocolDriver,
  TagConfig,
  TagValue,
  TagMetadata,
  ConnectionConfig,
  DataType,
} from './protocol-interface.js';

export interface EthernetIpConfig extends ConnectionConfig {
  slot?: number; // PLC slot number (default: 0)
}

export class EthernetIpService extends BaseProtocolDriver {
  private controller: Controller;
  private config: EthernetIpConfig;
  private reconnectTimer?: NodeJS.Timeout;

  constructor(config: EthernetIpConfig) {
    super(config);
    this.config = config;
    this.controller = new Controller();
  }

  async connect(): Promise<void> {
    try {
      const slot = this.config.slot ?? 0;
      await this.controller.connect(this.config.host, slot);
      this.connected = true;
      logger.info(`EtherNet/IP connected to ${this.config.host}:${slot}`);
    } catch (error) {
      this.connected = false;
      this.recordError(error as Error);
      logger.error('EtherNet/IP connection failed', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = undefined;
      }
      await this.controller.destroy();
      this.connected = false;
      logger.info('EtherNet/IP disconnected');
    } catch (error) {
      logger.error('EtherNet/IP disconnect error', error);
      throw error;
    }
  }

  async readTag(tagConfig: TagConfig): Promise<TagValue> {
    if (!this.connected) {
      throw new Error('EtherNet/IP not connected');
    }

    try {
      const tagName = tagConfig.protocolConfig.tagName;
      if (!tagName) {
        throw new Error('Tag name is required for EtherNet/IP');
      }

      const tag = new Tag(tagName);
      await this.controller.readTag(tag);

      this.recordSuccess();

      return {
        tagId: tagConfig.tagId,
        value: tag.value,
        quality: 'good',
        timestamp: new Date(),
        source: 'ethernet-ip',
      };
    } catch (error) {
      this.recordError(error as Error);
      logger.error(`Failed to read tag ${tagConfig.tagId}`, error);
      
      return {
        tagId: tagConfig.tagId,
        value: 0,
        quality: 'bad',
        timestamp: new Date(),
        source: 'ethernet-ip',
      };
    }
  }

  async readTags(tagConfigs: TagConfig[]): Promise<TagValue[]> {
    if (!this.connected) {
      throw new Error('EtherNet/IP not connected');
    }

    try {
      // Create tag list for batch reading
      const tagList = new TagList();
      const tagMap = new Map<string, TagConfig>();

      for (const config of tagConfigs) {
        const tagName = config.protocolConfig.tagName;
        if (tagName) {
          const tag = new Tag(tagName);
          tagList.add(tag);
          tagMap.set(tagName, config);
        }
      }

      // Read all tags in one operation
      await this.controller.readTagList(tagList);

      this.recordSuccess();

      // Map results back to TagValue format
      const results: TagValue[] = [];
      for (const tag of tagList) {
        const config = tagMap.get(tag.name);
        if (config) {
          results.push({
            tagId: config.tagId,
            value: tag.value,
            quality: 'good',
            timestamp: new Date(),
            source: 'ethernet-ip',
          });
        }
      }

      return results;
    } catch (error) {
      this.recordError(error as Error);
      logger.error('Failed to read tag list', error);
      
      // Return bad quality for all tags
      return tagConfigs.map(config => ({
        tagId: config.tagId,
        value: 0,
        quality: 'bad' as const,
        timestamp: new Date(),
        source: 'ethernet-ip',
      }));
    }
  }

  async writeTag(tagConfig: TagConfig, value: any): Promise<void> {
    if (!this.connected) {
      throw new Error('EtherNet/IP not connected');
    }

    try {
      const tagName = tagConfig.protocolConfig.tagName;
      if (!tagName) {
        throw new Error('Tag name is required for EtherNet/IP');
      }

      const tag = new Tag(tagName, null, value);
      await this.controller.writeTag(tag);

      logger.info(`Wrote value ${value} to tag ${tagName}`);
    } catch (error) {
      this.recordError(error as Error);
      logger.error(`Failed to write tag ${tagConfig.tagId}`, error);
      throw error;
    }
  }

  async discoverTags(): Promise<TagMetadata[]> {
    if (!this.connected) {
      throw new Error('EtherNet/IP not connected');
    }

    try {
      // Get tag list from PLC
      const tagList = await this.controller.getControllerTagList();
      
      const metadata: TagMetadata[] = tagList.map((tag: any) => ({
        tagId: tag.name,
        name: tag.name,
        dataType: this.mapEipDataType(tag.type),
        description: tag.name,
      }));

      logger.info(`Discovered ${metadata.length} tags from PLC`);
      return metadata;
    } catch (error) {
      this.recordError(error as Error);
      logger.error('Failed to discover tags', error);
      return [];
    }
  }

  getProtocolName(): string {
    return 'EtherNet/IP';
  }

  protected async performHealthCheckPing(): Promise<void> {
    // Read a dummy tag to check connection
    const testTag = new Tag('Program:MainProgram.Test', null);
    try {
      await this.controller.readTag(testTag);
    } catch (error) {
      // Ignore error, just checking connectivity
    }
  }

  private mapEipDataType(eipType: number): DataType {
    // EtherNet/IP type codes
    switch (eipType) {
      case 0xC1: // BOOL
        return 'boolean';
      case 0xC2: // SINT
      case 0xC3: // INT
        return 'int16';
      case 0xC4: // DINT
        return 'int32';
      case 0xCA: // REAL
        return 'float32';
      case 0xCB: // LREAL
        return 'float64';
      case 0xD0: // STRING
        return 'string';
      default:
        return 'float32'; // Default
    }
  }

  /**
   * Enable automatic reconnection
   */
  enableAutoReconnect(intervalMs: number = 5000): void {
    this.reconnectTimer = setInterval(async () => {
      if (!this.connected) {
        logger.info('Attempting to reconnect to EtherNet/IP...');
        try {
          await this.connect();
        } catch (error) {
          logger.warn('Reconnection failed, will retry');
        }
      }
    }, intervalMs);
  }
}
