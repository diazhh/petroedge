# ARQUITECTURA MODULAR CON GEMELOS DIGITALES Y MOTOR DE REGLAS

> **⚠️ NOTA IMPORTANTE**: Este documento describe la arquitectura conceptual original.  
> **Para la implementación actual con Eclipse Ditto**, consultar: `10_ECLIPSE_DITTO_RULE_ENGINE_ADVANCED.md`

## 1. Visión General

Este documento define la arquitectura reorganizada del sistema SCADA+ERP que permite:

1. **Modularidad de negocio**: Empresas pueden contratar solo los módulos que necesitan (Well Testing, Drilling, Coiled Tubing, etc.)
2. **Infraestructura común**: Gestión de campos, pozos, equipos es un módulo base requerido por todos
3. **Gemelos Digitales**: Todas las entidades (pozos, herramientas, equipos) son representaciones digitales con atributos dinámicos y telemetrías - **IMPLEMENTADO CON ECLIPSE DITTO**
4. **Motor de Reglas Visual**: Reglas configurables mediante nodos conectables que reaccionan a cambios de telemetría/atributos - **IMPLEMENTADO CON ARQUITECTURA THINGSBOARD-INSPIRED**
5. **Campos Calculados**: Propiedades derivadas que se recalculan automáticamente

---

## 2. Arquitectura de Módulos

### 2.1 Reorganización de Módulos

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA MODULAR SCADA+ERP                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    MÓDULOS OPERACIONALES (Opcionales)                    │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │   │
│  │  │   Well    │ │ Drilling  │ │  Coiled   │ │Production │ │Yacimientos│  │   │
│  │  │  Testing  │ │Operations │ │  Tubing   │ │Management │ │(Reservoir)│  │   │
│  │  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘  │   │
│  │        │             │             │             │             │         │   │
│  └────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────┘   │
│           │             │             │             │             │              │
│           ▼             ▼             ▼             ▼             ▼              │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    MÓDULO BASE: INFRAESTRUCTURA                          │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │   │
│  │  │  Assets   │ │  Digital  │ │   Rule    │ │ Telemetry │ │  Alarms   │  │   │
│  │  │ (Pozos,   │ │   Twins   │ │  Engine   │ │  Service  │ │ & Events  │  │   │
│  │  │ Campos)   │ │ Framework │ │ (Visual)  │ │           │ │           │  │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         CORE PLATFORM                                    │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │   │
│  │  │   Auth    │ │  Tenants  │ │   Users   │ │   Audit   │ │   Kafka   │  │   │
│  │  │   RBAC    │ │           │ │   Roles   │ │   Logs    │ │   Redis   │  │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Dependencias de Módulos

| Módulo | Tipo | Dependencias | Descripción |
|--------|------|--------------|-------------|
| **Core Platform** | Obligatorio | - | Auth, Tenants, Kafka, Redis |
| **Infraestructura** | Obligatorio | Core | Assets, Digital Twins, Rule Engine, Telemetry |
| **Well Testing** | Opcional | Infraestructura | Pruebas de pozo, IPR/VLP, Nodal Analysis |
| **Drilling** | Opcional | Infraestructura | Perforación, T&D, MSE, Kill Sheet |
| **Coiled Tubing** | Opcional | Infraestructura | CT Jobs, Fatiga, Job Tickets |
| **Production** | Opcional | Infraestructura | ESP, Gas Lift, Optimización |
| **Yacimientos** | Opcional | Infraestructura | PVT, DCA, Balance Materiales, Reservas |

### 2.3 Licenciamiento por Módulo

```typescript
// Ejemplo de configuración de licencia
interface TenantLicense {
  tenantId: string;
  modules: {
    infrastructure: true;     // Siempre incluido
    wellTesting: boolean;
    drilling: boolean;
    coiledTubing: boolean;
    production: boolean;
    yacimientos: boolean;
    // ERP modules
    inventory: boolean;
    finance: boolean;
    hr: boolean;
    maintenance: boolean;
  };
  limits: {
    maxWells: number;
    maxUsers: number;
    maxAssets: number;
    telemetryRetentionDays: number;
  };
  expiresAt: Date;
}
```

---

## 3. Módulo Infraestructura (Base)

### 3.1 Entidades Base (Assets)

El módulo de infraestructura maneja todas las entidades físicas y lógicas del sistema:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    JERARQUÍA DE ASSETS                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                         ASSET TYPES                                 │    │
│  │                                                                     │    │
│  │   GEOGRÁFICOS           POZOS            EQUIPOS         HERRAMIENTAS│    │
│  │   ─────────────         ─────            ───────         ────────────│    │
│  │   • Basin               • Well           • CT Reel       • BHA       │    │
│  │   • Field               • Completion     • CT Unit       • Motor     │    │
│  │   • Reservoir           • Zone           • Rig           • MWD/LWD   │    │
│  │   • Lease               • Perforation    • ESP Unit      • Bit       │    │
│  │   • Pad                 • Artificial     • Pump          • Stabilizer│    │
│  │                           Lift System    • Compressor    • Tool      │    │
│  │                                                                     │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Estructura de Carpetas Backend

```
src/modules/
├── core/                           # Plataforma base
│   ├── auth/
│   ├── tenants/
│   ├── users/
│   └── config/
│
├── infrastructure/                 # MÓDULO BASE (NUEVO)
│   ├── assets/                     # Gestión genérica de activos
│   │   ├── asset.schema.ts
│   │   ├── asset.repository.ts
│   │   ├── asset.service.ts
│   │   ├── asset.controller.ts
│   │   └── asset.routes.ts
│   ├── digital-twins/              # Framework de gemelos digitales
│   │   ├── digital-twin.schema.ts
│   │   ├── attributes.service.ts
│   │   ├── telemetry.service.ts
│   │   └── computed-fields.service.ts
│   ├── rule-engine/                # Motor de reglas visual
│   │   ├── rule.schema.ts
│   │   ├── node-types/
│   │   ├── rule-executor.service.ts
│   │   └── rule-editor.controller.ts
│   ├── telemetry/                  # Servicio de telemetría
│   │   ├── telemetry.schema.ts
│   │   ├── telemetry.service.ts
│   │   └── telemetry.routes.ts
│   └── alarms/                     # Alarmas y eventos
│       ├── alarm.schema.ts
│       └── alarm.service.ts
│
├── well-testing/                   # Módulo opcional
├── drilling/                       # Módulo opcional
├── coiled-tubing/                  # Módulo opcional
├── production/                     # Módulo opcional
└── yacimientos/                    # Módulo opcional (análisis avanzado)
```

---

## 4. Arquitectura de Gemelos Digitales

### 4.1 Concepto de Digital Twin

Cada entidad del sistema es un **Gemelo Digital** con:

1. **Propiedades Fijas** (schema estático): Definidas en el modelo de datos
2. **Atributos Dinámicos**: Propiedades configurables por el usuario
3. **Telemetrías**: Datos de sensores en tiempo real
4. **Campos Calculados**: Valores derivados de reglas
5. **Estado**: Estado actual del activo
6. **Historial**: Cambios a lo largo del tiempo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DIGITAL TWIN ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                         DIGITAL TWIN                                │    │
│  │                                                                     │    │
│  │   ┌─────────────────┐    ┌─────────────────┐    ┌───────────────┐  │    │
│  │   │  FIXED PROPS    │    │   ATTRIBUTES    │    │  TELEMETRIES  │  │    │
│  │   │  (Schema)       │    │   (Dynamic)     │    │  (Real-time)  │  │    │
│  │   │                 │    │                 │    │               │  │    │
│  │   │ • id            │    │ • custom_field1 │    │ • pressure    │  │    │
│  │   │ • name          │    │ • manufacturer  │    │ • temperature │  │    │
│  │   │ • type          │    │ • model_number  │    │ • flow_rate   │  │    │
│  │   │ • status        │    │ • install_date  │    │ • rpm         │  │    │
│  │   │ • location      │    │ • serial_no     │    │ • vibration   │  │    │
│  │   └────────┬────────┘    └────────┬────────┘    └───────┬───────┘  │    │
│  │            │                      │                      │          │    │
│  │            └──────────────────────┼──────────────────────┘          │    │
│  │                                   │                                 │    │
│  │                                   ▼                                 │    │
│  │                     ┌─────────────────────────┐                     │    │
│  │                     │    COMPUTED FIELDS      │                     │    │
│  │                     │    (Rule-based)         │                     │    │
│  │                     │                         │                     │    │
│  │                     │ • efficiency (%)        │                     │    │
│  │                     │ • health_score          │                     │    │
│  │                     │ • predicted_failure     │                     │    │
│  │                     │ • optimum_rate          │                     │    │
│  │                     └─────────────────────────┘                     │    │
│  │                                                                     │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Modelo de Datos: Digital Twins

```sql
-- Tipos de activos (configurables por tenant)
CREATE TABLE asset_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    code VARCHAR(50) NOT NULL,           -- WELL, CT_REEL, RIG, ESP_UNIT
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),                     -- Para UI
    color VARCHAR(20),                    -- Para UI
    
    -- Herencia
    parent_type_id UUID REFERENCES asset_types(id),
    
    -- Schema de propiedades fijas
    fixed_schema JSONB NOT NULL DEFAULT '{}',
    
    -- Schema de atributos dinámicos permitidos
    attribute_schema JSONB NOT NULL DEFAULT '{}',
    
    -- Schema de telemetrías esperadas
    telemetry_schema JSONB NOT NULL DEFAULT '{}',
    
    -- Campos calculados definidos
    computed_fields JSONB NOT NULL DEFAULT '[]',
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, code)
);

-- Activos (instancias de Digital Twins)
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    asset_type_id UUID NOT NULL REFERENCES asset_types(id),
    
    -- Identificación
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Jerarquía
    parent_asset_id UUID REFERENCES assets(id),
    
    -- Ubicación geográfica
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    elevation_ft DECIMAL(10, 2),
    
    -- Estado
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    -- ACTIVE, INACTIVE, MAINTENANCE, RETIRED, FAILED
    
    -- Propiedades fijas (según schema del tipo)
    properties JSONB NOT NULL DEFAULT '{}',
    
    -- Atributos dinámicos (personalizables)
    attributes JSONB NOT NULL DEFAULT '{}',
    
    -- Campos calculados (cache)
    computed_values JSONB NOT NULL DEFAULT '{}',
    computed_at TIMESTAMPTZ,
    
    -- Estado actual de telemetrías (cache de último valor)
    current_telemetry JSONB NOT NULL DEFAULT '{}',
    telemetry_updated_at TIMESTAMPTZ,
    
    -- Metadatos
    tags TEXT[],
    metadata JSONB,
    
    -- Auditoría
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, code)
);

-- Historial de atributos (para auditoría)
CREATE TABLE asset_attribute_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id),
    
    attribute_key VARCHAR(100) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT
);

-- Telemetrías (TimescaleDB hypertable)
CREATE TABLE asset_telemetry (
    time TIMESTAMPTZ NOT NULL,
    asset_id UUID NOT NULL REFERENCES assets(id),
    
    -- Clave de telemetría (pressure, temperature, flow_rate, etc.)
    telemetry_key VARCHAR(100) NOT NULL,
    
    -- Valor numérico
    value_numeric DECIMAL(20, 6),
    
    -- Valor texto (para telemetrías no numéricas)
    value_text TEXT,
    
    -- Calidad del dato
    quality VARCHAR(20) DEFAULT 'GOOD',
    -- GOOD, BAD, UNCERTAIN, SIMULATED
    
    -- Fuente
    source VARCHAR(50),  -- SENSOR, MANUAL, CALCULATED, IMPORTED
    source_id VARCHAR(100),
    
    -- Unidad de medida
    unit VARCHAR(20),
    
    PRIMARY KEY (time, asset_id, telemetry_key)
);

-- Convertir a hypertable
SELECT create_hypertable('asset_telemetry', 'time', 
    chunk_time_interval => INTERVAL '1 day');

-- Índices
CREATE INDEX idx_asset_telemetry_asset ON asset_telemetry(asset_id, time DESC);
CREATE INDEX idx_asset_telemetry_key ON asset_telemetry(telemetry_key, time DESC);

-- Política de retención (configurable por tenant/tipo)
SELECT add_retention_policy('asset_telemetry', INTERVAL '1 year');

-- Agregación continua para históricos
CREATE MATERIALIZED VIEW asset_telemetry_hourly
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', time) AS bucket,
    asset_id,
    telemetry_key,
    AVG(value_numeric) as avg_value,
    MIN(value_numeric) as min_value,
    MAX(value_numeric) as max_value,
    COUNT(*) as sample_count
FROM asset_telemetry
GROUP BY bucket, asset_id, telemetry_key;
```

### 4.3 Ejemplo: Pozo como Digital Twin

```typescript
// Definición del tipo de activo "Well"
const wellAssetType = {
  code: 'WELL',
  name: 'Pozo',
  
  // Propiedades fijas (schema estático)
  fixedSchema: {
    wellType: { type: 'enum', values: ['PRODUCER', 'INJECTOR', 'OBSERVATION'] },
    status: { type: 'enum', values: ['PRODUCING', 'SHUT_IN', 'ABANDONED'] },
    liftMethod: { type: 'enum', values: ['FLOWING', 'ESP', 'GAS_LIFT', 'ROD_PUMP'] },
    totalDepthMdFt: { type: 'number', unit: 'ft' },
    totalDepthTvdFt: { type: 'number', unit: 'ft' },
    spudDate: { type: 'date' },
    completionDate: { type: 'date' },
  },
  
  // Atributos dinámicos (configurables)
  attributeSchema: {
    tubingSize: { type: 'number', unit: 'in', default: 2.875 },
    casingSize: { type: 'number', unit: 'in', default: 7 },
    perforationDepth: { type: 'number', unit: 'ft' },
    reservoirPressure: { type: 'number', unit: 'psi' },
    bubblePoint: { type: 'number', unit: 'psi' },
    oilApi: { type: 'number', unit: 'API' },
    gor: { type: 'number', unit: 'scf/stb' },
    waterCut: { type: 'number', unit: '%' },
    // Cualquier atributo adicional que el usuario quiera agregar
  },
  
  // Telemetrías esperadas
  telemetrySchema: {
    tubingPressure: { type: 'number', unit: 'psi', frequency: '1min' },
    casingPressure: { type: 'number', unit: 'psi', frequency: '1min' },
    flowingBhp: { type: 'number', unit: 'psi', frequency: '5min' },
    oilRate: { type: 'number', unit: 'bopd', frequency: '1hr' },
    waterRate: { type: 'number', unit: 'bwpd', frequency: '1hr' },
    gasRate: { type: 'number', unit: 'mscfd', frequency: '1hr' },
    wellheadTemp: { type: 'number', unit: 'F', frequency: '5min' },
    // ESP telemetrías
    espAmps: { type: 'number', unit: 'A', frequency: '1min' },
    espFrequency: { type: 'number', unit: 'Hz', frequency: '1min' },
    intakeTemp: { type: 'number', unit: 'F', frequency: '5min' },
    intakePressure: { type: 'number', unit: 'psi', frequency: '5min' },
    motorTemp: { type: 'number', unit: 'F', frequency: '5min' },
    vibrationX: { type: 'number', unit: 'g', frequency: '1min' },
    vibrationY: { type: 'number', unit: 'g', frequency: '1min' },
  },
  
  // Campos calculados
  computedFields: [
    {
      key: 'liquidRate',
      name: 'Tasa Líquida',
      unit: 'blpd',
      formula: 'telemetry.oilRate + telemetry.waterRate',
      recalculateOn: ['telemetry.oilRate', 'telemetry.waterRate'],
    },
    {
      key: 'actualWaterCut',
      name: 'Corte de Agua Actual',
      unit: '%',
      formula: '(telemetry.waterRate / (telemetry.oilRate + telemetry.waterRate)) * 100',
      recalculateOn: ['telemetry.oilRate', 'telemetry.waterRate'],
    },
    {
      key: 'drawdown',
      name: 'Drawdown',
      unit: 'psi',
      formula: 'attributes.reservoirPressure - telemetry.flowingBhp',
      recalculateOn: ['attributes.reservoirPressure', 'telemetry.flowingBhp'],
    },
    {
      key: 'productivityIndex',
      name: 'Índice de Productividad',
      unit: 'bopd/psi',
      formula: 'telemetry.oilRate / computed.drawdown',
      recalculateOn: ['telemetry.oilRate', 'computed.drawdown'],
    },
    {
      key: 'espEfficiency',
      name: 'Eficiencia ESP',
      unit: '%',
      formula: 'rules.calculateEspEfficiency(asset)',  // Usa regla compleja
      recalculateOn: ['telemetry.espAmps', 'telemetry.intakePressure', 'telemetry.oilRate'],
    },
  ],
};
```

### 4.4 Ejemplo: CT Reel como Digital Twin

```typescript
const ctReelAssetType = {
  code: 'CT_REEL',
  name: 'Carrete de Coiled Tubing',
  
  fixedSchema: {
    odInches: { type: 'number', unit: 'in' },
    wallThickness: { type: 'number', unit: 'in' },
    materialGrade: { type: 'enum', values: ['CT-70', 'CT-80', 'CT-90', 'CT-110'] },
    yieldStrength: { type: 'number', unit: 'psi' },
    originalLengthFt: { type: 'number', unit: 'ft' },
  },
  
  attributeSchema: {
    currentLengthFt: { type: 'number', unit: 'ft' },
    cutRemovedFt: { type: 'number', unit: 'ft' },
    maxFatiguePercent: { type: 'number', unit: '%', default: 80 },
    workingPressure: { type: 'number', unit: 'psi' },
    burstPressure: { type: 'number', unit: 'psi' },
    manufactureDate: { type: 'date' },
    lastInspectionDate: { type: 'date' },
    totalJobs: { type: 'number' },
    currentLocation: { type: 'string' },
  },
  
  telemetrySchema: {
    // Durante operación
    depth: { type: 'number', unit: 'ft' },
    speed: { type: 'number', unit: 'ft/min' },
    weightIndicator: { type: 'number', unit: 'lbs' },
    pumpPressure: { type: 'number', unit: 'psi' },
    wellheadPressure: { type: 'number', unit: 'psi' },
    // Fatiga por sección
    currentFatigue: { type: 'number', unit: '%' },
  },
  
  computedFields: [
    {
      key: 'idInches',
      formula: 'properties.odInches - 2 * properties.wallThickness',
    },
    {
      key: 'lengthRemainingPct',
      formula: '(attributes.currentLengthFt / properties.originalLengthFt) * 100',
    },
    {
      key: 'fatigueStatus',
      formula: `
        telemetry.currentFatigue >= attributes.maxFatiguePercent ? 'CRITICAL' :
        telemetry.currentFatigue >= attributes.maxFatiguePercent * 0.9 ? 'WARNING' : 'OK'
      `,
    },
    {
      key: 'predictedRemainingLife',
      formula: 'rules.calculateRemainingLife(asset)',
    },
  ],
};
```

---

## 5. Motor de Reglas Visual

### 5.1 Concepto

El Motor de Reglas permite crear lógica de negocio mediante un editor visual de nodos (similar a Node-RED), donde:

- **Nodos de entrada**: Triggers (cambio de telemetría, cambio de atributo, evento, schedule)
- **Nodos de proceso**: Transformaciones, cálculos, condiciones
- **Nodos de salida**: Acciones (actualizar campo, enviar alarma, llamar API, enviar notificación)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MOTOR DE REGLAS VISUAL                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐   │
│  │  TRIGGER   │────▶│  CONDITION │────▶│ TRANSFORM  │────▶│   ACTION   │   │
│  │            │     │            │     │            │     │            │   │
│  │ Telemetry  │     │    IF      │     │  Calculate │     │ Set Field  │   │
│  │  Change    │     │  pressure  │     │  efficiency│     │            │   │
│  │            │     │   > 500    │     │            │     │ computed.  │   │
│  └────────────┘     └────────────┘     └────────────┘     │ efficiency │   │
│                                                           └────────────┘   │
│                                                                  │          │
│                                              ┌───────────────────┘          │
│                                              ▼                              │
│                                        ┌────────────┐                       │
│                                        │   ACTION   │                       │
│                                        │            │                       │
│                                        │ Send Alarm │                       │
│                                        │ if < 50%   │                       │
│                                        └────────────┘                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Tipos de Nodos

```typescript
// Tipos de nodos disponibles
enum NodeType {
  // TRIGGERS (Entradas)
  TELEMETRY_CHANGE = 'telemetry_change',      // Cuando cambia una telemetría
  ATTRIBUTE_CHANGE = 'attribute_change',       // Cuando cambia un atributo
  STATUS_CHANGE = 'status_change',             // Cuando cambia el estado
  SCHEDULE = 'schedule',                       // Cron-based trigger
  EVENT = 'event',                             // Evento externo
  MANUAL = 'manual',                           // Ejecución manual
  
  // CONDITIONS (Lógica)
  IF = 'if',                                   // Condición simple
  SWITCH = 'switch',                           // Múltiples condiciones
  AND = 'and',                                 // Y lógico
  OR = 'or',                                   // O lógico
  NOT = 'not',                                 // Negación
  
  // TRANSFORMATIONS (Proceso)
  MATH = 'math',                               // Operaciones matemáticas
  FORMULA = 'formula',                         // Fórmula custom
  AGGREGATE = 'aggregate',                     // Agregación (avg, sum, etc.)
  LOOKUP = 'lookup',                           // Buscar en otra entidad
  SCRIPT = 'script',                           // JavaScript custom
  
  // DATA ACCESS
  GET_TELEMETRY = 'get_telemetry',            // Obtener telemetría
  GET_ATTRIBUTE = 'get_attribute',            // Obtener atributo
  GET_ASSET = 'get_asset',                    // Obtener otro asset
  QUERY = 'query',                            // Query a DB
  
  // ACTIONS (Salidas)
  SET_COMPUTED = 'set_computed',              // Actualizar campo calculado
  SET_ATTRIBUTE = 'set_attribute',            // Actualizar atributo
  SET_STATUS = 'set_status',                  // Cambiar estado
  CREATE_ALARM = 'create_alarm',              // Crear alarma
  SEND_NOTIFICATION = 'send_notification',    // Enviar notificación
  CALL_API = 'call_api',                      // Llamar API externa
  PUBLISH_KAFKA = 'publish_kafka',            // Publicar a Kafka
  LOG = 'log',                                // Log para debugging
}

// Estructura de una regla
interface Rule {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  
  // A qué tipos de assets aplica
  appliesToAssetTypes: string[];  // ['WELL', 'CT_REEL']
  
  // A qué assets específicos (opcional, vacío = todos del tipo)
  appliesToAssets?: string[];
  
  // Definición de nodos
  nodes: RuleNode[];
  
  // Conexiones entre nodos
  connections: RuleConnection[];
  
  // Estado
  isActive: boolean;
  priority: number;  // Orden de ejecución
  
  // Configuración
  config: {
    executeOnStartup: boolean;
    debounceMs: number;        // Evitar ejecución excesiva
    maxExecutionsPerMinute: number;
    timeout: number;           // Timeout de ejecución
  };
  
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RuleNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };  // Para el editor visual
  
  config: Record<string, any>;  // Configuración específica del tipo
  
  // Puertos de entrada/salida
  inputs: string[];
  outputs: string[];
}

interface RuleConnection {
  id: string;
  fromNode: string;
  fromPort: string;
  toNode: string;
  toPort: string;
}
```

### 5.3 Modelo de Datos: Reglas

```sql
-- Reglas
CREATE TABLE rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- A qué aplica
    applies_to_asset_types TEXT[] NOT NULL,
    applies_to_assets UUID[],  -- NULL = todos del tipo
    
    -- Definición visual
    nodes JSONB NOT NULL,
    connections JSONB NOT NULL,
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    
    -- Configuración
    config JSONB NOT NULL DEFAULT '{
        "executeOnStartup": false,
        "debounceMs": 1000,
        "maxExecutionsPerMinute": 60,
        "timeout": 5000
    }',
    
    -- Estadísticas
    execution_count BIGINT DEFAULT 0,
    last_executed_at TIMESTAMPTZ,
    last_error TEXT,
    
    -- Auditoría
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, name)
);

-- Logs de ejecución de reglas
CREATE TABLE rule_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES rules(id),
    asset_id UUID NOT NULL REFERENCES assets(id),
    
    -- Trigger
    trigger_type VARCHAR(50) NOT NULL,
    trigger_data JSONB,
    
    -- Resultado
    success BOOLEAN NOT NULL,
    duration_ms INTEGER,
    output_data JSONB,
    error_message TEXT,
    
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hypertable para logs
SELECT create_hypertable('rule_executions', 'executed_at',
    chunk_time_interval => INTERVAL '1 day');

-- Índices
CREATE INDEX idx_rule_executions_rule ON rule_executions(rule_id, executed_at DESC);
CREATE INDEX idx_rule_executions_asset ON rule_executions(asset_id, executed_at DESC);

-- Retención de 30 días para logs de ejecución
SELECT add_retention_policy('rule_executions', INTERVAL '30 days');
```

### 5.4 Ejemplo: Regla de Eficiencia ESP

```json
{
  "id": "rule-esp-efficiency",
  "name": "Calcular Eficiencia ESP",
  "description": "Calcula la eficiencia del sistema ESP cuando cambian las telemetrías",
  "appliesToAssetTypes": ["WELL"],
  "nodes": [
    {
      "id": "trigger-1",
      "type": "telemetry_change",
      "position": { "x": 100, "y": 100 },
      "config": {
        "telemetryKeys": ["espAmps", "intakePressure", "oilRate"]
      },
      "outputs": ["out"]
    },
    {
      "id": "condition-1",
      "type": "if",
      "position": { "x": 300, "y": 100 },
      "config": {
        "expression": "asset.properties.liftMethod === 'ESP'"
      },
      "inputs": ["in"],
      "outputs": ["true", "false"]
    },
    {
      "id": "formula-1",
      "type": "formula",
      "position": { "x": 500, "y": 50 },
      "config": {
        "formula": "calculateEspEfficiency(telemetry.espAmps, telemetry.intakePressure, telemetry.oilRate, attributes.espRatedAmps)"
      },
      "inputs": ["in"],
      "outputs": ["result"]
    },
    {
      "id": "set-computed-1",
      "type": "set_computed",
      "position": { "x": 700, "y": 50 },
      "config": {
        "field": "espEfficiency",
        "unit": "%"
      },
      "inputs": ["value"]
    },
    {
      "id": "condition-2",
      "type": "if",
      "position": { "x": 700, "y": 150 },
      "config": {
        "expression": "value < 50"
      },
      "inputs": ["value"],
      "outputs": ["true", "false"]
    },
    {
      "id": "alarm-1",
      "type": "create_alarm",
      "position": { "x": 900, "y": 150 },
      "config": {
        "severity": "WARNING",
        "message": "Eficiencia ESP baja: {value}%",
        "alarmType": "ESP_LOW_EFFICIENCY"
      },
      "inputs": ["in"]
    }
  ],
  "connections": [
    { "fromNode": "trigger-1", "fromPort": "out", "toNode": "condition-1", "toPort": "in" },
    { "fromNode": "condition-1", "fromPort": "true", "toNode": "formula-1", "toPort": "in" },
    { "fromNode": "formula-1", "fromPort": "result", "toNode": "set-computed-1", "toPort": "value" },
    { "fromNode": "formula-1", "fromPort": "result", "toNode": "condition-2", "toPort": "value" },
    { "fromNode": "condition-2", "fromPort": "true", "toNode": "alarm-1", "toPort": "in" }
  ]
}
```

---

## 6. Flujo de Telemetría

### 6.1 Arquitectura de Ingesta

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         FLUJO DE TELEMETRÍA                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────┐                                                               │
│  │   SENSORES   │  Modbus/OPC-UA/MQTT                                           │
│  │   & PLCs     │──────────────────┐                                            │
│  └──────────────┘                  │                                            │
│                                    ▼                                            │
│                           ┌─────────────────┐                                   │
│                           │   EDGE GATEWAY   │                                   │
│                           │  (Protocolo →    │                                   │
│                           │   Normalización) │                                   │
│                           └────────┬────────┘                                   │
│                                    │                                            │
│                                    ▼                                            │
│   ┌───────────────────────────────────────────────────────────────────────┐    │
│   │                           KAFKA BROKER                                  │    │
│   │                                                                         │    │
│   │  Topic: telemetry.raw.{assetType}                                      │    │
│   │  Message: {assetId, timestamp, key, value, unit, quality, source}      │    │
│   │                                                                         │    │
│   └───────────────────────────────────────────────────────────────────────┘    │
│                                    │                                            │
│          ┌─────────────────────────┼─────────────────────────┐                 │
│          │                         │                         │                 │
│          ▼                         ▼                         ▼                 │
│   ┌─────────────┐           ┌─────────────┐           ┌─────────────┐         │
│   │ PERSISTENCE │           │    RULE     │           │  WEBSOCKET  │         │
│   │   SERVICE   │           │   ENGINE    │           │   GATEWAY   │         │
│   │             │           │             │           │             │         │
│   │ Kafka →     │           │ Evaluar     │           │ Kafka →     │         │
│   │ TimescaleDB │           │ reglas      │           │ Broadcast   │         │
│   │             │           │ activas     │           │             │         │
│   └──────┬──────┘           └──────┬──────┘           └──────┬──────┘         │
│          │                         │                         │                 │
│          ▼                         ▼                         ▼                 │
│   ┌─────────────┐           ┌─────────────┐           ┌─────────────┐         │
│   │ TimescaleDB │           │    REDIS    │           │  FRONTEND   │         │
│   │  (histórico)│◄─────────▶│   (cache)   │           │ (real-time) │         │
│   └─────────────┘           └─────────────┘           └─────────────┘         │
│                                    │                                            │
│                                    │ Triggers                                   │
│                                    ▼                                            │
│                           ┌─────────────────┐                                   │
│                           │  COMPUTED FIELD │                                   │
│                           │    UPDATER      │                                   │
│                           │                 │                                   │
│                           │ Recalcular      │                                   │
│                           │ campos cuando   │                                   │
│                           │ cambian datos   │                                   │
│                           └────────┬────────┘                                   │
│                                    │                                            │
│                                    ▼                                            │
│                           ┌─────────────────┐                                   │
│                           │  assets.        │                                   │
│                           │  computed_values│                                   │
│                           │  (cache en DB)  │                                   │
│                           └─────────────────┘                                   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Asociación de Telemetría a Assets

Los datos de telemetría se asocian a assets mediante:

1. **Asset ID directo**: El sensor envía el ID del asset
2. **Mapeo por código**: El sensor envía un código que se mapea al asset
3. **Regla de asociación**: Reglas que determinan a qué asset pertenece un dato

```typescript
// Configuración de mapeo de telemetría
interface TelemetryMapping {
  id: string;
  tenantId: string;
  
  // Fuente de datos
  source: {
    type: 'MODBUS' | 'OPC_UA' | 'MQTT' | 'API';
    address: string;  // IP, topic, endpoint
    register?: string;  // Para Modbus
    nodeId?: string;    // Para OPC-UA
  };
  
  // A qué asset se asocia
  targetAssetId?: string;        // Directo
  targetAssetCode?: string;      // Por código
  targetAssetRule?: string;      // ID de regla de mapeo
  
  // Clave de telemetría
  telemetryKey: string;
  
  // Transformación
  transform?: {
    type: 'LINEAR' | 'FORMULA' | 'LOOKUP';
    config: any;
  };
  
  // Unidad
  unit: string;
  
  // Polling (si aplica)
  pollingIntervalMs?: number;
  
  isActive: boolean;
}

// Ejemplo: Mapeo de sensor de presión a pozo
const pressureSensorMapping: TelemetryMapping = {
  id: 'mapping-001',
  tenantId: 'tenant-123',
  source: {
    type: 'MODBUS',
    address: '192.168.1.100',
    register: '40001',
  },
  targetAssetCode: 'WELL-MOR-001',
  telemetryKey: 'tubingPressure',
  transform: {
    type: 'LINEAR',
    config: { scale: 0.1, offset: 0 },  // Raw * 0.1 + 0 = PSI
  },
  unit: 'psi',
  pollingIntervalMs: 1000,
  isActive: true,
};
```

### 6.3 Telemetría para Herramientas Móviles

Para herramientas que se mueven entre pozos (CT reels, BHA, etc.):

```typescript
// Asociación temporal de herramienta a pozo/trabajo
interface ToolAssignment {
  id: string;
  toolAssetId: string;      // CT Reel, BHA, etc.
  targetAssetId: string;    // Pozo, trabajo, etc.
  
  assignmentType: 'JOB' | 'MAINTENANCE' | 'STORAGE';
  
  startTime: Date;
  endTime?: Date;
  
  // Durante la asignación, la telemetría de la herramienta
  // se asocia también al target
  inheritTelemetry: boolean;
}

// Ejemplo: CT Reel asignado a trabajo
{
  toolAssetId: 'asset-ct-reel-001',
  targetAssetId: 'asset-well-mor-001',  // El pozo donde está operando
  assignmentType: 'JOB',
  startTime: '2026-01-09T08:00:00Z',
  inheritTelemetry: true,  // La telemetría del reel también va al pozo
}
```

---

## 7. Implementación por Fases

### 7.1 Fase 1: Infraestructura Base (2 semanas)

| Tarea | Prioridad | Duración |
|-------|-----------|----------|
| Crear modelo de datos para asset_types y assets | CRÍTICA | 2 días |
| Migrar entidades existentes (wells, fields, basins, reservoirs) a nuevo modelo | CRÍTICA | 3 días |
| Implementar CRUD de assets genérico | ALTA | 2 días |
| Implementar atributos dinámicos | ALTA | 2 días |
| Tests y validación | ALTA | 1 día |

### 7.2 Fase 2: Telemetría y Digital Twins (2 semanas)

| Tarea | Prioridad | Duración |
|-------|-----------|----------|
| Crear tabla asset_telemetry (TimescaleDB) | CRÍTICA | 1 día |
| Implementar servicio de ingesta de telemetría | CRÍTICA | 2 días |
| Integrar con Kafka consumers | ALTA | 2 días |
| Implementar cache de telemetría actual en Redis | ALTA | 2 días |
| Crear API de consulta de telemetría | ALTA | 2 días |
| Tests y validación | ALTA | 1 día |

### 7.3 Fase 3: Campos Calculados (1 semana)

| Tarea | Prioridad | Duración |
|-------|-----------|----------|
| Definir schema de campos calculados | ALTA | 1 día |
| Implementar evaluador de fórmulas | ALTA | 2 días |
| Crear servicio de actualización de campos calculados | ALTA | 2 días |

### 7.4 Fase 4: Motor de Reglas Visual (3 semanas)

| Tarea | Prioridad | Duración |
|-------|-----------|----------|
| Diseñar modelo de datos de reglas | ALTA | 1 día |
| Implementar tipos de nodos básicos | ALTA | 4 días |
| Implementar ejecutor de reglas | ALTA | 3 días |
| Integrar triggers de telemetría/atributos | ALTA | 2 días |
| Crear API de gestión de reglas | MEDIA | 2 días |
| Frontend: Editor visual de nodos (React Flow) | ALTA | 5 días |
| Tests y validación | ALTA | 3 días |

### 7.5 Fase 5: Migración de Módulos (2 semanas)

| Tarea | Prioridad | Duración |
|-------|-----------|----------|
| Migrar Well Testing para usar nueva infraestructura | ALTA | 3 días |
| Migrar Drilling para usar nueva infraestructura | ALTA | 3 días |
| Crear asset types para Coiled Tubing | MEDIA | 2 días |
| Crear asset types para Production | MEDIA | 2 días |

---

## 8. Stack Tecnológico para Motor de Reglas

### 8.1 Backend

- **Rule Engine**: Motor custom en TypeScript
- **Formula Parser**: mathjs o expr-eval para evaluación de fórmulas
- **Event Bus**: Kafka para triggers
- **Cache**: Redis para estado y debouncing

### 8.2 Frontend (Editor Visual)

- **React Flow**: Librería para diagramas de nodos interactivos
- **zustand**: Estado del editor
- **Shadcn/ui**: Componentes de UI

```
Alternativas evaluadas para editor visual:
✓ React Flow - Elegido: Mejor integración React, customizable
  Rete.js - Bueno pero más complejo
  Node-RED - Standalone, difícil de integrar
  Drawflow - Ligero pero limitado
```

---

## 9. Conclusión

Esta arquitectura permite:

1. **Flexibilidad de negocio**: Empresas contratan solo lo que necesitan
2. **Extensibilidad**: Fácil agregar nuevos tipos de activos y telemetrías
3. **Automatización**: Reglas visuales para lógica de negocio sin código
4. **Tiempo real**: Campos calculados se actualizan automáticamente
5. **Escalabilidad**: TimescaleDB + Kafka + Redis para alto volumen

El módulo de Infraestructura es el cimiento sobre el cual todos los demás módulos operan, garantizando que cualquier empresa, sin importar qué módulos contrate, pueda gestionar sus activos de forma consistente.

---

## 10. Control de Versiones

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 2026-01-09 | Creación del documento |
