# ROADMAP: MÓDULO COILED TUBING (Intervenciones CT)

## Índice de Documentos

| Documento | Descripción | Estado |
|-----------|-------------|--------|
| `01_VISION_FUNCIONALIDADES.md` | Visión, funcionalidades y casos de uso | ✅ |
| `02_MODELO_DATOS.md` | Esquemas de base de datos | 📋 |
| `03_INTERFAZ_USUARIO.md` | Wireframes y diseño visual | 📋 |

---

## Resumen Ejecutivo

El módulo de Coiled Tubing gestiona operaciones de intervención de pozos con tubería continua, incluyendo:

- **Gestión de Reels**: Inventario, vida de fatiga, historial
- **Job Planning**: Planificación de trabajos CT
- **Real-Time Monitoring**: Monitoreo de operaciones en tiempo real
- **Fatigue Management**: Cálculo y seguimiento de fatiga acumulada
- **Buckling Analysis**: Predicción de pandeo y lockup
- **Job Tickets**: Documentación oficial de trabajos

### Software Comparable

| Software | Fabricante | Características |
|----------|------------|-----------------|
| **CTES** | NOV | Fatigue, forces, fluids |
| **CT Pro** | ICoTA | Planning, monitoring |
| **Cerberus** | Schlumberger | Real-time CT |

---

## Funcionalidades Principales

### 1. Gestión de Reels (Carretes)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CICLO DE VIDA DEL REEL                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  NUEVO ──▶ EN SERVICIO ──▶ MONITOREO ──▶ CORTE ──▶ RE-EVALUACIÓN ──▶ RETIRO│
│    │           │              │           │              │             │    │
│    ▼           ▼              ▼           ▼              ▼             ▼    │
│  ┌─────┐   ┌─────┐       ┌─────┐     ┌─────┐       ┌─────┐       ┌─────┐  │
│  │Datos│   │Jobs │       │Fatiga│    │Remover│     │Nuevo │      │Scrap│  │
│  │Inic.│   │Activos│     │Track │    │Sección│     │Rating│      │     │  │
│  └─────┘   └─────┘       └─────┘     └─────┘       └─────┘       └─────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Gestión de Fatiga

| Tipo de Fatiga | Causa | Efecto |
|----------------|-------|--------|
| **Bending** | Paso por guía, injector | Ciclos de flexión |
| **Pressure** | Presurización/despresurización | Fatiga por presión |
| **Combined** | Flexión + presión | Daño acumulado |

**Modelo de Fatiga (Miner's Rule):**
```
Daño Acumulado = Σ (ni / Ni)

Donde:
  ni = Número de ciclos aplicados
  Ni = Número de ciclos hasta falla para esa condición
  
Si Σ (ni/Ni) ≥ 1.0 → Falla esperada
```

### 3. Predicción de Buckling

| Tipo | Descripción | Consecuencia |
|------|-------------|--------------|
| **Sinusoidal** | Ondulación suave | Aumento de fricción |
| **Helicoidal** | Forma de resorte | Lockup inminente |
| **Lockup** | CT no avanza | Operación detenida |

**Fuerza Crítica (Dawson-Paslay):**
```
Fcr = √(E × I × w × sin(θ) / r)
```

### 4. Job Tickets

Documentación oficial que incluye:
- Información del pozo y cliente
- Equipo utilizado (unidad, reel, BHA)
- Resumen de operaciones por hora
- Fluidos bombeados
- Profundidades alcanzadas
- Firmas de aprobación

---

## Tipos de Trabajos CT

| Tipo | Descripción |
|------|-------------|
| **Cleanout** | Limpieza de arena, escala |
| **Nitrogen Lift** | Inducción con nitrógeno |
| **Acid Treatment** | Estimulación ácida |
| **Cement Squeeze** | Reparación de cemento |
| **Fishing** | Recuperación de objetos |
| **Logging** | Corrida de registros |
| **Perforation** | Cañoneo con CT |
| **Milling** | Fresado de obstrucciones |

---

## Integración con SCADA

| Parámetro | Unidad | Fuente |
|-----------|--------|--------|
| **Depth** | ft | Encoder |
| **Weight** | lbs | Load cell |
| **Speed** | ft/min | Encoder |
| **Pump Pressure** | psi | Transducer |
| **Annular Pressure** | psi | Transducer |
| **WHP** | psi | Transducer |

---

## Cronograma de Implementación

| Fase | Entregable | Duración |
|------|------------|----------|
| **Fase 1** | Gestión de reels y fatiga | 2 semanas |
| **Fase 2** | Job planning | 1 semana |
| **Fase 3** | Real-time dashboard | 2 semanas |
| **Fase 4** | Job tickets y reportes | 1 semana |

**Total estimado: 6 semanas**

