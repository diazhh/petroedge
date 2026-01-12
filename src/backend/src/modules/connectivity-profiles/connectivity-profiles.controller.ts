/**
 * Connectivity Profiles Module - Controller Layer
 * 
 * HTTP request handlers for Connectivity Profile endpoints.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { ConnectivityProfilesService } from './connectivity-profiles.service.js';
import {
  createConnectivityProfileSchema,
  updateConnectivityProfileSchema,
  connectivityProfileFiltersSchema,
  connectivityProfileIdSchema,
} from './connectivity-profiles.schema.js';

export class ConnectivityProfilesController {
  private service: ConnectivityProfilesService;

  constructor() {
    this.service = new ConnectivityProfilesService();
  }

  async list(
    request: FastifyRequest<{ Querystring: any }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = request.user!.tenantId;
      
      const validated = connectivityProfileFiltersSchema.parse(request.query);
      const {
        isActive,
        deviceProfileId,
        assetTemplateId,
        search,
        tags,
        page = 1,
        perPage = 20,
        includeDeviceProfile = false,
        includeAssetTemplate = false,
        includeStats = false,
      } = validated;

      const result = await this.service.findAll(
        tenantId,
        { isActive, deviceProfileId, assetTemplateId, search, tags },
        page,
        perPage,
        includeDeviceProfile,
        includeAssetTemplate,
        includeStats
      );

      return reply.status(200).send({
        success: true,
        data: result.profiles,
        meta: {
          total: result.total,
          page,
          perPage,
          totalPages: Math.ceil(result.total / perPage),
        },
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
          details: error.details,
        },
      });
    }
  }

  async getById(
    request: FastifyRequest<{ Params: any }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = request.user!.tenantId;
      const { id } = connectivityProfileIdSchema.parse(request.params);

      const profile = await this.service.findById(id, tenantId);

      return reply.status(200).send({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  }

  async getByCode(
    request: FastifyRequest<{ Params: { code: string } }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = request.user!.tenantId;
      const { code } = request.params;

      const profile = await this.service.findByCode(code, tenantId);

      return reply.status(200).send({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  }

  async create(
    request: FastifyRequest<{ Body: any }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = request.user!.tenantId;
      const userId = request.user!.userId;

      const validated = createConnectivityProfileSchema.parse(request.body);

      const profile = await this.service.create(tenantId, userId, validated);

      return reply.status(201).send({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
          details: error.details,
        },
      });
    }
  }

  async update(
    request: FastifyRequest<{ Params: any; Body: any }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = request.user!.tenantId;
      const userId = request.user!.userId;
      const { id } = connectivityProfileIdSchema.parse(request.params);

      const validated = updateConnectivityProfileSchema.parse(request.body);

      const profile = await this.service.update(id, tenantId, userId, validated);

      return reply.status(200).send({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
          details: error.details,
        },
      });
    }
  }

  async delete(
    request: FastifyRequest<{ Params: any }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = request.user!.tenantId;
      const { id } = connectivityProfileIdSchema.parse(request.params);

      await this.service.delete(id, tenantId);

      return reply.status(200).send({
        success: true,
        message: 'Connectivity profile deleted successfully',
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  }

  async getStats(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const tenantId = request.user!.tenantId;

      const stats = await this.service.getStats(tenantId);

      return reply.status(200).send({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  }
}
