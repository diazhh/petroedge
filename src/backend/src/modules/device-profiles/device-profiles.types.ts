/**
 * Device Profiles Module - TypeScript Types
 * 
 * Defines types for Device Profile management.
 * Device Profiles configure device types and their telemetry schemas.
 */

import { deviceProfiles } from '../../common/database/schema.js';

// ==================== Database Types ====================

export type DeviceProfile = typeof deviceProfiles.$inferSelect;
export type NewDeviceProfile = typeof deviceProfiles.$inferInsert;

// ==================== Enums ====================

export enum TransportType {
  MODBUS_TCP = 'MODBUS_TCP',
  MODBUS_RTU = 'MODBUS_RTU',
  ETHERNET_IP = 'ETHERNET_IP',
  S7 = 'S7',
  OPCUA = 'OPCUA',
  FINS = 'FINS',
  MQTT = 'MQTT',
  HTTP = 'HTTP',
}

// ==================== Telemetry Schema ====================

export interface TelemetryDefinition {
  type: 'number' | 'string' | 'boolean';
  unit?: string;
  description?: string;
  min?: number;
  max?: number;
  precision?: number;
}

export type TelemetrySchema = Record<string, TelemetryDefinition>;

// ==================== DTOs ====================

export interface CreateDeviceProfileDTO {
  code: string;
  name: string;
  description?: string;
  transportType: TransportType;
  telemetrySchema: TelemetrySchema;
  defaultRuleChainId?: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface UpdateDeviceProfileDTO {
  code?: string;
  name?: string;
  description?: string;
  transportType?: TransportType;
  telemetrySchema?: TelemetrySchema;
  defaultRuleChainId?: string | null;
  isActive?: boolean;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface DeviceProfileFilters {
  isActive?: boolean;
  transportType?: TransportType;
  search?: string;
  tags?: string[];
}

export interface DeviceProfileWithRelations extends DeviceProfile {
  defaultRuleChain?: any;
  dataSourcesCount?: number;
}

// ==================== Repository Options ====================

export interface FindDeviceProfilesOptions {
  tenantId: string;
  filters?: DeviceProfileFilters;
  page?: number;
  perPage?: number;
  includeRuleChain?: boolean;
  includeStats?: boolean;
}

export interface DeviceProfileStats {
  total: number;
  active: number;
  inactive: number;
  byTransportType: Record<TransportType, number>;
}
