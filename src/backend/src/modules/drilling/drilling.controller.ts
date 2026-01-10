import { FastifyRequest, FastifyReply } from 'fastify';
import { DrillingService } from './drilling.service';

export class DrillingController {
  private service: DrillingService;

  constructor() {
    this.service = new DrillingService();
  }

  // ============================================================================
  // WELL PLANS
  // ============================================================================

  async createWellPlan(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      const { tenantId, userId } = request.user as any;

      const wellPlan = await this.service.createWellPlan(tenantId, userId, body);

      return reply.code(201).send({
        success: true,
        data: wellPlan,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'CREATE_WELL_PLAN_FAILED',
          message: error.message,
        },
      });
    }
  }

  async getWellPlan(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { tenantId } = request.user as any;

      const wellPlan = await this.service.getWellPlan(id, tenantId);

      return reply.send({
        success: true,
        data: wellPlan,
      });
    } catch (error: any) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'WELL_PLAN_NOT_FOUND',
          message: error.message,
        },
      });
    }
  }

  async listWellPlans(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      const { tenantId } = request.user as any;

      const result = await this.service.listWellPlans({
        ...query,
        tenantId,
      });

      return reply.send({
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
      return reply.code(500).send({
        success: false,
        error: {
          code: 'LIST_WELL_PLANS_FAILED',
          message: error.message,
        },
      });
    }
  }

  async updateWellPlan(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as any;
      const { tenantId } = request.user as any;

      const updated = await this.service.updateWellPlan(id, tenantId, body);

      return reply.send({
        success: true,
        data: updated,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'UPDATE_WELL_PLAN_FAILED',
          message: error.message,
        },
      });
    }
  }

  async deleteWellPlan(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { tenantId } = request.user as any;

      await this.service.deleteWellPlan(id, tenantId);

      return reply.code(204).send();
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'DELETE_WELL_PLAN_FAILED',
          message: error.message,
        },
      });
    }
  }

  async approveWellPlan(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { tenantId, userId } = request.user as any;

      const approved = await this.service.approveWellPlan(id, tenantId, userId);

      return reply.send({
        success: true,
        data: approved,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'APPROVE_WELL_PLAN_FAILED',
          message: error.message,
        },
      });
    }
  }

  // ============================================================================
  // TRAJECTORIES
  // ============================================================================

  async calculateTrajectory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { surveys } = request.body as any;

      const result = await this.service.calculateTrajectory(surveys);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'CALCULATE_TRAJECTORY_FAILED',
          message: error.message,
        },
      });
    }
  }

  async designTrajectory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.body as any;

      const result = await this.service.designTrajectory(params);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'DESIGN_TRAJECTORY_FAILED',
          message: error.message,
        },
      });
    }
  }

  async listTrajectories(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { wellPlanId } = request.params as { wellPlanId: string };

      const trajectories = await this.service.listTrajectoriesByWellPlan(wellPlanId);

      return reply.send({
        success: true,
        data: trajectories,
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'LIST_TRAJECTORIES_FAILED',
          message: error.message,
        },
      });
    }
  }

  // ============================================================================
  // TORQUE & DRAG
  // ============================================================================

  async calculateTorqueDrag(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { params, operation } = request.body as any;

      const result = await this.service.calculateTorqueDrag(params, operation);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'CALCULATE_TORQUE_DRAG_FAILED',
          message: error.message,
        },
      });
    }
  }

  // ============================================================================
  // MSE
  // ============================================================================

  async calculateMSE(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.body as any;

      const result = await this.service.calculateMSE(params);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'CALCULATE_MSE_FAILED',
          message: error.message,
        },
      });
    }
  }

  async calculateMSETrend(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { dataPoints } = request.body as any;

      const result = await this.service.calculateMSETrend(dataPoints);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'CALCULATE_MSE_TREND_FAILED',
          message: error.message,
        },
      });
    }
  }

  // ============================================================================
  // KILL SHEET
  // ============================================================================

  async generateKillSheet(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { wellData, stringCapacities, pumpData, kickData } = request.body as any;

      const result = await this.service.generateKillSheet(
        wellData,
        stringCapacities,
        pumpData,
        kickData
      );

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'GENERATE_KILL_SHEET_FAILED',
          message: error.message,
        },
      });
    }
  }

  // ============================================================================
  // BHA RUNS
  // ============================================================================

  async createBhaRun(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { wellPlanId } = request.params as { wellPlanId: string };
      const body = request.body as any;

      const bhaRun = await this.service.createBhaRun(wellPlanId, body);

      return reply.code(201).send({
        success: true,
        data: bhaRun,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'CREATE_BHA_RUN_FAILED',
          message: error.message,
        },
      });
    }
  }

  async listBhaRuns(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { wellPlanId } = request.params as { wellPlanId: string };

      const bhaRuns = await this.service.listBhaRuns(wellPlanId);

      return reply.send({
        success: true,
        data: bhaRuns,
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'LIST_BHA_RUNS_FAILED',
          message: error.message,
        },
      });
    }
  }

  // ============================================================================
  // DAILY REPORTS
  // ============================================================================

  async createDailyReport(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      const { tenantId, userId } = request.user as any;

      const report = await this.service.createDailyReport(tenantId, userId, body);

      return reply.code(201).send({
        success: true,
        data: report,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'CREATE_DAILY_REPORT_FAILED',
          message: error.message,
        },
      });
    }
  }

  async listDailyReports(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { wellId } = request.params as { wellId: string };
      const { tenantId } = request.user as any;

      const reports = await this.service.listDailyReports(wellId, tenantId);

      return reply.send({
        success: true,
        data: reports,
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'LIST_DAILY_REPORTS_FAILED',
          message: error.message,
        },
      });
    }
  }

  async approveDailyReport(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { tenantId, userId } = request.user as any;

      const approved = await this.service.approveDailyReport(id, tenantId, userId);

      return reply.send({
        success: true,
        data: approved,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'APPROVE_DAILY_REPORT_FAILED',
          message: error.message,
        },
      });
    }
  }

  // ============================================================================
  // DRILLING PARAMS
  // ============================================================================

  async getDrillingParams(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { wellId } = request.params as { wellId: string };
      const query = request.query as any;

      const params = await this.service.getDrillingParams({
        wellId,
        ...query,
      });

      return reply.send({
        success: true,
        data: params,
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'GET_DRILLING_PARAMS_FAILED',
          message: error.message,
        },
      });
    }
  }

  async getLatestDrillingParams(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { wellId } = request.params as { wellId: string };

      const params = await this.service.getLatestDrillingParams(wellId);

      return reply.send({
        success: true,
        data: params,
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'GET_LATEST_DRILLING_PARAMS_FAILED',
          message: error.message,
        },
      });
    }
  }
}
