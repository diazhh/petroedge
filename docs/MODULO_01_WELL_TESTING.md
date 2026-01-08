# MÓDULO 01: WELL TESTING (Pruebas de Pozos)

## Resumen Ejecutivo

El módulo de Well Testing gestiona pruebas de producción de pozos petroleros, desde la captura de datos en tiempo real hasta la generación de reportes certificados. Las pruebas de pozo son fundamentales para determinar la capacidad productiva, evaluar daño de formación y optimizar el sistema de producción.

Este documento define los parámetros de monitoreo, cálculos de ingeniería (IPR, AOF, Productivity Index, Skin Factor), integración con equipos de medición y formatos de reportes estándar para entes reguladores.

**Funcionalidades principales:**
- Monitoreo en tiempo real de separadores de prueba
- Cálculo automático de curvas IPR (Vogel, Darcy)
- Determinación de AOF y Productivity Index
- Estimación de Skin Factor
- Generación de Well Test Summary y Production Test Certificate
- Histórico de pruebas por pozo

---

## 1. Fundamentos Operacionales

### 1.1 ¿Qué es una Prueba de Pozo?

Una prueba de pozo (Well Test) es un procedimiento para medir la tasa de producción de un pozo bajo condiciones controladas, separando y cuantificando cada fase (petróleo, gas, agua). Los objetivos principales son:

- **Determinar capacidad productiva** del pozo
- **Evaluar daño de formación** (skin factor)
- **Caracterizar el yacimiento** (permeabilidad, límites)
- **Calibrar modelos de simulación**
- **Cumplir requerimientos regulatorios**
- **Asignar producción fiscal** entre pozos

### 1.2 Tipos de Pruebas

| Tipo | Duración | Objetivo | Datos Requeridos |
|------|----------|----------|------------------|
| **Production Test** | 4-24 horas | Medir tasas estabilizadas | Rates, presiones |
| **Extended Well Test** | 1-7 días | Producción comercial temporal | Rates, presiones, muestras |
| **Drawdown Test** | 12-72 horas | Caracterización de reservorio | BHP continua, rates |
| **Buildup Test** | 12-72 horas | Presión de reservorio, skin | BHP durante cierre |
| **Isochronal Test** | Variable | Pozos de gas, AOF | Multi-rate flow |
| **DST (Drill Stem Test)** | 2-12 horas | Durante perforación | Rates, presiones |

### 1.3 Equipos Involucrados

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      WELL TEST SETUP                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────┐                                                          │
│   │  POZO    │                                                          │
│   │          │                                                          │
│   │   PT     │◄─── Pressure Transmitter (THP)                          │
│   │   TT     │◄─── Temperature Transmitter (WHT)                       │
│   └────┬─────┘                                                          │
│        │                                                                 │
│        │  Flow Line                                                      │
│        ▼                                                                 │
│   ┌──────────────────────────────────────────────────────┐              │
│   │              TEST SEPARATOR                           │              │
│   │  ┌─────────────────────────────────────────────────┐ │              │
│   │  │                                                  │ │              │
│   │  │   ┌─────┐    ┌─────┐    ┌─────┐               │ │              │
│   │  │   │ OIL │    │ GAS │    │WATER│               │ │              │
│   │  │   │METER│    │METER│    │METER│               │ │              │
│   │  │   └──┬──┘    └──┬──┘    └──┬──┘               │ │              │
│   │  │      │          │          │                   │ │              │
│   │  │   BOPD       MCFD       BWPD                   │ │              │
│   │  │                                                  │ │              │
│   │  │   PT ◄── Separator Pressure                     │ │              │
│   │  │   TT ◄── Separator Temperature                  │ │              │
│   │  │   LT ◄── Level Transmitter                      │ │              │
│   │  └─────────────────────────────────────────────────┘ │              │
│   └──────────────────────────────────────────────────────┘              │
│        │          │          │                                           │
│        ▼          ▼          ▼                                           │
│   To Production  Flare/    To Water                                      │
│   Facility       Sales     Treatment                                     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Componentes principales:**

| Equipo | Función | Parámetros Medidos |
|--------|---------|-------------------|
| **Test Separator** | Separar fases | Oil/Gas/Water rates, P, T |
| **Multiphase Flow Meter** | Medición sin separación | Rates por fase (inline) |
| **Pressure Gauge (PT)** | Medir presiones | THP, CHP, Sep pressure |
| **Temperature Transmitter** | Medir temperaturas | WHT, Sep temp |
| **Orifice Meter** | Medir gas | Gas rate |
| **Turbine/Coriolis Meter** | Medir líquidos | Oil/Water rate |
| **BSW Analyzer** | Calidad de crudo | BSW % |
| **Choke Manifold** | Control de flujo | Choke size |

---

## 2. Parámetros de Monitoreo en Tiempo Real

### 2.1 Presiones

| Parámetro | Código | Unidad | Rango Típico | Criticidad |
|-----------|--------|--------|--------------|------------|
| **Wellhead Pressure (THP)** | THP | psi | 50 - 3,000 | Alta |
| **Casing Head Pressure** | CHP | psi | 0 - 2,000 | Media |
| **Bottom Hole Pressure** | BHP | psi | 500 - 10,000 | Alta |
| **Separator Pressure** | SEP_P | psi | 30 - 200 | Alta |
| **Upstream Choke** | P_UP_CHK | psi | Variable | Media |
| **Downstream Choke** | P_DN_CHK | psi | Variable | Media |

**Rangos de alarma típicos:**

```yaml
alarms:
  THP:
    high_high: 1500  # Trip/ESD
    high: 1200       # Alarm
    low: 100         # Warning
    low_low: 50      # Trip
  
  SEP_P:
    high_high: 180   # Trip
    high: 150        # Alarm
    low: 30          # Warning
```

### 2.2 Temperaturas

| Parámetro | Código | Unidad | Rango Típico |
|-----------|--------|--------|--------------|
| **Wellhead Temperature** | WHT | °F | 80 - 250 |
| **Separator Temperature** | SEP_T | °F | 80 - 180 |
| **Oil Outlet Temperature** | OIL_T | °F | 80 - 180 |

### 2.3 Caudales por Fase

| Parámetro | Código | Unidad Estándar | Conversión |
|-----------|--------|-----------------|------------|
| **Oil Rate** | OIL_RATE | BOPD (bbl/day) | 1 bbl = 42 US gal = 159 L |
| **Gas Rate** | GAS_RATE | MCFD (Mscf/day) | @ 14.7 psia, 60°F |
| **Water Rate** | WATER_RATE | BWPD (bbl/day) | - |
| **Liquid Rate** | LIQ_RATE | BPD | OIL + WATER |
| **Total Fluid** | TOTAL_RATE | BPD | Gross production |

### 2.4 BSW (Basic Sediment & Water)

**Definición:** Porcentaje de agua y sedimentos en el crudo producido.

**Métodos de medición:**
1. **Manual (Laboratorio):** Centrifugación ASTM D4007
2. **Inline Analyzer:** Microondas, capacitancia, NIR
3. **Automático (BS&W Probe):** Continuo, real-time

```
BSW (%) = (Water + Sediment Volume / Total Sample Volume) × 100

Rangos típicos:
- Crudo limpio: < 0.5%
- Aceptable: < 1%
- Requiere tratamiento: > 3%
```

---

## 3. Cálculos Críticos

### 3.1 Curvas IPR (Inflow Performance Relationship)

La IPR describe la relación entre la presión de fondo fluyente (Pwf) y la tasa de producción (q). Es fundamental para:
- Determinar capacidad del pozo
- Diseñar sistema de levantamiento artificial
- Optimizar producción

#### 3.1.1 IPR Lineal (Darcy) - Reservorio Bajo-Saturado

Aplica cuando Pwf > Pb (presión de burbuja):

```
q = J × (Pr - Pwf)

Donde:
  q   = Tasa de producción (BOPD)
  J   = Índice de productividad (BOPD/psi)
  Pr  = Presión de reservorio (psi)
  Pwf = Presión de fondo fluyente (psi)

Productivity Index:
  J = q / (Pr - Pwf)
```

#### 3.1.2 IPR de Vogel - Reservorio Saturado

Aplica cuando Pwf < Pb (flujo bifásico en el reservorio):

```
q/qmax = 1 - 0.2×(Pwf/Pr) - 0.8×(Pwf/Pr)²

Donde:
  qmax = AOF (Absolute Open Flow) - tasa teórica a Pwf=0
  qmax = q / [1 - 0.2×(Pwf/Pr) - 0.8×(Pwf/Pr)²]

Para reservorio saturado:
  J* = qmax × 1.8 / Pr
```

#### 3.1.3 IPR Compuesta (Generalizada)

Para reservorios donde Pr > Pb pero puede operar con Pwf < Pb:

```python
def composite_ipr(pwf: float, pr: float, pb: float, j: float) -> float:
    """
    Calcula tasa de producción usando IPR compuesta
    
    Args:
        pwf: Presión de fondo fluyente (psi)
        pr: Presión de reservorio (psi)
        pb: Presión de burbuja (psi)
        j: Índice de productividad sobre Pb (BOPD/psi)
    
    Returns:
        Tasa de producción (BOPD)
    """
    if pr <= pb:
        # Todo el reservorio saturado - Vogel puro
        qmax = j * pr / 1.8
        return qmax * (1 - 0.2*(pwf/pr) - 0.8*(pwf/pr)**2)
    
    elif pwf >= pb:
        # Flujo monofásico - Lineal
        return j * (pr - pwf)
    
    else:
        # Compuesta: lineal hasta Pb, Vogel debajo
        qb = j * (pr - pb)  # Tasa en punto de burbuja
        qmax = qb + j * pb / 1.8
        
        vogel_term = 1 - 0.2*(pwf/pb) - 0.8*(pwf/pb)**2
        return qb + (qmax - qb) * vogel_term
```

### 3.2 AOF (Absolute Open Flow)

El AOF es la tasa teórica máxima que produciría el pozo si Pwf = 0. No es físicamente alcanzable pero sirve como referencia.

```
Para Vogel:
  AOF = qmax = q_test / [1 - 0.2×(Pwf_test/Pr) - 0.8×(Pwf_test/Pr)²]

Para Lineal:
  AOF = J × Pr
```

### 3.3 Productivity Index (J o PI)

El índice de productividad mide la eficiencia del pozo para entregar fluidos.

```
J = q / (Pr - Pwf)   [BOPD/psi]

Interpretación:
  J alto (>5): Pozo muy productivo, alta permeabilidad
  J medio (1-5): Normal
  J bajo (<1): Baja permeabilidad o daño significativo
```

### 3.4 Skin Factor (S)

El Skin Factor cuantifica el daño o estimulación alrededor del pozo:

```
S = 0: Sin daño ni estimulación
S > 0: Daño (reduce productividad)
S < 0: Estimulación (mejora productividad)

Rangos típicos:
  S = -5 a -2: Pozo fracturado/estimulado
  S = -2 a 0: Pozo limpio o levemente estimulado
  S = 0 a +5: Daño leve a moderado
  S = +5 a +20: Daño severo
  S > +20: Daño muy severo, requiere intervención
```

**Cálculo desde buildup test:**

```
S = 1.151 × [(P1hr - Pwf) / m - log(k/(φ×μ×ct×rw²)) + 3.23]

Donde:
  P1hr = Presión extrapolada a 1 hora de cierre
  Pwf  = Presión de fondo al momento de cierre
  m    = Pendiente de la recta semi-log (psi/cycle)
  k    = Permeabilidad (md)
  φ    = Porosidad (fracción)
  μ    = Viscosidad (cp)
  ct   = Compresibilidad total (1/psi)
  rw   = Radio del pozo (ft)
```

### 3.5 Ratios de Producción

```python
def calculate_production_ratios(
    oil_rate: float,    # BOPD
    gas_rate: float,    # MCFD
    water_rate: float   # BWPD
) -> dict:
    """Calcula ratios estándar de producción"""
    
    liquid_rate = oil_rate + water_rate
    
    return {
        # Gas-Oil Ratio
        'gor_scf_bbl': (gas_rate * 1000) / oil_rate if oil_rate > 0 else 0,
        
        # Water-Oil Ratio
        'wor_bbl_bbl': water_rate / oil_rate if oil_rate > 0 else float('inf'),
        
        # Water Cut (%)
        'water_cut_pct': (water_rate / liquid_rate * 100) if liquid_rate > 0 else 0,
        
        # Oil Cut (%)
        'oil_cut_pct': (oil_rate / liquid_rate * 100) if liquid_rate > 0 else 0,
        
        # BSW approximation (sin sedimentos)
        'bsw_pct': (water_rate / liquid_rate * 100) if liquid_rate > 0 else 0,
        
        # Gas-Liquid Ratio (para gas lift)
        'glr_scf_bbl': (gas_rate * 1000) / liquid_rate if liquid_rate > 0 else 0,
    }
```

---

## 4. Modelo de Datos

### 4.1 Entidades Principales

```sql
-- Registro de pruebas de pozo
CREATE TABLE well_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    well_id UUID NOT NULL REFERENCES wells(id),
    
    -- Identificación
    test_number VARCHAR(50) NOT NULL,
    test_type VARCHAR(30) NOT NULL, -- PRODUCTION, EXTENDED, BUILDUP, DST
    
    -- Fechas
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_hours DECIMAL(10, 2),
    
    -- Condiciones de prueba
    choke_size_64ths INTEGER, -- Tamaño de choke en 64avos de pulgada
    separator_pressure_psi DECIMAL(10, 2),
    separator_temp_f DECIMAL(10, 2),
    
    -- Resultados principales
    oil_rate_bopd DECIMAL(10, 2),
    gas_rate_mcfd DECIMAL(10, 2),
    water_rate_bwpd DECIMAL(10, 2),
    liquid_rate_bpd DECIMAL(10, 2),
    
    -- Presiones
    thp_psi DECIMAL(10, 2),
    chp_psi DECIMAL(10, 2),
    bhp_psi DECIMAL(10, 2), -- Si hay medición de fondo
    
    -- Temperaturas
    wht_f DECIMAL(10, 2),
    bht_f DECIMAL(10, 2),
    
    -- Ratios calculados
    gor_scf_bbl DECIMAL(10, 2),
    wor DECIMAL(10, 4),
    bsw_pct DECIMAL(5, 2),
    water_cut_pct DECIMAL(5, 2),
    
    -- Análisis IPR (si aplica)
    reservoir_pressure_psi DECIMAL(10, 2),
    bubble_point_psi DECIMAL(10, 2),
    productivity_index DECIMAL(10, 4),
    aof_bopd DECIMAL(10, 2),
    skin_factor DECIMAL(10, 2),
    
    -- Calidad de datos
    data_quality VARCHAR(20) DEFAULT 'GOOD', -- GOOD, UNSTABLE, POOR
    
    -- Estado
    status VARCHAR(20) DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, COMPLETED, CANCELLED, APPROVED
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    
    -- Notas y observaciones
    notes TEXT,
    
    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_test_number UNIQUE (tenant_id, test_number)
);

-- Datos de tiempo real durante la prueba
CREATE TABLE well_test_readings (
    time TIMESTAMPTZ NOT NULL,
    test_id UUID NOT NULL REFERENCES well_tests(id),
    
    -- Tasas
    oil_rate_bopd DECIMAL(10, 2),
    gas_rate_mcfd DECIMAL(10, 2),
    water_rate_bwpd DECIMAL(10, 2),
    
    -- Presiones
    thp_psi DECIMAL(10, 2),
    chp_psi DECIMAL(10, 2),
    sep_pressure_psi DECIMAL(10, 2),
    
    -- Temperaturas
    wht_f DECIMAL(10, 2),
    sep_temp_f DECIMAL(10, 2),
    
    -- Calidad
    data_quality SMALLINT DEFAULT 192,
    
    PRIMARY KEY (test_id, time)
);

SELECT create_hypertable('well_test_readings', 'time');

-- Puntos de la curva IPR calculada
CREATE TABLE well_test_ipr (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES well_tests(id),
    
    pwf_psi DECIMAL(10, 2) NOT NULL,
    rate_bopd DECIMAL(10, 2) NOT NULL,
    
    ipr_type VARCHAR(20) NOT NULL, -- LINEAR, VOGEL, COMPOSITE
    
    CONSTRAINT unique_ipr_point UNIQUE (test_id, pwf_psi)
);

-- Índice para búsquedas
CREATE INDEX idx_well_tests_well ON well_tests(well_id);
CREATE INDEX idx_well_tests_date ON well_tests(start_time);
CREATE INDEX idx_well_tests_status ON well_tests(status);
```

### 4.2 Flujo de Trabajo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WELL TEST WORKFLOW                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │ PLANNED  │───►│IN_PROGRESS│───►│COMPLETED │───►│ APPROVED │          │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘          │
│       │               │                │                                 │
│       │               │                │                                 │
│       ▼               ▼                ▼                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                           │
│  │CANCELLED │    │ ABORTED  │    │ REJECTED │                           │
│  └──────────┘    └──────────┘    └──────────┘                           │
│                                                                          │
│  Estados:                                                                │
│  - PLANNED: Prueba programada, esperando inicio                         │
│  - IN_PROGRESS: Adquisición de datos en curso                           │
│  - COMPLETED: Datos adquiridos, pendiente revisión                      │
│  - APPROVED: Aprobada por supervisor, datos oficiales                   │
│  - CANCELLED: Cancelada antes de iniciar                                │
│  - ABORTED: Abortada durante ejecución                                  │
│  - REJECTED: Rechazada en revisión, requiere repetir                    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Integración con SCADA

### 5.1 Tags del Separador de Prueba

```yaml
# Configuración de tags para separador de prueba
test_separator_tags:
  separator_id: "SEP-TEST-001"
  
  pressures:
    - tag: "SEP_TEST.INLET_P"
      description: "Inlet Pressure"
      unit: "PSI"
      modbus_address: 40001
      data_type: "FLOAT32"
      
    - tag: "SEP_TEST.OUTLET_P"
      description: "Separator Operating Pressure"
      unit: "PSI"
      modbus_address: 40003
      data_type: "FLOAT32"
      alarm_high: 150
      alarm_low: 30
  
  temperatures:
    - tag: "SEP_TEST.TEMP"
      description: "Operating Temperature"
      unit: "DEG_F"
      modbus_address: 40005
      data_type: "FLOAT32"
  
  levels:
    - tag: "SEP_TEST.OIL_LEVEL"
      description: "Oil Level"
      unit: "PERCENT"
      modbus_address: 40007
      data_type: "FLOAT32"
      
    - tag: "SEP_TEST.WATER_LEVEL"
      description: "Water Boot Level"
      unit: "PERCENT"
      modbus_address: 40009
      data_type: "FLOAT32"
  
  flow_rates:
    - tag: "SEP_TEST.OIL_RATE"
      description: "Oil Flow Rate"
      unit: "BOPD"
      modbus_address: 40011
      data_type: "FLOAT32"
      source: "flow_computer"
      
    - tag: "SEP_TEST.GAS_RATE"
      description: "Gas Flow Rate"
      unit: "MCFD"
      modbus_address: 40013
      data_type: "FLOAT32"
      source: "orifice_meter"
      
    - tag: "SEP_TEST.WATER_RATE"
      description: "Water Flow Rate"
      unit: "BWPD"
      modbus_address: 40015
      data_type: "FLOAT32"
  
  quality:
    - tag: "SEP_TEST.BSW"
      description: "BS&W Percentage"
      unit: "PERCENT"
      modbus_address: 40017
      data_type: "FLOAT32"
      source: "bsw_analyzer"

  valves:
    - tag: "SEP_TEST.INLET_VALVE"
      description: "Inlet Valve Position"
      unit: "PERCENT"
      modbus_address: 40019
      data_type: "FLOAT32"
```

### 5.2 Frecuencia de Muestreo

| Tipo de Dato | Frecuencia | Justificación |
|--------------|------------|---------------|
| Presiones | 1 segundo | Detección rápida de anomalías |
| Temperaturas | 10 segundos | Cambios lentos |
| Flujos instantáneos | 5 segundos | Estabilidad de medición |
| Flujos totalizados | 1 minuto | Cálculo de acumulados |
| BSW | 1 minuto | Análisis lento |
| Niveles | 10 segundos | Control de separador |

### 5.3 Alarmas Críticas

```yaml
critical_alarms:
  # Seguridad de proceso
  - name: "HIGH_HIGH_SEPARATOR_PRESSURE"
    tag: "SEP_TEST.OUTLET_P"
    condition: "> 180"
    severity: "CRITICAL"
    action: "CLOSE_INLET_VALVE"
    
  - name: "HIGH_HIGH_SEPARATOR_LEVEL"
    tag: "SEP_TEST.OIL_LEVEL"
    condition: "> 95"
    severity: "CRITICAL"
    action: "ALARM_OPERATOR"
    
  - name: "LOW_LOW_SEPARATOR_PRESSURE"
    tag: "SEP_TEST.OUTLET_P"
    condition: "< 20"
    severity: "WARNING"
    action: "CHECK_WELL_FLOW"
    
  # Calidad de medición
  - name: "UNSTABLE_FLOW"
    condition: "rate_variance > 10%"
    severity: "WARNING"
    action: "EXTEND_TEST_DURATION"
    
  - name: "HIGH_BSW"
    tag: "SEP_TEST.BSW"
    condition: "> 5"
    severity: "WARNING"
    action: "CHECK_WATER_BREAKTHROUGH"
```

---

## 6. Reportes Estándar

### 6.1 Well Test Summary

```
╔══════════════════════════════════════════════════════════════════════════╗
║                         WELL TEST SUMMARY                                 ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Well:           WELL-NORTE-001                                          ║
║  Field:          CAMPO NORTE                                             ║
║  Test Number:    WT-2024-001                                             ║
║  Test Date:      15-Jan-2024                                             ║
║  Duration:       8 hours                                                  ║
║                                                                           ║
╠══════════════════════════════════════════════════════════════════════════╣
║                         TEST CONDITIONS                                   ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Choke Size:          32/64"                                             ║
║  Separator Pressure:  100 psig                                           ║
║  Separator Temp:      120 °F                                             ║
║                                                                           ║
╠══════════════════════════════════════════════════════════════════════════╣
║                         PRODUCTION RATES                                  ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Oil Rate:           1,250 BOPD                                          ║
║  Gas Rate:           2,500 MCFD                                          ║
║  Water Rate:           320 BWPD                                          ║
║  Liquid Rate:        1,570 BLPD                                          ║
║                                                                           ║
║  GOR:                2,000 scf/bbl                                       ║
║  Water Cut:           20.4 %                                             ║
║  BSW:                  0.8 %                                             ║
║                                                                           ║
╠══════════════════════════════════════════════════════════════════════════╣
║                           PRESSURES                                       ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Tubing Head Pressure (THP):    450 psig                                 ║
║  Casing Head Pressure (CHP):    125 psig                                 ║
║  Bottom Hole Pressure (BHP):  2,800 psig (calculated)                    ║
║  Reservoir Pressure (Pr):     4,500 psig (last buildup)                  ║
║                                                                           ║
╠══════════════════════════════════════════════════════════════════════════╣
║                         IPR ANALYSIS                                      ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Productivity Index (J):    0.74 BOPD/psi                                ║
║  AOF (Absolute Open Flow):  3,330 BOPD                                   ║
║  Flow Efficiency:            72 %                                        ║
║  Skin Factor:               +3.5 (moderate damage)                       ║
║                                                                           ║
╠══════════════════════════════════════════════════════════════════════════╣
║                          COMMENTS                                         ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Well flowing stable after 2 hours of cleanup.                           ║
║  Recommend acid stimulation to improve skin factor.                      ║
║                                                                           ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Tested by: ________________    Approved by: ________________            ║
║  Date:      ________________    Date:        ________________            ║
║                                                                           ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### 6.2 Production Test Certificate

Este es el documento oficial para entes reguladores (PDVSA, Ministerio, etc.):

```
                    REPÚBLICA BOLIVARIANA DE VENEZUELA
                     MINISTERIO DE PETRÓLEO Y MINERÍA
                     
                    CERTIFICADO DE PRUEBA DE PRODUCCIÓN
                    ====================================

Contrato/Bloque: _______________    Operador: _______________
Campo: _________________________    Yacimiento: _____________

                           DATOS DEL POZO
                           
Nombre del Pozo: _______________    Clasificación: Productor
Coordenadas: N: _______ E: ______   Profundidad Total: ______ pies
Intervalo Productor: ______ - ______ pies

                         DATOS DE LA PRUEBA
                         
Fecha de Inicio: ___/___/______     Hora: ____:____
Fecha de Fin:    ___/___/______     Hora: ____:____
Duración Total:  ______ horas

Tipo de Prueba: [ ] Inicial  [ ] Periódica  [ ] Especial

                      CONDICIONES DE OPERACIÓN
                      
Diámetro del Reductor (Choke): ____/64 pulgadas
Presión del Separador de Prueba: ______ psig
Temperatura del Separador: ______ °F

                      RESULTADOS DE LA PRUEBA
                      
┌─────────────────────────────────────────────────────────────────┐
│  PARÁMETRO                    │  VALOR         │  UNIDAD       │
├─────────────────────────────────────────────────────────────────┤
│  Producción de Petróleo       │  __________    │  BPPD         │
│  Producción de Gas            │  __________    │  MPCPD        │
│  Producción de Agua           │  __________    │  BAPD         │
│  Producción Total de Líquido  │  __________    │  BLPD         │
├─────────────────────────────────────────────────────────────────┤
│  Relación Gas-Petróleo (RGP)  │  __________    │  PCN/BN       │
│  Corte de Agua                │  __________    │  %            │
│  BSW                          │  __________    │  %            │
│  Gravedad API                 │  __________    │  °API         │
├─────────────────────────────────────────────────────────────────┤
│  Presión en Cabeza (THP)      │  __________    │  psig         │
│  Presión del Revestidor (CHP) │  __________    │  psig         │
│  Temperatura en Cabeza        │  __________    │  °F           │
└─────────────────────────────────────────────────────────────────┘

                           OBSERVACIONES
                           
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

Certificamos que los datos arriba indicados son correctos y fueron
obtenidos siguiendo los procedimientos establecidos.

_______________________          _______________________
Operador de Producción           Ingeniero de Yacimientos
Nombre:                          Nombre:
C.I.:                            C.I.:
Fecha:                           Fecha:

                    Sello de la Empresa Operadora
```

---

## 7. Implementación de Cálculos

### 7.1 Servicio de Análisis IPR

```python
# services/ipr_analysis.py
from dataclasses import dataclass
from typing import List, Tuple, Optional
import numpy as np

@dataclass
class TestPoint:
    """Punto de prueba individual"""
    pwf: float      # Presión de fondo fluyente (psi)
    rate: float     # Tasa de producción (BOPD)

@dataclass
class IPRResult:
    """Resultados del análisis IPR"""
    pr: float           # Presión de reservorio
    pb: float           # Presión de burbuja
    j: float            # Productivity Index
    aof: float          # Absolute Open Flow
    ipr_type: str       # LINEAR, VOGEL, COMPOSITE
    ipr_curve: List[Tuple[float, float]]  # [(pwf, rate), ...]
    flow_efficiency: float
    skin_factor: Optional[float]

class IPRAnalyzer:
    """Análisis de curvas IPR"""
    
    def __init__(self, 
                 pr: float,           # Reservoir pressure
                 pb: float = None,    # Bubble point (None = use Pr)
                 test_points: List[TestPoint] = None):
        self.pr = pr
        self.pb = pb if pb else pr * 0.8  # Default: 80% of Pr
        self.test_points = test_points or []
    
    def add_test_point(self, pwf: float, rate: float):
        """Agregar punto de prueba"""
        self.test_points.append(TestPoint(pwf=pwf, rate=rate))
    
    def calculate_j_linear(self, test: TestPoint) -> float:
        """Calcular J asumiendo IPR lineal"""
        drawdown = self.pr - test.pwf
        if drawdown <= 0:
            raise ValueError("Pwf must be less than Pr")
        return test.rate / drawdown
    
    def calculate_j_vogel(self, test: TestPoint) -> float:
        """Calcular J* usando Vogel"""
        pwf_ratio = test.pwf / self.pr
        vogel_factor = 1 - 0.2 * pwf_ratio - 0.8 * pwf_ratio**2
        
        if vogel_factor <= 0:
            raise ValueError("Invalid Vogel calculation")
        
        qmax = test.rate / vogel_factor
        return qmax * 1.8 / self.pr
    
    def calculate_aof_vogel(self, test: TestPoint) -> float:
        """Calcular AOF usando Vogel"""
        pwf_ratio = test.pwf / self.pr
        vogel_factor = 1 - 0.2 * pwf_ratio - 0.8 * pwf_ratio**2
        return test.rate / vogel_factor
    
    def generate_ipr_curve(self, 
                           j: float, 
                           ipr_type: str,
                           n_points: int = 50) -> List[Tuple[float, float]]:
        """Generar curva IPR completa"""
        curve = []
        
        for i in range(n_points + 1):
            pwf = self.pr * (1 - i / n_points)  # De Pr a 0
            
            if ipr_type == 'LINEAR':
                rate = j * (self.pr - pwf)
                
            elif ipr_type == 'VOGEL':
                qmax = j * self.pr / 1.8
                pwf_ratio = pwf / self.pr
                rate = qmax * (1 - 0.2 * pwf_ratio - 0.8 * pwf_ratio**2)
                
            elif ipr_type == 'COMPOSITE':
                rate = self._composite_rate(pwf, j)
            
            else:
                raise ValueError(f"Unknown IPR type: {ipr_type}")
            
            curve.append((pwf, max(0, rate)))
        
        return curve
    
    def _composite_rate(self, pwf: float, j: float) -> float:
        """Calcular tasa para IPR compuesta"""
        if pwf >= self.pb:
            # Above bubble point - linear
            return j * (self.pr - pwf)
        else:
            # Below bubble point - Vogel below Pb
            qb = j * (self.pr - self.pb)
            qmax = qb + j * self.pb / 1.8
            
            pwf_ratio = pwf / self.pb
            vogel_factor = 1 - 0.2 * pwf_ratio - 0.8 * pwf_ratio**2
            
            return qb + (qmax - qb) * vogel_factor
    
    def analyze(self) -> IPRResult:
        """Ejecutar análisis IPR completo"""
        if not self.test_points:
            raise ValueError("No test points available")
        
        # Usar el punto más representativo (mayor drawdown)
        test = max(self.test_points, key=lambda t: self.pr - t.pwf)
        
        # Determinar tipo de IPR
        if test.pwf > self.pb:
            ipr_type = 'LINEAR'
            j = self.calculate_j_linear(test)
            aof = j * self.pr
        elif self.pr <= self.pb:
            ipr_type = 'VOGEL'
            j = self.calculate_j_vogel(test)
            aof = self.calculate_aof_vogel(test)
        else:
            ipr_type = 'COMPOSITE'
            j = self.calculate_j_linear(TestPoint(pwf=self.pb, rate=test.rate))
            aof = j * self.pr  # Approximate
        
        # Generar curva
        curve = self.generate_ipr_curve(j, ipr_type)
        
        # Flow efficiency (simplificado)
        ideal_j = j * 1.5  # Asumiendo sin daño
        flow_efficiency = j / ideal_j * 100
        
        return IPRResult(
            pr=self.pr,
            pb=self.pb,
            j=j,
            aof=aof,
            ipr_type=ipr_type,
            ipr_curve=curve,
            flow_efficiency=min(100, flow_efficiency),
            skin_factor=None  # Requiere buildup analysis
        )


# Uso
analyzer = IPRAnalyzer(pr=4500, pb=3200)
analyzer.add_test_point(pwf=2800, rate=1250)

result = analyzer.analyze()
print(f"IPR Type: {result.ipr_type}")
print(f"Productivity Index: {result.j:.3f} BOPD/psi")
print(f"AOF: {result.aof:.0f} BOPD")
print(f"Flow Efficiency: {result.flow_efficiency:.1f}%")
```

---

## 8. Normativas y Estándares

### 8.1 Estándares Aplicables

| Estándar | Descripción | Aplicación |
|----------|-------------|------------|
| **API RP 40** | Recommended Practices for Core Analysis | Muestreo |
| **API MPMS Ch. 14** | Natural Gas Fluids Measurement | Medición de gas |
| **API MPMS Ch. 20** | Allocation Measurement | Asignación de producción |
| **ISO 10790** | Coriolis Mass Flow Meters | Medidores de líquido |
| **AGA Report No. 3** | Orifice Metering | Medición de gas |

### 8.2 Requerimientos Regulatorios Venezuela

- Informe de prueba inicial obligatorio
- Pruebas periódicas cada 6 meses (mínimo)
- Certificación por ingeniero colegiado
- Formato estándar del Ministerio

---

## 9. Referencias

### Documentación Técnica
- Craft, B.C. & Hawkins, M.F.: "Applied Petroleum Reservoir Engineering"
- Vogel, J.V. (1968): "Inflow Performance Relationships for Solution-Gas Drive Wells"
- API RP 40: "Recommended Practices for Core Analysis"

### Software de Referencia
- PROSPER (Petroleum Experts)
- Harmony (IHS Markit)
- WellTest (Kappa Engineering)
- PanSystem (PTC)

### Herramientas Online
- [PengTools IPR Calculator](https://wiki.pengtools.com/index.php?title=IPR)
- [Whitson+ Well Performance](https://manual.whitson.com/modules/well-performance/)
