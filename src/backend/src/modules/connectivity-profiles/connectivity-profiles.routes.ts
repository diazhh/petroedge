/**
 * Connectivity Profiles Module - Routes
 * 
 * Defines Fastify routes for Connectivity Profile endpoints.
 */

import { FastifyInstance } from 'fastify';
import { ConnectivityProfilesController } from './connectivity-profiles.controller.js';
import { authMiddleware } from '../../common/middleware/auth.middleware.js';

export default async function connectivityProfilesRoutes(fastify: FastifyInstance) {
  const controller = new ConnectivityProfilesController();

  fastify.get(
    '/',
    {
      onRequest: [authMiddleware],
      schema: {
        tags: ['Connectivity Profiles'],
        summary: 'List all connectivity profiles',
        querystring: {
          type: 'object',
          properties: {
            isActive: { type: 'string', enum: ['true', 'false'] },
            deviceProfileId: { type: 'string', format: 'uuid' },
            assetTemplateId: { type: 'string', format: 'uuid' },
            search: { type: 'string' },
            tags: { type: 'string' },
            page: { type: 'string' },
            perPage: { type: 'string' },
            includeDeviceProfile: { type: 'string', enum: ['true', 'false'] },
            includeAssetTemplate: { type: 'string', enum: ['true', 'false'] },
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
        tags: ['Connectivity Profiles'],
        summary: 'Get connectivity profiles statistics',
      },
    },
    controller.getStats.bind(controller)
  );

  fastify.get(
    '/code/:code',
    {
      onRequest: [authMiddleware],
      schema: {
        tags: ['Connectivity Profiles'],
        summary: 'Get connectivity profile by code',
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
        tags: ['Connectivity Profiles'],
        summary: 'Get connectivity profile by ID',
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
        tags: ['Connectivity Profiles'],
        summary: 'Create new connectivity profile',
        body: {
          type: 'object',
          required: ['code', 'name', 'deviceProfileId', 'assetTemplateId', 'telemetryMappings'],
          properties: {
            code: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            deviceProfileId: { type: 'string', format: 'uuid' },
            assetTemplateId: { type: 'string', format: 'uuid' },
            telemetryMappings: { type: 'array' },
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
        tags: ['Connectivity Profiles'],
        summary: 'Update connectivity profile',
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
            deviceProfileId: { type: 'string', format: 'uuid' },
            assetTemplateId: { type: 'string', format: 'uuid' },
            telemetryMappings: { type: 'array' },
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
        tags: ['Connectivity Profiles'],
        summary: 'Delete connectivity profile',
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
