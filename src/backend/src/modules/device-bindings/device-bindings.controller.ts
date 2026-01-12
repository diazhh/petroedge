/**
 * Device Bindings Module - Controller Layer
 * 
 * HTTP request handlers for Device Binding endpoints.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { DeviceBindingsService } from './device-bindings.service.js';
import {
  createDeviceBindingSchema,
  updateDeviceBindingSchema,
  deviceBindingFiltersSchema,
  deviceBindingIdSchema,
} from './device-bindings.schema.js';

export class DeviceBindingsController {
  private service: DeviceBindingsService;

  constructor() {
    this.service = new DeviceBindingsService();
  }

  async list(
    request: FastifyRequest<{ Querystring: any }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = request.user!.tenantId;
      
      const validated = deviceBindingFiltersSchema.parse(request.query);
      const {
        isActive,
        dataSourceId,
        connectivityProfileId,
        digitalTwinId,
        search,
        tags,
        page = 1,
        perPage = 20,
        includeDataSource = false,
        includeConnectivityProfile = false,
        includeDigitalTwinInstance = false,
      } = validated;

      const result = await this.service.findAll(
        tenantId,
        { isActive, dataSourceId, connectivityProfileId, digitalTwinId, search, tags },
        page,
        perPage,
        includeDataSource,
        includeConnectivityProfile,
        includeDigitalTwinInstance
      );

      return reply.status(200).send({
        success: true,
        data: result.bindings,
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
      const { id } = deviceBindingIdSchema.parse(request.params);

      const binding = await this.service.findById(id, tenantId);

      return reply.status(200).send({
        success: true,
        data: binding,
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

  async create(
    request: FastifyRequest<{ Body: any }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = request.user!.tenantId;
      const userId = request.user!.userId;

      const validated = createDeviceBindingSchema.parse(request.body);

      const binding = await this.service.create(tenantId, userId, validated);

      return reply.status(201).send({
        success: true,
        data: binding,
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
      const { id } = deviceBindingIdSchema.parse(request.params);

      const validated = updateDeviceBindingSchema.parse(request.body);

      const binding = await this.service.update(id, tenantId, userId, validated);

      return reply.status(200).send({
        success: true,
        data: binding,
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
      const { id } = deviceBindingIdSchema.parse(request.params);

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
}
