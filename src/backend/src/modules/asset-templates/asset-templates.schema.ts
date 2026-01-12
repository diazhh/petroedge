/**
 * Asset Templates Module - Zod Schemas
 * 
 * Validation schemas for Asset Template endpoints.
 */

import { z } from 'zod';

// ==================== Component Schemas ====================

export const assetComponentSchema = z.object({
  code: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/, 'Code must be lowercase alphanumeric with underscores'),
  assetTypeCode: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  required: z.boolean(),
  description: z.string().optional(),
  defaultProperties: z.record(z.any()).optional(),
});

export const assetRelationshipSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  type: z.string().min(1).max(100),
  metadata: z.record(z.any()).optional(),
});

// ==================== Create Schema ====================

export const createAssetTemplateSchema = z.object({
  code: z.string().min(1).max(100).regex(/^[A-Z0-9_]+$/, 'Code must be uppercase alphanumeric with underscores'),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  rootAssetTypeId: z.string().uuid(),
  components: z.array(assetComponentSchema).min(0),
  relationships: z.array(assetRelationshipSchema).min(0),
  defaultProperties: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

// ==================== Update Schema ====================

export const updateAssetTemplateSchema = z.object({
  code: z.string().min(1).max(100).regex(/^[A-Z0-9_]+$/).optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  rootAssetTypeId: z.string().uuid().optional(),
  components: z.array(assetComponentSchema).optional(),
  relationships: z.array(assetRelationshipSchema).optional(),
  defaultProperties: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

// ==================== Query Params ====================

export const assetTemplateFiltersSchema = z.object({
  isActive: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  rootAssetTypeId: z.string().uuid().optional(),
  search: z.string().optional(),
  tags: z.string().transform(val => val.split(',')).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  perPage: z.string().regex(/^\d+$/).transform(Number).optional(),
  includeAssetType: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  includeStats: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
});

// ==================== Params ====================

export const assetTemplateIdSchema = z.object({
  id: z.string().uuid(),
});
