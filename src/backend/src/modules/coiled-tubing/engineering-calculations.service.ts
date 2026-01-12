/**
 * Servicio de Cálculos de Ingeniería para Coiled Tubing
 * 
 * Implementa cálculos críticos para operaciones de CT:
 * - Hidráulica: Reynolds, ECD, fricción, pérdidas de presión
 * - Mecánica: Estiramiento, buckling, fuerzas axiales
 * - Predicción de lockup
 * - Análisis de fuerzas
 */

// Constantes físicas
const GRAVITY = 32.174; // ft/s²
const PI = Math.PI;

/**
 * Parámetros para cálculos hidráulicos
 */
export interface HydraulicParams {
  flowRateBpm: number;           // Caudal (bbl/min)
  fluidDensityPpg: number;       // Densidad del fluido (ppg)
  fluidViscosityCp: number;      // Viscosidad (cP)
  tubingOdIn: number;            // OD del tubing (in)
  tubingIdIn: number;            // ID del tubing (in)
  holeDiameterIn?: number;       // Diámetro del pozo (in) - para anular
  depthFt: number;               // Profundidad (ft)
  inclination?: number;          // Inclinación (grados)
}

/**
 * Parámetros para cálculos mecánicos
 */
export interface MechanicalParams {
  tubingOdIn: number;            // OD del tubing (in)
  tubingIdIn: number;            // ID del tubing (in)
  yieldStrengthPsi: number;      // Resistencia a la fluencia (psi)
  elasticModulusPsi: number;     // Módulo de elasticidad (psi)
  depthFt: number;               // Profundidad (ft)
  weightOnBitLbs?: number;       // Peso sobre la broca (lbs)
  appliedForceLbs: number;       // Fuerza aplicada (lbs)
  fluidDensityPpg: number;       // Densidad del fluido (ppg)
  inclination?: number;          // Inclinación (grados)
}

/**
 * Resultados de cálculos hidráulicos
 */
export interface HydraulicResults {
  reynoldsNumber: number;
  flowRegime: 'LAMINAR' | 'TRANSITIONAL' | 'TURBULENT';
  frictionFactor: number;
  pressureLossPsi: number;
  ecd: number;                   // Equivalent Circulating Density (ppg)
  annularVelocityFtMin: number;
  criticalVelocityFtMin: number;
}

/**
 * Resultados de cálculos mecánicos
 */
export interface MechanicalResults {
  axialStressPsi: number;
  stretchIn: number;
  bucklingForceLbs: number;
  bucklingStatus: 'SAFE' | 'WARNING' | 'CRITICAL';
  safetyFactor: number;
  maxAllowableForceLbs: number;
  lockupRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class EngineeringCalculationsService {
  
  /**
   * Calcula el número de Reynolds para flujo en tubing
   */
  calculateReynolds(params: HydraulicParams): number {
    const { flowRateBpm, fluidDensityPpg, fluidViscosityCp, tubingIdIn } = params;
    
    // Convertir unidades
    const flowRateGpm = flowRateBpm * 42; // bbl/min a gal/min
    const velocity = (flowRateGpm * 0.3208) / Math.pow(tubingIdIn, 2); // ft/s
    const densityLbFt3 = fluidDensityPpg * 7.48; // ppg a lb/ft³
    
    // Reynolds = (densidad * velocidad * diámetro) / viscosidad
    const reynolds = (densityLbFt3 * velocity * (tubingIdIn / 12)) / (fluidViscosityCp * 0.000672);
    
    return reynolds;
  }

  /**
   * Determina el régimen de flujo basado en Reynolds
   */
  getFlowRegime(reynolds: number): 'LAMINAR' | 'TRANSITIONAL' | 'TURBULENT' {
    if (reynolds < 2100) return 'LAMINAR';
    if (reynolds < 4000) return 'TRANSITIONAL';
    return 'TURBULENT';
  }

  /**
   * Calcula el factor de fricción según el régimen de flujo
   */
  calculateFrictionFactor(reynolds: number, roughness: number = 0.0018): number {
    const regime = this.getFlowRegime(reynolds);
    
    if (regime === 'LAMINAR') {
      return 64 / reynolds;
    }
    
    // Ecuación de Colebrook-White para flujo turbulento
    // Aproximación de Swamee-Jain
    const term1 = roughness / 3.7;
    const term2 = 5.74 / Math.pow(reynolds, 0.9);
    const f = 0.25 / Math.pow(Math.log10(term1 + term2), 2);
    
    return f;
  }

  /**
   * Calcula pérdidas de presión por fricción
   */
  calculatePressureLoss(params: HydraulicParams): number {
    const { flowRateBpm, fluidDensityPpg, tubingIdIn, depthFt } = params;
    
    const reynolds = this.calculateReynolds(params);
    const frictionFactor = this.calculateFrictionFactor(reynolds);
    
    // Convertir unidades
    const flowRateGpm = flowRateBpm * 42;
    const velocity = (flowRateGpm * 0.3208) / Math.pow(tubingIdIn, 2); // ft/s
    const densityLbFt3 = fluidDensityPpg * 7.48;
    
    // Ecuación de Darcy-Weisbach
    // ΔP = f * (L/D) * (ρ * v²) / 2
    const pressureLossPsf = frictionFactor * (depthFt / (tubingIdIn / 12)) * 
                            (densityLbFt3 * Math.pow(velocity, 2)) / 2;
    
    return pressureLossPsf / 144; // Convertir a psi
  }

  /**
   * Calcula la densidad equivalente de circulación (ECD)
   */
  calculateECD(params: HydraulicParams): number {
    const { fluidDensityPpg, depthFt } = params;
    const pressureLoss = this.calculatePressureLoss(params);
    
    // ECD = densidad del fluido + (pérdida de presión / 0.052 / profundidad)
    const ecd = fluidDensityPpg + (pressureLoss / (0.052 * depthFt));
    
    return ecd;
  }

  /**
   * Calcula velocidad anular
   */
  calculateAnnularVelocity(params: HydraulicParams): number {
    const { flowRateBpm, tubingOdIn, holeDiameterIn } = params;
    
    if (!holeDiameterIn) return 0;
    
    const flowRateGpm = flowRateBpm * 42;
    const annularArea = (Math.pow(holeDiameterIn, 2) - Math.pow(tubingOdIn, 2)) * PI / 4;
    
    // Velocidad = caudal / área
    const velocityFtMin = (flowRateGpm * 0.3208 * 60) / annularArea;
    
    return velocityFtMin;
  }

  /**
   * Realiza cálculos hidráulicos completos
   */
  calculateHydraulics(params: HydraulicParams): HydraulicResults {
    const reynolds = this.calculateReynolds(params);
    const flowRegime = this.getFlowRegime(reynolds);
    const frictionFactor = this.calculateFrictionFactor(reynolds);
    const pressureLoss = this.calculatePressureLoss(params);
    const ecd = this.calculateECD(params);
    const annularVelocity = this.calculateAnnularVelocity(params);
    
    // Velocidad crítica para limpieza del pozo
    const criticalVelocity = 120; // ft/min (típico para CT)
    
    return {
      reynoldsNumber: reynolds,
      flowRegime,
      frictionFactor,
      pressureLossPsi: pressureLoss,
      ecd,
      annularVelocityFtMin: annularVelocity,
      criticalVelocityFtMin: criticalVelocity,
    };
  }

  /**
   * Calcula el esfuerzo axial en el tubing
   */
  calculateAxialStress(params: MechanicalParams): number {
    const { tubingOdIn, tubingIdIn, appliedForceLbs } = params;
    
    // Área de la sección transversal
    const area = (Math.pow(tubingOdIn, 2) - Math.pow(tubingIdIn, 2)) * PI / 4;
    
    // Esfuerzo = Fuerza / Área
    const stress = appliedForceLbs / area;
    
    return stress;
  }

  /**
   * Calcula el estiramiento del tubing
   */
  calculateStretch(params: MechanicalParams): number {
    const { tubingOdIn, tubingIdIn, appliedForceLbs, depthFt, elasticModulusPsi } = params;
    
    const area = (Math.pow(tubingOdIn, 2) - Math.pow(tubingIdIn, 2)) * PI / 4;
    
    // Estiramiento = (Fuerza * Longitud) / (Área * Módulo de elasticidad)
    const stretch = (appliedForceLbs * depthFt) / (area * elasticModulusPsi);
    
    return stretch * 12; // Convertir a pulgadas
  }

  /**
   * Calcula la fuerza crítica de buckling (pandeo)
   */
  calculateBucklingForce(params: MechanicalParams): number {
    const { tubingOdIn, tubingIdIn, elasticModulusPsi, fluidDensityPpg } = params;
    
    // Momento de inercia
    const momentOfInertia = (PI / 64) * (Math.pow(tubingOdIn, 4) - Math.pow(tubingIdIn, 4));
    
    // Peso del fluido
    const fluidWeightLbFt = fluidDensityPpg * 7.48 * (Math.pow(tubingOdIn, 2) * PI / 4) / 144;
    
    // Fuerza crítica de buckling (ecuación de Euler modificada para CT)
    const bucklingForce = 1.94 * Math.pow(elasticModulusPsi * momentOfInertia * fluidWeightLbFt, 1/3);
    
    return bucklingForce;
  }

  /**
   * Calcula la fuerza máxima permitida
   */
  calculateMaxAllowableForce(params: MechanicalParams): number {
    const { tubingOdIn, tubingIdIn, yieldStrengthPsi } = params;
    
    const area = (Math.pow(tubingOdIn, 2) - Math.pow(tubingIdIn, 2)) * PI / 4;
    
    // Fuerza máxima = Área * Resistencia a la fluencia * Factor de seguridad
    const safetyFactor = 0.8; // 80% de la resistencia
    const maxForce = area * yieldStrengthPsi * safetyFactor;
    
    return maxForce;
  }

  /**
   * Evalúa el riesgo de lockup (atascamiento)
   */
  evaluateLockupRisk(params: MechanicalParams): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const { appliedForceLbs, inclination = 0 } = params;
    
    const bucklingForce = this.calculateBucklingForce(params);
    const maxForce = this.calculateMaxAllowableForce(params);
    
    const forceRatio = appliedForceLbs / maxForce;
    const bucklingRatio = appliedForceLbs / bucklingForce;
    
    // Considerar inclinación
    const inclinationFactor = Math.sin(inclination * PI / 180);
    
    if (forceRatio > 0.9 || bucklingRatio > 1.0 || inclinationFactor > 0.8) {
      return 'CRITICAL';
    } else if (forceRatio > 0.75 || bucklingRatio > 0.8 || inclinationFactor > 0.6) {
      return 'HIGH';
    } else if (forceRatio > 0.6 || bucklingRatio > 0.6 || inclinationFactor > 0.4) {
      return 'MEDIUM';
    }
    
    return 'LOW';
  }

  /**
   * Realiza cálculos mecánicos completos
   */
  calculateMechanics(params: MechanicalParams): MechanicalResults {
    const axialStress = this.calculateAxialStress(params);
    const stretch = this.calculateStretch(params);
    const bucklingForce = this.calculateBucklingForce(params);
    const maxAllowableForce = this.calculateMaxAllowableForce(params);
    const lockupRisk = this.evaluateLockupRisk(params);
    
    // Factor de seguridad
    const safetyFactor = maxAllowableForce / params.appliedForceLbs;
    
    // Estado de buckling
    let bucklingStatus: 'SAFE' | 'WARNING' | 'CRITICAL';
    const bucklingRatio = params.appliedForceLbs / bucklingForce;
    
    if (bucklingRatio > 1.0) {
      bucklingStatus = 'CRITICAL';
    } else if (bucklingRatio > 0.8) {
      bucklingStatus = 'WARNING';
    } else {
      bucklingStatus = 'SAFE';
    }
    
    return {
      axialStressPsi: axialStress,
      stretchIn: stretch,
      bucklingForceLbs: bucklingForce,
      bucklingStatus,
      safetyFactor,
      maxAllowableForceLbs: maxAllowableForce,
      lockupRisk,
    };
  }

  /**
   * Predice la profundidad de lockup
   */
  predictLockupDepth(params: MechanicalParams): number {
    const { depthFt, appliedForceLbs, inclination = 0 } = params;
    
    const bucklingForce = this.calculateBucklingForce(params);
    
    // Si la fuerza aplicada es menor que la fuerza de buckling, no hay lockup
    if (appliedForceLbs < bucklingForce) {
      return depthFt; // Puede alcanzar la profundidad objetivo
    }
    
    // Calcular profundidad de lockup considerando inclinación
    const inclinationFactor = 1 + Math.sin(inclination * PI / 180);
    const lockupDepth = depthFt * (bucklingForce / appliedForceLbs) / inclinationFactor;
    
    return lockupDepth;
  }

  /**
   * Calcula fuerzas de fricción en pozo desviado
   */
  calculateFrictionForces(params: {
    weightLbs: number;
    inclination: number;
    frictionCoefficient?: number;
  }): { normalForce: number; frictionForce: number } {
    const { weightLbs, inclination, frictionCoefficient = 0.25 } = params;
    
    const inclinationRad = inclination * PI / 180;
    
    // Fuerza normal = Peso * sin(inclinación)
    const normalForce = weightLbs * Math.sin(inclinationRad);
    
    // Fuerza de fricción = Coeficiente * Fuerza normal
    const frictionForce = frictionCoefficient * normalForce;
    
    return { normalForce, frictionForce };
  }

  /**
   * Simula fuerzas durante operación de pulling/running
   */
  simulateOperationForces(params: {
    depthFt: number;
    tubingWeightLbFt: number;
    fluidDensityPpg: number;
    tubingOdIn: number;
    tubingIdIn: number;
    operation: 'PULLING' | 'RUNNING';
    speedFtMin: number;
    inclination?: number;
  }): {
    hookloadLbs: number;
    effectiveWeightLbs: number;
    buoyancyFactor: number;
    dynamicForceLbs: number;
  } {
    const {
      depthFt,
      tubingWeightLbFt,
      fluidDensityPpg,
      tubingOdIn,
      tubingIdIn,
      operation,
      speedFtMin,
      inclination = 0,
    } = params;
    
    // Peso del tubing en aire
    const tubingWeight = depthFt * tubingWeightLbFt;
    
    // Factor de flotación
    const steelDensityPpg = 65.4;
    const buoyancyFactor = 1 - (fluidDensityPpg / steelDensityPpg);
    
    // Peso efectivo (considerando flotación)
    const effectiveWeight = tubingWeight * buoyancyFactor;
    
    // Fuerzas dinámicas (aceleración/desaceleración)
    const acceleration = speedFtMin / 60; // Aproximación simple
    const mass = tubingWeight / GRAVITY;
    const dynamicForce = mass * acceleration;
    
    // Fuerzas de fricción
    const { frictionForce } = this.calculateFrictionForces({
      weightLbs: effectiveWeight,
      inclination,
    });
    
    // Hookload total
    let hookload: number;
    if (operation === 'PULLING') {
      hookload = effectiveWeight + frictionForce + dynamicForce;
    } else {
      hookload = effectiveWeight - frictionForce - dynamicForce;
    }
    
    return {
      hookloadLbs: hookload,
      effectiveWeightLbs: effectiveWeight,
      buoyancyFactor,
      dynamicForceLbs: dynamicForce,
    };
  }
}
