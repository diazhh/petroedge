import {
  CtUnitsRepository,
  CtReelsRepository,
  CtReelSectionsRepository,
  CtJobsRepository,
  CtJobOperationsRepository,
  CtJobFluidsRepository,
  CtJobBhaRepository,
  CtJobTicketsRepository,
  CtAlarmsRepository,
  CtRealtimeDataRepository,
} from './coiled-tubing.repository';
import { BusinessRulesService } from './business-rules.service';
import { JobTicketGeneratorService } from './job-ticket-generator.service';
import type {
  CreateCtUnitInput,
  UpdateCtUnitInput,
  CreateCtReelInput,
  UpdateCtReelInput,
  CreateCtJobInput,
  UpdateCtJobInput,
  CtUnitQuery,
  CtReelQuery,
  CtJobQuery,
} from './coiled-tubing.schema';
import type { CtUnit, CtReel, CtJob } from '../../common/database/schema';

export class CoiledTubingService {
  private unitsRepo: CtUnitsRepository;
  private reelsRepo: CtReelsRepository;
  private sectionsRepo: CtReelSectionsRepository;
  private jobsRepo: CtJobsRepository;
  private operationsRepo: CtJobOperationsRepository;
  private fluidsRepo: CtJobFluidsRepository;
  private bhaRepo: CtJobBhaRepository;
  private ticketsRepo: CtJobTicketsRepository;
  private alarmsRepo: CtAlarmsRepository;
  private realtimeDataRepo: CtRealtimeDataRepository;
  private businessRules: BusinessRulesService;
  private ticketGenerator: JobTicketGeneratorService;

  constructor() {
    this.unitsRepo = new CtUnitsRepository();
    this.reelsRepo = new CtReelsRepository();
    this.sectionsRepo = new CtReelSectionsRepository();
    this.jobsRepo = new CtJobsRepository();
    this.operationsRepo = new CtJobOperationsRepository();
    this.fluidsRepo = new CtJobFluidsRepository();
    this.bhaRepo = new CtJobBhaRepository();
    this.ticketsRepo = new CtJobTicketsRepository();
    this.alarmsRepo = new CtAlarmsRepository();
    this.realtimeDataRepo = new CtRealtimeDataRepository();
    this.businessRules = new BusinessRulesService();
    this.ticketGenerator = new JobTicketGeneratorService();
  }

  // ============================================================================
  // CT UNITS
  // ============================================================================

  async getUnits(tenantId: string, query: CtUnitQuery) {
    return this.unitsRepo.findAll(tenantId, query);
  }

  async getUnitById(id: string, tenantId: string) {
    const unit = await this.unitsRepo.findById(id, tenantId);
    if (!unit) {
      throw new Error(`CT Unit with ID ${id} not found`);
    }
    return unit;
  }

  async createUnit(tenantId: string, userId: string, data: CreateCtUnitInput): Promise<CtUnit> {
    // Check if unit number already exists
    const existing = await this.unitsRepo.findByUnitNumber(data.unitNumber, tenantId);
    if (existing) {
      throw new Error(`CT Unit with number ${data.unitNumber} already exists`);
    }

    return this.unitsRepo.create({
      ...data,
      maxFlowRateBpm: data.maxFlowRateBpm?.toString(),
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });
  }

  async updateUnit(id: string, tenantId: string, userId: string, data: UpdateCtUnitInput): Promise<CtUnit> {
    const existing = await this.unitsRepo.findById(id, tenantId);
    if (!existing) {
      throw new Error(`CT Unit with ID ${id} not found`);
    }

    return this.unitsRepo.update(id, tenantId, {
      ...data,
      maxFlowRateBpm: data.maxFlowRateBpm?.toString(),
      updatedBy: userId,
    });
  }

  async deleteUnit(id: string, tenantId: string) {
    const existing = await this.unitsRepo.findById(id, tenantId);
    if (!existing) {
      throw new Error(`CT Unit with ID ${id} not found`);
    }

    // Check if unit has active jobs
    const activeJob = await this.jobsRepo.getActiveJobForUnit(id, tenantId);
    if (activeJob) {
      throw new Error(`Cannot delete CT Unit with active job`);
    }

    await this.unitsRepo.delete(id, tenantId);
  }

  // ============================================================================
  // CT REELS
  // ============================================================================

  async getReels(tenantId: string, query: CtReelQuery) {
    return this.reelsRepo.findAll(tenantId, query);
  }

  async getReelById(id: string, tenantId: string) {
    const reel = await this.reelsRepo.findById(id, tenantId);
    if (!reel) {
      throw new Error(`CT Reel with ID ${id} not found`);
    }
    return reel;
  }

  async createReel(tenantId: string, userId: string, data: CreateCtReelInput): Promise<CtReel> {
    // Check if reel number already exists
    const existing = await this.reelsRepo.findByReelNumber(data.reelNumber, tenantId);
    if (existing) {
      throw new Error(`CT Reel with number ${data.reelNumber} already exists`);
    }

    // Validate CT Unit if provided
    if (data.ctUnitId) {
      const unit = await this.unitsRepo.findById(data.ctUnitId, tenantId);
      if (!unit) {
        throw new Error(`CT Unit with ID ${data.ctUnitId} not found`);
      }
    }

    return this.reelsRepo.create({
      ...data,
      outerDiameterIn: data.outerDiameterIn.toString(),
      wallThicknessIn: data.wallThicknessIn.toString(),
      innerDiameterIn: data.innerDiameterIn.toString(),
      weightPerFtLbs: data.weightPerFtLbs?.toString(),
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });
  }

  async updateReel(id: string, tenantId: string, userId: string, data: UpdateCtReelInput): Promise<CtReel> {
    const existing = await this.reelsRepo.findById(id, tenantId);
    if (!existing) {
      throw new Error(`CT Reel with ID ${id} not found`);
    }

    // Validate CT Unit if provided
    if (data.ctUnitId) {
      const unit = await this.unitsRepo.findById(data.ctUnitId, tenantId);
      if (!unit) {
        throw new Error(`CT Unit with ID ${data.ctUnitId} not found`);
      }
    }

    return this.reelsRepo.update(id, tenantId, {
      ...data,
      weightPerFtLbs: data.weightPerFtLbs?.toString(),
      fatiguePercentage: data.fatiguePercentage?.toString(),
      updatedBy: userId,
    });
  }

  async deleteReel(id: string, tenantId: string) {
    const existing = await this.reelsRepo.findById(id, tenantId);
    if (!existing) {
      throw new Error(`CT Reel with ID ${id} not found`);
    }

    await this.reelsRepo.delete(id, tenantId);
  }

  async getReelSections(reelId: string, tenantId: string) {
    // Verify reel exists
    await this.getReelById(reelId, tenantId);
    return this.sectionsRepo.findByReelId(reelId);
  }

  // ============================================================================
  // CT JOBS
  // ============================================================================

  async getJobs(tenantId: string, query: CtJobQuery) {
    return this.jobsRepo.findAll(tenantId, query);
  }

  async getJobById(id: string, tenantId: string) {
    const job = await this.jobsRepo.findById(id, tenantId);
    if (!job) {
      throw new Error(`CT Job with ID ${id} not found`);
    }
    return job;
  }

  async createJob(tenantId: string, userId: string, data: CreateCtJobInput): Promise<CtJob> {
    // Check if job number already exists
    const existing = await this.jobsRepo.findByJobNumber(data.jobNumber, tenantId);
    if (existing) {
      throw new Error(`CT Job with number ${data.jobNumber} already exists`);
    }

    // Validate CT Unit exists
    const unit = await this.unitsRepo.findById(data.ctUnitId, tenantId);
    if (!unit) {
      throw new Error(`CT Unit with ID ${data.ctUnitId} not found`);
    }

    // Validate CT Reel exists
    const reel = await this.reelsRepo.findById(data.ctReelId, tenantId);
    if (!reel) {
      throw new Error(`CT Reel with ID ${data.ctReelId} not found`);
    }

    // Validate unit availability for planned dates
    const endDate = data.plannedEndDate || new Date(data.plannedStartDate.getTime() + 24 * 60 * 60 * 1000);
    const unitAvailability = await this.businessRules.validateUnitAvailability(
      data.ctUnitId,
      tenantId,
      data.plannedStartDate,
      endDate
    );
    if (!unitAvailability.available) {
      throw new Error(`CT Unit not available: ${unitAvailability.reason}`);
    }

    // Validate reel availability for planned dates
    const reelAvailability = await this.businessRules.validateReelAvailability(
      data.ctReelId,
      tenantId,
      data.plannedStartDate,
      endDate
    );
    if (!reelAvailability.available) {
      throw new Error(`CT Reel not available: ${reelAvailability.reason}`);
    }

    // Validate operational limits if target depth is provided
    if (data.targetDepthFt) {
      const limitsValidation = await this.businessRules.validateOperationalLimits(
        {
          ctUnitId: data.ctUnitId,
          ctReelId: data.ctReelId,
          targetDepthFt: data.targetDepthFt,
        },
        tenantId
      );
      if (!limitsValidation.valid) {
        throw new Error(`Operational limits validation failed: ${limitsValidation.violations.join(', ')}`);
      }
    }

    return this.jobsRepo.create({
      ...data,
      estimatedDurationHours: data.estimatedDurationHours?.toString(),
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });
  }

  async updateJob(id: string, tenantId: string, userId: string, data: UpdateCtJobInput): Promise<CtJob> {
    const existing = await this.jobsRepo.findById(id, tenantId);
    if (!existing) {
      throw new Error(`CT Job with ID ${id} not found`);
    }

    return this.jobsRepo.update(id, tenantId, {
      ...data,
      estimatedDurationHours: data.estimatedDurationHours?.toString(),
      actualDurationHours: data.actualDurationHours?.toString(),
      updatedBy: userId,
    });
  }

  async deleteJob(id: string, tenantId: string) {
    const existing = await this.jobsRepo.findById(id, tenantId);
    if (!existing) {
      throw new Error(`CT Job with ID ${id} not found`);
    }

    // Only allow deletion of draft jobs
    if (existing.status !== 'DRAFT') {
      throw new Error(`Cannot delete job with status ${existing.status}. Only DRAFT jobs can be deleted.`);
    }

    await this.jobsRepo.delete(id, tenantId);
  }

  async startJob(id: string, tenantId: string, userId: string): Promise<CtJob> {
    const job = await this.jobsRepo.findById(id, tenantId);
    if (!job) {
      throw new Error(`CT Job with ID ${id} not found`);
    }

    // Run comprehensive pre-job validation checklist
    const validation = await this.businessRules.validateJobCanStart(id, tenantId);
    if (!validation.canStart) {
      throw new Error(`Job cannot start: ${validation.issues.join('; ')}`);
    }

    // Update unit status
    if (job.ctUnitId) {
      await this.unitsRepo.update(job.ctUnitId, tenantId, {
        status: 'IN_SERVICE',
        currentJobId: id,
      });
    }

    // Update reel status
    if (job.ctReelId) {
      await this.reelsRepo.update(job.ctReelId, tenantId, {
        status: 'IN_USE',
      });
    }

    return this.jobsRepo.update(id, tenantId, {
      status: 'IN_PROGRESS',
      actualStartDate: new Date(),
      updatedBy: userId,
    });
  }

  async completeJob(id: string, tenantId: string, userId: string): Promise<CtJob> {
    const job = await this.jobsRepo.findById(id, tenantId);
    if (!job) {
      throw new Error(`CT Job with ID ${id} not found`);
    }

    // Validate job can be completed
    const validation = await this.businessRules.validateJobCanComplete(id, tenantId);
    if (!validation.canComplete) {
      throw new Error(`Job cannot be completed: ${validation.issues.join('; ')}`);
    }

    const actualEndDate = new Date();
    const actualDurationHours = job.actualStartDate
      ? (actualEndDate.getTime() - job.actualStartDate.getTime()) / (1000 * 60 * 60)
      : null;

    // Update unit status
    if (job.ctUnitId) {
      await this.unitsRepo.update(job.ctUnitId, tenantId, {
        status: 'AVAILABLE',
        currentJobId: null,
      });
    }

    // Update reel status
    if (job.ctReelId) {
      await this.reelsRepo.update(job.ctReelId, tenantId, {
        status: 'AVAILABLE',
      });
    }

    return this.jobsRepo.update(id, tenantId, {
      status: 'COMPLETED',
      actualEndDate,
      actualDurationHours: actualDurationHours?.toString(),
      updatedBy: userId,
    });
  }

  async getJobOperations(jobId: string, tenantId: string) {
    // Verify job exists
    await this.getJobById(jobId, tenantId);
    return this.operationsRepo.findByJobId(jobId);
  }

  async getJobFluids(jobId: string, tenantId: string) {
    // Verify job exists
    await this.getJobById(jobId, tenantId);
    return this.fluidsRepo.findByJobId(jobId);
  }

  async getJobBha(jobId: string, tenantId: string) {
    // Verify job exists
    await this.getJobById(jobId, tenantId);
    return this.bhaRepo.findByJobId(jobId);
  }

  async getJobTicket(jobId: string, tenantId: string) {
    // Verify job exists
    await this.getJobById(jobId, tenantId);
    return this.ticketsRepo.findByJobId(jobId);
  }

  async generateJobTicketPDF(
    jobId: string,
    tenantId: string,
    options?: {
      includeSignatures?: boolean;
      includeBranding?: boolean;
      watermark?: string;
    }
  ): Promise<Buffer> {
    // Verify job exists
    await this.getJobById(jobId, tenantId);
    return this.ticketGenerator.generateJobTicket(jobId, tenantId, options);
  }

  async getJobAlarms(jobId: string, tenantId: string) {
    // Verify job exists
    await this.getJobById(jobId, tenantId);
    return this.alarmsRepo.findByJobId(jobId);
  }

  async getJobRealtimeData(jobId: string, tenantId: string, startTime?: Date, endTime?: Date) {
    // Verify job exists
    await this.getJobById(jobId, tenantId);
    return this.realtimeDataRepo.findByJobId(jobId, startTime, endTime);
  }

  async getLatestRealtimeData(jobId: string, tenantId: string) {
    // Verify job exists
    await this.getJobById(jobId, tenantId);
    return this.realtimeDataRepo.findLatestByJobId(jobId);
  }

  // ============================================================================
  // ALARMS
  // ============================================================================

  async acknowledgeAlarm(id: string, tenantId: string, userId: string) {
    const alarm = await this.alarmsRepo.findById(id);
    if (!alarm) {
      throw new Error(`Alarm with ID ${id} not found`);
    }

    if (alarm.tenantId !== tenantId) {
      throw new Error(`Alarm does not belong to tenant`);
    }

    if (alarm.status !== 'ACTIVE') {
      throw new Error(`Alarm is not active (current status: ${alarm.status})`);
    }

    return this.alarmsRepo.acknowledge(id, userId);
  }

  async resolveAlarm(id: string, tenantId: string) {
    const alarm = await this.alarmsRepo.findById(id);
    if (!alarm) {
      throw new Error(`Alarm with ID ${id} not found`);
    }

    if (alarm.tenantId !== tenantId) {
      throw new Error(`Alarm does not belong to tenant`);
    }

    if (alarm.status === 'RESOLVED') {
      throw new Error(`Alarm is already resolved`);
    }

    return this.alarmsRepo.resolve(id);
  }
}
