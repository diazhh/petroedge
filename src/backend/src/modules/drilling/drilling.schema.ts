import { pgTable, uuid, varchar, decimal, integer, text, timestamp, boolean, jsonb, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { wells, tenants, users } from '../../common/database/schema';

// ============================================================================
// ENUMS
// ============================================================================

export const planStatusEnum = pgEnum('plan_status', [
  'DRAFT',
  'REVIEW',
  'APPROVED',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED'
]);

export const wellTypeEnum = pgEnum('well_type_drilling', [
  'VERTICAL',
  'DIRECTIONAL',
  'HORIZONTAL',
  'ERD',
  'MULTILATERAL'
]);

export const wellPurposeEnum = pgEnum('well_purpose', [
  'EXPLORATION',
  'DEVELOPMENT',
  'INFILL',
  'WORKOVER',
  'APPRAISAL'
]);

export const trajectoryTypeEnum = pgEnum('trajectory_type', [
  'PLANNED',
  'ACTUAL',
  'PROPOSED'
]);

export const casingStringEnum = pgEnum('casing_string', [
  'CONDUCTOR',
  'SURFACE',
  'INTERMEDIATE',
  'PRODUCTION',
  'LINER'
]);

export const casingStatusEnum = pgEnum('casing_status', [
  'PLANNED',
  'SET',
  'CEMENTED',
  'TESTED',
  'FAILED'
]);

export const mudTypeEnum = pgEnum('mud_type', [
  'WBM',
  'OBM',
  'SBM',
  'FOAM',
  'AIR'
]);

export const bhaStatusEnum = pgEnum('bha_status', [
  'PLANNED',
  'ACTIVE',
  'COMPLETED',
  'FAILED'
]);

export const rigStateEnum = pgEnum('rig_state', [
  'DRILLING',
  'CIRCULATING',
  'TRIPPING_IN',
  'TRIPPING_OUT',
  'CONNECTION',
  'REAMING',
  'BACKREAMING',
  'CASING',
  'CEMENTING',
  'LOGGING',
  'TESTING',
  'WAITING',
  'RIG_REPAIR',
  'NPT'
]);

export const ddrStatusEnum = pgEnum('ddr_status', [
  'DRAFT',
  'SUBMITTED',
  'APPROVED'
]);

// ============================================================================
// WELL PLANS
// ============================================================================

export const wellPlans = pgTable('well_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  wellId: uuid('well_id').notNull().references(() => wells.id),
  rigId: uuid('rig_id'),
  
  // Identificación
  planName: varchar('plan_name', { length: 100 }).notNull(),
  planVersion: integer('plan_version').default(1),
  planStatus: planStatusEnum('plan_status').default('DRAFT'),
  
  // Tipo de pozo
  wellType: wellTypeEnum('well_type'),
  wellPurpose: wellPurposeEnum('well_purpose'),
  
  // Profundidades objetivo
  plannedTdMdFt: decimal('planned_td_md_ft', { precision: 10, scale: 2 }),
  plannedTdTvdFt: decimal('planned_td_tvd_ft', { precision: 10, scale: 2 }),
  
  // Fechas planificadas
  spudDatePlanned: timestamp('spud_date_planned'),
  tdDatePlanned: timestamp('td_date_planned'),
  daysPlanned: integer('days_planned'),
  
  // Costos estimados
  afeNumber: varchar('afe_number', { length: 50 }),
  estimatedCostUsd: decimal('estimated_cost_usd', { precision: 15, scale: 2 }),
  
  // Aprobaciones
  preparedBy: uuid('prepared_by').references(() => users.id),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  
  // Metadatos
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  wellIdx: index('idx_well_plans_well').on(table.wellId),
  statusIdx: index('idx_well_plans_status').on(table.planStatus)
}));

// ============================================================================
// TRAJECTORIES
// ============================================================================

export const trajectories = pgTable('trajectories', {
  id: uuid('id').primaryKey().defaultRandom(),
  wellPlanId: uuid('well_plan_id').notNull().references(() => wellPlans.id, { onDelete: 'cascade' }),
  
  // Tipo
  trajectoryType: trajectoryTypeEnum('trajectory_type').notNull(),
  
  // Configuración del diseño
  designMethod: varchar('design_method', { length: 30 }), // MINIMUM_CURVATURE, RADIUS_OF_CURVATURE
  
  // Parámetros de construcción
  kopMdFt: decimal('kop_md_ft', { precision: 10, scale: 2 }),
  kopTvdFt: decimal('kop_tvd_ft', { precision: 10, scale: 2 }),
  buildRateDeg100ft: decimal('build_rate_deg_100ft', { precision: 6, scale: 3 }),
  turnRateDeg100ft: decimal('turn_rate_deg_100ft', { precision: 6, scale: 3 }),
  maxDlsDeg100ft: decimal('max_dls_deg_100ft', { precision: 6, scale: 3 }),
  
  // Sección horizontal (si aplica)
  landingPointMdFt: decimal('landing_point_md_ft', { precision: 10, scale: 2 }),
  landingPointTvdFt: decimal('landing_point_tvd_ft', { precision: 10, scale: 2 }),
  lateralLengthFt: decimal('lateral_length_ft', { precision: 10, scale: 2 }),
  lateralAzimuthDeg: decimal('lateral_azimuth_deg', { precision: 6, scale: 2 }),
  
  // Target
  targetNsFt: decimal('target_ns_ft', { precision: 12, scale: 2 }),
  targetEwFt: decimal('target_ew_ft', { precision: 12, scale: 2 }),
  targetTvdFt: decimal('target_tvd_ft', { precision: 10, scale: 2 }),
  targetRadiusFt: decimal('target_radius_ft', { precision: 8, scale: 2 }),
  
  // Puntos de survey calculados (JSONB)
  surveyPoints: jsonb('survey_points'),
  // [{md, inc, azi, tvd, ns, ew, dls, vs}]
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// ============================================================================
// SURVEY POINTS (Trayectoria Actual)
// ============================================================================

export const surveyPoints = pgTable('survey_points', {
  id: uuid('id').primaryKey().defaultRandom(),
  trajectoryId: uuid('trajectory_id').notNull().references(() => trajectories.id, { onDelete: 'cascade' }),
  
  // Profundidad
  mdFt: decimal('md_ft', { precision: 10, scale: 2 }).notNull(),
  
  // Ángulos
  inclinationDeg: decimal('inclination_deg', { precision: 6, scale: 3 }).notNull(),
  azimuthDeg: decimal('azimuth_deg', { precision: 6, scale: 3 }).notNull(),
  
  // Posición calculada
  tvdFt: decimal('tvd_ft', { precision: 10, scale: 2 }),
  nsFt: decimal('ns_ft', { precision: 12, scale: 2 }),
  ewFt: decimal('ew_ft', { precision: 12, scale: 2 }),
  vsFt: decimal('vs_ft', { precision: 12, scale: 2 }),
  dlsDeg100ft: decimal('dls_deg_100ft', { precision: 6, scale: 3 }),
  
  // Correcciones magnéticas
  magneticDeclination: decimal('magnetic_declination', { precision: 6, scale: 3 }),
  gridCorrection: decimal('grid_correction', { precision: 6, scale: 3 }),
  totalCorrection: decimal('total_correction', { precision: 6, scale: 3 }),
  
  // Fuente
  surveySource: varchar('survey_source', { length: 30 }), // MWD, GYRO, SINGLE_SHOT, CALCULATED
  toolType: varchar('tool_type', { length: 50 }),
  
  // Tiempo
  surveyTime: timestamp('survey_time'),
  
  // Calidad
  qualityCheckPassed: boolean('quality_check_passed').default(true),
  
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  trajectoryMdIdx: index('idx_survey_points_trajectory').on(table.trajectoryId, table.mdFt)
}));

// ============================================================================
// CASING PROGRAMS
// ============================================================================

export const casingPrograms = pgTable('casing_programs', {
  id: uuid('id').primaryKey().defaultRandom(),
  wellPlanId: uuid('well_plan_id').notNull().references(() => wellPlans.id, { onDelete: 'cascade' }),
  
  // Identificación
  casingString: casingStringEnum('casing_string').notNull(),
  stringNumber: integer('string_number'),
  
  // Profundidades
  settingDepthMdFt: decimal('setting_depth_md_ft', { precision: 10, scale: 2 }).notNull(),
  settingDepthTvdFt: decimal('setting_depth_tvd_ft', { precision: 10, scale: 2 }),
  topDepthMdFt: decimal('top_depth_md_ft', { precision: 10, scale: 2 }).default('0'),
  
  // Especificaciones
  odInches: decimal('od_inches', { precision: 6, scale: 3 }).notNull(),
  idInches: decimal('id_inches', { precision: 6, scale: 3 }),
  weightPpf: decimal('weight_ppf', { precision: 6, scale: 2 }).notNull(),
  grade: varchar('grade', { length: 20 }).notNull(), // J55, K55, L80, N80, C95, P110, Q125
  connectionType: varchar('connection_type', { length: 50 }),
  
  // Propiedades mecánicas
  burstRatingPsi: decimal('burst_rating_psi', { precision: 10, scale: 2 }),
  collapseRatingPsi: decimal('collapse_rating_psi', { precision: 10, scale: 2 }),
  tensionRatingKlbs: decimal('tension_rating_klbs', { precision: 10, scale: 2 }),
  
  // Factores de diseño
  burstDf: decimal('burst_df', { precision: 4, scale: 2 }).default('1.10'),
  collapseDf: decimal('collapse_df', { precision: 4, scale: 2 }).default('1.00'),
  tensionDf: decimal('tension_df', { precision: 4, scale: 2 }).default('1.60'),
  
  // Cemento
  cementTopMdFt: decimal('cement_top_md_ft', { precision: 10, scale: 2 }),
  cementVolumeBbl: decimal('cement_volume_bbl', { precision: 10, scale: 2 }),
  cementType: varchar('cement_type', { length: 50 }),
  cementDensityPpg: decimal('cement_density_ppg', { precision: 6, scale: 2 }),
  
  // Hoyo
  holeSizeInches: decimal('hole_size_inches', { precision: 6, scale: 3 }),
  
  // Estado
  status: casingStatusEnum('status').default('PLANNED'),
  setDate: timestamp('set_date'),
  testPressurePsi: decimal('test_pressure_psi', { precision: 10, scale: 2 }),
  testResult: varchar('test_result', { length: 20 }), // PASS, FAIL
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  planIdx: index('idx_casing_programs_plan').on(table.wellPlanId)
}));

// ============================================================================
// MUD PROGRAMS
// ============================================================================

export const mudPrograms = pgTable('mud_programs', {
  id: uuid('id').primaryKey().defaultRandom(),
  wellPlanId: uuid('well_plan_id').notNull().references(() => wellPlans.id, { onDelete: 'cascade' }),
  
  // Sección
  sectionName: varchar('section_name', { length: 50 }).notNull(),
  holeSizeInches: decimal('hole_size_inches', { precision: 6, scale: 3 }),
  depthFromFt: decimal('depth_from_ft', { precision: 10, scale: 2 }),
  depthToFt: decimal('depth_to_ft', { precision: 10, scale: 2 }),
  
  // Tipo de lodo
  mudType: mudTypeEnum('mud_type').notNull(),
  mudSystem: varchar('mud_system', { length: 50 }), // SPUD, GEL, POLYMER, NACL, KCL, INVERT
  
  // Propiedades objetivo
  mudWeightMinPpg: decimal('mud_weight_min_ppg', { precision: 6, scale: 3 }),
  mudWeightMaxPpg: decimal('mud_weight_max_ppg', { precision: 6, scale: 3 }),
  targetPvCp: decimal('target_pv_cp', { precision: 6, scale: 2 }),
  targetYpLbf: decimal('target_yp_lbf', { precision: 6, scale: 2 }),
  targetGel10s: decimal('target_gel_10s', { precision: 6, scale: 2 }),
  targetGel10m: decimal('target_gel_10m', { precision: 6, scale: 2 }),
  targetFluidLossMl: decimal('target_fluid_loss_ml', { precision: 6, scale: 2 }),
  targetPhMin: decimal('target_ph_min', { precision: 4, scale: 2 }),
  targetPhMax: decimal('target_ph_max', { precision: 4, scale: 2 }),
  
  // Ventana operacional
  porePressurePpg: decimal('pore_pressure_ppg', { precision: 6, scale: 3 }),
  fractureGradientPpg: decimal('fracture_gradient_ppg', { precision: 6, scale: 3 }),
  
  // Condiciones especiales
  h2sExpected: boolean('h2s_expected').default(false),
  co2Expected: boolean('co2_expected').default(false),
  lostCirculationRisk: varchar('lost_circulation_risk', { length: 20 }), // LOW, MEDIUM, HIGH
  
  notes: text('notes'),
  
  createdAt: timestamp('created_at').defaultNow()
});

// ============================================================================
// BHA RUNS
// ============================================================================

export const bhaRuns = pgTable('bha_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  wellPlanId: uuid('well_plan_id').notNull().references(() => wellPlans.id),
  
  // Identificación
  runNumber: integer('run_number').notNull(),
  bhaName: varchar('bha_name', { length: 100 }),
  
  // Profundidades
  depthInFt: decimal('depth_in_ft', { precision: 10, scale: 2 }),
  depthOutFt: decimal('depth_out_ft', { precision: 10, scale: 2 }),
  
  // Tiempos
  timeIn: timestamp('time_in'),
  timeOut: timestamp('time_out'),
  rotatingHours: decimal('rotating_hours', { precision: 8, scale: 2 }),
  circulatingHours: decimal('circulating_hours', { precision: 8, scale: 2 }),
  
  // Broca
  bitNumber: integer('bit_number'),
  bitSizeInches: decimal('bit_size_inches', { precision: 6, scale: 3 }),
  bitType: varchar('bit_type', { length: 50 }), // PDC, TRICONE, IMPREG
  bitManufacturer: varchar('bit_manufacturer', { length: 50 }),
  bitModel: varchar('bit_model', { length: 50 }),
  bitSerial: varchar('bit_serial', { length: 50 }),
  bitTfaSqin: decimal('bit_tfa_sqin', { precision: 6, scale: 4 }),
  bitJets: varchar('bit_jets', { length: 50 }), // e.g., "3x12, 3x14"
  
  // Performance
  footageDrilledFt: decimal('footage_drilled_ft', { precision: 10, scale: 2 }),
  avgRopFtHr: decimal('avg_rop_ft_hr', { precision: 8, scale: 2 }),
  maxRopFtHr: decimal('max_rop_ft_hr', { precision: 8, scale: 2 }),
  
  // Dull grading (IADC)
  dullInner: varchar('dull_inner', { length: 2 }),
  dullOuter: varchar('dull_outer', { length: 2 }),
  dullDullChar: varchar('dull_dull_char', { length: 2 }),
  dullLocation: varchar('dull_location', { length: 2 }),
  dullBearing: varchar('dull_bearing', { length: 2 }),
  dullGauge: varchar('dull_gauge', { length: 4 }),
  dullOther: varchar('dull_other', { length: 2 }),
  dullReasonPulled: varchar('dull_reason_pulled', { length: 2 }),
  
  // Estado
  status: bhaStatusEnum('status').default('ACTIVE'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// ============================================================================
// BHA COMPONENTS
// ============================================================================

export const bhaComponents = pgTable('bha_components', {
  id: uuid('id').primaryKey().defaultRandom(),
  bhaRunId: uuid('bha_run_id').notNull().references(() => bhaRuns.id, { onDelete: 'cascade' }),
  
  // Posición (desde fondo)
  sequenceNumber: integer('sequence_number').notNull(),
  
  // Identificación
  componentType: varchar('component_type', { length: 30 }).notNull(),
  // BIT, MOTOR, RSS, MWD, LWD, STABILIZER, DC, HWDP, JAR, CROSSOVER
  
  description: varchar('description', { length: 200 }),
  serialNumber: varchar('serial_number', { length: 50 }),
  
  // Dimensiones
  odInches: decimal('od_inches', { precision: 6, scale: 3 }),
  idInches: decimal('id_inches', { precision: 6, scale: 3 }),
  lengthFt: decimal('length_ft', { precision: 8, scale: 2 }),
  weightLbs: decimal('weight_lbs', { precision: 10, scale: 2 }),
  
  // Propiedades específicas
  properties: jsonb('properties'),
  // Motor: {bend_angle, flow_range, diff_pressure}
  // Stabilizer: {blade_od, blade_length, num_blades}
  // MWD: {gamma, resistivity, inclination, azimuth}
  
  createdAt: timestamp('created_at').defaultNow()
});

// ============================================================================
// DRILLING PARAMS (TimescaleDB Hypertable)
// ============================================================================

export const drillingParams = pgTable('drilling_params', {
  time: timestamp('time').notNull(),
  wellId: uuid('well_id').notNull().references(() => wells.id),
  bhaRunId: uuid('bha_run_id').references(() => bhaRuns.id),
  
  // Profundidad
  bitDepthFt: decimal('bit_depth_ft', { precision: 10, scale: 2 }),
  holeDepthFt: decimal('hole_depth_ft', { precision: 10, scale: 2 }),
  
  // Peso
  hookloadKlbs: decimal('hookload_klbs', { precision: 8, scale: 2 }),
  wobKlbs: decimal('wob_klbs', { precision: 8, scale: 2 }),
  
  // Rotación
  rpmSurface: decimal('rpm_surface', { precision: 6, scale: 2 }),
  rpmDownhole: decimal('rpm_downhole', { precision: 6, scale: 2 }),
  torqueKftlbs: decimal('torque_kftlbs', { precision: 8, scale: 2 }),
  
  // Bombeo
  sppPsi: decimal('spp_psi', { precision: 8, scale: 2 }),
  flowRateGpm: decimal('flow_rate_gpm', { precision: 8, scale: 2 }),
  pump1Spm: decimal('pump1_spm', { precision: 6, scale: 2 }),
  pump2Spm: decimal('pump2_spm', { precision: 6, scale: 2 }),
  pump3Spm: decimal('pump3_spm', { precision: 6, scale: 2 }),
  
  // ROP
  ropFtHr: decimal('rop_ft_hr', { precision: 8, scale: 2 }),
  
  // Lodo
  mwInPpg: decimal('mw_in_ppg', { precision: 6, scale: 3 }),
  mwOutPpg: decimal('mw_out_ppg', { precision: 6, scale: 3 }),
  flowOutGpm: decimal('flow_out_gpm', { precision: 8, scale: 2 }),
  pitVolumeBbl: decimal('pit_volume_bbl', { precision: 10, scale: 2 }),
  pitGainBbl: decimal('pit_gain_bbl', { precision: 8, scale: 2 }),
  
  // Temperaturas
  mudTempInF: decimal('mud_temp_in_f', { precision: 6, scale: 2 }),
  mudTempOutF: decimal('mud_temp_out_f', { precision: 6, scale: 2 }),
  
  // Gas
  totalGasUnits: decimal('total_gas_units', { precision: 8, scale: 2 }),
  connectionGasUnits: decimal('connection_gas_units', { precision: 8, scale: 2 }),
  
  // Presiones adicionales
  chokePressurePsi: decimal('choke_pressure_psi', { precision: 8, scale: 2 }),
  casingPressurePsi: decimal('casing_pressure_psi', { precision: 8, scale: 2 }),
  
  // Bloque
  blockPositionFt: decimal('block_position_ft', { precision: 8, scale: 2 }),
  
  // Estado de operación
  rigState: rigStateEnum('rig_state')
}, (table) => ({
  primaryKey: { columns: [table.time, table.wellId] },
  wellTimeIdx: index('idx_drilling_params_well').on(table.wellId, table.time),
  depthIdx: index('idx_drilling_params_depth').on(table.wellId, table.bitDepthFt)
}));

// ============================================================================
// DAILY DRILLING REPORTS
// ============================================================================

export const dailyDrillingReports = pgTable('daily_drilling_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  wellId: uuid('well_id').notNull().references(() => wells.id),
  wellPlanId: uuid('well_plan_id').references(() => wellPlans.id),
  
  // Fecha del reporte
  reportDate: timestamp('report_date').notNull(),
  reportNumber: integer('report_number'),
  
  // Profundidades
  depthStartFt: decimal('depth_start_ft', { precision: 10, scale: 2 }),
  depthEndFt: decimal('depth_end_ft', { precision: 10, scale: 2 }),
  footageDrilledFt: decimal('footage_drilled_ft', { precision: 10, scale: 2 }),
  
  // Tiempos (24 horas)
  drillingHours: decimal('drilling_hours', { precision: 5, scale: 2 }),
  trippingHours: decimal('tripping_hours', { precision: 5, scale: 2 }),
  circulatingHours: decimal('circulating_hours', { precision: 5, scale: 2 }),
  reamingHours: decimal('reaming_hours', { precision: 5, scale: 2 }),
  casingHours: decimal('casing_hours', { precision: 5, scale: 2 }),
  cementingHours: decimal('cementing_hours', { precision: 5, scale: 2 }),
  loggingHours: decimal('logging_hours', { precision: 5, scale: 2 }),
  testingHours: decimal('testing_hours', { precision: 5, scale: 2 }),
  rigRepairHours: decimal('rig_repair_hours', { precision: 5, scale: 2 }),
  weatherHours: decimal('weather_hours', { precision: 5, scale: 2 }),
  otherNptHours: decimal('other_npt_hours', { precision: 5, scale: 2 }),
  
  // Costos del día
  dailyCostUsd: decimal('daily_cost_usd', { precision: 12, scale: 2 }),
  cumulativeCostUsd: decimal('cumulative_cost_usd', { precision: 15, scale: 2 }),
  
  // Días
  daysFromSpud: integer('days_from_spud'),
  daysPlanned: integer('days_planned'),
  daysAheadBehind: integer('days_ahead_behind'),
  
  // Resumen de operaciones
  operationsSummary: text('operations_summary'),
  
  // Próximas 24 horas
  forecastOperations: text('forecast_operations'),
  
  // Problemas y lecciones
  problemsEncountered: text('problems_encountered'),
  lessonsLearned: text('lessons_learned'),
  
  // Seguridad
  safetyObservations: text('safety_observations'),
  incidents: integer('incidents').default(0),
  nearMisses: integer('near_misses').default(0),
  
  // Aprobación
  preparedBy: uuid('prepared_by').references(() => users.id),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  
  // Estado
  status: ddrStatusEnum('status').default('DRAFT'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  wellDateIdx: index('idx_ddr_well_date').on(table.wellId, table.reportDate),
  uniqueWellDate: uniqueIndex('unique_well_date').on(table.wellId, table.reportDate)
}));

// ============================================================================
// DRILLING EVENTS
// ============================================================================

export const drillingEvents = pgTable('drilling_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  wellId: uuid('well_id').notNull().references(() => wells.id),
  ddrId: uuid('ddr_id').references(() => dailyDrillingReports.id),
  
  // Tiempo
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  durationHours: decimal('duration_hours', { precision: 6, scale: 2 }),
  
  // Profundidad
  depthStartFt: decimal('depth_start_ft', { precision: 10, scale: 2 }),
  depthEndFt: decimal('depth_end_ft', { precision: 10, scale: 2 }),
  
  // Clasificación
  eventCategory: varchar('event_category', { length: 30 }).notNull(),
  // DRILLING, TRIPPING, CASING, CEMENTING, LOGGING, NPT, etc.
  eventCode: varchar('event_code', { length: 10 }),
  eventDescription: text('event_description'),
  
  // NPT específico
  isNpt: boolean('is_npt').default(false),
  nptCategory: varchar('npt_category', { length: 50 }),
  nptSubcategory: varchar('npt_subcategory', { length: 50 }),
  
  // Costo asociado
  costUsd: decimal('cost_usd', { precision: 12, scale: 2 }),
  
  // Notas
  notes: text('notes'),
  
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  wellTimeIdx: index('idx_drilling_events_well_time').on(table.wellId, table.startTime)
}));

// ============================================================================
// TORQUE & DRAG MODELS
// ============================================================================

export const tdModels = pgTable('td_models', {
  id: uuid('id').primaryKey().defaultRandom(),
  wellPlanId: uuid('well_plan_id').notNull().references(() => wellPlans.id),
  trajectoryId: uuid('trajectory_id').references(() => trajectories.id),
  bhaRunId: uuid('bha_run_id').references(() => bhaRuns.id),
  
  // Tipo de modelo
  modelType: varchar('model_type', { length: 20 }).notNull(), // SOFT_STRING, STIFF_STRING
  modelDate: timestamp('model_date').defaultNow(),
  
  // Coeficientes de fricción
  casedHoleFriction: decimal('cased_hole_friction', { precision: 4, scale: 3 }).default('0.25'),
  openHoleFriction: decimal('open_hole_friction', { precision: 4, scale: 3 }).default('0.35'),
  
  // Propiedades del lodo
  mudWeightPpg: decimal('mud_weight_ppg', { precision: 6, scale: 3 }),
  
  // Resultados por profundidad
  results: jsonb('results').notNull(),
  // [{depth, trip_in_klbs, trip_out_klbs, rotating_klbs, on_bottom_klbs, torque_kftlbs, buckling_load_klbs}]
  
  // Límites del equipo
  maxHookloadKlbs: decimal('max_hookload_klbs', { precision: 10, scale: 2 }),
  maxTorqueKftlbs: decimal('max_torque_kftlbs', { precision: 10, scale: 2 }),
  
  // Validación
  validated: boolean('validated').default(false),
  validatedBy: uuid('validated_by').references(() => users.id),
  
  createdAt: timestamp('created_at').defaultNow()
});

// ============================================================================
// RELATIONS
// ============================================================================

export const wellPlansRelations = relations(wellPlans, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [wellPlans.tenantId],
    references: [tenants.id]
  }),
  well: one(wells, {
    fields: [wellPlans.wellId],
    references: [wells.id]
  }),
  trajectories: many(trajectories),
  casingPrograms: many(casingPrograms),
  mudPrograms: many(mudPrograms),
  bhaRuns: many(bhaRuns),
  tdModels: many(tdModels),
  dailyReports: many(dailyDrillingReports)
}));

export const trajectoriesRelations = relations(trajectories, ({ one, many }) => ({
  wellPlan: one(wellPlans, {
    fields: [trajectories.wellPlanId],
    references: [wellPlans.id]
  }),
  surveyPoints: many(surveyPoints)
}));

export const bhaRunsRelations = relations(bhaRuns, ({ one, many }) => ({
  wellPlan: one(wellPlans, {
    fields: [bhaRuns.wellPlanId],
    references: [wellPlans.id]
  }),
  components: many(bhaComponents)
}));

export const bhaComponentsRelations = relations(bhaComponents, ({ one }) => ({
  bhaRun: one(bhaRuns, {
    fields: [bhaComponents.bhaRunId],
    references: [bhaRuns.id]
  })
}));

// ============================================================================
// TYPES
// ============================================================================

export type WellPlan = typeof wellPlans.$inferSelect;
export type NewWellPlan = typeof wellPlans.$inferInsert;

export type Trajectory = typeof trajectories.$inferSelect;
export type NewTrajectory = typeof trajectories.$inferInsert;

export type SurveyPoint = typeof surveyPoints.$inferSelect;
export type NewSurveyPoint = typeof surveyPoints.$inferInsert;

export type CasingProgram = typeof casingPrograms.$inferSelect;
export type NewCasingProgram = typeof casingPrograms.$inferInsert;

export type MudProgram = typeof mudPrograms.$inferSelect;
export type NewMudProgram = typeof mudPrograms.$inferInsert;

export type BhaRun = typeof bhaRuns.$inferSelect;
export type NewBhaRun = typeof bhaRuns.$inferInsert;

export type BhaComponent = typeof bhaComponents.$inferSelect;
export type NewBhaComponent = typeof bhaComponents.$inferInsert;

export type DrillingParam = typeof drillingParams.$inferSelect;
export type NewDrillingParam = typeof drillingParams.$inferInsert;

export type DailyDrillingReport = typeof dailyDrillingReports.$inferSelect;
export type NewDailyDrillingReport = typeof dailyDrillingReports.$inferInsert;

export type DrillingEvent = typeof drillingEvents.$inferSelect;
export type NewDrillingEvent = typeof drillingEvents.$inferInsert;

export type TdModel = typeof tdModels.$inferSelect;
export type NewTdModel = typeof tdModels.$inferInsert;
