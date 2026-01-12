/**
 * Device Profiles Module - Routes
 * 
 * Defines Fastify routes for Device Profile endpoints.
 */

import { FastifyInstance } from 'fastify';
import { DeviceProfilesController } from './device-profiles.controller.js';
import { authMiddleware } from '../../common/middleware/auth.middleware.js';

export default async function deviceProfilesRoutes(fastify: FastifyInstance) {
  const controller = new DeviceProfilesController();

  fastify.get(
    '/',
    {
      onRequest: [authMiddleware],
      schema: {
        tags: ['Device Profiles'],
        summary: 'List all device profiles',
        querystring: {
          type: 'object',
          properties: {
            isActive: { type: 'string', enum: ['true', 'false'] },
            transportType: { type: 'string' },
            search: { type: 'string' },
            tags: { type: 'string' },
            page: { type: 'string' },
            perPage: { type: 'string' },
            includeRuleChain: { type: 'string', enum: ['true', 'false'] },
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
        tags: ['Device Profiles'],
        summary: 'Get device profiles statistics',
      },
    },
    controller.getStats.bind(controller)
  );

  fastify.get(
    '/code/:code',
    {
      onRequest: [authMiddleware],
      schema: {
        tags: ['Device Profiles'],
        summary: 'Get device profile by code',
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
        tags: ['Device Profiles'],
        summary: 'Get device profile by ID',
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
        tags: ['Device Profiles'],
        summary: 'Create new device profile',
        body: {
          type: 'object',
          required: ['code', 'name', 'transportType', 'telemetrySchema'],
          properties: {
            code: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            transportType: { type: 'string' },
            telemetrySchema: { type: 'object' },
            defaultRuleChainId: { type: 'string', format: 'uuid' },
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
        tags: ['Device Profiles'],
        summary: 'Update device profile',
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
            transportType: { type: 'string' },
            telemetrySchema: { type: 'object' },
            defaultRuleChainId: { type: 'string', format: 'uuid' },
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
        tags: ['Device Profiles'],
        summary: 'Delete device profile',
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
