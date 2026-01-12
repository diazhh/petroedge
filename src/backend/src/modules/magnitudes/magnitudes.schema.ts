import { z } from 'zod';

export const createMagnitudeSchema = z.object({
  categoryId: z.string().uuid(),
  code: z.string().min(1).max(50).toUpperCase(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  symbol: z.string().max(20).optional(),
  siUnitId: z.string().uuid().optional(),
});

export const updateMagnitudeSchema = z.object({
  categoryId: z.string().uuid().optional(),
  code: z.string().min(1).max(50).toUpperCase().optional(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  symbol: z.string().max(20).optional(),
  siUnitId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});

export const magnitudeFiltersSchema = z.object({
  categoryId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export const magnitudeIdSchema = z.object({
  id: z.string().uuid(),
});

export const magnitudeCategoryIdSchema = z.object({
  categoryId: z.string().uuid(),
});
