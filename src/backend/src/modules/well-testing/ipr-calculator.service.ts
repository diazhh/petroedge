/**
 * IPR (Inflow Performance Relationship) Calculator Service
 * Implements various IPR models for well performance analysis
 */

export interface IprPoint {
  pwf: number;  // Flowing bottomhole pressure (psi)
  q: number;    // Flow rate (BOPD)
}

export interface IprResult {
  model: string;
  qmaxBopd: number;
  productivityIndex: number;
  aofBopd?: number;
  curve: IprPoint[];
}

export interface VogelInput {
  reservoirPressurePsi: number;
  testRateBopd: number;
  testPwfPsi: number;
  numPoints?: number;
}

export interface FetkovichInput {
  reservoirPressurePsi: number;
  testRateBopd: number;
  testPwfPsi: number;
  numPoints?: number;
}

export class IprCalculatorService {
  /**
   * Calculate IPR using Vogel's method
   * For oil wells below bubble point pressure
   * 
   * Formula: Qo/Qmax = 1 - 0.2(Pwf/Pr) - 0.8(Pwf/Pr)²
   */
  calculateVogel(input: VogelInput): IprResult {
    const { reservoirPressurePsi, testRateBopd, testPwfPsi, numPoints = 20 } = input;

    // Validate inputs
    if (reservoirPressurePsi <= 0) {
      throw new Error('Reservoir pressure must be positive');
    }
    if (testRateBopd <= 0) {
      throw new Error('Test rate must be positive');
    }
    if (testPwfPsi < 0 || testPwfPsi >= reservoirPressurePsi) {
      throw new Error('Test Pwf must be between 0 and reservoir pressure');
    }

    // Calculate dimensionless pressure ratio
    const pwfRatio = testPwfPsi / reservoirPressurePsi;

    // Calculate Qmax (AOF - Absolute Open Flow)
    const qmax = testRateBopd / (1 - 0.2 * pwfRatio - 0.8 * Math.pow(pwfRatio, 2));

    // Calculate productivity index at reservoir pressure
    const productivityIndex = (1.8 * qmax) / reservoirPressurePsi;

    // Generate IPR curve points
    const curve: IprPoint[] = [];
    const step = reservoirPressurePsi / numPoints;

    for (let i = 0; i <= numPoints; i++) {
      const pwf = i * step;
      const pwfRatio = pwf / reservoirPressurePsi;
      const q = qmax * (1 - 0.2 * pwfRatio - 0.8 * Math.pow(pwfRatio, 2));
      
      curve.push({
        pwf: Math.round(pwf * 100) / 100,
        q: Math.round(q * 100) / 100,
      });
    }

    return {
      model: 'VOGEL',
      qmaxBopd: Math.round(qmax * 100) / 100,
      productivityIndex: Math.round(productivityIndex * 10000) / 10000,
      aofBopd: Math.round(qmax * 100) / 100,
      curve,
    };
  }

  /**
   * Calculate IPR using Fetkovitch method
   * For gas wells
   * 
   * Formula: Qg = C × (Pr² - Pwf²)^n
   */
  calculateFetkovitch(input: FetkovichInput): IprResult {
    const { reservoirPressurePsi, testRateBopd, testPwfPsi, numPoints = 20 } = input;

    // Validate inputs
    if (reservoirPressurePsi <= 0) {
      throw new Error('Reservoir pressure must be positive');
    }
    if (testRateBopd <= 0) {
      throw new Error('Test rate must be positive');
    }
    if (testPwfPsi < 0 || testPwfPsi >= reservoirPressurePsi) {
      throw new Error('Test Pwf must be between 0 and reservoir pressure');
    }

    // Assume n = 1.0 for single point test (linear flow)
    const n = 1.0;

    // Calculate C coefficient
    const pressureDiffSquared = Math.pow(reservoirPressurePsi, 2) - Math.pow(testPwfPsi, 2);
    const c = testRateBopd / Math.pow(pressureDiffSquared, n);

    // Calculate AOF (Pwf = 0)
    const aof = c * Math.pow(Math.pow(reservoirPressurePsi, 2), n);

    // Calculate productivity index (approximation)
    const productivityIndex = aof / reservoirPressurePsi;

    // Generate IPR curve points
    const curve: IprPoint[] = [];
    const step = reservoirPressurePsi / numPoints;

    for (let i = 0; i <= numPoints; i++) {
      const pwf = i * step;
      const pressureDiff = Math.pow(reservoirPressurePsi, 2) - Math.pow(pwf, 2);
      const q = c * Math.pow(pressureDiff, n);
      
      curve.push({
        pwf: Math.round(pwf * 100) / 100,
        q: Math.round(q * 100) / 100,
      });
    }

    return {
      model: 'FETKOVITCH',
      qmaxBopd: Math.round(aof * 100) / 100,
      productivityIndex: Math.round(productivityIndex * 10000) / 10000,
      aofBopd: Math.round(aof * 100) / 100,
      curve,
    };
  }

  /**
   * Calculate IPR using Standing's method
   * For oil wells above bubble point (single-phase flow)
   * 
   * Formula: Qo = J × (Pr - Pwf)
   */
  calculateStanding(input: VogelInput): IprResult {
    const { reservoirPressurePsi, testRateBopd, testPwfPsi, numPoints = 20 } = input;

    // Validate inputs
    if (reservoirPressurePsi <= 0) {
      throw new Error('Reservoir pressure must be positive');
    }
    if (testRateBopd <= 0) {
      throw new Error('Test rate must be positive');
    }
    if (testPwfPsi < 0 || testPwfPsi >= reservoirPressurePsi) {
      throw new Error('Test Pwf must be between 0 and reservoir pressure');
    }

    // Calculate productivity index (J)
    const productivityIndex = testRateBopd / (reservoirPressurePsi - testPwfPsi);

    // Calculate Qmax (AOF at Pwf = 0)
    const qmax = productivityIndex * reservoirPressurePsi;

    // Generate IPR curve points (linear relationship)
    const curve: IprPoint[] = [];
    const step = reservoirPressurePsi / numPoints;

    for (let i = 0; i <= numPoints; i++) {
      const pwf = i * step;
      const q = productivityIndex * (reservoirPressurePsi - pwf);
      
      curve.push({
        pwf: Math.round(pwf * 100) / 100,
        q: Math.round(q * 100) / 100,
      });
    }

    return {
      model: 'STANDING',
      qmaxBopd: Math.round(qmax * 100) / 100,
      productivityIndex: Math.round(productivityIndex * 10000) / 10000,
      aofBopd: Math.round(qmax * 100) / 100,
      curve,
    };
  }

  /**
   * Calculate IPR using Composite method
   * For wells with pressure above and below bubble point
   * 
   * Combines linear flow (above Pb) with Vogel (below Pb)
   */
  calculateComposite(
    input: VogelInput & { bubblePointPsi: number }
  ): IprResult {
    const { 
      reservoirPressurePsi, 
      testRateBopd, 
      testPwfPsi, 
      bubblePointPsi,
      numPoints = 20 
    } = input;

    // Validate inputs
    if (reservoirPressurePsi <= 0) {
      throw new Error('Reservoir pressure must be positive');
    }
    if (testRateBopd <= 0) {
      throw new Error('Test rate must be positive');
    }
    if (testPwfPsi < 0 || testPwfPsi >= reservoirPressurePsi) {
      throw new Error('Test Pwf must be between 0 and reservoir pressure');
    }
    if (bubblePointPsi <= 0 || bubblePointPsi >= reservoirPressurePsi) {
      throw new Error('Bubble point must be between 0 and reservoir pressure');
    }

    // Calculate productivity index from test point
    let productivityIndex: number;
    
    if (testPwfPsi >= bubblePointPsi) {
      // Test point is above bubble point (linear flow)
      productivityIndex = testRateBopd / (reservoirPressurePsi - testPwfPsi);
    } else {
      // Test point is below bubble point (use Vogel)
      const pwfRatio = testPwfPsi / bubblePointPsi;
      const qAtBubblePoint = testRateBopd / (1 - 0.2 * pwfRatio - 0.8 * Math.pow(pwfRatio, 2));
      productivityIndex = qAtBubblePoint / (reservoirPressurePsi - bubblePointPsi);
    }

    // Calculate flow rate at bubble point
    const qAtBubblePoint = productivityIndex * (reservoirPressurePsi - bubblePointPsi);

    // Calculate Qmax using Vogel below bubble point
    const qmax = qAtBubblePoint / (1 - 0.2 - 0.8);  // At Pwf = 0

    // Generate IPR curve points
    const curve: IprPoint[] = [];
    const step = reservoirPressurePsi / numPoints;

    for (let i = 0; i <= numPoints; i++) {
      const pwf = i * step;
      let q: number;

      if (pwf >= bubblePointPsi) {
        // Linear flow above bubble point
        q = productivityIndex * (reservoirPressurePsi - pwf);
      } else {
        // Vogel flow below bubble point
        const pwfRatio = pwf / bubblePointPsi;
        q = qAtBubblePoint * (1 - 0.2 * pwfRatio - 0.8 * Math.pow(pwfRatio, 2));
      }
      
      curve.push({
        pwf: Math.round(pwf * 100) / 100,
        q: Math.round(q * 100) / 100,
      });
    }

    return {
      model: 'COMPOSITE',
      qmaxBopd: Math.round(qmax * 100) / 100,
      productivityIndex: Math.round(productivityIndex * 10000) / 10000,
      aofBopd: Math.round(qmax * 100) / 100,
      curve,
    };
  }
}
