import { AssetTypesRepository } from './asset-types.repository';
import type { CreateAssetTypeDTO, UpdateAssetTypeDTO, AssetTypeFilters } from './asset-types.types';

export class AssetTypesService {
  private repository: AssetTypesRepository;

  constructor() {
    this.repository = new AssetTypesRepository();
  }

  async findAll(tenantId: string, filters: AssetTypeFilters) {
    return this.repository.findAll(tenantId, filters);
  }

  async findById(id: string, tenantId: string) {
    const assetType = await this.repository.findById(id, tenantId);
    if (!assetType) {
      throw new Error('Asset Type not found');
    }

    const [assetsCount, childTypes] = await Promise.all([
      this.repository.getAssetsCount(id, tenantId),
      this.repository.getChildTypes(id, tenantId),
    ]);

    return {
      ...assetType,
      assetsCount,
      childTypes: childTypes.map(ct => ({
        id: ct.id,
        code: ct.code,
        name: ct.name,
      })),
    };
  }

  async create(tenantId: string, data: CreateAssetTypeDTO) {
    const existing = await this.repository.findByCode(data.code, tenantId);
    if (existing) {
      throw new Error(`Asset Type with code '${data.code}' already exists`);
    }

    if (data.parentTypeId) {
      const parentType = await this.repository.findById(data.parentTypeId, tenantId);
      if (!parentType) {
        throw new Error('Parent Asset Type not found');
      }
    }

    return this.repository.create(tenantId, data);
  }

  async update(id: string, tenantId: string, data: UpdateAssetTypeDTO) {
    const existing = await this.repository.findById(id, tenantId);
    if (!existing) {
      throw new Error('Asset Type not found');
    }

    if (data.code && data.code !== existing.code) {
      const codeExists = await this.repository.findByCode(data.code, tenantId);
      if (codeExists) {
        throw new Error(`Asset Type with code '${data.code}' already exists`);
      }
    }

    if (data.parentTypeId) {
      const parentType = await this.repository.findById(data.parentTypeId, tenantId);
      if (!parentType) {
        throw new Error('Parent Asset Type not found');
      }

      if (data.parentTypeId === id) {
        throw new Error('Asset Type cannot be its own parent');
      }
    }

    return this.repository.update(id, tenantId, data);
  }

  async delete(id: string, tenantId: string) {
    const existing = await this.repository.findById(id, tenantId);
    if (!existing) {
      throw new Error('Asset Type not found');
    }

    if (existing.isSystem) {
      throw new Error('Cannot delete system Asset Type');
    }

    const assetsCount = await this.repository.getAssetsCount(id, tenantId);
    if (assetsCount > 0) {
      throw new Error(`Cannot delete Asset Type with ${assetsCount} associated assets`);
    }

    const childTypes = await this.repository.getChildTypes(id, tenantId);
    if (childTypes.length > 0) {
      throw new Error(`Cannot delete Asset Type with ${childTypes.length} child types`);
    }

    return this.repository.delete(id, tenantId);
  }

  async getStats(tenantId: string) {
    return this.repository.getStats(tenantId);
  }
}
