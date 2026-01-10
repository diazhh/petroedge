/**
 * Config Sync Service
 * 
 * Handles configuration synchronization between Cloud and Edge Gateways via Kafka.
 * Publishes configuration changes to Kafka topics for Edge devices to consume.
 */

import { kafkaService } from '../../common/kafka/kafka.service.js';
import { logger } from '../../common/utils/logger.js';
import { EdgeGatewaysRepository } from './edge-gateways.repository.js';
import { DataSourcesRepository } from '../data-sources/data-sources.repository.js';
import { EdgeGatewayConfig } from './edge-gateways.types.js';

export class ConfigSyncService {
  private repository: EdgeGatewaysRepository;
  private dataSourcesRepository: DataSourcesRepository;
  private configVersions: Map<string, number> = new Map();

  constructor() {
    this.repository = new EdgeGatewaysRepository();
    this.dataSourcesRepository = new DataSourcesRepository();
  }

  /**
   * Get full configuration for an Edge Gateway
   */
  async getConfiguration(gatewayId: string, tenantId: string): Promise<EdgeGatewayConfig> {
    // Get gateway details
    const gateway = await this.repository.findById(gatewayId, tenantId);
    if (!gateway) {
      throw new Error('EDGE_GATEWAY_NOT_FOUND');
    }

    // Get all data sources for this gateway
    const dataSourcesResult = await this.dataSourcesRepository.findAll(
      tenantId,
      { edgeGatewayId: gatewayId },
      { page: 1, perPage: 1000 }
    );
    const dataSources = dataSourcesResult.data;

    // Get tags for each data source
    const dataSourcesWithTags = await Promise.all(
      dataSources.map(async (ds) => {
        const tagsResult = await this.dataSourcesRepository.findTagsByDataSourceId(
          ds.id,
          tenantId,
          {},
          { page: 1, perPage: 1000 }
        );
        return {
          ...ds,
          tags: tagsResult.data,
        };
      })
    );

    // Get or increment version
    const currentVersion = this.configVersions.get(gatewayId) || 0;
    const newVersion = currentVersion + 1;
    this.configVersions.set(gatewayId, newVersion);

    const config: EdgeGatewayConfig = {
      gatewayId,
      version: newVersion,
      dataSources: dataSourcesWithTags,
      settings: {
        scanRate: 1000, // Default 1 second
        bufferSize: 1000,
        reconnectInterval: 5000,
        logLevel: 'info',
      },
      updatedAt: new Date(),
    };

    return config;
  }

  /**
   * Publish configuration change to Kafka
   */
  async publishConfigChange(gatewayId: string, tenantId: string): Promise<void> {
    try {
      const config = await this.getConfiguration(gatewayId, tenantId);

      await kafkaService.publish(
        'edge.config.changed',
        {
          gatewayId,
          tenantId,
          version: config.version,
          config,
          timestamp: new Date().toISOString(),
        },
        gatewayId // Use gatewayId as message key for partitioning
      );

      logger.info(`Configuration published to Kafka for gateway: ${gatewayId}`, {
        version: config.version,
        dataSourcesCount: config.dataSources.length,
      });
    } catch (error) {
      logger.error(`Failed to publish config change for gateway: ${gatewayId}`, error);
      throw error;
    }
  }

  /**
   * Publish configuration change for all gateways of a tenant
   */
  async publishConfigChangeForTenant(tenantId: string): Promise<void> {
    try {
      const { gateways } = await this.repository.findAll({
        tenantId,
        page: 1,
        perPage: 1000,
      });

      await Promise.all(
        gateways.map((gateway) => this.publishConfigChange(gateway.id, tenantId))
      );

      logger.info(`Configuration published for all gateways in tenant: ${tenantId}`, {
        count: gateways.length,
      });
    } catch (error) {
      logger.error(`Failed to publish config changes for tenant: ${tenantId}`, error);
      throw error;
    }
  }

  /**
   * Publish data source configuration change
   */
  async publishDataSourceChange(
    dataSourceId: string,
    tenantId: string,
    action: 'created' | 'updated' | 'deleted'
  ): Promise<void> {
    try {
      const dataSource = await this.dataSourcesRepository.findById(dataSourceId, tenantId);
      if (!dataSource) {
        throw new Error('DATA_SOURCE_NOT_FOUND');
      }

      // Publish full config for the gateway
      await this.publishConfigChange(dataSource.edgeGatewayId, tenantId);

      logger.info(`Data source ${action} - config published`, {
        dataSourceId,
        gatewayId: dataSource.edgeGatewayId,
        action,
      });
    } catch (error) {
      logger.error(`Failed to publish data source change: ${dataSourceId}`, error);
      throw error;
    }
  }

  /**
   * Publish tag configuration change
   */
  async publishTagChange(
    tagId: string,
    dataSourceId: string,
    tenantId: string,
    action: 'created' | 'updated' | 'deleted'
  ): Promise<void> {
    try {
      const dataSource = await this.dataSourcesRepository.findById(dataSourceId, tenantId);
      if (!dataSource) {
        throw new Error('DATA_SOURCE_NOT_FOUND');
      }

      // Publish full config for the gateway
      await this.publishConfigChange(dataSource.edgeGatewayId, tenantId);

      logger.info(`Tag ${action} - config published`, {
        tagId,
        dataSourceId,
        gatewayId: dataSource.edgeGatewayId,
        action,
      });
    } catch (error) {
      logger.error(`Failed to publish tag change: ${tagId}`, error);
      throw error;
    }
  }

  /**
   * Get current configuration version for a gateway
   */
  getConfigVersion(gatewayId: string): number {
    return this.configVersions.get(gatewayId) || 0;
  }

  /**
   * Reset configuration version for a gateway
   */
  resetConfigVersion(gatewayId: string): void {
    this.configVersions.delete(gatewayId);
  }

  /**
   * Initialize config sync service
   */
  async initialize(): Promise<void> {
    try {
      // Ensure Kafka producer is initialized
      if (!kafkaService.getProducer()) {
        await kafkaService.initProducer();
      }

      // Create config sync topic if it doesn't exist
      await kafkaService.createTopics([
        {
          topic: 'edge.config.changed',
          numPartitions: 6,
          replicationFactor: 1,
        },
      ]);

      logger.info('Config Sync Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Config Sync Service', error);
      throw error;
    }
  }

  /**
   * Shutdown config sync service
   */
  async shutdown(): Promise<void> {
    try {
      this.configVersions.clear();
      logger.info('Config Sync Service shutdown complete');
    } catch (error) {
      logger.error('Error during Config Sync Service shutdown', error);
      throw error;
    }
  }
}

// Singleton instance
export const configSyncService = new ConfigSyncService();
