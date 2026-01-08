# DRILLING OPERATIONS - MODELO DE DATOS

## 1. Diagrama Entidad-Relación

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MODELO DE DATOS - DRILLING                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐           │
│  │    wells    │────────▶│ well_plans  │◀────────│   rigs      │           │
│  └─────────────┘   1:N   └──────┬──────┘   N:1   └─────────────┘           │
│                                 │                                           │
│         ┌───────────────────────┼───────────────────────┐                  │
│         │                       │                       │                  │
│         ▼                       ▼                       ▼                  │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐           │
│  │ trajectories│         │casing_programs│        │ mud_programs│           │
│  └─────────────┘         └─────────────┘         └─────────────┘           │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐           │
│  │survey_points│         │ bha_runs    │         │drilling_params│          │
│  └─────────────┘         └─────────────┘         └─────────────┘           │
│                                 │                       │                  │
│                                 ▼                       ▼                  │
│                          ┌─────────────┐         ┌─────────────┐           │
│                          │ bha_components│       │ td_models   │           │
│                          └─────────────┘         └─────────────┘           │
│                                                                              │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐           │
│  │daily_reports│         │ events      │         │ kill_sheets │           │
│  └─────────────┘         └─────────────┘         └─────────────┘           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Tablas de Planificación

### 2.1 Plan de Pozo

```sql
CREATE TABLE well_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    well_id UUID NOT NULL REFERENCES wells(id),
    rig_id UUID REFERENCES rigs(id),
    
    -- Identificación
    plan_name VARCHAR(100) NOT NULL,
    plan_version INTEGER DEFAULT 1,
    plan_status VARCHAR(20) DEFAULT 'DRAFT',
    -- DRAFT, REVIEW, APPROVED, ACTIVE, COMPLETED, CANCELLED
    
    -- Tipo de pozo
    well_type VARCHAR(30), -- VERTICAL, DIRECTIONAL, HORIZONTAL, ERD, MULTILATERAL
    well_purpose VARCHAR(30), -- EXPLORATION, DEVELOPMENT, INFILL, WORKOVER
    
    -- Profundidades objetivo
    planned_td_md_ft DECIMAL(10, 2),
    planned_td_tvd_ft DECIMAL(10, 2),
    
    -- Fechas planificadas
    spud_date_planned DATE,
    td_date_planned DATE,
    days_planned INTEGER,
    
    -- Costos estimados
    afe_number VARCHAR(50),
    estimated_cost_usd DECIMAL(15, 2),
    
    -- Aprobaciones
    prepared_by UUID REFERENCES users(id),
    reviewed_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    
    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_plan_status CHECK (plan_status IN 
        ('DRAFT', 'REVIEW', 'APPROVED', 'ACTIVE', 'COMPLETED', 'CANCELLED'))
);

CREATE INDEX idx_well_plans_well ON well_plans(well_id);
CREATE INDEX idx_well_plans_status ON well_plans(plan_status);
```

### 2.2 Trayectorias

```sql
CREATE TABLE trajectories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_plan_id UUID NOT NULL REFERENCES well_plans(id) ON DELETE CASCADE,
    
    -- Tipo
    trajectory_type VARCHAR(20) NOT NULL,
    -- PLANNED, ACTUAL, PROPOSED
    
    -- Configuración del diseño
    design_method VARCHAR(30), -- MINIMUM_CURVATURE, RADIUS_OF_CURVATURE
    
    -- Parámetros de construcción
    kop_md_ft DECIMAL(10, 2),
    kop_tvd_ft DECIMAL(10, 2),
    build_rate_deg_100ft DECIMAL(6, 3),
    turn_rate_deg_100ft DECIMAL(6, 3),
    max_dls_deg_100ft DECIMAL(6, 3),
    
    -- Sección horizontal (si aplica)
    landing_point_md_ft DECIMAL(10, 2),
    landing_point_tvd_ft DECIMAL(10, 2),
    lateral_length_ft DECIMAL(10, 2),
    lateral_azimuth_deg DECIMAL(6, 2),
    
    -- Target
    target_ns_ft DECIMAL(12, 2),
    target_ew_ft DECIMAL(12, 2),
    target_tvd_ft DECIMAL(10, 2),
    target_radius_ft DECIMAL(8, 2),
    
    -- Puntos de survey calculados (JSONB)
    survey_points JSONB,
    -- [{md, inc, azi, tvd, ns, ew, dls, vs}]
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Puntos de survey individuales (para trayectoria actual)
CREATE TABLE survey_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trajectory_id UUID NOT NULL REFERENCES trajectories(id) ON DELETE CASCADE,
    
    -- Profundidad
    md_ft DECIMAL(10, 2) NOT NULL,
    
    -- Ángulos
    inclination_deg DECIMAL(6, 3) NOT NULL,
    azimuth_deg DECIMAL(6, 3) NOT NULL,
    
    -- Posición calculada
    tvd_ft DECIMAL(10, 2),
    ns_ft DECIMAL(12, 2),
    ew_ft DECIMAL(12, 2),
    vs_ft DECIMAL(12, 2),
    dls_deg_100ft DECIMAL(6, 3),
    
    -- Correcciones magnéticas
    magnetic_declination DECIMAL(6, 3),
    grid_correction DECIMAL(6, 3),
    total_correction DECIMAL(6, 3),
    
    -- Fuente
    survey_source VARCHAR(30), -- MWD, GYRO, SINGLE_SHOT, CALCULATED
    tool_type VARCHAR(50),
    
    -- Tiempo
    survey_time TIMESTAMPTZ,
    
    -- Calidad
    quality_check_passed BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_survey_points_trajectory ON survey_points(trajectory_id, md_ft);
```

### 2.3 Programa de Revestimiento

```sql
CREATE TABLE casing_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_plan_id UUID NOT NULL REFERENCES well_plans(id) ON DELETE CASCADE,
    
    -- Identificación
    casing_string VARCHAR(30) NOT NULL,
    -- CONDUCTOR, SURFACE, INTERMEDIATE, PRODUCTION, LINER
    string_number INTEGER,
    
    -- Profundidades
    setting_depth_md_ft DECIMAL(10, 2) NOT NULL,
    setting_depth_tvd_ft DECIMAL(10, 2),
    top_depth_md_ft DECIMAL(10, 2) DEFAULT 0,
    
    -- Especificaciones
    od_inches DECIMAL(6, 3) NOT NULL,
    id_inches DECIMAL(6, 3),
    weight_ppf DECIMAL(6, 2) NOT NULL,
    grade VARCHAR(20) NOT NULL, -- J55, K55, L80, N80, C95, P110, Q125
    connection_type VARCHAR(50),
    
    -- Propiedades mecánicas
    burst_rating_psi DECIMAL(10, 2),
    collapse_rating_psi DECIMAL(10, 2),
    tension_rating_klbs DECIMAL(10, 2),
    
    -- Factores de diseño
    burst_df DECIMAL(4, 2) DEFAULT 1.10,
    collapse_df DECIMAL(4, 2) DEFAULT 1.00,
    tension_df DECIMAL(4, 2) DEFAULT 1.60,
    
    -- Cemento
    cement_top_md_ft DECIMAL(10, 2),
    cement_volume_bbl DECIMAL(10, 2),
    cement_type VARCHAR(50),
    cement_density_ppg DECIMAL(6, 2),
    
    -- Hoyo
    hole_size_inches DECIMAL(6, 3),
    
    -- Estado
    status VARCHAR(20) DEFAULT 'PLANNED',
    -- PLANNED, SET, CEMENTED, TESTED, FAILED
    
    set_date TIMESTAMPTZ,
    test_pressure_psi DECIMAL(10, 2),
    test_result VARCHAR(20), -- PASS, FAIL
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_casing_programs_plan ON casing_programs(well_plan_id);
```

### 2.4 Programa de Lodo

```sql
CREATE TABLE mud_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_plan_id UUID NOT NULL REFERENCES well_plans(id) ON DELETE CASCADE,
    
    -- Sección
    section_name VARCHAR(50) NOT NULL,
    hole_size_inches DECIMAL(6, 3),
    depth_from_ft DECIMAL(10, 2),
    depth_to_ft DECIMAL(10, 2),
    
    -- Tipo de lodo
    mud_type VARCHAR(30) NOT NULL, -- WBM, OBM, SBM, FOAM, AIR
    mud_system VARCHAR(50), -- SPUD, GEL, POLYMER, NACL, KCL, INVERT
    
    -- Propiedades objetivo
    mud_weight_min_ppg DECIMAL(6, 3),
    mud_weight_max_ppg DECIMAL(6, 3),
    target_pv_cp DECIMAL(6, 2),
    target_yp_lbf DECIMAL(6, 2),
    target_gel_10s DECIMAL(6, 2),
    target_gel_10m DECIMAL(6, 2),
    target_fluid_loss_ml DECIMAL(6, 2),
    target_ph_min DECIMAL(4, 2),
    target_ph_max DECIMAL(4, 2),
    
    -- Ventana operacional
    pore_pressure_ppg DECIMAL(6, 3),
    fracture_gradient_ppg DECIMAL(6, 3),
    
    -- Condiciones especiales
    h2s_expected BOOLEAN DEFAULT false,
    co2_expected BOOLEAN DEFAULT false,
    lost_circulation_risk VARCHAR(20), -- LOW, MEDIUM, HIGH
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Tablas de Operaciones en Tiempo Real

### 3.1 BHA (Bottom Hole Assembly)

```sql
CREATE TABLE bha_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_plan_id UUID NOT NULL REFERENCES well_plans(id),
    
    -- Identificación
    run_number INTEGER NOT NULL,
    bha_name VARCHAR(100),
    
    -- Profundidades
    depth_in_ft DECIMAL(10, 2),
    depth_out_ft DECIMAL(10, 2),
    
    -- Tiempos
    time_in TIMESTAMPTZ,
    time_out TIMESTAMPTZ,
    rotating_hours DECIMAL(8, 2),
    circulating_hours DECIMAL(8, 2),
    
    -- Broca
    bit_number INTEGER,
    bit_size_inches DECIMAL(6, 3),
    bit_type VARCHAR(50), -- PDC, TRICONE, IMPREG
    bit_manufacturer VARCHAR(50),
    bit_model VARCHAR(50),
    bit_serial VARCHAR(50),
    bit_tfa_sqin DECIMAL(6, 4),
    bit_jets VARCHAR(50), -- e.g., "3x12, 3x14"
    
    -- Performance
    footage_drilled_ft DECIMAL(10, 2),
    avg_rop_ft_hr DECIMAL(8, 2),
    max_rop_ft_hr DECIMAL(8, 2),
    
    -- Dull grading (IADC)
    dull_inner VARCHAR(2),
    dull_outer VARCHAR(2),
    dull_dull_char VARCHAR(2),
    dull_location VARCHAR(2),
    dull_bearing VARCHAR(2),
    dull_gauge VARCHAR(4),
    dull_other VARCHAR(2),
    dull_reason_pulled VARCHAR(2),
    
    -- Estado
    status VARCHAR(20) DEFAULT 'ACTIVE',
    -- PLANNED, ACTIVE, COMPLETED, FAILED
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Componentes del BHA
CREATE TABLE bha_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bha_run_id UUID NOT NULL REFERENCES bha_runs(id) ON DELETE CASCADE,
    
    -- Posición (desde fondo)
    sequence_number INTEGER NOT NULL,
    
    -- Identificación
    component_type VARCHAR(30) NOT NULL,
    -- BIT, MOTOR, RSS, MWD, LWD, STABILIZER, DC, HWDP, JAR, CROSSOVER
    
    description VARCHAR(200),
    serial_number VARCHAR(50),
    
    -- Dimensiones
    od_inches DECIMAL(6, 3),
    id_inches DECIMAL(6, 3),
    length_ft DECIMAL(8, 2),
    weight_lbs DECIMAL(10, 2),
    
    -- Propiedades específicas
    properties JSONB,
    -- Motor: {bend_angle, flow_range, diff_pressure}
    -- Stabilizer: {blade_od, blade_length, num_blades}
    -- MWD: {gamma, resistivity, inclination, azimuth}
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Parámetros de Perforación (Time-Series)

```sql
-- Usar TimescaleDB para datos de alta frecuencia
CREATE TABLE drilling_params (
    time TIMESTAMPTZ NOT NULL,
    well_id UUID NOT NULL,
    bha_run_id UUID REFERENCES bha_runs(id),
    
    -- Profundidad
    bit_depth_ft DECIMAL(10, 2),
    hole_depth_ft DECIMAL(10, 2),
    
    -- Peso
    hookload_klbs DECIMAL(8, 2),
    wob_klbs DECIMAL(8, 2),
    
    -- Rotación
    rpm_surface DECIMAL(6, 2),
    rpm_downhole DECIMAL(6, 2),
    torque_kftlbs DECIMAL(8, 2),
    
    -- Bombeo
    spp_psi DECIMAL(8, 2),
    flow_rate_gpm DECIMAL(8, 2),
    pump1_spm DECIMAL(6, 2),
    pump2_spm DECIMAL(6, 2),
    pump3_spm DECIMAL(6, 2),
    
    -- ROP
    rop_ft_hr DECIMAL(8, 2),
    
    -- Lodo
    mw_in_ppg DECIMAL(6, 3),
    mw_out_ppg DECIMAL(6, 3),
    flow_out_gpm DECIMAL(8, 2),
    pit_volume_bbl DECIMAL(10, 2),
    pit_gain_bbl DECIMAL(8, 2),
    
    -- Temperaturas
    mud_temp_in_f DECIMAL(6, 2),
    mud_temp_out_f DECIMAL(6, 2),
    
    -- Gas
    total_gas_units DECIMAL(8, 2),
    connection_gas_units DECIMAL(8, 2),
    
    -- Presiones adicionales
    choke_pressure_psi DECIMAL(8, 2),
    casing_pressure_psi DECIMAL(8, 2),
    
    -- Bloque
    block_position_ft DECIMAL(8, 2),
    
    -- Estado de operación
    rig_state VARCHAR(30),
    -- DRILLING, CIRCULATING, TRIPPING_IN, TRIPPING_OUT, CONNECTION, etc.
    
    PRIMARY KEY (time, well_id)
);

-- Convertir a hypertable
SELECT create_hypertable('drilling_params', 'time');

-- Índices
CREATE INDEX idx_drilling_params_well ON drilling_params(well_id, time DESC);
CREATE INDEX idx_drilling_params_depth ON drilling_params(well_id, bit_depth_ft);

-- Política de retención (1 año de datos detallados)
SELECT add_retention_policy('drilling_params', INTERVAL '1 year');

-- Agregación continua para resúmenes por minuto
CREATE MATERIALIZED VIEW drilling_params_1min
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 minute', time) AS bucket,
    well_id,
    AVG(hookload_klbs) as avg_hookload,
    AVG(wob_klbs) as avg_wob,
    AVG(rpm_surface) as avg_rpm,
    AVG(torque_kftlbs) as avg_torque,
    AVG(spp_psi) as avg_spp,
    AVG(rop_ft_hr) as avg_rop,
    MAX(bit_depth_ft) as max_depth
FROM drilling_params
GROUP BY bucket, well_id;
```

### 3.3 Modelo de Torque & Drag

```sql
CREATE TABLE td_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_plan_id UUID NOT NULL REFERENCES well_plans(id),
    trajectory_id UUID REFERENCES trajectories(id),
    bha_run_id UUID REFERENCES bha_runs(id),
    
    -- Tipo de modelo
    model_type VARCHAR(20) NOT NULL, -- SOFT_STRING, STIFF_STRING
    model_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- Coeficientes de fricción
    cased_hole_friction DECIMAL(4, 3) DEFAULT 0.25,
    open_hole_friction DECIMAL(4, 3) DEFAULT 0.35,
    
    -- Propiedades del lodo
    mud_weight_ppg DECIMAL(6, 3),
    
    -- Resultados por profundidad
    results JSONB NOT NULL,
    -- [{depth, trip_in_klbs, trip_out_klbs, rotating_klbs, 
    --   on_bottom_klbs, torque_kftlbs, buckling_load_klbs}]
    
    -- Límites del equipo
    max_hookload_klbs DECIMAL(10, 2),
    max_torque_kftlbs DECIMAL(10, 2),
    
    -- Validación
    validated BOOLEAN DEFAULT false,
    validated_by UUID REFERENCES users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Tablas de Reportes

### 4.1 Daily Drilling Report (DDR)

```sql
CREATE TABLE daily_drilling_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    well_id UUID NOT NULL REFERENCES wells(id),
    well_plan_id UUID REFERENCES well_plans(id),
    
    -- Fecha del reporte
    report_date DATE NOT NULL,
    report_number INTEGER,
    
    -- Profundidades
    depth_start_ft DECIMAL(10, 2),
    depth_end_ft DECIMAL(10, 2),
    footage_drilled_ft DECIMAL(10, 2),
    
    -- Tiempos (24 horas)
    drilling_hours DECIMAL(5, 2),
    tripping_hours DECIMAL(5, 2),
    circulating_hours DECIMAL(5, 2),
    reaming_hours DECIMAL(5, 2),
    casing_hours DECIMAL(5, 2),
    cementing_hours DECIMAL(5, 2),
    logging_hours DECIMAL(5, 2),
    testing_hours DECIMAL(5, 2),
    rig_repair_hours DECIMAL(5, 2),
    weather_hours DECIMAL(5, 2),
    other_npt_hours DECIMAL(5, 2),
    
    -- Costos del día
    daily_cost_usd DECIMAL(12, 2),
    cumulative_cost_usd DECIMAL(15, 2),
    
    -- Días
    days_from_spud INTEGER,
    days_planned INTEGER,
    days_ahead_behind INTEGER,
    
    -- Resumen de operaciones
    operations_summary TEXT,
    
    -- Próximas 24 horas
    forecast_operations TEXT,
    
    -- Problemas y lecciones
    problems_encountered TEXT,
    lessons_learned TEXT,
    
    -- Seguridad
    safety_observations TEXT,
    incidents INTEGER DEFAULT 0,
    near_misses INTEGER DEFAULT 0,
    
    -- Aprobación
    prepared_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    
    -- Estado
    status VARCHAR(20) DEFAULT 'DRAFT',
    -- DRAFT, SUBMITTED, APPROVED
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(well_id, report_date)
);

CREATE INDEX idx_ddr_well_date ON daily_drilling_reports(well_id, report_date);
```

### 4.2 Eventos de Perforación

```sql
CREATE TABLE drilling_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_id UUID NOT NULL REFERENCES wells(id),
    ddr_id UUID REFERENCES daily_drilling_reports(id),
    
    -- Tiempo
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_hours DECIMAL(6, 2),
    
    -- Profundidad
    depth_start_ft DECIMAL(10, 2),
    depth_end_ft DECIMAL(10, 2),
    
    -- Clasificación
    event_category VARCHAR(30) NOT NULL,
    -- DRILLING, TRIPPING, CASING, CEMENTING, LOGGING, NPT, etc.
    event_code VARCHAR(10),
    event_description TEXT,
    
    -- NPT específico
    is_npt BOOLEAN DEFAULT false,
    npt_category VARCHAR(50),
    npt_subcategory VARCHAR(50),
    
    -- Costo asociado
    cost_usd DECIMAL(12, 2),
    
    -- Notas
    notes TEXT,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_drilling_events_well_time ON drilling_events(well_id, start_time);
```

---

## 5. Funciones y Triggers

### 5.1 Calcular Survey con Minimum Curvature

```sql
CREATE OR REPLACE FUNCTION calculate_survey_minimum_curvature(
    p_md1 DECIMAL, p_inc1 DECIMAL, p_azi1 DECIMAL,
    p_tvd1 DECIMAL, p_ns1 DECIMAL, p_ew1 DECIMAL,
    p_md2 DECIMAL, p_inc2 DECIMAL, p_azi2 DECIMAL
) RETURNS TABLE (tvd DECIMAL, ns DECIMAL, ew DECIMAL, dls DECIMAL) AS $$
DECLARE
    v_delta_md DECIMAL;
    v_i1_rad DECIMAL;
    v_i2_rad DECIMAL;
    v_a1_rad DECIMAL;
    v_a2_rad DECIMAL;
    v_cos_dl DECIMAL;
    v_dl DECIMAL;
    v_rf DECIMAL;
BEGIN
    v_delta_md := p_md2 - p_md1;
    v_i1_rad := RADIANS(p_inc1);
    v_i2_rad := RADIANS(p_inc2);
    v_a1_rad := RADIANS(p_azi1);
    v_a2_rad := RADIANS(p_azi2);
    
    -- Dogleg angle
    v_cos_dl := COS(v_i2_rad - v_i1_rad) - 
                SIN(v_i1_rad) * SIN(v_i2_rad) * (1 - COS(v_a2_rad - v_a1_rad));
    v_dl := ACOS(LEAST(GREATEST(v_cos_dl, -1), 1));
    
    -- Ratio factor
    IF v_dl < 0.0001 THEN
        v_rf := 1;
    ELSE
        v_rf := 2 / v_dl * TAN(v_dl / 2);
    END IF;
    
    -- Calculate positions
    tvd := p_tvd1 + (v_delta_md / 2) * (COS(v_i1_rad) + COS(v_i2_rad)) * v_rf;
    ns := p_ns1 + (v_delta_md / 2) * (SIN(v_i1_rad) * COS(v_a1_rad) + 
                                       SIN(v_i2_rad) * COS(v_a2_rad)) * v_rf;
    ew := p_ew1 + (v_delta_md / 2) * (SIN(v_i1_rad) * SIN(v_a1_rad) + 
                                       SIN(v_i2_rad) * SIN(v_a2_rad)) * v_rf;
    
    -- DLS in deg/100ft
    dls := DEGREES(v_dl) * 100 / v_delta_md;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;
```

