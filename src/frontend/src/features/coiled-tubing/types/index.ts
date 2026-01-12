// Coiled Tubing Types
export type CtUnitStatus = 'active' | 'maintenance' | 'standby' | 'out_of_service';
export type CtReelStatus = 'available' | 'in_use' | 'maintenance' | 'retired';
export type CtJobStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';
export type CtJobType = 'cleanout' | 'drilling' | 'fishing' | 'logging' | 'stimulation' | 'other';
export type BhaComponentType = 'motor' | 'bit' | 'jar' | 'sub' | 'tool' | 'other';

// CT Unit
export interface CtUnit {
  id: string;
  tenant_id: string;
  unit_number: string;
  manufacturer: string;
  model: string;
  year: number;
  status: CtUnitStatus;
  max_pressure_psi: number;
  max_flow_rate_bpm: number;
  power_rating_hp: number;
  injector_capacity_lbs: number;
  current_location?: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// CT Reel
export interface CtReel {
  id: string;
  tenant_id: string;
  reel_number: string;
  manufacturer: string;
  outer_diameter_in: number;
  inner_diameter_in: number;
  wall_thickness_in: number;
  total_length_ft: number;
  material_grade: string;
  yield_strength_psi: number;
  tensile_strength_psi: number;
  status: CtReelStatus;
  current_unit_id?: string;
  current_unit?: CtUnit;
  manufacture_date?: string;
  total_runs: number;
  total_hours: number;
  fatigue_percentage: number;
  last_inspection_date?: string;
  next_inspection_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// CT Reel Section
export interface CtReelSection {
  id: string;
  reel_id: string;
  section_number: number;
  start_depth_ft: number;
  end_depth_ft: number;
  length_ft: number;
  fatigue_percentage: number;
  runs_count: number;
  hours_count: number;
  is_cut: boolean;
  cut_date?: string;
  cut_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// CT Job
export interface CtJob {
  id: string;
  tenant_id: string;
  job_number: string;
  job_type: CtJobType;
  status: CtJobStatus;
  well_id?: string;
  field_id?: string;
  unit_id?: string;
  unit?: CtUnit;
  reel_id?: string;
  reel?: CtReel;
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  target_depth_ft?: number;
  max_depth_reached_ft?: number;
  max_pressure_psi?: number;
  max_weight_lbs?: number;
  total_fluid_pumped_bbl?: number;
  objectives?: string;
  results?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// BHA Component
export interface BhaComponent {
  id: string;
  job_id: string;
  component_type: BhaComponentType;
  sequence_order: number;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  outer_diameter_in?: number;
  length_ft?: number;
  weight_lbs?: number;
  description?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Job Fluid
export interface JobFluid {
  id: string;
  job_id: string;
  fluid_type: string;
  density_ppg: number;
  viscosity_cp?: number;
  volume_bbl?: number;
  description?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Job Operation
export interface JobOperation {
  id: string;
  job_id: string;
  operation_type: string;
  start_time: string;
  end_time?: string;
  depth_ft?: number;
  pressure_psi?: number;
  weight_lbs?: number;
  flow_rate_bpm?: number;
  description?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Job Calculation
export interface JobCalculation {
  id: string;
  job_id: string;
  calculation_type: string;
  input_parameters: Record<string, any>;
  output_results: Record<string, any>;
  calculated_at: string;
  calculated_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// API Response Types
export interface CtUnitsListResponse {
  success: boolean;
  data: CtUnit[];
  meta: {
    total: number;
    page: number;
    per_page: number;
  };
}

export interface CtReelsListResponse {
  success: boolean;
  data: CtReel[];
  meta: {
    total: number;
    page: number;
    per_page: number;
  };
}

export interface CtJobsListResponse {
  success: boolean;
  data: CtJob[];
  meta: {
    total: number;
    page: number;
    per_page: number;
  };
}

export interface CtUnitResponse {
  success: boolean;
  data: CtUnit;
}

export interface CtReelResponse {
  success: boolean;
  data: CtReel;
}

export interface CtJobResponse {
  success: boolean;
  data: CtJob;
}

// Form Types
export interface CtUnitFormData {
  unit_number: string;
  manufacturer: string;
  model: string;
  year: number;
  status: CtUnitStatus;
  max_pressure_psi: number;
  max_flow_rate_bpm: number;
  power_rating_hp: number;
  injector_capacity_lbs: number;
  current_location?: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  notes?: string;
}

export interface CtReelFormData {
  reel_number: string;
  manufacturer: string;
  outer_diameter_in: number;
  inner_diameter_in: number;
  wall_thickness_in: number;
  total_length_ft: number;
  material_grade: string;
  yield_strength_psi: number;
  tensile_strength_psi: number;
  status: CtReelStatus;
  current_unit_id?: string;
  manufacture_date?: string;
  last_inspection_date?: string;
  next_inspection_date?: string;
  notes?: string;
}

export interface CtJobFormData {
  job_number: string;
  job_type: CtJobType;
  status: CtJobStatus;
  well_id?: string;
  field_id?: string;
  unit_id?: string;
  reel_id?: string;
  planned_start_date?: string;
  planned_end_date?: string;
  target_depth_ft?: number;
  objectives?: string;
  notes?: string;
}

// Filter Types
export interface CtUnitsFilters {
  status?: CtUnitStatus;
  manufacturer?: string;
  search?: string;
}

export interface CtReelsFilters {
  status?: CtReelStatus;
  manufacturer?: string;
  unit_id?: string;
  min_fatigue?: number;
  max_fatigue?: number;
  search?: string;
}

export interface CtJobsFilters {
  status?: CtJobStatus;
  job_type?: CtJobType;
  unit_id?: string;
  reel_id?: string;
  well_id?: string;
  field_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}
