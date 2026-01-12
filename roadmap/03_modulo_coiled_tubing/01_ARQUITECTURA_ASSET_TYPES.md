# BLOQUE 1: ARQUITECTURA Y ASSET TYPES

> **Módulo**: Coiled Tubing  
> **Fase**: Arquitectura y Configuración de Digital Twins  
> **Duración estimada**: 1-2 semanas  
> **Prioridad**: 🔴 CRÍTICA (Fundamento de todo el módulo)

---

## 📋 ÍNDICE

1. [Arquitectura General](#arquitectura-general)
2. [Asset Types Definidos](#asset-types-definidos)
3. [Asset Templates](#asset-templates)
4. [Relaciones entre Assets](#relaciones-entre-assets)
5. [Schemas Detallados](#schemas-detallados)
6. [Implementación](#implementación)

---

## 1. ARQUITECTURA GENERAL

### 1.1 Principio de Diseño

**TODO en CT son Digital Twins (Assets)**, excepto entidades transaccionales como Jobs, BHA configs, Job Tickets.

```
┌─────────────────────────────────────────────────────────────────────┐
│                   ARQUITECTURA CT - DIGITAL TWINS                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐                                                │
│  │   Asset Types   │  ← Configuración en /asset-templates          │
│  └────────┬────────┘                                                │
│           │ define                                                  │
│           ↓                                                          │
│  ┌─────────────────┐         ┌──────────────┐                      │
│  │     Assets      │────────▶│ Telemetry    │ (asset_telemetry)    │
│  │ (Digital Twins) │         └──────────────┘                      │
│  └────────┬────────┘                                                │
│           │                                                          │
│           ├─── CT Unit (CT_UNIT)                                    │
│           ├─── CT Reel (CT_REEL)                                    │
│           ├─── Reel Section (CT_REEL_SECTION)                       │
│           ├─── BHA Component (CT_BHA_COMPONENT)                     │
│           ├─── Injector (CT_INJECTOR)                               │
│           ├─── BOP Stack (CT_BOP)                                   │
│           └─── Pump Unit (CT_PUMP)                                  │
│                                                                      │
│  ┌──────────────────────────────────────────┐                      │
│  │   Tablas Transaccionales (NO Assets)     │                      │
│  ├──────────────────────────────────────────┤                      │
│  │  • ct_jobs                                │                      │
│  │  • ct_job_operations                      │                      │
│  │  • ct_job_fluids                          │                      │
│  │  • ct_job_bha                             │                      │
│  │  • ct_bha_components                      │                      │
│  │  • ct_job_tickets                         │                      │
│  │  • ct_fatigue_cycles (histórico)          │                      │
│  └──────────────────────────────────────────┘                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 ¿Qué va en Assets vs. Tablas Dedicadas?

| Entidad | Tipo | Justificación |
|---------|------|---------------|
| **CT Unit** | ✅ Asset | Equipo físico con telemetría, estado, mantenimiento |
| **CT Reel** | ✅ Asset | Equipo físico con tracking de fatiga RT |
| **Reel Section** | ✅ Asset (child) | Sección física con telemetría de fatiga |
| **Injector** | ✅ Asset | Componente con telemetría (velocidad, fuerza) |
| **BOP Stack** | ✅ Asset | Componente con telemetría (presiones, estados) |
| **Pump Unit** | ✅ Asset | Componente con telemetría (presión, rate, SPM) |
| **BHA Component** | ✅ Asset | Herramienta física con tracking |
| **CT Job** | ❌ Tabla | Transacción operacional, no equipo físico |
| **Job Operations** | ❌ Tabla | Eventos históricos |
| **Job Fluids** | ❌ Tabla | Registros operacionales |
| **Job BHA Config** | ❌ Tabla | Configuración de trabajo |
| **Job Ticket** | ❌ Tabla | Documento administrativo |
| **Fatigue Cycles** | ❌ Tabla | Log histórico (auditoría) |

---

## 2. ASSET TYPES DEFINIDOS

### 2.1 CT_UNIT (Unidad de Coiled Tubing)

**Propósito**: Representa una unidad completa de CT (carrete, inyector, power pack, cabina, etc.)

#### Fixed Schema (Propiedades Estáticas)
```typescript
{
  // Identificación
  unitNumber: string;           // "CT-005"
  manufacturer: string;          // "NOV", "Baker Hughes", "Stewart & Stevenson"
  model: string;                 // "C-Series 350", "Atlas"
  serialNumber: string;          // "NOV-2024-CT-008"
  yearManufactured: number;      // 2022
  
  // Capacidades principales
  injectorCapacityLbs: number;   // 60000, 80000, 100000
  maxSpeedFtMin: number;         // 150
  pumpHp: number;                // 1000
  maxPressurePsi: number;        // 20000
  maxFlowRateBpm: number;        // 4.5
  
  // Certificaciones
  lastInspectionDate: Date;
  nextInspectionDate: Date;
  certificationDocs: string[];   // URLs a PDFs
}
```

#### Attribute Schema (Atributos Dinámicos)
```typescript
{
  // Estado operacional (editable)
  status: "AVAILABLE" | "IN_SERVICE" | "MAINTENANCE" | "OUT_OF_SERVICE";
  location: string;              // "Base Maturín", "Pozo PDC-15"
  currentJobId: string | null;   // UUID del job activo
  certificationStatus: "VALID" | "EXPIRED" | "PENDING";
  hoursService: number;          // Horas totales de servicio
  lastMaintenanceDate: Date;
}
```

#### Telemetry Schema
```typescript
{
  // Telemetría de inyector (si está en operación)
  injectorSpeed: { unit: "ft/min", type: "number" };
  injectorForce: { unit: "lbs", type: "number" };
  
  // Estado general
  engineRpm: { unit: "rpm", type: "number" };
  hydraulicPressure: { unit: "psi", type: "number" };
  operatingMode: { unit: "enum", type: "text" }; // "IDLE", "RIH", "POOH", "CIRCULATING"
}
```

#### Computed Fields
```typescript
[
  {
    name: "utilizationPercent",
    formula: "(hoursService / (365 * 24)) * 100",
    unit: "%",
    description: "Utilización anual"
  },
  {
    name: "isOperational",
    formula: "status === 'AVAILABLE' || status === 'IN_SERVICE'",
    unit: "boolean",
    description: "Si está operativo"
  }
]
```

---

### 2.2 CT_REEL (Carrete de Tubing)

**Propósito**: Representa un carrete de tubería continua con tracking de fatiga

#### Fixed Schema
```typescript
{
  // Identificación
  reelNumber: string;            // "R-2024-012"
  serialNumber: string;
  manufacturer: string;
  
  // Especificaciones del tubing
  outerDiameterIn: number;       // 1.75
  wallThicknessIn: number;       // 0.134
  innerDiameterIn: number;       // 1.482 (auto-calculado)
  steelGrade: "CT70" | "CT80" | "CT90" | "CT100" | "CT110";
  yieldStrengthPsi: number;      // 90000 para CT90
  
  // Dimensiones
  totalLengthFt: number;         // 18500
  usableLengthFt: number;        // 18500 (disminuye con cortes)
  weightPerFtLbs: number;        // 2.35
  
  // Histórico
  manufactureDate: Date;
  firstUseDate: Date;
}
```

#### Attribute Schema
```typescript
{
  // Estado
  status: "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "RETIRED";
  condition: "GOOD" | "FAIR" | "POOR" | "CRITICAL";
  ctUnitId: string | null;       // Asset ID del unit asignado
  
  // Fatiga global (calculado por reglas)
  fatiguePercentage: number;     // 0-100
  totalCycles: number;
  totalPressureCycles: number;
  lastFatigueCalculation: Date;
  
  // Cortes
  lastCutDate: Date | null;
  cutHistoryFt: number;          // Total de pies cortados
}
```

#### Telemetry Schema
```typescript
{
  // Fatiga en tiempo real (calculada por reglas)
  currentFatigue: { unit: "%", type: "number" };
  
  // Tracking de uso
  currentDepthFt: { unit: "ft", type: "number" };
  totalFeetRun: { unit: "ft", type: "number" };
}
```

#### Computed Fields
```typescript
[
  {
    name: "lifeRemainingPercent",
    formula: "100 - fatiguePercentage",
    unit: "%"
  },
  {
    name: "needsCutting",
    formula: "fatiguePercentage > 80",
    unit: "boolean"
  },
  {
    name: "internalCapacityBblPerFt",
    formula: "(innerDiameterIn * innerDiameterIn) / 1029.4",
    unit: "bbl/ft"
  }
]
```

---

### 2.3 CT_REEL_SECTION (Sección de Carrete)

**Propósito**: Subdivisión del reel para tracking granular de fatiga

#### Fixed Schema
```typescript
{
  sectionNumber: number;         // 1, 2, 3...
  startDepthFt: number;          // 0, 2000, 4000...
  endDepthFt: number;            // 2000, 4000, 6000...
  lengthFt: number;              // 2000
}
```

#### Attribute Schema
```typescript
{
  status: "ACTIVE" | "WARNING" | "CRITICAL" | "CUT";
  fatiguePercentage: number;     // 0-100
  bendingCycles: number;
  pressureCycles: number;
  combinedDamage: number;        // Regla de Miner
}
```

#### Telemetry Schema
```typescript
{
  currentStrain: { unit: "%", type: "number" };
  fatigueRate: { unit: "%/hr", type: "number" };
}
```

---

### 2.4 CT_BHA_COMPONENT (Componente de BHA)

**Propósito**: Herramienta individual del BHA (jars, motors, nozzles, etc.)

#### Fixed Schema
```typescript
{
  componentType: string;         // "JAR", "MOTOR", "NOZZLE", "CHECK_VALVE"
  componentName: string;         // "Jar Hidráulico 30K"
  manufacturer: string;
  model: string;
  serialNumber: string;
  
  // Dimensiones
  lengthFt: number;
  outerDiameterIn: number;
  innerDiameterIn: number;
  weightLbs: number;
  
  // Especificaciones técnicas
  specifications: {
    maxPressurePsi?: number;
    maxTensionLbs?: number;
    flowAreaIn2?: number;
    // ... específico por tipo
  };
}
```

#### Attribute Schema
```typescript
{
  status: "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "RETIRED";
  totalJobsRun: number;
  totalHoursRun: number;
  lastInspectionDate: Date;
  condition: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
}
```

---

### 2.5 CT_INJECTOR (Cabeza Inyectora)

**Propósito**: Componente crítico del CT unit con telemetría específica

#### Fixed Schema
```typescript
{
  manufacturer: string;
  model: string;
  serialNumber: string;
  capacityLbs: number;           // 60000, 80000, 100000
  maxSpeedFtMin: number;
  gripperType: string;           // "Chain", "Tractor"
}
```

#### Attribute Schema
```typescript
{
  status: "OPERATIONAL" | "FAULT" | "MAINTENANCE";
  totalCycles: number;
  hoursRun: number;
}
```

#### Telemetry Schema
```typescript
{
  speedFtMin: { unit: "ft/min", type: "number" };
  forceLbs: { unit: "lbs", type: "number" };
  gripperPressurePsi: { unit: "psi", type: "number" };
  chainTension: { unit: "lbs", type: "number" };
}
```

---

### 2.6 CT_BOP (BOP Stack)

#### Fixed Schema
```typescript
{
  manufacturer: string;
  model: string;
  serialNumber: string;
  workingPressurePsi: number;    // 5000, 10000, 15000
  components: string[];          // ["Blind Ram", "Pipe Ram", "Shear Ram", "Stripper"]
}
```

#### Attribute Schema
```typescript
{
  lastTestDate: Date;
  nextTestDue: Date;
  testPressureLow: number;       // 250-350 psi
  testPressureHigh: number;      // MASP + 500 psi
  certificationStatus: "VALID" | "EXPIRED";
}
```

#### Telemetry Schema
```typescript
{
  blindRamStatus: { unit: "enum", type: "text" }; // "OPEN", "CLOSED"
  pipeRamStatus: { unit: "enum", type: "text" };
  stripperPressurePsi: { unit: "psi", type: "number" };
  annulusPressurePsi: { unit: "psi", type: "number" };
}
```

---

### 2.7 CT_PUMP (Unidad de Bombeo)

#### Fixed Schema
```typescript
{
  manufacturer: string;
  model: string;
  serialNumber: string;
  horsePower: number;
  maxPressurePsi: number;
  maxFlowRateBpm: number;
}
```

#### Telemetry Schema
```typescript
{
  pumpPressurePsi: { unit: "psi", type: "number" };
  pumpRateBpm: { unit: "bpm", type: "number" };
  strokesPerMin: { unit: "spm", type: "number" };
  dischargeTempF: { unit: "°F", type: "number" };
  volumePumpedBbl: { unit: "bbl", type: "number" };
}
```

---

## 3. ASSET TEMPLATES

Los **Asset Templates** permiten crear configuraciones pre-definidas de assets compuestos.

### 3.1 Template: "CT Unit Completo"

**Propósito**: Crear un CT Unit con todos sus componentes en un solo paso

```typescript
{
  name: "CT Unit Completo - Configuración Estándar",
  description: "Unit completo con reel, inyector, BOP y bomba",
  rootAssetType: "CT_UNIT",
  components: [
    {
      assetType: "CT_INJECTOR",
      relationshipType: "HAS_COMPONENT",
      required: true,
      defaultProperties: {
        capacityLbs: 60000,
        maxSpeedFtMin: 150
      }
    },
    {
      assetType: "CT_BOP",
      relationshipType: "HAS_COMPONENT",
      required: true,
      defaultProperties: {
        workingPressurePsi: 10000
      }
    },
    {
      assetType: "CT_PUMP",
      relationshipType: "HAS_COMPONENT",
      required: true,
      defaultProperties: {
        horsePower: 1000,
        maxPressurePsi: 5000
      }
    },
    {
      assetType: "CT_REEL",
      relationshipType: "HAS_REEL",
      required: false,
      minCount: 0,
      maxCount: 3
    }
  ]
}
```

### 3.2 Template: "CT Reel con Secciones"

```typescript
{
  name: "CT Reel con Secciones de Tracking",
  description: "Reel dividido en 8 secciones de 2000 ft cada una",
  rootAssetType: "CT_REEL",
  components: [
    {
      assetType: "CT_REEL_SECTION",
      relationshipType: "HAS_SECTION",
      required: true,
      count: 8,
      generator: (index) => ({
        sectionNumber: index + 1,
        startDepthFt: index * 2000,
        endDepthFt: (index + 1) * 2000,
        lengthFt: 2000,
        fatiguePercentage: 0,
        bendingCycles: 0,
        pressureCycles: 0
      })
    }
  ]
}
```

---

## 4. RELACIONES ENTRE ASSETS

### 4.1 Jerarquía de Assets CT

```
CT_UNIT (root)
├── CT_INJECTOR (component)
├── CT_BOP (component)
├── CT_PUMP (component)
└── CT_REEL (has_reel, 0-N)
    └── CT_REEL_SECTION (has_section, 1-N)

CT_BHA_COMPONENT (standalone, pooled)
```

### 4.2 Tabla de Relaciones

| Parent Type | Relationship Type | Child Type | Cardinality |
|-------------|-------------------|------------|-------------|
| CT_UNIT | HAS_COMPONENT | CT_INJECTOR | 1:1 |
| CT_UNIT | HAS_COMPONENT | CT_BOP | 1:1 |
| CT_UNIT | HAS_COMPONENT | CT_PUMP | 1:2 (simple/duplex) |
| CT_UNIT | HAS_REEL | CT_REEL | 1:N (0-3) |
| CT_REEL | HAS_SECTION | CT_REEL_SECTION | 1:N (8-16) |

**NOTA**: La relación Unit ↔ Well (pozo) se maneja a nivel de **Job**, NO como relación de assets.

---

## 5. SCHEMAS DETALLADOS

### 5.1 Ejemplo Completo: Crear Asset Type CT_UNIT

**Endpoint**: `POST /api/v1/asset-types`

```json
{
  "code": "CT_UNIT",
  "name": "Coiled Tubing Unit",
  "description": "Unidad completa de Coiled Tubing con inyector, power pack y control",
  "category": "EQUIPMENT",
  "icon": "truck",
  "color": "#3b82f6",
  
  "fixedSchema": {
    "type": "object",
    "properties": {
      "unitNumber": { "type": "string", "maxLength": 50 },
      "manufacturer": { "type": "string", "maxLength": 100 },
      "model": { "type": "string", "maxLength": 100 },
      "serialNumber": { "type": "string", "maxLength": 100 },
      "yearManufactured": { "type": "integer", "minimum": 1990, "maximum": 2050 },
      "injectorCapacityLbs": { "type": "integer", "enum": [40000, 60000, 80000, 100000] },
      "maxSpeedFtMin": { "type": "integer", "minimum": 50, "maximum": 200 },
      "pumpHp": { "type": "integer", "minimum": 500, "maximum": 2000 },
      "maxPressurePsi": { "type": "integer", "minimum": 5000, "maximum": 25000 },
      "maxFlowRateBpm": { "type": "number", "minimum": 0.5, "maximum": 10 }
    },
    "required": ["unitNumber", "manufacturer", "injectorCapacityLbs"]
  },
  
  "attributeSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": ["AVAILABLE", "IN_SERVICE", "MAINTENANCE", "OUT_OF_SERVICE"],
        "default": "AVAILABLE"
      },
      "location": { "type": "string", "maxLength": 200 },
      "currentJobId": { "type": "string", "format": "uuid", "nullable": true },
      "certificationStatus": {
        "type": "string",
        "enum": ["VALID", "EXPIRED", "PENDING"],
        "default": "PENDING"
      },
      "hoursService": { "type": "number", "minimum": 0, "default": 0 },
      "lastMaintenanceDate": { "type": "string", "format": "date-time" }
    }
  },
  
  "telemetrySchema": {
    "type": "object",
    "properties": {
      "injectorSpeed": { "unit": "ft/min", "dataType": "number", "min": 0, "max": 200 },
      "injectorForce": { "unit": "lbs", "dataType": "number", "min": -100000, "max": 100000 },
      "engineRpm": { "unit": "rpm", "dataType": "number", "min": 0, "max": 3000 },
      "hydraulicPressure": { "unit": "psi", "dataType": "number", "min": 0, "max": 3000 },
      "operatingMode": { "unit": "enum", "dataType": "text", "enum": ["IDLE", "RIH", "POOH", "CIRCULATING", "STOPPED"] }
    }
  },
  
  "computedFields": [
    {
      "name": "utilizationPercent",
      "expression": "(attributes.hoursService / (365 * 24)) * 100",
      "unit": "%",
      "description": "Utilización anual del equipo"
    },
    {
      "name": "isOperational",
      "expression": "attributes.status === 'AVAILABLE' || attributes.status === 'IN_SERVICE'",
      "dataType": "boolean",
      "description": "Si el equipo está operativo"
    }
  ]
}
```

---

## 6. IMPLEMENTACIÓN

### 6.1 Checklist de Creación de Asset Types

- [ ] **CT_UNIT**: Unidad completa
- [ ] **CT_REEL**: Carrete de tubing
- [ ] **CT_REEL_SECTION**: Sección de reel
- [ ] **CT_BHA_COMPONENT**: Componentes de BHA
- [ ] **CT_INJECTOR**: Cabeza inyectora
- [ ] **CT_BOP**: BOP Stack
- [ ] **CT_PUMP**: Unidad de bombeo

### 6.2 Orden de Creación

1. Crear Asset Types base (sin dependencias)
2. Crear Asset Templates
3. Probar creación de assets vía UI `/asset-templates`
4. Validar relaciones parent-child
5. Seeds de datos de prueba

### 6.3 Scripts de Apoyo

**Script**: `create-ct-asset-types.ts`

```typescript
// Ubicación: /src/backend/scripts/create-ct-asset-types.ts
import { createAssetType } from '../modules/infrastructure/assets/assets.service';

async function main() {
  // Crear CT_UNIT
  await createAssetType({
    code: 'CT_UNIT',
    name: 'Coiled Tubing Unit',
    // ... (ver JSON arriba)
  });
  
  // Crear CT_REEL
  await createAssetType({
    code: 'CT_REEL',
    name: 'Coiled Tubing Reel',
    // ...
  });
  
  // ... resto de tipos
  
  console.log('✅ Asset Types CT creados exitosamente');
}

main();
```

**Ejecución**: `npm run script:create-ct-asset-types`

---

## 📊 CRITERIOS DE ÉXITO

- ✅ 7 Asset Types CT creados y validados
- ✅ 2 Asset Templates funcionales
- ✅ Relaciones parent-child probadas
- ✅ Schemas validados con datos reales
- ✅ UI en `/asset-types` muestra todos los tipos CT
- ✅ Documentación completa de cada tipo

---

**Siguiente bloque**: [02_EDGE_GATEWAY_INGESTA.md](./02_EDGE_GATEWAY_INGESTA.md) →
