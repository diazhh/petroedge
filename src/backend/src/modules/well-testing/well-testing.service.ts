import { WellTestingRepository, type ListWellTestsFilters } from './well-testing.repository';
import { IprCalculatorService, type VogelInput, type FetkovichInput } from './ipr-calculator.service';
import { VlpCalculatorService } from './vlp-calculator.service';
import { NodalAnalysisService, type NodalAnalysisInput, type NodalAnalysisResult } from './nodal-analysis.service';
import type { NewWellTest, NewTestReading } from '../../common/database/schema';

export class WellTestingService {
  private repository: WellTestingRepository;
  private iprCalculator: IprCalculatorService;
  private vlpCalculator: VlpCalculatorService;
  private nodalAnalysisService: NodalAnalysisService;

  constructor() {
    this.repository = new WellTestingRepository();
    this.iprCalculator = new IprCalculatorService();
    this.vlpCalculator = new VlpCalculatorService();
    this.nodalAnalysisService = new NodalAnalysisService();
  }

  async createWellTest(tenantId: string, userId: string, data: Omit<NewWellTest, 'tenantId' | 'createdBy' | 'testNumber'>) {
    const testNumber = await this.repository.generateTestNumber(tenantId);

    const wellTest = await this.repository.createWellTest({
      ...data,
      tenantId,
      testNumber,
      createdBy: userId,
    });

    return wellTest;
  }

  async getWellTest(id: string, tenantId: string) {
    const wellTest = await this.repository.findWellTestWithRelations(id, tenantId);
    
    if (!wellTest) {
      throw new Error('Well test not found');
    }

    return wellTest;
  }

  async listWellTests(filters: ListWellTestsFilters) {
    return this.repository.listWellTests(filters);
  }

  async updateWellTest(id: string, tenantId: string, data: Partial<NewWellTest>) {
    const existing = await this.repository.findWellTestById(id, tenantId);
    
    if (!existing) {
      throw new Error('Well test not found');
    }

    const updated = await this.repository.updateWellTest(id, tenantId, data);
    return updated;
  }

  async deleteWellTest(id: string, tenantId: string) {
    const existing = await this.repository.findWellTestById(id, tenantId);
    
    if (!existing) {
      throw new Error('Well test not found');
    }

    const deleted = await this.repository.deleteWellTest(id, tenantId);
    return deleted;
  }

  async approveWellTest(id: string, tenantId: string, userId: string) {
    const existing = await this.repository.findWellTestById(id, tenantId);
    
    if (!existing) {
      throw new Error('Well test not found');
    }

    if (existing.status !== 'COMPLETED' && existing.status !== 'ANALYZED') {
      throw new Error('Only completed or analyzed tests can be approved');
    }

    const updated = await this.repository.updateWellTest(id, tenantId, {
      status: 'APPROVED',
      approvedBy: userId,
      approvedAt: new Date(),
    });

    return updated;
  }

  async addTestReading(wellTestId: string, tenantId: string, data: Omit<NewTestReading, 'wellTestId'>) {
    const wellTest = await this.repository.findWellTestById(wellTestId, tenantId);
    
    if (!wellTest) {
      throw new Error('Well test not found');
    }

    const reading = await this.repository.createTestReading({
      ...data,
      wellTestId,
    });

    return reading;
  }

  async getTestReadings(wellTestId: string, tenantId: string) {
    const wellTest = await this.repository.findWellTestById(wellTestId, tenantId);
    
    if (!wellTest) {
      throw new Error('Well test not found');
    }

    return this.repository.listTestReadings(wellTestId);
  }

  async calculateIpr(
    wellTestId: string,
    tenantId: string,
    userId: string,
    input: {
      model: 'VOGEL' | 'FETKOVITCH' | 'STANDING' | 'COMPOSITE';
      reservoirPressurePsi: number;
      testRateBopd: number;
      testPwfPsi: number;
      bubblePointPsi?: number;
      numPoints?: number;
    }
  ) {
    const wellTest = await this.repository.findWellTestById(wellTestId, tenantId);
    
    if (!wellTest) {
      throw new Error('Well test not found');
    }

    let result;
    
    switch (input.model) {
      case 'VOGEL':
        result = this.iprCalculator.calculateVogel(input as VogelInput);
        break;
      case 'FETKOVITCH':
        result = this.iprCalculator.calculateFetkovitch(input as FetkovichInput);
        break;
      case 'STANDING':
        result = this.iprCalculator.calculateStanding(input as VogelInput);
        break;
      case 'COMPOSITE':
        if (!input.bubblePointPsi) {
          throw new Error('Bubble point pressure required for composite model');
        }
        result = this.iprCalculator.calculateComposite({
          ...input,
          bubblePointPsi: input.bubblePointPsi,
        });
        break;
      default:
        throw new Error('Invalid IPR model');
    }

    const iprAnalysis = await this.repository.createIprAnalysis({
      wellTestId,
      model: input.model,
      reservoirPressurePsi: input.reservoirPressurePsi.toString(),
      bubblePointPsi: input.bubblePointPsi?.toString(),
      testRateBopd: input.testRateBopd.toString(),
      testPwfPsi: input.testPwfPsi.toString(),
      qmaxBopd: result.qmaxBopd.toString(),
      productivityIndex: result.productivityIndex.toString(),
      iprCurve: result.curve,
      analyst: userId,
      analysisDate: new Date(),
    });

    await this.repository.updateWellTest(wellTestId, tenantId, {
      status: 'ANALYZED',
      productivityIndex: result.productivityIndex.toString(),
    });

    return {
      analysis: iprAnalysis,
      result,
    };
  }

  async getIprAnalyses(wellTestId: string, tenantId: string) {
    const wellTest = await this.repository.findWellTestById(wellTestId, tenantId);
    
    if (!wellTest) {
      throw new Error('Well test not found');
    }

    return this.repository.listIprAnalysesByWellTest(wellTestId);
  }

  async listTestTypes(tenantId: string) {
    return this.repository.listTestTypes(tenantId);
  }

  async getWellTestStats(wellId: string, tenantId: string) {
    const tests = await this.repository.listWellTests({
      tenantId,
      wellId,
      perPage: 1000,
    });

    const stats = {
      totalTests: tests.total,
      byStatus: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      latestTest: tests.items[0]?.wellTest,
    };

    tests.items.forEach(({ wellTest }) => {
      stats.byStatus[wellTest.status] = (stats.byStatus[wellTest.status] || 0) + 1;
      
      if (wellTest.testTypeId) {
        stats.byType[wellTest.testTypeId] = (stats.byType[wellTest.testTypeId] || 0) + 1;
      }
    });

    return stats;
  }

  async calculateVlp(
    wellId: string,
    _tenantId: string,
    userId: string,
    input: {
      wellDepthFt: number;
      tubingDiameterIn: number;
      wellheadPressurePsi: number;
      oilGravityApi: number;
      gasGravity: number;
      waterCut: number;
      gor: number;
      temperatureDegF: number;
      minRateBopd?: number;
      maxRateBopd?: number;
      numPoints?: number;
    }
  ) {
    const result = this.vlpCalculator.calculateBeggsBrill({
      wellDepthFt: input.wellDepthFt,
      tubingDiameterIn: input.tubingDiameterIn,
      wellheadPressurePsi: input.wellheadPressurePsi,
      oilGravityApi: input.oilGravityApi,
      gasGravity: input.gasGravity,
      waterCut: input.waterCut / 100, // Convert from percent to fraction
      gor: input.gor,
      temperatureDegF: input.temperatureDegF,
      minRateBopd: input.minRateBopd ?? 0,
      maxRateBopd: input.maxRateBopd ?? 5000,
      numPoints: input.numPoints ?? 20,
    });

    const vlpAnalysis = await this.repository.createVlpAnalysis({
      wellId,
      correlation: 'BEGGS_BRILL',
      tubingIdInches: input.tubingDiameterIn.toString(),
      tubingDepthFt: input.wellDepthFt.toString(),
      wellheadPressurePsi: input.wellheadPressurePsi.toString(),
      wellheadTempF: input.temperatureDegF.toString(),
      waterCutPercent: input.waterCut.toString(),
      gorScfStb: input.gor.toString(),
      oilApi: input.oilGravityApi.toString(),
      gasSg: input.gasGravity.toString(),
      vlpCurve: result.curve,
      analyst: userId,
      analysisDate: new Date(),
    });

    return {
      analysis: vlpAnalysis,
      result,
    };
  }

  async getVlpAnalyses(wellId: string, _tenantId: string) {
    return this.repository.listVlpAnalysesByWell(wellId);
  }

  async calculateNodalAnalysis(
    wellId: string,
    _tenantId: string,
    userId: string,
    input: {
      iprModel: 'VOGEL' | 'FETKOVITCH' | 'STANDING' | 'COMPOSITE';
      reservoirPressurePsi: number;
      testRateBopd: number;
      testPwfPsi: number;
      bubblePointPsi?: number;
      wellDepthFt: number;
      tubingDiameterIn: number;
      wellheadPressurePsi: number;
      oilGravityApi: number;
      gasGravity: number;
      waterCut: number;
      gor: number;
      temperatureDegF: number;
      numPoints?: number;
    }
  ): Promise<{ analysis: any; result: NodalAnalysisResult }> {
    const nodalInput: NodalAnalysisInput = {
      iprModel: input.iprModel,
      reservoirPressurePsi: input.reservoirPressurePsi,
      testRateBopd: input.testRateBopd,
      testPwfPsi: input.testPwfPsi,
      bubblePointPsi: input.bubblePointPsi,
      wellDepthFt: input.wellDepthFt,
      tubingDiameterIn: input.tubingDiameterIn,
      wellheadPressurePsi: input.wellheadPressurePsi,
      oilGravityApi: input.oilGravityApi,
      gasGravity: input.gasGravity,
      waterCut: input.waterCut / 100, // Convert from percent to fraction
      gor: input.gor,
      temperatureDegF: input.temperatureDegF,
      numPoints: input.numPoints ?? 30,
    };

    const result = this.nodalAnalysisService.performNodalAnalysis(nodalInput);

    const nodalAnalysis = await this.repository.createNodalAnalysis({
      wellId,
      operatingRateBopd: result.operatingPoint.rateBopd.toString(),
      operatingPwfPsi: result.operatingPoint.pwfPsi.toString(),
      maxRateBopd: result.ipr.qmaxBopd.toString(),
      sensitivityResults: {
        iprModel: input.iprModel,
        vlpModel: 'BEGGS_BRILL',
        intersectionPoints: result.intersectionPoints,
        isStable: result.operatingPoint.isStable,
        multipleIntersections: result.multipleIntersections,
      },
      recommendations: result.recommendations.join('\n'),
      analyst: userId,
      analysisDate: new Date(),
    });

    return {
      analysis: nodalAnalysis,
      result,
    };
  }

  async getNodalAnalyses(wellId: string, _tenantId: string) {
    return this.repository.listNodalAnalysesByWell(wellId);
  }
}
