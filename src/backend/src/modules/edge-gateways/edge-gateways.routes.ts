/**
 * Edge Gateways Module - Routes Definition
 * 
 * Defines Fastify routes for Edge Gateway management.
 */

import { FastifyInstance } from 'fastify';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { EdgeGatewaysController } from './edge-gateways.controller.js';
import {
  createEdgeGatewaySchema,
  updateEdgeGatewaySchema,
  edgeGatewayFiltersSchema,
  edgeGatewayHeartbeatSchema,
} from './edge-gateways.schema.js';
import { authMiddleware } from '../../common/middleware/auth.middleware.js';
import { requirePermission } from '../../common/middleware/rbac.middleware.js';

const controller = new EdgeGatewaysController();

export default async function edgeGatewaysRoutes(fastify: FastifyInstance) {
  // ==================== Edge Gateways (Authenticated) ====================

  // List edge gateways
  fastify.get(
    '/',
    {
      onRequest: [authMiddleware, requirePermission('assets:read')],
      schema: {
        tags: ['Edge Gateways'],
        summary: 'List edge gateways',
        description: 'Get all edge gateways with filters and pagination',
        querystring: zodToJsonSchema(edgeGatewayFiltersSchema, 'edgeGatewayFiltersSchema'),
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'array' },
              meta: {
                type: 'object',
                properties: {
                  total: { type: 'number' },
                  page: { type: 'number' },
                  perPage: { type: 'number' },
                  totalPages: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    controller.list.bind(controller)
  );

  // Get edge gateway statistics
  fastify.get(
    '/stats',
    {
      onRequest: [authMiddleware, requirePermission('assets:read')],
      schema: {
        tags: ['Edge Gateways'],
        summary: 'Get edge gateway statistics',
        description: 'Get aggregated statistics for all edge gateways',
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  total: { type: 'number' },
                  online: { type: 'number' },
                  offline: { type: 'number' },
                  error: { type: 'number' },
                  maintenance: { type: 'number' },
                  enabled: { type: 'number' },
                  disabled: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    controller.getStats.bind(controller)
  );

  // Get edge gateway by ID
  fastify.get(
    '/:id',
    {
      onRequest: [authMiddleware, requirePermission('assets:read')],
      schema: {
        tags: ['Edge Gateways'],
        summary: 'Get edge gateway by ID',
        description: 'Get detailed information about a specific edge gateway',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        querystring: {
          type: 'object',
          properties: {
            includeSources: { type: 'boolean' },
            includeAsset: { type: 'boolean' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
            },
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    controller.getById.bind(controller)
  );

  // Create edge gateway
  fastify.post(
    '/',
    {
      onRequest: [authMiddleware, requirePermission('assets:create')],
      schema: {
        tags: ['Edge Gateways'],
        summary: 'Create edge gateway',
        description: 'Create a new edge gateway',
        body: zodToJsonSchema(createEdgeGatewaySchema, 'createEdgeGatewaySchema'),
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
            },
          },
          409: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    controller.create.bind(controller)
  );

  // Update edge gateway
  fastify.put(
    '/:id',
    {
      onRequest: [authMiddleware, requirePermission('assets:update')],
      schema: {
        tags: ['Edge Gateways'],
        summary: 'Update edge gateway',
        description: 'Update an existing edge gateway',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        body: zodToJsonSchema(updateEdgeGatewaySchema, 'updateEdgeGatewaySchema'),
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
            },
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    controller.update.bind(controller)
  );

  // Delete edge gateway
  fastify.delete(
    '/:id',
    {
      onRequest: [authMiddleware, requirePermission('assets:delete')],
      schema: {
        tags: ['Edge Gateways'],
        summary: 'Delete edge gateway',
        description: 'Delete an edge gateway',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        response: {
          204: {
            type: 'null',
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    controller.delete.bind(controller)
  );

  // Get edge gateway health
  fastify.get(
    '/:id/health',
    {
      onRequest: [authMiddleware, requirePermission('assets:read')],
      schema: {
        tags: ['Edge Gateways'],
        summary: 'Get edge gateway health',
        description: 'Get health metrics for an edge gateway',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
    controller.getHealth.bind(controller)
  );

  // ==================== Edge Gateway API (No Auth) ====================

  // Heartbeat endpoint (called by edge devices)
  fastify.post(
    '/heartbeat',
    {
      schema: {
        tags: ['Edge Gateway API'],
        summary: 'Edge gateway heartbeat',
        description: 'Endpoint for edge gateways to send heartbeat signals',
        body: zodToJsonSchema(edgeGatewayHeartbeatSchema, 'edgeGatewayHeartbeatSchema'),
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    controller.heartbeat.bind(controller)
  );

  // Configuration endpoint (called by edge devices)
  fastify.get(
    '/:gatewayId/config',
    {
      schema: {
        tags: ['Edge Gateway API'],
        summary: 'Get edge gateway configuration',
        description: 'Endpoint for edge gateways to retrieve their configuration',
        params: {
          type: 'object',
          properties: {
            gatewayId: { type: 'string' },
          },
          required: ['gatewayId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
    controller.getConfig.bind(controller)
  );
}
