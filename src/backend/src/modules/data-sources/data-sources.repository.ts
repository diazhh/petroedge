import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../../common/database/index.js';
import { 
  dataSources, 
  dataSourceTags,
  NewDataSource, 
  NewDataSourceTag 
} from '../../common/database/schema.js';
import { 
  DataSource, 
  DataSourceTag, 
  DataSourceWithTags 
} from './data-sources.types.js';

export class DataSourcesRepository {
  // ==================== Data Sources ====================
  
  async findAll(
    tenantId: string,
    filters: {
      edgeGatewayId?: string;
      protocol?: string;
      status?: string;
      enabled?: boolean;
    },
    pagination: { page: number; perPage: number }
  ): Promise<{ data: DataSource[]; total: number }> {
    const conditions = [eq(dataSources.tenantId, tenantId)];
    
    if (filters.edgeGatewayId) {
      conditions.push(eq(dataSources.edgeGatewayId, filters.edgeGatewayId));
    }
    if (filters.protocol) {
      conditions.push(eq(dataSources.protocol, filters.protocol as any));
    }
    if (filters.status) {
      conditions.push(eq(dataSources.status, filters.status as any));
    }
    if (filters.enabled !== undefined) {
      conditions.push(eq(dataSources.enabled, filters.enabled));
    }

    const offset = (pagination.page - 1) * pagination.perPage;

    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(dataSources)
        .where(and(...conditions))
        .orderBy(desc(dataSources.createdAt))
        .limit(pagination.perPage)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(dataSources)
        .where(and(...conditions)),
    ]);

    return {
      data,
      total: countResult[0]?.count || 0,
    };
  }

  async findById(id: string, tenantId: string): Promise<DataSource | null> {
    const result = await db
      .select()
      .from(dataSources)
      .where(and(eq(dataSources.id, id), eq(dataSources.tenantId, tenantId)))
      .limit(1);

    return result[0] || null;
  }

  async findByIdWithTags(id: string, tenantId: string): Promise<DataSourceWithTags | null> {
    const dataSource = await this.findById(id, tenantId);
    if (!dataSource) return null;

    const tags = await db
      .select()
      .from(dataSourceTags)
      .where(eq(dataSourceTags.dataSourceId, id));

    return {
      ...dataSource,
      tags: dataSource.tags || [],
      dataSourceTags: tags,
      tagCount: tags.length,
    };
  }

  async create(data: NewDataSource): Promise<DataSource> {
    const result = await db
      .insert(dataSources)
      .values(data)
      .returning();

    return result[0];
  }

  async update(
    id: string,
    tenantId: string,
    data: Partial<NewDataSource>
  ): Promise<DataSource | null> {
    const result = await db
      .update(dataSources)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(dataSources.id, id), eq(dataSources.tenantId, tenantId)))
      .returning();

    return result[0] || null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(dataSources)
      .where(and(eq(dataSources.id, id), eq(dataSources.tenantId, tenantId)))
      .returning({ id: dataSources.id });

    return result.length > 0;
  }

  async updateHealthMetrics(
    id: string,
    metrics: {
      lastSuccessfulRead?: Date;
      lastError?: string;
      lastErrorAt?: Date;
      errorCount?: number;
      avgLatencyMs?: number;
      successRate?: number;
    }
  ): Promise<void> {
    const updateData: any = { ...metrics };
    if (metrics.successRate !== undefined) {
      updateData.successRate = metrics.successRate.toString();
    }
    
    await db
      .update(dataSources)
      .set(updateData)
      .where(eq(dataSources.id, id));
  }

  // ==================== Data Source Tags ====================

  async findTagsByDataSourceId(
    dataSourceId: string,
    tenantId: string,
    filters: {
      assetId?: string;
      enabled?: boolean;
    },
    pagination: { page: number; perPage: number }
  ): Promise<{ data: DataSourceTag[]; total: number }> {
    const conditions = [
      eq(dataSourceTags.dataSourceId, dataSourceId),
      eq(dataSourceTags.tenantId, tenantId),
    ];

    if (filters.assetId) {
      conditions.push(eq(dataSourceTags.assetId, filters.assetId));
    }
    if (filters.enabled !== undefined) {
      conditions.push(eq(dataSourceTags.enabled, filters.enabled));
    }

    const offset = (pagination.page - 1) * pagination.perPage;

    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(dataSourceTags)
        .where(and(...conditions))
        .orderBy(desc(dataSourceTags.createdAt))
        .limit(pagination.perPage)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(dataSourceTags)
        .where(and(...conditions)),
    ]);

    return {
      data,
      total: countResult[0]?.count || 0,
    };
  }

  async findTagById(id: string, tenantId: string): Promise<DataSourceTag | null> {
    const result = await db
      .select()
      .from(dataSourceTags)
      .where(and(eq(dataSourceTags.id, id), eq(dataSourceTags.tenantId, tenantId)))
      .limit(1);

    return result[0] || null;
  }

  async findTagByTagId(
    dataSourceId: string,
    tagId: string,
    tenantId: string
  ): Promise<DataSourceTag | null> {
    const result = await db
      .select()
      .from(dataSourceTags)
      .where(
        and(
          eq(dataSourceTags.dataSourceId, dataSourceId),
          eq(dataSourceTags.tagId, tagId),
          eq(dataSourceTags.tenantId, tenantId)
        )
      )
      .limit(1);

    return result[0] || null;
  }

  async createTag(data: NewDataSourceTag): Promise<DataSourceTag> {
    const result = await db
      .insert(dataSourceTags)
      .values(data)
      .returning();

    return result[0];
  }

  async updateTag(
    id: string,
    tenantId: string,
    data: Partial<NewDataSourceTag>
  ): Promise<DataSourceTag | null> {
    const result = await db
      .update(dataSourceTags)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(dataSourceTags.id, id), eq(dataSourceTags.tenantId, tenantId)))
      .returning();

    return result[0] || null;
  }

  async deleteTag(id: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(dataSourceTags)
      .where(and(eq(dataSourceTags.id, id), eq(dataSourceTags.tenantId, tenantId)))
      .returning({ id: dataSourceTags.id });

    return result.length > 0;
  }

  async updateTagValue(
    id: string,
    value: any,
    quality: 'GOOD' | 'BAD' | 'UNCERTAIN' | 'SIMULATED'
  ): Promise<void> {
    await db
      .update(dataSourceTags)
      .set({
        currentValue: value,
        currentQuality: quality,
        lastReadAt: new Date(),
      })
      .where(eq(dataSourceTags.id, id));
  }

  // ==================== Batch Operations ====================

  async createTagsBatch(tags: NewDataSourceTag[]): Promise<DataSourceTag[]> {
    if (tags.length === 0) return [];

    const result = await db
      .insert(dataSourceTags)
      .values(tags)
      .returning();

    return result;
  }

  async getTagsForSync(edgeGatewayId: string, tenantId: string): Promise<DataSourceTag[]> {
    const result = await db
      .select({
        tag: dataSourceTags,
      })
      .from(dataSourceTags)
      .innerJoin(dataSources, eq(dataSourceTags.dataSourceId, dataSources.id))
      .where(
        and(
          eq(dataSources.edgeGatewayId, edgeGatewayId),
          eq(dataSources.tenantId, tenantId),
          eq(dataSources.enabled, true),
          eq(dataSourceTags.enabled, true)
        )
      );

    return result.map((r: { tag: DataSourceTag }) => r.tag);
  }
}

export const dataSourcesRepository = new DataSourcesRepository();
