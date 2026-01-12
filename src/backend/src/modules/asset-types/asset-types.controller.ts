import type { FastifyRequest, FastifyReply } from 'fastify';
import { AssetTypesService } from './asset-types.service';
import { createAssetTypeSchema, updateAssetTypeSchema, assetTypeFiltersSchema } from './asset-types.schema';

export class AssetTypesController {
  private service: AssetTypesService;

  constructor() {
    this.service = new AssetTypesService();
  }

  async findAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const tenantId = (request.user as any).tenantId;
      const filters = assetTypeFiltersSchema.parse(request.query);
      
      const result = await this.service.findAll(tenantId, filters);

      return reply.code(200).send({
        success: true,
        data: result.items,
        meta: {
          total: result.total,
          page: result.page,
          perPage: result.perPage,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  }

  async findById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const tenantId = (request.user as any).tenantId;
      const { id } = request.params;

      const assetType = await this.service.findById(id, tenantId);

      return reply.code(200).send({
        success: true,
        data: assetType,
      });
    } catch (error: any) {
      const statusCode = error.message === 'Asset Type not found' ? 404 : 500;
      return reply.code(statusCode).send({
        success: false,
        error: {
          code: statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const tenantId = (request.user as any).tenantId;
      const data = createAssetTypeSchema.parse(request.body);

      const assetType = await this.service.create(tenantId, data);

      return reply.code(201).send({
        success: true,
        data: assetType,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('already exists') ? 409 : 400;
      return reply.code(statusCode).send({
        success: false,
        error: {
          code: statusCode === 409 ? 'CONFLICT' : 'BAD_REQUEST',
          message: error.message,
        },
      });
    }
  }

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const tenantId = (request.user as any).tenantId;
      const { id } = request.params;
      const data = updateAssetTypeSchema.parse(request.body);

      const assetType = await this.service.update(id, tenantId, data);

      return reply.code(200).send({
        success: true,
        data: assetType,
      });
    } catch (error: any) {
      let statusCode = 500;
      let code = 'INTERNAL_ERROR';

      if (error.message === 'Asset Type not found') {
        statusCode = 404;
        code = 'NOT_FOUND';
      } else if (error.message.includes('already exists')) {
        statusCode = 409;
        code = 'CONFLICT';
      } else if (error.message.includes('cannot be its own parent')) {
        statusCode = 400;
        code = 'BAD_REQUEST';
      }

      return reply.code(statusCode).send({
        success: false,
        error: {
          code,
          message: error.message,
        },
      });
    }
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const tenantId = (request.user as any).tenantId;
      const { id } = request.params;

      await this.service.delete(id, tenantId);

      return reply.code(204).send();
    } catch (error: any) {
      let statusCode = 500;
      let code = 'INTERNAL_ERROR';

      if (error.message === 'Asset Type not found') {
        statusCode = 404;
        code = 'NOT_FOUND';
      } else if (error.message.includes('Cannot delete')) {
        statusCode = 400;
        code = 'BAD_REQUEST';
      }

      return reply.code(statusCode).send({
        success: false,
        error: {
          code,
          message: error.message,
        },
      });
    }
  }

  async getStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const tenantId = (request.user as any).tenantId;
      const stats = await this.service.getStats(tenantId);

      return reply.code(200).send({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  }
}
