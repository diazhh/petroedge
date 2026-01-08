# VISIÓN Y PRINCIPIOS ARQUITECTÓNICOS

## 1. Visión del Sistema

### 1.1 Propósito

Desarrollar un sistema ERP+SCADA integral para la industria petrolera que permita:

- **Gestión completa del ciclo de vida del pozo** (exploración → producción → abandono)
- **Operación 100% autónoma en campo** sin dependencia de conectividad
- **Análisis técnico profesional** comparable a software como OFM, PROSPER, Petrel
- **Integración SCADA** para telemetría en tiempo real

### 1.2 Diferenciadores

| Aspecto | Competencia | Nuestro Sistema |
|---------|-------------|-----------------|
| **Despliegue** | Cloud-only o cliente pesado | Edge-first, Cloud opcional |
| **Conectividad** | Requiere internet | 100% offline |
| **Licenciamiento** | Por módulo, costoso | Todo incluido |
| **Integración** | Silos separados | ERP + SCADA unificado |
| **Personalización** | Limitada | Código abierto configurable |

---

## 2. Principios Arquitectónicos

### 2.1 Edge-First (Edge es el Producto)

```
El sistema EDGE es el producto que se vende.
El Cloud es un servicio adicional opcional.

EDGE:
  ├── Licencia perpetua o suscripción
  ├── Hardware industrial incluido (opcional)
  ├── Todos los módulos sin restricción
  ├── Funciona sin internet indefinidamente
  └── Actualizaciones vía USB o red local

CLOUD:
  ├── Suscripción mensual adicional
  ├── Para clientes que YA tienen Edge
  ├── Consolida datos de múltiples Edge
  └── No es standalone (requiere Edge)
```

### 2.2 Autonomía Total

- El Edge debe funcionar **meses o años** sin conexión a Cloud
- Todas las funcionalidades disponibles localmente
- Base de datos local con toda la información
- Sin "features degradados" por falta de conexión

### 2.3 Consistencia Eventual

- Los datos se sincronizan cuando hay conectividad
- Resolución de conflictos predefinida
- Prioridad a datos más recientes o según reglas de negocio
- Cola de sincronización persistente (store-and-forward)

### 2.4 Resiliencia

- Tolerancia a fallos de hardware (discos redundantes)
- Recuperación automática de servicios (K3s)
- Backups automáticos locales
- Watchdog para procesos críticos

### 2.5 Seguridad en Capas

```
┌─────────────────────────────────────────────────────────────┐
│                      CAPAS DE SEGURIDAD                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CAPA 1: RED                                                 │
│  ├── Firewall local (iptables/nftables)                     │
│  ├── VPN para acceso remoto                                  │
│  └── Segmentación de red OT/IT                              │
│                                                              │
│  CAPA 2: APLICACIÓN                                          │
│  ├── Autenticación JWT + Refresh Tokens                      │
│  ├── Autorización RBAC (Role-Based Access Control)           │
│  ├── Auditoría de acciones                                   │
│  └── Rate limiting                                           │
│                                                              │
│  CAPA 3: DATOS                                               │
│  ├── Encriptación en reposo (PostgreSQL TDE)                │
│  ├── Encriptación en tránsito (TLS 1.3)                     │
│  ├── Hashing de contraseñas (Argon2)                        │
│  └── Backups encriptados                                     │
│                                                              │
│  CAPA 4: FÍSICA                                              │
│  ├── Hardware industrial certificado                         │
│  ├── TPM para claves                                         │
│  └── Secure boot                                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Decisiones Arquitectónicas Clave

### 3.1 Monolito Modular vs Microservicios

**Decisión**: **Monolito Modular** para Edge, Microservicios para Cloud

**Justificación**:
- Edge tiene recursos limitados (RAM, CPU)
- Menos overhead de comunicación entre servicios
- Despliegue más simple
- Módulos pueden evolucionar independientemente

```
EDGE (Monolito Modular):
┌─────────────────────────────────────────┐
│              API Gateway                 │
├─────────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│  │Well │ │Drill│ │Prod │ │Inv  │ ...   │
│  │Test │ │ing  │ │uct  │ │ent  │       │
│  └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘       │
│     │       │       │       │           │
│  ┌──┴───────┴───────┴───────┴──┐       │
│  │        Core Services         │       │
│  │   (Auth, Audit, Config)      │       │
│  └──────────────┬───────────────┘       │
│                 │                        │
│  ┌──────────────┴───────────────┐       │
│  │         PostgreSQL            │       │
│  │      + TimescaleDB            │       │
│  └───────────────────────────────┘       │
└─────────────────────────────────────────┘
```

### 3.2 Lenguaje de Backend

**Decisión**: **Rust** (con fallback a Go)

**Justificación**:
- Rendimiento cercano a C/C++
- Bajo consumo de memoria (crítico para edge)
- Seguridad de memoria en tiempo de compilación
- Ecosistema creciente (Actix, Tokio)

### 3.3 Base de Datos

**Decisión**: **PostgreSQL + TimescaleDB** (todo en uno)

**Justificación**:
- PostgreSQL: Maduro, confiable, extensible
- TimescaleDB: Extensión nativa para time-series
- Sin necesidad de BD separada para telemetría
- PostGIS para datos geoespaciales

### 3.4 Frontend

**Decisión**: **React + TypeScript + TailwindCSS**

**Justificación**:
- Ecosistema más grande
- Componentes reutilizables (shadcn/ui)
- TypeScript para seguridad de tipos
- Visualizaciones con Recharts/D3.js

### 3.5 Contenedores

**Decisión**: **K3s** (Kubernetes ligero)

**Justificación**:
- Diseñado para edge/IoT
- Consume ~512MB RAM
- Compatible con Kubernetes estándar
- Actualizaciones y rollbacks automáticos

---

## 4. Requisitos de Hardware Edge

### 4.1 Especificaciones Mínimas

| Componente | Mínimo | Recomendado |
|------------|--------|-------------|
| **CPU** | 4 cores ARM64/x86 | 8 cores |
| **RAM** | 8 GB | 16 GB |
| **Almacenamiento** | 256 GB SSD | 512 GB NVMe |
| **Red** | 1 Gbps Ethernet | 2x 1 Gbps |
| **Temperatura** | 0°C a 50°C | -20°C a 60°C |
| **Alimentación** | 12-24V DC | Redundante |

### 4.2 Hardware Recomendado

| Opción | Modelo | Precio Aprox |
|--------|--------|--------------|
| **Industrial PC** | Advantech UNO-2484G | $1,500-2,500 |
| **Mini Server** | HPE ProLiant MicroServer | $800-1,200 |
| **Rugged Edge** | Dell Edge Gateway 5200 | $1,800-3,000 |
| **Custom** | Intel NUC Industrial | $600-1,000 |

---

## 5. Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FLUJO DE DATOS                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  CAMPO (OT)                    EDGE                        CLOUD         │
│  ─────────                     ────                        ─────         │
│                                                                          │
│  ┌─────────┐                                                             │
│  │  PLC    │──Modbus──┐                                                  │
│  └─────────┘          │                                                  │
│                       ▼                                                  │
│  ┌─────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐        │
│  │  RTU    │────│   SCADA   │────│  Backend  │────│   Cloud   │        │
│  └─────────┘    │  Gateway  │    │    API    │    │  (opt.)   │        │
│                 └───────────┘    └───────────┘    └───────────┘        │
│  ┌─────────┐          │               │                │               │
│  │ Sensor  │──MQTT────┘               │                │               │
│  └─────────┘                          ▼                ▼               │
│                                 ┌───────────┐    ┌───────────┐         │
│  ┌─────────┐                    │PostgreSQL │    │ PostgreSQL│         │
│  │  VFD    │──OPC-UA───────────▶│TimescaleDB│───▶│  (Cloud)  │         │
│  └─────────┘                    └───────────┘    └───────────┘         │
│                                       │                                 │
│                                       ▼                                 │
│                                 ┌───────────┐                           │
│                                 │  Frontend │                           │
│                                 │  (React)  │                           │
│                                 └───────────┘                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Próximos Pasos

1. Definir arquitectura detallada del Edge → `02_ARQUITECTURA_EDGE.md`
2. Definir arquitectura del Cloud → `03_ARQUITECTURA_CLOUD.md`
3. Diseñar modelo de datos unificado → `04_MODELO_DATOS.md`
4. Definir esquema de seguridad → `05_SEGURIDAD.md`
5. Documentar despliegue → `06_DESPLIEGUE.md`

