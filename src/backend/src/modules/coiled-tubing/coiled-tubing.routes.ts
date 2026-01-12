import type { FastifyInstance } from 'fastify';
import { CoiledTubingController } from './coiled-tubing.controller';
import { authMiddleware } from '../../common/middleware/auth.middleware.js';
import { requirePermission } from '../../common/middleware/rbac.middleware.js';

export default async function coiledTubingRoutes(fastify: FastifyInstance) {
  const controller = new CoiledTubingController();

  // Apply authentication middleware to all routes
  fastify.addHook('onRequest', authMiddleware);

  // ============================================================================
  // CT UNITS
  // ============================================================================

  fastify.get('/units', {
    preHandler: [requirePermission('coiled-tubing:read')],
    handler: controller.getUnits.bind(controller),
  });

  fastify.get('/units/:id', {
    preHandler: [requirePermission('coiled-tubing:read')],
    handler: controller.getUnitById.bind(controller),
  });

  fastify.post('/units', {
    preHandler: [requirePermission('coiled-tubing:create')],
    handler: controller.createUnit.bind(controller),
  });

  fastify.put('/units/:id', {
    preHandler: [requirePermission('coiled-tubing:update')],
    handler: controller.updateUnit.bind(controller),
  });

  fastify.delete('/units/:id', {
    preHandler: [requirePermission('coiled-tubing:delete')],
    handler: controller.deleteUnit.bind(controller),
  });

  // ============================================================================
  // CT REELS
  // ============================================================================

  fastify.get('/reels', {
    preHandler: [requirePermission('coiled-tubing:read')],
    handler: controller.getReels.bind(controller),
  });

  fastify.get('/reels/:id', {
    preHandler: [requirePermission('coiled-tubing:read')],
    handler: controller.getReelById.bind(controller),
  });

  fastify.post('/reels', {
    preHandler: [requirePermission('coiled-tubing:create')],
    handler: controller.createReel.bind(controller),
  });

  fastify.put('/reels/:id', {
    preHandler: [requirePermission('coiled-tubing:update')],
    handler: controller.updateReel.bind(controller),
  });

  fastify.delete('/reels/:id', {
    preHandler: [requirePermission('coiled-tubing:delete')],
    handler: controller.deleteReel.bind(controller),
  });

  fastify.get('/reels/:reelId/sections', {
    preHandler: [requirePermission('coiled-tubing:read')],
    handler: controller.getReelSections.bind(controller),
  });

  // ============================================================================
  // CT JOBS
  // ============================================================================

  fastify.get('/jobs', {
    preHandler: [requirePermission('coiled-tubing:read')],
    handler: controller.getJobs.bind(controller),
  });

  fastify.get('/jobs/:id', {
    preHandler: [requirePermission('coiled-tubing:read')],
    handler: controller.getJobById.bind(controller),
  });

  fastify.post('/jobs', {
    preHandler: [requirePermission('coiled-tubing:create')],
    handler: controller.createJob.bind(controller),
  });

  fastify.put('/jobs/:id', {
    preHandler: [requirePermission('coiled-tubing:update')],
    handler: controller.updateJob.bind(controller),
  });

  fastify.delete('/jobs/:id', {
    preHandler: [requirePermission('coiled-tubing:delete')],
    handler: controller.deleteJob.bind(controller),
  });

  fastify.post('/jobs/:id/start', {
    preHandler: [requirePermission('coiled-tubing:execute')],
    handler: controller.startJob.bind(controller),
  });

  fastify.post('/jobs/:id/complete', {
    preHandler: [requirePermission('coiled-tubing:execute')],
    handler: controller.completeJob.bind(controller),
  });

  // Job related resources
  fastify.get('/jobs/:jobId/operations', {
    preHandler: [requirePermission('coiled-tubing:read')],
    handler: controller.getJobOperations.bind(controller),
  });

  fastify.get('/jobs/:jobId/fluids', {
    preHandler: [requirePermission('coiled-tubing:read')],
    handler: controller.getJobFluids.bind(controller),
  });

  fastify.get('/jobs/:jobId/bha', {
    preHandler: [requirePermission('coiled-tubing:read')],
    handler: controller.getJobBha.bind(controller),
  });

  fastify.get('/jobs/:jobId/ticket', {
    preHandler: [requirePermission('coiled-tubing:read')],
    handler: controller.getJobTicket.bind(controller),
  });

  fastify.get('/jobs/:jobId/ticket/pdf', {
    preHandler: [requirePermission('coiled-tubing:read')],
    handler: controller.generateJobTicketPDF.bind(controller),
  });

  fastify.get('/jobs/:jobId/alarms', {
    preHandler: [requirePermission('coiled-tubing:read')],
    handler: controller.getJobAlarms.bind(controller),
  });

  fastify.get('/jobs/:jobId/realtime-data', {
    preHandler: [requirePermission('coiled-tubing:read')],
    handler: controller.getJobRealtimeData.bind(controller),
  });

  fastify.get('/jobs/:jobId/realtime-data/latest', {
    preHandler: [requirePermission('coiled-tubing:read')],
    handler: controller.getLatestRealtimeData.bind(controller),
  });

  // ============================================================================
  // ALARMS
  // ============================================================================

  fastify.post('/alarms/:id/acknowledge', {
    preHandler: [requirePermission('coiled-tubing:execute')],
    handler: controller.acknowledgeAlarm.bind(controller),
  });

  fastify.post('/alarms/:id/resolve', {
    preHandler: [requirePermission('coiled-tubing:execute')],
    handler: controller.resolveAlarm.bind(controller),
  });
}
