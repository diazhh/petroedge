import { z } from 'zod';

export const digitalTwinFeatureSchema = z.object({
  properties: z.record(z.any()).optional(),
  desiredProperties: z.record(z.any()).optional(),
});

export const createDigitalTwinSchema = z.object({
  type: z.enum(['BASIN', 'FIELD', 'RESERVOIR', 'WELL', 'EQUIPMENT', 'TOOL']),
  code: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  attributes: z.record(z.any()).optional(),
  features: z.record(digitalTwinFeatureSchema).optional(),
  parentThingId: z.string().optional(),
});

export const updateDigitalTwinSchema = z.object({
  attributes: z.record(z.any()).optional(),
  features: z.record(digitalTwinFeatureSchema).optional(),
});

export const updateAttributesSchema = z.record(z.any());

export const updateFeaturePropertiesSchema = z.record(z.any());

export const telemetryUpdateSchema = z.record(
  z.object({
    value: z.any(),
    unit: z.string().optional(),
    timestamp: z.string().optional(),
  })
);

export const migrationRequestSchema = z.object({
  entityType: z.enum(['basin', 'field', 'reservoir', 'well']),
  entityId: z.string().uuid(),
});

export const thingIdParamSchema = z.object({
  thingId: z.string().min(1),
});

export const featureIdParamSchema = z.object({
  thingId: z.string().min(1),
  featureId: z.string().min(1),
});

export type CreateDigitalTwinInput = z.infer<typeof createDigitalTwinSchema>;
export type UpdateDigitalTwinInput = z.infer<typeof updateDigitalTwinSchema>;
export type UpdateAttributesInput = z.infer<typeof updateAttributesSchema>;
export type UpdateFeaturePropertiesInput = z.infer<typeof updateFeaturePropertiesSchema>;
export type TelemetryUpdateInput = z.infer<typeof telemetryUpdateSchema>;
export type MigrationRequestInput = z.infer<typeof migrationRequestSchema>;
