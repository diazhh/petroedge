/**
 * Edge Gateways Module - TypeScript Types
 * 
 * Defines types for Edge Gateway management in the Cloud backend.
 * Edge Gateways are physical devices that collect data from PLCs/sensors
 * and send it to the Cloud platform.
 */

import { edgeGateways } from '../../common/database/schema.js';

// ==================== Database Types ====================

export type EdgeGateway = typeof edgeGateways.$inferSelect;
export type NewEdgeGateway = typeof edgeGateways.$inferInsert;

// ==================== Enums ====================

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

// ==================== DTOs ====================

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
  enabled?: boolean;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface EdgeGatewayFilters {
  status?: EdgeGatewayStatus;
  enabled?: boolean;
  assetId?: string;
  location?: string;
  search?: string; // Search by name or description
}

export interface EdgeGatewayWithRelations extends EdgeGateway {
  dataSources?: any[]; // Will be populated if includeSources=true
  asset?: any; // Will be populated if includeAsset=true
}

// ==================== Health & Metrics ====================

export interface EdgeGatewayHealth {
  gatewayId: string;
  status: EdgeGatewayStatus;
  lastHeartbeat: Date | null;
  uptime: number; // seconds
  cpuUsage: number; // percentage
  memoryUsage: number; // percentage
  diskUsage: number; // percentage
  networkLatency: number; // ms
  dataSourcesCount: number;
  activeDataSourcesCount: number;
  errorCount: number;
  lastError?: string;
}

export interface EdgeGatewayMetrics {
  gatewayId: string;
  timestamp: Date;
  messagesReceived: number;
  messagesSent: number;
  bytesReceived: number;
  bytesSent: number;
  errorsCount: number;
  reconnections: number;
}

// ==================== Heartbeat ====================

export interface EdgeGatewayHeartbeat {
  gatewayId: string;
  timestamp: Date;
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

// ==================== Configuration Sync ====================

export interface EdgeGatewayConfig {
  gatewayId: string;
  version: number;
  dataSources: any[]; // Full data source configurations
  settings: {
    scanRate: number;
    bufferSize: number;
    reconnectInterval: number;
    logLevel: string;
  };
  updatedAt: Date;
}

// ==================== Repository Options ====================

export interface FindEdgeGatewaysOptions {
  tenantId: string;
  filters?: EdgeGatewayFilters;
  page?: number;
  perPage?: number;
  includeSources?: boolean;
  includeAsset?: boolean;
}

export interface EdgeGatewayStats {
  total: number;
  online: number;
  offline: number;
  error: number;
  maintenance: number;
  enabled: number;
  disabled: number;
}
