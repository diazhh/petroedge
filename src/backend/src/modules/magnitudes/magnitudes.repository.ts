import { eq, and, or, ilike, sql, desc } from 'drizzle-orm';
import { db, magnitudes } from '../../common/database';
import type { CreateMagnitudeDTO, UpdateMagnitudeDTO, MagnitudeFilters } from './magnitudes.types';

export class MagnitudesRepository {
  async findAll(filters: MagnitudeFilters = {}) {
    const {
      categoryId,
      isActive,
      search,
      page = 1,
      perPage = 20,
    } = filters;

    const conditions = [];

    if (categoryId) {
      conditions.push(eq(magnitudes.categoryId, categoryId));
    }

    if (isActive !== undefined) {
      conditions.push(eq(magnitudes.isActive, isActive));
    }

    if (search) {
      conditions.push(
        or(
          ilike(magnitudes.code, `%${search}%`),
          ilike(magnitudes.name, `%${search}%`),
          ilike(magnitudes.description, `%${search}%`)
        )!
      );
    }

    const offset = (page - 1) * perPage;

    const [items, totalResult] = await Promise.all([
      db
        .select()
        .from(magnitudes)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(magnitudes.createdAt))
        .limit(perPage)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(magnitudes)
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
    const [magnitude] = await db
      .select()
      .from(magnitudes)
      .where(eq(magnitudes.id, id))
      .limit(1);

    return magnitude || null;
  }

  async findByCode(code: string) {
    const [magnitude] = await db
      .select()
      .from(magnitudes)
      .where(eq(magnitudes.code, code))
      .limit(1);

    return magnitude || null;
  }

  async findByCategoryId(categoryId: string) {
    return db
      .select()
      .from(magnitudes)
      .where(eq(magnitudes.categoryId, categoryId))
      .orderBy(magnitudes.name);
  }

  async create(data: CreateMagnitudeDTO) {
    const [magnitude] = await db
      .insert(magnitudes)
      .values({
        categoryId: data.categoryId,
        code: data.code,
        name: data.name,
        description: data.description,
        symbol: data.symbol,
        siUnitId: data.siUnitId,
        isActive: true,
      })
      .returning();

    return magnitude;
  }

  async update(id: string, data: UpdateMagnitudeDTO) {
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };

    const [magnitude] = await db
      .update(magnitudes)
      .set(updateData)
      .where(eq(magnitudes.id, id))
      .returning();

    return magnitude || null;
  }

  async delete(id: string) {
    const [magnitude] = await db
      .delete(magnitudes)
      .where(eq(magnitudes.id, id))
      .returning();

    return magnitude || null;
  }
}
