# WELL TESTING - MODELO DE DATOS

## 1. Diagrama Entidad-Relación

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MODELO DE DATOS - WELL TESTING                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐           │
│  │    wells    │────────▶│ well_tests  │◀────────│  test_types │           │
│  └─────────────┘   1:N   └──────┬──────┘   N:1   └─────────────┘           │
│                                 │                                           │
│         ┌───────────────────────┼───────────────────────┐                  │
│         │                       │                       │                  │
│         ▼                       ▼                       ▼                  │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐           │
│  │test_readings│         │ ipr_analyses│         │ vlp_analyses│           │
│  └─────────────┘         └─────────────┘         └─────────────┘           │
│         │                       │                       │                  │
│         │                       ▼                       │                  │
│         │                ┌─────────────┐                │                  │
│         │                │nodal_analyses│◀──────────────┘                  │
│         │                └─────────────┘                                   │
│         │                                                                  │
│         ▼                                                                  │
│  ┌─────────────┐         ┌─────────────┐                                   │
│  │ fluid_samples│        │pressure_tests│                                   │
│  └─────────────┘         └─────────────┘                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Tablas Principales

### 2.1 Tipos de Prueba

```sql
CREATE TABLE test_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Configuración
    requires_separator BOOLEAN DEFAULT false,
    requires_pressure_gauge BOOLEAN DEFAULT false,
    requires_samples BOOLEAN DEFAULT false,
    
    -- Campos requeridos (JSONB para flexibilidad)
    required_fields JSONB DEFAULT '[]',
    optional_fields JSONB DEFAULT '[]',
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Datos iniciales
INSERT INTO test_types (code, name, requires_separator, requires_pressure_gauge) VALUES
('PRODUCTION', 'Prueba de Producción', true, false),
('BUILDUP', 'Buildup (Cierre)', false, true),
('DRAWDOWN', 'Drawdown (Apertura)', false, true),
('ISOCHRONAL', 'Prueba Isocronal', true, true),
('INTERFERENCE', 'Prueba de Interferencia', false, true),
('PVT_SAMPLE', 'Toma de Muestra PVT', false, false);
```

### 2.2 Pruebas de Pozo (Tabla Principal)

```sql
CREATE TABLE well_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    well_id UUID NOT NULL REFERENCES wells(id),
    test_type_id UUID NOT NULL REFERENCES test_types(id),
    
    -- Identificación
    test_number VARCHAR(20) NOT NULL,
    test_date TIMESTAMPTZ NOT NULL,
    
    -- Estado
    status VARCHAR(20) DEFAULT 'PLANNED',
    -- PLANNED, IN_PROGRESS, COMPLETED, ANALYZED, APPROVED, CANCELLED
    
    -- Duración
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    duration_hours DECIMAL(8, 2),
    
    -- Condiciones de operación
    choke_size_64ths INTEGER,
    separator_pressure_psi DECIMAL(10, 2),
    separator_temperature_f DECIMAL(8, 2),
    
    -- Tasas medidas
    oil_rate_bopd DECIMAL(12, 2),
    water_rate_bwpd DECIMAL(12, 2),
    gas_rate_mscfd DECIMAL(12, 2),
    liquid_rate_blpd DECIMAL(12, 2) GENERATED ALWAYS AS (oil_rate_bopd + water_rate_bwpd) STORED,
    
    -- Presiones
    tubing_pressure_psi DECIMAL(10, 2),
    casing_pressure_psi DECIMAL(10, 2),
    flowing_bhp_psi DECIMAL(10, 2),
    static_bhp_psi DECIMAL(10, 2),
    
    -- Temperaturas
    wellhead_temp_f DECIMAL(8, 2),
    bottomhole_temp_f DECIMAL(8, 2),
    
    -- Propiedades de fluidos
    bsw_percent DECIMAL(5, 2),
    water_cut_percent DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE WHEN (oil_rate_bopd + water_rate_bwpd) > 0 
        THEN (water_rate_bwpd / (oil_rate_bopd + water_rate_bwpd)) * 100 
        ELSE 0 END
    ) STORED,
    oil_api_gravity DECIMAL(6, 2),
    gas_specific_gravity DECIMAL(6, 4),
    gor_scf_stb DECIMAL(10, 2),
    
    -- Parámetros calculados
    productivity_index DECIMAL(10, 4),
    specific_productivity_index DECIMAL(10, 4),
    
    -- Aprobación
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    
    -- Auditoría
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Notas
    notes TEXT,
    
    CONSTRAINT valid_status CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ANALYZED', 'APPROVED', 'CANCELLED'))
);

-- Índices
CREATE INDEX idx_well_tests_well ON well_tests(well_id);
CREATE INDEX idx_well_tests_date ON well_tests(test_date);
CREATE INDEX idx_well_tests_status ON well_tests(status);
CREATE INDEX idx_well_tests_tenant ON well_tests(tenant_id);
```

### 2.3 Lecturas de Prueba (Datos Múltiples)

```sql
CREATE TABLE test_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_test_id UUID NOT NULL REFERENCES well_tests(id) ON DELETE CASCADE,
    
    -- Tiempo de lectura
    reading_time TIMESTAMPTZ NOT NULL,
    elapsed_hours DECIMAL(10, 4),
    
    -- Presiones
    tubing_pressure_psi DECIMAL(10, 2),
    casing_pressure_psi DECIMAL(10, 2),
    bottomhole_pressure_psi DECIMAL(10, 2),
    
    -- Tasas
    oil_rate_bopd DECIMAL(12, 2),
    water_rate_bwpd DECIMAL(12, 2),
    gas_rate_mscfd DECIMAL(12, 2),
    
    -- Temperaturas
    wellhead_temp_f DECIMAL(8, 2),
    bottomhole_temp_f DECIMAL(8, 2),
    
    -- Choke
    choke_size_64ths INTEGER,
    
    -- Notas
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para consultas por prueba y tiempo
CREATE INDEX idx_test_readings_test_time ON test_readings(well_test_id, reading_time);
```

---

## 3. Tablas de Análisis

### 3.1 Análisis IPR

```sql
CREATE TABLE ipr_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_test_id UUID NOT NULL REFERENCES well_tests(id),
    
    -- Modelo utilizado
    model VARCHAR(30) NOT NULL,
    -- VOGEL, FETKOVITCH, STANDING, COMPOSITE, JONES_BLOUNT_GLAZE
    
    -- Datos de entrada
    reservoir_pressure_psi DECIMAL(10, 2) NOT NULL,
    bubble_point_psi DECIMAL(10, 2),
    test_rate_bopd DECIMAL(12, 2) NOT NULL,
    test_pwf_psi DECIMAL(10, 2) NOT NULL,
    
    -- Resultados Vogel
    qmax_bopd DECIMAL(12, 2),
    productivity_index DECIMAL(10, 4),
    
    -- Resultados Fetkovitch (gas)
    c_coefficient DECIMAL(15, 6),
    n_exponent DECIMAL(6, 4),
    aof_mscfd DECIMAL(12, 2),
    
    -- Curva IPR (puntos calculados)
    ipr_curve JSONB,
    -- [{pwf: 0, q: 1200}, {pwf: 500, q: 1100}, ...]
    
    -- Estadísticas
    r_squared DECIMAL(6, 4),
    
    -- Metadatos
    analyst VARCHAR(100),
    analysis_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Análisis VLP

```sql
CREATE TABLE vlp_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_test_id UUID REFERENCES well_tests(id),
    well_id UUID NOT NULL REFERENCES wells(id),
    
    -- Correlación utilizada
    correlation VARCHAR(30) NOT NULL,
    -- BEGGS_BRILL, HAGEDORN_BROWN, DUNS_ROS, ORKISZEWSKI, GRAY, ANSARI
    
    -- Datos del tubing
    tubing_id_inches DECIMAL(6, 3) NOT NULL,
    tubing_depth_ft DECIMAL(10, 2) NOT NULL,
    wellhead_pressure_psi DECIMAL(10, 2) NOT NULL,
    
    -- Datos del pozo
    deviation_degrees DECIMAL(6, 2) DEFAULT 0,
    roughness_inches DECIMAL(6, 4) DEFAULT 0.0006,
    
    -- Condiciones
    wellhead_temp_f DECIMAL(8, 2),
    bottomhole_temp_f DECIMAL(8, 2),
    water_cut_percent DECIMAL(5, 2),
    gor_scf_stb DECIMAL(10, 2),
    
    -- Propiedades de fluidos
    oil_api DECIMAL(6, 2),
    gas_sg DECIMAL(6, 4),
    water_sg DECIMAL(6, 4) DEFAULT 1.02,
    
    -- Curva VLP (puntos calculados)
    vlp_curve JSONB,
    -- [{q: 0, pwf: 1500}, {q: 500, pwf: 1800}, ...]
    
    -- Metadatos
    analyst VARCHAR(100),
    analysis_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.3 Análisis Nodal

```sql
CREATE TABLE nodal_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_id UUID NOT NULL REFERENCES wells(id),
    ipr_analysis_id UUID REFERENCES ipr_analyses(id),
    vlp_analysis_id UUID REFERENCES vlp_analyses(id),
    
    -- Punto de operación
    operating_rate_bopd DECIMAL(12, 2),
    operating_pwf_psi DECIMAL(10, 2),
    
    -- Capacidad
    max_rate_bopd DECIMAL(12, 2),
    
    -- Análisis de sensibilidad
    sensitivity_results JSONB,
    -- {tubing_sizes: [...], chokes: [...], wc_scenarios: [...]}
    
    -- Recomendaciones
    recommendations TEXT,
    
    -- Metadatos
    analyst VARCHAR(100),
    analysis_date TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Tablas de Pruebas de Presión

### 4.1 Pruebas de Presión Transitoria

```sql
CREATE TABLE pressure_transient_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_test_id UUID NOT NULL REFERENCES well_tests(id),
    
    -- Tipo de prueba
    test_type VARCHAR(20) NOT NULL,
    -- DRAWDOWN, BUILDUP, FALLOFF, INTERFERENCE
    
    -- Historial de producción pre-cierre
    producing_time_hours DECIMAL(12, 2),
    producing_rate_bopd DECIMAL(12, 2),
    
    -- Datos de presión (referencia a time-series)
    pressure_data JSONB,
    -- [{t: 0.001, p: 2500}, {t: 0.01, p: 2520}, ...]
    
    -- Resultados de análisis
    permeability_md DECIMAL(12, 4),
    kh_md_ft DECIMAL(12, 2),
    skin DECIMAL(8, 2),
    wellbore_storage_bbl_psi DECIMAL(10, 4),
    initial_pressure_psi DECIMAL(10, 2),
    radius_investigation_ft DECIMAL(12, 2),
    
    -- Régimen de flujo identificado
    flow_regimes JSONB,
    -- [{start_time, end_time, regime: "RADIAL|LINEAR|BILINEAR|SPHERICAL"}]
    
    -- Límites del yacimiento
    boundary_type VARCHAR(30),
    -- NO_FLOW, CONSTANT_PRESSURE, SEALING_FAULT, CHANNEL
    distance_to_boundary_ft DECIMAL(12, 2),
    
    -- Calidad del análisis
    analysis_confidence VARCHAR(20),
    -- HIGH, MEDIUM, LOW
    
    analyst VARCHAR(100),
    analysis_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Vistas y Funciones

### 5.1 Vista de Resumen de Pruebas

```sql
CREATE VIEW well_tests_summary AS
SELECT 
    wt.id,
    wt.test_number,
    wt.test_date,
    w.well_name,
    w.well_code,
    tt.name as test_type,
    wt.status,
    wt.oil_rate_bopd,
    wt.water_rate_bwpd,
    wt.gas_rate_mscfd,
    wt.water_cut_percent,
    wt.flowing_bhp_psi,
    wt.productivity_index,
    wt.gor_scf_stb,
    wt.created_at
FROM well_tests wt
JOIN wells w ON wt.well_id = w.id
JOIN test_types tt ON wt.test_type_id = tt.id;
```

### 5.2 Función para Calcular IPR Vogel

```sql
CREATE OR REPLACE FUNCTION calculate_ipr_vogel(
    p_reservoir_pressure DECIMAL,
    p_test_rate DECIMAL,
    p_test_pwf DECIMAL,
    p_num_points INTEGER DEFAULT 20
) RETURNS JSONB AS $$
DECLARE
    v_qmax DECIMAL;
    v_j DECIMAL;
    v_pwf DECIMAL;
    v_q DECIMAL;
    v_step DECIMAL;
    v_result JSONB := '[]';
BEGIN
    -- Calcular Qmax usando Vogel
    v_qmax := p_test_rate / (1 - 0.2 * (p_test_pwf / p_reservoir_pressure) 
              - 0.8 * POWER(p_test_pwf / p_reservoir_pressure, 2));
    
    -- Calcular J
    v_j := 1.8 * v_qmax / p_reservoir_pressure;
    
    -- Generar puntos de la curva
    v_step := p_reservoir_pressure / p_num_points;
    
    FOR i IN 0..p_num_points LOOP
        v_pwf := i * v_step;
        v_q := v_qmax * (1 - 0.2 * (v_pwf / p_reservoir_pressure) 
               - 0.8 * POWER(v_pwf / p_reservoir_pressure, 2));
        
        v_result := v_result || jsonb_build_object('pwf', ROUND(v_pwf, 2), 'q', ROUND(v_q, 2));
    END LOOP;
    
    RETURN jsonb_build_object(
        'qmax', ROUND(v_qmax, 2),
        'j', ROUND(v_j, 4),
        'curve', v_result
    );
END;
$$ LANGUAGE plpgsql;
```

---

## 6. Triggers

### 6.1 Calcular Campos Derivados

```sql
CREATE OR REPLACE FUNCTION calculate_well_test_derived()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular GOR si no se proporcionó
    IF NEW.gor_scf_stb IS NULL AND NEW.gas_rate_mscfd > 0 AND NEW.oil_rate_bopd > 0 THEN
        NEW.gor_scf_stb := (NEW.gas_rate_mscfd * 1000) / NEW.oil_rate_bopd;
    END IF;
    
    -- Calcular índice de productividad si tenemos presiones
    IF NEW.static_bhp_psi IS NOT NULL AND NEW.flowing_bhp_psi IS NOT NULL 
       AND NEW.oil_rate_bopd IS NOT NULL AND NEW.static_bhp_psi > NEW.flowing_bhp_psi THEN
        NEW.productivity_index := NEW.oil_rate_bopd / (NEW.static_bhp_psi - NEW.flowing_bhp_psi);
    END IF;
    
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_well_test_derived
BEFORE INSERT OR UPDATE ON well_tests
FOR EACH ROW EXECUTE FUNCTION calculate_well_test_derived();
```

