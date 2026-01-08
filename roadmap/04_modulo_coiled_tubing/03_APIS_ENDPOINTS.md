# COILED TUBING - APIS Y ENDPOINTS

## 1. Estructura Base

### 1.1 URL Base
```
/api/v1/coiled-tubing
```

### 1.2 Autenticación
Todas las rutas requieren JWT Bearer Token:
```
Authorization: Bearer <token>
```

---

## 2. Endpoints de Reels

### 2.1 Listar Reels

```
GET /api/v1/coiled-tubing/reels
```

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `status` | string | AVAILABLE, IN_SERVICE, MAINTENANCE, RETIRED |
| `od_inches` | float | Filtrar por OD |
| `min_length_ft` | float | Longitud mínima disponible |
| `max_fatigue_pct` | float | Fatiga máxima permitida |
| `location` | string | Ubicación actual |
| `page` | int | Página |
| `per_page` | int | Items por página |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "reel_number": "REEL-001",
      "od_inches": 2.0,
      "wall_thickness_inches": 0.156,
      "material_grade": "CT-90",
      "current_length_ft": 18500.0,
      "original_length_ft": 20000.0,
      "length_remaining_pct": 92.5,
      "current_max_fatigue_percent": 45.2,
      "max_fatigue_percent": 80.0,
      "fatigue_status": "OK",
      "status": "AVAILABLE",
      "total_jobs": 45,
      "current_location": "Base Campo Norte",
      "assigned_unit": "CTU-05"
    }
  ],
  "meta": { "total": 12, "page": 1, "per_page": 20 }
}
```

### 2.2 Obtener Reel por ID

```
GET /api/v1/coiled-tubing/reels/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "reel_number": "REEL-001",
    "reel_name": "Reel Principal CT-90",
    "serial_number": "SN-2024-001",
    "od_inches": 2.0,
    "wall_thickness_inches": 0.156,
    "id_inches": 1.688,
    "material_grade": "CT-90",
    "yield_strength_psi": 90000,
    "original_length_ft": 20000.0,
    "current_length_ft": 18500.0,
    "cut_removed_ft": 1500.0,
    "working_pressure_psi": 10000,
    "burst_pressure_psi": 15000,
    "status": "AVAILABLE",
    "current_max_fatigue_percent": 45.2,
    "max_fatigue_percent": 80.0,
    "manufacture_date": "2024-01-15",
    "purchase_date": "2024-02-01",
    "last_inspection_date": "2025-12-01",
    "next_inspection_date": "2026-06-01",
    "total_jobs": 45,
    "total_footage_ft": 425000.0,
    "current_location": "Base Campo Norte",
    "assigned_unit": {
      "id": "uuid",
      "unit_number": "CTU-05"
    },
    "sections": [
      {
        "section_number": 1,
        "start_footage_ft": 0,
        "end_footage_ft": 1000,
        "combined_fatigue_percent": 45.2,
        "status": "WARNING"
      }
    ]
  }
}
```

### 2.3 Crear Reel

```
POST /api/v1/coiled-tubing/reels
```

**Request Body:**
```json
{
  "reel_number": "REEL-002",
  "reel_name": "Reel Secundario CT-80",
  "serial_number": "SN-2024-002",
  "od_inches": 1.75,
  "wall_thickness_inches": 0.134,
  "material_grade": "CT-80",
  "yield_strength_psi": 80000,
  "original_length_ft": 15000.0,
  "working_pressure_psi": 8500,
  "burst_pressure_psi": 12000,
  "manufacture_date": "2024-06-01",
  "purchase_date": "2024-07-01",
  "current_location": "Almacén Central"
}
```

### 2.4 Actualizar Reel

```
PUT /api/v1/coiled-tubing/reels/{id}
```

### 2.5 Registrar Corte de CT

```
POST /api/v1/coiled-tubing/reels/{id}/cut
```

**Request Body:**
```json
{
  "cut_length_ft": 500.0,
  "cut_from": "BOTTOM",
  "reason": "Fatiga excesiva en sección inferior",
  "cut_date": "2026-01-08",
  "performed_by": "Juan Pérez"
}
```

### 2.6 Obtener Perfil de Fatiga

```
GET /api/v1/coiled-tubing/reels/{id}/fatigue-profile
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reel_id": "uuid",
    "reel_number": "REEL-001",
    "sections": [
      {
        "section_number": 1,
        "start_footage_ft": 0,
        "end_footage_ft": 1000,
        "bending_fatigue_percent": 35.5,
        "pressure_fatigue_percent": 12.3,
        "combined_fatigue_percent": 45.2,
        "status": "WARNING"
      },
      {
        "section_number": 2,
        "start_footage_ft": 1000,
        "end_footage_ft": 2000,
        "bending_fatigue_percent": 28.1,
        "pressure_fatigue_percent": 10.2,
        "combined_fatigue_percent": 36.8,
        "status": "GOOD"
      }
    ],
    "chart_data": [
      {"footage_ft": 0, "fatigue_pct": 45.2},
      {"footage_ft": 500, "fatigue_pct": 42.1},
      {"footage_ft": 1000, "fatigue_pct": 36.8}
    ]
  }
}
```

---

## 3. Endpoints de Trabajos CT

### 3.1 Listar Trabajos

```
GET /api/v1/coiled-tubing/jobs
```

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `well_id` | UUID | Filtrar por pozo |
| `reel_id` | UUID | Filtrar por reel |
| `job_type` | string | Tipo de trabajo |
| `status` | string | Estado del trabajo |
| `from_date` | date | Fecha desde |
| `to_date` | date | Fecha hasta |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "job_number": "CTJ-2026-001",
      "job_type": "CLEANOUT",
      "status": "COMPLETED",
      "well_name": "PDC-015",
      "reel_number": "REEL-001",
      "unit_number": "CTU-05",
      "planned_date": "2026-01-08",
      "max_depth_reached_ft": 8500.0,
      "job_successful": true,
      "duration_hours": 12.5
    }
  ]
}
```

### 3.2 Obtener Trabajo por ID

```
GET /api/v1/coiled-tubing/jobs/{id}
```

### 3.3 Crear Trabajo

```
POST /api/v1/coiled-tubing/jobs
```

**Request Body:**
```json
{
  "well_id": "uuid",
  "reel_id": "uuid",
  "unit_id": "uuid",
  "job_type": "CLEANOUT",
  "planned_date": "2026-01-15",
  "planned_depth_ft": 8500.0,
  "client_id": "uuid",
  "client_representative": "Carlos García",
  "objective": "Limpieza de arena en completación",
  "estimated_cost_usd": 45000
}
```

### 3.4 Iniciar Trabajo

```
POST /api/v1/coiled-tubing/jobs/{id}/start
```

### 3.5 Finalizar Trabajo

```
POST /api/v1/coiled-tubing/jobs/{id}/complete
```

**Request Body:**
```json
{
  "max_depth_reached_ft": 8450.0,
  "tag_depth_ft": 8450.0,
  "job_successful": true,
  "objectives_met": "Se limpió arena hasta 8450 ft. Pozo fluyendo.",
  "notes": "Sin novedades durante la operación"
}
```

### 3.6 Agregar Operación

```
POST /api/v1/coiled-tubing/jobs/{id}/operations
```

**Request Body:**
```json
{
  "operation_code": "RIH",
  "operation_description": "Run in hole with CT",
  "start_time": "2026-01-08T08:00:00Z",
  "end_time": "2026-01-08T10:30:00Z",
  "start_depth_ft": 0,
  "end_depth_ft": 5000,
  "weight_indicator_lbs": 2500,
  "pump_pressure_psi": 0,
  "wellhead_pressure_psi": 150
}
```

### 3.7 Registrar Fluido Bombeado

```
POST /api/v1/coiled-tubing/jobs/{id}/fluids
```

**Request Body:**
```json
{
  "fluid_type": "NITROGEN",
  "fluid_name": "N2 Gas",
  "volume_bbls": 0,
  "volume_scf": 250000,
  "pump_rate_scfm": 5000,
  "pump_pressure_psi": 3500,
  "notes": "Inducción con nitrógeno"
}
```

---

## 4. Endpoints de Tiempo Real

### 4.1 Obtener Datos Actuales

```
GET /api/v1/coiled-tubing/jobs/{id}/realtime
```

**Response:**
```json
{
  "success": true,
  "data": {
    "job_id": "uuid",
    "timestamp": "2026-01-08T14:35:00Z",
    "depth_ft": 6250.5,
    "speed_ft_min": 45.0,
    "weight_indicator_lbs": 3500,
    "pump_pressure_psi": 2800,
    "wellhead_pressure_psi": 450,
    "annular_pressure_psi": 200,
    "pump_rate_bpm": 1.5,
    "total_volume_pumped_bbls": 125.5,
    "current_fatigue_percent": 46.8,
    "status": "RUNNING_IN_HOLE"
  }
}
```

### 4.2 Obtener Historial de Parámetros

```
GET /api/v1/coiled-tubing/jobs/{id}/parameters
```

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `from_time` | datetime | Tiempo desde |
| `to_time` | datetime | Tiempo hasta |
| `parameters` | string[] | Lista de parámetros |
| `interval_sec` | int | Intervalo de muestreo |

### 4.3 WebSocket para Tiempo Real

```
WS /api/v1/coiled-tubing/ws
```

**Suscripción:**
```json
{
  "action": "subscribe",
  "job_id": "uuid",
  "parameters": ["depth", "weight", "pressure", "speed", "fatigue"]
}
```

**Datos en tiempo real:**
```json
{
  "event": "ct_data",
  "job_id": "uuid",
  "timestamp": "2026-01-08T14:35:01Z",
  "data": {
    "depth_ft": 6251.2,
    "speed_ft_min": 44.8,
    "weight_indicator_lbs": 3520,
    "pump_pressure_psi": 2810,
    "wellhead_pressure_psi": 455,
    "current_fatigue_percent": 46.82
  }
}
```

---

## 5. Endpoints de Análisis de Fatiga

### 5.1 Calcular Fatiga para Trabajo

```
POST /api/v1/coiled-tubing/fatigue/calculate
```

**Request Body:**
```json
{
  "reel_id": "uuid",
  "planned_depth_ft": 8500,
  "guide_radius_inches": 72,
  "max_pressure_psi": 5000,
  "estimated_cycles": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "current_max_fatigue_percent": 45.2,
    "estimated_additional_fatigue_percent": 3.5,
    "projected_fatigue_percent": 48.7,
    "fatigue_remaining_percent": 31.3,
    "recommendation": "PROCEED",
    "warnings": []
  }
}
```

### 5.2 Simular Escenario de Fatiga

```
POST /api/v1/coiled-tubing/fatigue/simulate
```

**Request Body:**
```json
{
  "reel_id": "uuid",
  "scenarios": [
    {
      "name": "Job 1 - Cleanout 8000ft",
      "depth_ft": 8000,
      "cycles": 8,
      "pressure_psi": 4000
    },
    {
      "name": "Job 2 - Acid 6000ft",
      "depth_ft": 6000,
      "cycles": 6,
      "pressure_psi": 5500
    }
  ]
}
```

---

## 6. Endpoints de Análisis de Fuerzas

### 6.1 Calcular Predicción de Fuerzas

```
POST /api/v1/coiled-tubing/forces/calculate
```

**Request Body:**
```json
{
  "well_id": "uuid",
  "reel_id": "uuid",
  "wellbore_survey": [...],
  "fluid_density_ppg": 8.6,
  "ct_filled": true,
  "friction_factor": 0.3,
  "operations": ["RIH", "POOH", "WORKING"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "operations": {
      "RIH": {
        "weight_vs_depth": [
          {"depth_ft": 0, "weight_lbs": 0},
          {"depth_ft": 2000, "weight_lbs": 1200},
          {"depth_ft": 4000, "weight_lbs": 2100}
        ],
        "surface_weight_lbs": 4500
      },
      "POOH": {
        "weight_vs_depth": [...],
        "surface_weight_lbs": 6200
      }
    },
    "buckling_analysis": {
      "sinusoidal_depth_ft": 7200,
      "helical_depth_ft": 8500,
      "lockup_depth_ft": 9200,
      "max_wob_lbs": 1500
    }
  }
}
```

---

## 7. Endpoints de Job Tickets

### 7.1 Generar Job Ticket

```
POST /api/v1/coiled-tubing/jobs/{id}/ticket
```

### 7.2 Obtener Job Ticket

```
GET /api/v1/coiled-tubing/tickets/{id}
```

### 7.3 Aprobar Job Ticket

```
POST /api/v1/coiled-tubing/tickets/{id}/approve
```

**Request Body:**
```json
{
  "approval_notes": "Trabajo completado satisfactoriamente",
  "client_signature": "base64_signature_data"
}
```

### 7.4 Exportar Job Ticket

```
GET /api/v1/coiled-tubing/tickets/{id}/export?format=pdf
```

---

## 8. Endpoints de Unidades CT

### 8.1 Listar Unidades

```
GET /api/v1/coiled-tubing/units
```

### 8.2 Obtener Unidad

```
GET /api/v1/coiled-tubing/units/{id}
```

### 8.3 Crear Unidad

```
POST /api/v1/coiled-tubing/units
```

### 8.4 Asignar Reel a Unidad

```
POST /api/v1/coiled-tubing/units/{id}/assign-reel
```

**Request Body:**
```json
{
  "reel_id": "uuid"
}
```

---

## 9. Endpoints de Reportes

### 9.1 Reporte de Historial de Reel

```
GET /api/v1/coiled-tubing/reels/{id}/report?format=pdf
```

### 9.2 Reporte de Trabajos por Período

```
GET /api/v1/coiled-tubing/reports/jobs
```

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `from_date` | date | Fecha desde |
| `to_date` | date | Fecha hasta |
| `well_id` | UUID | Filtrar por pozo |
| `format` | string | pdf, xlsx, csv |

### 9.3 Reporte de Estado de Flota

```
GET /api/v1/coiled-tubing/reports/fleet-status
```

