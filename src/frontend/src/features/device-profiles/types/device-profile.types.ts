/**
 * Device Profiles - Frontend Types
 */

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

export interface TelemetryDefinition {
  type: 'number' | 'string' | 'boolean';
  unit?: string;
  description?: string;
  min?: number;
  max?: number;
  precision?: number;
}

export type TelemetrySchema = Record<string, TelemetryDefinition>;

export interface DeviceProfile {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  transportType: TransportType;
  telemetrySchema: TelemetrySchema;
  defaultRuleChainId?: string;
  isActive: boolean;
  metadata?: Record<string, any>;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface DeviceProfileWithRelations extends DeviceProfile {
  defaultRuleChain?: {
    id: string;
    name: string;
  };
  dataSourcesCount?: number;
}

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
  page?: number;
  perPage?: number;
}

export interface DeviceProfileStats {
  total: number;
  active: number;
  inactive: number;
  byTransportType: Record<TransportType, number>;
}
