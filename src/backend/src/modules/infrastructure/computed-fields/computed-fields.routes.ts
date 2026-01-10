import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../../common/middleware/auth.middleware';
import {
  calculateComputedFields,
  getComputedFields,
  recalculateComputedFields,
  validateFormula,
  getComputedFieldDefinitions,
} from './computed-fields.controller';

async function computedFieldsRoutes(fastify: FastifyInstance) {
  // Apply auth middleware to all routes
  fastify.addHook('onRequest', authMiddleware);

  // ============================================================================
  // COMPUTED FIELDS ROUTES
  // ============================================================================

  fastify.post('/calculate', {
    schema: {
      description: 'Calculate computed fields for an asset',
      tags: ['Computed Fields'],
      body: {
        type: 'object',
        required: ['assetId'],
        properties: {
          assetId: { type: 'string', format: 'uuid' },
          fields: {
            type: 'array',
            items: {
              type: 'object',
              required: ['key', 'name', 'formula', 'recalculateOn'],
              properties: {
                key: { type: 'string' },
                name: { type: 'string' },
                unit: { type: 'string' },
                formula: { type: 'string' },
                recalculateOn: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                assetId: { type: 'string' },
                computedFields: { type: 'object' },
                calculatedAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: calculateComputedFields,
  });

  fastify.get('/assets/:assetId', {
    schema: {
      description: 'Get computed fields for an asset',
      tags: ['Computed Fields'],
      params: {
        type: 'object',
        required: ['assetId'],
        properties: {
          assetId: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                assetId: { type: 'string' },
                computedFields: { type: 'object' },
                computedAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: getComputedFields,
  });

  fastify.post('/recalculate', {
    schema: {
      description: 'Recalculate computed fields for an asset',
      tags: ['Computed Fields'],
      body: {
        type: 'object',
        required: ['assetId'],
        properties: {
          assetId: { type: 'string', format: 'uuid' },
          force: { type: 'boolean', default: false },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                assetId: { type: 'string' },
                computedFields: { type: 'object' },
                computedAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: recalculateComputedFields,
  });

  fastify.post('/validate-formula', {
    schema: {
      description: 'Validate a formula without executing it',
      tags: ['Computed Fields'],
      body: {
        type: 'object',
        required: ['formula'],
        properties: {
          formula: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                valid: { type: 'boolean' },
                error: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: validateFormula,
  });

  fastify.get('/definitions/:assetTypeId', {
    schema: {
      description: 'Get computed field definitions from asset type',
      tags: ['Computed Fields'],
      params: {
        type: 'object',
        required: ['assetTypeId'],
        properties: {
          assetTypeId: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                assetTypeId: { type: 'string' },
                assetTypeName: { type: 'string' },
                computedFields: { type: 'array' },
              },
            },
          },
        },
      },
    },
    handler: getComputedFieldDefinitions,
  });
}

export default computedFieldsRoutes;
export { computedFieldsRoutes };
