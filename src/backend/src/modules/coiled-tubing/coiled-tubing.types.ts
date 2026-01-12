import type {
  CtUnit,
  NewCtUnit,
  CtReel,
  NewCtReel,
  CtReelSection,
  NewCtReelSection,
  CtJob,
  NewCtJob,
  CtJobOperation,
  NewCtJobOperation,
  CtJobFluid,
  NewCtJobFluid,
  CtJobBha,
  NewCtJobBha,
  CtBhaComponent,
  NewCtBhaComponent,
  CtJobTicket,
  NewCtJobTicket,
  CtFatigueCycle,
  NewCtFatigueCycle,
  CtAlarm,
  NewCtAlarm,
  CtRealtimeData,
  NewCtRealtimeData,
} from '../../common/database/schema';

// Re-export database types
export type {
  CtUnit,
  NewCtUnit,
  CtReel,
  NewCtReel,
  CtReelSection,
  NewCtReelSection,
  CtJob,
  NewCtJob,
  CtJobOperation,
  NewCtJobOperation,
  CtJobFluid,
  NewCtJobFluid,
  CtJobBha,
  NewCtJobBha,
  CtBhaComponent,
  NewCtBhaComponent,
  CtJobTicket,
  NewCtJobTicket,
  CtFatigueCycle,
  NewCtFatigueCycle,
  CtAlarm,
  NewCtAlarm,
  CtRealtimeData,
  NewCtRealtimeData,
};

// Enums
export enum CtUnitStatus {
  AVAILABLE = 'AVAILABLE',
  IN_SERVICE = 'IN_SERVICE',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

export enum CtCertificationStatus {
  VALID = 'VALID',
  EXPIRED = 'EXPIRED',
  PENDING = 'PENDING',
}

export enum CtReelStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE',
  RETIRED = 'RETIRED',
}

export enum CtReelCondition {
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR',
  CRITICAL = 'CRITICAL',
}

export enum CtSteelGrade {
  CT70 = 'CT70',
  CT80 = 'CT80',
  CT90 = 'CT90',
  CT100 = 'CT100',
  CT110 = 'CT110',
}

export enum CtSectionStatus {
  ACTIVE = 'ACTIVE',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  CUT = 'CUT',
}

export enum CtJobStatus {
  DRAFT = 'DRAFT',
  PLANNED = 'PLANNED',
  APPROVED = 'APPROVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  SUSPENDED = 'SUSPENDED',
}

export enum CtJobType {
  CLN = 'CLN', // Cleanout
  N2L = 'N2L', // Nitrogen Lift
  ACT = 'ACT', // Acid Treatment
  CMS = 'CMS', // Cement Squeeze
  FSH = 'FSH', // Fishing
  LOG = 'LOG', // Logging
  PER = 'PER', // Perforation
  MIL = 'MIL', // Milling
  CTD = 'CTD', // CT Drilling
}

export enum CtOperationStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ABORTED = 'ABORTED',
}

export enum CtTicketStatus {
  DRAFT = 'DRAFT',
  PENDING_SIGNATURES = 'PENDING_SIGNATURES',
  COMPLETED = 'COMPLETED',
}

export enum CtFatigueCycleType {
  BENDING = 'BENDING',
  PRESSURE = 'PRESSURE',
  COMBINED = 'COMBINED',
}

export enum CtAlarmSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum CtAlarmStatus {
  ACTIVE = 'ACTIVE',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED',
}

// Extended types with relations
export interface CtUnitWithRelations extends CtUnit {
  reels?: CtReel[];
  jobs?: CtJob[];
  currentJob?: CtJob | null;
}

export interface CtReelWithRelations extends CtReel {
  ctUnit?: CtUnit | null;
  sections?: CtReelSection[];
  jobs?: CtJob[];
}

export interface CtJobWithRelations extends CtJob {
  ctUnit?: CtUnit | null;
  ctReel?: CtReel | null;
  operations?: CtJobOperation[];
  fluids?: CtJobFluid[];
  bha?: CtJobBha | null;
  ticket?: CtJobTicket | null;
  alarms?: CtAlarm[];
}

// DTOs for API requests/responses
export interface CreateCtUnitDto {
  unitNumber: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  yearManufactured?: number;
  injectorCapacityLbs: number;
  maxSpeedFtMin?: number;
  pumpHp?: number;
  maxPressurePsi?: number;
  maxFlowRateBpm?: number;
  location?: string;
}

export interface UpdateCtUnitDto {
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  yearManufactured?: number;
  injectorCapacityLbs?: number;
  maxSpeedFtMin?: number;
  pumpHp?: number;
  maxPressurePsi?: number;
  maxFlowRateBpm?: number;
  status?: CtUnitStatus;
  location?: string;
  lastInspectionDate?: Date;
  nextInspectionDate?: Date;
  certificationStatus?: CtCertificationStatus;
}

export interface CreateCtReelDto {
  reelNumber: string;
  serialNumber?: string;
  manufacturer?: string;
  ctUnitId?: string;
  outerDiameterIn: number;
  wallThicknessIn: number;
  innerDiameterIn: number;
  steelGrade: CtSteelGrade;
  yieldStrengthPsi: number;
  totalLengthFt: number;
  usableLengthFt: number;
  weightPerFtLbs?: number;
  manufactureDate?: Date;
}

export interface UpdateCtReelDto {
  serialNumber?: string;
  manufacturer?: string;
  ctUnitId?: string;
  usableLengthFt?: number;
  weightPerFtLbs?: number;
  fatiguePercentage?: number;
  status?: CtReelStatus;
  condition?: CtReelCondition;
  lastCutDate?: Date;
  cutHistoryFt?: number;
}

export interface CreateCtJobDto {
  jobNumber: string;
  jobType: CtJobType;
  wellId?: string; // Ditto thingId
  fieldId?: string; // Ditto thingId
  ctUnitId?: string;
  ctReelId?: string;
  clientName?: string;
  clientContact?: string;
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  estimatedDurationHours?: number;
  plannedDepthFt?: number;
  objectives?: string;
  estimatedCost?: number;
}

export interface UpdateCtJobDto {
  jobType?: CtJobType;
  wellId?: string;
  fieldId?: string;
  ctUnitId?: string;
  ctReelId?: string;
  clientName?: string;
  clientContact?: string;
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  estimatedDurationHours?: number;
  actualStartDate?: Date;
  actualEndDate?: Date;
  actualDurationHours?: number;
  plannedDepthFt?: number;
  maxDepthReachedFt?: number;
  tagDepthFt?: number;
  status?: CtJobStatus;
  objectives?: string;
  results?: string;
  observations?: string;
  nptHours?: number;
  nptReason?: string;
  actualCost?: number;
  hseIncidents?: number;
  safetyObservations?: string;
}

export interface CreateCtJobOperationDto {
  jobId: string;
  sequenceNumber: number;
  operationType: string;
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number;
  startDepthFt?: number;
  endDepthFt?: number;
  maxWeightLbs?: number;
  maxPressurePsi?: number;
  pumpRateBpm?: number;
  description?: string;
  observations?: string;
}

export interface CreateCtJobFluidDto {
  jobId: string;
  sequenceNumber: number;
  fluidType: string;
  fluidName?: string;
  densityPpg?: number;
  viscosityCp?: number;
  plannedVolumeBbl?: number;
  actualVolumeBbl?: number;
  pumpRateBpm?: number;
  pumpPressurePsi?: number;
  startTime?: Date;
  endTime?: Date;
  observations?: string;
}

// Calculation DTOs
export interface FatigueCalculationRequest {
  reelId: string;
  sectionId?: string;
  cycleType: CtFatigueCycleType;
  maxStrain?: number;
  maxPressurePsi?: number;
  guideRadiusIn?: number;
  cyclesApplied?: number;
}

export interface FatigueCalculationResult {
  cyclesToFailure: number;
  damageRatio: number;
  fatiguePercentage: number;
  recommendation: string;
}

export interface BucklingCalculationRequest {
  reelId: string;
  depthFt: number;
  inclinationDeg: number;
  holeDiameterIn: number;
  fluidDensityPpg: number;
  surfaceWeightLbs: number;
}

export interface BucklingCalculationResult {
  criticalBucklingForce: number;
  helicalBucklingForce: number;
  lockupDepth: number;
  safetyFactor: number;
  status: 'SAFE' | 'WARNING' | 'CRITICAL';
}

export interface HydraulicCalculationRequest {
  reelId: string;
  depthFt: number;
  flowRateBpm: number;
  fluidDensityPpg: number;
  fluidViscosityCp: number;
}

export interface HydraulicCalculationResult {
  frictionPressureLoss: number;
  hydrostaticPressure: number;
  totalPressure: number;
  reynoldsNumber: number;
  flowRegime: 'LAMINAR' | 'TURBULENT';
  annularVelocity: number;
}

// Query filters
export interface CtUnitFilters {
  status?: CtUnitStatus;
  location?: string;
  certificationStatus?: CtCertificationStatus;
}

export interface CtReelFilters {
  status?: CtReelStatus;
  condition?: CtReelCondition;
  steelGrade?: CtSteelGrade;
  ctUnitId?: string;
  minFatigue?: number;
  maxFatigue?: number;
}

export interface CtJobFilters {
  status?: CtJobStatus;
  jobType?: CtJobType;
  wellId?: string;
  fieldId?: string;
  ctUnitId?: string;
  ctReelId?: string;
  startDate?: Date;
  endDate?: Date;
}

// Pagination
export interface PaginationParams {
  page?: number;
  perPage?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}
