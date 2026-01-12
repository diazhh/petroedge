import { z } from 'zod';

// CT Unit Schema
export const ctUnitSchema = z.object({
  unit_number: z.string().min(1, 'Unit number is required'),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  status: z.enum(['active', 'maintenance', 'standby', 'out_of_service']),
  max_pressure_psi: z.number().positive('Max pressure must be positive'),
  max_flow_rate_bpm: z.number().positive('Max flow rate must be positive'),
  power_rating_hp: z.number().positive('Power rating must be positive'),
  injector_capacity_lbs: z.number().positive('Injector capacity must be positive'),
  current_location: z.string().optional(),
  last_maintenance_date: z.string().optional(),
  next_maintenance_date: z.string().optional(),
  notes: z.string().optional(),
});

// CT Reel Schema
export const ctReelSchema = z.object({
  reel_number: z.string().min(1, 'Reel number is required'),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  outer_diameter_in: z.number().positive('Outer diameter must be positive'),
  inner_diameter_in: z.number().positive('Inner diameter must be positive'),
  wall_thickness_in: z.number().positive('Wall thickness must be positive'),
  total_length_ft: z.number().positive('Total length must be positive'),
  material_grade: z.string().min(1, 'Material grade is required'),
  yield_strength_psi: z.number().positive('Yield strength must be positive'),
  tensile_strength_psi: z.number().positive('Tensile strength must be positive'),
  status: z.enum(['available', 'in_use', 'maintenance', 'retired']),
  current_unit_id: z.string().uuid().optional(),
  manufacture_date: z.string().optional(),
  last_inspection_date: z.string().optional(),
  next_inspection_date: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => data.inner_diameter_in < data.outer_diameter_in,
  {
    message: 'Inner diameter must be less than outer diameter',
    path: ['inner_diameter_in'],
  }
).refine(
  (data) => data.yield_strength_psi <= data.tensile_strength_psi,
  {
    message: 'Yield strength must be less than or equal to tensile strength',
    path: ['yield_strength_psi'],
  }
);

// CT Job Schema
export const ctJobSchema = z.object({
  job_number: z.string().min(1, 'Job number is required'),
  job_type: z.enum(['cleanout', 'drilling', 'fishing', 'logging', 'stimulation', 'other']),
  status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']),
  well_id: z.string().uuid().optional(),
  field_id: z.string().uuid().optional(),
  unit_id: z.string().uuid().optional(),
  reel_id: z.string().uuid().optional(),
  planned_start_date: z.string().optional(),
  planned_end_date: z.string().optional(),
  target_depth_ft: z.number().positive().optional(),
  objectives: z.string().optional(),
  notes: z.string().optional(),
});

// BHA Component Schema
export const bhaComponentSchema = z.object({
  component_type: z.enum(['motor', 'bit', 'jar', 'sub', 'tool', 'other']),
  sequence_order: z.number().int().positive(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  outer_diameter_in: z.number().positive().optional(),
  length_ft: z.number().positive().optional(),
  weight_lbs: z.number().positive().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

// Job Fluid Schema
export const jobFluidSchema = z.object({
  fluid_type: z.string().min(1, 'Fluid type is required'),
  density_ppg: z.number().positive('Density must be positive'),
  viscosity_cp: z.number().positive().optional(),
  volume_bbl: z.number().positive().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

// Job Operation Schema
export const jobOperationSchema = z.object({
  operation_type: z.string().min(1, 'Operation type is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().optional(),
  depth_ft: z.number().optional(),
  pressure_psi: z.number().optional(),
  weight_lbs: z.number().optional(),
  flow_rate_bpm: z.number().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

// Reel Section Schema
export const reelSectionSchema = z.object({
  section_number: z.number().int().positive(),
  start_depth_ft: z.number().min(0),
  end_depth_ft: z.number().positive(),
  length_ft: z.number().positive(),
  fatigue_percentage: z.number().min(0).max(100),
  runs_count: z.number().int().min(0),
  hours_count: z.number().min(0),
  is_cut: z.boolean(),
  cut_date: z.string().optional(),
  cut_reason: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => data.end_depth_ft > data.start_depth_ft,
  {
    message: 'End depth must be greater than start depth',
    path: ['end_depth_ft'],
  }
);

// Filters Schemas
export const ctUnitsFiltersSchema = z.object({
  status: z.enum(['active', 'maintenance', 'standby', 'out_of_service']).optional(),
  manufacturer: z.string().optional(),
  search: z.string().optional(),
});

export const ctReelsFiltersSchema = z.object({
  status: z.enum(['available', 'in_use', 'maintenance', 'retired']).optional(),
  manufacturer: z.string().optional(),
  unit_id: z.string().uuid().optional(),
  min_fatigue: z.number().min(0).max(100).optional(),
  max_fatigue: z.number().min(0).max(100).optional(),
  search: z.string().optional(),
});

export const ctJobsFiltersSchema = z.object({
  status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']).optional(),
  job_type: z.enum(['cleanout', 'drilling', 'fishing', 'logging', 'stimulation', 'other']).optional(),
  unit_id: z.string().uuid().optional(),
  reel_id: z.string().uuid().optional(),
  well_id: z.string().uuid().optional(),
  field_id: z.string().uuid().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  search: z.string().optional(),
});

// Export inferred types (these match the types in types/index.ts)
export type CtUnitSchemaType = z.infer<typeof ctUnitSchema>;
export type CtReelSchemaType = z.infer<typeof ctReelSchema>;
export type CtJobSchemaType = z.infer<typeof ctJobSchema>;
export type BhaComponentSchemaType = z.infer<typeof bhaComponentSchema>;
export type JobFluidSchemaType = z.infer<typeof jobFluidSchema>;
export type JobOperationSchemaType = z.infer<typeof jobOperationSchema>;
export type ReelSectionSchemaType = z.infer<typeof reelSectionSchema>;
