import { z } from 'zod';

// ============================================================================
// ASSET TYPES SCHEMAS
// ============================================================================

// Schema field definition
const schemaFieldDefinition = z.object({
  type: z.enum(['string', 'number', 'boolean', 'date', 'enum', 'object', 'array']),
  required: z.boolean().optional().default(false),
  default: z.any().optional(),
  unit: z.string().optional(),
  values: z.array(z.string()).optional(), // For enum type
  min: z.number().optional(),
  max: z.number().optional(),
  description: z.string().optional(),
});

// Computed field definition
const computedFieldDefinition = z.object({
  key: z.string(),
  name: z.string(),
  unit: z.string().optional(),
  formula: z.string(),
  recalculateOn: z.array(z.string()),
  description: z.string().optional(),
});

// Telemetry field definition
const telemetryFieldDefinition = z.object({
  type: z.enum(['number', 'string', 'boolean']),
  unit: z.string().optional(),
  frequency: z.string().optional(), // '1min', '5min', '1hr', etc.
  min: z.number().optional(),
  max: z.number().optional(),
  description: z.string().optional(),
});

// Create Asset Type
export const createAssetTypeSchema = z.object({
  code: z.string().min(2).max(50).regex(/^[A-Z][A-Z0-9_]*$/, 'Code must be uppercase with underscores'),
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
  parentTypeId: z.string().uuid().optional(),
  fixedSchema: z.record(schemaFieldDefinition).optional().default({}),
  attributeSchema: z.record(schemaFieldDefinition).optional().default({}),
  telemetrySchema: z.record(telemetryFieldDefinition).optional().default({}),
  computedFields: z.array(computedFieldDefinition).optional().default([]),
  sortOrder: z.number().int().optional().default(0),
});

// Update Asset Type
export const updateAssetTypeSchema = createAssetTypeSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// Query Asset Types
export const queryAssetTypesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  parentTypeId: z.string().uuid().optional(),
});

// ============================================================================
// ASSETS SCHEMAS
// ============================================================================

const assetStatusValues = ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'RETIRED', 'FAILED'] as const;

// Create Asset
export const createAssetSchema = z.object({
  assetTypeId: z.string().uuid(),
  code: z.string().min(2).max(50),
  name: z.string().min(2).max(200),
  description: z.string().optional(),
  parentAssetId: z.string().uuid().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  elevationFt: z.number().optional(),
  status: z.enum(assetStatusValues).optional().default('ACTIVE'),
  properties: z.record(z.any()).optional().default({}),
  attributes: z.record(z.any()).optional().default({}),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  // For migration from legacy entities
  legacyType: z.string().max(50).optional(),
  legacyId: z.string().uuid().optional(),
});

// Update Asset
export const updateAssetSchema = createAssetSchema.partial().omit({ assetTypeId: true, legacyType: true, legacyId: true });

// Update Asset Attributes
export const updateAssetAttributesSchema = z.object({
  attributes: z.record(z.any()),
  reason: z.string().optional(),
});

// Query Assets
export const queryAssetsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  assetTypeId: z.string().uuid().optional(),
  assetTypeCode: z.string().optional(),
  parentAssetId: z.string().uuid().optional(),
  status: z.enum(assetStatusValues).optional(),
  tags: z.array(z.string()).optional(),
  includeChildren: z.coerce.boolean().optional().default(false),
  includeType: z.coerce.boolean().optional().default(true),
});

// Asset ID param
export const assetIdParamSchema = z.object({
  id: z.string().uuid(),
});

// Asset Type ID param
export const assetTypeIdParamSchema = z.object({
  id: z.string().uuid(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateAssetTypeInput = z.infer<typeof createAssetTypeSchema>;
export type UpdateAssetTypeInput = z.infer<typeof updateAssetTypeSchema>;
export type QueryAssetTypesInput = z.infer<typeof queryAssetTypesSchema>;

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type UpdateAssetAttributesInput = z.infer<typeof updateAssetAttributesSchema>;
export type QueryAssetsInput = z.infer<typeof queryAssetsSchema>;

export type SchemaFieldDefinition = z.infer<typeof schemaFieldDefinition>;
export type ComputedFieldDefinition = z.infer<typeof computedFieldDefinition>;
export type TelemetryFieldDefinition = z.infer<typeof telemetryFieldDefinition>;
