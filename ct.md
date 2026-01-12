# MÓDULO COILED TUBING - DOCUMENTACIÓN TÉCNICA COMPLETA

> **Versión**: 2.0  
> **Última actualización**: 2026-01-12  
> **Estado**: En desarrollo

---

## 1. VISIÓN Y OBJETIVO DEL MÓDULO

### 1.1 Propósito

El módulo de **Coiled Tubing (CT)** proporciona un sistema integral para gestionar el ciclo completo de operaciones de intervención de pozos con tubería continua, desde la planificación hasta la documentación final, incluyendo:

- **Gestión de Flota**: Unidades CT, carretes (reels), herramientas BHA
- **Tracking de Fatiga**: Monitoreo de vida útil del tubing por secciones
- **Planificación de Jobs**: Diseño de trabajos con simulación pre-operacional
- **Monitoreo en Tiempo Real**: Dashboard operativo con telemetría SCADA
- **Análisis de Ingeniería**: Cálculos de buckling, hidráulica, fuerzas
- **Documentación**: Job tickets, reportes, KPIs

### 1.2 Software Comparable

| Software | Fabricante | Características Principales |
|----------|------------|----------------------------|
| **CIRCA Suite** | Baker Hughes | Fatiga, hidráulica, transporte de sólidos |
| **Cerberus** | NOV-CTES | Análisis de fuerzas, buckling, tiempo real |
| **CoilCADE/CoilCAT** | Schlumberger | Simulación completa, inspección MFL |
| **SMART-LINK** | Weatherford | Telemetría, modular, compatible |

### 1.3 Usuarios del Módulo

| Rol | Responsabilidades |
|-----|-------------------|
| **CT Supervisor** | Planificación, asignación de recursos, aprobaciones |
| **CT Engineer** | Diseño de BHA, simulaciones, análisis de fatiga |
| **CT Operator** | Ejecución de jobs, monitoreo en tiempo real |
| **Reel Manager** | Inventario de carretes, programación de cortes |
| **HSE Coordinator** | Permisos, análisis de riesgos, seguridad |

---

## 2. INTEGRACIÓN CON LA PLATAFORMA PETROEDGE

### 2.1 Arquitectura de 3 Capas

El módulo CT se integra con la infraestructura existente de PetroEdge:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CAPA 1: INFRAESTRUCTURA (YA EXISTE) ✅                                      │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Digital Twins Framework (Assets genéricos)                               │
│  • Motor de Reglas Visual                                                   │
│  • Telemetría + TimescaleDB                                                 │
│  • Kafka + Redis + WebSocket                                                │
│  • Sistema de Unidades y Magnitudes                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                        ▲
                        │ (usa)
┌─────────────────────────────────────────────────────────────────────────────┐
│  CAPA 2: MÓDULO COILED TUBING (IMPLEMENTAR) ❌                               │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Entidades específicas: Reels, CT Units, Jobs, Job Tickets                │
│  • Digital Twins: CT Unit, Reel, BHA Components                             │
│  • Servicios de cálculo: Fatiga, Buckling, Hidráulica                       │
│  • APIs REST especializadas                                                 │
│  • Reglas pre-configuradas: Alarmas, validaciones                           │
└─────────────────────────────────────────────────────────────────────────────┘
                        ▲
                        │ (usa)
┌─────────────────────────────────────────────────────────────────────────────┐
│  CAPA 3: INTERFACES DE USUARIO (IMPLEMENTAR) ❌                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Wizard: "Crear Job de CT"                                                │
│  • Dashboard: Monitoreo en tiempo real                                      │
│  • Gestión: Reels, Unidades, Inventario BHA                                 │
│  • Reportes: Job Tickets PDF, KPIs                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Integración con Digital Twins

Cada equipo de CT se registra como **Asset** (Digital Twin) en la plataforma:

| Equipo | Asset Type | Telemetrías | Atributos |
|--------|------------|-------------|-----------|
| **CT Unit** | `ct_unit` | Presiones, velocidad, peso | Capacidades, certificaciones |
| **Reel** | `ct_reel` | Fatiga en tiempo real | Longitud, grado, especificaciones |
| **Injector** | `ct_injector` | Velocidad, tracción | Capacidad, estado |
| **BOP Stack** | `ct_bop` | Presiones, estados | Configuración, pruebas |
| **Pump Unit** | `ct_pump` | Presión, rate, SPM | HP, capacidad |

### 2.3 Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUJO DE TELEMETRÍA CT                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Sensores CT    ──▶   Edge Gateway   ──▶   Kafka   ──▶   Servicios          │
│  (Modbus/OPC)        (Procesamiento)      (Topics)      (Backend)           │
│                                                                              │
│  • Encoder profundidad                    ct.telemetry   ──▶ TimescaleDB    │
│  • Celdas de carga                        ct.alarms      ──▶ Alarmas        │
│  • Transductores presión                  ct.fatigue     ──▶ Cálculo Fatiga │
│  • Medidores de flujo                     ct.events      ──▶ Event Store    │
│                                                                              │
│                                           ▼                                  │
│                                      WebSocket ──▶ Dashboard RT             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. TIPOS DE OPERACIONES CT

### 3.1 Operaciones Primarias (Alta Frecuencia)

#### 3.1.1 Limpieza (Cleanout)

Operación más común: remoción de arena, escala, parafina, propante post-fractura.

| Parámetro | Rango Típico | Función |
|-----------|--------------|---------|
| Tasa de bombeo | 0.5-4 bbl/min | Transporte de sólidos |
| Velocidad RIH | 50 ft/min | Control de presión |
| Velocidad anular vertical | 50-100 ft/min | Transporte efectivo |
| Velocidad anular horizontal | 100-200 ft/min | Evitar acumulación |
| Número de Reynolds | >4,000 | Flujo turbulento requerido |

**BHA Estándar**: Conector CT → Check Valve → Jars → Circulating Sub → Vibration Tool → Jetting Nozzle

#### 3.1.2 Nitrogen Lift

Descarga de pozos cargados de fluido o kickoff de pozos nuevos.

| Parámetro | Rango Típico |
|-----------|--------------|
| Tasa N₂ | 100-250 SCFM |
| Profundidad inyección | Optimizada por cálculo |
| Presión de superficie | Variable según gradiente |

#### 3.1.3 Estimulación Ácida

| Tipo | Ácido | Concentración | Volumen |
|------|-------|---------------|---------|
| Carbonatos | HCl | 15-28% | 50-200 gal/ft |
| Areniscas | HF + HCl | 1-5% + 3-15% | Variable |

**Objetivo**: Reducción de skin de -2 a -4, mejora de productividad >150%

### 3.2 Operaciones Mecánicas

#### 3.2.1 Fresado (Milling)

| Parámetro | Rango |
|-----------|-------|
| WOB | 1,000-5,000 lbs |
| RPM (PDM) | 80-400 |
| RPM (Turbodrill) | 600-4,000 |
| ΔP motor | 70-85% del stall |
| Tasa circulación | 1.5-4 bbl/min |

#### 3.2.2 Fishing

Recuperación de herramientas, debris, objetos caídos.

**Fuerza de Jar**: 6-7× la tensión aplicada

#### 3.2.3 Perforación CT (CTD)

| Parámetro | Especificación |
|-----------|----------------|
| Tamaño de hueco | 3½" - 4¾" |
| Profundidad práctica | 5,000-10,000 ft |
| Aplicaciones | Re-entries, sidetracks, underbalanced |

### 3.3 Operaciones de Diagnóstico

| Operación | Velocidad | Aplicación |
|-----------|-----------|------------|
| **Logging** | 30-60 ft/min | Evaluación de producción |
| **Survey** | Variable | Trayectoria, correlación |
| **Inspección** | 30-60 ft/min | Estado de casing/tubing |

---

## 4. ENTIDADES DEL MÓDULO

### 4.1 Diagrama de Entidades

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MODELO DE ENTIDADES - COILED TUBING                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐    1:N    ┌─────────────┐    N:1    ┌─────────────┐        │
│  │  ct_units   │◀─────────▶│  ct_reels   │──────────▶│   assets    │        │
│  │  (Unidades) │           │  (Carretes) │           │(Digital Twin)│        │
│  └──────┬──────┘           └──────┬──────┘           └─────────────┘        │
│         │                         │                                          │
│         │ 1:N                     │ 1:N                                      │
│         ▼                         ▼                                          │
│  ┌─────────────┐           ┌─────────────┐                                  │
│  │  ct_jobs    │◀──────────│reel_sections│                                  │
│  │  (Trabajos) │           │ (Secciones) │                                  │
│  └──────┬──────┘           └──────┬──────┘                                  │
│         │                         │                                          │
│    ┌────┼────┬────────┐          │ 1:N                                      │
│    │    │    │        │          ▼                                          │
│    ▼    ▼    ▼        ▼    ┌─────────────┐                                  │
│  ┌───┐┌───┐┌───┐  ┌─────┐ │fatigue_cycles│                                  │
│  │ops││flu││bha│  │ticket│ │  (Ciclos)   │                                  │
│  └───┘└───┘└───┘  └─────┘ └─────────────┘                                  │
│                                                                              │
│  ┌─────────────┐           ┌─────────────┐                                  │
│  │realtime_data│           │  ct_alarms  │                                  │
│  │(TimescaleDB)│           │  (Alarmas)  │                                  │
│  └─────────────┘           └─────────────┘                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Entidad: CT Unit (Unidad de Coiled Tubing)

Representa una unidad completa de CT con todos sus componentes.

**Componentes físicos**:
- **Carrete CT**: Almacena 10,000-20,000 ft de tubing
- **Cabeza Inyectora**: 40K, 60K, 80K o 100K lbs capacidad
- **Gooseneck**: Control de radio de curvatura
- **Power Pack**: Motores diesel + bombas hidráulicas
- **Cabina de Control**: Instrumentación y adquisición
- **BOP Stack**: Rams ciegos, corte, tubería, slip, stripper
- **Bombas**: Simple/doble para desplazamiento
- **Unidades N₂**: Para operaciones bajo-balance

**Atributos principales**:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `unit_number` | VARCHAR | Identificador único |
| `manufacturer` | VARCHAR | Fabricante |
| `model` | VARCHAR | Modelo |
| `injector_capacity_lbs` | INTEGER | Capacidad del inyector |
| `max_speed_ft_min` | INTEGER | Velocidad máxima |
| `pump_hp` | INTEGER | Potencia de bomba |
| `max_pressure_psi` | INTEGER | Presión máxima |
| `status` | ENUM | AVAILABLE, IN_SERVICE, MAINTENANCE |

### 4.3 Entidad: CT Reel (Carrete)

Almacena la tubería continua con tracking de fatiga por secciones.

**Especificaciones de tubing**:

| Diámetro (OD) | Grados Disponibles | Aplicación |
|---------------|-------------------|------------|
| 1.25" | CT70, CT80 | Pozos poco profundos |
| 1.50" | CT70, CT80, CT90 | Uso general |
| 1.75" | CT80, CT90, CT100 | Trabajos pesados |
| 2.00" | CT90, CT100, CT110 | Alta capacidad |
| 2.375" | CT100, CT110 | Perforación CTD |

**Grados de acero** (Yield Strength):
- CT70: 70,000 psi
- CT80: 80,000 psi
- CT90: 90,000 psi
- CT100: 100,000 psi
- CT110: 110,000 psi

### 4.4 Entidad: CT Job (Trabajo)

Representa una intervención de CT con toda su planificación y ejecución.

**Estados del Job**:

```
DRAFT → PLANNED → APPROVED → IN_PROGRESS → COMPLETED
                      ↓            ↓
                  CANCELLED    SUSPENDED
```

**Tipos de Job**:

| Código | Tipo | Descripción |
|--------|------|-------------|
| `CLN` | Cleanout | Limpieza de pozo |
| `N2L` | Nitrogen Lift | Inducción con nitrógeno |
| `ACT` | Acid Treatment | Estimulación ácida |
| `CMS` | Cement Squeeze | Reparación de cemento |
| `FSH` | Fishing | Recuperación |
| `LOG` | Logging | Corrida de registros |
| `PER` | Perforation | Cañoneo con CT |
| `MIL` | Milling | Fresado |
| `CTD` | CT Drilling | Perforación con CT |

### 4.5 Entidad: Job Ticket

Documentación oficial del trabajo completado con firmas digitales.

**Secciones del Job Ticket**:

1. **Información General**: Job #, fecha, cliente, pozo, campo
2. **Equipo Utilizado**: Unidad, reel, especificaciones CT, BHA
3. **Resumen de Operaciones**: Cronología hora por hora
4. **Fluidos Bombeados**: Tipo, volumen, rates, presiones
5. **Profundidades**: Tag depth, max depth, surface
6. **Resultados**: Objetivos cumplidos, NPT, observaciones
7. **Firmas**: Operador, supervisor, cliente

---

## 5. FLUJO DE TRABAJO OPERATIVO

### 5.1 Ciclo de Vida de un Job CT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FLUJO DE TRABAJO - JOB DE CT                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ SOLICITUD │───▶│PLANIFICACIÓN│───▶│ APROBACIÓN│───▶│MOVILIZACIÓN│          │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│       │               │               │               │                      │
│  • Requerimiento  • Selección     • Revisión HSE  • Despacho equipo        │
│  • Datos pozo       equipo        • Permisos      • Transporte             │
│  • Objetivo       • Diseño BHA    • Sign-off      • Personal               │
│                   • Simulación                                               │
│                   • Fluidos                                                  │
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  RIG UP  │───▶│ EJECUCIÓN │───▶│ RIG DOWN │───▶│  CIERRE   │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│       │               │               │               │                      │
│  • Conexiones     • RIH/POOH     • Desconexión   • Job Ticket              │
│  • Pruebas BOP    • Circulación  • Desmontaje    • Facturación             │
│  • Calibración    • Operación    • Inventario    • Lecciones               │
│                   • Monitoreo RT                   aprendidas               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Fases Detalladas

#### Fase 1-2: Solicitud y Planificación

**Datos de entrada requeridos**:
- Datos del pozo (trayectoria, completación, historial)
- Objetivo de la intervención
- Restricciones operacionales
- Presupuesto disponible

**Actividades de planificación**:
1. Análisis de factibilidad
2. Selección de unidad y reel
3. Diseño de BHA
4. Programa de fluidos
5. Simulación de fuerzas (predicción lockup)
6. Análisis de riesgos (JSA)

#### Fase 3-4: Aprobación y Movilización

**Documentación requerida**:
- Programa de trabajo aprobado
- JSA (Job Safety Analysis)
- Permisos de trabajo
- Certificaciones de equipo vigentes
- Check-list de movilización

#### Fase 5-6: Rig Up y Pruebas

**Pruebas de BOP** (según API RP 16ST):
- Prueba baja presión: 250-350 psig × 5 min (cada 7 días)
- Prueba alta presión: MASP + 500 psig × 10 min (cada 7 días)

**Calibración de sensores**:
- Encoder de profundidad
- Celdas de carga
- Transductores de presión

#### Fase 7: Ejecución con Monitoreo RT

**Parámetros monitoreados**:

| Parámetro | Unidad | Frecuencia | Alarma |
|-----------|--------|------------|--------|
| Profundidad | ft | 10 Hz | Límite alcanzado |
| Peso indicador | lbs | 10 Hz | Overpull/Slackoff |
| Velocidad | ft/min | 10 Hz | Exceso velocidad |
| Presión bomba | psi | 10 Hz | Alta presión |
| Presión WHP | psi | 10 Hz | MAASP excedido |
| Presión anular | psi | 5 Hz | Leak detectado |
| Rate de bombeo | bpm | 5 Hz | Fuera de rango |
| Fatiga | % | Por ciclo | >85% crítico |

#### Fase 8-9: Rig Down y Cierre

**Entregables**:
- Job Ticket firmado (24-72 hrs)
- Datos de telemetría archivados
- Actualización de fatiga del reel
- Reporte de lecciones aprendidas

---

## 6. INTERFACES DE USUARIO

### 6.1 Estructura de Navegación

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MÓDULO COILED TUBING - NAVEGACIÓN                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  /coiled-tubing                                                              │
│  │                                                                           │
│  ├── /dashboard              ← Vista general, jobs activos, alertas         │
│  │                                                                           │
│  ├── /units                  ← Lista de unidades CT                         │
│  │   ├── /:id                ← Detalle de unidad (tabs)                     │
│  │   └── /new                ← Crear unidad                                 │
│  │                                                                           │
│  ├── /reels                  ← Lista de carretes                            │
│  │   ├── /:id                ← Detalle con mapa de fatiga                   │
│  │   ├── /:id/fatigue        ← Análisis de fatiga detallado                 │
│  │   └── /new                ← Crear carrete                                │
│  │                                                                           │
│  ├── /jobs                   ← Lista de trabajos                            │
│  │   ├── /new                ← Wizard crear job (4 pasos)                   │
│  │   ├── /:id                ← Detalle del job (tabs)                       │
│  │   ├── /:id/realtime       ← Dashboard tiempo real                        │
│  │   └── /:id/ticket         ← Job ticket                                   │
│  │                                                                           │
│  ├── /bha                    ← Inventario de herramientas BHA               │
│  │                                                                           │
│  └── /reports                ← Reportes y KPIs                              │
│      ├── /fatigue            ← Reporte de fatiga de flota                   │
│      ├── /performance        ← KPIs operacionales                           │
│      └── /history            ← Historial de jobs                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Dashboard Principal

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  COILED TUBING - DASHBOARD                                        🔔 ⚙️ 👤  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─ Resumen ─────────────────────────────────────────────────────────────┐  │
│  │  Unidades: 5 (3 activas, 1 mant., 1 disponible)                       │  │
│  │  Reels: 12 (2 críticos, 3 warning)                                    │  │
│  │  Jobs Hoy: 3 en progreso, 2 programados                               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─ Jobs Activos ────────────────────────────────────────────────────────┐  │
│  │                                                                        │  │
│  │  🟢 CT-2026-042 | PDC-15 | Cleanout | 8,542 ft | En Pozo              │  │
│  │  🟢 CT-2026-043 | VEN-08 | N2 Lift  | 6,200 ft | En Pozo              │  │
│  │  🟡 CT-2026-044 | PET-23 | Milling  | 0 ft     | Rig Up               │  │
│  │                                                           [Ver Todos]  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─ Alertas de Fatiga ───────────────┐  ┌─ Próximas Inspecciones ────────┐ │
│  │                                    │  │                                │ │
│  │  🔴 R-2024-008 | 87% fatiga       │  │  Unit-03 | BOP | En 3 días     │ │
│  │  🟠 R-2024-012 | 78% fatiga       │  │  R-2024-015 | Reel | En 7 días │ │
│  │  🟡 R-2024-003 | 72% fatiga       │  │                                │ │
│  │                         [Ver Más]  │  │                     [Ver Más]  │ │
│  └────────────────────────────────────┘  └────────────────────────────────┘ │
│                                                                              │
│  ┌─ KPIs del Mes ────────────────────────────────────────────────────────┐  │
│  │                                                                        │  │
│  │  Jobs Completados: 28    Éxito: 96%    NPT: 2.3%    Utilización: 78%  │  │
│  │  ████████████████████░   ████████████   ██░░░░░░░    ████████████░░   │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Dashboard de Monitoreo en Tiempo Real

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CT-2026-042 | PDC-15 | Cleanout                         🟢 EN POZO    🔴 ⏹ │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─ Profundidad ──────────┐  ┌─ Peso ─────────────────┐  ┌─ Velocidad ───┐  │
│  │                        │  │                         │  │               │  │
│  │     8,542 ft           │  │    -1,250 lbs           │  │  45 ft/min ▼  │  │
│  │     ████████████░░░    │  │    ████░░░░░░░░░░       │  │  █████░░░░░   │  │
│  │     Target: 10,000 ft  │  │    Límite: ±4,000 lbs   │  │  Max: 100     │  │
│  │                        │  │                         │  │               │  │
│  └────────────────────────┘  └─────────────────────────┘  └───────────────┘  │
│                                                                              │
│  ┌─ Presiones ───────────────────────────────────────────────────────────┐  │
│  │                                                                        │  │
│  │  Bomba: 2,850 psi     │  WHP: 450 psi        │  Anular: 125 psi       │  │
│  │  ████████░░░░░░░      │  ███░░░░░░░░░        │  █░░░░░░░░░░           │  │
│  │  Max: 5,000 psi       │  MAASP: 1,500 psi    │  Límite: 500 psi       │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─ Gráfico Peso vs Profundidad (Broomstick) ────────────────────────────┐  │
│  │                                                                        │  │
│  │  Peso (lbs)          ─── Modelo    ●●● Medido                         │  │
│  │    6000 │                                                              │  │
│  │         │────────────────────── Pickup                                │  │
│  │       0 │        ●●●●●●●●●●●●●●●●●●                                   │  │
│  │         │────────────────────── String Weight                         │  │
│  │   -4000 │                                                              │  │
│  │         │──────────────────────── Slackoff                            │  │
│  │   -6000 │                    ⚠️ Lockup @ 12,500 ft                     │  │
│  │         └─────────────────────────────────────────▶ Depth (ft)        │  │
│  │              2000    4000    6000    8000   10000  12000              │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─ Alarmas Activas ─────────────────────────────────────────────────────┐  │
│  │  ✅ Peso OK    ✅ Presión OK    ⚠️ Fatiga 78%    ✅ Velocidad OK       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─ Log de Operaciones ──────────────────────────────────────────────────┐  │
│  │  10:45:32  RIH  8,542 ft  -1,250 lbs  2,850 psi  Circulando          │  │
│  │  10:30:15  RIH  8,000 ft  -1,100 lbs  2,700 psi  Normal              │  │
│  │  10:15:00  TAG  8,542 ft  -2,500 lbs  2,900 psi  Arena detectada     │  │
│  │                                                          [Ver Todo]   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.4 Wizard: Crear Job de CT

**Paso 1/4: Información General**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CREAR JOB DE CT                                            Paso 1 de 4     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─ Información del Pozo ────────────────────────────────────────────────┐  │
│  │                                                                        │  │
│  │  Campo:        [Punta de Mata        ▼]                               │  │
│  │  Pozo:         [PDC-15               ▼]                               │  │
│  │  Cliente:      [PDVSA                ▼]                               │  │
│  │  Representante:[________________________]                              │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─ Tipo de Trabajo ─────────────────────────────────────────────────────┐  │
│  │                                                                        │  │
│  │  ○ Cleanout (Limpieza)                                                │  │
│  │  ○ Nitrogen Lift                                                      │  │
│  │  ○ Acid Treatment                                                     │  │
│  │  ○ Milling (Fresado)                                                  │  │
│  │  ○ Fishing                                                            │  │
│  │  ○ Otro: [____________________]                                       │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─ Objetivo ────────────────────────────────────────────────────────────┐  │
│  │  [Limpiar arena acumulada desde 8,500 ft hasta TD 10,000 ft          ]│  │
│  │  [___________________________________________________________________ ]│  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│                                              [Cancelar]  [Siguiente ▶]      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Paso 2/4: Selección de Equipo**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CREAR JOB DE CT                                            Paso 2 de 4     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─ Unidad CT ───────────────────────────────────────────────────────────┐  │
│  │                                                                        │  │
│  │  ● CT-Unit-05 | NOV C-Series | 60K Injector | 🟢 Disponible          │  │
│  │  ○ CT-Unit-03 | Stewart | 80K Injector | 🟢 Disponible                │  │
│  │  ○ CT-Unit-07 | Baker | 60K Injector | 🟡 En Servicio                 │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─ Carrete (Reel) ──────────────────────────────────────────────────────┐  │
│  │                                                                        │  │
│  │  ● R-2024-012 | 1.75" CT90 | 18,500 ft | Fatiga: 42% 🟢              │  │
│  │  ○ R-2024-008 | 1.75" CT90 | 16,200 ft | Fatiga: 87% 🔴              │  │
│  │  ○ R-2024-015 | 1.50" CT80 | 20,000 ft | Fatiga: 28% 🟢              │  │
│  │                                                                        │  │
│  │  ⚠️ R-2024-008 tiene fatiga crítica. Se recomienda corte.             │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─ Personal Asignado ───────────────────────────────────────────────────┐  │
│  │                                                                        │  │
│  │  Supervisor:    [Juan Pérez           ▼]                              │  │
│  │  Operador CT:   [Carlos Rodríguez     ▼]                              │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│                                    [◀ Anterior]  [Cancelar]  [Siguiente ▶]  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.5 Mapa de Fatiga del Reel

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  REEL R-2024-012 | 1.75" CT90 | MAPA DE FATIGA                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Longitud Total: 18,500 ft    │  Fatiga Máxima: 78%    │  Estado: 🟠 Warning│
│                                                                              │
│  ┌─ Mapa de Fatiga por Sección ──────────────────────────────────────────┐  │
│  │                                                                        │  │
│  │  Distancia desde extremo (ft):                                        │  │
│  │  0       2000    4000    6000    8000    10000   12000   14000  16000 │  │
│  │  │        │       │       │       │        │       │       │      │   │  │
│  │  ▼        ▼       ▼       ▼       ▼        ▼       ▼       ▼      ▼   │  │
│  │  ┌────────┬───────┬───────┬───────┬────────┬───────┬───────┬──────┐  │  │
│  │  │  78%   │  65%  │  52%  │  41%  │  32%   │  24%  │  15%  │  8%  │  │  │
│  │  │████████│██████░│█████░░│████░░░│███░░░░░│██░░░░░│█░░░░░░│░░░░░░│  │  │
│  │  │ 🔴     │ 🟠    │ 🟡    │ 🟢    │ 🟢     │ 🟢    │ 🟢    │ 🟢   │  │  │
│  │  └────────┴───────┴───────┴───────┴────────┴───────┴───────┴──────┘  │  │
│  │                                                                        │  │
│  │  Leyenda:  █ Fatiga consumida   ░ Vida restante                       │  │
│  │  🔴 >80%  🟠 60-80%  🟡 40-60%  🟢 <40%                                │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ⚠️ RECOMENDACIÓN: Cortar 2,000 ft del extremo para remover sección al 78% │
│                                                                              │
│  ┌─ Historial de Sección 1 (0-2000 ft) ──────────────────────────────────┐  │
│  │                                                                        │  │
│  │  Ciclos de flexión: 1,245      │  Ciclos de presión: 487              │  │
│  │  Jobs realizados: 23           │  Pies totales: 156,000 ft            │  │
│  │  Último job: CT-2026-041       │  Fecha: 2026-01-10                   │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│                                            [Programar Corte]  [Ver Historial]│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. MODELO DE FATIGA

### 7.1 Concepto de Fatiga en CT

La tubería de CT sufre fatiga acumulativa cada vez que:
1. **Pasa por una guía** (tubing guide, gooseneck, injector) → Ciclo de flexión
2. **Se presuriza/despresuriza** → Ciclo de presión

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CICLO DE FATIGA POR FLEXIÓN                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Posición recta     →    Flexión en guía    →    Posición recta             │
│                                                                              │
│       ─────                  ╭─────╮                  ─────                  │
│                              │     │                                         │
│                              ╰─────╯                                         │
│                                                                              │
│     0% strain     →      ε_max        →      0% strain                      │
│                                                                              │
│  Cada viaje RIH + POOH genera ~6 ciclos de flexión-enderezamiento           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Regla de Miner (Daño Acumulado)

```
Daño_total = Σ (nᵢ / Nᵢ) × k

Donde:
  nᵢ = Ciclos aplicados en condición i
  Nᵢ = Ciclos hasta falla en condición i (de curva S-N)
  k  = Factor de seguridad (típico 0.7-0.8)

CRITERIO: Daño_total < 1.0 (falla esperada cuando ≥ 1.0)
```

### 7.3 Fatiga por Flexión (Bending)

**Strain máximo**:
```
ε = OD / (2 × R_guía)

Donde:
  OD = Diámetro exterior del CT (pulgadas)
  R_guía = Radio de la guía (pulgadas)
```

**Ciclos hasta falla** (modelo simplificado basado en curvas S-N):
```
N_f = 10^(a - b × ε)

Parámetros típicos según grado:
  CT70: a = 4.2, b = 95
  CT90: a = 4.5, b = 100
  CT110: a = 4.8, b = 105
```

### 7.4 Fatiga por Presión

La presurización interna causa esfuerzo circunferencial (hoop stress):

```
Δσ_hoop = P × (ID² + OD²) / (OD² - ID²)

Donde:
  P = Presión interna (psi)
  ID = Diámetro interior
  OD = Diámetro exterior
```

**Efecto de presión en vida de fatiga**:
- A >4,000 psi: Vida de fatiga disminuye **30-50%**
- El efecto es no lineal y acelera el daño

### 7.5 Fatiga Combinada

```
Daño_combinado = Daño_flexión + Daño_presión × Factor_interacción

Factor_interacción = 1.0 + 0.3 × (P / P_burst)
```

### 7.6 Secciones de Tracking

El reel se divide en secciones (típicamente cada 500-1000 ft) para tracking granular:

| Sección | Desde (ft) | Hasta (ft) | Fatiga (%) | Estado |
|---------|------------|------------|------------|--------|
| 1 | 0 | 2,000 | 78% | 🔴 Crítico |
| 2 | 2,000 | 4,000 | 65% | 🟠 Warning |
| 3 | 4,000 | 6,000 | 52% | 🟡 Moderado |
| 4 | 6,000 | 8,000 | 41% | 🟢 OK |
| ... | ... | ... | ... | ... |

**Criterios de estado**:
- 🟢 OK: <40%
- 🟡 Moderado: 40-60%
- 🟠 Warning: 60-80%
- 🔴 Crítico: >80% (programar corte)

---

## 8. CÁLCULOS DE INGENIERÍA

### 8.1 Cálculos Hidráulicos

#### Pérdida de Presión por Fricción (Darcy-Weisbach)

```
ΔP = f × (L/D) × (ρv²/2)

Donde:
  f = Factor de fricción (Moody)
  L = Longitud (ft)
  D = Diámetro (ft)
  ρ = Densidad del fluido (lb/ft³)
  v = Velocidad (ft/s)
```

#### Número de Reynolds

```
NRe = (928 × ρ × v × d) / μp

Donde:
  ρ = Densidad (ppg)
  v = Velocidad (ft/s)
  d = Diámetro (pulgadas)
  μp = Viscosidad plástica (cP)
```

**Régimen de flujo**:
- NRe < 2,100: Laminar
- NRe > 4,000: Turbulento (requerido para transporte de sólidos)

#### Densidad Equivalente de Circulación (ECD)

```
ECD = P_fondo / (0.052 × TVD)

Donde:
  P_fondo = Presión de fondo (psi)
  TVD = Profundidad vertical verdadera (ft)
```

### 8.2 Cálculos Mecánicos

#### Estiramiento de Tubería

```
ΔL = (F × L × 12) / (A × E)

Donde:
  F = Fuerza axial (lbs)
  L = Longitud (ft)
  A = Área de sección transversal (in²)
  E = Módulo de elasticidad = 30×10⁶ psi (acero)
```

#### Pandeo Sinusoidal (Dawson-Paslay)

```
F_cr_sin = 2 × √(E × I × Wb × sin(θ) / r)

Donde:
  E = Módulo de elasticidad (psi)
  I = Momento de inercia (in⁴)
  Wb = Peso flotado (lb/ft)
  θ = Ángulo de inclinación
  r = Radio del wellbore (in)
```

#### Pandeo Helicoidal

```
F_cr_hel = √2 × F_cr_sin ≈ 1.414 × F_cr_sin
```

### 8.3 Predicción de Lockup

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GRÁFICO BROOMSTICK                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Peso Indicador (lbs)                                                        │
│      │                                                                       │
│ 8000 │     ╭────────────────────────────── Pickup (μ=0.20)                  │
│      │    ╱     ╭──────────────────────── Pickup (μ=0.25)                   │
│ 6000 │   ╱     ╱    ╭───────────────────── Pickup (μ=0.30)                  │
│      │  ╱     ╱    ╱                                                        │
│ 4000 │ ╱     ╱    ╱     ───────────────── String Weight                     │
│      │╱     ╱    ╱                                                          │
│ 2000 │     ╱    ╱                                                           │
│      │    ╱    ╱                                                            │
│    0 │───┼────┼────────────────────────────────────────────▶                │
│      │    ╲    ╲                                                            │
│-2000 │     ╲    ╲                                                           │
│      │      ╲    ╲                                                          │
│-4000 │       ╲    ╲──────────────────── Slackoff (μ=0.25)                   │
│      │        ╲                                                             │
│-6000 │         ╲───────── ⚠️ Buckling Zone                                  │
│      │          ╲                                                           │
│-8000 │           ╲ ❌ Lockup @ 12,500 ft                                    │
│      └───────────────────────────────────────────────────────▶              │
│           2000   4000   6000   8000  10000  12000  14000  Profundidad (ft)  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.4 Coeficientes de Fricción Típicos

| Condición | Cased Hole (μ) | Open Hole (μ) |
|-----------|----------------|---------------|
| Lodo base aceite | 0.10-0.20 | 0.15-0.25 |
| Lodo base agua | 0.15-0.25 | 0.20-0.35 |
| Base sintética | 0.08-0.15 | 0.12-0.22 |
| Con lubricante | 0.10-0.15 | 0.15-0.25 |

### 8.5 Cálculos Volumétricos

**Capacidad interna del CT**:
```
Capacidad (bbl/ft) = ID² / 1029.4
```

**Capacidad anular**:
```
Capacidad_anular (bbl/ft) = (D_hole² - OD_ct²) / 1029.4
```

---

## 9. TELEMETRÍA Y SENSORES

### 9.1 Sensores de Superficie

| Componente | Especificación | Protocolo |
|------------|----------------|-----------|
| **Encoder de profundidad** | 1000-5000 pulsos/rev, ±0.1-0.5% | Modbus RTU |
| **Transductor de presión** | 0-20,000 psi, ±0.25-1.0% FS | 4-20 mA |
| **Celda de carga** | Hasta 100,000 lbs, ±0.5-1% | 4-20 mA |
| **Contador de bomba** | Hasta 1,024 SPM | Pulso digital |
| **Medidor de flujo N₂** | Hasta 10,000 PSI | Diferencial |

### 9.2 Sensores de Fondo (Downhole)

| Sensor | Rango | Aplicación |
|--------|-------|------------|
| Presión/Temperatura | 15,000 psi / 350°F | Medición BHP |
| CCL (Collar Locator) | - | Correlación profundidad |
| Gamma Ray | - | Evaluación formación |
| TCT (Tensión-Compresión-Torque) | - | Fresado, perforación |

### 9.3 Tasas de Adquisición

| Parámetro | Mínima | Recomendada | Máxima |
|-----------|--------|-------------|--------|
| Profundidad/Posición | 1 Hz | 5-10 Hz | 100 Hz |
| Presión (superficie) | 1 Hz | 5-10 Hz | 100 Hz |
| Presión (fondo) | 0.5 Hz | 1-2 Hz | 10 Hz |
| Peso/Carga | 1 Hz | 5-10 Hz | 100 Hz |
| Temperatura | 0.1 Hz | 0.5-1 Hz | 5 Hz |
| Vibración | 100 Hz | 500 Hz | 1000+ Hz |

### 9.4 Protocolos de Comunicación

| Protocolo | Características | Uso |
|-----------|-----------------|-----|
| **Modbus RTU/TCP** | Serial/TCP, polling 50-1000 ms | PLCs, sensores |
| **OPC-UA** | TCP/IP, seguro, sub-segundo | Sistemas SCADA |
| **WITS 0-2** | Serial ASCII/binario, ~1 paq/s | Legacy |
| **WITSML 2.0** | XML/Web Services, tiempo real | Intercambio datos |

---

## 10. SISTEMA DE ALARMAS

### 10.1 Tipos de Alarmas

Siguiendo **ISA-18.2** (gestión del ciclo de vida de alarmas):

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| **Absoluta** | Límites fijos | Presión bomba > 5,000 psi |
| **Relativa** | Desviación del predicho | Peso ±500 lbs del modelo |
| **Dinámica** | Ajusta con contexto | Límite cambia con profundidad |
| **Compuesta** | Múltiples condiciones | Alta presión + baja velocidad |

### 10.2 Alarmas Configuradas

| Alarma | Condición | Severidad | Acción |
|--------|-----------|-----------|--------|
| **Overpull** | Peso > Límite pickup | 🔴 Crítica | Detener, verificar |
| **Slack Off** | Peso < Límite slackoff | 🟠 Alta | Verificar lockup |
| **High Pump Pressure** | P > Max pump | 🔴 Crítica | Reducir rate |
| **MAASP Exceeded** | WHP > MAASP | 🔴 Crítica | Cerrar BOP |
| **Stripper Leak** | P anular incrementa | 🟠 Alta | Revisar stripper |
| **Fatigue Warning** | Fatiga > 75% | 🟡 Media | Monitorear |
| **Fatigue Critical** | Fatiga > 85% | 🔴 Crítica | Programar corte |
| **Speed Limit** | Velocidad > Max | 🟡 Media | Reducir velocidad |

### 10.3 Objetivos de Gestión de Alarmas

| Métrica | Objetivo |
|---------|----------|
| Alarmas por 10 min | ≤2 |
| Alarmas por hora | ≤12 |
| Alarmas por día | ≤300 |
| Tasa de falsas alarmas | <10% |

---

## 11. KPIs Y MÉTRICAS

### 11.1 KPIs de Eficiencia

| KPI | Objetivo | Fórmula |
|-----|----------|---------|
| **Uptime** | ≥92% | Tiempo bombeo / Tiempo turno |
| **NPT** | ≤5% | Tiempo perdido / Tiempo total |
| **Utilización** | 80-90% | HHP usado / HHP disponible |
| **Éxito primera corrida** | ≥95% | Jobs exitosos 1er intento / Total |

### 11.2 KPIs Operacionales

| KPI | Unidad | Descripción |
|-----|--------|-------------|
| Tasa de fresado | ft/hr | Penetración neta |
| Tiempo RIH/POOH | hr | Eficiencia de viaje |
| Barriles bombeados | bbl/hr | Throughput de fluidos |
| Tiempo rig-up | hr | Setup efficiency |

### 11.3 KPIs de Costo

| KPI | Objetivo |
|-----|----------|
| Costo por pie | Minimizar |
| Costo por trabajo vs estimado | <10% variación |
| Utilización de equipo | >75% |
| Reducción vs baseline | 10-20% |

### 11.4 KPIs de Seguridad

| KPI | Objetivo |
|-----|----------|
| Eventos control de pozo | **Cero** |
| Fallas integridad CT | **Cero** |
| Excursiones >MAASP | **Cero** |
| TRIR | Track mensual |

---

## 12. JOB TICKET

### 12.1 Estructura del Job Ticket

```
╔═════════════════════════════════════════════════════════════════════════════╗
║                           JOB TICKET - COILED TUBING                         ║
╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Job #: CT-2026-042              Fecha: 12/01/2026                          ║
║  Cliente: PDVSA                  Pozo: PDC-15                               ║
║  Campo: Punta de Mata            Tipo: Cleanout                             ║
║                                                                              ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  EQUIPO                                                                      ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Unidad: CT-Unit-05              Reel: R-2024-012                           ║
║  CT OD: 1.75"                    Longitud: 18,500 ft                        ║
║  BHA: Junk basket + Nozzle 4x12                                             ║
║                                                                              ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  RESUMEN DE OPERACIONES                                                      ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Hora  │ Operación                      │ Profundidad │ Observaciones       ║
║  ──────┼────────────────────────────────┼─────────────┼─────────────────────║
║  06:00 │ Rig up                         │ 0 ft        │ Sin novedad         ║
║  08:30 │ RIH                            │ 0 → 5,000   │ Normal              ║
║  10:15 │ Tag sand                       │ 8,542 ft    │ Arena detectada     ║
║  10:30 │ Circulate, wash down           │ 8,542→10,020│ 2.5 bpm             ║
║  14:00 │ POOH                           │ 10,020 → 0  │ Sin restricciones   ║
║  16:00 │ Rig down                       │ 0 ft        │ Sin novedad         ║
║                                                                              ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  FLUIDOS BOMBEADOS                                                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Fluido           │ Volumen (bbl) │ Rate (bpm) │ Presión Max (psi)         ║
║  ──────────────────┼───────────────┼────────────┼─────────────────────────────║
║  Agua + N2         │ 150           │ 2.5        │ 2,800                      ║
║                                                                              ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  RESULTADO                                                                   ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  ✅ Objetivos cumplidos: Sí                                                 ║
║  Tag depth: 8,542 ft      Max depth: 10,020 ft     TD Alcanzado: Sí        ║
║  NPT: 0 hrs               Tiempo total: 10 hrs                              ║
║                                                                              ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  FIRMAS                                                                      ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Operador CT: ________________    Supervisor: ________________              ║
║  Cliente:     ________________    Fecha: ________________                   ║
║                                                                              ║
╚═════════════════════════════════════════════════════════════════════════════╝
```

### 12.2 Generación de PDF

El sistema generará automáticamente:
- **PDF del Job Ticket** con branding del tenant
- **Anexos**: Gráficos de operación, datos de telemetría
- **Firma digital**: Integración con sistema de firmas
- **Archivo**: PDF/A para cumplimiento normativo

---

## 13. ESTÁNDARES Y NORMATIVAS

### 13.1 Estándares API

| Estándar | Descripción | Aplicación |
|----------|-------------|------------|
| **API RP 5C7** | Operaciones CT | Fatiga, derating |
| **API SPEC 5ST** | Manufactura CT | Grados, certificaciones |
| **API RP 16ST** | Control de pozo CT | Pruebas BOP |
| **API SPEC 16A** | Equipos drill-through | Certificación BOP |

### 13.2 Otros Estándares

| Estándar | Área |
|----------|------|
| **ISA-18.2** | Gestión de alarmas |
| **ISA-101** | Diseño de HMI |
| **ISO 11064** | Centros de control |
| **WITSML 2.0** | Intercambio de datos |

---

## 14. ROADMAP DE IMPLEMENTACIÓN

### 14.1 Resumen de Fases

| Fase | Entregables | Duración | Estado |
|------|-------------|----------|--------|
| **1** | Modelo de datos, APIs base | 2 semanas | ⚪ Pendiente |
| **2** | Gestión de reels y fatiga | 2 semanas | ⚪ Pendiente |
| **3** | Gestión de jobs y BHA | 2 semanas | ⚪ Pendiente |
| **4** | Dashboard tiempo real | 2 semanas | ⚪ Pendiente |
| **5** | Job tickets y reportes | 1 semana | ⚪ Pendiente |
| **6** | Cálculos de ingeniería | 2 semanas | ⚪ Pendiente |
| **7** | Integración y testing | 1 semana | ⚪ Pendiente |

**Total estimado: 12 semanas**

### 14.2 Fase 1: Modelo de Datos y APIs Base

**Entregables**:
- [ ] Migración de tablas: `ct_units`, `ct_reels`, `ct_jobs`
- [ ] Tablas auxiliares: `reel_sections`, `job_operations`, `job_fluids`, `job_bha`
- [ ] Tablas TimescaleDB: `ct_realtime_data`, `fatigue_cycles`
- [ ] APIs CRUD básicas para todas las entidades
- [ ] Seeds de datos de prueba

### 14.3 Fase 2: Gestión de Reels y Fatiga

**Entregables**:
- [ ] UI: Lista de reels con filtros
- [ ] UI: Detalle de reel con tabs
- [ ] UI: Formulario crear/editar reel
- [ ] API: Cálculo de fatiga
- [ ] API: Registro de cortes
- [ ] Gráficos de fatiga por sección

### 14.4 Fase 3: Gestión de Jobs y BHA

**Entregables**:
- [ ] UI: Wizard crear job (6 pasos)
- [ ] UI: Detalle de job con 8 tabs
- [ ] UI: Diseñador visual de BHA
- [ ] API: Validaciones de negocio
- [ ] Reglas: Validación de equipo disponible

---

## 15. PLANIFICACIÓN DEL FRONTEND UI

### 15.1 Resumen Ejecutivo

El frontend del módulo Coiled Tubing está **completamente planificado** siguiendo los estándares del proyecto definidos en `/roadmap/01_arquitectura/08_FRONTEND_STANDARDS.md`.

**Documento completo**: Se inició la creación de `/home/diazhh/dev/scadaerp/COILED_TUBING_FRONTEND_PLAN.md` con la planificación detallada.

### 15.2 Arquitectura de Páginas

**Estructura de carpetas**:
```
/src/frontend/src/features/coiled-tubing/
├── api/          # React Query hooks (units, reels, jobs, calculations)
├── components/   # 11 componentes reutilizables
├── hooks/        # Custom hooks
├── i18n/         # Traducciones ES/EN
├── pages/        # 11 páginas principales
├── schemas/      # Zod validation schemas
├── types/        # TypeScript types
└── constants/    # Enums y constantes
```

### 15.3 Páginas Principales (11 páginas)

**CT Units (3 páginas)**:
1. `CtUnitsList.tsx` - Lista con KPIs, filtros, tabla paginada
2. `CtUnitDetail.tsx` - Detalle con 5 tabs (Info, Specs, Reels, Jobs, Mantenimiento)
3. `CtUnitForm.tsx` - Formulario con 3 secciones (Básica, Técnica, Estado)

**CT Reels (3 páginas)**:
4. `CtReelsList.tsx` - Lista con KPIs, filtros avanzados, indicador de fatiga
5. `CtReelDetail.tsx` - Detalle con 5 tabs (Info, Specs, Fatiga, Cortes, Jobs)
6. `CtReelForm.tsx` - Formulario con cálculo automático de ID

**CT Jobs (4 páginas)**:
7. `CtJobsList.tsx` - Lista con KPIs, filtros avanzados, badges de estado
8. `CtJobDetail.tsx` - Detalle con 8 tabs (Info, BHA, Fluidos, Operaciones, Cálculos, Alarmas, Costos, Ticket)
9. `CtJobForm.tsx` - Wizard de 6 pasos (Info, Recursos, Planificación, BHA, Fluidos, Revisión)
10. `CtJobMonitor.tsx` - Dashboard en tiempo real con 6 widgets

**Dashboard**:
11. `CtDashboard.tsx` - Dashboard principal con KPIs, gráficos, calendario

### 15.4 Componentes Reutilizables (11 componentes)

1. `CtUnitsTable` - Tabla de unidades
2. `CtReelsTable` - Tabla de carretes con barra de fatiga
3. `CtJobsTable` - Tabla de jobs con progreso
4. `CtJobFilters` - Panel de filtros avanzados
5. `CtJobStats` - KPI cards
6. `CtReelSectionsTable` - Tabla de secciones de reel
7. `CtFatigueChart` - Gráfico de fatiga (bar chart)
8. `CtOperationsTimeline` - Timeline de operaciones
9. `CtBhaDesigner` - Diseñador visual de BHA (drag & drop)
10. `CtRealtimeDashboard` - Dashboard tiempo real
11. `CtJobTicketViewer` - Visor de job ticket

### 15.5 Características Clave

**Navegación**:
- ✅ Breadcrumbs en todas las páginas
- ✅ Patrón: Lista → Detalle (tabs) → Formulario → Detalle
- ✅ NO usar modales para CRUD

**Validación**:
- ✅ React Hook Form + Zod schemas
- ✅ Validación en tiempo real
- ✅ Mensajes de error inline

**Permisos**:
- ✅ PermissionGate en botones de acción
- ✅ Granularidad: `coiled-tubing:{recurso}:{accion}`
- ✅ 15 permisos definidos

**i18n**:
- ✅ Traducciones ES/EN completas
- ✅ Namespace: `coiled-tubing`
- ✅ Estructura por secciones (units, reels, jobs, calculations)

**UI/UX**:
- ✅ shadcn/ui + Radix UI components
- ✅ TailwindCSS styling
- ✅ Recharts para gráficos
- ✅ Loading states (skeleton)
- ✅ Empty states con ilustraciones
- ✅ Toast notifications (sonner)

### 15.6 Integraciones

**APIs (React Query)**:
- `ct-units.api.ts` - CRUD + hooks
- `ct-reels.api.ts` - CRUD + cortes + hooks
- `ct-jobs.api.ts` - CRUD + workflow + hooks
- `ct-calculations.api.ts` - Fatiga, buckling, hidráulica

**Tiempo Real**:
- WebSocket para monitor de jobs
- Fallback a polling (2s)
- Auto-reconexión

**Ditto Integration**:
- Búsqueda de pozos y campos
- Links a detalles de Digital Twins

### 15.7 Estimación de Esfuerzo

| Componente | Horas |
|------------|-------|
| Infraestructura Base | 4 |
| API Integration | 6 |
| Componentes Reutilizables | 16 |
| Páginas CT Units | 8 |
| Páginas CT Reels | 10 |
| Páginas CT Jobs | 20 |
| Dashboard | 8 |
| Monitor Tiempo Real | 12 |
| Integración y Testing | 8 |
| **TOTAL** | **~92 hrs** |

### 15.8 Checklist de Implementación

**Infraestructura** (6 tareas):
- [ ] Estructura de carpetas
- [ ] Tipos TypeScript
- [ ] Constantes y enums
- [ ] Traducciones ES/EN
- [ ] Schemas Zod
- [ ] Permisos

**API Integration** (4 tareas):
- [ ] ct-units.api.ts
- [ ] ct-reels.api.ts
- [ ] ct-jobs.api.ts
- [ ] ct-calculations.api.ts

**Componentes** (11 tareas):
- [ ] CtUnitsTable, CtReelsTable, CtJobsTable
- [ ] CtJobFilters, CtJobStats
- [ ] CtReelSectionsTable, CtFatigueChart
- [ ] CtOperationsTimeline, CtBhaDesigner
- [ ] CtRealtimeDashboard, CtJobTicketViewer

**Páginas** (11 tareas):
- [ ] CT Units (3 páginas)
- [ ] CT Reels (3 páginas)
- [ ] CT Jobs (4 páginas)
- [ ] Dashboard (1 página)

**Integración** (4 tareas):
- [ ] Rutas en router
- [ ] Links en navegación
- [ ] Testing E2E
- [ ] Optimizaciones

---

**Nota**: La planificación detallada completa con especificaciones técnicas, props de componentes, schemas Zod completos, y ejemplos de código se encuentra en proceso de documentación en un archivo dedicado.

### 14.5 Fase 4: Dashboard Tiempo Real

**Entregables**:
- [ ] Dashboard principal CT
- [ ] Dashboard monitoreo RT por job
- [ ] Gráfico broomstick (peso vs profundidad)
- [ ] Indicadores de presión, velocidad, profundidad
- [ ] Log de operaciones en tiempo real
- [ ] Integración WebSocket
- [ ] Sistema de alarmas RT

### 14.6 Fase 5: Job Tickets y Reportes

**Entregables**:
- [ ] UI: Generación de job ticket
- [ ] Plantilla PDF con branding
- [ ] Firma digital integrada
- [ ] Reportes de KPIs
- [ ] Reporte de fatiga de flota
- [ ] Exportación Excel/PDF

### 14.7 Fase 6: Cálculos de Ingeniería

**Entregables**:
- [ ] Servicio: Cálculos hidráulicos (Reynolds, ECD, fricción)
- [ ] Servicio: Cálculos mecánicos (estiramiento, buckling)
- [ ] Servicio: Predicción de lockup
- [ ] Servicio: Simulación de fuerzas
- [ ] UI: Visualización de resultados de simulación

### 14.8 Fase 7: Integración y Testing

**Entregables**:
- [ ] Tests unitarios (cobertura >80%)
- [ ] Tests de integración APIs
- [ ] Tests E2E de flujos principales
- [ ] Documentación de usuario
- [ ] Training materials

---

## 15. REFERENCIAS

### 15.1 Documentación Interna

- `/roadmap/04_modulo_coiled_tubing/01_VISION_FUNCIONALIDADES.md`
- `/roadmap/04_modulo_coiled_tubing/02_MODELO_DATOS.md`
- `/roadmap/04_modulo_coiled_tubing/03_APIS_ENDPOINTS.md`
- `/roadmap/04_modulo_coiled_tubing/04_INTERFAZ_USUARIO.md`

### 15.2 Software de Referencia

- **CIRCA Suite** (Baker Hughes)
- **Cerberus** (NOV-CTES)
- **CoilCADE/CoilCAT** (Schlumberger)
- **SMART-LINK** (Weatherford)

### 15.3 Estándares

- API RP 5C7, API SPEC 5ST, API RP 16ST
- ISA-18.2, ISA-101
- WITSML 2.0, OSDU

---

> **Última actualización**: 2026-01-12  
> **Autor**: PetroEdge Team  
> **Revisión**: 2.0