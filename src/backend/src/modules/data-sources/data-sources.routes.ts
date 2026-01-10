import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { DataSourcesController } from './data-sources.controller.js';
import {
  createDataSourceSchema,
  updateDataSourceSchema,
  createDataSourceTagSchema,
  updateDataSourceTagSchema,
} from './data-sources.schema.js';
import { authMiddleware } from '../../common/middleware/auth.middleware.js';
import { requirePermission } from '../../common/middleware/rbac.middleware.js';

const controller = new DataSourcesController();

export default async function dataSourcesRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('onRequest', authMiddleware);

  // ==================== Data Sources ====================

  // List data sources
  fastify.get(
    '/',
    {
      preHandler: [requirePermission('assets:read')],
      schema: {
        tags: ['Data Sources'],
        summary: 'List data sources',
        description: 'Get a paginated list of data sources with optional filters',
        querystring: {
          type: 'object',
          properties: {
            edgeGatewayId: { type: 'string', format: 'uuid' },
            protocol: { type: 'string' },
            status: { type: 'string' },
            enabled: { type: 'boolean' },
            page: { type: 'integer', minimum: 1, default: 1 },
            perPage: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'array' },
              meta: {
                type: 'object',
                properties: {
                  total: { type: 'integer' },
                  page: { type: 'integer' },
                  perPage: { type: 'integer' },
                  totalPages: { type: 'integer' },
                },
              },
            },
          },
        },
      },
    },
    controller.listDataSources.bind(controller)
  );

  // Get data source by ID
  fastify.get(
    '/:id',
    {
      preHandler: [requirePermission('assets:read')],
      schema: {
        tags: ['Data Sources'],
        summary: 'Get data source',
        description: 'Get a data source by ID, optionally including tags',
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
            includeTags: { type: 'boolean' },
          },
        },
      },
    },
    controller.getDataSource.bind(controller)
  );

  // Create data source
  fastify.post(
    '/',
    {
      preHandler: [requirePermission('assets:create')],
      schema: {
        tags: ['Data Sources'],
        summary: 'Create data source',
        description: 'Create a new data source configuration',
        body: zodToJsonSchema(createDataSourceSchema, 'createDataSourceSchema'),
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
    controller.createDataSource.bind(controller)
  );

  // Update data source
  fastify.put(
    '/:id',
    {
      preHandler: [requirePermission('assets:update')],
      schema: {
        tags: ['Data Sources'],
        summary: 'Update data source',
        description: 'Update an existing data source configuration',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: zodToJsonSchema(updateDataSourceSchema, 'updateDataSourceSchema'),
      },
    },
    controller.updateDataSource.bind(controller)
  );

  // Delete data source
  fastify.delete(
    '/:id',
    {
      preHandler: [requirePermission('assets:delete')],
      schema: {
        tags: ['Data Sources'],
        summary: 'Delete data source',
        description: 'Delete a data source and all its tags',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          204: {
            type: 'null',
            description: 'Data source deleted successfully',
          },
        },
      },
    },
    controller.deleteDataSource.bind(controller)
  );

  // Get data source health
  fastify.get(
    '/:id/health',
    {
      preHandler: [requirePermission('assets:read')],
      schema: {
        tags: ['Data Sources'],
        summary: 'Get data source health',
        description: 'Get health metrics for a data source',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    controller.getDataSourceHealth.bind(controller)
  );

  // ==================== Data Source Tags ====================

  // List tags for a data source
  fastify.get(
    '/:dataSourceId/tags',
    {
      preHandler: [requirePermission('assets:read')],
      schema: {
        tags: ['Data Source Tags'],
        summary: 'List data source tags',
        description: 'Get a paginated list of tags for a data source',
        params: {
          type: 'object',
          required: ['dataSourceId'],
          properties: {
            dataSourceId: { type: 'string', format: 'uuid' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            assetId: { type: 'string', format: 'uuid' },
            enabled: { type: 'boolean' },
            page: { type: 'integer', minimum: 1, default: 1 },
            perPage: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          },
        },
      },
    },
    controller.listDataSourceTags.bind(controller)
  );

  // Get tag by ID
  fastify.get(
    '/tags/:id',
    {
      preHandler: [requirePermission('assets:read')],
      schema: {
        tags: ['Data Source Tags'],
        summary: 'Get data source tag',
        description: 'Get a data source tag by ID',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    controller.getDataSourceTag.bind(controller)
  );

  // Create tag
  fastify.post(
    '/:dataSourceId/tags',
    {
      preHandler: [requirePermission('assets:create')],
      schema: {
        tags: ['Data Source Tags'],
        summary: 'Create data source tag',
        description: 'Create a new tag for a data source',
        params: {
          type: 'object',
          required: ['dataSourceId'],
          properties: {
            dataSourceId: { type: 'string', format: 'uuid' },
          },
        },
        body: zodToJsonSchema(createDataSourceTagSchema, 'createDataSourceTagSchema'),
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
    controller.createDataSourceTag.bind(controller)
  );

  // Batch create tags
  fastify.post(
    '/:dataSourceId/tags/batch',
    {
      preHandler: [requirePermission('assets:create')],
      schema: {
        tags: ['Data Source Tags'],
        summary: 'Batch create tags',
        description: 'Create multiple tags for a data source in one request',
        params: {
          type: 'object',
          required: ['dataSourceId'],
          properties: {
            dataSourceId: { type: 'string', format: 'uuid' },
          },
        },
        body: zodToJsonSchema(
          z.object({
            tags: z.array(createDataSourceTagSchema),
          }),
          'batchCreateTagsSchema'
        ),
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'array' },
              meta: {
                type: 'object',
                properties: {
                  total: { type: 'integer' },
                },
              },
            },
          },
        },
      },
    },
    controller.batchCreateTags.bind(controller)
  );

  // Update tag
  fastify.put(
    '/tags/:id',
    {
      preHandler: [requirePermission('assets:update')],
      schema: {
        tags: ['Data Source Tags'],
        summary: 'Update data source tag',
        description: 'Update an existing data source tag',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: zodToJsonSchema(updateDataSourceTagSchema, 'updateDataSourceTagSchema'),
      },
    },
    controller.updateDataSourceTag.bind(controller)
  );

  // Delete tag
  fastify.delete(
    '/tags/:id',
    {
      preHandler: [requirePermission('assets:delete')],
      schema: {
        tags: ['Data Source Tags'],
        summary: 'Delete data source tag',
        description: 'Delete a data source tag',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          204: {
            type: 'null',
            description: 'Tag deleted successfully',
          },
        },
      },
    },
    controller.deleteDataSourceTag.bind(controller)
  );
}
