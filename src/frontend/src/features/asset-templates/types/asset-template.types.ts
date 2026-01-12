/**
 * Asset Templates - Frontend Types
 */

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

export interface AssetTemplate {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  rootAssetTypeId: string;
  components: AssetComponent[];
  relationships: AssetRelationship[];
  defaultProperties?: Record<string, any>;
  isActive: boolean;
  metadata?: Record<string, any>;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface AssetTemplateWithRelations extends AssetTemplate {
  rootAssetType?: {
    id: string;
    code: string;
    name: string;
  };
  instancesCount?: number;
}

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
  page?: number;
  perPage?: number;
}

export interface AssetTemplateStats {
  total: number;
  active: number;
  inactive: number;
  byAssetType: Record<string, number>;
}
