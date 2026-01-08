# MÓDULO 02: DRILLING OPERATIONS (Operaciones de Perforación)

## Resumen Ejecutivo

El módulo de Drilling Operations gestiona el monitoreo y registro de operaciones de perforación de pozos petroleros. Incluye seguimiento en tiempo real de parámetros de perforación, integración con sistemas WITSML, gestión de reportes diarios (DDR) y análisis de performance.

**Funcionalidades principales:**
- Monitoreo en tiempo real de parámetros de perforación
- Integración WITSML para datos de rig
- Daily Drilling Report (DDR) automatizado
- Time vs Depth analysis
- Gestión de BHA y herramientas
- Tracking de mud properties

---

## 1. Parámetros de Perforación

### 1.1 Parámetros Mecánicos

| Parámetro | Código | Unidad | Rango Típico | Descripción |
|-----------|--------|--------|--------------|-------------|
| **Bit Depth** | DBTM | ft | 0 - 25,000 | Profundidad de la broca |
| **Hole Depth** | DMEA | ft | 0 - 25,000 | Profundidad del hoyo |
| **Rate of Penetration** | ROP | ft/hr | 5 - 300 | Velocidad de perforación |
| **Weight on Bit** | WOB | klb | 5 - 60 | Peso sobre la broca |
| **Rotary Speed** | RPM | rpm | 40 - 200 | Velocidad de rotación |
| **Torque** | TRQ | kft-lb | 0 - 50 | Torque en la mesa rotaria |
| **Hookload** | HKLD | klb | 50 - 600 | Carga en el gancho |
| **Block Position** | BPOS | ft | 0 - 100 | Posición del bloque viajero |
| **Standpipe Pressure** | SPP | psi | 500 - 5,000 | Presión en standpipe |

### 1.2 Parámetros Hidráulicos

| Parámetro | Código | Unidad | Descripción |
|-----------|--------|--------|-------------|
| **Pump Rate** | MFIR | gpm | Caudal de bombeo |
| **Pump Pressure** | PPRS | psi | Presión de bomba |
| **Strokes per Minute** | SPM1/SPM2 | spm | Golpes por minuto |
| **Total Pump Strokes** | STKS | strokes | Golpes acumulados |
| **ECD** | ECD | ppg | Densidad equivalente circulando |
| **Annular Velocity** | AV | ft/min | Velocidad en anular |

### 1.3 Propiedades del Lodo

| Parámetro | Código | Unidad | Rango Típico |
|-----------|--------|--------|--------------|
| **Mud Weight In** | MWIN | ppg | 8.5 - 18.0 |
| **Mud Weight Out** | MWOUT | ppg | 8.5 - 18.0 |
| **Funnel Viscosity** | FV | sec/qt | 30 - 70 |
| **Plastic Viscosity** | PV | cp | 10 - 50 |
| **Yield Point** | YP | lb/100ft² | 5 - 30 |
| **Gel Strength 10s** | GEL10 | lb/100ft² | 5 - 15 |
| **Gel Strength 10min** | GEL10M | lb/100ft² | 10 - 30 |
| **pH** | PH | - | 8.5 - 11.0 |
| **Chlorides** | CL | mg/L | Variable |
| **MBT** | MBT | lb/bbl | 5 - 25 |

### 1.4 Parámetros de Gas

| Parámetro | Código | Unidad | Descripción |
|-----------|--------|--------|-------------|
| **Total Gas** | TGAS | units | Gas total detectado |
| **Background Gas** | BGAS | units | Gas de fondo |
| **Connection Gas** | CGAS | units | Gas en conexiones |
| **Trip Gas** | TRIGAS | units | Gas al hacer viaje |
| **C1 (Methane)** | C1 | ppm | Metano |
| **C2 (Ethane)** | C2 | ppm | Etano |
| **C3 (Propane)** | C3 | ppm | Propano |
| **H2S** | H2S | ppm | Ácido sulfhídrico |

---

## 2. Modelo de Datos

```sql
-- Pozos en perforación
CREATE TABLE drilling_wells (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    well_id UUID REFERENCES wells(id),
    
    -- Identificación
    rig_name VARCHAR(100),
    contractor VARCHAR(100),
    
    -- Fechas
    spud_date DATE,
    planned_td_date DATE,
    actual_td_date DATE,
    
    -- Objetivos
    planned_td_ft DECIMAL(10, 2),
    actual_td_ft DECIMAL(10, 2),
    
    -- Estado
    status VARCHAR(20) DEFAULT 'DRILLING',
    current_operation VARCHAR(50),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Datos de perforación en tiempo real
CREATE TABLE drilling_data (
    time TIMESTAMPTZ NOT NULL,
    well_id UUID NOT NULL,
    
    -- Profundidades
    dbtm_ft DECIMAL(10, 2),
    dmea_ft DECIMAL(10, 2),
    
    -- Mecánicos
    rop_ft_hr DECIMAL(10, 2),
    wob_klb DECIMAL(10, 2),
    rpm DECIMAL(10, 2),
    torque_kftlb DECIMAL(10, 2),
    hookload_klb DECIMAL(10, 2),
    spp_psi DECIMAL(10, 2),
    
    -- Hidráulicos
    flow_rate_gpm DECIMAL(10, 2),
    spm1 DECIMAL(10, 2),
    spm2 DECIMAL(10, 2),
    ecd_ppg DECIMAL(10, 3),
    
    -- Lodo
    mw_in_ppg DECIMAL(10, 3),
    mw_out_ppg DECIMAL(10, 3),
    
    -- Gas
    total_gas DECIMAL(10, 2),
    
    data_quality SMALLINT DEFAULT 192,
    
    PRIMARY KEY (well_id, time)
);

SELECT create_hypertable('drilling_data', 'time');

-- BHA (Bottom Hole Assembly)
CREATE TABLE bha_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_id UUID NOT NULL,
    bha_number INTEGER NOT NULL,
    
    run_in_time TIMESTAMPTZ,
    run_out_time TIMESTAMPTZ,
    
    depth_in_ft DECIMAL(10, 2),
    depth_out_ft DECIMAL(10, 2),
    footage_drilled_ft DECIMAL(10, 2),
    
    bit_size_in DECIMAL(5, 3),
    bit_type VARCHAR(50),
    bit_manufacturer VARCHAR(100),
    
    status VARCHAR(20) DEFAULT 'IN_HOLE'
);

-- Daily Drilling Report
CREATE TABLE daily_drilling_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_id UUID NOT NULL,
    report_date DATE NOT NULL,
    report_number INTEGER,
    
    -- Profundidades
    depth_start_ft DECIMAL(10, 2),
    depth_end_ft DECIMAL(10, 2),
    footage_drilled_ft DECIMAL(10, 2),
    
    -- Tiempos (horas)
    drilling_hours DECIMAL(5, 2),
    tripping_hours DECIMAL(5, 2),
    circulation_hours DECIMAL(5, 2),
    connection_hours DECIMAL(5, 2),
    downtime_hours DECIMAL(5, 2),
    
    -- Costos
    daily_cost DECIMAL(12, 2),
    cumulative_cost DECIMAL(12, 2),
    
    -- Lodo
    mud_weight_ppg DECIMAL(10, 3),
    mud_type VARCHAR(50),
    mud_volume_bbl DECIMAL(10, 2),
    
    -- Operaciones
    operations_summary TEXT,
    
    -- Próximas 24 horas
    next_24hr_plan TEXT,
    
    -- Aprobación
    prepared_by UUID,
    approved_by UUID,
    
    status VARCHAR(20) DEFAULT 'DRAFT',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE (well_id, report_date)
);
```

---

## 3. Time vs Depth Analysis

El análisis Time vs Depth compara el progreso real contra el plan para identificar desviaciones.

```python
def calculate_drilling_performance(
    actual_data: list,  # [(time, depth), ...]
    planned_data: list  # [(time, depth), ...]
) -> dict:
    """Calcular métricas de performance de perforación"""
    
    # Días de perforación
    actual_days = (actual_data[-1][0] - actual_data[0][0]).days
    planned_days = (planned_data[-1][0] - planned_data[0][0]).days
    
    # Profundidad final
    actual_depth = actual_data[-1][1]
    planned_depth = planned_data[-1][1]
    
    # ROP promedio
    avg_rop = actual_depth / (actual_days * 24) if actual_days > 0 else 0
    
    return {
        'actual_days': actual_days,
        'planned_days': planned_days,
        'days_variance': actual_days - planned_days,
        'actual_depth_ft': actual_depth,
        'planned_depth_ft': planned_depth,
        'avg_rop_ft_hr': avg_rop,
        'ahead_behind': 'AHEAD' if actual_days < planned_days else 'BEHIND'
    }
```

---

## 4. Integración WITSML

Los datos de perforación se reciben típicamente via WITSML desde el rig. Ver documento `PROTOCOLOS_COMUNICACION.md` para detalles de implementación.

**Objetos WITSML principales:**
- `log` - Datos de tiempo real (time-based y depth-based)
- `trajectory` - Trayectoria del pozo
- `mudLog` - Registro de lodo y gas
- `bhaRun` - BHA components
- `tubular` - Tuberías y herramientas

---

## 5. Alarmas de Perforación

```yaml
drilling_alarms:
  critical:
    - name: "KICK_DETECTED"
      condition: "pit_gain > 10 bbl OR flow_out > flow_in + 10%"
      action: "STOP_DRILLING, CLOSE_BOP"
      
    - name: "HIGH_H2S"
      condition: "h2s > 10 ppm"
      action: "EVACUATE_RIG_FLOOR"
      
    - name: "LOST_CIRCULATION"
      condition: "pit_level_drop > 20 bbl/hr"
      action: "STOP_PUMPS"

  warning:
    - name: "HIGH_TORQUE"
      condition: "torque > 80% limit"
      action: "REDUCE_WOB"
      
    - name: "HIGH_ECD"
      condition: "ecd > fracture_gradient - 0.5 ppg"
      action: "REDUCE_FLOW_RATE"
```

---

## 6. Reportes

### 6.1 Daily Drilling Report (DDR)

El DDR es el documento oficial diario de operaciones:
- Resumen de 24 horas
- Profundidades y footage
- Distribución de tiempos (drilling, tripping, etc.)
- Propiedades de lodo
- Actividades detalladas hora por hora
- Plan para próximas 24 horas

### 6.2 Time vs Depth Chart

Gráfico de profundidad vs tiempo con:
- Curva planificada
- Curva real
- Marcadores de operaciones (casing, cementación, etc.)

---

---

## 7. Well Planning (Planificación de Pozos)

### 7.1 Programa de Revestimiento (Casing Program)

```sql
CREATE TABLE casing_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_id UUID NOT NULL REFERENCES wells(id),
    
    casing_type VARCHAR(30) NOT NULL, -- CONDUCTOR, SURFACE, INTERMEDIATE, PRODUCTION, LINER
    casing_number INTEGER,
    
    -- Profundidades
    setting_depth_md_ft DECIMAL(10, 2),
    setting_depth_tvd_ft DECIMAL(10, 2),
    top_depth_md_ft DECIMAL(10, 2),
    
    -- Especificaciones
    od_inches DECIMAL(6, 3),
    weight_ppf DECIMAL(6, 2),
    grade VARCHAR(20), -- J55, K55, L80, N80, P110, Q125
    connection VARCHAR(50),
    
    -- Cemento
    cement_top_md_ft DECIMAL(10, 2),
    cement_volume_bbl DECIMAL(10, 2),
    cement_type VARCHAR(50),
    
    -- Presiones de diseño
    burst_pressure_psi DECIMAL(10, 2),
    collapse_pressure_psi DECIMAL(10, 2),
    
    -- Estado
    status VARCHAR(20) DEFAULT 'PLANNED', -- PLANNED, SET, TESTED
    set_date TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.2 Diseño de Trayectoria

| Tipo de Pozo | Descripción | Complejidad |
|--------------|-------------|-------------|
| **Vertical** | Ángulo < 5° | Baja |
| **Direccional** | Alcanza objetivo lateral | Media |
| **Horizontal** | Sección horizontal en yacimiento | Alta |
| **Extended Reach** | >2:1 horizontal/vertical | Muy Alta |
| **Multilateral** | Múltiples ramas | Muy Alta |

```sql
CREATE TABLE well_trajectories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_id UUID NOT NULL REFERENCES wells(id),
    trajectory_type VARCHAR(20), -- PLANNED, ACTUAL, PROPOSED
    
    -- Puntos de survey
    survey_points JSONB, -- [{md, inc, azi, tvd, ns, ew, dls}]
    
    -- Objetivos
    target_coordinates JSONB, -- [{name, tvd, ns, ew, radius}]
    
    -- KOP y puntos críticos
    kop_md_ft DECIMAL(10, 2), -- Kickoff Point
    build_rate_deg_100ft DECIMAL(6, 3),
    turn_rate_deg_100ft DECIMAL(6, 3),
    
    -- Profundidades clave
    landing_point_md_ft DECIMAL(10, 2),
    lateral_length_ft DECIMAL(10, 2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.3 Programa de Lodo

```sql
CREATE TABLE mud_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_id UUID NOT NULL REFERENCES wells(id),
    
    section_name VARCHAR(50), -- SURFACE, INTERMEDIATE, PRODUCTION
    depth_from_ft DECIMAL(10, 2),
    depth_to_ft DECIMAL(10, 2),
    
    -- Tipo de lodo
    mud_type VARCHAR(50), -- WBM, OBM, SBM, FOAM
    
    -- Propiedades objetivo
    mud_weight_min_ppg DECIMAL(6, 3),
    mud_weight_max_ppg DECIMAL(6, 3),
    pv_target_cp DECIMAL(6, 2),
    yp_target_lbf DECIMAL(6, 2),
    
    -- Ventana operacional
    pore_pressure_ppg DECIMAL(6, 3),
    fracture_gradient_ppg DECIMAL(6, 3),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 8. Análisis de Torque & Drag

### 8.1 Modelo de T&D

El análisis de Torque & Drag predice las cargas en la sarta para:
- Detectar problemas de limpieza de hoyo
- Planificar operaciones de casing
- Identificar zonas de alto arrastre

```
Fuerza de Arrastre = Σ (μ × N × ΔL × cos(θ))

Donde:
  μ = Coeficiente de fricción (0.15-0.35)
  N = Fuerza normal
  ΔL = Longitud del elemento
  θ = Inclinación
```

### 8.2 Modelo de Datos T&D

```sql
CREATE TABLE torque_drag_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_id UUID NOT NULL REFERENCES wells(id),
    
    model_date TIMESTAMPTZ NOT NULL,
    model_type VARCHAR(20), -- SOFT_STRING, STIFF_STRING
    
    -- Coeficientes de fricción
    cased_hole_friction DECIMAL(4, 3),
    open_hole_friction DECIMAL(4, 3),
    
    -- Resultados por profundidad
    results JSONB, -- [{depth, hookload_trip_in, hookload_trip_out, 
                   --   hookload_rotating, torque}]
    
    -- Límites
    max_hookload_lbs DECIMAL(10, 2),
    max_torque_ftlbs DECIMAL(10, 2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 9. Cálculos Hidráulicos

### 9.1 ECD (Equivalent Circulating Density)

```
ECD = MW + (ΔP_annular / (0.052 × TVD))

Donde:
  MW = Peso del lodo (ppg)
  ΔP_annular = Pérdidas de presión en el anular (psi)
  TVD = Profundidad vertical verdadera (ft)
```

### 9.2 Presión de Fondo (BHCP)

```
BHCP = Hidrostática + Pérdidas en anular
BHCP = (MW × 0.052 × TVD) + ΔP_annular
```

### 9.3 Velocidad Anular

```
Va = (24.5 × Q) / (Dh² - Dp²)

Donde:
  Va = Velocidad anular (ft/min)
  Q = Caudal (gpm)
  Dh = Diámetro del hoyo (in)
  Dp = Diámetro del drill pipe (in)
```

---

## 10. Drilling Optimization

### 10.1 MSE (Mechanical Specific Energy)

El MSE cuantifica la eficiencia de perforación:

```
MSE = (480 × T × RPM) / (D² × ROP) + (4 × WOB) / (π × D²)

Donde:
  T = Torque (ft-lbs)
  RPM = Velocidad rotaria
  D = Diámetro de broca (in)
  ROP = Tasa de penetración (ft/hr)
  WOB = Peso sobre broca (lbs)

MSE óptimo ≈ Resistencia compresiva de la roca (UCS)
```

### 10.2 Modelo de Datos de Optimización

```sql
CREATE TABLE drilling_optimization (
    time TIMESTAMPTZ NOT NULL,
    well_id UUID NOT NULL,
    
    depth_ft DECIMAL(10, 2),
    
    -- MSE
    mse_calculated DECIMAL(10, 2),
    mse_target DECIMAL(10, 2),
    
    -- Founder Point Analysis
    founder_point_wob DECIMAL(10, 2),
    optimal_wob DECIMAL(10, 2),
    optimal_rpm DECIMAL(10, 2),
    
    -- Bit wear
    bit_wear_index DECIMAL(5, 3),
    
    PRIMARY KEY (well_id, time)
);

SELECT create_hypertable('drilling_optimization', 'time');
```

---

## 11. Control de Pozo (Well Control)

### 11.1 Indicadores de Kick

| Indicador | Descripción | Criticidad |
|-----------|-------------|------------|
| **Pit Gain** | Aumento nivel de presas | Alta |
| **Flow Increase** | Flujo de retorno > entrada | Alta |
| **Drilling Break** | ROP anormalmente alto | Media |
| **Gas Cut Mud** | Aumento de gas en lodo | Media |
| **Pressure Changes** | Cambios anormales SPP | Media |

### 11.2 Cálculos de Well Control

```
Kill Weight Mud = MW_original + (SIDPP / (0.052 × TVD))

Donde:
  SIDPP = Shut-In Drill Pipe Pressure (psi)
  TVD = Profundidad vertical verdadera (ft)
```

---

## 12. Integración con Software de Planificación

### 12.1 Formatos de Importación/Exportación

| Software | Formato | Datos |
|----------|---------|-------|
| **Compass** | LAS, CSV | Surveys, trajectories |
| **WellPlan** | XML | Casing, mud, trajectory |
| **DrillScan** | CSV | Real-time drilling data |
| **Landmark** | OpenWells | Complete well data |

### 12.2 API de Integración

```typescript
// Ejemplo de endpoint para datos de perforación
interface DrillingDataEndpoint {
  // GET /api/v1/wells/{wellId}/drilling/realtime
  getRealTimeData(wellId: string): DrillingData;
  
  // GET /api/v1/wells/{wellId}/drilling/trajectory
  getTrajectory(wellId: string): TrajectoryPoint[];
  
  // POST /api/v1/wells/{wellId}/drilling/ddr
  submitDDR(wellId: string, report: DDRData): DDRResponse;
  
  // GET /api/v1/wells/{wellId}/drilling/witsml
  getWITSMLData(wellId: string, objectType: string): WITSMLObject;
}
```

---

## 13. Referencias

- WITSML Standards (Energistics)
- IADC Drilling Manual
- API RP 13B: Recommended Practice for Drilling Fluid Testing
- API RP 59: Well Control Operations
- API RP 7G: Drill Stem Design
- API RP 65: Cementing Shallow Water Wells
- SPE-178815: Mechanical Specific Energy Analysis
