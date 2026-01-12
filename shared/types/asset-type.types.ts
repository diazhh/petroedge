/**
 * Asset Type - Shared Types (Frontend/Backend)
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
  isSystem: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
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

export interface CreateAssetTypeInput {
  code: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parentTypeId?: string;
  fixedSchema?: AssetTypeSchema;
  attributeSchema?: AssetTypeSchema;
  telemetrySchema?: AssetTypeSchema;
}

export interface UpdateAssetTypeInput {
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
}

export interface AssetTypeFilters {
  isActive?: boolean;
  parentTypeId?: string;
  search?: string;
  page?: number;
  perPage?: number;
}
