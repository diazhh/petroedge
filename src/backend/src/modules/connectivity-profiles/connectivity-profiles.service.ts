/**
 * Connectivity Profiles Module - Service Layer
 * 
 * Business logic for Connectivity Profile management.
 */

import { ConnectivityProfilesRepository } from './connectivity-profiles.repository.js';
import {
  CreateConnectivityProfileDTO,
  UpdateConnectivityProfileDTO,
  ConnectivityProfileFilters,
  ConnectivityProfile,
  ConnectivityProfileWithRelations,
  ConnectivityProfileStats,
  ValidateMappingsResult,
  TelemetryMapping,
} from './connectivity-profiles.types.js';

export class ConnectivityProfilesService {
  private repository: ConnectivityProfilesRepository;

  constructor() {
    this.repository = new ConnectivityProfilesRepository();
  }

  async findAll(
    tenantId: string,
    filters?: ConnectivityProfileFilters,
    page: number = 1,
    perPage: number = 20,
    includeDeviceProfile: boolean = false,
    includeAssetTemplate: boolean = false,
    includeStats: boolean = false
  ): Promise<{ profiles: ConnectivityProfileWithRelations[]; total: number }> {
    return this.repository.findAll({
      tenantId,
      filters,
      page,
      perPage,
      includeDeviceProfile,
      includeAssetTemplate,
      includeStats,
    });
  }

  async findById(id: string, tenantId: string): Promise<ConnectivityProfile> {
    const profile = await this.repository.findById(id, tenantId);
    
    if (!profile) {
      throw {
        statusCode: 404,
        code: 'CONNECTIVITY_PROFILE_NOT_FOUND',
        message: `Connectivity profile with ID ${id} not found`,
      };
    }

    return profile;
  }

  async findByCode(code: string, tenantId: string): Promise<ConnectivityProfile> {
    const profile = await this.repository.findByCode(code, tenantId);
    
    if (!profile) {
      throw {
        statusCode: 404,
        code: 'CONNECTIVITY_PROFILE_NOT_FOUND',
        message: `Connectivity profile with code ${code} not found`,
      };
    }

    return profile;
  }

  async create(
    tenantId: string,
    userId: string,
    data: CreateConnectivityProfileDTO
  ): Promise<ConnectivityProfile> {
    const codeExists = await this.repository.codeExists(data.code, tenantId);
    
    if (codeExists) {
      throw {
        statusCode: 409,
        code: 'CONNECTIVITY_PROFILE_CODE_EXISTS',
        message: `Connectivity profile with code ${data.code} already exists`,
      };
    }

    const validation = this.validateMappings(data.telemetryMappings);
    if (!validation.valid) {
      throw {
        statusCode: 400,
        code: 'INVALID_MAPPINGS',
        message: 'Telemetry mappings validation failed',
        details: validation.errors,
      };
    }

    const profile = await this.repository.create({
      ...data,
      tenantId,
      createdBy: userId,
      isActive: true,
    });

    return profile;
  }

  async update(
    id: string,
    tenantId: string,
    userId: string,
    data: UpdateConnectivityProfileDTO
  ): Promise<ConnectivityProfile> {
    const existing = await this.findById(id, tenantId);

    if (data.code && data.code !== existing.code) {
      const codeExists = await this.repository.codeExists(data.code, tenantId, id);
      
      if (codeExists) {
        throw {
          statusCode: 409,
          code: 'CONNECTIVITY_PROFILE_CODE_EXISTS',
          message: `Connectivity profile with code ${data.code} already exists`,
        };
      }
    }

    if (data.telemetryMappings) {
      const validation = this.validateMappings(data.telemetryMappings);
      if (!validation.valid) {
        throw {
          statusCode: 400,
          code: 'INVALID_MAPPINGS',
          message: 'Telemetry mappings validation failed',
          details: validation.errors,
        };
      }
    }

    const updated = await this.repository.update(id, tenantId, data);

    if (!updated) {
      throw {
        statusCode: 404,
        code: 'CONNECTIVITY_PROFILE_NOT_FOUND',
        message: `Connectivity profile with ID ${id} not found`,
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
        message: 'Failed to delete connectivity profile',
      };
    }
  }

  async getStats(tenantId: string): Promise<ConnectivityProfileStats> {
    return this.repository.getStats(tenantId);
  }

  private validateMappings(mappings: TelemetryMapping[]): ValidateMappingsResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const deviceKeys = new Set<string>();
    const assetPaths = new Set<string>();

    for (const mapping of mappings) {
      if (deviceKeys.has(mapping.deviceKey)) {
        errors.push(`Duplicate device key: ${mapping.deviceKey}`);
      }
      deviceKeys.add(mapping.deviceKey);

      const assetPath = `${mapping.assetComponentCode}.${mapping.assetPropertyKey}`;
      if (assetPaths.has(assetPath)) {
        warnings.push(`Multiple device keys mapped to same asset property: ${assetPath}`);
      }
      assetPaths.add(assetPath);

      if (mapping.transform?.type === 'formula' && !mapping.transform.params.expression) {
        errors.push(`Formula transform for ${mapping.deviceKey} missing expression parameter`);
      }

      if (mapping.transform?.type === 'lookup' && !mapping.transform.params.table) {
        errors.push(`Lookup transform for ${mapping.deviceKey} missing table parameter`);
      }

      if (mapping.validation) {
        if (mapping.validation.min !== undefined && mapping.validation.max !== undefined) {
          if (mapping.validation.min > mapping.validation.max) {
            errors.push(`Invalid validation range for ${mapping.deviceKey}: min > max`);
          }
        }
      }
    }

    if (mappings.length === 0) {
      errors.push('At least one telemetry mapping is required');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
