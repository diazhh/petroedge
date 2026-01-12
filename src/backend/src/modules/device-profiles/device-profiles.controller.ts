/**
 * Device Profiles Module - Controller Layer
 * 
 * HTTP request handlers for Device Profile endpoints.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { DeviceProfilesService } from './device-profiles.service.js';
import {
  createDeviceProfileSchema,
  updateDeviceProfileSchema,
  deviceProfileFiltersSchema,
  deviceProfileIdSchema,
} from './device-profiles.schema.js';

export class DeviceProfilesController {
  private service: DeviceProfilesService;

  constructor() {
    this.service = new DeviceProfilesService();
  }

  async list(
    request: FastifyRequest<{ Querystring: any }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = request.user!.tenantId;
      const userId = request.user!.userId;
      
      const validated = deviceProfileFiltersSchema.parse(request.query);
      const {
        isActive,
        transportType,
        search,
        tags,
        page = 1,
        perPage = 20,
        includeRuleChain = false,
        includeStats = false,
      } = validated;

      const result = await this.service.findAll(
        tenantId,
        userId,
        { isActive, transportType, search, tags },
        page,
        perPage,
        includeRuleChain,
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
      const { id } = deviceProfileIdSchema.parse(request.params);

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

      const validated = createDeviceProfileSchema.parse(request.body);

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
      const { id } = deviceProfileIdSchema.parse(request.params);

      const validated = updateDeviceProfileSchema.parse(request.body);

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
      const { id } = deviceProfileIdSchema.parse(request.params);

      await this.service.delete(id, tenantId);

      return reply.status(204).send();
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
