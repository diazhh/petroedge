# ROADMAP: MÓDULO YACIMIENTOS (Reservoir Engineering)

## Índice de Documentos

| Documento | Descripción | Estado |
|-----------|-------------|--------|
| `01_VISION_FUNCIONALIDADES.md` | Visión, funcionalidades y casos de uso | ✅ |
| `02_PVT_CORRELACIONES.md` | Propiedades PVT y correlaciones | 📋 |
| `03_BALANCE_MATERIALES.md` | Balance de materiales, OOIP | 📋 |
| `04_DCA_RESERVAS.md` | Declinación y estimación de reservas | 📋 |

---

## Resumen Ejecutivo

El módulo de Yacimientos proporciona herramientas para **gestionar la información geológica y de ingeniería de reservorios**, comparable a software profesional como OFM, MBAL y herramientas de Petrel.

### Funcionalidades Principales

- **Base de Datos de Yacimientos**: Jerarquía Cuenca → Campo → Yacimiento → Pozo
- **Propiedades PVT**: Datos de laboratorio y correlaciones
- **Balance de Materiales**: Havlena-Odeh, Tank Models
- **Estimación de Reservas**: Volumétrico, DCA, Material Balance
- **Pronóstico de Producción**: Decline Curves, Type Curves
- **Mapas**: Isobáricas, isosaturaciones, bubble maps

### Software Comparable

| Software | Fabricante | Características |
|----------|------------|-----------------|
| **OFM** | Schlumberger | Production analysis, surveillance |
| **MBAL** | Petroleum Experts | Material balance |
| **Petrel RE** | Schlumberger | Reservoir engineering |
| **Harmony** | IHS | Decline analysis |
| **ValNav** | Quorum | Reserves, economics |

---

## Arquitectura del Módulo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           YACIMIENTOS                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    BASE DE DATOS JERÁRQUICA                            │  │
│  │                                                                        │  │
│  │   CUENCA ──▶ CAMPO ──▶ YACIMIENTO ──▶ UNIDAD FLUJO ──▶ POZO          │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │  │
│  │      PVT        │  │    BALANCE      │  │    RESERVAS     │            │  │
│  │                 │  │   MATERIALES    │  │                 │            │  │
│  │ • Lab Data      │  │                 │  │ • Volumétrico   │            │  │
│  │ • Correlaciones │  │ • Havlena-Odeh  │  │ • DCA           │            │  │
│  │ • Black Oil     │  │ • Tank Model    │  │ • 1P/2P/3P      │            │  │
│  │ • Compositional │  │ • Aquifer       │  │ • EUR           │            │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │  │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │  │
│  │   PRONÓSTICOS   │  │     MAPAS       │  │   SURVEILLANCE  │            │  │
│  │                 │  │                 │  │                 │            │  │
│  │ • Decline Curves│  │ • Isobáricas    │  │ • Tendencias    │            │  │
│  │ • Type Curves   │  │ • Saturación    │  │ • Comparativas  │            │  │
│  │ • Scenarios     │  │ • Bubble Maps   │  │ • Alarmas       │            │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Jerarquía de Datos

```
EMPRESA (Tenant)
└── CUENCA (Basin)
    └── BLOQUE (Block/Concession)
        └── CAMPO (Field)
            └── YACIMIENTO (Reservoir)
                └── UNIDAD DE FLUJO (Flow Unit)
                    └── POZO (Well)
                        └── COMPLETACIÓN (Completion)
                            └── ZONA (Producing Zone)

Ejemplo Venezuela:
├── PDVSA
│   ├── Cuenca Oriental
│   │   ├── Faja del Orinoco
│   │   │   ├── Bloque Junín
│   │   │   │   ├── Junín 4
│   │   │   │   │   ├── Yacimiento Oficina
│   │   │   │   │   │   └── Pozos J4-001, J4-002...
│   │   │   │   │   └── Yacimiento Merecure
│   │   └── Maturín
│   │       └── Área Mayor de Oficina
│   └── Cuenca de Maracaibo
│       ├── Bloque Urdaneta
│       └── Costa Oriental del Lago
```

---

## Funcionalidades Detalladas

### 1. Propiedades PVT

| Propiedad | Símbolo | Unidad | Correlación Típica |
|-----------|---------|--------|-------------------|
| **Presión de Burbuja** | Pb | psi | Standing, Vasquez-Beggs |
| **Factor Volumétrico** | Bo | bbl/STB | Standing |
| **GOR en Solución** | Rs | scf/STB | Standing |
| **Viscosidad** | μo | cP | Beggs-Robinson |
| **Compresibilidad** | co | 1/psi | Vazquez-Beggs |
| **Factor Z (gas)** | Z | - | Dranchuk-Abou-Kassem |

### 2. Balance de Materiales

**Ecuación de Havlena-Odeh:**
```
F = N × (Eo + m × Eg + Efw) + We

Donde:
  F = Producción acumulada (underground withdrawal)
  N = OOIP
  Eo = Expansión del petróleo
  Eg = Expansión del gas
  Efw = Expansión de agua y formación
  We = Entrada de agua del acuífero
  m = Ratio de gas cap
```

### 3. Estimación de Reservas

| Método | Aplicación | Incertidumbre |
|--------|------------|---------------|
| **Volumétrico** | Yacimientos nuevos | Alta |
| **DCA** | Pozos con historial | Media |
| **Material Balance** | Yacimientos maduros | Baja |
| **Simulación** | Cualquier etapa | Variable |

### 4. Decline Curve Analysis

**Ecuaciones de Arps:**
- **Exponencial**: q = qi × e^(-Dt)
- **Hiperbólico**: q = qi / (1 + bDt)^(1/b)
- **Armónico**: q = qi / (1 + Dt)

---

## Integraciones

| Módulo | Integración |
|--------|-------------|
| **Well Testing** | Datos de presión, IPR |
| **Well Management** | Producción histórica |
| **Drilling** | Datos de pozo, trayectoria |

---

## Cronograma de Implementación

| Fase | Entregable | Duración |
|------|------------|----------|
| **Fase 1** | Base de datos jerárquica | 2 semanas |
| **Fase 2** | PVT y correlaciones | 2 semanas |
| **Fase 3** | Balance de materiales | 3 semanas |
| **Fase 4** | DCA y reservas | 2 semanas |
| **Fase 5** | Mapas y visualización | 2 semanas |

**Total estimado: 11 semanas**

