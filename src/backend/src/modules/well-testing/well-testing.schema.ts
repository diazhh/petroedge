import { z } from 'zod';

// Test Status enum
export const testStatusSchema = z.enum([
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'ANALYZED',
  'APPROVED',
  'CANCELLED',
  'SUSPENDED'
]);

// Test Type Code enum
export const testTypeCodeSchema = z.enum([
  'PRODUCTION',
  'BUILDUP',
  'DRAWDOWN',
  'ISOCHRONAL',
  'INTERFERENCE',
  'PVT_SAMPLE'
]);

// IPR Model enum
export const iprModelSchema = z.enum([
  'VOGEL',
  'FETKOVITCH',
  'STANDING',
  'COMPOSITE',
  'JONES_BLOUNT_GLAZE'
]);

// VLP Correlation enum
export const vlpCorrelationSchema = z.enum([
  'BEGGS_BRILL',
  'HAGEDORN_BROWN',
  'DUNS_ROS',
  'ORKISZEWSKI',
  'GRAY',
  'ANSARI'
]);

// Create Well Test schema
export const createWellTestSchema = z.object({
  wellId: z.string().uuid(),
  testTypeId: z.string().uuid(),
  testDate: z.string().datetime(),
  durationHours: z.number().positive().optional(),
  chokeSize64ths: z.number().int().min(1).max(128).optional(),
  separatorPressurePsi: z.number().positive().optional(),
  separatorTemperatureF: z.number().optional(),
  oilRateBopd: z.number().nonnegative().optional(),
  waterRateBwpd: z.number().nonnegative().optional(),
  gasRateMscfd: z.number().nonnegative().optional(),
  tubingPressurePsi: z.number().positive().optional(),
  casingPressurePsi: z.number().positive().optional(),
  flowingBhpPsi: z.number().positive().optional(),
  staticBhpPsi: z.number().positive().optional(),
  wellheadTempF: z.number().optional(),
  bottomholeTempF: z.number().optional(),
  bswPercent: z.number().min(0).max(100).optional(),
  oilApiGravity: z.number().min(5).max(70).optional(),
  gasSpecificGravity: z.number().positive().optional(),
  notes: z.string().optional(),
});

// Update Well Test schema
export const updateWellTestSchema = createWellTestSchema.partial().extend({
  status: testStatusSchema.optional(),
});

// Query parameters for listing well tests
export const listWellTestsQuerySchema = z.object({
  wellId: z.string().uuid().optional(),
  testTypeId: z.string().uuid().optional(),
  status: testStatusSchema.optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// Create Test Reading schema
export const createTestReadingSchema = z.object({
  wellTestId: z.string().uuid(),
  readingTime: z.string().datetime(),
  elapsedHours: z.number().nonnegative().optional(),
  tubingPressurePsi: z.number().positive().optional(),
  casingPressurePsi: z.number().positive().optional(),
  bottomholePressurePsi: z.number().positive().optional(),
  oilRateBopd: z.number().nonnegative().optional(),
  waterRateBwpd: z.number().nonnegative().optional(),
  gasRateMscfd: z.number().nonnegative().optional(),
  wellheadTempF: z.number().optional(),
  bottomholeTempF: z.number().optional(),
  chokeSize64ths: z.number().int().min(1).max(128).optional(),
  notes: z.string().optional(),
});

// Calculate IPR schema
export const calculateIprSchema = z.object({
  model: iprModelSchema,
  reservoirPressurePsi: z.number().positive(),
  testRateBopd: z.number().positive(),
  testPwfPsi: z.number().positive(),
  bubblePointPsi: z.number().positive().optional(),
  numPoints: z.number().int().positive().default(20),
});

// Create IPR Analysis schema
export const createIprAnalysisSchema = z.object({
  wellTestId: z.string().uuid(),
  model: iprModelSchema,
  reservoirPressurePsi: z.number().positive(),
  bubblePointPsi: z.number().positive().optional(),
  testRateBopd: z.number().positive(),
  testPwfPsi: z.number().positive(),
  qmaxBopd: z.number().positive().optional(),
  productivityIndex: z.number().positive().optional(),
  cCoefficient: z.number().optional(),
  nExponent: z.number().optional(),
  aofMscfd: z.number().optional(),
  iprCurve: z.array(z.object({
    pwf: z.number(),
    q: z.number(),
  })).optional(),
  rSquared: z.number().min(0).max(1).optional(),
  analyst: z.string().optional(),
  notes: z.string().optional(),
});

// Calculate VLP schema
export const calculateVlpSchema = z.object({
  correlation: vlpCorrelationSchema,
  tubingIdInches: z.number().positive(),
  tubingDepthFt: z.number().positive(),
  wellheadPressurePsi: z.number().positive(),
  deviationDegrees: z.number().min(0).max(90).default(0),
  wellheadTempF: z.number(),
  bottomholeTempF: z.number(),
  waterCutPercent: z.number().min(0).max(100),
  gorScfStb: z.number().nonnegative(),
  oilApi: z.number().min(5).max(70),
  gasSg: z.number().positive(),
  waterSg: z.number().positive().default(1.02),
  numPoints: z.number().int().positive().default(20),
  maxRateBopd: z.number().positive().default(2000),
});

// Create VLP Analysis schema
export const createVlpAnalysisSchema = z.object({
  wellTestId: z.string().uuid().optional(),
  wellId: z.string().uuid(),
  correlation: vlpCorrelationSchema,
  tubingIdInches: z.number().positive(),
  tubingDepthFt: z.number().positive(),
  wellheadPressurePsi: z.number().positive(),
  deviationDegrees: z.number().min(0).max(90).default(0),
  roughnessInches: z.number().positive().default(0.0006),
  wellheadTempF: z.number().optional(),
  bottomholeTempF: z.number().optional(),
  waterCutPercent: z.number().min(0).max(100).optional(),
  gorScfStb: z.number().nonnegative().optional(),
  oilApi: z.number().min(5).max(70).optional(),
  gasSg: z.number().positive().optional(),
  waterSg: z.number().positive().default(1.02),
  vlpCurve: z.array(z.object({
    q: z.number(),
    pwf: z.number(),
  })).optional(),
  analyst: z.string().optional(),
  notes: z.string().optional(),
});

// Calculate Nodal Analysis schema
export const calculateNodalSchema = z.object({
  wellId: z.string().uuid(),
  ipr: calculateIprSchema,
  vlp: calculateVlpSchema,
});

// Create Nodal Analysis schema
export const createNodalAnalysisSchema = z.object({
  wellId: z.string().uuid(),
  iprAnalysisId: z.string().uuid().optional(),
  vlpAnalysisId: z.string().uuid().optional(),
  operatingRateBopd: z.number().positive().optional(),
  operatingPwfPsi: z.number().positive().optional(),
  maxRateBopd: z.number().positive().optional(),
  sensitivityResults: z.record(z.any()).optional(),
  recommendations: z.string().optional(),
  analyst: z.string().optional(),
});

// Type exports
export type CreateWellTestInput = z.infer<typeof createWellTestSchema>;
export type UpdateWellTestInput = z.infer<typeof updateWellTestSchema>;
export type ListWellTestsQuery = z.infer<typeof listWellTestsQuerySchema>;
export type CreateTestReadingInput = z.infer<typeof createTestReadingSchema>;
export type CalculateIprInput = z.infer<typeof calculateIprSchema>;
export type CreateIprAnalysisInput = z.infer<typeof createIprAnalysisSchema>;
export type CalculateVlpInput = z.infer<typeof calculateVlpSchema>;
export type CreateVlpAnalysisInput = z.infer<typeof createVlpAnalysisSchema>;
export type CalculateNodalInput = z.infer<typeof calculateNodalSchema>;
export type CreateNodalAnalysisInput = z.infer<typeof createNodalAnalysisSchema>;
