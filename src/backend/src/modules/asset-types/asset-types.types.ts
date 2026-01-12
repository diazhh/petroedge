/**
 * Asset Types - Backend Types
 */

export interface SchemaField {
  type: 'string' | 'number' | 'boolean' | 'enum' | 'date' | 'json';
  required?: boolean;
  default?: any;
  min?: number;
  max?: number;
  unit?: string;
  values?: string[];
  description?: string;
}

export interface AssetTypeSchema {
  [key: string]: SchemaField;
}

export interface AssetType {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parentTypeId?: string;
  fixedSchema: AssetTypeSchema;
  attributeSchema: AssetTypeSchema;
  telemetrySchema: AssetTypeSchema;
  isActive: boolean;
  metadata?: Record<string, any>;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface AssetTypeWithRelations extends AssetType {
  parentType?: {
    id: string;
    code: string;
    name: string;
  };
  childTypes?: Array<{
    id: string;
    code: string;
    name: string;
  }>;
  assetsCount?: number;
}

export interface CreateAssetTypeDTO {
  code: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parentTypeId?: string;
  fixedSchema?: AssetTypeSchema;
  attributeSchema?: AssetTypeSchema;
  telemetrySchema?: AssetTypeSchema;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface UpdateAssetTypeDTO {
  code?: string;
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  parentTypeId?: string | null;
  fixedSchema?: AssetTypeSchema;
  attributeSchema?: AssetTypeSchema;
  telemetrySchema?: AssetTypeSchema;
  isActive?: boolean;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface AssetTypeFilters {
  isActive?: boolean;
  parentTypeId?: string;
  search?: string;
  tags?: string[];
  page?: number;
  perPage?: number;
}

export interface AssetTypeStats {
  total: number;
  active: number;
  inactive: number;
  byParentType: Record<string, number>;
}
