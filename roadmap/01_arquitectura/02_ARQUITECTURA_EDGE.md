# ARQUITECTURA DEL SISTEMA EDGE

## 1. Visión General

El Edge es un sistema **completo y autónomo** que incluye todos los módulos del ERP+SCADA. Se despliega en hardware industrial en campo y puede operar indefinidamente sin conexión a internet.

---

## 2. Componentes del Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SISTEMA EDGE                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         CAPA DE PRESENTACIÓN                         │    │
│  │                                                                      │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │    │
│  │  │   Web App    │  │  Mobile App  │  │   HMI/SCADA  │              │    │
│  │  │   (React)    │  │   (PWA)      │  │   Panels     │              │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         CAPA DE API                                  │    │
│  │                                                                      │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │    │
│  │  │  REST API    │  │  WebSocket   │  │  GraphQL     │              │    │
│  │  │  (Actix)     │  │  (Real-time) │  │  (Opcional)  │              │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         CAPA DE SERVICIOS                            │    │
│  │                                                                      │    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │    │
│  │  │ Auth   │ │ Wells  │ │ Drill  │ │ Prod   │ │ Inv    │            │    │
│  │  │Service │ │Service │ │Service │ │Service │ │Service │            │    │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘            │    │
│  │                                                                      │    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │    │
│  │  │ HR     │ │Finance │ │ Maint  │ │ Report │ │ Alarm  │            │    │
│  │  │Service │ │Service │ │Service │ │Service │ │Service │            │    │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘            │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         CAPA DE DATOS                                │    │
│  │                                                                      │    │
│  │  ┌──────────────────────┐  ┌──────────────────────┐                │    │
│  │  │      PostgreSQL       │  │     TimescaleDB      │                │    │
│  │  │   (Datos Maestros)    │  │    (Time-Series)     │                │    │
│  │  └──────────────────────┘  └──────────────────────┘                │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         CAPA SCADA/OT                                │    │
│  │                                                                      │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │    │
│  │  │   Modbus     │  │    MQTT      │  │   OPC-UA     │              │    │
│  │  │   Gateway    │  │    Broker    │  │   Client     │              │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Servicios del Sistema

### 3.1 Servicios Core

| Servicio | Responsabilidad | Puerto |
|----------|-----------------|--------|
| **api-gateway** | Enrutamiento, rate limiting, CORS | 8080 |
| **auth-service** | Autenticación JWT, gestión de sesiones | 8081 |
| **user-service** | Gestión de usuarios y permisos | 8082 |
| **audit-service** | Registro de actividades | 8083 |
| **config-service** | Configuración centralizada | 8084 |
| **notification-service** | Alertas, emails, push | 8085 |

### 3.2 Servicios de Negocio

| Servicio | Módulo | Puerto |
|----------|--------|--------|
| **well-service** | Gestión de pozos | 8100 |
| **reservoir-service** | Yacimientos, PVT | 8101 |
| **drilling-service** | Operaciones de perforación | 8102 |
| **production-service** | Producción y optimización | 8103 |
| **intervention-service** | CT, Workover | 8104 |
| **inventory-service** | Inventario y almacén | 8110 |
| **finance-service** | Contabilidad y finanzas | 8111 |
| **hr-service** | RRHH y nómina | 8112 |
| **maintenance-service** | Mantenimiento de equipos | 8113 |

### 3.3 Servicios SCADA

| Servicio | Protocolo | Puerto |
|----------|-----------|--------|
| **modbus-gateway** | Modbus TCP/RTU | 502 |
| **mqtt-broker** | MQTT | 1883/8883 |
| **opcua-client** | OPC-UA | 4840 |
| **alarm-engine** | Procesamiento de alarmas | 8090 |
| **historian** | Almacenamiento time-series | 8091 |

---

## 4. Estructura de Contenedores

### 4.1 Docker Compose (Desarrollo)

```yaml
version: '3.8'

services:
  # Base de datos
  postgres:
    image: timescale/timescaledb:latest-pg15
    environment:
      POSTGRES_DB: scadaerp
      POSTGRES_USER: erp_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  # Backend API
  api:
    build: ./backend
    environment:
      DATABASE_URL: postgres://erp_user:${DB_PASSWORD}@postgres:5432/scadaerp
      JWT_SECRET: ${JWT_SECRET}
      RUST_LOG: info
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    restart: unless-stopped

  # Frontend
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - api
    restart: unless-stopped

  # MQTT Broker
  mqtt:
    image: eclipse-mosquitto:2
    volumes:
      - ./config/mosquitto:/mosquitto/config
      - mqtt_data:/mosquitto/data
    ports:
      - "1883:1883"
      - "8883:8883"
    restart: unless-stopped

  # Modbus Gateway
  modbus-gateway:
    build: ./scada/modbus
    environment:
      MQTT_BROKER: mqtt:1883
      DATABASE_URL: postgres://erp_user:${DB_PASSWORD}@postgres:5432/scadaerp
    ports:
      - "502:502"
    depends_on:
      - mqtt
      - postgres
    restart: unless-stopped

volumes:
  postgres_data:
  mqtt_data:
```

### 4.2 K3s Manifests (Producción)

Estructura de manifests para Kubernetes:

```
k8s/
├── namespace.yaml
├── secrets/
│   ├── db-secrets.yaml
│   └── jwt-secrets.yaml
├── configmaps/
│   └── app-config.yaml
├── deployments/
│   ├── postgres.yaml
│   ├── api.yaml
│   ├── frontend.yaml
│   └── scada-gateway.yaml
├── services/
│   ├── postgres-svc.yaml
│   ├── api-svc.yaml
│   └── frontend-svc.yaml
└── ingress/
    └── main-ingress.yaml
```

---

## 5. Comunicación entre Servicios

### 5.1 Comunicación Síncrona

- **REST API**: Para operaciones CRUD estándar
- **gRPC**: Para comunicación interna de alta frecuencia (opcional)

### 5.2 Comunicación Asíncrona

- **MQTT**: Para telemetría y eventos SCADA
- **PostgreSQL LISTEN/NOTIFY**: Para eventos de BD

```
┌─────────────────────────────────────────────────────────────┐
│                   PATRONES DE COMUNICACIÓN                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend ──HTTP/WS──▶ API Gateway ──HTTP──▶ Servicios      │
│                                                              │
│  SCADA Devices ──MQTT──▶ MQTT Broker ──▶ Historian          │
│                              │                               │
│                              ▼                               │
│                         API Gateway                          │
│                              │                               │
│                              ▼                               │
│                        WebSocket                             │
│                              │                               │
│                              ▼                               │
│                         Frontend                             │
│                    (Real-time updates)                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Almacenamiento de Datos

### 6.1 PostgreSQL (Datos Maestros)

Almacena:
- Usuarios y permisos
- Configuración del sistema
- Datos de pozos, yacimientos
- Transacciones ERP
- Inventario
- Finanzas

### 6.2 TimescaleDB (Time-Series)

Almacena:
- Telemetría de sensores
- Datos de producción históricos
- Logs de eventos
- Métricas de rendimiento

### 6.3 Particionamiento

```sql
-- Hypertable para telemetría
SELECT create_hypertable('sensor_data', 'timestamp', 
    chunk_time_interval => INTERVAL '1 day');

-- Políticas de retención
SELECT add_retention_policy('sensor_data', INTERVAL '1 year');

-- Compresión automática
SELECT add_compression_policy('sensor_data', INTERVAL '7 days');
```

---

## 7. Seguridad Edge

### 7.1 Autenticación

```
┌─────────────────────────────────────────────────────────────┐
│                   FLUJO DE AUTENTICACIÓN                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Usuario ──credentials──▶ /api/auth/login                │
│                                                              │
│  2. Auth Service:                                            │
│     - Valida credenciales contra PostgreSQL                  │
│     - Genera JWT (access_token + refresh_token)              │
│     - Registra sesión                                        │
│                                                              │
│  3. Usuario recibe tokens                                    │
│                                                              │
│  4. Requests posteriores incluyen:                           │
│     Authorization: Bearer <access_token>                     │
│                                                              │
│  5. API Gateway valida JWT en cada request                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Autorización RBAC

| Rol | Permisos |
|-----|----------|
| **admin** | Acceso total, configuración del sistema |
| **supervisor** | Gestión de operaciones, reportes |
| **operator** | Operaciones diarias, entrada de datos |
| **viewer** | Solo lectura |
| **scada** | Cuenta de servicio para dispositivos |

---

## 8. Monitoreo y Observabilidad

### 8.1 Métricas

- **Prometheus**: Recolección de métricas
- **Grafana**: Dashboards de monitoreo (opcional en edge)

### 8.2 Logs

- **Logs estructurados**: JSON a stdout
- **Rotación local**: logrotate
- **Retención**: 30 días en edge

### 8.3 Health Checks

```rust
// Endpoint de health check
GET /api/health

{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected",
  "mqtt": "connected",
  "uptime_seconds": 86400
}
```

---

## 9. Backup y Recuperación

### 9.1 Backup Automático

- **Frecuencia**: Diario (configurable)
- **Destino**: USB externo o NAS local
- **Retención**: 30 días
- **Tipo**: pg_dump comprimido

### 9.2 Recuperación

```bash
# Restaurar desde backup
pg_restore -h localhost -U erp_user -d scadaerp backup.dump
```

---

## 10. Actualizaciones

### 10.1 Mecanismo de Actualización

1. Descarga de imagen nueva (via USB o red)
2. Validación de firma
3. Backup automático pre-actualización
4. Despliegue con K3s (rolling update)
5. Rollback automático si falla health check

### 10.2 Versionamiento

```
Formato: MAJOR.MINOR.PATCH

- MAJOR: Cambios incompatibles
- MINOR: Nuevas funcionalidades compatibles
- PATCH: Correcciones de bugs
```

