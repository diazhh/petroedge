/**
 * Asset Templates Module - Routes
 * 
 * Defines Fastify routes for Asset Template endpoints.
 */

import { FastifyInstance } from 'fastify';
import { AssetTemplatesController } from './asset-templates.controller.js';
import { authMiddleware } from '../../common/middleware/auth.middleware.js';

export default async function assetTemplatesRoutes(fastify: FastifyInstance) {
  const controller = new AssetTemplatesController();

  fastify.get(
    '/',
    {
      onRequest: [authMiddleware],
      schema: {
        tags: ['Asset Templates'],
        summary: 'List all asset templates',
        querystring: {
          type: 'object',
          properties: {
            isActive: { type: 'string', enum: ['true', 'false'] },
            rootAssetTypeId: { type: 'string', format: 'uuid' },
            search: { type: 'string' },
            tags: { type: 'string' },
            page: { type: 'string' },
            perPage: { type: 'string' },
            includeAssetType: { type: 'string', enum: ['true', 'false'] },
            includeStats: { type: 'string', enum: ['true', 'false'] },
          },
        },
      },
    },
    controller.list.bind(controller)
  );

  fastify.get(
    '/stats',
    {
      onRequest: [authMiddleware],
      schema: {
        tags: ['Asset Templates'],
        summary: 'Get asset templates statistics',
      },
    },
    controller.getStats.bind(controller)
  );

  fastify.get(
    '/code/:code',
    {
      onRequest: [authMiddleware],
      schema: {
        tags: ['Asset Templates'],
        summary: 'Get asset template by code',
        params: {
          type: 'object',
          required: ['code'],
          properties: {
            code: { type: 'string' },
          },
        },
      },
    },
    controller.getByCode.bind(controller)
  );

  fastify.get(
    '/:id',
    {
      onRequest: [authMiddleware],
      schema: {
        tags: ['Asset Templates'],
        summary: 'Get asset template by ID',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    controller.getById.bind(controller)
  );

  fastify.post(
    '/',
    {
      onRequest: [authMiddleware],
      schema: {
        tags: ['Asset Templates'],
        summary: 'Create new asset template',
        body: {
          type: 'object',
          required: ['code', 'name', 'rootAssetTypeId', 'components', 'relationships'],
          properties: {
            code: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            rootAssetTypeId: { type: 'string', format: 'uuid' },
            components: { type: 'array' },
            relationships: { type: 'array' },
            defaultProperties: { type: 'object' },
            metadata: { type: 'object' },
            tags: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    controller.create.bind(controller)
  );

  fastify.put(
    '/:id',
    {
      onRequest: [authMiddleware],
      schema: {
        tags: ['Asset Templates'],
        summary: 'Update asset template',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            rootAssetTypeId: { type: 'string', format: 'uuid' },
            components: { type: 'array' },
            relationships: { type: 'array' },
            defaultProperties: { type: 'object' },
            isActive: { type: 'boolean' },
            metadata: { type: 'object' },
            tags: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    controller.update.bind(controller)
  );

  fastify.delete(
    '/:id',
    {
      onRequest: [authMiddleware],
      schema: {
        tags: ['Asset Templates'],
        summary: 'Delete asset template',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    controller.delete.bind(controller)
  );
}
