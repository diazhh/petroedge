import { z } from 'zod';

export const convertUnitsSchema = z.object({
  value: z.number(),
  fromUnitId: z.string().uuid(),
  toUnitId: z.string().uuid(),
});

export const validateCompatibilitySchema = z.object({
  unitId1: z.string().uuid(),
  unitId2: z.string().uuid(),
});
