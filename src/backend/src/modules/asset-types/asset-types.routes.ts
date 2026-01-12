import type { FastifyInstance } from 'fastify';
import { AssetTypesController } from './asset-types.controller';
import { authMiddleware } from '../../common/middleware/auth.middleware';

export default async function assetTypesRoutes(fastify: FastifyInstance) {
  const controller = new AssetTypesController();

  fastify.get('/', {
    preHandler: authMiddleware,
    handler: controller.findAll.bind(controller),
  });

  fastify.get('/stats', {
    preHandler: authMiddleware,
    handler: controller.getStats.bind(controller),
  });

  fastify.get('/:id', {
    preHandler: authMiddleware,
    handler: controller.findById.bind(controller),
  });

  fastify.post('/', {
    preHandler: authMiddleware,
    handler: controller.create.bind(controller),
  });

  fastify.put('/:id', {
    preHandler: authMiddleware,
    handler: controller.update.bind(controller),
  });

  fastify.delete('/:id', {
    preHandler: authMiddleware,
    handler: controller.delete.bind(controller),
  });
}
