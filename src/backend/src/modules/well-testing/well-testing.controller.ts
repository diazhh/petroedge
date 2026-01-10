import { FastifyRequest, FastifyReply } from 'fastify';
import { WellTestingService } from './well-testing.service';
import {
  createWellTestSchema,
  updateWellTestSchema,
  listWellTestsQuerySchema,
  createTestReadingSchema,
  calculateIprSchema,
  calculateVlpSchema,
  calculateNodalSchema,
} from './well-testing.schema';
import { convertWellTestToDb, convertTestReadingToDb } from './well-testing.helpers';

export class WellTestingController {
  private service: WellTestingService;

  constructor() {
    this.service = new WellTestingService();
  }

  async createWellTest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = createWellTestSchema.parse(request.body);
      const { tenantId, userId } = request.user as any;

      const wellTest = await this.service.createWellTest(tenantId, userId, convertWellTestToDb({
        ...body,
        testDate: new Date(body.testDate),
      }));

      return reply.code(201).send({
        success: true,
        data: wellTest,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'CREATE_WELL_TEST_FAILED',
          message: error.message,
        },
      });
    }
  }

  async getWellTest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { tenantId } = request.user as any;

      const wellTest = await this.service.getWellTest(id, tenantId);

      return reply.send({
        success: true,
        data: wellTest,
      });
    } catch (error: any) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'WELL_TEST_NOT_FOUND',
          message: error.message,
        },
      });
    }
  }

  async listWellTests(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = listWellTestsQuerySchema.parse(request.query);
      const { tenantId } = request.user as any;

      const result = await this.service.listWellTests({
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
        },
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'LIST_WELL_TESTS_FAILED',
          message: error.message,
        },
      });
    }
  }

  async updateWellTest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const body = updateWellTestSchema.parse(request.body);
      const { tenantId } = request.user as any;

      const updated = await this.service.updateWellTest(id, tenantId, convertWellTestToDb({
        ...body,
        testDate: body.testDate ? new Date(body.testDate) : undefined,
      }));

      return reply.send({
        success: true,
        data: updated,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'UPDATE_WELL_TEST_FAILED',
          message: error.message,
        },
      });
    }
  }

  async deleteWellTest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { tenantId } = request.user as any;

      await this.service.deleteWellTest(id, tenantId);

      return reply.code(204).send();
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'DELETE_WELL_TEST_FAILED',
          message: error.message,
        },
      });
    }
  }

  async approveWellTest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { tenantId, userId } = request.user as any;

      const approved = await this.service.approveWellTest(id, tenantId, userId);

      return reply.send({
        success: true,
        data: approved,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'APPROVE_WELL_TEST_FAILED',
          message: error.message,
        },
      });
    }
  }

  async addTestReading(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = createTestReadingSchema.parse(request.body);
      const { tenantId } = request.user as any;

      const reading = await this.service.addTestReading(body.wellTestId, tenantId, convertTestReadingToDb({
        ...body,
        readingTime: new Date(body.readingTime),
      }));

      return reply.code(201).send({
        success: true,
        data: reading,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'ADD_TEST_READING_FAILED',
          message: error.message,
        },
      });
    }
  }

  async getTestReadings(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { wellTestId } = request.params as { wellTestId: string };
      const { tenantId } = request.user as any;

      const readings = await this.service.getTestReadings(wellTestId, tenantId);

      return reply.send({
        success: true,
        data: readings,
      });
    } catch (error: any) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'GET_TEST_READINGS_FAILED',
          message: error.message,
        },
      });
    }
  }

  async calculateIpr(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { wellTestId } = request.params as { wellTestId: string };
      const body = calculateIprSchema.parse(request.body);
      const { tenantId, userId } = request.user as any;

      if (body.model === 'JONES_BLOUNT_GLAZE') {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_IPR_MODEL',
            message: 'Jones-Blount-Glaze model not yet implemented',
          },
        });
      }

      const result = await this.service.calculateIpr(wellTestId, tenantId, userId, body as any);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'CALCULATE_IPR_FAILED',
          message: error.message,
        },
      });
    }
  }

  async getIprAnalyses(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { wellTestId } = request.params as { wellTestId: string };
      const { tenantId } = request.user as any;

      const analyses = await this.service.getIprAnalyses(wellTestId, tenantId);

      return reply.send({
        success: true,
        data: analyses,
      });
    } catch (error: any) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'GET_IPR_ANALYSES_FAILED',
          message: error.message,
        },
      });
    }
  }

  async listTestTypes(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { tenantId } = request.user as any;

      const testTypes = await this.service.listTestTypes(tenantId);

      return reply.send({
        success: true,
        data: testTypes,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'LIST_TEST_TYPES_FAILED',
          message: error.message,
        },
      });
    }
  }

  async getWellTestStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { wellId } = request.params as { wellId: string };
      const { tenantId } = request.user as any;

      const stats = await this.service.getWellTestStats(wellId, tenantId);

      return reply.send({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'GET_WELL_TEST_STATS_FAILED',
          message: error.message,
        },
      });
    }
  }

  async calculateVlp(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { wellId } = request.params as { wellId: string };
      const body = calculateVlpSchema.parse(request.body);
      const { tenantId, userId } = request.user as any;

      const result = await this.service.calculateVlp(wellId, tenantId, userId, {
        wellDepthFt: body.tubingDepthFt,
        tubingDiameterIn: body.tubingIdInches,
        wellheadPressurePsi: body.wellheadPressurePsi,
        oilGravityApi: body.oilApi,
        gasGravity: body.gasSg,
        waterCut: body.waterCutPercent,
        gor: body.gorScfStb,
        temperatureDegF: body.bottomholeTempF,
        minRateBopd: 0,
        maxRateBopd: body.maxRateBopd,
        numPoints: body.numPoints,
      });

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'CALCULATE_VLP_FAILED',
          message: error.message,
        },
      });
    }
  }

  async getVlpAnalyses(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { wellId } = request.params as { wellId: string };
      const { tenantId } = request.user as any;

      const analyses = await this.service.getVlpAnalyses(wellId, tenantId);

      return reply.send({
        success: true,
        data: analyses,
      });
    } catch (error: any) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'GET_VLP_ANALYSES_FAILED',
          message: error.message,
        },
      });
    }
  }

  async calculateNodalAnalysis(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { wellId } = request.params as { wellId: string };
      const body = calculateNodalSchema.parse(request.body);
      const { tenantId, userId } = request.user as any;

      const result = await this.service.calculateNodalAnalysis(wellId, tenantId, userId, {
        iprModel: body.ipr.model === 'JONES_BLOUNT_GLAZE' ? 'VOGEL' : body.ipr.model,
        reservoirPressurePsi: body.ipr.reservoirPressurePsi,
        testRateBopd: body.ipr.testRateBopd,
        testPwfPsi: body.ipr.testPwfPsi,
        bubblePointPsi: body.ipr.bubblePointPsi,
        wellDepthFt: body.vlp.tubingDepthFt,
        tubingDiameterIn: body.vlp.tubingIdInches,
        wellheadPressurePsi: body.vlp.wellheadPressurePsi,
        oilGravityApi: body.vlp.oilApi,
        gasGravity: body.vlp.gasSg,
        waterCut: body.vlp.waterCutPercent,
        gor: body.vlp.gorScfStb,
        temperatureDegF: body.vlp.bottomholeTempF,
        numPoints: body.vlp.numPoints,
      });

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'CALCULATE_NODAL_FAILED',
          message: error.message,
        },
      });
    }
  }

  async getNodalAnalyses(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { wellId } = request.params as { wellId: string };
      const { tenantId } = request.user as any;

      const analyses = await this.service.getNodalAnalyses(wellId, tenantId);

      return reply.send({
        success: true,
        data: analyses,
      });
    } catch (error: any) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'GET_NODAL_ANALYSES_FAILED',
          message: error.message,
        },
      });
    }
  }
}
