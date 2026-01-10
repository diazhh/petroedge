import type { FastifyRequest, FastifyReply } from 'fastify';
import { rulesService } from './rules.service.js';
import {
  createRuleSchema,
  updateRuleSchema,
  listRulesQuerySchema,
  executeRuleSchema,
  listExecutionsQuerySchema,
} from './rules.schema.js';

// ============================================================================
// RULES CONTROLLER
// ============================================================================

/**
 * Create a new rule
 * POST /api/v1/rules
 */
export async function createRule(
  request: FastifyRequest<{ Body: unknown }>,
  reply: FastifyReply
) {
  try {
    const input = createRuleSchema.parse(request.body);
    const tenantId = request.user!.tenantId;
    const userId = request.user!.userId;

    const rule = await rulesService.createRule(tenantId, userId, input);

    return reply.status(201).send({
      success: true,
      data: rule,
    });
  } catch (error: any) {
    request.log.error(error);
    if (error.name === 'ZodError') {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.message, details: error.errors },
      });
    }
    return reply.status(400).send({
      success: false,
      error: { code: 'CREATE_RULE_ERROR', message: error.message },
    });
  }
}

/**
 * Get a rule by ID
 * GET /api/v1/rules/:id
 */
export async function getRule(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const tenantId = request.user!.tenantId;

    const rule = await rulesService.getRule(tenantId, id);

    return reply.send({ success: true, data: rule });
  } catch (error: any) {
    request.log.error(error);
    if (error.message === 'Rule not found') {
      return reply.status(404).send({
        success: false,
        error: { code: 'RULE_NOT_FOUND', message: error.message },
      });
    }
    return reply.status(500).send({
      success: false,
      error: { code: 'GET_RULE_ERROR', message: error.message },
    });
  }
}

/**
 * List rules with filters
 * GET /api/v1/rules
 */
export async function listRules(
  request: FastifyRequest<{ Querystring: unknown }>,
  reply: FastifyReply
) {
  try {
    const query = listRulesQuerySchema.parse(request.query);
    const tenantId = request.user!.tenantId;

    const result = await rulesService.listRules(tenantId, query);

    return reply.send({
      success: true,
      data: result.rules,
      meta: {
        total: result.total,
        page: query.page,
        perPage: query.perPage,
        totalPages: Math.ceil(result.total / query.perPage),
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: { code: 'LIST_RULES_ERROR', message: error.message },
    });
  }
}

/**
 * Update a rule
 * PUT /api/v1/rules/:id
 */
export async function updateRule(
  request: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const input = updateRuleSchema.parse(request.body);
    const tenantId = request.user!.tenantId;

    const rule = await rulesService.updateRule(tenantId, id, input);

    return reply.send({ success: true, data: rule });
  } catch (error: any) {
    request.log.error(error);
    if (error.name === 'ZodError') {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.message, details: error.errors },
      });
    }
    if (error.message === 'Rule not found') {
      return reply.status(404).send({
        success: false,
        error: { code: 'RULE_NOT_FOUND', message: error.message },
      });
    }
    return reply.status(400).send({
      success: false,
      error: { code: 'UPDATE_RULE_ERROR', message: error.message },
    });
  }
}

/**
 * Delete a rule
 * DELETE /api/v1/rules/:id
 */
export async function deleteRule(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const tenantId = request.user!.tenantId;

    await rulesService.deleteRule(tenantId, id);

    return reply.status(204).send();
  } catch (error: any) {
    request.log.error(error);
    if (error.message === 'Rule not found') {
      return reply.status(404).send({
        success: false,
        error: { code: 'RULE_NOT_FOUND', message: error.message },
      });
    }
    return reply.status(500).send({
      success: false,
      error: { code: 'DELETE_RULE_ERROR', message: error.message },
    });
  }
}

/**
 * Activate a rule
 * POST /api/v1/rules/:id/activate
 */
export async function activateRule(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const tenantId = request.user!.tenantId;

    const rule = await rulesService.activateRule(tenantId, id);

    return reply.send({ success: true, data: rule });
  } catch (error: any) {
    request.log.error(error);
    if (error.message === 'Rule not found') {
      return reply.status(404).send({
        success: false,
        error: { code: 'RULE_NOT_FOUND', message: error.message },
      });
    }
    return reply.status(400).send({
      success: false,
      error: { code: 'ACTIVATE_RULE_ERROR', message: error.message },
    });
  }
}

/**
 * Deactivate a rule
 * POST /api/v1/rules/:id/deactivate
 */
export async function deactivateRule(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const tenantId = request.user!.tenantId;

    const rule = await rulesService.deactivateRule(tenantId, id);

    return reply.send({ success: true, data: rule });
  } catch (error: any) {
    request.log.error(error);
    if (error.message === 'Rule not found') {
      return reply.status(404).send({
        success: false,
        error: { code: 'RULE_NOT_FOUND', message: error.message },
      });
    }
    return reply.status(400).send({
      success: false,
      error: { code: 'DEACTIVATE_RULE_ERROR', message: error.message },
    });
  }
}

/**
 * Execute a rule manually
 * POST /api/v1/rules/:id/execute
 */
export async function executeRule(
  request: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const input = executeRuleSchema.parse(request.body);
    const tenantId = request.user!.tenantId;

    const execution = await rulesService.executeRule(
      tenantId,
      id,
      input.assetId,
      input.triggerType,
      input.triggerData
    );

    return reply.send({ success: true, data: execution });
  } catch (error: any) {
    request.log.error(error);
    if (error.name === 'ZodError') {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.message, details: error.errors },
      });
    }
    return reply.status(400).send({
      success: false,
      error: { code: 'EXECUTE_RULE_ERROR', message: error.message },
    });
  }
}

/**
 * Get rule executions
 * GET /api/v1/rules/:id/executions
 */
export async function getRuleExecutions(
  request: FastifyRequest<{ Params: { id: string }; Querystring: unknown }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const query = listExecutionsQuerySchema.parse(request.query);
    const tenantId = request.user!.tenantId;

    const result = await rulesService.getExecutions(tenantId, id, query);

    return reply.send({
      success: true,
      data: result.executions,
      meta: {
        total: result.total,
        page: query.page,
        perPage: query.perPage,
        totalPages: Math.ceil(result.total / query.perPage),
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: { code: 'LIST_EXECUTIONS_ERROR', message: error.message },
    });
  }
}

/**
 * Get rule execution statistics
 * GET /api/v1/rules/:id/stats
 */
export async function getRuleStats(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const tenantId = request.user!.tenantId;

    const stats = await rulesService.getExecutionStats(tenantId, id);

    return reply.send({ success: true, data: stats });
  } catch (error: any) {
    request.log.error(error);
    if (error.message === 'Rule not found') {
      return reply.status(404).send({
        success: false,
        error: { code: 'RULE_NOT_FOUND', message: error.message },
      });
    }
    return reply.status(500).send({
      success: false,
      error: { code: 'GET_STATS_ERROR', message: error.message },
    });
  }
}
