export type TestStatus = 
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'ANALYZED'
  | 'APPROVED'
  | 'CANCELLED'
  | 'SUSPENDED';

export type TestTypeCode = 
  | 'PRODUCTION'
  | 'BUILDUP'
  | 'DRAWDOWN'
  | 'ISOCHRONAL'
  | 'INTERFERENCE'
  | 'PVT_SAMPLE';

export type IprModel = 
  | 'VOGEL'
  | 'FETKOVITCH'
  | 'STANDING'
  | 'COMPOSITE'
  | 'JONES_BLOUNT_GLAZE';

export type VlpCorrelation = 
  | 'BEGGS_BRILL'
  | 'HAGEDORN_BROWN'
  | 'DUNS_ROS'
  | 'ORKISZEWSKI'
  | 'GRAY'
  | 'ANSARI';

export interface TestType {
  id: string;
  tenantId: string;
  code: TestTypeCode;
  name: string;
  description?: string;
  requiresSeparator: boolean;
  requiresPressureGauge: boolean;
  requiresSamples: boolean;
  requiredFields: string[];
  optionalFields: string[];
  isActive: boolean;
  createdAt: string;
}

export interface WellTest {
  id: string;
  tenantId: string;
  wellId: string;
  testTypeId: string;
  testNumber: string;
  testDate: string;
  status: TestStatus;
  startTime?: string;
  endTime?: string;
  durationHours?: number;
  chokeSizeSixtyFourths?: number;
  separatorPressurePsi?: number;
  separatorTemperatureF?: number;
  oilRateBopd?: number;
  waterRateBwpd?: number;
  gasRateMscfd?: number;
  liquidRateBlpd?: number;
  tubingPressurePsi?: number;
  casingPressurePsi?: number;
  flowingBhpPsi?: number;
  staticBhpPsi?: number;
  wellheadTempF?: number;
  bottomholeTempF?: number;
  bswPercent?: number;
  waterCutPercent?: number;
  oilApiGravity?: number;
  gasSpecificGravity?: number;
  gorScfStb?: number;
  productivityIndex?: number;
  specificProductivityIndex?: number;
  approvedBy?: string;
  approvedAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  // Relations
  testType?: TestType;
  well?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface IprAnalysis {
  id: string;
  wellTestId: string;
  model: IprModel;
  reservoirPressurePsi: number;
  bubblePointPsi?: number;
  testRateBopd: number;
  testPwfPsi: number;
  qmaxBopd?: number;
  productivityIndex?: number;
  cCoefficient?: number;
  nExponent?: number;
  aofMscfd?: number;
  iprCurve?: Array<{ pwf: number; rate: number }>;
  rSquared?: number;
  analyst?: string;
  analysisDate: string;
  notes?: string;
  createdAt: string;
}

export interface VlpAnalysis {
  id: string;
  wellTestId?: string;
  wellId: string;
  correlation: VlpCorrelation;
  tubingIdInches: string;
  tubingDepthFt: string;
  wellheadPressurePsi: string;
  wellheadTempF: string;
  waterCutPercent: string;
  gorScfStb: string;
  oilApi: string;
  gasSg: string;
  vlpCurve?: Array<{ rate: number; pwf: number }>;
  analyst?: string;
  analysisDate: string;
  notes?: string;
  createdAt: string;
}

export interface NodalAnalysis {
  id: string;
  wellId: string;
  iprAnalysisId?: string;
  vlpAnalysisId?: string;
  operatingRateBopd: string;
  operatingPwfPsi: string;
  maxRateBopd: string;
  sensitivityResults?: {
    iprModel: string;
    vlpModel: string;
    intersectionPoints: number;
    isStable: boolean;
    multipleIntersections: boolean;
  };
  recommendations?: string;
  analyst?: string;
  analysisDate: string;
  notes?: string;
  createdAt: string;
}

export interface CreateWellTestInput {
  wellId: string;
  testTypeId: string;
  testNumber: string;
  testDate: string;
  status?: TestStatus;
  durationHours?: number;
  chokeSizeSixtyFourths?: number;
  separatorPressurePsi?: number;
  separatorTemperatureF?: number;
  oilRateBopd?: number;
  waterRateBwpd?: number;
  gasRateMscfd?: number;
  tubingPressurePsi?: number;
  casingPressurePsi?: number;
  flowingBhpPsi?: number;
  staticBhpPsi?: number;
  wellheadTempF?: number;
  bottomholeTempF?: number;
  waterCutPercent?: number;
  oilApiGravity?: number;
  gasSpecificGravity?: number;
  gorScfStb?: number;
  notes?: string;
}

export interface CalculateIprInput {
  model: IprModel;
  reservoirPressurePsi: number;
  bubblePointPsi?: number;
  testRateBopd: number;
  testPwfPsi: number;
  numPoints?: number;
}

export interface CalculateVlpInput {
  tubingDepthFt: number;
  tubingIdInches: number;
  wellheadPressurePsi: number;
  oilApi: number;
  gasSg: number;
  waterCutPercent: number;
  gorScfStb: number;
  bottomholeTempF: number;
  maxRateBopd: number;
  numPoints?: number;
}

export interface CalculateNodalInput {
  ipr: {
    model: IprModel;
    reservoirPressurePsi: number;
    bubblePointPsi?: number;
    testRateBopd: number;
    testPwfPsi: number;
  };
  vlp: {
    tubingDepthFt: number;
    tubingIdInches: number;
    wellheadPressurePsi: number;
    oilApi: number;
    gasSg: number;
    waterCutPercent: number;
    gorScfStb: number;
    bottomholeTempF: number;
  };
}
