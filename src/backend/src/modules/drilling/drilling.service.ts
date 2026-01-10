import { DrillingRepository, type ListWellPlansFilters, type ListDrillingParamsFilters } from './drilling.repository';
import { TrajectoryCalculatorService, type SurveyPoint as TrajectorySurveyPoint, type TrajectoryDesignParams } from './trajectory-calculator.service';
import { TorqueDragService, type TorqueDragParams } from './torque-drag.service';
import { MSECalculatorService, type DrillingParams as MSEDrillingParams } from './mse-calculator.service';
import { KillSheetService, type WellData, type StringCapacities, type PumpData, type KickData } from './kill-sheet.service';
import type { 
  NewWellPlan, 
  NewTrajectory, 
  NewSurveyPoint,
  NewCasingProgram,
  NewMudProgram,
  NewBhaRun,
  NewBhaComponent,
  NewDailyDrillingReport,
  NewDrillingEvent,
  NewTdModel
} from './drilling.schema';

export class DrillingService {
  private repository: DrillingRepository;
  private trajectoryCalculator: TrajectoryCalculatorService;
  private torqueDragService: TorqueDragService;
  private mseCalculator: MSECalculatorService;
  private killSheetService: KillSheetService;

  constructor() {
    this.repository = new DrillingRepository();
    this.trajectoryCalculator = new TrajectoryCalculatorService();
    this.torqueDragService = new TorqueDragService();
    this.mseCalculator = new MSECalculatorService();
    this.killSheetService = new KillSheetService();
  }

  // ============================================================================
  // WELL PLANS
  // ============================================================================

  async createWellPlan(tenantId: string, userId: string, data: Omit<NewWellPlan, 'tenantId' | 'preparedBy'>) {
    const wellPlan = await this.repository.createWellPlan({
      ...data,
      tenantId,
      preparedBy: userId,
    });

    return wellPlan;
  }

  async getWellPlan(id: string, tenantId: string) {
    const wellPlan = await this.repository.findWellPlanWithRelations(id, tenantId);
    
    if (!wellPlan) {
      throw new Error('Well plan not found');
    }

    return wellPlan;
  }

  async listWellPlans(filters: ListWellPlansFilters) {
    return this.repository.listWellPlans(filters);
  }

  async updateWellPlan(id: string, tenantId: string, data: Partial<NewWellPlan>) {
    const existing = await this.repository.findWellPlanById(id, tenantId);
    
    if (!existing) {
      throw new Error('Well plan not found');
    }

    return this.repository.updateWellPlan(id, tenantId, data);
  }

  async deleteWellPlan(id: string, tenantId: string) {
    const existing = await this.repository.findWellPlanById(id, tenantId);
    
    if (!existing) {
      throw new Error('Well plan not found');
    }

    await this.repository.deleteWellPlan(id, tenantId);
  }

  async approveWellPlan(id: string, tenantId: string, userId: string) {
    const existing = await this.repository.findWellPlanById(id, tenantId);
    
    if (!existing) {
      throw new Error('Well plan not found');
    }

    if (existing.planStatus !== 'REVIEW') {
      throw new Error('Only plans in REVIEW status can be approved');
    }

    return this.repository.updateWellPlan(id, tenantId, {
      planStatus: 'APPROVED',
      approvedBy: userId,
      approvedAt: new Date(),
    });
  }

  // ============================================================================
  // TRAJECTORIES & CALCULATIONS
  // ============================================================================

  async createTrajectory(wellPlanId: string, data: Omit<NewTrajectory, 'wellPlanId'>) {
    return this.repository.createTrajectory({
      ...data,
      wellPlanId,
    });
  }

  async calculateTrajectory(surveys: TrajectorySurveyPoint[]) {
    return this.trajectoryCalculator.calculateTrajectory(surveys);
  }

  async designTrajectory(params: TrajectoryDesignParams) {
    return this.trajectoryCalculator.designTrajectory(params);
  }

  async getTrajectory(id: string) {
    const trajectory = await this.repository.findTrajectoryById(id);
    
    if (!trajectory) {
      throw new Error('Trajectory not found');
    }

    return trajectory;
  }

  async listTrajectoriesByWellPlan(wellPlanId: string) {
    return this.repository.findTrajectoriesByWellPlan(wellPlanId);
  }

  async addSurveyPoints(trajectoryId: string, surveys: Omit<NewSurveyPoint, 'trajectoryId'>[]) {
    const surveyPoints = surveys.map(s => ({
      ...s,
      trajectoryId,
    }));

    return this.repository.createSurveyPoints(surveyPoints);
  }

  async getSurveyPoints(trajectoryId: string) {
    return this.repository.findSurveyPointsByTrajectory(trajectoryId);
  }

  // ============================================================================
  // TORQUE & DRAG
  // ============================================================================

  async calculateTorqueDrag(params: TorqueDragParams, operation: 'TRIP_IN' | 'TRIP_OUT' | 'ROTATING' | 'SLIDING') {
    return this.torqueDragService.calculateTorqueDrag(params, operation);
  }

  async createTdModel(wellPlanId: string, data: Omit<NewTdModel, 'wellPlanId'>) {
    return this.repository.createTdModel({
      ...data,
      wellPlanId,
    });
  }

  async getTdModel(id: string) {
    const model = await this.repository.findTdModelById(id);
    
    if (!model) {
      throw new Error('T&D model not found');
    }

    return model;
  }

  async listTdModelsByWellPlan(wellPlanId: string) {
    return this.repository.findTdModelsByWellPlan(wellPlanId);
  }

  // ============================================================================
  // MSE CALCULATIONS
  // ============================================================================

  async calculateMSE(params: MSEDrillingParams) {
    return this.mseCalculator.calculateMSE(params);
  }

  async calculateMSETrend(dataPoints: Array<MSEDrillingParams & { timestamp: Date }>) {
    return this.mseCalculator.calculateMSETrend(dataPoints);
  }

  // ============================================================================
  // KILL SHEET
  // ============================================================================

  async generateKillSheet(
    wellData: WellData,
    stringCapacities: StringCapacities,
    pumpData: PumpData,
    kickData?: KickData
  ) {
    return this.killSheetService.generateKillSheet(wellData, stringCapacities, pumpData, kickData);
  }

  // ============================================================================
  // CASING PROGRAMS
  // ============================================================================

  async createCasingProgram(wellPlanId: string, data: Omit<NewCasingProgram, 'wellPlanId'>) {
    return this.repository.createCasingProgram({
      ...data,
      wellPlanId,
    });
  }

  async listCasingPrograms(wellPlanId: string) {
    return this.repository.findCasingProgramsByWellPlan(wellPlanId);
  }

  async updateCasingProgram(id: string, data: Partial<NewCasingProgram>) {
    return this.repository.updateCasingProgram(id, data);
  }

  // ============================================================================
  // MUD PROGRAMS
  // ============================================================================

  async createMudProgram(wellPlanId: string, data: Omit<NewMudProgram, 'wellPlanId'>) {
    return this.repository.createMudProgram({
      ...data,
      wellPlanId,
    });
  }

  async listMudPrograms(wellPlanId: string) {
    return this.repository.findMudProgramsByWellPlan(wellPlanId);
  }

  // ============================================================================
  // BHA RUNS
  // ============================================================================

  async createBhaRun(wellPlanId: string, data: Omit<NewBhaRun, 'wellPlanId'>) {
    return this.repository.createBhaRun({
      ...data,
      wellPlanId,
    });
  }

  async getBhaRun(id: string) {
    const bhaRun = await this.repository.findBhaRunById(id);
    
    if (!bhaRun) {
      throw new Error('BHA run not found');
    }

    return bhaRun;
  }

  async listBhaRuns(wellPlanId: string) {
    return this.repository.findBhaRunsByWellPlan(wellPlanId);
  }

  async updateBhaRun(id: string, data: Partial<NewBhaRun>) {
    return this.repository.updateBhaRun(id, data);
  }

  async addBhaComponents(bhaRunId: string, components: Omit<NewBhaComponent, 'bhaRunId'>[]) {
    const bhaComponents = components.map(c => ({
      ...c,
      bhaRunId,
    }));

    return this.repository.createBhaComponents(bhaComponents);
  }

  async getBhaComponents(bhaRunId: string) {
    return this.repository.findBhaComponentsByRun(bhaRunId);
  }

  // ============================================================================
  // DRILLING PARAMS (Real-time data)
  // ============================================================================

  async getDrillingParams(filters: ListDrillingParamsFilters) {
    return this.repository.findDrillingParams(filters);
  }

  async getLatestDrillingParams(wellId: string) {
    return this.repository.getLatestDrillingParams(wellId);
  }

  // ============================================================================
  // DAILY DRILLING REPORTS
  // ============================================================================

  async createDailyReport(tenantId: string, userId: string, data: Omit<NewDailyDrillingReport, 'tenantId' | 'preparedBy'>) {
    return this.repository.createDailyReport({
      ...data,
      tenantId,
      preparedBy: userId,
    });
  }

  async getDailyReport(id: string, tenantId: string) {
    const report = await this.repository.findDailyReportById(id, tenantId);
    
    if (!report) {
      throw new Error('Daily report not found');
    }

    return report;
  }

  async listDailyReports(wellId: string, tenantId: string) {
    return this.repository.findDailyReportsByWell(wellId, tenantId);
  }

  async updateDailyReport(id: string, tenantId: string, data: Partial<NewDailyDrillingReport>) {
    return this.repository.updateDailyReport(id, tenantId, data);
  }

  async approveDailyReport(id: string, tenantId: string, userId: string) {
    const existing = await this.repository.findDailyReportById(id, tenantId);
    
    if (!existing) {
      throw new Error('Daily report not found');
    }

    if (existing.status !== 'SUBMITTED') {
      throw new Error('Only submitted reports can be approved');
    }

    return this.repository.updateDailyReport(id, tenantId, {
      status: 'APPROVED',
      approvedBy: userId,
      approvedAt: new Date(),
    });
  }

  // ============================================================================
  // DRILLING EVENTS
  // ============================================================================

  async createDrillingEvent(userId: string, data: Omit<NewDrillingEvent, 'createdBy'>) {
    return this.repository.createDrillingEvent({
      ...data,
      createdBy: userId,
    });
  }

  async listDrillingEvents(wellId: string, fromTime?: Date, toTime?: Date) {
    return this.repository.findDrillingEventsByWell(wellId, fromTime, toTime);
  }
}
