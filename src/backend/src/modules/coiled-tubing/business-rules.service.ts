import {
  CtUnitsRepository,
  CtReelsRepository,
  CtJobsRepository,
  CtJobBhaRepository,
} from './coiled-tubing.repository';
import type { CtReel, CtJob } from '../../common/database/schema';

/**
 * Servicio de validaciones de reglas de negocio para Coiled Tubing
 * 
 * Implementa validaciones críticas para:
 * - Disponibilidad de equipos
 * - Compatibilidad de BHA con reel
 * - Límites operacionales
 * - Restricciones de seguridad
 */
export class BusinessRulesService {
  private unitsRepo: CtUnitsRepository;
  private reelsRepo: CtReelsRepository;
  private jobsRepo: CtJobsRepository;
  private bhaRepo: CtJobBhaRepository;

  constructor() {
    this.unitsRepo = new CtUnitsRepository();
    this.reelsRepo = new CtReelsRepository();
    this.jobsRepo = new CtJobsRepository();
    this.bhaRepo = new CtJobBhaRepository();
  }

  /**
   * Valida si una unidad CT está disponible para un job en una fecha específica
   */
  async validateUnitAvailability(
    unitId: string,
    tenantId: string,
    startDate: Date,
    endDate: Date,
    excludeJobId?: string
  ): Promise<{ available: boolean; reason?: string; conflictingJobs?: CtJob[] }> {
    const unit = await this.unitsRepo.findById(unitId, tenantId);
    
    if (!unit) {
      return {
        available: false,
        reason: 'CT Unit not found',
      };
    }

    if (unit.status !== 'AVAILABLE' && unit.status !== 'IN_SERVICE') {
      return {
        available: false,
        reason: `CT Unit is ${unit.status}`,
      };
    }

    const conflictingJobs = await this.jobsRepo.findConflictingJobs(
      unitId,
      startDate,
      endDate,
      excludeJobId
    );

    if (conflictingJobs.length > 0) {
      return {
        available: false,
        reason: 'CT Unit is already assigned to another job in this time period',
        conflictingJobs,
      };
    }

    return { available: true };
  }

  /**
   * Valida si un reel está disponible para un job
   */
  async validateReelAvailability(
    reelId: string,
    tenantId: string,
    startDate: Date,
    endDate: Date,
    excludeJobId?: string
  ): Promise<{ available: boolean; reason?: string; conflictingJobs?: CtJob[] }> {
    const reel = await this.reelsRepo.findById(reelId, tenantId);
    
    if (!reel) {
      return {
        available: false,
        reason: 'CT Reel not found',
      };
    }

    if (reel.status !== 'AVAILABLE' && reel.status !== 'IN_USE') {
      return {
        available: false,
        reason: `CT Reel is ${reel.status}`,
      };
    }

    const fatiguePercent = parseFloat(reel.fatiguePercentage || '0');
    if (fatiguePercent >= 95) {
      return {
        available: false,
        reason: `CT Reel has critical fatigue level (${fatiguePercent.toFixed(1)}%). Cutting required before use.`,
      };
    }

    const conflictingJobs = await this.jobsRepo.findConflictingJobsByReel(
      reelId,
      startDate,
      endDate,
      excludeJobId
    );

    if (conflictingJobs.length > 0) {
      return {
        available: false,
        reason: 'CT Reel is already assigned to another job in this time period',
        conflictingJobs,
      };
    }

    return { available: true };
  }

  /**
   * Valida compatibilidad entre BHA y reel
   */
  async validateBhaCompatibility(
    reelId: string,
    bhaComponents: Array<{ toolType: string; outerDiameterIn: number; lengthFt: number }>,
    tenantId: string
  ): Promise<{ compatible: boolean; reason?: string; details?: any }> {
    const reel = await this.reelsRepo.findById(reelId, tenantId);
    
    if (!reel) {
      return {
        compatible: false,
        reason: 'CT Reel not found',
      };
    }

    const reelInnerDiameter = typeof reel.innerDiameterIn === 'string'
      ? parseFloat(reel.innerDiameterIn)
      : 0;
    
    for (const component of bhaComponents) {
      if (component.outerDiameterIn >= reelInnerDiameter) {
        return {
          compatible: false,
          reason: `BHA component ${component.toolType} OD (${component.outerDiameterIn}") is too large for reel ID (${reelInnerDiameter}")`,
          details: {
            componentOD: component.outerDiameterIn,
            reelID: reelInnerDiameter,
            toolType: component.toolType,
          },
        };
      }

      const clearance = reelInnerDiameter - component.outerDiameterIn;
      const minClearance = 0.125;
      
      if (clearance < minClearance) {
        return {
          compatible: false,
          reason: `BHA component ${component.toolType} has insufficient clearance (${clearance.toFixed(3)}" < ${minClearance}")`,
          details: {
            clearance,
            minClearance,
            toolType: component.toolType,
          },
        };
      }
    }

    const totalBhaLength = bhaComponents.reduce((sum, c) => sum + c.lengthFt, 0);
    const usableLength = reel.usableLengthFt || 0;
    
    if (totalBhaLength > usableLength) {
      return {
        compatible: false,
        reason: `BHA total length (${totalBhaLength} ft) exceeds reel usable length (${usableLength} ft)`,
        details: {
          bhaLength: totalBhaLength,
          reelLength: usableLength,
        },
      };
    }

    return { compatible: true };
  }

  /**
   * Valida límites operacionales para un job
   */
  async validateOperationalLimits(
    jobData: {
      ctUnitId: string;
      ctReelId: string;
      targetDepthFt: number;
      maxPressurePsi?: number;
      maxSpeedFpm?: number;
      maxWeightLbs?: number;
    },
    tenantId: string
  ): Promise<{ valid: boolean; violations: string[] }> {
    const violations: string[] = [];

    const unit = await this.unitsRepo.findById(jobData.ctUnitId, tenantId);
    if (!unit) {
      violations.push('CT Unit not found');
      return { valid: false, violations };
    }

    const reel = await this.reelsRepo.findById(jobData.ctReelId, tenantId);
    if (!reel) {
      violations.push('CT Reel not found');
      return { valid: false, violations };
    }

    const reelUsableLength = parseFloat(reel.usableLengthFt?.toString() || '0');
    if (jobData.targetDepthFt > reelUsableLength) {
      violations.push(
        `Target depth (${jobData.targetDepthFt} ft) exceeds reel usable length (${reelUsableLength} ft)`
      );
    }

    const unitMaxPressure = unit.maxPressurePsi || 0;
    if (jobData.maxPressurePsi && jobData.maxPressurePsi > unitMaxPressure) {
      violations.push(
        `Max pressure (${jobData.maxPressurePsi} psi) exceeds unit capacity (${unitMaxPressure} psi)`
      );
    }

    const reelYieldStrength = reel.yieldStrengthPsi || 0;
    const estimatedMaxPressure = reelYieldStrength * 0.5;
    if (jobData.maxPressurePsi && jobData.maxPressurePsi > estimatedMaxPressure) {
      violations.push(
        `Max pressure (${jobData.maxPressurePsi} psi) may exceed reel safe limit (estimated ${estimatedMaxPressure.toFixed(0)} psi based on yield strength)`
      );
    }

    const unitMaxSpeed = unit.maxSpeedFtMin || 0;
    if (jobData.maxSpeedFpm && jobData.maxSpeedFpm > unitMaxSpeed) {
      violations.push(
        `Max speed (${jobData.maxSpeedFpm} ft/min) exceeds unit capacity (${unitMaxSpeed} ft/min)`
      );
    }

    const maxAllowableWeight = this.calculateMaxAllowableWeight(reel);
    
    if (jobData.maxWeightLbs && jobData.maxWeightLbs > maxAllowableWeight) {
      violations.push(
        `Max weight (${jobData.maxWeightLbs} lbs) exceeds calculated limit (${maxAllowableWeight.toFixed(0)} lbs) based on reel yield strength`
      );
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }

  /**
   * Calcula el peso máximo permitido para un reel basado en su resistencia
   */
  private calculateMaxAllowableWeight(reel: CtReel): number {
    const outerDiameter = typeof reel.outerDiameterIn === 'string' 
      ? parseFloat(reel.outerDiameterIn) 
      : 0;
    const innerDiameter = typeof reel.innerDiameterIn === 'string'
      ? parseFloat(reel.innerDiameterIn)
      : 0;
    const yieldStrength = reel.yieldStrengthPsi || 0;

    const area = Math.PI * (Math.pow(outerDiameter / 2, 2) - Math.pow(innerDiameter / 2, 2));
    
    const safetyFactor = 0.8;
    const maxWeight = area * yieldStrength * safetyFactor;

    return maxWeight;
  }

  /**
   * Valida que un job puede ser iniciado (pre-job checklist)
   */
  async validateJobCanStart(
    jobId: string,
    tenantId: string
  ): Promise<{ canStart: boolean; issues: string[] }> {
    const issues: string[] = [];

    const job = await this.jobsRepo.findById(jobId, tenantId);
    if (!job) {
      issues.push('Job not found');
      return { canStart: false, issues };
    }

    if (job.status !== 'PLANNED') {
      issues.push(`Job status is ${job.status}, expected PLANNED`);
    }

    if (!job.ctUnitId) {
      issues.push('No CT Unit assigned');
    }

    if (!job.ctReelId) {
      issues.push('No CT Reel assigned');
    }

    if (!job.wellId) {
      issues.push('No Well assigned');
    }

    if (job.ctUnitId) {
      const unit = await this.unitsRepo.findById(job.ctUnitId, tenantId);
      if (!unit) {
        issues.push('Assigned CT Unit not found');
      } else if (unit.status !== 'AVAILABLE' && unit.status !== 'IN_SERVICE') {
        issues.push(`CT Unit status is ${unit.status}`);
      }
    }

    if (job.ctReelId) {
      const reel = await this.reelsRepo.findById(job.ctReelId, tenantId);
      if (!reel) {
        issues.push('Assigned CT Reel not found');
      } else if (reel.status !== 'AVAILABLE' && reel.status !== 'IN_USE') {
        issues.push(`CT Reel status is ${reel.status}`);
      } else {
        const fatiguePercent = parseFloat(reel.fatiguePercentage || '0');
        if (fatiguePercent >= 95) {
          issues.push(`CT Reel has critical fatigue (${fatiguePercent.toFixed(1)}%)`);
        }
      }
    }

    const bhaConfig = await this.bhaRepo.findByJobId(jobId);
    if (!bhaConfig) {
      issues.push('No BHA configuration found');
    }

    return {
      canStart: issues.length === 0,
      issues,
    };
  }

  /**
   * Valida que un job puede ser completado
   */
  async validateJobCanComplete(
    jobId: string,
    tenantId: string
  ): Promise<{ canComplete: boolean; issues: string[] }> {
    const issues: string[] = [];

    const job = await this.jobsRepo.findById(jobId, tenantId);
    if (!job) {
      issues.push('Job not found');
      return { canComplete: false, issues };
    }

    if (job.status !== 'IN_PROGRESS') {
      issues.push(`Job status is ${job.status}, expected IN_PROGRESS`);
    }

    if (!job.actualStartDate) {
      issues.push('Job has no actual start date');
    }

    return {
      canComplete: issues.length === 0,
      issues,
    };
  }

  /**
   * Valida si un reel necesita corte urgente
   */
  async validateReelCuttingRequired(
    reelId: string,
    tenantId: string
  ): Promise<{ required: boolean; reason?: string; recommendedCutLengthFt?: number }> {
    const reel = await this.reelsRepo.findById(reelId, tenantId);
    
    if (!reel) {
      return {
        required: false,
        reason: 'Reel not found',
      };
    }

    const fatiguePercent = parseFloat(reel.fatiguePercentage || '0');
    
    if (fatiguePercent >= 90) {
      return {
        required: true,
        reason: `Critical fatigue level: ${fatiguePercent.toFixed(1)}%`,
        recommendedCutLengthFt: 500,
      };
    }

    if (fatiguePercent >= 75) {
      return {
        required: false,
        reason: `High fatigue level: ${fatiguePercent.toFixed(1)}%. Plan cutting soon.`,
        recommendedCutLengthFt: 300,
      };
    }

    return { required: false };
  }

  /**
   * Valida límites de fatiga antes de asignar un reel a un job
   */
  async validateFatigueLimitsForJob(
    reelId: string,
    estimatedCycles: number,
    tenantId: string
  ): Promise<{ acceptable: boolean; reason?: string; projectedFatigue?: number }> {
    const reel = await this.reelsRepo.findById(reelId, tenantId);
    
    if (!reel) {
      return {
        acceptable: false,
        reason: 'Reel not found',
      };
    }

    const currentFatigue = parseFloat(reel.fatiguePercentage || '0');
    
    const fatiguePerCycle = 0.05;
    const projectedFatigue = currentFatigue + (estimatedCycles * fatiguePerCycle);

    if (projectedFatigue >= 95) {
      return {
        acceptable: false,
        reason: `Projected fatigue (${projectedFatigue.toFixed(1)}%) would exceed critical limit after job`,
        projectedFatigue,
      };
    }

    if (projectedFatigue >= 85) {
      return {
        acceptable: true,
        reason: `Warning: Projected fatigue (${projectedFatigue.toFixed(1)}%) is high. Plan cutting after this job.`,
        projectedFatigue,
      };
    }

    return {
      acceptable: true,
      projectedFatigue,
    };
  }
}
