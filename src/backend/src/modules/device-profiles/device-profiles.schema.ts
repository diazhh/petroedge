/**
 * Device Profiles Module - Zod Schemas
 * 
 * Validation schemas for Device Profile endpoints.
 */

import { z } from 'zod';
import { TransportType } from './device-profiles.types.js';

// ==================== Telemetry Schema ====================

export const telemetryDefinitionSchema = z.object({
  type: z.enum(['number', 'string', 'boolean']),
  unit: z.string().optional(),
  description: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  precision: z.number().int().min(0).max(10).optional(),
});

export const telemetrySchemaSchema = z.record(z.string(), telemetryDefinitionSchema);

// ==================== Create Schema ====================

export const createDeviceProfileSchema = z.object({
  code: z.string().min(1).max(100).regex(/^[A-Z0-9_]+$/, 'Code must be uppercase alphanumeric with underscores'),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  transportType: z.nativeEnum(TransportType),
  telemetrySchema: telemetrySchemaSchema,
  defaultRuleChainId: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

// ==================== Update Schema ====================

export const updateDeviceProfileSchema = z.object({
  code: z.string().min(1).max(100).regex(/^[A-Z0-9_]+$/).optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  transportType: z.nativeEnum(TransportType).optional(),
  telemetrySchema: telemetrySchemaSchema.optional(),
  defaultRuleChainId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

// ==================== Query Params ====================

export const deviceProfileFiltersSchema = z.object({
  isActive: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  transportType: z.nativeEnum(TransportType).optional(),
  search: z.string().optional(),
  tags: z.string().transform(val => val.split(',')).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  perPage: z.string().regex(/^\d+$/).transform(Number).optional(),
  includeRuleChain: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  includeStats: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
});

// ==================== Params ====================

export const deviceProfileIdSchema = z.object({
  id: z.string().uuid(),
});
