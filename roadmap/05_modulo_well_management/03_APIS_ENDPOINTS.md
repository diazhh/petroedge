# WELL MANAGEMENT - APIS Y ENDPOINTS

## 1. Estructura Base

### 1.1 URL Base
```
/api/v1/production
```

### 1.2 Autenticación
Todas las rutas requieren JWT Bearer Token:
```
Authorization: Bearer <token>
```

---

## 2. Endpoints de Pozos

### 2.1 Listar Pozos

```
GET /api/v1/production/wells
```

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `field_id` | UUID | Filtrar por campo |
| `status` | string | ACTIVE, SHUT_IN, SUSPENDED |
| `lift_type` | string | ESP, GAS_LIFT, ROD_PUMP, PCP |
| `page` | int | Página |
| `per_page` | int | Items por página |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "well_name": "PDC-015",
      "well_code": "PDC-015",
      "field_name": "Campo Norte",
      "well_status": "ACTIVE",
      "lift_type": "ESP",
      "current_production": {
        "oil_rate_bopd": 450.5,
        "water_rate_bwpd": 125.0,
        "gas_rate_mscfd": 280.5,
        "water_cut_percent": 21.7
      },
      "active_alarms": 0
    }
  ],
  "meta": { "total": 85, "page": 1, "per_page": 20 }
}
```

### 2.2 Obtener Pozo por ID

```
GET /api/v1/production/wells/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "well_name": "PDC-015",
    "well_code": "PDC-015",
    "api_number": "42-123-45678",
    "field": {
      "id": "uuid",
      "field_name": "Campo Norte"
    },
    "well_status": "ACTIVE",
    "well_type": "PRODUCER",
    "lift_type": "ESP",
    "surface_latitude": 10.123456,
    "surface_longitude": -67.654321,
    "total_depth_md_ft": 9500,
    "total_depth_tvd_ft": 8800,
    "completion_date": "2024-06-15",
    "first_production_date": "2024-07-01",
    "completion": {
      "tubing_od_inches": 3.5,
      "tubing_depth_md_ft": 8500,
      "perf_top_md_ft": 8200,
      "perf_bottom_md_ft": 8400
    },
    "current_production": {
      "timestamp": "2026-01-08T14:00:00Z",
      "oil_rate_bopd": 450.5,
      "water_rate_bwpd": 125.0,
      "gas_rate_mscfd": 280.5,
      "water_cut_percent": 21.7,
      "gor_scf_stb": 623,
      "tubing_pressure_psi": 350,
      "casing_pressure_psi": 380
    },
    "cumulative_production": {
      "as_of_date": "2026-01-07",
      "cum_oil_mbbl": 285.5,
      "cum_water_mbbl": 78.2,
      "cum_gas_mmscf": 175.3
    }
  }
}
```

### 2.3 Obtener Historial de Producción

```
GET /api/v1/production/wells/{id}/history
```

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `from_date` | date | Fecha desde |
| `to_date` | date | Fecha hasta |
| `interval` | string | hourly, daily, monthly |
| `parameters` | string[] | Parámetros a incluir |

**Response:**
```json
{
  "success": true,
  "data": {
    "well_id": "uuid",
    "interval": "daily",
    "records": [
      {
        "date": "2026-01-07",
        "oil_rate_bopd": 448.2,
        "water_rate_bwpd": 122.5,
        "gas_rate_mscfd": 278.0,
        "water_cut_percent": 21.5,
        "hours_on": 24
      },
      {
        "date": "2026-01-06",
        "oil_rate_bopd": 452.8,
        "water_rate_bwpd": 128.0,
        "gas_rate_mscfd": 282.5,
        "water_cut_percent": 22.0,
        "hours_on": 24
      }
    ]
  }
}
```

### 2.4 Registrar Producción Manual

```
POST /api/v1/production/wells/{id}/production
```

**Request Body:**
```json
{
  "production_date": "2026-01-08",
  "oil_rate_bopd": 450.0,
  "water_rate_bwpd": 125.0,
  "gas_rate_mscfd": 280.0,
  "tubing_pressure_psi": 350,
  "casing_pressure_psi": 380,
  "choke_size_64ths": 32,
  "hours_on": 24,
  "data_source": "MANUAL",
  "notes": "Medición de separador de prueba"
}
```

---

## 3. Endpoints de ESP

### 3.1 Obtener Configuración ESP

```
GET /api/v1/production/wells/{id}/esp/configuration
```

**Response:**
```json
{
  "success": true,
  "data": {
    "well_id": "uuid",
    "installation_date": "2024-06-15",
    "run_number": 1,
    "pump": {
      "manufacturer": "Baker Hughes",
      "model": "Centrilift P100",
      "stages": 180,
      "series": "538",
      "design_rate_bpd": 600,
      "design_head_ft": 6500
    },
    "motor": {
      "manufacturer": "Baker Hughes",
      "hp": 120,
      "voltage": 2300,
      "amperage": 35
    },
    "cable": {
      "size_awg": 4,
      "length_ft": 8500
    },
    "setting_depth_md_ft": 7500,
    "vsd": {
      "manufacturer": "ABB",
      "model": "ACS880",
      "frequency_range_hz": "30-70"
    },
    "status": "ACTIVE",
    "days_running": 572
  }
}
```

### 3.2 Obtener Datos ESP en Tiempo Real

```
GET /api/v1/production/wells/{id}/esp/realtime
```

**Response:**
```json
{
  "success": true,
  "data": {
    "well_id": "uuid",
    "timestamp": "2026-01-08T14:35:00Z",
    "frequency_hz": 55.0,
    "motor_current_amps": 28.5,
    "motor_voltage_v": 2280,
    "intake_pressure_psi": 850,
    "discharge_pressure_psi": 3200,
    "motor_temp_f": 245,
    "intake_temp_f": 180,
    "vibration_x": 0.12,
    "vibration_y": 0.15,
    "power_kw": 85.5,
    "pump_efficiency_percent": 72.5,
    "operating_point": {
      "rate_bpd": 575,
      "head_ft": 6200
    }
  }
}
```

### 3.3 Optimizar Frecuencia ESP

```
POST /api/v1/production/wells/{id}/esp/optimize
```

**Request Body:**
```json
{
  "target": "MAX_PRODUCTION",
  "constraints": {
    "min_intake_pressure_psi": 500,
    "max_motor_temp_f": 280,
    "max_current_percent": 95
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "current_frequency_hz": 55.0,
    "recommended_frequency_hz": 58.0,
    "expected_production_increase_bopd": 35.0,
    "expected_power_increase_kw": 8.5,
    "constraints_satisfied": true,
    "analysis": {
      "current_operating_point": {...},
      "recommended_operating_point": {...},
      "pump_curve_data": [...]
    }
  }
}
```

### 3.4 Aplicar Cambio de Frecuencia

```
POST /api/v1/production/wells/{id}/esp/set-frequency
```

**Request Body:**
```json
{
  "target_frequency_hz": 58.0,
  "ramp_rate_hz_per_min": 0.5,
  "reason": "Optimización recomendada por sistema"
}
```

---

## 4. Endpoints de Gas Lift

### 4.1 Obtener Configuración Gas Lift

```
GET /api/v1/production/wells/{id}/gas-lift/configuration
```

### 4.2 Obtener Datos Gas Lift en Tiempo Real

```
GET /api/v1/production/wells/{id}/gas-lift/realtime
```

**Response:**
```json
{
  "success": true,
  "data": {
    "well_id": "uuid",
    "timestamp": "2026-01-08T14:35:00Z",
    "injection_rate_mscfd": 450.0,
    "injection_pressure_psi": 1200,
    "tubing_pressure_psi": 280,
    "casing_pressure_psi": 850,
    "production_rate_bopd": 320.0,
    "glr_total_scf_bbl": 1850,
    "gl_efficiency_percent": 85.0,
    "operating_valve_depth_ft": 6500
  }
}
```

### 4.3 Optimizar Tasa de Inyección

```
POST /api/v1/production/wells/{id}/gas-lift/optimize
```

**Request Body:**
```json
{
  "optimization_method": "INCREMENTAL_TEST",
  "gas_availability_mscfd": 600,
  "economic_gas_cost_usd_mscf": 2.50
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "current_injection_mscfd": 450,
    "optimal_injection_mscfd": 520,
    "expected_oil_increase_bopd": 25,
    "incremental_gor_scf_bbl": 2080,
    "economic_limit_mscfd": 580,
    "gl_performance_curve": [
      {"injection_mscfd": 300, "oil_bopd": 280},
      {"injection_mscfd": 400, "oil_bopd": 305},
      {"injection_mscfd": 450, "oil_bopd": 320},
      {"injection_mscfd": 520, "oil_bopd": 345},
      {"injection_mscfd": 600, "oil_bopd": 355}
    ]
  }
}
```

---

## 5. Endpoints de Rod Pump

### 5.1 Obtener Configuración Rod Pump

```
GET /api/v1/production/wells/{id}/rod-pump/configuration
```

### 5.2 Obtener Carta Dinamométrica

```
GET /api/v1/production/wells/{id}/rod-pump/dynacards
```

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `from_date` | datetime | Desde |
| `to_date` | datetime | Hasta |
| `card_type` | string | SURFACE, DOWNHOLE |
| `limit` | int | Número de cartas |

**Response:**
```json
{
  "success": true,
  "data": {
    "well_id": "uuid",
    "cards": [
      {
        "id": "uuid",
        "card_time": "2026-01-08T14:00:00Z",
        "card_type": "SURFACE",
        "stroke_length_inches": 144,
        "spm": 8.5,
        "peak_load_lbs": 12500,
        "min_load_lbs": 4200,
        "pump_fillage_percent": 85.0,
        "diagnosis": "NORMAL",
        "estimated_production_bpd": 120.0,
        "card_data": [
          {"position": 0, "load": 4200},
          {"position": 12, "load": 8500},
          {"position": 24, "load": 12500}
        ]
      }
    ]
  }
}
```

### 5.3 Analizar Carta Dinamométrica

```
POST /api/v1/production/wells/{id}/rod-pump/analyze-card
```

**Request Body:**
```json
{
  "card_data": [
    {"position": 0, "load": 4200},
    {"position": 12, "load": 8500}
  ],
  "stroke_length_inches": 144,
  "spm": 8.5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "diagnosis": "GAS_INTERFERENCE",
    "confidence_percent": 87.5,
    "pump_fillage_percent": 72.0,
    "theoretical_displacement_bpd": 145.0,
    "estimated_production_bpd": 104.0,
    "recommendations": [
      "Consider installing gas separator",
      "Reduce SPM to allow better pump fillage"
    ],
    "comparison_cards": {
      "ideal_card": [...],
      "actual_card": [...]
    }
  }
}
```

---

## 6. Endpoints de Decline Curve Analysis

### 6.1 Calcular DCA

```
POST /api/v1/production/wells/{id}/dca/calculate
```

**Request Body:**
```json
{
  "from_date": "2024-07-01",
  "to_date": "2026-01-07",
  "decline_type": "AUTO",
  "forecast_months": 60
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "well_id": "uuid",
    "analysis_date": "2026-01-08",
    "best_fit": {
      "decline_type": "HYPERBOLIC",
      "initial_rate_bopd": 650.0,
      "initial_decline_rate": 0.35,
      "b_factor": 0.8,
      "effective_date": "2024-07-01",
      "r_squared": 0.945
    },
    "reserves": {
      "eur_mbbl": 485.5,
      "remaining_reserves_mbbl": 245.2,
      "cumulative_production_mbbl": 240.3
    },
    "forecast": [
      {"date": "2026-02", "rate_bopd": 442, "cum_mbbl": 253.5},
      {"date": "2026-03", "rate_bopd": 435, "cum_mbbl": 266.5}
    ]
  }
}
```

### 6.2 Guardar Análisis DCA

```
POST /api/v1/production/wells/{id}/dca/save
```

### 6.3 Obtener Análisis DCA Históricos

```
GET /api/v1/production/wells/{id}/dca/analyses
```

---

## 7. Endpoints de Alarmas

### 7.1 Listar Alarmas Activas

```
GET /api/v1/production/alarms
```

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `well_id` | UUID | Filtrar por pozo |
| `severity` | string | INFO, WARNING, CRITICAL |
| `acknowledged` | bool | Filtrar por reconocidas |
| `resolved` | bool | Filtrar por resueltas |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "well_id": "uuid",
      "well_name": "PDC-015",
      "alarm_time": "2026-01-08T14:30:00Z",
      "alarm_type": "HIGH_MOTOR_TEMP",
      "severity": "WARNING",
      "parameter_name": "motor_temp_f",
      "parameter_value": 265.0,
      "threshold_value": 260.0,
      "message": "Motor temperature exceeds warning threshold",
      "acknowledged": false
    }
  ]
}
```

### 7.2 Reconocer Alarma

```
POST /api/v1/production/alarms/{id}/acknowledge
```

### 7.3 Resolver Alarma

```
POST /api/v1/production/alarms/{id}/resolve
```

---

## 8. Endpoints de Downtime

### 8.1 Registrar Downtime

```
POST /api/v1/production/wells/{id}/downtime
```

**Request Body:**
```json
{
  "start_time": "2026-01-08T10:00:00Z",
  "end_time": "2026-01-08T14:00:00Z",
  "downtime_category": "UNSCHEDULED",
  "downtime_reason": "ESP failure - high vibration",
  "downtime_code": "ESP-VIB",
  "notes": "ESP shut down automatically due to high vibration alarm"
}
```

### 8.2 Listar Downtime

```
GET /api/v1/production/wells/{id}/downtime
```

### 8.3 Calcular Producción Diferida

```
GET /api/v1/production/wells/{id}/deferred-production
```

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `from_date` | date | Fecha desde |
| `to_date` | date | Fecha hasta |

---

## 9. Endpoints de Dashboard

### 9.1 Dashboard de Campo

```
GET /api/v1/production/dashboard/field/{field_id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "field_id": "uuid",
    "field_name": "Campo Norte",
    "summary": {
      "total_wells": 45,
      "active_wells": 38,
      "shut_in_wells": 5,
      "problem_wells": 2
    },
    "production": {
      "total_oil_bopd": 15250.0,
      "total_water_bwpd": 4500.0,
      "total_gas_mscfd": 9800.0,
      "avg_water_cut_percent": 22.8
    },
    "by_lift_type": {
      "ESP": { "count": 25, "oil_bopd": 11200 },
      "GAS_LIFT": { "count": 10, "oil_bopd": 3200 },
      "ROD_PUMP": { "count": 8, "oil_bopd": 850 }
    },
    "alerts": {
      "critical": 2,
      "warning": 8,
      "info": 15
    }
  }
}
```

### 9.2 Dashboard General

```
GET /api/v1/production/dashboard/overview
```

---

## 10. WebSocket para Tiempo Real

### 10.1 Conexión
```
WS /api/v1/production/ws
```

### 10.2 Suscripción a Pozos

```json
{
  "action": "subscribe",
  "wells": ["uuid1", "uuid2"],
  "parameters": ["oil_rate", "water_cut", "esp_frequency", "alarms"]
}
```

### 10.3 Datos en Tiempo Real

```json
{
  "event": "production_update",
  "well_id": "uuid",
  "timestamp": "2026-01-08T14:35:01Z",
  "data": {
    "oil_rate_bopd": 451.2,
    "water_rate_bwpd": 124.5,
    "gas_rate_mscfd": 281.0,
    "esp_frequency_hz": 55.0,
    "motor_current_amps": 28.6
  }
}
```

### 10.4 Alarmas en Tiempo Real

```json
{
  "event": "alarm",
  "well_id": "uuid",
  "alarm": {
    "id": "uuid",
    "type": "HIGH_VIBRATION",
    "severity": "WARNING",
    "message": "ESP vibration exceeds threshold",
    "value": 0.25,
    "threshold": 0.20
  }
}
```

