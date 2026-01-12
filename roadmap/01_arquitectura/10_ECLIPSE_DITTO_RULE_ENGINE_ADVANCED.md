# ARQUITECTURA AVANZADA: Eclipse Ditto + Motor de Reglas + Microservicios Híbridos

## 📋 Resumen Ejecutivo

Este documento define la arquitectura híbrida de producción del sistema SCADA+ERP para soportar **miles de dispositivos** con capacidades de **Machine Learning** y **cálculos avanzados**:

1. **Eclipse Ditto** como framework de Digital Twins (gestión a escala)
2. **Node.js Worker Service** - Motor de Reglas Visual (60+ nodos, ThingsBoard-style)
3. **Python Calculation Service** - Cálculos complejos, ML, simulaciones
4. **Arquitectura Híbrida de 3 Capas** - Escalabilidad horizontal
5. **Kafka como backbone central** para comunicación asíncrona
6. **gRPC** para comunicación síncrona de baja latencia

## 🏗️ Arquitectura Híbrida de Producción

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     ARQUITECTURA HÍBRIDA PRODUCCIÓN                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                    CAPA 1: RULE ENGINE LAYER                        │    │
│  │                      (Node.js/TypeScript)                           │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │  • Motor de Reglas Visual (60+ nodos)                              │    │
│  │  • Filtros, routing, transformaciones ligeras                      │    │
│  │  • Alarmas, notificaciones, WebSocket                              │    │
│  │  • Enrichment (fetch metadata, attributes)                         │    │
│  │  • Orquestación de flujos                                          │    │
│  │  • Editor visual React Flow                                        │    │
│  │                                                                     │    │
│  │  Throughput: 10-50K msg/s | Latencia: 5-20ms                       │    │
│  │  Escala: 5,000-10,000 dispositivos                                 │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                    ↓                                         │
│                            Apache Kafka (Event Bus)                          │
│                                    ↓                                         │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │              CAPA 2: CALCULATION SERVICE LAYER                      │    │
│  │                    (Python + FastAPI/gRPC)                          │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │  • Cálculos petroleros complejos (IPR, VLP, MSE, VFP)              │    │
│  │  • Simulaciones de yacimientos (Material Balance, Decline Curves)  │    │
│  │  • Modelos ML (scikit-learn, TensorFlow, PyTorch)                  │    │
│  │  • Procesamiento numérico (NumPy, SciPy, Pandas)                   │    │
│  │  • Optimización (scipy.optimize, GEKKO)                            │    │
│  │  • Worker threads con multiprocessing                              │    │
│  │                                                                     │    │
│  │  Throughput: 5-20K cálculos/s | Latencia: 10-100ms                 │    │
│  │  Escala: Horizontal con Kubernetes                                 │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                    ↓                                         │
│                            Apache Kafka (Results)                            │
│                                    ↓                                         │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │            CAPA 3: STREAM PROCESSING LAYER (Opcional)               │    │
│  │                    (Kafka Streams / Flink)                          │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │  • Agregaciones temporales complejas (windowing)                   │    │
│  │  • Joins entre múltiples streams                                   │    │
│  │  • Stateful processing a gran escala                               │    │
│  │  • CEP (Complex Event Processing)                                  │    │
│  │                                                                     │    │
│  │  Throughput: 100K-1M msg/s | Latencia: 1-5ms                       │    │
│  │  Escala: >50,000 dispositivos                                      │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 0. 🎯 Separación de Responsabilidades

### CAPA 1: Node.js Worker Service (Rule Engine Layer)

**Responsabilidades**:
- ✅ Motor de Reglas Visual (60+ nodos, ThingsBoard-style)
- ✅ Filtros, routing, switch, conditions
- ✅ Transformaciones ligeras (JSON, math simple, string manipulation)
- ✅ Enrichment (fetch de Ditto, PostgreSQL, Redis)
- ✅ Alarmas y notificaciones (email, SMS, push, Slack)
- ✅ WebSocket Gateway (broadcast en tiempo real)
- ✅ Orquestación de flujos complejos
- ✅ Editor visual con React Flow
- ✅ Dead Letter Queue y retry policies

**Stack Tecnológico**:
```json
{
  "runtime": "Node.js 20+",
  "language": "TypeScript 5+",
  "framework": "Fastify 4.x (HTTP server para WebSocket)",
  "messaging": "KafkaJS 2.x (consumers/producers)",
  "websocket": "Socket.io 4.x",
  "cache": "ioredis 5.x (Redis client)",
  "validation": "Zod 3.x",
  "math": "mathjs 12.x (fórmulas simples)",
  "scheduling": "node-cron 3.x (triggers programados)",
  "templates": "handlebars 4.x (email templates)",
  "notifications": {
    "email": "nodemailer 6.x",
    "sms": "twilio 4.x (opcional)",
    "http": "axios 1.x"
  },
  "logging": "pino 8.x",
  "monitoring": "prom-client 15.x (Prometheus metrics)"
}
```

**Throughput**: 10-50K mensajes/segundo por worker  
**Latencia**: 5-20ms (operaciones I/O-bound)  
**Escala**: 5,000-10,000 dispositivos por worker  
**Escalabilidad**: Horizontal (múltiples workers en paralelo)

**Cuándo usar**:
- Operaciones I/O-bound (fetch de DB, APIs, cache)
- Routing y filtrado de mensajes
- Lógica de negocio y orquestación
- Transformaciones ligeras de datos
- Notificaciones y alarmas

---

### CAPA 2: Python Calculation Service 🆕

**Responsabilidades**:
- 🔬 **Cálculos Petroleros Complejos**:
  - IPR (Inflow Performance Relationship) - Vogel, Fetkovich, Darcy
  - VLP (Vertical Lift Performance) - Beggs & Brill, Hagedorn & Brown
  - MSE (Mechanical Specific Energy) - Drilling optimization
  - VFP (Vertical Flow Performance) - Multiphase flow
  - Nodal Analysis - Sistema completo pozo-yacimiento
  - Decline Curve Analysis - Arps, Hyperbolic, Harmonic
  - Material Balance - Yacimientos volumétricos y con empuje
  - PVT Correlations - Black Oil, Compositional
  
- 🤖 **Machine Learning**:
  - Predicción de producción (LSTM, Prophet, XGBoost)
  - Detección de anomalías (Isolation Forest, Autoencoders)
  - Clasificación de eventos (Random Forest, SVM)
  - Optimización de parámetros (Bayesian Optimization)
  - Forecasting de yacimientos
  
- 📊 **Procesamiento Numérico Pesado**:
  - Simulaciones de yacimientos (Black Oil, Compositional)
  - Optimización multiobjetivo (NSGA-II, PSO)
  - Análisis estadístico avanzado
  - Procesamiento de imágenes (logs, core analysis)
  - Análisis de series temporales complejas

**Stack Tecnológico**:
```python
{
  "runtime": "Python 3.11+",
  "framework": {
    "api": "FastAPI 0.109+ (REST API)",
    "grpc": "grpcio 1.60+ (comunicación interna)",
    "async": "asyncio + uvloop"
  },
  "messaging": "aiokafka 0.10+ (Kafka async)",
  "numerical": {
    "core": "NumPy 1.26+",
    "scientific": "SciPy 1.12+",
    "dataframes": "Pandas 2.2+",
    "optimization": "scipy.optimize, GEKKO 1.0+"
  },
  "ml": {
    "classical": "scikit-learn 1.4+",
    "deep_learning": "TensorFlow 2.15+ / PyTorch 2.2+",
    "forecasting": "Prophet 1.1+, statsmodels 0.14+",
    "xgboost": "XGBoost 2.0+",
    "model_registry": "MLflow 2.10+"
  },
  "petroleum": {
    "pvt": "Custom library (correlations)",
    "reservoir": "Custom library (material balance, decline curves)",
    "production": "Custom library (IPR, VLP, nodal)",
    "drilling": "Custom library (MSE, T&D)"
  },
  "tasks": "Celery 5.3+ (tareas asíncronas largas)",
  "cache": "redis-py 5.0+ (cache de modelos)",
  "validation": "Pydantic 2.6+",
  "logging": "structlog 24.1+",
  "monitoring": "prometheus-client 0.20+"
}
```

**Throughput**: 5-20K cálculos/segundo (depende de complejidad)  
**Latencia**: 10-100ms (cálculos simples) | 100ms-5s (simulaciones complejas)  
**Escala**: Horizontal con Kubernetes + autoscaling  
**Workers**: Multiprocessing (CPU cores) + asyncio (I/O)

**Cuándo usar**:
- Operaciones CPU-bound (cálculos científicos)
- Simulaciones numéricas complejas
- Machine Learning (entrenamiento e inferencia)
- Optimización matemática
- Procesamiento de grandes datasets

**Comunicación**:
- **Asíncrona** (Kafka): Para cálculos que pueden esperar (batch processing)
- **Síncrona** (gRPC): Para cálculos que requieren respuesta inmediata (<100ms)

---

### CAPA 3: Stream Processing Layer (Opcional - Futura)

**Responsabilidades**:
- Agregaciones temporales masivas (windowing)
- Joins complejos entre múltiples streams
- CEP (Complex Event Processing)
- Stateful processing a gran escala (>50K dispositivos)

**Stack Tecnológico**:
- Kafka Streams (Java) o Apache Flink
- Solo si se requiere >50K dispositivos

---

## 0.1 🔄 Flujos de Comunicación

### Flujo 1: Telemetría Simple (Solo Node.js)
```
Edge Gateway → Kafka (telemetry.raw)
                 ↓
         Node.js Worker (Rule Engine)
                 ↓
         ┌───────┴───────┐
         ↓               ↓
    Filter/Route    Transform
         ↓               ↓
    Save to DB     Update Redis
         ↓               ↓
    WebSocket ← Broadcast
         ↓
    Frontend Dashboard
```

### Flujo 2: Cálculos Complejos (Híbrido)
```
Edge Gateway → Kafka (telemetry.raw)
                 ↓
         Node.js Worker (Rule Engine)
                 ↓
         Detect: "Needs complex calculation"
                 ↓
         Kafka (calculation.request) → Python Calculation Service
                 ↓                              ↓
         Continue routing              Execute IPR/VLP/ML
                 ↓                              ↓
         WebSocket                      Kafka (calculation.result)
                 ↓                              ↓
         Frontend                       Node.js Worker (broadcast)
                                                ↓
                                        WebSocket → Frontend
```

### Flujo 3: Machine Learning (Python)
```
Historical Data (TimescaleDB)
         ↓
Python ML Pipeline (Celery task)
         ↓
    Train Model
         ↓
MLflow Model Registry
         ↓
Python Calculation Service (load model)
         ↓
Real-time Inference via Kafka/gRPC
         ↓
Node.js Worker → WebSocket → Frontend
```

---

## 0.2 📡 Kafka Topics Architecture

### Topics del Node.js Worker
```yaml
# Input topics (consumed by Node.js)
scada.telemetry.raw              # Telemetría cruda desde Edge
scada.telemetry.validated        # Telemetría validada
assets.attributes.changed        # Cambios en atributos de assets
assets.status.changed            # Cambios de estado
alarms.triggered                 # Alarmas generadas
ditto.events                     # Eventos de Ditto

# Output topics (produced by Node.js)
scada.telemetry.validated        # Telemetría validada
calculation.request              # Solicitudes de cálculo a Python
alarms.notifications             # Alarmas para notificar
websocket.broadcast              # Mensajes para broadcast
ditto.commands                   # Comandos a Ditto
```

### Topics del Python Calculation Service
```yaml
# Input topics (consumed by Python)
calculation.request              # Solicitudes de cálculo desde Node.js
ml.training.request              # Solicitudes de entrenamiento ML
optimization.request             # Solicitudes de optimización

# Output topics (produced by Python)
calculation.result               # Resultados de cálculos
calculation.error                # Errores de cálculo (DLQ)
ml.model.updated                 # Modelo ML actualizado
optimization.result              # Resultados de optimización
```

---

## 0.3 🔌 gRPC Service Definitions

Para comunicación síncrona de baja latencia entre Node.js y Python:

```protobuf
// calculation.proto
syntax = "proto3";

service CalculationService {
  // Cálculos petroleros
  rpc CalculateIPR(IPRRequest) returns (IPRResponse);
  rpc CalculateVLP(VLPRequest) returns (VLPResponse);
  rpc CalculateNodalAnalysis(NodalRequest) returns (NodalResponse);
  
  // Machine Learning
  rpc PredictProduction(PredictionRequest) returns (PredictionResponse);
  rpc DetectAnomaly(AnomalyRequest) returns (AnomalyResponse);
  
  // Optimización
  rpc OptimizeWellParameters(OptimizationRequest) returns (OptimizationResponse);
}

message IPRRequest {
  string well_id = 1;
  double reservoir_pressure = 2;
  double productivity_index = 3;
  string correlation = 4; // "vogel", "fetkovich", "darcy"
}

message IPRResponse {
  repeated IPRPoint points = 1;
  double aof = 2; // Absolute Open Flow
  string status = 3;
}
```

---

## 1. 🔬 Análisis de Investigación

### 1.1 Eclipse Ditto - Digital Twins Framework

**Proyecto**: Eclipse IoT - https://eclipse.dev/ditto/

**Características Principales**:
- Framework Java/Scala para gestión de Digital Twins a escala
- Soporta millones de twins en cluster
- API REST + WebSocket + MQTT + AMQP + **Apache Kafka nativo**
- Modelo: Things → Features → Properties/Attributes
- Policies para control de acceso granular
- Event sourcing para historial de cambios

**Arquitectura de Ditto**:
```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ECLIPSE DITTO SERVICES                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Gateway   │  │   Things    │  │  Policies   │  │Connectivity │    │
│  │  (HTTP/WS)  │  │  (CRUD)     │  │   (AuthZ)   │  │(Kafka/MQTT) │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         │                │                │                │            │
│         └────────────────┼────────────────┼────────────────┘            │
│                          │                │                              │
│                          ▼                ▼                              │
│                    ┌─────────────────────────────┐                       │
│                    │         MongoDB              │                       │
│                    │    (Persistencia/Estado)    │                       │
│                    └─────────────────────────────┘                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Modelo de Thing en Ditto**:
```json
{
  "thingId": "scadaerp:well-001",
  "policyId": "scadaerp:default-policy",
  "attributes": {
    "name": "Pozo Exploratorio 001",
    "field": "Campo Norte",
    "wellType": "PRODUCER",
    "location": { "lat": 10.123, "lon": -67.456 }
  },
  "features": {
    "telemetry": {
      "properties": {
        "pressure": { "value": 2500, "unit": "psi", "timestamp": "2026-01-10T08:00:00Z" },
        "temperature": { "value": 180, "unit": "F", "timestamp": "2026-01-10T08:00:00Z" },
        "flowRate": { "value": 1200, "unit": "bopd", "timestamp": "2026-01-10T08:00:00Z" }
      }
    },
    "configuration": {
      "properties": {
        "tubingSize": 2.875,
        "casingSize": 7,
        "liftMethod": "ESP"
      }
    },
    "computed": {
      "properties": {
        "efficiency": { "value": 85.5, "calculatedAt": "2026-01-10T08:00:00Z" },
        "drawdown": { "value": 450, "calculatedAt": "2026-01-10T08:00:00Z" }
      }
    }
  }
}
```

**Integración con Kafka**:
- Ditto puede consumir/producir a Kafka nativamente
- Topics: `ditto.events`, `ditto.commands`, `ditto.responses`
- Soporta acknowledgements para garantizar entrega

### 1.2 ThingsBoard Rule Engine - Análisis de Nodos

**Categorías de Nodos en ThingsBoard** (a implementar):

#### Filter Nodes (12 tipos):
| Nodo | Descripción | Prioridad |
|------|-------------|-----------|
| `alarm_status_filter` | Filtrar por estado de alarma | Alta |
| `asset_profile_switch` | Enrutar por perfil de asset | Alta |
| `check_fields_presence` | Verificar campos existen | Alta |
| `check_relation_presence` | Verificar relaciones entre entities | Media |
| `device_profile_switch` | Enrutar por perfil de dispositivo | Alta |
| `entity_type_filter` | Filtrar por tipo de entidad | Alta |
| `entity_type_switch` | Switch por tipo de entidad | Alta |
| `gps_geofencing_filter` | Filtrar por geocerca | Media |
| `message_type_filter` | Filtrar por tipo de mensaje | Alta |
| `message_type_switch` | Switch por tipo de mensaje | Alta |
| `script` | Filtro con script JavaScript | Alta |
| `switch` | Switch con script JavaScript | Alta |

#### Enrichment Nodes (8 tipos):
| Nodo | Descripción | Prioridad |
|------|-------------|-----------|
| `customer_attributes` | Enriquecer con atributos de cliente | Baja |
| `device_attributes` | Enriquecer con atributos de dispositivo | Alta |
| `originator_attributes` | Enriquecer con atributos del originador | Alta |
| `originator_fields` | Enriquecer con campos del originador | Alta |
| `originator_telemetry` | Enriquecer con telemetría del originador | Alta |
| `related_attributes` | Enriquecer con atributos relacionados | Media |
| `tenant_attributes` | Enriquecer con atributos del tenant | Media |
| `fetch_device_credentials` | Obtener credenciales de dispositivo | Baja |

#### Transformation Nodes (6 tipos):
| Nodo | Descripción | Prioridad |
|------|-------------|-----------|
| `change_originator` | Cambiar originador del mensaje | Media |
| `script` | Transformar con script JavaScript | Alta |
| `to_email` | Transformar a formato email | Media |
| `rename_keys` | Renombrar claves del mensaje | Alta |
| `duplicate_to_group` | Duplicar a grupo de entities | Baja |
| `duplicate_to_related` | Duplicar a entities relacionados | Baja |

#### Action Nodes (22 tipos):
| Nodo | Descripción | Prioridad |
|------|-------------|-----------|
| `assign_to_customer` | Asignar a cliente | Baja |
| `calculated_fields` | Ejecutar campos calculados | **Crítica** |
| `clear_alarm` | Limpiar alarma | Alta |
| `create_alarm` | Crear alarma | **Crítica** |
| `create_relation` | Crear relación | Media |
| `delete_attributes` | Eliminar atributos | Media |
| `delete_relation` | Eliminar relación | Media |
| `generator` | Generar mensajes periódicos | Media |
| `gps_geofencing_events` | Eventos de geocerca | Baja |
| `log` | Log para debugging | Alta |
| `math_function` | Operaciones matemáticas | **Crítica** |
| `message_count` | Contar mensajes | Media |
| `rpc_call_request` | Llamada RPC a dispositivo | Alta |
| `save_attributes` | Guardar atributos | **Crítica** |
| `save_timeseries` | Guardar series temporales | **Crítica** |
| `set_status` | Cambiar estado | Alta |

#### External Nodes (16 tipos):
| Nodo | Descripción | Prioridad |
|------|-------------|-----------|
| `rest_api_call` | Llamada REST externa | Alta |
| `send_email` | Enviar email | Alta |
| `send_sms` | Enviar SMS | Media |
| `send_notification` | Enviar notificación push | Alta |
| `kafka` | Publicar a Kafka | **Crítica** |
| `mqtt` | Publicar a MQTT | Alta |
| `rabbitmq` | Publicar a RabbitMQ | Baja |
| `aws_sns` | Publicar a AWS SNS | Baja |
| `aws_sqs` | Publicar a AWS SQS | Baja |
| `aws_lambda` | Invocar AWS Lambda | Baja |
| `azure_iot_hub` | Publicar a Azure IoT | Baja |
| `gcp_pubsub` | Publicar a GCP Pub/Sub | Baja |
| `slack` | Enviar a Slack | Media |
| `twilio_sms` | SMS via Twilio | Baja |
| `twilio_voice` | Llamada via Twilio | Baja |
| `ai_request` | Llamada a LLM/AI | Baja |

#### Flow Nodes (5 tipos):
| Nodo | Descripción | Prioridad |
|------|-------------|-----------|
| `rule_chain` | Invocar otra cadena de reglas | Alta |
| `input` | Nodo de entrada | **Crítica** |
| `output` | Nodo de salida | **Crítica** |
| `acknowledge` | Confirmar procesamiento | Media |
| `checkpoint` | Punto de control | Media |

#### Analytics Nodes (PE - 4 tipos):
| Nodo | Descripción | Prioridad |
|------|-------------|-----------|
| `aggregate_stream` | Agregación en streaming | Alta |
| `aggregate_latest` | Agregación de últimos valores | Alta |
| `calculate_delta` | Calcular delta entre valores | Alta |
| `count_items` | Contar elementos | Media |

### 1.3 Apache StreamPipes - Adaptadores y Procesadores

**Adaptadores de Campo (PLC4X)**:
- **Siemens S7** (S7-300, S7-400, S7-1200, S7-1500)
- **Modbus TCP/RTU**
- **OPC-UA** (genérico)
- **EtherNet/IP** (Allen-Bradley)
- **MQTT** (IoT genérico)
- **Apache Kafka** (integración)
- **Apache Pulsar**
- **ROS** (Robot Operating System)

**Procesadores Relevantes para SCADA** (~100 built-in):
| Procesador | Categoría | Uso en Petroleras |
|------------|-----------|-------------------|
| `Aggregate` | Analytics | Agregación de telemetría |
| `Boolean Counter` | Analytics | Conteo de eventos |
| `Boolean Timer` | Analytics | Temporizadores de estado |
| `Frequency Calculator` | Analytics | Frecuencia de eventos |
| `Trend` | Analytics | Detección de tendencias |
| `Peak Detection` | Pattern | Detección de picos |
| `Flank Detection` | Pattern | Detección de flancos |
| `Threshold Detection` | Pattern | Cruce de umbrales |
| `Numerical Filter` | Filter | Filtro numérico |
| `Text Filter` | Filter | Filtro de texto |
| `Compose` | Transform | Combinar streams |
| `Merge by Timestamp` | Transform | Merge temporal |
| `Field Renamer` | Transform | Renombrar campos |
| `Measurement Converter` | Transform | Conversión de unidades |
| `Math` | Transform | Operaciones matemáticas |
| `Static Property` | Enrich | Enriquecer con constantes |
| `JavaScript` | Custom | Scripts personalizados |

### 1.4 Comparación de Librerías para Editor Visual

| Librería | Pros | Contras | Recomendación |
|----------|------|---------|---------------|
| **React Flow** | Muy popular, buen ecosistema, TypeScript-first, usado en producción | Pro features de pago (pero no necesarios) | **RECOMENDADO** (ya está en el proyecto) |
| **Rete.js** | TypeScript, multi-framework, dataflow engine | Menor comunidad, curva de aprendizaje | Alternativa viable |
| **Flume** | Específico para node editors | Menor flexibilidad | No recomendado |
| **beautiful-react-diagrams** | Simple | Muy limitado | No recomendado |

**Decisión**: Mantener **React Flow** (ya implementado parcialmente).

### 1.5 Kafka Streams vs Alternativas

| Tecnología | Latencia | Complejidad | Ideal para |
|------------|----------|-------------|------------|
| **Kafka Streams** | ~1-10ms | Media | Microservicios Java/Kotlin |
| **Apache Flink** | ~1-5ms | Alta | Procesamiento complejo, ML |
| **Node.js + KafkaJS** | ~5-20ms | Baja | Nuestro stack (TypeScript) |
| **Benthos** | ~1-10ms | Baja | Pipelines declarativos |

**Decisión**: 
- **Fase 1**: Node.js + KafkaJS (ya implementado, mantenible)
- **Fase 2**: Evaluar **Benthos** para pipelines declarativos o **Kafka Streams** si migramos a JVM

---

## 2. 🏗️ Nueva Arquitectura Propuesta

### 2.1 Arquitectura de Microservicios

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            SCADA+ERP MICROSERVICES ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                           FRONTEND (React + Vite)                            │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │   │
│  │  │ Dashboards  │ │ Rule Editor │ │ Asset Mgmt  │ │ Real-time Charts    │   │   │
│  │  │ (Widgets)   │ │ (React Flow)│ │ (CRUD)      │ │ (Recharts/ECharts)  │   │   │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └─────────┬───────────┘   │   │
│  └─────────┼───────────────┼───────────────┼───────────────────┼───────────────┘   │
│            │               │               │                   │                    │
│            ▼               ▼               ▼                   ▼                    │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         NGINX / API GATEWAY                                  │   │
│  └────────────────────────────────┬────────────────────────────────────────────┘   │
│                                   │                                                 │
│         ┌─────────────────────────┼─────────────────────────┐                      │
│         │                         │                         │                      │
│         ▼                         ▼                         ▼                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐        │
│  │   API SERVICE   │    │  DITTO SERVICE  │    │    WORKER SERVICE       │        │
│  │   (Fastify)     │    │  (Eclipse Ditto)│    │    (Node.js)            │        │
│  │                 │    │                 │    │                         │        │
│  │ • REST API      │    │ • Digital Twins │    │ • Rule Engine Executor  │        │
│  │ • Auth/RBAC     │    │ • Thing CRUD    │    │ • Kafka Consumers       │        │
│  │ • Business API  │    │ • Feature State │    │ • Computed Fields       │        │
│  │ • Report Gen    │    │ • Policies      │    │ • Alarm Processor       │        │
│  │ • Module APIs   │    │ • Event Stream  │    │ • Notification Sender   │        │
│  │                 │    │ • Kafka Connect │    │ • Calculation Engine    │        │
│  └────────┬────────┘    └────────┬────────┘    └────────────┬────────────┘        │
│           │                      │                          │                      │
│           └──────────────────────┼──────────────────────────┘                      │
│                                  │                                                 │
│                                  ▼                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                           APACHE KAFKA                                       │   │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐   │   │
│  │  │telemetry.raw  │ │ditto.events   │ │rules.trigger  │ │alarms.events  │   │   │
│  │  │telemetry.valid│ │ditto.commands │ │rules.results  │ │notifications  │   │   │
│  │  │edge.config    │ │ditto.responses│ │computed.update│ │calculations   │   │   │
│  │  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                  │                                                 │
│         ┌────────────────────────┼────────────────────────────┐                   │
│         │                        │                            │                   │
│         ▼                        ▼                            ▼                   │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐        │
│  │   PostgreSQL    │    │    MongoDB      │    │        Redis            │        │
│  │  + TimescaleDB  │    │  (Ditto State)  │    │     (Cache/WS)          │        │
│  │                 │    │                 │    │                         │        │
│  │ • Telemetry     │    │ • Things        │    │ • Session Cache         │        │
│  │ • Business Data │    │ • Policies      │    │ • Real-time State       │        │
│  │ • Audit Logs    │    │ • Event Journal │    │ • WS Subscriptions      │        │
│  │ • Rules Config  │    │                 │    │ • Rate Limiting         │        │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────┘        │
│                                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                            EDGE GATEWAY                                      │   │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐   │   │
│  │  │  Modbus TCP   │ │  OPC-UA       │ │  S7 Siemens   │ │ EtherNet/IP   │   │   │
│  │  │  (PLC4X)      │ │  (PLC4X)      │ │  (PLC4X)      │ │ (PLC4X)       │   │   │
│  │  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Separación de Servicios

#### 2.2.1 API Service (Puerto 3000)
**Responsabilidades**:
- Endpoints REST para frontend
- Autenticación JWT + RBAC
- Validación de requests
- Business logic síncrono
- Reportes y exports
- CRUD de configuraciones (rules, assets types, data sources)

**Stack**: Node.js + Fastify + Drizzle ORM

**NO debe hacer**:
- ❌ Procesar telemetría en tiempo real
- ❌ Ejecutar reglas
- ❌ Enviar notificaciones (solo encolar)
- ❌ Cálculos pesados

#### 2.2.2 Worker Service (Puerto 3001)
**Responsabilidades**:
- Kafka Consumers para todos los topics
- Ejecución del Rule Engine
- Cálculo de Computed Fields
- Procesamiento de alarmas
- Envío de notificaciones (email, SMS, push)
- Actualización de Ditto via Kafka
- Broadcast WebSocket

**Stack**: Node.js + KafkaJS + Socket.io

**Características**:
- Múltiples instancias para escalabilidad horizontal
- Consumer groups para load balancing
- Dead letter queue para errores
- Retry policies configurables
- Graceful shutdown

#### 2.2.3 Eclipse Ditto Service (Puerto 30080)
**Responsabilidades**:
- Almacenamiento de estado de Digital Twins
- API de Things (CRUD)
- Políticas de acceso
- Event sourcing (historial)
- Sincronización con Kafka

**Stack**: Eclipse Ditto v3.6.9 desplegado con **K3s + Helm**

**⚠️ IMPORTANTE**: 
- Ditto se despliega con **K3s + Helm**, NO con Docker Compose
- URL: `http://localhost:30080`
- Credenciales: `ditto:ditto`
- Ver documentación completa: `/infrastructure/k3s/DITTO_K3S_DEPLOYMENT.md`

**Integración Kafka**:
```yaml
# Ditto connectivity config
{
  "id": "kafka-connection",
  "connectionType": "kafka",
  "uri": "tcp://kafka:9092",
  "sources": [{
    "addresses": ["scada.telemetry.validated"],
    "consumerCount": 3,
    "qos": 1
  }],
  "targets": [{
    "address": "ditto.events",
    "topics": ["_/_/things/twin/events"]
  }]
}
```

---

## 3. 📊 Motor de Reglas Avanzado

### 3.1 Arquitectura del Rule Engine

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              RULE ENGINE ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         RULE CHAIN (Visual Editor)                           │   │
│  │                                                                              │   │
│  │   ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐             │   │
│  │   │ INPUT   │────▶│ FILTER  │────▶│ ENRICH  │────▶│TRANSFORM│             │   │
│  │   │ (Kafka) │     │         │     │         │     │         │             │   │
│  │   └─────────┘     └────┬────┘     └─────────┘     └────┬────┘             │   │
│  │                        │                               │                   │   │
│  │                   ┌────▼────┐                    ┌────▼────┐              │   │
│  │                   │ SWITCH  │                    │ ACTION  │              │   │
│  │                   │(routing)│                    │         │              │   │
│  │                   └────┬────┘                    └────┬────┘              │   │
│  │           ┌───────────┬┴───────────┐                  │                   │   │
│  │           ▼           ▼            ▼                  ▼                   │   │
│  │      ┌────────┐ ┌────────┐ ┌────────┐          ┌─────────┐               │   │
│  │      │ ALARM  │ │ NOTIFY │ │ UPDATE │          │ EXTERNAL│               │   │
│  │      │        │ │        │ │ DITTO  │          │  (API)  │               │   │
│  │      └────────┘ └────────┘ └────────┘          └─────────┘               │   │
│  │                                                                           │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         RULE ENGINE EXECUTOR (Worker)                        │   │
│  │                                                                              │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                   │   │
│  │  │ Node Registry │  │ Execution Ctx │  │ Result Handler│                   │   │
│  │  │  (all types)  │  │  (per message)│  │  (publish)    │                   │   │
│  │  └───────────────┘  └───────────────┘  └───────────────┘                   │   │
│  │                                                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Tipos de Nodos a Implementar (Fase 1 - MVP)

```typescript
// src/worker/rule-engine/nodes/index.ts

export enum NodeCategory {
  INPUT = 'input',
  FILTER = 'filter',
  ENRICHMENT = 'enrichment',
  TRANSFORMATION = 'transformation',
  ACTION = 'action',
  EXTERNAL = 'external',
  FLOW = 'flow',
}

// ============================================================================
// INPUT NODES (Entry points - consumed from Kafka)
// ============================================================================

interface InputNodes {
  // Kafka message input
  kafka_input: {
    topic: string;           // e.g., 'scada.telemetry.validated'
    consumerGroup?: string;
  };
  
  // 🆕 Data Source telemetry input (ver 15_DATA_SOURCE_DIGITAL_TWIN_MAPPING.md)
  data_source_input: {
    topic: string;           // 'telemetry.raw' - from Edge Gateway
    // Automáticamente enriquece con dataSourceId, gatewayId
  };
  
  // Schedule-based trigger
  schedule: {
    cron: string;            // e.g., '0 * * * *' (every hour)
    timezone?: string;
  };
  
  // Manual/API trigger
  manual: {
    webhookPath?: string;    // Optional webhook endpoint
  };
}

// ============================================================================
// 🆕 DATA SOURCE MAPPING NODES (ver 15_DATA_SOURCE_DIGITAL_TWIN_MAPPING.md)
// ============================================================================
// Estos nodos implementan el flujo de mapeo Data Source → Digital Twin
// La Rule Chain se asigna jerárquicamente:
//   1. Device Profile (default)
//   2. Connectivity Profile (override)
//   3. Device Binding (override por instancia)

interface DataSourceMappingNodes {
  // Resuelve Device Binding y Connectivity Profile
  resolve_binding: {
    // Input: mensaje con dataSourceId
    // Output: mensaje enriquecido con binding, connectivityProfile, deviceProfile
    cacheInRedis: boolean;   // Cache de bindings para performance
  };
  
  // Aplica mappings del Connectivity Profile
  apply_mapping: {
    // Input: mensaje con telemetry values y connectivityProfile
    // Output: array de { thingId, feature, property, value, transform }
    applyTransforms: boolean;  // Ejecutar expresiones de transform
  };
  
  // Rutea datos a múltiples Things (fan-out)
  route_to_components: {
    // Input: array de mappings resueltos
    // Output: múltiples mensajes, uno por Thing destino
  };
  
  // Escribe a Digital Twin en Ditto (batch)
  save_to_digital_twin: {
    // Input: mensaje con thingId, feature, property, value
    // Escribe a Ditto + TimescaleDB + Redis + WebSocket
    updateDitto: boolean;
    saveTimeSeries: boolean;
    cacheInRedis: boolean;
    broadcastWebSocket: boolean;
  };
}

// ============================================================================
// FILTER NODES (Route messages based on conditions)
// ============================================================================

interface FilterNodes {
  // Script-based filter (returns true/false)
  script_filter: {
    script: string;          // JavaScript expression
    outputs: ['true', 'false'];
  };
  
  // Message type switch
  message_type_switch: {
    // Routes to output matching message type
    outputs: string[];       // e.g., ['POST_TELEMETRY', 'ATTRIBUTE_UPDATE', 'ALARM']
  };
  
  // Asset type filter
  asset_type_filter: {
    assetTypes: string[];    // e.g., ['WELL', 'PUMP']
    outputs: ['match', 'no_match'];
  };
  
  // Threshold filter
  threshold_filter: {
    field: string;           // e.g., 'msg.pressure'
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    value: number;
    outputs: ['true', 'false'];
  };
  
  // Geofencing filter
  geofencing_filter: {
    latField: string;
    lonField: string;
    polygons: GeoPolygon[];
    outputs: ['inside', 'outside'];
  };
  
  // Check field presence
  check_fields: {
    fields: string[];        // Fields that must exist
    mode: 'all' | 'any';
    outputs: ['present', 'missing'];
  };
}

// ============================================================================
// ENRICHMENT NODES (Add context to messages)
// ============================================================================

interface EnrichmentNodes {
  // Fetch asset attributes from Ditto
  fetch_asset_attributes: {
    attributeKeys?: string[];  // null = all
  };
  
  // Fetch asset telemetry (latest)
  fetch_asset_telemetry: {
    telemetryKeys?: string[];
    fromCache: boolean;        // Redis vs DB
  };
  
  // Fetch related assets
  fetch_related_assets: {
    relationType: string;      // e.g., 'PARENT', 'CONTAINS'
    direction: 'from' | 'to';
  };
  
  // Lookup from database
  db_lookup: {
    table: string;
    keyField: string;
    keyValue: string;          // Expression: '${msg.wellId}'
    selectFields: string[];
  };
  
  // Add static metadata
  add_metadata: {
    metadata: Record<string, any>;
  };
}

// ============================================================================
// TRANSFORMATION NODES (Modify message content)
// ============================================================================

interface TransformationNodes {
  // Script transformation
  script_transform: {
    script: string;            // JavaScript function body
    // return { ...msg, calculated: msg.a + msg.b }
  };
  
  // Math operation
  math: {
    operation: 'add' | 'subtract' | 'multiply' | 'divide' | 'avg' | 'max' | 'min' | 'abs' | 'round' | 'floor' | 'ceil' | 'sqrt' | 'pow' | 'log';
    operands: Array<number | string>;  // Numbers or field paths
    resultField: string;
  };
  
  // Formula evaluation (mathjs)
  formula: {
    formula: string;           // e.g., '(pressure * 0.0689476) + 14.7'
    variables: Record<string, string>;  // Map variable to field path
    resultField: string;
  };
  
  // Rename fields
  rename_keys: {
    mappings: Array<{ from: string; to: string }>;
  };
  
  // Unit conversion
  unit_convert: {
    field: string;
    fromUnit: string;
    toUnit: string;
    resultField?: string;
  };
  
  // Aggregation (window-based)
  aggregate: {
    windowSize: number;        // In seconds
    windowType: 'tumbling' | 'sliding';
    groupBy?: string;          // Field to group by
    aggregations: Array<{
      field: string;
      operation: 'avg' | 'sum' | 'min' | 'max' | 'count' | 'stddev';
      resultField: string;
    }>;
  };
  
  // Delta calculation
  calculate_delta: {
    field: string;
    resultField: string;
    absolute: boolean;
  };
  
  // Trend detection
  trend_detector: {
    field: string;
    windowSize: number;
    resultField: string;       // 'increasing' | 'decreasing' | 'stable'
  };
}

// ============================================================================
// ACTION NODES (Perform operations)
// ============================================================================

interface ActionNodes {
  // Save to TimescaleDB
  save_timeseries: {
    table?: string;            // Default: asset_telemetry
  };
  
  // Update Ditto feature
  update_ditto_feature: {
    featureId: string;         // e.g., 'telemetry', 'computed'
    propertyPath: string;
    valueExpr: string;         // Expression: '${msg.calculatedValue}'
  };
  
  // Update asset attributes
  update_attributes: {
    attributes: Record<string, string>;  // Key: expression
  };
  
  // Create/Update alarm
  create_alarm: {
    alarmType: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
    message: string;           // Template: 'Pressure ${msg.pressure} exceeded threshold'
    propagate: boolean;
    details?: Record<string, string>;
  };
  
  // Clear alarm
  clear_alarm: {
    alarmType: string;
  };
  
  // Log message
  log: {
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;           // Template
  };
  
  // RPC to device
  rpc_call: {
    method: string;
    params: Record<string, any>;
    timeout: number;
  };
  
  // Generator (create periodic messages)
  generator: {
    periodSeconds: number;
    messageTemplate: Record<string, any>;
  };
}

// ============================================================================
// EXTERNAL NODES (Integrate with external systems)
// ============================================================================

interface ExternalNodes {
  // REST API call
  rest_api: {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;               // Template: 'https://api.example.com/${msg.id}'
    headers?: Record<string, string>;
    body?: string;             // Template or expression
    timeout: number;
    retries: number;
  };
  
  // Publish to Kafka
  kafka_publish: {
    topic: string;
    key?: string;              // Expression
    partition?: number;
  };
  
  // Send email
  send_email: {
    to: string[];              // Can be expressions
    cc?: string[];
    subject: string;           // Template
    body: string;              // Template (HTML)
    attachments?: string[];    // Field paths to attach
  };
  
  // Send SMS (Twilio)
  send_sms: {
    to: string;                // Expression
    message: string;           // Template
    provider: 'twilio' | 'aws_sns';
  };
  
  // Push notification
  push_notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
    targets: 'all' | 'user' | 'role';
    targetValue?: string;
  };
  
  // Webhook
  webhook: {
    url: string;
    secret?: string;
    method: 'POST' | 'PUT';
  };
  
  // Slack notification
  slack: {
    channel: string;
    message: string;           // Template (Markdown)
    mentionUsers?: string[];
  };
}

// ============================================================================
// FLOW NODES (Control message flow)
// ============================================================================

interface FlowNodes {
  // Invoke another rule chain
  rule_chain: {
    ruleChainId: string;
  };
  
  // Delay message
  delay: {
    delayMs: number;
    maxPending: number;
  };
  
  // Output (terminal node)
  output: {
    outputName: string;
  };
  
  // Duplicate message
  duplicate: {
    copies: number;
  };
  
  // Merge messages (wait for multiple inputs)
  merge: {
    inputCount: number;
    timeout: number;
    strategy: 'waitAll' | 'first' | 'majority';
  };
}
```

### 3.3 Formato de Regla Almacenada

```typescript
interface RuleChain {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  
  // Scope
  isRoot: boolean;               // Root chains are entry points
  appliesToAssetTypes: string[]; // Empty = all
  appliesToAssets?: string[];    // Specific assets (optional)
  
  // Visual data (React Flow format)
  nodes: RuleNode[];
  edges: RuleEdge[];
  
  // Execution config
  config: {
    priority: number;            // Execution order
    timeout: number;             // Max execution time (ms)
    debounceMs: number;          // Debounce rapid triggers
    maxExecutionsPerMinute: number;
    retryOnFailure: boolean;
    retryAttempts: number;
    retryDelayMs: number;
  };
  
  // State
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  version: number;
  
  // Audit
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RuleNode {
  id: string;
  type: string;                  // NodeType enum
  data: {
    label: string;
    config: Record<string, any>; // Node-specific config
    description?: string;
  };
  position: { x: number; y: number };
}

interface RuleEdge {
  id: string;
  source: string;                // Source node ID
  sourceHandle?: string;         // Output port name
  target: string;                // Target node ID
  targetHandle?: string;         // Input port name
  label?: string;                // e.g., 'true', 'false', 'match'
  data?: {
    condition?: string;          // Optional condition for edge
  };
}
```

---

## 4. 🔌 Conectores de Dispositivos (Edge Gateway)

### 4.1 Apache PLC4X Integration

Ya tenemos implementaciones custom de drivers en `src/edge/services/protocols/`. Propuesta de mejora:

**Migrar a Apache PLC4X** (Java) o mantener implementación actual:

| Enfoque | Pros | Contras |
|---------|------|---------|
| **Mantener actual** (Node.js) | Mismo stack, ya funciona, mantenible | Menos protocolos, bugs potenciales |
| **Apache PLC4X** (Java) | +50 protocolos, probado industrialmente | Servicio separado, complejidad |
| **Híbrido** | Lo mejor de ambos mundos | Complejidad media |

**Decisión**: **Híbrido**
- Mantener drivers Node.js para protocolos principales (Modbus, OPC-UA, S7, EtherNet/IP)
- Usar PLC4X como fallback para protocolos exóticos vía REST/Kafka

### 4.2 Estructura de Edge Gateway Mejorada

```
src/edge/
├── services/
│   ├── protocols/
│   │   ├── modbus.service.ts       ✅ (existente)
│   │   ├── opcua.service.ts        ✅ (existente)
│   │   ├── s7.service.ts           ✅ (existente)
│   │   ├── ethernet-ip.service.ts  ✅ (existente)
│   │   ├── fins.service.ts         🆕 (Omron FINS)
│   │   ├── mqtt.service.ts         🆕 (MQTT gateway)
│   │   └── plc4x-bridge.service.ts 🆕 (PLC4X fallback)
│   ├── data-collector-v2.service.ts ✅ (existente)
│   ├── kafka.service.ts            ✅ (existente)
│   └── config-sync.service.ts      🆕 (sync con backend)
├── config/
│   ├── tags.json                   (migrar a DB)
│   └── devices.json                (migrar a DB)
└── store/
    └── sqlite/                     (store-and-forward)
```

---

## 5. 📈 Dashboards y Visualización

### 5.1 Enfoque Propuesto

Inspirado en ThingsBoard/StreamPipes pero con stack React:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              DASHBOARD SYSTEM                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         DASHBOARD BUILDER (UI)                               │   │
│  │                                                                              │   │
│  │   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   │   │
│  │   │ Widget Lib  │   │ Layout Grid │   │ Data Bind   │   │ Style Theme │   │   │
│  │   │             │   │ (react-grid)│   │ (queries)   │   │ (tailwind)  │   │   │
│  │   └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         WIDGET LIBRARY                                       │   │
│  │                                                                              │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │   │
│  │  │  Timeseries  │ │    Gauge     │ │     Map      │ │    Table     │       │   │
│  │  │ (ECharts)    │ │ (Recharts)   │ │ (Leaflet)    │ │ (TanStack)   │       │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘       │   │
│  │                                                                              │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │   │
│  │  │   Alarm      │ │    KPI       │ │   Switch     │ │   Slider     │       │   │
│  │  │   List       │ │   Card       │ │  (control)   │ │  (control)   │       │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘       │   │
│  │                                                                              │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │   │
│  │  │   Heatmap    │ │  Histogram   │ │   Scatter    │ │   Sankey     │       │   │
│  │  │              │ │              │ │   Plot       │ │   Diagram    │       │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘       │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         DATA SOURCES                                         │   │
│  │                                                                              │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                        │   │
│  │  │  WebSocket   │ │   REST API   │ │ TimescaleDB  │                        │   │
│  │  │  (real-time) │ │  (history)   │ │  (aggregate) │                        │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘                        │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Widget Library (React Components)

```typescript
// src/frontend/src/features/dashboards/widgets/types.ts

interface WidgetDefinition {
  id: string;
  type: WidgetType;
  name: string;
  description: string;
  icon: string;
  category: 'charts' | 'gauges' | 'maps' | 'tables' | 'controls' | 'cards';
  
  // Data binding
  dataSource: {
    type: 'realtime' | 'historical' | 'static';
    config: DataSourceConfig;
  };
  
  // Appearance
  settings: WidgetSettings;
  
  // Layout
  layout: {
    minW: number;
    minH: number;
    defaultW: number;
    defaultH: number;
  };
}

enum WidgetType {
  // Charts
  TIMESERIES = 'timeseries',
  BAR_CHART = 'bar_chart',
  PIE_CHART = 'pie_chart',
  HISTOGRAM = 'histogram',
  SCATTER = 'scatter',
  HEATMAP = 'heatmap',
  SANKEY = 'sankey',
  
  // Gauges
  RADIAL_GAUGE = 'radial_gauge',
  LINEAR_GAUGE = 'linear_gauge',
  BATTERY = 'battery',
  SPEEDOMETER = 'speedometer',
  
  // Cards
  VALUE_CARD = 'value_card',
  KPI_CARD = 'kpi_card',
  DELTA_CARD = 'delta_card',
  STATUS_CARD = 'status_card',
  
  // Tables
  DATA_TABLE = 'data_table',
  ALARM_TABLE = 'alarm_table',
  ENTITY_TABLE = 'entity_table',
  
  // Maps
  ASSET_MAP = 'asset_map',
  ROUTE_MAP = 'route_map',
  HEATMAP_MAP = 'heatmap_map',
  
  // Controls
  SWITCH = 'switch',
  SLIDER = 'slider',
  INPUT = 'input',
  BUTTON = 'button',
  COMMAND_PANEL = 'command_panel',
  
  // Specialized (Oil & Gas)
  WELL_SCHEMATIC = 'well_schematic',
  NODAL_ANALYSIS = 'nodal_analysis',
  PRODUCTION_CHART = 'production_chart',
  ESP_MONITOR = 'esp_monitor',
}
```

---

## 6. 📋 Plan de Implementación (Roadmap)

### Fase 1: Fundamentos (4-6 semanas)

#### 1.1 Separación de Servicios (Semana 1-2)

**Tareas**:
- [ ] Crear estructura para `src/worker/` (Worker Service)
- [ ] Mover consumers de Kafka de backend a worker
- [ ] Mover calculation engine a worker
- [ ] Mover WebSocket broadcast a worker
- [ ] Configurar PM2 para múltiples servicios
- [ ] Docker Compose para worker service
- [ ] Health checks y monitoreo

**Archivos a crear**:
```
src/worker/
├── index.ts                     # Entry point
├── config/
│   └── worker.config.ts
├── consumers/
│   ├── telemetry.consumer.ts
│   ├── ditto-sync.consumer.ts
│   ├── rules.consumer.ts
│   └── alarms.consumer.ts
├── services/
│   ├── rule-executor.service.ts
│   ├── alarm-processor.service.ts
│   ├── notification.service.ts
│   └── calculation.service.ts
└── websocket/
    └── gateway.service.ts
```

#### 1.2 Eclipse Ditto Integration (Semana 2-3)

**Tareas**:
- [ ] Agregar Ditto al Docker Compose
- [ ] Configurar MongoDB para Ditto
- [ ] Crear conexión Kafka en Ditto
- [ ] Implementar Ditto client en Node.js
- [ ] Migrar assets existentes a Things
- [ ] Mapear asset_types a Thing templates
- [ ] Crear políticas base
- [ ] Sincronizar telemetría con Features

**Docker Compose**:
```yaml
# docker/docker-compose.ditto.yml
services:
  ditto-policies:
    image: eclipse/ditto-policies:3.5.0
    # ...
  ditto-things:
    image: eclipse/ditto-things:3.5.0
    # ...
  ditto-things-search:
    image: eclipse/ditto-things-search:3.5.0
    # ...
  ditto-gateway:
    image: eclipse/ditto-gateway:3.5.0
    ports:
      - "18080:8080"
    # ...
  ditto-connectivity:
    image: eclipse/ditto-connectivity:3.5.0
    # ...
  ditto-mongodb:
    image: mongo:6
    # ...
```

#### 1.3 Refactorizar Rule Engine (Semana 3-4)

**Tareas**:
- [ ] Implementar Node Registry (todos los tipos de nodos)
- [ ] Crear base classes para cada categoría
- [ ] Implementar nodos críticos (15 nodos MVP):
  - [ ] `kafka_input`
  - [ ] `script_filter`
  - [ ] `threshold_filter`
  - [ ] `message_type_switch`
  - [ ] `fetch_asset_attributes`
  - [ ] `fetch_asset_telemetry`
  - [ ] `script_transform`
  - [ ] `math`
  - [ ] `formula`
  - [ ] `save_timeseries`
  - [ ] `update_ditto_feature`
  - [ ] `create_alarm`
  - [ ] `log`
  - [ ] `kafka_publish`
  - [ ] `rule_chain`
- [ ] Execution engine con soporte para edges condicionales
- [ ] Tests unitarios para cada nodo

### Fase 2: Motor de Reglas Completo (4-6 semanas)

#### 2.1 Nodos Adicionales (Semana 5-6)

**Tareas**:
- [ ] Implementar nodos de Enrichment (6 nodos)
- [ ] Implementar nodos de Transformation (8 nodos)
- [ ] Implementar nodos de External (8 nodos)
- [ ] Implementar nodos de Flow (4 nodos)
- [ ] Dead Letter Queue para fallos
- [ ] Retry policies configurables

#### 2.2 Frontend - Rule Editor (Semana 6-8)

**Tareas**:
- [ ] Diseñar UI del editor (React Flow)
- [ ] Palette de nodos por categoría
- [ ] Panel de propiedades por nodo
- [ ] Validación de conexiones
- [ ] Preview de ejecución
- [ ] Historial de versiones
- [ ] Import/Export de rule chains

**Componentes**:
```
src/frontend/src/features/rule-editor/
├── components/
│   ├── RuleEditorCanvas.tsx       # React Flow container
│   ├── NodePalette.tsx            # Left sidebar
│   ├── NodePropertiesPanel.tsx    # Right sidebar
│   ├── ExecutionPreview.tsx       # Bottom panel
│   ├── VersionHistory.tsx
│   └── nodes/                     # Custom node components
│       ├── InputNode.tsx
│       ├── FilterNode.tsx
│       ├── EnrichmentNode.tsx
│       ├── TransformNode.tsx
│       ├── ActionNode.tsx
│       ├── ExternalNode.tsx
│       └── FlowNode.tsx
├── hooks/
│   ├── useRuleEditor.ts
│   ├── useNodeRegistry.ts
│   └── useRuleExecution.ts
├── stores/
│   └── ruleEditorStore.ts
└── api/
    └── rules.api.ts
```

### Fase 3: Dashboards y Widgets (4-6 semanas)

#### 3.1 Dashboard Framework (Semana 9-10)

**Tareas**:
- [ ] Implementar Dashboard model
- [ ] React Grid Layout integration
- [ ] Widget registry
- [ ] Data source abstraction
- [ ] Real-time data hooks
- [ ] Dashboard CRUD

#### 3.2 Widget Library (Semana 10-12)

**Tareas**:
- [ ] Charts widgets (ECharts)
- [ ] Gauge widgets
- [ ] Card widgets
- [ ] Table widgets
- [ ] Control widgets
- [ ] Map widgets
- [ ] Oil & Gas specialized widgets

#### 3.3 Dashboard Builder UI (Semana 12-14)

**Tareas**:
- [ ] Drag & drop widget placement
- [ ] Widget configuration panel
- [ ] Data binding UI
- [ ] Theme customization
- [ ] Export/share dashboards
- [ ] Dashboard templates

### Fase 4: Migración y Testing (2-4 semanas)

#### 4.1 Migración de Datos (Semana 15)

**Tareas**:
- [ ] Script de migración de assets a Ditto
- [ ] Migración de reglas existentes al nuevo formato
- [ ] Migración de configuraciones
- [ ] Verificación de integridad

#### 4.2 Testing y Optimización (Semana 16-17)

**Tareas**:
- [ ] Tests de integración
- [ ] Load testing
- [ ] Performance tuning
- [ ] Documentación

---

## 7. 📚 Dependencias a Agregar

### Backend/Worker

```json
{
  "dependencies": {
    "@eclipse-ditto/ditto-javascript-client-api_1.0": "^3.0.0",
    "mathjs": "^12.0.0",          // Ya instalado
    "kafkajs": "^2.2.4",          // Ya instalado
    "socket.io": "^4.7.0",        // Ya instalado
    "node-cron": "^3.0.3",        // Para schedule triggers
    "handlebars": "^4.7.8",       // Para templates
    "nodemailer": "^6.9.0",       // Para emails
    "twilio": "^4.20.0",          // Para SMS (opcional)
    "axios": "^1.6.0"             // Para REST calls
  }
}
```

### Frontend

```json
{
  "dependencies": {
    "reactflow": "^11.10.0",       // Ya instalado
    "@xyflow/react": "^12.0.0",    // Nueva versión (opcional upgrade)
    "echarts": "^5.5.0",           // Charts avanzados
    "echarts-for-react": "^3.0.2",
    "react-grid-layout": "^1.4.4", // Dashboard layout
    "leaflet": "^1.9.4",           // Maps (ya instalado)
    "@tanstack/react-table": "^8.11.0",
    "react-hook-form": "^7.49.0",  // Ya instalado
    "zustand": "^4.4.0"            // Ya instalado
  }
}
```

### Docker

```yaml
# Nuevas imágenes
eclipse/ditto-gateway:3.5.0
eclipse/ditto-policies:3.5.0
eclipse/ditto-things:3.5.0
eclipse/ditto-things-search:3.5.0
eclipse/ditto-connectivity:3.5.0
mongo:6
```

---

## 8. ⚠️ Consideraciones y Riesgos

### 8.1 Riesgos Técnicos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Ditto requiere Java/JVM | Complejidad ops | Docker abstrae, buena documentación |
| Ditto requiere MongoDB | Otra DB | Ya usamos PostgreSQL, MongoDB solo para Ditto |
| Curva de aprendizaje | Tiempo | Empezar con subset de features |
| Performance Rule Engine | Latencia | Optimizar nodos críticos primero |

### 8.2 Decisiones Alternativas

Si Eclipse Ditto resulta muy complejo, alternativas:

1. **Mantener implementación actual** + mejorar
2. **AWS IoT TwinMaker** (cloud, vendor lock-in)
3. **Custom TypeScript implementation** mejorada

### 8.3 Métricas de Éxito

- Latencia de telemetría < 100ms end-to-end
- Rule Engine puede procesar 10,000 msg/s
- Dashboard actualiza en < 500ms
- 99.9% uptime de servicios

---

## 9. 📎 Referencias

- [Eclipse Ditto Documentation](https://eclipse.dev/ditto/)
- [Eclipse Ditto Kafka Connectivity](https://eclipse.dev/ditto/connectivity-protocol-bindings-kafka2.html)
- [ThingsBoard Rule Engine](https://thingsboard.io/docs/user-guide/rule-engine-2-0/overview/)
- [Apache StreamPipes](https://streampipes.apache.org/)
- [Apache PLC4X](https://plc4x.apache.org/)
- [React Flow Documentation](https://reactflow.dev/)
- [Rete.js](https://retejs.org/)

---

**Documento creado**: 2026-01-10
**Última actualización**: 2026-01-10
**Estado**: PROPUESTA
**Autor**: Sistema (Investigación automatizada)
