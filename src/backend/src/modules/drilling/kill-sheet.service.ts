/**
 * Kill Sheet Generator Service
 * 
 * Genera hojas de control de pozo (kill sheets) pre-calculadas para respuesta rápida
 * ante situaciones de control de pozo (kicks, blowouts).
 * 
 * Referencias:
 * - API RP 53: "Blowout Prevention Equipment Systems for Drilling Wells"
 * - IADC Well Control Manual
 */

export interface WellData {
  wellName: string;
  tvdFt: number;                    // True Vertical Depth (ft)
  mdFt: number;                     // Measured Depth (ft)
  currentMudWeightPpg: number;      // Current mud weight (ppg)
  casingShoeDepthTvdFt: number;     // Casing shoe depth TVD (ft)
  casingShoeDepthMdFt: number;      // Casing shoe depth MD (ft)
  openHoleLength: number;           // Open hole length (ft)
}

export interface StringCapacities {
  drillPipeBblPerFt: number;        // DP capacity (bbl/ft)
  hwdpBblPerFt: number;             // HWDP capacity (bbl/ft)
  drillCollarBblPerFt: number;      // DC capacity (bbl/ft)
  annularBblPerFt: number;          // Annular capacity (bbl/ft)
  drillPipeLengthFt: number;
  hwdpLengthFt: number;
  drillCollarLengthFt: number;
}

export interface PumpData {
  pumpOutputBblPerStroke: number;   // Pump output (bbl/stroke)
  maxPumpPressurePsi: number;       // Max pump pressure (psi)
  slowPumpRateSpm: number;          // Slow pump rate (SPM)
  slowPumpPressurePsi: number;      // Slow pump pressure (psi)
}

export interface KillSheetResult {
  wellData: WellData;
  
  // Volumes
  drillStringVolumeBbl: number;
  annularVolumeBbl: number;
  totalSystemVolumeBbl: number;
  
  // Strokes
  strokesToDrillString: number;
  strokesAnnular: number;
  totalStrokes: number;
  
  // Kill mud calculations
  killMudWeightPpg: number;
  killMudVolumeBbl: number;
  
  // Pressures
  initialCirculatingPressurePsi: number;
  finalCirculatingPressurePsi: number;
  
  // MAASP (Maximum Allowable Annular Surface Pressure)
  maaspPsi: number;
  
  // Kick tolerance
  kickTolerancePpg: number;
  maxKickVolumeBbl: number;
  
  // Wait & Weight Method schedule
  waitAndWeightSchedule: Array<{
    strokeNumber: number;
    mudWeightPpg: number;
    drillersPressurePsi: number;
  }>;
  
  // Driller's Method schedule
  drillersMethodSchedule: Array<{
    phase: string;
    strokesStart: number;
    strokesEnd: number;
    pressureStartPsi: number;
    pressureEndPsi: number;
    instructions: string;
  }>;
}

export interface KickData {
  sidppPsi: number;                 // Shut-in Drillpipe Pressure (psi)
  sicppPsi: number;                 // Shut-in Casing Pressure (psi)
  pitGainBbl: number;               // Pit gain (bbl)
}

export class KillSheetService {
  /**
   * Genera Kill Sheet completo para un pozo
   */
  generateKillSheet(
    wellData: WellData,
    stringCapacities: StringCapacities,
    pumpData: PumpData,
    kickData?: KickData
  ): KillSheetResult {
    // 1. Calcular volúmenes
    const volumes = this.calculateVolumes(stringCapacities);

    // 2. Calcular strokes
    const strokes = this.calculateStrokes(volumes, pumpData);

    // 3. Calcular kill mud weight
    const killMudWeight = kickData 
      ? this.calculateKillMudWeight(wellData, kickData)
      : wellData.currentMudWeightPpg;

    // 4. Calcular presiones de circulación
    const pressures = this.calculateCirculatingPressures(
      wellData,
      pumpData,
      killMudWeight,
      kickData
    );

    // 5. Calcular MAASP
    const maasp = this.calculateMAASP(wellData, kickData);

    // 6. Calcular kick tolerance
    const kickTolerance = this.calculateKickTolerance(wellData);

    // 7. Generar schedule Wait & Weight
    const waitAndWeightSchedule = this.generateWaitAndWeightSchedule(
      wellData,
      pumpData,
      strokes,
      pressures,
      killMudWeight
    );

    // 8. Generar schedule Driller's Method
    const drillersMethodSchedule = this.generateDrillersMethodSchedule(
      strokes,
      pressures,
      pumpData
    );

    return {
      wellData,
      drillStringVolumeBbl: volumes.drillString,
      annularVolumeBbl: volumes.annular,
      totalSystemVolumeBbl: volumes.total,
      strokesToDrillString: strokes.drillString,
      strokesAnnular: strokes.annular,
      totalStrokes: strokes.total,
      killMudWeightPpg: killMudWeight,
      killMudVolumeBbl: volumes.total * 1.2, // 20% extra
      initialCirculatingPressurePsi: pressures.initial,
      finalCirculatingPressurePsi: pressures.final,
      maaspPsi: maasp,
      kickTolerancePpg: kickTolerance.tolerancePpg,
      maxKickVolumeBbl: kickTolerance.maxVolumeBbl,
      waitAndWeightSchedule,
      drillersMethodSchedule
    };
  }

  /**
   * Calcula volúmenes de la sarta y anular
   */
  private calculateVolumes(capacities: StringCapacities): {
    drillString: number;
    annular: number;
    total: number;
  } {
    const drillString = 
      capacities.drillPipeBblPerFt * capacities.drillPipeLengthFt +
      capacities.hwdpBblPerFt * capacities.hwdpLengthFt +
      capacities.drillCollarBblPerFt * capacities.drillCollarLengthFt;

    const totalLength = 
      capacities.drillPipeLengthFt + 
      capacities.hwdpLengthFt + 
      capacities.drillCollarLengthFt;

    const annular = capacities.annularBblPerFt * totalLength;

    return {
      drillString,
      annular,
      total: drillString + annular
    };
  }

  /**
   * Calcula strokes necesarios
   */
  private calculateStrokes(
    volumes: { drillString: number; annular: number; total: number },
    pumpData: PumpData
  ): {
    drillString: number;
    annular: number;
    total: number;
  } {
    return {
      drillString: Math.ceil(volumes.drillString / pumpData.pumpOutputBblPerStroke),
      annular: Math.ceil(volumes.annular / pumpData.pumpOutputBblPerStroke),
      total: Math.ceil(volumes.total / pumpData.pumpOutputBblPerStroke)
    };
  }

  /**
   * Calcula kill mud weight requerido
   * 
   * KMW = CMW + SIDPP / (0.052 × TVD)
   */
  private calculateKillMudWeight(wellData: WellData, kickData: KickData): number {
    const sidppGradient = kickData.sidppPsi / (0.052 * wellData.tvdFt);
    return wellData.currentMudWeightPpg + sidppGradient;
  }

  /**
   * Calcula presiones de circulación
   */
  private calculateCirculatingPressures(
    wellData: WellData,
    pumpData: PumpData,
    killMudWeight: number,
    kickData?: KickData
  ): {
    initial: number;
    final: number;
  } {
    const slowPumpPressure = pumpData.slowPumpPressurePsi;
    const sidpp = kickData?.sidppPsi || 0;

    // ICP = SPP + SIDPP
    const initial = slowPumpPressure + sidpp;

    // FCP = SPP × (KMW / CMW)
    const final = slowPumpPressure * (killMudWeight / wellData.currentMudWeightPpg);

    return { initial, final };
  }

  /**
   * Calcula MAASP (Maximum Allowable Annular Surface Pressure)
   * 
   * MAASP = (FG - CMW) × 0.052 × Shoe TVD - Safety Margin
   */
  private calculateMAASP(wellData: WellData, kickData?: KickData): number {
    // Estimar fracture gradient (típicamente 0.7-0.9 psi/ft en shale)
    const fractureGradientPpg = this.estimateFractureGradient(wellData);
    
    const safetyMarginPsi = 200; // Margen de seguridad típico

    const maasp = 
      (fractureGradientPpg - wellData.currentMudWeightPpg) * 
      0.052 * 
      wellData.casingShoeDepthTvdFt - 
      safetyMarginPsi;

    return Math.max(maasp, 0);
  }

  /**
   * Estima fracture gradient basado en profundidad
   */
  private estimateFractureGradient(wellData: WellData): number {
    // Correlación simplificada (Eaton, 1969)
    // FG (ppg) ≈ 8.5 + (TVD / 1000) × 0.5
    const baseFG = 8.5;
    const depthFactor = (wellData.casingShoeDepthTvdFt / 1000) * 0.5;
    
    return baseFG + depthFactor;
  }

  /**
   * Calcula kick tolerance
   */
  private calculateKickTolerance(wellData: WellData): {
    tolerancePpg: number;
    maxVolumeBbl: number;
  } {
    const fractureGradientPpg = this.estimateFractureGradient(wellData);
    
    // Kick tolerance = FG - CMW
    const tolerancePpg = fractureGradientPpg - wellData.currentMudWeightPpg;

    // Volumen máximo de kick (simplificado)
    // Asume que el kick migra al shoe
    const maxVolumeBbl = tolerancePpg * 0.052 * wellData.casingShoeDepthTvdFt / 100;

    return {
      tolerancePpg,
      maxVolumeBbl: Math.max(maxVolumeBbl, 0)
    };
  }

  /**
   * Genera schedule para Wait & Weight Method
   */
  private generateWaitAndWeightSchedule(
    wellData: WellData,
    pumpData: PumpData,
    strokes: { drillString: number; annular: number; total: number },
    pressures: { initial: number; final: number },
    killMudWeight: number
  ): Array<{
    strokeNumber: number;
    mudWeightPpg: number;
    drillersPressurePsi: number;
  }> {
    const schedule: Array<{
      strokeNumber: number;
      mudWeightPpg: number;
      drillersPressurePsi: number;
    }> = [];

    const steps = 10; // Número de puntos en el schedule
    const strokeIncrement = Math.ceil(strokes.drillString / steps);

    for (let i = 0; i <= steps; i++) {
      const strokeNumber = i * strokeIncrement;
      const ratio = strokeNumber / strokes.drillString;

      // Interpolación lineal de presión
      const pressure = pressures.initial - ratio * (pressures.initial - pressures.final);

      // Mud weight aumenta linealmente
      const mudWeight = wellData.currentMudWeightPpg + 
        ratio * (killMudWeight - wellData.currentMudWeightPpg);

      schedule.push({
        strokeNumber,
        mudWeightPpg: Number(mudWeight.toFixed(2)),
        drillersPressurePsi: Math.round(pressure)
      });
    }

    return schedule;
  }

  /**
   * Genera schedule para Driller's Method
   */
  private generateDrillersMethodSchedule(
    strokes: { drillString: number; annular: number; total: number },
    pressures: { initial: number; final: number },
    pumpData: PumpData
  ): Array<{
    phase: string;
    strokesStart: number;
    strokesEnd: number;
    pressureStartPsi: number;
    pressureEndPsi: number;
    instructions: string;
  }> {
    return [
      {
        phase: 'Circulation 1 - Remove Kick',
        strokesStart: 0,
        strokesEnd: strokes.drillString,
        pressureStartPsi: pressures.initial,
        pressureEndPsi: pumpData.slowPumpPressurePsi,
        instructions: 'Mantener presión constante en casing. Reducir presión en drillpipe gradualmente.'
      },
      {
        phase: 'Wait - Mix Kill Mud',
        strokesStart: strokes.drillString,
        strokesEnd: strokes.drillString,
        pressureStartPsi: 0,
        pressureEndPsi: 0,
        instructions: 'Cerrar pozo. Mezclar kill mud. Verificar volúmenes de pits.'
      },
      {
        phase: 'Circulation 2 - Kill Well',
        strokesStart: strokes.drillString,
        strokesEnd: strokes.total,
        pressureStartPsi: pressures.initial,
        pressureEndPsi: pressures.final,
        instructions: 'Circular kill mud. Mantener presión según schedule Wait & Weight.'
      }
    ];
  }

  /**
   * Genera recomendaciones de seguridad
   */
  generateSafetyRecommendations(result: KillSheetResult): string[] {
    const recommendations: string[] = [];

    // MAASP
    if (result.maaspPsi < 500) {
      recommendations.push('⚠️ MAASP muy bajo - Alto riesgo de fractura en shoe');
      recommendations.push('Considerar: reducir densidad de lodo o profundizar casing');
    }

    // Kick tolerance
    if (result.kickTolerancePpg < 0.5) {
      recommendations.push('⚠️ Kick tolerance muy bajo - Ventana operacional estrecha');
      recommendations.push('Extremar precauciones en control de pozo');
    }

    // Presiones
    if (result.initialCirculatingPressurePsi > 3000) {
      recommendations.push('⚠️ ICP alto - Verificar capacidad de bomba y BOP');
    }

    // Volúmenes
    if (result.killMudVolumeBbl > 500) {
      recommendations.push(`Preparar ${Math.ceil(result.killMudVolumeBbl)} bbl de kill mud`);
      recommendations.push('Verificar capacidad de tanques y disponibilidad de barita');
    }

    // Recomendaciones generales
    recommendations.push('✅ Verificar funcionamiento de BOP antes de perforar');
    recommendations.push('✅ Realizar drill de control de pozo con crew');
    recommendations.push('✅ Mantener kill sheet actualizado en piso de perforación');

    return recommendations;
  }

  /**
   * Formatea kill sheet para impresión
   */
  formatForPrint(result: KillSheetResult): string {
    let output = '';
    
    output += '═══════════════════════════════════════════════════════════\n';
    output += `           KILL SHEET - ${result.wellData.wellName}\n`;
    output += '═══════════════════════════════════════════════════════════\n\n';

    output += 'DATOS DEL POZO:\n';
    output += `├── TVD: ${result.wellData.tvdFt.toFixed(0)} ft\n`;
    output += `├── MD: ${result.wellData.mdFt.toFixed(0)} ft\n`;
    output += `├── Casing Shoe: ${result.wellData.casingShoeDepthTvdFt.toFixed(0)} ft (TVD)\n`;
    output += `├── MW actual: ${result.wellData.currentMudWeightPpg.toFixed(1)} ppg\n`;
    output += `└── Open Hole: ${result.wellData.openHoleLength.toFixed(0)} ft\n\n`;

    output += 'VOLÚMENES Y STROKES:\n';
    output += `├── Drill String: ${result.drillStringVolumeBbl.toFixed(1)} bbl (${result.strokesToDrillString} strokes)\n`;
    output += `├── Annular: ${result.annularVolumeBbl.toFixed(1)} bbl (${result.strokesAnnular} strokes)\n`;
    output += `└── Total: ${result.totalSystemVolumeBbl.toFixed(1)} bbl (${result.totalStrokes} strokes)\n\n`;

    output += 'KILL MUD:\n';
    output += `├── Kill MW: ${result.killMudWeightPpg.toFixed(1)} ppg\n`;
    output += `└── Volume needed: ${result.killMudVolumeBbl.toFixed(0)} bbl\n\n`;

    output += 'PRESIONES:\n';
    output += `├── ICP: ${result.initialCirculatingPressurePsi.toFixed(0)} psi\n`;
    output += `├── FCP: ${result.finalCirculatingPressurePsi.toFixed(0)} psi\n`;
    output += `└── MAASP: ${result.maaspPsi.toFixed(0)} psi\n\n`;

    output += 'KICK TOLERANCE:\n';
    output += `├── Tolerance: ${result.kickTolerancePpg.toFixed(2)} ppg\n`;
    output += `└── Max Kick Volume: ${result.maxKickVolumeBbl.toFixed(1)} bbl\n\n`;

    output += '═══════════════════════════════════════════════════════════\n';

    return output;
  }
}
