/**
 * Edge Gateways Module - Controller Layer
 * 
 * HTTP request handlers for Edge Gateway endpoints.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { EdgeGatewaysService } from './edge-gateways.service.js';
import {
  CreateEdgeGatewayInput,
  UpdateEdgeGatewayInput,
  EdgeGatewayFiltersInput,
  EdgeGatewayHeartbeatInput,
} from './edge-gateways.schema.js';

export class EdgeGatewaysController {
  private service: EdgeGatewaysService;

  constructor() {
    this.service = new EdgeGatewaysService();
  }

  /**
   * GET /api/v1/edge-gateways
   * List all edge gateways with filters and pagination
   */
  async list(
    request: FastifyRequest<{ Querystring: EdgeGatewayFiltersInput }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = request.user!.tenantId;
      const {
        status,
        enabled,
        assetId,
        location,
        search,
        page = 1,
        perPage = 20,
        includeSources = false,
        includeAsset = false,
      } = request.query;

      const result = await this.service.findAll(
        tenantId,
        { status, enabled, assetId, location, search },
        page,
        perPage,
        includeSources,
        includeAsset
      );

      return reply.status(200).send({
        success: true,
        data: result.gateways,
        meta: {
          total: result.total,
          page: result.page,
          perPage: result.perPage,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  }

  /**
   * GET /api/v1/edge-gateways/:id
   * Get edge gateway by ID
   */
  async getById(
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: { includeSources?: boolean; includeAsset?: boolean };
    }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = request.user!.tenantId;
      const { id } = request.params;
      const { includeSources = false, includeAsset = false } = request.query;

      const gateway = await this.service.findById(id, tenantId, includeSources, includeAsset);

      return reply.status(200).send({
        success: true,
        data: gateway,
      });
    } catch (error: any) {
      request.log.error(error);

      if (error.message === 'EDGE_GATEWAY_NOT_FOUND') {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'EDGE_GATEWAY_NOT_FOUND',
            message: 'Edge gateway not found',
          },
        });
      }

      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  }

  /**
   * POST /api/v1/edge-gateways
   * Create new edge gateway
   */
  async create(
    request: FastifyRequest<{ Body: CreateEdgeGatewayInput }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = request.user!.tenantId;
      const userId = request.user!.id;
      const data = request.body;

      const gateway = await this.service.create(tenantId, userId, data);

      return reply.status(201).send({
        success: true,
        data: gateway,
      });
    } catch (error: any) {
      request.log.error(error);

      if (error.message === 'EDGE_GATEWAY_NAME_EXISTS') {
        return reply.status(409).send({
          success: false,
          error: {
            code: 'EDGE_GATEWAY_NAME_EXISTS',
            message: 'An edge gateway with this name already exists',
          },
        });
      }

      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  }

  /**
   * PUT /api/v1/edge-gateways/:id
   * Update edge gateway
   */
  async update(
    request: FastifyRequest<{
      Params: { id: string };
      Body: UpdateEdgeGatewayInput;
    }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = request.user!.tenantId;
      const { id } = request.params;
      const data = request.body;

      const gateway = await this.service.update(id, tenantId, data);

      return reply.status(200).send({
        success: true,
        data: gateway,
      });
    } catch (error: any) {
      request.log.error(error);

      if (error.message === 'EDGE_GATEWAY_NOT_FOUND') {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'EDGE_GATEWAY_NOT_FOUND',
            message: 'Edge gateway not found',
          },
        });
      }

      if (error.message === 'EDGE_GATEWAY_NAME_EXISTS') {
        return reply.status(409).send({
          success: false,
          error: {
            code: 'EDGE_GATEWAY_NAME_EXISTS',
            message: 'An edge gateway with this name already exists',
          },
        });
      }

      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  }

  /**
   * DELETE /api/v1/edge-gateways/:id
   * Delete edge gateway
   */
  async delete(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = request.user!.tenantId;
      const { id } = request.params;

      await this.service.delete(id, tenantId);

      return reply.status(204).send();
    } catch (error: any) {
      request.log.error(error);

      if (error.message === 'EDGE_GATEWAY_NOT_FOUND') {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'EDGE_GATEWAY_NOT_FOUND',
            message: 'Edge gateway not found',
          },
        });
      }

      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  }

  /**
   * GET /api/v1/edge-gateways/:id/health
   * Get edge gateway health metrics
   */
  async getHealth(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = request.user!.tenantId;
      const { id } = request.params;

      const health = await this.service.getHealth(id, tenantId);

      return reply.status(200).send({
        success: true,
        data: health,
      });
    } catch (error: any) {
      request.log.error(error);

      if (error.message === 'EDGE_GATEWAY_NOT_FOUND') {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'EDGE_GATEWAY_NOT_FOUND',
            message: 'Edge gateway not found',
          },
        });
      }

      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  }

  /**
   * GET /api/v1/edge-gateways/stats
   * Get edge gateway statistics
   */
  async getStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const tenantId = request.user!.tenantId;

      const stats = await this.service.getStats(tenantId);

      return reply.status(200).send({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  }

  /**
   * POST /api/v1/edge-gateways/heartbeat
   * Process heartbeat from edge gateway (no auth required)
   */
  async heartbeat(
    request: FastifyRequest<{ Body: EdgeGatewayHeartbeatInput }>,
    reply: FastifyReply
  ) {
    try {
      const data = request.body;

      await this.service.processHeartbeat(data);

      return reply.status(200).send({
        success: true,
        message: 'Heartbeat processed',
      });
    } catch (error: any) {
      request.log.error(error);

      if (error.message === 'EDGE_GATEWAY_NOT_FOUND') {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'EDGE_GATEWAY_NOT_FOUND',
            message: 'Edge gateway not found',
          },
        });
      }

      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  }

  /**
   * GET /api/v1/edge-gateways/:gatewayId/config
   * Get configuration for edge gateway (no auth required)
   */
  async getConfig(
    request: FastifyRequest<{ Params: { gatewayId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { gatewayId } = request.params;

      const config = await this.service.getConfiguration(gatewayId);

      return reply.status(200).send({
        success: true,
        data: config,
      });
    } catch (error: any) {
      request.log.error(error);

      if (error.message === 'EDGE_GATEWAY_NOT_FOUND') {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'EDGE_GATEWAY_NOT_FOUND',
            message: 'Edge gateway not found',
          },
        });
      }

      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  }
}
