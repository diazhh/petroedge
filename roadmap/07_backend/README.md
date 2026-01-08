# ROADMAP: BACKEND STACK

## Índice de Documentos

| Documento | Descripción | Estado |
|-----------|-------------|--------|
| `01_ARQUITECTURA_BACKEND.md` | Estructura y patrones | ✅ |
| `02_APIS_REST.md` | Diseño de APIs | 📋 |
| `03_BASE_DATOS.md` | PostgreSQL + TimescaleDB | 📋 |
| `04_AUTENTICACION.md` | JWT, RBAC, sesiones | 📋 |
| `05_SCADA_GATEWAY.md` | Modbus, MQTT, OPC-UA | 📋 |

---

## Resumen Ejecutivo

El backend del sistema ERP+SCADA está diseñado para:

- **Alto rendimiento**: Rust/Go para bajo consumo de recursos
- **Escalabilidad**: Arquitectura modular
- **Tiempo real**: WebSockets para datos SCADA
- **Resiliencia**: Operación autónoma en edge

---

## Stack Tecnológico

| Componente | Tecnología | Justificación |
|------------|------------|---------------|
| **Lenguaje** | Rust (Actix-Web) | Performance, seguridad de memoria |
| **Alternativa** | Go (Gin/Echo) | Simplicidad, concurrencia |
| **Base de Datos** | PostgreSQL 15+ | Madurez, extensibilidad |
| **Time-Series** | TimescaleDB | Extensión nativa, hypertables |
| **Cache** | Redis (opcional) | Sesiones, cache de queries |
| **Message Queue** | MQTT (Mosquitto) | Telemetría SCADA |
| **Containers** | Docker + K3s | Orquestación edge |

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         API GATEWAY                                    │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                   │  │
│  │  │   REST API  │  │  WebSocket  │  │   GraphQL   │                   │  │
│  │  │   (Actix)   │  │  (Real-time)│  │  (opcional) │                   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│                                    ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         MIDDLEWARE LAYER                               │  │
│  │                                                                        │  │
│  │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐               │  │
│  │  │Auth │  │Rate │  │CORS │  │Audit│  │Error│  │Cache│               │  │
│  │  │JWT  │  │Limit│  │     │  │Log  │  │Handl│  │     │               │  │
│  │  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘               │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│                                    ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         SERVICE LAYER                                  │  │
│  │                                                                        │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐              │  │
│  │  │ Wells  │ │Drilling│ │Productn│ │Reservor│ │  ERP   │              │  │
│  │  │Service │ │Service │ │Service │ │Service │ │Services│              │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘              │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│                                    ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         DATA LAYER                                     │  │
│  │                                                                        │  │
│  │  ┌──────────────────────┐  ┌──────────────────────┐                  │  │
│  │  │     PostgreSQL       │  │     TimescaleDB      │                  │  │
│  │  │   (Master Data)      │  │    (Time-Series)     │                  │  │
│  │  └──────────────────────┘  └──────────────────────┘                  │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│                                    ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         SCADA LAYER                                    │  │
│  │                                                                        │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                  │  │
│  │  │ Modbus  │  │  MQTT   │  │ OPC-UA  │  │ WITSML  │                  │  │
│  │  │ Gateway │  │ Broker  │  │ Client  │  │ Client  │                  │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘                  │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Estructura del Proyecto (Rust)

```
backend/
├── Cargo.toml
├── src/
│   ├── main.rs
│   ├── config/
│   │   ├── mod.rs
│   │   └── settings.rs
│   ├── api/
│   │   ├── mod.rs
│   │   ├── routes.rs
│   │   ├── handlers/
│   │   │   ├── wells.rs
│   │   │   ├── drilling.rs
│   │   │   ├── production.rs
│   │   │   └── ...
│   │   └── middleware/
│   │       ├── auth.rs
│   │       ├── cors.rs
│   │       └── audit.rs
│   ├── services/
│   │   ├── mod.rs
│   │   ├── well_service.rs
│   │   ├── drilling_service.rs
│   │   └── ...
│   ├── models/
│   │   ├── mod.rs
│   │   ├── well.rs
│   │   ├── test.rs
│   │   └── ...
│   ├── db/
│   │   ├── mod.rs
│   │   ├── pool.rs
│   │   └── migrations/
│   ├── scada/
│   │   ├── mod.rs
│   │   ├── modbus.rs
│   │   ├── mqtt.rs
│   │   └── opcua.rs
│   └── utils/
│       ├── mod.rs
│       ├── errors.rs
│       └── validators.rs
├── migrations/
└── tests/
```

---

## APIs REST

### Convenciones

| Aspecto | Estándar |
|---------|----------|
| **Versionado** | `/api/v1/...` |
| **Formato** | JSON |
| **Autenticación** | Bearer JWT |
| **Paginación** | `?page=1&per_page=20` |
| **Ordenamiento** | `?sort=field&order=asc` |
| **Filtros** | `?field=value` |

### Estructura de Respuesta

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 20
  }
}
```

### Endpoints Principales

| Módulo | Base Path | Endpoints |
|--------|-----------|-----------|
| **Auth** | `/api/v1/auth` | login, logout, refresh, me |
| **Users** | `/api/v1/users` | CRUD usuarios |
| **Wells** | `/api/v1/wells` | CRUD pozos |
| **Tests** | `/api/v1/well-testing` | Pruebas de pozo |
| **Drilling** | `/api/v1/drilling` | Operaciones perforación |
| **Production** | `/api/v1/production` | Datos de producción |
| **Reservoir** | `/api/v1/reservoirs` | Yacimientos, PVT |

---

## Base de Datos

### PostgreSQL + TimescaleDB

```sql
-- Extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "timescaledb";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Esquema multi-tenant
CREATE SCHEMA IF NOT EXISTS tenant_default;

-- Configurar search_path por tenant
SET search_path TO tenant_default, public;
```

### Migraciones

Usando `sqlx` o `diesel` para migraciones:

```bash
# Crear migración
sqlx migrate add create_wells_table

# Ejecutar migraciones
sqlx migrate run

# Revertir última migración
sqlx migrate revert
```

---

## Autenticación y Autorización

### JWT Flow

```
1. POST /api/v1/auth/login
   Body: { email, password }
   Response: { access_token, refresh_token, expires_in }

2. Requests autenticados:
   Header: Authorization: Bearer <access_token>

3. Refresh token:
   POST /api/v1/auth/refresh
   Body: { refresh_token }

4. Logout:
   POST /api/v1/auth/logout
```

### RBAC (Role-Based Access Control)

| Rol | Permisos |
|-----|----------|
| **admin** | Acceso total |
| **manager** | Gestión de operaciones |
| **engineer** | Análisis y reportes |
| **operator** | Entrada de datos |
| **viewer** | Solo lectura |

---

## SCADA Gateway

### Modbus TCP

```rust
// Ejemplo de lectura Modbus
async fn read_holding_registers(
    client: &ModbusClient,
    address: u16,
    count: u16
) -> Result<Vec<u16>, Error> {
    client.read_holding_registers(address, count).await
}
```

### MQTT

```rust
// Suscripción a tópicos
async fn subscribe_telemetry(client: &MqttClient) {
    client.subscribe("wells/+/telemetry", QoS::AtLeastOnce).await;
}

// Publicar datos
async fn publish_command(client: &MqttClient, well_id: &str, cmd: &Command) {
    let topic = format!("wells/{}/commands", well_id);
    client.publish(topic, serde_json::to_vec(cmd)?).await;
}
```

---

## Cronograma de Implementación

| Fase | Entregable | Duración |
|------|------------|----------|
| **1** | Proyecto base + config | 1 semana |
| **2** | Base de datos + migraciones | 1 semana |
| **3** | Auth + RBAC | 1 semana |
| **4** | APIs CRUD básicas | 2 semanas |
| **5** | WebSocket real-time | 1 semana |
| **6** | SCADA Gateway (Modbus/MQTT) | 2 semanas |
| **7** | Testing + Documentación | 1 semana |

**Total: 9 semanas**

