import { eq, and, desc, asc, gte, lte, sql } from 'drizzle-orm';
import { db } from '../../common/database';
import { wells } from '../../common/database/schema';
import {
  wellPlans,
  trajectories,
  surveyPoints,
  casingPrograms,
  mudPrograms,
  bhaRuns,
  bhaComponents,
  drillingParams,
  dailyDrillingReports,
  drillingEvents,
  tdModels,
  type WellPlan,
  type NewWellPlan,
  type Trajectory,
  type NewTrajectory,
  type SurveyPoint,
  type NewSurveyPoint,
  type CasingProgram,
  type NewCasingProgram,
  type MudProgram,
  type NewMudProgram,
  type BhaRun,
  type NewBhaRun,
  type BhaComponent,
  type NewBhaComponent,
  type DrillingParam,
  type NewDrillingParam,
  type DailyDrillingReport,
  type NewDailyDrillingReport,
  type DrillingEvent,
  type NewDrillingEvent,
  type TdModel,
  type NewTdModel,
} from './drilling.schema';

export interface ListWellPlansFilters {
  tenantId: string;
  wellId?: string;
  status?: string;
  wellType?: string;
  page?: number;
  perPage?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface ListDrillingParamsFilters {
  wellId: string;
  fromTime?: Date;
  toTime?: Date;
  limit?: number;
}

export class DrillingRepository {
  // ============================================================================
  // WELL PLANS
  // ============================================================================

  async createWellPlan(data: NewWellPlan): Promise<WellPlan> {
    const [wellPlan] = await db.insert(wellPlans).values(data).returning();
    return wellPlan;
  }

  async findWellPlanById(id: string, tenantId: string): Promise<WellPlan | undefined> {
    const [wellPlan] = await db
      .select()
      .from(wellPlans)
      .where(and(eq(wellPlans.id, id), eq(wellPlans.tenantId, tenantId)));
    return wellPlan;
  }

  async findWellPlanWithRelations(id: string, tenantId: string) {
    const [result] = await db
      .select({
        wellPlan: wellPlans,
        well: wells,
      })
      .from(wellPlans)
      .leftJoin(wells, eq(wellPlans.wellId, wells.id))
      .where(and(eq(wellPlans.id, id), eq(wellPlans.tenantId, tenantId)));
    
    return result;
  }

  async listWellPlans(filters: ListWellPlansFilters) {
    const {
      tenantId,
      wellId,
      status,
      wellType,
      page = 1,
      perPage = 20,
      sort = 'createdAt',
      order = 'desc',
    } = filters;

    const conditions = [eq(wellPlans.tenantId, tenantId)];

    if (wellId) {
      conditions.push(eq(wellPlans.wellId, wellId));
    }
    if (status) {
      conditions.push(eq(wellPlans.planStatus, status as any));
    }
    if (wellType) {
      conditions.push(eq(wellPlans.wellType, wellType as any));
    }

    const offset = (page - 1) * perPage;
    const orderFn = order === 'asc' ? asc : desc;
    
    // Determinar columna de ordenamiento
    const sortColumn = sort === 'createdAt' ? wellPlans.createdAt : wellPlans.createdAt;

    const [items, [{ count }]] = await Promise.all([
      db
        .select({
          wellPlan: wellPlans,
          well: wells,
        })
        .from(wellPlans)
        .leftJoin(wells, eq(wellPlans.wellId, wells.id))
        .where(and(...conditions))
        .orderBy(orderFn(sortColumn))
        .limit(perPage)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(wellPlans)
        .where(and(...conditions)),
    ]);

    return {
      items,
      total: count,
      page,
      perPage,
      totalPages: Math.ceil(count / perPage),
    };
  }

  async updateWellPlan(id: string, tenantId: string, data: Partial<NewWellPlan>): Promise<WellPlan> {
    const [updated] = await db
      .update(wellPlans)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(wellPlans.id, id), eq(wellPlans.tenantId, tenantId)))
      .returning();
    return updated;
  }

  async deleteWellPlan(id: string, tenantId: string): Promise<void> {
    await db
      .delete(wellPlans)
      .where(and(eq(wellPlans.id, id), eq(wellPlans.tenantId, tenantId)));
  }

  // ============================================================================
  // TRAJECTORIES
  // ============================================================================

  async createTrajectory(data: NewTrajectory): Promise<Trajectory> {
    const [trajectory] = await db.insert(trajectories).values(data).returning();
    return trajectory;
  }

  async findTrajectoryById(id: string): Promise<Trajectory | undefined> {
    const [trajectory] = await db
      .select()
      .from(trajectories)
      .where(eq(trajectories.id, id));
    return trajectory;
  }

  async findTrajectoriesByWellPlan(wellPlanId: string): Promise<Trajectory[]> {
    return db
      .select()
      .from(trajectories)
      .where(eq(trajectories.wellPlanId, wellPlanId))
      .orderBy(desc(trajectories.createdAt));
  }

  async updateTrajectory(id: string, data: Partial<NewTrajectory>): Promise<Trajectory> {
    const [updated] = await db
      .update(trajectories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(trajectories.id, id))
      .returning();
    return updated;
  }

  // ============================================================================
  // SURVEY POINTS
  // ============================================================================

  async createSurveyPoint(data: NewSurveyPoint): Promise<SurveyPoint> {
    const [surveyPoint] = await db.insert(surveyPoints).values(data).returning();
    return surveyPoint;
  }

  async createSurveyPoints(data: NewSurveyPoint[]): Promise<SurveyPoint[]> {
    return db.insert(surveyPoints).values(data).returning();
  }

  async findSurveyPointsByTrajectory(trajectoryId: string): Promise<SurveyPoint[]> {
    return db
      .select()
      .from(surveyPoints)
      .where(eq(surveyPoints.trajectoryId, trajectoryId))
      .orderBy(asc(surveyPoints.mdFt));
  }

  // ============================================================================
  // CASING PROGRAMS
  // ============================================================================

  async createCasingProgram(data: NewCasingProgram): Promise<CasingProgram> {
    const [casingProgram] = await db.insert(casingPrograms).values(data).returning();
    return casingProgram;
  }

  async findCasingProgramsByWellPlan(wellPlanId: string): Promise<CasingProgram[]> {
    return db
      .select()
      .from(casingPrograms)
      .where(eq(casingPrograms.wellPlanId, wellPlanId))
      .orderBy(desc(casingPrograms.settingDepthMdFt));
  }

  async updateCasingProgram(id: string, data: Partial<NewCasingProgram>): Promise<CasingProgram> {
    const [updated] = await db
      .update(casingPrograms)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(casingPrograms.id, id))
      .returning();
    return updated;
  }

  // ============================================================================
  // MUD PROGRAMS
  // ============================================================================

  async createMudProgram(data: NewMudProgram): Promise<MudProgram> {
    const [mudProgram] = await db.insert(mudPrograms).values(data).returning();
    return mudProgram;
  }

  async findMudProgramsByWellPlan(wellPlanId: string): Promise<MudProgram[]> {
    return db
      .select()
      .from(mudPrograms)
      .where(eq(mudPrograms.wellPlanId, wellPlanId))
      .orderBy(asc(mudPrograms.depthFromFt));
  }

  // ============================================================================
  // BHA RUNS
  // ============================================================================

  async createBhaRun(data: NewBhaRun): Promise<BhaRun> {
    const [bhaRun] = await db.insert(bhaRuns).values(data).returning();
    return bhaRun;
  }

  async findBhaRunById(id: string): Promise<BhaRun | undefined> {
    const [bhaRun] = await db
      .select()
      .from(bhaRuns)
      .where(eq(bhaRuns.id, id));
    return bhaRun;
  }

  async findBhaRunsByWellPlan(wellPlanId: string): Promise<BhaRun[]> {
    return db
      .select()
      .from(bhaRuns)
      .where(eq(bhaRuns.wellPlanId, wellPlanId))
      .orderBy(desc(bhaRuns.runNumber));
  }

  async updateBhaRun(id: string, data: Partial<NewBhaRun>): Promise<BhaRun> {
    const [updated] = await db
      .update(bhaRuns)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(bhaRuns.id, id))
      .returning();
    return updated;
  }

  // ============================================================================
  // BHA COMPONENTS
  // ============================================================================

  async createBhaComponent(data: NewBhaComponent): Promise<BhaComponent> {
    const [component] = await db.insert(bhaComponents).values(data).returning();
    return component;
  }

  async createBhaComponents(data: NewBhaComponent[]): Promise<BhaComponent[]> {
    return db.insert(bhaComponents).values(data).returning();
  }

  async findBhaComponentsByRun(bhaRunId: string): Promise<BhaComponent[]> {
    return db
      .select()
      .from(bhaComponents)
      .where(eq(bhaComponents.bhaRunId, bhaRunId))
      .orderBy(asc(bhaComponents.sequenceNumber));
  }

  // ============================================================================
  // DRILLING PARAMS (TimescaleDB)
  // ============================================================================

  async insertDrillingParams(data: NewDrillingParam[]): Promise<void> {
    await db.insert(drillingParams).values(data);
  }

  async findDrillingParams(filters: ListDrillingParamsFilters): Promise<DrillingParam[]> {
    const { wellId, fromTime, toTime, limit = 1000 } = filters;

    const conditions = [eq(drillingParams.wellId, wellId)];

    if (fromTime) {
      conditions.push(gte(drillingParams.time, fromTime));
    }
    if (toTime) {
      conditions.push(lte(drillingParams.time, toTime));
    }

    return db
      .select()
      .from(drillingParams)
      .where(and(...conditions))
      .orderBy(desc(drillingParams.time))
      .limit(limit);
  }

  async getLatestDrillingParams(wellId: string): Promise<DrillingParam | undefined> {
    const [latest] = await db
      .select()
      .from(drillingParams)
      .where(eq(drillingParams.wellId, wellId))
      .orderBy(desc(drillingParams.time))
      .limit(1);
    return latest;
  }

  // ============================================================================
  // DAILY DRILLING REPORTS
  // ============================================================================

  async createDailyReport(data: NewDailyDrillingReport): Promise<DailyDrillingReport> {
    const [report] = await db.insert(dailyDrillingReports).values(data).returning();
    return report;
  }

  async findDailyReportById(id: string, tenantId: string): Promise<DailyDrillingReport | undefined> {
    const [report] = await db
      .select()
      .from(dailyDrillingReports)
      .where(and(eq(dailyDrillingReports.id, id), eq(dailyDrillingReports.tenantId, tenantId)));
    return report;
  }

  async findDailyReportsByWell(wellId: string, tenantId: string): Promise<DailyDrillingReport[]> {
    return db
      .select()
      .from(dailyDrillingReports)
      .where(and(eq(dailyDrillingReports.wellId, wellId), eq(dailyDrillingReports.tenantId, tenantId)))
      .orderBy(desc(dailyDrillingReports.reportDate));
  }

  async updateDailyReport(id: string, tenantId: string, data: Partial<NewDailyDrillingReport>): Promise<DailyDrillingReport> {
    const [updated] = await db
      .update(dailyDrillingReports)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(dailyDrillingReports.id, id), eq(dailyDrillingReports.tenantId, tenantId)))
      .returning();
    return updated;
  }

  // ============================================================================
  // DRILLING EVENTS
  // ============================================================================

  async createDrillingEvent(data: NewDrillingEvent): Promise<DrillingEvent> {
    const [event] = await db.insert(drillingEvents).values(data).returning();
    return event;
  }

  async findDrillingEventsByWell(wellId: string, fromTime?: Date, toTime?: Date): Promise<DrillingEvent[]> {
    const conditions = [eq(drillingEvents.wellId, wellId)];

    if (fromTime) {
      conditions.push(gte(drillingEvents.startTime, fromTime));
    }
    if (toTime) {
      conditions.push(lte(drillingEvents.startTime, toTime));
    }

    return db
      .select()
      .from(drillingEvents)
      .where(and(...conditions))
      .orderBy(desc(drillingEvents.startTime));
  }

  // ============================================================================
  // TORQUE & DRAG MODELS
  // ============================================================================

  async createTdModel(data: NewTdModel): Promise<TdModel> {
    const [model] = await db.insert(tdModels).values(data).returning();
    return model;
  }

  async findTdModelById(id: string): Promise<TdModel | undefined> {
    const [model] = await db
      .select()
      .from(tdModels)
      .where(eq(tdModels.id, id));
    return model;
  }

  async findTdModelsByWellPlan(wellPlanId: string): Promise<TdModel[]> {
    return db
      .select()
      .from(tdModels)
      .where(eq(tdModels.wellPlanId, wellPlanId))
      .orderBy(desc(tdModels.modelDate));
  }

  async updateTdModel(id: string, data: Partial<NewTdModel>): Promise<TdModel> {
    const [updated] = await db
      .update(tdModels)
      .set(data)
      .where(eq(tdModels.id, id))
      .returning();
    return updated;
  }
}
