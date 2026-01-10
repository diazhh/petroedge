/**
 * Edge Gateways Module - Repository Layer
 * 
 * Handles database operations for Edge Gateways using Drizzle ORM.
 */

import { eq, and, desc, sql, ilike, or } from 'drizzle-orm';
import { db } from '../../common/database/index.js';
import { edgeGateways, dataSources, assets } from '../../common/database/schema.js';
import {
  EdgeGateway,
  NewEdgeGateway,
  FindEdgeGatewaysOptions,
  EdgeGatewayWithRelations,
  EdgeGatewayStats,
  EdgeGatewayStatus,
} from './edge-gateways.types.js';

export class EdgeGatewaysRepository {
  /**
   * Find all edge gateways with filters and pagination
   */
  async findAll(options: FindEdgeGatewaysOptions): Promise<{
    gateways: EdgeGatewayWithRelations[];
    total: number;
  }> {
    const {
      tenantId,
      filters = {},
      page = 1,
      perPage = 20,
      includeSources = false,
      includeAsset = false,
    } = options;

    const offset = (page - 1) * perPage;

    // Build WHERE conditions
    const conditions = [eq(edgeGateways.tenantId, tenantId)];

    if (filters.status) {
      conditions.push(eq(edgeGateways.status, filters.status));
    }

    if (filters.assetId) {
      conditions.push(eq(edgeGateways.siteId, filters.assetId));
    }

    if (filters.location) {
      conditions.push(ilike(edgeGateways.location, `%${filters.location}%`));
    }

    if (filters.search) {
      conditions.push(
        or(
          ilike(edgeGateways.name, `%${filters.search}%`),
          ilike(edgeGateways.description, `%${filters.search}%`)
        )!
      );
    }

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(edgeGateways)
      .where(and(...conditions));

    // Get gateways
    const results = await db
      .select()
      .from(edgeGateways)
      .where(and(...conditions))
      .orderBy(desc(edgeGateways.createdAt))
      .limit(perPage)
      .offset(offset);

    // Optionally include relations
    const gatewaysWithRelations: EdgeGatewayWithRelations[] = await Promise.all(
      results.map(async (gateway) => {
        const relations: EdgeGatewayWithRelations = { ...gateway };

        if (includeSources) {
          relations.dataSources = await db
            .select()
            .from(dataSources)
            .where(eq(dataSources.edgeGatewayId, gateway.id));
        }

        if (includeAsset && gateway.siteId) {
          const [asset] = await db
            .select()
            .from(assets)
            .where(eq(assets.id, gateway.siteId));
          relations.asset = asset;
        }

        return relations;
      })
    );

    return {
      gateways: gatewaysWithRelations,
      total: count,
    };
  }

  /**
   * Find edge gateway by ID
   */
  async findById(
    id: string,
    tenantId: string,
    options: { includeSources?: boolean; includeAsset?: boolean } = {}
  ): Promise<EdgeGatewayWithRelations | null> {
    const [gateway] = await db
      .select()
      .from(edgeGateways)
      .where(and(eq(edgeGateways.id, id), eq(edgeGateways.tenantId, tenantId)));

    if (!gateway) {
      return null;
    }

    const result: EdgeGatewayWithRelations = { ...gateway };

    if (options.includeSources) {
      result.dataSources = await db
        .select()
        .from(dataSources)
        .where(eq(dataSources.edgeGatewayId, id));
    }

    if (options.includeAsset && gateway.siteId) {
      const [asset] = await db
        .select()
        .from(assets)
        .where(eq(assets.id, gateway.siteId));
      result.asset = asset;
    }

    return result;
  }

  /**
   * Find edge gateway by name (for uniqueness check)
   */
  async findByName(name: string, tenantId: string): Promise<EdgeGateway | null> {
    const [gateway] = await db
      .select()
      .from(edgeGateways)
      .where(and(eq(edgeGateways.name, name), eq(edgeGateways.tenantId, tenantId)));

    return gateway || null;
  }

  /**
   * Create new edge gateway
   */
  async create(data: NewEdgeGateway): Promise<EdgeGateway> {
    const [gateway] = await db.insert(edgeGateways).values(data).returning();
    return gateway;
  }

  /**
   * Update edge gateway
   */
  async update(
    id: string,
    tenantId: string,
    data: Partial<NewEdgeGateway>
  ): Promise<EdgeGateway | null> {
    const [gateway] = await db
      .update(edgeGateways)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(edgeGateways.id, id), eq(edgeGateways.tenantId, tenantId)))
      .returning();

    return gateway || null;
  }

  /**
   * Delete edge gateway
   */
  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(edgeGateways)
      .where(and(eq(edgeGateways.id, id), eq(edgeGateways.tenantId, tenantId)))
      .returning();

    return result.length > 0;
  }

  /**
   * Update heartbeat timestamp
   */
  async updateHeartbeat(id: string, tenantId: string): Promise<void> {
    await db
      .update(edgeGateways)
      .set({
        lastHeartbeat: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(edgeGateways.id, id), eq(edgeGateways.tenantId, tenantId)));
  }

  /**
   * Update gateway status
   */
  async updateStatus(
    id: string,
    tenantId: string,
    status: EdgeGatewayStatus
  ): Promise<void> {
    await db
      .update(edgeGateways)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(and(eq(edgeGateways.id, id), eq(edgeGateways.tenantId, tenantId)));
  }

  /**
   * Get gateway statistics
   */
  async getStats(tenantId: string): Promise<EdgeGatewayStats> {
    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        online: sql<number>`count(*) filter (where status = 'ONLINE')::int`,
        offline: sql<number>`count(*) filter (where status = 'OFFLINE')::int`,
        error: sql<number>`count(*) filter (where status = 'ERROR')::int`,
        maintenance: sql<number>`count(*) filter (where status = 'MAINTENANCE')::int`,
        enabled: sql<number>`0::int`,
        disabled: sql<number>`0::int`,
      })
      .from(edgeGateways)
      .where(eq(edgeGateways.tenantId, tenantId));

    return stats;
  }

  /**
   * Get gateways that haven't sent heartbeat in X minutes
   */
  async findStaleGateways(tenantId: string, minutesThreshold: number): Promise<EdgeGateway[]> {
    const thresholdDate = new Date(Date.now() - minutesThreshold * 60 * 1000);

    return db
      .select()
      .from(edgeGateways)
      .where(
        and(
          eq(edgeGateways.tenantId, tenantId),
          sql`${edgeGateways.lastHeartbeat} < ${thresholdDate}`
        )
      );
  }

  /**
   * Bulk update gateway statuses
   */
  async bulkUpdateStatus(
    gatewayIds: string[],
    tenantId: string,
    status: EdgeGatewayStatus
  ): Promise<void> {
    await db
      .update(edgeGateways)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(
        and(
          sql`${edgeGateways.id} = ANY(${gatewayIds})`,
          eq(edgeGateways.tenantId, tenantId)
        )
      );
  }
}
