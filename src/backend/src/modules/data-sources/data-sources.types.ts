import { DataSource, NewDataSource, DataSourceTag, NewDataSourceTag } from '../../common/database/schema.js';

// Re-export database types
export type { DataSource, NewDataSource, DataSourceTag, NewDataSourceTag };

// Protocol-specific connection configurations
export interface ModbusConnectionConfig {
  host: string;
  port: number;
  unitId?: number;
  timeout?: number;
}

export interface EthernetIpConnectionConfig {
  host: string;
  port?: number;
  slot?: number;
  timeout?: number;
}

export interface S7ConnectionConfig {
  host: string;
  port?: number;
  rack: number;
  slot: number;
  timeout?: number;
}

export interface OpcuaConnectionConfig {
  endpointUrl: string;
  username?: string;
  password?: string;
  securityMode?: 'None' | 'Sign' | 'SignAndEncrypt';
  securityPolicy?: string;
  timeout?: number;
}

export type ConnectionConfig = 
  | ModbusConnectionConfig 
  | EthernetIpConnectionConfig 
  | S7ConnectionConfig 
  | OpcuaConnectionConfig;

// Protocol-specific tag configurations
export interface ModbusTagConfig {
  unitId?: number;
  registerType: 'holding' | 'input' | 'coil' | 'discrete';
  address: number;
  quantity: number;
  dataType: string;
}

export interface EthernetIpTagConfig {
  tagName: string;
  dataType: string;
}

export interface S7TagConfig {
  dbNumber: number;
  offset: number;
  dataType: string;
}

export interface OpcuaTagConfig {
  nodeId: string;
  dataType: string;
}

export type ProtocolTagConfig = 
  | ModbusTagConfig 
  | EthernetIpTagConfig 
  | S7TagConfig 
  | OpcuaTagConfig;

// API Request/Response types
export interface CreateDataSourceRequest {
  name: string;
  description?: string;
  protocol: 'MODBUS_TCP' | 'MODBUS_RTU' | 'ETHERNET_IP' | 'S7' | 'OPCUA' | 'FINS' | 'MQTT' | 'HTTP';
  edgeGatewayId: string;
  connectionConfig: ConnectionConfig;
  enabled?: boolean;
  scanRate?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateDataSourceRequest {
  name?: string;
  description?: string;
  connectionConfig?: ConnectionConfig;
  enabled?: boolean;
  scanRate?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CreateDataSourceTagRequest {
  tagId: string;
  name: string;
  description?: string;
  assetId?: string;
  telemetryKey?: string;
  protocolConfig: ProtocolTagConfig;
  dataType: 'INT16' | 'UINT16' | 'INT32' | 'UINT32' | 'FLOAT32' | 'FLOAT64' | 'BOOLEAN' | 'STRING';
  unit?: string;
  scaleFactor?: number;
  offset?: number;
  deadband?: number;
  minValue?: number;
  maxValue?: number;
  scanRate?: number;
  enabled?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateDataSourceTagRequest {
  name?: string;
  description?: string;
  assetId?: string;
  telemetryKey?: string;
  protocolConfig?: ProtocolTagConfig;
  dataType?: 'INT16' | 'UINT16' | 'INT32' | 'UINT32' | 'FLOAT32' | 'FLOAT64' | 'BOOLEAN' | 'STRING';
  unit?: string;
  scaleFactor?: number;
  offset?: number;
  deadband?: number;
  minValue?: number;
  maxValue?: number;
  scanRate?: number;
  enabled?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface DataSourceWithTags extends Omit<DataSource, 'tags'> {
  tags: string[]; // Metadata tags
  dataSourceTags: DataSourceTag[]; // Actual data source tags
  tagCount: number;
}

export interface DataSourceHealthMetrics {
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'MAINTENANCE';
  lastSuccessfulRead?: Date;
  lastError?: string;
  lastErrorAt?: Date;
  errorCount: number;
  avgLatencyMs?: number;
  successRate?: number;
  connectedTagsCount: number;
  totalTagsCount: number;
}
