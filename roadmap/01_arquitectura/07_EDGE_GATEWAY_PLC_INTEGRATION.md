# EDGE GATEWAY - INTEGRACIÓN CON PLCs PROPIETARIOS Y CONFIGURACIÓN VISUAL

## 1. Visión General

Extender el Edge Gateway actual (que soporta Modbus TCP) para integrar protocolos propietarios de PLCs industriales y proporcionar una interfaz visual para configurar fuentes de datos sin necesidad de editar código.

---

## 2. PLCs Propietarios Soportados

### 2.1 Allen-Bradley (Rockwell Automation)

**Protocolo**: EtherNet/IP (CIP)

**Librería Node.js**: `ethernet-ip` (https://github.com/cmseaton42/node-ethernet-ip)

```typescript
// Ejemplo de uso
import { Controller, Tag } from 'ethernet-ip';

const PLC = new Controller();
await PLC.connect('192.168.1.100', 0); // IP + slot

// Leer tag
const tag = new Tag('OilRate');
await PLC.readTag(tag);
console.log(tag.value); // 1234.56

// Escribir tag
tag.value = 2000;
await PLC.writeTag(tag);
```

**Características**:
- ✅ Lectura/escritura de tags por nombre (no direcciones numéricas)
- ✅ Soporte para tipos de datos complejos (UDT, arrays, strings)
- ✅ Descubrimiento automático de tags
- ✅ Suscripción a cambios (no polling)
- ✅ Soporta ControlLogix, CompactLogix, Micro800

**Instalación**:
```bash
npm install ethernet-ip
```

---

### 2.2 Siemens

**Protocolo**: S7 Communication (ISO-on-TCP)

**Librería Node.js**: `node-snap7` (https://github.com/mathiask88/node-snap7)

```typescript
// Ejemplo de uso
import { S7Client } from 'node-snap7';

const client = new S7Client();
await client.ConnectTo('192.168.1.101', 0, 1); // IP, rack, slot

// Leer DB (Data Block)
const buffer = await client.DBRead(1, 0, 10); // DB1, start 0, length 10
const value = buffer.readFloatBE(0);

// Escribir DB
const writeBuffer = Buffer.alloc(4);
writeBuffer.writeFloatBE(1234.56, 0);
await client.DBWrite(1, 0, 4, writeBuffer);
```

**Características**:
- ✅ Soporta S7-300, S7-400, S7-1200, S7-1500
- ✅ Lectura/escritura de DBs, Merkers, Inputs, Outputs
- ✅ Tipos de datos: BOOL, BYTE, WORD, DWORD, INT, REAL, STRING
- ✅ Lectura de múltiples áreas en una sola petición
- ⚠️ Requiere configuración de "Full access" en TIA Portal

**Instalación**:
```bash
npm install node-snap7
```

---

### 2.3 Schneider Electric (Modicon)

**Protocolo**: Modbus TCP (ya soportado) + Unity/SoMachine

**Librería adicional**: `node-modbus` (más completo que modbus-serial)

```bash
npm install modbus-serial jsmodbus
```

**Características**:
- ✅ Ya soportado vía Modbus TCP
- ✅ Modicon M340, M580 usan Modbus TCP estándar
- ℹ️ No requiere librería adicional

---

### 2.4 Omron

**Protocolo**: FINS (Factory Interface Network Service)

**Librería Node.js**: `omron-fins` (https://github.com/patrick--/node-omron-fins)

```typescript
// Ejemplo de uso
import { FinsClient } from 'omron-fins';

const client = new FinsClient(9600, '192.168.1.102');
await client.connect();

// Leer área de memoria
const data = await client.read('D100', 10); // D100-D109
console.log(data);

// Escribir
await client.write('D100', [1234, 5678]);
```

**Características**:
- ✅ Soporta CP1L, CP1H, CJ2M, NJ/NX series
- ✅ Lectura/escritura de áreas: DM, CIO, WR, HR, AR
- ✅ Comunicación UDP o TCP
- ⚠️ Requiere configuración de FINS en PLC

**Instalación**:
```bash
npm install omron-fins
```

---

### 2.5 Mitsubishi

**Protocolo**: MC Protocol (MELSEC Communication Protocol)

**Librería Node.js**: `node-mcprotocol` (https://github.com/plcpeople/nodemc)

```typescript
// Ejemplo de uso
import { MCProtocol } from 'node-mcprotocol';

const client = new MCProtocol();
client.initiateConnection({
  host: '192.168.1.103',
  port: 5007
});

// Leer dispositivos
const values = await client.readItems(['D100', 'D101', 'D102']);
console.log(values);

// Escribir
await client.writeItems(['D100'], [1234]);
```

**Características**:
- ✅ Soporta Q Series, L Series, iQ-R Series
- ✅ Lectura/escritura de dispositivos: D, M, X, Y, etc.
- ✅ Protocolo binario (más rápido que ASCII)
- ⚠️ Requiere habilitar MC Protocol en PLC

**Instalación**:
```bash
npm install node-mcprotocol
```

---

### 2.6 GE/Emerson (ahora Emerson)

**Protocolo**: SRTP (Service Request Transport Protocol)

**Librería Node.js**: No hay librería Node.js madura

**Alternativa**: Usar OPC-UA (GE PLCs modernos soportan OPC-UA)

```typescript
// Ya soportado con node-opcua
import { OPCUAClient } from 'node-opcua';
// Ver implementación en sección OPC-UA
```

**Recomendación**: Implementar soporte vía OPC-UA en lugar de SRTP propietario.

---

### 2.7 Resumen de Soporte

| Fabricante | Protocolo | Librería Node.js | Estado | Prioridad |
|------------|-----------|------------------|--------|-----------|
| **Allen-Bradley** | EtherNet/IP | `ethernet-ip` | ✅ Disponible | 🔴 Alta |
| **Siemens** | S7 Comm | `node-snap7` | ✅ Disponible | 🔴 Alta |
| **Schneider** | Modbus TCP | `modbus-serial` | ✅ Ya implementado | 🟢 Completado |
| **Omron** | FINS | `omron-fins` | ✅ Disponible | 🟡 Media |
| **Mitsubishi** | MC Protocol | `node-mcprotocol` | ✅ Disponible | 🟡 Media |
| **GE/Emerson** | SRTP | - | ❌ No disponible | 🟢 Usar OPC-UA |
| **Genérico** | OPC-UA | `node-opcua` | ✅ Ya instalado | 🔴 Alta |

---

## 3. Arquitectura de Drivers Propietarios

### 3.1 Estructura de Servicios

```
src/edge/src/services/
├── protocols/
│   ├── modbus.service.ts          # ✅ Ya implementado
│   ├── opcua.service.ts           # 🆕 A implementar
│   ├── ethernet-ip.service.ts     # 🆕 Allen-Bradley
│   ├── s7.service.ts              # 🆕 Siemens
│   ├── fins.service.ts            # 🆕 Omron
│   └── mc-protocol.service.ts     # 🆕 Mitsubishi
├── protocol-factory.service.ts    # 🆕 Factory pattern
└── data-collector.service.ts      # ✅ Ya existe, extender
```

### 3.2 Interfaz Común de Protocolo

```typescript
// src/edge/src/services/protocols/protocol-interface.ts
export interface IProtocolDriver {
  // Conexión
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // Lectura
  readTag(tagConfig: TagConfig): Promise<TagValue>;
  readTags(tagConfigs: TagConfig[]): Promise<TagValue[]>;

  // Escritura (opcional)
  writeTag(tagConfig: TagConfig, value: any): Promise<void>;

  // Descubrimiento (opcional)
  discoverTags?(): Promise<TagMetadata[]>;

  // Health check
  healthCheck(): Promise<ProtocolHealth>;
}

export interface TagValue {
  tagId: string;
  value: number | string | boolean;
  quality: 'good' | 'bad' | 'uncertain';
  timestamp: Date;
}

export interface ProtocolHealth {
  connected: boolean;
  latencyMs: number;
  errorCount: number;
  lastError?: string;
}
```

### 3.3 Factory Pattern

```typescript
// src/edge/src/services/protocol-factory.service.ts
export class ProtocolFactory {
  static createDriver(protocol: ProtocolType, config: any): IProtocolDriver {
    switch (protocol) {
      case 'modbus':
        return new ModbusService(config);
      case 'opcua':
        return new OpcuaService(config);
      case 'ethernet-ip':
        return new EthernetIpService(config);
      case 's7':
        return new S7Service(config);
      case 'fins':
        return new FinsService(config);
      case 'mc-protocol':
        return new McProtocolService(config);
      default:
        throw new Error(`Unsupported protocol: ${protocol}`);
    }
  }
}
```

---

## 4. Interfaz Visual de Configuración

### 4.1 Visión

Proporcionar una interfaz web en el **Backend (Cloud)** para que los usuarios configuren fuentes de datos (PLCs, sensores) sin editar código. La configuración se almacena en PostgreSQL y se sincroniza con los Edge Gateways.

### 4.2 Modelo de Datos

```typescript
// Tabla: data_sources (fuentes de datos)
{
  id: uuid,
  tenant_id: uuid,
  name: string,                    // "PLC Campo Morichal"
  description: string,
  protocol: enum,                  // 'modbus', 'ethernet-ip', 's7', 'opcua', etc.
  connection_config: jsonb,        // Config específico del protocolo
  enabled: boolean,
  gateway_id: uuid,                // Edge Gateway asignado
  device_profile_id: uuid | null,  // 🆕 FK → device_profiles (ver 15_DATA_SOURCE_DIGITAL_TWIN_MAPPING.md)
  created_at: timestamp,
  updated_at: timestamp
}

// 🆕 NOTA: El campo device_profile_id vincula esta Data Source a un Device Profile
// que define el schema de telemetría esperado y la Rule Chain por defecto.
// Ver roadmap: 15_DATA_SOURCE_DIGITAL_TWIN_MAPPING.md para detalles completos.

// Tabla: data_source_tags (tags configurados)
{
  id: uuid,
  data_source_id: uuid,
  tag_id: string,                  // "WELL-001.OIL_RATE"
  asset_id: uuid,                  // Referencia a asset (Digital Twin)
  description: string,
  protocol_config: jsonb,          // Config específico (address, dataType, etc.)
  unit: string,                    // "BOPD", "PSI", "DEGF"
  scan_rate_ms: integer,           // Frecuencia de polling
  deadband: float,                 // Filtro de cambio mínimo
  enabled: boolean,
  created_at: timestamp,
  updated_at: timestamp
}

// Tabla: edge_gateways (gateways registrados)
{
  id: uuid,
  tenant_id: uuid,
  gateway_id: string,              // "edge-gateway-001"
  name: string,
  site_name: string,
  status: enum,                    // 'online', 'offline', 'error'
  last_heartbeat: timestamp,
  version: string,
  config_version: integer,         // Para detectar cambios de config
  created_at: timestamp,
  updated_at: timestamp
}
```

### 4.3 API Endpoints (Backend)

```typescript
// Data Sources
POST   /api/v1/data-sources              // Crear fuente de datos
GET    /api/v1/data-sources              // Listar fuentes
GET    /api/v1/data-sources/:id          // Obtener fuente
PUT    /api/v1/data-sources/:id          // Actualizar fuente
DELETE /api/v1/data-sources/:id          // Eliminar fuente
POST   /api/v1/data-sources/:id/test     // Test de conexión

// Tags
POST   /api/v1/data-sources/:id/tags     // Crear tag
GET    /api/v1/data-sources/:id/tags     // Listar tags de fuente
PUT    /api/v1/data-sources/:id/tags/:tagId  // Actualizar tag
DELETE /api/v1/data-sources/:id/tags/:tagId  // Eliminar tag
POST   /api/v1/data-sources/:id/discover // Descubrir tags automáticamente

// Edge Gateways
GET    /api/v1/edge-gateways             // Listar gateways
GET    /api/v1/edge-gateways/:id         // Obtener gateway
PUT    /api/v1/edge-gateways/:id         // Actualizar gateway
GET    /api/v1/edge-gateways/:id/status  // Estado en tiempo real
POST   /api/v1/edge-gateways/:id/sync    // Forzar sincronización de config
```

### 4.4 Frontend - Páginas

#### 4.4.1 Página: Data Sources List

**Ruta**: `/data-sources`

**Componentes**:
- Tabla de fuentes de datos con filtros
- Badges de estado (online/offline)
- Botón "Add Data Source"
- Acciones: Edit, Delete, Test Connection

**Mockup**:
```
┌─────────────────────────────────────────────────────────────┐
│ Data Sources                                    [+ Add New] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 🔍 Search: [____________]  Protocol: [All ▾]  Status: [All ▾]│
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Name              Protocol    Gateway      Status  Actions││
│ ├──────────────────────────────────────────────────────────┤│
│ │ PLC Morichal      Modbus TCP  Gateway-001  🟢 Online  ⚙️ 🗑️││
│ │ PLC Oficina       EtherNet/IP Gateway-001  🟢 Online  ⚙️ 🗑️││
│ │ SCADA Server      OPC-UA      Gateway-002  🔴 Offline ⚙️ 🗑️││
│ │ Siemens S7-1500   S7 Comm     Gateway-001  🟢 Online  ⚙️ 🗑️││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ Showing 4 of 4 data sources                                 │
└─────────────────────────────────────────────────────────────┘
```

#### 4.4.2 Página: Data Source Form (Create/Edit)

**Ruta**: `/data-sources/new` o `/data-sources/:id/edit`

**Componentes**:
- Formulario multi-step:
  1. **Basic Info**: Name, Description, Protocol
  2. **Connection**: Config específico del protocolo (dinámico)
  3. **Gateway Assignment**: Seleccionar Edge Gateway
  4. **Test Connection**: Botón para probar antes de guardar

**Mockup**:
```
┌─────────────────────────────────────────────────────────────┐
│ Add Data Source                                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Step 1: Basic Information                                   │
│                                                              │
│ Name *                                                       │
│ [PLC Campo Morichal                                       ] │
│                                                              │
│ Description                                                  │
│ [PLC principal del campo Morichal                         ] │
│                                                              │
│ Protocol *                                                   │
│ [Modbus TCP          ▾]                                     │
│                                                              │
│ ─────────────────────────────────────────────────────────   │
│                                                              │
│ Step 2: Connection Configuration                            │
│                                                              │
│ Host/IP Address *                                            │
│ [192.168.1.100                                            ] │
│                                                              │
│ Port *                                                       │
│ [502                                                      ] │
│                                                              │
│ Unit ID                                                      │
│ [1                                                        ] │
│                                                              │
│ Timeout (ms)                                                 │
│ [5000                                                     ] │
│                                                              │
│ ─────────────────────────────────────────────────────────   │
│                                                              │
│ Step 3: Gateway Assignment                                  │
│                                                              │
│ Edge Gateway *                                               │
│ [Gateway-001 (Site Alpha) ▾]                                │
│                                                              │
│ ─────────────────────────────────────────────────────────   │
│                                                              │
│ [Test Connection]              [Cancel]  [Save Data Source] │
└─────────────────────────────────────────────────────────────┘
```

**Configuraciones dinámicas por protocolo**:

```typescript
// Modbus TCP
{
  host: string,
  port: number,
  unitId: number,
  timeout: number
}

// EtherNet/IP (Allen-Bradley)
{
  host: string,
  slot: number,
  timeout: number
}

// S7 (Siemens)
{
  host: string,
  rack: number,
  slot: number,
  connectionType: 'PG' | 'OP' | 'S7Basic'
}

// OPC-UA
{
  endpointUrl: string,
  securityMode: 'None' | 'Sign' | 'SignAndEncrypt',
  securityPolicy: string,
  username?: string,
  password?: string
}

// FINS (Omron)
{
  host: string,
  port: number,
  dna: number,  // Destination Network Address
  da1: number,  // Destination Node Address
  da2: number   // Destination Unit Address
}
```

#### 4.4.3 Página: Tag Configuration

**Ruta**: `/data-sources/:id/tags`

**Componentes**:
- Tabla de tags configurados
- Botón "Add Tag" (manual)
- Botón "Discover Tags" (automático, si el protocolo lo soporta)
- Editor inline de tags
- Drag & drop para asociar tags a assets (Digital Twins)

**Mockup**:
```
┌─────────────────────────────────────────────────────────────┐
│ PLC Campo Morichal - Tags                                   │
│ [← Back to Data Sources]                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ [+ Add Tag]  [🔍 Discover Tags]  [📥 Import CSV]            │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Tag ID          Asset      Address  Type    Scan  Actions││
│ ├──────────────────────────────────────────────────────────┤│
│ │ WELL-001.OIL    Well-001   40001    float32 5s    ✏️ 🗑️  ││
│ │ WELL-001.GAS    Well-001   40003    float32 5s    ✏️ 🗑️  ││
│ │ WELL-001.PRESS  Well-001   40005    float32 2s    ✏️ 🗑️  ││
│ │ SEP-01.LEVEL    Sep-01     40010    float32 10s   ✏️ 🗑️  ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ Showing 4 tags                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 4.4.4 Modal: Add/Edit Tag

```
┌─────────────────────────────────────────────────────────────┐
│ Add Tag                                              [✕]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Tag ID *                                                     │
│ [WELL-002.TEMPERATURE                                     ] │
│                                                              │
│ Description                                                  │
│ [Wellhead temperature sensor                              ] │
│                                                              │
│ Asset (Digital Twin)                                         │
│ [Select asset...                                          ▾]│
│                                                              │
│ ─── Protocol Configuration ─────────────────────────────    │
│                                                              │
│ Register Address *                                           │
│ [40020                                                    ] │
│                                                              │
│ Data Type *                                                  │
│ [float32 (2 registers)                                    ▾]│
│                                                              │
│ ─── Acquisition Settings ───────────────────────────────    │
│                                                              │
│ Scan Rate (ms) *                                             │
│ [10000                                                    ] │
│                                                              │
│ Deadband (min change to publish)                            │
│ [1.0                                                      ] │
│                                                              │
│ Unit                                                         │
│ [DEGF                                                     ] │
│                                                              │
│ ─── Alarms (Optional) ──────────────────────────────────    │
│                                                              │
│ [+ Add Alarm]                                               │
│                                                              │
│                                    [Cancel]  [Save Tag]     │
└─────────────────────────────────────────────────────────────┘
```

#### 4.4.5 Página: Edge Gateways

**Ruta**: `/edge-gateways`

**Componentes**:
- Lista de Edge Gateways registrados
- Estado en tiempo real (heartbeat)
- Botón "Sync Configuration" para forzar actualización
- Métricas: CPU, memoria, tags/sec, latencia

**Mockup**:
```
┌─────────────────────────────────────────────────────────────┐
│ Edge Gateways                                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Gateway ID    Site       Status   Last Seen    Actions   ││
│ ├──────────────────────────────────────────────────────────┤│
│ │ Gateway-001   Site Alpha 🟢 Online 2 min ago   🔄 ⚙️     ││
│ │ Gateway-002   Site Beta  🔴 Offline 2 hours ago 🔄 ⚙️     ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Gateway-001 - Metrics                                   │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ CPU: 12%  Memory: 45%  Tags/sec: 120  Latency: 15ms    │ │
│ │                                                         │ │
│ │ Data Sources: 3 active, 0 errors                        │ │
│ │ Tags: 45 configured, 45 reading                         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 4.5 Flujo de Configuración

```
┌─────────────────────────────────────────────────────────────┐
│                  FLUJO DE CONFIGURACIÓN                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Usuario crea Data Source en Frontend                    │
│     ↓                                                        │
│  2. Backend guarda en PostgreSQL (data_sources)             │
│     ↓                                                        │
│  3. Backend publica evento Kafka: "config.changed"          │
│     ↓                                                        │
│  4. Edge Gateway suscrito a Kafka recibe evento             │
│     ↓                                                        │
│  5. Edge Gateway consulta API: GET /edge-gateways/:id/config│
│     ↓                                                        │
│  6. Edge Gateway actualiza configuración local              │
│     ↓                                                        │
│  7. Edge Gateway reinicia Data Collector con nueva config   │
│     ↓                                                        │
│  8. Edge Gateway envía ACK: "config.applied"                │
│     ↓                                                        │
│  9. Backend actualiza estado en DB                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.6 Sincronización Edge ↔ Cloud

```typescript
// Edge Gateway: Config Sync Service
export class ConfigSyncService {
  private configVersion: number = 0;

  async start() {
    // Polling cada 30 segundos
    setInterval(() => this.checkForUpdates(), 30000);

    // Suscripción a Kafka para updates inmediatos
    await this.subscribeToConfigChanges();
  }

  async checkForUpdates() {
    const response = await fetch(
      `${config.cloudApiUrl}/edge-gateways/${config.gatewayId}/config-version`
    );
    const { version } = await response.json();

    if (version > this.configVersion) {
      await this.syncConfiguration();
    }
  }

  async syncConfiguration() {
    // 1. Descargar configuración completa
    const response = await fetch(
      `${config.cloudApiUrl}/edge-gateways/${config.gatewayId}/config`
    );
    const newConfig = await response.json();

    // 2. Validar configuración
    const validation = this.validateConfig(newConfig);
    if (!validation.valid) {
      logger.error('Invalid config received', validation.errors);
      return;
    }

    // 3. Aplicar configuración
    await this.applyConfiguration(newConfig);

    // 4. Actualizar versión local
    this.configVersion = newConfig.version;

    // 5. Enviar ACK a Cloud
    await this.sendConfigAck(newConfig.version);
  }

  async applyConfiguration(config: EdgeConfig) {
    // Reiniciar Data Collector con nueva configuración
    await dataCollectorService.stop();
    await dataCollectorService.loadConfiguration(config);
    await dataCollectorService.start();
  }
}
```

---

## 5. Plan de Implementación

### 5.1 Fase 1: Protocolos Propietarios (2 semanas)

**Prioridad Alta**:

1. **Allen-Bradley (EtherNet/IP)** - 3 días
   - Instalar `ethernet-ip`
   - Crear `ethernet-ip.service.ts`
   - Implementar interfaz `IProtocolDriver`
   - Tests con PLC virtual o simulador

2. **Siemens (S7)** - 3 días
   - Instalar `node-snap7`
   - Crear `s7.service.ts`
   - Implementar interfaz `IProtocolDriver`
   - Tests con PLCSIM Advanced

3. **OPC-UA** - 4 días
   - Crear `opcua.service.ts` (librería ya instalada)
   - Implementar suscripciones (no polling)
   - Soporte para autenticación
   - Tests con servidor OPC-UA público

4. **Protocol Factory** - 2 días
   - Crear `protocol-factory.service.ts`
   - Refactorizar `data-collector.service.ts` para usar factory
   - Tests unitarios

**Prioridad Media** (opcional):

5. **Omron (FINS)** - 2 días
6. **Mitsubishi (MC Protocol)** - 2 días

### 5.2 Fase 2: Backend API (1 semana)

1. **Modelo de datos** - 1 día
   - Crear esquemas Drizzle: `data_sources`, `data_source_tags`, `edge_gateways`
   - Generar migración
   - Aplicar a PostgreSQL

2. **Módulo Data Sources** - 2 días
   - `data-sources.repository.ts`
   - `data-sources.service.ts`
   - `data-sources.controller.ts`
   - `data-sources.routes.ts`
   - Endpoints CRUD

3. **Módulo Edge Gateways** - 2 días
   - `edge-gateways.repository.ts`
   - `edge-gateways.service.ts`
   - `edge-gateways.controller.ts`
   - `edge-gateways.routes.ts`
   - Endpoint de configuración

4. **Config Sync** - 2 días
   - Kafka topic: `edge.config.changed`
   - Endpoint: `GET /edge-gateways/:id/config`
   - Versionado de configuración

### 5.3 Fase 3: Frontend UI (1 semana)

1. **Tipos TypeScript** - 0.5 días
   - `data-sources.types.ts`
   - `edge-gateways.types.ts`

2. **API Clients** - 0.5 días
   - `data-sources.api.ts` (React Query)
   - `edge-gateways.api.ts`

3. **Componentes UI** - 1 día
   - `DataSourceForm.tsx`
   - `TagConfigForm.tsx`
   - `ProtocolConfigFields.tsx` (dinámico por protocolo)

4. **Páginas** - 2 días
   - `DataSourcesPage.tsx`
   - `DataSourceDetailPage.tsx`
   - `EdgeGatewaysPage.tsx`

5. **Integración y tests** - 1 día

### 5.4 Fase 4: Edge Gateway Sync (3 días)

1. **Config Sync Service** - 2 días
   - `config-sync.service.ts`
   - Polling + Kafka subscription
   - Validación de configuración
   - Aplicación de configuración

2. **Heartbeat Service** - 1 día
   - Envío periódico de heartbeat a Cloud
   - Métricas: CPU, memoria, tags/sec

---

## 6. Consideraciones de Seguridad

### 6.1 Credenciales de PLCs

- **Nunca** almacenar contraseñas en texto plano
- Usar `crypto` de Node.js para encriptar credenciales en DB
- Desencriptar solo en Edge Gateway (no en Cloud)

```typescript
// Backend: Encriptar antes de guardar
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

// Edge: Desencriptar
function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, encryptedHex] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encryptedBuffer = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encryptedBuffer) + decipher.final('utf8');
}
```

### 6.2 Segregación de Redes

- Edge Gateway debe estar en red OT (Operational Technology)
- Firewall entre OT e IT
- Solo Edge Gateway puede iniciar conexiones hacia Cloud

### 6.3 Validación de Configuración

- Validar configuración antes de aplicar en Edge
- Rollback automático si falla health check después de aplicar
- Logs de auditoría de cambios de configuración

---

## 7. Testing

### 7.1 Simuladores de PLCs

**Allen-Bradley**:
- Usar Studio 5000 Emulate (Windows)
- O usar servidor OPC-UA genérico

**Siemens**:
- PLCSIM Advanced (Windows)
- O usar `node-snap7` en modo servidor

**Modbus**:
- `modbus-server` (npm package)
```bash
npm install -g modbus-server
modbus-server --port 502
```

**OPC-UA**:
- Prosys OPC-UA Simulation Server (gratuito)
- O `node-opcua` en modo servidor

### 7.2 Tests Unitarios

```typescript
// ethernet-ip.service.test.ts
describe('EthernetIpService', () => {
  it('should connect to PLC', async () => {
    const service = new EthernetIpService({ host: '192.168.1.100', slot: 0 });
    await service.connect();
    expect(service.isConnected()).toBe(true);
  });

  it('should read tag value', async () => {
    const tagConfig = { tagId: 'OilRate', address: 'OilRate', dataType: 'REAL' };
    const result = await service.readTag(tagConfig);
    expect(result.quality).toBe('good');
    expect(typeof result.value).toBe('number');
  });
});
```

### 7.3 Tests de Integración

- Test de sincronización Edge ↔ Cloud
- Test de aplicación de configuración
- Test de rollback en caso de error

---

## 8. Documentación

### 8.1 Guías de Usuario

- **Cómo agregar un PLC Allen-Bradley**
- **Cómo agregar un PLC Siemens S7**
- **Cómo configurar OPC-UA**
- **Troubleshooting de conexiones**

### 8.2 Guías de Desarrollador

- **Cómo agregar soporte para un nuevo protocolo**
- **Arquitectura de drivers**
- **API de configuración**

---

## 9. Roadmap Visual

```
FASE 1: Protocolos Propietarios (2 semanas)
├── Allen-Bradley (EtherNet/IP) ████████░░ 80%
├── Siemens (S7)                ████████░░ 80%
├── OPC-UA                      ██████░░░░ 60%
├── Protocol Factory            ████░░░░░░ 40%
└── Tests                       ██░░░░░░░░ 20%

FASE 2: Backend API (1 semana)
├── Modelo de datos             ░░░░░░░░░░ 0%
├── Módulo Data Sources         ░░░░░░░░░░ 0%
├── Módulo Edge Gateways        ░░░░░░░░░░ 0%
└── Config Sync                 ░░░░░░░░░░ 0%

FASE 3: Frontend UI (1 semana)
├── Tipos TypeScript            ░░░░░░░░░░ 0%
├── API Clients                 ░░░░░░░░░░ 0%
├── Componentes UI              ░░░░░░░░░░ 0%
└── Páginas                     ░░░░░░░░░░ 0%

FASE 4: Edge Gateway Sync (3 días)
├── Config Sync Service         ░░░░░░░░░░ 0%
└── Heartbeat Service           ░░░░░░░░░░ 0%
```

---

## 10. Próximos Pasos Inmediatos

1. ✅ **Revisar y aprobar este roadmap**
2. ⬜ Instalar librerías de protocolos propietarios
3. ⬜ Implementar `IProtocolDriver` interface
4. ⬜ Crear `EthernetIpService` (Allen-Bradley)
5. ⬜ Crear `S7Service` (Siemens)
6. ⬜ Crear `OpcuaService`
7. ⬜ Implementar `ProtocolFactory`
8. ⬜ Refactorizar `DataCollectorService`

**Tiempo estimado total**: 4-5 semanas

**Recursos necesarios**:
- 1 desarrollador backend (Node.js/TypeScript)
- 1 desarrollador frontend (React)
- Acceso a PLCs de prueba o simuladores
- Documentación de protocolos propietarios
