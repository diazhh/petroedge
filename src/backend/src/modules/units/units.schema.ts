import { z } from 'zod';

export const createUnitSchema = z.object({
  magnitudeId: z.string().uuid(),
  code: z.string().min(1).max(50).toUpperCase(),
  name: z.string().min(1).max(100),
  symbol: z.string().min(1).max(20),
  description: z.string().optional(),
  isSiUnit: z.boolean().optional().default(false),
  conversionFactor: z.string().optional(),
  conversionOffset: z.string().optional().default('0'),
});

export const updateUnitSchema = z.object({
  magnitudeId: z.string().uuid().optional(),
  code: z.string().min(1).max(50).toUpperCase().optional(),
  name: z.string().min(1).max(100).optional(),
  symbol: z.string().min(1).max(20).optional(),
  description: z.string().optional(),
  isSiUnit: z.boolean().optional(),
  conversionFactor: z.string().optional(),
  conversionOffset: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const unitFiltersSchema = z.object({
  magnitudeId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  isSiUnit: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export const unitIdSchema = z.object({
  id: z.string().uuid(),
});

export const unitMagnitudeIdSchema = z.object({
  magnitudeId: z.string().uuid(),
});
