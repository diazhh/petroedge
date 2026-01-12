import { eq, and, or, ilike, sql, desc } from 'drizzle-orm';
import { db, assetTypes, assets } from '../../common/database';
import type { CreateAssetTypeDTO, UpdateAssetTypeDTO, AssetTypeFilters } from './asset-types.types';

export class AssetTypesRepository {
  async findAll(tenantId: string, filters: AssetTypeFilters = {}) {
    const {
      isActive,
      parentTypeId,
      search,
      page = 1,
      perPage = 20,
    } = filters;

    const conditions = [eq(assetTypes.tenantId, tenantId)];

    if (isActive !== undefined) {
      conditions.push(eq(assetTypes.isActive, isActive));
    }

    if (parentTypeId !== undefined) {
      if (parentTypeId === null) {
        conditions.push(sql`${assetTypes.parentTypeId} IS NULL`);
      } else {
        conditions.push(eq(assetTypes.parentTypeId, parentTypeId));
      }
    }

    if (search) {
      conditions.push(
        or(
          ilike(assetTypes.code, `%${search}%`),
          ilike(assetTypes.name, `%${search}%`),
          ilike(assetTypes.description, `%${search}%`)
        )!
      );
    }

    // Tags filtering removed - field doesn't exist in schema

    const offset = (page - 1) * perPage;

    const [items, totalResult] = await Promise.all([
      db
        .select()
        .from(assetTypes)
        .where(and(...conditions))
        .orderBy(desc(assetTypes.createdAt))
        .limit(perPage)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(assetTypes)
        .where(and(...conditions)),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async findById(id: string, tenantId: string) {
    const [assetType] = await db
      .select()
      .from(assetTypes)
      .where(and(eq(assetTypes.id, id), eq(assetTypes.tenantId, tenantId)))
      .limit(1);

    return assetType || null;
  }

  async findByCode(code: string, tenantId: string) {
    const [assetType] = await db
      .select()
      .from(assetTypes)
      .where(and(eq(assetTypes.code, code), eq(assetTypes.tenantId, tenantId)))
      .limit(1);

    return assetType || null;
  }

  async create(tenantId: string, data: CreateAssetTypeDTO) {
    const [assetType] = await db
      .insert(assetTypes)
      .values({
        tenantId,
        code: data.code,
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
        parentTypeId: data.parentTypeId,
        fixedSchema: data.fixedSchema || {},
        attributeSchema: data.attributeSchema || {},
        telemetrySchema: data.telemetrySchema || {},
        isActive: true,
      })
      .returning();

    return assetType;
  }

  async update(id: string, tenantId: string, data: UpdateAssetTypeDTO) {
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };

    const [assetType] = await db
      .update(assetTypes)
      .set(updateData)
      .where(and(eq(assetTypes.id, id), eq(assetTypes.tenantId, tenantId)))
      .returning();

    return assetType || null;
  }

  async delete(id: string, tenantId: string) {
    const [assetType] = await db
      .delete(assetTypes)
      .where(and(eq(assetTypes.id, id), eq(assetTypes.tenantId, tenantId)))
      .returning();

    return assetType || null;
  }

  async getStats(tenantId: string) {
    const [totalResult, activeResult, inactiveResult] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(assetTypes)
        .where(eq(assetTypes.tenantId, tenantId)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(assetTypes)
        .where(and(eq(assetTypes.tenantId, tenantId), eq(assetTypes.isActive, true))),
      db
        .select({ count: sql<number>`count(*)` })
        .from(assetTypes)
        .where(and(eq(assetTypes.tenantId, tenantId), eq(assetTypes.isActive, false))),
    ]);

    return {
      total: Number(totalResult[0]?.count || 0),
      active: Number(activeResult[0]?.count || 0),
      inactive: Number(inactiveResult[0]?.count || 0),
    };
  }

  async getAssetsCount(assetTypeId: string, tenantId: string) {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(assets)
      .where(and(eq(assets.assetTypeId, assetTypeId), eq(assets.tenantId, tenantId)));

    return Number(result?.count || 0);
  }

  async getChildTypes(parentTypeId: string, tenantId: string) {
    return db
      .select()
      .from(assetTypes)
      .where(and(eq(assetTypes.parentTypeId, parentTypeId), eq(assetTypes.tenantId, tenantId)));
  }
}
