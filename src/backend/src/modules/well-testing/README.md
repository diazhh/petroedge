# Well Testing Module

Módulo para gestión de pruebas de pozo y análisis IPR (Inflow Performance Relationship).

## Descripción

Este módulo proporciona funcionalidades completas para:
- Gestión de pruebas de pozo (well tests)
- Registro de lecturas durante pruebas
- Cálculo de IPR con múltiples modelos
- Análisis de rendimiento de pozos
- Gestión de tipos de prueba

## Arquitectura

```
well-testing/
├── well-testing.schema.ts      # Esquemas Zod de validación
├── well-testing.repository.ts  # Acceso a datos (Drizzle ORM)
├── well-testing.service.ts     # Lógica de negocio
├── well-testing.controller.ts  # Handlers HTTP
├── well-testing.routes.ts      # Definición de rutas
├── well-testing.helpers.ts     # Funciones auxiliares
├── ipr-calculator.service.ts   # Cálculos IPR
└── README.md                   # Este archivo
```

## Modelos IPR Implementados

### 1. Vogel
Para pozos de petróleo por debajo del punto de burbuja.

**Fórmula**: `Qo/Qmax = 1 - 0.2(Pwf/Pr) - 0.8(Pwf/Pr)²`

**Uso**: Pozos de petróleo con flujo bifásico

### 2. Fetkovitch
Para pozos de gas.

**Fórmula**: `Qg = C × (Pr² - Pwf²)^n`

**Uso**: Pozos de gas con flujo monofásico

### 3. Standing
Para pozos por encima del punto de burbuja.

**Fórmula**: `Qo = J × (Pr - Pwf)`

**Uso**: Flujo monofásico de petróleo

### 4. Composite
Combinación de Standing y Vogel para pozos con presión de yacimiento cerca del punto de burbuja.

**Uso**: Transición entre flujo monofásico y bifásico

## API Endpoints

### Well Tests

#### Crear Prueba de Pozo
```http
POST /api/v1/well-tests
Authorization: Bearer {token}
Content-Type: application/json

{
  "wellId": "uuid",
  "testTypeId": "uuid",
  "testDate": "2026-01-08T00:00:00Z",
  "oilRateBopd": 500,
  "waterRateBwpd": 100,
  "gasRateMscfd": 250,
  "tubingPressurePsi": 1200,
  "casingPressurePsi": 1500,
  "flowingBhpPsi": 2500,
  "staticBhpPsi": 3000
}
```

#### Listar Pruebas
```http
GET /api/v1/well-tests?wellId={uuid}&status=COMPLETED&page=1&perPage=20
Authorization: Bearer {token}
```

#### Obtener Prueba por ID
```http
GET /api/v1/well-tests/{id}
Authorization: Bearer {token}
```

#### Actualizar Prueba
```http
PUT /api/v1/well-tests/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "COMPLETED",
  "oilRateBopd": 520
}
```

#### Eliminar Prueba
```http
DELETE /api/v1/well-tests/{id}
Authorization: Bearer {token}
```

#### Aprobar Prueba
```http
POST /api/v1/well-tests/{id}/approve
Authorization: Bearer {token}
```

### Test Readings

#### Agregar Lectura
```http
POST /api/v1/test-readings
Authorization: Bearer {token}
Content-Type: application/json

{
  "wellTestId": "uuid",
  "readingTime": "2026-01-08T10:30:00Z",
  "tubingPressurePsi": 1250,
  "oilRateBopd": 510,
  "waterRateBwpd": 105,
  "gasRateMscfd": 255
}
```

#### Obtener Lecturas de una Prueba
```http
GET /api/v1/well-tests/{wellTestId}/readings
Authorization: Bearer {token}
```

### IPR Analysis

#### Calcular IPR
```http
POST /api/v1/well-tests/{wellTestId}/ipr
Authorization: Bearer {token}
Content-Type: application/json

{
  "model": "VOGEL",
  "reservoirPressurePsi": 3000,
  "testRateBopd": 500,
  "testPwfPsi": 2500,
  "bubblePointPsi": 2800,
  "numPoints": 20
}
```

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "analysis": {
      "id": "uuid",
      "model": "VOGEL",
      "qmaxBopd": "1250.50",
      "productivityIndex": "0.4168",
      "iprCurve": [
        {"pwf": 0, "q": 1250.5},
        {"pwf": 150, "q": 1200.3},
        ...
      ]
    },
    "result": {
      "model": "VOGEL",
      "qmaxBopd": 1250.5,
      "productivityIndex": 0.4168,
      "curve": [...]
    }
  }
}
```

#### Obtener Análisis IPR
```http
GET /api/v1/well-tests/{wellTestId}/ipr-analyses
Authorization: Bearer {token}
```

### Test Types

#### Listar Tipos de Prueba
```http
GET /api/v1/test-types
Authorization: Bearer {token}
```

### Estadísticas

#### Obtener Estadísticas de Pruebas por Pozo
```http
GET /api/v1/wells/{wellId}/test-stats
Authorization: Bearer {token}
```

## Tipos de Prueba

- **PRODUCTION**: Prueba de producción estándar
- **BUILDUP**: Prueba de incremento de presión
- **DRAWDOWN**: Prueba de declinación de presión
- **ISOCHRONAL**: Prueba isócrona para pozos de gas
- **INTERFERENCE**: Prueba de interferencia entre pozos
- **PVT_SAMPLE**: Toma de muestra PVT

## Estados de Prueba

- **PLANNED**: Planificada
- **IN_PROGRESS**: En progreso
- **COMPLETED**: Completada
- **ANALYZED**: Analizada
- **APPROVED**: Aprobada
- **CANCELLED**: Cancelada
- **SUSPENDED**: Suspendida

## Validaciones

Todas las entradas son validadas con Zod:
- UUIDs válidos para referencias
- Rangos numéricos apropiados
- Fechas en formato ISO 8601
- Enums para estados y tipos

## Permisos

- **admin**: Acceso completo
- **engineer**: Crear, leer, actualizar, calcular IPR
- **operator**: Crear lecturas, leer pruebas
- **viewer**: Solo lectura

## Base de Datos

### Tablas

- `test_types`: Tipos de prueba configurables
- `well_tests`: Pruebas de pozo principales
- `test_readings`: Lecturas durante pruebas
- `ipr_analyses`: Resultados de análisis IPR
- `vlp_analyses`: Análisis VLP (futuro)
- `nodal_analyses`: Análisis nodal (futuro)

### Migración

```bash
# Generar migración
npx drizzle-kit generate:pg

# Aplicar migración
npx drizzle-kit push:pg
```

## Testing

```bash
# Unit tests
npm test src/modules/well-testing

# Integration tests
npm test:integration well-testing

# Coverage
npm run test:coverage
```

## Ejemplo de Uso

```typescript
import { WellTestingService } from './well-testing.service';

const service = new WellTestingService();

// Crear prueba
const test = await service.createWellTest(tenantId, userId, {
  wellId: 'well-uuid',
  testTypeId: 'type-uuid',
  testDate: new Date(),
  oilRateBopd: '500',
  tubingPressurePsi: '1200',
  // ...
});

// Calcular IPR
const ipr = await service.calculateIpr(
  test.id,
  tenantId,
  userId,
  {
    model: 'VOGEL',
    reservoirPressurePsi: 3000,
    testRateBopd: 500,
    testPwfPsi: 2500,
  }
);
```

## Próximas Funcionalidades

- [ ] Cálculo VLP (Beggs & Brill, Hagedorn & Brown)
- [ ] Análisis Nodal (IPR + VLP)
- [ ] Optimización de choke
- [ ] Predicción de producción
- [ ] Exportación de reportes PDF
- [ ] Gráficos interactivos de curvas IPR/VLP

## Referencias

- Vogel, J.V. (1968). "Inflow Performance Relationships for Solution-Gas Drive Wells"
- Fetkovitch, M.J. (1973). "The Isochronal Testing of Oil Wells"
- Standing, M.B. (1971). "Concerning the Calculation of Inflow Performance"
- Beggs, H.D. & Brill, J.P. (1973). "A Study of Two-Phase Flow in Inclined Pipes"
