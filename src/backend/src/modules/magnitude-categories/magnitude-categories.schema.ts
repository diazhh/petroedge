import { z } from 'zod';

export const createMagnitudeCategorySchema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
});

export const updateMagnitudeCategorySchema = z.object({
  code: z.string().min(1).max(50).toUpperCase().optional(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
  isActive: z.boolean().optional(),
});

export const magnitudeCategoryFiltersSchema = z.object({
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export const magnitudeCategoryIdSchema = z.object({
  id: z.string().uuid(),
});
