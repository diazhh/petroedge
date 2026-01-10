import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../../common/middleware/auth.middleware';
import {
  ingestTelemetry,
  batchIngestTelemetry,
  queryTelemetry,
  getLatestTelemetry,
  getRawTelemetry,
  getTelemetryStats,
} from './telemetry.controller';

async function telemetryRoutes(fastify: FastifyInstance) {
  // Apply auth middleware to all routes
  fastify.addHook('onRequest', authMiddleware);

  // POST /telemetry - Ingest single telemetry point
  fastify.post('/', {
    schema: {
      description: 'Ingest a single telemetry point',
      tags: ['Telemetry'],
      body: {
        type: 'object',
        required: ['assetId', 'telemetryKey'],
        properties: {
          assetId: { type: 'string', format: 'uuid' },
          telemetryKey: { type: 'string', minLength: 1, maxLength: 100 },
          valueNumeric: { type: 'number' },
          valueText: { type: 'string' },
          valueBoolean: { type: 'boolean' },
          quality: { type: 'string', enum: ['GOOD', 'BAD', 'UNCERTAIN', 'SIMULATED'] },
          source: { type: 'string', enum: ['SENSOR', 'MANUAL', 'CALCULATED', 'IMPORTED', 'EDGE'] },
          sourceId: { type: 'string', maxLength: 100 },
          unit: { type: 'string', maxLength: 30 },
          time: { type: 'string', format: 'date-time' },
        },
      },
    },
    handler: ingestTelemetry,
  });

  // POST /telemetry/batch - Batch ingest telemetry points
  fastify.post('/batch', {
    schema: {
      description: 'Batch ingest multiple telemetry points',
      tags: ['Telemetry'],
      body: {
        type: 'object',
        required: ['points'],
        properties: {
          points: {
            type: 'array',
            minItems: 1,
            maxItems: 1000,
            items: {
              type: 'object',
              required: ['assetId', 'telemetryKey'],
              properties: {
                assetId: { type: 'string', format: 'uuid' },
                telemetryKey: { type: 'string' },
                valueNumeric: { type: 'number' },
                valueText: { type: 'string' },
                valueBoolean: { type: 'boolean' },
                quality: { type: 'string' },
                source: { type: 'string' },
                sourceId: { type: 'string' },
                unit: { type: 'string' },
                time: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
    handler: batchIngestTelemetry,
  });

  // GET /telemetry/query - Query telemetry with aggregation
  fastify.get('/query', {
    schema: {
      description: 'Query telemetry data with time bucketing and aggregation',
      tags: ['Telemetry'],
      querystring: {
        type: 'object',
        required: ['assetId', 'startTime', 'endTime'],
        properties: {
          assetId: { type: 'string', format: 'uuid' },
          telemetryKey: { type: 'string' },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          interval: { type: 'string', default: '1 minute' },
          aggregation: { type: 'string', enum: ['avg', 'min', 'max', 'sum', 'count', 'last', 'first'] },
          quality: { type: 'string' },
          limit: { type: 'integer', default: 1000 },
        },
      },
    },
    handler: queryTelemetry,
  });

  // GET /telemetry/assets/:id/latest - Get latest telemetry for asset
  fastify.get('/assets/:id/latest', {
    schema: {
      description: 'Get latest telemetry values for an asset',
      tags: ['Telemetry'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          telemetryKeys: { type: 'string', description: 'Comma-separated list of telemetry keys' },
        },
      },
    },
    handler: getLatestTelemetry,
  });

  // GET /telemetry/assets/:id/raw - Get raw telemetry data
  fastify.get('/assets/:id/raw', {
    schema: {
      description: 'Get raw telemetry data for an asset',
      tags: ['Telemetry'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      querystring: {
        type: 'object',
        required: ['telemetryKey', 'startTime', 'endTime'],
        properties: {
          telemetryKey: { type: 'string' },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          limit: { type: 'integer', default: 1000 },
        },
      },
    },
    handler: getRawTelemetry,
  });

  // GET /telemetry/assets/:id/stats - Get telemetry statistics
  fastify.get('/assets/:id/stats', {
    schema: {
      description: 'Get telemetry statistics (min, max, avg, etc.) for an asset',
      tags: ['Telemetry'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      querystring: {
        type: 'object',
        required: ['telemetryKey', 'startTime', 'endTime'],
        properties: {
          telemetryKey: { type: 'string' },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
        },
      },
    },
    handler: getTelemetryStats,
  });
}

export default telemetryRoutes;
export { telemetryRoutes };
