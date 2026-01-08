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

| # | Componente | Prioridad | Dependencias | Duración |
|---|------------|-----------|--------------|----------|
| 1.1 | Arquitectura Edge | CRÍTICA | Ninguna | 2 semanas |
| 1.2 | Base de Datos PostgreSQL + TimescaleDB | CRÍTICA | 1.1 | 2 semanas |
| 1.3 | Backend API (Rust/Go) | CRÍTICA | 1.2 | 4 semanas |
| 1.4 | Sistema de Autenticación | CRÍTICA | 1.3 | 2 semanas |
| 1.5 | Frontend Base (React) | CRÍTICA | 1.3 | 4 semanas |
| 1.6 | Protocolos SCADA (Modbus, MQTT) | ALTA | 1.3 | 2 semanas |

### FASE 2: Módulos Operacionales (Meses 4-9)

| # | Módulo | Prioridad | Dependencias | Duración |
|---|--------|-----------|--------------|----------|
| 2.1 | Yacimientos (Base de Datos Geológica) | ALTA | Fase 1 | 4 semanas |
| 2.2 | Well Testing (Pruebas de Pozo) | ALTA | 2.1 | 4 semanas |
| 2.3 | Well Management (Producción) | ALTA | 2.1 | 6 semanas |
| 2.4 | Drilling Operations | ALTA | 2.1 | 4 semanas |
| 2.5 | Coiled Tubing & Intervenciones | MEDIA | 2.3 | 3 semanas |
| 2.6 | Inventario y Almacén | MEDIA | Fase 1 | 3 semanas |
| 2.7 | Finanzas y Contabilidad | MEDIA | 2.6 | 4 semanas |
| 2.8 | RRHH y Nómina | BAJA | Fase 1 | 3 semanas |
| 2.9 | Mantenimiento de Equipos | MEDIA | 2.6 | 3 semanas |

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

