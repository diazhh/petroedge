import type { FastifyRequest, FastifyReply } from 'fastify';
import { MagnitudesService } from './magnitudes.service';
import {
  createMagnitudeSchema,
  updateMagnitudeSchema,
  magnitudeFiltersSchema,
  magnitudeIdSchema,
  magnitudeCategoryIdSchema,
} from './magnitudes.schema';
import type { CreateMagnitudeDTO, UpdateMagnitudeDTO, MagnitudeFilters } from './magnitudes.types';

export class MagnitudesController {
  private service: MagnitudesService;

  constructor() {
    this.service = new MagnitudesService();
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const filters = magnitudeFiltersSchema.parse(request.query) as MagnitudeFilters;
      const result = await this.service.list(filters);

      return reply.status(200).send({
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

  async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = magnitudeIdSchema.parse(request.params);
      const magnitude = await this.service.getById(id);

      return reply.status(200).send({
        success: true,
        data: magnitude,
      });
    } catch (error: any) {
      request.log.error(error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return reply.status(statusCode).send({
        success: false,
        error: {
          code: error.message.includes('not found') ? 'NOT_FOUND' : 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  }

  async getByCategoryId(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { categoryId } = magnitudeCategoryIdSchema.parse(request.params);
      const magnitudes = await this.service.getByCategoryId(categoryId);

      return reply.status(200).send({
        success: true,
        data: magnitudes,
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

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createMagnitudeSchema.parse(request.body) as CreateMagnitudeDTO;
      const magnitude = await this.service.create(data);

      return reply.status(201).send({
        success: true,
        data: magnitude,
      });
    } catch (error: any) {
      request.log.error(error);
      const statusCode = error.message.includes('already exists') ? 409 : 500;
      return reply.status(statusCode).send({
        success: false,
        error: {
          code: error.message.includes('already exists') ? 'CONFLICT' : 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = magnitudeIdSchema.parse(request.params);
      const data = updateMagnitudeSchema.parse(request.body) as UpdateMagnitudeDTO;
      const magnitude = await this.service.update(id, data);

      return reply.status(200).send({
        success: true,
        data: magnitude,
      });
    } catch (error: any) {
      request.log.error(error);
      let statusCode = 500;
      let code = 'INTERNAL_ERROR';
      if (error.message.includes('not found')) {
        statusCode = 404;
        code = 'NOT_FOUND';
      } else if (error.message.includes('already exists')) {
        statusCode = 409;
        code = 'CONFLICT';
      }
      return reply.status(statusCode).send({
        success: false,
        error: {
          code,
          message: error.message,
        },
      });
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = magnitudeIdSchema.parse(request.params);
      await this.service.delete(id);

      return reply.status(204).send();
    } catch (error: any) {
      request.log.error(error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return reply.status(statusCode).send({
        success: false,
        error: {
          code: error.message.includes('not found') ? 'NOT_FOUND' : 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  }
}
