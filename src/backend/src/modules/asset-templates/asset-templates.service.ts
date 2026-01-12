/**
 * Asset Templates Module - Service Layer
 * 
 * Business logic for Asset Template management.
 */

import { AssetTemplatesRepository } from './asset-templates.repository.js';
import {
  CreateAssetTemplateDTO,
  UpdateAssetTemplateDTO,
  AssetTemplateFilters,
  AssetTemplate,
  AssetTemplateWithRelations,
  AssetTemplateStats,
  ValidateTemplateResult,
  AssetComponent,
  AssetRelationship,
} from './asset-templates.types.js';

export class AssetTemplatesService {
  private repository: AssetTemplatesRepository;

  constructor() {
    this.repository = new AssetTemplatesRepository();
  }

  async findAll(
    tenantId: string,
    filters?: AssetTemplateFilters,
    page: number = 1,
    perPage: number = 20,
    includeAssetType: boolean = false,
    includeStats: boolean = false
  ): Promise<{ templates: AssetTemplateWithRelations[]; total: number }> {
    return this.repository.findAll({
      tenantId,
      filters,
      page,
      perPage,
      includeAssetType,
      includeStats,
    });
  }

  async findById(id: string, tenantId: string): Promise<AssetTemplate> {
    const template = await this.repository.findById(id, tenantId);
    
    if (!template) {
      throw {
        statusCode: 404,
        code: 'ASSET_TEMPLATE_NOT_FOUND',
        message: `Asset template with ID ${id} not found`,
      };
    }

    return template;
  }

  async findByCode(code: string, tenantId: string): Promise<AssetTemplate> {
    const template = await this.repository.findByCode(code, tenantId);
    
    if (!template) {
      throw {
        statusCode: 404,
        code: 'ASSET_TEMPLATE_NOT_FOUND',
        message: `Asset template with code ${code} not found`,
      };
    }

    return template;
  }

  async create(
    tenantId: string,
    userId: string,
    data: CreateAssetTemplateDTO
  ): Promise<AssetTemplate> {
    const codeExists = await this.repository.codeExists(data.code, tenantId);
    
    if (codeExists) {
      throw {
        statusCode: 409,
        code: 'ASSET_TEMPLATE_CODE_EXISTS',
        message: `Asset template with code ${data.code} already exists`,
      };
    }

    const validation = this.validateTemplate(data.components, data.relationships);
    if (!validation.valid) {
      throw {
        statusCode: 400,
        code: 'INVALID_TEMPLATE',
        message: 'Template validation failed',
        details: validation.errors,
      };
    }

    const template = await this.repository.create({
      ...data,
      tenantId,
      createdBy: userId,
      isActive: true,
    });

    return template;
  }

  async update(
    id: string,
    tenantId: string,
    userId: string,
    data: UpdateAssetTemplateDTO
  ): Promise<AssetTemplate> {
    const existing = await this.findById(id, tenantId);

    if (data.code && data.code !== existing.code) {
      const codeExists = await this.repository.codeExists(data.code, tenantId, id);
      
      if (codeExists) {
        throw {
          statusCode: 409,
          code: 'ASSET_TEMPLATE_CODE_EXISTS',
          message: `Asset template with code ${data.code} already exists`,
        };
      }
    }

    if (data.components && data.relationships) {
      const validation = this.validateTemplate(data.components, data.relationships);
      if (!validation.valid) {
        throw {
          statusCode: 400,
          code: 'INVALID_TEMPLATE',
          message: 'Template validation failed',
          details: validation.errors,
        };
      }
    }

    const updated = await this.repository.update(id, tenantId, data);

    if (!updated) {
      throw {
        statusCode: 404,
        code: 'ASSET_TEMPLATE_NOT_FOUND',
        message: `Asset template with ID ${id} not found`,
      };
    }

    return updated;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.findById(id, tenantId);

    const deleted = await this.repository.delete(id, tenantId);

    if (!deleted) {
      throw {
        statusCode: 500,
        code: 'DELETE_FAILED',
        message: 'Failed to delete asset template',
      };
    }
  }

  async getStats(tenantId: string): Promise<AssetTemplateStats> {
    return this.repository.getStats(tenantId);
  }

  private validateTemplate(
    components: AssetComponent[],
    relationships: AssetRelationship[]
  ): ValidateTemplateResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const componentCodes = new Set(components.map(c => c.code));

    for (const component of components) {
      if (component.code === 'root') {
        errors.push('Component code "root" is reserved');
      }
    }

    const duplicates = components
      .map(c => c.code)
      .filter((code, index, arr) => arr.indexOf(code) !== index);
    
    if (duplicates.length > 0) {
      errors.push(`Duplicate component codes: ${duplicates.join(', ')}`);
    }

    for (const rel of relationships) {
      if (rel.from !== 'root' && !componentCodes.has(rel.from)) {
        errors.push(`Relationship references unknown component: ${rel.from}`);
      }
      if (rel.to !== 'root' && !componentCodes.has(rel.to)) {
        errors.push(`Relationship references unknown component: ${rel.to}`);
      }
      if (rel.from === rel.to) {
        errors.push(`Self-referencing relationship: ${rel.from} → ${rel.to}`);
      }
    }

    const requiredComponents = components.filter(c => c.required);
    if (requiredComponents.length === 0 && components.length > 0) {
      warnings.push('No required components defined');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
