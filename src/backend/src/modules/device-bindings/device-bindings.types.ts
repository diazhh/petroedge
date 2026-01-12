/**
 * Device Bindings Module - TypeScript Types
 * 
 * Defines types for Device Binding management.
 * Device Bindings link a physical device (data source) to a Digital Twin instance.
 */

import { deviceBindings } from '../../common/database/schema.js';

// ==================== Database Types ====================

export type DeviceBinding = typeof deviceBindings.$inferSelect;
export type NewDeviceBinding = typeof deviceBindings.$inferInsert;

// ==================== DTOs ====================

export interface CreateDeviceBindingDTO {
  dataSourceId: string;
  connectivityProfileId: string;
  digitalTwinId: string;
  customMappings?: Record<string, any>;
  customRuleChainId?: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface UpdateDeviceBindingDTO {
  dataSourceId?: string;
  connectivityProfileId?: string;
  digitalTwinId?: string;
  customMappings?: Record<string, any>;
  customRuleChainId?: string | null;
  isActive?: boolean;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface DeviceBindingFilters {
  isActive?: boolean;
  dataSourceId?: string;
  connectivityProfileId?: string;
  digitalTwinId?: string;
  search?: string;
  tags?: string[];
}

export interface DeviceBindingWithRelations extends DeviceBinding {
  dataSource?: any;
  connectivityProfile?: any;
  digitalTwinInstance?: any;
}

// ==================== Repository Options ====================

export interface FindDeviceBindingsOptions {
  tenantId: string;
  filters?: DeviceBindingFilters;
  page?: number;
  perPage?: number;
  includeDataSource?: boolean;
  includeConnectivityProfile?: boolean;
  includeDigitalTwinInstance?: boolean;
}

export interface DeviceBindingStats {
  total: number;
  active: number;
  inactive: number;
  byConnectivityProfile: Record<string, number>;
  byDataSource: Record<string, number>;
}

// ==================== Validation ====================

export interface ValidateBindingResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
