/**
 * Connectivity Profiles Module - Zod Schemas
 * 
 * Validation schemas for Connectivity Profile endpoints.
 */

import { z } from 'zod';

// ==================== Transform Config ====================

const transformConfigSchema = z.object({
  type: z.enum(['scale', 'offset', 'formula', 'lookup']),
  params: z.record(z.any()),
});

// ==================== Validation Config ====================

const validationConfigSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  allowedValues: z.array(z.any()).optional(),
  required: z.boolean().optional(),
});

// ==================== Telemetry Mapping ====================

const telemetryMappingSchema = z.object({
  deviceKey: z.string().min(1, 'Device key is required'),
  assetComponentCode: z.string().min(1, 'Asset component code is required'),
  assetPropertyKey: z.string().min(1, 'Asset property key is required'),
  transform: transformConfigSchema.optional(),
  validation: validationConfigSchema.optional(),
});

// ==================== Create Schema ====================

export const createConnectivityProfileSchema = z.object({
  code: z.string()
    .min(1, 'Code is required')
    .max(50, 'Code must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Code must contain only alphanumeric characters, hyphens, and underscores'),
  name: z.string()
    .min(1, 'Name is required')
    .max(200, 'Name must be at most 200 characters'),
  description: z.string().max(1000).optional(),
  deviceProfileId: z.string().uuid('Invalid device profile ID'),
  assetTemplateId: z.string().uuid('Invalid asset template ID'),
  telemetryMappings: z.array(telemetryMappingSchema)
    .min(1, 'At least one telemetry mapping is required'),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

// ==================== Update Schema ====================

export const updateConnectivityProfileSchema = z.object({
  code: z.string()
    .min(1, 'Code is required')
    .max(50, 'Code must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Code must contain only alphanumeric characters, hyphens, and underscores')
    .optional(),
  name: z.string()
    .min(1, 'Name is required')
    .max(200, 'Name must be at most 200 characters')
    .optional(),
  description: z.string().max(1000).optional(),
  deviceProfileId: z.string().uuid('Invalid device profile ID').optional(),
  assetTemplateId: z.string().uuid('Invalid asset template ID').optional(),
  telemetryMappings: z.array(telemetryMappingSchema).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

// ==================== Query Filters ====================

export const connectivityProfileFiltersSchema = z.object({
  isActive: z.string().transform(val => val === 'true').optional(),
  deviceProfileId: z.string().uuid().optional(),
  assetTemplateId: z.string().uuid().optional(),
  search: z.string().optional(),
  tags: z.string().transform(val => val.split(',')).optional(),
  page: z.string().transform(Number).optional(),
  perPage: z.string().transform(Number).optional(),
  includeDeviceProfile: z.string().transform(val => val === 'true').optional(),
  includeAssetTemplate: z.string().transform(val => val === 'true').optional(),
  includeStats: z.string().transform(val => val === 'true').optional(),
});

// ==================== Params ====================

export const connectivityProfileIdSchema = z.object({
  id: z.string().uuid('Invalid connectivity profile ID'),
});

// ==================== Export Types ====================

export type CreateConnectivityProfileInput = z.infer<typeof createConnectivityProfileSchema>;
export type UpdateConnectivityProfileInput = z.infer<typeof updateConnectivityProfileSchema>;
export type ConnectivityProfileFiltersInput = z.infer<typeof connectivityProfileFiltersSchema>;
