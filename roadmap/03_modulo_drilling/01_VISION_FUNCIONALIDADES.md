# DRILLING OPERATIONS - VISIÓN Y FUNCIONALIDADES

## 1. Visión del Módulo

### 1.1 Propósito

Proporcionar un sistema integral para **planificar, monitorear y optimizar operaciones de perforación** con capacidades profesionales comparables a software como Landmark, Drilling Office y WellPlan.

### 1.2 Usuarios Objetivo

| Rol | Necesidades |
|-----|-------------|
| **Drilling Engineer** | Planning, T&D analysis, optimization |
| **Directional Driller** | Trajectory, surveys, steering |
| **Drilling Supervisor** | Real-time monitoring, DDR |
| **Well Control Specialist** | Kill sheets, MAASP, kick detection |
| **Company Man** | Oversight, approvals, reporting |

---

## 2. Well Planning (Planificación)

### 2.1 Diseño de Trayectoria

#### 2.1.1 Tipos de Pozos Soportados

| Tipo | Descripción | Complejidad |
|------|-------------|-------------|
| **Vertical** | Desviación < 5° | Baja |
| **Direccional J-Shape** | KOP → Build → Hold | Media |
| **Direccional S-Shape** | Build → Hold → Drop | Media |
| **Horizontal** | Sección horizontal en objetivo | Alta |
| **Extended Reach (ERD)** | Ratio H:V > 2:1 | Muy Alta |
| **Multilateral** | Múltiples ramas desde pozo madre | Muy Alta |

#### 2.1.2 Parámetros de Diseño

```
PARÁMETROS DE TRAYECTORIA:
├── Superficie
│   ├── Coordenadas (Lat/Long o UTM)
│   ├── Elevación (KB, GL, MSL)
│   └── Azimut inicial
│
├── Puntos de Control
│   ├── KOP (Kickoff Point)
│   ├── EOB (End of Build)
│   ├── Landing Point
│   └── TD (Total Depth)
│
├── Tasas de Construcción
│   ├── Build Rate (°/100ft)
│   ├── Turn Rate (°/100ft)
│   └── DLS Máximo (°/100ft)
│
└── Objetivo
    ├── Coordenadas del target
    ├── TVD del target
    ├── Tolerancia (radio)
    └── Azimut de aproximación
```

#### 2.1.3 Métodos de Cálculo

| Método | Uso |
|--------|-----|
| **Minimum Curvature** | Estándar de la industria para surveys |
| **Radius of Curvature** | Planning con arcos constantes |
| **Tangential** | Aproximación rápida |
| **Balanced Tangential** | Alternativa a minimum curvature |

#### 2.1.4 Salidas del Diseño

- Survey plan (MD, Inc, Azi, TVD, NS, EW, DLS)
- Perfil vertical (TVD vs MD)
- Vista de planta (NS vs EW)
- Vista 3D interactiva
- Anti-collision analysis

### 2.2 Diseño de Revestimiento (Casing)

#### 2.2.1 Strings de Casing

| String | Propósito | Profundidad Típica |
|--------|-----------|-------------------|
| **Conductor** | Estabilidad superficial | 50-150 ft |
| **Surface** | Protección de acuíferos | 500-2000 ft |
| **Intermediate** | Aislamiento de zonas problema | Variable |
| **Production** | Aislamiento de zona productora | TD |
| **Liner** | Extensión colgada | Sección inferior |

#### 2.2.2 Criterios de Diseño

```
DISEÑO DE CASING:
├── Cargas de Diseño
│   ├── Burst (presión interna)
│   │   ├── Escenario: Tubing leak
│   │   ├── Escenario: Gas kick
│   │   └── Factor de diseño: 1.1-1.25
│   │
│   ├── Collapse (presión externa)
│   │   ├── Escenario: Evacuación
│   │   ├── Escenario: Cemento fresco
│   │   └── Factor de diseño: 1.0-1.125
│   │
│   └── Tension (carga axial)
│       ├── Peso en aire
│       ├── Flotación
│       ├── Shock loads
│       └── Factor de diseño: 1.6-1.8
│
├── Selección de Grado
│   ├── J-55, K-55, L-80, N-80
│   ├── C-95, P-110, Q-125
│   └── Premium connections
│
└── Cemento
    ├── TOC (Top of Cement)
    ├── Volumen
    ├── Tipo de cemento
    └── Aditivos
```

### 2.3 Programa de Lodo

#### 2.3.1 Tipos de Lodo

| Tipo | Aplicación | Ventajas |
|------|------------|----------|
| **WBM** (Water Based) | General, ambiental | Económico, disposal fácil |
| **OBM** (Oil Based) | Shales reactivos, HP/HT | Estabilidad, lubricidad |
| **SBM** (Synthetic) | Offshore, ambiental | Performance + ambiental |
| **Foam** | Bajo balance, pérdidas | Bajo ECD |

#### 2.3.2 Ventana Operacional

```
Presión (ppg equivalente)
    │
    │      Fractura ─────────────────────────── Límite superior
    │                    ↑
    │                    │ Margen de seguridad
    │                    ↓
MW ─│─────────────────── ○ ○ ○ ○ ○ ○ ○ ○ ○ ── Densidad de lodo
    │                    ↑
    │                    │ Margen de seguridad
    │                    ↓
    │      Poro ──────────────────────────────── Límite inferior
    │
    └────────────────────────────────────────────▶ Profundidad
```

#### 2.3.3 Propiedades del Lodo

| Propiedad | Unidad | Rango Típico |
|-----------|--------|--------------|
| **Mud Weight** | ppg | 8.5 - 18.0 |
| **Funnel Viscosity** | sec/qt | 35 - 60 |
| **Plastic Viscosity** | cP | 10 - 30 |
| **Yield Point** | lb/100ft² | 5 - 20 |
| **Gel Strength** | lb/100ft² | 2 - 15 |
| **Fluid Loss** | ml/30min | < 10 |
| **pH** | - | 8 - 11 |

---

## 3. Real-Time Operations

### 3.1 Drilling Dashboard

#### 3.1.1 Parámetros Monitoreados

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DRILLING DASHBOARD                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─ Profundidad ───────┐  ┌─ Peso en Gancho ───┐  ┌─ ROP ──────────────┐   │
│  │                     │  │                     │  │                    │   │
│  │   MD: 8,542 ft      │  │   245 klbs          │  │   85 ft/hr         │   │
│  │   TVD: 7,890 ft     │  │   ▲ Trip In         │  │   ████████░░       │   │
│  │   ████████████░░    │  │   ████████░░░       │  │                    │   │
│  │                     │  │                     │  │                    │   │
│  └─────────────────────┘  └─────────────────────┘  └────────────────────┘   │
│                                                                              │
│  ┌─ Presiones ─────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  SPP: 2,850 psi     │  Choke: 0 psi      │  Casing: 0 psi          │   │
│  │  ████████░░░░       │  ░░░░░░░░░░        │  ░░░░░░░░░░             │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─ Bombas ────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  Pump 1: 120 spm    │  Pump 2: 115 spm   │  Flow: 650 gpm          │   │
│  │  ████████░░░░       │  ████████░░░░      │  ████████░░             │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─ Rotación ──────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  RPM: 120           │  Torque: 18 kft-lb │  WOB: 25 klbs           │   │
│  │  ████████░░░░       │  ████████░░░░      │  █████░░░░░             │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─ Lodo ──────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  MW In: 10.5 ppg    │  MW Out: 10.4 ppg  │  Temp: 125°F            │   │
│  │  Flow Out: 648 gpm  │  Delta Flow: -2 gpm│  Gas: 0 units           │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Torque & Drag Analysis

#### 3.2.1 Modelo Soft-String

```
Fuerza de Arrastre por elemento:
ΔF = μ × N × ΔL

Donde:
  μ = Coeficiente de fricción
  N = Fuerza normal = W × sin(θ) + T × Δθ
  W = Peso del elemento
  T = Tensión
  θ = Inclinación
  Δθ = Cambio de ángulo (dogleg)
```

#### 3.2.2 Coeficientes de Fricción Típicos

| Condición | Cased Hole | Open Hole |
|-----------|------------|-----------|
| **WBM** | 0.25 | 0.35 |
| **OBM** | 0.15 | 0.20 |
| **Con lubricante** | 0.10 | 0.15 |

#### 3.2.3 Outputs del Modelo

| Operación | Output |
|-----------|--------|
| **Trip In** | Hookload vs Depth (slack-off) |
| **Trip Out** | Hookload vs Depth (pickup) |
| **Rotating** | Hookload vs Depth |
| **Sliding** | Hookload + Torque vs Depth |
| **Backreaming** | Hookload + Torque vs Depth |

### 3.3 MSE (Mechanical Specific Energy)

#### 3.3.1 Fórmula de MSE

```
MSE = (480 × RPM × Torque) / (D² × ROP) + (4 × WOB) / (π × D²)

Donde:
  MSE = Mechanical Specific Energy (psi)
  RPM = Revoluciones por minuto
  Torque = Torque en surface (ft-lbs)
  D = Diámetro del bit (in)
  ROP = Rate of Penetration (ft/hr)
  WOB = Weight on Bit (lbs)
```

#### 3.3.2 Interpretación

| MSE (psi) | Interpretación |
|-----------|----------------|
| < 20,000 | Perforación eficiente |
| 20,000 - 50,000 | Normal |
| 50,000 - 100,000 | Problemas potenciales |
| > 100,000 | Ineficiente, revisar parámetros |

---

## 4. Well Control

### 4.1 Kill Sheet

#### 4.1.1 Datos Pre-calculados

```
KILL SHEET - POZO XYZ-01
═══════════════════════════════════════════════════════════════

DATOS DEL POZO:
├── TVD: 10,000 ft
├── MD: 11,500 ft
├── Casing Shoe: 8,500 ft (TVD)
├── MW actual: 10.5 ppg
└── Capacidades:
    ├── DP: 0.0178 bbl/ft
    ├── HWDP: 0.0088 bbl/ft
    ├── DC: 0.0075 bbl/ft
    └── Anular: 0.0505 bbl/ft

PRESIONES:
├── SIDPP: _____ psi
├── SICP: _____ psi
├── Slow Pump Rate: 30 spm = 850 psi
└── Kill Rate: 20 spm = 600 psi

CÁLCULOS:
├── Kill Mud Weight = MW + (SIDPP / 0.052 / TVD) = _____ ppg
├── ICP = SIDPP + Slow Pump Pressure = _____ psi
├── FCP = Kill MW / Original MW × Slow Pump Pressure = _____ psi
└── Strokes to Bit = (DP Vol + HWDP Vol + DC Vol) / Pump Output = _____
```

### 4.2 MAASP (Maximum Allowable Annular Surface Pressure)

```
MAASP = (Fracture Gradient - MW) × 0.052 × Shoe TVD

Ejemplo:
  Frac Gradient = 14.5 ppg
  MW = 10.5 ppg
  Shoe TVD = 8,500 ft
  
  MAASP = (14.5 - 10.5) × 0.052 × 8,500 = 1,768 psi
```

---

## 5. Casos de Uso

### UC-01: Crear Plan de Pozo

**Actor**: Drilling Engineer
**Precondiciones**: Datos geológicos disponibles
**Flujo**:
1. Crear nuevo well plan
2. Definir trayectoria (tipo, targets)
3. Diseñar programa de casing
4. Definir programa de lodo
5. Generar modelo T&D
6. Calcular hidráulica
7. Estimar tiempo y costo
8. Aprobar plan

### UC-02: Monitorear Perforación en Tiempo Real

**Actor**: Drilling Supervisor
**Precondiciones**: Rig conectado vía WITSML/OPC-UA
**Flujo**:
1. Abrir dashboard de pozo activo
2. Visualizar parámetros en tiempo real
3. Comparar T&D modelo vs real
4. Recibir alertas automáticas
5. Registrar eventos en DDR

### UC-03: Responder a Kick

**Actor**: Well Control Specialist
**Precondiciones**: Kick detectado
**Flujo**:
1. Sistema detecta ganancia de pit/delta flow
2. Alarma se activa
3. Operador cierra pozo
4. Sistema captura SIDPP/SICP
5. Sistema calcula kill parameters
6. Generar kill sheet
7. Ejecutar procedimiento de control

---

## 6. Entregables por Fase

| Fase | Entregable | Duración |
|------|------------|----------|
| **1** | Trajectory design + visualization | 3 semanas |
| **2** | Casing design + burst/collapse | 2 semanas |
| **3** | Mud program + hydraulics | 2 semanas |
| **4** | Real-time dashboard | 2 semanas |
| **5** | T&D model + monitoring | 2 semanas |
| **6** | Well Control (kill sheets) | 1 semana |
| **7** | DDR + Reporting | 1 semana |
| **8** | WITSML Integration | 2 semanas |

**Total: 15 semanas**

