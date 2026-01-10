import { eq, and, ilike, or, sql, desc, asc, isNull } from 'drizzle-orm';
import { db } from '../../../common/database';
import {
  assetTypes,
  assets,
  assetAttributeHistory,
  type AssetType,
  type NewAssetType,
  type Asset,
  type NewAsset,
  type NewAssetAttributeHistory,
} from '../../../common/database/schema';
import type {
  QueryAssetTypesInput,
  QueryAssetsInput,
} from './assets.schema';

// ============================================================================
// ASSET TYPES REPOSITORY
// ============================================================================

export class AssetTypesRepository {
  async create(tenantId: string, data: Omit<NewAssetType, 'tenantId'>): Promise<AssetType> {
    const [assetType] = await db
      .insert(assetTypes)
      .values({ ...data, tenantId })
      .returning();
    return assetType;
  }

  async findById(tenantId: string, id: string): Promise<AssetType | null> {
    const [assetType] = await db
      .select()
      .from(assetTypes)
      .where(and(eq(assetTypes.id, id), eq(assetTypes.tenantId, tenantId)));
    return assetType || null;
  }

  async findByCode(tenantId: string, code: string): Promise<AssetType | null> {
    const [assetType] = await db
      .select()
      .from(assetTypes)
      .where(and(eq(assetTypes.code, code), eq(assetTypes.tenantId, tenantId)));
    return assetType || null;
  }

  async findAll(tenantId: string, query: QueryAssetTypesInput): Promise<{ data: AssetType[]; total: number }> {
    const { page, perPage, search, isActive, parentTypeId } = query;
    const offset = (page - 1) * perPage;

    const conditions = [eq(assetTypes.tenantId, tenantId)];

    if (search) {
      conditions.push(
        or(
          ilike(assetTypes.name, `%${search}%`),
          ilike(assetTypes.code, `%${search}%`),
          ilike(assetTypes.description, `%${search}%`)
        )!
      );
    }

    if (isActive !== undefined) {
      conditions.push(eq(assetTypes.isActive, isActive));
    }

    if (parentTypeId) {
      conditions.push(eq(assetTypes.parentTypeId, parentTypeId));
    } else if (parentTypeId === null) {
      conditions.push(isNull(assetTypes.parentTypeId));
    }

    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(assetTypes)
        .where(and(...conditions))
        .orderBy(asc(assetTypes.sortOrder), asc(assetTypes.name))
        .limit(perPage)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(assetTypes)
        .where(and(...conditions)),
    ]);

    return { data, total: countResult[0]?.count || 0 };
  }

  async update(tenantId: string, id: string, data: Partial<NewAssetType>): Promise<AssetType | null> {
    const [assetType] = await db
      .update(assetTypes)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(assetTypes.id, id), eq(assetTypes.tenantId, tenantId)))
      .returning();
    return assetType || null;
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const result = await db
      .delete(assetTypes)
      .where(and(eq(assetTypes.id, id), eq(assetTypes.tenantId, tenantId), eq(assetTypes.isSystem, false)));
    return (result.rowCount ?? 0) > 0;
  }

  async getChildTypes(tenantId: string, parentTypeId: string): Promise<AssetType[]> {
    return db
      .select()
      .from(assetTypes)
      .where(and(eq(assetTypes.tenantId, tenantId), eq(assetTypes.parentTypeId, parentTypeId)));
  }
}

// ============================================================================
// ASSETS REPOSITORY
// ============================================================================

export class AssetsRepository {
  async create(tenantId: string, userId: string, data: Omit<NewAsset, 'tenantId' | 'createdBy'>): Promise<Asset> {
    const [asset] = await db
      .insert(assets)
      .values({ ...data, tenantId, createdBy: userId })
      .returning();
    return asset;
  }

  async findById(tenantId: string, id: string, includeType = true): Promise<(Asset & { assetType?: AssetType }) | null> {
    if (includeType) {
      const result = await db
        .select({
          asset: assets,
          assetType: assetTypes,
        })
        .from(assets)
        .leftJoin(assetTypes, eq(assets.assetTypeId, assetTypes.id))
        .where(and(eq(assets.id, id), eq(assets.tenantId, tenantId)));

      if (!result[0]) return null;
      return { ...result[0].asset, assetType: result[0].assetType || undefined };
    }

    const [asset] = await db
      .select()
      .from(assets)
      .where(and(eq(assets.id, id), eq(assets.tenantId, tenantId)));
    return asset || null;
  }

  async findByCode(tenantId: string, code: string): Promise<Asset | null> {
    const [asset] = await db
      .select()
      .from(assets)
      .where(and(eq(assets.code, code), eq(assets.tenantId, tenantId)));
    return asset || null;
  }

  async findByLegacyId(tenantId: string, legacyType: string, legacyId: string): Promise<Asset | null> {
    const [asset] = await db
      .select()
      .from(assets)
      .where(
        and(
          eq(assets.tenantId, tenantId),
          eq(assets.legacyType, legacyType),
          eq(assets.legacyId, legacyId)
        )
      );
    return asset || null;
  }

  async findAll(tenantId: string, query: QueryAssetsInput): Promise<{ data: (Asset & { assetType?: AssetType })[]; total: number }> {
    const { page, perPage, search, assetTypeId, assetTypeCode, parentAssetId, status, tags, includeType } = query;
    const offset = (page - 1) * perPage;

    const conditions = [eq(assets.tenantId, tenantId)];

    if (search) {
      conditions.push(
        or(
          ilike(assets.name, `%${search}%`),
          ilike(assets.code, `%${search}%`),
          ilike(assets.description, `%${search}%`)
        )!
      );
    }

    if (assetTypeId) {
      conditions.push(eq(assets.assetTypeId, assetTypeId));
    }

    if (parentAssetId) {
      conditions.push(eq(assets.parentAssetId, parentAssetId));
    } else if (parentAssetId === null) {
      conditions.push(isNull(assets.parentAssetId));
    }

    if (status) {
      conditions.push(eq(assets.status, status));
    }

    if (tags && tags.length > 0) {
      conditions.push(sql`${assets.tags} && ${tags}`);
    }

    // Handle assetTypeCode filter
    if (assetTypeCode) {
      const assetType = await db
        .select({ id: assetTypes.id })
        .from(assetTypes)
        .where(and(eq(assetTypes.tenantId, tenantId), eq(assetTypes.code, assetTypeCode)));
      if (assetType[0]) {
        conditions.push(eq(assets.assetTypeId, assetType[0].id));
      }
    }

    if (includeType) {
      const [data, countResult] = await Promise.all([
        db
          .select({
            asset: assets,
            assetType: assetTypes,
          })
          .from(assets)
          .leftJoin(assetTypes, eq(assets.assetTypeId, assetTypes.id))
          .where(and(...conditions))
          .orderBy(desc(assets.createdAt))
          .limit(perPage)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(assets)
          .where(and(...conditions)),
      ]);

      return {
        data: data.map((r) => ({ ...r.asset, assetType: r.assetType || undefined })),
        total: countResult[0]?.count || 0,
      };
    }

    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(assets)
        .where(and(...conditions))
        .orderBy(desc(assets.createdAt))
        .limit(perPage)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(assets)
        .where(and(...conditions)),
    ]);

    return { data, total: countResult[0]?.count || 0 };
  }

  async update(tenantId: string, id: string, data: Partial<NewAsset>): Promise<Asset | null> {
    const [asset] = await db
      .update(assets)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(assets.id, id), eq(assets.tenantId, tenantId)))
      .returning();
    return asset || null;
  }

  async updateAttributes(
    tenantId: string,
    assetId: string,
    userId: string,
    newAttributes: Record<string, any>,
    reason?: string
  ): Promise<Asset | null> {
    // Get current asset
    const current = await this.findById(tenantId, assetId, false);
    if (!current) return null;

    const currentAttrs = (current.attributes as Record<string, any>) || {};
    const mergedAttrs = { ...currentAttrs, ...newAttributes };

    // Create history entries for changed attributes
    const historyEntries: NewAssetAttributeHistory[] = [];
    for (const [key, newValue] of Object.entries(newAttributes)) {
      const oldValue = currentAttrs[key];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        historyEntries.push({
          assetId,
          attributeKey: key,
          oldValue,
          newValue,
          changedBy: userId,
          reason,
        });
      }
    }

    // Insert history and update asset in transaction
    if (historyEntries.length > 0) {
      await db.insert(assetAttributeHistory).values(historyEntries);
    }

    return this.update(tenantId, assetId, { attributes: mergedAttrs });
  }

  async updateComputedValues(tenantId: string, assetId: string, computedValues: Record<string, any>): Promise<Asset | null> {
    const [asset] = await db
      .update(assets)
      .set({ computedValues, computedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(assets.id, assetId), eq(assets.tenantId, tenantId)))
      .returning();
    return asset || null;
  }

  async updateCurrentTelemetry(tenantId: string, assetId: string, telemetry: Record<string, any>): Promise<Asset | null> {
    const [asset] = await db
      .update(assets)
      .set({ currentTelemetry: telemetry, telemetryUpdatedAt: new Date() })
      .where(and(eq(assets.id, assetId), eq(assets.tenantId, tenantId)))
      .returning();
    return asset || null;
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const result = await db
      .delete(assets)
      .where(and(eq(assets.id, id), eq(assets.tenantId, tenantId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getChildren(tenantId: string, parentAssetId: string): Promise<Asset[]> {
    return db
      .select()
      .from(assets)
      .where(and(eq(assets.tenantId, tenantId), eq(assets.parentAssetId, parentAssetId)));
  }

  async getAttributeHistory(assetId: string, attributeKey?: string): Promise<any[]> {
    const conditions = [eq(assetAttributeHistory.assetId, assetId)];
    if (attributeKey) {
      conditions.push(eq(assetAttributeHistory.attributeKey, attributeKey));
    }

    return db
      .select()
      .from(assetAttributeHistory)
      .where(and(...conditions))
      .orderBy(desc(assetAttributeHistory.changedAt));
  }

  async countByType(tenantId: string, assetTypeId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(assets)
      .where(and(eq(assets.tenantId, tenantId), eq(assets.assetTypeId, assetTypeId)));
    return result?.count || 0;
  }
}

// Export singleton instances
export const assetTypesRepository = new AssetTypesRepository();
export const assetsRepository = new AssetsRepository();
