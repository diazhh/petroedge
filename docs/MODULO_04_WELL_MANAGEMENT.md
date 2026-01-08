# MÓDULO 04: WELL MANAGEMENT (Gestión de Pozos)

## Resumen Ejecutivo

El módulo de Well Management es el núcleo del sistema ERP+SCADA petrolero, proporcionando monitoreo en tiempo real, análisis de producción y optimización de pozos. Este documento define los requerimientos funcionales, parámetros de monitoreo, cálculos de ingeniería y sistemas de levantamiento artificial.

El módulo integra datos de telemetría en tiempo real con análisis de ingeniería de producción (Decline Curve Analysis, Nodal Analysis) y monitoreo de integridad de pozo según API RP 90. Soporta todos los tipos de pozos: productores, inyectores, observación y disposal.

**Funcionalidades principales:**
- Inventario y clasificación de pozos
- Monitoreo de producción en tiempo real
- Decline Curve Analysis (DCA) automatizado
- Nodal Analysis (IPR/VLP)
- Monitoreo de sistemas de levantamiento artificial
- Well Integrity Monitoring (API RP 90)

---

## 1. Clasificación de Pozos

### 1.1 Tipos de Pozos

| Tipo | Código | Descripción | Parámetros Clave |
|------|--------|-------------|------------------|
| **Productor de Petróleo** | PROD_OIL | Producción primaria de crudo | BOPD, GOR, BSW |
| **Productor de Gas** | PROD_GAS | Producción primaria de gas | MCFD, CGR, agua |
| **Productor Combinado** | PROD_COMB | Petróleo + gas significativo | BOPD, MCFD, GOR |
| **Inyector de Agua** | INJ_WATER | Inyección para recuperación secundaria | BWPD, presión inyección |
| **Inyector de Gas** | INJ_GAS | Inyección de gas (ciclaje, WAG) | MCFD, presión inyección |
| **Observación** | OBS | Monitoreo de presión/saturación | BHP, temperatura |
| **Disposal** | DISP | Disposición de agua producida | BWPD, presión inyección |

### 1.2 Estados del Pozo

```
┌─────────────────────────────────────────────────────────────┐
│                    WELL STATUS LIFECYCLE                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  DRILLING ──► COMPLETION ──► PRODUCING ──► WORKOVER         │
│                                   │            │             │
│                                   │            │             │
│                                   ▼            ▼             │
│                              SHUT-IN ◄───── PRODUCING        │
│                                   │                          │
│                                   │                          │
│                                   ▼                          │
│                              ABANDONED                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Estados operacionales:
├── PRODUCING      : Produciendo activamente
├── SHUT_IN        : Cerrado temporalmente
├── WORKOVER       : En intervención
├── TESTING        : En prueba de producción
├── WAITING        : Esperando conexión/infraestructura
├── STIMULATION    : En estimulación (acidificación, fractura)
├── DRILLING       : En perforación
├── COMPLETION     : En completación
├── ABANDONED      : Abandonado (P&A)
└── SUSPENDED      : Suspendido indefinidamente
```

### 1.3 Modelo de Datos de Pozo

```sql
-- Tabla principal de pozos
CREATE TABLE wells (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Identificación
    well_name VARCHAR(100) NOT NULL,
    well_code VARCHAR(50) UNIQUE NOT NULL,
    api_number VARCHAR(20),
    govt_id VARCHAR(50),
    
    -- Ubicación
    field_id UUID REFERENCES fields(id),
    block_id UUID REFERENCES blocks(id),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    elevation_ft DECIMAL(10, 2),
    
    -- Clasificación
    well_type VARCHAR(20) NOT NULL, -- PROD_OIL, PROD_GAS, INJ_WATER, etc.
    well_status VARCHAR(20) NOT NULL DEFAULT 'DRILLING',
    purpose VARCHAR(20), -- EXPLORATION, DEVELOPMENT, INFILL
    
    -- Datos de perforación
    spud_date DATE,
    completion_date DATE,
    first_production_date DATE,
    total_depth_md DECIMAL(10, 2), -- Measured Depth (ft)
    total_depth_tvd DECIMAL(10, 2), -- True Vertical Depth (ft)
    
    -- Completación
    completion_type VARCHAR(50), -- SINGLE, DUAL, COMMINGLED
    artificial_lift VARCHAR(20), -- NATURAL, ESP, GAS_LIFT, ROD_PUMP, PCP
    
    -- Yacimiento
    reservoir_id UUID REFERENCES reservoirs(id),
    perforation_top_md DECIMAL(10, 2),
    perforation_bottom_md DECIMAL(10, 2),
    
    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Índices
CREATE INDEX idx_wells_tenant ON wells(tenant_id);
CREATE INDEX idx_wells_field ON wells(field_id);
CREATE INDEX idx_wells_status ON wells(well_status);
CREATE INDEX idx_wells_type ON wells(well_type);

-- Historial de cambios de estado
CREATE TABLE well_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_id UUID NOT NULL REFERENCES wells(id),
    previous_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    changed_by UUID REFERENCES users(id),
    reason TEXT,
    notes TEXT
);
```

---

## 2. Datos de Producción en Tiempo Real

### 2.1 Parámetros de Monitoreo

#### 2.1.1 Tasas de Producción

| Parámetro | Unidad | Rango Típico | Descripción |
|-----------|--------|--------------|-------------|
| **Oil Rate (BOPD)** | bbl/day | 10 - 10,000 | Tasa de producción de petróleo |
| **Gas Rate (MCFD)** | Mscf/day | 50 - 50,000 | Tasa de producción de gas |
| **Water Rate (BWPD)** | bbl/day | 0 - 20,000 | Tasa de producción de agua |
| **Liquid Rate** | bbl/day | - | BOPD + BWPD |
| **Total Fluid** | bbl/day | - | Incluye emulsiones |

#### 2.1.2 Presiones

| Parámetro | Código | Unidad | Rango Típico | Descripción |
|-----------|--------|--------|--------------|-------------|
| **Tubing Head Pressure** | THP | psi | 50 - 3,000 | Presión en cabeza de tubing |
| **Casing Head Pressure** | CHP | psi | 0 - 2,000 | Presión en cabeza de casing |
| **Bottom Hole Pressure** | BHP | psi | 500 - 10,000 | Presión de fondo fluyente (Pwf) |
| **Reservoir Pressure** | Pr | psi | 1,000 - 15,000 | Presión estática de yacimiento |
| **Annulus A Pressure** | ANN_A | psi | 0 - 500 | Anular A (tubing-casing) |
| **Annulus B Pressure** | ANN_B | psi | 0 - 500 | Anular B |
| **Separator Pressure** | SEP_P | psi | 50 - 500 | Presión del separador |

#### 2.1.3 Temperaturas

| Parámetro | Código | Unidad | Rango Típico |
|-----------|--------|--------|--------------|
| **Wellhead Temperature** | WHT | °F | 80 - 250 |
| **Bottom Hole Temperature** | BHT | °F | 150 - 400 |
| **Separator Temperature** | SEP_T | °F | 80 - 200 |

#### 2.1.4 Ratios y Calidad

| Parámetro | Fórmula | Unidad | Descripción |
|-----------|---------|--------|-------------|
| **GOR** | Gas Rate / Oil Rate | scf/bbl | Gas-Oil Ratio |
| **WOR** | Water Rate / Oil Rate | bbl/bbl | Water-Oil Ratio |
| **BSW** | Water / (Water + Oil) × 100 | % | Basic Sediment & Water |
| **Water Cut** | Water / Total Liquid × 100 | % | Corte de agua |
| **Oil Cut** | Oil / Total Liquid × 100 | % | Corte de petróleo |

### 2.2 Modelo de Datos de Telemetría

```sql
-- Tabla de telemetría de producción (hypertable TimescaleDB)
CREATE TABLE well_production (
    time TIMESTAMPTZ NOT NULL,
    well_id UUID NOT NULL,
    
    -- Tasas
    oil_rate_bopd DOUBLE PRECISION,
    gas_rate_mcfd DOUBLE PRECISION,
    water_rate_bwpd DOUBLE PRECISION,
    liquid_rate_bpd DOUBLE PRECISION,
    
    -- Presiones
    thp_psi DOUBLE PRECISION,
    chp_psi DOUBLE PRECISION,
    bhp_psi DOUBLE PRECISION,
    sep_pressure_psi DOUBLE PRECISION,
    
    -- Temperaturas
    wht_f DOUBLE PRECISION,
    bht_f DOUBLE PRECISION,
    sep_temp_f DOUBLE PRECISION,
    
    -- Ratios calculados
    gor_scf_bbl DOUBLE PRECISION,
    wor_bbl_bbl DOUBLE PRECISION,
    bsw_percent DOUBLE PRECISION,
    water_cut_percent DOUBLE PRECISION,
    
    -- Calidad de datos
    data_quality SMALLINT DEFAULT 192, -- OPC quality code
    source VARCHAR(20), -- SCADA, MANUAL, CALCULATED
    
    PRIMARY KEY (well_id, time)
);

-- Convertir a hypertable
SELECT create_hypertable('well_production', 'time',
    chunk_time_interval => INTERVAL '1 day'
);

-- Compresión
ALTER TABLE well_production SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'well_id'
);

SELECT add_compression_policy('well_production', INTERVAL '7 days');

-- Continuous aggregate para datos horarios
CREATE MATERIALIZED VIEW well_production_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    well_id,
    AVG(oil_rate_bopd) as avg_oil_rate,
    AVG(gas_rate_mcfd) as avg_gas_rate,
    AVG(water_rate_bwpd) as avg_water_rate,
    AVG(thp_psi) as avg_thp,
    AVG(chp_psi) as avg_chp,
    MIN(oil_rate_bopd) as min_oil_rate,
    MAX(oil_rate_bopd) as max_oil_rate,
    COUNT(*) as sample_count
FROM well_production
GROUP BY bucket, well_id;

-- Continuous aggregate para datos diarios (producción fiscal)
CREATE MATERIALIZED VIEW well_production_daily
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', time) AS bucket,
    well_id,
    AVG(oil_rate_bopd) as avg_oil_bopd,
    AVG(gas_rate_mcfd) as avg_gas_mcfd,
    AVG(water_rate_bwpd) as avg_water_bwpd,
    AVG(bsw_percent) as avg_bsw,
    AVG(gor_scf_bbl) as avg_gor,
    SUM(oil_rate_bopd) / COUNT(*) * 24 as cum_oil_bbl,
    SUM(gas_rate_mcfd) / COUNT(*) * 24 as cum_gas_mscf,
    SUM(water_rate_bwpd) / COUNT(*) * 24 as cum_water_bbl
FROM well_production
GROUP BY bucket, well_id;
```

### 2.3 Tags SCADA Típicos

```yaml
# Definición de tags para un pozo típico
well_tags:
  production:
    - tag: "${WELL_ID}.OIL_RATE"
      description: "Oil production rate"
      unit: "BOPD"
      source: "flow_computer"
      polling_interval: 10s
      
    - tag: "${WELL_ID}.GAS_RATE"
      description: "Gas production rate"
      unit: "MCFD"
      source: "flow_computer"
      polling_interval: 10s
      
    - tag: "${WELL_ID}.WATER_RATE"
      description: "Water production rate"
      unit: "BWPD"
      source: "flow_computer"
      polling_interval: 10s

  pressures:
    - tag: "${WELL_ID}.THP"
      description: "Tubing Head Pressure"
      unit: "PSI"
      source: "pressure_transmitter"
      polling_interval: 5s
      alarm_high: 800
      alarm_low: 50
      
    - tag: "${WELL_ID}.CHP"
      description: "Casing Head Pressure"
      unit: "PSI"
      source: "pressure_transmitter"
      polling_interval: 5s
      alarm_high: 300

  temperatures:
    - tag: "${WELL_ID}.WHT"
      description: "Wellhead Temperature"
      unit: "DEG_F"
      source: "temperature_transmitter"
      polling_interval: 60s

  status:
    - tag: "${WELL_ID}.STATUS"
      description: "Well operational status"
      type: "ENUM"
      values: [0: "OFFLINE", 1: "PRODUCING", 2: "SHUT_IN", 3: "TESTING"]
      source: "plc"
      polling_interval: 5s
```

---

## 3. Decline Curve Analysis (DCA)

### 3.1 Fundamentos

El Decline Curve Analysis (DCA) es una técnica empírica para predecir la producción futura basándose en datos históricos. Desarrollada por Arps (1945), utiliza tres tipos de curvas de declinación.

### 3.2 Ecuaciones de Arps

#### 3.2.1 Declinación Exponencial (b = 0)

```
q(t) = qi × e^(-Di × t)

Donde:
- q(t) = Tasa de producción en tiempo t
- qi   = Tasa de producción inicial
- Di   = Tasa de declinación inicial (1/tiempo)
- t    = Tiempo transcurrido
```

**Características:**
- Tasa de declinación constante
- Típica de reservorios con alto soporte de presión (water drive)
- Más conservadora para estimaciones de reservas

#### 3.2.2 Declinación Hiperbólica (0 < b < 1)

```
q(t) = qi / (1 + b × Di × t)^(1/b)

Donde:
- b = Exponente de Arps (típicamente 0 < b < 1)
```

**Características:**
- Tasa de declinación variable (decrece con el tiempo)
- Más común en reservorios convencionales
- b típico: 0.3 - 0.5 para petróleo, 0.5 - 0.8 para gas

#### 3.2.3 Declinación Armónica (b = 1)

```
q(t) = qi / (1 + Di × t)
```

**Características:**
- Caso especial de hiperbólica con b = 1
- Menos común en la práctica
- Puede sobrestimar reservas

### 3.3 Cálculo de EUR (Estimated Ultimate Recovery)

```
EUR = Np(t=∞) = Integral de q(t) desde 0 hasta infinito

Para Exponencial:
EUR = qi / Di

Para Hiperbólica (b < 1):
EUR = (qi / Di) × (1 / (1-b)) × [1 - (1 + b×Di×t)^(1-1/b)]

Para abandono económico (q_abandon):
EUR = Np(t_abandon)
```

### 3.4 Implementación en Python

```python
# decline_curve_analysis.py
import numpy as np
from scipy.optimize import curve_fit
from dataclasses import dataclass
from typing import Tuple, Optional
from enum import Enum

class DeclineType(Enum):
    EXPONENTIAL = "exponential"
    HYPERBOLIC = "hyperbolic"
    HARMONIC = "harmonic"

@dataclass
class DeclineParameters:
    qi: float           # Initial rate (BOPD)
    di: float           # Initial decline rate (1/day)
    b: float            # Arps exponent
    decline_type: DeclineType
    r_squared: float    # Goodness of fit

@dataclass
class ProductionForecast:
    time_days: np.ndarray
    rate_bopd: np.ndarray
    cumulative_bbl: np.ndarray
    eur_bbl: float
    remaining_reserves_bbl: float

class DeclineCurveAnalysis:
    """Arps Decline Curve Analysis implementation"""
    
    def __init__(self, 
                 time_days: np.ndarray, 
                 rate_bopd: np.ndarray,
                 economic_limit_bopd: float = 5.0):
        self.time = time_days
        self.rate = rate_bopd
        self.economic_limit = economic_limit_bopd
        self.parameters: Optional[DeclineParameters] = None
    
    @staticmethod
    def exponential(t: np.ndarray, qi: float, di: float) -> np.ndarray:
        """Exponential decline: q = qi * exp(-di * t)"""
        return qi * np.exp(-di * t)
    
    @staticmethod
    def hyperbolic(t: np.ndarray, qi: float, di: float, b: float) -> np.ndarray:
        """Hyperbolic decline: q = qi / (1 + b*di*t)^(1/b)"""
        return qi / np.power(1 + b * di * t, 1/b)
    
    @staticmethod
    def harmonic(t: np.ndarray, qi: float, di: float) -> np.ndarray:
        """Harmonic decline: q = qi / (1 + di * t)"""
        return qi / (1 + di * t)
    
    def fit_exponential(self) -> Tuple[DeclineParameters, float]:
        """Fit exponential decline curve"""
        try:
            popt, _ = curve_fit(
                self.exponential, 
                self.time, 
                self.rate,
                p0=[self.rate[0], 0.001],
                bounds=([0, 0], [np.inf, 1])
            )
            qi, di = popt
            predicted = self.exponential(self.time, qi, di)
            r2 = self._calculate_r_squared(predicted)
            
            return DeclineParameters(
                qi=qi, di=di, b=0,
                decline_type=DeclineType.EXPONENTIAL,
                r_squared=r2
            ), r2
        except Exception as e:
            raise ValueError(f"Exponential fit failed: {e}")
    
    def fit_hyperbolic(self) -> Tuple[DeclineParameters, float]:
        """Fit hyperbolic decline curve"""
        try:
            popt, _ = curve_fit(
                self.hyperbolic,
                self.time,
                self.rate,
                p0=[self.rate[0], 0.001, 0.5],
                bounds=([0, 0, 0.01], [np.inf, 1, 0.99])
            )
            qi, di, b = popt
            predicted = self.hyperbolic(self.time, qi, di, b)
            r2 = self._calculate_r_squared(predicted)
            
            return DeclineParameters(
                qi=qi, di=di, b=b,
                decline_type=DeclineType.HYPERBOLIC,
                r_squared=r2
            ), r2
        except Exception as e:
            raise ValueError(f"Hyperbolic fit failed: {e}")
    
    def best_fit(self) -> DeclineParameters:
        """Find best fitting decline model"""
        models = []
        
        try:
            exp_params, exp_r2 = self.fit_exponential()
            models.append((exp_params, exp_r2))
        except:
            pass
        
        try:
            hyp_params, hyp_r2 = self.fit_hyperbolic()
            models.append((hyp_params, hyp_r2))
        except:
            pass
        
        if not models:
            raise ValueError("No decline model could be fitted")
        
        # Select model with best R²
        best_model = max(models, key=lambda x: x[1])
        self.parameters = best_model[0]
        return self.parameters
    
    def forecast(self, 
                 forecast_years: int = 30,
                 params: Optional[DeclineParameters] = None
                ) -> ProductionForecast:
        """Generate production forecast"""
        if params is None:
            params = self.parameters or self.best_fit()
        
        # Generate time array
        forecast_days = forecast_years * 365
        t = np.arange(0, forecast_days, 1)
        
        # Calculate rates
        if params.decline_type == DeclineType.EXPONENTIAL:
            rates = self.exponential(t, params.qi, params.di)
        else:
            rates = self.hyperbolic(t, params.qi, params.di, params.b)
        
        # Apply economic limit
        above_limit = rates >= self.economic_limit
        t = t[above_limit]
        rates = rates[above_limit]
        
        # Calculate cumulative production
        cumulative = np.cumsum(rates)
        
        # EUR
        eur = cumulative[-1] if len(cumulative) > 0 else 0
        
        # Remaining reserves (EUR - Np to date)
        np_to_date = np.sum(self.rate)
        remaining = max(0, eur - np_to_date)
        
        return ProductionForecast(
            time_days=t,
            rate_bopd=rates,
            cumulative_bbl=cumulative,
            eur_bbl=eur,
            remaining_reserves_bbl=remaining
        )
    
    def _calculate_r_squared(self, predicted: np.ndarray) -> float:
        """Calculate R-squared (coefficient of determination)"""
        ss_res = np.sum((self.rate - predicted) ** 2)
        ss_tot = np.sum((self.rate - np.mean(self.rate)) ** 2)
        return 1 - (ss_res / ss_tot)


# Usage example
if __name__ == "__main__":
    # Sample production data
    time_days = np.array([0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360])
    rate_bopd = np.array([1000, 950, 900, 860, 820, 785, 750, 720, 690, 665, 640, 615, 595])
    
    dca = DeclineCurveAnalysis(time_days, rate_bopd)
    params = dca.best_fit()
    
    print(f"Best fit: {params.decline_type.value}")
    print(f"qi = {params.qi:.1f} BOPD")
    print(f"Di = {params.di:.6f} 1/day ({params.di*365*100:.1f}% annual)")
    print(f"b = {params.b:.2f}")
    print(f"R² = {params.r_squared:.4f}")
    
    forecast = dca.forecast(forecast_years=20)
    print(f"\nEUR = {forecast.eur_bbl:,.0f} bbl")
    print(f"Remaining Reserves = {forecast.remaining_reserves_bbl:,.0f} bbl")
```

---

## 4. Nodal Analysis

### 4.1 Concepto

El Nodal Analysis divide el sistema de producción en dos componentes:

1. **IPR (Inflow Performance Relationship):** Describe la capacidad del yacimiento para entregar fluidos al fondo del pozo
2. **VLP (Vertical Lift Performance) / TPR:** Describe la capacidad del sistema de levantamiento para llevar fluidos a superficie

El punto de operación es donde IPR = VLP.

### 4.2 Curva IPR

#### 4.2.1 IPR Lineal (Reservorios bajo-saturados)

```
q = J × (Pr - Pwf)

Donde:
- q = Tasa de producción
- J = Índice de productividad (bbl/day/psi)
- Pr = Presión de reservorio
- Pwf = Presión de fondo fluyente
```

#### 4.2.2 IPR de Vogel (Reservorios con gas en solución)

```
q/qmax = 1 - 0.2×(Pwf/Pr) - 0.8×(Pwf/Pr)²

Donde:
- qmax = AOF (Absolute Open Flow)
- AOF = J × Pr / 1.8  (para flujo bifásico)
```

#### 4.2.3 IPR Compuesta (Generalizada)

```python
def composite_ipr(pwf: float, pr: float, pb: float, j: float) -> float:
    """
    IPR compuesta para reservorios con Pr > Pb y Pwf < Pb
    
    Args:
        pwf: Bottomhole flowing pressure (psi)
        pr: Reservoir pressure (psi)
        pb: Bubble point pressure (psi)
        j: Productivity index (bbl/day/psi)
    
    Returns:
        Production rate (BOPD)
    """
    if pwf >= pb:
        # Above bubble point - linear
        return j * (pr - pwf)
    elif pr <= pb:
        # Entire reservoir below bubble point - Vogel
        qmax = j * pr / 1.8
        return qmax * (1 - 0.2*(pwf/pr) - 0.8*(pwf/pr)**2)
    else:
        # Composite - linear above Pb, Vogel below
        qb = j * (pr - pb)  # Rate at bubble point
        qmax = qb + j * pb / 1.8
        
        if pwf >= pb:
            return j * (pr - pwf)
        else:
            vogel_term = 1 - 0.2*(pwf/pb) - 0.8*(pwf/pb)**2
            return qb + (qmax - qb) * vogel_term
```

### 4.3 Curva VLP

La VLP se calcula usando correlaciones de flujo multifásico:

- **Hagedorn & Brown:** Flujo vertical, petróleo pesado
- **Duns & Ros:** Flujo vertical, amplio rango
- **Beggs & Brill:** Flujo inclinado y horizontal
- **Gray:** Pozos de gas

```python
def calculate_vlp_point(
    surface_pressure: float,  # THP (psi)
    depth: float,             # TVD (ft)
    oil_rate: float,          # BOPD
    gas_rate: float,          # MCFD
    water_rate: float,        # BWPD
    tubing_id: float,         # inches
    oil_gravity: float,       # API
    gas_gravity: float,       # SG air=1
    water_cut: float,         # fraction
    temperature: float        # °F average
) -> float:
    """
    Calculate bottomhole pressure for given conditions
    Uses simplified Hagedorn-Brown correlation
    
    Returns:
        Pwf (psi) - Bottomhole flowing pressure
    """
    # Simplified calculation - production system would use
    # full multiphase flow correlations
    
    liquid_rate = oil_rate + water_rate
    glr = gas_rate * 1000 / liquid_rate if liquid_rate > 0 else 0
    
    # Hydrostatic component
    oil_density = 141.5 / (131.5 + oil_gravity) * 62.4  # lb/ft³
    water_density = 62.4 * 1.02  # lb/ft³
    
    mixture_density = (
        oil_density * (1 - water_cut) + 
        water_density * water_cut
    )
    
    hydrostatic = mixture_density * depth / 144  # psi
    
    # Friction component (simplified)
    velocity = liquid_rate * 5.615 / (np.pi * (tubing_id/24)**2 * 86400)
    friction_factor = 0.02  # Approximate
    friction = friction_factor * depth * velocity**2 * mixture_density / (2 * 32.2 * tubing_id/12) / 144
    
    return surface_pressure + hydrostatic + friction
```

### 4.4 Punto de Operación

```python
def find_operating_point(
    ipr_func,      # IPR function: pwf -> rate
    vlp_func,      # VLP function: rate -> pwf
    pr: float,     # Reservoir pressure
    thp: float,    # Surface pressure
    tolerance: float = 0.1
) -> Tuple[float, float]:
    """
    Find intersection of IPR and VLP curves
    
    Returns:
        (operating_rate, operating_pwf)
    """
    from scipy.optimize import brentq
    
    def residual(pwf):
        rate_ipr = ipr_func(pwf)
        pwf_vlp = vlp_func(rate_ipr)
        return pwf - pwf_vlp
    
    # Find Pwf where IPR and VLP intersect
    pwf_op = brentq(residual, thp, pr * 0.99)
    rate_op = ipr_func(pwf_op)
    
    return rate_op, pwf_op
```

---

## 5. Sistemas de Levantamiento Artificial

### 5.1 Comparativa de Sistemas

| Sistema | Rango Profundidad | Rango Caudal | Viscosidad | Gas | Arena | Desviación |
|---------|-------------------|--------------|------------|-----|-------|------------|
| **ESP** | 1,000-15,000 ft | 200-30,000 BOPD | Baja-Media | Limitado | Problema | Alta OK |
| **Gas Lift** | 1,000-15,000 ft | 50-30,000 BOPD | Cualquiera | Excelente | OK | Alta OK |
| **Rod Pump** | 100-14,000 ft | 5-5,000 BOPD | Alta OK | Problema | Problema | Limitada |
| **PCP** | 500-6,000 ft | 5-4,000 BOPD | Muy Alta | Limitado | Excelente | Alta OK |
| **Plunger** | 3,000-12,000 ft | 10-500 BOPD | Baja | Requiere | Limitado | Limitada |

### 5.2 ESP (Electrical Submersible Pump)

#### 5.2.1 Parámetros de Monitoreo

| Parámetro | Código | Unidad | Alarma Típica |
|-----------|--------|--------|---------------|
| **Motor Current** | ESP_AMPS | A | > 90% nominal |
| **Motor Voltage** | ESP_VOLTS | V | ±10% nominal |
| **Motor Power** | ESP_KW | kW | Calculado |
| **Frequency** | ESP_HZ | Hz | Set point ± 5% |
| **Intake Pressure** | ESP_PIP | psi | < límite gas lock |
| **Intake Temperature** | ESP_TEMP | °F | < límite motor |
| **Discharge Pressure** | ESP_PDP | psi | Monitoreo |
| **Motor Temperature** | ESP_MTR_TEMP | °F | < 300°F típico |
| **Vibration** | ESP_VIB | g | > 5g alarma |

#### 5.2.2 Diagnóstico de ESP

```python
class ESPDiagnostics:
    """ESP health diagnostics and alarming"""
    
    def __init__(self, design_params: dict):
        self.nominal_current = design_params['nominal_current']
        self.nominal_voltage = design_params['nominal_voltage']
        self.max_temperature = design_params['max_temperature']
        self.min_pip = design_params['min_intake_pressure']
        
    def analyze(self, readings: dict) -> dict:
        """Analyze ESP readings and return diagnostics"""
        diagnostics = {
            'status': 'OK',
            'issues': [],
            'recommendations': []
        }
        
        # Current analysis
        current_ratio = readings['current'] / self.nominal_current
        if current_ratio > 1.1:
            diagnostics['issues'].append('HIGH_CURRENT')
            diagnostics['recommendations'].append(
                'Check for pump wear, sand ingestion, or mechanical issues'
            )
        elif current_ratio < 0.7:
            diagnostics['issues'].append('LOW_CURRENT')
            diagnostics['recommendations'].append(
                'Check for gas locking, low inflow, or broken shaft'
            )
        
        # Temperature analysis
        if readings['motor_temp'] > self.max_temperature * 0.9:
            diagnostics['issues'].append('HIGH_TEMPERATURE')
            diagnostics['recommendations'].append(
                'Check cooling flow, reduce frequency, or increase casing flow'
            )
        
        # Intake pressure (gas lock prevention)
        if readings['intake_pressure'] < self.min_pip:
            diagnostics['issues'].append('LOW_INTAKE_PRESSURE')
            diagnostics['recommendations'].append(
                'Risk of gas lock - consider reducing frequency or gas separator'
            )
        
        # Voltage imbalance
        voltage_imbalance = self._calculate_voltage_imbalance(
            readings['voltage_a'],
            readings['voltage_b'],
            readings['voltage_c']
        )
        if voltage_imbalance > 2:  # 2% imbalance threshold
            diagnostics['issues'].append('VOLTAGE_IMBALANCE')
            diagnostics['recommendations'].append(
                'Check power supply and cable integrity'
            )
        
        if diagnostics['issues']:
            diagnostics['status'] = 'WARNING' if len(diagnostics['issues']) < 2 else 'ALARM'
        
        return diagnostics
    
    def _calculate_voltage_imbalance(self, va, vb, vc) -> float:
        """Calculate voltage imbalance percentage"""
        avg = (va + vb + vc) / 3
        max_dev = max(abs(va - avg), abs(vb - avg), abs(vc - avg))
        return (max_dev / avg) * 100 if avg > 0 else 0
```

### 5.3 Gas Lift

#### 5.3.1 Parámetros de Monitoreo

| Parámetro | Código | Unidad | Descripción |
|-----------|--------|--------|-------------|
| **Injection Rate** | GL_INJ_RATE | MCFD | Gas inyectado |
| **Injection Pressure** | GL_INJ_P | psi | Presión de inyección |
| **Casing Pressure** | GL_CHP | psi | Presión en casing |
| **Tubing Pressure** | GL_THP | psi | Presión en tubing |
| **Valve Status** | GL_VALVE_n | OPEN/CLOSED | Estado de válvula n |
| **Production Rate** | GL_OIL_RATE | BOPD | Producción resultante |
| **GLR** | GL_GLR | scf/bbl | Gas-Liquid Ratio total |
| **Injection GLR** | GL_INJ_GLR | scf/bbl | GLR de inyección |

#### 5.3.2 Optimización de Gas Lift

```python
def optimize_gas_lift(
    current_injection: float,  # MCFD
    current_production: float,  # BOPD
    ipr_params: dict,
    vlp_correlation: callable,
    gas_cost: float,  # $/Mscf
    oil_price: float  # $/bbl
) -> dict:
    """
    Find optimal gas injection rate to maximize profit
    
    Returns:
        Optimal injection rate and expected production
    """
    from scipy.optimize import minimize_scalar
    
    def negative_profit(inj_rate):
        # Calculate production at this injection rate
        # (simplified - real implementation uses full VLP)
        production = current_production * (1 + 0.1 * np.log(inj_rate / current_injection))
        
        revenue = production * oil_price
        injection_cost = inj_rate * gas_cost
        
        return -(revenue - injection_cost)
    
    result = minimize_scalar(
        negative_profit,
        bounds=(0, current_injection * 3),
        method='bounded'
    )
    
    optimal_inj = result.x
    optimal_prod = current_production * (1 + 0.1 * np.log(optimal_inj / current_injection))
    
    return {
        'optimal_injection_mcfd': optimal_inj,
        'expected_production_bopd': optimal_prod,
        'incremental_oil_bopd': optimal_prod - current_production,
        'daily_profit': -result.fun
    }
```

### 5.4 Rod Pump (Beam Pump)

#### 5.4.1 Parámetros de Monitoreo

| Parámetro | Código | Unidad | Descripción |
|-----------|--------|--------|-------------|
| **Strokes Per Minute** | RP_SPM | spm | Velocidad de bombeo |
| **Stroke Length** | RP_SL | inches | Carrera de la unidad |
| **Motor Load** | RP_LOAD | % | Carga del motor |
| **Runtime** | RP_RUNTIME | hours | Tiempo operando |
| **Pump Fillage** | RP_FILL | % | Llenado de bomba |
| **Production** | RP_BOPD | BOPD | Producción |

#### 5.4.2 Dynamometer Cards

Las tarjetas dinamométricas son críticas para diagnóstico de rod pumps:

```python
class DynamometerCard:
    """Analyze dynamometer (dynacard) for rod pump diagnostics"""
    
    def __init__(self, position: np.ndarray, load: np.ndarray):
        """
        Args:
            position: Rod position array (inches)
            load: Rod load array (lbs)
        """
        self.position = position
        self.load = load
        
    def calculate_area(self) -> float:
        """Calculate card area (proportional to work done)"""
        # Shoelace formula
        n = len(self.position)
        area = 0
        for i in range(n):
            j = (i + 1) % n
            area += self.position[i] * self.load[j]
            area -= self.position[j] * self.load[i]
        return abs(area) / 2
    
    def diagnose(self) -> dict:
        """
        Diagnose pump condition based on card shape
        
        Returns common issues:
        - FULL_PUMP: Normal full pump operation
        - GAS_INTERFERENCE: Gas in pump
        - FLUID_POUND: Incomplete fillage
        - PUMP_OFF: Pump not filling
        - LEAKING_TRAVELING_VALVE: TV leaking
        - LEAKING_STANDING_VALVE: SV leaking
        """
        # Calculate key metrics
        max_load = np.max(self.load)
        min_load = np.min(self.load)
        load_range = max_load - min_load
        
        stroke_length = np.max(self.position) - np.min(self.position)
        card_area = self.calculate_area()
        
        # Theoretical full pump area (approximation)
        theoretical_area = stroke_length * load_range
        fillage = card_area / theoretical_area if theoretical_area > 0 else 0
        
        diagnosis = {
            'fillage_percent': fillage * 100,
            'max_load_lbs': max_load,
            'min_load_lbs': min_load,
            'stroke_length_in': stroke_length,
            'card_area': card_area,
            'condition': 'UNKNOWN'
        }
        
        # Simple pattern matching (production would use ML)
        if fillage > 0.85:
            diagnosis['condition'] = 'FULL_PUMP'
        elif fillage > 0.60:
            diagnosis['condition'] = 'PARTIAL_PUMP'
        elif fillage > 0.30:
            diagnosis['condition'] = 'GAS_INTERFERENCE'
        else:
            diagnosis['condition'] = 'PUMP_OFF'
        
        return diagnosis
```

### 5.5 PCP (Progressive Cavity Pump)

#### 5.5.1 Parámetros de Monitoreo

| Parámetro | Código | Unidad | Descripción |
|-----------|--------|--------|-------------|
| **RPM** | PCP_RPM | rpm | Velocidad de rotación |
| **Torque** | PCP_TORQUE | ft-lb | Torque en superficie |
| **Motor Current** | PCP_AMPS | A | Corriente del motor |
| **Wellhead Pressure** | PCP_WHP | psi | Presión de cabeza |
| **Production** | PCP_BOPD | BOPD | Producción |
| **Runtime** | PCP_RUNTIME | hours | Tiempo operando |
| **Vibration** | PCP_VIB | g | Vibración |

---

## 6. Well Integrity Monitoring

### 6.1 Normativa API RP 90

API RP 90-1 define la gestión de presión en anulares para pozos offshore. Los principios aplican también a pozos onshore.

### 6.2 Fuentes de Presión en Anulares

| Fuente | Descripción | Comportamiento |
|--------|-------------|----------------|
| **Térmica** | Expansión de fluidos por temperatura | Se estabiliza, no reconstruye |
| **Operacional** | Gas lift, inyección | Controlable, intencional |
| **SCP (Sustained Casing Pressure)** | Falla de barrera | Reconstruye después de bleed-off |

### 6.3 Designación de Anulares

```
┌─────────────────────────────────────────────────┐
│                  WELLHEAD                        │
├─────────────────────────────────────────────────┤
│                                                  │
│    ┌──────────────────────────────────────┐     │
│    │          PRODUCTION TUBING           │     │
│    │               ║                      │     │
│    │    ╔═════════╬═════════╗             │     │
│    │    ║    A    ║         ║             │     │
│    │    ║ ANNULUS ║         ║             │     │
│    │    ║    │    ║         ║             │     │
│    │    ╠════╪════╬═════════╣             │     │
│    │    ║    │    ║    B    ║             │     │
│    │    ║    │    ║ ANNULUS ║             │     │
│    │    ║    │    ║    │    ║             │     │
│    │    ╠════╪════╬════╪════╣             │     │
│    │    ║    │    ║    │    ║    C        │     │
│    │    ║    │    ║    │    ║ ANNULUS     │     │
│    │    ║    │    ║    │    ║    │        │     │
│    │    ╚════╪════╬════╪════╬════╪════╝   │     │
│    │         │    ║    │    ║    │        │     │
│    │         │    ║    │    ║    │        │     │
│    │    PRODUCTION│SURFACE INTERMEDIATE  │     │
│    │    CASING   ║CASING   CASING        │     │
│    └──────────────────────────────────────┘     │
│                                                  │
│  A Annulus: Tubing - Production Casing          │
│  B Annulus: Production Casing - Surface Casing  │
│  C Annulus: Surface Casing - Intermediate       │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 6.4 Monitoreo de Integridad

```python
class WellIntegrityMonitor:
    """Monitor well integrity based on annular pressures"""
    
    def __init__(self, well_id: str, design_params: dict):
        self.well_id = well_id
        self.mawop = design_params['mawop']  # Maximum Allowable Wellhead Operating Pressure
        self.annulus_limits = design_params['annulus_limits']
        
    def check_annulus_pressure(
        self,
        annulus: str,  # 'A', 'B', 'C'
        pressure: float,
        previous_pressure: float,
        time_delta_hours: float
    ) -> dict:
        """
        Check annulus pressure for integrity issues
        
        Returns:
            Assessment dict with severity and recommendations
        """
        limit = self.annulus_limits.get(annulus, {})
        max_pressure = limit.get('max', float('inf'))
        rate_of_change_limit = limit.get('roc_psi_hr', 50)
        
        assessment = {
            'annulus': annulus,
            'pressure_psi': pressure,
            'status': 'OK',
            'severity': 0,
            'issues': [],
            'recommendations': []
        }
        
        # Check absolute pressure
        if pressure > max_pressure:
            assessment['status'] = 'ALARM'
            assessment['severity'] = 3
            assessment['issues'].append('OVER_PRESSURE')
            assessment['recommendations'].append(
                f'Bleed {annulus} annulus to safe pressure'
            )
        
        # Check rate of change (potential SCP indicator)
        if time_delta_hours > 0:
            roc = (pressure - previous_pressure) / time_delta_hours
            
            if roc > rate_of_change_limit:
                assessment['status'] = 'WARNING'
                assessment['severity'] = max(assessment['severity'], 2)
                assessment['issues'].append('HIGH_PRESSURE_BUILDUP')
                assessment['recommendations'].append(
                    'Monitor for SCP - perform bleed-down test'
                )
        
        # Check for SCP (pressure rebuilds after bleed)
        # This would require historical bleed-down data
        
        return assessment
    
    def perform_bleed_test(
        self,
        annulus: str,
        initial_pressure: float,
        bleed_pressure: float,
        rebuild_time_hours: float,
        final_pressure: float
    ) -> dict:
        """
        Analyze bleed-down test results for SCP
        
        Returns:
            SCP assessment
        """
        rebuild_rate = (final_pressure - bleed_pressure) / rebuild_time_hours
        
        if final_pressure < initial_pressure * 0.5:
            status = 'THERMAL'
            scp = False
        elif rebuild_rate < 5:  # psi/hour
            status = 'POSSIBLE_SCP'
            scp = True
        else:
            status = 'CONFIRMED_SCP'
            scp = True
        
        return {
            'annulus': annulus,
            'initial_pressure': initial_pressure,
            'bleed_pressure': bleed_pressure,
            'final_pressure': final_pressure,
            'rebuild_rate_psi_hr': rebuild_rate,
            'scp_detected': scp,
            'classification': status,
            'recommended_action': (
                'Schedule diagnostic workover' if scp 
                else 'Continue routine monitoring'
            )
        }
```

### 6.5 Modelo de Datos de Integridad

```sql
-- Lecturas de presión de anulares
CREATE TABLE annulus_pressure_readings (
    time TIMESTAMPTZ NOT NULL,
    well_id UUID NOT NULL,
    annulus CHAR(1) NOT NULL, -- 'A', 'B', 'C', 'D'
    pressure_psi DOUBLE PRECISION,
    temperature_f DOUBLE PRECISION,
    data_quality SMALLINT DEFAULT 192,
    PRIMARY KEY (well_id, annulus, time)
);

SELECT create_hypertable('annulus_pressure_readings', 'time');

-- Pruebas de bleed-down
CREATE TABLE bleed_down_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_id UUID NOT NULL REFERENCES wells(id),
    annulus CHAR(1) NOT NULL,
    test_date TIMESTAMPTZ NOT NULL,
    
    initial_pressure_psi DOUBLE PRECISION,
    bleed_pressure_psi DOUBLE PRECISION,
    final_pressure_psi DOUBLE PRECISION,
    rebuild_time_hours DOUBLE PRECISION,
    
    scp_detected BOOLEAN,
    classification VARCHAR(50),
    
    performed_by UUID REFERENCES users(id),
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Well integrity events
CREATE TABLE well_integrity_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_id UUID NOT NULL REFERENCES wells(id),
    event_type VARCHAR(50) NOT NULL,
    severity INTEGER NOT NULL, -- 1=Info, 2=Warning, 3=Alarm, 4=Critical
    
    annulus CHAR(1),
    pressure_psi DOUBLE PRECISION,
    
    description TEXT,
    recommended_action TEXT,
    
    detected_at TIMESTAMPTZ NOT NULL,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id),
    resolution_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. Visualizaciones y Dashboards

### 7.1 Dashboard de Pozo Individual

```
┌─────────────────────────────────────────────────────────────────────────┐
│  WELL-001 - Campo Norte                                    🟢 PRODUCING  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
│  │   OIL RATE       │  │   GAS RATE       │  │   WATER RATE     │       │
│  │   1,250 BOPD     │  │   2,500 MCFD     │  │   320 BWPD       │       │
│  │   ▲ +5%         │  │   ▼ -2%         │  │   ▲ +8%         │       │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘       │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
│  │   THP            │  │   CHP            │  │   GOR            │       │
│  │   450 PSI        │  │   125 PSI        │  │   2,000 scf/bbl  │       │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘       │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    PRODUCTION HISTORY (30 days)                     │ │
│  │  1500 ┤                                                             │ │
│  │       │  ████                                                       │ │
│  │  1000 ┤  ████████████████████████                                   │ │
│  │       │  ████████████████████████████████████████                   │ │
│  │   500 ┤                                                             │ │
│  │       └─────────────────────────────────────────────────────────    │ │
│  │         Day 1                          Day 15                 Day 30 │ │
│  │         ▬ Oil (BOPD)   ▬ Gas/100 (MCFD)   ▬ Water (BWPD)           │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────┐   │
│  │     ARTIFICIAL LIFT (ESP)   │  │      WELL INTEGRITY             │   │
│  │                             │  │                                  │   │
│  │  Current:      45 A         │  │  Annulus A:    85 PSI  🟢       │   │
│  │  Frequency:    55 Hz        │  │  Annulus B:    45 PSI  🟢       │   │
│  │  Intake P:     850 PSI      │  │  Annulus C:    20 PSI  🟢       │   │
│  │  Motor Temp:   245 °F       │  │                                  │   │
│  │  Status:       🟢 RUNNING   │  │  Last Test:    15 days ago      │   │
│  └─────────────────────────────┘  └─────────────────────────────────┘   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Bubble Map de Campo

Visualización de producción por pozo en mapa geográfico:
- Tamaño del círculo: Proporcional a producción
- Color: Estado del pozo (verde=producing, amarillo=warning, rojo=alarm)
- Tooltip: Detalles del pozo

---

## 8. Recomendaciones

### 8.1 Stack Tecnológico

| Componente | Tecnología | Justificación |
|------------|------------|---------------|
| **Time-Series DB** | TimescaleDB | Telemetría de producción |
| **Analytics** | Python (NumPy, SciPy) | DCA, Nodal Analysis |
| **ML Models** | ONNX Runtime | Anomaly detection edge |
| **Visualization** | Apache ECharts | Decline curves, IPR/VLP |
| **Maps** | OpenLayers | Bubble maps de campo |

### 8.2 Priorización de Features

| Fase | Features |
|------|----------|
| **MVP** | Well inventory, real-time production monitoring, basic alarms |
| **V1.1** | Decline Curve Analysis, production reports |
| **V1.2** | ESP monitoring, basic optimization |
| **V2.0** | Nodal Analysis, all artificial lift, well integrity |

---

## 9. Referencias

### Documentación Técnica
- API RP 90-1: Annular Casing Pressure Management
- SPE Petroleum Engineering Handbook
- Arps, J.J. (1945): "Analysis of Decline Curves"

### Software de Referencia
- PROSPER (Petroleum Experts): Nodal Analysis
- OFM (Schlumberger): Production Analysis
- WellView (Peloton): Production Surveillance
- PHDWin: Decline Curve Analysis

### Librerías Open Source
- [PySAL](https://pysal.org/): Spatial analysis
- [Whitson Manual](https://manual.whitson.com/): Well performance
- [PengTools](https://wiki.pengtools.com/): Petroleum engineering tools

---

## 10. Optimización Integral de Pozos

### 10.1 Selección de Sistema de Levantamiento Artificial

```sql
CREATE TABLE artificial_lift_selection (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_id UUID NOT NULL REFERENCES wells(id),
    
    analysis_date DATE NOT NULL,
    analyst VARCHAR(100),
    
    -- Datos del pozo
    depth_ft DECIMAL(10, 2),
    deviation_deg DECIMAL(6, 2),
    casing_id_inches DECIMAL(6, 3),
    tubing_id_inches DECIMAL(6, 3),
    
    -- Condiciones de fluido
    oil_rate_target_bopd DECIMAL(10, 2),
    water_cut_pct DECIMAL(5, 2),
    gor_scf_bbl DECIMAL(10, 2),
    oil_viscosity_cp DECIMAL(10, 2),
    sand_production BOOLEAN,
    
    -- Presiones
    reservoir_pressure_psi DECIMAL(10, 2),
    bubble_point_psi DECIMAL(10, 2),
    
    -- Scoring por sistema
    esp_score DECIMAL(5, 2),
    gas_lift_score DECIMAL(5, 2),
    rod_pump_score DECIMAL(5, 2),
    pcp_score DECIMAL(5, 2),
    plunger_score DECIMAL(5, 2),
    
    -- Recomendación
    recommended_system VARCHAR(20),
    justification TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 10.2 Optimización de ESP

```python
class ESPOptimizer:
    """Optimize ESP operating parameters"""
    
    def __init__(self, pump_curves: dict, motor_specs: dict):
        self.pump_curves = pump_curves
        self.motor_specs = motor_specs
    
    def optimize_frequency(
        self,
        current_freq: float,
        current_rate: float,
        target_rate: float,
        constraints: dict
    ) -> dict:
        """
        Find optimal frequency to achieve target rate
        
        Args:
            current_freq: Current VSD frequency (Hz)
            current_rate: Current production (BOPD)
            target_rate: Target production (BOPD)
            constraints: {min_freq, max_freq, max_current, min_pip}
        
        Returns:
            Optimized operating parameters
        """
        # Affinity laws
        freq_ratio = (target_rate / current_rate) if current_rate > 0 else 1
        new_freq = current_freq * freq_ratio
        
        # Apply constraints
        new_freq = max(constraints['min_freq'], 
                      min(constraints['max_freq'], new_freq))
        
        # Estimate new power (affinity: P ∝ N³)
        power_ratio = (new_freq / current_freq) ** 3
        
        return {
            'recommended_frequency_hz': new_freq,
            'expected_rate_bopd': target_rate * (new_freq / (current_freq * freq_ratio)),
            'power_change_pct': (power_ratio - 1) * 100,
            'within_constraints': True
        }
    
    def calculate_efficiency(
        self,
        flow_rate: float,
        head: float,
        power_input: float
    ) -> float:
        """Calculate overall pump efficiency"""
        hydraulic_power = flow_rate * head * 0.000017  # HP
        efficiency = (hydraulic_power / power_input) * 100 if power_input > 0 else 0
        return efficiency
```

### 10.3 Diseño de Gas Lift

```python
def design_gas_lift_string(
    well_data: dict,
    unloading_gradient: float = 0.015,
    operating_valve_depth_pct: float = 0.95
) -> list:
    """
    Design gas lift valve string
    
    Args:
        well_data: {depth, casing_p, tubing_p, kill_fluid_grad}
        unloading_gradient: psi/ft for unloading
        operating_valve_depth_pct: Fraction of depth for operating valve
    
    Returns:
        List of valve depths and settings
    """
    depth = well_data['depth']
    surface_inj_p = well_data['casing_p']
    tubing_p = well_data['tubing_p']
    kill_grad = well_data['kill_fluid_grad']
    
    valves = []
    current_depth = 0
    valve_num = 1
    
    while current_depth < depth * operating_valve_depth_pct:
        # Available pressure at depth
        casing_p_at_depth = surface_inj_p + current_depth * 0.05  # Gas gradient
        tubing_p_at_depth = tubing_p + current_depth * kill_grad
        
        # Next valve depth where injection pressure meets tubing
        delta_p = casing_p_at_depth - tubing_p_at_depth - 50  # 50 psi margin
        next_depth = current_depth + delta_p / (kill_grad - unloading_gradient)
        
        if next_depth <= current_depth:
            break
            
        current_depth = min(next_depth, depth * operating_valve_depth_pct)
        
        valves.append({
            'valve_number': valve_num,
            'depth_ft': round(current_depth, 0),
            'opening_pressure_psi': round(casing_p_at_depth - 50, 0),
            'valve_type': 'IPO' if valve_num < 5 else 'ORIFICE'
        })
        
        valve_num += 1
        
        if valve_num > 10:  # Safety limit
            break
    
    return valves
```

### 10.4 Análisis de Rentabilidad de Intervenciones

```sql
CREATE TABLE intervention_economics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_id UUID NOT NULL REFERENCES wells(id),
    
    intervention_type VARCHAR(50), -- WORKOVER, STIMULATION, AL_CHANGE, RECOMPLETION
    proposal_date DATE,
    
    -- Costos
    intervention_cost_usd DECIMAL(12, 2),
    equipment_cost_usd DECIMAL(12, 2),
    operating_cost_change_usd_month DECIMAL(12, 2),
    
    -- Producción
    current_oil_bopd DECIMAL(10, 2),
    expected_oil_bopd DECIMAL(10, 2),
    incremental_oil_bopd DECIMAL(10, 2),
    decline_rate_pct_year DECIMAL(6, 2),
    
    -- Precios
    oil_price_usd_bbl DECIMAL(8, 2),
    
    -- Resultados económicos
    payout_months DECIMAL(6, 2),
    npv_usd DECIMAL(15, 2),
    irr_pct DECIMAL(6, 2),
    
    -- Aprobación
    status VARCHAR(20) DEFAULT 'PROPOSED',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Función para calcular economía de intervención
CREATE OR REPLACE FUNCTION calculate_intervention_economics(
    p_intervention_cost DECIMAL,
    p_incremental_oil DECIMAL,
    p_oil_price DECIMAL,
    p_decline_rate DECIMAL,
    p_months INTEGER DEFAULT 36
) RETURNS TABLE (
    payout_months DECIMAL,
    npv DECIMAL,
    cumulative_oil DECIMAL
) AS $$
DECLARE
    v_monthly_revenue DECIMAL;
    v_cumulative_cash DECIMAL := -p_intervention_cost;
    v_cumulative_oil DECIMAL := 0;
    v_current_oil DECIMAL := p_incremental_oil;
    v_monthly_decline DECIMAL := p_decline_rate / 12 / 100;
    v_payout DECIMAL := NULL;
    v_discount_rate DECIMAL := 0.10 / 12;  -- 10% annual
    v_npv DECIMAL := -p_intervention_cost;
BEGIN
    FOR i IN 1..p_months LOOP
        v_monthly_revenue := v_current_oil * 30 * p_oil_price;
        v_cumulative_cash := v_cumulative_cash + v_monthly_revenue;
        v_cumulative_oil := v_cumulative_oil + v_current_oil * 30;
        
        -- NPV
        v_npv := v_npv + v_monthly_revenue / power(1 + v_discount_rate, i);
        
        -- Payout
        IF v_payout IS NULL AND v_cumulative_cash >= 0 THEN
            v_payout := i;
        END IF;
        
        -- Apply decline
        v_current_oil := v_current_oil * (1 - v_monthly_decline);
    END LOOP;
    
    RETURN QUERY SELECT v_payout, v_npv, v_cumulative_oil;
END;
$$ LANGUAGE plpgsql;
```

### 10.5 Tipos de Pozos en Venezuela

| Tipo | Características | Sistemas Típicos | Desafíos |
|------|-----------------|------------------|----------|
| **Faja del Orinoco** | Crudo extrapesado (8-12°API), alta viscosidad | Diluente, PCP, Bombas de cavidad | Arena, corrosión, viscosidad |
| **Lago de Maracaibo** | Crudo mediano-liviano, alta agua | ESP, Gas Lift | Corrosión, H2S, agua |
| **Oriente Liviano** | Crudo liviano (25-35°API) | Gas Lift, Flujo natural | Declinación, agua |
| **Costa Afuera** | Offshore, alta inversión | ESP, Gas Lift | Acceso, costos |
| **Gas Condensado** | Alto GOR, condensado | Plunger, Flujo natural | Liquid loading |

### 10.6 KPIs de Optimización

| KPI | Fórmula | Meta Típica |
|-----|---------|-------------|
| **Uptime** | Tiempo produciendo / Tiempo total | >95% |
| **Eficiencia ESP** | Hydraulic HP / Input HP | >50% |
| **Llenado Bomba** | Producción real / Capacidad | >85% |
| **GLR Inyección** | Gas inyectado / Líquido | Óptimo variable |
| **Costo por bbl** | Opex mensual / Producción | <$10/bbl |
