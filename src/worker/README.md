# SCADA+ERP Worker Service

Servicio Worker para procesamiento asíncrono, Rule Engine, alarmas y WebSocket.

## Arquitectura

```
Worker Service
├── Kafka Consumers (telemetry, events, commands)
├── Rule Engine (60+ tipos de nodos)
├── Alarm Service
├── WebSocket Gateway
└── Eclipse Ditto Integration
```

## Estructura

```
src/
├── config/           # Configuración
├── consumers/        # Kafka consumers
├── services/         # Servicios (alarms, websocket, ditto)
├── rule-engine/      # Motor de reglas
│   ├── nodes/        # Tipos de nodos
│   └── node-registry.ts
└── utils/            # Utilidades
```

## Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo con hot reload
npm run dev

# Build
npm run build

# Producción
npm start
```

## Variables de Entorno

Ver `.env.example` para configuración completa.

## Nodos Implementados (MVP - 15/15) ✅

### Input Nodes (1)
- ✅ `kafka_input` - Entrada desde Kafka

### Filter Nodes (3)
- ✅ `script_filter` - Filtro con JavaScript
- ✅ `threshold_filter` - Filtro por umbral numérico (gt, gte, lt, lte, eq, neq)
- ✅ `message_type_switch` - Switch por tipo de mensaje

### Transform Nodes (3)
- ✅ `script_transform` - Transformación con JavaScript
- ✅ `math` - Operaciones matemáticas (add, subtract, multiply, divide, power, sqrt, abs, round, ceil, floor)
- ✅ `formula` - Evaluación de fórmulas con mathjs

### Enrichment Nodes (2)
- ✅ `fetch_asset_attributes` - Obtener atributos de Digital Twins desde Ditto
- ✅ `fetch_asset_telemetry` - Obtener telemetría de features desde Ditto

### Action Nodes (5)
- ✅ `log` - Log para debugging con niveles
- ✅ `create_alarm` - Crear alarmas con severidad (info, warning, error, critical)
- ✅ `kafka_publish` - Publicar mensajes a Kafka
- ✅ `save_timeseries` - Guardar datos en TimescaleDB
- ✅ `update_ditto_feature` - Actualizar properties de features en Ditto

### Flow Nodes (1)
- ✅ `rule_chain` - Invocar otra cadena de reglas

## Servicios Implementados

- ✅ **Ditto Client Service** - Cliente para interactuar con Eclipse Ditto API
  - GET/PUT/PATCH/DELETE Things
  - GET/UPDATE Feature Properties
  - GET Thing Attributes

- ✅ **Alarm Service** - Gestión de alarmas
  - Creación y persistencia de alarmas
  - Estados: active, acknowledged, cleared
  - Severidades: info, warning, error, critical
  - Publicación a Kafka para broadcast

- ✅ **WebSocket Gateway Service** - Comunicación en tiempo real
  - Autenticación JWT
  - Sistema de rooms por recurso
  - Broadcast a tenants, assets, alarmas
  - Gestión de suscripciones

## Kafka Consumers Implementados

- ✅ **Telemetry Consumer** - Procesa telemetría en tiempo real
  - Topics: scada.telemetry.raw, scada.telemetry.validated
  - Persistencia en TimescaleDB
  - Cache en Redis
  - Trigger de Rule Engine

- ✅ **Rule Trigger Consumer** - Ejecuta reglas automáticamente
  - Topics: scada.telemetry.validated, assets.attributes.changed, assets.status.changed
  - Detección de reglas aplicables
  - Ejecución paralela de reglas

- ✅ **Alarm Broadcast Consumer** - Broadcast de alarmas vía WebSocket
  - Topic: scada.alarms
  - Broadcast a rooms de tenant y asset
  - Priorización de alarmas críticas

## Documentación

Ver `/roadmap/01_arquitectura/10_ECLIPSE_DITTO_RULE_ENGINE_ADVANCED.md`
