# DRILLING OPERATIONS - APIS Y ENDPOINTS

## 1. Estructura Base

### 1.1 URL Base
```
/api/v1/drilling
```

### 1.2 Autenticación
Todas las rutas requieren JWT Bearer Token:
```
Authorization: Bearer <token>
```

### 1.3 Respuestas Estándar

**Éxito:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 20
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El campo es requerido",
    "details": [...]
  }
}
```

---

## 2. Endpoints de Well Plans

### 2.1 Listar Planes de Pozo

```
GET /api/v1/drilling/well-plans
```

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `well_id` | UUID | Filtrar por pozo |
| `rig_id` | UUID | Filtrar por taladro |
| `status` | string | DRAFT, APPROVED, ACTIVE, COMPLETED |
| `well_type` | string | VERTICAL, DIRECTIONAL, HORIZONTAL, ERD |
| `page` | int | Página (default 1) |
| `per_page` | int | Items por página (default 20) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "plan_name": "PDC-150 Development Well",
      "plan_version": 2,
      "well_id": "uuid",
      "well_name": "PDC-150",
      "rig_id": "uuid",
      "rig_name": "RIG-05",
      "well_type": "HORIZONTAL",
      "well_purpose": "DEVELOPMENT",
      "planned_td_md_ft": 12500.0,
      "planned_td_tvd_ft": 8500.0,
      "status": "APPROVED",
      "spud_date": "2026-02-01",
      "created_at": "2026-01-08T10:00:00Z"
    }
  ],
  "meta": { "total": 45, "page": 1, "per_page": 20 }
}
```

### 2.2 Obtener Plan de Pozo

```
GET /api/v1/drilling/well-plans/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "plan_name": "PDC-150 Development Well",
    "plan_version": 2,
    "well": {
      "id": "uuid",
      "well_name": "PDC-150",
      "well_code": "PDC-150",
      "field": "Campo Norte"
    },
    "rig": {
      "id": "uuid",
      "name": "RIG-05",
      "contractor": "Nabors"
    },
    "well_type": "HORIZONTAL",
    "well_purpose": "DEVELOPMENT",
    "planned_td_md_ft": 12500.0,
    "planned_td_tvd_ft": 8500.0,
    "planned_lateral_length_ft": 4000.0,
    "status": "APPROVED",
    "spud_date": "2026-02-01",
    "estimated_days": 28,
    "estimated_cost_usd": 4500000,
    "trajectory": { ... },
    "casing_program": [ ... ],
    "mud_program": [ ... ],
    "created_at": "2026-01-08T10:00:00Z"
  }
}
```

### 2.3 Crear Plan de Pozo

```
POST /api/v1/drilling/well-plans
```

**Request Body:**
```json
{
  "well_id": "uuid",
  "rig_id": "uuid",
  "plan_name": "PDC-150 Development Well",
  "well_type": "HORIZONTAL",
  "well_purpose": "DEVELOPMENT",
  "planned_td_md_ft": 12500.0,
  "planned_td_tvd_ft": 8500.0,
  "planned_lateral_length_ft": 4000.0,
  "spud_date": "2026-02-01",
  "estimated_days": 28,
  "estimated_cost_usd": 4500000
}
```

### 2.4 Actualizar Plan de Pozo

```
PUT /api/v1/drilling/well-plans/{id}
```

### 2.5 Aprobar Plan de Pozo

```
POST /api/v1/drilling/well-plans/{id}/approve
```

**Request Body:**
```json
{
  "approval_notes": "Aprobado por Gerencia de Perforación"
}
```

---

## 3. Endpoints de Trayectoria

### 3.1 Obtener Trayectoria Planificada

```
GET /api/v1/drilling/well-plans/{id}/trajectory
```

**Response:**
```json
{
  "success": true,
  "data": {
    "well_plan_id": "uuid",
    "trajectory_type": "HORIZONTAL",
    "kop_md_ft": 2500.0,
    "kop_tvd_ft": 2500.0,
    "build_rate_deg_100ft": 3.0,
    "landing_point_md_ft": 8500.0,
    "landing_point_tvd_ft": 8500.0,
    "landing_inclination_deg": 90.0,
    "target_azimuth_deg": 45.0,
    "survey_plan": [
      {"md_ft": 0, "inc_deg": 0, "azi_deg": 0, "tvd_ft": 0, "ns_ft": 0, "ew_ft": 0, "dls_deg_100ft": 0},
      {"md_ft": 500, "inc_deg": 0, "azi_deg": 0, "tvd_ft": 500, "ns_ft": 0, "ew_ft": 0, "dls_deg_100ft": 0},
      {"md_ft": 2500, "inc_deg": 0, "azi_deg": 0, "tvd_ft": 2500, "ns_ft": 0, "ew_ft": 0, "dls_deg_100ft": 0},
      {"md_ft": 3000, "inc_deg": 15, "azi_deg": 45, "tvd_ft": 2990, "ns_ft": 35, "ew_ft": 35, "dls_deg_100ft": 3.0}
    ]
  }
}
```

### 3.2 Calcular Trayectoria

```
POST /api/v1/drilling/trajectory/calculate
```

**Request Body:**
```json
{
  "trajectory_type": "HORIZONTAL",
  "surface_location": {
    "northing_ft": 0,
    "easting_ft": 0,
    "elevation_ft": 500
  },
  "target": {
    "northing_ft": 3500,
    "easting_ft": 3500,
    "tvd_ft": 8500
  },
  "kop_tvd_ft": 2500,
  "build_rate_deg_100ft": 3.0,
  "turn_rate_deg_100ft": 2.0,
  "max_dls_deg_100ft": 5.0,
  "method": "MINIMUM_CURVATURE"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "survey_plan": [...],
    "total_md_ft": 12500.0,
    "max_dls_deg_100ft": 3.2,
    "horizontal_displacement_ft": 4950.0,
    "azimuth_at_target_deg": 45.0
  }
}
```

### 3.3 Registrar Survey Real

```
POST /api/v1/drilling/wells/{well_id}/surveys
```

**Request Body:**
```json
{
  "md_ft": 5500.0,
  "inc_deg": 45.5,
  "azi_deg": 44.8,
  "survey_type": "MWD",
  "survey_time": "2026-02-10T14:30:00Z",
  "magnetic_dip_deg": 55.2,
  "magnetic_field_strength": 52000,
  "gravity_toolface_deg": 125.0,
  "notes": "Survey después de conexión"
}
```

---

## 4. Endpoints de Programa de Casing

### 4.1 Obtener Programa de Casing

```
GET /api/v1/drilling/well-plans/{id}/casing-program
```

**Response:**
```json
{
  "success": true,
  "data": {
    "well_plan_id": "uuid",
    "casing_strings": [
      {
        "id": "uuid",
        "string_type": "CONDUCTOR",
        "od_inches": 20.0,
        "weight_ppf": 94.0,
        "grade": "K-55",
        "connection": "BTC",
        "setting_depth_md_ft": 150.0,
        "setting_depth_tvd_ft": 150.0,
        "top_depth_ft": 0,
        "length_ft": 150.0,
        "burst_rating_psi": 2110,
        "collapse_rating_psi": 520,
        "tension_rating_klbs": 547,
        "cement_top_ft": 0,
        "cement_volume_bbls": 125
      },
      {
        "id": "uuid",
        "string_type": "SURFACE",
        "od_inches": 13.375,
        "weight_ppf": 68.0,
        "grade": "L-80",
        "connection": "BTC",
        "setting_depth_md_ft": 2000.0,
        "setting_depth_tvd_ft": 2000.0,
        "top_depth_ft": 0,
        "length_ft": 2000.0,
        "burst_rating_psi": 5020,
        "collapse_rating_psi": 2260,
        "tension_rating_klbs": 1069
      }
    ]
  }
}
```

### 4.2 Calcular Diseño de Casing

```
POST /api/v1/drilling/casing/design
```

**Request Body:**
```json
{
  "string_type": "PRODUCTION",
  "setting_depth_tvd_ft": 8500,
  "pore_pressure_ppg": 9.2,
  "fracture_gradient_ppg": 14.5,
  "mud_weight_ppg": 10.5,
  "design_factors": {
    "burst": 1.1,
    "collapse": 1.0,
    "tension": 1.8
  },
  "scenarios": ["TUBING_LEAK", "GAS_KICK", "FULL_EVACUATION"]
}
```

---

## 5. Endpoints de Operaciones en Tiempo Real

### 5.1 Obtener Datos de Perforación Actuales

```
GET /api/v1/drilling/wells/{well_id}/realtime
```

**Response:**
```json
{
  "success": true,
  "data": {
    "well_id": "uuid",
    "timestamp": "2026-02-10T14:35:00Z",
    "bit_depth_ft": 5520.0,
    "hole_depth_ft": 5520.0,
    "block_position_ft": 45.0,
    "rop_ft_hr": 85.5,
    "wob_klbs": 25.0,
    "rpm": 120,
    "torque_kft_lbs": 12.5,
    "spp_psi": 2850,
    "flow_rate_gpm": 650,
    "mud_weight_in_ppg": 10.5,
    "mud_weight_out_ppg": 10.52,
    "pit_volume_bbls": 850.5,
    "pit_gain_bbls": 0.0,
    "ecd_ppg": 11.2,
    "hookload_klbs": 185.0,
    "activity": "DRILLING",
    "mse_psi": 45000
  }
}
```

### 5.2 Obtener Historial de Parámetros

```
GET /api/v1/drilling/wells/{well_id}/parameters
```

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `from_depth` | float | Profundidad desde (ft) |
| `to_depth` | float | Profundidad hasta (ft) |
| `from_time` | datetime | Tiempo desde |
| `to_time` | datetime | Tiempo hasta |
| `parameters` | string[] | Lista de parámetros |
| `interval_sec` | int | Intervalo de muestreo |

### 5.3 Registrar Evento de Perforación

```
POST /api/v1/drilling/wells/{well_id}/events
```

**Request Body:**
```json
{
  "event_type": "CONNECTION",
  "start_time": "2026-02-10T14:00:00Z",
  "end_time": "2026-02-10T14:08:00Z",
  "start_depth_ft": 5490.0,
  "end_depth_ft": 5490.0,
  "description": "Conexión normal",
  "connection_gas_units": 25
}
```

---

## 6. Endpoints de Torque & Drag

### 6.1 Calcular Modelo T&D

```
POST /api/v1/drilling/torque-drag/calculate
```

**Request Body:**
```json
{
  "well_id": "uuid",
  "bha_id": "uuid",
  "survey": [...],
  "mud_weight_ppg": 10.5,
  "friction_factor_cased": 0.25,
  "friction_factor_open": 0.35,
  "operations": ["ROTATING_OFF_BOTTOM", "SLIDE_DRILLING", "TRIPPING_IN", "TRIPPING_OUT", "BACKREAMING"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "operations": {
      "ROTATING_OFF_BOTTOM": {
        "hookload_klbs": [{"md_ft": 0, "value": 0}, {"md_ft": 1000, "value": 45}, ...],
        "torque_kft_lbs": [{"md_ft": 0, "value": 0}, {"md_ft": 1000, "value": 2.5}, ...],
        "surface_torque_kft_lbs": 18.5,
        "surface_weight_klbs": 185.0
      },
      "TRIPPING_IN": {
        "hookload_klbs": [...],
        "surface_weight_klbs": 165.0
      },
      "TRIPPING_OUT": {
        "hookload_klbs": [...],
        "surface_weight_klbs": 210.0
      }
    },
    "buckling_analysis": {
      "sinusoidal_depth_ft": 8200,
      "helical_depth_ft": null,
      "critical_wob_klbs": 35.0
    }
  }
}
```

### 6.2 Comparar T&D Real vs Modelo

```
GET /api/v1/drilling/wells/{well_id}/torque-drag/comparison
```

---

## 7. Endpoints de Well Control

### 7.1 Generar Kill Sheet

```
POST /api/v1/drilling/well-control/kill-sheet
```

**Request Body:**
```json
{
  "well_id": "uuid",
  "current_depth_ft": 8500,
  "mud_weight_ppg": 10.5,
  "sicp_psi": 450,
  "sidpp_psi": 350,
  "pit_gain_bbls": 15,
  "kill_method": "DRILLERS"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "formation_pressure_ppg": 11.2,
    "kill_mud_weight_ppg": 11.5,
    "initial_circulating_pressure_psi": 2850,
    "final_circulating_pressure_psi": 2950,
    "pressure_schedule": [
      {"strokes": 0, "pressure_psi": 2850},
      {"strokes": 500, "pressure_psi": 2880},
      {"strokes": 1000, "pressure_psi": 2920}
    ],
    "surface_to_bit_strokes": 850,
    "bit_to_surface_strokes": 1200,
    "total_strokes": 2050
  }
}
```

### 7.2 Calcular MAASP

```
POST /api/v1/drilling/well-control/maasp
```

**Request Body:**
```json
{
  "shoe_depth_tvd_ft": 2000,
  "lot_emw_ppg": 14.5,
  "current_mud_weight_ppg": 10.5,
  "safety_margin_psi": 100
}
```

---

## 8. Endpoints de Reportes

### 8.1 Generar Daily Drilling Report (DDR)

```
POST /api/v1/drilling/reports/ddr
```

**Request Body:**
```json
{
  "well_id": "uuid",
  "report_date": "2026-02-10",
  "reporting_period": {
    "from": "2026-02-10T06:00:00Z",
    "to": "2026-02-11T06:00:00Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "report_id": "uuid",
    "report_number": "DDR-025",
    "report_date": "2026-02-10",
    "well_name": "PDC-150",
    "rig_name": "RIG-05",
    "days_since_spud": 10,
    "depths": {
      "start_depth_ft": 5200,
      "end_depth_ft": 5520,
      "progress_ft": 320
    },
    "operations_summary": [
      {"code": "DRLG", "description": "Drilling", "hours": 18.5},
      {"code": "CONN", "description": "Connections", "hours": 3.2},
      {"code": "CIRC", "description": "Circulating", "hours": 2.3}
    ],
    "mud_properties": {...},
    "bit_record": {...},
    "costs": {
      "daily_cost_usd": 125000,
      "cumulative_cost_usd": 1250000
    }
  }
}
```

### 8.2 Exportar Reporte

```
GET /api/v1/drilling/reports/ddr/{id}/export?format=pdf
```

---

## 9. WebSocket para Tiempo Real

### 9.1 Conexión
```
WS /api/v1/drilling/ws
```

### 9.2 Suscripción a Pozo

```json
{
  "action": "subscribe",
  "well_id": "uuid",
  "parameters": ["bit_depth", "rop", "wob", "rpm", "torque", "spp", "hookload"]
}
```

### 9.3 Datos en Tiempo Real

```json
{
  "event": "drilling_data",
  "well_id": "uuid",
  "timestamp": "2026-02-10T14:35:01Z",
  "data": {
    "bit_depth_ft": 5520.5,
    "rop_ft_hr": 86.2,
    "wob_klbs": 24.8,
    "rpm": 121,
    "torque_kft_lbs": 12.3,
    "spp_psi": 2845,
    "hookload_klbs": 184.5
  }
}
```

### 9.4 Alarmas

```json
{
  "event": "alarm",
  "well_id": "uuid",
  "timestamp": "2026-02-10T14:35:05Z",
  "alarm": {
    "id": "uuid",
    "type": "HIGH_TORQUE",
    "severity": "WARNING",
    "message": "Torque excede límite configurado",
    "value": 18.5,
    "threshold": 15.0,
    "unit": "kft-lbs"
  }
}
```

---

## 10. Endpoints de BHA

### 10.1 Listar Configuraciones BHA

```
GET /api/v1/drilling/bha
```

### 10.2 Obtener BHA Actual

```
GET /api/v1/drilling/wells/{well_id}/current-bha
```

### 10.3 Registrar Nueva Corrida BHA

```
POST /api/v1/drilling/wells/{well_id}/bha-runs
```

**Request Body:**
```json
{
  "run_number": 3,
  "bha_type": "ROTARY",
  "start_depth_ft": 5200,
  "components": [
    {
      "sequence": 1,
      "component_type": "BIT",
      "description": "8.5\" PDC Bit",
      "od_inches": 8.5,
      "id_inches": 3.0,
      "length_ft": 0.8,
      "weight_lbs": 85,
      "serial_number": "BIT-12345"
    },
    {
      "sequence": 2,
      "component_type": "MOTOR",
      "description": "7\" Mud Motor 5/6 Lobe",
      "od_inches": 6.75,
      "id_inches": 2.5,
      "length_ft": 28.0,
      "weight_lbs": 2800,
      "bend_angle_deg": 1.5
    }
  ]
}
```

