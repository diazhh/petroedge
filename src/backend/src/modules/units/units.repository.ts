import { eq, and, or, ilike, sql, desc } from 'drizzle-orm';
import { db, units } from '../../common/database';
import type { CreateUnitDTO, UpdateUnitDTO, UnitFilters } from './units.types';

export class UnitsRepository {
  async findAll(filters: UnitFilters = {}) {
    const {
      magnitudeId,
      isActive,
      isSiUnit,
      search,
      page = 1,
      perPage = 20,
    } = filters;

    const conditions = [];

    if (magnitudeId) {
      conditions.push(eq(units.magnitudeId, magnitudeId));
    }

    if (isActive !== undefined) {
      conditions.push(eq(units.isActive, isActive));
    }

    if (isSiUnit !== undefined) {
      conditions.push(eq(units.isSiUnit, isSiUnit));
    }

    if (search) {
      conditions.push(
        or(
          ilike(units.code, `%${search}%`),
          ilike(units.name, `%${search}%`),
          ilike(units.symbol, `%${search}%`),
          ilike(units.description, `%${search}%`)
        )!
      );
    }

    const offset = (page - 1) * perPage;

    const [items, totalResult] = await Promise.all([
      db
        .select()
        .from(units)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(units.createdAt))
        .limit(perPage)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(units)
        .where(conditions.length > 0 ? and(...conditions) : undefined),
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

  async findById(id: string) {
    const [unit] = await db
      .select()
      .from(units)
      .where(eq(units.id, id))
      .limit(1);

    return unit || null;
  }

  async findByCode(code: string) {
    const [unit] = await db
      .select()
      .from(units)
      .where(eq(units.code, code))
      .limit(1);

    return unit || null;
  }

  async findByMagnitudeId(magnitudeId: string) {
    return db
      .select()
      .from(units)
      .where(eq(units.magnitudeId, magnitudeId))
      .orderBy(units.name);
  }

  async create(data: CreateUnitDTO) {
    const [unit] = await db
      .insert(units)
      .values({
        magnitudeId: data.magnitudeId,
        code: data.code,
        name: data.name,
        symbol: data.symbol,
        description: data.description,
        isSiUnit: data.isSiUnit || false,
        conversionFactor: data.conversionFactor,
        conversionOffset: data.conversionOffset || '0',
        isActive: true,
      })
      .returning();

    return unit;
  }

  async update(id: string, data: UpdateUnitDTO) {
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };

    const [unit] = await db
      .update(units)
      .set(updateData)
      .where(eq(units.id, id))
      .returning();

    return unit || null;
  }

  async delete(id: string) {
    const [unit] = await db
      .delete(units)
      .where(eq(units.id, id))
      .returning();

    return unit || null;
  }
}
