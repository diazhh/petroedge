import { dataSourcesRepository } from './data-sources.repository.js';
import {
  CreateDataSourceRequest,
  UpdateDataSourceRequest,
  CreateDataSourceTagRequest,
  UpdateDataSourceTagRequest,
  DataSource,
  DataSourceTag,
  DataSourceWithTags,
  DataSourceHealthMetrics,
} from './data-sources.types.js';

export class DataSourcesService {
  // ==================== Data Sources ====================

  async listDataSources(
    tenantId: string,
    filters: {
      edgeGatewayId?: string;
      protocol?: string;
      status?: string;
      enabled?: boolean;
    },
    pagination: { page: number; perPage: number }
  ) {
    return dataSourcesRepository.findAll(tenantId, filters, pagination);
  }

  async getDataSource(id: string, tenantId: string): Promise<DataSource> {
    const dataSource = await dataSourcesRepository.findById(id, tenantId);
    if (!dataSource) {
      throw new Error('Data source not found');
    }
    return dataSource;
  }

  async getDataSourceWithTags(id: string, tenantId: string): Promise<DataSourceWithTags> {
    const dataSource = await dataSourcesRepository.findByIdWithTags(id, tenantId);
    if (!dataSource) {
      throw new Error('Data source not found');
    }
    return dataSource;
  }

  async createDataSource(
    tenantId: string,
    userId: string,
    data: CreateDataSourceRequest
  ): Promise<DataSource> {
    const newDataSource = await dataSourcesRepository.create({
      tenantId,
      edgeGatewayId: data.edgeGatewayId,
      name: data.name,
      description: data.description,
      protocol: data.protocol,
      connectionConfig: data.connectionConfig,
      enabled: data.enabled ?? true,
      scanRate: data.scanRate ?? 5000,
      tags: data.tags,
      metadata: data.metadata,
      status: 'INACTIVE',
      createdBy: userId,
    });

    return newDataSource;
  }

  async updateDataSource(
    id: string,
    tenantId: string,
    data: UpdateDataSourceRequest
  ): Promise<DataSource> {
    await this.getDataSource(id, tenantId);

    const updated = await dataSourcesRepository.update(id, tenantId, {
      name: data.name,
      description: data.description,
      connectionConfig: data.connectionConfig,
      enabled: data.enabled,
      scanRate: data.scanRate,
      tags: data.tags,
      metadata: data.metadata,
    });

    if (!updated) {
      throw new Error('Failed to update data source');
    }

    return updated;
  }

  async deleteDataSource(id: string, tenantId: string): Promise<void> {
    await this.getDataSource(id, tenantId);
    const deleted = await dataSourcesRepository.delete(id, tenantId);
    if (!deleted) {
      throw new Error('Failed to delete data source');
    }
  }

  async getDataSourceHealth(id: string, tenantId: string): Promise<DataSourceHealthMetrics> {
    const dataSource = await this.getDataSource(id, tenantId);
    const tags = await dataSourcesRepository.findTagsByDataSourceId(
      id,
      tenantId,
      {},
      { page: 1, perPage: 1000 }
    );

    const enabledTags = tags.data.filter((tag) => tag.enabled);

    return {
      status: dataSource.status,
      lastSuccessfulRead: dataSource.lastSuccessfulRead || undefined,
      lastError: dataSource.lastError || undefined,
      lastErrorAt: dataSource.lastErrorAt || undefined,
      errorCount: dataSource.errorCount || 0,
      avgLatencyMs: dataSource.avgLatencyMs || undefined,
      successRate: dataSource.successRate ? parseFloat(dataSource.successRate) : undefined,
      connectedTagsCount: enabledTags.length,
      totalTagsCount: tags.total,
    };
  }

  // ==================== Data Source Tags ====================

  async listDataSourceTags(
    dataSourceId: string,
    tenantId: string,
    filters: {
      assetId?: string;
      enabled?: boolean;
    },
    pagination: { page: number; perPage: number }
  ) {
    await this.getDataSource(dataSourceId, tenantId);
    return dataSourcesRepository.findTagsByDataSourceId(
      dataSourceId,
      tenantId,
      filters,
      pagination
    );
  }

  async getDataSourceTag(id: string, tenantId: string): Promise<DataSourceTag> {
    const tag = await dataSourcesRepository.findTagById(id, tenantId);
    if (!tag) {
      throw new Error('Data source tag not found');
    }
    return tag;
  }

  async createDataSourceTag(
    dataSourceId: string,
    tenantId: string,
    userId: string,
    data: CreateDataSourceTagRequest
  ): Promise<DataSourceTag> {
    await this.getDataSource(dataSourceId, tenantId);

    const existing = await dataSourcesRepository.findTagByTagId(
      dataSourceId,
      data.tagId,
      tenantId
    );
    if (existing) {
      throw new Error('Tag ID already exists in this data source');
    }

    const newTag = await dataSourcesRepository.createTag({
      tenantId,
      dataSourceId,
      tagId: data.tagId,
      name: data.name,
      description: data.description,
      assetId: data.assetId,
      telemetryKey: data.telemetryKey,
      protocolConfig: data.protocolConfig,
      dataType: data.dataType,
      unit: data.unit,
      scaleFactor: data.scaleFactor?.toString(),
      offset: data.offset?.toString(),
      deadband: data.deadband?.toString(),
      minValue: data.minValue?.toString(),
      maxValue: data.maxValue?.toString(),
      scanRate: data.scanRate,
      enabled: data.enabled ?? true,
      tags: data.tags,
      metadata: data.metadata,
      createdBy: userId,
    });

    return newTag;
  }

  async updateDataSourceTag(
    id: string,
    tenantId: string,
    data: UpdateDataSourceTagRequest
  ): Promise<DataSourceTag> {
    await this.getDataSourceTag(id, tenantId);

    const updated = await dataSourcesRepository.updateTag(id, tenantId, {
      name: data.name,
      description: data.description,
      assetId: data.assetId,
      telemetryKey: data.telemetryKey,
      protocolConfig: data.protocolConfig,
      dataType: data.dataType,
      unit: data.unit,
      scaleFactor: data.scaleFactor?.toString(),
      offset: data.offset?.toString(),
      deadband: data.deadband?.toString(),
      minValue: data.minValue?.toString(),
      maxValue: data.maxValue?.toString(),
      scanRate: data.scanRate,
      enabled: data.enabled,
      tags: data.tags,
      metadata: data.metadata,
    });

    if (!updated) {
      throw new Error('Failed to update data source tag');
    }

    return updated;
  }

  async deleteDataSourceTag(id: string, tenantId: string): Promise<void> {
    await this.getDataSourceTag(id, tenantId);
    const deleted = await dataSourcesRepository.deleteTag(id, tenantId);
    if (!deleted) {
      throw new Error('Failed to delete data source tag');
    }
  }

  async createDataSourceTagsBatch(
    dataSourceId: string,
    tenantId: string,
    userId: string,
    tags: CreateDataSourceTagRequest[]
  ): Promise<DataSourceTag[]> {
    await this.getDataSource(dataSourceId, tenantId);

    const newTags = tags.map((tag) => ({
      tenantId,
      dataSourceId,
      tagId: tag.tagId,
      name: tag.name,
      description: tag.description,
      assetId: tag.assetId,
      telemetryKey: tag.telemetryKey,
      protocolConfig: tag.protocolConfig,
      dataType: tag.dataType,
      unit: tag.unit,
      scaleFactor: tag.scaleFactor?.toString(),
      offset: tag.offset?.toString(),
      deadband: tag.deadband?.toString(),
      minValue: tag.minValue?.toString(),
      maxValue: tag.maxValue?.toString(),
      scanRate: tag.scanRate,
      enabled: tag.enabled ?? true,
      tags: tag.tags,
      metadata: tag.metadata,
      createdBy: userId,
    }));

    return dataSourcesRepository.createTagsBatch(newTags);
  }
}

export const dataSourcesService = new DataSourcesService();
