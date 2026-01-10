import type { FastifyInstance } from 'fastify';
import { DrillingController } from './drilling.controller';
import { authMiddleware } from '../../common/middleware/auth.middleware.js';
import { requirePermission } from '../../common/middleware/rbac.middleware.js';

export async function drillingRoutes(fastify: FastifyInstance) {
  const controller = new DrillingController();

  // Apply authentication middleware to all routes
  fastify.addHook('onRequest', authMiddleware);

  // ============================================================================
  // WELL PLANS
  // ============================================================================

  fastify.post('/well-plans', {
    preHandler: [requirePermission('drilling:create')],
    handler: controller.createWellPlan.bind(controller),
  });

  fastify.get('/well-plans', {
    preHandler: [requirePermission('drilling:read')],
    handler: controller.listWellPlans.bind(controller),
  });

  fastify.get('/well-plans/:id', {
    preHandler: [requirePermission('drilling:read')],
    handler: controller.getWellPlan.bind(controller),
  });

  fastify.put('/well-plans/:id', {
    preHandler: [requirePermission('drilling:update')],
    handler: controller.updateWellPlan.bind(controller),
  });

  fastify.delete('/well-plans/:id', {
    preHandler: [requirePermission('drilling:update')],
    handler: controller.deleteWellPlan.bind(controller),
  });

  fastify.post('/well-plans/:id/approve', {
    preHandler: [requirePermission('drilling:execute')],
    handler: controller.approveWellPlan.bind(controller),
  });

  // ============================================================================
  // TRAJECTORIES
  // ============================================================================

  fastify.get('/well-plans/:wellPlanId/trajectories', {
    preHandler: [requirePermission('drilling:read')],
    handler: controller.listTrajectories.bind(controller),
  });

  fastify.post('/calculations/trajectory', {
    preHandler: [requirePermission('drilling:execute')],
    handler: controller.calculateTrajectory.bind(controller),
  });

  fastify.post('/calculations/trajectory/design', {
    preHandler: [requirePermission('drilling:execute')],
    handler: controller.designTrajectory.bind(controller),
  });

  // ============================================================================
  // TORQUE & DRAG
  // ============================================================================

  fastify.post('/calculations/torque-drag', {
    preHandler: [requirePermission('drilling:execute')],
    handler: controller.calculateTorqueDrag.bind(controller),
  });

  // ============================================================================
  // MSE
  // ============================================================================

  fastify.post('/calculations/mse', {
    preHandler: [requirePermission('drilling:execute')],
    handler: controller.calculateMSE.bind(controller),
  });

  fastify.post('/calculations/mse/trend', {
    preHandler: [requirePermission('drilling:execute')],
    handler: controller.calculateMSETrend.bind(controller),
  });

  // ============================================================================
  // KILL SHEET
  // ============================================================================

  fastify.post('/calculations/kill-sheet', {
    preHandler: [requirePermission('drilling:execute:kill-sheet')],
    handler: controller.generateKillSheet.bind(controller),
  });

  // ============================================================================
  // BHA RUNS
  // ============================================================================

  fastify.post('/well-plans/:wellPlanId/bha-runs', {
    preHandler: [requirePermission('drilling:create')],
    handler: controller.createBhaRun.bind(controller),
  });

  fastify.get('/well-plans/:wellPlanId/bha-runs', {
    preHandler: [requirePermission('drilling:read')],
    handler: controller.listBhaRuns.bind(controller),
  });

  // ============================================================================
  // DAILY DRILLING REPORTS
  // ============================================================================

  fastify.post('/daily-reports', {
    preHandler: [requirePermission('drilling:create')],
    handler: controller.createDailyReport.bind(controller),
  });

  fastify.get('/wells/:wellId/daily-reports', {
    preHandler: [requirePermission('drilling:read')],
    handler: controller.listDailyReports.bind(controller),
  });

  fastify.post('/daily-reports/:id/approve', {
    preHandler: [requirePermission('drilling:execute')],
    handler: controller.approveDailyReport.bind(controller),
  });

  // ============================================================================
  // DRILLING PARAMS (Real-time)
  // ============================================================================

  fastify.get('/wells/:wellId/drilling-params', {
    preHandler: [requirePermission('drilling:read')],
    handler: controller.getDrillingParams.bind(controller),
  });

  fastify.get('/wells/:wellId/drilling-params/latest', {
    preHandler: [requirePermission('drilling:read')],
    handler: controller.getLatestDrillingParams.bind(controller),
  });
}

export default drillingRoutes;
