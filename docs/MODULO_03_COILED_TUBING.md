# MÓDULO 03: COILED TUBING OPERATIONS (Intervenciones con Tubería Flexible)

## Resumen Ejecutivo

El módulo de Coiled Tubing gestiona operaciones de intervención de pozos utilizando tubería flexible continua. Incluye monitoreo en tiempo real de parámetros operacionales, gestión de fatiga del tubing, cálculos de ingeniería (buckling, lockup, drag & torque) y generación de reportes operacionales.

**Funcionalidades principales:**
- Monitoreo en tiempo real de parámetros de operación
- Gestión de fatiga del tubing (ciclos de vida)
- Cálculos de buckling y lockup prediction
- Registro de operaciones por pozo
- Generación de Job Ticket y reportes
- Historial de corridas por carrete

---

## 1. Fundamentos de Coiled Tubing

### 1.1 ¿Qué es Coiled Tubing?

Coiled Tubing (CT) es una tubería de acero continua enrollada en un carrete grande que se despliega en pozos para realizar diversas operaciones sin necesidad de hacer conexiones. 

**Ventajas vs Tubing Convencional:**
- Operaciones más rápidas (sin conexiones)
- Trabajo bajo presión (live well intervention)
- Menor huella operacional
- Control preciso de profundidad

### 1.2 Aplicaciones Típicas

| Aplicación | Descripción | Duración Típica |
|------------|-------------|-----------------|
| **Limpieza de pozo** | Remoción de arena, escala, parafina | 4-12 horas |
| **Acidificación** | Inyección de ácido para estimulación | 6-24 horas |
| **Fracturamiento** | Fractura hidráulica con CT | 12-48 horas |
| **Cementación** | Squeeze cementing, plug & abandon | 8-24 horas |
| **Pesca** | Recuperación de herramientas | Variable |
| **Logging** | Registro con herramientas en CT | 4-12 horas |
| **Perforación** | CT Drilling (CTD) | Días/Semanas |
| **Nitrogen Lift** | Descarga de pozo con N2 | 4-24 horas |

### 1.3 Equipos de Superficie

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COILED TUBING UNIT - LAYOUT                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────────────────────────────────────┐                          │
│   │              CONTROL CABIN                │                          │
│   │  ┌────────┐  ┌────────┐  ┌────────┐     │                          │
│   │  │ Depth  │  │ Weight │  │ Pump   │     │                          │
│   │  │Counter │  │Indicator│  │Pressure│     │                          │
│   │  └────────┘  └────────┘  └────────┘     │                          │
│   └──────────────────────────────────────────┘                          │
│                          │                                               │
│   ┌──────────────────────┼───────────────────────────────┐              │
│   │                      │                                │              │
│   │  ┌─────────────┐     │     ┌─────────────────────┐   │              │
│   │  │   REEL      │     │     │   INJECTOR HEAD     │   │              │
│   │  │  ┌─────┐    │     │     │   ┌───────────┐     │   │              │
│   │  │  │ CT  │    │     │     │   │  Chains   │     │   │              │
│   │  │  │Coil │────┼─────┼─────┼───│  Gripper  │     │   │              │
│   │  │  └─────┘    │     │     │   └─────┬─────┘     │   │              │
│   │  │  Ø 4-20 ft  │     │     │         │           │   │              │
│   │  └─────────────┘     │     └─────────┼───────────┘   │              │
│   │                      │               │                │              │
│   │  ┌─────────────┐     │     ┌─────────┼───────────┐   │              │
│   │  │ POWER PACK  │     │     │   GUIDE ARCH        │   │              │
│   │  │  Hydraulic  │     │     │   (Gooseneck)       │   │              │
│   │  │   + Diesel  │     │     └─────────┼───────────┘   │              │
│   │  └─────────────┘     │               │                │              │
│   │                      │     ┌─────────┼───────────┐   │              │
│   │  ┌─────────────┐     │     │    BOP STACK        │   │              │
│   │  │ PUMP UNIT   │     │     │  ┌─────────────┐    │   │              │
│   │  │  High Press │     │     │  │Stripper/Pack│    │   │              │
│   │  │  Pumps      │     │     │  │   Blind RAM │    │   │              │
│   │  └─────────────┘     │     │  │   Shear RAM │    │   │              │
│   │                      │     │  └─────────────┘    │   │              │
│   └──────────────────────┴─────┴─────────────────────┘   │              │
│                                        │                                 │
│                                        ▼                                 │
│                                   WELLHEAD                               │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Parámetros de Monitoreo en Tiempo Real

### 2.1 Parámetros Mecánicos

| Parámetro | Código | Unidad | Rango Típico | Criticidad |
|-----------|--------|--------|--------------|------------|
| **Weight Indicator** | WGT | lbs | -5,000 a +50,000 | Alta |
| **Tubing Depth** | DEPTH | ft | 0 - 25,000 | Alta |
| **Pipe Speed** | SPEED | ft/min | 0 - 200 | Media |
| **Injector Pressure** | INJ_P | psi | 0 - 5,000 | Media |
| **Chain Tension** | CHAIN | psi | 500 - 3,000 | Alta |
| **Reel Tension** | REEL_T | lbs | 0 - 10,000 | Media |

### 2.2 Parámetros Hidráulicos

| Parámetro | Código | Unidad | Rango Típico |
|-----------|--------|--------|--------------|
| **Pump Pressure** | PUMP_P | psi | 0 - 15,000 |
| **Pump Rate** | PUMP_Q | bpm | 0 - 5 |
| **Circulating Pressure** | CIRC_P | psi | 0 - 10,000 |
| **Wellhead Pressure** | WHP | psi | 0 - 5,000 |
| **Annulus Pressure** | ANN_P | psi | 0 - 3,000 |

### 2.3 Parámetros de Fatiga

| Parámetro | Código | Unidad | Descripción |
|-----------|--------|--------|-------------|
| **Bending Cycles** | CYCLES | count | Ciclos acumulados |
| **Fatigue Life Used** | FAT_USED | % | Vida consumida |
| **Remaining Life** | FAT_REM | % | Vida restante |
| **Trip Count** | TRIPS | count | Viajes al pozo |

---

## 3. Gestión de Fatiga del Tubing

### 3.1 Importancia de la Fatiga

El CT experimenta fatiga por flexión cada vez que pasa por el guide arch y el reel. La acumulación de ciclos de fatiga reduce la vida útil del tubing y puede causar fallas catastróficas.

### 3.2 Modelo de Fatiga

```
Fatiga Acumulada = Σ (Ciclos en sección / Vida útil a esa presión)

Factores que afectan la vida:
- Diámetro del tubing (OD)
- Espesor de pared (WT)
- Radio de curvatura (guide arch, reel)
- Presión interna
- Corrosión y daño mecánico
```

### 3.3 Modelo de Datos

```sql
-- Carretes de Coiled Tubing
CREATE TABLE ct_reels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Identificación
    reel_number VARCHAR(50) NOT NULL,
    serial_number VARCHAR(100),
    manufacturer VARCHAR(100),
    
    -- Especificaciones del tubing
    od_inches DECIMAL(4, 3),        -- 1.25, 1.5, 1.75, 2.0, 2.375
    wt_inches DECIMAL(5, 4),        -- Wall thickness
    grade VARCHAR(20),              -- 70K, 80K, 90K, 100K, 110K
    length_ft DECIMAL(10, 2),
    
    -- Estado
    status VARCHAR(20) DEFAULT 'ACTIVE',
    current_location VARCHAR(100),
    
    -- Fatiga global
    total_trips INTEGER DEFAULT 0,
    avg_fatigue_pct DECIMAL(5, 2) DEFAULT 0,
    max_fatigue_pct DECIMAL(5, 2) DEFAULT 0,
    
    -- Certificación
    last_inspection_date DATE,
    next_inspection_date DATE,
    mpi_date DATE,                  -- Magnetic Particle Inspection
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fatiga por sección del tubing
CREATE TABLE ct_fatigue_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reel_id UUID NOT NULL REFERENCES ct_reels(id),
    
    section_start_ft DECIMAL(10, 2) NOT NULL,
    section_end_ft DECIMAL(10, 2) NOT NULL,
    section_length_ft DECIMAL(10, 2),
    
    -- Ciclos acumulados
    bending_cycles INTEGER DEFAULT 0,
    
    -- Fatiga calculada por presión
    fatigue_0_psi DECIMAL(8, 4) DEFAULT 0,
    fatigue_2000_psi DECIMAL(8, 4) DEFAULT 0,
    fatigue_4000_psi DECIMAL(8, 4) DEFAULT 0,
    fatigue_6000_psi DECIMAL(8, 4) DEFAULT 0,
    fatigue_8000_psi DECIMAL(8, 4) DEFAULT 0,
    
    -- Fatiga total usada (%)
    total_fatigue_pct DECIMAL(5, 2) DEFAULT 0,
    
    -- Estado
    status VARCHAR(20) DEFAULT 'OK', -- OK, WARNING, CRITICAL, CUT
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fatigue_reel ON ct_fatigue_sections(reel_id);

-- Historial de corridas
CREATE TABLE ct_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    reel_id UUID NOT NULL REFERENCES ct_reels(id),
    well_id UUID NOT NULL REFERENCES wells(id),
    
    -- Operación
    job_type VARCHAR(50) NOT NULL,
    job_number VARCHAR(50),
    
    -- Tiempos
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    
    -- Profundidades
    max_depth_ft DECIMAL(10, 2),
    
    -- Presiones máximas
    max_pump_pressure_psi DECIMAL(10, 2),
    max_wellhead_pressure_psi DECIMAL(10, 2),
    
    -- Ciclos agregados
    cycles_added INTEGER,
    
    -- Resultado
    result VARCHAR(20), -- SUCCESS, PARTIAL, FAILED
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Cálculos de Ingeniería

### 4.1 Predicción de Buckling

El buckling ocurre cuando las fuerzas compresivas exceden la capacidad del CT, causando deformación.

**Tipos de Buckling:**
- **Sinusoidal**: Ondulación suave, CT aún puede avanzar
- **Helicoidal**: Forma de resorte, lockup inminente

**Fuerza Crítica de Buckling (Dawson-Paslay):**
```
Fcr = √(E × I × w × sin(θ) / r)

Donde:
  E = Módulo de elasticidad (30×10⁶ psi para acero)
  I = Momento de inercia del CT
  w = Peso efectivo por unidad de longitud
  θ = Inclinación del pozo
  r = Radio del hoyo o casing
```

### 4.2 Lockup Prediction

Lockup ocurre cuando la fricción y el buckling impiden que el CT avance.

```
Condición de Lockup:
Fuerza de empuje < Fricción acumulada + Peso del CT

Factores:
- Coeficiente de fricción (μ): 0.2-0.4 típico
- Tortuosidad del pozo
- Peso del fluido
- Profundidad y desviación
```

### 4.3 Drag & Torque

```sql
-- Tabla de cálculos de D&T
CREATE TABLE ct_drag_torque_calcs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES ct_runs(id),
    
    calculation_time TIMESTAMPTZ NOT NULL,
    depth_ft DECIMAL(10, 2),
    
    -- Inputs
    wob_lbs DECIMAL(10, 2),
    friction_coef DECIMAL(4, 3),
    
    -- Resultados
    calculated_weight_lbs DECIMAL(10, 2),
    measured_weight_lbs DECIMAL(10, 2),
    drag_lbs DECIMAL(10, 2),
    
    -- Buckling
    buckling_force_lbs DECIMAL(10, 2),
    buckling_status VARCHAR(20), -- NONE, SINUSOIDAL, HELICAL
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Sistema de Alarmas

### 5.1 Alarmas Críticas

| Alarma | Condición | Acción |
|--------|-----------|--------|
| **Overpull** | Weight > Límite | Detener, evaluar |
| **Slack Off** | Weight < Límite negativo | Verificar lockup |
| **High Pump Pressure** | Pressure > Límite | Reducir bombeo |
| **Stripper Leak** | Presión anular sube | Revisar BOP |
| **Fatigue Critical** | Fatiga > 80% | Cortar sección |
| **Speed Limit** | Speed > Máximo | Reducir velocidad |

### 5.2 Configuración de Alarmas

```sql
CREATE TABLE ct_alarm_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    parameter VARCHAR(50) NOT NULL,
    
    -- Límites
    high_high DECIMAL(12, 2),
    high DECIMAL(12, 2),
    low DECIMAL(12, 2),
    low_low DECIMAL(12, 2),
    
    -- Acciones
    high_high_action VARCHAR(50), -- ALARM, TRIP, NOTIFY
    high_action VARCHAR(50),
    low_action VARCHAR(50),
    low_low_action VARCHAR(50),
    
    enabled BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. Reportes y Documentación

### 6.1 Job Ticket

El Job Ticket es el documento oficial de la operación:

**Secciones:**
- Información del pozo y cliente
- Equipo utilizado (reel, herramientas)
- Resumen de operaciones por hora
- Fluidos bombeados
- Profundidades alcanzadas
- Problemas encontrados
- Firmas de aprobación

### 6.2 Modelo de Job Ticket

```sql
CREATE TABLE ct_job_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES ct_runs(id),
    
    -- Cliente
    customer_name VARCHAR(100),
    customer_rep VARCHAR(100),
    
    -- Pozo
    well_name VARCHAR(100),
    field_name VARCHAR(100),
    
    -- Equipo
    unit_number VARCHAR(50),
    reel_number VARCHAR(50),
    bha_description TEXT,
    
    -- Operación
    job_objective TEXT,
    job_summary TEXT,
    
    -- Tiempos
    rig_up_time TIMESTAMPTZ,
    rig_down_time TIMESTAMPTZ,
    total_job_hours DECIMAL(6, 2),
    
    -- Profundidades
    tag_depth_ft DECIMAL(10, 2),
    max_depth_ft DECIMAL(10, 2),
    
    -- Fluidos
    fluids_pumped JSONB, -- [{fluid, volume_bbl, rate_bpm}]
    
    -- Resultado
    objectives_met BOOLEAN,
    npt_hours DECIMAL(6, 2),
    npt_reason TEXT,
    
    -- Firmas digitales
    operator_signature VARCHAR(100),
    customer_signature VARCHAR(100),
    signed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. Integración con Unidades CT

### 7.1 Sistemas de Adquisición

| Fabricante | Sistema | Protocolo | Datos |
|------------|---------|-----------|-------|
| **NOV** | CTES Data Logger | Modbus TCP | Depth, Weight, Pressure |
| **Schlumberger** | CT Live | Proprietary | Full telemetry |
| **Halliburton** | eRedBook | WITSML | Operations data |
| **Baker Hughes** | Digital CT | OPC-UA | Real-time |

### 7.2 Tags Típicos para Integración

```yaml
ct_tags:
  mechanical:
    - DEPTH_FT: Measured Depth
    - WEIGHT_LBS: Surface Weight
    - SPEED_FPM: Pipe Speed
    - CHAIN_PSI: Chain Tension
    
  hydraulic:
    - PUMP1_PSI: Pump 1 Pressure
    - PUMP1_SPM: Pump 1 Strokes
    - PUMP2_PSI: Pump 2 Pressure
    - WHP_PSI: Wellhead Pressure
    - ANN_PSI: Annulus Pressure
    
  calculated:
    - DRAG_LBS: Calculated Drag
    - FATIGUE_PCT: Current Fatigue
    - ECD_PPG: Equivalent Circulating Density
```

---

## 8. Normas y Estándares

### 8.1 API Standards

| Norma | Descripción |
|-------|-------------|
| **API RP 5C7** | Coiled Tubing Operations |
| **API RP 16Q** | Recommended Practice for CT |
| **API Spec 5ST** | Coiled Tubing Specification |

### 8.2 Certificaciones Requeridas

- Inspección MPI cada 6 meses
- Prueba hidrostática después de reparaciones
- Registro de fatiga actualizado
- Certificación de BOP
