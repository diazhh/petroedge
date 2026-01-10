/**
 * Torque & Drag Calculator Service
 * 
 * Implementa el modelo Soft-String para cálculo de cargas en la sarta de perforación.
 * Predice hookload y torque durante operaciones de perforación.
 * 
 * Referencias:
 * - Johancsik, C.A., et al. (1984): "Torque and Drag in Directional Wells - Prediction and Measurement"
 * - SPE 11380: "Torque and Drag in Directional Wells"
 */

import { SurveyPoint, TrajectoryCalculatorService } from './trajectory-calculator.service';

export interface StringComponent {
  name: string;
  odInch: number;           // Outer Diameter (in)
  idInch: number;           // Inner Diameter (in)
  lengthFt: number;         // Length (ft)
  weightPerFtLbs: number;   // Weight per foot (lbs/ft)
  startMdFt: number;        // Start MD (ft)
  endMdFt: number;          // End MD (ft)
}

export interface TorqueDragParams {
  surveys: SurveyPoint[];
  stringComponents: StringComponent[];
  holeSizeInch: number;
  casingIdInch?: number;           // If in cased hole
  mudWeightPpg: number;
  frictionFactorCased: number;     // Typical: 0.15-0.25 for WBM, 0.10-0.20 for OBM
  frictionFactorOpenHole: number;  // Typical: 0.20-0.35 for WBM, 0.15-0.25 for OBM
  casingShoeDepthFt?: number;      // Depth where casing ends
  blockWeight?: number;            // Block weight (lbs) - default 0
}

export interface TorqueDragResult {
  operation: 'TRIP_IN' | 'TRIP_OUT' | 'ROTATING' | 'SLIDING';
  depthsFt: number[];
  hookloadLbs: number[];
  torqueFtLbs: number[];
  sideForceLbs: number[];
  dragForceLbs: number[];
  maxHookloadLbs: number;
  maxTorqueFtLbs: number;
  surfaceHookloadLbs: number;
  surfaceTorqueFtLbs: number;
}

export class TorqueDragService {
  private trajectoryCalc = new TrajectoryCalculatorService();

  /**
   * Calcula Torque & Drag para una operación específica
   * 
   * @param params - Parámetros de la sarta y trayectoria
   * @param operation - Tipo de operación
   * @returns Resultados de T&D con hookload y torque vs profundidad
   */
  calculateTorqueDrag(
    params: TorqueDragParams,
    operation: 'TRIP_IN' | 'TRIP_OUT' | 'ROTATING' | 'SLIDING'
  ): TorqueDragResult {
    // Calcular trayectoria completa
    const trajectory = this.trajectoryCalc.calculateTrajectory(params.surveys);

    // Discretizar la sarta en elementos pequeños (cada 30 ft)
    const elementLengthFt = 30;
    const elements = this.discretizeString(params.stringComponents, elementLengthFt);

    // Arrays para resultados
    const depthsFt: number[] = [];
    const hookloadLbs: number[] = [];
    const torqueFtLbs: number[] = [];
    const sideForceLbs: number[] = [];
    const dragForceLbs: number[] = [];

    // Calcular desde el fondo hacia arriba
    let cumulativeTension = 0;
    let cumulativeTorque = 0;

    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      const mdMid = (element.startMdFt + element.endMdFt) / 2;

      // Interpolar survey en el punto medio del elemento
      const survey = this.trajectoryCalc.interpolateSurvey(trajectory.surveys, mdMid);
      if (!survey) continue;

      // Calcular propiedades del elemento
      const elementWeightLbs = element.weightPerFtLbs * element.lengthFt;
      const buoyancyFactor = this.calculateBuoyancyFactor(
        element.odInch,
        element.idInch,
        params.mudWeightPpg
      );
      const buoyedWeightLbs = elementWeightLbs * buoyancyFactor;

      // Determinar coeficiente de fricción
      const frictionFactor = this.getFrictionFactor(
        mdMid,
        params.casingShoeDepthFt,
        params.frictionFactorCased,
        params.frictionFactorOpenHole
      );

      // Calcular componentes de fuerza
      const incRad = this.degreesToRadians(survey.inc);
      const dlsRad = survey.dls ? this.degreesToRadians(survey.dls) : 0;

      // Fuerza normal (N)
      const normalForce = this.calculateNormalForce(
        buoyedWeightLbs,
        cumulativeTension,
        incRad,
        dlsRad,
        element.lengthFt
      );

      // Fuerza de arrastre (drag)
      const dragForce = frictionFactor * normalForce;

      // Actualizar tensión según operación
      let deltaTension = 0;
      let deltaTorque = 0;

      switch (operation) {
        case 'TRIP_IN':
          // Bajando: peso ayuda, fricción resiste
          deltaTension = buoyedWeightLbs * Math.cos(incRad) - dragForce;
          break;

        case 'TRIP_OUT':
          // Subiendo: peso resiste, fricción resiste
          deltaTension = buoyedWeightLbs * Math.cos(incRad) + dragForce;
          break;

        case 'ROTATING':
          // Rotando: fricción se convierte en torque
          deltaTension = buoyedWeightLbs * Math.cos(incRad);
          deltaTorque = dragForce * (element.odInch / 24); // Torque = F × r (ft-lbs)
          break;

        case 'SLIDING':
          // Deslizando sin rotar: fricción resiste
          deltaTension = buoyedWeightLbs * Math.cos(incRad) + dragForce;
          deltaTorque = dragForce * (element.odInch / 24);
          break;
      }

      cumulativeTension += deltaTension;
      cumulativeTorque += deltaTorque;

      // Guardar resultados
      depthsFt.push(mdMid);
      hookloadLbs.push(cumulativeTension);
      torqueFtLbs.push(cumulativeTorque);
      sideForceLbs.push(normalForce);
      dragForceLbs.push(dragForce);
    }

    // Agregar peso del bloque si aplica
    const blockWeight = params.blockWeight || 0;
    const surfaceHookload = cumulativeTension + blockWeight;

    return {
      operation,
      depthsFt: depthsFt.reverse(),
      hookloadLbs: hookloadLbs.reverse(),
      torqueFtLbs: torqueFtLbs.reverse(),
      sideForceLbs: sideForceLbs.reverse(),
      dragForceLbs: dragForceLbs.reverse(),
      maxHookloadLbs: Math.max(...hookloadLbs),
      maxTorqueFtLbs: Math.max(...torqueFtLbs),
      surfaceHookloadLbs: surfaceHookload,
      surfaceTorqueFtLbs: cumulativeTorque
    };
  }

  /**
   * Calcula la fuerza normal en un elemento
   * 
   * Fórmula:
   * N = W × sin(θ) + T × Δθ
   * 
   * @param weight - Peso boyado del elemento (lbs)
   * @param tension - Tensión acumulada (lbs)
   * @param incRad - Inclinación (radianes)
   * @param dlsRad - Dogleg severity (radianes)
   * @param lengthFt - Longitud del elemento (ft)
   * @returns Fuerza normal (lbs)
   */
  private calculateNormalForce(
    weight: number,
    tension: number,
    incRad: number,
    dlsRad: number,
    lengthFt: number
  ): number {
    const weightComponent = weight * Math.sin(incRad);
    const tensionComponent = tension * dlsRad * (lengthFt / 100); // DLS es por 100 ft
    
    return Math.abs(weightComponent) + Math.abs(tensionComponent);
  }

  /**
   * Calcula el factor de boyancia (buoyancy factor)
   * 
   * BF = 1 - (ρ_mud / ρ_steel)
   * 
   * @param odInch - Diámetro externo (in)
   * @param idInch - Diámetro interno (in)
   * @param mudWeightPpg - Densidad del lodo (ppg)
   * @returns Factor de boyancia (0-1)
   */
  private calculateBuoyancyFactor(
    odInch: number,
    idInch: number,
    mudWeightPpg: number
  ): number {
    const steelDensityPpg = 65.4; // Densidad del acero (ppg)
    
    // Calcular densidad efectiva de la tubería (considerando el hueco interno)
    const steelAreaSqIn = Math.PI * (odInch ** 2 - idInch ** 2) / 4;
    const totalAreaSqIn = Math.PI * odInch ** 2 / 4;
    const effectiveDensityPpg = steelDensityPpg * (steelAreaSqIn / totalAreaSqIn);
    
    return 1 - (mudWeightPpg / effectiveDensityPpg);
  }

  /**
   * Determina el coeficiente de fricción según la profundidad
   */
  private getFrictionFactor(
    mdFt: number,
    casingShoeDepthFt: number | undefined,
    frictionCased: number,
    frictionOpenHole: number
  ): number {
    if (!casingShoeDepthFt || mdFt <= casingShoeDepthFt) {
      return frictionCased;
    }
    return frictionOpenHole;
  }

  /**
   * Discretiza la sarta en elementos pequeños para cálculo
   */
  private discretizeString(
    components: StringComponent[],
    elementLengthFt: number
  ): StringComponent[] {
    const elements: StringComponent[] = [];

    for (const component of components) {
      const totalLength = component.endMdFt - component.startMdFt;
      const numElements = Math.ceil(totalLength / elementLengthFt);
      const actualElementLength = totalLength / numElements;

      for (let i = 0; i < numElements; i++) {
        elements.push({
          ...component,
          lengthFt: actualElementLength,
          startMdFt: component.startMdFt + i * actualElementLength,
          endMdFt: component.startMdFt + (i + 1) * actualElementLength
        });
      }
    }

    return elements;
  }

  /**
   * Calcula margen de seguridad (safety factor) para operaciones
   */
  calculateSafetyFactors(result: TorqueDragResult, limits: {
    maxHookloadLbs: number;
    maxTorqueFtLbs: number;
  }): {
    hookloadSafetyFactor: number;
    torqueSafetyFactor: number;
    isWithinLimits: boolean;
  } {
    const hookloadSF = limits.maxHookloadLbs / result.maxHookloadLbs;
    const torqueSF = limits.maxTorqueFtLbs / result.maxTorqueFtLbs;

    return {
      hookloadSafetyFactor: hookloadSF,
      torqueSafetyFactor: torqueSF,
      isWithinLimits: hookloadSF >= 1.0 && torqueSF >= 1.0
    };
  }

  /**
   * Compara modelo vs mediciones reales
   */
  compareModelVsActual(
    modelResult: TorqueDragResult,
    actualMeasurements: { depthFt: number; hookloadLbs: number; torqueFtLbs?: number }[]
  ): {
    avgHookloadError: number;
    avgTorqueError: number;
    maxHookloadError: number;
    maxTorqueError: number;
    rmseHookload: number;
    rmseTorque: number;
  } {
    let sumHookloadError = 0;
    let sumTorqueError = 0;
    let maxHookloadError = 0;
    let maxTorqueError = 0;
    let sumSquaredHookloadError = 0;
    let sumSquaredTorqueError = 0;
    let torqueCount = 0;

    for (const actual of actualMeasurements) {
      // Encontrar el valor del modelo más cercano
      const idx = this.findClosestIndex(modelResult.depthsFt, actual.depthFt);
      const modelHookload = modelResult.hookloadLbs[idx];
      const modelTorque = modelResult.torqueFtLbs[idx];

      // Error de hookload
      const hookloadError = Math.abs(modelHookload - actual.hookloadLbs);
      sumHookloadError += hookloadError;
      maxHookloadError = Math.max(maxHookloadError, hookloadError);
      sumSquaredHookloadError += hookloadError ** 2;

      // Error de torque (si está disponible)
      if (actual.torqueFtLbs !== undefined) {
        const torqueError = Math.abs(modelTorque - actual.torqueFtLbs);
        sumTorqueError += torqueError;
        maxTorqueError = Math.max(maxTorqueError, torqueError);
        sumSquaredTorqueError += torqueError ** 2;
        torqueCount++;
      }
    }

    const n = actualMeasurements.length;

    return {
      avgHookloadError: sumHookloadError / n,
      avgTorqueError: torqueCount > 0 ? sumTorqueError / torqueCount : 0,
      maxHookloadError,
      maxTorqueError,
      rmseHookload: Math.sqrt(sumSquaredHookloadError / n),
      rmseTorque: torqueCount > 0 ? Math.sqrt(sumSquaredTorqueError / torqueCount) : 0
    };
  }

  /**
   * Encuentra el índice más cercano a un valor en un array
   */
  private findClosestIndex(array: number[], value: number): number {
    let minDiff = Infinity;
    let closestIdx = 0;

    for (let i = 0; i < array.length; i++) {
      const diff = Math.abs(array[i] - value);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }

    return closestIdx;
  }

  /**
   * Genera recomendaciones basadas en los resultados de T&D
   */
  generateRecommendations(
    result: TorqueDragResult,
    limits: { maxHookloadLbs: number; maxTorqueFtLbs: number }
  ): string[] {
    const recommendations: string[] = [];
    const safetyFactors = this.calculateSafetyFactors(result, limits);

    // Hookload
    if (safetyFactors.hookloadSafetyFactor < 1.0) {
      recommendations.push(
        `⚠️ Hookload excede límite (${result.maxHookloadLbs.toFixed(0)} lbs > ${limits.maxHookloadLbs.toFixed(0)} lbs)`
      );
      recommendations.push('Considerar: reducir peso de sarta, usar lubricante, o modificar trayectoria');
    } else if (safetyFactors.hookloadSafetyFactor < 1.2) {
      recommendations.push(
        `⚠️ Margen de seguridad bajo en hookload (SF = ${safetyFactors.hookloadSafetyFactor.toFixed(2)})`
      );
    }

    // Torque
    if (safetyFactors.torqueSafetyFactor < 1.0) {
      recommendations.push(
        `⚠️ Torque excede límite (${result.maxTorqueFtLbs.toFixed(0)} ft-lbs > ${limits.maxTorqueFtLbs.toFixed(0)} ft-lbs)`
      );
      recommendations.push('Considerar: usar lubricante, reducir RPM, o modificar trayectoria');
    } else if (safetyFactors.torqueSafetyFactor < 1.2) {
      recommendations.push(
        `⚠️ Margen de seguridad bajo en torque (SF = ${safetyFactors.torqueSafetyFactor.toFixed(2)})`
      );
    }

    // Operación específica
    if (result.operation === 'TRIP_IN' && result.maxHookloadLbs > limits.maxHookloadLbs * 0.8) {
      recommendations.push('Considerar backreaming durante trip in para reducir cargas');
    }

    if (result.operation === 'SLIDING' && result.maxTorqueFtLbs > limits.maxTorqueFtLbs * 0.7) {
      recommendations.push('Alto torque en sliding - verificar limpieza de hoyo y considerar wiper trip');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Operación dentro de límites seguros');
    }

    return recommendations;
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
