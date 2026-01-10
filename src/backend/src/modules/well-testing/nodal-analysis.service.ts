/**
 * Nodal Analysis Service
 * Combines IPR and VLP to find optimal operating point
 */

import { IprCalculatorService, IprResult, IprPoint } from './ipr-calculator.service';
import { VlpCalculatorService, VlpResult, VlpPoint } from './vlp-calculator.service';

export interface NodalAnalysisInput {
  // IPR inputs
  iprModel: 'VOGEL' | 'FETKOVITCH' | 'STANDING' | 'COMPOSITE';
  reservoirPressurePsi: number;
  testRateBopd: number;
  testPwfPsi: number;
  bubblePointPsi?: number; // Required for COMPOSITE model
  
  // VLP inputs
  wellDepthFt: number;
  tubingDiameterIn: number;
  wellheadPressurePsi: number;
  oilGravityApi: number;
  gasGravity: number;
  waterCut: number;
  gor: number;
  temperatureDegF: number;
  
  // Analysis parameters
  numPoints?: number;
}

export interface NodalAnalysisResult {
  ipr: IprResult;
  vlp: VlpResult;
  operatingPoint: {
    rateBopd: number;
    pwfPsi: number;
    isStable: boolean;
  };
  multipleIntersections: boolean;
  intersectionPoints: Array<{
    rateBopd: number;
    pwfPsi: number;
  }>;
  recommendations: string[];
}

export class NodalAnalysisService {
  private iprCalculator: IprCalculatorService;
  private vlpCalculator: VlpCalculatorService;

  constructor() {
    this.iprCalculator = new IprCalculatorService();
    this.vlpCalculator = new VlpCalculatorService();
  }

  /**
   * Perform nodal analysis to find operating point
   */
  performNodalAnalysis(input: NodalAnalysisInput): NodalAnalysisResult {
    const {
      iprModel,
      reservoirPressurePsi,
      testRateBopd,
      testPwfPsi,
      bubblePointPsi,
      wellDepthFt,
      tubingDiameterIn,
      wellheadPressurePsi,
      oilGravityApi,
      gasGravity,
      waterCut,
      gor,
      temperatureDegF,
      numPoints = 30,
    } = input;

    // Calculate IPR curve
    let ipr: IprResult;
    switch (iprModel) {
      case 'VOGEL':
        ipr = this.iprCalculator.calculateVogel({
          reservoirPressurePsi,
          testRateBopd,
          testPwfPsi,
          numPoints,
        });
        break;
      case 'FETKOVITCH':
        ipr = this.iprCalculator.calculateFetkovitch({
          reservoirPressurePsi,
          testRateBopd,
          testPwfPsi,
          numPoints,
        });
        break;
      case 'STANDING':
        ipr = this.iprCalculator.calculateStanding({
          reservoirPressurePsi,
          testRateBopd,
          testPwfPsi,
          numPoints,
        });
        break;
      case 'COMPOSITE':
        if (!bubblePointPsi) {
          throw new Error('Bubble point pressure required for COMPOSITE model');
        }
        ipr = this.iprCalculator.calculateComposite({
          reservoirPressurePsi,
          testRateBopd,
          testPwfPsi,
          bubblePointPsi,
          numPoints,
        });
        break;
      default:
        throw new Error(`Unknown IPR model: ${iprModel}`);
    }

    // Calculate VLP curve
    const vlp = this.vlpCalculator.calculateBeggsBrill({
      wellDepthFt,
      tubingDiameterIn,
      wellheadPressurePsi,
      oilGravityApi,
      gasGravity,
      waterCut,
      gor,
      temperatureDegF,
      minRateBopd: 0,
      maxRateBopd: ipr.qmaxBopd * 1.2, // Extend VLP beyond IPR max
      numPoints,
    });

    // Find intersection points (operating points)
    const intersections = this.findIntersections(ipr.curve, vlp.curve);

    // Determine stable operating point
    const operatingPoint = this.determineStableOperatingPoint(
      intersections,
      ipr.curve,
      vlp.curve
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      ipr,
      vlp,
      operatingPoint,
      intersections
    );

    return {
      ipr,
      vlp,
      operatingPoint,
      multipleIntersections: intersections.length > 1,
      intersectionPoints: intersections,
      recommendations,
    };
  }

  /**
   * Find intersection points between IPR and VLP curves
   */
  private findIntersections(
    iprCurve: IprPoint[],
    vlpCurve: VlpPoint[]
  ): Array<{ rateBopd: number; pwfPsi: number }> {
    const intersections: Array<{ rateBopd: number; pwfPsi: number }> = [];
    const tolerance = 50; // psi tolerance for intersection

    // Create interpolated functions for both curves
    for (let i = 0; i < iprCurve.length - 1; i++) {
      const ipr1 = iprCurve[i];
      const ipr2 = iprCurve[i + 1];

      // Find corresponding VLP points
      for (let j = 0; j < vlpCurve.length - 1; j++) {
        const vlp1 = vlpCurve[j];
        const vlp2 = vlpCurve[j + 1];

        // Check if segments overlap in rate range
        const rateMin = Math.max(
          Math.min(ipr1.q, ipr2.q),
          Math.min(vlp1.q, vlp2.q)
        );
        const rateMax = Math.min(
          Math.max(ipr1.q, ipr2.q),
          Math.max(vlp1.q, vlp2.q)
        );

        if (rateMin <= rateMax) {
          // Interpolate at midpoint
          const rateMid = (rateMin + rateMax) / 2;
          
          const iprPwf = this.interpolate(ipr1.q, ipr1.pwf, ipr2.q, ipr2.pwf, rateMid);
          const vlpPwf = this.interpolate(vlp1.q, vlp1.pwf, vlp2.q, vlp2.pwf, rateMid);

          // Check if pressures are close enough
          if (Math.abs(iprPwf - vlpPwf) < tolerance) {
            // Found an intersection
            const avgPwf = (iprPwf + vlpPwf) / 2;
            
            // Avoid duplicates
            const isDuplicate = intersections.some(
              (point) =>
                Math.abs(point.rateBopd - rateMid) < 10 &&
                Math.abs(point.pwfPsi - avgPwf) < tolerance
            );

            if (!isDuplicate) {
              intersections.push({
                rateBopd: Math.round(rateMid * 100) / 100,
                pwfPsi: Math.round(avgPwf * 100) / 100,
              });
            }
          }
        }
      }
    }

    return intersections.sort((a, b) => a.rateBopd - b.rateBopd);
  }

  /**
   * Linear interpolation
   */
  private interpolate(x1: number, y1: number, x2: number, y2: number, x: number): number {
    if (x2 === x1) return y1;
    return y1 + ((y2 - y1) * (x - x1)) / (x2 - x1);
  }

  /**
   * Determine stable operating point from intersections
   */
  private determineStableOperatingPoint(
    intersections: Array<{ rateBopd: number; pwfPsi: number }>,
    iprCurve: IprPoint[],
    vlpCurve: VlpPoint[]
  ): { rateBopd: number; pwfPsi: number; isStable: boolean } {
    if (intersections.length === 0) {
      // No intersection - well cannot flow naturally
      return {
        rateBopd: 0,
        pwfPsi: 0,
        isStable: false,
      };
    }

    if (intersections.length === 1) {
      // Single intersection - stable operating point
      return {
        ...intersections[0],
        isStable: true,
      };
    }

    // Multiple intersections - need to determine stability
    // Generally, the highest rate intersection is the stable one
    const stablePoint = intersections[intersections.length - 1];

    // Check stability by verifying slopes
    const isStable = this.checkStability(stablePoint, iprCurve, vlpCurve);

    return {
      ...stablePoint,
      isStable,
    };
  }

  /**
   * Check if operating point is stable
   */
  private checkStability(
    point: { rateBopd: number; pwfPsi: number },
    iprCurve: IprPoint[],
    vlpCurve: VlpPoint[]
  ): boolean {
    // Find slopes at operating point
    const iprSlope = this.getSlopeAtPoint(point.rateBopd, iprCurve);
    const vlpSlope = this.getSlopeAtPoint(point.rateBopd, vlpCurve);

    // Stable if IPR slope is more negative than VLP slope
    // (IPR decreases faster with rate than VLP)
    return iprSlope < vlpSlope;
  }

  /**
   * Get slope of curve at a given rate
   */
  private getSlopeAtPoint(rate: number, curve: Array<{ q: number; pwf: number }>): number {
    // Find surrounding points
    for (let i = 0; i < curve.length - 1; i++) {
      if (curve[i].q <= rate && rate <= curve[i + 1].q) {
        const dq = curve[i + 1].q - curve[i].q;
        const dpwf = curve[i + 1].pwf - curve[i].pwf;
        return dq !== 0 ? dpwf / dq : 0;
      }
    }
    return 0;
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    ipr: IprResult,
    _vlp: VlpResult,
    operatingPoint: { rateBopd: number; pwfPsi: number; isStable: boolean },
    intersections: Array<{ rateBopd: number; pwfPsi: number }>
  ): string[] {
    const recommendations: string[] = [];

    if (!operatingPoint.isStable) {
      recommendations.push('⚠️ Well cannot flow naturally - artificial lift required');
      recommendations.push('Consider installing ESP, gas lift, or rod pump');
      return recommendations;
    }

    // Check if operating at optimal rate
    const efficiencyPct = (operatingPoint.rateBopd / ipr.qmaxBopd) * 100;
    
    if (efficiencyPct < 30) {
      recommendations.push('⚠️ Well operating at low efficiency (<30% of AOF)');
      recommendations.push('Consider reducing wellhead pressure or increasing tubing diameter');
    } else if (efficiencyPct > 80) {
      recommendations.push('✅ Well operating at high efficiency (>80% of AOF)');
    } else {
      recommendations.push(`ℹ️ Well operating at ${Math.round(efficiencyPct)}% of AOF`);
    }

    // Check for multiple intersections
    if (intersections.length > 1) {
      recommendations.push('⚠️ Multiple operating points detected - flow may be unstable');
      recommendations.push('Monitor well performance closely for heading or slugging');
    }

    // Check productivity index
    if (ipr.productivityIndex < 0.5) {
      recommendations.push('⚠️ Low productivity index - consider well stimulation');
    } else if (ipr.productivityIndex > 5) {
      recommendations.push('✅ High productivity index - well has good reservoir connectivity');
    }

    // Check operating pressure
    if (operatingPoint.pwfPsi < 500) {
      recommendations.push('⚠️ Low bottomhole pressure - risk of sand production');
    }

    return recommendations;
  }
}
