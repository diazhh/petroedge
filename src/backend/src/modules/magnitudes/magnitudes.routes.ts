import type { FastifyInstance } from 'fastify';
import { MagnitudesController } from './magnitudes.controller';
import { authMiddleware } from '../../common/middleware/auth.middleware';

export default async function magnitudesRoutes(fastify: FastifyInstance) {
  const controller = new MagnitudesController();

  fastify.get('/', {
    preHandler: [authMiddleware],
    handler: controller.list.bind(controller),
  });

  fastify.get('/:id', {
    preHandler: [authMiddleware],
    handler: controller.getById.bind(controller),
  });

  fastify.get('/by-category/:categoryId', {
    preHandler: [authMiddleware],
    handler: controller.getByCategoryId.bind(controller),
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
