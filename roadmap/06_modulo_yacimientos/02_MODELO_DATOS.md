# YACIMIENTOS - MODELO DE DATOS

## 1. Diagrama Entidad-Relación

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MODELO DE DATOS - YACIMIENTOS                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐           │
│  │   basins    │────────▶│   fields    │────────▶│ reservoirs  │           │
│  └─────────────┘   1:N   └─────────────┘   1:N   └──────┬──────┘           │
│                                                         │                   │
│                                                         │                   │
│         ┌───────────────────────┬───────────────────────┤                  │
│         │                       │                       │                  │
│         ▼                       ▼                       ▼                  │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐           │
│  │  pvt_data   │         │material_bal │         │  reserves   │           │
│  └─────────────┘         └─────────────┘         └─────────────┘           │
│         │                       │                                           │
│         ▼                       ▼                                           │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐           │
│  │pvt_correlations│      │aquifer_models│        │decline_curves│          │
│  └─────────────┘         └─────────────┘         └─────────────┘           │
│                                                                              │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐           │
│  │pressure_data│         │production_  │         │  forecasts  │           │
│  └─────────────┘         │  history    │         └─────────────┘           │
│                          └─────────────┘                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Jerarquía Geológica

### 2.1 Cuencas

```sql
CREATE TABLE basins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(100) NOT NULL,
    country VARCHAR(50),
    region VARCHAR(100),
    
    -- Tipo de cuenca
    basin_type VARCHAR(50),
    -- FORELAND, RIFT, PASSIVE_MARGIN, INTRACRATONIC, FOREARC
    
    -- Área
    area_km2 DECIMAL(12, 2),
    
    -- Información geológica
    age VARCHAR(50),
    tectonic_setting TEXT,
    
    -- Coordenadas (bounding box)
    min_latitude DECIMAL(10, 7),
    max_latitude DECIMAL(10, 7),
    min_longitude DECIMAL(10, 7),
    max_longitude DECIMAL(10, 7),
    
    description TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_basins_tenant ON basins(tenant_id);
```

### 2.2 Campos

```sql
CREATE TABLE fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    basin_id UUID REFERENCES basins(id),
    
    field_name VARCHAR(100) NOT NULL,
    field_code VARCHAR(30),
    
    -- Operador
    operator VARCHAR(100),
    
    -- Fechas
    discovery_date DATE,
    first_production_date DATE,
    
    -- Área
    area_acres DECIMAL(12, 2),
    
    -- Ubicación
    center_latitude DECIMAL(10, 7),
    center_longitude DECIMAL(10, 7),
    
    -- Estado
    status VARCHAR(20) DEFAULT 'PRODUCING',
    -- PRODUCING, DEVELOPING, ABANDONED, EXPLORATION
    
    -- Tipo
    field_type VARCHAR(30),
    -- ONSHORE, OFFSHORE_SHALLOW, OFFSHORE_DEEP, UNCONVENTIONAL
    
    -- Estadísticas
    total_wells INTEGER DEFAULT 0,
    active_wells INTEGER DEFAULT 0,
    
    description TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fields_basin ON fields(basin_id);
CREATE INDEX idx_fields_tenant ON fields(tenant_id);
```

### 2.3 Yacimientos (Reservoirs)

```sql
CREATE TABLE reservoirs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    field_id UUID NOT NULL REFERENCES fields(id),
    
    reservoir_name VARCHAR(100) NOT NULL,
    reservoir_code VARCHAR(30),
    
    -- Formación
    formation_name VARCHAR(100),
    formation_age VARCHAR(50),
    
    -- Litología
    lithology VARCHAR(50),
    -- SANDSTONE, CARBONATE, SHALE, CONGLOMERATE, FRACTURED
    
    -- Propiedades petrofísicas promedio
    avg_porosity DECIMAL(5, 4),
    avg_permeability_md DECIMAL(12, 4),
    avg_water_saturation DECIMAL(5, 4),
    net_to_gross DECIMAL(5, 4),
    
    -- Profundidad
    top_depth_tvd_ft DECIMAL(10, 2),
    bottom_depth_tvd_ft DECIMAL(10, 2),
    avg_net_pay_ft DECIMAL(10, 2),
    
    -- Área y volumen
    area_acres DECIMAL(12, 2),
    bulk_volume_acre_ft DECIMAL(14, 2),
    
    -- Condiciones iniciales
    initial_pressure_psi DECIMAL(10, 2),
    current_pressure_psi DECIMAL(10, 2),
    reservoir_temperature_f DECIMAL(8, 2),
    pressure_gradient_psi_ft DECIMAL(8, 4),
    
    -- Tipo de fluido
    fluid_type VARCHAR(30),
    -- BLACK_OIL, VOLATILE_OIL, RETROGRADE_GAS, WET_GAS, DRY_GAS
    
    -- Mecanismo de empuje
    drive_mechanism VARCHAR(50),
    -- SOLUTION_GAS, GAS_CAP, WATER_DRIVE, GRAVITY_DRAINAGE, COMBINATION
    
    -- Contactos
    owc_depth_tvd_ft DECIMAL(10, 2),
    goc_depth_tvd_ft DECIMAL(10, 2),
    
    -- Volumétricos iniciales
    ooip_mmstb DECIMAL(14, 4),
    ogip_bcf DECIMAL(14, 4),
    
    -- Recuperación
    recovery_factor DECIMAL(5, 4),
    
    description TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reservoirs_field ON reservoirs(field_id);
CREATE INDEX idx_reservoirs_tenant ON reservoirs(tenant_id);
```

---

## 3. Tablas PVT

### 3.1 Muestras PVT

```sql
CREATE TABLE pvt_samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservoir_id UUID NOT NULL REFERENCES reservoirs(id),
    well_id UUID REFERENCES wells(id),
    
    -- Identificación
    sample_number VARCHAR(30) NOT NULL,
    sample_date DATE,
    
    -- Tipo de muestra
    sample_type VARCHAR(30),
    -- BOTTOMHOLE, SEPARATOR, RECOMBINED, PVT_CELL
    
    -- Profundidad
    sample_depth_ft DECIMAL(10, 2),
    
    -- Condiciones de muestreo
    sample_pressure_psi DECIMAL(10, 2),
    sample_temperature_f DECIMAL(8, 2),
    
    -- Propiedades en superficie
    stock_tank_oil_api DECIMAL(6, 2),
    separator_gor_scf_stb DECIMAL(10, 2),
    gas_gravity DECIMAL(6, 4),
    
    -- Propiedades en yacimiento
    bubble_point_psi DECIMAL(10, 2),
    dew_point_psi DECIMAL(10, 2),
    
    -- Bo @ Pb
    bo_at_pb DECIMAL(8, 4),
    rs_at_pb DECIMAL(10, 2),
    
    -- Viscosidad @ Pb
    oil_viscosity_at_pb_cp DECIMAL(8, 4),
    
    -- Compresibilidad
    oil_compressibility_1_psi DECIMAL(12, 8),
    
    -- Laboratorio
    laboratory VARCHAR(100),
    report_number VARCHAR(50),
    
    -- Calidad
    quality_rating VARCHAR(20),
    -- EXCELLENT, GOOD, FAIR, POOR
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pvt_samples_reservoir ON pvt_samples(reservoir_id);
CREATE INDEX idx_pvt_samples_well ON pvt_samples(well_id);
```

### 3.2 Tablas de Liberación Diferencial

```sql
CREATE TABLE differential_liberation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pvt_sample_id UUID NOT NULL REFERENCES pvt_samples(id) ON DELETE CASCADE,
    
    -- Paso de la tabla
    step_number INTEGER NOT NULL,
    
    -- Presión
    pressure_psi DECIMAL(10, 2) NOT NULL,
    
    -- Propiedades
    oil_fvf_bo DECIMAL(8, 4),
    solution_gor_rs DECIMAL(10, 2),
    oil_density_gm_cc DECIMAL(6, 4),
    oil_viscosity_cp DECIMAL(8, 4),
    gas_fvf_bg DECIMAL(10, 6),
    gas_z_factor DECIMAL(6, 4),
    gas_viscosity_cp DECIMAL(8, 6),
    gas_gravity DECIMAL(6, 4),
    
    UNIQUE(pvt_sample_id, step_number)
);

CREATE INDEX idx_diff_lib_sample ON differential_liberation(pvt_sample_id);
```

### 3.3 Correlaciones PVT

```sql
CREATE TABLE pvt_correlations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservoir_id UUID NOT NULL REFERENCES reservoirs(id),
    
    -- Tipo de correlación
    property VARCHAR(30) NOT NULL,
    -- BUBBLE_POINT, BO, RS, VISCOSITY, Z_FACTOR, BG
    
    correlation_name VARCHAR(50) NOT NULL,
    -- STANDING, VASQUEZ_BEGGS, GLASO, PETROSKY_FARSHAD, etc.
    
    -- Parámetros de entrada
    input_parameters JSONB,
    -- {api: 30, gas_sg: 0.75, temperature_f: 180, ...}
    
    -- Resultado calculado
    calculated_value DECIMAL(12, 6),
    
    -- Comparación con laboratorio (si existe)
    lab_value DECIMAL(12, 6),
    deviation_percent DECIMAL(6, 2),
    
    -- Uso recomendado
    is_recommended BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Tablas de Balance de Materiales

### 4.1 Análisis de Balance de Materiales

```sql
CREATE TABLE material_balance_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservoir_id UUID NOT NULL REFERENCES reservoirs(id),
    
    analysis_name VARCHAR(100),
    analysis_date DATE NOT NULL,
    analyst VARCHAR(100),
    
    -- Tipo de análisis
    analysis_type VARCHAR(30),
    -- HAVLENA_ODEH, CAMPBELL, TANK_MODEL
    
    -- Parámetros del yacimiento
    initial_pressure_psi DECIMAL(10, 2),
    bubble_point_psi DECIMAL(10, 2),
    temperature_f DECIMAL(8, 2),
    
    -- PVT usado
    pvt_sample_id UUID REFERENCES pvt_samples(id),
    
    -- Resultados
    calculated_ooip_mmstb DECIMAL(14, 4),
    calculated_ogip_bcf DECIMAL(14, 4),
    
    -- Gas cap ratio
    m_ratio DECIMAL(8, 4),
    
    -- Acuífero
    aquifer_model VARCHAR(30),
    -- NONE, FETKOVICH, VAN_EVERDINGEN_HURST, SCHILTHUIS
    aquifer_parameters JSONB,
    cumulative_water_influx_mmbbl DECIMAL(14, 4),
    
    -- Estadísticas del ajuste
    r_squared DECIMAL(6, 4),
    
    -- Datos del análisis
    analysis_data JSONB,
    -- [{cum_prod, pressure, f_value, et_value, ...}]
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mbal_reservoir ON material_balance_analyses(reservoir_id);
```

### 4.2 Historial de Presiones del Yacimiento

```sql
CREATE TABLE reservoir_pressure_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservoir_id UUID NOT NULL REFERENCES reservoirs(id),
    
    measurement_date DATE NOT NULL,
    
    -- Presión
    average_pressure_psi DECIMAL(10, 2) NOT NULL,
    pressure_source VARCHAR(30),
    -- BUILDUP, STATIC_GRADIENT, ESTIMATED, MDT
    
    -- Producción acumulada al momento
    cum_oil_mmstb DECIMAL(14, 4),
    cum_gas_bcf DECIMAL(14, 4),
    cum_water_mmbbl DECIMAL(14, 4),
    
    -- Pozos utilizados
    wells_used TEXT[],
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(reservoir_id, measurement_date)
);

CREATE INDEX idx_pressure_hist_reservoir ON reservoir_pressure_history(reservoir_id);
```

---

## 5. Tablas de Reservas

### 5.1 Estimaciones de Reservas

```sql
CREATE TABLE reserves_estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservoir_id UUID REFERENCES reservoirs(id),
    well_id UUID REFERENCES wells(id),
    field_id UUID REFERENCES fields(id),
    
    -- Debe tener al menos uno de reservoir_id, well_id, o field_id
    
    -- Identificación
    estimate_name VARCHAR(100),
    estimate_date DATE NOT NULL,
    effective_date DATE,
    
    -- Clasificación PRMS
    reserves_category VARCHAR(20) NOT NULL,
    -- PROVED, PROBABLE, POSSIBLE
    
    reserves_subcategory VARCHAR(30),
    -- PDP, PDNP, PUD (para proved)
    
    -- Método de estimación
    estimation_method VARCHAR(30),
    -- VOLUMETRIC, DECLINE_CURVE, MATERIAL_BALANCE, SIMULATION
    
    -- Reservas de petróleo
    oil_reserves_mstb DECIMAL(14, 4),
    oil_reserves_low_mstb DECIMAL(14, 4),  -- P90
    oil_reserves_best_mstb DECIMAL(14, 4), -- P50
    oil_reserves_high_mstb DECIMAL(14, 4), -- P10
    
    -- Reservas de gas
    gas_reserves_mmscf DECIMAL(14, 4),
    gas_reserves_low_mmscf DECIMAL(14, 4),
    gas_reserves_best_mmscf DECIMAL(14, 4),
    gas_reserves_high_mmscf DECIMAL(14, 4),
    
    -- Condensado
    condensate_reserves_mstb DECIMAL(14, 4),
    
    -- NGL
    ngl_reserves_mstb DECIMAL(14, 4),
    
    -- Evaluador
    evaluator VARCHAR(100),
    evaluator_company VARCHAR(100),
    
    -- Estado
    status VARCHAR(20) DEFAULT 'DRAFT',
    -- DRAFT, REVIEWED, APPROVED, SUPERSEDED
    
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reserves_reservoir ON reserves_estimates(reservoir_id);
CREATE INDEX idx_reserves_well ON reserves_estimates(well_id);
CREATE INDEX idx_reserves_date ON reserves_estimates(estimate_date);
```

### 5.2 Volumétrico

```sql
CREATE TABLE volumetric_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reserves_estimate_id UUID REFERENCES reserves_estimates(id),
    reservoir_id UUID NOT NULL REFERENCES reservoirs(id),
    
    calculation_date DATE NOT NULL,
    
    -- Parámetros de entrada
    gross_rock_volume_acre_ft DECIMAL(14, 4),
    net_to_gross DECIMAL(5, 4),
    porosity DECIMAL(5, 4),
    water_saturation DECIMAL(5, 4),
    
    -- FVF
    oil_fvf DECIMAL(8, 4),
    gas_fvf DECIMAL(10, 6),
    
    -- Resultados
    ooip_mstb DECIMAL(14, 4),
    ogip_mmscf DECIMAL(14, 4),
    
    -- Factor de recuperación
    recovery_factor DECIMAL(5, 4),
    
    -- Reservas recuperables
    recoverable_oil_mstb DECIMAL(14, 4),
    recoverable_gas_mmscf DECIMAL(14, 4),
    
    -- Incertidumbre (Monte Carlo)
    uncertainty_parameters JSONB,
    simulation_results JSONB,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. Tablas de Decline Curve Analysis

### 6.1 Análisis DCA por Yacimiento

```sql
CREATE TABLE reservoir_decline_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservoir_id UUID NOT NULL REFERENCES reservoirs(id),
    
    analysis_date DATE NOT NULL,
    analyst VARCHAR(100),
    
    -- Período analizado
    start_date DATE,
    end_date DATE,
    
    -- Tipo de declinación
    decline_type VARCHAR(20) NOT NULL,
    -- EXPONENTIAL, HYPERBOLIC, HARMONIC
    
    -- Parámetros
    initial_rate_bopd DECIMAL(12, 2),
    initial_decline_rate DECIMAL(8, 6), -- Di (1/month o 1/year)
    decline_rate_unit VARCHAR(10), -- MONTHLY, ANNUAL
    b_factor DECIMAL(6, 4), -- Para hiperbólico
    
    -- Fecha efectiva
    effective_date DATE,
    
    -- Pronóstico
    forecast_end_date DATE,
    economic_limit_bopd DECIMAL(10, 2),
    
    -- Resultados
    eur_mstb DECIMAL(14, 4),
    remaining_reserves_mstb DECIMAL(14, 4),
    cum_production_mstb DECIMAL(14, 4),
    
    -- Estadísticas
    r_squared DECIMAL(6, 4),
    
    -- Datos del pronóstico
    forecast_data JSONB,
    -- [{date: "2026-01", rate: 450, cum: 250}, ...]
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reservoir_dca ON reservoir_decline_analyses(reservoir_id);
```

---

## 7. Vistas

### 7.1 Vista de Jerarquía Completa

```sql
CREATE VIEW reservoir_hierarchy AS
SELECT 
    b.id as basin_id,
    b.name as basin_name,
    f.id as field_id,
    f.field_name,
    f.operator,
    r.id as reservoir_id,
    r.reservoir_name,
    r.formation_name,
    r.lithology,
    r.fluid_type,
    r.drive_mechanism,
    r.ooip_mmstb,
    r.initial_pressure_psi,
    r.current_pressure_psi,
    r.avg_porosity,
    r.avg_permeability_md
FROM basins b
JOIN fields f ON b.id = f.basin_id
JOIN reservoirs r ON f.id = r.field_id;
```

### 7.2 Vista de Estado de Yacimientos

```sql
CREATE VIEW reservoir_status AS
SELECT 
    r.id,
    r.reservoir_name,
    f.field_name,
    r.ooip_mmstb,
    r.initial_pressure_psi,
    r.current_pressure_psi,
    ROUND((r.initial_pressure_psi - r.current_pressure_psi) / r.initial_pressure_psi * 100, 2) as pressure_depletion_pct,
    re.oil_reserves_mstb as remaining_reserves,
    (SELECT SUM(cum_oil_mbbl) FROM cumulative_production cp 
     JOIN wells w ON cp.well_id = w.id 
     WHERE w.primary_reservoir_id = r.id) as cumulative_production_mbbl,
    r.drive_mechanism,
    r.fluid_type
FROM reservoirs r
JOIN fields f ON r.field_id = f.id
LEFT JOIN reserves_estimates re ON r.id = re.reservoir_id 
    AND re.reserves_category = 'PROVED'
    AND re.status = 'APPROVED';
```

---

## 8. Funciones

### 8.1 Calcular OOIP Volumétrico

```sql
CREATE OR REPLACE FUNCTION calculate_volumetric_ooip(
    p_area_acres DECIMAL,
    p_thickness_ft DECIMAL,
    p_porosity DECIMAL,
    p_sw DECIMAL,
    p_bo DECIMAL,
    p_ntg DECIMAL DEFAULT 1.0
) RETURNS DECIMAL AS $$
BEGIN
    -- OOIP (STB) = 7758 * A * h * φ * (1-Sw) * NTG / Bo
    RETURN 7758 * p_area_acres * p_thickness_ft * p_porosity * (1 - p_sw) * p_ntg / p_bo;
END;
$$ LANGUAGE plpgsql;
```

### 8.2 Calcular Pb (Standing)

```sql
CREATE OR REPLACE FUNCTION calculate_pb_standing(
    p_rs DECIMAL,
    p_gas_sg DECIMAL,
    p_api DECIMAL,
    p_temperature_f DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    v_pb DECIMAL;
BEGIN
    -- Standing correlation for bubble point
    v_pb := 18.2 * (POWER(p_rs / p_gas_sg, 0.83) * 
            POWER(10, (0.00091 * p_temperature_f - 0.0125 * p_api)) - 1.4);
    
    RETURN ROUND(v_pb, 2);
END;
$$ LANGUAGE plpgsql;
```

