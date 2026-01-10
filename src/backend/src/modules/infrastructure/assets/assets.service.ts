import { assetTypesRepository, assetsRepository } from './assets.repository';
import type {
  CreateAssetTypeInput,
  UpdateAssetTypeInput,
  QueryAssetTypesInput,
  CreateAssetInput,
  UpdateAssetInput,
  UpdateAssetAttributesInput,
  QueryAssetsInput,
} from './assets.schema';
import type { AssetType, Asset } from '../../../common/database/schema';

// ============================================================================
// ASSET TYPES SERVICE
// ============================================================================

export class AssetTypesService {
  async createAssetType(tenantId: string, input: CreateAssetTypeInput): Promise<AssetType> {
    // Check if code already exists
    const existing = await assetTypesRepository.findByCode(tenantId, input.code);
    if (existing) {
      throw new Error(`Asset type with code '${input.code}' already exists`);
    }

    // If parent type is specified, verify it exists
    if (input.parentTypeId) {
      const parentType = await assetTypesRepository.findById(tenantId, input.parentTypeId);
      if (!parentType) {
        throw new Error(`Parent asset type not found: ${input.parentTypeId}`);
      }
    }

    return assetTypesRepository.create(tenantId, {
      code: input.code,
      name: input.name,
      description: input.description,
      icon: input.icon,
      color: input.color,
      parentTypeId: input.parentTypeId,
      fixedSchema: input.fixedSchema,
      attributeSchema: input.attributeSchema,
      telemetrySchema: input.telemetrySchema,
      computedFields: input.computedFields,
      sortOrder: input.sortOrder,
    });
  }

  async getAssetTypeById(tenantId: string, id: string): Promise<AssetType | null> {
    return assetTypesRepository.findById(tenantId, id);
  }

  async getAssetTypeByCode(tenantId: string, code: string): Promise<AssetType | null> {
    return assetTypesRepository.findByCode(tenantId, code);
  }

  async getAllAssetTypes(tenantId: string, query: QueryAssetTypesInput): Promise<{ data: AssetType[]; total: number }> {
    return assetTypesRepository.findAll(tenantId, query);
  }

  async updateAssetType(tenantId: string, id: string, input: UpdateAssetTypeInput): Promise<AssetType | null> {
    const existing = await assetTypesRepository.findById(tenantId, id);
    if (!existing) {
      throw new Error(`Asset type not found: ${id}`);
    }

    // If system type, only allow updating certain fields
    if (existing.isSystem) {
      const allowedFields = ['name', 'description', 'icon', 'color', 'sortOrder', 'isActive'];
      const inputKeys = Object.keys(input);
      const disallowedFields = inputKeys.filter(k => !allowedFields.includes(k));
      if (disallowedFields.length > 0) {
        throw new Error(`Cannot modify fields ${disallowedFields.join(', ')} on system asset type`);
      }
    }

    return assetTypesRepository.update(tenantId, id, input);
  }

  async deleteAssetType(tenantId: string, id: string): Promise<boolean> {
    const existing = await assetTypesRepository.findById(tenantId, id);
    if (!existing) {
      throw new Error(`Asset type not found: ${id}`);
    }

    if (existing.isSystem) {
      throw new Error('Cannot delete system asset type');
    }

    // Check if any assets use this type
    const assetCount = await assetsRepository.countByType(tenantId, id);
    if (assetCount > 0) {
      throw new Error(`Cannot delete asset type: ${assetCount} assets still reference it`);
    }

    // Check for child types
    const childTypes = await assetTypesRepository.getChildTypes(tenantId, id);
    if (childTypes.length > 0) {
      throw new Error(`Cannot delete asset type: ${childTypes.length} child types exist`);
    }

    return assetTypesRepository.delete(tenantId, id);
  }

  async getAssetTypeHierarchy(tenantId: string, rootTypeId?: string): Promise<AssetType[]> {
    const query: QueryAssetTypesInput = {
      page: 1,
      perPage: 100,
      isActive: true,
      parentTypeId: rootTypeId || undefined,
    };
    const { data } = await assetTypesRepository.findAll(tenantId, query);
    return data;
  }
}

// ============================================================================
// ASSETS SERVICE
// ============================================================================

export class AssetsService {
  async createAsset(tenantId: string, userId: string, input: CreateAssetInput): Promise<Asset> {
    // Verify asset type exists
    const assetType = await assetTypesRepository.findById(tenantId, input.assetTypeId);
    if (!assetType) {
      throw new Error(`Asset type not found: ${input.assetTypeId}`);
    }

    // Check if code already exists
    const existing = await assetsRepository.findByCode(tenantId, input.code);
    if (existing) {
      throw new Error(`Asset with code '${input.code}' already exists`);
    }

    // If parent asset is specified, verify it exists
    if (input.parentAssetId) {
      const parent = await assetsRepository.findById(tenantId, input.parentAssetId);
      if (!parent) {
        throw new Error(`Parent asset not found: ${input.parentAssetId}`);
      }
    }

    // Validate properties against fixed schema
    const validatedProperties = this.validateAgainstSchema(
      input.properties || {},
      (assetType.fixedSchema as Record<string, any>) || {},
      'properties'
    );

    // Validate attributes against attribute schema
    const validatedAttributes = this.validateAgainstSchema(
      input.attributes || {},
      (assetType.attributeSchema as Record<string, any>) || {},
      'attributes'
    );

    return assetsRepository.create(tenantId, userId, {
      assetTypeId: input.assetTypeId,
      code: input.code,
      name: input.name,
      description: input.description,
      parentAssetId: input.parentAssetId,
      latitude: input.latitude?.toString(),
      longitude: input.longitude?.toString(),
      elevationFt: input.elevationFt?.toString(),
      status: input.status,
      properties: validatedProperties,
      attributes: validatedAttributes,
      tags: input.tags,
      metadata: input.metadata,
      legacyType: input.legacyType,
      legacyId: input.legacyId,
    });
  }

  async getAssetById(tenantId: string, id: string, includeType = false): Promise<Asset | null> {
    return assetsRepository.findById(tenantId, id, includeType);
  }

  async getAssetByCode(tenantId: string, code: string): Promise<Asset | null> {
    return assetsRepository.findByCode(tenantId, code);
  }

  async getAssetByLegacyId(tenantId: string, legacyType: string, legacyId: string): Promise<Asset | null> {
    return assetsRepository.findByLegacyId(tenantId, legacyType, legacyId);
  }

  async getAllAssets(
    tenantId: string,
    query: QueryAssetsInput
  ): Promise<{ data: (Asset & { assetType?: AssetType })[]; total: number }> {
    return assetsRepository.findAll(tenantId, query);
  }

  async updateAsset(tenantId: string, id: string, input: UpdateAssetInput): Promise<Asset | null> {
    const existing = await assetsRepository.findById(tenantId, id, true);
    if (!existing) {
      throw new Error(`Asset not found: ${id}`);
    }

    // If changing parent, verify new parent exists
    if (input.parentAssetId) {
      const parent = await assetsRepository.findById(tenantId, input.parentAssetId);
      if (!parent) {
        throw new Error(`Parent asset not found: ${input.parentAssetId}`);
      }
      // Prevent circular reference
      if (input.parentAssetId === id) {
        throw new Error('Asset cannot be its own parent');
      }
    }

    // Validate properties if provided
    if (input.properties && existing.assetType) {
      input.properties = this.validateAgainstSchema(
        input.properties,
        (existing.assetType.fixedSchema as Record<string, any>) || {},
        'properties'
      );
    }

    // Validate attributes if provided
    if (input.attributes && existing.assetType) {
      input.attributes = this.validateAgainstSchema(
        input.attributes,
        (existing.assetType.attributeSchema as Record<string, any>) || {},
        'attributes'
      );
    }

    return assetsRepository.update(tenantId, id, {
      ...input,
      latitude: input.latitude?.toString(),
      longitude: input.longitude?.toString(),
      elevationFt: input.elevationFt?.toString(),
    });
  }

  async updateAssetAttributes(
    tenantId: string,
    assetId: string,
    userId: string,
    input: UpdateAssetAttributesInput
  ): Promise<Asset | null> {
    const existing = await assetsRepository.findById(tenantId, assetId, true);
    if (!existing) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    // Validate attributes
    if (existing.assetType) {
      input.attributes = this.validateAgainstSchema(
        input.attributes,
        (existing.assetType.attributeSchema as Record<string, any>) || {},
        'attributes'
      );
    }

    return assetsRepository.updateAttributes(tenantId, assetId, userId, input.attributes, input.reason);
  }

  async deleteAsset(tenantId: string, id: string): Promise<boolean> {
    const existing = await assetsRepository.findById(tenantId, id);
    if (!existing) {
      throw new Error(`Asset not found: ${id}`);
    }

    // Check for children
    const children = await assetsRepository.getChildren(tenantId, id);
    if (children.length > 0) {
      throw new Error(`Cannot delete asset: ${children.length} child assets exist`);
    }

    return assetsRepository.delete(tenantId, id);
  }

  async getAssetChildren(tenantId: string, parentAssetId: string): Promise<Asset[]> {
    return assetsRepository.getChildren(tenantId, parentAssetId);
  }

  async getAssetAttributeHistory(assetId: string, attributeKey?: string): Promise<any[]> {
    return assetsRepository.getAttributeHistory(assetId, attributeKey);
  }

  async updateComputedValues(tenantId: string, assetId: string, computedValues: Record<string, any>): Promise<Asset | null> {
    return assetsRepository.updateComputedValues(tenantId, assetId, computedValues);
  }

  async updateCurrentTelemetry(tenantId: string, assetId: string, telemetry: Record<string, any>): Promise<Asset | null> {
    return assetsRepository.updateCurrentTelemetry(tenantId, assetId, telemetry);
  }

  private validateAgainstSchema(
    data: Record<string, any>,
    schema: Record<string, any>,
    fieldName: string
  ): Record<string, any> {
    const validated: Record<string, any> = {};

    // Check required fields
    for (const [key, def] of Object.entries(schema)) {
      const fieldDef = def as any;
      if (fieldDef.required && data[key] === undefined) {
        if (fieldDef.default !== undefined) {
          validated[key] = fieldDef.default;
        } else {
          throw new Error(`Required ${fieldName} field '${key}' is missing`);
        }
      }
    }

    // Validate provided fields
    for (const [key, value] of Object.entries(data)) {
      const fieldDef = schema[key] as any;
      
      // Allow extra fields not in schema (flexible attributes)
      if (!fieldDef) {
        validated[key] = value;
        continue;
      }

      // Type validation
      if (fieldDef.type === 'number' && typeof value !== 'number') {
        throw new Error(`${fieldName} field '${key}' must be a number`);
      }
      if (fieldDef.type === 'string' && typeof value !== 'string') {
        throw new Error(`${fieldName} field '${key}' must be a string`);
      }
      if (fieldDef.type === 'boolean' && typeof value !== 'boolean') {
        throw new Error(`${fieldName} field '${key}' must be a boolean`);
      }
      if (fieldDef.type === 'enum' && fieldDef.values && !fieldDef.values.includes(value)) {
        throw new Error(`${fieldName} field '${key}' must be one of: ${fieldDef.values.join(', ')}`);
      }

      // Range validation for numbers
      if (fieldDef.type === 'number') {
        if (fieldDef.min !== undefined && value < fieldDef.min) {
          throw new Error(`${fieldName} field '${key}' must be >= ${fieldDef.min}`);
        }
        if (fieldDef.max !== undefined && value > fieldDef.max) {
          throw new Error(`${fieldName} field '${key}' must be <= ${fieldDef.max}`);
        }
      }

      validated[key] = value;
    }

    return validated;
  }
}

// Export singleton instances
export const assetTypesService = new AssetTypesService();
export const assetsService = new AssetsService();
