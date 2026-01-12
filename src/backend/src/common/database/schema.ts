import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, pgEnum, decimal, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'engineer', 'operator', 'viewer']);
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'suspended']);

// Edge Gateway and Data Sources enums
export const protocolTypeEnum = pgEnum('protocol_type', ['MODBUS_TCP', 'MODBUS_RTU', 'ETHERNET_IP', 'S7', 'OPCUA', 'FINS', 'MQTT', 'HTTP']);
export const dataSourceStatusEnum = pgEnum('data_source_status', ['ACTIVE', 'INACTIVE', 'ERROR', 'MAINTENANCE']);
export const edgeGatewayStatusEnum = pgEnum('edge_gateway_status', ['ONLINE', 'OFFLINE', 'ERROR', 'MAINTENANCE']);
export const tagDataTypeEnum = pgEnum('tag_data_type', ['INT16', 'UINT16', 'INT32', 'UINT32', 'FLOAT32', 'FLOAT64', 'BOOLEAN', 'STRING']);

// Data Source Mapping enums
export const digitalTwinStatusEnum = pgEnum('digital_twin_status', ['ACTIVE', 'INACTIVE', 'MAINTENANCE']);
export const transportTypeEnum = pgEnum('transport_type', ['MODBUS_TCP', 'MODBUS_RTU', 'ETHERNET_IP', 'S7', 'OPCUA', 'FINS', 'MQTT', 'HTTP']);

// Yacimientos enums - DEPRECATED: Ahora se usan en Ditto, mantener solo para well-testing
export const wellStatusEnum = pgEnum('well_status', ['PRODUCING', 'INJECTING', 'SHUT_IN', 'ABANDONED', 'DRILLING', 'SUSPENDED']);
export const wellTypeEnum = pgEnum('well_type', ['PRODUCER', 'INJECTOR', 'OBSERVATION', 'DISPOSAL']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  role: userRoleEnum('role').notNull().default('viewer'),
  status: userStatusEnum('status').notNull().default('active'),
  emailVerified: boolean('email_verified').notNull().default(false),
  lastLoginAt: timestamp('last_login_at'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Refresh tokens table
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Tenants table (multi-tenancy support)
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  refreshTokens: many(refreshTokens),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

// ============================================================================
// NOTA: Tablas de Yacimientos (basins, fields, reservoirs, wells) ELIMINADAS
// Ahora se manejan como Digital Twins en Eclipse Ditto
// Ver: /modules/digital-twins/ para la nueva implementación
// ============================================================================

// ============================================================================
// WELL TESTING MODULE
// ============================================================================
// NOTA: wellId ahora es un string que contiene el thingId de Ditto (ej: "acme:well-001")
// ya que la tabla wells fue eliminada y ahora se maneja como Digital Twin en Ditto
// ============================================================================

// Well Testing enums
export const testStatusEnum = pgEnum('test_status', ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ANALYZED', 'APPROVED', 'CANCELLED', 'SUSPENDED']);
export const testTypeCodeEnum = pgEnum('test_type_code', ['PRODUCTION', 'BUILDUP', 'DRAWDOWN', 'ISOCHRONAL', 'INTERFERENCE', 'PVT_SAMPLE']);
export const iprModelEnum = pgEnum('ipr_model', ['VOGEL', 'FETKOVITCH', 'STANDING', 'COMPOSITE', 'JONES_BLOUNT_GLAZE']);
export const vlpCorrelationEnum = pgEnum('vlp_correlation', ['BEGGS_BRILL', 'HAGEDORN_BROWN', 'DUNS_ROS', 'ORKISZEWSKI', 'GRAY', 'ANSARI']);

// Test Types table
export const testTypes = pgTable('test_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  code: testTypeCodeEnum('code').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  requiresSeparator: boolean('requires_separator').default(false),
  requiresPressureGauge: boolean('requires_pressure_gauge').default(false),
  requiresSamples: boolean('requires_samples').default(false),
  requiredFields: jsonb('required_fields').default('[]'),
  optionalFields: jsonb('optional_fields').default('[]'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Well Tests table (main table)
export const wellTests = pgTable('well_tests', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  wellId: varchar('well_id', { length: 255 }).notNull(), // Ditto thingId (ej: "acme:well-001")
  testTypeId: uuid('test_type_id').notNull().references(() => testTypes.id),
  
  // Identification
  testNumber: varchar('test_number', { length: 20 }).notNull(),
  testDate: timestamp('test_date').notNull(),
  
  // Status
  status: testStatusEnum('status').notNull().default('PLANNED'),
  
  // Duration
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  durationHours: decimal('duration_hours', { precision: 8, scale: 2 }),
  
  // Operating conditions
  chokeSize64ths: integer('choke_size_64ths'),
  separatorPressurePsi: decimal('separator_pressure_psi', { precision: 10, scale: 2 }),
  separatorTemperatureF: decimal('separator_temperature_f', { precision: 8, scale: 2 }),
  
  // Measured rates
  oilRateBopd: decimal('oil_rate_bopd', { precision: 12, scale: 2 }),
  waterRateBwpd: decimal('water_rate_bwpd', { precision: 12, scale: 2 }),
  gasRateMscfd: decimal('gas_rate_mscfd', { precision: 12, scale: 2 }),
  liquidRateBlpd: decimal('liquid_rate_blpd', { precision: 12, scale: 2 }),
  
  // Pressures
  tubingPressurePsi: decimal('tubing_pressure_psi', { precision: 10, scale: 2 }),
  casingPressurePsi: decimal('casing_pressure_psi', { precision: 10, scale: 2 }),
  flowingBhpPsi: decimal('flowing_bhp_psi', { precision: 10, scale: 2 }),
  staticBhpPsi: decimal('static_bhp_psi', { precision: 10, scale: 2 }),
  
  // Temperatures
  wellheadTempF: decimal('wellhead_temp_f', { precision: 8, scale: 2 }),
  bottomholeTempF: decimal('bottomhole_temp_f', { precision: 8, scale: 2 }),
  
  // Fluid properties
  bswPercent: decimal('bsw_percent', { precision: 5, scale: 2 }),
  waterCutPercent: decimal('water_cut_percent', { precision: 5, scale: 2 }),
  oilApiGravity: decimal('oil_api_gravity', { precision: 6, scale: 2 }),
  gasSpecificGravity: decimal('gas_specific_gravity', { precision: 6, scale: 4 }),
  gorScfStb: decimal('gor_scf_stb', { precision: 10, scale: 2 }),
  
  // Calculated parameters
  productivityIndex: decimal('productivity_index', { precision: 10, scale: 4 }),
  specificProductivityIndex: decimal('specific_productivity_index', { precision: 10, scale: 4 }),
  
  // Approval
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  
  // Audit
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  
  // Notes
  notes: text('notes'),
});

// Test Readings table (multiple readings per test)
export const testReadings = pgTable('test_readings', {
  id: uuid('id').primaryKey().defaultRandom(),
  wellTestId: uuid('well_test_id').notNull().references(() => wellTests.id, { onDelete: 'cascade' }),
  
  // Reading time
  readingTime: timestamp('reading_time').notNull(),
  elapsedHours: decimal('elapsed_hours', { precision: 10, scale: 4 }),
  
  // Pressures
  tubingPressurePsi: decimal('tubing_pressure_psi', { precision: 10, scale: 2 }),
  casingPressurePsi: decimal('casing_pressure_psi', { precision: 10, scale: 2 }),
  bottomholePressurePsi: decimal('bottomhole_pressure_psi', { precision: 10, scale: 2 }),
  
  // Rates
  oilRateBopd: decimal('oil_rate_bopd', { precision: 12, scale: 2 }),
  waterRateBwpd: decimal('water_rate_bwpd', { precision: 12, scale: 2 }),
  gasRateMscfd: decimal('gas_rate_mscfd', { precision: 12, scale: 2 }),
  
  // Temperatures
  wellheadTempF: decimal('wellhead_temp_f', { precision: 8, scale: 2 }),
  bottomholeTempF: decimal('bottomhole_temp_f', { precision: 8, scale: 2 }),
  
  // Choke
  chokeSize64ths: integer('choke_size_64ths'),
  
  // Notes
  notes: text('notes'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// IPR Analyses table
export const iprAnalyses = pgTable('ipr_analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  wellTestId: uuid('well_test_id').notNull().references(() => wellTests.id),
  
  // Model used
  model: iprModelEnum('model').notNull(),
  
  // Input data
  reservoirPressurePsi: decimal('reservoir_pressure_psi', { precision: 10, scale: 2 }).notNull(),
  bubblePointPsi: decimal('bubble_point_psi', { precision: 10, scale: 2 }),
  testRateBopd: decimal('test_rate_bopd', { precision: 12, scale: 2 }).notNull(),
  testPwfPsi: decimal('test_pwf_psi', { precision: 10, scale: 2 }).notNull(),
  
  // Vogel results
  qmaxBopd: decimal('qmax_bopd', { precision: 12, scale: 2 }),
  productivityIndex: decimal('productivity_index', { precision: 10, scale: 4 }),
  
  // Fetkovitch results (gas)
  cCoefficient: decimal('c_coefficient', { precision: 15, scale: 6 }),
  nExponent: decimal('n_exponent', { precision: 6, scale: 4 }),
  aofMscfd: decimal('aof_mscfd', { precision: 12, scale: 2 }),
  
  // IPR curve (calculated points)
  iprCurve: jsonb('ipr_curve'),
  
  // Statistics
  rSquared: decimal('r_squared', { precision: 6, scale: 4 }),
  
  // Metadata
  analyst: varchar('analyst', { length: 100 }),
  analysisDate: timestamp('analysis_date').notNull().defaultNow(),
  notes: text('notes'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// VLP Analyses table
export const vlpAnalyses = pgTable('vlp_analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  wellTestId: uuid('well_test_id').references(() => wellTests.id),
  wellId: varchar('well_id', { length: 255 }).notNull(), // Ditto thingId
  
  // Correlation used
  correlation: vlpCorrelationEnum('correlation').notNull(),
  
  // Tubing data
  tubingIdInches: decimal('tubing_id_inches', { precision: 6, scale: 3 }).notNull(),
  tubingDepthFt: decimal('tubing_depth_ft', { precision: 10, scale: 2 }).notNull(),
  wellheadPressurePsi: decimal('wellhead_pressure_psi', { precision: 10, scale: 2 }).notNull(),
  
  // Well data
  deviationDegrees: decimal('deviation_degrees', { precision: 6, scale: 2 }).default('0'),
  roughnessInches: decimal('roughness_inches', { precision: 6, scale: 4 }).default('0.0006'),
  
  // Conditions
  wellheadTempF: decimal('wellhead_temp_f', { precision: 8, scale: 2 }),
  bottomholeTempF: decimal('bottomhole_temp_f', { precision: 8, scale: 2 }),
  waterCutPercent: decimal('water_cut_percent', { precision: 5, scale: 2 }),
  gorScfStb: decimal('gor_scf_stb', { precision: 10, scale: 2 }),
  
  // Fluid properties
  oilApi: decimal('oil_api', { precision: 6, scale: 2 }),
  gasSg: decimal('gas_sg', { precision: 6, scale: 4 }),
  waterSg: decimal('water_sg', { precision: 6, scale: 4 }).default('1.02'),
  
  // VLP curve (calculated points)
  vlpCurve: jsonb('vlp_curve'),
  
  // Metadata
  analyst: varchar('analyst', { length: 100 }),
  analysisDate: timestamp('analysis_date').notNull().defaultNow(),
  notes: text('notes'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Nodal Analyses table
export const nodalAnalyses = pgTable('nodal_analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  wellId: varchar('well_id', { length: 255 }).notNull(), // Ditto thingId
  iprAnalysisId: uuid('ipr_analysis_id').references(() => iprAnalyses.id),
  vlpAnalysisId: uuid('vlp_analysis_id').references(() => vlpAnalyses.id),
  
  // Operating point
  operatingRateBopd: decimal('operating_rate_bopd', { precision: 12, scale: 2 }),
  operatingPwfPsi: decimal('operating_pwf_psi', { precision: 10, scale: 2 }),
  
  // Capacity
  maxRateBopd: decimal('max_rate_bopd', { precision: 12, scale: 2 }),
  
  // Sensitivity analysis
  sensitivityResults: jsonb('sensitivity_results'),
  
  // Recommendations
  recommendations: text('recommendations'),
  
  // Metadata
  analyst: varchar('analyst', { length: 100 }),
  analysisDate: timestamp('analysis_date').notNull().defaultNow(),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations for Well Testing module
export const testTypesRelations = relations(testTypes, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [testTypes.tenantId],
    references: [tenants.id],
  }),
  wellTests: many(wellTests),
}));

export const wellTestsRelations = relations(wellTests, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [wellTests.tenantId],
    references: [tenants.id],
  }),
  // NOTA: well relation eliminada - wellId ahora es thingId de Ditto (string)
  testType: one(testTypes, {
    fields: [wellTests.testTypeId],
    references: [testTypes.id],
  }),
  createdByUser: one(users, {
    fields: [wellTests.createdBy],
    references: [users.id],
  }),
  approvedByUser: one(users, {
    fields: [wellTests.approvedBy],
    references: [users.id],
  }),
  testReadings: many(testReadings),
  iprAnalyses: many(iprAnalyses),
  vlpAnalyses: many(vlpAnalyses),
}));

export const testReadingsRelations = relations(testReadings, ({ one }) => ({
  wellTest: one(wellTests, {
    fields: [testReadings.wellTestId],
    references: [wellTests.id],
  }),
}));

export const iprAnalysesRelations = relations(iprAnalyses, ({ one, many }) => ({
  wellTest: one(wellTests, {
    fields: [iprAnalyses.wellTestId],
    references: [wellTests.id],
  }),
  nodalAnalyses: many(nodalAnalyses),
}));

export const vlpAnalysesRelations = relations(vlpAnalyses, ({ one, many }) => ({
  wellTest: one(wellTests, {
    fields: [vlpAnalyses.wellTestId],
    references: [wellTests.id],
  }),
  // NOTA: well relation eliminada - wellId ahora es thingId de Ditto (string)
  nodalAnalyses: many(nodalAnalyses),
}));

export const nodalAnalysesRelations = relations(nodalAnalyses, ({ one }) => ({
  // NOTA: well relation eliminada - wellId ahora es thingId de Ditto (string)
  iprAnalysis: one(iprAnalyses, {
    fields: [nodalAnalyses.iprAnalysisId],
    references: [iprAnalyses.id],
  }),
  vlpAnalysis: one(vlpAnalyses, {
    fields: [nodalAnalyses.vlpAnalysisId],
    references: [vlpAnalyses.id],
  }),
}));

// Type exports for Well Testing
export type TestType = typeof testTypes.$inferSelect;
export type NewTestType = typeof testTypes.$inferInsert;
export type WellTest = typeof wellTests.$inferSelect;
export type NewWellTest = typeof wellTests.$inferInsert;
export type TestReading = typeof testReadings.$inferSelect;
export type NewTestReading = typeof testReadings.$inferInsert;
export type IprAnalysis = typeof iprAnalyses.$inferSelect;
export type NewIprAnalysis = typeof iprAnalyses.$inferInsert;
export type VlpAnalysis = typeof vlpAnalyses.$inferSelect;
export type NewVlpAnalysis = typeof vlpAnalyses.$inferInsert;
export type NodalAnalysis = typeof nodalAnalyses.$inferSelect;
export type NewNodalAnalysis = typeof nodalAnalyses.$inferInsert;

// ============================================================================
// DRILLING MODULE
// ============================================================================

// Drilling enums
export const planStatusEnum = pgEnum('plan_status', ['DRAFT', 'REVIEW', 'APPROVED', 'ACTIVE', 'COMPLETED', 'CANCELLED']);
export const wellTypeDrillingEnum = pgEnum('well_type_drilling', ['VERTICAL', 'DIRECTIONAL', 'HORIZONTAL', 'ERD', 'MULTILATERAL']);
export const wellPurposeEnum = pgEnum('well_purpose', ['EXPLORATION', 'DEVELOPMENT', 'INFILL', 'WORKOVER', 'APPRAISAL']);
export const trajectoryTypeEnum = pgEnum('trajectory_type', ['PLANNED', 'ACTUAL', 'PROPOSED']);
export const casingStringEnum = pgEnum('casing_string', ['CONDUCTOR', 'SURFACE', 'INTERMEDIATE', 'PRODUCTION', 'LINER']);
export const casingStatusEnum = pgEnum('casing_status', ['PLANNED', 'SET', 'CEMENTED', 'TESTED', 'FAILED']);
export const mudTypeEnum = pgEnum('mud_type', ['WBM', 'OBM', 'SBM', 'FOAM', 'AIR']);
export const bhaStatusEnum = pgEnum('bha_status', ['PLANNED', 'ACTIVE', 'COMPLETED', 'FAILED']);
export const rigStateEnum = pgEnum('rig_state', ['DRILLING', 'CIRCULATING', 'TRIPPING_IN', 'TRIPPING_OUT', 'CONNECTION', 'REAMING', 'BACKREAMING', 'CASING', 'CEMENTING', 'LOGGING', 'TESTING', 'WAITING', 'RIG_REPAIR', 'NPT']);
export const ddrStatusEnum = pgEnum('ddr_status', ['DRAFT', 'SUBMITTED', 'APPROVED']);

// Well Plans table
export const wellPlans = pgTable('well_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  wellId: varchar('well_id', { length: 255 }).notNull(), // Ditto thingId
  rigId: uuid('rig_id'),
  planName: varchar('plan_name', { length: 100 }).notNull(),
  planVersion: integer('plan_version').default(1),
  planStatus: planStatusEnum('plan_status').default('DRAFT'),
  wellType: wellTypeDrillingEnum('well_type'),
  wellPurpose: wellPurposeEnum('well_purpose'),
  plannedTdMdFt: decimal('planned_td_md_ft', { precision: 10, scale: 2 }),
  plannedTdTvdFt: decimal('planned_td_tvd_ft', { precision: 10, scale: 2 }),
  spudDatePlanned: timestamp('spud_date_planned'),
  tdDatePlanned: timestamp('td_date_planned'),
  daysPlanned: integer('days_planned'),
  afeNumber: varchar('afe_number', { length: 50 }),
  estimatedCostUsd: decimal('estimated_cost_usd', { precision: 15, scale: 2 }),
  preparedBy: uuid('prepared_by').references(() => users.id),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Type exports for Drilling
export type WellPlan = typeof wellPlans.$inferSelect;
export type NewWellPlan = typeof wellPlans.$inferInsert;

// ============================================================================
// INFRASTRUCTURE MODULE - DIGITAL TWINS
// ============================================================================

// Digital Twins enums
export const assetStatusEnum = pgEnum('asset_status', ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'RETIRED', 'FAILED']);
export const telemetryQualityEnum = pgEnum('telemetry_quality', ['GOOD', 'BAD', 'UNCERTAIN', 'SIMULATED']);
export const telemetrySourceEnum = pgEnum('telemetry_source', ['SENSOR', 'MANUAL', 'CALCULATED', 'IMPORTED', 'EDGE']);
export const ruleStatusEnum = pgEnum('rule_status', ['ACTIVE', 'INACTIVE', 'DRAFT', 'ERROR']);
export const ruleTriggerTypeEnum = pgEnum('rule_trigger_type', ['TELEMETRY_CHANGE', 'ATTRIBUTE_CHANGE', 'STATUS_CHANGE', 'SCHEDULE', 'EVENT', 'MANUAL']);
export const ruleActionTypeEnum = pgEnum('rule_action_type', ['SET_COMPUTED', 'SET_ATTRIBUTE', 'SET_STATUS', 'CREATE_ALARM', 'SEND_NOTIFICATION', 'CALL_API', 'PUBLISH_KAFKA', 'LOG']);
export const alarmSeverityEnum = pgEnum('alarm_severity', ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']);
export const alarmStatusEnum = pgEnum('alarm_status', ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'SUPPRESSED']);

// Asset Types table (configurable by tenant)
export const assetTypes = pgTable('asset_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  
  code: varchar('code', { length: 50 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }),
  color: varchar('color', { length: 20 }),
  
  // Hierarchy - parent type for inheritance
  parentTypeId: uuid('parent_type_id').references((): any => assetTypes.id),
  
  // Schema definitions (JSONB)
  fixedSchema: jsonb('fixed_schema').notNull().default('{}'),
  attributeSchema: jsonb('attribute_schema').notNull().default('{}'),
  telemetrySchema: jsonb('telemetry_schema').notNull().default('{}'),
  computedFields: jsonb('computed_fields').notNull().default('[]'),
  
  // Metadata
  isActive: boolean('is_active').default(true),
  isSystem: boolean('is_system').default(false), // System types cannot be deleted
  sortOrder: integer('sort_order').default(0),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Assets table (Digital Twin instances)
export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  assetTypeId: uuid('asset_type_id').notNull().references(() => assetTypes.id),
  
  // Identification
  code: varchar('code', { length: 50 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  
  // Hierarchy - parent asset
  parentAssetId: uuid('parent_asset_id').references((): any => assets.id),
  
  // Geographic location
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  elevationFt: decimal('elevation_ft', { precision: 10, scale: 2 }),
  
  // Status
  status: assetStatusEnum('status').notNull().default('ACTIVE'),
  
  // Fixed properties (according to type schema)
  properties: jsonb('properties').notNull().default('{}'),
  
  // Dynamic attributes (customizable)
  attributes: jsonb('attributes').notNull().default('{}'),
  
  // Computed fields cache
  computedValues: jsonb('computed_values').notNull().default('{}'),
  computedAt: timestamp('computed_at'),
  
  // Current telemetry cache (last values)
  currentTelemetry: jsonb('current_telemetry').notNull().default('{}'),
  telemetryUpdatedAt: timestamp('telemetry_updated_at'),
  
  // Tags and metadata
  tags: text('tags').array(),
  metadata: jsonb('metadata'),
  
  // Reference to legacy entities (for migration)
  legacyType: varchar('legacy_type', { length: 50 }), // 'well', 'field', 'basin', etc.
  legacyId: uuid('legacy_id'),
  
  // Audit
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Asset Attribute History (audit trail)
export const assetAttributeHistory = pgTable('asset_attribute_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  assetId: uuid('asset_id').notNull().references(() => assets.id, { onDelete: 'cascade' }),
  
  attributeKey: varchar('attribute_key', { length: 100 }).notNull(),
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value'),
  
  changedBy: uuid('changed_by').references(() => users.id),
  changedAt: timestamp('changed_at').notNull().defaultNow(),
  reason: text('reason'),
});

// Asset Telemetry table (TimescaleDB hypertable)
// Note: This table will be converted to a hypertable after migration
export const assetTelemetry = pgTable('asset_telemetry', {
  id: uuid('id').primaryKey().defaultRandom(),
  time: timestamp('time', { withTimezone: true }).notNull().defaultNow(),
  assetId: uuid('asset_id').notNull().references(() => assets.id),
  
  // Telemetry key (pressure, temperature, flow_rate, etc.)
  telemetryKey: varchar('telemetry_key', { length: 100 }).notNull(),
  
  // Values
  valueNumeric: decimal('value_numeric', { precision: 20, scale: 6 }),
  valueText: text('value_text'),
  valueBoolean: boolean('value_boolean'),
  
  // Quality
  quality: telemetryQualityEnum('quality').default('GOOD'),
  
  // Source
  source: telemetrySourceEnum('source').default('SENSOR'),
  sourceId: varchar('source_id', { length: 100 }),
  
  // Unit of measure
  unit: varchar('unit', { length: 30 }),
});

// Rules table (Visual Rule Engine)
export const rules = pgTable('rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  
  // Applies to
  appliesToAssetTypes: text('applies_to_asset_types').array().notNull(),
  appliesToAssets: uuid('applies_to_assets').array(), // NULL = all of type
  
  // Visual definition (React Flow nodes/edges)
  nodes: jsonb('nodes').notNull(),
  connections: jsonb('connections').notNull(),
  
  // State
  status: ruleStatusEnum('status').notNull().default('DRAFT'),
  priority: integer('priority').default(0),
  
  // Configuration
  config: jsonb('config').notNull().default(`{
    "executeOnStartup": false,
    "debounceMs": 1000,
    "maxExecutionsPerMinute": 60,
    "timeoutMs": 5000
  }`),
  
  // Error tracking
  lastError: text('last_error'),
  lastErrorAt: timestamp('last_error_at'),
  errorCount: integer('error_count').default(0),
  
  // Audit
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Rule Executions log
export const ruleExecutions = pgTable('rule_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  ruleId: uuid('rule_id').notNull().references(() => rules.id, { onDelete: 'cascade' }),
  assetId: uuid('asset_id').references(() => assets.id),
  
  // Trigger info
  triggerType: ruleTriggerTypeEnum('trigger_type').notNull(),
  triggerData: jsonb('trigger_data'),
  
  // Execution
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  durationMs: integer('duration_ms'),
  
  // Result
  success: boolean('success').notNull(),
  result: jsonb('result'),
  error: text('error'),
  
  // Actions executed
  actionsExecuted: jsonb('actions_executed'),
});

// Alarms table
export const alarms = pgTable('alarms', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  assetId: uuid('asset_id').references(() => assets.id),
  ruleId: uuid('rule_id').references(() => rules.id),
  
  // Identification
  alarmCode: varchar('alarm_code', { length: 50 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  message: text('message'),
  
  // Severity and status
  severity: alarmSeverityEnum('severity').notNull().default('MEDIUM'),
  status: alarmStatusEnum('status').notNull().default('ACTIVE'),
  
  // Trigger data
  triggerValue: jsonb('trigger_value'),
  triggerCondition: text('trigger_condition'),
  
  // Timestamps
  triggeredAt: timestamp('triggered_at').notNull().defaultNow(),
  acknowledgedAt: timestamp('acknowledged_at'),
  acknowledgedBy: uuid('acknowledged_by').references(() => users.id),
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: uuid('resolved_by').references(() => users.id),
  
  // Notes
  notes: text('notes'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Asset Relationships table (for complex relationships between assets)
export const assetRelationships = pgTable('asset_relationships', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  
  // Source and target assets
  sourceAssetId: uuid('source_asset_id').notNull().references(() => assets.id, { onDelete: 'cascade' }),
  targetAssetId: uuid('target_asset_id').notNull().references(() => assets.id, { onDelete: 'cascade' }),
  
  // Relationship type
  relationshipType: varchar('relationship_type', { length: 50 }).notNull(), // 'installed_in', 'connected_to', 'supplies', etc.
  
  // Validity period (for temporary relationships)
  validFrom: timestamp('valid_from').defaultNow(),
  validTo: timestamp('valid_to'),
  
  // Metadata
  metadata: jsonb('metadata'),
  
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations for Infrastructure module
export const assetTypesRelations = relations(assetTypes, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [assetTypes.tenantId],
    references: [tenants.id],
  }),
  parentType: one(assetTypes, {
    fields: [assetTypes.parentTypeId],
    references: [assetTypes.id],
    relationName: 'assetTypeHierarchy',
  }),
  childTypes: many(assetTypes, { relationName: 'assetTypeHierarchy' }),
  assets: many(assets),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [assets.tenantId],
    references: [tenants.id],
  }),
  assetType: one(assetTypes, {
    fields: [assets.assetTypeId],
    references: [assetTypes.id],
  }),
  parentAsset: one(assets, {
    fields: [assets.parentAssetId],
    references: [assets.id],
    relationName: 'assetHierarchy',
  }),
  childAssets: many(assets, { relationName: 'assetHierarchy' }),
  createdByUser: one(users, {
    fields: [assets.createdBy],
    references: [users.id],
  }),
  attributeHistory: many(assetAttributeHistory),
  telemetry: many(assetTelemetry),
  alarms: many(alarms),
  sourceRelationships: many(assetRelationships, { relationName: 'sourceAsset' }),
  targetRelationships: many(assetRelationships, { relationName: 'targetAsset' }),
}));

export const assetAttributeHistoryRelations = relations(assetAttributeHistory, ({ one }) => ({
  asset: one(assets, {
    fields: [assetAttributeHistory.assetId],
    references: [assets.id],
  }),
  changedByUser: one(users, {
    fields: [assetAttributeHistory.changedBy],
    references: [users.id],
  }),
}));

export const assetTelemetryRelations = relations(assetTelemetry, ({ one }) => ({
  asset: one(assets, {
    fields: [assetTelemetry.assetId],
    references: [assets.id],
  }),
}));

export const rulesRelations = relations(rules, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [rules.tenantId],
    references: [tenants.id],
  }),
  createdByUser: one(users, {
    fields: [rules.createdBy],
    references: [users.id],
  }),
  executions: many(ruleExecutions),
  alarms: many(alarms),
}));

export const ruleExecutionsRelations = relations(ruleExecutions, ({ one }) => ({
  rule: one(rules, {
    fields: [ruleExecutions.ruleId],
    references: [rules.id],
  }),
  asset: one(assets, {
    fields: [ruleExecutions.assetId],
    references: [assets.id],
  }),
}));

export const alarmsRelations = relations(alarms, ({ one }) => ({
  tenant: one(tenants, {
    fields: [alarms.tenantId],
    references: [tenants.id],
  }),
  asset: one(assets, {
    fields: [alarms.assetId],
    references: [assets.id],
  }),
  rule: one(rules, {
    fields: [alarms.ruleId],
    references: [rules.id],
  }),
  acknowledgedByUser: one(users, {
    fields: [alarms.acknowledgedBy],
    references: [users.id],
  }),
  resolvedByUser: one(users, {
    fields: [alarms.resolvedBy],
    references: [users.id],
  }),
}));

export const assetRelationshipsRelations = relations(assetRelationships, ({ one }) => ({
  tenant: one(tenants, {
    fields: [assetRelationships.tenantId],
    references: [tenants.id],
  }),
  sourceAsset: one(assets, {
    fields: [assetRelationships.sourceAssetId],
    references: [assets.id],
    relationName: 'sourceAsset',
  }),
  targetAsset: one(assets, {
    fields: [assetRelationships.targetAssetId],
    references: [assets.id],
    relationName: 'targetAsset',
  }),
  createdByUser: one(users, {
    fields: [assetRelationships.createdBy],
    references: [users.id],
  }),
}));

// Type exports for Infrastructure
export type AssetType = typeof assetTypes.$inferSelect;
export type NewAssetType = typeof assetTypes.$inferInsert;
export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
export type AssetAttributeHistory = typeof assetAttributeHistory.$inferSelect;
export type NewAssetAttributeHistory = typeof assetAttributeHistory.$inferInsert;
export type AssetTelemetry = typeof assetTelemetry.$inferSelect;
export type NewAssetTelemetry = typeof assetTelemetry.$inferInsert;
export type Rule = typeof rules.$inferSelect;
export type NewRule = typeof rules.$inferInsert;
export type RuleExecution = typeof ruleExecutions.$inferSelect;
export type NewRuleExecution = typeof ruleExecutions.$inferInsert;
export type Alarm = typeof alarms.$inferSelect;
export type NewAlarm = typeof alarms.$inferInsert;
export type AssetRelationship = typeof assetRelationships.$inferSelect;
export type NewAssetRelationship = typeof assetRelationships.$inferInsert;

// ============================================================================
// EDGE GATEWAY MODULE - PLC INTEGRATION
// ============================================================================

// Edge Gateways table
export const edgeGateways = pgTable('edge_gateways', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  
  // Identification
  gatewayId: varchar('gateway_id', { length: 100 }).notNull().unique(), // Unique identifier from edge device
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  
  // Location
  siteId: uuid('site_id').references(() => assets.id), // Reference to site asset
  location: varchar('location', { length: 200 }),
  
  // Network configuration
  ipAddress: varchar('ip_address', { length: 45 }),
  port: integer('port').default(3001),
  
  // Status
  status: edgeGatewayStatusEnum('status').notNull().default('OFFLINE'),
  
  // Health monitoring
  lastHeartbeat: timestamp('last_heartbeat'),
  lastConfigSync: timestamp('last_config_sync'),
  version: varchar('version', { length: 20 }),
  
  // Configuration
  config: jsonb('config').notNull().default('{}'),
  
  // Metadata
  tags: text('tags').array(),
  metadata: jsonb('metadata'),
  
  // Audit
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Data Sources table (PLCs, RTUs, etc.)
export const dataSources = pgTable('data_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  edgeGatewayId: uuid('edge_gateway_id').notNull().references(() => edgeGateways.id, { onDelete: 'cascade' }),
  
  // Device Profile (for mapping to Digital Twins)
  deviceProfileId: uuid('device_profile_id').references((): any => deviceProfiles.id),
  
  // Identification
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  
  // Protocol
  protocol: protocolTypeEnum('protocol').notNull(),
  
  // Connection configuration (protocol-specific)
  connectionConfig: jsonb('connection_config').notNull().default('{}'),
  // Examples:
  // Modbus TCP: { host, port, unitId, timeout }
  // EtherNet/IP: { host, port, slot, timeout }
  // S7: { host, port, rack, slot, timeout }
  // OPC-UA: { endpointUrl, username, password, securityMode, securityPolicy }
  
  // Status
  status: dataSourceStatusEnum('status').notNull().default('INACTIVE'),
  
  // Health monitoring
  lastSuccessfulRead: timestamp('last_successful_read'),
  lastError: text('last_error'),
  lastErrorAt: timestamp('last_error_at'),
  errorCount: integer('error_count').default(0),
  
  // Performance metrics
  avgLatencyMs: integer('avg_latency_ms'),
  successRate: decimal('success_rate', { precision: 5, scale: 2 }),
  
  // Configuration
  enabled: boolean('enabled').default(true),
  scanRate: integer('scan_rate').default(5000), // Default scan rate in ms
  
  // Metadata
  tags: text('tags').array(),
  metadata: jsonb('metadata'),
  
  // Audit
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Data Source Tags table (individual tags/points)
export const dataSourceTags = pgTable('data_source_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  dataSourceId: uuid('data_source_id').notNull().references(() => dataSources.id, { onDelete: 'cascade' }),
  
  // Tag identification
  tagId: varchar('tag_id', { length: 100 }).notNull(), // Unique within data source
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  
  // Asset mapping
  assetId: uuid('asset_id').references(() => assets.id),
  telemetryKey: varchar('telemetry_key', { length: 100 }), // Maps to asset telemetry key
  
  // Protocol-specific configuration
  protocolConfig: jsonb('protocol_config').notNull(),
  // Examples:
  // Modbus: { unitId, registerType, address, quantity, dataType }
  // EtherNet/IP: { tagName, dataType }
  // S7: { dbNumber, offset, dataType }
  // OPC-UA: { nodeId, dataType }
  
  // Data type
  dataType: tagDataTypeEnum('data_type').notNull(),
  
  // Unit of measure
  unit: varchar('unit', { length: 30 }),
  
  // Scaling and transformation
  scaleFactor: decimal('scale_factor', { precision: 10, scale: 4 }).default('1.0'),
  offset: decimal('offset', { precision: 10, scale: 4 }).default('0.0'),
  
  // Quality control
  deadband: decimal('deadband', { precision: 10, scale: 4 }), // Only publish if change > deadband
  minValue: decimal('min_value', { precision: 20, scale: 6 }),
  maxValue: decimal('max_value', { precision: 20, scale: 6 }),
  
  // Scan configuration
  scanRate: integer('scan_rate'), // Override data source scan rate (ms)
  enabled: boolean('enabled').default(true),
  
  // Current value cache
  currentValue: jsonb('current_value'),
  currentQuality: telemetryQualityEnum('current_quality'),
  lastReadAt: timestamp('last_read_at'),
  
  // Metadata
  tags: text('tags').array(),
  metadata: jsonb('metadata'),
  
  // Audit
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Relations for Edge Gateway module
export const edgeGatewaysRelations = relations(edgeGateways, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [edgeGateways.tenantId],
    references: [tenants.id],
  }),
  site: one(assets, {
    fields: [edgeGateways.siteId],
    references: [assets.id],
  }),
  createdByUser: one(users, {
    fields: [edgeGateways.createdBy],
    references: [users.id],
  }),
  dataSources: many(dataSources),
}));

export const dataSourcesRelations = relations(dataSources, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [dataSources.tenantId],
    references: [tenants.id],
  }),
  edgeGateway: one(edgeGateways, {
    fields: [dataSources.edgeGatewayId],
    references: [edgeGateways.id],
  }),
  deviceProfile: one(deviceProfiles, {
    fields: [dataSources.deviceProfileId],
    references: [deviceProfiles.id],
  }),
  createdByUser: one(users, {
    fields: [dataSources.createdBy],
    references: [users.id],
  }),
  tags: many(dataSourceTags),
  deviceBindings: many(deviceBindings),
}));

export const dataSourceTagsRelations = relations(dataSourceTags, ({ one }) => ({
  tenant: one(tenants, {
    fields: [dataSourceTags.tenantId],
    references: [tenants.id],
  }),
  dataSource: one(dataSources, {
    fields: [dataSourceTags.dataSourceId],
    references: [dataSources.id],
  }),
  asset: one(assets, {
    fields: [dataSourceTags.assetId],
    references: [assets.id],
  }),
  createdByUser: one(users, {
    fields: [dataSourceTags.createdBy],
    references: [users.id],
  }),
}));

// Type exports for Edge Gateway module
export type EdgeGateway = typeof edgeGateways.$inferSelect;
export type NewEdgeGateway = typeof edgeGateways.$inferInsert;
export type DataSource = typeof dataSources.$inferSelect;
export type NewDataSource = typeof dataSources.$inferInsert;
export type DataSourceTag = typeof dataSourceTags.$inferSelect;
export type NewDataSourceTag = typeof dataSourceTags.$inferInsert;

// ============================================================================
// DATA SOURCE MAPPING MODULE - Device Profiles → Digital Twins
// ============================================================================

// Device Profiles table (configuration for device types)
export const deviceProfiles = pgTable('device_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  
  // Identification
  code: varchar('code', { length: 100 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  
  // Transport type
  transportType: transportTypeEnum('transport_type').notNull(),
  
  // Telemetry schema (defines expected telemetry keys and their types)
  telemetrySchema: jsonb('telemetry_schema').notNull().default('{}'),
  // Example: { "pressure": { "type": "number", "unit": "psi" }, "temp": { "type": "number", "unit": "C" } }
  
  // Default Rule Chain for this device type
  defaultRuleChainId: uuid('default_rule_chain_id').references(() => rules.id),
  
  // Status
  isActive: boolean('is_active').notNull().default(true),
  
  // Metadata
  tags: text('tags').array(),
  metadata: jsonb('metadata'),
  
  // Audit
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  uniqueTenantCode: {
    columns: [table.tenantId, table.code],
    name: 'device_profiles_tenant_id_code_unique'
  }
}));

// Asset Templates table (templates for composite digital twins)
export const assetTemplates = pgTable('asset_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  
  // Identification
  code: varchar('code', { length: 100 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  
  // Root asset type
  rootAssetTypeId: uuid('root_asset_type_id').notNull().references(() => assetTypes.id),
  
  // Components definition (child assets)
  components: jsonb('components').notNull().default('[]'),
  // Example: [{ "code": "reel", "assetTypeCode": "CT_REEL", "name": "Carrete", "required": true }]
  
  // Relationships between components
  relationships: jsonb('relationships').notNull().default('[]'),
  // Example: [{ "from": "reel", "to": "root", "type": "INSTALLED_IN" }]
  
  // Default properties for instances
  defaultProperties: jsonb('default_properties').notNull().default('{}'),
  
  // Status
  isActive: boolean('is_active').notNull().default(true),
  
  // Metadata
  tags: text('tags').array(),
  metadata: jsonb('metadata'),
  
  // Audit
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  uniqueTenantCode: {
    columns: [table.tenantId, table.code],
    name: 'asset_templates_tenant_id_code_unique'
  }
}));

// Connectivity Profiles table (mapping device telemetry → asset components)
export const connectivityProfiles = pgTable('connectivity_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  
  // Identification
  code: varchar('code', { length: 100 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  
  // References
  deviceProfileId: uuid('device_profile_id').notNull().references(() => deviceProfiles.id, { onDelete: 'cascade' }),
  assetTemplateId: uuid('asset_template_id').notNull().references(() => assetTemplates.id, { onDelete: 'cascade' }),
  
  // Rule Chain override (optional, overrides deviceProfile.defaultRuleChainId)
  ruleChainId: uuid('rule_chain_id').references(() => rules.id),
  
  // Telemetry mappings
  mappings: jsonb('mappings').notNull().default('[]'),
  // Example: [{ 
  //   "sourceKey": "pressure", 
  //   "target": { "component": "root", "feature": "telemetry", "property": "pressure" },
  //   "transform": "value * 0.0689476"  // Optional transformation
  // }]
  
  // Status
  isActive: boolean('is_active').notNull().default(true),
  
  // Metadata
  tags: text('tags').array(),
  metadata: jsonb('metadata'),
  
  // Audit
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  uniqueTenantCode: {
    columns: [table.tenantId, table.code],
    name: 'connectivity_profiles_tenant_id_code_unique'
  }
}));

// Digital Twin Instances table (instances created from templates)
export const digitalTwinInstances = pgTable('digital_twin_instances', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  
  // Template reference (null if simple asset, not from template)
  assetTemplateId: uuid('asset_template_id').references(() => assetTemplates.id),
  
  // Identification
  code: varchar('code', { length: 100 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  
  // Ditto Thing IDs
  rootThingId: varchar('root_thing_id', { length: 200 }).notNull(), // e.g., "acme:ct_007"
  componentThingIds: jsonb('component_thing_ids').notNull().default('{}'),
  // Example: { "reel": "acme:ct_007_reel", "pump": "acme:ct_007_pump" }
  
  // Status
  status: digitalTwinStatusEnum('status').notNull().default('ACTIVE'),
  
  // Metadata
  tags: text('tags').array(),
  metadata: jsonb('metadata'),
  
  // Audit
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  uniqueTenantCode: {
    columns: [table.tenantId, table.code],
    name: 'digital_twin_instances_tenant_id_code_unique'
  },
  uniqueRootThingId: {
    columns: [table.tenantId, table.rootThingId],
    name: 'digital_twin_instances_tenant_id_root_thing_id_unique'
  }
}));

// Device Bindings table (binds data source to digital twin instance)
export const deviceBindings = pgTable('device_bindings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  
  // References
  dataSourceId: uuid('data_source_id').notNull().references(() => dataSources.id, { onDelete: 'cascade' }),
  digitalTwinId: uuid('digital_twin_id').notNull().references(() => digitalTwinInstances.id, { onDelete: 'cascade' }),
  connectivityProfileId: uuid('connectivity_profile_id').notNull().references(() => connectivityProfiles.id),
  
  // Rule Chain override (optional, highest priority override)
  customRuleChainId: uuid('custom_rule_chain_id').references(() => rules.id),
  
  // Custom mappings (optional, overrides connectivity profile mappings)
  customMappings: jsonb('custom_mappings'),
  
  // Status
  isActive: boolean('is_active').notNull().default(true),
  
  // Health monitoring
  lastDataReceivedAt: timestamp('last_data_received_at'),
  lastMappingError: text('last_mapping_error'),
  lastMappingErrorAt: timestamp('last_mapping_error_at'),
  
  // Metadata
  tags: text('tags').array(),
  metadata: jsonb('metadata'),
  
  // Audit
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  uniqueDataSourceDigitalTwin: {
    columns: [table.dataSourceId, table.digitalTwinId],
    name: 'device_bindings_data_source_id_digital_twin_id_unique'
  }
}));

// Relations for Data Source Mapping module
export const deviceProfilesRelations = relations(deviceProfiles, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [deviceProfiles.tenantId],
    references: [tenants.id],
  }),
  defaultRuleChain: one(rules, {
    fields: [deviceProfiles.defaultRuleChainId],
    references: [rules.id],
  }),
  createdByUser: one(users, {
    fields: [deviceProfiles.createdBy],
    references: [users.id],
  }),
  connectivityProfiles: many(connectivityProfiles),
  dataSources: many(dataSources),
}));

export const assetTemplatesRelations = relations(assetTemplates, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [assetTemplates.tenantId],
    references: [tenants.id],
  }),
  rootAssetType: one(assetTypes, {
    fields: [assetTemplates.rootAssetTypeId],
    references: [assetTypes.id],
  }),
  createdByUser: one(users, {
    fields: [assetTemplates.createdBy],
    references: [users.id],
  }),
  connectivityProfiles: many(connectivityProfiles),
  digitalTwinInstances: many(digitalTwinInstances),
}));

export const connectivityProfilesRelations = relations(connectivityProfiles, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [connectivityProfiles.tenantId],
    references: [tenants.id],
  }),
  deviceProfile: one(deviceProfiles, {
    fields: [connectivityProfiles.deviceProfileId],
    references: [deviceProfiles.id],
  }),
  assetTemplate: one(assetTemplates, {
    fields: [connectivityProfiles.assetTemplateId],
    references: [assetTemplates.id],
  }),
  ruleChain: one(rules, {
    fields: [connectivityProfiles.ruleChainId],
    references: [rules.id],
  }),
  createdByUser: one(users, {
    fields: [connectivityProfiles.createdBy],
    references: [users.id],
  }),
  deviceBindings: many(deviceBindings),
}));

export const digitalTwinInstancesRelations = relations(digitalTwinInstances, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [digitalTwinInstances.tenantId],
    references: [tenants.id],
  }),
  assetTemplate: one(assetTemplates, {
    fields: [digitalTwinInstances.assetTemplateId],
    references: [assetTemplates.id],
  }),
  createdByUser: one(users, {
    fields: [digitalTwinInstances.createdBy],
    references: [users.id],
  }),
  deviceBindings: many(deviceBindings),
}));

export const deviceBindingsRelations = relations(deviceBindings, ({ one }) => ({
  tenant: one(tenants, {
    fields: [deviceBindings.tenantId],
    references: [tenants.id],
  }),
  dataSource: one(dataSources, {
    fields: [deviceBindings.dataSourceId],
    references: [dataSources.id],
  }),
  digitalTwin: one(digitalTwinInstances, {
    fields: [deviceBindings.digitalTwinId],
    references: [digitalTwinInstances.id],
  }),
  connectivityProfile: one(connectivityProfiles, {
    fields: [deviceBindings.connectivityProfileId],
    references: [connectivityProfiles.id],
  }),
  customRuleChain: one(rules, {
    fields: [deviceBindings.customRuleChainId],
    references: [rules.id],
  }),
  createdByUser: one(users, {
    fields: [deviceBindings.createdBy],
    references: [users.id],
  }),
}));

// Type exports for Data Source Mapping module
export type DeviceProfile = typeof deviceProfiles.$inferSelect;
export type NewDeviceProfile = typeof deviceProfiles.$inferInsert;
export type AssetTemplate = typeof assetTemplates.$inferSelect;
export type NewAssetTemplate = typeof assetTemplates.$inferInsert;
export type ConnectivityProfile = typeof connectivityProfiles.$inferSelect;
export type NewConnectivityProfile = typeof connectivityProfiles.$inferInsert;
export type DigitalTwinInstance = typeof digitalTwinInstances.$inferSelect;
export type NewDigitalTwinInstance = typeof digitalTwinInstances.$inferInsert;
export type DeviceBinding = typeof deviceBindings.$inferSelect;
export type NewDeviceBinding = typeof deviceBindings.$inferInsert;

// ============================================================================
// RBAC MODULE - ROLES, PERMISSIONS, AND ACCESS CONTROL
// ============================================================================

// Roles table (predefined and custom)
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  code: varchar('code', { length: 50 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isSystem: boolean('is_system').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  parentRoleId: uuid('parent_role_id').references((): any => roles.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  uniqueTenantCode: {
    columns: [table.tenantId, table.code],
    name: 'roles_tenant_id_code_unique'
  }
}));

// Permissions table (granular permissions)
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  code: varchar('code', { length: 100 }).notNull(),
  module: varchar('module', { length: 50 }).notNull(),
  resource: varchar('resource', { length: 50 }),
  action: varchar('action', { length: 50 }),
  field: varchar('field', { length: 50 }),
  description: text('description'),
  isSystem: boolean('is_system').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  uniqueTenantCode: {
    columns: [table.tenantId, table.code],
    name: 'permissions_tenant_id_code_unique'
  }
}));

// Role-Permission assignments
export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  granted: boolean('granted').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  uniqueRolePermission: {
    columns: [table.roleId, table.permissionId],
    name: 'role_permissions_role_id_permission_id_unique'
  }
}));

// User-Role assignments
export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  grantedBy: uuid('granted_by').references(() => users.id),
  grantedAt: timestamp('granted_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'),
}, (table) => ({
  uniqueUserRole: {
    columns: [table.userId, table.roleId],
    name: 'user_roles_user_id_role_id_unique'
  }
}));

// User-Permission direct assignments (exceptions)
export const userPermissions = pgTable('user_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  granted: boolean('granted').notNull().default(true),
  grantedBy: uuid('granted_by').references(() => users.id),
  grantedAt: timestamp('granted_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'),
  reason: text('reason'),
}, (table) => ({
  uniqueUserPermission: {
    columns: [table.userId, table.permissionId],
    name: 'user_permissions_user_id_permission_id_unique'
  }
}));

// Access logs (audit trail)
export const accessLogs = pgTable('access_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  resourceType: varchar('resource_type', { length: 50 }).notNull(),
  resourceId: uuid('resource_id'),
  action: varchar('action', { length: 50 }).notNull(),
  permissionCode: varchar('permission_code', { length: 100 }),
  granted: boolean('granted').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations for RBAC module
export const rolesRelations = relations(roles, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [roles.tenantId],
    references: [tenants.id],
  }),
  parentRole: one(roles, {
    fields: [roles.parentRoleId],
    references: [roles.id],
  }),
  childRoles: many(roles),
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles),
}));

export const permissionsRelations = relations(permissions, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [permissions.tenantId],
    references: [tenants.id],
  }),
  rolePermissions: many(rolePermissions),
  userPermissions: many(userPermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
  grantedByUser: one(users, {
    fields: [userRoles.grantedBy],
    references: [users.id],
  }),
}));

export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
  user: one(users, {
    fields: [userPermissions.userId],
    references: [users.id],
  }),
  permission: one(permissions, {
    fields: [userPermissions.permissionId],
    references: [permissions.id],
  }),
  grantedByUser: one(users, {
    fields: [userPermissions.grantedBy],
    references: [users.id],
  }),
}));

export const accessLogsRelations = relations(accessLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [accessLogs.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [accessLogs.userId],
    references: [users.id],
  }),
}));

// Type exports for RBAC module
export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
export type UserPermission = typeof userPermissions.$inferSelect;
export type NewUserPermission = typeof userPermissions.$inferInsert;
export type AccessLog = typeof accessLogs.$inferSelect;
export type NewAccessLog = typeof accessLogs.$inferInsert;

// Magnitude Categories table
export const magnitudeCategories = pgTable('magnitude_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }),
  color: varchar('color', { length: 20 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Magnitudes table
export const magnitudes = pgTable('magnitudes', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').notNull().references(() => magnitudeCategories.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  symbol: varchar('symbol', { length: 20 }),
  siUnitId: uuid('si_unit_id'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Units table
export const units = pgTable('units', {
  id: uuid('id').primaryKey().defaultRandom(),
  magnitudeId: uuid('magnitude_id').notNull().references(() => magnitudes.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  symbol: varchar('symbol', { length: 20 }).notNull(),
  description: text('description'),
  isSiUnit: boolean('is_si_unit').notNull().default(false),
  conversionFactor: decimal('conversion_factor', { precision: 30, scale: 15 }),
  conversionOffset: decimal('conversion_offset', { precision: 30, scale: 15 }).default('0'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Relations for magnitudes system
export const magnitudeCategoriesRelations = relations(magnitudeCategories, ({ many }) => ({
  magnitudes: many(magnitudes),
}));

export const magnitudesRelations = relations(magnitudes, ({ one, many }) => ({
  category: one(magnitudeCategories, {
    fields: [magnitudes.categoryId],
    references: [magnitudeCategories.id],
  }),
  units: many(units),
  siUnit: one(units, {
    fields: [magnitudes.siUnitId],
    references: [units.id],
  }),
}));

export const unitsRelations = relations(units, ({ one }) => ({
  magnitude: one(magnitudes, {
    fields: [units.magnitudeId],
    references: [magnitudes.id],
  }),
}));

// Type exports for magnitudes system
export type MagnitudeCategory = typeof magnitudeCategories.$inferSelect;
export type NewMagnitudeCategory = typeof magnitudeCategories.$inferInsert;
export type Magnitude = typeof magnitudes.$inferSelect;
export type NewMagnitude = typeof magnitudes.$inferInsert;
export type Unit = typeof units.$inferSelect;
export type NewUnit = typeof units.$inferInsert;

// ============================================================================
// COILED TUBING MODULE
// ============================================================================

// Coiled Tubing enums
export const ctUnitStatusEnum = pgEnum('ct_unit_status', ['AVAILABLE', 'IN_SERVICE', 'MAINTENANCE', 'OUT_OF_SERVICE']);
export const ctCertificationStatusEnum = pgEnum('ct_certification_status', ['VALID', 'EXPIRED', 'PENDING']);
export const ctReelStatusEnum = pgEnum('ct_reel_status', ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED']);
export const ctReelConditionEnum = pgEnum('ct_reel_condition', ['GOOD', 'FAIR', 'POOR', 'CRITICAL']);
export const ctSteelGradeEnum = pgEnum('ct_steel_grade', ['CT70', 'CT80', 'CT90', 'CT100', 'CT110']);
export const ctSectionStatusEnum = pgEnum('ct_section_status', ['ACTIVE', 'WARNING', 'CRITICAL', 'CUT']);
export const ctJobStatusEnum = pgEnum('ct_job_status', ['DRAFT', 'PLANNED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'SUSPENDED']);
export const ctJobTypeEnum = pgEnum('ct_job_type', ['CLN', 'N2L', 'ACT', 'CMS', 'FSH', 'LOG', 'PER', 'MIL', 'CTD']);
export const ctOperationStatusEnum = pgEnum('ct_operation_status', ['IN_PROGRESS', 'COMPLETED', 'ABORTED']);
export const ctTicketStatusEnum = pgEnum('ct_ticket_status', ['DRAFT', 'PENDING_SIGNATURES', 'COMPLETED']);
export const ctFatigueCycleTypeEnum = pgEnum('ct_fatigue_cycle_type', ['BENDING', 'PRESSURE', 'COMBINED']);
export const ctAlarmSeverityEnum = pgEnum('ct_alarm_severity', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const ctAlarmStatusEnum = pgEnum('ct_alarm_status', ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED']);

// CT Units table
export const ctUnits = pgTable('ct_units', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  // assetId: uuid('asset_id'), // Digital Twin reference (Ditto) - TODO: Add when assets table exists
  
  // Identificación
  unitNumber: varchar('unit_number', { length: 50 }).notNull(),
  manufacturer: varchar('manufacturer', { length: 100 }),
  model: varchar('model', { length: 100 }),
  serialNumber: varchar('serial_number', { length: 100 }),
  yearManufactured: integer('year_manufactured'),
  
  // Capacidades
  injectorCapacityLbs: integer('injector_capacity_lbs').notNull(),
  maxSpeedFtMin: integer('max_speed_ft_min'),
  pumpHp: integer('pump_hp'),
  maxPressurePsi: integer('max_pressure_psi'),
  maxFlowRateBpm: decimal('max_flow_rate_bpm', { precision: 10, scale: 2 }),
  
  // Estado operacional
  status: ctUnitStatusEnum('status').notNull().default('AVAILABLE'),
  location: varchar('location', { length: 200 }),
  // currentJobId: uuid('current_job_id'), // TODO: Add FK after ct_jobs table is created
  
  // Certificaciones
  lastInspectionDate: timestamp('last_inspection_date'),
  nextInspectionDate: timestamp('next_inspection_date'),
  certificationStatus: ctCertificationStatusEnum('certification_status').default('VALID'),
  
  // Auditoría
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
});

// CT Reels table
export const ctReels = pgTable('ct_reels', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  // assetId: uuid('asset_id'), // Digital Twin reference - TODO: Add when assets table exists
  ctUnitId: uuid('ct_unit_id').references(() => ctUnits.id, { onDelete: 'set null' }),
  
  // Identificación
  reelNumber: varchar('reel_number', { length: 50 }).notNull(),
  serialNumber: varchar('serial_number', { length: 100 }),
  manufacturer: varchar('manufacturer', { length: 100 }),
  
  // Especificaciones del tubing
  outerDiameterIn: decimal('outer_diameter_in', { precision: 5, scale: 3 }).notNull(),
  wallThicknessIn: decimal('wall_thickness_in', { precision: 5, scale: 4 }).notNull(),
  innerDiameterIn: decimal('inner_diameter_in', { precision: 5, scale: 3 }).notNull(),
  steelGrade: ctSteelGradeEnum('steel_grade').notNull(),
  yieldStrengthPsi: integer('yield_strength_psi').notNull(),
  
  // Dimensiones
  totalLengthFt: integer('total_length_ft').notNull(),
  usableLengthFt: integer('usable_length_ft').notNull(),
  weightPerFtLbs: decimal('weight_per_ft_lbs', { precision: 6, scale: 3 }),
  
  // Estado de fatiga
  fatiguePercentage: decimal('fatigue_percentage', { precision: 5, scale: 2 }).default('0.00'),
  totalCycles: integer('total_cycles').default(0),
  totalPressureCycles: integer('total_pressure_cycles').default(0),
  lastFatigueCalculation: timestamp('last_fatigue_calculation'),
  
  // Historial
  manufactureDate: timestamp('manufacture_date'),
  firstUseDate: timestamp('first_use_date'),
  lastCutDate: timestamp('last_cut_date'),
  cutHistoryFt: integer('cut_history_ft').default(0),
  
  // Estado
  status: ctReelStatusEnum('status').notNull().default('AVAILABLE'),
  condition: ctReelConditionEnum('condition').default('GOOD'),
  
  // Auditoría
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
});

// CT Reel Sections table
export const ctReelSections = pgTable('ct_reel_sections', {
  id: uuid('id').primaryKey().defaultRandom(),
  reelId: uuid('reel_id').notNull().references(() => ctReels.id, { onDelete: 'cascade' }),
  
  // Definición de sección
  sectionNumber: integer('section_number').notNull(),
  startDepthFt: integer('start_depth_ft').notNull(),
  endDepthFt: integer('end_depth_ft').notNull(),
  lengthFt: integer('length_ft').notNull(),
  
  // Fatiga acumulada
  fatiguePercentage: decimal('fatigue_percentage', { precision: 5, scale: 2 }).default('0.00'),
  bendingCycles: integer('bending_cycles').default(0),
  pressureCycles: integer('pressure_cycles').default(0),
  combinedDamage: decimal('combined_damage', { precision: 8, scale: 6 }).default('0.000000'),
  
  // Estado
  status: ctSectionStatusEnum('status').default('ACTIVE'),
  lastUpdated: timestamp('last_updated').defaultNow(),
});

// CT Jobs table
export const ctJobs = pgTable('ct_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  
  // Identificación
  jobNumber: varchar('job_number', { length: 50 }).notNull(),
  jobType: varchar('job_type', { length: 50 }).notNull(),
  
  // Relaciones
  wellName: varchar('well_name', { length: 100 }),
  fieldName: varchar('field_name', { length: 100 }),
  ctUnitId: uuid('unit_id').notNull().references(() => ctUnits.id),
  ctReelId: uuid('reel_id').references(() => ctReels.id),
  
  // Fechas
  plannedStartDate: timestamp('planned_start_date'),
  actualStartDate: timestamp('actual_start_date'),
  plannedEndDate: timestamp('planned_end_date'),
  actualEndDate: timestamp('actual_end_date'),
  
  // Estado
  status: varchar('status', { length: 20 }).notNull().default('DRAFT'),
  
  // Personal
  supervisor: varchar('supervisor', { length: 100 }),
  operator: varchar('operator', { length: 100 }),
  
  // Observaciones
  description: text('description'),
  notes: text('notes'),
  
  // Auditoría
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
});

// CT Job Operations table
export const ctJobOperations = pgTable('ct_job_operations', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().references(() => ctJobs.id, { onDelete: 'cascade' }),
  
  // Secuencia
  sequenceNumber: integer('sequence_number').notNull(),
  operationType: varchar('operation_type', { length: 50 }).notNull(),
  
  // Timing
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  durationMinutes: integer('duration_minutes'),
  
  // Parámetros
  startDepthFt: integer('start_depth_ft'),
  endDepthFt: integer('end_depth_ft'),
  maxWeightLbs: integer('max_weight_lbs'),
  maxPressurePsi: integer('max_pressure_psi'),
  pumpRateBpm: decimal('pump_rate_bpm', { precision: 6, scale: 2 }),
  
  // Descripción
  description: text('description'),
  observations: text('observations'),
  
  // Estado
  status: ctOperationStatusEnum('status').default('IN_PROGRESS'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// CT Job Fluids table
export const ctJobFluids = pgTable('ct_job_fluids', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().references(() => ctJobs.id, { onDelete: 'cascade' }),
  
  // Secuencia
  sequenceNumber: integer('sequence_number').notNull(),
  
  // Tipo de fluido
  fluidType: varchar('fluid_type', { length: 50 }).notNull(),
  fluidName: varchar('fluid_name', { length: 100 }),
  densityPpg: decimal('density_ppg', { precision: 5, scale: 2 }),
  viscosityCp: decimal('viscosity_cp', { precision: 6, scale: 2 }),
  
  // Volúmenes
  plannedVolumeBbl: decimal('planned_volume_bbl', { precision: 10, scale: 2 }),
  actualVolumeBbl: decimal('actual_volume_bbl', { precision: 10, scale: 2 }),
  
  // Parámetros de bombeo
  pumpRateBpm: decimal('pump_rate_bpm', { precision: 6, scale: 2 }),
  pumpPressurePsi: integer('pump_pressure_psi'),
  
  // Timing
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  
  // Observaciones
  observations: text('observations'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// CT Job BHA table
export const ctJobBha = pgTable('ct_job_bha', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().references(() => ctJobs.id, { onDelete: 'cascade' }),
  
  // Configuración
  bhaConfigName: varchar('bha_config_name', { length: 100 }),
  totalLengthFt: decimal('total_length_ft', { precision: 8, scale: 2 }),
  totalWeightLbs: decimal('total_weight_lbs', { precision: 10, scale: 2 }),
  
  // Descripción
  description: text('description'),
  schematicUrl: varchar('schematic_url', { length: 500 }),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// CT BHA Components table
export const ctBhaComponents = pgTable('ct_bha_components', {
  id: uuid('id').primaryKey().defaultRandom(),
  bhaId: uuid('bha_id').notNull().references(() => ctJobBha.id, { onDelete: 'cascade' }),
  
  // Posición
  sequenceNumber: integer('sequence_number').notNull(),
  
  // Componente
  componentType: varchar('component_type', { length: 50 }).notNull(),
  componentName: varchar('component_name', { length: 100 }),
  manufacturer: varchar('manufacturer', { length: 100 }),
  model: varchar('model', { length: 100 }),
  serialNumber: varchar('serial_number', { length: 100 }),
  
  // Dimensiones
  lengthFt: decimal('length_ft', { precision: 6, scale: 2 }),
  outerDiameterIn: decimal('outer_diameter_in', { precision: 5, scale: 3 }),
  innerDiameterIn: decimal('inner_diameter_in', { precision: 5, scale: 3 }),
  weightLbs: decimal('weight_lbs', { precision: 8, scale: 2 }),
  
  // Especificaciones
  specifications: jsonb('specifications'),
});

// CT Job Tickets table
export const ctJobTickets = pgTable('ct_job_tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().references(() => ctJobs.id, { onDelete: 'cascade' }),
  
  // Identificación
  ticketNumber: varchar('ticket_number', { length: 50 }).notNull(),
  
  // Contenido
  summary: text('summary'),
  operationsSummary: text('operations_summary'),
  fluidsSummary: text('fluids_summary'),
  resultsSummary: text('results_summary'),
  
  // Firmas digitales
  operatorSignature: varchar('operator_signature', { length: 200 }),
  operatorSignedAt: timestamp('operator_signed_at'),
  supervisorSignature: varchar('supervisor_signature', { length: 200 }),
  supervisorSignedAt: timestamp('supervisor_signed_at'),
  clientSignature: varchar('client_signature', { length: 200 }),
  clientSignedAt: timestamp('client_signed_at'),
  
  // PDF generado
  pdfUrl: varchar('pdf_url', { length: 500 }),
  pdfGeneratedAt: timestamp('pdf_generated_at'),
  
  // Estado
  status: ctTicketStatusEnum('status').default('DRAFT'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// CT Fatigue Cycles table
export const ctFatigueCycles = pgTable('ct_fatigue_cycles', {
  id: uuid('id').primaryKey().defaultRandom(),
  reelId: uuid('reel_id').notNull().references(() => ctReels.id, { onDelete: 'cascade' }),
  sectionId: uuid('section_id').references(() => ctReelSections.id, { onDelete: 'cascade' }),
  jobId: uuid('job_id').references(() => ctJobs.id, { onDelete: 'set null' }),
  
  // Tipo de ciclo
  cycleType: ctFatigueCycleTypeEnum('cycle_type').notNull(),
  
  // Parámetros del ciclo
  maxStrain: decimal('max_strain', { precision: 8, scale: 6 }),
  maxPressurePsi: integer('max_pressure_psi'),
  guideRadiusIn: decimal('guide_radius_in', { precision: 6, scale: 2 }),
  
  // Daño calculado
  cyclesApplied: integer('cycles_applied').default(1),
  cyclesToFailure: integer('cycles_to_failure'),
  damageRatio: decimal('damage_ratio', { precision: 10, scale: 8 }),
  
  // Timestamp
  occurredAt: timestamp('occurred_at').notNull().defaultNow(),
});

// CT Alarms table
export const ctAlarms = pgTable('ct_alarms', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  jobId: uuid('job_id').references(() => ctJobs.id, { onDelete: 'cascade' }),
  ctUnitId: uuid('ct_unit_id').references(() => ctUnits.id, { onDelete: 'set null' }),
  
  // Tipo de alarma
  alarmType: varchar('alarm_type', { length: 50 }).notNull(),
  severity: ctAlarmSeverityEnum('severity').notNull(),
  
  // Detalles
  message: text('message').notNull(),
  parameterName: varchar('parameter_name', { length: 100 }),
  parameterValue: decimal('parameter_value', { precision: 12, scale: 4 }),
  thresholdValue: decimal('threshold_value', { precision: 12, scale: 4 }),
  
  // Estado
  status: ctAlarmStatusEnum('status').default('ACTIVE'),
  acknowledgedBy: uuid('acknowledged_by').references(() => users.id),
  acknowledgedAt: timestamp('acknowledged_at'),
  resolvedAt: timestamp('resolved_at'),
  
  // Timestamp
  triggeredAt: timestamp('triggered_at').notNull().defaultNow(),
});

// CT Realtime Data table (TimescaleDB hypertable)
export const ctRealtimeData = pgTable('ct_realtime_data', {
  time: timestamp('time').notNull(),
  jobId: uuid('job_id').notNull().references(() => ctJobs.id, { onDelete: 'cascade' }),
  ctUnitId: uuid('ct_unit_id').notNull().references(() => ctUnits.id, { onDelete: 'cascade' }),
  
  // Profundidad y posición
  depthFt: decimal('depth_ft', { precision: 10, scale: 2 }),
  speedFtMin: decimal('speed_ft_min', { precision: 8, scale: 2 }),
  
  // Fuerzas
  surfaceWeightLbs: integer('surface_weight_lbs'),
  hookloadLbs: integer('hookload_lbs'),
  
  // Presiones
  pumpPressurePsi: integer('pump_pressure_psi'),
  annulusPressurePsi: integer('annulus_pressure_psi'),
  downholePressurePsi: integer('downhole_pressure_psi'),
  
  // Bombeo
  pumpRateBpm: decimal('pump_rate_bpm', { precision: 6, scale: 2 }),
  pumpStrokesPerMin: integer('pump_strokes_per_min'),
  totalVolumePumpedBbl: decimal('total_volume_pumped_bbl', { precision: 10, scale: 2 }),
  
  // Inyector
  injectorSpeedFtMin: decimal('injector_speed_ft_min', { precision: 6, scale: 2 }),
  injectorForceLbs: integer('injector_force_lbs'),
  
  // Temperatura
  surfaceTempF: decimal('surface_temp_f', { precision: 5, scale: 2 }),
  downholeTempF: decimal('downhole_temp_f', { precision: 5, scale: 2 }),
  
  // Estado
  operationMode: varchar('operation_mode', { length: 50 }),
});

// Relations for Coiled Tubing module
export const ctUnitsRelations = relations(ctUnits, ({ one, many }) => ({
  tenant: one(tenants, { fields: [ctUnits.tenantId], references: [tenants.id] }),
  // currentJob: one(ctJobs, { fields: [ctUnits.currentJobId], references: [ctJobs.id] }), // TODO: Uncomment when currentJobId is added
  reels: many(ctReels),
  jobs: many(ctJobs),
  alarms: many(ctAlarms),
  realtimeData: many(ctRealtimeData),
}));

export const ctReelsRelations = relations(ctReels, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [ctReels.tenantId],
    references: [tenants.id],
  }),
  ctUnit: one(ctUnits, {
    fields: [ctReels.ctUnitId],
    references: [ctUnits.id],
  }),
  sections: many(ctReelSections),
  jobs: many(ctJobs),
  fatigueCycles: many(ctFatigueCycles),
}));

export const ctReelSectionsRelations = relations(ctReelSections, ({ one, many }) => ({
  reel: one(ctReels, {
    fields: [ctReelSections.reelId],
    references: [ctReels.id],
  }),
  fatigueCycles: many(ctFatigueCycles),
}));

export const ctJobsRelations = relations(ctJobs, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [ctJobs.tenantId],
    references: [tenants.id],
  }),
  ctUnit: one(ctUnits, {
    fields: [ctJobs.ctUnitId],
    references: [ctUnits.id],
  }),
  ctReel: one(ctReels, {
    fields: [ctJobs.ctReelId],
    references: [ctReels.id],
  }),
  operations: many(ctJobOperations),
  fluids: many(ctJobFluids),
  bha: one(ctJobBha),
  ticket: one(ctJobTickets),
  alarms: many(ctAlarms),
  fatigueCycles: many(ctFatigueCycles),
  realtimeData: many(ctRealtimeData),
}));

export const ctJobOperationsRelations = relations(ctJobOperations, ({ one }) => ({
  job: one(ctJobs, {
    fields: [ctJobOperations.jobId],
    references: [ctJobs.id],
  }),
}));

export const ctJobFluidsRelations = relations(ctJobFluids, ({ one }) => ({
  job: one(ctJobs, {
    fields: [ctJobFluids.jobId],
    references: [ctJobs.id],
  }),
}));

export const ctJobBhaRelations = relations(ctJobBha, ({ one, many }) => ({
  job: one(ctJobs, {
    fields: [ctJobBha.jobId],
    references: [ctJobs.id],
  }),
  components: many(ctBhaComponents),
}));

export const ctBhaComponentsRelations = relations(ctBhaComponents, ({ one }) => ({
  bha: one(ctJobBha, {
    fields: [ctBhaComponents.bhaId],
    references: [ctJobBha.id],
  }),
}));

export const ctJobTicketsRelations = relations(ctJobTickets, ({ one }) => ({
  job: one(ctJobs, {
    fields: [ctJobTickets.jobId],
    references: [ctJobs.id],
  }),
}));

export const ctFatigueCyclesRelations = relations(ctFatigueCycles, ({ one }) => ({
  reel: one(ctReels, {
    fields: [ctFatigueCycles.reelId],
    references: [ctReels.id],
  }),
  section: one(ctReelSections, {
    fields: [ctFatigueCycles.sectionId],
    references: [ctReelSections.id],
  }),
  job: one(ctJobs, {
    fields: [ctFatigueCycles.jobId],
    references: [ctJobs.id],
  }),
}));

export const ctAlarmsRelations = relations(ctAlarms, ({ one }) => ({
  tenant: one(tenants, {
    fields: [ctAlarms.tenantId],
    references: [tenants.id],
  }),
  job: one(ctJobs, {
    fields: [ctAlarms.jobId],
    references: [ctJobs.id],
  }),
  ctUnit: one(ctUnits, {
    fields: [ctAlarms.ctUnitId],
    references: [ctUnits.id],
  }),
}));

export const ctRealtimeDataRelations = relations(ctRealtimeData, ({ one }) => ({
  job: one(ctJobs, {
    fields: [ctRealtimeData.jobId],
    references: [ctJobs.id],
  }),
  ctUnit: one(ctUnits, {
    fields: [ctRealtimeData.ctUnitId],
    references: [ctUnits.id],
  }),
}));

// Type exports for Coiled Tubing module
export type CtUnit = typeof ctUnits.$inferSelect;
export type NewCtUnit = typeof ctUnits.$inferInsert;
export type CtReel = typeof ctReels.$inferSelect;
export type NewCtReel = typeof ctReels.$inferInsert;
export type CtReelSection = typeof ctReelSections.$inferSelect;
export type NewCtReelSection = typeof ctReelSections.$inferInsert;
export type CtJob = typeof ctJobs.$inferSelect;
export type NewCtJob = typeof ctJobs.$inferInsert;
export type CtJobOperation = typeof ctJobOperations.$inferSelect;
export type NewCtJobOperation = typeof ctJobOperations.$inferInsert;
export type CtJobFluid = typeof ctJobFluids.$inferSelect;
export type NewCtJobFluid = typeof ctJobFluids.$inferInsert;
export type CtJobBha = typeof ctJobBha.$inferSelect;
export type NewCtJobBha = typeof ctJobBha.$inferInsert;
export type CtBhaComponent = typeof ctBhaComponents.$inferSelect;
export type NewCtBhaComponent = typeof ctBhaComponents.$inferInsert;
export type CtJobTicket = typeof ctJobTickets.$inferSelect;
export type NewCtJobTicket = typeof ctJobTickets.$inferInsert;
export type CtFatigueCycle = typeof ctFatigueCycles.$inferSelect;
export type NewCtFatigueCycle = typeof ctFatigueCycles.$inferInsert;
export type CtAlarm = typeof ctAlarms.$inferSelect;
export type NewCtAlarm = typeof ctAlarms.$inferInsert;
export type CtRealtimeData = typeof ctRealtimeData.$inferSelect;
export type NewCtRealtimeData = typeof ctRealtimeData.$inferInsert;
