/**
 * MSE (Mechanical Specific Energy) Calculator Service
 * 
 * Calcula la energía mecánica específica durante perforación.
 * MSE es un indicador clave de eficiencia de perforación.
 * 
 * Referencias:
 * - Teale, R. (1965): "The Concept of Specific Energy in Rock Drilling"
 * - SPE 92576: "MSE - The Gauge for Drilling Performance"
 */

export interface DrillingParams {
  rpmSurface: number;           // Rotary speed at surface (RPM)
  torqueSurfaceFtLbs: number;   // Surface torque (ft-lbs)
  wobLbs: number;               // Weight on Bit (lbs)
  ropFtHr: number;              // Rate of Penetration (ft/hr)
  bitDiameterInch: number;      // Bit diameter (inches)
  mudWeightPpg?: number;        // Mud weight (ppg) - for confined strength
  differentialPressurePsi?: number; // Differential pressure (psi)
}

export interface MSEResult {
  msePsi: number;               // MSE in psi
  rotationalComponentPsi: number;
  axialComponentPsi: number;
  efficiency: number;           // 0-1 (1 = perfect efficiency)
  interpretation: string;
  recommendations: string[];
  isEfficient: boolean;
}

export interface MSETrend {
  timestamps: Date[];
  msePsi: number[];
  ropFtHr: number[];
  wobLbs: number[];
  rpmSurface: number[];
  avgMse: number;
  trendSlope: number;           // Positive = deteriorating, Negative = improving
}

export class MSECalculatorService {
  // Thresholds típicos para interpretación
  private readonly MSE_EXCELLENT = 20000;      // psi
  private readonly MSE_GOOD = 50000;           // psi
  private readonly MSE_ACCEPTABLE = 100000;    // psi
  private readonly MSE_POOR = 150000;          // psi

  /**
   * Calcula MSE usando la fórmula de Teale
   * 
   * MSE = (480 × RPM × Torque) / (D² × ROP) + (4 × WOB) / (π × D²)
   * 
   * Donde:
   * - MSE: Mechanical Specific Energy (psi)
   * - RPM: Revoluciones por minuto
   * - Torque: Torque en superficie (ft-lbs)
   * - D: Diámetro del bit (in)
   * - ROP: Rate of Penetration (ft/hr)
   * - WOB: Weight on Bit (lbs)
   * 
   * @param params - Parámetros de perforación
   * @returns Resultado de MSE con interpretación
   */
  calculateMSE(params: DrillingParams): MSEResult {
    this.validateParams(params);

    const { rpmSurface, torqueSurfaceFtLbs, wobLbs, ropFtHr, bitDiameterInch } = params;

    // Evitar división por cero
    if (ropFtHr <= 0) {
      throw new Error('ROP debe ser mayor que 0');
    }

    // Componente rotacional (energía de torque)
    const rotationalComponent = 
      (480 * rpmSurface * torqueSurfaceFtLbs) / 
      (bitDiameterInch ** 2 * ropFtHr);

    // Componente axial (energía de WOB)
    const bitAreaSqIn = Math.PI * (bitDiameterInch ** 2) / 4;
    const axialComponent = wobLbs / bitAreaSqIn;

    // MSE total
    const msePsi = rotationalComponent + axialComponent;

    // Calcular eficiencia (comparado con resistencia de roca teórica)
    const efficiency = this.calculateEfficiency(msePsi, params);

    // Interpretación
    const interpretation = this.interpretMSE(msePsi);
    const recommendations = this.generateRecommendations(params, msePsi);

    return {
      msePsi,
      rotationalComponentPsi: rotationalComponent,
      axialComponentPsi: axialComponent,
      efficiency,
      interpretation,
      recommendations,
      isEfficient: msePsi < this.MSE_GOOD
    };
  }

  /**
   * Calcula MSE para múltiples puntos en el tiempo (trending)
   */
  calculateMSETrend(dataPoints: Array<DrillingParams & { timestamp: Date }>): MSETrend {
    const timestamps: Date[] = [];
    const msePsi: number[] = [];
    const ropFtHr: number[] = [];
    const wobLbs: number[] = [];
    const rpmSurface: number[] = [];

    for (const point of dataPoints) {
      try {
        const result = this.calculateMSE(point);
        timestamps.push(point.timestamp);
        msePsi.push(result.msePsi);
        ropFtHr.push(point.ropFtHr);
        wobLbs.push(point.wobLbs);
        rpmSurface.push(point.rpmSurface);
      } catch (error) {
        // Skip invalid points
        continue;
      }
    }

    const avgMse = msePsi.reduce((sum, val) => sum + val, 0) / msePsi.length;
    const trendSlope = this.calculateTrendSlope(msePsi);

    return {
      timestamps,
      msePsi,
      ropFtHr,
      wobLbs,
      rpmSurface,
      avgMse,
      trendSlope
    };
  }

  /**
   * Calcula eficiencia de perforación
   * 
   * Eficiencia = UCS / MSE
   * 
   * Donde UCS (Unconfined Compressive Strength) es la resistencia de la roca
   */
  private calculateEfficiency(msePsi: number, params: DrillingParams): number {
    // Estimar UCS basado en tipo de roca (simplificado)
    // En producción, esto vendría de logs o datos de laboratorio
    const estimatedUCS = this.estimateRockStrength(params);
    
    const efficiency = Math.min(estimatedUCS / msePsi, 1.0);
    return Math.max(efficiency, 0);
  }

  /**
   * Estima resistencia de roca basado en parámetros disponibles
   */
  private estimateRockStrength(params: DrillingParams): number {
    // Valores típicos de UCS (psi):
    // - Shale suave: 5,000 - 10,000
    // - Sandstone: 10,000 - 20,000
    // - Limestone: 15,000 - 30,000
    // - Dolomite: 20,000 - 40,000
    // - Granite: 30,000 - 50,000

    // Estimación simplificada basada en WOB y ROP
    // En producción real, usar datos de offset wells o logs
    const baseStrength = 15000; // psi (sandstone típico)

    // Ajustar por presión diferencial si está disponible
    if (params.differentialPressurePsi) {
      // Roca más fuerte bajo confinamiento
      return baseStrength + params.differentialPressurePsi * 0.5;
    }

    return baseStrength;
  }

  /**
   * Interpreta el valor de MSE
   */
  private interpretMSE(msePsi: number): string {
    if (msePsi < this.MSE_EXCELLENT) {
      return 'Excelente - Perforación muy eficiente';
    } else if (msePsi < this.MSE_GOOD) {
      return 'Bueno - Perforación eficiente';
    } else if (msePsi < this.MSE_ACCEPTABLE) {
      return 'Aceptable - Perforación normal';
    } else if (msePsi < this.MSE_POOR) {
      return 'Pobre - Revisar parámetros de perforación';
    } else {
      return 'Muy pobre - Problemas significativos de perforación';
    }
  }

  /**
   * Genera recomendaciones basadas en MSE y parámetros
   */
  private generateRecommendations(params: DrillingParams, msePsi: number): string[] {
    const recommendations: string[] = [];

    if (msePsi > this.MSE_ACCEPTABLE) {
      // MSE alto - identificar causa raíz

      // Verificar ROP
      if (params.ropFtHr < 30) {
        recommendations.push('ROP bajo - Considerar aumentar WOB o RPM');
      }

      // Verificar WOB
      const bitAreaSqIn = Math.PI * (params.bitDiameterInch ** 2) / 4;
      const wobPerSqIn = params.wobLbs / bitAreaSqIn;
      if (wobPerSqIn < 1000) {
        recommendations.push('WOB bajo - Aumentar peso en bit gradualmente');
      } else if (wobPerSqIn > 4000) {
        recommendations.push('WOB excesivo - Reducir para evitar daño al bit');
      }

      // Verificar RPM
      if (params.rpmSurface < 60) {
        recommendations.push('RPM bajo - Considerar aumentar velocidad de rotación');
      } else if (params.rpmSurface > 180) {
        recommendations.push('RPM alto - Reducir para evitar vibración excesiva');
      }

      // Verificar torque
      const expectedTorque = params.wobLbs * params.bitDiameterInch / 24; // Estimación simple
      if (params.torqueSurfaceFtLbs > expectedTorque * 2) {
        recommendations.push('Torque excesivo - Verificar limpieza de hoyo y considerar backreaming');
      }

      // Recomendaciones generales
      recommendations.push('Verificar estado del bit (desgaste)');
      recommendations.push('Revisar hidráulica y limpieza de hoyo');
      recommendations.push('Considerar cambio de tipo de bit si persiste MSE alto');
    }

    // MSE muy bajo puede indicar problemas también
    if (msePsi < this.MSE_EXCELLENT && params.ropFtHr > 200) {
      recommendations.push('⚠️ ROP excesivo - Verificar estabilidad del hoyo');
      recommendations.push('Considerar reducir parámetros para mejorar control');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Parámetros de perforación óptimos - Continuar con parámetros actuales');
    }

    return recommendations;
  }

  /**
   * Calcula la pendiente de tendencia (linear regression)
   */
  private calculateTrendSlope(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const xValues = Array.from({ length: n }, (_, i) => i);
    
    const sumX = xValues.reduce((sum, x) => sum + x, 0);
    const sumY = values.reduce((sum, y) => sum + y, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    return slope;
  }

  /**
   * Detecta anomalías en MSE (cambios bruscos)
   */
  detectAnomalies(trend: MSETrend, threshold: number = 2.0): Array<{
    index: number;
    timestamp: Date;
    msePsi: number;
    deviation: number;
    type: 'SPIKE' | 'DROP';
  }> {
    const anomalies: Array<{
      index: number;
      timestamp: Date;
      msePsi: number;
      deviation: number;
      type: 'SPIKE' | 'DROP';
    }> = [];

    // Calcular media y desviación estándar
    const mean = trend.avgMse;
    const variance = trend.msePsi.reduce((sum, val) => sum + (val - mean) ** 2, 0) / trend.msePsi.length;
    const stdDev = Math.sqrt(variance);

    // Detectar valores fuera de threshold × stdDev
    for (let i = 0; i < trend.msePsi.length; i++) {
      const deviation = (trend.msePsi[i] - mean) / stdDev;
      
      if (Math.abs(deviation) > threshold) {
        anomalies.push({
          index: i,
          timestamp: trend.timestamps[i],
          msePsi: trend.msePsi[i],
          deviation,
          type: deviation > 0 ? 'SPIKE' : 'DROP'
        });
      }
    }

    return anomalies;
  }

  /**
   * Optimiza parámetros de perforación para minimizar MSE
   * 
   * Usa un enfoque simplificado de optimización
   */
  optimizeParameters(
    currentParams: DrillingParams,
    constraints: {
      maxWobLbs: number;
      maxRpm: number;
      maxTorqueFtLbs: number;
      targetRopFtHr?: number;
    }
  ): {
    optimizedParams: DrillingParams;
    expectedMSE: number;
    expectedROP: number;
    improvements: string[];
  } {
    const optimizedParams = { ...currentParams };
    const improvements: string[] = [];

    // Optimizar WOB (Weight on Bit)
    const optimalWobPerSqIn = 2000; // psi - valor típico óptimo
    const bitAreaSqIn = Math.PI * (currentParams.bitDiameterInch ** 2) / 4;
    const optimalWob = optimalWobPerSqIn * bitAreaSqIn;
    
    if (optimalWob < constraints.maxWobLbs && optimalWob > currentParams.wobLbs * 1.1) {
      optimizedParams.wobLbs = optimalWob;
      improvements.push(`Aumentar WOB a ${optimalWob.toFixed(0)} lbs`);
    }

    // Optimizar RPM
    const optimalRpm = 120; // RPM típico óptimo para PDC bits
    if (optimalRpm < constraints.maxRpm && Math.abs(optimalRpm - currentParams.rpmSurface) > 10) {
      optimizedParams.rpmSurface = optimalRpm;
      improvements.push(`Ajustar RPM a ${optimalRpm}`);
    }

    // Estimar ROP mejorado (simplificado)
    const ropImprovementFactor = 1.2; // 20% mejora estimada
    const expectedROP = currentParams.ropFtHr * ropImprovementFactor;

    // Calcular MSE esperado con parámetros optimizados
    optimizedParams.ropFtHr = expectedROP;
    const expectedMSE = this.calculateMSE(optimizedParams).msePsi;

    if (improvements.length === 0) {
      improvements.push('Parámetros actuales ya están optimizados');
    }

    return {
      optimizedParams,
      expectedMSE,
      expectedROP,
      improvements
    };
  }

  /**
   * Valida parámetros de entrada
   */
  private validateParams(params: DrillingParams): void {
    if (params.rpmSurface <= 0) {
      throw new Error('RPM debe ser mayor que 0');
    }
    if (params.torqueSurfaceFtLbs < 0) {
      throw new Error('Torque no puede ser negativo');
    }
    if (params.wobLbs <= 0) {
      throw new Error('WOB debe ser mayor que 0');
    }
    if (params.ropFtHr <= 0) {
      throw new Error('ROP debe ser mayor que 0');
    }
    if (params.bitDiameterInch <= 0) {
      throw new Error('Diámetro del bit debe ser mayor que 0');
    }
  }

  /**
   * Compara MSE entre diferentes runs o pozos
   */
  compareRuns(runs: Array<{ name: string; trend: MSETrend }>): {
    bestRun: string;
    worstRun: string;
    comparison: Array<{
      name: string;
      avgMSE: number;
      avgROP: number;
      efficiency: number;
    }>;
  } {
    const comparison = runs.map(run => ({
      name: run.name,
      avgMSE: run.trend.avgMse,
      avgROP: run.trend.ropFtHr.reduce((sum, val) => sum + val, 0) / run.trend.ropFtHr.length,
      efficiency: this.MSE_GOOD / run.trend.avgMse // Simplified efficiency metric
    }));

    // Ordenar por MSE (menor es mejor)
    const sorted = [...comparison].sort((a, b) => a.avgMSE - b.avgMSE);

    return {
      bestRun: sorted[0].name,
      worstRun: sorted[sorted.length - 1].name,
      comparison
    };
  }
}
