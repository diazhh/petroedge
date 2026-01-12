/**
 * Device Profiles Module - Service Layer
 * 
 * Business logic for Device Profile management.
 */

import { DeviceProfilesRepository } from './device-profiles.repository.js';
import {
  CreateDeviceProfileDTO,
  UpdateDeviceProfileDTO,
  DeviceProfileFilters,
  DeviceProfile,
  DeviceProfileWithRelations,
  DeviceProfileStats,
} from './device-profiles.types.js';

export class DeviceProfilesService {
  private repository: DeviceProfilesRepository;

  constructor() {
    this.repository = new DeviceProfilesRepository();
  }

  /**
   * Get all device profiles with pagination
   */
  async findAll(
    tenantId: string,
    userId: string,
    filters?: DeviceProfileFilters,
    page: number = 1,
    perPage: number = 20,
    includeRuleChain: boolean = false,
    includeStats: boolean = false
  ): Promise<{ profiles: DeviceProfileWithRelations[]; total: number }> {
    return this.repository.findAll({
      tenantId,
      filters,
      page,
      perPage,
      includeRuleChain,
      includeStats,
    });
  }

  /**
   * Get device profile by ID
   */
  async findById(id: string, tenantId: string): Promise<DeviceProfile> {
    const profile = await this.repository.findById(id, tenantId);
    
    if (!profile) {
      throw {
        statusCode: 404,
        code: 'DEVICE_PROFILE_NOT_FOUND',
        message: `Device profile with ID ${id} not found`,
      };
    }

    return profile;
  }

  /**
   * Get device profile by code
   */
  async findByCode(code: string, tenantId: string): Promise<DeviceProfile> {
    const profile = await this.repository.findByCode(code, tenantId);
    
    if (!profile) {
      throw {
        statusCode: 404,
        code: 'DEVICE_PROFILE_NOT_FOUND',
        message: `Device profile with code ${code} not found`,
      };
    }

    return profile;
  }

  /**
   * Create new device profile
   */
  async create(
    tenantId: string,
    userId: string,
    data: CreateDeviceProfileDTO
  ): Promise<DeviceProfile> {
    const codeExists = await this.repository.codeExists(data.code, tenantId);
    
    if (codeExists) {
      throw {
        statusCode: 409,
        code: 'DEVICE_PROFILE_CODE_EXISTS',
        message: `Device profile with code ${data.code} already exists`,
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

  /**
   * Update device profile
   */
  async update(
    id: string,
    tenantId: string,
    userId: string,
    data: UpdateDeviceProfileDTO
  ): Promise<DeviceProfile> {
    const existing = await this.findById(id, tenantId);

    if (data.code && data.code !== existing.code) {
      const codeExists = await this.repository.codeExists(data.code, tenantId, id);
      
      if (codeExists) {
        throw {
          statusCode: 409,
          code: 'DEVICE_PROFILE_CODE_EXISTS',
          message: `Device profile with code ${data.code} already exists`,
        };
      }
    }

    const updated = await this.repository.update(id, tenantId, data);

    if (!updated) {
      throw {
        statusCode: 404,
        code: 'DEVICE_PROFILE_NOT_FOUND',
        message: `Device profile with ID ${id} not found`,
      };
    }

    return updated;
  }

  /**
   * Delete device profile
   */
  async delete(id: string, tenantId: string): Promise<void> {
    await this.findById(id, tenantId);

    const deleted = await this.repository.delete(id, tenantId);

    if (!deleted) {
      throw {
        statusCode: 500,
        code: 'DELETE_FAILED',
        message: 'Failed to delete device profile',
      };
    }
  }

  /**
   * Get statistics
   */
  async getStats(tenantId: string): Promise<DeviceProfileStats> {
    return this.repository.getStats(tenantId);
  }
}
