/**
 * Connectivity Profiles - Frontend Types
 */

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

export interface ConnectivityProfile {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  deviceProfileId: string;
  assetTemplateId: string;
  telemetryMappings: TelemetryMapping[];
  isActive: boolean;
  metadata?: Record<string, any>;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ConnectivityProfileWithRelations extends ConnectivityProfile {
  deviceProfile?: {
    id: string;
    code: string;
    name: string;
  };
  assetTemplate?: {
    id: string;
    code: string;
    name: string;
  };
  bindingsCount?: number;
}

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
  page?: number;
  perPage?: number;
}

export interface ConnectivityProfileStats {
  total: number;
  active: number;
  inactive: number;
  byDeviceProfile: Record<string, number>;
  byAssetTemplate: Record<string, number>;
}
