// Enums - Valores en MAYÚSCULAS para coincidir con backend PostgreSQL enums
export enum BasinType {
  FORELAND = 'FORELAND',
  RIFT = 'RIFT',
  PASSIVE_MARGIN = 'PASSIVE_MARGIN',
  INTRACRATONIC = 'INTRACRATONIC',
  FOREARC = 'FOREARC',
  SEDIMENTARY = 'SEDIMENTARY',
  STRUCTURAL = 'STRUCTURAL'
}

export enum FieldStatus {
  PRODUCING = 'PRODUCING',
  DEVELOPING = 'DEVELOPING',
  ABANDONED = 'ABANDONED',
  EXPLORATION = 'EXPLORATION',
  DEVELOPMENT = 'DEVELOPMENT',
  PRODUCTION = 'PRODUCTION',
  MATURE = 'MATURE',
  DEPLETED = 'DEPLETED'
}

export enum FieldType {
  ONSHORE = 'ONSHORE',
  OFFSHORE_SHALLOW = 'OFFSHORE_SHALLOW',
  OFFSHORE_DEEP = 'OFFSHORE_DEEP',
  UNCONVENTIONAL = 'UNCONVENTIONAL'
}

export enum Lithology {
  SANDSTONE = 'SANDSTONE',
  CARBONATE = 'CARBONATE',
  LIMESTONE = 'LIMESTONE',
  DOLOMITE = 'DOLOMITE',
  SHALE = 'SHALE',
  CONGLOMERATE = 'CONGLOMERATE',
  FRACTURED = 'FRACTURED',
  MIXED = 'MIXED'
}

export enum FluidType {
  BLACK_OIL = 'BLACK_OIL',
  VOLATILE_OIL = 'VOLATILE_OIL',
  RETROGRADE_GAS = 'RETROGRADE_GAS',
  WET_GAS = 'WET_GAS',
  DRY_GAS = 'DRY_GAS',
  OIL = 'OIL',
  GAS = 'GAS',
  CONDENSATE = 'CONDENSATE',
  WATER = 'WATER',
  MIXED = 'MIXED'
}

export enum DriveMechanism {
  SOLUTION_GAS = 'SOLUTION_GAS',
  GAS_CAP = 'GAS_CAP',
  WATER_DRIVE = 'WATER_DRIVE',
  GRAVITY_DRAINAGE = 'GRAVITY_DRAINAGE',
  COMBINATION = 'COMBINATION'
}

export enum WellType {
  PRODUCER = 'PRODUCER',
  INJECTOR = 'INJECTOR',
  OBSERVATION = 'OBSERVATION',
  DISPOSAL = 'DISPOSAL'
}

export enum WellStatus {
  PRODUCING = 'PRODUCING',
  INJECTING = 'INJECTING',
  SHUT_IN = 'SHUT_IN',
  ABANDONED = 'ABANDONED',
  DRILLING = 'DRILLING',
  SUSPENDED = 'SUSPENDED'
}

export enum LiftMethod {
  FLOWING = 'FLOWING',
  ESP = 'ESP',
  GAS_LIFT = 'GAS_LIFT',
  SUCKER_ROD = 'SUCKER_ROD',
  PCP = 'PCP',
  PLUNGER_LIFT = 'PLUNGER_LIFT',
  HYDRAULIC_PUMP = 'HYDRAULIC_PUMP'
}

// Interfaces
export interface Basin {
  id: string;
  tenantId: string;
  name: string;
  type: BasinType;
  basinType?: BasinType;
  country?: string;
  region?: string;
  area_km2?: number;
  areaKm2?: string;
  geological_age?: string;
  age?: string;
  tectonicSetting?: string;
  minLatitude?: string;
  maxLatitude?: string;
  minLongitude?: string;
  maxLongitude?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Field {
  id: string;
  tenantId: string;
  basin_id?: string;
  basinId?: string;
  name: string;
  fieldName: string;
  fieldCode?: string;
  fieldType?: string;
  status: FieldStatus;
  operator?: string;
  discovery_date?: string;
  discoveryDate?: string;
  firstProductionDate?: string;
  area_km2?: number;
  areaAcres?: string;
  latitude?: number;
  longitude?: number;
  centerLatitude?: string;
  centerLongitude?: string;
  totalWells?: number;
  activeWells?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  basin?: Basin;
}

export interface Reservoir {
  id: string;
  tenantId: string;
  field_id: string;
  fieldId: string;
  name: string;
  reservoirName: string;
  reservoirCode?: string;
  formation: string;
  formationName: string;
  formationAge?: string;
  lithology: Lithology;
  fluid_type?: FluidType;
  fluidType?: FluidType;
  driveMechanism?: DriveMechanism;
  depth_top_m?: number;
  depth_bottom_m?: number;
  thickness_m?: number;
  topDepthTvdFt?: string;
  bottomDepthTvdFt?: string;
  avgNetPayFt?: string;
  porosity_percent?: number;
  avgPorosity?: string;
  permeability_md?: number;
  avgPermeabilityMd?: string;
  avgWaterSaturation?: string;
  netToGross?: string;
  areaAcres?: string;
  bulkVolumeAcreFt?: string;
  temperature_c?: number;
  pressure_psi?: number;
  initialPressurePsi?: string;
  currentPressurePsi?: string;
  reservoirTemperatureF?: string;
  pressureGradientPsiFt?: string;
  owcDepthTvdFt?: string;
  gocDepthTvdFt?: string;
  ooipMmstb?: string;
  ogipBcf?: string;
  recoveryFactor?: string;
  oil_api?: number;
  gas_gravity?: number;
  water_salinity_ppm?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  field?: Field;
}

export interface Well {
  id: string;
  tenantId: string;
  fieldId: string;
  reservoir_id?: string;
  primaryReservoirId: string;
  name: string;
  wellName: string;
  wellCode?: string;
  api_number?: string;
  apiNumber?: string;
  type: WellType;
  wellType: WellType;
  status: WellStatus;
  liftMethod?: LiftMethod;
  spud_date?: string;
  completion_date?: string;
  measured_depth_m?: number;
  true_vertical_depth_m?: number;
  latitude?: number;
  longitude?: number;
  surface_elevation_m?: number;
  surfaceLatitude?: string;
  surfaceLongitude?: string;
  surfaceElevationFt?: string;
  totalDepthMdFt?: string;
  totalDepthTvdFt?: string;
  spudDate?: string;
  completionDate?: string;
  firstProductionDate?: string;
  abandonmentDate?: string;
  tubingSize?: string;
  casingSize?: string;
  currentOilRateBopd?: string;
  currentGasRateMscfd?: string;
  currentWaterRateBwpd?: string;
  cumulativeOilMbbl?: string;
  cumulativeGasMmscf?: string;
  cumulativeWaterMbbl?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  field?: Field;
  reservoir?: Reservoir;
}

// Create/Update DTOs
export interface CreateBasinDTO {
  name: string;
  type: BasinType;
  country: string;
  region?: string;
  area_km2?: number;
  description?: string;
  geological_age?: string;
}

export interface UpdateBasinDTO extends Partial<CreateBasinDTO> {}

export interface CreateFieldDTO {
  basin_id: string;
  name: string;
  status: FieldStatus;
  discovery_date?: string;
  area_km2?: number;
  latitude?: number;
  longitude?: number;
  description?: string;
  operator?: string;
}

export interface UpdateFieldDTO extends Partial<CreateFieldDTO> {}

export interface CreateReservoirDTO {
  field_id: string;
  name: string;
  formation: string;
  lithology: Lithology;
  depth_top_m?: number;
  depth_bottom_m?: number;
  thickness_m?: number;
  porosity_percent?: number;
  permeability_md?: number;
  temperature_c?: number;
  pressure_psi?: number;
  fluid_type?: FluidType;
  oil_api?: number;
  gas_gravity?: number;
  water_salinity_ppm?: number;
}

export interface UpdateReservoirDTO extends Partial<CreateReservoirDTO> {}

export interface CreateWellDTO {
  reservoir_id: string;
  name: string;
  api_number?: string;
  type: WellType;
  status: WellStatus;
  spud_date?: string;
  completion_date?: string;
  measured_depth_m?: number;
  true_vertical_depth_m?: number;
  latitude?: number;
  longitude?: number;
  surface_elevation_m?: number;
}

export interface UpdateWellDTO extends Partial<CreateWellDTO> {}

// API Response types
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

export interface SingleResponse<T> {
  success: boolean;
  data: T;
}

// Wells API devuelve estructura anidada
export interface WellWithRelations {
  well: Well;
  field: {
    id: string;
    fieldName: string;
    fieldCode: string;
  };
  reservoir: {
    id: string;
    reservoirName: string;
    reservoirCode: string;
  };
}
