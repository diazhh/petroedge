# COILED TUBING - VISIÓN Y FUNCIONALIDADES

## 1. Visión del Módulo

### 1.1 Propósito

Proporcionar un sistema integral para **gestionar operaciones de Coiled Tubing** incluyendo el seguimiento de vida de fatiga, planificación de trabajos, monitoreo en tiempo real y documentación.

### 1.2 Usuarios Objetivo

| Rol | Necesidades |
|-----|-------------|
| **CT Supervisor** | Planificación, asignación de recursos |
| **CT Operator** | Ejecución, monitoreo en tiempo real |
| **CT Engineer** | Análisis de fatiga, diseño de BHA |
| **Reel Manager** | Inventario, vida útil, cortes |

---

## 2. Gestión de Reels

### 2.1 Datos del Reel

```
DATOS MAESTROS DEL REEL:
├── Identificación
│   ├── Número de reel
│   ├── Número de serie
│   └── Fabricante
│
├── Especificaciones
│   ├── OD (pulgadas): 1.25", 1.5", 1.75", 2.0", 2.375"
│   ├── ID (pulgadas)
│   ├── Espesor de pared
│   ├── Grado del acero (70, 80, 90, 100, 110 ksi)
│   ├── Longitud total (ft)
│   └── Capacidad de presión (psi)
│
├── Historial
│   ├── Fecha de fabricación
│   ├── Fecha de puesta en servicio
│   ├── Jobs realizados
│   ├── Cortes realizados
│   └── Longitud actual
│
└── Estado de Fatiga
    ├── Fatiga por sección
    ├── % vida consumida
    └── Predicción de vida restante
```

### 2.2 Secciones de Fatiga

El reel se divide en secciones para tracking de fatiga:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MAPA DE FATIGA DEL REEL                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Distancia desde extremo (ft):                                               │
│  0        1000      2000      3000      4000      5000      6000            │
│  │         │         │         │         │         │         │              │
│  ▼         ▼         ▼         ▼         ▼         ▼         ▼              │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐              │
│  │  85%    │  72%    │  58%    │  45%    │  32%    │  18%    │              │
│  │ ██████  │ █████░  │ ████░░  │ ███░░░  │ ██░░░░  │ █░░░░░  │              │
│  └─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘              │
│                                                                              │
│  Leyenda:  █ Fatiga consumida   ░ Vida restante                             │
│                                                                              │
│  ⚠️ Sección 1 (0-1000 ft): Recomendado corte de 500 ft                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Modelo de Fatiga

#### 2.3.1 Fatiga por Flexión (Bending)

Cada vez que el CT pasa por una guía (tubing guide) o el injector, acumula un ciclo de fatiga:

```
Ciclo de Fatiga por Flexión:

Posición inicial    →    Flexión    →    Posición recta
     ─────               ╭─────╮              ─────
                         │     │
                         ╰─────╯
     
     0% strain    →    ε_max    →    0% strain
     
Strain máximo: ε = OD / (2 × R_guía)
```

#### 2.3.2 Fatiga por Presión

La presurización y despresurización del CT causa fatiga adicional:

```
Δσ = P × (ID² + OD²) / (OD² - ID²)  [Hoop stress range]
```

#### 2.3.3 Fatiga Combinada (Miner's Rule)

```
Daño_total = Σ (n_i / N_i) × k

Donde:
  n_i = ciclos aplicados en condición i
  N_i = ciclos hasta falla en condición i
  k   = factor de seguridad (típico 0.7-0.8)
  
Límite: Daño_total < 1.0
```

### 2.4 Operación de Corte

Cuando una sección alcanza el límite de fatiga:

1. Programar corte
2. Registrar longitud removida
3. Actualizar longitud total del reel
4. Recalcular secciones
5. Actualizar mapa de fatiga

---

## 3. Planificación de Trabajos

### 3.1 Tipos de Trabajo

| Categoría | Tipo | Descripción |
|-----------|------|-------------|
| **Limpieza** | Cleanout | Remoción de arena, escala, parafina |
| **Estimulación** | Acid Job | Tratamiento ácido |
| | N2 Lift | Inducción con nitrógeno |
| | Fracturing | Fracturamiento con CT |
| **Mecánico** | Milling | Fresado |
| | Fishing | Recuperación |
| | Perforation | Cañoneo con TCP |
| **Diagnóstico** | Logging | Registros con CT |
| | Survey | Surveys en pozos |

### 3.2 Datos del Job

```
JOB DE COILED TUBING:
├── Información General
│   ├── Número de job
│   ├── Cliente
│   ├── Pozo
│   └── Tipo de trabajo
│
├── Equipo Asignado
│   ├── Unidad CT
│   ├── Reel
│   ├── BHA (Bottom Hole Assembly)
│   └── Personal
│
├── Planificación
│   ├── Fecha programada
│   ├── Profundidad objetivo
│   ├── Fluidos a bombear
│   └── Procedimiento operativo
│
├── Límites Operacionales
│   ├── Peso máximo (overpull/slackoff)
│   ├── Presión máxima bomba
│   ├── Velocidad máxima
│   └── Profundidad lockup predicha
│
└── Resultado
    ├── Objetivos cumplidos
    ├── NPT (si hubo)
    └── Job ticket
```

### 3.3 Predicción de Lockup

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PREDICCIÓN DE LOCKUP                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Peso (lbs)                                                                  │
│      │                                                                       │
│ 8000 │     ╭──────────────────── Pickup (trip out)                          │
│      │    ╱                                                                  │
│ 6000 │   ╱                                                                   │
│      │  ╱   ╭────────── String Weight (neutral)                             │
│ 4000 │ ╱   ╱                                                                 │
│      │╱   ╱                                                                  │
│ 2000 │   ╱                                                                   │
│      │  ╱                                                                    │
│    0 │─┼─────────────────────────────────────────────────▶                  │
│      │  ╲                                                                    │
│-2000 │   ╲                                                                   │
│      │    ╲                                                                  │
│-4000 │     ╲────────────────────  Slackoff (trip in)                        │
│      │      ╲                                                                │
│-6000 │       ╲ ⚠️ Buckling zone                                              │
│      │        ╲                                                              │
│-8000 │         ╲ ❌ Lockup predicted @ 12,500 ft                            │
│      └───────────────────────────────────────────────────────▶              │
│           2000   4000   6000   8000  10000  12000  14000  Depth (ft)        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Monitoreo en Tiempo Real

### 4.1 Dashboard CT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COILED TUBING - REAL TIME                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Pozo: PDC-15          Job: CT-2026-042          Estado: 🟢 EN POZO         │
│                                                                              │
│  ┌─ Profundidad ───────┐  ┌─ Peso ─────────────┐  ┌─ Velocidad ────────┐   │
│  │                     │  │                     │  │                    │   │
│  │   8,542 ft          │  │   -1,250 lbs        │  │   45 ft/min ▼      │   │
│  │   ████████████░░    │  │   ████░░░░░░░░      │  │   █████░░░░░       │   │
│  │   Target: 10,000 ft │  │   Limit: ±4,000 lbs │  │   Max: 100 ft/min  │   │
│  │                     │  │                     │  │                    │   │
│  └─────────────────────┘  └─────────────────────┘  └────────────────────┘   │
│                                                                              │
│  ┌─ Presiones ─────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  Pump: 2,850 psi    │  WHP: 450 psi      │  Annular: 125 psi        │   │
│  │  ████████░░░░       │  ███░░░░░░░        │  █░░░░░░░░░              │   │
│  │  Max: 5,000 psi     │  MAASP: 1,500 psi  │  Limit: 500 psi          │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─ Gráfico Peso vs Profundidad ───────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  Peso (lbs)    Modelo ─── Medido ●●●                                │   │
│  │    4000│                                                             │   │
│  │        │──────────────────────                                       │   │
│  │       0│        ●●●●●●●●●●●●●                                        │   │
│  │        │──────────────────────                                       │   │
│  │   -4000│                                                             │   │
│  │        └─────────────────────────────────────▶ Depth                 │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─ Alarmas ───────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  ✅ Peso dentro de límites    ✅ Presión OK    ⚠️ Fatiga al 78%      │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Alarmas Configurables

| Alarma | Condición | Acción |
|--------|-----------|--------|
| **Overpull** | Peso > Límite pickup | Detener, verificar |
| **Slack Off** | Peso < Límite slackoff | Verificar lockup |
| **High Pressure** | P bomba > Límite | Reducir bombeo |
| **Stripper Leak** | Presión anular sube | Revisar BOP |
| **Fatigue Critical** | Fatiga > 85% | Planificar corte |
| **Speed Limit** | Velocidad > Max | Reducir velocidad |

---

## 5. Job Ticket

### 5.1 Estructura del Job Ticket

```
╔═════════════════════════════════════════════════════════════════════════════╗
║                           JOB TICKET - COILED TUBING                         ║
╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Job #: CT-2026-042              Fecha: 08/01/2026                          ║
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
║  Hora  │ Operación                              │ Profundidad │ Notas       ║
║  ──────┼────────────────────────────────────────┼─────────────┼─────────────║
║  06:00 │ Rig up                                 │ 0           │             ║
║  08:30 │ RIH                                    │ 0 → 5,000   │ Normal      ║
║  10:15 │ Tag sand @ 8,542 ft                    │ 8,542       │             ║
║  10:30 │ Circulate, wash down                   │ 8,542→10,020│ 2.5 bpm     ║
║  14:00 │ POOH                                   │ 10,020 → 0  │             ║
║  16:00 │ Rig down                               │ 0           │             ║
║                                                                              ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  FLUIDOS                                                                     ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Fluido           │ Volumen (bbl) │ Rate (bpm) │ Presión (psi)              ║
║  ──────────────────┼───────────────┼────────────┼────────────────────────────║
║  Agua + N2         │ 150           │ 2.5        │ 2,800 max                  ║
║                                                                              ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  RESULTADO                                                                   ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  ✅ Objetivos cumplidos: Sí                                                 ║
║  Tag depth: 8,542 ft      Max depth: 10,020 ft                              ║
║  NPT: 0 hrs                                                                  ║
║                                                                              ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  FIRMAS                                                                      ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Operador CT: ________________    Supervisor: ________________              ║
║  Cliente:     ________________    Fecha: ________________                   ║
║                                                                              ║
╚═════════════════════════════════════════════════════════════════════════════╝
```

---

## 6. Casos de Uso

### UC-01: Planificar Job de Limpieza

**Actor**: CT Engineer
**Flujo**:
1. Seleccionar pozo
2. Crear nuevo job tipo "Cleanout"
3. Seleccionar unidad y reel disponibles
4. Configurar BHA
5. Calcular predicción de lockup
6. Establecer límites operacionales
7. Generar procedimiento
8. Aprobar plan

### UC-02: Ejecutar Job con Monitoreo

**Actor**: CT Operator
**Flujo**:
1. Abrir job asignado
2. Iniciar adquisición de datos
3. Monitorear peso, presión, velocidad
4. Comparar con modelo predicho
5. Registrar eventos importantes
6. Completar job
7. Generar job ticket

### UC-03: Gestionar Fatiga del Reel

**Actor**: Reel Manager
**Flujo**:
1. Revisar reels con alta fatiga
2. Analizar mapa de fatiga por sección
3. Programar corte de sección dañada
4. Registrar corte realizado
5. Actualizar vida del reel
6. Re-evaluar capacidad

---

## 7. Modelo de Datos Simplificado

```sql
-- Reels
CREATE TABLE ct_reels (
    id UUID PRIMARY KEY,
    reel_number VARCHAR(50),
    od_inches DECIMAL(6,3),
    wall_thickness_inches DECIMAL(6,4),
    grade_ksi INTEGER,
    original_length_ft DECIMAL(10,2),
    current_length_ft DECIMAL(10,2),
    max_pressure_psi DECIMAL(10,2),
    status VARCHAR(20)
);

-- Secciones de fatiga
CREATE TABLE ct_fatigue_sections (
    id UUID PRIMARY KEY,
    reel_id UUID REFERENCES ct_reels(id),
    section_number INTEGER,
    from_distance_ft DECIMAL(10,2),
    to_distance_ft DECIMAL(10,2),
    fatigue_consumed_percent DECIMAL(5,2),
    bend_cycles INTEGER,
    pressure_cycles INTEGER
);

-- Jobs
CREATE TABLE ct_jobs (
    id UUID PRIMARY KEY,
    well_id UUID REFERENCES wells(id),
    reel_id UUID REFERENCES ct_reels(id),
    job_type VARCHAR(30),
    planned_date DATE,
    status VARCHAR(20),
    max_depth_ft DECIMAL(10,2),
    objectives_met BOOLEAN
);

-- Datos en tiempo real (TimescaleDB)
CREATE TABLE ct_realtime_data (
    time TIMESTAMPTZ NOT NULL,
    job_id UUID,
    depth_ft DECIMAL(10,2),
    weight_lbs DECIMAL(10,2),
    speed_fpm DECIMAL(8,2),
    pump_pressure_psi DECIMAL(10,2),
    whp_psi DECIMAL(10,2),
    PRIMARY KEY (time, job_id)
);
```

---

## 8. Entregables

| Fase | Entregable | Duración |
|------|------------|----------|
| **1** | Gestión de reels | 1 semana |
| **2** | Modelo de fatiga | 1 semana |
| **3** | Job planning | 1 semana |
| **4** | Real-time dashboard | 2 semanas |
| **5** | Job tickets | 1 semana |

**Total: 6 semanas**

