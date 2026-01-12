/**
 * Asset Templates Module - TypeScript Types
 * 
 * Defines types for Asset Template management.
 * Asset Templates are blueprints for creating composite digital twins.
 */

import { assetTemplates } from '../../common/database/schema.js';

// ==================== Database Types ====================

export type AssetTemplate = typeof assetTemplates.$inferSelect;
export type NewAssetTemplate = typeof assetTemplates.$inferInsert;

// ==================== Component Definition ====================

export interface AssetComponent {
  code: string;
  assetTypeCode: string;
  name: string;
  required: boolean;
  description?: string;
  defaultProperties?: Record<string, any>;
}

export interface AssetRelationship {
  from: string;
  to: string;
  type: string;
  metadata?: Record<string, any>;
}

// ==================== DTOs ====================

export interface CreateAssetTemplateDTO {
  code: string;
  name: string;
  description?: string;
  rootAssetTypeId: string;
  components: AssetComponent[];
  relationships: AssetRelationship[];
  defaultProperties?: Record<string, any>;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface UpdateAssetTemplateDTO {
  code?: string;
  name?: string;
  description?: string;
  rootAssetTypeId?: string;
  components?: AssetComponent[];
  relationships?: AssetRelationship[];
  defaultProperties?: Record<string, any>;
  isActive?: boolean;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface AssetTemplateFilters {
  isActive?: boolean;
  rootAssetTypeId?: string;
  search?: string;
  tags?: string[];
}

export interface AssetTemplateWithRelations extends AssetTemplate {
  rootAssetType?: any;
  instancesCount?: number;
}

// ==================== Repository Options ====================

export interface FindAssetTemplatesOptions {
  tenantId: string;
  filters?: AssetTemplateFilters;
  page?: number;
  perPage?: number;
  includeAssetType?: boolean;
  includeStats?: boolean;
}

export interface AssetTemplateStats {
  total: number;
  active: number;
  inactive: number;
  byAssetType: Record<string, number>;
}

// ==================== Validation ====================

export interface ValidateTemplateResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
