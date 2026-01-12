# BLOQUE 2: EDGE GATEWAY E INGESTA DE DATOS

> **Módulo**: Coiled Tubing  
> **Fase**: Configuración de Edge Gateway y Flujo de Telemetría  
> **Duración estimada**: 1-2 semanas  
> **Prioridad**: 🔴 CRÍTICA (Sin esto no hay datos RT)

---

## 📋 ÍNDICE

1. [Flujo de Datos CT](#flujo-de-datos-ct)
2. [Device Profiles](#device-profiles)
3. [Data Source Tags](#data-source-tags)
4. [Connectivity Profiles](#connectivity-profiles)
5. [Device Bindings](#device-bindings)
6. [Kafka Topics](#kafka-topics)
7. [Implementación](#implementación)

---

## 1. FLUJO DE DATOS CT

### 1.1 Arquitectura Completa de Ingesta

```
┌─────────────────────────────────────────────────────────────────────┐
│                   FLUJO DE TELEMETRÍA COILED TUBING                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CAMPO (Edge)                                                        │
│  ┌──────────────────────────────────────────────────────┐           │
│  │ Sensores CT (Modbus/OPC-UA)                          │           │
│  │  • Encoder profundidad    → Tag: CT_DEPTH            │           │
│  │  • Celda de carga         → Tag: CT_WEIGHT           │           │
│  │  • Transductor presión    → Tag: CT_PUMP_PRESSURE    │           │
│  │  • Medidor flujo          → Tag: CT_FLOW_RATE        │           │
│  │  • Encoder velocidad      → Tag: CT_SPEED            │           │
│  └────────────────┬─────────────────────────────────────┘           │
│                   │                                                  │
│                   ↓                                                  │
│  ┌──────────────────────────────────────────────────────┐           │
│  │ Edge Gateway (Node.js)                               │           │
│  │  • Lee PLCs cada 100ms                               │           │
│  │  • Normaliza valores                                 │           │
│  │  • Agrega metadata (timestamp, quality)              │           │
│  └────────────────┬─────────────────────────────────────┘           │
│                   │                                                  │
│                   ↓ Kafka                                            │
│  ┌──────────────────────────────────────────────────────┐           │
│  │ Topic: scada.telemetry.raw                           │           │
│  │ {                                                     │           │
│  │   dataSourceId: "plc-ct-unit-05",                    │           │
│  │   tagName: "CT_DEPTH",                               │           │
│  │   value: 8542.5,                                     │           │
│  │   timestamp: "2026-01-12T10:45:32Z",                 │           │
│  │   quality: "GOOD"                                    │           │
│  │ }                                                     │           │
│  └────────────────┬─────────────────────────────────────┘           │
│                   │                                                  │
│                   ↓                                                  │
│  CLOUD/BACKEND                                                       │
│  ┌──────────────────────────────────────────────────────┐           │
│  │ TelemetryConsumerService (Node.js)                   │           │
│  │  • Consume de Kafka                                  │           │
│  │  • Busca Device Binding para mapear tag → asset     │           │
│  │  • Valida schema de telemetría                       │           │
│  └────────────────┬─────────────────────────────────────┘           │
│                   │                                                  │
│           ┌───────┴────────┐                                         │
│           ↓                ↓                                         │
│  ┌────────────────┐  ┌─────────────────┐                           │
│  │ asset_telemetry│  │ Rule Engine     │                           │
│  │ (TimescaleDB)  │  │ • Ejecuta reglas│                           │
│  │ • Guarda serie │  │ • Calcula fatiga│                           │
│  │   temporal     │  │ • Detecta alarmas│                          │
│  └────────────────┘  └────────┬────────┘                           │
│                               │                                      │
│                               ↓                                      │
│                      ┌─────────────────┐                            │
│                      │ Computed Fields │                            │
│                      │ Alarms          │                            │
│                      │ Notifications   │                            │
│                      └────────┬────────┘                            │
│                               │                                      │
│                               ↓                                      │
│                      ┌─────────────────┐                            │
│                      │ WebSocket       │                            │
│                      │ → Frontend RT   │                            │
│                      └─────────────────┘                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Componentes Clave

| Componente | Responsabilidad | Ubicación |
|------------|-----------------|-----------|
| **Sensores CT** | Adquisición física | Campo (wellsite) |
| **PLC/RTU** | Agregación de sensores | Edge (CT unit) |
| **Edge Gateway** | Normalización y envío | Edge (servidor local) |
| **Kafka** | Message broker | Cloud/Backend |
| **TelemetryConsumerService** | Procesamiento central | Cloud/Backend |
| **Device Bindings** | Mapeo tag → asset | Cloud/Backend (DB) |
| **Rule Engine** | Cálculos y alarmas | Cloud/Backend |
| **asset_telemetry** | Persistencia | Cloud/Backend (DB) |

---

## 2. DEVICE PROFILES

Los **Device Profiles** definen los tipos de dispositivos que generan telemetría.

### 2.1 Profile: "CT Unit Sensors"

**Propósito**: Conjunto de sensores estándar de una unidad CT

```json
{
  "name": "CT Unit - Sensores Estándar",
  "code": "CT_UNIT_SENSORS_V1",
  "description": "Sensores de superficie para unidad CT: profundidad, peso, presiones, velocidad",
  "manufacturer": "Generic",
  "protocol": "MODBUS_TCP",
  "version": "1.0",
  
  "tags": [
    {
      "name": "CT_DEPTH",
      "description": "Profundidad actual del CT",
      "dataType": "FLOAT",
      "unit": "ft",
      "address": "40001",
      "scaleFactor": 1.0,
      "offset": 0,
      "minValue": 0,
      "maxValue": 25000,
      "sampleRateMs": 100
    },
    {
      "name": "CT_WEIGHT",
      "description": "Peso indicador en superficie",
      "dataType": "FLOAT",
      "unit": "lbs",
      "address": "40002",
      "scaleFactor": 1.0,
      "offset": 0,
      "minValue": -100000,
      "maxValue": 100000,
      "sampleRateMs": 100
    },
    {
      "name": "CT_SPEED",
      "description": "Velocidad de RIH/POOH",
      "dataType": "FLOAT",
      "unit": "ft/min",
      "address": "40003",
      "scaleFactor": 1.0,
      "offset": 0,
      "minValue": -200,
      "maxValue": 200,
      "sampleRateMs": 100
    },
    {
      "name": "CT_PUMP_PRESSURE",
      "description": "Presión de bomba",
      "dataType": "FLOAT",
      "unit": "psi",
      "address": "40004",
      "scaleFactor": 1.0,
      "offset": 0,
      "minValue": 0,
      "maxValue": 20000,
      "sampleRateMs": 100
    },
    {
      "name": "CT_PUMP_RATE",
      "description": "Tasa de bombeo",
      "dataType": "FLOAT",
      "unit": "bpm",
      "address": "40005",
      "scaleFactor": 1.0,
      "offset": 0,
      "minValue": 0,
      "maxValue": 10,
      "sampleRateMs": 200
    },
    {
      "name": "CT_WHP",
      "description": "Wellhead pressure",
      "dataType": "FLOAT",
      "unit": "psi",
      "address": "40006",
      "scaleFactor": 1.0,
      "offset": 0,
      "minValue": 0,
      "maxValue": 5000,
      "sampleRateMs": 200
    },
    {
      "name": "CT_ANNULUS_PRESSURE",
      "description": "Presión anular",
      "dataType": "FLOAT",
      "unit": "psi",
      "address": "40007",
      "scaleFactor": 1.0,
      "offset": 0,
      "minValue": 0,
      "maxValue": 2000,
      "sampleRateMs": 200
    },
    {
      "name": "CT_INJECTOR_SPEED",
      "description": "Velocidad del inyector",
      "dataType": "FLOAT",
      "unit": "ft/min",
      "address": "40008",
      "scaleFactor": 1.0,
      "offset": 0,
      "minValue": 0,
      "maxValue": 200,
      "sampleRateMs": 100
    },
    {
      "name": "CT_INJECTOR_FORCE",
      "description": "Fuerza del inyector",
      "dataType": "FLOAT",
      "unit": "lbs",
      "address": "40009",
      "scaleFactor": 1.0,
      "offset": 0,
      "minValue": 0,
      "maxValue": 100000,
      "sampleRateMs": 100
    },
    {
      "name": "CT_OPERATION_MODE",
      "description": "Modo de operación",
      "dataType": "INTEGER",
      "unit": "enum",
      "address": "40010",
      "enumValues": {
        "0": "IDLE",
        "1": "RIH",
        "2": "POOH",
        "3": "CIRCULATING",
        "4": "STOPPED"
      },
      "sampleRateMs": 500
    }
  ],
  
  "metadata": {
    "category": "CT_EQUIPMENT",
    "applicableTo": ["CT_UNIT"]
  }
}
```

### 2.2 Profile: "CT Reel Fatigue Sensors"

**Propósito**: Sensores virtuales de fatiga calculados en edge

```json
{
  "name": "CT Reel - Fatigue Monitoring",
  "code": "CT_REEL_FATIGUE_V1",
  "description": "Monitoreo de fatiga del reel con cálculo edge",
  "protocol": "CALCULATED",
  
  "tags": [
    {
      "name": "REEL_FATIGUE_PERCENT",
      "description": "Porcentaje de fatiga acumulada",
      "dataType": "FLOAT",
      "unit": "%",
      "calculation": "edge_computed",
      "sampleRateMs": 1000
    },
    {
      "name": "REEL_BENDING_CYCLES",
      "description": "Ciclos de flexión acumulados",
      "dataType": "INTEGER",
      "unit": "cycles",
      "calculation": "edge_counter",
      "sampleRateMs": 5000
    },
    {
      "name": "REEL_PRESSURE_CYCLES",
      "description": "Ciclos de presión acumulados",
      "dataType": "INTEGER",
      "unit": "cycles",
      "calculation": "edge_counter",
      "sampleRateMs": 5000
    }
  ],
  
  "metadata": {
    "category": "CT_EQUIPMENT",
    "applicableTo": ["CT_REEL"]
  }
}
```

---

## 3. DATA SOURCE TAGS

Las **Data Source Tags** mapean tags físicos a tags lógicos del sistema.

### 3.1 Ejemplo: Data Source para CT-Unit-05

```json
{
  "dataSourceId": "ds-ct-unit-05",
  "name": "PLC CT Unit 05",
  "description": "PLC principal de la unidad CT-005 (NOV C-Series)",
  "edgeGatewayId": "edge-gw-maturin-01",
  "deviceProfileId": "profile-ct-unit-sensors-v1",
  "protocol": "MODBUS_TCP",
  "connectionString": "modbus://192.168.10.50:502",
  "pollIntervalMs": 100,
  "status": "CONNECTED",
  
  "tags": [
    {
      "tagName": "CT_DEPTH",
      "enabled": true,
      "lastValue": 8542.5,
      "lastUpdate": "2026-01-12T10:45:32Z",
      "quality": "GOOD"
    },
    {
      "tagName": "CT_WEIGHT",
      "enabled": true,
      "lastValue": -1250,
      "lastUpdate": "2026-01-12T10:45:32Z",
      "quality": "GOOD"
    },
    {
      "tagName": "CT_SPEED",
      "enabled": true,
      "lastValue": 45.2,
      "lastUpdate": "2026-01-12T10:45:32Z",
      "quality": "GOOD"
    }
    // ... resto de tags
  ]
}
```

---

## 4. CONNECTIVITY PROFILES

Los **Connectivity Profiles** definen CÓMO se mapean los tags del Data Source a los assets y QUÉ reglas se ejecutan.

### 4.1 Profile: "CT Unit Standard Mapping"

```json
{
  "name": "CT Unit - Standard Telemetry Mapping",
  "code": "CT_UNIT_MAPPING_V1",
  "description": "Mapeo estándar de tags de CT Unit a asset telemetry + reglas de cálculo",
  "deviceProfileId": "profile-ct-unit-sensors-v1",
  "assetTemplateId": "template-ct-unit-completo",
  
  "tagMappings": [
    {
      "sourceTag": "CT_DEPTH",
      "targetAssetType": "CT_UNIT",
      "targetTelemetryKey": "currentDepth",
      "transformation": null,
      "qosLevel": 1
    },
    {
      "sourceTag": "CT_WEIGHT",
      "targetAssetType": "CT_UNIT",
      "targetTelemetryKey": "surfaceWeight",
      "transformation": null,
      "qosLevel": 1
    },
    {
      "sourceTag": "CT_SPEED",
      "targetAssetType": "CT_UNIT",
      "targetTelemetryKey": "speed",
      "transformation": null,
      "qosLevel": 1
    },
    {
      "sourceTag": "CT_PUMP_PRESSURE",
      "targetAssetType": "CT_PUMP",
      "targetTelemetryKey": "pumpPressurePsi",
      "transformation": null,
      "qosLevel": 1
    },
    {
      "sourceTag": "CT_PUMP_RATE",
      "targetAssetType": "CT_PUMP",
      "targetTelemetryKey": "pumpRateBpm",
      "transformation": null,
      "qosLevel": 1
    },
    {
      "sourceTag": "CT_INJECTOR_SPEED",
      "targetAssetType": "CT_INJECTOR",
      "targetTelemetryKey": "speedFtMin",
      "transformation": null,
      "qosLevel": 1
    },
    {
      "sourceTag": "CT_INJECTOR_FORCE",
      "targetAssetType": "CT_INJECTOR",
      "targetTelemetryKey": "forceLbs",
      "transformation": null,
      "qosLevel": 1
    }
  ],
  
  "ruleChainId": "rule-ct-realtime-processing",
  
  "metadata": {
    "version": "1.0",
    "applicableAssetTypes": ["CT_UNIT"]
  }
}
```

**IMPORTANTE**: El `ruleChainId` apunta a una **regla visual** que se ejecuta ANTES de guardar en `asset_telemetry`. Esta regla hace:
1. Cálculos de fatiga en tiempo real
2. Detección de alarmas (overpull, slack-off, etc.)
3. Enriquecimiento de datos (agregar contexto del job)

---

## 5. DEVICE BINDINGS

Los **Device Bindings** son las **instancias concretas** que conectan un Data Source específico con un Asset específico.

### 5.1 Ejemplo: Binding CT-Unit-05 → Asset "CT-005"

```json
{
  "id": "binding-ct-unit-05",
  "name": "CT Unit 05 → Asset CT-005",
  "description": "Binding del PLC de CT-Unit-05 al asset CT-005 con su reel R-2024-012",
  "tenantId": "tenant-acme-petroleum",
  
  "dataSourceId": "ds-ct-unit-05",
  "digitalTwinId": "dt-instance-ct-unit-05",
  "connectivityProfileId": "profile-ct-unit-mapping-v1",
  
  "assetMappings": [
    {
      "componentPath": "root",
      "assetId": "asset-ct-unit-05",
      "assetType": "CT_UNIT"
    },
    {
      "componentPath": "root.injector",
      "assetId": "asset-injector-ct-05",
      "assetType": "CT_INJECTOR"
    },
    {
      "componentPath": "root.pump",
      "assetId": "asset-pump-ct-05",
      "assetType": "CT_PUMP"
    },
    {
      "componentPath": "root.bop",
      "assetId": "asset-bop-ct-05",
      "assetType": "CT_BOP"
    },
    {
      "componentPath": "root.reels[0]",
      "assetId": "asset-reel-2024-012",
      "assetType": "CT_REEL"
    }
  ],
  
  "customRuleChainId": null,
  "status": "ACTIVE",
  "createdAt": "2026-01-10T08:00:00Z"
}
```

### 5.2 ¿Cómo Funciona el Device Binding?

Cuando llega un mensaje de Kafka:

```json
{
  "dataSourceId": "ds-ct-unit-05",
  "tagName": "CT_DEPTH",
  "value": 8542.5,
  "timestamp": "2026-01-12T10:45:32Z",
  "quality": "GOOD"
}
```

El `TelemetryConsumerService`:

1. **Busca el Device Binding** por `dataSourceId`
2. **Lee el Connectivity Profile** para saber cómo mapear
3. **Encuentra el asset target**: `asset-ct-unit-05` (CT_UNIT)
4. **Mapea el tag**: `CT_DEPTH` → `currentDepth`
5. **Ejecuta la regla asociada** (si existe): `rule-ct-realtime-processing`
6. **Guarda en `asset_telemetry`**:

```sql
INSERT INTO asset_telemetry (
  time, asset_id, telemetry_key, value_numeric, quality, source
) VALUES (
  '2026-01-12T10:45:32Z',
  'asset-ct-unit-05',
  'currentDepth',
  8542.5,
  'GOOD',
  'EDGE'
);
```

---

## 6. KAFKA TOPICS

### 6.1 Topics para CT

| Topic | Propósito | Producer | Consumer |
|-------|-----------|----------|----------|
| `scada.telemetry.raw` | Telemetría cruda desde edge | Edge Gateway | TelemetryConsumerService |
| `scada.telemetry.validated` | Telemetría validada | TelemetryConsumerService | Rule Engine |
| `ct.alarms` | Alarmas específicas CT | Rule Engine | Alarm Service |
| `ct.fatigue.updated` | Actualizaciones de fatiga | Rule Engine | Frontend (WebSocket) |
| `calculation.request` | Solicitudes a Python | Rule Engine | Python Calc Service |
| `calculation.result` | Resultados de Python | Python Calc Service | Rule Engine |

### 6.2 Mensaje Ejemplo: scada.telemetry.raw

```json
{
  "messageId": "msg-20260112-104532-001",
  "timestamp": "2026-01-12T10:45:32.123Z",
  "dataSourceId": "ds-ct-unit-05",
  "edgeGatewayId": "edge-gw-maturin-01",
  "tenantId": "tenant-acme-petroleum",
  
  "tags": [
    {
      "name": "CT_DEPTH",
      "value": 8542.5,
      "unit": "ft",
      "quality": "GOOD",
      "timestamp": "2026-01-12T10:45:32.100Z"
    },
    {
      "name": "CT_WEIGHT",
      "value": -1250,
      "unit": "lbs",
      "quality": "GOOD",
      "timestamp": "2026-01-12T10:45:32.100Z"
    },
    {
      "name": "CT_SPEED",
      "value": 45.2,
      "unit": "ft/min",
      "quality": "GOOD",
      "timestamp": "2026-01-12T10:45:32.100Z"
    }
  ]
}
```

---

## 7. IMPLEMENTACIÓN

### 7.1 Checklist de Configuración

**Device Profiles** (2 profiles):
- [ ] `CT_UNIT_SENSORS_V1`: Sensores de superficie
- [ ] `CT_REEL_FATIGUE_V1`: Monitoreo de fatiga

**Connectivity Profiles** (1 profile):
- [ ] `CT_UNIT_MAPPING_V1`: Mapeo estándar CT Unit

**Asset Templates** (verificar del Bloque 1):
- [ ] `CT Unit Completo`: Template con todos los componentes

**Data Sources** (para seeds):
- [ ] `ds-ct-unit-03`: PLC de CT-Unit-03
- [ ] `ds-ct-unit-05`: PLC de CT-Unit-05
- [ ] `ds-ct-unit-07`: PLC de CT-Unit-07

**Device Bindings** (para seeds):
- [ ] Binding CT-Unit-03 → asset-ct-unit-03
- [ ] Binding CT-Unit-05 → asset-ct-unit-05
- [ ] Binding CT-Unit-07 → asset-ct-unit-07

### 7.2 UI de Configuración

Los Device Profiles y Connectivity Profiles se configuran en:

```
http://localhost:5173/device-profiles       (crear profiles)
http://localhost:5173/connectivity-profiles (crear mappings)
http://localhost:5173/device-bindings      (crear bindings)
```

### 7.3 Orden de Creación

1. **Asset Types** (del Bloque 1)
2. **Asset Templates** (del Bloque 1)
3. **Assets** (instancias de units, reels, etc.)
4. **Device Profiles** (definir tags)
5. **Connectivity Profiles** (definir mappings + rules)
6. **Data Sources** (configurar PLCs)
7. **Device Bindings** (conectar todo)

### 7.4 Scripts de Apoyo

**Script**: `seed-ct-edge-config.ts`

```typescript
// Ubicación: /src/backend/scripts/seed-ct-edge-config.ts

async function seedCtEdgeConfiguration() {
  // 1. Crear Device Profiles
  const ctUnitProfile = await createDeviceProfile({
    name: 'CT Unit - Sensores Estándar',
    code: 'CT_UNIT_SENSORS_V1',
    // ... (ver JSON arriba)
  });
  
  // 2. Crear Connectivity Profile
  const ctMappingProfile = await createConnectivityProfile({
    name: 'CT Unit - Standard Telemetry Mapping',
    code: 'CT_UNIT_MAPPING_V1',
    deviceProfileId: ctUnitProfile.id,
    // ...
  });
  
  // 3. Crear Data Sources (simulados para desarrollo)
  const dataSources = [];
  for (let i = 3; i <= 7; i += 2) {
    const ds = await createDataSource({
      name: `PLC CT Unit ${i.toString().padStart(2, '0')}`,
      code: `ds-ct-unit-${i.toString().padStart(2, '0')}`,
      protocol: 'MODBUS_TCP',
      connectionString: `modbus://192.168.10.${50 + i}:502`,
      deviceProfileId: ctUnitProfile.id
    });
    dataSources.push(ds);
  }
  
  // 4. Crear Device Bindings
  for (const ds of dataSources) {
    const unitNumber = ds.code.split('-').pop();
    const asset = await findAssetByCode(`CT-UNIT-${unitNumber}`);
    
    await createDeviceBinding({
      name: `CT Unit ${unitNumber} → Asset ${asset.code}`,
      dataSourceId: ds.id,
      digitalTwinId: asset.id,
      connectivityProfileId: ctMappingProfile.id,
      assetMappings: [
        { componentPath: 'root', assetId: asset.id, assetType: 'CT_UNIT' },
        // ... componentes
      ]
    });
  }
  
  console.log('✅ Configuración Edge para CT completada');
}
```

---

## 📊 CRITERIOS DE ÉXITO

- ✅ 2 Device Profiles creados y probados
- ✅ 1 Connectivity Profile funcional con mappings correctos
- ✅ 3 Data Sources configurados (CT-Unit-03, 05, 07)
- ✅ 3 Device Bindings activos
- ✅ Telemetría fluyendo: Edge → Kafka → asset_telemetry
- ✅ Tags visibles en UI `/device-bindings`
- ✅ Valores actualizándose en tiempo real

---

## 🔍 VALIDACIÓN

### Test 1: Flujo End-to-End

1. Iniciar Edge Gateway simulado
2. Publicar mensaje a Kafka topic `scada.telemetry.raw`
3. Verificar que `TelemetryConsumerService` lo procesa
4. Verificar que se guarda en `asset_telemetry`
5. Verificar que aparece en frontend `/digital-twins/{assetId}`

### Test 2: Device Binding

1. Ir a `/device-bindings`
2. Ver el binding de CT-Unit-05
3. Verificar que muestra "Status: CONNECTED"
4. Verificar "Last Update" reciente
5. Verificar valores de tags

---

**Siguiente bloque**: [03_MOTOR_REGLAS_NODOS_CT.md](./03_MOTOR_REGLAS_NODOS_CT.md) →
