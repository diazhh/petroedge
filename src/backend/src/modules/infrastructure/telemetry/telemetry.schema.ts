import { z } from 'zod';

// Quality enum values
const telemetryQualityValues = ['GOOD', 'BAD', 'UNCERTAIN', 'SIMULATED'] as const;
const telemetrySourceValues = ['SENSOR', 'MANUAL', 'CALCULATED', 'IMPORTED', 'EDGE'] as const;

// Ingest telemetry point
export const ingestTelemetrySchema = z.object({
  assetId: z.string().uuid(),
  telemetryKey: z.string().min(1).max(100),
  valueNumeric: z.number().optional(),
  valueText: z.string().optional(),
  valueBoolean: z.boolean().optional(),
  quality: z.enum(telemetryQualityValues).optional().default('GOOD'),
  source: z.enum(telemetrySourceValues).optional().default('SENSOR'),
  sourceId: z.string().max(100).optional(),
  unit: z.string().max(30).optional(),
  time: z.string().datetime().optional(), // ISO 8601, defaults to now
});

// Batch ingest telemetry
export const batchIngestTelemetrySchema = z.object({
  points: z.array(ingestTelemetrySchema).min(1).max(1000),
});

// Query telemetry
export const queryTelemetrySchema = z.object({
  assetId: z.string().uuid(),
  telemetryKey: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  interval: z.string().optional().default('1 minute'), // TimescaleDB time_bucket interval
  aggregation: z.enum(['avg', 'min', 'max', 'sum', 'count', 'last', 'first']).optional().default('avg'),
  quality: z.enum(telemetryQualityValues).optional(),
  limit: z.coerce.number().int().positive().max(10000).optional().default(1000),
});

// Get latest telemetry
export const getLatestTelemetrySchema = z.object({
  assetId: z.string().uuid(),
  telemetryKeys: z.array(z.string()).optional(), // If empty, return all
});

// Asset ID param
export const assetIdParamSchema = z.object({
  id: z.string().uuid(),
});

// Type exports
export type IngestTelemetryInput = z.infer<typeof ingestTelemetrySchema>;
export type BatchIngestTelemetryInput = z.infer<typeof batchIngestTelemetrySchema>;
export type QueryTelemetryInput = z.infer<typeof queryTelemetrySchema>;
export type GetLatestTelemetryInput = z.infer<typeof getLatestTelemetrySchema>;
