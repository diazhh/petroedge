import type { FastifyInstance } from 'fastify';
import { UnitConverterController } from './unit-converter.controller';
import { authMiddleware } from '../../common/middleware/auth.middleware';

export default async function unitConverterRoutes(fastify: FastifyInstance) {
  const controller = new UnitConverterController();

  fastify.post('/convert', {
    preHandler: [authMiddleware],
    handler: controller.convert.bind(controller),
  });

  fastify.post('/validate-compatibility', {
    preHandler: [authMiddleware],
    handler: controller.validateCompatibility.bind(controller),
  });
}
