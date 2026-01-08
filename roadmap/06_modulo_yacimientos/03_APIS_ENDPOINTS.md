# YACIMIENTOS - APIS Y ENDPOINTS

## 1. Estructura Base

### 1.1 URL Base
```
/api/v1/reservoir
```

### 1.2 Autenticación
Todas las rutas requieren JWT Bearer Token:
```
Authorization: Bearer <token>
```

---

## 2. Endpoints de Jerarquía Geológica

### 2.1 Cuencas

```
GET /api/v1/reservoir/basins
GET /api/v1/reservoir/basins/{id}
POST /api/v1/reservoir/basins
PUT /api/v1/reservoir/basins/{id}
```

### 2.2 Listar Campos

```
GET /api/v1/reservoir/fields
```

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `basin_id` | UUID | Filtrar por cuenca |
| `status` | string | PRODUCING, DEVELOPING, ABANDONED |
| `operator` | string | Filtrar por operador |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "field_name": "Campo Norte",
      "field_code": "CN-001",
      "basin_name": "Cuenca Oriental",
      "operator": "PDVSA",
      "status": "PRODUCING",
      "total_wells": 85,
      "active_wells": 72,
      "total_reservoirs": 5,
      "total_ooip_mmstb": 450.5,
      "cumulative_oil_mmstb": 185.2
    }
  ]
}
```

### 2.3 Listar Yacimientos

```
GET /api/v1/reservoir/reservoirs
```

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `field_id` | UUID | Filtrar por campo |
| `fluid_type` | string | BLACK_OIL, VOLATILE_OIL, GAS |
| `drive_mechanism` | string | WATER_DRIVE, SOLUTION_GAS, etc. |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "reservoir_name": "Arena U1",
      "field_name": "Campo Norte",
      "formation_name": "Formación Oficina",
      "lithology": "SANDSTONE",
      "fluid_type": "BLACK_OIL",
      "drive_mechanism": "WATER_DRIVE",
      "avg_porosity": 0.22,
      "avg_permeability_md": 450.0,
      "ooip_mmstb": 125.5,
      "initial_pressure_psi": 3200,
      "current_pressure_psi": 2850,
      "pressure_depletion_pct": 10.9
    }
  ]
}
```

### 2.4 Obtener Yacimiento por ID

```
GET /api/v1/reservoir/reservoirs/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "reservoir_name": "Arena U1",
    "reservoir_code": "U1-CN",
    "field": {
      "id": "uuid",
      "field_name": "Campo Norte"
    },
    "formation_name": "Formación Oficina",
    "formation_age": "Mioceno",
    "lithology": "SANDSTONE",
    "petro_physical_properties": {
      "avg_porosity": 0.22,
      "avg_permeability_md": 450.0,
      "avg_water_saturation": 0.25,
      "net_to_gross": 0.75
    },
    "depths": {
      "top_depth_tvd_ft": 6500,
      "bottom_depth_tvd_ft": 6650,
      "avg_net_pay_ft": 112.5
    },
    "area_acres": 2500,
    "conditions": {
      "initial_pressure_psi": 3200,
      "current_pressure_psi": 2850,
      "reservoir_temperature_f": 185,
      "bubble_point_psi": 2100
    },
    "fluid_type": "BLACK_OIL",
    "drive_mechanism": "WATER_DRIVE",
    "contacts": {
      "owc_depth_tvd_ft": 6700,
      "goc_depth_tvd_ft": null
    },
    "volumetrics": {
      "ooip_mmstb": 125.5,
      "ogip_bcf": 78.2,
      "recovery_factor": 0.35
    },
    "cumulative_production": {
      "oil_mmstb": 42.5,
      "gas_bcf": 26.5,
      "water_mmbbl": 15.2
    }
  }
}
```

### 2.5 Crear/Actualizar Yacimiento

```
POST /api/v1/reservoir/reservoirs
PUT /api/v1/reservoir/reservoirs/{id}
```

---

## 3. Endpoints de PVT

### 3.1 Listar Muestras PVT

```
GET /api/v1/reservoir/reservoirs/{id}/pvt/samples
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "sample_number": "PVT-2024-001",
      "sample_date": "2024-05-15",
      "sample_type": "BOTTOMHOLE",
      "well_name": "PDC-015",
      "sample_depth_ft": 6550,
      "stock_tank_oil_api": 28.5,
      "bubble_point_psi": 2100,
      "bo_at_pb": 1.285,
      "quality_rating": "GOOD"
    }
  ]
}
```

### 3.2 Obtener Detalle de Muestra PVT

```
GET /api/v1/reservoir/pvt/samples/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "sample_number": "PVT-2024-001",
    "sample_date": "2024-05-15",
    "sample_type": "BOTTOMHOLE",
    "well": {
      "id": "uuid",
      "well_name": "PDC-015"
    },
    "sampling_conditions": {
      "depth_ft": 6550,
      "pressure_psi": 2900,
      "temperature_f": 185
    },
    "surface_properties": {
      "stock_tank_oil_api": 28.5,
      "separator_gor_scf_stb": 650,
      "gas_gravity": 0.75
    },
    "reservoir_properties": {
      "bubble_point_psi": 2100,
      "bo_at_pb": 1.285,
      "rs_at_pb": 580,
      "oil_viscosity_at_pb_cp": 1.25,
      "oil_compressibility_1_psi": 0.0000125
    },
    "differential_liberation": [
      {"pressure_psi": 3200, "bo": 1.310, "rs": 620, "viscosity_cp": 1.15},
      {"pressure_psi": 2800, "bo": 1.295, "rs": 600, "viscosity_cp": 1.20},
      {"pressure_psi": 2400, "bo": 1.280, "rs": 575, "viscosity_cp": 1.28}
    ],
    "laboratory": "Core Laboratories",
    "report_number": "CL-2024-0125",
    "quality_rating": "GOOD"
  }
}
```

### 3.3 Calcular PVT con Correlaciones

```
POST /api/v1/reservoir/pvt/calculate
```

**Request Body:**
```json
{
  "reservoir_id": "uuid",
  "properties_to_calculate": ["BUBBLE_POINT", "BO", "RS", "VISCOSITY"],
  "input_parameters": {
    "api": 28.5,
    "gas_gravity": 0.75,
    "temperature_f": 185,
    "separator_pressure_psi": 100,
    "solution_gor_scf_stb": 650
  },
  "correlations": {
    "bubble_point": "AUTO",
    "bo": "VASQUEZ_BEGGS",
    "viscosity": "BEGGS_ROBINSON"
  },
  "pressure_range": {
    "min_psi": 500,
    "max_psi": 3500,
    "step_psi": 100
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bubble_point": {
      "value_psi": 2085,
      "correlation_used": "STANDING",
      "lab_value_psi": 2100,
      "deviation_percent": -0.7
    },
    "pvt_table": [
      {
        "pressure_psi": 3500,
        "bo": 1.285,
        "rs": 580,
        "viscosity_cp": 1.25,
        "z_factor": null,
        "bg": null
      },
      {
        "pressure_psi": 3000,
        "bo": 1.292,
        "rs": 595,
        "viscosity_cp": 1.22,
        "z_factor": null,
        "bg": null
      }
    ],
    "correlations_used": {
      "bubble_point": "STANDING",
      "bo_above_pb": "VASQUEZ_BEGGS",
      "bo_below_pb": "VASQUEZ_BEGGS",
      "viscosity_dead_oil": "BEGGS_ROBINSON",
      "viscosity_live_oil": "BEGGS_ROBINSON"
    }
  }
}
```

### 3.4 Comparar Correlaciones PVT

```
POST /api/v1/reservoir/pvt/compare-correlations
```

**Request Body:**
```json
{
  "pvt_sample_id": "uuid",
  "property": "BUBBLE_POINT",
  "correlations": ["STANDING", "VASQUEZ_BEGGS", "GLASO", "PETROSKY_FARSHAD"]
}
```

---

## 4. Endpoints de Balance de Materiales

### 4.1 Listar Análisis de Balance

```
GET /api/v1/reservoir/reservoirs/{id}/material-balance
```

### 4.2 Crear Análisis de Balance de Materiales

```
POST /api/v1/reservoir/material-balance/analyze
```

**Request Body:**
```json
{
  "reservoir_id": "uuid",
  "analysis_name": "MBal Analysis 2026",
  "analysis_type": "HAVLENA_ODEH",
  "pvt_sample_id": "uuid",
  "initial_pressure_psi": 3200,
  "bubble_point_psi": 2100,
  "temperature_f": 185,
  "aquifer_model": "FETKOVICH",
  "aquifer_parameters": {
    "aquifer_radius_ft": 25000,
    "aquifer_permeability_md": 100,
    "aquifer_porosity": 0.20,
    "encroachment_angle_deg": 180
  },
  "production_pressure_data": [
    {"date": "2024-07-01", "cum_oil_mstb": 0, "cum_gas_mmscf": 0, "cum_water_mstb": 0, "pressure_psi": 3200},
    {"date": "2024-10-01", "cum_oil_mstb": 850, "cum_gas_mmscf": 520, "cum_water_mstb": 125, "pressure_psi": 3150},
    {"date": "2025-01-01", "cum_oil_mstb": 2500, "cum_gas_mmscf": 1580, "cum_water_mstb": 420, "pressure_psi": 3050}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis_id": "uuid",
    "calculated_ooip_mmstb": 128.5,
    "volumetric_ooip_mmstb": 125.5,
    "difference_percent": 2.4,
    "m_ratio": 0.0,
    "aquifer_contribution": {
      "cumulative_water_influx_mmbbl": 8.5,
      "aquifer_constant": 125.5
    },
    "drive_indices": {
      "solution_gas_drive": 0.45,
      "water_drive": 0.52,
      "gas_cap_drive": 0.0,
      "compaction_drive": 0.03
    },
    "havlena_odeh_plot": {
      "f_values": [...],
      "et_values": [...],
      "slope": 128500,
      "intercept": 0,
      "r_squared": 0.985
    }
  }
}
```

### 4.3 Registrar Presión de Yacimiento

```
POST /api/v1/reservoir/reservoirs/{id}/pressure
```

**Request Body:**
```json
{
  "measurement_date": "2026-01-08",
  "average_pressure_psi": 2820,
  "pressure_source": "BUILDUP",
  "wells_used": ["PDC-015", "PDC-018"],
  "notes": "Promedio de 2 buildup tests"
}
```

---

## 5. Endpoints de Reservas

### 5.1 Listar Estimaciones de Reservas

```
GET /api/v1/reservoir/reservoirs/{id}/reserves
```

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `category` | string | PROVED, PROBABLE, POSSIBLE |
| `status` | string | DRAFT, APPROVED |
| `as_of_date` | date | Fecha efectiva |

### 5.2 Crear Estimación de Reservas

```
POST /api/v1/reservoir/reserves
```

**Request Body:**
```json
{
  "reservoir_id": "uuid",
  "estimate_name": "Year-End 2025 Reserves",
  "effective_date": "2025-12-31",
  "reserves_category": "PROVED",
  "reserves_subcategory": "PDP",
  "estimation_method": "DECLINE_CURVE",
  "oil_reserves_mstb": 42500,
  "oil_reserves_low_mstb": 38000,
  "oil_reserves_best_mstb": 42500,
  "oil_reserves_high_mstb": 48000,
  "gas_reserves_mmscf": 26500,
  "evaluator": "Juan Pérez",
  "evaluator_company": "Internal"
}
```

### 5.3 Calcular Volumétrico

```
POST /api/v1/reservoir/volumetric/calculate
```

**Request Body:**
```json
{
  "reservoir_id": "uuid",
  "parameters": {
    "area_acres": 2500,
    "thickness_ft": 112.5,
    "porosity": 0.22,
    "water_saturation": 0.25,
    "net_to_gross": 0.75,
    "oil_fvf": 1.285,
    "recovery_factor": 0.35
  },
  "run_monte_carlo": true,
  "monte_carlo_iterations": 10000,
  "uncertainty": {
    "porosity": {"distribution": "TRIANGULAR", "min": 0.18, "mode": 0.22, "max": 0.26},
    "thickness_ft": {"distribution": "NORMAL", "mean": 112.5, "std": 15},
    "water_saturation": {"distribution": "TRIANGULAR", "min": 0.20, "mode": 0.25, "max": 0.32}
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deterministic": {
      "ooip_mstb": 125500,
      "recoverable_oil_mstb": 43925
    },
    "probabilistic": {
      "p90_mstb": 95200,
      "p50_mstb": 125800,
      "p10_mstb": 162500,
      "mean_mstb": 128500
    },
    "histogram_data": [...],
    "tornado_chart": {
      "porosity": {"low": -18500, "high": 22000},
      "thickness": {"low": -15200, "high": 15800},
      "water_saturation": {"low": -12500, "high": 8500}
    }
  }
}
```

---

## 6. Endpoints de Decline Curve Analysis

### 6.1 Calcular DCA de Yacimiento

```
POST /api/v1/reservoir/reservoirs/{id}/dca/calculate
```

**Request Body:**
```json
{
  "from_date": "2024-07-01",
  "to_date": "2026-01-07",
  "decline_type": "AUTO",
  "forecast_end_date": "2035-12-31",
  "economic_limit_bopd": 50
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "best_fit": {
      "decline_type": "HYPERBOLIC",
      "initial_rate_bopd": 15200,
      "initial_decline_rate": 0.28,
      "b_factor": 0.65,
      "effective_date": "2024-07-01",
      "r_squared": 0.962
    },
    "reserves": {
      "eur_mmstb": 48.5,
      "remaining_reserves_mmstb": 28.2,
      "cumulative_mmstb": 20.3
    },
    "forecast": [
      {"date": "2026-02", "rate_bopd": 12850, "cum_mmstb": 21.2},
      {"date": "2026-03", "rate_bopd": 12650, "cum_mmstb": 22.1}
    ],
    "abandonment_date": "2033-08"
  }
}
```

---

## 7. Endpoints de Historial de Producción

### 7.1 Obtener Historial de Producción por Yacimiento

```
GET /api/v1/reservoir/reservoirs/{id}/production-history
```

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `from_date` | date | Fecha desde |
| `to_date` | date | Fecha hasta |
| `interval` | string | daily, monthly, yearly |

**Response:**
```json
{
  "success": true,
  "data": {
    "reservoir_id": "uuid",
    "interval": "monthly",
    "records": [
      {
        "period": "2025-12",
        "oil_bopd": 12500,
        "water_bwpd": 3800,
        "gas_mscfd": 7800,
        "water_cut_percent": 23.3,
        "gor_scf_stb": 624,
        "active_wells": 35,
        "cum_oil_mmstb": 18.5,
        "cum_water_mmbbl": 5.2,
        "cum_gas_bcf": 11.5
      }
    ]
  }
}
```

---

## 8. WebSocket para Actualizaciones

### 8.1 Conexión
```
WS /api/v1/reservoir/ws
```

### 8.2 Suscripción a Yacimiento

```json
{
  "action": "subscribe",
  "reservoir_ids": ["uuid1", "uuid2"],
  "updates": ["production", "pressure", "alarms"]
}
```

### 8.3 Actualización de Producción

```json
{
  "event": "production_update",
  "reservoir_id": "uuid",
  "timestamp": "2026-01-08T14:00:00Z",
  "data": {
    "total_oil_bopd": 12500,
    "total_water_bwpd": 3800,
    "total_gas_mscfd": 7800,
    "active_wells": 35
  }
}
```

---

## 9. Endpoints de Reportes

### 9.1 Reporte de Estado de Yacimiento

```
GET /api/v1/reservoir/reservoirs/{id}/report?format=pdf
```

### 9.2 Reporte de Reservas

```
GET /api/v1/reservoir/reports/reserves
```

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `field_id` | UUID | Filtrar por campo |
| `effective_date` | date | Fecha efectiva |
| `category` | string | PROVED, PROBABLE, POSSIBLE, ALL |
| `format` | string | pdf, xlsx |

### 9.3 Reporte de Balance de Materiales

```
GET /api/v1/reservoir/material-balance/{id}/report?format=pdf
```

