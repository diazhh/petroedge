/**
 * Edge Gateways Module - Zod Validation Schemas
 * 
 * Defines validation schemas for Edge Gateway API requests.
 */

import { z } from 'zod';
import { EdgeGatewayStatus, EdgeGatewayConnectionType } from './edge-gateways.types.js';

// ==================== Enums ====================

export const edgeGatewayStatusSchema = z.nativeEnum(EdgeGatewayStatus);
export const edgeGatewayConnectionTypeSchema = z.nativeEnum(EdgeGatewayConnectionType);

// ==================== Create Edge Gateway ====================

export const createEdgeGatewaySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  location: z.string().max(200).optional(),
  assetId: z.string().uuid().optional(),
  ipAddress: z.string().ip().optional(),
  macAddress: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/).optional(),
  connectionType: edgeGatewayConnectionTypeSchema,
  connectionConfig: z.record(z.any()),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

// ==================== Update Edge Gateway ====================

export const updateEdgeGatewaySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  location: z.string().max(200).optional(),
  assetId: z.string().uuid().nullable().optional(),
  ipAddress: z.string().ip().optional(),
  macAddress: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/).optional(),
  status: edgeGatewayStatusSchema.optional(),
  connectionType: edgeGatewayConnectionTypeSchema.optional(),
  connectionConfig: z.record(z.any()).optional(),
  enabled: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

// ==================== Query Params ====================

export const edgeGatewayFiltersSchema = z.object({
  status: edgeGatewayStatusSchema.optional(),
  enabled: z.string().transform(val => val === 'true').optional(),
  assetId: z.string().uuid().optional(),
  location: z.string().optional(),
  search: z.string().optional(),
  page: z.string().transform(Number).pipe(z.number().int().min(1)).optional(),
  perPage: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
  includeSources: z.string().transform(val => val === 'true').optional(),
  includeAsset: z.string().transform(val => val === 'true').optional(),
});

// ==================== Heartbeat ====================

export const edgeGatewayHeartbeatSchema = z.object({
  gatewayId: z.string().uuid(),
  timestamp: z.string().datetime().or(z.date()),
  status: edgeGatewayStatusSchema,
  version: z.string(),
  uptime: z.number().int().min(0),
  cpuUsage: z.number().min(0).max(100),
  memoryUsage: z.number().min(0).max(100),
  diskUsage: z.number().min(0).max(100),
  networkLatency: z.number().min(0).optional(),
  activeDataSources: z.number().int().min(0),
  errorCount: z.number().int().min(0),
  lastError: z.string().optional(),
});

// ==================== Configuration Request ====================

export const configRequestSchema = z.object({
  gatewayId: z.string().uuid(),
  currentVersion: z.number().int().min(0).optional(),
});

// ==================== Type Exports ====================

export type CreateEdgeGatewayInput = z.infer<typeof createEdgeGatewaySchema>;
export type UpdateEdgeGatewayInput = z.infer<typeof updateEdgeGatewaySchema>;
export type EdgeGatewayFiltersInput = z.infer<typeof edgeGatewayFiltersSchema>;
export type EdgeGatewayHeartbeatInput = z.infer<typeof edgeGatewayHeartbeatSchema>;
export type ConfigRequestInput = z.infer<typeof configRequestSchema>;
