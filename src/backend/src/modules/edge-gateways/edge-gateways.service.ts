/**
 * Edge Gateways Module - Service Layer
 * 
 * Business logic for Edge Gateway management.
 */

import { EdgeGatewaysRepository } from './edge-gateways.repository.js';
import {
  CreateEdgeGatewayDTO,
  UpdateEdgeGatewayDTO,
  EdgeGatewayFilters,
  EdgeGatewayWithRelations,
  EdgeGatewayStats,
  EdgeGatewayHeartbeat,
  EdgeGatewayConfig,
  EdgeGatewayStatus,
} from './edge-gateways.types.js';

export class EdgeGatewaysService {
  private repository: EdgeGatewaysRepository;

  constructor() {
    this.repository = new EdgeGatewaysRepository();
  }

  /**
   * Get all edge gateways with filters and pagination
   */
  async findAll(
    tenantId: string,
    filters: EdgeGatewayFilters = {},
    page: number = 1,
    perPage: number = 20,
    includeSources: boolean = false,
    includeAsset: boolean = false
  ): Promise<{
    gateways: EdgeGatewayWithRelations[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    const { gateways, total } = await this.repository.findAll({
      tenantId,
      filters,
      page,
      perPage,
      includeSources,
      includeAsset,
    });

    return {
      gateways,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  /**
   * Get edge gateway by ID
   */
  async findById(
    id: string,
    tenantId: string,
    includeSources: boolean = false,
    includeAsset: boolean = false
  ): Promise<EdgeGatewayWithRelations> {
    const gateway = await this.repository.findById(id, tenantId, {
      includeSources,
      includeAsset,
    });

    if (!gateway) {
      throw new Error('EDGE_GATEWAY_NOT_FOUND');
    }

    return gateway;
  }

  /**
   * Create new edge gateway
   */
  async create(
    tenantId: string,
    userId: string,
    data: CreateEdgeGatewayDTO
  ): Promise<EdgeGatewayWithRelations> {
    // Check if name already exists
    const existing = await this.repository.findByName(data.name, tenantId);
    if (existing) {
      throw new Error('EDGE_GATEWAY_NAME_EXISTS');
    }

    // Generate unique gatewayId if not provided
    const gatewayId = `gw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const gateway = await this.repository.create({
      tenantId,
      gatewayId,
      name: data.name,
      description: data.description || null,
      location: data.location || null,
      siteId: data.assetId || null,
      ipAddress: data.ipAddress || null,
      port: 3001,
      status: 'OFFLINE',
      config: data.connectionConfig,
      tags: data.tags || null,
      metadata: data.metadata || null,
      createdBy: userId,
    });

    return gateway;
  }

  /**
   * Update edge gateway
   */
  async update(
    id: string,
    tenantId: string,
    data: UpdateEdgeGatewayDTO
  ): Promise<EdgeGatewayWithRelations> {
    // Check if gateway exists
    const existing = await this.repository.findById(id, tenantId);
    if (!existing) {
      throw new Error('EDGE_GATEWAY_NOT_FOUND');
    }

    // Check if new name conflicts with another gateway
    if (data.name && data.name !== existing.name) {
      const nameExists = await this.repository.findByName(data.name, tenantId);
      if (nameExists && nameExists.id !== id) {
        throw new Error('EDGE_GATEWAY_NAME_EXISTS');
      }
    }

    const updated = await this.repository.update(id, tenantId, {
      name: data.name,
      description: data.description,
      location: data.location,
      siteId: data.assetId,
      ipAddress: data.ipAddress,
      status: data.status,
      config: data.connectionConfig,
      tags: data.tags,
      metadata: data.metadata,
    });

    if (!updated) {
      throw new Error('EDGE_GATEWAY_UPDATE_FAILED');
    }

    return updated;
  }

  /**
   * Delete edge gateway
   */
  async delete(id: string, tenantId: string): Promise<void> {
    const gateway = await this.repository.findById(id, tenantId);
    if (!gateway) {
      throw new Error('EDGE_GATEWAY_NOT_FOUND');
    }

    const deleted = await this.repository.delete(id, tenantId);
    if (!deleted) {
      throw new Error('EDGE_GATEWAY_DELETE_FAILED');
    }
  }

  /**
   * Process heartbeat from edge gateway
   */
  async processHeartbeat(heartbeat: EdgeGatewayHeartbeat): Promise<void> {
    const gateway = await this.repository.findById(
      heartbeat.gatewayId,
      '' // We need to get tenantId from the gateway itself
    );

    if (!gateway) {
      throw new Error('EDGE_GATEWAY_NOT_FOUND');
    }

    // Update heartbeat timestamp
    await this.repository.updateHeartbeat(heartbeat.gatewayId, gateway.tenantId);

    // Update status if changed
    if (heartbeat.status !== gateway.status) {
      await this.repository.updateStatus(
        heartbeat.gatewayId,
        gateway.tenantId,
        heartbeat.status
      );
    }

    // TODO: Store metrics in time-series database
    // TODO: Check for alerts/alarms based on metrics
  }

  /**
   * Get gateway configuration for edge device
   */
  async getConfiguration(gatewayId: string): Promise<EdgeGatewayConfig> {
    // Find gateway by gatewayId (not UUID)
    const [gateway] = await this.repository.findAll({
      tenantId: '', // We need to handle this differently
      filters: {},
      page: 1,
      perPage: 1,
    });

    if (!gateway) {
      throw new Error('EDGE_GATEWAY_NOT_FOUND');
    }

    // Get all data sources for this gateway
    const gatewayWithSources = await this.repository.findById(
      gateway.gateways[0].id,
      gateway.gateways[0].tenantId,
      { includeSources: true }
    );

    return {
      gatewayId,
      version: 1, // TODO: Implement versioning
      dataSources: gatewayWithSources?.dataSources || [],
      settings: {
        scanRate: 5000,
        bufferSize: 1000,
        reconnectInterval: 30000,
        logLevel: 'info',
      },
      updatedAt: new Date(),
    };
  }

  /**
   * Get gateway statistics
   */
  async getStats(tenantId: string): Promise<EdgeGatewayStats> {
    return this.repository.getStats(tenantId);
  }

  /**
   * Check for stale gateways and mark them as offline
   */
  async checkStaleGateways(tenantId: string, minutesThreshold: number = 5): Promise<void> {
    const staleGateways = await this.repository.findStaleGateways(tenantId, minutesThreshold);

    if (staleGateways.length > 0) {
      const gatewayIds = staleGateways.map((g) => g.id);
      await this.repository.bulkUpdateStatus(gatewayIds, tenantId, EdgeGatewayStatus.OFFLINE);
    }
  }

  /**
   * Get gateway health metrics
   */
  async getHealth(id: string, tenantId: string) {
    const gateway = await this.repository.findById(id, tenantId, { includeSources: true });

    if (!gateway) {
      throw new Error('EDGE_GATEWAY_NOT_FOUND');
    }

    const now = new Date();
    const lastHeartbeat = gateway.lastHeartbeat ? new Date(gateway.lastHeartbeat) : null;
    const uptime = lastHeartbeat
      ? Math.floor((now.getTime() - lastHeartbeat.getTime()) / 1000)
      : 0;

    return {
      gatewayId: gateway.id,
      status: gateway.status,
      lastHeartbeat: lastHeartbeat,
      uptime,
      cpuUsage: 0, // TODO: Get from metrics
      memoryUsage: 0, // TODO: Get from metrics
      diskUsage: 0, // TODO: Get from metrics
      networkLatency: 0, // TODO: Get from metrics
      dataSourcesCount: gateway.dataSources?.length || 0,
      activeDataSourcesCount:
        gateway.dataSources?.filter((ds: any) => ds.status === 'ACTIVE').length || 0,
      errorCount: 0, // TODO: Get from metrics
      lastError: undefined,
    };
  }
}
