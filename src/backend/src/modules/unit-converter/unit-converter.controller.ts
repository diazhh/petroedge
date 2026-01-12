import type { FastifyRequest, FastifyReply } from 'fastify';
import { UnitConverterService } from './unit-converter.service';
import { convertUnitsSchema, validateCompatibilitySchema } from './unit-converter.schema';
import type { ConvertUnitsRequest, ValidateCompatibilityRequest } from './unit-converter.types';

export class UnitConverterController {
  private service: UnitConverterService;

  constructor() {
    this.service = new UnitConverterService();
  }

  async convert(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = convertUnitsSchema.parse(request.body) as ConvertUnitsRequest;
      const result = await this.service.convert(data);

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      request.log.error(error);
      const statusCode = error.message.includes('not found') ? 404 : 
                         error.message.includes('same magnitude') ? 400 : 500;
      return reply.status(statusCode).send({
        success: false,
        error: {
          code: error.message.includes('not found') ? 'NOT_FOUND' :
                error.message.includes('same magnitude') ? 'INCOMPATIBLE_UNITS' : 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  }

  async validateCompatibility(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = validateCompatibilitySchema.parse(request.body) as ValidateCompatibilityRequest;
      const result = await this.service.validateCompatibility(data);

      return reply.status(200).send({
        success: true,
        data: result,
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
}
