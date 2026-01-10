/**
 * Edge Gateways Types
 * 
 * TypeScript types for Edge Gateway management in frontend.
 */

export enum EdgeGatewayStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  ERROR = 'ERROR',
  MAINTENANCE = 'MAINTENANCE',
}

export enum EdgeGatewayConnectionType {
  MQTT = 'MQTT',
  HTTP = 'HTTP',
  WEBSOCKET = 'WEBSOCKET',
}

export interface EdgeGateway {
  id: string;
  tenantId: string;
  gatewayId: string;
  name: string;
  description: string | null;
  location: string | null;
  siteId: string | null;
  ipAddress: string | null;
  port: number;
  status: EdgeGatewayStatus;
  config: Record<string, any> | null;
  lastHeartbeat: string | null;
  tags: string[] | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface EdgeGatewayWithRelations extends EdgeGateway {
  dataSources?: any[];
  asset?: any;
}

// DTOs for API requests
export interface CreateEdgeGatewayDTO {
  name: string;
  description?: string;
  location?: string;
  assetId?: string;
  ipAddress?: string;
  macAddress?: string;
  connectionType: EdgeGatewayConnectionType;
  connectionConfig: Record<string, any>;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface UpdateEdgeGatewayDTO {
  name?: string;
  description?: string;
  location?: string;
  assetId?: string;
  ipAddress?: string;
  macAddress?: string;
  status?: EdgeGatewayStatus;
  connectionType?: EdgeGatewayConnectionType;
  connectionConfig?: Record<string, any>;
  metadata?: Record<string, any>;
  tags?: string[];
}

// Filters
export interface EdgeGatewayFilters {
  status?: EdgeGatewayStatus;
  location?: string;
  assetId?: string;
  search?: string;
  page?: number;
  perPage?: number;
  includeSources?: boolean;
  includeAsset?: boolean;
}

// API Response types
export interface EdgeGatewaysResponse {
  success: boolean;
  data: EdgeGateway[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export interface EdgeGatewayResponse {
  success: boolean;
  data: EdgeGatewayWithRelations;
}

export interface EdgeGatewayStatsResponse {
  success: boolean;
  data: {
    total: number;
    online: number;
    offline: number;
    error: number;
    maintenance: number;
  };
}

// Health & Metrics
export interface EdgeGatewayHealth {
  gatewayId: string;
  status: EdgeGatewayStatus;
  lastHeartbeat: string | null;
  uptime: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  dataSourcesCount: number;
  activeDataSourcesCount: number;
  errorCount: number;
  lastError?: string;
}

export interface EdgeGatewayHealthResponse {
  success: boolean;
  data: EdgeGatewayHealth;
}

// Heartbeat
export interface EdgeGatewayHeartbeat {
  gatewayId: string;
  timestamp: string;
  status: EdgeGatewayStatus;
  version: string;
  uptime: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency?: number;
  activeDataSources: number;
  errorCount: number;
  lastError?: string;
}

// Configuration
export interface EdgeGatewayConfig {
  gatewayId: string;
  version: number;
  dataSources: any[];
  settings: {
    scanRate: number;
    bufferSize: number;
    reconnectInterval: number;
    logLevel: string;
  };
  updatedAt: string;
}

export interface EdgeGatewayConfigResponse {
  success: boolean;
  data: EdgeGatewayConfig;
}
