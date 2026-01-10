/**
 * VLP (Vertical Lift Performance) Calculator Service
 * Implements Beggs & Brill multiphase flow correlation
 */

export interface VlpPoint {
  q: number;      // Flow rate (BOPD)
  pwf: number;    // Flowing bottomhole pressure (psi)
}

export interface VlpResult {
  model: string;
  curve: VlpPoint[];
  optimalRateBopd: number;
  minPwfPsi: number;
}

export interface BeggsBrillInput {
  wellDepthFt: number;
  tubingDiameterIn: number;
  wellheadPressurePsi: number;
  oilGravityApi: number;
  gasGravity: number;
  waterCut: number;           // Fraction (0-1)
  gor: number;                // Gas-Oil Ratio (scf/bbl)
  temperatureDegF: number;
  minRateBopd?: number;
  maxRateBopd?: number;
  numPoints?: number;
}

export interface FluidProperties {
  oilDensityLbmFt3: number;
  gasDensityLbmFt3: number;
  waterDensityLbmFt3: number;
  mixtureDensityLbmFt3: number;
  oilViscosityCp: number;
  gasViscosityCp: number;
  waterViscosityCp: number;
  surfaceTensionDyneCm: number;
}

export class VlpCalculatorService {
  private readonly WATER_DENSITY_STD = 62.4; // lbm/ft³ at standard conditions
  private readonly GAS_CONSTANT = 10.73; // psia·ft³/(lbmol·°R)

  /**
   * Calculate VLP using Beggs & Brill correlation
   * For multiphase flow in vertical/inclined pipes
   */
  calculateBeggsBrill(input: BeggsBrillInput): VlpResult {
    const {
      wellDepthFt,
      tubingDiameterIn,
      wellheadPressurePsi,
      oilGravityApi,
      gasGravity,
      waterCut,
      gor,
      temperatureDegF,
      minRateBopd = 0,
      maxRateBopd = 5000,
      numPoints = 20,
    } = input;

    // Validate inputs
    this.validateInputs(input);

    const curve: VlpPoint[] = [];
    const rateStep = (maxRateBopd - minRateBopd) / numPoints;

    for (let i = 0; i <= numPoints; i++) {
      const q = minRateBopd + i * rateStep;
      
      if (q === 0) {
        // At zero rate, Pwf = Pwhp + hydrostatic head
        const fluidProps = this.calculateFluidProperties(
          oilGravityApi,
          gasGravity,
          waterCut,
          temperatureDegF,
          wellheadPressurePsi
        );
        const hydrostaticPsi = (fluidProps.mixtureDensityLbmFt3 * wellDepthFt) / 144;
        curve.push({
          q: 0,
          pwf: Math.round((wellheadPressurePsi + hydrostaticPsi) * 100) / 100,
        });
        continue;
      }

      // Calculate flowing bottomhole pressure for this rate
      const pwf = this.calculatePwfBeggsBrill(
        q,
        wellDepthFt,
        tubingDiameterIn,
        wellheadPressurePsi,
        oilGravityApi,
        gasGravity,
        waterCut,
        gor,
        temperatureDegF
      );

      curve.push({
        q: Math.round(q * 100) / 100,
        pwf: Math.round(pwf * 100) / 100,
      });
    }

    // Find optimal rate (minimum Pwf requirement)
    const minPwfPoint = curve.reduce((min, point) => 
      point.pwf < min.pwf ? point : min
    );

    return {
      model: 'BEGGS_BRILL',
      curve,
      optimalRateBopd: minPwfPoint.q,
      minPwfPsi: minPwfPoint.pwf,
    };
  }

  /**
   * Calculate flowing bottomhole pressure using Beggs & Brill
   */
  private calculatePwfBeggsBrill(
    rateBopd: number,
    wellDepthFt: number,
    tubingDiameterIn: number,
    wellheadPressurePsi: number,
    oilGravityApi: number,
    gasGravity: number,
    waterCut: number,
    gor: number,
    temperatureDegF: number
  ): number {
    // Convert units
    const tubingDiameterFt = tubingDiameterIn / 12;
    const tubingAreaFt2 = Math.PI * Math.pow(tubingDiameterFt / 2, 2);

    // Calculate fluid properties
    const fluidProps = this.calculateFluidProperties(
      oilGravityApi,
      gasGravity,
      waterCut,
      temperatureDegF,
      wellheadPressurePsi
    );

    // Calculate velocities
    const oilRateBpd = rateBopd * (1 - waterCut);
    const waterRateBpd = rateBopd * waterCut;
    const gasRateScfd = oilRateBpd * gor;

    // Convert to ft³/day
    const oilRateFt3Day = oilRateBpd * 5.615; // 1 bbl = 5.615 ft³
    const waterRateFt3Day = waterRateBpd * 5.615;
    const gasRateFt3Day = gasRateScfd; // Already in ft³/day

    // Superficial velocities (ft/s)
    const vsl = (oilRateFt3Day + waterRateFt3Day) / (tubingAreaFt2 * 86400);
    const vsg = gasRateFt3Day / (tubingAreaFt2 * 86400);
    const vm = vsl + vsg;

    // Liquid holdup calculation (simplified)
    const lambda = vsl / vm; // No-slip liquid holdup
    const nfr = Math.pow(vm, 2) / (32.2 * tubingDiameterFt); // Froude number

    // Flow pattern determination (simplified)
    let hl: number; // Liquid holdup
    if (nfr < 0.01) {
      // Segregated flow
      hl = lambda;
    } else if (nfr > 10) {
      // Distributed flow
      hl = lambda;
    } else {
      // Transition/Intermittent flow
      hl = lambda * (1 + 0.1 * Math.log10(nfr));
      hl = Math.min(Math.max(hl, 0), 1);
    }

    // Mixture density with holdup
    const mixtureDensity = 
      hl * (fluidProps.oilDensityLbmFt3 * (1 - waterCut) + fluidProps.waterDensityLbmFt3 * waterCut) +
      (1 - hl) * fluidProps.gasDensityLbmFt3;

    // Hydrostatic pressure gradient (psi/ft)
    const hydrostaticGradient = mixtureDensity / 144;

    // Friction factor calculation (simplified Moody)
    const reynoldsNumber = (mixtureDensity * vm * tubingDiameterFt) / 
      (fluidProps.oilViscosityCp * 0.000672); // Convert cp to lbm/(ft·s)
    
    const roughness = 0.0006; // ft (commercial steel)
    const relativeRoughness = roughness / tubingDiameterFt;
    
    let frictionFactor: number;
    if (reynoldsNumber < 2000) {
      // Laminar flow
      frictionFactor = 64 / reynoldsNumber;
    } else {
      // Turbulent flow (Colebrook-White approximation)
      frictionFactor = Math.pow(
        -2 * Math.log10(relativeRoughness / 3.7 + 5.74 / Math.pow(reynoldsNumber, 0.9)),
        -2
      );
    }

    // Friction pressure gradient (psi/ft)
    const frictionGradient = 
      (frictionFactor * mixtureDensity * Math.pow(vm, 2)) / 
      (2 * 32.2 * tubingDiameterFt * 144);

    // Acceleration gradient (usually negligible, simplified)
    const accelerationGradient = 0;

    // Total pressure gradient
    const totalGradient = hydrostaticGradient + frictionGradient + accelerationGradient;

    // Calculate bottomhole pressure
    const pwf = wellheadPressurePsi + totalGradient * wellDepthFt;

    return pwf;
  }

  /**
   * Calculate fluid properties
   */
  private calculateFluidProperties(
    oilGravityApi: number,
    gasGravity: number,
    waterCut: number,
    temperatureDegF: number,
    pressurePsi: number
  ): FluidProperties {
    // Oil density (lbm/ft³)
    const oilDensityLbmFt3 = (141.5 / (oilGravityApi + 131.5)) * 62.4;

    // Water density (lbm/ft³)
    const waterDensityLbmFt3 = this.WATER_DENSITY_STD;

    // Gas density (lbm/ft³) using real gas law
    const temperatureR = temperatureDegF + 459.67;
    const gasMolecularWeight = gasGravity * 28.97; // Air = 28.97 lbm/lbmol
    const zFactor = 0.9; // Simplified compressibility factor
    const gasDensityLbmFt3 = 
      (pressurePsi * gasMolecularWeight) / (zFactor * this.GAS_CONSTANT * temperatureR);

    // Mixture density (weighted average)
    const liquidDensity = 
      oilDensityLbmFt3 * (1 - waterCut) + waterDensityLbmFt3 * waterCut;
    
    // Simplified mixture density (ignoring gas volume fraction for now)
    const mixtureDensityLbmFt3 = liquidDensity * 0.9 + gasDensityLbmFt3 * 0.1;

    // Viscosities (simplified correlations)
    const oilViscosityCp = this.calculateOilViscosity(oilGravityApi, temperatureDegF);
    const gasViscosityCp = 0.01; // Typical gas viscosity
    const waterViscosityCp = 1.0; // Water viscosity at standard conditions

    // Surface tension (dyne/cm)
    const surfaceTensionDyneCm = 30 - 0.1 * temperatureDegF; // Simplified

    return {
      oilDensityLbmFt3,
      gasDensityLbmFt3,
      waterDensityLbmFt3,
      mixtureDensityLbmFt3,
      oilViscosityCp,
      gasViscosityCp,
      waterViscosityCp,
      surfaceTensionDyneCm,
    };
  }

  /**
   * Calculate oil viscosity using Beggs-Robinson correlation
   */
  private calculateOilViscosity(oilGravityApi: number, temperatureDegF: number): number {
    // Dead oil viscosity
    const x = Math.pow(10, 3.0324 - 0.02023 * oilGravityApi);
    const y = Math.pow(10, x);
    const deadOilViscosity = Math.pow(10, y) * Math.pow(temperatureDegF, -1.163);

    // For simplicity, return dead oil viscosity
    // In reality, should account for dissolved gas
    return deadOilViscosity;
  }

  /**
   * Validate input parameters
   */
  private validateInputs(input: BeggsBrillInput): void {
    const {
      wellDepthFt,
      tubingDiameterIn,
      wellheadPressurePsi,
      oilGravityApi,
      gasGravity,
      waterCut,
      gor,
      temperatureDegF,
    } = input;

    if (wellDepthFt <= 0) {
      throw new Error('Well depth must be positive');
    }
    if (tubingDiameterIn <= 0) {
      throw new Error('Tubing diameter must be positive');
    }
    if (wellheadPressurePsi < 0) {
      throw new Error('Wellhead pressure cannot be negative');
    }
    if (oilGravityApi <= 0 || oilGravityApi > 100) {
      throw new Error('Oil gravity API must be between 0 and 100');
    }
    if (gasGravity <= 0 || gasGravity > 2) {
      throw new Error('Gas gravity must be between 0 and 2');
    }
    if (waterCut < 0 || waterCut > 1) {
      throw new Error('Water cut must be between 0 and 1');
    }
    if (gor < 0) {
      throw new Error('GOR cannot be negative');
    }
    if (temperatureDegF < -460) {
      throw new Error('Temperature cannot be below absolute zero');
    }
  }
}
