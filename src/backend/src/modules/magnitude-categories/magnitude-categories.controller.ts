import type { FastifyRequest, FastifyReply } from 'fastify';
import { MagnitudeCategoriesService } from './magnitude-categories.service';
import {
  createMagnitudeCategorySchema,
  updateMagnitudeCategorySchema,
  magnitudeCategoryFiltersSchema,
  magnitudeCategoryIdSchema,
} from './magnitude-categories.schema';
import type { CreateMagnitudeCategoryDTO, UpdateMagnitudeCategoryDTO, MagnitudeCategoryFilters } from './magnitude-categories.types';

export class MagnitudeCategoriesController {
  private service: MagnitudeCategoriesService;

  constructor() {
    this.service = new MagnitudeCategoriesService();
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const filters = magnitudeCategoryFiltersSchema.parse(request.query) as MagnitudeCategoryFilters;
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
      const { id } = magnitudeCategoryIdSchema.parse(request.params);
      const category = await this.service.getById(id);

      return reply.status(200).send({
        success: true,
        data: category,
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

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createMagnitudeCategorySchema.parse(request.body) as CreateMagnitudeCategoryDTO;
      const category = await this.service.create(data);

      return reply.status(201).send({
        success: true,
        data: category,
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
      const { id } = magnitudeCategoryIdSchema.parse(request.params);
      const data = updateMagnitudeCategorySchema.parse(request.body) as UpdateMagnitudeCategoryDTO;
      const category = await this.service.update(id, data);

      return reply.status(200).send({
        success: true,
        data: category,
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
      const { id } = magnitudeCategoryIdSchema.parse(request.params);
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
