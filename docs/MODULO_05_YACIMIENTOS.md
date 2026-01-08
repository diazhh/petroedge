# MÓDULO 05: RESERVOIR ENGINEERING (Ingeniería de Yacimientos)

## Resumen Ejecutivo

El módulo de Reservoir Engineering es el componente técnico más avanzado del sistema ERP+SCADA petrolero. Proporciona capacidades de **base de datos de yacimientos**, **análisis PVT**, **balance de materiales**, **estimación de reservas** y **pronóstico de producción** a nivel profesional, comparable a software como OFM (Schlumberger), MBAL (Petroleum Experts) y herramientas de Petrel.

Este módulo permite a las empresas petroleras gestionar toda la información geológica y de ingeniería de sus yacimientos, desde la caracterización inicial hasta el monitoreo continuo de la explotación.

**Capacidades principales:**
- Base de datos completa de yacimientos (modelo PPDM/RESQML compatible)
- Gestión de propiedades PVT y correlaciones
- Balance de materiales (Havlena-Odeh, Tank Models)
- Estimación de reservas (Volumétrico, DCA, Material Balance)
- Pronóstico de producción (Decline Curves, Type Curves)
- Rate Transient Analysis (RTA)
- Mapas de yacimientos (isobáricas, isosaturaciones, bubble maps)
- Integración con simuladores externos (Eclipse, CMG, tNavigator)

---

## 1. Jerarquía de Datos del Yacimiento

### 1.1 Modelo de Datos Jerárquico

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    JERARQUÍA DE ACTIVOS PETROLEROS                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  EMPRESA (Tenant)                                                        │
│  └── CUENCA (Basin)                                                      │
│      └── ÁREA/BLOQUE (Block/Concession)                                  │
│          └── CAMPO (Field)                                               │
│              └── YACIMIENTO (Reservoir)                                  │
│                  └── UNIDAD DE FLUJO (Flow Unit)                         │
│                      └── POZO (Well)                                     │
│                          └── COMPLETACIÓN (Completion)                   │
│                              └── ZONA PRODUCTORA (Producing Zone)        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

Ejemplo Venezuela:
├── PDVSA (Empresa)
│   ├── Cuenca Oriental
│   │   ├── Bloque Junín
│   │   │   ├── Campo Junín 4
│   │   │   │   ├── Yacimiento Oficina
│   │   │   │   │   ├── Unidad O-10
│   │   │   │   │   │   └── Pozo JUN-001
│   │   │   │   │   └── Unidad O-12
│   │   │   │   └── Yacimiento Merecure
│   │   │   └── Campo Junín 5
│   │   └── Bloque Carabobo
│   └── Cuenca del Lago de Maracaibo
│       ├── Bloque Urdaneta
│       └── Bloque Bachaquero
```

### 1.2 Modelo de Base de Datos

```sql
-- ============================================
-- TABLAS DE JERARQUÍA DE YACIMIENTOS
-- Basado en estándar PPDM (Professional Petroleum Data Management)
-- ============================================

-- Cuencas sedimentarias
CREATE TABLE basins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    basin_name VARCHAR(100) NOT NULL,
    basin_code VARCHAR(20) UNIQUE,
    country VARCHAR(50),
    
    -- Geología regional
    geological_age VARCHAR(100),
    basin_type VARCHAR(50), -- FORELAND, RIFT, PASSIVE_MARGIN, etc.
    area_km2 DECIMAL(12, 2),
    
    -- Geometría (GeoJSON)
    boundary GEOMETRY(POLYGON, 4326),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bloques/Áreas de concesión
CREATE TABLE blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    basin_id UUID REFERENCES basins(id),
    
    block_name VARCHAR(100) NOT NULL,
    block_code VARCHAR(20),
    
    -- Datos contractuales
    contract_type VARCHAR(50), -- SERVICE, JOINT_VENTURE, LICENSE
    operator VARCHAR(100),
    partners JSONB, -- [{"name": "Partner A", "percentage": 30}]
    contract_start DATE,
    contract_end DATE,
    
    -- Área
    area_km2 DECIMAL(12, 2),
    boundary GEOMETRY(POLYGON, 4326),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campos petroleros
CREATE TABLE fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    block_id UUID REFERENCES blocks(id),
    
    field_name VARCHAR(100) NOT NULL,
    field_code VARCHAR(20),
    
    -- Clasificación
    field_type VARCHAR(20), -- OIL, GAS, CONDENSATE, HEAVY_OIL
    discovery_date DATE,
    first_production_date DATE,
    status VARCHAR(20), -- EXPLORATION, DEVELOPMENT, PRODUCTION, MATURE, ABANDONED
    
    -- Datos de producción acumulada
    cumulative_oil_mmbbl DECIMAL(15, 3),
    cumulative_gas_bcf DECIMAL(15, 3),
    cumulative_water_mmbbl DECIMAL(15, 3),
    
    -- Ubicación
    centroid GEOMETRY(POINT, 4326),
    boundary GEOMETRY(POLYGON, 4326),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Yacimientos (Reservoirs)
CREATE TABLE reservoirs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    field_id UUID NOT NULL REFERENCES fields(id),
    
    reservoir_name VARCHAR(100) NOT NULL,
    reservoir_code VARCHAR(20),
    
    -- Formación geológica
    formation_name VARCHAR(100),
    geological_age VARCHAR(100),
    lithology VARCHAR(50), -- SANDSTONE, CARBONATE, SHALE, etc.
    depositional_environment VARCHAR(100),
    
    -- Propiedades estáticas promedio
    avg_porosity_fraction DECIMAL(5, 4), -- 0.0 - 1.0
    avg_permeability_md DECIMAL(10, 3),
    avg_water_saturation DECIMAL(5, 4),
    avg_net_pay_ft DECIMAL(10, 2),
    avg_gross_thickness_ft DECIMAL(10, 2),
    net_to_gross DECIMAL(5, 4),
    
    -- Profundidades
    top_depth_tvdss_ft DECIMAL(10, 2),
    base_depth_tvdss_ft DECIMAL(10, 2),
    
    -- Contactos de fluidos
    owc_depth_tvdss_ft DECIMAL(10, 2), -- Oil-Water Contact
    goc_depth_tvdss_ft DECIMAL(10, 2), -- Gas-Oil Contact
    fwl_depth_tvdss_ft DECIMAL(10, 2), -- Free Water Level
    
    -- Presión y temperatura iniciales
    initial_pressure_psi DECIMAL(10, 2),
    current_pressure_psi DECIMAL(10, 2),
    pressure_date DATE,
    reservoir_temperature_f DECIMAL(8, 2),
    pressure_gradient_psi_ft DECIMAL(8, 4),
    
    -- Mecanismo de producción
    drive_mechanism VARCHAR(50), -- SOLUTION_GAS, WATER_DRIVE, GAS_CAP, GRAVITY, COMBINATION
    
    -- Volúmenes originales (OOIP/OGIP)
    ooip_mmbbl DECIMAL(15, 3), -- Original Oil In Place
    ogip_bcf DECIMAL(15, 3),   -- Original Gas In Place
    ooip_method VARCHAR(50),   -- VOLUMETRIC, MATERIAL_BALANCE, SIMULATION
    
    -- Reservas
    proved_reserves_mmbbl DECIMAL(15, 3),
    probable_reserves_mmbbl DECIMAL(15, 3),
    possible_reserves_mmbbl DECIMAL(15, 3),
    reserves_date DATE,
    
    -- Factor de recobro
    primary_recovery_factor DECIMAL(5, 4),
    secondary_recovery_factor DECIMAL(5, 4),
    tertiary_recovery_factor DECIMAL(5, 4),
    
    -- Referencia a PVT
    pvt_id UUID REFERENCES pvt_data(id),
    
    -- Área de drenaje
    area_acres DECIMAL(12, 2),
    boundary GEOMETRY(POLYGON, 4326),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reservoirs_field ON reservoirs(field_id);
CREATE INDEX idx_reservoirs_tenant ON reservoirs(tenant_id);
```

---

## 2. Base de Datos PVT (Propiedades de Fluidos)

### 2.1 Conceptos Fundamentales

Las propiedades PVT (Presión-Volumen-Temperatura) describen el comportamiento de los fluidos del yacimiento bajo diferentes condiciones. Son críticas para:

- Cálculos de volumen en superficie vs yacimiento
- Diseño de sistemas de producción
- Simulación de yacimiento
- Balance de materiales

### 2.2 Propiedades Black Oil

| Propiedad | Símbolo | Unidad | Descripción |
|-----------|---------|--------|-------------|
| **Presión de Burbuja** | Pb | psi | Presión donde el gas comienza a liberarse |
| **Factor Volumétrico del Petróleo** | Bo | bbl/STB | Volumen yac / volumen superficie |
| **Factor Volumétrico del Gas** | Bg | ft³/scf | Volumen yac / volumen superficie |
| **Relación Gas-Petróleo en Solución** | Rs | scf/STB | Gas disuelto en petróleo |
| **Viscosidad del Petróleo** | μo | cp | Resistencia al flujo |
| **Viscosidad del Gas** | μg | cp | Resistencia al flujo del gas |
| **Densidad del Petróleo** | ρo | lb/ft³ | Masa por unidad de volumen |
| **Factor de Compresibilidad del Gas** | Z | - | Desviación del gas ideal |
| **Compresibilidad del Petróleo** | co | 1/psi | Cambio de volumen con presión |
| **Gravedad API** | °API | - | Densidad relativa del crudo |
| **Gravedad del Gas** | γg | - | Densidad relativa al aire |

### 2.3 Modelo de Datos PVT

```sql
-- Datos PVT de laboratorio y correlaciones
CREATE TABLE pvt_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    reservoir_id UUID REFERENCES reservoirs(id),
    
    -- Identificación
    pvt_name VARCHAR(100) NOT NULL,
    sample_date DATE,
    sample_source VARCHAR(50), -- DST, PRODUCTION, SEPARATOR, etc.
    lab_name VARCHAR(100),
    report_number VARCHAR(50),
    
    -- Condiciones de referencia
    reference_pressure_psi DECIMAL(10, 2) DEFAULT 14.7,
    reference_temperature_f DECIMAL(8, 2) DEFAULT 60,
    
    -- Propiedades a condiciones de burbuja
    bubble_point_psi DECIMAL(10, 2),
    bob DECIMAL(8, 5), -- Bo at Pb
    rsb_scf_stb DECIMAL(10, 2), -- Rs at Pb
    
    -- Propiedades del petróleo en superficie
    oil_api_gravity DECIMAL(6, 2),
    oil_specific_gravity DECIMAL(6, 4),
    
    -- Propiedades del gas
    gas_specific_gravity DECIMAL(6, 4),
    gas_h2s_mole_pct DECIMAL(6, 4),
    gas_co2_mole_pct DECIMAL(6, 4),
    gas_n2_mole_pct DECIMAL(6, 4),
    
    -- Propiedades del agua
    water_salinity_ppm DECIMAL(12, 2),
    water_specific_gravity DECIMAL(6, 4),
    
    -- Correlaciones utilizadas
    bo_correlation VARCHAR(50), -- STANDING, VASQUEZ_BEGGS, GLASO, etc.
    rs_correlation VARCHAR(50),
    viscosity_correlation VARCHAR(50), -- BEGGS_ROBINSON, DEAD_OIL, etc.
    z_factor_correlation VARCHAR(50), -- DRANCHUK, HALL_YARBOROUGH, etc.
    
    -- Datos tabulados (JSONB para flexibilidad)
    differential_liberation JSONB,  -- [{p, Bo, Rs, Bg, uo, ug, Z}]
    separator_tests JSONB,          -- Condiciones de separador
    viscosity_data JSONB,           -- Viscosidad vs presión
    compositional_data JSONB,       -- Composición molar
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vista de propiedades PVT interpoladas
CREATE OR REPLACE FUNCTION get_pvt_properties(
    p_pvt_id UUID,
    p_pressure DECIMAL
) RETURNS TABLE (
    bo DECIMAL,
    rs DECIMAL,
    uo DECIMAL,
    bg DECIMAL,
    ug DECIMAL,
    z_factor DECIMAL
) AS $$
DECLARE
    v_pb DECIMAL;
    v_bob DECIMAL;
    v_rsb DECIMAL;
    v_data JSONB;
BEGIN
    -- Obtener datos base
    SELECT bubble_point_psi, bob, rsb_scf_stb, differential_liberation
    INTO v_pb, v_bob, v_rsb, v_data
    FROM pvt_data WHERE id = p_pvt_id;
    
    -- Interpolar o calcular según correlación
    -- (Implementación simplificada - usar correlaciones reales en producción)
    IF p_pressure >= v_pb THEN
        -- Subsaturado: Bo decrece, Rs = Rsb
        RETURN QUERY SELECT 
            v_bob * (1 - 0.00001 * (p_pressure - v_pb))::DECIMAL,
            v_rsb,
            1.5::DECIMAL, -- Placeholder
            0.005::DECIMAL,
            0.02::DECIMAL,
            0.85::DECIMAL;
    ELSE
        -- Saturado: interpolar de datos tabulados
        RETURN QUERY SELECT 
            v_bob * (p_pressure / v_pb)::DECIMAL,
            v_rsb * (p_pressure / v_pb)::DECIMAL,
            2.0::DECIMAL,
            0.008::DECIMAL,
            0.015::DECIMAL,
            0.90::DECIMAL;
    END IF;
END;
$$ LANGUAGE plpgsql;
```

### 2.4 Correlaciones PVT Implementadas

#### 2.4.1 Presión de Burbuja (Pb)

**Correlación de Standing (1947):**
```
Pb = 18.2 × [(Rs/γg)^0.83 × 10^(0.00091×T - 0.0125×API) - 1.4]

Donde:
  Rs = GOR en solución (scf/STB)
  γg = Gravedad específica del gas
  T  = Temperatura (°F)
  API = Gravedad API del petróleo
```

**Correlación de Vásquez-Beggs (1980):**
```
Para API ≤ 30:
  Pb = (Rs / (C1 × γg × exp(C3 × API / (T + 460))))^(1/C2)
  C1=0.0362, C2=1.0937, C3=25.724

Para API > 30:
  C1=0.0178, C2=1.187, C3=23.931
```

#### 2.4.2 Factor Volumétrico del Petróleo (Bo)

**Correlación de Standing:**
```
Bo = 0.9759 + 0.00012 × [Rs × (γg/γo)^0.5 + 1.25×T]^1.2

Donde:
  γo = Gravedad específica del petróleo = 141.5/(API + 131.5)
```

#### 2.4.3 Viscosidad del Petróleo

**Beggs-Robinson (Dead Oil):**
```
μod = 10^x - 1
x = 10^(3.0324 - 0.02023×API) × T^(-1.163)
```

**Beggs-Robinson (Live Oil, P < Pb):**
```
μo = A × μod^B
A = 10.715 × (Rs + 100)^(-0.515)
B = 5.44 × (Rs + 150)^(-0.338)
```

---

## 3. Balance de Materiales

### 3.1 Ecuación General de Balance de Materiales

La ecuación de balance de materiales es fundamental para:
- Estimar OOIP/OGIP
- Identificar mecanismo de empuje
- Predecir comportamiento del yacimiento
- Calcular entrada de agua

**Ecuación de Schilthuis (forma general):**
```
N × (Bt - Bti) + N × m × Bti × (Bg/Bgi - 1) + We - Wp × Bw = 
    Np × [Bt + (Rp - Rsi) × Bg] + Wp × Bw + Gi × Bg

Simplificado (yacimiento de petróleo):
F = N × Eo + N × m × Eg + We

Donde:
  F  = Producción total = Np×Bo + (Gp-Np×Rs)×Bg + Wp×Bw
  Eo = Expansión del petróleo = (Bo-Boi) + (Rsi-Rs)×Bg
  Eg = Expansión del gas cap = Boi×(Bg/Bgi - 1)
  We = Entrada de agua del acuífero
  m  = Relación gas cap / zona de petróleo
```

### 3.2 Método de Havlena-Odeh

Linealización de la ecuación de balance de materiales para determinar N y We:

```
F/Eo = N + We/Eo

Graficar F/Eo vs ΣΔp×tD/Eo:
- Intercepto = N (OOIP)
- Pendiente relacionada con entrada de agua
```

### 3.3 Modelo de Datos

```sql
-- Datos de balance de materiales
CREATE TABLE material_balance_studies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    reservoir_id UUID NOT NULL REFERENCES reservoirs(id),
    
    study_name VARCHAR(100) NOT NULL,
    study_date DATE,
    analyst VARCHAR(100),
    
    -- Parámetros del modelo
    model_type VARCHAR(50), -- TANK, SECTOR, FULL_FIELD
    drive_mechanism VARCHAR(50),
    
    -- Resultados
    ooip_mmbbl DECIMAL(15, 3),
    ogip_bcf DECIMAL(15, 3),
    aquifer_size DECIMAL(15, 3),
    aquifer_model VARCHAR(50), -- FETKOVICH, VAN_EVERDINGEN_HURST, POT
    
    -- Gas cap
    m_ratio DECIMAL(8, 4), -- m = G×Bgi / N×Boi
    
    -- Calidad del ajuste
    r_squared DECIMAL(5, 4),
    
    -- Datos de entrada (histórico)
    historical_data JSONB, -- [{date, Np, Gp, Wp, Wi, Gi, Pr}]
    
    -- Resultados detallados
    calculation_results JSONB,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de presiones de yacimiento
CREATE TABLE reservoir_pressure_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservoir_id UUID NOT NULL REFERENCES reservoirs(id),
    
    measurement_date DATE NOT NULL,
    pressure_psi DECIMAL(10, 2) NOT NULL,
    pressure_type VARCHAR(20), -- STATIC, FLOWING, BUILDUP
    
    -- Origen del dato
    well_id UUID REFERENCES wells(id),
    test_type VARCHAR(50), -- BUILDUP, RFT, MDT, GAUGE
    
    -- Profundidad de referencia
    datum_depth_tvdss_ft DECIMAL(10, 2),
    measured_depth_ft DECIMAL(10, 2),
    
    -- Calidad
    confidence VARCHAR(20), -- HIGH, MEDIUM, LOW
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pressure_history_reservoir ON reservoir_pressure_history(reservoir_id, measurement_date);
```

---

## 4. Estimación de Reservas

### 4.1 Clasificación de Reservas (PRMS/SEC)

| Categoría | Definición | Probabilidad |
|-----------|------------|--------------|
| **Proved (1P)** | Razonable certeza de recuperación | ≥90% (P90) |
| **Proved + Probable (2P)** | Probable recuperación adicional | ≥50% (P50) |
| **Proved + Probable + Possible (3P)** | Posible recuperación adicional | ≥10% (P10) |

**Subcategorías Proved:**
- **PDP** (Proved Developed Producing): Pozos activos
- **PDNP** (Proved Developed Non-Producing): Pozos completados pero cerrados
- **PUD** (Proved Undeveloped): Localizaciones no perforadas

### 4.2 Método Volumétrico

```
OOIP = 7758 × A × h × φ × (1 - Sw) / Bo

Donde:
  OOIP = Original Oil In Place (STB)
  7758 = Factor de conversión (acre-ft a bbl)
  A    = Área de drenaje (acres)
  h    = Espesor neto (ft)
  φ    = Porosidad (fracción)
  Sw   = Saturación de agua (fracción)
  Bo   = Factor volumétrico inicial (bbl/STB)

Reservas = OOIP × RF (Factor de Recobro)
```

### 4.3 Modelo de Datos de Reservas

```sql
CREATE TABLE reserves_estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    reservoir_id UUID NOT NULL REFERENCES reservoirs(id),
    
    estimate_date DATE NOT NULL,
    effective_date DATE,
    estimator VARCHAR(100),
    
    -- Método de estimación
    method VARCHAR(50), -- VOLUMETRIC, DCA, MATERIAL_BALANCE, SIMULATION
    
    -- Reservas de petróleo (MMbbl)
    oil_1p_mmbbl DECIMAL(15, 3),
    oil_2p_mmbbl DECIMAL(15, 3),
    oil_3p_mmbbl DECIMAL(15, 3),
    
    -- Reservas de gas (Bcf)
    gas_1p_bcf DECIMAL(15, 3),
    gas_2p_bcf DECIMAL(15, 3),
    gas_3p_bcf DECIMAL(15, 3),
    
    -- Desglose por categoría
    oil_pdp_mmbbl DECIMAL(15, 3),
    oil_pdnp_mmbbl DECIMAL(15, 3),
    oil_pud_mmbbl DECIMAL(15, 3),
    
    -- Parámetros volumétricos
    area_acres DECIMAL(12, 2),
    net_pay_ft DECIMAL(10, 2),
    porosity DECIMAL(5, 4),
    water_saturation DECIMAL(5, 4),
    recovery_factor DECIMAL(5, 4),
    
    -- Documentación
    report_file_url TEXT,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Decline Curve Analysis (DCA)

### 5.1 Ecuaciones de Arps

**Decline Exponencial (b = 0):**
```
q(t) = qi × exp(-Di × t)
Np(t) = (qi - q) / Di
EUR = qi / Di
```

**Decline Hiperbólico (0 < b < 1):**
```
q(t) = qi / (1 + b × Di × t)^(1/b)
Np(t) = (qi^b / ((1-b) × Di)) × (qi^(1-b) - q^(1-b))
```

**Decline Armónico (b = 1):**
```
q(t) = qi / (1 + Di × t)
Np(t) = (qi / Di) × ln(qi / q)
```

### 5.2 Parámetros DCA

| Parámetro | Símbolo | Unidad | Descripción |
|-----------|---------|--------|-------------|
| **Tasa inicial** | qi | BOPD/MCFD | Tasa al inicio del decline |
| **Decline inicial** | Di | 1/año | Tasa de decline nominal |
| **Exponente b** | b | - | 0=exp, 0-1=hip, 1=arm |
| **Tasa económica** | qec | BOPD | Límite económico |
| **EUR** | EUR | MMbbl/Bcf | Estimated Ultimate Recovery |

### 5.3 Modelo de Datos DCA

```sql
CREATE TABLE decline_curve_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    well_id UUID NOT NULL REFERENCES wells(id),
    
    analysis_date DATE NOT NULL,
    analyst VARCHAR(100),
    
    -- Tipo de fluido
    fluid_type VARCHAR(20), -- OIL, GAS, WATER
    
    -- Período de análisis
    start_date DATE,
    end_date DATE,
    
    -- Parámetros de Arps
    qi DECIMAL(12, 2),          -- Tasa inicial
    di DECIMAL(8, 6),           -- Decline inicial (1/día)
    di_annual DECIMAL(8, 4),    -- Decline anual (%)
    b_factor DECIMAL(5, 4),     -- Exponente b
    
    -- Límites
    economic_limit DECIMAL(10, 2),
    
    -- Resultados
    eur DECIMAL(15, 3),
    remaining_reserves DECIMAL(15, 3),
    forecast_end_date DATE,
    
    -- Calidad del ajuste
    r_squared DECIMAL(5, 4),
    
    -- Datos del forecast
    forecast_data JSONB, -- [{date, q_forecast, np_cumulative}]
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Función para calcular forecast
CREATE OR REPLACE FUNCTION calculate_dca_forecast(
    p_qi DECIMAL,
    p_di DECIMAL,
    p_b DECIMAL,
    p_months INTEGER
) RETURNS TABLE (
    month_number INTEGER,
    rate DECIMAL,
    cumulative DECIMAL
) AS $$
DECLARE
    v_q DECIMAL;
    v_np DECIMAL := 0;
    v_t DECIMAL;
BEGIN
    FOR i IN 1..p_months LOOP
        v_t := i / 12.0; -- Tiempo en años
        
        IF p_b = 0 THEN
            -- Exponencial
            v_q := p_qi * exp(-p_di * v_t * 365);
        ELSIF p_b = 1 THEN
            -- Armónico
            v_q := p_qi / (1 + p_di * v_t * 365);
        ELSE
            -- Hiperbólico
            v_q := p_qi / power(1 + p_b * p_di * v_t * 365, 1/p_b);
        END IF;
        
        v_np := v_np + v_q * 30; -- Aproximación mensual
        
        RETURN QUERY SELECT i, v_q, v_np;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

---

## 6. Visualizaciones de Yacimiento

### 6.1 Tipos de Mapas

| Mapa | Descripción | Uso |
|------|-------------|-----|
| **Bubble Map** | Producción por pozo en mapa | Vigilancia diaria |
| **Mapa Isobárico** | Contornos de presión | Identificar zonas depletadas |
| **Mapa de Saturación** | Distribución de fluidos | Avance de frentes |
| **Net Pay Map** | Espesor productivo | Ubicar nuevos pozos |
| **Mapa Estructural** | Tope de formación | Planificación |

### 6.2 Gráficos de Análisis

- **Decline Curves**: Rate vs Time, Rate vs Cumulative
- **Hall Plot**: Inyectividad de pozos inyectores
- **Chan Plot**: Diagnóstico de agua (WOR vs tiempo)
- **Crossplots**: Permeabilidad vs porosidad, etc.
- **Producción Acumulada**: Np, Gp, Wp vs tiempo
- **Presión vs Tiempo**: Historia de presiones

---

## 7. Integración con Simuladores

### 7.1 Formatos de Intercambio

| Formato | Uso | Software |
|---------|-----|----------|
| **RESQML** | Modelos geológicos | Petrel, SKUA |
| **Eclipse DATA** | Simulación | Eclipse, OPM |
| **CMG DAT** | Simulación | CMG IMEX/GEM |
| **CSV/Excel** | Datos de producción | Universal |

### 7.2 Flujo de Trabajo

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Sistema    │────►│  Exportar    │────►│  Simulador   │
│   ERP+SCADA  │     │  Datos       │     │  (Eclipse)   │
└──────────────┘     └──────────────┘     └──────────────┘
       ▲                                         │
       │                                         │
       │         ┌──────────────┐                │
       └─────────│   Importar   │◄───────────────┘
                 │   Resultados │
                 └──────────────┘
```

---

## 8. Comparativa con Software Comercial

| Feature | OFM | MBAL | Petrel | **Nuestro Sistema** |
|---------|-----|------|--------|---------------------|
| BD Yacimientos | ✓ | ✗ | ✓ | ✓ |
| PVT Correlaciones | ✓ | ✓✓ | ✓ | ✓ |
| Balance Materiales | Básico | ✓✓ | ✓ | ✓ |
| DCA | ✓✓ | ✓ | ✗ | ✓ |
| Mapas | ✓✓ | ✗ | ✓✓ | ✓ |
| Real-time | ✗ | ✗ | ✗ | ✓✓ |
| Edge Deployment | ✗ | ✗ | ✗ | ✓✓ |
| Costo | $$$$ | $$$ | $$$$$ | $$ |


