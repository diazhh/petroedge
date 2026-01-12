/**
 * Asset Templates Module - Controller Layer
 * 
 * HTTP request handlers for Asset Template endpoints.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { AssetTemplatesService } from './asset-templates.service.js';
import {
  createAssetTemplateSchema,
  updateAssetTemplateSchema,
  assetTemplateFiltersSchema,
  assetTemplateIdSchema,
} from './asset-templates.schema.js';

export class AssetTemplatesController {
  private service: AssetTemplatesService;

  constructor() {
    this.service = new AssetTemplatesService();
  }

  async list(
    request: FastifyRequest<{ Querystring: any }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = request.user!.tenantId;
      
      const validated = assetTemplateFiltersSchema.parse(request.query);
      const {
        isActive,
        rootAssetTypeId,
        search,
        tags,
        page = 1,
        perPage = 20,
        includeAssetType = false,
        includeStats = false,
      } = validated;

      const result = await this.service.findAll(
        tenantId,
        { isActive, rootAssetTypeId, search, tags },
        page,
        perPage,
        includeAssetType,
        includeStats
      );

      return reply.status(200).send({
        success: true,
        data: result.templates,
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
      const { id } = assetTemplateIdSchema.parse(request.params);

      const template = await this.service.findById(id, tenantId);

      return reply.status(200).send({
        success: true,
        data: template,
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

      const template = await this.service.findByCode(code, tenantId);

      return reply.status(200).send({
        success: true,
        data: template,
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

      const validated = createAssetTemplateSchema.parse(request.body);

      const template = await this.service.create(tenantId, userId, validated);

      return reply.status(201).send({
        success: true,
        data: template,
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
      const { id } = assetTemplateIdSchema.parse(request.params);

      const validated = updateAssetTemplateSchema.parse(request.body);

      const template = await this.service.update(id, tenantId, userId, validated);

      return reply.status(200).send({
        success: true,
        data: template,
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
      const { id } = assetTemplateIdSchema.parse(request.params);

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
