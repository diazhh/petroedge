/**
 * Device Bindings Module - Service Layer
 * 
 * Business logic for Device Binding management.
 */

import { DeviceBindingsRepository } from './device-bindings.repository.js';
import {
  CreateDeviceBindingDTO,
  UpdateDeviceBindingDTO,
  DeviceBindingFilters,
  DeviceBinding,
  DeviceBindingWithRelations,
  DeviceBindingStats,
  ValidateBindingResult,
} from './device-bindings.types.js';

export class DeviceBindingsService {
  private repository: DeviceBindingsRepository;

  constructor() {
    this.repository = new DeviceBindingsRepository();
  }

  async findAll(
    tenantId: string,
    filters?: DeviceBindingFilters,
    page: number = 1,
    perPage: number = 20,
    includeDataSource: boolean = false,
    includeConnectivityProfile: boolean = false,
    includeDigitalTwinInstance: boolean = false
  ): Promise<{ bindings: DeviceBindingWithRelations[]; total: number }> {
    return this.repository.findAll({
      tenantId,
      filters,
      page,
      perPage,
      includeDataSource,
      includeConnectivityProfile,
      includeDigitalTwinInstance,
    });
  }

  async findById(id: string, tenantId: string): Promise<DeviceBinding> {
    const binding = await this.repository.findById(id, tenantId);
    
    if (!binding) {
      throw {
        statusCode: 404,
        code: 'DEVICE_BINDING_NOT_FOUND',
        message: `Device binding with ID ${id} not found`,
      };
    }

    return binding;
  }

  async create(
    tenantId: string,
    userId: string,
    data: CreateDeviceBindingDTO
  ): Promise<DeviceBinding> {
    const exists = await this.repository.bindingExists(
      data.dataSourceId,
      data.digitalTwinId,
      tenantId
    );
    
    if (exists) {
      throw {
        statusCode: 409,
        code: 'DEVICE_BINDING_EXISTS',
        message: `Binding between data source ${data.dataSourceId} and digital twin ${data.digitalTwinId} already exists`,
      };
    }

    const validation = this.validateBinding(data);
    if (!validation.valid) {
      throw {
        statusCode: 400,
        code: 'INVALID_BINDING',
        message: 'Device binding validation failed',
        details: validation.errors,
      };
    }

    const binding = await this.repository.create({
      ...data,
      tenantId,
      createdBy: userId,
      isActive: true,
    });

    return binding;
  }

  async update(
    id: string,
    tenantId: string,
    userId: string,
    data: UpdateDeviceBindingDTO
  ): Promise<DeviceBinding> {
    const existing = await this.findById(id, tenantId);

    if (data.dataSourceId && data.digitalTwinId) {
      if (data.dataSourceId !== existing.dataSourceId || data.digitalTwinId !== existing.digitalTwinId) {
        const exists = await this.repository.bindingExists(
          data.dataSourceId,
          data.digitalTwinId,
          tenantId,
          id
        );
        
        if (exists) {
          throw {
            statusCode: 409,
            code: 'DEVICE_BINDING_EXISTS',
            message: `Binding between data source ${data.dataSourceId} and digital twin ${data.digitalTwinId} already exists`,
          };
        }
      }
    }

    const updated = await this.repository.update(id, tenantId, data);

    if (!updated) {
      throw {
        statusCode: 404,
        code: 'DEVICE_BINDING_NOT_FOUND',
        message: `Device binding with ID ${id} not found`,
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
        message: 'Failed to delete device binding',
      };
    }
  }

  async getStats(tenantId: string): Promise<DeviceBindingStats> {
    return this.repository.getStats(tenantId);
  }

  private validateBinding(data: CreateDeviceBindingDTO): ValidateBindingResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (data.customMappings && typeof data.customMappings !== 'object') {
      errors.push('Custom mappings must be a valid JSON object');
    }

    if (data.customRuleChainId && data.customMappings) {
      warnings.push('Both custom rule chain and custom mappings specified - custom rule chain takes precedence');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
