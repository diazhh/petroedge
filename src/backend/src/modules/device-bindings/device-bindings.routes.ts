/**
 * Device Bindings Module - Routes
 * 
 * Defines Fastify routes for Device Binding endpoints.
 */

import { FastifyInstance } from 'fastify';
import { DeviceBindingsController } from './device-bindings.controller.js';
import { authMiddleware } from '../../common/middleware/auth.middleware.js';

export default async function deviceBindingsRoutes(fastify: FastifyInstance) {
  const controller = new DeviceBindingsController();

  fastify.get(
    '/',
    {
      onRequest: [authMiddleware],
      schema: {
        tags: ['Device Bindings'],
        summary: 'List all device bindings',
        querystring: {
          type: 'object',
          properties: {
            isActive: { type: 'string', enum: ['true', 'false'] },
            dataSourceId: { type: 'string', format: 'uuid' },
            connectivityProfileId: { type: 'string', format: 'uuid' },
            digitalTwinId: { type: 'string', format: 'uuid' },
            search: { type: 'string' },
            tags: { type: 'string' },
            page: { type: 'string' },
            perPage: { type: 'string' },
            includeDataSource: { type: 'string', enum: ['true', 'false'] },
            includeConnectivityProfile: { type: 'string', enum: ['true', 'false'] },
            includeDigitalTwinInstance: { type: 'string', enum: ['true', 'false'] },
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
        tags: ['Device Bindings'],
        summary: 'Get device bindings statistics',
      },
    },
    controller.getStats.bind(controller)
  );

  fastify.get(
    '/:id',
    {
      onRequest: [authMiddleware],
      schema: {
        tags: ['Device Bindings'],
        summary: 'Get device binding by ID',
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
        tags: ['Device Bindings'],
        summary: 'Create new device binding',
        body: {
          type: 'object',
          required: ['dataSourceId', 'connectivityProfileId', 'digitalTwinId'],
          properties: {
            dataSourceId: { type: 'string', format: 'uuid' },
            connectivityProfileId: { type: 'string', format: 'uuid' },
            digitalTwinId: { type: 'string', format: 'uuid' },
            customMappings: { type: 'object' },
            customRuleChainId: { type: 'string', format: 'uuid' },
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
        tags: ['Device Bindings'],
        summary: 'Update device binding',
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
            dataSourceId: { type: 'string', format: 'uuid' },
            connectivityProfileId: { type: 'string', format: 'uuid' },
            digitalTwinId: { type: 'string', format: 'uuid' },
            customMappings: { type: 'object' },
            customRuleChainId: { type: ['string', 'null'], format: 'uuid' },
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
        tags: ['Device Bindings'],
        summary: 'Delete device binding',
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
