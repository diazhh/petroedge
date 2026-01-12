import type { FastifyInstance } from 'fastify';
import { UnitsController } from './units.controller';
import { authMiddleware } from '../../common/middleware/auth.middleware';

export default async function unitsRoutes(fastify: FastifyInstance) {
  const controller = new UnitsController();

  fastify.get('/', {
    preHandler: [authMiddleware],
    handler: controller.list.bind(controller),
  });

  fastify.get('/:id', {
    preHandler: [authMiddleware],
    handler: controller.getById.bind(controller),
  });

  fastify.get('/by-magnitude/:magnitudeId', {
    preHandler: [authMiddleware],
    handler: controller.getByMagnitudeId.bind(controller),
  });

  fastify.post('/', {
    preHandler: [authMiddleware],
    handler: controller.create.bind(controller),
  });

  fastify.put('/:id', {
    preHandler: [authMiddleware],
    handler: controller.update.bind(controller),
  });

  fastify.delete('/:id', {
    preHandler: [authMiddleware],
    handler: controller.delete.bind(controller),
  });
}
