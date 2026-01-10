import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../../common/middleware/auth.middleware.js';
import {
  createRule,
  getRule,
  listRules,
  updateRule,
  deleteRule,
  activateRule,
  deactivateRule,
  executeRule,
  getRuleExecutions,
  getRuleStats,
} from './rules.controller.js';

async function rulesRoutes(fastify: FastifyInstance) {
  // Apply auth middleware to all routes
  fastify.addHook('onRequest', authMiddleware);

  // ============================================================================
  // RULES ROUTES
  // ============================================================================

  fastify.post('/', {
    schema: {
      description: 'Create a new rule',
      tags: ['Rules'],
      body: {
        type: 'object',
        required: ['name', 'appliesToAssetTypes', 'nodes', 'connections'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 200 },
          description: { type: 'string' },
          appliesToAssetTypes: {
            type: 'array',
            items: { type: 'string', format: 'uuid' },
            minItems: 1,
          },
          appliesToAssets: {
            type: 'array',
            items: { type: 'string', format: 'uuid' },
          },
          nodes: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['id', 'type', 'position', 'config', 'inputs', 'outputs'],
              properties: {
                id: { type: 'string' },
                type: { type: 'string' },
                position: {
                  type: 'object',
                  required: ['x', 'y'],
                  properties: {
                    x: { type: 'number' },
                    y: { type: 'number' },
                  },
                },
                config: { type: 'object' },
                inputs: { type: 'array', items: { type: 'string' } },
                outputs: { type: 'array', items: { type: 'string' } },
              },
            },
          },
          connections: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'fromNode', 'fromPort', 'toNode', 'toPort'],
              properties: {
                id: { type: 'string' },
                fromNode: { type: 'string' },
                fromPort: { type: 'string' },
                toNode: { type: 'string' },
                toPort: { type: 'string' },
              },
            },
          },
          status: {
            type: 'string',
            enum: ['DRAFT', 'ACTIVE', 'INACTIVE', 'ERROR'],
            default: 'DRAFT',
          },
          priority: { type: 'integer', minimum: 0, default: 0 },
          config: {
            type: 'object',
            properties: {
              executeOnStartup: { type: 'boolean', default: false },
              debounceMs: { type: 'number', default: 1000 },
              maxExecutionsPerMinute: { type: 'number', default: 60 },
              timeoutMs: { type: 'number', default: 5000 },
            },
          },
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
    handler: createRule,
  });

  fastify.get('/', {
    schema: {
      description: 'List rules with filters',
      tags: ['Rules'],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'INACTIVE', 'ERROR'] },
          assetTypeId: { type: 'string', format: 'uuid' },
          page: { type: 'integer', default: 1, minimum: 1 },
          perPage: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
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
    handler: listRules,
  });

  fastify.get('/:id', {
    schema: {
      description: 'Get rule by ID',
      tags: ['Rules'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
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
      },
    },
    handler: getRule,
  });

  fastify.put('/:id', {
    schema: {
      description: 'Update rule',
      tags: ['Rules'],
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
          appliesToAssetTypes: { type: 'array', items: { type: 'string', format: 'uuid' } },
          appliesToAssets: { type: 'array', items: { type: 'string', format: 'uuid' } },
          nodes: { type: 'array' },
          connections: { type: 'array' },
          status: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'INACTIVE', 'ERROR'] },
          priority: { type: 'integer', minimum: 0 },
          config: { type: 'object' },
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
      },
    },
    handler: updateRule,
  });

  fastify.delete('/:id', {
    schema: {
      description: 'Delete rule',
      tags: ['Rules'],
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
          description: 'Rule deleted successfully',
        },
      },
    },
    handler: deleteRule,
  });

  fastify.post('/:id/activate', {
    schema: {
      description: 'Activate a rule',
      tags: ['Rules'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
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
      },
    },
    handler: activateRule,
  });

  fastify.post('/:id/deactivate', {
    schema: {
      description: 'Deactivate a rule',
      tags: ['Rules'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
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
      },
    },
    handler: deactivateRule,
  });

  fastify.post('/:id/execute', {
    schema: {
      description: 'Execute a rule manually',
      tags: ['Rules'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        required: ['assetId', 'triggerType'],
        properties: {
          assetId: { type: 'string', format: 'uuid' },
          triggerType: { type: 'string' },
          triggerData: { type: 'object' },
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
      },
    },
    handler: executeRule,
  });

  fastify.get('/:id/executions', {
    schema: {
      description: 'Get rule executions',
      tags: ['Rules'],
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
          success: { type: 'boolean' },
          page: { type: 'integer', default: 1, minimum: 1 },
          perPage: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
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
    handler: getRuleExecutions,
  });

  fastify.get('/:id/stats', {
    schema: {
      description: 'Get rule execution statistics',
      tags: ['Rules'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
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
      },
    },
    handler: getRuleStats,
  });
}

export default rulesRoutes;
export { rulesRoutes };
