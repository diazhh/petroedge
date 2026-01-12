import { z } from 'zod';

const schemaFieldSchema = z.object({
  type: z.enum(['string', 'number', 'boolean', 'enum', 'date', 'json']),
  required: z.boolean().optional(),
  default: z.any().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  unit: z.string().optional(),
  values: z.array(z.string()).optional(),
  description: z.string().optional(),
});

const assetTypeSchemaSchema = z.record(schemaFieldSchema);

export const createAssetTypeSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
  parentTypeId: z.string().uuid().optional(),
  fixedSchema: assetTypeSchemaSchema.optional().default({}),
  attributeSchema: assetTypeSchemaSchema.optional().default({}),
  telemetrySchema: assetTypeSchemaSchema.optional().default({}),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

export const updateAssetTypeSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
  parentTypeId: z.string().uuid().optional().nullable(),
  fixedSchema: assetTypeSchemaSchema.optional(),
  attributeSchema: assetTypeSchemaSchema.optional(),
  telemetrySchema: assetTypeSchemaSchema.optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

export const assetTypeFiltersSchema = z.object({
  isActive: z.boolean().optional(),
  parentTypeId: z.string().uuid().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().int().min(1).optional().default(1),
  perPage: z.number().int().min(1).max(100).optional().default(20),
});

export type CreateAssetTypeInput = z.infer<typeof createAssetTypeSchema>;
export type UpdateAssetTypeInput = z.infer<typeof updateAssetTypeSchema>;
export type AssetTypeFiltersInput = z.infer<typeof assetTypeFiltersSchema>;
