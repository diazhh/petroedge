# MASTER ROADMAP - ERP+SCADA PETROLERO

## Visión del Proyecto

Sistema ERP+SCADA integral para la industria petrolera, donde el **EDGE es el producto principal** (100% standalone) y el Cloud es un servicio opcional para consolidación multi-sitio.

---

## Filosofía de Desarrollo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PRIORIDAD DE DESARROLLO                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FASE 1: CORE EDGE          FASE 2: MÓDULOS           FASE 3: CLOUD         │
│  ───────────────────        ─────────────────         ───────────────        │
│  • Arquitectura Base        • Well Testing            • Sincronización       │
│  • Base de Datos            • Drilling                • Multi-tenant         │
│  • Backend API              • Well Management         • Analytics Corp       │
│  • Frontend Base            • Yacimientos             • Reportes Corp        │
│  • Autenticación            • Coiled Tubing           • Acceso Remoto        │
│                             • Inventario              • ML/AI                │
│                             • Finanzas                                       │
│                             • RRHH                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Orden de Implementación

### FASE 1: Infraestructura Core (Meses 1-3)

| # | Componente | Prioridad | Dependencias | Duración | Estado |
|---|------------|-----------|--------------|----------|--------|
| 1.1 | Arquitectura Edge | CRÍTICA | Ninguna | 2 semanas | ✅ |
| 1.2 | Base de Datos PostgreSQL + TimescaleDB | CRÍTICA | 1.1 | 2 semanas | 🟡 85% |
| 1.3 | Backend API (Node.js + Fastify) | CRÍTICA | 1.2 | 4 semanas | 🟡 85% |
| 1.4 | Sistema de Autenticación | CRÍTICA | 1.3 | 2 semanas | ✅ |
| 1.5 | Frontend Base (React) | CRÍTICA | 1.3 | 4 semanas | ✅ |
| 1.6 | Mensajería (Kafka) | ALTA | 1.3 | 2 semanas | 🟡 70% |
| 1.7 | Procesamiento Tiempo Real | ALTA | 1.6 | 2 semanas | ✅ |
| 1.8 | Infraestructura Assets (Custom) | CRÍTICA | 1.6, 1.7 | 3 semanas | ✅ |
| 1.9 | Motor de Reglas (Custom) | ALTA | 1.8 | 3 semanas | ✅ |
| 1.10 | Edge Gateway PLCs | ALTA | 1.6 | 2 semanas | ✅ |
| **1.11** | **Eclipse Ditto + Worker Service + Motor de Reglas Avanzado** 🆕 | **CRÍTICA** | 1.8, 1.9, 1.10 | 16-20 semanas | ⚪ |

#### 1.7 Procesamiento Tiempo Real
- **Redis**: Caché de estado actual y datos frecuentes
- **Calculation Engine**: Servicios que consumen Kafka, calculan y publican
- **WebSocket Gateway**: Broadcast de datos en tiempo real al frontend
- **Roadmap detallado**: `01_arquitectura/04_ARQUITECTURA_REALTIME.md`

#### 1.8 Infraestructura Digital Twins 🆕
- **Assets genéricos**: Pozos, campos, equipos, herramientas como entidades configurables
- **Atributos dinámicos**: Propiedades personalizables por usuario
- **Telemetrías**: Datos en tiempo real con TimescaleDB
- **Campos calculados**: Valores derivados de reglas
- **Roadmap detallado**: `01_arquitectura/06_ARQUITECTURA_MODULAR_DIGITAL_TWINS.md`

#### 1.9 Motor de Reglas Visual (Custom - Completado)
- **Editor visual**: Nodos conectables tipo Node-RED (React Flow)
- **Triggers**: Cambio de telemetría, atributos, schedule, eventos
- **Actions**: Actualizar campos, crear alarmas, notificar, llamar API
- **Roadmap detallado**: `01_arquitectura/06_ARQUITECTURA_MODULAR_DIGITAL_TWINS.md`

#### 1.11 Eclipse Ditto + Worker Service + Motor de Reglas Avanzado 🆕
- **Eclipse Ditto**: Framework Java/Scala para gestión de Digital Twins a escala (reemplaza implementación custom)
- **Worker Service**: Microservicio separado para Kafka consumers, Rule Engine, alarmas, WebSocket
- **Motor de Reglas Avanzado**: 60+ tipos de nodos inspirados en ThingsBoard/StreamPipes
- **Fases**: 
  - Fase 1 (4-6 sem): Worker Service, Ditto integration, Rule Engine refactor
  - Fase 2 (4-6 sem): 40+ nodos, Editor visual mejorado, DLQ, versioning
  - Fase 3 (4-6 sem): Dashboard framework, Widget library, Builder UI
  - Fase 4 (2-4 sem): Migración, Testing, Performance
- **Roadmap detallado**: `01_arquitectura/10_ECLIPSE_DITTO_RULE_ENGINE_ADVANCED.md`

#### ⚠️ Nota sobre Motor de Cálculos
El **Calculation Engine** usa Node.js (TypeScript) por defecto, suficiente para:
- Cálculos IPR, VLP, Nodal Analysis (~50-200ms)
- MSE, Torque & Drag, optimización ESP/Gas Lift
- 95% de los cálculos del sistema

**Si un cálculo se vuelve cuello de botella** (>2s o CPU-intensive):
1. Crear microservicio dedicado en **Rust** o **Python** (NumPy/SciPy)
2. Comunicación via HTTP/gRPC desde Node.js
3. Casos típicos: simulaciones de yacimiento, balance de materiales, ML/predicciones

```
Node.js (Calculation Engine)
    │
    ├── Cálculos simples → Ejecutar directamente
    │
    └── Cálculos complejos → Llamar a:
            ├── Rust service (alto rendimiento)
            └── Python service (NumPy/SciPy/ML)
```

### FASE 2: Módulos Operacionales (Meses 4-9)

> **Nota**: Todos los módulos operacionales ahora dependen del **Módulo Base de Infraestructura (1.8)** 
> que gestiona los activos como Gemelos Digitales.

| # | Módulo | Prioridad | Dependencias | Duración | Estado |
|---|--------|-----------|--------------|----------|--------|
| 2.1 | Yacimientos (Base Geológica) | ALTA | 1.8 | 4 semanas | ✅ (migrar a Assets) |
| 2.2 | Well Testing (Pruebas de Pozo) | ALTA | 1.8 | 4 semanas | ✅ (migrar a Assets) |
| 2.3 | Well Management (Producción) | ALTA | 1.8 | 6 semanas | ⚪ |
| 2.4 | Drilling Operations | ALTA | 1.8 | 4 semanas | 🟡 72% |
| 2.5 | Coiled Tubing & Intervenciones | MEDIA | 1.8 | 3 semanas | ⚪ |
| 2.6 | Inventario y Almacén | MEDIA | 1.8 | 3 semanas | ⚪ |
| 2.7 | Finanzas y Contabilidad | MEDIA | 2.6 | 4 semanas | ⚪ |
| 2.8 | RRHH y Nómina | BAJA | 1.8 | 3 semanas | ⚪ |
| 2.9 | Mantenimiento de Equipos | MEDIA | 1.8 | 3 semanas | ⚪ |

#### Migración a Digital Twins
Los módulos 2.1 (Yacimientos) y 2.2 (Well Testing) ya están completados con el modelo de datos actual.
Una vez implementado el módulo 1.8 (Infraestructura Digital Twins), estos módulos deberán migrar sus
entidades (wells, fields, basins, reservoirs) al nuevo modelo de Assets genéricos, manteniendo
compatibilidad hacia atrás.

### FASE 3: Cloud y Avanzado (Meses 10-12)

| # | Componente | Prioridad | Dependencias | Duración |
|---|------------|-----------|--------------|----------|
| 3.1 | Sincronización Edge-Cloud | MEDIA | Fase 2 | 4 semanas |
| 3.2 | Multi-Tenant Cloud | MEDIA | 3.1 | 3 semanas |
| 3.3 | Reportes Corporativos | MEDIA | 3.2 | 2 semanas |
| 3.4 | Analytics y ML | BAJA | 3.2 | 4 semanas |
| 3.5 | App Móvil | BAJA | 3.1 | 4 semanas |

---

## Estructura de Carpetas del Proyecto

```
scadaerp/
├── roadmap/                          # Roadmaps de planificación
│   ├── 00_MASTER_ROADMAP.md         # Este archivo
│   ├── 01_arquitectura/             # Roadmap de arquitectura
│   ├── 02_modulo_well_testing/      # Roadmap Well Testing
│   ├── 03_modulo_drilling/          # Roadmap Drilling
│   ├── 04_modulo_coiled_tubing/     # Roadmap Coiled Tubing
│   ├── 05_modulo_well_management/   # Roadmap Producción
│   ├── 06_modulo_yacimientos/       # Roadmap Yacimientos
│   ├── 07_backend/                  # Roadmap Backend
│   ├── 08_frontend/                 # Roadmap Frontend
│   ├── 09_modulos_erp/              # Roadmap ERP (Inventario, Finanzas, RRHH)
│   └── 10_cloud/                    # Roadmap Cloud (última prioridad)
│
├── docs/                             # Documentación técnica existente
├── src/                              # Código fuente
│   ├── backend/
│   ├── frontend/
│   └── edge/
└── ...
```

---

## Módulos del Sistema

### Módulos Técnicos (Core Petrolero)

| Módulo | Descripción | Software Comparable |
|--------|-------------|---------------------|
| **Yacimientos** | BD geológica, PVT, Balance Materiales, DCA, Reservas | OFM, MBAL, Petrel |
| **Well Testing** | IPR/VLP, Pruebas de Presión, PVT de Campo | Saphir, PanSystem |
| **Drilling** | Planificación, T&D, MSE, Well Control, Real-time | Landmark, Drilling Office |
| **Well Management** | ESP, Gas Lift, Rod Pump, PCP, Optimización | PROSPER, WellFlo |
| **Coiled Tubing** | Fatiga, Buckling, Job Tickets | CTES, CT Pro |

### Módulos ERP (Gestión Empresarial)

| Módulo | Descripción |
|--------|-------------|
| **Inventario** | Control de stock, almacenes, materiales petroleros |
| **Compras** | Órdenes de compra, proveedores, licitaciones |
| **Finanzas** | Contabilidad, facturación, costos por pozo |
| **RRHH** | Personal, nómina, guardias, certificaciones |
| **Mantenimiento** | CMMS, órdenes de trabajo, preventivo/correctivo |
| **HSE** | Seguridad, incidentes, permisos de trabajo |

### Módulos de Infraestructura

| Módulo | Descripción |
|--------|-------------|
| **Backend** | APIs REST/GraphQL, WebSockets, Autenticación |
| **Frontend** | React, Dashboards, Visualizaciones |
| **SCADA** | Modbus, MQTT, OPC-UA, Alarmas |
| **TimeSeries** | TimescaleDB, telemetría, históricos |
| **Cloud** | Sincronización, Multi-tenant, Analytics |

---

## Criterios de Completitud por Módulo

Cada módulo debe cumplir:

### Documentación (Roadmap)
- [ ] Visión y objetivos del módulo
- [ ] Funcionalidades detalladas
- [ ] Modelo de datos (esquemas SQL)
- [ ] APIs y endpoints
- [ ] Diseño visual (wireframes/mockups)
- [ ] Integraciones con otros módulos
- [ ] Casos de uso
- [ ] Métricas de éxito

### Implementación
- [ ] Backend: APIs implementadas
- [ ] Frontend: UI implementada
- [ ] Tests: Unitarios y de integración
- [ ] Documentación: API docs
- [ ] Despliegue: Docker/K3s

---

## Próximos Pasos

1. **Crear roadmap detallado de Arquitectura** → `01_arquitectura/`
2. **Crear roadmap de cada módulo técnico** → `02-06_modulo_*/`
3. **Crear roadmap de Backend/Frontend** → `07-08_*/`
4. **Crear roadmap de módulos ERP** → `09_modulos_erp/`
5. **Crear roadmap de Cloud** → `10_cloud/` (última prioridad)

---

## Control de Versiones

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 0.1 | 2026-01-08 | Creación inicial del Master Roadmap |
| 0.2 | 2026-01-09 | **Rediseño arquitectónico**: Añadidos módulos 1.8 (Digital Twins) y 1.9 (Motor de Reglas Visual) |
| 0.2 | 2026-01-09 | Actualizada Fase 2 para depender del módulo de Infraestructura base |
| 0.2 | 2026-01-09 | Documentado roadmap detallado en `06_ARQUITECTURA_MODULAR_DIGITAL_TWINS.md` |

