import { z } from 'zod';

// Connection config schemas
const modbusConnectionConfigSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  unitId: z.number().int().min(0).max(255).optional(),
  timeout: z.number().int().min(1000).max(30000).optional(),
});

const ethernetIpConnectionConfigSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535).optional(),
  slot: z.number().int().min(0).max(31).optional(),
  timeout: z.number().int().min(1000).max(30000).optional(),
});

const s7ConnectionConfigSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535).optional(),
  rack: z.number().int().min(0).max(7),
  slot: z.number().int().min(0).max(31),
  timeout: z.number().int().min(1000).max(30000).optional(),
});

const opcuaConnectionConfigSchema = z.object({
  endpointUrl: z.string().url(),
  username: z.string().optional(),
  password: z.string().optional(),
  securityMode: z.enum(['None', 'Sign', 'SignAndEncrypt']).optional(),
  securityPolicy: z.string().optional(),
  timeout: z.number().int().min(1000).max(30000).optional(),
});

// Protocol tag config schemas
const modbusTagConfigSchema = z.object({
  unitId: z.number().int().min(0).max(255).optional(),
  registerType: z.enum(['holding', 'input', 'coil', 'discrete']),
  address: z.number().int().min(0),
  quantity: z.number().int().min(1).max(125),
  dataType: z.string(),
});

const ethernetIpTagConfigSchema = z.object({
  tagName: z.string().min(1),
  dataType: z.string(),
});

const s7TagConfigSchema = z.object({
  dbNumber: z.number().int().min(1),
  offset: z.number().int().min(0),
  dataType: z.string(),
});

const opcuaTagConfigSchema = z.object({
  nodeId: z.string().min(1),
  dataType: z.string(),
});

// Data Source schemas
export const createDataSourceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  protocol: z.enum(['MODBUS_TCP', 'MODBUS_RTU', 'ETHERNET_IP', 'S7', 'OPCUA', 'FINS', 'MQTT', 'HTTP']),
  edgeGatewayId: z.string().uuid(),
  connectionConfig: z.union([
    modbusConnectionConfigSchema,
    ethernetIpConnectionConfigSchema,
    s7ConnectionConfigSchema,
    opcuaConnectionConfigSchema,
  ]),
  enabled: z.boolean().optional().default(true),
  scanRate: z.number().int().min(100).max(3600000).optional().default(5000),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateDataSourceSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  connectionConfig: z.union([
    modbusConnectionConfigSchema,
    ethernetIpConnectionConfigSchema,
    s7ConnectionConfigSchema,
    opcuaConnectionConfigSchema,
  ]).optional(),
  enabled: z.boolean().optional(),
  scanRate: z.number().int().min(100).max(3600000).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

// Data Source Tag schemas
export const createDataSourceTagSchema = z.object({
  tagId: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  assetId: z.string().uuid().optional(),
  telemetryKey: z.string().min(1).max(100).optional(),
  protocolConfig: z.union([
    modbusTagConfigSchema,
    ethernetIpTagConfigSchema,
    s7TagConfigSchema,
    opcuaTagConfigSchema,
  ]),
  dataType: z.enum(['INT16', 'UINT16', 'INT32', 'UINT32', 'FLOAT32', 'FLOAT64', 'BOOLEAN', 'STRING']),
  unit: z.string().max(30).optional(),
  scaleFactor: z.number().optional().default(1.0),
  offset: z.number().optional().default(0.0),
  deadband: z.number().optional(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  scanRate: z.number().int().min(100).max(3600000).optional(),
  enabled: z.boolean().optional().default(true),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateDataSourceTagSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  assetId: z.string().uuid().optional(),
  telemetryKey: z.string().min(1).max(100).optional(),
  protocolConfig: z.union([
    modbusTagConfigSchema,
    ethernetIpTagConfigSchema,
    s7TagConfigSchema,
    opcuaTagConfigSchema,
  ]).optional(),
  dataType: z.enum(['INT16', 'UINT16', 'INT32', 'UINT32', 'FLOAT32', 'FLOAT64', 'BOOLEAN', 'STRING']).optional(),
  unit: z.string().max(30).optional(),
  scaleFactor: z.number().optional(),
  offset: z.number().optional(),
  deadband: z.number().optional(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  scanRate: z.number().int().min(100).max(3600000).optional(),
  enabled: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

// Query params schemas
export const listDataSourcesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  perPage: z.coerce.number().int().min(1).max(100).optional().default(20),
  edgeGatewayId: z.string().uuid().optional(),
  protocol: z.enum(['MODBUS_TCP', 'MODBUS_RTU', 'ETHERNET_IP', 'S7', 'OPCUA', 'FINS', 'MQTT', 'HTTP']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ERROR', 'MAINTENANCE']).optional(),
  enabled: z.coerce.boolean().optional(),
});

export const listDataSourceTagsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  perPage: z.coerce.number().int().min(1).max(100).optional().default(20),
  assetId: z.string().uuid().optional(),
  enabled: z.coerce.boolean().optional(),
});
