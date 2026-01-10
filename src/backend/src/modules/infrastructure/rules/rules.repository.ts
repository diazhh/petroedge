import { db } from '../../../common/database/index.js';
import { rules, ruleExecutions } from '../../../common/database/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';

export class RulesRepository {
  /**
   * Create a new rule
   */
  async create(tenantId: string, data: any): Promise<any> {
    const [rule] = await db.insert(rules).values({
      tenantId,
      name: data.name,
      description: data.description,
      appliesToAssetTypes: data.appliesToAssetTypes,
      appliesToAssets: data.appliesToAssets || null,
      nodes: data.nodes,
      connections: data.connections,
      status: data.status || 'DRAFT',
      priority: data.priority || 0,
      config: data.config || {
        executeOnStartup: false,
        debounceMs: 1000,
        maxExecutionsPerMinute: 60,
        timeoutMs: 5000,
      },
      createdBy: data.createdBy,
    }).returning();

    return rule;
  }

  /**
   * Find rule by ID
   */
  async findById(tenantId: string, ruleId: string): Promise<any | null> {
    const [rule] = await db
      .select()
      .from(rules)
      .where(and(eq(rules.id, ruleId), eq(rules.tenantId, tenantId)));

    return rule || null;
  }

  /**
   * Find all rules for a tenant
   */
  async findAll(
    tenantId: string,
    filters?: {
      status?: string;
      assetTypeId?: string;
      page?: number;
      perPage?: number;
    }
  ): Promise<{ rules: any[]; total: number }> {
    const page = filters?.page || 1;
    const perPage = filters?.perPage || 20;
    const offset = (page - 1) * perPage;

    // Build conditions
    const conditions = [eq(rules.tenantId, tenantId)];

    if (filters?.status) {
      conditions.push(eq(rules.status, filters.status as any));
    }

    if (filters?.assetTypeId) {
      conditions.push(sql`${filters.assetTypeId} = ANY(${rules.appliesToAssetTypes})`);
    }

    const query = db.select().from(rules).where(and(...conditions));

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(rules)
      .where(eq(rules.tenantId, tenantId));

    // Get paginated results
    const results = await query
      .orderBy(desc(rules.updatedAt))
      .limit(perPage)
      .offset(offset);

    return {
      rules: results,
      total: Number(count),
    };
  }

  /**
   * Update a rule
   */
  async update(tenantId: string, ruleId: string, data: any): Promise<any | null> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.appliesToAssetTypes !== undefined) updateData.appliesToAssetTypes = data.appliesToAssetTypes;
    if (data.appliesToAssets !== undefined) updateData.appliesToAssets = data.appliesToAssets;
    if (data.nodes !== undefined) updateData.nodes = data.nodes;
    if (data.connections !== undefined) updateData.connections = data.connections;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.config !== undefined) updateData.config = data.config;

    const [rule] = await db
      .update(rules)
      .set(updateData)
      .where(and(eq(rules.id, ruleId), eq(rules.tenantId, tenantId)))
      .returning();

    return rule || null;
  }

  /**
   * Delete a rule
   */
  async delete(tenantId: string, ruleId: string): Promise<boolean> {
    const result = await db
      .delete(rules)
      .where(and(eq(rules.id, ruleId), eq(rules.tenantId, tenantId)))
      .returning();

    return result.length > 0;
  }

  /**
   * Activate a rule
   */
  async activate(tenantId: string, ruleId: string): Promise<any | null> {
    const [rule] = await db
      .update(rules)
      .set({ status: 'ACTIVE', updatedAt: new Date() })
      .where(and(eq(rules.id, ruleId), eq(rules.tenantId, tenantId)))
      .returning();

    return rule || null;
  }

  /**
   * Deactivate a rule
   */
  async deactivate(tenantId: string, ruleId: string): Promise<any | null> {
    const [rule] = await db
      .update(rules)
      .set({ status: 'INACTIVE', updatedAt: new Date() })
      .where(and(eq(rules.id, ruleId), eq(rules.tenantId, tenantId)))
      .returning();

    return rule || null;
  }

  /**
   * Get rule executions
   */
  async getExecutions(
    tenantId: string,
    ruleId: string,
    filters?: {
      success?: boolean;
      page?: number;
      perPage?: number;
    }
  ): Promise<{ executions: any[]; total: number }> {
    const page = filters?.page || 1;
    const perPage = filters?.perPage || 20;
    const offset = (page - 1) * perPage;

    // Verify rule belongs to tenant
    const rule = await this.findById(tenantId, ruleId);
    if (!rule) {
      return { executions: [], total: 0 };
    }

    // Build conditions
    const conditions = [eq(ruleExecutions.ruleId, ruleId)];

    if (filters?.success !== undefined) {
      conditions.push(eq(ruleExecutions.success, filters.success));
    }

    const query = db.select().from(ruleExecutions).where(and(...conditions));

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(ruleExecutions)
      .where(eq(ruleExecutions.ruleId, ruleId));

    // Get paginated results
    const results = await query
      .orderBy(desc(ruleExecutions.startedAt))
      .limit(perPage)
      .offset(offset);

    return {
      executions: results,
      total: Number(count),
    };
  }

  /**
   * Get rule execution statistics
   */
  async getExecutionStats(tenantId: string, ruleId: string): Promise<any> {
    // Verify rule belongs to tenant
    const rule = await this.findById(tenantId, ruleId);
    if (!rule) {
      return null;
    }

    const [stats] = await db
      .select({
        totalExecutions: sql<number>`count(*)`,
        successfulExecutions: sql<number>`count(*) filter (where success = true)`,
        failedExecutions: sql<number>`count(*) filter (where success = false)`,
        avgDurationMs: sql<number>`avg(duration_ms)`,
        minDurationMs: sql<number>`min(duration_ms)`,
        maxDurationMs: sql<number>`max(duration_ms)`,
      })
      .from(ruleExecutions)
      .where(eq(ruleExecutions.ruleId, ruleId));

    return stats;
  }
}

export const rulesRepository = new RulesRepository();
