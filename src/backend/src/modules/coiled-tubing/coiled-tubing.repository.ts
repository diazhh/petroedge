import { eq, and, desc, asc, gte, lte, sql } from 'drizzle-orm';
import { db } from '../../common/database';
import {
  ctUnits,
  ctReels,
  ctReelSections,
  ctJobs,
  ctJobOperations,
  ctJobFluids,
  ctJobBha,
  ctBhaComponents,
  ctJobTickets,
  ctFatigueCycles,
  ctAlarms,
  ctRealtimeData,
  type CtUnit,
  type NewCtUnit,
  type CtReel,
  type NewCtReel,
  type CtReelSection,
  type NewCtReelSection,
  type CtJob,
  type NewCtJob,
  type CtJobOperation,
  type NewCtJobOperation,
  type CtJobFluid,
  type NewCtJobFluid,
  type CtJobBha,
  type NewCtJobBha,
  type CtBhaComponent,
  type NewCtBhaComponent,
  type CtJobTicket,
  type NewCtJobTicket,
  type NewCtFatigueCycle,
  type CtAlarm,
  type NewCtAlarm,
  type NewCtRealtimeData,
} from '../../common/database/schema';
import type { CtUnitQuery, CtReelQuery, CtJobQuery } from './coiled-tubing.schema';

// ============================================================================
// CT UNITS REPOSITORY
// ============================================================================

export class CtUnitsRepository {
  async findAll(tenantId: string, query: CtUnitQuery) {
    const { status, location, certificationStatus, page, perPage } = query;
    const offset = (page - 1) * perPage;

    const conditions = [eq(ctUnits.tenantId, tenantId)];
    if (status) conditions.push(eq(ctUnits.status, status));
    if (location) conditions.push(eq(ctUnits.location, location));
    if (certificationStatus) conditions.push(eq(ctUnits.certificationStatus, certificationStatus));

    const [units, countResult] = await Promise.all([
      db
        .select()
        .from(ctUnits)
        .where(and(...conditions))
        .orderBy(desc(ctUnits.createdAt))
        .limit(perPage)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(ctUnits)
        .where(and(...conditions)),
    ]);

    return {
      data: units,
      meta: {
        total: Number(countResult[0]?.count || 0),
        page,
        perPage,
      },
    };
  }

  async findById(id: string, tenantId: string) {
    const [unit] = await db
      .select()
      .from(ctUnits)
      .where(and(eq(ctUnits.id, id), eq(ctUnits.tenantId, tenantId)))
      .limit(1);
    return unit;
  }

  async findByUnitNumber(unitNumber: string, tenantId: string) {
    const [unit] = await db
      .select()
      .from(ctUnits)
      .where(and(eq(ctUnits.unitNumber, unitNumber), eq(ctUnits.tenantId, tenantId)))
      .limit(1);
    return unit;
  }

  async create(data: NewCtUnit) {
    const [unit] = await db.insert(ctUnits).values(data).returning();
    return unit;
  }

  async update(id: string, tenantId: string, data: Partial<CtUnit>) {
    const [unit] = await db
      .update(ctUnits)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(ctUnits.id, id), eq(ctUnits.tenantId, tenantId)))
      .returning();
    return unit;
  }

  async delete(id: string, tenantId: string) {
    await db.delete(ctUnits).where(and(eq(ctUnits.id, id), eq(ctUnits.tenantId, tenantId)));
  }
}

// ============================================================================
// CT REELS REPOSITORY
// ============================================================================

export class CtReelsRepository {
  async findAll(tenantId: string, query: CtReelQuery) {
    const { ctUnitId, status, condition, steelGrade, page, perPage } = query;
    const offset = (page - 1) * perPage;

    const conditions = [eq(ctReels.tenantId, tenantId)];
    if (ctUnitId) conditions.push(eq(ctReels.ctUnitId, ctUnitId));
    if (status) conditions.push(eq(ctReels.status, status));
    if (condition) conditions.push(eq(ctReels.condition, condition));
    if (steelGrade) conditions.push(eq(ctReels.steelGrade, steelGrade));

    const [reels, countResult] = await Promise.all([
      db
        .select()
        .from(ctReels)
        .where(and(...conditions))
        .orderBy(desc(ctReels.createdAt))
        .limit(perPage)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(ctReels)
        .where(and(...conditions)),
    ]);

    return {
      data: reels,
      meta: {
        total: Number(countResult[0]?.count || 0),
        page,
        perPage,
      },
    };
  }

  async findById(id: string, tenantId: string) {
    const [reel] = await db
      .select()
      .from(ctReels)
      .where(and(eq(ctReels.id, id), eq(ctReels.tenantId, tenantId)))
      .limit(1);
    return reel;
  }

  async findByReelNumber(reelNumber: string, tenantId: string) {
    const [reel] = await db
      .select()
      .from(ctReels)
      .where(and(eq(ctReels.reelNumber, reelNumber), eq(ctReels.tenantId, tenantId)))
      .limit(1);
    return reel;
  }

  async create(data: NewCtReel) {
    const [reel] = await db.insert(ctReels).values(data).returning();
    return reel;
  }

  async update(id: string, tenantId: string, data: Partial<CtReel>) {
    const [reel] = await db
      .update(ctReels)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(ctReels.id, id), eq(ctReels.tenantId, tenantId)))
      .returning();
    return reel;
  }

  async delete(id: string, tenantId: string) {
    await db.delete(ctReels).where(and(eq(ctReels.id, id), eq(ctReels.tenantId, tenantId)));
  }

  async updateFatigue(id: string, tenantId: string, fatiguePercentage: number, totalCycles: number) {
    const [reel] = await db
      .update(ctReels)
      .set({
        fatiguePercentage: fatiguePercentage.toString(),
        totalCycles,
        lastFatigueCalculation: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(ctReels.id, id), eq(ctReels.tenantId, tenantId)))
      .returning();
    return reel;
  }
}

// ============================================================================
// CT REEL SECTIONS REPOSITORY
// ============================================================================

export class CtReelSectionsRepository {
  async findByReelId(reelId: string) {
    return db
      .select()
      .from(ctReelSections)
      .where(eq(ctReelSections.reelId, reelId))
      .orderBy(asc(ctReelSections.sectionNumber));
  }

  async findById(id: string) {
    const [section] = await db.select().from(ctReelSections).where(eq(ctReelSections.id, id)).limit(1);
    return section;
  }

  async create(data: NewCtReelSection) {
    const [section] = await db.insert(ctReelSections).values(data).returning();
    return section;
  }

  async update(id: string, data: Partial<CtReelSection>) {
    const [section] = await db
      .update(ctReelSections)
      .set(data)
      .where(eq(ctReelSections.id, id))
      .returning();
    return section;
  }

  async delete(id: string) {
    await db.delete(ctReelSections).where(eq(ctReelSections.id, id));
  }

  async updateFatigue(id: string, fatiguePercentage: number, bendingCycles: number, pressureCycles: number) {
    const [section] = await db
      .update(ctReelSections)
      .set({
        fatiguePercentage: fatiguePercentage.toString(),
        bendingCycles,
        pressureCycles,
        lastUpdated: new Date(),
      })
      .where(eq(ctReelSections.id, id))
      .returning();
    return section;
  }
}

// ============================================================================
// CT JOBS REPOSITORY
// ============================================================================

export class CtJobsRepository {
  async findAll(tenantId: string, query: CtJobQuery) {
    const { ctUnitId, ctReelId, status, jobType, startDate, endDate, page, perPage } = query;
    const offset = (page - 1) * perPage;

    const conditions = [eq(ctJobs.tenantId, tenantId)];
    if (ctUnitId) conditions.push(eq(ctJobs.ctUnitId, ctUnitId));
    if (ctReelId) conditions.push(eq(ctJobs.ctReelId, ctReelId));
    if (status) conditions.push(eq(ctJobs.status, status));
    if (jobType) conditions.push(eq(ctJobs.jobType, jobType));
    if (startDate) conditions.push(gte(ctJobs.plannedStartDate, startDate));
    if (endDate) conditions.push(lte(ctJobs.plannedStartDate, endDate));

    const [jobs, countResult] = await Promise.all([
      db
        .select()
        .from(ctJobs)
        .where(and(...conditions))
        .orderBy(desc(ctJobs.createdAt))
        .limit(perPage)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(ctJobs)
        .where(and(...conditions)),
    ]);

    return {
      data: jobs,
      meta: {
        total: Number(countResult[0]?.count || 0),
        page,
        perPage,
      },
    };
  }

  async findById(id: string, tenantId: string) {
    const [job] = await db
      .select()
      .from(ctJobs)
      .where(and(eq(ctJobs.id, id), eq(ctJobs.tenantId, tenantId)))
      .limit(1);
    return job;
  }

  async findByJobNumber(jobNumber: string, tenantId: string) {
    const [job] = await db
      .select()
      .from(ctJobs)
      .where(and(eq(ctJobs.jobNumber, jobNumber), eq(ctJobs.tenantId, tenantId)))
      .limit(1);
    return job;
  }

  async create(data: NewCtJob) {
    const [job] = await db.insert(ctJobs).values(data).returning();
    return job;
  }

  async update(id: string, tenantId: string, data: Partial<CtJob>) {
    const [job] = await db
      .update(ctJobs)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(ctJobs.id, id), eq(ctJobs.tenantId, tenantId)))
      .returning();
    return job;
  }

  async delete(id: string, tenantId: string) {
    await db.delete(ctJobs).where(and(eq(ctJobs.id, id), eq(ctJobs.tenantId, tenantId)));
  }

  async getActiveJobForUnit(ctUnitId: string, tenantId: string) {
    const [job] = await db
      .select()
      .from(ctJobs)
      .where(and(eq(ctJobs.ctUnitId, ctUnitId), eq(ctJobs.tenantId, tenantId), eq(ctJobs.status, 'IN_PROGRESS')))
      .limit(1);
    return job;
  }

  async findConflictingJobs(
    ctUnitId: string,
    startDate: Date,
    endDate: Date,
    excludeJobId?: string
  ): Promise<CtJob[]> {
    const conditions = [
      eq(ctJobs.ctUnitId, ctUnitId),
      gte(ctJobs.plannedEndDate, startDate),
      lte(ctJobs.plannedStartDate, endDate),
    ];

    if (excludeJobId) {
      conditions.push(sql`${ctJobs.id} != ${excludeJobId}`);
    }

    return db
      .select()
      .from(ctJobs)
      .where(and(...conditions));
  }

  async findConflictingJobsByReel(
    ctReelId: string,
    startDate: Date,
    endDate: Date,
    excludeJobId?: string
  ): Promise<CtJob[]> {
    const conditions = [
      eq(ctJobs.ctReelId, ctReelId),
      gte(ctJobs.plannedEndDate, startDate),
      lte(ctJobs.plannedStartDate, endDate),
    ];

    if (excludeJobId) {
      conditions.push(sql`${ctJobs.id} != ${excludeJobId}`);
    }

    return db
      .select()
      .from(ctJobs)
      .where(and(...conditions));
  }
}

// ============================================================================
// CT JOB OPERATIONS REPOSITORY
// ============================================================================

export class CtJobOperationsRepository {
  async findByJobId(jobId: string) {
    return db
      .select()
      .from(ctJobOperations)
      .where(eq(ctJobOperations.jobId, jobId))
      .orderBy(asc(ctJobOperations.sequenceNumber));
  }

  async findById(id: string) {
    const [operation] = await db.select().from(ctJobOperations).where(eq(ctJobOperations.id, id)).limit(1);
    return operation;
  }

  async create(data: NewCtJobOperation) {
    const [operation] = await db.insert(ctJobOperations).values(data).returning();
    return operation;
  }

  async update(id: string, data: Partial<CtJobOperation>) {
    const [operation] = await db
      .update(ctJobOperations)
      .set(data)
      .where(eq(ctJobOperations.id, id))
      .returning();
    return operation;
  }

  async delete(id: string) {
    await db.delete(ctJobOperations).where(eq(ctJobOperations.id, id));
  }

  async getNextSequenceNumber(jobId: string): Promise<number> {
    const result = await db
      .select({ maxNum: sql<number>`COALESCE(MAX(${ctJobOperations.sequenceNumber}), 0)` })
      .from(ctJobOperations)
      .where(eq(ctJobOperations.jobId, jobId));
    return (result[0]?.maxNum || 0) + 1;
  }
}

// ============================================================================
// CT JOB FLUIDS REPOSITORY
// ============================================================================

export class CtJobFluidsRepository {
  async findByJobId(jobId: string) {
    return db
      .select()
      .from(ctJobFluids)
      .where(eq(ctJobFluids.jobId, jobId))
      .orderBy(desc(ctJobFluids.startTime));
  }

  async findById(id: string) {
    const [fluid] = await db.select().from(ctJobFluids).where(eq(ctJobFluids.id, id)).limit(1);
    return fluid;
  }

  async create(data: NewCtJobFluid) {
    const [fluid] = await db.insert(ctJobFluids).values(data).returning();
    return fluid;
  }

  async update(id: string, data: Partial<CtJobFluid>) {
    const [fluid] = await db
      .update(ctJobFluids)
      .set(data)
      .where(eq(ctJobFluids.id, id))
      .returning();
    return fluid;
  }

  async delete(id: string) {
    await db.delete(ctJobFluids).where(eq(ctJobFluids.id, id));
  }

  async getTotalVolumeByJob(jobId: string): Promise<number> {
    const result = await db
      .select({ total: sql<number>`COALESCE(SUM(${ctJobFluids.actualVolumeBbl}), 0)` })
      .from(ctJobFluids)
      .where(eq(ctJobFluids.jobId, jobId));
    return Number(result[0]?.total || 0);
  }
}

// ============================================================================
// CT JOB BHA REPOSITORY
// ============================================================================

export class CtJobBhaRepository {
  async findByJobId(jobId: string) {
    const [bha] = await db.select().from(ctJobBha).where(eq(ctJobBha.jobId, jobId)).limit(1);
    return bha;
  }

  async findById(id: string) {
    const [bha] = await db.select().from(ctJobBha).where(eq(ctJobBha.id, id)).limit(1);
    return bha;
  }

  async create(data: NewCtJobBha) {
    const [bha] = await db.insert(ctJobBha).values(data).returning();
    return bha;
  }

  async update(id: string, data: Partial<CtJobBha>) {
    const [bha] = await db
      .update(ctJobBha)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(ctJobBha.id, id))
      .returning();
    return bha;
  }

  async delete(id: string) {
    await db.delete(ctJobBha).where(eq(ctJobBha.id, id));
  }
}

// ============================================================================
// CT BHA COMPONENTS REPOSITORY
// ============================================================================

export class CtBhaComponentsRepository {
  async findByBhaId(bhaId: string) {
    return db
      .select()
      .from(ctBhaComponents)
      .where(eq(ctBhaComponents.bhaId, bhaId))
      .orderBy(asc(ctBhaComponents.sequenceNumber));
  }

  async findById(id: string) {
    const [component] = await db.select().from(ctBhaComponents).where(eq(ctBhaComponents.id, id)).limit(1);
    return component;
  }

  async create(data: NewCtBhaComponent) {
    const [component] = await db.insert(ctBhaComponents).values(data).returning();
    return component;
  }

  async update(id: string, data: Partial<CtBhaComponent>) {
    const [component] = await db
      .update(ctBhaComponents)
      .set(data)
      .where(eq(ctBhaComponents.id, id))
      .returning();
    return component;
  }

  async delete(id: string) {
    await db.delete(ctBhaComponents).where(eq(ctBhaComponents.id, id));
  }
}

// ============================================================================
// CT JOB TICKETS REPOSITORY
// ============================================================================

export class CtJobTicketsRepository {
  async findByJobId(jobId: string) {
    const [ticket] = await db.select().from(ctJobTickets).where(eq(ctJobTickets.jobId, jobId)).limit(1);
    return ticket;
  }

  async findById(id: string) {
    const [ticket] = await db.select().from(ctJobTickets).where(eq(ctJobTickets.id, id)).limit(1);
    return ticket;
  }

  async create(data: NewCtJobTicket) {
    const [ticket] = await db.insert(ctJobTickets).values(data).returning();
    return ticket;
  }

  async update(id: string, data: Partial<CtJobTicket>) {
    const [ticket] = await db
      .update(ctJobTickets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(ctJobTickets.id, id))
      .returning();
    return ticket;
  }

  async delete(id: string) {
    await db.delete(ctJobTickets).where(eq(ctJobTickets.id, id));
  }
}

// ============================================================================
// CT FATIGUE CYCLES REPOSITORY
// ============================================================================

export class CtFatigueCyclesRepository {
  async findByReelId(reelId: string, limit = 100) {
    return db
      .select()
      .from(ctFatigueCycles)
      .where(eq(ctFatigueCycles.reelId, reelId))
      .orderBy(desc(ctFatigueCycles.occurredAt))
      .limit(limit);
  }

  async findBySectionId(sectionId: string, limit = 100) {
    return db
      .select()
      .from(ctFatigueCycles)
      .where(eq(ctFatigueCycles.sectionId, sectionId))
      .orderBy(desc(ctFatigueCycles.occurredAt))
      .limit(limit);
  }

  async findByJobId(jobId: string) {
    return db
      .select()
      .from(ctFatigueCycles)
      .where(eq(ctFatigueCycles.jobId, jobId))
      .orderBy(desc(ctFatigueCycles.occurredAt));
  }

  async create(data: NewCtFatigueCycle) {
    const [cycle] = await db.insert(ctFatigueCycles).values(data).returning();
    return cycle;
  }

  async createBatch(data: NewCtFatigueCycle[]) {
    return db.insert(ctFatigueCycles).values(data).returning();
  }
}

// ============================================================================
// CT ALARMS REPOSITORY
// ============================================================================

export class CtAlarmsRepository {
  async findByJobId(jobId: string) {
    return db
      .select()
      .from(ctAlarms)
      .where(eq(ctAlarms.jobId, jobId))
      .orderBy(desc(ctAlarms.triggeredAt));
  }

  async findActiveByJobId(jobId: string, tenantId: string) {
    return db
      .select()
      .from(ctAlarms)
      .where(and(eq(ctAlarms.jobId, jobId), eq(ctAlarms.tenantId, tenantId), eq(ctAlarms.status, 'ACTIVE')))
      .orderBy(desc(ctAlarms.triggeredAt));
  }

  async findActiveByReelAndType(reelId: string, alarmType: string, severity: string) {
    const [alarm] = await db
      .select()
      .from(ctAlarms)
      .where(
        and(
          eq(ctAlarms.ctReelId, reelId),
          eq(ctAlarms.alarmType, alarmType),
          eq(ctAlarms.severity, severity),
          eq(ctAlarms.status, 'ACTIVE')
        )
      )
      .limit(1);
    return alarm;
  }

  async findActiveBySectionAndType(sectionId: string, alarmType: string) {
    const [alarm] = await db
      .select()
      .from(ctAlarms)
      .where(
        and(
          eq(ctAlarms.sectionId, sectionId),
          eq(ctAlarms.alarmType, alarmType),
          eq(ctAlarms.status, 'ACTIVE')
        )
      )
      .limit(1);
    return alarm;
  }

  async findActiveByReel(reelId: string, tenantId: string) {
    return db
      .select()
      .from(ctAlarms)
      .where(and(eq(ctAlarms.ctReelId, reelId), eq(ctAlarms.tenantId, tenantId), eq(ctAlarms.status, 'ACTIVE')))
      .orderBy(desc(ctAlarms.triggeredAt));
  }

  async findActiveBySeverity(tenantId: string, severity: string) {
    return db
      .select()
      .from(ctAlarms)
      .where(and(eq(ctAlarms.tenantId, tenantId), eq(ctAlarms.severity, severity), eq(ctAlarms.status, 'ACTIVE')))
      .orderBy(desc(ctAlarms.triggeredAt));
  }

  async findByTenantAndTimeRange(tenantId: string, startTime: Date) {
    return db
      .select()
      .from(ctAlarms)
      .where(and(eq(ctAlarms.tenantId, tenantId), gte(ctAlarms.triggeredAt, startTime)))
      .orderBy(desc(ctAlarms.triggeredAt));
  }

  async findById(id: string) {
    const [alarm] = await db.select().from(ctAlarms).where(eq(ctAlarms.id, id)).limit(1);
    return alarm;
  }

  async create(data: NewCtAlarm) {
    const [alarm] = await db.insert(ctAlarms).values(data).returning();
    return alarm;
  }

  async update(id: string, data: Partial<CtAlarm>) {
    const [alarm] = await db
      .update(ctAlarms)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(ctAlarms.id, id))
      .returning();
    return alarm;
  }

  async acknowledge(id: string, userId: string) {
    const [alarm] = await db
      .update(ctAlarms)
      .set({
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        acknowledgedBy: userId,
      })
      .where(eq(ctAlarms.id, id))
      .returning();
    return alarm;
  }

  async resolve(id: string) {
    const [alarm] = await db
      .update(ctAlarms)
      .set({
        status: 'RESOLVED',
        resolvedAt: new Date(),
      })
      .where(eq(ctAlarms.id, id))
      .returning();
    return alarm;
  }
}

// ============================================================================
// CT REALTIME DATA REPOSITORY
// ============================================================================

export class CtRealtimeDataRepository {
  async findByJobId(jobId: string, startTime?: Date, endTime?: Date, limit = 1000) {
    const conditions = [eq(ctRealtimeData.jobId, jobId)];
    if (startTime) conditions.push(gte(ctRealtimeData.time, startTime));
    if (endTime) conditions.push(lte(ctRealtimeData.time, endTime));

    return db
      .select()
      .from(ctRealtimeData)
      .where(and(...conditions))
      .orderBy(desc(ctRealtimeData.time))
      .limit(limit);
  }

  async findLatestByJobId(jobId: string) {
    const [data] = await db
      .select()
      .from(ctRealtimeData)
      .where(eq(ctRealtimeData.jobId, jobId))
      .orderBy(desc(ctRealtimeData.time))
      .limit(1);
    return data;
  }

  async create(data: NewCtRealtimeData) {
    const [record] = await db.insert(ctRealtimeData).values(data).returning();
    return record;
  }

  async createBatch(data: NewCtRealtimeData[]) {
    return db.insert(ctRealtimeData).values(data).returning();
  }
}
