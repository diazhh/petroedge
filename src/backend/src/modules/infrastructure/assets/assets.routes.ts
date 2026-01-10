import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../../common/middleware/auth.middleware';
import {
  createAssetType,
  getAssetType,
  getAllAssetTypes,
  updateAssetType,
  deleteAssetType,
  createAsset,
  getAsset,
  getAllAssets,
  updateAsset,
  updateAssetAttributes,
  deleteAsset,
  getAssetChildren,
  getAssetAttributeHistory,
} from './assets.controller';

async function assetsRoutes(fastify: FastifyInstance) {
  // Apply auth middleware to all routes
  fastify.addHook('onRequest', authMiddleware);

  // ============================================================================
  // ASSET TYPES ROUTES
  // ============================================================================

  fastify.post('/types', {
    schema: {
      description: 'Create a new asset type',
      tags: ['Asset Types'],
      body: {
        type: 'object',
        required: ['code', 'name'],
        properties: {
          code: { type: 'string', minLength: 2, maxLength: 50 },
          name: { type: 'string', minLength: 2, maxLength: 100 },
          description: { type: 'string' },
          icon: { type: 'string' },
          color: { type: 'string' },
          parentTypeId: { type: 'string', format: 'uuid' },
          fixedSchema: { type: 'object' },
          attributeSchema: { type: 'object' },
          telemetrySchema: { type: 'object' },
          computedFields: { type: 'array' },
          sortOrder: { type: 'integer' },
        },
      },
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
    handler: createAssetType,
  });

  fastify.get('/types', {
    schema: {
      description: 'List all asset types',
      tags: ['Asset Types'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          perPage: { type: 'integer', default: 20 },
          search: { type: 'string' },
          isActive: { type: 'boolean' },
          parentTypeId: { type: 'string', format: 'uuid' },
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
    handler: getAllAssetTypes,
  });

  fastify.get('/types/:id', {
    schema: {
      description: 'Get asset type by ID',
      tags: ['Asset Types'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
    },
    handler: getAssetType,
  });

  fastify.put('/types/:id', {
    schema: {
      description: 'Update asset type',
      tags: ['Asset Types'],
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
          name: { type: 'string' },
          description: { type: 'string' },
          icon: { type: 'string' },
          color: { type: 'string' },
          fixedSchema: { type: 'object' },
          attributeSchema: { type: 'object' },
          telemetrySchema: { type: 'object' },
          computedFields: { type: 'array' },
          sortOrder: { type: 'integer' },
          isActive: { type: 'boolean' },
        },
      },
    },
    handler: updateAssetType,
  });

  fastify.delete('/types/:id', {
    schema: {
      description: 'Delete asset type',
      tags: ['Asset Types'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
    },
    handler: deleteAssetType,
  });

  // ============================================================================
  // ASSETS ROUTES
  // ============================================================================

  fastify.post('/', {
    schema: {
      description: 'Create a new asset (Digital Twin instance)',
      tags: ['Assets'],
      body: {
        type: 'object',
        required: ['assetTypeId', 'code', 'name'],
        properties: {
          assetTypeId: { type: 'string', format: 'uuid' },
          code: { type: 'string', minLength: 2, maxLength: 50 },
          name: { type: 'string', minLength: 2, maxLength: 200 },
          description: { type: 'string' },
          parentAssetId: { type: 'string', format: 'uuid' },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          elevationFt: { type: 'number' },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'RETIRED', 'FAILED'] },
          properties: { type: 'object' },
          attributes: { type: 'object' },
          tags: { type: 'array', items: { type: 'string' } },
          metadata: { type: 'object' },
          legacyType: { type: 'string' },
          legacyId: { type: 'string', format: 'uuid' },
        },
      },
    },
    handler: createAsset,
  });

  fastify.get('/', {
    schema: {
      description: 'List all assets',
      tags: ['Assets'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          perPage: { type: 'integer', default: 20 },
          search: { type: 'string' },
          assetTypeId: { type: 'string', format: 'uuid' },
          assetTypeCode: { type: 'string' },
          parentAssetId: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'RETIRED', 'FAILED'] },
          includeType: { type: 'boolean', default: true },
        },
      },
    },
    handler: getAllAssets,
  });

  fastify.get('/:id', {
    schema: {
      description: 'Get asset by ID',
      tags: ['Assets'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
    },
    handler: getAsset,
  });

  fastify.put('/:id', {
    schema: {
      description: 'Update asset',
      tags: ['Assets'],
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
          parentAssetId: { type: 'string', format: 'uuid' },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          elevationFt: { type: 'number' },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'RETIRED', 'FAILED'] },
          properties: { type: 'object' },
          attributes: { type: 'object' },
          tags: { type: 'array', items: { type: 'string' } },
          metadata: { type: 'object' },
        },
      },
    },
    handler: updateAsset,
  });

  fastify.patch('/:id/attributes', {
    schema: {
      description: 'Update asset attributes (with history tracking)',
      tags: ['Assets'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        required: ['attributes'],
        properties: {
          attributes: { type: 'object' },
          reason: { type: 'string' },
        },
      },
    },
    handler: updateAssetAttributes,
  });

  fastify.delete('/:id', {
    schema: {
      description: 'Delete asset',
      tags: ['Assets'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
    },
    handler: deleteAsset,
  });

  fastify.get('/:id/children', {
    schema: {
      description: 'Get child assets',
      tags: ['Assets'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
    },
    handler: getAssetChildren,
  });

  fastify.get('/:id/attribute-history', {
    schema: {
      description: 'Get asset attribute change history',
      tags: ['Assets'],
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
          attributeKey: { type: 'string' },
        },
      },
    },
    handler: getAssetAttributeHistory,
  });
}

export default assetsRoutes;
export { assetsRoutes };
