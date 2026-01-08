# WELL TESTING - APIS Y ENDPOINTS

## 1. Estructura Base

### 1.1 URL Base
```
/api/v1/well-testing
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
    "message": "El campo oil_rate es requerido",
    "details": [...]
  }
}
```

---

## 2. Endpoints de Pruebas

### 2.1 Listar Pruebas

```
GET /api/v1/well-testing/tests
```

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `well_id` | UUID | Filtrar por pozo |
| `test_type` | string | Tipo de prueba |
| `status` | string | Estado de la prueba |
| `from_date` | date | Fecha desde |
| `to_date` | date | Fecha hasta |
| `page` | int | Página (default 1) |
| `per_page` | int | Items por página (default 20) |
| `sort` | string | Campo de ordenamiento |
| `order` | string | asc/desc |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "test_number": "WT-2026-001",
      "well_id": "uuid",
      "well_name": "PDC-15",
      "test_type": "PRODUCTION",
      "test_date": "2026-01-08T10:00:00Z",
      "status": "COMPLETED",
      "oil_rate_bopd": 850.5,
      "water_rate_bwpd": 120.0,
      "gas_rate_mscfd": 450.2,
      "water_cut_percent": 12.4,
      "flowing_bhp_psi": 1200.0,
      "productivity_index": 0.85
    }
  ],
  "meta": {
    "total": 156,
    "page": 1,
    "per_page": 20
  }
}
```

### 2.2 Obtener Prueba por ID

```
GET /api/v1/well-testing/tests/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "test_number": "WT-2026-001",
    "well_id": "uuid",
    "well": {
      "id": "uuid",
      "well_name": "PDC-15",
      "well_code": "PDC-015"
    },
    "test_type_id": "uuid",
    "test_type": {
      "code": "PRODUCTION",
      "name": "Prueba de Producción"
    },
    "test_date": "2026-01-08T10:00:00Z",
    "status": "COMPLETED",
    "start_time": "2026-01-08T08:00:00Z",
    "end_time": "2026-01-08T12:00:00Z",
    "duration_hours": 4.0,
    "choke_size_64ths": 32,
    "separator_pressure_psi": 50.0,
    "separator_temperature_f": 85.0,
    "oil_rate_bopd": 850.5,
    "water_rate_bwpd": 120.0,
    "gas_rate_mscfd": 450.2,
    "liquid_rate_blpd": 970.5,
    "tubing_pressure_psi": 350.0,
    "casing_pressure_psi": 380.0,
    "flowing_bhp_psi": 1200.0,
    "static_bhp_psi": 2800.0,
    "wellhead_temp_f": 95.0,
    "bottomhole_temp_f": 180.0,
    "bsw_percent": 14.0,
    "water_cut_percent": 12.4,
    "oil_api_gravity": 28.5,
    "gas_specific_gravity": 0.75,
    "gor_scf_stb": 529.0,
    "productivity_index": 0.53,
    "notes": "Prueba sin novedades",
    "created_by": "uuid",
    "created_at": "2026-01-08T12:30:00Z",
    "updated_at": "2026-01-08T12:30:00Z"
  }
}
```

### 2.3 Crear Prueba

```
POST /api/v1/well-testing/tests
```

**Request Body:**
```json
{
  "well_id": "uuid",
  "test_type_id": "uuid",
  "test_date": "2026-01-08T10:00:00Z",
  "duration_hours": 4.0,
  "choke_size_64ths": 32,
  "separator_pressure_psi": 50.0,
  "separator_temperature_f": 85.0,
  "oil_rate_bopd": 850.5,
  "water_rate_bwpd": 120.0,
  "gas_rate_mscfd": 450.2,
  "tubing_pressure_psi": 350.0,
  "casing_pressure_psi": 380.0,
  "flowing_bhp_psi": 1200.0,
  "static_bhp_psi": 2800.0,
  "wellhead_temp_f": 95.0,
  "bottomhole_temp_f": 180.0,
  "bsw_percent": 14.0,
  "oil_api_gravity": 28.5,
  "gas_specific_gravity": 0.75,
  "notes": "Prueba programada"
}
```

**Response:** 201 Created
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "test_number": "WT-2026-002",
    ...
  }
}
```

### 2.4 Actualizar Prueba

```
PUT /api/v1/well-testing/tests/{id}
```

**Request Body:** (campos a actualizar)
```json
{
  "oil_rate_bopd": 860.0,
  "water_rate_bwpd": 125.0,
  "status": "COMPLETED"
}
```

### 2.5 Eliminar Prueba

```
DELETE /api/v1/well-testing/tests/{id}
```

**Response:** 204 No Content

---

## 3. Endpoints de Análisis IPR

### 3.1 Calcular IPR

```
POST /api/v1/well-testing/ipr/calculate
```

**Request Body:**
```json
{
  "model": "VOGEL",
  "reservoir_pressure_psi": 2800.0,
  "test_rate_bopd": 850.0,
  "test_pwf_psi": 1200.0,
  "bubble_point_psi": 2400.0,
  "num_points": 20
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "model": "VOGEL",
    "qmax_bopd": 1456.78,
    "productivity_index": 0.936,
    "aof_bopd": 1456.78,
    "curve": [
      {"pwf": 0, "q": 1456.78},
      {"pwf": 140, "q": 1438.12},
      {"pwf": 280, "q": 1400.89},
      ...
      {"pwf": 2800, "q": 0}
    ]
  }
}
```

### 3.2 Guardar Análisis IPR

```
POST /api/v1/well-testing/ipr/analyses
```

**Request Body:**
```json
{
  "well_test_id": "uuid",
  "model": "VOGEL",
  "reservoir_pressure_psi": 2800.0,
  "bubble_point_psi": 2400.0,
  "test_rate_bopd": 850.0,
  "test_pwf_psi": 1200.0,
  "qmax_bopd": 1456.78,
  "productivity_index": 0.936,
  "ipr_curve": [...],
  "analyst": "Juan Pérez",
  "notes": "Análisis inicial"
}
```

### 3.3 Listar Análisis IPR de un Pozo

```
GET /api/v1/well-testing/ipr/analyses?well_id={well_id}
```

---

## 4. Endpoints de Análisis VLP

### 4.1 Calcular VLP

```
POST /api/v1/well-testing/vlp/calculate
```

**Request Body:**
```json
{
  "correlation": "BEGGS_BRILL",
  "tubing_id_inches": 2.992,
  "tubing_depth_ft": 8500,
  "wellhead_pressure_psi": 350,
  "deviation_degrees": 15,
  "wellhead_temp_f": 95,
  "bottomhole_temp_f": 180,
  "water_cut_percent": 12.4,
  "gor_scf_stb": 529,
  "oil_api": 28.5,
  "gas_sg": 0.75,
  "water_sg": 1.02,
  "num_points": 20,
  "max_rate_bopd": 2000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "correlation": "BEGGS_BRILL",
    "curve": [
      {"q": 0, "pwf": 350.0},
      {"q": 100, "pwf": 520.5},
      {"q": 200, "pwf": 695.2},
      ...
      {"q": 2000, "pwf": 3200.5}
    ]
  }
}
```

### 4.2 Guardar Análisis VLP

```
POST /api/v1/well-testing/vlp/analyses
```

---

## 5. Endpoints de Análisis Nodal

### 5.1 Calcular Punto de Operación

```
POST /api/v1/well-testing/nodal/calculate
```

**Request Body:**
```json
{
  "well_id": "uuid",
  "ipr": {
    "model": "VOGEL",
    "reservoir_pressure_psi": 2800,
    "qmax_bopd": 1456.78
  },
  "vlp": {
    "correlation": "BEGGS_BRILL",
    "tubing_id_inches": 2.992,
    "tubing_depth_ft": 8500,
    "wellhead_pressure_psi": 350,
    ...
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "operating_point": {
      "rate_bopd": 852.3,
      "pwf_psi": 1195.5
    },
    "ipr_curve": [...],
    "vlp_curve": [...],
    "intersection_found": true
  }
}
```

### 5.2 Análisis de Sensibilidad

```
POST /api/v1/well-testing/nodal/sensitivity
```

**Request Body:**
```json
{
  "well_id": "uuid",
  "base_case": { ... },
  "scenarios": [
    {
      "name": "Tubing 3.5\"",
      "vlp": { "tubing_id_inches": 2.992 }
    },
    {
      "name": "WC 30%",
      "vlp": { "water_cut_percent": 30 }
    }
  ]
}
```

---

## 6. Endpoints de Reportes

### 6.1 Generar Reporte de Prueba

```
GET /api/v1/well-testing/tests/{id}/report?format=pdf
```

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `format` | string | pdf, xlsx, html |
| `include_charts` | bool | Incluir gráficos |
| `template` | string | Plantilla a usar |

**Response:** Archivo binario con headers apropiados

### 6.2 Exportar Datos

```
GET /api/v1/well-testing/tests/export
```

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `well_id` | UUID | Filtrar por pozo |
| `from_date` | date | Fecha desde |
| `to_date` | date | Fecha hasta |
| `format` | string | csv, xlsx |

---

## 7. Endpoints de Tipos de Prueba

### 7.1 Listar Tipos

```
GET /api/v1/well-testing/test-types
```

### 7.2 Obtener Tipo por ID

```
GET /api/v1/well-testing/test-types/{id}
```

---

## 8. WebSocket para Tiempo Real

### 8.1 Conexión
```
WS /api/v1/well-testing/ws
```

### 8.2 Eventos

**Suscribirse a prueba en curso:**
```json
{
  "action": "subscribe",
  "well_test_id": "uuid"
}
```

**Datos en tiempo real:**
```json
{
  "event": "reading",
  "data": {
    "well_test_id": "uuid",
    "timestamp": "2026-01-08T10:05:00Z",
    "tubing_pressure_psi": 352.5,
    "oil_rate_bopd": 855.2
  }
}
```

