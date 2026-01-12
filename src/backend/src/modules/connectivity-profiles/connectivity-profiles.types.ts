/**
 * Connectivity Profiles Module - TypeScript Types
 * 
 * Defines types for Connectivity Profile management.
 * Connectivity Profiles map device telemetry keys to Digital Twin component properties.
 */

import { connectivityProfiles } from '../../common/database/schema.js';

// ==================== Database Types ====================

export type ConnectivityProfile = typeof connectivityProfiles.$inferSelect;
export type NewConnectivityProfile = typeof connectivityProfiles.$inferInsert;

// ==================== Mapping Types ====================

export interface TelemetryMapping {
  deviceKey: string;
  assetComponentCode: string;
  assetPropertyKey: string;
  transform?: TransformConfig;
  validation?: ValidationConfig;
}

export interface TransformConfig {
  type: 'scale' | 'offset' | 'formula' | 'lookup';
  params: Record<string, any>;
}

export interface ValidationConfig {
  min?: number;
  max?: number;
  allowedValues?: any[];
  required?: boolean;
}

// ==================== DTOs ====================

export interface CreateConnectivityProfileDTO {
  code: string;
  name: string;
  description?: string;
  deviceProfileId: string;
  assetTemplateId: string;
  telemetryMappings: TelemetryMapping[];
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface UpdateConnectivityProfileDTO {
  code?: string;
  name?: string;
  description?: string;
  deviceProfileId?: string;
  assetTemplateId?: string;
  telemetryMappings?: TelemetryMapping[];
  isActive?: boolean;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface ConnectivityProfileFilters {
  isActive?: boolean;
  deviceProfileId?: string;
  assetTemplateId?: string;
  search?: string;
  tags?: string[];
}

export interface ConnectivityProfileWithRelations extends ConnectivityProfile {
  deviceProfile?: any;
  assetTemplate?: any;
  bindingsCount?: number;
}

// ==================== Repository Options ====================

export interface FindConnectivityProfilesOptions {
  tenantId: string;
  filters?: ConnectivityProfileFilters;
  page?: number;
  perPage?: number;
  includeDeviceProfile?: boolean;
  includeAssetTemplate?: boolean;
  includeStats?: boolean;
}

export interface ConnectivityProfileStats {
  total: number;
  active: number;
  inactive: number;
  byDeviceProfile: Record<string, number>;
  byAssetTemplate: Record<string, number>;
}

// ==================== Validation ====================

export interface ValidateMappingsResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
