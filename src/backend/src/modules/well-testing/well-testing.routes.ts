import type { FastifyInstance } from 'fastify';
import { WellTestingController } from './well-testing.controller';
import { authMiddleware } from '../../common/middleware/auth.middleware.js';
import { requirePermission } from '../../common/middleware/rbac.middleware.js';

export async function wellTestingRoutes(fastify: FastifyInstance) {
  const controller = new WellTestingController();

  // Apply authentication middleware to all routes
  fastify.addHook('onRequest', authMiddleware);

  // Well Tests CRUD
  fastify.post('/well-tests', {
    preHandler: [requirePermission('well-testing:create')],
    handler: controller.createWellTest.bind(controller),
  });

  fastify.get('/well-tests', {
    preHandler: [requirePermission('well-testing:read')],
    handler: controller.listWellTests.bind(controller),
  });

  fastify.get('/well-tests/:id', {
    preHandler: [requirePermission('well-testing:read')],
    handler: controller.getWellTest.bind(controller),
  });

  fastify.put('/well-tests/:id', {
    preHandler: [requirePermission('well-testing:update')],
    handler: controller.updateWellTest.bind(controller),
  });

  fastify.delete('/well-tests/:id', {
    preHandler: [requirePermission('well-testing:delete')],
    handler: controller.deleteWellTest.bind(controller),
  });

  fastify.post('/well-tests/:id/approve', {
    preHandler: [requirePermission('well-testing:approve')],
    handler: controller.approveWellTest.bind(controller),
  });

  // Test Readings
  fastify.post('/test-readings', {
    preHandler: [requirePermission('well-testing:create')],
    handler: controller.addTestReading.bind(controller),
  });

  fastify.get('/well-tests/:wellTestId/readings', {
    preHandler: [requirePermission('well-testing:read')],
    handler: controller.getTestReadings.bind(controller),
  });

  // IPR Analysis
  fastify.post('/well-tests/:wellTestId/ipr', {
    preHandler: [requirePermission('well-testing:create')],
    handler: controller.calculateIpr.bind(controller),
  });

  fastify.get('/well-tests/:wellTestId/ipr-analyses', {
    preHandler: [requirePermission('well-testing:read')],
    handler: controller.getIprAnalyses.bind(controller),
  });

  // Test Types
  fastify.get('/test-types', {
    preHandler: [requirePermission('well-testing:read')],
    handler: controller.listTestTypes.bind(controller),
  });

  // Well Test Stats
  fastify.get('/wells/:wellId/test-stats', {
    preHandler: [requirePermission('well-testing:read')],
    handler: controller.getWellTestStats.bind(controller),
  });

  // VLP Analysis
  fastify.post('/wells/:wellId/vlp', {
    preHandler: [requirePermission('well-testing:create')],
    handler: controller.calculateVlp.bind(controller),
  });

  fastify.get('/wells/:wellId/vlp-analyses', {
    preHandler: [requirePermission('well-testing:read')],
    handler: controller.getVlpAnalyses.bind(controller),
  });

  // Nodal Analysis
  fastify.post('/wells/:wellId/nodal', {
    preHandler: [requirePermission('well-testing:create')],
    handler: controller.calculateNodalAnalysis.bind(controller),
  });

  fastify.get('/wells/:wellId/nodal-analyses', {
    preHandler: [requirePermission('well-testing:read')],
    handler: controller.getNodalAnalyses.bind(controller),
  });
}

export default wellTestingRoutes;
