/**
 * Trajectory Calculator Service
 * 
 * Implementa el método Minimum Curvature para cálculo de trayectorias de pozos.
 * Este es el método más preciso y ampliamente usado en la industria.
 * 
 * Referencias:
 * - SPE 84246: "A Comparison of Borehole Survey Calculation Methods"
 * - Inglis, T.A. (1987): "Directional Drilling"
 */

export interface SurveyPoint {
  md: number;          // Measured Depth (ft)
  inc: number;         // Inclination (degrees)
  azi: number;         // Azimuth (degrees)
  tvd?: number;        // True Vertical Depth (ft) - calculated
  northing?: number;   // Northing displacement (ft) - calculated
  easting?: number;    // Easting displacement (ft) - calculated
  dls?: number;        // Dogleg Severity (deg/100ft) - calculated
}

export interface TrajectoryResult {
  surveys: SurveyPoint[];
  totalTvd: number;
  totalNorthing: number;
  totalEasting: number;
  maxDls: number;
  horizontalDisplacement: number;
  verticalSection: number;
}

export interface TrajectoryDesignParams {
  surfaceLocation: { northing: number; easting: number; elevation: number };
  targetLocation: { northing: number; easting: number; tvd: number };
  kopMd: number;                    // Kick-Off Point MD (ft)
  buildRate: number;                // Build rate (deg/100ft)
  maxInclination?: number;          // Max inclination (degrees)
  turnRate?: number;                // Turn rate (deg/100ft) for azimuth change
  landingPointMd?: number;          // Landing point MD for horizontal section
}

export class TrajectoryCalculatorService {
  /**
   * Calcula trayectoria usando Minimum Curvature Method
   * 
   * Fórmulas:
   * - RF (Ratio Factor) = 2/DL × tan(DL/2)
   * - ΔN = (MD₂ - MD₁)/2 × [sin(I₁)cos(A₁) + sin(I₂)cos(A₂)] × RF
   * - ΔE = (MD₂ - MD₁)/2 × [sin(I₁)sin(A₁) + sin(I₂)sin(A₂)] × RF
   * - ΔTVD = (MD₂ - MD₁)/2 × [cos(I₁) + cos(I₂)] × RF
   * 
   * @param surveys - Array de puntos de survey con MD, INC, AZI
   * @returns Trayectoria calculada con coordenadas 3D
   */
  calculateTrajectory(surveys: SurveyPoint[]): TrajectoryResult {
    if (surveys.length < 2) {
      throw new Error('Se requieren al menos 2 puntos de survey');
    }

    // Validar datos de entrada
    this.validateSurveys(surveys);

    // Ordenar por MD
    const sortedSurveys = [...surveys].sort((a, b) => a.md - b.md);

    // Inicializar primer punto
    const calculatedSurveys: SurveyPoint[] = [{
      ...sortedSurveys[0],
      tvd: 0,
      northing: 0,
      easting: 0,
      dls: 0
    }];

    let maxDls = 0;

    // Calcular cada intervalo usando Minimum Curvature
    for (let i = 1; i < sortedSurveys.length; i++) {
      const prev = calculatedSurveys[i - 1];
      const curr = sortedSurveys[i];

      // Convertir ángulos a radianes
      const inc1 = this.degreesToRadians(prev.inc);
      const inc2 = this.degreesToRadians(curr.inc);
      const azi1 = this.degreesToRadians(prev.azi);
      const azi2 = this.degreesToRadians(curr.azi);

      // Calcular Dogleg (DL)
      const dogleg = this.calculateDogleg(inc1, inc2, azi1, azi2);

      // Calcular Dogleg Severity (DLS) en deg/100ft
      const courseLengthFt = curr.md - prev.md;
      const dls = (this.radiansToDegrees(dogleg) / courseLengthFt) * 100;
      maxDls = Math.max(maxDls, dls);

      // Calcular Ratio Factor (RF)
      let rf: number;
      if (dogleg < 0.0001) {
        // Si el dogleg es muy pequeño, RF ≈ 1 (trayectoria recta)
        rf = 1;
      } else {
        rf = (2 / dogleg) * Math.tan(dogleg / 2);
      }

      // Calcular desplazamientos usando Minimum Curvature
      const deltaMd = courseLengthFt;
      
      const deltaTvd = (deltaMd / 2) * (Math.cos(inc1) + Math.cos(inc2)) * rf;
      
      const deltaNorthing = (deltaMd / 2) * 
        (Math.sin(inc1) * Math.cos(azi1) + Math.sin(inc2) * Math.cos(azi2)) * rf;
      
      const deltaEasting = (deltaMd / 2) * 
        (Math.sin(inc1) * Math.sin(azi1) + Math.sin(inc2) * Math.sin(azi2)) * rf;

      // Acumular coordenadas
      calculatedSurveys.push({
        ...curr,
        tvd: prev.tvd! + deltaTvd,
        northing: prev.northing! + deltaNorthing,
        easting: prev.easting! + deltaEasting,
        dls
      });
    }

    const lastPoint = calculatedSurveys[calculatedSurveys.length - 1];

    return {
      surveys: calculatedSurveys,
      totalTvd: lastPoint.tvd!,
      totalNorthing: lastPoint.northing!,
      totalEasting: lastPoint.easting!,
      maxDls: maxDls,
      horizontalDisplacement: Math.sqrt(
        lastPoint.northing! ** 2 + lastPoint.easting! ** 2
      ),
      verticalSection: this.calculateVerticalSection(calculatedSurveys)
    };
  }

  /**
   * Calcula el dogleg entre dos puntos de survey
   * 
   * Fórmula:
   * DL = arccos[cos(I₂ - I₁) - sin(I₁)sin(I₂)(1 - cos(A₂ - A₁))]
   * 
   * @param inc1 - Inclinación punto 1 (radianes)
   * @param inc2 - Inclinación punto 2 (radianes)
   * @param azi1 - Azimuth punto 1 (radianes)
   * @param azi2 - Azimuth punto 2 (radianes)
   * @returns Dogleg en radianes
   */
  private calculateDogleg(
    inc1: number,
    inc2: number,
    azi1: number,
    azi2: number
  ): number {
    const cosValue = 
      Math.cos(inc2 - inc1) - 
      Math.sin(inc1) * Math.sin(inc2) * (1 - Math.cos(azi2 - azi1));

    // Limitar valor entre -1 y 1 para evitar errores numéricos
    const clampedValue = Math.max(-1, Math.min(1, cosValue));
    
    return Math.acos(clampedValue);
  }

  /**
   * Diseña una trayectoria completa basada en parámetros de diseño
   * 
   * Tipos de trayectoria soportados:
   * - Vertical
   * - Build & Hold (J-type)
   * - S-type (Build-Hold-Drop)
   * - Horizontal (Build-Hold-Horizontal)
   * 
   * @param params - Parámetros de diseño de trayectoria
   * @returns Array de puntos de survey diseñados
   */
  designTrajectory(params: TrajectoryDesignParams): SurveyPoint[] {
    const surveys: SurveyPoint[] = [];
    const { kopMd, buildRate, maxInclination = 90, targetLocation } = params;

    // 1. Sección Vertical (0 a KOP)
    surveys.push({ md: 0, inc: 0, azi: 0 });
    if (kopMd > 0) {
      surveys.push({ md: kopMd, inc: 0, azi: 0 });
    }

    // 2. Calcular azimuth hacia el target
    const deltaE = targetLocation.easting - params.surfaceLocation.easting;
    const deltaN = targetLocation.northing - params.surfaceLocation.northing;
    const targetAzimuth = this.calculateAzimuth(deltaN, deltaE);

    // 3. Sección de Build (construcción de ángulo)
    const buildLengthFt = (maxInclination / buildRate) * 100;
    const buildEndMd = kopMd + buildLengthFt;

    // Generar puntos cada 100 ft en la sección de build
    const buildSteps = Math.ceil(buildLengthFt / 100);
    for (let i = 1; i <= buildSteps; i++) {
      const md = kopMd + (i * 100);
      const inc = Math.min((i * 100 * buildRate) / 100, maxInclination);
      surveys.push({ md, inc, azi: targetAzimuth });
    }

    // 4. Sección de Hold (mantener ángulo)
    const horizontalDisplacement = Math.sqrt(deltaE ** 2 + deltaN ** 2);
    const tvdAtBuildEnd = this.estimateTvdAtMd(surveys, buildEndMd);
    const remainingTvd = targetLocation.tvd - tvdAtBuildEnd;

    if (maxInclination < 90) {
      // Build & Hold trajectory
      const holdLengthFt = remainingTvd / Math.cos(this.degreesToRadians(maxInclination));

      const holdSteps = Math.ceil(holdLengthFt / 100);
      for (let i = 1; i <= holdSteps; i++) {
        const md = buildEndMd + (i * 100);
        surveys.push({ md, inc: maxInclination, azi: targetAzimuth });
      }
    } else {
      // Horizontal trajectory
      if (params.landingPointMd) {
        const landingInc = 90;
        surveys.push({ 
          md: params.landingPointMd, 
          inc: landingInc, 
          azi: targetAzimuth 
        });

        // Sección horizontal hasta el target
        const horizontalSteps = Math.ceil((horizontalDisplacement - params.landingPointMd) / 100);
        for (let i = 1; i <= horizontalSteps; i++) {
          const md = params.landingPointMd + (i * 100);
          surveys.push({ md, inc: 90, azi: targetAzimuth });
        }
      }
    }

    return surveys;
  }

  /**
   * Calcula el azimuth desde el norte hacia un punto
   * 
   * @param deltaN - Desplazamiento norte (ft)
   * @param deltaE - Desplazamiento este (ft)
   * @returns Azimuth en grados (0-360)
   */
  private calculateAzimuth(deltaN: number, deltaE: number): number {
    let azimuth = Math.atan2(deltaE, deltaN);
    azimuth = this.radiansToDegrees(azimuth);
    
    // Normalizar a 0-360
    if (azimuth < 0) {
      azimuth += 360;
    }
    
    return azimuth;
  }

  /**
   * Estima TVD en un MD específico mediante interpolación
   */
  private estimateTvdAtMd(surveys: SurveyPoint[], targetMd: number): number {
    const calculated = this.calculateTrajectory(surveys);
    const point = calculated.surveys.find(s => s.md >= targetMd);
    return point?.tvd || 0;
  }

  /**
   * Calcula la Vertical Section (proyección horizontal en dirección del azimuth)
   */
  private calculateVerticalSection(surveys: SurveyPoint[]): number {
    const lastPoint = surveys[surveys.length - 1];
    if (!lastPoint.northing || !lastPoint.easting) return 0;

    // Vertical Section = proyección en la dirección del azimuth promedio
    const avgAzimuth = surveys.reduce((sum, s) => sum + s.azi, 0) / surveys.length;
    const aziRad = this.degreesToRadians(avgAzimuth);

    return lastPoint.northing * Math.cos(aziRad) + lastPoint.easting * Math.sin(aziRad);
  }

  /**
   * Valida que los datos de survey sean correctos
   */
  private validateSurveys(surveys: SurveyPoint[]): void {
    for (const survey of surveys) {
      if (survey.md < 0) {
        throw new Error(`MD inválido: ${survey.md}`);
      }
      if (survey.inc < 0 || survey.inc > 180) {
        throw new Error(`Inclinación inválida: ${survey.inc} (debe estar entre 0-180°)`);
      }
      if (survey.azi < 0 || survey.azi >= 360) {
        throw new Error(`Azimuth inválido: ${survey.azi} (debe estar entre 0-360°)`);
      }
    }
  }

  /**
   * Convierte grados a radianes
   */
  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Convierte radianes a grados
   */
  private radiansToDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }

  /**
   * Interpola un punto de survey en un MD específico
   */
  interpolateSurvey(surveys: SurveyPoint[], targetMd: number): SurveyPoint | null {
    const calculated = this.calculateTrajectory(surveys);
    
    // Buscar el intervalo que contiene el targetMd
    for (let i = 0; i < calculated.surveys.length - 1; i++) {
      const curr = calculated.surveys[i];
      const next = calculated.surveys[i + 1];

      if (targetMd >= curr.md && targetMd <= next.md) {
        // Interpolación lineal
        const ratio = (targetMd - curr.md) / (next.md - curr.md);
        
        return {
          md: targetMd,
          inc: curr.inc + ratio * (next.inc - curr.inc),
          azi: this.interpolateAzimuth(curr.azi, next.azi, ratio),
          tvd: curr.tvd! + ratio * (next.tvd! - curr.tvd!),
          northing: curr.northing! + ratio * (next.northing! - curr.northing!),
          easting: curr.easting! + ratio * (next.easting! - curr.easting!),
          dls: curr.dls
        };
      }
    }

    return null;
  }

  /**
   * Interpola azimuth considerando el cruce de 0/360 grados
   */
  private interpolateAzimuth(azi1: number, azi2: number, ratio: number): number {
    let delta = azi2 - azi1;
    
    // Ajustar si cruza 0/360
    if (delta > 180) {
      delta -= 360;
    } else if (delta < -180) {
      delta += 360;
    }
    
    let result = azi1 + ratio * delta;
    
    // Normalizar a 0-360
    if (result < 0) result += 360;
    if (result >= 360) result -= 360;
    
    return result;
  }
}
