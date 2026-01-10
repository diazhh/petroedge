# ARQUITECTURA KAFKA - SCADA+ERP PETROLERO

## Por qué Kafka en lugar de MQTT

### Ventajas de Kafka

1. **Escalabilidad Superior**
   - Maneja millones de mensajes por segundo
   - Particionamiento horizontal automático
   - Replicación distribuida

2. **Persistencia de Datos**
   - Logs distribuidos con retención configurable (168 horas por defecto)
   - Replay de mensajes históricos
   - Garantía de no pérdida de datos

3. **Stream Processing**
   - Kafka Streams para procesamiento en tiempo real
   - Agregaciones, joins, windowing
   - Procesamiento stateful

4. **Ecosistema Rico**
   - Kafka Connect para integración con sistemas externos
   - Schema Registry para evolución de schemas
   - KSQL para queries SQL sobre streams

5. **Arquitectura de Microservicios**
   - Event sourcing nativo
   - CQRS (Command Query Responsibility Segregation)
   - Comunicación asíncrona entre servicios

6. **Garantías de Entrega**
   - At-least-once, at-most-once, exactly-once semantics
   - Consumer groups para load balancing
   - Offset management automático

### Comparación MQTT vs Kafka

| Característica | MQTT | Kafka |
|----------------|------|-------|
| **Throughput** | Miles/seg | Millones/seg |
| **Persistencia** | Opcional (QoS 2) | Siempre (logs) |
| **Replay** | No | Sí |
| **Particionamiento** | No | Sí |
| **Replicación** | Limitada | Nativa |
| **Stream Processing** | No | Sí (Kafka Streams) |
| **Ecosistema** | Limitado | Muy rico |
| **Complejidad** | Baja | Media |
| **Latencia** | Muy baja (~ms) | Baja (~10ms) |

### Cuándo usar MQTT vs Kafka

**MQTT es mejor para:**
- Dispositivos IoT con recursos limitados
- Comunicación directa con sensores/actuadores
- Latencia ultra-baja (<1ms)
- Redes inestables (QoS)

**Kafka es mejor para:**
- Comunicación entre servicios backend
- Event sourcing y CQRS
- Analytics en tiempo real
- Integración de sistemas empresariales
- Procesamiento de streams

### Nuestra Arquitectura Híbrida

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA HÍBRIDA                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                    ┌──────────────┐           │
│  │ PLCs/RTUs    │                    │  Sensores    │           │
│  │ (Modbus)     │                    │  (MQTT*)     │           │
│  └──────┬───────┘                    └──────┬───────┘           │
│         │                                   │                   │
│         │                                   │                   │
│         ▼                                   ▼                   │
│  ┌─────────────────────────────────────────────────┐            │
│  │           EDGE GATEWAY (Node.js)                │            │
│  │  - Modbus TCP/RTU client                        │            │
│  │  - MQTT client (opcional)*                      │            │
│  │  - OPC-UA client                                │            │
│  │  - Data validation & buffering                  │            │
│  └────────────────────┬────────────────────────────┘            │
│                       │                                         │
│                       │ Publica eventos                         │
│                       ▼                                         │
│  ┌─────────────────────────────────────────────────┐            │
│  │              KAFKA BROKER                        │            │
│  │                                                  │            │
│  │  Topics:                                         │            │
│  │  ├── scada.telemetry.raw                        │            │
│  │  ├── scada.telemetry.validated                  │            │
│  │  ├── scada.alarms                               │            │
│  │  ├── scada.commands                             │            │
│  │  ├── well-testing.events                        │            │
│  │  ├── production.events                          │            │
│  │  └── system.events                              │            │
│  └────────────────────┬────────────────────────────┘            │
│                       │                                         │
│         ┌─────────────┼─────────────┬──────────────┐            │
│         │             │             │              │            │
│         ▼             ▼             ▼              ▼            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Backend  │  │Analytics │  │TimeSeries│  │  Cloud   │       │
│  │   API    │  │ Service  │  │ Writer   │  │  Sync    │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

* MQTT opcional solo para dispositivos IoT legacy
```

---

## Topics de Kafka

### Naming Convention

```
<domain>.<entity>.<event-type>
```

### Topics Principales

#### 1. SCADA Topics

```yaml
# Telemetría raw desde Edge Gateway
scada.telemetry.raw:
  partitions: 6
  replication: 3
  retention: 168h  # 7 días
  schema: TelemetryRaw
  
# Telemetría validada y procesada
scada.telemetry.validated:
  partitions: 6
  replication: 3
  retention: 720h  # 30 días
  schema: TelemetryValidated

# Alarmas y eventos críticos
scada.alarms:
  partitions: 3
  replication: 3
  retention: 2160h  # 90 días
  schema: Alarm

# Comandos a dispositivos
scada.commands:
  partitions: 3
  replication: 3
  retention: 24h
  schema: Command
```

#### 2. Well Testing Topics

```yaml
well-testing.test-created:
  partitions: 3
  replication: 3
  retention: 2160h
  schema: WellTestCreated

well-testing.test-completed:
  partitions: 3
  replication: 3
  retention: 2160h
  schema: WellTestCompleted

well-testing.ipr-calculated:
  partitions: 3
  replication: 3
  retention: 2160h
  schema: IPRCalculated
```

#### 3. Production Topics

```yaml
production.daily-production:
  partitions: 6
  replication: 3
  retention: 2160h
  schema: DailyProduction

production.well-status-changed:
  partitions: 3
  replication: 3
  retention: 720h
  schema: WellStatusChanged
```

#### 4. System Topics

```yaml
system.audit-log:
  partitions: 3
  replication: 3
  retention: 4320h  # 180 días
  schema: AuditLog

system.user-activity:
  partitions: 3
  replication: 3
  retention: 720h
  schema: UserActivity
```

---

## Schemas (Avro)

### TelemetryRaw

```json
{
  "type": "record",
  "name": "TelemetryRaw",
  "namespace": "com.scadaerp.scada",
  "fields": [
    {"name": "timestamp", "type": "long"},
    {"name": "deviceId", "type": "string"},
    {"name": "tagId", "type": "string"},
    {"name": "value", "type": "double"},
    {"name": "quality", "type": "int"},
    {"name": "sourceProtocol", "type": {"type": "enum", "name": "Protocol", "symbols": ["MODBUS", "OPCUA", "MQTT"]}}
  ]
}
```

### Alarm

```json
{
  "type": "record",
  "name": "Alarm",
  "namespace": "com.scadaerp.scada",
  "fields": [
    {"name": "timestamp", "type": "long"},
    {"name": "alarmId", "type": "string"},
    {"name": "deviceId", "type": "string"},
    {"name": "tagId", "type": "string"},
    {"name": "severity", "type": {"type": "enum", "name": "Severity", "symbols": ["CRITICAL", "HIGH", "MEDIUM", "LOW"]}},
    {"name": "message", "type": "string"},
    {"name": "value", "type": "double"},
    {"name": "threshold", "type": "double"}
  ]
}
```

---

## Producers

### Edge Gateway Producer

```typescript
import { Kafka, Producer } from 'kafkajs';

export class EdgeGatewayProducer {
  private producer: Producer;

  constructor() {
    const kafka = new Kafka({
      clientId: 'edge-gateway',
      brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
    });
    
    this.producer = kafka.producer({
      idempotent: true,
      maxInFlightRequests: 5,
      transactionalId: 'edge-gateway-tx',
    });
  }

  async publishTelemetry(data: TelemetryData) {
    await this.producer.send({
      topic: 'scada.telemetry.raw',
      messages: [{
        key: data.deviceId,
        value: JSON.stringify(data),
        timestamp: Date.now().toString(),
      }],
    });
  }

  async publishAlarm(alarm: Alarm) {
    await this.producer.send({
      topic: 'scada.alarms',
      messages: [{
        key: alarm.deviceId,
        value: JSON.stringify(alarm),
        partition: this.getPartitionForSeverity(alarm.severity),
      }],
    });
  }
}
```

---

## Consumers

### Backend API Consumer

```typescript
import { Kafka, Consumer } from 'kafkajs';

export class BackendConsumer {
  private consumer: Consumer;

  constructor() {
    const kafka = new Kafka({
      clientId: 'backend-api',
      brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
    });
    
    this.consumer = kafka.consumer({
      groupId: 'backend-api-group',
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });
  }

  async start() {
    await this.consumer.connect();
    
    await this.consumer.subscribe({
      topics: [
        'scada.telemetry.validated',
        'scada.alarms',
        'well-testing.test-completed',
      ],
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const data = JSON.parse(message.value.toString());
        
        switch (topic) {
          case 'scada.telemetry.validated':
            await this.handleTelemetry(data);
            break;
          case 'scada.alarms':
            await this.handleAlarm(data);
            break;
          case 'well-testing.test-completed':
            await this.handleTestCompleted(data);
            break;
        }
      },
    });
  }
}
```

---

## Stream Processing

### Kafka Streams Example

```typescript
import { Kafka } from 'kafkajs';

export class TelemetryProcessor {
  async processStream() {
    const kafka = new Kafka({
      clientId: 'telemetry-processor',
      brokers: ['localhost:9092'],
    });

    const consumer = kafka.consumer({ groupId: 'telemetry-processor-group' });
    const producer = kafka.producer();

    await consumer.connect();
    await producer.connect();

    await consumer.subscribe({ topic: 'scada.telemetry.raw' });

    await consumer.run({
      eachMessage: async ({ message }) => {
        const raw = JSON.parse(message.value.toString());
        
        // Validar calidad de datos
        const validated = this.validateQuality(raw);
        
        // Detectar anomalías
        const anomaly = this.detectAnomaly(validated);
        
        // Publicar telemetría validada
        await producer.send({
          topic: 'scada.telemetry.validated',
          messages: [{ value: JSON.stringify(validated) }],
        });
        
        // Publicar alarma si hay anomalía
        if (anomaly) {
          await producer.send({
            topic: 'scada.alarms',
            messages: [{ value: JSON.stringify(anomaly) }],
          });
        }
      },
    });
  }
}
```

---

## Configuración de Producción

### Kafka Broker Configuration

```properties
# Replicación
default.replication.factor=3
min.insync.replicas=2

# Retención
log.retention.hours=168
log.segment.bytes=1073741824

# Performance
num.network.threads=8
num.io.threads=16
socket.send.buffer.bytes=102400
socket.receive.buffer.bytes=102400

# Compresión
compression.type=snappy

# Seguridad
security.inter.broker.protocol=SSL
ssl.client.auth=required
```

### Producer Configuration

```typescript
{
  idempotent: true,
  maxInFlightRequests: 5,
  acks: 'all',
  compression: 'snappy',
  retries: 10,
  retry: {
    initialRetryTime: 100,
    retries: 10,
  },
}
```

### Consumer Configuration

```typescript
{
  groupId: 'backend-api-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  maxBytesPerPartition: 1048576,
  autoCommit: false,
  autoCommitInterval: 5000,
}
```

---

## Monitoreo

### Métricas Clave

1. **Throughput**
   - Messages/second por topic
   - Bytes/second por topic

2. **Latency**
   - Producer latency (p50, p95, p99)
   - Consumer lag

3. **Availability**
   - Broker uptime
   - Under-replicated partitions

4. **Storage**
   - Disk usage por broker
   - Log size por topic

### Kafka UI

Acceder a Kafka UI en desarrollo:
```
http://localhost:8080
```

### Comandos Útiles

```bash
# Listar topics
docker exec kafka kafka-topics --list --bootstrap-server localhost:9092

# Crear topic
docker exec kafka kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic scada.telemetry.raw \
  --partitions 6 \
  --replication-factor 1

# Describir topic
docker exec kafka kafka-topics --describe \
  --bootstrap-server localhost:9092 \
  --topic scada.telemetry.raw

# Consumir mensajes
docker exec kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic scada.telemetry.raw \
  --from-beginning

# Producir mensajes
docker exec -it kafka kafka-console-producer \
  --bootstrap-server localhost:9092 \
  --topic scada.telemetry.raw

# Ver consumer groups
docker exec kafka kafka-consumer-groups --list \
  --bootstrap-server localhost:9092

# Ver lag de consumer group
docker exec kafka kafka-consumer-groups --describe \
  --bootstrap-server localhost:9092 \
  --group backend-api-group
```

---

## Migración de MQTT a Kafka

### Fase 1: Infraestructura
- ✅ Docker Compose actualizado con Kafka + Zookeeper
- ✅ Configuración de puertos actualizada
- ✅ Variables de entorno configuradas

### Fase 2: Backend (Próximo)
- ⬜ Instalar kafkajs en backend
- ⬜ Crear servicio Kafka producer/consumer
- ⬜ Migrar eventos internos a Kafka
- ⬜ Implementar topics principales

### Fase 3: Edge Gateway (Próximo)
- ⬜ Instalar kafkajs en edge
- ⬜ Publicar telemetría a Kafka
- ⬜ Suscribirse a comandos desde Kafka

### Fase 4: Testing
- ⬜ Tests de integración con Kafka
- ⬜ Performance testing
- ⬜ Failover testing

---

**Última actualización**: 2026-01-08  
**Versión**: 1.0.0
