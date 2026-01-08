# WELL MANAGEMENT - MODELO DE DATOS

## 1. Diagrama Entidad-Relación

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MODELO DE DATOS - WELL MANAGEMENT                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐           │
│  │    wells    │────────▶│completions  │◀────────│  lift_systems│          │
│  └──────┬──────┘   1:N   └──────┬──────┘   N:1   └─────────────┘           │
│         │                       │                                           │
│         │                       │                                           │
│         ▼                       ▼                                           │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐           │
│  │production_  │         │  esp_data   │         │gas_lift_data│           │
│  │   data      │         └─────────────┘         └─────────────┘           │
│  └─────────────┘                                                            │
│         │                ┌─────────────┐         ┌─────────────┐           │
│         │                │rod_pump_data│         │  pcp_data   │           │
│         │                └─────────────┘         └─────────────┘           │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐           │
│  │  allocations│         │   alarms    │         │optimization │           │
│  └─────────────┘         └─────────────┘         │   _results  │           │
│                                                   └─────────────┘           │
│  ┌─────────────┐         ┌─────────────┐                                   │
│  │decline_curves│        │  downtime   │                                   │
│  └─────────────┘         └─────────────┘                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Tablas de Pozos y Completaciones

### 2.1 Pozos

```sql
CREATE TABLE wells (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    field_id UUID REFERENCES fields(id),
    
    -- Identificación
    well_name VARCHAR(50) NOT NULL,
    well_code VARCHAR(30) NOT NULL UNIQUE,
    api_number VARCHAR(20),
    
    -- Ubicación
    surface_latitude DECIMAL(10, 7),
    surface_longitude DECIMAL(10, 7),
    surface_elevation_ft DECIMAL(10, 2),
    
    -- Profundidades
    total_depth_md_ft DECIMAL(10, 2),
    total_depth_tvd_ft DECIMAL(10, 2),
    
    -- Estado
    well_status VARCHAR(20) DEFAULT 'ACTIVE',
    -- ACTIVE, SHUT_IN, SUSPENDED, ABANDONED, DRILLING, COMPLETING
    
    well_type VARCHAR(20) DEFAULT 'PRODUCER',
    -- PRODUCER, INJECTOR, DISPOSAL, OBSERVATION
    
    -- Sistema de levantamiento
    lift_type VARCHAR(20),
    -- NATURAL_FLOW, ESP, GAS_LIFT, ROD_PUMP, PCP, JET_PUMP, PLUNGER
    
    -- Fechas
    spud_date DATE,
    completion_date DATE,
    first_production_date DATE,
    
    -- Yacimiento principal
    primary_reservoir_id UUID REFERENCES reservoirs(id),
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_well_status CHECK (well_status IN ('ACTIVE', 'SHUT_IN', 'SUSPENDED', 'ABANDONED', 'DRILLING', 'COMPLETING'))
);

CREATE INDEX idx_wells_tenant ON wells(tenant_id);
CREATE INDEX idx_wells_field ON wells(field_id);
CREATE INDEX idx_wells_status ON wells(well_status);
CREATE INDEX idx_wells_lift_type ON wells(lift_type);
```

### 2.2 Completaciones

```sql
CREATE TABLE completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_id UUID NOT NULL REFERENCES wells(id),
    
    -- Identificación
    completion_name VARCHAR(50),
    completion_number INTEGER DEFAULT 1,
    
    -- Tipo
    completion_type VARCHAR(30),
    -- SINGLE, DUAL, TRIPLE, COMMINGLED
    
    -- Tubulares
    tubing_od_inches DECIMAL(6, 3),
    tubing_id_inches DECIMAL(6, 3),
    tubing_depth_md_ft DECIMAL(10, 2),
    tubing_depth_tvd_ft DECIMAL(10, 2),
    
    -- Packer
    packer_depth_md_ft DECIMAL(10, 2),
    packer_type VARCHAR(50),
    
    -- Perforaciones
    perf_top_md_ft DECIMAL(10, 2),
    perf_bottom_md_ft DECIMAL(10, 2),
    perf_shots_per_ft INTEGER,
    perf_diameter_inches DECIMAL(4, 3),
    
    -- Estado
    status VARCHAR(20) DEFAULT 'ACTIVE',
    -- ACTIVE, SHUT_IN, ABANDONED
    
    -- Fechas
    completion_date DATE,
    last_workover_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_completions_well ON completions(well_id);
```

---

## 3. Tablas de Producción

### 3.1 Datos de Producción

```sql
CREATE TABLE production_data (
    time TIMESTAMPTZ NOT NULL,
    well_id UUID NOT NULL REFERENCES wells(id),
    
    -- Tasas
    oil_rate_bopd DECIMAL(12, 2),
    water_rate_bwpd DECIMAL(12, 2),
    gas_rate_mscfd DECIMAL(12, 2),
    liquid_rate_blpd DECIMAL(12, 2),
    
    -- Proporciones
    water_cut_percent DECIMAL(5, 2),
    gor_scf_stb DECIMAL(10, 2),
    
    -- Presiones
    tubing_pressure_psi DECIMAL(10, 2),
    casing_pressure_psi DECIMAL(10, 2),
    flowing_bhp_psi DECIMAL(10, 2),
    
    -- Temperaturas
    wellhead_temp_f DECIMAL(8, 2),
    bottomhole_temp_f DECIMAL(8, 2),
    
    -- Estado operacional
    well_status VARCHAR(20),
    choke_size_64ths INTEGER,
    hours_on DECIMAL(4, 1) DEFAULT 24,
    
    -- Fuente de datos
    data_source VARCHAR(20),
    -- SCADA, MANUAL, ALLOCATION, ESTIMATED
    
    PRIMARY KEY (time, well_id)
);

-- Hypertable para TimescaleDB
SELECT create_hypertable('production_data', 'time', if_not_exists => TRUE);

-- Índices
CREATE INDEX idx_production_well ON production_data(well_id, time DESC);

-- Continuous aggregate para datos diarios
CREATE MATERIALIZED VIEW production_daily
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', time) AS day,
    well_id,
    AVG(oil_rate_bopd) as avg_oil_rate,
    AVG(water_rate_bwpd) as avg_water_rate,
    AVG(gas_rate_mscfd) as avg_gas_rate,
    AVG(water_cut_percent) as avg_water_cut,
    SUM(oil_rate_bopd * hours_on / 24) as cum_oil_bbl,
    SUM(water_rate_bwpd * hours_on / 24) as cum_water_bbl,
    SUM(gas_rate_mscfd * hours_on / 24) as cum_gas_mscf
FROM production_data
GROUP BY time_bucket('1 day', time), well_id;
```

### 3.2 Producción Acumulada

```sql
CREATE TABLE cumulative_production (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_id UUID NOT NULL REFERENCES wells(id),
    
    as_of_date DATE NOT NULL,
    
    -- Acumulados
    cum_oil_mbbl DECIMAL(14, 3),
    cum_water_mbbl DECIMAL(14, 3),
    cum_gas_mmscf DECIMAL(14, 3),
    cum_liquid_mbbl DECIMAL(14, 3),
    
    -- Días de producción
    producing_days INTEGER,
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(well_id, as_of_date)
);
```

---

## 4. Tablas de ESP

### 4.1 Configuración ESP

```sql
CREATE TABLE esp_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_id UUID NOT NULL REFERENCES wells(id),
    
    -- Instalación
    installation_date DATE NOT NULL,
    removal_date DATE,
    run_number INTEGER DEFAULT 1,
    
    -- Bomba
    pump_manufacturer VARCHAR(50),
    pump_model VARCHAR(50),
    pump_stages INTEGER,
    pump_series VARCHAR(20),
    design_rate_bpd DECIMAL(10, 2),
    design_head_ft DECIMAL(10, 2),
    
    -- Motor
    motor_manufacturer VARCHAR(50),
    motor_hp DECIMAL(8, 2),
    motor_voltage INTEGER,
    motor_amperage DECIMAL(8, 2),
    
    -- Cable
    cable_size_awg INTEGER,
    cable_length_ft DECIMAL(10, 2),
    
    -- Profundidad
    setting_depth_md_ft DECIMAL(10, 2),
    setting_depth_tvd_ft DECIMAL(10, 2),
    
    -- VSD
    vsd_manufacturer VARCHAR(50),
    vsd_model VARCHAR(50),
    frequency_range_hz VARCHAR(20),
    
    -- Estado
    status VARCHAR(20) DEFAULT 'ACTIVE',
    -- ACTIVE, PULLED, FAILED
    failure_date DATE,
    failure_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_esp_config_well ON esp_configurations(well_id);
```

### 4.2 Datos ESP en Tiempo Real

```sql
CREATE TABLE esp_realtime_data (
    time TIMESTAMPTZ NOT NULL,
    well_id UUID NOT NULL REFERENCES wells(id),
    
    -- Frecuencia y corriente
    frequency_hz DECIMAL(6, 2),
    motor_current_amps DECIMAL(8, 2),
    motor_voltage_v DECIMAL(8, 2),
    
    -- Presiones
    intake_pressure_psi DECIMAL(10, 2),
    discharge_pressure_psi DECIMAL(10, 2),
    
    -- Temperaturas
    motor_temp_f DECIMAL(8, 2),
    intake_temp_f DECIMAL(8, 2),
    
    -- Vibración
    vibration_x DECIMAL(8, 4),
    vibration_y DECIMAL(8, 4),
    
    -- Calculados
    power_kw DECIMAL(10, 2),
    pump_efficiency_percent DECIMAL(5, 2),
    
    PRIMARY KEY (time, well_id)
);

SELECT create_hypertable('esp_realtime_data', 'time', if_not_exists => TRUE);
```

---

## 5. Tablas de Gas Lift

### 5.1 Configuración Gas Lift

```sql
CREATE TABLE gas_lift_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_id UUID NOT NULL REFERENCES wells(id),
    
    -- Diseño
    design_date DATE,
    design_injection_rate_mscfd DECIMAL(10, 2),
    design_production_rate_bopd DECIMAL(10, 2),
    
    -- Mandrel/Valves
    number_of_mandrels INTEGER,
    operating_valve_depth_ft DECIMAL(10, 2),
    
    -- Presiones de diseño
    surface_injection_pressure_psi DECIMAL(10, 2),
    casing_head_pressure_psi DECIMAL(10, 2),
    
    status VARCHAR(20) DEFAULT 'ACTIVE',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gas_lift_valves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gl_config_id UUID NOT NULL REFERENCES gas_lift_configurations(id),
    
    valve_number INTEGER NOT NULL,
    depth_md_ft DECIMAL(10, 2) NOT NULL,
    depth_tvd_ft DECIMAL(10, 2),
    
    -- Especificaciones
    valve_type VARCHAR(30), -- IPO, PPO, ORIFICE, DUMMY
    valve_size VARCHAR(20),
    port_size_64ths INTEGER,
    test_rack_opening_psi INTEGER,
    
    -- Estado
    status VARCHAR(20) DEFAULT 'ACTIVE',
    -- ACTIVE, CLOSED, LEAKING, CUTOUT
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 Datos Gas Lift en Tiempo Real

```sql
CREATE TABLE gas_lift_realtime_data (
    time TIMESTAMPTZ NOT NULL,
    well_id UUID NOT NULL REFERENCES wells(id),
    
    -- Inyección
    injection_rate_mscfd DECIMAL(10, 2),
    injection_pressure_psi DECIMAL(10, 2),
    
    -- Presiones de pozo
    tubing_pressure_psi DECIMAL(10, 2),
    casing_pressure_psi DECIMAL(10, 2),
    
    -- Válvula de inyección
    injection_choke_size VARCHAR(20),
    
    -- Calculados
    glr_total_scf_bbl DECIMAL(10, 2),
    gl_efficiency_percent DECIMAL(5, 2),
    
    PRIMARY KEY (time, well_id)
);

SELECT create_hypertable('gas_lift_realtime_data', 'time', if_not_exists => TRUE);
```

---

## 6. Tablas de Rod Pump

### 6.1 Configuración Rod Pump

```sql
CREATE TABLE rod_pump_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_id UUID NOT NULL REFERENCES wells(id),
    
    -- Unidad de superficie
    pumping_unit_type VARCHAR(50),
    unit_manufacturer VARCHAR(50),
    unit_model VARCHAR(50),
    unit_size VARCHAR(30),
    
    -- Carrera
    stroke_length_inches DECIMAL(6, 2),
    strokes_per_minute DECIMAL(6, 2),
    
    -- Motor
    motor_hp DECIMAL(8, 2),
    
    -- Bomba de fondo
    pump_depth_ft DECIMAL(10, 2),
    pump_bore_inches DECIMAL(6, 3),
    plunger_length_inches DECIMAL(8, 2),
    
    -- Varillas
    rod_string JSONB,
    -- [{size: "7/8", length_ft: 2000, grade: "D"}, ...]
    
    status VARCHAR(20) DEFAULT 'ACTIVE',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.2 Datos Dinamométricos

```sql
CREATE TABLE dynamometer_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_id UUID NOT NULL REFERENCES wells(id),
    
    card_time TIMESTAMPTZ NOT NULL,
    card_type VARCHAR(20), -- SURFACE, DOWNHOLE, CALCULATED
    
    -- Parámetros
    stroke_length_inches DECIMAL(6, 2),
    spm DECIMAL(6, 2),
    
    -- Cargas
    peak_load_lbs DECIMAL(10, 2),
    min_load_lbs DECIMAL(10, 2),
    
    -- Datos de la carta
    card_data JSONB,
    -- [{position: 0, load: 5000}, {position: 10, load: 8500}, ...]
    
    -- Diagnóstico
    pump_fillage_percent DECIMAL(5, 2),
    diagnosis VARCHAR(50),
    -- NORMAL, GAS_INTERFERENCE, FLUID_POUND, PUMP_WORN, STUCK_VALVE
    
    -- Producción estimada
    theoretical_displacement_bpd DECIMAL(10, 2),
    estimated_production_bpd DECIMAL(10, 2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dyno_cards_well ON dynamometer_cards(well_id, card_time DESC);
```

---

## 7. Tablas de PCP

### 7.1 Configuración PCP

```sql
CREATE TABLE pcp_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_id UUID NOT NULL REFERENCES wells(id),
    
    -- Bomba
    pump_manufacturer VARCHAR(50),
    pump_model VARCHAR(50),
    pump_depth_ft DECIMAL(10, 2),
    
    -- Especificaciones
    stages INTEGER,
    displacement_bpd_per_rpm DECIMAL(8, 4),
    max_rpm INTEGER,
    max_differential_psi INTEGER,
    
    -- Drive
    drive_type VARCHAR(30), -- SURFACE_DRIVE, INSERT_DRIVE
    motor_hp DECIMAL(8, 2),
    
    -- Varillas
    rod_string JSONB,
    
    status VARCHAR(20) DEFAULT 'ACTIVE',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.2 Datos PCP en Tiempo Real

```sql
CREATE TABLE pcp_realtime_data (
    time TIMESTAMPTZ NOT NULL,
    well_id UUID NOT NULL REFERENCES wells(id),
    
    -- Operación
    rpm DECIMAL(6, 2),
    torque_ft_lbs DECIMAL(10, 2),
    
    -- Presiones
    intake_pressure_psi DECIMAL(10, 2),
    discharge_pressure_psi DECIMAL(10, 2),
    
    -- Calculados
    volumetric_efficiency_percent DECIMAL(5, 2),
    power_kw DECIMAL(10, 2),
    
    PRIMARY KEY (time, well_id)
);

SELECT create_hypertable('pcp_realtime_data', 'time', if_not_exists => TRUE);
```

---

## 8. Tablas de Optimización y Análisis

### 8.1 Decline Curve Analysis

```sql
CREATE TABLE decline_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_id UUID NOT NULL REFERENCES wells(id),
    
    analysis_date DATE NOT NULL,
    analyst VARCHAR(100),
    
    -- Tipo de declinación
    decline_type VARCHAR(20) NOT NULL,
    -- EXPONENTIAL, HYPERBOLIC, HARMONIC
    
    -- Parámetros
    initial_rate_bopd DECIMAL(12, 2),
    initial_decline_rate_per_year DECIMAL(8, 6), -- Di
    b_factor DECIMAL(6, 4), -- Solo para hiperbólico
    
    -- Fecha efectiva
    effective_date DATE,
    
    -- Pronóstico
    forecast_months INTEGER,
    eur_mbbl DECIMAL(14, 3),
    remaining_reserves_mbbl DECIMAL(14, 3),
    
    -- Datos del ajuste
    r_squared DECIMAL(6, 4),
    forecast_data JSONB,
    -- [{date: "2026-01", rate: 450}, ...]
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 8.2 Resultados de Optimización

```sql
CREATE TABLE optimization_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_id UUID NOT NULL REFERENCES wells(id),
    
    optimization_date TIMESTAMPTZ DEFAULT NOW(),
    optimization_type VARCHAR(30),
    -- ESP_FREQUENCY, GAS_LIFT_RATE, ROD_PUMP_SPM, PCP_RPM
    
    -- Parámetro actual
    current_parameter VARCHAR(50),
    current_value DECIMAL(12, 4),
    
    -- Recomendación
    recommended_value DECIMAL(12, 4),
    expected_gain_bopd DECIMAL(10, 2),
    expected_savings_usd_day DECIMAL(10, 2),
    
    -- Estado
    status VARCHAR(20) DEFAULT 'PENDING',
    -- PENDING, APPLIED, REJECTED, EXPIRED
    
    applied_at TIMESTAMPTZ,
    applied_by UUID REFERENCES users(id),
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 9. Tablas de Alarmas y Downtime

### 9.1 Alarmas de Producción

```sql
CREATE TABLE production_alarms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_id UUID NOT NULL REFERENCES wells(id),
    
    alarm_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    alarm_type VARCHAR(50) NOT NULL,
    severity VARCHAR(10) NOT NULL, -- INFO, WARNING, CRITICAL
    
    parameter_name VARCHAR(50),
    parameter_value DECIMAL(12, 2),
    threshold_value DECIMAL(12, 2),
    threshold_type VARCHAR(10), -- HIGH, LOW
    
    message TEXT,
    
    -- Estado
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMPTZ,
    
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prod_alarms_well ON production_alarms(well_id);
CREATE INDEX idx_prod_alarms_time ON production_alarms(alarm_time);
CREATE INDEX idx_prod_alarms_active ON production_alarms(well_id) WHERE NOT resolved;
```

### 9.2 Eventos de Downtime

```sql
CREATE TABLE well_downtime (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_id UUID NOT NULL REFERENCES wells(id),
    
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_hours DECIMAL(10, 2),
    
    -- Clasificación
    downtime_category VARCHAR(30) NOT NULL,
    -- SCHEDULED, UNSCHEDULED, WEATHER, THIRD_PARTY
    
    downtime_reason VARCHAR(100),
    downtime_code VARCHAR(20),
    
    -- Impacto
    deferred_oil_bbl DECIMAL(12, 2),
    deferred_gas_mscf DECIMAL(12, 2),
    estimated_loss_usd DECIMAL(12, 2),
    
    -- Documentación
    work_order_id UUID,
    notes TEXT,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_downtime_well ON well_downtime(well_id);
CREATE INDEX idx_downtime_time ON well_downtime(start_time);
```

---

## 10. Vistas

### 10.1 Dashboard de Pozo

```sql
CREATE VIEW well_dashboard AS
SELECT 
    w.id as well_id,
    w.well_name,
    w.well_code,
    w.well_status,
    w.lift_type,
    f.field_name,
    pd.oil_rate_bopd,
    pd.water_rate_bwpd,
    pd.gas_rate_mscfd,
    pd.water_cut_percent,
    pd.tubing_pressure_psi,
    pd.casing_pressure_psi,
    (SELECT COUNT(*) FROM production_alarms pa 
     WHERE pa.well_id = w.id AND NOT pa.resolved) as active_alarms,
    cp.cum_oil_mbbl,
    cp.cum_water_mbbl
FROM wells w
LEFT JOIN fields f ON w.field_id = f.id
LEFT JOIN LATERAL (
    SELECT * FROM production_data 
    WHERE well_id = w.id 
    ORDER BY time DESC LIMIT 1
) pd ON true
LEFT JOIN cumulative_production cp ON w.id = cp.well_id
    AND cp.as_of_date = (SELECT MAX(as_of_date) FROM cumulative_production WHERE well_id = w.id);
```

### 10.2 Resumen de Campo

```sql
CREATE VIEW field_summary AS
SELECT 
    f.id as field_id,
    f.field_name,
    COUNT(w.id) as total_wells,
    COUNT(w.id) FILTER (WHERE w.well_status = 'ACTIVE') as active_wells,
    SUM(pd.oil_rate_bopd) as total_oil_bopd,
    SUM(pd.water_rate_bwpd) as total_water_bwpd,
    SUM(pd.gas_rate_mscfd) as total_gas_mscfd,
    AVG(pd.water_cut_percent) as avg_water_cut
FROM fields f
JOIN wells w ON f.id = w.field_id
LEFT JOIN LATERAL (
    SELECT * FROM production_data 
    WHERE well_id = w.id 
    ORDER BY time DESC LIMIT 1
) pd ON true
GROUP BY f.id, f.field_name;
```

