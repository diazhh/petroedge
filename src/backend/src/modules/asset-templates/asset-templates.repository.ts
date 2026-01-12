/**
 * Asset Templates Module - Repository Layer
 * 
 * Handles database operations for Asset Templates using Drizzle ORM.
 */

import { eq, and, desc, sql, ilike, or } from 'drizzle-orm';
import { db } from '../../common/database/index.js';
import { assetTemplates, assetTypes, digitalTwinInstances } from '../../common/database/schema.js';
import {
  AssetTemplate,
  NewAssetTemplate,
  FindAssetTemplatesOptions,
  AssetTemplateWithRelations,
  AssetTemplateStats,
} from './asset-templates.types.js';

export class AssetTemplatesRepository {
  async findAll(options: FindAssetTemplatesOptions): Promise<{
    templates: AssetTemplateWithRelations[];
    total: number;
  }> {
    const {
      tenantId,
      filters = {},
      page = 1,
      perPage = 20,
      includeAssetType = false,
      includeStats = false,
    } = options;

    const offset = (page - 1) * perPage;

    const conditions = [eq(assetTemplates.tenantId, tenantId)];

    if (filters.isActive !== undefined) {
      conditions.push(eq(assetTemplates.isActive, filters.isActive));
    }

    if (filters.rootAssetTypeId) {
      conditions.push(eq(assetTemplates.rootAssetTypeId, filters.rootAssetTypeId));
    }

    if (filters.search) {
      conditions.push(
        or(
          ilike(assetTemplates.name, `%${filters.search}%`),
          ilike(assetTemplates.code, `%${filters.search}%`),
          ilike(assetTemplates.description, `%${filters.search}%`)
        )!
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      conditions.push(sql`${assetTemplates.tags} && ${filters.tags}`);
    }

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(assetTemplates)
      .where(and(...conditions));

    const results = await db
      .select()
      .from(assetTemplates)
      .where(and(...conditions))
      .orderBy(desc(assetTemplates.createdAt))
      .limit(perPage)
      .offset(offset);

    const templatesWithRelations: AssetTemplateWithRelations[] = await Promise.all(
      results.map(async (template) => {
        const relations: AssetTemplateWithRelations = { ...template };

        if (includeAssetType) {
          const [assetType] = await db
            .select()
            .from(assetTypes)
            .where(eq(assetTypes.id, template.rootAssetTypeId));
          relations.rootAssetType = assetType;
        }

        if (includeStats) {
          const [{ count: instancesCount }] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(digitalTwinInstances)
            .where(eq(digitalTwinInstances.assetTemplateId, template.id));
          relations.instancesCount = instancesCount;
        }

        return relations;
      })
    );

    return {
      templates: templatesWithRelations,
      total: count,
    };
  }

  async findById(id: string, tenantId: string): Promise<AssetTemplate | null> {
    const [template] = await db
      .select()
      .from(assetTemplates)
      .where(and(eq(assetTemplates.id, id), eq(assetTemplates.tenantId, tenantId)));

    return template || null;
  }

  async findByCode(code: string, tenantId: string): Promise<AssetTemplate | null> {
    const [template] = await db
      .select()
      .from(assetTemplates)
      .where(and(eq(assetTemplates.code, code), eq(assetTemplates.tenantId, tenantId)));

    return template || null;
  }

  async create(data: NewAssetTemplate): Promise<AssetTemplate> {
    const [template] = await db.insert(assetTemplates).values(data).returning();
    return template;
  }

  async update(id: string, tenantId: string, data: Partial<NewAssetTemplate>): Promise<AssetTemplate | null> {
    const [template] = await db
      .update(assetTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(assetTemplates.id, id), eq(assetTemplates.tenantId, tenantId)))
      .returning();

    return template || null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(assetTemplates)
      .where(and(eq(assetTemplates.id, id), eq(assetTemplates.tenantId, tenantId)))
      .returning();

    return result.length > 0;
  }

  async getStats(tenantId: string): Promise<AssetTemplateStats> {
    const allTemplates = await db
      .select()
      .from(assetTemplates)
      .where(eq(assetTemplates.tenantId, tenantId));

    const stats: AssetTemplateStats = {
      total: allTemplates.length,
      active: allTemplates.filter(t => t.isActive).length,
      inactive: allTemplates.filter(t => !t.isActive).length,
      byAssetType: {},
    };

    for (const template of allTemplates) {
      const typeId = template.rootAssetTypeId;
      stats.byAssetType[typeId] = (stats.byAssetType[typeId] || 0) + 1;
    }

    return stats;
  }

  async codeExists(code: string, tenantId: string, excludeId?: string): Promise<boolean> {
    const conditions = [
      eq(assetTemplates.code, code),
      eq(assetTemplates.tenantId, tenantId),
    ];

    if (excludeId) {
      conditions.push(sql`${assetTemplates.id} != ${excludeId}`);
    }

    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(assetTemplates)
      .where(and(...conditions));

    return result.count > 0;
  }
}
