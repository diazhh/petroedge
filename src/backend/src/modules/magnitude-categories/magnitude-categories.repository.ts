import { eq, and, or, ilike, sql, desc } from 'drizzle-orm';
import { db, magnitudeCategories } from '../../common/database';
import type { CreateMagnitudeCategoryDTO, UpdateMagnitudeCategoryDTO, MagnitudeCategoryFilters } from './magnitude-categories.types';

export class MagnitudeCategoriesRepository {
  async findAll(filters: MagnitudeCategoryFilters = {}) {
    const {
      isActive,
      search,
      page = 1,
      perPage = 20,
    } = filters;

    const conditions = [];

    if (isActive !== undefined) {
      conditions.push(eq(magnitudeCategories.isActive, isActive));
    }

    if (search) {
      conditions.push(
        or(
          ilike(magnitudeCategories.code, `%${search}%`),
          ilike(magnitudeCategories.name, `%${search}%`),
          ilike(magnitudeCategories.description, `%${search}%`)
        )!
      );
    }

    const offset = (page - 1) * perPage;

    const [items, totalResult] = await Promise.all([
      db
        .select()
        .from(magnitudeCategories)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(magnitudeCategories.createdAt))
        .limit(perPage)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(magnitudeCategories)
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
    const [category] = await db
      .select()
      .from(magnitudeCategories)
      .where(eq(magnitudeCategories.id, id))
      .limit(1);

    return category || null;
  }

  async findByCode(code: string) {
    const [category] = await db
      .select()
      .from(magnitudeCategories)
      .where(eq(magnitudeCategories.code, code))
      .limit(1);

    return category || null;
  }

  async create(data: CreateMagnitudeCategoryDTO) {
    const [category] = await db
      .insert(magnitudeCategories)
      .values({
        code: data.code,
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
        isActive: true,
      })
      .returning();

    return category;
  }

  async update(id: string, data: UpdateMagnitudeCategoryDTO) {
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };

    const [category] = await db
      .update(magnitudeCategories)
      .set(updateData)
      .where(eq(magnitudeCategories.id, id))
      .returning();

    return category || null;
  }

  async delete(id: string) {
    const [category] = await db
      .delete(magnitudeCategories)
      .where(eq(magnitudeCategories.id, id))
      .returning();

    return category || null;
  }
}
