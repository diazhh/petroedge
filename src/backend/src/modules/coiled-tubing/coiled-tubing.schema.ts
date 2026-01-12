import { z } from 'zod';
import {
  CtUnitStatus,
  CtCertificationStatus,
  CtReelStatus,
  CtReelCondition,
  CtSteelGrade,
  CtJobStatus,
  CtJobType,
  CtOperationStatus,
  CtTicketStatus,
  CtFatigueCycleType,
  CtAlarmSeverity,
  CtAlarmStatus,
} from './coiled-tubing.types';

// ============================================================================
// CT UNITS SCHEMAS
// ============================================================================

export const createCtUnitSchema = z.object({
  unitNumber: z.string().min(1).max(50),
  manufacturer: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  yearManufactured: z.number().int().min(1900).max(2100).optional(),
  injectorCapacityLbs: z.number().int().positive(),
  maxSpeedFtMin: z.number().int().positive().optional(),
  pumpHp: z.number().int().positive().optional(),
  maxPressurePsi: z.number().int().positive().optional(),
  maxFlowRateBpm: z.number().positive().optional(),
  location: z.string().max(200).optional(),
});

export const updateCtUnitSchema = z.object({
  manufacturer: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  yearManufactured: z.number().int().min(1900).max(2100).optional(),
  injectorCapacityLbs: z.number().int().positive().optional(),
  maxSpeedFtMin: z.number().int().positive().optional(),
  pumpHp: z.number().int().positive().optional(),
  maxPressurePsi: z.number().int().positive().optional(),
  maxFlowRateBpm: z.number().positive().optional(),
  status: z.nativeEnum(CtUnitStatus).optional(),
  location: z.string().max(200).optional(),
  lastInspectionDate: z.coerce.date().optional(),
  nextInspectionDate: z.coerce.date().optional(),
  certificationStatus: z.nativeEnum(CtCertificationStatus).optional(),
});

// ============================================================================
// CT REELS SCHEMAS
// ============================================================================

export const createCtReelSchema = z.object({
  reelNumber: z.string().min(1).max(50),
  serialNumber: z.string().max(100).optional(),
  manufacturer: z.string().max(100).optional(),
  ctUnitId: z.string().uuid().optional(),
  outerDiameterIn: z.number().positive(),
  wallThicknessIn: z.number().positive(),
  innerDiameterIn: z.number().positive(),
  steelGrade: z.nativeEnum(CtSteelGrade),
  yieldStrengthPsi: z.number().int().positive(),
  totalLengthFt: z.number().int().positive(),
  usableLengthFt: z.number().int().positive(),
  weightPerFtLbs: z.number().positive().optional(),
  manufactureDate: z.coerce.date().optional(),
});

export const updateCtReelSchema = z.object({
  serialNumber: z.string().max(100).optional(),
  manufacturer: z.string().max(100).optional(),
  ctUnitId: z.string().uuid().nullable().optional(),
  usableLengthFt: z.number().int().positive().optional(),
  weightPerFtLbs: z.number().positive().optional(),
  fatiguePercentage: z.number().min(0).max(100).optional(),
  status: z.nativeEnum(CtReelStatus).optional(),
  condition: z.nativeEnum(CtReelCondition).optional(),
  lastCutDate: z.coerce.date().optional(),
  cutHistoryFt: z.number().int().min(0).optional(),
});

// ============================================================================
// CT REEL SECTIONS SCHEMAS
// ============================================================================

export const createCtReelSectionSchema = z.object({
  ctReelId: z.string().uuid(),
  sectionNumber: z.number().int().positive(),
  startDepthFt: z.number().int().min(0),
  endDepthFt: z.number().int().positive(),
  lengthFt: z.number().int().positive(),
  fatiguePercentage: z.number().min(0).max(100).default(0),
  totalCycles: z.number().int().min(0).default(0),
});

export const updateCtReelSectionSchema = z.object({
  fatiguePercentage: z.number().min(0).max(100).optional(),
  totalCycles: z.number().int().min(0).optional(),
  status: z.enum(['ACTIVE', 'WARNING', 'CRITICAL', 'CUT']).optional(),
  lastCycleDate: z.coerce.date().optional(),
});

// ============================================================================
// CT JOBS SCHEMAS
// ============================================================================

export const createCtJobSchema = z.object({
  jobNumber: z.string().min(1).max(50),
  jobType: z.nativeEnum(CtJobType),
  wellId: z.string().uuid(),
  ctUnitId: z.string().uuid(),
  ctReelId: z.string().uuid(),
  plannedStartDate: z.coerce.date(),
  plannedEndDate: z.coerce.date().optional(),
  objective: z.string().max(500).optional(),
  wellDepthFt: z.number().int().positive().optional(),
  targetDepthFt: z.number().int().positive().optional(),
  estimatedDurationHours: z.number().positive().optional(),
});

export const updateCtJobSchema = z.object({
  jobType: z.nativeEnum(CtJobType).optional(),
  status: z.nativeEnum(CtJobStatus).optional(),
  plannedStartDate: z.coerce.date().optional(),
  plannedEndDate: z.coerce.date().optional(),
  actualStartDate: z.coerce.date().optional(),
  actualEndDate: z.coerce.date().optional(),
  objective: z.string().max(500).optional(),
  wellDepthFt: z.number().int().positive().optional(),
  targetDepthFt: z.number().int().positive().optional(),
  maxDepthReachedFt: z.number().int().min(0).optional(),
  totalPumpedBbl: z.number().min(0).optional(),
  totalCyclesFt: z.number().min(0).optional(),
  estimatedDurationHours: z.number().positive().optional(),
  actualDurationHours: z.number().positive().optional(),
});

// ============================================================================
// CT JOB OPERATIONS SCHEMAS
// ============================================================================

export const createCtJobOperationSchema = z.object({
  ctJobId: z.string().uuid(),
  operationNumber: z.number().int().positive(),
  operationType: z.string().max(100),
  description: z.string().max(500).optional(),
  startTime: z.coerce.date(),
  depthFt: z.number().int().min(0).optional(),
  speedFtMin: z.number().positive().optional(),
  weightLbs: z.number().positive().optional(),
  pressurePsi: z.number().positive().optional(),
  flowRateBpm: z.number().positive().optional(),
});

export const updateCtJobOperationSchema = z.object({
  endTime: z.coerce.date().optional(),
  status: z.nativeEnum(CtOperationStatus).optional(),
  depthFt: z.number().int().min(0).optional(),
  speedFtMin: z.number().positive().optional(),
  weightLbs: z.number().positive().optional(),
  pressurePsi: z.number().positive().optional(),
  flowRateBpm: z.number().positive().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// CT JOB FLUIDS SCHEMAS
// ============================================================================

export const createCtJobFluidSchema = z.object({
  ctJobId: z.string().uuid(),
  fluidType: z.string().max(100),
  volumeBbl: z.number().positive(),
  densityPpg: z.number().positive().optional(),
  viscosityCp: z.number().positive().optional(),
  pumpedAt: z.coerce.date().optional(),
});

export const updateCtJobFluidSchema = z.object({
  volumeBbl: z.number().positive().optional(),
  densityPpg: z.number().positive().optional(),
  viscosityCp: z.number().positive().optional(),
  pumpedAt: z.coerce.date().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// CT JOB BHA SCHEMAS
// ============================================================================

export const createCtJobBhaSchema = z.object({
  ctJobId: z.string().uuid(),
  bhaNumber: z.string().max(50),
  totalLengthFt: z.number().positive(),
  totalWeightLbs: z.number().positive().optional(),
  configuration: z.string().optional(),
});

export const updateCtJobBhaSchema = z.object({
  bhaNumber: z.string().max(50).optional(),
  totalLengthFt: z.number().positive().optional(),
  totalWeightLbs: z.number().positive().optional(),
  configuration: z.string().optional(),
});

// ============================================================================
// CT BHA COMPONENTS SCHEMAS
// ============================================================================

export const createCtBhaComponentSchema = z.object({
  ctJobBhaId: z.string().uuid(),
  sequenceNumber: z.number().int().positive(),
  componentType: z.string().max(100),
  manufacturer: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  lengthFt: z.number().positive(),
  outerDiameterIn: z.number().positive(),
  innerDiameterIn: z.number().positive().optional(),
  weightLbs: z.number().positive().optional(),
});

export const updateCtBhaComponentSchema = z.object({
  sequenceNumber: z.number().int().positive().optional(),
  componentType: z.string().max(100).optional(),
  manufacturer: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  lengthFt: z.number().positive().optional(),
  outerDiameterIn: z.number().positive().optional(),
  innerDiameterIn: z.number().positive().optional(),
  weightLbs: z.number().positive().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// CT JOB TICKETS SCHEMAS
// ============================================================================

export const createCtJobTicketSchema = z.object({
  ctJobId: z.string().uuid(),
  ticketNumber: z.string().max(50),
  generatedAt: z.coerce.date().optional(),
  operatorSignature: z.string().optional(),
  supervisorSignature: z.string().optional(),
  clientSignature: z.string().optional(),
  operatorSignedAt: z.coerce.date().optional(),
  supervisorSignedAt: z.coerce.date().optional(),
  clientSignedAt: z.coerce.date().optional(),
});

export const updateCtJobTicketSchema = z.object({
  status: z.nativeEnum(CtTicketStatus).optional(),
  operatorSignature: z.string().optional(),
  supervisorSignature: z.string().optional(),
  clientSignature: z.string().optional(),
  operatorSignedAt: z.coerce.date().optional(),
  supervisorSignedAt: z.coerce.date().optional(),
  clientSignedAt: z.coerce.date().optional(),
  pdfUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// CT FATIGUE CYCLES SCHEMAS
// ============================================================================

export const createCtFatigueCycleSchema = z.object({
  ctReelId: z.string().uuid(),
  ctReelSectionId: z.string().uuid().optional(),
  ctJobId: z.string().uuid().optional(),
  cycleType: z.nativeEnum(CtFatigueCycleType),
  cycleDate: z.coerce.date(),
  depthFt: z.number().int().min(0),
  bendRadiusIn: z.number().positive().optional(),
  tensionLbs: z.number().positive().optional(),
  pressurePsi: z.number().positive().optional(),
  fatigueIncrement: z.number().min(0).max(100),
});

// ============================================================================
// CT ALARMS SCHEMAS
// ============================================================================

export const createCtAlarmSchema = z.object({
  ctJobId: z.string().uuid(),
  alarmType: z.string().max(100),
  severity: z.nativeEnum(CtAlarmSeverity),
  message: z.string().max(500),
  triggeredAt: z.coerce.date(),
  currentValue: z.number().optional(),
  thresholdValue: z.number().optional(),
});

export const updateCtAlarmSchema = z.object({
  status: z.nativeEnum(CtAlarmStatus).optional(),
  acknowledgedAt: z.coerce.date().optional(),
  acknowledgedBy: z.string().uuid().optional(),
  resolvedAt: z.coerce.date().optional(),
  resolvedBy: z.string().uuid().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// CT REALTIME DATA SCHEMAS
// ============================================================================

export const createCtRealtimeDataSchema = z.object({
  ctJobId: z.string().uuid(),
  timestamp: z.coerce.date(),
  depthFt: z.number().optional(),
  speedFtMin: z.number().optional(),
  weightLbs: z.number().optional(),
  tensionLbs: z.number().optional(),
  pressurePsi: z.number().optional(),
  flowRateBpm: z.number().optional(),
  pumpPressurePsi: z.number().optional(),
  injectorPressurePsi: z.number().optional(),
  reelRotationRpm: z.number().optional(),
  reelTensionLbs: z.number().optional(),
});

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

export const ctUnitQuerySchema = z.object({
  status: z.nativeEnum(CtUnitStatus).optional(),
  location: z.string().optional(),
  certificationStatus: z.nativeEnum(CtCertificationStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export const ctReelQuerySchema = z.object({
  ctUnitId: z.string().uuid().optional(),
  status: z.nativeEnum(CtReelStatus).optional(),
  condition: z.nativeEnum(CtReelCondition).optional(),
  steelGrade: z.nativeEnum(CtSteelGrade).optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export const ctJobQuerySchema = z.object({
  ctUnitId: z.string().uuid().optional(),
  ctReelId: z.string().uuid().optional(),
  wellId: z.string().uuid().optional(),
  status: z.nativeEnum(CtJobStatus).optional(),
  jobType: z.nativeEnum(CtJobType).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

// Type exports
export type CreateCtUnitInput = z.infer<typeof createCtUnitSchema>;
export type UpdateCtUnitInput = z.infer<typeof updateCtUnitSchema>;
export type CreateCtReelInput = z.infer<typeof createCtReelSchema>;
export type UpdateCtReelInput = z.infer<typeof updateCtReelSchema>;
export type CreateCtReelSectionInput = z.infer<typeof createCtReelSectionSchema>;
export type UpdateCtReelSectionInput = z.infer<typeof updateCtReelSectionSchema>;
export type CreateCtJobInput = z.infer<typeof createCtJobSchema>;
export type UpdateCtJobInput = z.infer<typeof updateCtJobSchema>;
export type CreateCtJobOperationInput = z.infer<typeof createCtJobOperationSchema>;
export type UpdateCtJobOperationInput = z.infer<typeof updateCtJobOperationSchema>;
export type CreateCtJobFluidInput = z.infer<typeof createCtJobFluidSchema>;
export type UpdateCtJobFluidInput = z.infer<typeof updateCtJobFluidSchema>;
export type CreateCtJobBhaInput = z.infer<typeof createCtJobBhaSchema>;
export type UpdateCtJobBhaInput = z.infer<typeof updateCtJobBhaSchema>;
export type CreateCtBhaComponentInput = z.infer<typeof createCtBhaComponentSchema>;
export type UpdateCtBhaComponentInput = z.infer<typeof updateCtBhaComponentSchema>;
export type CreateCtJobTicketInput = z.infer<typeof createCtJobTicketSchema>;
export type UpdateCtJobTicketInput = z.infer<typeof updateCtJobTicketSchema>;
export type CreateCtFatigueCycleInput = z.infer<typeof createCtFatigueCycleSchema>;
export type CreateCtAlarmInput = z.infer<typeof createCtAlarmSchema>;
export type UpdateCtAlarmInput = z.infer<typeof updateCtAlarmSchema>;
export type CreateCtRealtimeDataInput = z.infer<typeof createCtRealtimeDataSchema>;
export type CtUnitQuery = z.infer<typeof ctUnitQuerySchema>;
export type CtReelQuery = z.infer<typeof ctReelQuerySchema>;
export type CtJobQuery = z.infer<typeof ctJobQuerySchema>;
