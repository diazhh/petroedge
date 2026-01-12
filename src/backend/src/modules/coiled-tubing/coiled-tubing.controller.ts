import type { FastifyRequest, FastifyReply } from 'fastify';
import { CoiledTubingService } from './coiled-tubing.service';
import {
  createCtUnitSchema,
  updateCtUnitSchema,
  createCtReelSchema,
  updateCtReelSchema,
  createCtJobSchema,
  updateCtJobSchema,
  ctUnitQuerySchema,
  ctReelQuerySchema,
  ctJobQuerySchema,
} from './coiled-tubing.schema';

export class CoiledTubingController {
  private service: CoiledTubingService;

  constructor() {
    this.service = new CoiledTubingService();
  }

  // ============================================================================
  // CT UNITS
  // ============================================================================

  async getUnits(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      }
      const tenantId = request.user.tenantId;
      const query = ctUnitQuerySchema.parse(request.query);
      const result = await this.service.getUnits(tenantId, query);

      return reply.code(200).send({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  async getUnitById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      }
      const tenantId = request.user.tenantId;
      const { id } = request.params;
      const unit = await this.service.getUnitById(id, tenantId);

      return reply.code(200).send({
        success: true,
        data: unit,
      });
    } catch (error) {
      request.log.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      const code = message.includes('not found') ? 404 : 500;

      return reply.code(code).send({
        success: false,
        error: {
          code: code === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR',
          message,
        },
      });
    }
  }

  async createUnit(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      }
      const tenantId = request.user.tenantId;
      const userId = request.user.userId;
      const data = createCtUnitSchema.parse(request.body);
      const unit = await this.service.createUnit(tenantId, userId, data);

      return reply.code(201).send({
        success: true,
        data: unit,
      });
    } catch (error) {
      request.log.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      const code = message.includes('already exists') ? 409 : 400;

      return reply.code(code).send({
        success: false,
        error: {
          code: code === 409 ? 'CONFLICT' : 'VALIDATION_ERROR',
          message,
        },
      });
    }
  }

  async updateUnit(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      }
      const tenantId = request.user.tenantId;
      const userId = request.user.userId;
      const { id } = request.params;
      const data = updateCtUnitSchema.parse(request.body);
      const unit = await this.service.updateUnit(id, tenantId, userId, data);

      return reply.code(200).send({
        success: true,
        data: unit,
      });
    } catch (error) {
      request.log.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      const code = message.includes('not found') ? 404 : 400;

      return reply.code(code).send({
        success: false,
        error: {
          code: code === 404 ? 'NOT_FOUND' : 'VALIDATION_ERROR',
          message,
        },
      });
    }
  }

  async deleteUnit(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      }
      const tenantId = request.user.tenantId;
      const { id } = request.params;
      await this.service.deleteUnit(id, tenantId);

      return reply.code(204).send();
    } catch (error) {
      request.log.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      const code = message.includes('not found') ? 404 : message.includes('active job') ? 409 : 500;

      return reply.code(code).send({
        success: false,
        error: {
          code: code === 404 ? 'NOT_FOUND' : code === 409 ? 'CONFLICT' : 'INTERNAL_ERROR',
          message,
        },
      });
    }
  }

  // ============================================================================
  // CT REELS
  // ============================================================================

  async getReels(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      }
      const tenantId = request.user.tenantId;
      const query = ctReelQuerySchema.parse(request.query);
      const result = await this.service.getReels(tenantId, query);

      return reply.code(200).send({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  async getReelById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      }
      const tenantId = request.user.tenantId;
      const { id } = request.params;
      const reel = await this.service.getReelById(id, tenantId);

      return reply.code(200).send({
        success: true,
        data: reel,
      });
    } catch (error) {
      request.log.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      const code = message.includes('not found') ? 404 : 500;

      return reply.code(code).send({
        success: false,
        error: {
          code: code === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR',
          message,
        },
      });
    }
  }

  async createReel(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      }
      const tenantId = request.user.tenantId;
      const userId = request.user.userId;
      const data = createCtReelSchema.parse(request.body);
      const reel = await this.service.createReel(tenantId, userId, data);

      return reply.code(201).send({
        success: true,
        data: reel,
      });
    } catch (error) {
      request.log.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      const code = message.includes('already exists') ? 409 : 400;

      return reply.code(code).send({
        success: false,
        error: {
          code: code === 409 ? 'CONFLICT' : 'VALIDATION_ERROR',
          message,
        },
      });
    }
  }

  async updateReel(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      }
      const tenantId = request.user.tenantId;
      const userId = request.user.userId;
      const { id } = request.params;
      const data = updateCtReelSchema.parse(request.body);
      const reel = await this.service.updateReel(id, tenantId, userId, data);

      return reply.code(200).send({
        success: true,
        data: reel,
      });
    } catch (error) {
      request.log.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      const code = message.includes('not found') ? 404 : 400;

      return reply.code(code).send({
        success: false,
        error: {
          code: code === 404 ? 'NOT_FOUND' : 'VALIDATION_ERROR',
          message,
        },
      });
    }
  }

  async deleteReel(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      }
      const tenantId = request.user.tenantId;
      const { id } = request.params;
      await this.service.deleteReel(id, tenantId);

      return reply.code(204).send();
    } catch (error) {
      request.log.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      const code = message.includes('not found') ? 404 : 500;

      return reply.code(code).send({
        success: false,
        error: {
          code: code === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR',
          message,
        },
      });
    }
  }

  async getReelSections(request: FastifyRequest<{ Params: { reelId: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      }
      const tenantId = request.user.tenantId;
      const { reelId } = request.params;
      const sections = await this.service.getReelSections(reelId, tenantId);

      return reply.code(200).send({
        success: true,
        data: sections,
      });
    } catch (error) {
      request.log.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      const code = message.includes('not found') ? 404 : 500;

      return reply.code(code).send({
        success: false,
        error: {
          code: code === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR',
          message,
        },
      });
    }
  }

  // ============================================================================
  // CT JOBS
  // ============================================================================

  async getJobs(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      }
      const tenantId = request.user.tenantId;
      const query = ctJobQuerySchema.parse(request.query);
      const result = await this.service.getJobs(tenantId, query);

      return reply.code(200).send({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  async getJobById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      }
      const tenantId = request.user.tenantId;
      const { id } = request.params;
      const job = await this.service.getJobById(id, tenantId);

      return reply.code(200).send({
        success: true,
        data: job,
      });
    } catch (error) {
      request.log.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      const code = message.includes('not found') ? 404 : 500;

      return reply.code(code).send({
        success: false,
        error: {
          code: code === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR',
          message,
        },
      });
    }
  }

  async createJob(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      }
      const tenantId = request.user.tenantId;
      const userId = request.user.userId;
      const data = createCtJobSchema.parse(request.body);
      const job = await this.service.createJob(tenantId, userId, data);

      return reply.code(201).send({
        success: true,
        data: job,
      });
    } catch (error) {
      request.log.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      const code = message.includes('already exists') ? 409 : 400;

      return reply.code(code).send({
        success: false,
        error: {
          code: code === 409 ? 'CONFLICT' : 'VALIDATION_ERROR',
          message,
        },
      });
    }
  }

  async updateJob(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      }
      const tenantId = request.user.tenantId;
      const userId = request.user.userId;
      const { id } = request.params;
      const data = updateCtJobSchema.parse(request.body);
      const job = await this.service.updateJob(id, tenantId, userId, data);

      return reply.code(200).send({
        success: true,
        data: job,
      });
    } catch (error) {
      request.log.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      const code = message.includes('not found') ? 404 : 400;

      return reply.code(code).send({
        success: false,
        error: {
          code: code === 404 ? 'NOT_FOUND' : 'VALIDATION_ERROR',
          message,
        },
      });
    }
  }

  async deleteJob(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      }
      const tenantId = request.user.tenantId;
      const { id } = request.params;
      await this.service.deleteJob(id, tenantId);

      return reply.code(204).send();
    } catch (error) {
      request.log.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      const code = message.includes('not found') ? 404 : message.includes('DRAFT') ? 409 : 500;

      return reply.code(code).send({
        success: false,
        error: {
          code: code === 404 ? 'NOT_FOUND' : code === 409 ? 'CONFLICT' : 'INTERNAL_ERROR',
          message,
        },
      });
    }
  }

  async startJob(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      }
      const tenantId = request.user.tenantId;
      const userId = request.user.userId;
      const { id } = request.params;
      const job = await this.service.startJob(id, tenantId, userId);

      return reply.code(200).send({
        success: true,
        data: job,
      });
    } catch (error) {
      request.log.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      const code = message.includes('not found') ? 404 : message.includes('APPROVED') ? 409 : 500;

      return reply.code(code).send({
        success: false,
        error: {
          code: code === 404 ? 'NOT_FOUND' : code === 409 ? 'CONFLICT' : 'INTERNAL_ERROR',
          message,
        },
      });
    }
  }

  async completeJob(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      }
      const tenantId = request.user.tenantId;
      const userId = request.user.userId;
      const { id } = request.params;
      const job = await this.service.completeJob(id, tenantId, userId);

      return reply.code(200).send({
        success: true,
        data: job,
      });
    } catch (error) {
      request.log.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      const code = message.includes('not found') ? 404 : message.includes('IN_PROGRESS') ? 409 : 500;

      return reply.code(code).send({
        success: false,
        error: {
          code: code === 404 ? 'NOT_FOUND' : code === 409 ? 'CONFLICT' : 'INTERNAL_ERROR',
          message,
        },
      });
    }
  }

  async getJobOperations(request: FastifyRequest<{ Params: { jobId: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      }
      const tenantId = request.user.tenantId;
      const { jobId } = request.params;
      const operations = await this.service.getJobOperations(jobId, tenantId);

      return reply.code(200).send({
        success: true,
        data: operations,
      });
    } catch (error) {
      request.log.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      const code = message.includes('not found') ? 404 : 500;

      return reply.code(code).send({
        success: false,
        error: {
          code: code === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR',
          message,
        },
      });
    }
  }

  async getJobFluids(request: FastifyRequest<{ Params: { jobId: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      }
      const tenantId = request.user.tenantId;
      const { jobId } = request.params;
      const fluids = await this.service.getJobFluids(jobId, tenantId);

      return reply.code(200).send({
        success: true,
        data: fluids,
      });
    } catch (error) {
      request.log.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      const code = message.includes('not found') ? 404 : 500;

      return reply.code(code).send({
        success: false,
        error: {
          code: code === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR',
          message,
        },
      });
    }
  }

  async getJobBha(request: FastifyRequest<{ Params: { jobId: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      }
      const tenantId = request.user.tenantId;
      const { jobId } = request.params;
      const bha = await this.service.getJobBha(jobId, tenantId);

      return reply.code(200).send({
        success: true,
        data: bha,
      });
    } catch (error) {
      request.log.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      const code = message.includes('not found') ? 404 : 500;

      return reply.code(code).send({
        success: false,
        error: {
          code: code === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR',
          message,
        },
      });
    }
  }

  async getJobTicket(request: FastifyRequest<{ Params: { jobId: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      }
      const tenantId = request.user.tenantId;
      const { jobId } = request.params;
      const ticket = await this.service.getJobTicket(jobId, tenantId);

      return reply.code(200).send({
        success: true,
        data: ticket,
      });
    } catch (error) {
      request.log.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      const code = message.includes('not found') ? 404 : 500;

      return reply.code(code).send({
        success: false,
        error: {
          code: code === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR',
          message,
        },
      });
    }
  }

  async getJobAlarms(request: FastifyRequest<{ Params: { jobId: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      }
      const tenantId = request.user.tenantId;
      const { jobId } = request.params;
      const alarms = await this.service.getJobAlarms(jobId, tenantId);

      return reply.code(200).send({
        success: true,
        data: alarms,
      });
    } catch (error) {
      request.log.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      const code = message.includes('not found') ? 404 : 500;

      return reply.code(code).send({
        success: false,
        error: {
          code: code === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR',
          message,
        },
      });
    }
  }

  async getJobRealtimeData(request: FastifyRequest<{ Params: { jobId: string }; Querystring: { startTime?: string; endTime?: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      }
      const tenantId = request.user.tenantId;
      const { jobId } = request.params;
      const { startTime, endTime } = request.query;

      const data = await this.service.getJobRealtimeData(
        jobId,
        tenantId,
        startTime ? new Date(startTime) : undefined,
        endTime ? new Date(endTime) : undefined
      );

      return reply.code(200).send({
        success: true,
        data,
      });
    } catch (error) {
      request.log.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      const code = message.includes('not found') ? 404 : 500;

      return reply.code(code).send({
        success: false,
        error: {
          code: code === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR',
          message,
        },
      });
    }
  }

  async getLatestRealtimeData(request: FastifyRequest<{ Params: { jobId: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      }
      const tenantId = request.user.tenantId;
      const { jobId } = request.params;
      const data = await this.service.getLatestRealtimeData(jobId, tenantId);

      return reply.code(200).send({
        success: true,
        data,
      });
    } catch (error) {
      request.log.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      const code = message.includes('not found') ? 404 : 500;

      return reply.code(code).send({
        success: false,
        error: {
          code: code === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR',
          message,
        },
      });
    }
  }

  // ============================================================================
  // ALARMS
  // ============================================================================

  async acknowledgeAlarm(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      }
      const tenantId = request.user.tenantId;
      const userId = request.user.userId;
      const { id } = request.params;
      const alarm = await this.service.acknowledgeAlarm(id, tenantId, userId);

      return reply.code(200).send({
        success: true,
        data: alarm,
      });
    } catch (error) {
      request.log.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      const code = message.includes('not found') ? 404 : message.includes('not active') ? 409 : 500;

      return reply.code(code).send({
        success: false,
        error: {
          code: code === 404 ? 'NOT_FOUND' : code === 409 ? 'CONFLICT' : 'INTERNAL_ERROR',
          message,
        },
      });
    }
  }

  async resolveAlarm(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      }
      const tenantId = request.user.tenantId;
      const { id } = request.params;
      const alarm = await this.service.resolveAlarm(id, tenantId);

      return reply.code(200).send({
        success: true,
        data: alarm,
      });
    } catch (error) {
      request.log.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      const code = message.includes('not found') ? 404 : message.includes('already resolved') ? 409 : 500;

      return reply.code(code).send({
        success: false,
        error: {
          code: code === 404 ? 'NOT_FOUND' : code === 409 ? 'CONFLICT' : 'INTERNAL_ERROR',
          message,
        },
      });
    }
  }

  async generateJobTicketPDF(
    request: FastifyRequest<{ 
      Params: { jobId: string };
      Querystring: { watermark?: string; includeSignatures?: string; includeBranding?: string };
    }>, 
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      }
      const tenantId = request.user.tenantId;
      const { jobId } = request.params;
      const { watermark, includeSignatures, includeBranding } = request.query;

      const pdfBuffer = await this.service.generateJobTicketPDF(jobId, tenantId, {
        watermark,
        includeSignatures: includeSignatures !== 'false',
        includeBranding: includeBranding !== 'false',
      });

      return reply
        .code(200)
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', `attachment; filename="job-ticket-${jobId}.pdf"`)
        .send(pdfBuffer);
    } catch (error) {
      request.log.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      const code = message.includes('not found') ? 404 : 500;

      return reply.code(code).send({
        success: false,
        error: {
          code: code === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR',
          message,
        },
      });
    }
  }
}
