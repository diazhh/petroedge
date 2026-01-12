# ARQUITECTURA DE MAPEO: Fuentes de Datos → Gemelos Digitales

## 📋 Resumen Ejecutivo

Este documento define la arquitectura para conectar **fuentes de datos** (dispositivos de campo, sensores, PLCs) con **gemelos digitales** (Eclipse Ditto Things), incluyendo un sistema de **perfiles de conectividad** que automatiza el mapeo de telemetrías a assets compuestos.

**Mejoras sobre ThingsBoard:**
- Mapeo automático a **múltiples assets relacionados** (no solo 1:1)
- **Perfiles de conectividad** reutilizables (plantillas de mapeo)
- **Vinculación declarativa** Device → Digital Twin compuesto
- **Motor de reglas integrado** por perfil de dispositivo

---

## 1. 🎯 Problema a Resolver

### 1.1 Limitación de ThingsBoard

En ThingsBoard, cuando un Device envía telemetría, por defecto se guarda en el propio Device. Si quieres enviar datos a un Asset (o múltiples Assets), debes configurar manualmente una Rule Chain con nodos `change originator` para cada destino.

**Problema**: Si tienes una Unidad de Coiled Tubing con 10 assets relacionados (Reel, Pump, Motor, Injector, etc.), el usuario debe:
1. Crear manualmente cada relación Device → Asset
2. Configurar una regla para cada telemetría indicando a qué asset va
3. Repetir este proceso para CADA unidad CT nueva

### 1.2 Nuestra Solución

```
Device (PLC CT)     Connectivity Profile        Digital Twin (Compuesto)
┌───────────────┐   ┌───────────────────┐      ┌───────────────────────┐
│ pressure      │   │ CT_UNIT_PROFILE   │      │ CT_UNIT (parent)      │
│ temp          │──▶│                   │─────▶│ ├── CT_REEL           │
│ depth         │   │ Mapea:            │      │ │   └── fatigue       │
│ pump_rpm      │   │ • pressure → unit │      │ ├── PUMP              │
│ reel_fatigue  │   │ • depth → reel    │      │ │   └── rpm           │
│ motor_amps    │   │ • pump_rpm → pump │      │ ├── MOTOR             │
└───────────────┘   │ • fatigue → reel  │      │ │   └── amps          │
                    │ • motor_amps→motor│      │ └── INJECTOR_HEAD     │
                    └───────────────────┘      └───────────────────────┘

✅ Perfil reutilizable para TODAS las unidades CT
✅ Al conectar nuevo CT, se vincula al perfil y listo
✅ Mapeo declarativo, no programático
```

---

## 2. 🏗️ Arquitectura de Capas

```
┌─────────────────────────────────────────────────────────────────┐
│ CAPA 1: MÓDULOS OPERACIONALES (Abstracción de Dominio)         │
│ • Well Testing → Crea pozos (asset WELL)                       │
│ • Coiled Tubing → Crea unidades CT (asset template CT_UNIT)    │
│ • Drilling → Crea rigs (asset template RIG)                    │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│ CAPA 2: DIGITAL TWINS (Eclipse Ditto)                          │
│ • Asset Types: WELL, CT_UNIT, CT_REEL, PUMP, MOTOR, etc.      │
│ • Asset Templates: Plantillas de gemelos compuestos            │
│ • Things en Ditto: Instancias de Digital Twins                 │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│ CAPA 3: CONNECTIVITY (Vinculación Data Source ↔ Digital Twin) │
│ • Device Profiles: Configuración de tipo de dispositivo        │
│ • Connectivity Profiles: Mapeo de telemetrías a assets         │
│ • Device Bindings: Instancia de vinculación device → twin      │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│ CAPA 4: DATA ACQUISITION (Edge Gateway + Data Sources)        │
│ • Data Sources: Configuración de conexión (Modbus, OPC-UA...) │
│ • Tags: Puntos de datos individuales                           │
│ • Edge Gateways: Colectores de datos en campo                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. � Flujo Completo desde Perspectiva del Usuario

### 3.1 ¿Qué Entidades Crea el Usuario?

El usuario interactúa con el sistema en **dos niveles**:

#### Nivel 1: Configuración de Infraestructura (Admin/Ingeniero)

| Entidad | ¿Quién la crea? | ¿Cuántas veces? | Descripción |
|---------|-----------------|-----------------|-------------|
| **Edge Gateway** | Admin | Una por ubicación física | Representa un colector de datos en campo |
| **Data Source** | Ingeniero | Una por dispositivo físico | Conexión a PLC/RTU/Sensor específico |
| **Device Profile** | Admin | Una por tipo de dispositivo | Plantilla: schema de telemetría + rule chain |
| **Asset Template** | Admin | Una por tipo de gemelo compuesto | Plantilla: qué componentes tiene un CT, Rig, etc. |
| **Connectivity Profile** | Ingeniero | Una por combinación device↔template | Mapeo: qué telemetría va a qué componente |

#### Nivel 2: Operaciones Diarias (Operador/Ingeniero)

| Entidad | ¿Quién la crea? | ¿Cuántas veces? | Descripción |
|---------|-----------------|-----------------|-------------|
| **Digital Twin** | Módulo operacional | Cada vez que se crea un pozo, CT, rig | Se crea desde UI del módulo (ej: "Crear Unidad CT") |
| **Device Binding** | Ingeniero | Cada vez que se conecta un dispositivo | Vincula Data Source → Digital Twin usando un Connectivity Profile |

### 3.2 Diagrama de Creación de Entidades

```
CONFIGURACIÓN INICIAL (una vez por tipo)
═══════════════════════════════════════

Admin crea:                      Ingeniero crea:
┌──────────────────┐             ┌──────────────────┐
│ Device Profile   │             │ Connectivity     │
│ ─────────────────│             │ Profile          │
│ • Tipo: CT_PLC   │◄───────────►│ ─────────────────│
│ • Schema telemetry│             │ • pressure→root  │
│ • Rule Chain ID  │             │ • depth→reel     │
└──────────────────┘             │ • rpm→pump       │
         │                       └──────────────────┘
         │                                │
         ▼                                ▼
┌──────────────────┐             ┌──────────────────┐
│ Asset Template   │◄───────────►│ (usa ambos)      │
│ ─────────────────│             └──────────────────┘
│ • CT_UNIT        │
│ • components:    │
│   - reel         │
│   - pump         │
│   - motor        │
└──────────────────┘

OPERACIÓN DIARIA (cada instancia)
═════════════════════════════════

1. Módulo CT crea Digital Twin:     2. Ingeniero vincula dispositivo:
┌──────────────────────────┐        ┌──────────────────────────┐
│ POST /coiled-tubing/units│        │ POST /device-bindings    │
│ {                        │        │ {                        │
│   "code": "CT-007",      │        │   "dataSourceId": "...", │
│   "template": "CT_UNIT"  │        │   "digitalTwinId":"...", │
│ }                        │        │   "connectivityProfileId"│
└──────────────────────────┘        │ }                        │
           │                        └──────────────────────────┘
           ▼                                    │
   Crea automáticamente:                        ▼
   • Thing: acme:ct_007              ✅ Telemetría fluye automáticamente
   • Thing: acme:ct_007_reel            al gemelo digital correcto
   • Thing: acme:ct_007_pump
   • Thing: acme:ct_007_motor
```

### 3.3 ¿Dónde Entra el Edge Gateway?

El **Edge Gateway** es el **colector físico** que:
1. Se instala en campo (servidor industrial, Raspberry Pi, PC)
2. Ejecuta el software de Edge (`/src/edge/`)
3. Conecta a múltiples PLCs/sensores vía Modbus, OPC-UA, S7, etc.
4. Envía datos a la nube vía MQTT/Kafka

```
Campo (Edge)                          Nube (Cloud)
════════════                          ════════════

┌───────────────────────┐            ┌───────────────────────┐
│ Edge Gateway Server   │            │ Backend API           │
│ ─────────────────────│            │ ─────────────────────│
│ • edge-gateway-001    │◄──sync────│ Configuración:        │
│ • Ubicación: Campo X  │            │ • data_sources        │
└───────────────────────┘            │ • data_source_tags    │
         │                           └───────────────────────┘
         │ Drivers
         ▼
┌───────────────────────┐
│ Data Sources (PLCs)   │
│ ─────────────────────│
│ • PLC-CT-007 (Modbus) │───────────┐
│ • PLC-CT-008 (S7)     │           │ Kafka
│ • RTU-Well-001 (OPCUA)│           ▼
└───────────────────────┘   ┌───────────────────────┐
                            │ Worker Service        │
                            │ ─────────────────────│
                            │ • Consume telemetry   │
                            │ • Resuelve bindings   │
                            │ • Ejecuta Rule Chain  │
                            │ • Escribe a Ditto     │
                            └───────────────────────┘
```

### 3.4 Flujo: Asociar Data Source a un Asset

**Opción A: Asset Simple (1:1)**
```
Data Source "RTU-Well-001" → Device Binding → Well "WELL-001"
                                   │
                                   └── Connectivity Profile: WELL_RTU_MAPPING
                                       • pressure → root.telemetry.pressure
                                       • temp → root.telemetry.temperature
```

**Opción B: Asset Compuesto (1:N)**
```
Data Source "PLC-CT-007" → Device Binding → CT Unit "CT-007"
                                 │              ├── CT-007-reel
                                 │              ├── CT-007-pump
                                 │              └── CT-007-motor
                                 │
                                 └── Connectivity Profile: CT_UNITRONICS_MAPPING
                                     • reel_depth → reel.telemetry.currentDepth
                                     • pump_rpm → pump.telemetry.rpm
                                     • motor_amps → motor.telemetry.current
```

---

## 4. 🔧 Integración con el Motor de Reglas

### 4.1 ¿Cómo se Asigna una Rule Chain a un Data Source?

En **ThingsBoard**, la Rule Chain se asigna al **Device Profile**. Nosotros seguimos el mismo patrón pero con más flexibilidad:

```
                    ┌─────────────────────────────────────────────┐
                    │           JERARQUÍA DE RULE CHAINS          │
                    └─────────────────────────────────────────────┘

Nivel 1: DEVICE PROFILE (default)
─────────────────────────────────
Device Profile "CT_PLC_UNITRONICS"
└── defaultRuleChainId: "rule_ct_telemetry_processing"

    ↓ Puede ser overrideado por ↓

Nivel 2: CONNECTIVITY PROFILE (opcional)
────────────────────────────────────────
Connectivity Profile "CT_UNITRONICS_MAPPING"
└── ruleChainId: "rule_ct_with_alarms"  ← Override específico

    ↓ Puede ser overrideado por ↓

Nivel 3: DEVICE BINDING (opcional)
──────────────────────────────────
Device Binding (PLC-CT-007 → CT-007)
└── customRuleChainId: "rule_ct_007_special"  ← Override por instancia
```

### 4.2 Flujo de Datos con Motor de Reglas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUJO DE INGESTA DE DATOS                            │
└─────────────────────────────────────────────────────────────────────────────┘

1. ADQUISICIÓN
   ════════════
   Edge Gateway ──► Kafka topic: "telemetry.raw"
   
   Mensaje:
   {
     "dataSourceId": "ds-ct-007",
     "gatewayId": "gw-campo-x",
     "timestamp": "2026-01-11T10:30:00Z",
     "values": {
       "reel_depth": 5432.5,
       "pump_rpm": 1200,
       "wellhead_pressure": 2500
     }
   }

2. RESOLUCIÓN DE BINDING
   ══════════════════════
   Worker Service (TelemetryMappingConsumer):
   
   a) Buscar Device Binding por dataSourceId
      → binding = { digitalTwinId: "ct-007", connectivityProfileId: "cp-001" }
   
   b) Obtener Connectivity Profile
      → profile = { mappings: [...], ruleChainId: "rc-001" }
   
   c) Resolver Rule Chain (jerarquía)
      → ruleChain = profile.ruleChainId || deviceProfile.defaultRuleChainId

3. EJECUCIÓN DE RULE CHAIN (PRE-PROCESAMIENTO)
   ════════════════════════════════════════════
   Rule Chain: "rule_ct_telemetry_processing"
   
   ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
   │   INPUT    │───►│   FILTER   │───►│ TRANSFORM  │───►│   ENRICH   │
   │kafka_input │    │ threshold  │    │   math     │    │fetch_asset │
   └────────────┘    │ pump_rpm   │    │ convert    │    │ attributes │
                     │ > 0        │    │ psi→bar    │    └────────────┘
                     └────────────┘    └────────────┘           │
                                                                ▼
   ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
   │   OUTPUT   │◄───│   ACTION   │◄───│   ALARM    │◄───│   SWITCH   │
   │ to_mapping │    │create_alarm│    │ if pressure│    │ by message │
   │ _resolver  │    │            │    │ > 3000     │    │   type     │
   └────────────┘    └────────────┘    └────────────┘    └────────────┘

4. MAPPING RESOLVER (POST-RULE CHAIN)
   ═══════════════════════════════════
   Aplica mappings del Connectivity Profile:
   
   Input (después de Rule Chain):
   {
     "reel_depth": 5432.5,
     "pump_rpm": 1200,
     "wellhead_pressure": 172.36  ← Convertido a bar
   }
   
   Mappings aplicados:
   • reel_depth → Thing: acme:ct_007_reel, Feature: telemetry, Property: currentDepth
   • pump_rpm → Thing: acme:ct_007_pump, Feature: telemetry, Property: rpm
   • wellhead_pressure → Thing: acme:ct_007, Feature: telemetry, Property: pressure

5. PERSISTENCIA MULTI-DESTINO
   ═══════════════════════════
   
   ┌─────────────────┐
   │ Ditto Writer    │──► Eclipse Ditto (Digital Twin state)
   │                 │
   │ TimeSeries      │──► TimescaleDB (histórico)
   │ Writer          │
   │                 │
   │ Redis Cache     │──► Redis (cache tiempo real)
   │                 │
   │ WebSocket       │──► Frontend (broadcast)
   │ Broadcaster     │
   └─────────────────┘
```

### 4.3 Nodos Especiales para Data Sources

Se requieren nuevos nodos en el Motor de Reglas:

| Nodo | Categoría | Descripción |
|------|-----------|-------------|
| `data_source_input` | Input | Entry point para telemetría de Data Sources |
| `resolve_binding` | Enrichment | Obtiene Device Binding y Connectivity Profile |
| `apply_mapping` | Transform | Aplica los mappings del Connectivity Profile |
| `route_to_components` | Flow | Rutea datos a múltiples Things (componentes) |
| `save_to_digital_twin` | Action | Escribe a Ditto con Thing ID resuelto |

### 4.4 Rule Chain por Defecto para Data Sources

```
┌──────────────────────────────────────────────────────────────────────────┐
│                 ROOT RULE CHAIN: "telemetry_processing"                  │
│              (Asignada por defecto a todos los Device Profiles)          │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│ data_source     │
│ _input          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ resolve_binding │────►│ Si no hay       │──► Log + Discard
│ (Enrichment)    │     │ binding         │
└────────┬────────┘     └─────────────────┘
         │
         ▼ Tiene binding
┌─────────────────┐
│ message_type    │
│ _switch         │
└────────┬────────┘
         │
    ┌────┴────┬──────────────┐
    ▼         ▼              ▼
┌────────┐ ┌────────┐   ┌─────────┐
│TELEMETRY│ │ATTRIBUTES│ │ EVENT  │
└────┬───┘ └────┬───┘   └────┬────┘
     │          │            │
     ▼          ▼            ▼
┌─────────────────────────────────────────┐
│      device_profile_rule_chain          │
│   (Delegado al Rule Chain del Profile)  │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│           apply_mapping                 │
│   (Connectivity Profile mappings)       │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         route_to_components             │
│   (Fan-out a múltiples Things)          │
└────────────────┬────────────────────────┘
                 │
    ┌────────────┼────────────┐
    ▼            ▼            ▼
┌────────┐  ┌────────┐   ┌────────┐
│ root   │  │ reel   │   │ pump   │
│ Thing  │  │ Thing  │   │ Thing  │
└────┬───┘  └────┬───┘   └────┬───┘
     │           │            │
     ▼           ▼            ▼
┌─────────────────────────────────────────┐
│         save_to_digital_twin            │
│   (Batch write a Ditto)                 │
└────────────────┬────────────────────────┘
                 │
                 ▼
         ┌──────────────┐
         │ save_timeseries
         │ (TimescaleDB)│
         └──────────────┘
```

---

## 5. 📊 Modelo de Datos (Entidades)

### 5.1 Device Profile
Configuración de un tipo de dispositivo (ej: "PLC Unitronics para CT").

```typescript
interface DeviceProfile {
  id: string;
  tenantId: string;
  code: string;                    // CT_PLC_UNITRONICS
  name: string;
  transportType: string;           // modbus, opcua, s7, ethernet_ip
  telemetrySchema: Record<string, TelemetryDef>;  // Telemetrías esperadas
  defaultRuleChainId?: string;     // Rule chain por defecto (IMPORTANTE)
  isActive: boolean;
}

interface TelemetryDef {
  type: 'number' | 'string' | 'boolean';
  unit?: string;                   // psi, ft, rpm, etc.
  description?: string;
}
```

### 5.2 Asset Template
Plantilla para crear gemelos digitales compuestos.

```typescript
interface AssetTemplate {
  id: string;
  tenantId: string;
  code: string;                    // CT_UNIT_TEMPLATE
  name: string;
  rootAssetTypeId: string;         // Tipo del asset raíz
  components: AssetComponent[];    // Componentes hijos
  relationships: Relationship[];   // Relaciones entre componentes
  defaultProperties: Record<string, any>;
}

interface AssetComponent {
  code: string;                    // reel, pump, motor
  assetTypeCode: string;           // CT_REEL, CT_PUMP
  name: string;
  required: boolean;
}
```

### 5.3 Connectivity Profile
Mapeo de telemetrías de un Device Profile a un Asset Template.

```typescript
interface ConnectivityProfile {
  id: string;
  tenantId: string;
  code: string;                    // CT_UNITRONICS_MAPPING
  name: string;
  deviceProfileId: string;         // FK → DeviceProfile
  assetTemplateId: string;         // FK → AssetTemplate
  ruleChainId?: string;            // Override del rule chain del DeviceProfile
  mappings: TelemetryMapping[];
}

interface TelemetryMapping {
  sourceKey: string;               // wellhead_pressure (del telemetrySchema)
  target: {
    component: string;             // "root" | "reel" | "pump"
    feature: string;               // telemetry, configuration, status
    property: string;              // pressure, currentDepth
  };
  transform?: string;              // Expresión: "value / 100", "value * 0.0689476"
}
```

### 5.4 Digital Twin Instance
Instancia creada a partir de un Asset Template.

```typescript
interface DigitalTwinInstance {
  id: string;
  tenantId: string;
  assetTemplateId?: string;        // Null si es asset simple
  code: string;                    // CT-007
  name: string;
  rootThingId: string;             // acme:ct_007 (Ditto Thing ID)
  componentThingIds: Record<string, string>;  // { "reel": "acme:ct_007_reel" }
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  metadata: Record<string, any>;
}
```

### 5.5 Device Binding
Vinculación de una Data Source específica con un Digital Twin específico.

```typescript
interface DeviceBinding {
  id: string;
  tenantId: string;
  dataSourceId: string;            // FK → DataSource (PLC físico)
  digitalTwinId: string;           // FK → DigitalTwinInstance
  connectivityProfileId: string;   // FK → ConnectivityProfile
  customRuleChainId?: string;      // Override nivel 3 (por instancia)
  customMappings?: TelemetryMapping[];  // Sobrescrituras específicas
  isActive: boolean;
  lastDataReceivedAt?: Date;
}
```

---

## 6. 🗄️ Modelo de Base de Datos

Ver archivo: `15_DATA_SOURCE_MAPPING_SCHEMA.sql` (a crear)

Tablas principales:
- `device_profiles` - Perfiles de tipo de dispositivo
- `asset_templates` - Plantillas de gemelos compuestos
- `connectivity_profiles` - Perfiles de mapeo
- `digital_twin_instances` - Instancias de gemelos creados
- `device_bindings` - Vinculaciones device → twin

---

## 7. 🎯 Plan de Implementación

### Fase 1: Modelo de Datos (1 semana)
- [ ] Crear tablas en schema.ts (device_profiles, asset_templates, connectivity_profiles, digital_twin_instances, device_bindings)
- [ ] Agregar campo `device_profile_id` a tabla `data_sources` existente
- [ ] Generar migración
- [ ] Crear tipos TypeScript compartidos

### Fase 2: Backend API - Perfiles (2 semanas)
- [ ] Módulo `device-profiles` CRUD + validación de telemetrySchema
- [ ] Módulo `asset-templates` CRUD + creación automática en Ditto
- [ ] Módulo `connectivity-profiles` CRUD + validación de mappings
- [ ] Módulo `device-bindings` CRUD + activación/desactivación
- [ ] Servicio `digital-twin-factory.service.ts` (crea Things desde templates)

### Fase 3: Motor de Reglas - Nodos Especiales (1.5 semanas)
- [ ] Nodo `data_source_input` (Input): Entry point para telemetría
- [ ] Nodo `resolve_binding` (Enrichment): Obtiene binding + profile
- [ ] Nodo `apply_mapping` (Transform): Aplica mappings del ConnectivityProfile
- [ ] Nodo `route_to_components` (Flow): Fan-out a múltiples Things
- [ ] Nodo `save_to_digital_twin` (Action): Escribe batch a Ditto
- [ ] Crear Rule Chain template: `ROOT_TELEMETRY_PROCESSING`

### Fase 4: Worker Integration (1.5 semanas)
- [ ] `TelemetryMappingConsumer` en Worker Service
- [ ] `MappingResolverService` (cache en Redis)
- [ ] `RuleChainResolverService` (jerarquía de 3 niveles)
- [ ] Integración con `DittoWriterService` existente
- [ ] Integración con `TimeSeriesService` existente

### Fase 5: Frontend UI (2 semanas)
- [ ] Página Device Profiles (lista + formulario + editor de schema)
- [ ] Página Asset Templates (lista + formulario + editor de componentes)
- [ ] Página Connectivity Profiles (editor visual de mapeo drag-and-drop)
- [ ] Wizard de Device Binding (seleccionar DS → DT → Profile)
- [ ] Integrar en menú de configuración

### Fase 6: Testing y Documentación (1 semana)
- [ ] Tests de integración end-to-end
- [ ] Seeds de ejemplo (CT Unit, Well RTU)
- [ ] Documentación de usuario
- [ ] Actualizar README con nuevo flujo

---

## 8. 📋 Ejemplo de Flujo de Usuario Completo

### Escenario: Conectar PLC de Coiled Tubing a Gemelo Digital

```
PASO 1: Admin crea Device Profile (una vez)
═══════════════════════════════════════════
POST /api/v1/device-profiles
{
  "code": "CT_PLC_UNITRONICS",
  "name": "PLC Unitronics Vision para Coiled Tubing",
  "transportType": "modbus",
  "defaultRuleChainId": "rule-ct-telemetry",
  "telemetrySchema": {
    "wellhead_pressure": { "type": "number", "unit": "psi" },
    "reel_depth": { "type": "number", "unit": "ft" },
    "pump_rpm": { "type": "number", "unit": "rpm" },
    "motor_amps": { "type": "number", "unit": "A" }
  }
}

PASO 2: Admin crea Asset Template (una vez)
═══════════════════════════════════════════
POST /api/v1/asset-templates
{
  "code": "CT_UNIT_TEMPLATE",
  "name": "Plantilla Unidad Coiled Tubing",
  "rootAssetTypeCode": "CT_UNIT",
  "components": [
    { "code": "reel", "assetTypeCode": "CT_REEL", "name": "Carrete", "required": true },
    { "code": "pump", "assetTypeCode": "CT_PUMP", "name": "Bomba Triplex", "required": true },
    { "code": "motor", "assetTypeCode": "CT_MOTOR", "name": "Motor Diesel", "required": true },
    { "code": "injector", "assetTypeCode": "CT_INJECTOR", "name": "Cabeza Inyectora", "required": true }
  ],
  "relationships": [
    { "from": "reel", "to": "root", "type": "INSTALLED_IN" },
    { "from": "pump", "to": "root", "type": "INSTALLED_IN" },
    { "from": "motor", "to": "pump", "type": "POWERS" }
  ]
}

PASO 3: Ingeniero crea Connectivity Profile (una vez)
═════════════════════════════════════════════════════
POST /api/v1/connectivity-profiles
{
  "code": "CT_UNITRONICS_MAPPING",
  "name": "Mapeo PLC Unitronics → CT Unit",
  "deviceProfileId": "{device_profile_id}",
  "assetTemplateId": "{asset_template_id}",
  "mappings": [
    { 
      "sourceKey": "wellhead_pressure", 
      "target": { "component": "root", "feature": "telemetry", "property": "pressure" }
    },
    { 
      "sourceKey": "reel_depth", 
      "target": { "component": "reel", "feature": "telemetry", "property": "currentDepth" }
    },
    { 
      "sourceKey": "pump_rpm", 
      "target": { "component": "pump", "feature": "telemetry", "property": "rpm" }
    },
    { 
      "sourceKey": "motor_amps", 
      "target": { "component": "motor", "feature": "telemetry", "property": "current" },
      "transform": "value * 1.0"
    }
  ]
}

PASO 4: Operador crea Unidad CT desde módulo (cada vez)
═══════════════════════════════════════════════════════
POST /api/v1/coiled-tubing/units
{
  "code": "CT-UNIT-007",
  "name": "Unidad CT Campo Morichal",
  "templateCode": "CT_UNIT_TEMPLATE",
  "location": { "field": "Morichal", "lat": 9.123, "lng": -64.456 }
}

→ Sistema crea automáticamente en Ditto:
  • Thing: acme:ct_unit_007 (raíz)
  • Thing: acme:ct_unit_007_reel
  • Thing: acme:ct_unit_007_pump
  • Thing: acme:ct_unit_007_motor
  • Thing: acme:ct_unit_007_injector
  • Relaciones entre Things

PASO 5: Ingeniero configura Data Source (cada vez)
══════════════════════════════════════════════════
POST /api/v1/data-sources
{
  "name": "PLC CT-007 Morichal",
  "edgeGatewayId": "{gateway_campo_morichal}",
  "deviceProfileId": "{device_profile_ct_unitronics}",  ← NUEVO CAMPO
  "protocol": "modbus",
  "connectionConfig": { 
    "host": "192.168.1.100", 
    "port": 502,
    "unitId": 1
  }
}

→ Tags se sincronizan automáticamente al Edge Gateway

PASO 6: Ingeniero vincula Data Source a Digital Twin (cada vez)
═══════════════════════════════════════════════════════════════
POST /api/v1/device-bindings
{
  "dataSourceId": "{data_source_plc_ct_007}",
  "digitalTwinId": "{digital_twin_ct_unit_007}",
  "connectivityProfileId": "{connectivity_profile_ct_unitronics}",
  "isActive": true
}

→ ✅ ¡LISTO! Desde este momento:
  • Edge Gateway lee datos del PLC
  • Envía a Kafka topic "telemetry.raw"
  • Worker Service resuelve binding
  • Ejecuta Rule Chain del Device Profile
  • Aplica mappings del Connectivity Profile
  • Escribe a cada Thing en Ditto
  • Persiste en TimescaleDB
  • Cache en Redis
  • Broadcast vía WebSocket
```

---

## 9. 📚 Referencias y Roadmaps Relacionados

### Documentación Externa
- ThingsBoard Device Profiles: https://thingsboard.io/docs/user-guide/device-profiles/
- Eclipse Ditto Things API: https://www.eclipse.dev/ditto/http-api-doc.html

### Roadmaps del Proyecto (Actualizados)
| Roadmap | Relación con este documento |
|---------|----------------------------|
| `07_EDGE_GATEWAY_PLC_INTEGRATION.md` | Data Sources, Tags, Edge Gateway - **Agregar campo `deviceProfileId`** |
| `09_ASSET_TYPES_TEMPLATES_PATTERN.md` | Asset Types y Templates - **Base para Asset Templates** |
| `10_ECLIPSE_DITTO_RULE_ENGINE_ADVANCED.md` | Motor de Reglas - **Agregar nodos especiales y jerarquía de Rule Chains** |

### Cambios Requeridos en Otros Roadmaps

**07_EDGE_GATEWAY_PLC_INTEGRATION.md**:
- Agregar campo `device_profile_id` a `data_sources`
- Documentar relación Data Source → Device Profile

**09_ASSET_TYPES_TEMPLATES_PATTERN.md**:
- Referenciar Asset Templates de este documento
- Aclarar que Asset Types son la base, Asset Templates son la composición

**10_ECLIPSE_DITTO_RULE_ENGINE_ADVANCED.md**:
- Agregar sección de nodos especiales para Data Sources
- Documentar jerarquía de Rule Chains (Device Profile → Connectivity Profile → Device Binding)
- Agregar ROOT_TELEMETRY_PROCESSING como rule chain template

---

**Fecha de creación**: 2026-01-11
**Última actualización**: 2026-01-11
**Estado**: 📋 Diseño completado - Listo para implementación
