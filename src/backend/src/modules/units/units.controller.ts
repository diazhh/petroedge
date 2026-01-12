import type { FastifyRequest, FastifyReply } from 'fastify';
import { UnitsService } from './units.service';
import {
  createUnitSchema,
  updateUnitSchema,
  unitFiltersSchema,
  unitIdSchema,
  unitMagnitudeIdSchema,
} from './units.schema';
import type { CreateUnitDTO, UpdateUnitDTO, UnitFilters } from './units.types';

export class UnitsController {
  private service: UnitsService;

  constructor() {
    this.service = new UnitsService();
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const filters = unitFiltersSchema.parse(request.query) as UnitFilters;
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
      const { id } = unitIdSchema.parse(request.params);
      const unit = await this.service.getById(id);

      return reply.status(200).send({
        success: true,
        data: unit,
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

  async getByMagnitudeId(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { magnitudeId } = unitMagnitudeIdSchema.parse(request.params);
      const units = await this.service.getByMagnitudeId(magnitudeId);

      return reply.status(200).send({
        success: true,
        data: units,
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
      const data = createUnitSchema.parse(request.body) as CreateUnitDTO;
      const unit = await this.service.create(data);

      return reply.status(201).send({
        success: true,
        data: unit,
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
      const { id } = unitIdSchema.parse(request.params);
      const data = updateUnitSchema.parse(request.body) as UpdateUnitDTO;
      const unit = await this.service.update(id, data);

      return reply.status(200).send({
        success: true,
        data: unit,
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
      const { id } = unitIdSchema.parse(request.params);
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
