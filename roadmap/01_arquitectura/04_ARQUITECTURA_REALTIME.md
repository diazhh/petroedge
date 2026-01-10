# ARQUITECTURA DE PROCESAMIENTO EN TIEMPO REAL

> **⚠️ ACTUALIZACIÓN**: Este documento ha sido actualizado para reflejar la arquitectura de microservicios con separación API/Worker.  
> **Arquitectura completa**: Ver `10_ECLIPSE_DITTO_RULE_ENGINE_ADVANCED.md`

## 1. Visión General

Este documento define la arquitectura de procesamiento de datos en tiempo real para el sistema SCADA+ERP. El objetivo es minimizar consultas a la base de datos y proporcionar actualizaciones instantáneas al frontend mediante un flujo de datos optimizado.

**Cambios arquitectónicos (2026-01-10)**:
- **API Service** (Fastify): Solo maneja endpoints REST, autenticación y lógica de negocio síncrona
- **Worker Service** (Node.js): Maneja todos los consumers de Kafka, Rule Engine, alarmas, WebSocket
- **Eclipse Ditto**: Framework de Digital Twins que reemplaza implementación custom de assets

---

## 2. Arquitectura del Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA DE PROCESAMIENTO EN TIEMPO REAL                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   ┌──────────────┐                                                                  │
│   │   SENSORES   │  Modbus/OPC-UA                                                   │
│   │   & PLCs     │────────────────┐                                                 │
│   └──────────────┘                │                                                 │
│                                   ▼                                                 │
│                          ┌─────────────────┐                                        │
│                          │   EDGE GATEWAY   │                                        │
│                          │  (Protocolo →    │                                        │
│                          │   Kafka)         │                                        │
│                          └────────┬────────┘                                        │
│                                   │                                                 │
│                                   ▼                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐      │
│   │                           KAFKA BROKER                                    │      │
│   │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │      │
│   │  │  telemetry.  │ │  well-test.  │ │  drilling.   │ │  alarms.     │   │      │
│   │  │  raw         │ │  readings    │ │  realtime    │ │  critical    │   │      │
│   │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   │      │
│   └────────────────────────────┬────────────────────────────────────────────┘      │
│                                │                                                    │
│          ┌─────────────────────┼─────────────────────┐                             │
│          │                     │                     │                             │
│          ▼                     ▼                     ▼                             │
│   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐                        │
│   │  PERSISTENCE │      │  CALCULATION │      │  WEBSOCKET  │                        │
│   │  SERVICE     │      │  ENGINE      │      │  GATEWAY    │                        │
│   │              │      │              │      │             │                        │
│   │  Kafka →     │      │  Kafka →     │      │  Kafka →    │                        │
│   │  PostgreSQL  │      │  Cálculos →  │      │  WebSocket  │                        │
│   │  TimescaleDB │      │  Kafka/Redis │      │  Broadcast  │                        │
│   └──────┬──────┘      └──────┬──────┘      └──────┬──────┘                        │
│          │                     │                     │                             │
│          ▼                     ▼                     ▼                             │
│   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐                        │
│   │  PostgreSQL │      │    REDIS    │      │  FRONTEND   │                        │
│   │  TimescaleDB│◄────►│   (Cache)   │      │  Dashboard  │                        │
│   │             │      │             │      │  (React)    │                        │
│   └─────────────┘      └─────────────┘      └─────────────┘                        │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Componentes del Sistema

### 3.1 Kafka Topics por Módulo

| Topic | Productores | Consumidores | Propósito |
|-------|-------------|--------------|-----------|
| `telemetry.raw` | Edge Gateway | Persistence, Calculation Engine | Datos crudos de sensores |
| `telemetry.processed` | Calculation Engine | WebSocket Gateway, Persistence | Datos procesados |
| `well-test.readings` | Edge Gateway, API | Persistence, Calculation Engine | Lecturas de pruebas |
| `well-test.calculations` | Calculation Engine | WebSocket Gateway, Persistence | IPR/VLP/Nodal calculados |
| `drilling.realtime` | Edge Gateway | Persistence, Calculation Engine | Datos de perforación |
| `drilling.calculations` | Calculation Engine | WebSocket Gateway, Persistence | MSE, T&D calculados |
| `production.realtime` | Edge Gateway | Persistence, Calculation Engine | Datos de producción |
| `production.calculations` | Calculation Engine | WebSocket Gateway, Persistence | Optimización ESP/GL |
| `alarms.critical` | All modules | WebSocket Gateway, Persistence | Alarmas críticas |
| `alarms.warnings` | All modules | Persistence | Warnings no críticos |
| `events.system` | All modules | Persistence, Audit | Eventos de sistema |

### 3.2 Servicios de Procesamiento

#### 3.2.1 Persistence Service
```typescript
// Responsabilidad: Guardar datos en DB
// Suscrito a: Todos los topics de datos
// Produce: Nada (terminal)

interface PersistenceService {
  // Consume de Kafka y guarda en DB
  consumeAndPersist(topic: string): void;
  
  // Batch insert para alto volumen
  batchInsert(records: TelemetryRecord[]): Promise<void>;
  
  // Downsampling automático para datos históricos
  downsample(interval: '1min' | '5min' | '1hour'): void;
}
```

#### 3.2.2 Calculation Engine
```typescript
// Responsabilidad: Cálculos en tiempo real
// Suscrito a: Topics de datos crudos
// Produce: Topics de cálculos procesados

interface CalculationEngine {
  // Cálculos Well Testing
  calculateIprRealtime(data: WellTestReading): IprResult;
  calculateVlpRealtime(data: WellTestReading): VlpResult;
  calculateNodalRealtime(data: WellTestReading): NodalResult;
  
  // Cálculos Drilling
  calculateMseRealtime(data: DrillingData): MseResult;
  calculateTorqueDragRealtime(data: DrillingData): TorqueDragResult;
  
  // Cálculos Production
  calculateEspEfficiency(data: ProductionData): EspResult;
  calculateGasLiftOptimization(data: ProductionData): GasLiftResult;
  
  // Alarmas calculadas
  checkThresholds(data: any, config: AlarmConfig): Alarm[];
}
```

#### 3.2.3 WebSocket Gateway
```typescript
// Responsabilidad: Broadcast a clientes
// Suscrito a: Topics de datos procesados
// Produce: WebSocket messages

interface WebSocketGateway {
  // Gestión de conexiones
  connections: Map<string, WebSocketConnection>;
  
  // Suscripciones por room (well, field, etc.)
  subscriptions: Map<string, Set<string>>;
  
  // Broadcast a clientes suscritos
  broadcast(room: string, event: string, data: any): void;
  
  // Filtrado de datos por permisos
  filterByPermissions(userId: string, data: any): any;
}
```

---

## 4. Redis: Caché y Estado

### 4.1 Casos de Uso de Redis

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USO DE REDIS                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. CACHÉ DE DATOS FRECUENTES                                       │
│     ├── Últimos valores de sensores (TTL: 5min)                     │
│     ├── Configuración de pozos activos                              │
│     ├── Umbrales de alarmas                                         │
│     └── Resultados de cálculos recientes                            │
│                                                                      │
│  2. ESTADO EN TIEMPO REAL                                           │
│     ├── Estado actual de cada pozo                                  │
│     ├── Usuarios conectados por WebSocket                           │
│     ├── Suscripciones activas                                       │
│     └── Locks para operaciones críticas                             │
│                                                                      │
│  3. RATE LIMITING Y THROTTLING                                      │
│     ├── Límites de API por usuario                                  │
│     ├── Throttling de cálculos costosos                             │
│     └── Debounce de actualizaciones frecuentes                      │
│                                                                      │
│  4. PUB/SUB INTERNO                                                 │
│     ├── Notificaciones entre servicios                              │
│     ├── Invalidación de caché                                       │
│     └── Sincronización de estado                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Estructura de Keys en Redis

```typescript
// Patrones de keys
const REDIS_KEYS = {
  // Caché de telemetría actual
  TELEMETRY_CURRENT: 'telemetry:{wellId}:current',          // Hash
  TELEMETRY_HISTORY: 'telemetry:{wellId}:history:{metric}', // Sorted Set (últimos 100 valores)
  
  // Estado de pozos
  WELL_STATE: 'well:{wellId}:state',                        // Hash
  WELL_CONFIG: 'well:{wellId}:config',                      // Hash (cached from DB)
  
  // Cálculos en caché
  CALC_IPR: 'calc:ipr:{wellId}:{timestamp}',                // String (JSON)
  CALC_VLP: 'calc:vlp:{wellId}:{timestamp}',                // String (JSON)
  CALC_NODAL: 'calc:nodal:{wellId}:{timestamp}',            // String (JSON)
  
  // Alarmas activas
  ALARMS_ACTIVE: 'alarms:active:{tenantId}',                // Sorted Set (por severidad)
  ALARM_STATE: 'alarm:{alarmId}:state',                     // Hash
  
  // WebSocket
  WS_CONNECTIONS: 'ws:connections',                          // Set
  WS_SUBSCRIPTIONS: 'ws:subs:{room}',                       // Set
  WS_USER_ROOMS: 'ws:user:{userId}:rooms',                  // Set
  
  // Rate limiting
  RATE_LIMIT: 'ratelimit:{userId}:{endpoint}',              // Counter with TTL
  
  // Locks
  LOCK: 'lock:{resource}',                                  // String with TTL
};
```

---

## 5. WebSocket: Comunicación con Frontend

### 5.1 Eventos WebSocket

```typescript
// Server → Client Events
interface ServerToClientEvents {
  // Telemetría
  'telemetry:update': (data: TelemetryUpdate) => void;
  'telemetry:batch': (data: TelemetryBatch) => void;
  
  // Cálculos
  'calculation:ipr': (data: IprResult) => void;
  'calculation:vlp': (data: VlpResult) => void;
  'calculation:nodal': (data: NodalResult) => void;
  
  // Alarmas
  'alarm:new': (alarm: Alarm) => void;
  'alarm:ack': (alarmId: string) => void;
  'alarm:clear': (alarmId: string) => void;
  
  // Estado
  'well:status': (data: WellStatus) => void;
  'system:status': (data: SystemStatus) => void;
}

// Client → Server Events
interface ClientToServerEvents {
  // Suscripciones
  'subscribe:well': (wellId: string) => void;
  'subscribe:field': (fieldId: string) => void;
  'subscribe:alarms': (tenantId: string) => void;
  'unsubscribe': (room: string) => void;
  
  // Comandos
  'command:ack-alarm': (alarmId: string) => void;
  'command:request-calculation': (params: CalcRequest) => void;
}
```

### 5.2 Rooms y Suscripciones

```typescript
// Estructura de rooms
const ROOMS = {
  // Por pozo individual
  WELL: 'well:{wellId}',                    // Telemetría + estado de un pozo
  
  // Por campo (todos los pozos)
  FIELD: 'field:{fieldId}',                 // Telemetría agregada del campo
  
  // Alarmas por tenant
  ALARMS: 'alarms:{tenantId}',              // Todas las alarmas del tenant
  ALARMS_CRITICAL: 'alarms:{tenantId}:critical',
  
  // Dashboards específicos
  DASHBOARD_PRODUCTION: 'dashboard:production:{tenantId}',
  DASHBOARD_DRILLING: 'dashboard:drilling:{tenantId}',
  
  // Broadcast global
  SYSTEM: 'system:{tenantId}',              // Notificaciones de sistema
};
```

---

## 6. Flujo de Datos por Caso de Uso

### 6.1 Telemetría de Pozo (Tiempo Real)

```
┌─────────┐    ┌───────────┐    ┌───────┐    ┌─────────────┐
│ Sensor  │───▶│Edge       │───▶│Kafka  │───▶│Persistence  │───▶ PostgreSQL
│         │    │Gateway    │    │       │    │Service      │
└─────────┘    └───────────┘    │       │    └─────────────┘
                                │       │
                                │       │    ┌─────────────┐
                                │       │───▶│Calculation  │───▶ Redis (cache)
                                │       │    │Engine       │
                                │       │    └──────┬──────┘
                                │       │           │
                                │       │           ▼
                                │       │    ┌───────────┐
                                │       │───▶│WebSocket  │───▶ Frontend
                                │       │    │Gateway    │
                                └───────┘    └───────────┘
```

### 6.2 Cálculo IPR/VLP Bajo Demanda

```
┌──────────┐    ┌───────────┐    ┌───────────┐    ┌───────┐
│ Frontend │───▶│ REST API  │───▶│Calculation│───▶│Redis  │ (check cache)
│          │    │           │    │Engine     │    │       │
└──────────┘    └───────────┘    │           │    └───────┘
                                 │           │         │
                                 │           │    (miss)▼
                                 │           │    ┌───────────┐
                                 │           │───▶│PostgreSQL │ (get data)
                                 │           │    └───────────┘
                                 │           │
                                 │    ┌──────▼──────┐
                                 │    │  Calculate  │
                                 │    │  IPR/VLP    │
                                 │    └──────┬──────┘
                                 │           │
                        ┌────────┴───────────┼───────────────┐
                        ▼                    ▼               ▼
                   ┌─────────┐         ┌─────────┐     ┌─────────┐
                   │ Redis   │         │ Kafka   │     │Response │
                   │ (cache) │         │(persist)│     │to client│
                   └─────────┘         └─────────┘     └─────────┘
```

### 6.3 Alarmas en Tiempo Real

```
┌──────────┐    ┌───────────────┐    ┌─────────────────┐
│ Sensor   │───▶│ Calculation   │───▶│ Threshold Check │
│ Data     │    │ Engine        │    │ (alarm rules)   │
└──────────┘    └───────────────┘    └────────┬────────┘
                                              │
                                    (threshold exceeded)
                                              │
                                              ▼
                                     ┌────────────────┐
                                     │ Generate Alarm │
                                     └────────┬───────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
             ┌────────────┐           ┌────────────┐           ┌────────────┐
             │ Kafka      │           │ Redis      │           │ WebSocket  │
             │ (persist)  │           │ (active    │           │ (notify    │
             │            │           │  alarms)   │           │  users)    │
             └────────────┘           └────────────┘           └────────────┘
```

---

## 7. Implementación por Módulo

### 7.1 Well Testing - Tiempo Real

```typescript
// Kafka Consumer para cálculos en tiempo real
class WellTestingRealtimeService {
  private kafkaConsumer: Consumer;
  private calculationEngine: CalculationEngine;
  private redisClient: RedisClient;
  private wsGateway: WebSocketGateway;
  
  async processReading(reading: WellTestReading) {
    // 1. Obtener configuración del pozo (Redis cache first)
    const wellConfig = await this.getWellConfig(reading.wellId);
    
    // 2. Calcular IPR si hay suficientes datos
    if (this.hasEnoughDataForIpr(reading)) {
      const iprResult = this.calculationEngine.calculateIprRealtime({
        ...reading,
        reservoirPressure: wellConfig.reservoirPressure,
      });
      
      // 3. Guardar en Redis (caché rápido)
      await this.redisClient.setEx(
        `calc:ipr:${reading.wellId}:latest`,
        300, // 5 min TTL
        JSON.stringify(iprResult)
      );
      
      // 4. Publicar a Kafka (persistencia)
      await this.kafkaProducer.send({
        topic: 'well-test.calculations',
        messages: [{ value: JSON.stringify(iprResult) }],
      });
      
      // 5. Broadcast via WebSocket
      this.wsGateway.broadcast(
        `well:${reading.wellId}`,
        'calculation:ipr',
        iprResult
      );
    }
  }
}
```

### 7.2 Drilling - Tiempo Real

```typescript
// Cálculos de drilling en tiempo real
class DrillingRealtimeService {
  async processDrillingData(data: DrillingData) {
    // MSE (Mechanical Specific Energy) en tiempo real
    const mseResult = this.calculateMse(data);
    
    // Torque & Drag si hay datos suficientes
    const tdResult = this.calculateTorqueDrag(data);
    
    // Detectar anomalías (kick, lost circulation)
    const anomalies = this.detectAnomalies(data, mseResult);
    
    // Si hay anomalía, generar alarma inmediata
    if (anomalies.length > 0) {
      await this.kafkaProducer.send({
        topic: 'alarms.critical',
        messages: anomalies.map(a => ({ value: JSON.stringify(a) })),
      });
    }
    
    // Actualizar estado en Redis
    await this.updateDrillingState(data.wellId, {
      mse: mseResult,
      torqueDrag: tdResult,
      lastUpdate: Date.now(),
    });
    
    // Broadcast
    this.wsGateway.broadcast(`well:${data.wellId}`, 'drilling:update', {
      mse: mseResult,
      torqueDrag: tdResult,
    });
  }
}
```

---

## 8. Configuración de Servicios

### 8.1 Docker Compose Actualizado

```yaml
services:
  # ... servicios existentes ...
  
  # Redis para caché
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    ports:
      - "15379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
  
  # Calculation Engine (consumer de Kafka)
  calculation-engine:
    build: ./src/backend
    command: npm run calc-engine
    environment:
      KAFKA_BROKERS: kafka:9092
      REDIS_URL: redis://redis:6379
      DATABASE_URL: ${DATABASE_URL}
    depends_on:
      kafka:
        condition: service_healthy
      redis:
        condition: service_healthy
  
  # WebSocket Gateway
  ws-gateway:
    build: ./src/backend
    command: npm run ws-gateway
    ports:
      - "3001:3001"
    environment:
      KAFKA_BROKERS: kafka:9092
      REDIS_URL: redis://redis:6379
    depends_on:
      kafka:
        condition: service_healthy
      redis:
        condition: service_healthy

volumes:
  redis_data:
```

---

## 9. Métricas y Monitoreo

### 9.1 Métricas de Tiempo Real

| Métrica | Descripción | Umbral |
|---------|-------------|--------|
| `kafka_consumer_lag` | Retraso de consumers | < 100 msgs |
| `calculation_latency_ms` | Tiempo de cálculo | < 500ms |
| `ws_connections_active` | Conexiones WS activas | - |
| `redis_memory_usage` | Uso de memoria Redis | < 80% |
| `db_write_latency_ms` | Latencia de escritura DB | < 100ms |

### 9.2 Alertas de Sistema

```typescript
const SYSTEM_ALERTS = {
  KAFKA_LAG_HIGH: {
    condition: 'kafka_consumer_lag > 1000',
    severity: 'warning',
    action: 'Scale consumers',
  },
  CALCULATION_SLOW: {
    condition: 'calculation_latency_ms > 2000',
    severity: 'warning',
    action: 'Check calculation engine',
  },
  REDIS_MEMORY_HIGH: {
    condition: 'redis_memory_usage > 90%',
    severity: 'critical',
    action: 'Clear old cache / increase memory',
  },
};
```

---

## 10. Reglas de Implementación

### 10.1 Para Desarrolladores

1. **Todo dato de sensor** → Kafka primero, luego DB
2. **Cálculos costosos** → Caché en Redis con TTL apropiado
3. **Actualizaciones UI** → WebSocket, NO polling
4. **Consultas históricas** → DB (TimescaleDB)
5. **Estado actual** → Redis primero, DB como fallback
6. **Alarmas críticas** → Broadcast inmediato vía WebSocket

### 10.2 Patrones Prohibidos

❌ Polling desde frontend para datos en tiempo real
❌ Consultas a DB para datos actuales (usar Redis)
❌ Cálculos en el frontend que deberían ser en backend
❌ WebSocket para datos históricos (usar REST)

### 10.3 Patrones Recomendados

✅ Kafka consumer groups para escalar procesamiento
✅ Redis Pub/Sub para invalidación de caché
✅ WebSocket rooms por recurso (well, field)
✅ Batch inserts a DB cada 1-5 segundos
✅ TTL en Redis basado en frecuencia de actualización

---

## 11. Roadmap de Implementación

| Fase | Componente | Prioridad | Estado |
|------|------------|-----------|--------|
| 1 | Configurar Redis en Docker | ALTA | ⚪ Pendiente |
| 2 | Implementar WebSocket Gateway | ALTA | ⚪ Pendiente |
| 3 | Crear Calculation Engine service | ALTA | ⚪ Pendiente |
| 4 | Integrar Redis en servicios existentes | MEDIA | ⚪ Pendiente |
| 5 | Frontend: Conectar WebSocket | MEDIA | ⚪ Pendiente |
| 6 | Métricas y monitoreo | BAJA | ⚪ Pendiente |

---

## 12. Control de Versiones

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 2026-01-08 | Creación del documento |
