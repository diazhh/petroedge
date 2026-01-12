import { CtReelsRepository, CtReelSectionsRepository, CtFatigueCyclesRepository } from './coiled-tubing.repository';
import type { CtReelSection, CtFatigueCycle } from '../../common/database/schema';

/**
 * Servicio de cálculo de fatiga para Coiled Tubing
 * 
 * Implementa modelos de fatiga según:
 * - API RP 5C7: Recommended Practice for Coiled Tubing Operations
 * - Goodman Diagram para fatiga combinada
 * - S-N Curves (Stress-Number of cycles)
 */
export class FatigueCalculationService {
  private reelsRepo: CtReelsRepository;
  private sectionsRepo: CtReelSectionsRepository;
  private fatigueCyclesRepo: CtFatigueCyclesRepository;

  constructor() {
    this.reelsRepo = new CtReelsRepository();
    this.sectionsRepo = new CtReelSectionsRepository();
    this.fatigueCyclesRepo = new CtFatigueCyclesRepository();
  }

  /**
   * Calcula la fatiga por flexión (bending) cuando el CT pasa por el arco de guía
   * 
   * @param outerDiameterIn - Diámetro exterior en pulgadas
   * @param wallThicknessIn - Espesor de pared en pulgadas
   * @param radiusFt - Radio de curvatura en pies (típicamente radio del arco de guía)
   * @param yieldStrengthPsi - Resistencia a la fluencia en PSI
   * @returns Porcentaje de fatiga consumida en este ciclo
   */
  calculateBendingFatigue(
    outerDiameterIn: number,
    wallThicknessIn: number,
    radiusFt: number,
    yieldStrengthPsi: number
  ): number {
    // Convertir radio a pulgadas
    const radiusIn = radiusFt * 12;

    // Calcular esfuerzo de flexión (bending stress)
    // σ_bending = E * (OD / 2) / R
    // donde E = módulo de Young del acero (30,000,000 PSI)
    const E = 30_000_000; // PSI
    const bendingStress = (E * (outerDiameterIn / 2)) / radiusIn;

    // Calcular relación de esfuerzo
    const stressRatio = bendingStress / yieldStrengthPsi;

    // Usar curva S-N simplificada para acero CT
    // N = K / (σ^m) donde K y m son constantes del material
    // Para CT80: K ≈ 1e15, m ≈ 3
    const K = 1e15;
    const m = 3;
    const cyclesToFailure = K / Math.pow(bendingStress, m);

    // Fatiga consumida = 1 / N (regla de Miner)
    const fatigueConsumed = (1 / cyclesToFailure) * 100;

    // Limitar a valores razonables (0-100%)
    return Math.min(Math.max(fatigueConsumed, 0), 100);
  }

  /**
   * Calcula la fatiga por presión interna
   * 
   * @param outerDiameterIn - Diámetro exterior en pulgadas
   * @param wallThicknessIn - Espesor de pared en pulgadas
   * @param pressurePsi - Presión interna en PSI
   * @param yieldStrengthPsi - Resistencia a la fluencia en PSI
   * @returns Porcentaje de fatiga consumida
   */
  calculatePressureFatigue(
    outerDiameterIn: number,
    wallThicknessIn: number,
    pressurePsi: number,
    yieldStrengthPsi: number
  ): number {
    // Calcular diámetro interior
    const innerDiameterIn = outerDiameterIn - 2 * wallThicknessIn;

    // Esfuerzo circunferencial (hoop stress) según Barlow's formula
    // σ_hoop = (P * D_inner) / (2 * t)
    const hoopStress = (pressurePsi * innerDiameterIn) / (2 * wallThicknessIn);

    // Relación de esfuerzo
    const stressRatio = hoopStress / yieldStrengthPsi;

    // Si el esfuerzo excede el yield, retornar 100% de fatiga
    if (stressRatio >= 1.0) {
      return 100;
    }

    // Usar curva S-N para presión cíclica
    // Para presión, el factor de seguridad es mayor
    const K = 5e14;
    const m = 2.5;
    const cyclesToFailure = K / Math.pow(hoopStress, m);

    const fatigueConsumed = (1 / cyclesToFailure) * 100;

    return Math.min(Math.max(fatigueConsumed, 0), 100);
  }

  /**
   * Calcula la fatiga combinada usando el diagrama de Goodman modificado
   * 
   * @param bendingFatigue - Fatiga por flexión (%)
   * @param pressureFatigue - Fatiga por presión (%)
   * @returns Fatiga combinada (%)
   */
  calculateCombinedFatigue(bendingFatigue: number, pressureFatigue: number): number {
    // Usar regla de Miner para fatiga combinada
    // D_total = D_bending + D_pressure
    const combinedFatigue = bendingFatigue + pressureFatigue;

    // Aplicar factor de interacción (típicamente 1.2 para efectos combinados)
    const interactionFactor = 1.2;
    const adjustedFatigue = combinedFatigue * interactionFactor;

    return Math.min(adjustedFatigue, 100);
  }

  /**
   * Registra un ciclo de fatiga para una sección específica
   */
  async recordFatigueCycle(
    reelId: string,
    sectionId: string,
    cycleData: {
      cycleType: 'BENDING' | 'PRESSURE' | 'COMBINED';
      bendingRadiusFt?: number;
      pressurePsi?: number;
      depthFt: number;
      fatigueIncrement: number;
    }
  ): Promise<CtFatigueCycle> {
    return this.fatigueCyclesRepo.create({
      reelId,
      sectionId,
      cycleType: cycleData.cycleType,
      guideRadiusIn: cycleData.bendingRadiusFt ? (cycleData.bendingRadiusFt * 12).toString() : undefined,
      maxPressurePsi: cycleData.pressurePsi,
      cyclesApplied: 1,
      damageRatio: (cycleData.fatigueIncrement / 100).toString(),
      occurredAt: new Date(),
    });
  }

  /**
   * Actualiza la fatiga de una sección después de un ciclo
   */
  async updateSectionFatigue(
    sectionId: string,
    fatigueIncrement: number
  ): Promise<CtReelSection> {
    const section = await this.sectionsRepo.findById(sectionId);
    if (!section) {
      throw new Error(`Section ${sectionId} not found`);
    }

    const currentFatigue = parseFloat(section.fatiguePercentage || '0');
    const newFatigue = Math.min(currentFatigue + fatigueIncrement, 100);

    // Determinar nuevo estado basado en fatiga
    let newStatus: 'ACTIVE' | 'WARNING' | 'CRITICAL' | 'CUT' = 'ACTIVE';
    if (newFatigue >= 90) {
      newStatus = 'CRITICAL';
    } else if (newFatigue >= 70) {
      newStatus = 'WARNING';
    }

    return this.sectionsRepo.update(sectionId, {
      fatiguePercentage: newFatigue.toString(),
      status: newStatus,
      lastUpdated: new Date(),
    });
  }

  /**
   * Procesa un job completo y actualiza la fatiga de todas las secciones afectadas
   * 
   * @param reelId - ID del carrete usado en el job
   * @param tenantId - ID del tenant
   * @param jobData - Datos del job (profundidad, presión, etc.)
   */
  async processJobFatigue(
    reelId: string,
    tenantId: string,
    jobData: {
      maxDepthFt: number;
      maxPressurePsi: number;
      totalCycles: number;
      guideArchRadiusFt: number;
    }
  ): Promise<void> {
    // Obtener el reel
    const reel = await this.reelsRepo.findById(reelId, tenantId);
    if (!reel) {
      throw new Error(`Reel ${reelId} not found`);
    }

    // Obtener todas las secciones del reel
    const sections = await this.sectionsRepo.findByReelId(reelId);

    // Calcular fatiga por flexión (todas las secciones pasan por el arco)
    const bendingFatigue = this.calculateBendingFatigue(
      parseFloat(reel.outerDiameterIn),
      parseFloat(reel.wallThicknessIn),
      jobData.guideArchRadiusFt,
      reel.yieldStrengthPsi
    );

    // Calcular fatiga por presión
    const pressureFatigue = this.calculatePressureFatigue(
      parseFloat(reel.outerDiameterIn),
      parseFloat(reel.wallThicknessIn),
      jobData.maxPressurePsi,
      reel.yieldStrengthPsi
    );

    // Fatiga combinada por ciclo
    const fatiguePerCycle = this.calculateCombinedFatigue(bendingFatigue, pressureFatigue);

    // Actualizar cada sección
    for (const section of sections) {
      // Las secciones que fueron desplegadas sufren más fatiga
      const sectionDepth = section.endDepthFt;
      const wasDeployed = sectionDepth <= jobData.maxDepthFt;

      if (wasDeployed) {
        // Fatiga total = fatiga_por_ciclo * número_de_ciclos
        const totalFatigue = fatiguePerCycle * jobData.totalCycles;

        // Registrar ciclo de fatiga
        await this.recordFatigueCycle(reelId, section.id, {
          cycleType: 'COMBINED',
          bendingRadiusFt: jobData.guideArchRadiusFt,
          pressurePsi: jobData.maxPressurePsi,
          depthFt: sectionDepth,
          fatigueIncrement: totalFatigue,
        });

        // Actualizar fatiga de la sección
        await this.updateSectionFatigue(section.id, totalFatigue);
      }
    }

    // Actualizar fatiga promedio del reel
    const updatedSections = await this.sectionsRepo.findByReelId(reelId);
    const avgFatigue =
      updatedSections.reduce((sum, s) => sum + parseFloat(s.fatiguePercentage || '0'), 0) /
      updatedSections.length;

    // Determinar condición del reel
    let condition: 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL' = 'GOOD';
    if (avgFatigue >= 80) {
      condition = 'CRITICAL';
    } else if (avgFatigue >= 60) {
      condition = 'POOR';
    } else if (avgFatigue >= 40) {
      condition = 'FAIR';
    }

    await this.reelsRepo.update(reelId, tenantId, {
      fatiguePercentage: avgFatigue.toString(),
      condition,
    });
  }

  /**
   * Obtiene recomendación de corte para un reel basado en fatiga
   */
  async getCutRecommendation(
    reelId: string
  ): Promise<{
    shouldCut: boolean;
    cutLengthFt: number;
    reason: string;
    criticalSections: Array<{ sectionNumber: number; fatiguePercentage: number }>;
  }> {
    const sections = await this.sectionsRepo.findByReelId(reelId);

    // Identificar secciones críticas (>90% fatiga)
    const criticalSections = sections
      .filter((s) => parseFloat(s.fatiguePercentage || '0') >= 90)
      .map((s) => ({
        sectionNumber: s.sectionNumber,
        fatiguePercentage: parseFloat(s.fatiguePercentage || '0'),
      }))
      .sort((a, b) => a.sectionNumber - b.sectionNumber);

    if (criticalSections.length === 0) {
      return {
        shouldCut: false,
        cutLengthFt: 0,
        reason: 'No critical sections detected',
        criticalSections: [],
      };
    }

    // Calcular longitud a cortar (hasta la última sección crítica + margen de seguridad)
    const lastCriticalSection = sections.find(
      (s) => s.sectionNumber === criticalSections[criticalSections.length - 1].sectionNumber
    );

    if (!lastCriticalSection) {
      return {
        shouldCut: false,
        cutLengthFt: 0,
        reason: 'Error finding critical section',
        criticalSections,
      };
    }

    // Agregar 500 ft de margen de seguridad
    const cutLengthFt = lastCriticalSection.endDepthFt + 500;

    return {
      shouldCut: true,
      cutLengthFt,
      reason: `${criticalSections.length} section(s) exceeded 90% fatigue limit`,
      criticalSections,
    };
  }

  /**
   * Simula el impacto de un job en la fatiga del reel (sin guardar cambios)
   */
  async simulateJobFatigue(
    reelId: string,
    jobData: {
      maxDepthFt: number;
      maxPressurePsi: number;
      totalCycles: number;
      guideArchRadiusFt: number;
    }
  ): Promise<{
    currentAvgFatigue: number;
    projectedAvgFatigue: number;
    fatigueIncrease: number;
    sectionsAtRisk: number;
    recommendation: string;
  }> {
    const reel = await this.reelsRepo.findById(reelId, '');
    if (!reel) {
      throw new Error(`Reel ${reelId} not found`);
    }

    const sections = await this.sectionsRepo.findByReelId(reelId);

    // Calcular fatiga actual
    const currentAvgFatigue =
      sections.reduce((sum, s) => sum + parseFloat(s.fatiguePercentage || '0'), 0) / sections.length;

    // Calcular fatiga incremental
    const bendingFatigue = this.calculateBendingFatigue(
      parseFloat(reel.outerDiameterIn),
      parseFloat(reel.wallThicknessIn),
      jobData.guideArchRadiusFt,
      reel.yieldStrengthPsi
    );

    const pressureFatigue = this.calculatePressureFatigue(
      parseFloat(reel.outerDiameterIn),
      parseFloat(reel.wallThicknessIn),
      jobData.maxPressurePsi,
      reel.yieldStrengthPsi
    );

    const fatiguePerCycle = this.calculateCombinedFatigue(bendingFatigue, pressureFatigue);
    const totalFatigueIncrease = fatiguePerCycle * jobData.totalCycles;

    // Proyectar fatiga después del job
    const projectedAvgFatigue = currentAvgFatigue + totalFatigueIncrease;

    // Contar secciones que estarán en riesgo (>70%)
    const sectionsAtRisk = sections.filter((s) => {
      const currentFatigue = parseFloat(s.fatiguePercentage || '0');
      const projectedFatigue = currentFatigue + totalFatigueIncrease;
      return projectedFatigue >= 70;
    }).length;

    // Generar recomendación
    let recommendation = 'Job can proceed safely';
    if (projectedAvgFatigue >= 90) {
      recommendation = 'CRITICAL: Reel should be cut before this job';
    } else if (projectedAvgFatigue >= 70) {
      recommendation = 'WARNING: Consider cutting reel after this job';
    } else if (sectionsAtRisk > 0) {
      recommendation = `CAUTION: ${sectionsAtRisk} section(s) will exceed 70% fatigue`;
    }

    return {
      currentAvgFatigue,
      projectedAvgFatigue,
      fatigueIncrease: totalFatigueIncrease,
      sectionsAtRisk,
      recommendation,
    };
  }
}
