import { CtAlarmsRepository, CtReelsRepository, CtReelSectionsRepository } from './coiled-tubing.repository';
import type { CtAlarm } from '../../common/database/schema';

/**
 * Servicio de gestión de alarmas para Coiled Tubing
 * 
 * Genera alarmas automáticas basadas en:
 * - Niveles de fatiga (WARNING >70%, CRITICAL >90%)
 * - Parámetros operacionales fuera de rango
 * - Condiciones de riesgo detectadas
 */
export class AlarmService {
  private alarmsRepo: CtAlarmsRepository;
  private reelsRepo: CtReelsRepository;
  private sectionsRepo: CtReelSectionsRepository;

  // Umbrales de fatiga
  private readonly FATIGUE_WARNING_THRESHOLD = 70;
  private readonly FATIGUE_CRITICAL_THRESHOLD = 90;

  constructor() {
    this.alarmsRepo = new CtAlarmsRepository();
    this.reelsRepo = new CtReelsRepository();
    this.sectionsRepo = new CtReelSectionsRepository();
  }

  /**
   * Crea una alarma de fatiga para un reel
   */
  async createFatigueAlarm(
    tenantId: string,
    reelId: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    data: {
      fatiguePercentage: number;
      sectionNumber?: number;
      message: string;
      jobId?: string;
    }
  ): Promise<CtAlarm> {
    return this.alarmsRepo.create({
      tenantId,
      reelId,
      jobId: data.jobId,
      alarmType: 'FATIGUE_LIMIT',
      severity,
      message: data.message,
      value: data.fatiguePercentage.toString(),
      threshold: severity === 'CRITICAL' 
        ? this.FATIGUE_CRITICAL_THRESHOLD.toString() 
        : this.FATIGUE_WARNING_THRESHOLD.toString(),
      status: 'ACTIVE',
      triggeredAt: new Date(),
    });
  }

  /**
   * Crea una alarma operacional
   */
  async createOperationalAlarm(
    tenantId: string,
    jobId: string,
    alarmType: 'PRESSURE_HIGH' | 'SPEED_HIGH' | 'DEPTH_LIMIT' | 'LOCKUP_RISK' | 'EQUIPMENT_FAULT',
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    data: {
      message: string;
      value: number;
      threshold: number;
      unitId?: string;
      reelId?: string;
    }
  ): Promise<CtAlarm> {
    return this.alarmsRepo.create({
      tenantId,
      jobId,
      unitId: data.unitId,
      reelId: data.reelId,
      alarmType,
      severity,
      message: data.message,
      value: data.value.toString(),
      threshold: data.threshold.toString(),
      status: 'ACTIVE',
      triggeredAt: new Date(),
    });
  }

  /**
   * Verifica y genera alarmas de fatiga para un reel
   */
  async checkReelFatigue(reelId: string, tenantId: string): Promise<CtAlarm[]> {
    const reel = await this.reelsRepo.findById(reelId, tenantId);
    if (!reel) {
      throw new Error(`Reel ${reelId} not found`);
    }

    const sections = await this.sectionsRepo.findByReelId(reelId);
    const alarms: CtAlarm[] = [];

    // Verificar fatiga promedio del reel
    const avgFatigue = parseFloat(reel.fatiguePercentage || '0');
    
    if (avgFatigue >= this.FATIGUE_CRITICAL_THRESHOLD) {
      // Verificar si ya existe una alarma activa
      const existingAlarm = await this.alarmsRepo.findActiveByReelAndType(
        reelId,
        'FATIGUE_LIMIT',
        'CRITICAL'
      );

      if (!existingAlarm) {
        const alarm = await this.createFatigueAlarm(tenantId, reelId, 'CRITICAL', {
          fatiguePercentage: avgFatigue,
          message: `CRITICAL: Reel ${reel.reelNumber} has reached ${avgFatigue.toFixed(1)}% fatigue. Immediate cutting required.`,
        });
        alarms.push(alarm);
      }
    } else if (avgFatigue >= this.FATIGUE_WARNING_THRESHOLD) {
      const existingAlarm = await this.alarmsRepo.findActiveByReelAndType(
        reelId,
        'FATIGUE_LIMIT',
        'HIGH'
      );

      if (!existingAlarm) {
        const alarm = await this.createFatigueAlarm(tenantId, reelId, 'HIGH', {
          fatiguePercentage: avgFatigue,
          message: `WARNING: Reel ${reel.reelNumber} has reached ${avgFatigue.toFixed(1)}% fatigue. Plan cutting soon.`,
        });
        alarms.push(alarm);
      }
    }

    // Verificar secciones individuales críticas
    const criticalSections = sections.filter(
      (s) => parseFloat(s.fatiguePercentage || '0') >= this.FATIGUE_CRITICAL_THRESHOLD
    );

    for (const section of criticalSections) {
      const existingAlarm = await this.alarmsRepo.findActiveBySectionAndType(
        section.id,
        'FATIGUE_LIMIT'
      );

      if (!existingAlarm) {
        const fatigue = parseFloat(section.fatiguePercentage || '0');
        const alarm = await this.createFatigueAlarm(tenantId, reelId, 'CRITICAL', {
          fatiguePercentage: fatigue,
          sectionNumber: section.sectionNumber,
          message: `CRITICAL: Section #${section.sectionNumber} (${section.startDepthFt}-${section.endDepthFt} ft) has ${fatigue.toFixed(1)}% fatigue.`,
        });
        alarms.push(alarm);
      }
    }

    return alarms;
  }

  /**
   * Verifica alarmas operacionales durante un job
   */
  async checkOperationalParameters(
    jobId: string,
    tenantId: string,
    params: {
      pressurePsi: number;
      speedFtMin: number;
      depthFt: number;
      weightLbs: number;
      unitId: string;
      reelId: string;
    }
  ): Promise<CtAlarm[]> {
    const alarms: CtAlarm[] = [];

    // Obtener límites del reel
    const reel = await this.reelsRepo.findById(params.reelId, tenantId);
    if (!reel) return alarms;

    // Verificar presión
    const maxPressure = reel.maxPressurePsi || 10000;
    if (params.pressurePsi > maxPressure * 0.95) {
      const severity = params.pressurePsi > maxPressure ? 'CRITICAL' : 'HIGH';
      const alarm = await this.createOperationalAlarm(
        tenantId,
        jobId,
        'PRESSURE_HIGH',
        severity,
        {
          message: `${severity}: Pressure ${params.pressurePsi} PSI exceeds ${severity === 'CRITICAL' ? 'maximum' : '95% of'} limit (${maxPressure} PSI)`,
          value: params.pressurePsi,
          threshold: maxPressure,
          unitId: params.unitId,
          reelId: params.reelId,
        }
      );
      alarms.push(alarm);
    }

    // Verificar velocidad
    const maxSpeed = reel.maxSpeedFtMin || 120;
    if (params.speedFtMin > maxSpeed * 0.95) {
      const severity = params.speedFtMin > maxSpeed ? 'CRITICAL' : 'HIGH';
      const alarm = await this.createOperationalAlarm(
        tenantId,
        jobId,
        'SPEED_HIGH',
        severity,
        {
          message: `${severity}: Speed ${params.speedFtMin} ft/min exceeds ${severity === 'CRITICAL' ? 'maximum' : '95% of'} limit (${maxSpeed} ft/min)`,
          value: params.speedFtMin,
          threshold: maxSpeed,
          unitId: params.unitId,
          reelId: params.reelId,
        }
      );
      alarms.push(alarm);
    }

    // Verificar profundidad vs longitud disponible
    const usableLength = reel.usableLengthFt;
    if (params.depthFt > usableLength * 0.95) {
      const severity = params.depthFt > usableLength ? 'CRITICAL' : 'HIGH';
      const alarm = await this.createOperationalAlarm(
        tenantId,
        jobId,
        'DEPTH_LIMIT',
        severity,
        {
          message: `${severity}: Depth ${params.depthFt} ft approaching reel limit (${usableLength} ft)`,
          value: params.depthFt,
          threshold: usableLength,
          unitId: params.unitId,
          reelId: params.reelId,
        }
      );
      alarms.push(alarm);
    }

    // Verificar riesgo de lockup (peso excesivo)
    const yieldStrength = reel.yieldStrengthPsi;
    const outerDiameter = parseFloat(reel.outerDiameterIn);
    const wallThickness = parseFloat(reel.wallThicknessIn);
    const area = Math.PI * ((outerDiameter / 2) ** 2 - ((outerDiameter - 2 * wallThickness) / 2) ** 2);
    const maxWeight = yieldStrength * area * 0.8; // 80% del yield como límite seguro

    if (params.weightLbs > maxWeight * 0.9) {
      const severity = params.weightLbs > maxWeight ? 'CRITICAL' : 'HIGH';
      const alarm = await this.createOperationalAlarm(
        tenantId,
        jobId,
        'LOCKUP_RISK',
        severity,
        {
          message: `${severity}: Weight ${params.weightLbs.toFixed(0)} lbs indicates lockup risk (limit: ${maxWeight.toFixed(0)} lbs)`,
          value: params.weightLbs,
          threshold: maxWeight,
          unitId: params.unitId,
          reelId: params.reelId,
        }
      );
      alarms.push(alarm);
    }

    return alarms;
  }

  /**
   * Reconoce una alarma
   */
  async acknowledgeAlarm(
    alarmId: string,
    tenantId: string,
    userId: string,
    notes?: string
  ): Promise<CtAlarm> {
    const alarm = await this.alarmsRepo.findById(alarmId);
    if (!alarm) {
      throw new Error(`Alarm ${alarmId} not found`);
    }

    if (alarm.tenantId !== tenantId) {
      throw new Error('Unauthorized access to alarm');
    }

    if (alarm.status !== 'ACTIVE') {
      throw new Error('Alarm is not active');
    }

    return this.alarmsRepo.update(alarmId, {
      status: 'ACKNOWLEDGED',
      acknowledgedBy: userId,
      acknowledgedAt: new Date(),
      notes: notes || alarm.notes,
    });
  }

  /**
   * Resuelve una alarma
   */
  async resolveAlarm(
    alarmId: string,
    tenantId: string,
    resolution: string
  ): Promise<CtAlarm> {
    const alarm = await this.alarmsRepo.findById(alarmId);
    if (!alarm) {
      throw new Error(`Alarm ${alarmId} not found`);
    }

    if (alarm.tenantId !== tenantId) {
      throw new Error('Unauthorized access to alarm');
    }

    if (alarm.status === 'RESOLVED') {
      throw new Error('Alarm already resolved');
    }

    return this.alarmsRepo.update(alarmId, {
      status: 'RESOLVED',
      resolvedAt: new Date(),
      resolution,
    });
  }

  /**
   * Auto-resuelve alarmas cuando las condiciones vuelven a la normalidad
   */
  async autoResolveAlarms(reelId: string, tenantId: string): Promise<number> {
    const reel = await this.reelsRepo.findById(reelId, tenantId);
    if (!reel) return 0;

    const avgFatigue = parseFloat(reel.fatiguePercentage || '0');
    let resolvedCount = 0;

    // Si la fatiga bajó del umbral WARNING, resolver alarmas de fatiga
    if (avgFatigue < this.FATIGUE_WARNING_THRESHOLD) {
      const activeAlarms = await this.alarmsRepo.findActiveByReelAndType(
        reelId,
        'FATIGUE_LIMIT',
        'HIGH'
      );

      for (const alarm of activeAlarms) {
        await this.resolveAlarm(
          alarm.id,
          tenantId,
          `Auto-resolved: Fatigue level returned to normal (${avgFatigue.toFixed(1)}%)`
        );
        resolvedCount++;
      }
    }

    return resolvedCount;
  }

  /**
   * Obtiene alarmas activas para un job
   */
  async getActiveAlarmsForJob(jobId: string, tenantId: string): Promise<CtAlarm[]> {
    return this.alarmsRepo.findActiveByJob(jobId, tenantId);
  }

  /**
   * Obtiene alarmas activas para un reel
   */
  async getActiveAlarmsForReel(reelId: string, tenantId: string): Promise<CtAlarm[]> {
    return this.alarmsRepo.findActiveByReel(reelId, tenantId);
  }

  /**
   * Obtiene estadísticas de alarmas
   */
  async getAlarmStatistics(tenantId: string, timeRangeHours: number = 24): Promise<{
    total: number;
    active: number;
    acknowledged: number;
    resolved: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  }> {
    const startTime = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);
    const alarms = await this.alarmsRepo.findByTenantAndTimeRange(tenantId, startTime);

    const stats = {
      total: alarms.length,
      active: 0,
      acknowledged: 0,
      resolved: 0,
      bySeverity: {} as Record<string, number>,
      byType: {} as Record<string, number>,
    };

    for (const alarm of alarms) {
      // Contar por estado
      if (alarm.status === 'ACTIVE') stats.active++;
      else if (alarm.status === 'ACKNOWLEDGED') stats.acknowledged++;
      else if (alarm.status === 'RESOLVED') stats.resolved++;

      // Contar por severidad
      const severity = alarm.severity || 'UNKNOWN';
      stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;

      // Contar por tipo
      const type = alarm.alarmType || 'UNKNOWN';
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    }

    return stats;
  }

  /**
   * Genera reporte de alarmas críticas
   */
  async getCriticalAlarmsReport(tenantId: string): Promise<{
    criticalAlarms: CtAlarm[];
    affectedReels: number;
    affectedJobs: number;
    recommendations: string[];
  }> {
    const criticalAlarms = await this.alarmsRepo.findActiveBySeverity(tenantId, 'CRITICAL');

    const affectedReels = new Set(criticalAlarms.map((a) => a.reelId).filter(Boolean)).size;
    const affectedJobs = new Set(criticalAlarms.map((a) => a.jobId).filter(Boolean)).size;

    const recommendations: string[] = [];

    // Generar recomendaciones basadas en alarmas
    const fatigueAlarms = criticalAlarms.filter((a) => a.alarmType === 'FATIGUE_LIMIT');
    if (fatigueAlarms.length > 0) {
      recommendations.push(
        `${fatigueAlarms.length} reel(s) have critical fatigue levels. Schedule cutting immediately.`
      );
    }

    const pressureAlarms = criticalAlarms.filter((a) => a.alarmType === 'PRESSURE_HIGH');
    if (pressureAlarms.length > 0) {
      recommendations.push(
        `${pressureAlarms.length} job(s) experiencing high pressure. Reduce pump rate or check for obstructions.`
      );
    }

    const lockupAlarms = criticalAlarms.filter((a) => a.alarmType === 'LOCKUP_RISK');
    if (lockupAlarms.length > 0) {
      recommendations.push(
        `${lockupAlarms.length} job(s) at risk of lockup. Reduce WOB or consider jarring operations.`
      );
    }

    return {
      criticalAlarms,
      affectedReels,
      affectedJobs,
      recommendations,
    };
  }
}
