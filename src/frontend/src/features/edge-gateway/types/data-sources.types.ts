/**
 * Data Sources Types
 * 
 * TypeScript types for Data Sources and Tags management in frontend.
 */

export enum DataSourceProtocol {
  MODBUS_TCP = 'MODBUS_TCP',
  ETHERNET_IP = 'ETHERNET_IP',
  S7 = 'S7',
  OPCUA = 'OPCUA',
  FINS = 'FINS',
}

export enum DataSourceStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
  CONNECTING = 'CONNECTING',
}

export interface DataSource {
  id: string;
  tenantId: string;
  edgeGatewayId: string;
  name: string;
  description: string | null;
  protocol: DataSourceProtocol;
  connectionConfig: Record<string, any>;
  status: DataSourceStatus;
  enabled: boolean;
  scanRate: number;
  timeout: number;
  retryAttempts: number;
  lastSuccessfulRead: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
  tags: string[] | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface DataSourceTag {
  id: string;
  tenantId: string;
  dataSourceId: string;
  assetId: string | null;
  name: string;
  description: string | null;
  address: string;
  dataType: string;
  unit: string | null;
  scaleFactor: number;
  offset: number;
  deadband: number;
  enabled: boolean;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface DataSourceWithTags extends DataSource {
  dataSourceTags?: DataSourceTag[];
  tagCount?: number;
}

// DTOs for API requests
export interface CreateDataSourceDTO {
  name: string;
  description?: string;
  edgeGatewayId: string;
  protocol: DataSourceProtocol;
  connectionConfig: Record<string, any>;
  scanRate?: number;
  timeout?: number;
  retryAttempts?: number;
  enabled?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateDataSourceDTO {
  name?: string;
  description?: string;
  connectionConfig?: Record<string, any>;
  scanRate?: number;
  timeout?: number;
  retryAttempts?: number;
  enabled?: boolean;
  status?: DataSourceStatus;
  metadata?: Record<string, any>;
}

export interface CreateDataSourceTagDTO {
  dataSourceId: string;
  assetId?: string;
  name: string;
  description?: string;
  address: string;
  dataType: string;
  unit?: string;
  scaleFactor?: number;
  offset?: number;
  deadband?: number;
  enabled?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateDataSourceTagDTO {
  name?: string;
  description?: string;
  address?: string;
  dataType?: string;
  unit?: string;
  scaleFactor?: number;
  offset?: number;
  deadband?: number;
  enabled?: boolean;
  assetId?: string;
  metadata?: Record<string, any>;
}

// Filters
export interface DataSourceFilters {
  edgeGatewayId?: string;
  protocol?: DataSourceProtocol;
  status?: DataSourceStatus;
  enabled?: boolean;
  search?: string;
  page?: number;
  perPage?: number;
  includeTags?: boolean;
}

export interface DataSourceTagFilters {
  dataSourceId?: string;
  assetId?: string;
  enabled?: boolean;
  search?: string;
  page?: number;
  perPage?: number;
}

// API Response types
export interface DataSourcesResponse {
  success: boolean;
  data: DataSource[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export interface DataSourceResponse {
  success: boolean;
  data: DataSourceWithTags;
}

export interface DataSourceTagsResponse {
  success: boolean;
  data: DataSourceTag[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export interface DataSourceStatsResponse {
  success: boolean;
  data: {
    total: number;
    connected: number;
    disconnected: number;
    error: number;
    enabled: number;
    disabled: number;
    byProtocol: Record<DataSourceProtocol, number>;
  };
}

// Connection Config types by protocol
export interface ModbusTCPConfig {
  host: string;
  port: number;
  unitId: number;
  timeout?: number;
}

export interface EthernetIPConfig {
  host: string;
  slot: number;
  timeout?: number;
}

export interface S7Config {
  host: string;
  rack: number;
  slot: number;
  timeout?: number;
}

export interface OPCUAConfig {
  endpointUrl: string;
  securityMode?: 'None' | 'Sign' | 'SignAndEncrypt';
  securityPolicy?: string;
  username?: string;
  password?: string;
  timeout?: number;
}

export interface FinsConfig {
  host: string;
  port: number;
  da1: number;
  da2: number;
  sa1: number;
  sa2: number;
  timeout?: number;
}

export type ConnectionConfig = 
  | ModbusTCPConfig 
  | EthernetIPConfig 
  | S7Config 
  | OPCUAConfig 
  | FinsConfig;
