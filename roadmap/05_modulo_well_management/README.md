# ROADMAP: MÓDULO WELL MANAGEMENT (Gestión de Producción)

## Índice de Documentos

| Documento | Descripción | Estado |
|-----------|-------------|--------|
| `01_VISION_FUNCIONALIDADES.md` | Visión, funcionalidades y casos de uso | ✅ |
| `02_SISTEMAS_LEVANTAMIENTO.md` | ESP, Gas Lift, Rod Pump, PCP | ✅ |
| `03_MODELO_DATOS.md` | Esquemas de base de datos | 📋 |
| `04_OPTIMIZACION.md` | Algoritmos de optimización | 📋 |

---

## Resumen Ejecutivo

El módulo de Well Management gestiona la **producción de pozos** incluyendo:

- **Monitoreo de Producción**: Tasas, presiones, temperaturas en tiempo real
- **Sistemas de Levantamiento Artificial**: ESP, Gas Lift, Rod Pump, PCP
- **Optimización de Producción**: Maximización de producción, reducción de costos
- **Análisis de Declinación**: DCA, pronósticos
- **Integridad de Pozo**: Monitoreo de condiciones, alarmas
- **Asignación de Producción**: Allocation por pozo

### Software Comparable

| Software | Fabricante | Características |
|----------|------------|-----------------|
| **PROSPER** | Petroleum Experts | Nodal analysis, AL design |
| **WellFlo** | Weatherford | Well performance |
| **Avocet** | Schlumberger | Production management |
| **Field Manager** | Emerson | SCADA + production |
| **OFM** | Schlumberger | Production analysis |

---

## Arquitectura del Módulo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WELL MANAGEMENT                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    MONITOREO DE PRODUCCIÓN                             │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │  │
│  │  │Dashboard│  │ Tasas   │  │Presiones│  │  Temp   │  │ Alarmas │    │  │
│  │  │ Campo   │  │Qo/Qw/Qg │  │Pwf/Pwh  │  │  BH/WH  │  │ Config  │    │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                  SISTEMAS DE LEVANTAMIENTO ARTIFICIAL                  │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │  │
│  │  │   ESP   │  │Gas Lift │  │Rod Pump │  │   PCP   │  │ Jet Pump│    │  │
│  │  │Monitor  │  │ Optim   │  │ Cards   │  │ Torque  │  │  Analy  │    │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         OPTIMIZACIÓN                                   │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                  │  │
│  │  │Freq ESP │  │ GL Rate │  │ Stroke  │  │  Field  │                  │  │
│  │  │ Optim   │  │ Alloc   │  │ Optim   │  │  Optim  │                  │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘                  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Sistemas de Levantamiento Artificial

### 1. ESP (Electric Submersible Pump)

| Parámetro | Descripción |
|-----------|-------------|
| **Frecuencia** | Control de VSD (30-70 Hz) |
| **Corriente** | Consumo del motor |
| **Intake Pressure** | Presión de succión |
| **Discharge Pressure** | Presión de descarga |
| **Motor Temperature** | Protección térmica |
| **Vibration** | Detección de problemas |

### 2. Gas Lift

| Parámetro | Descripción |
|-----------|-------------|
| **Inyección** | Tasa de gas inyectado (MSCFD) |
| **Presión Inyección** | Presión en casing |
| **GLR Total** | Gas-líquido ratio total |
| **Válvulas** | Estado y profundidad |
| **Eficiencia** | Comparación con óptimo |

### 3. Rod Pump (Bombeo Mecánico)

| Parámetro | Descripción |
|-----------|-------------|
| **Strokes per Minute** | Velocidad de bombeo |
| **Stroke Length** | Longitud de carrera |
| **Surface Cards** | Diagramas dinamométricos |
| **Pump Fillage** | Llenado de bomba |
| **Polish Rod Load** | Carga en varilla pulida |

### 4. PCP (Progressive Cavity Pump)

| Parámetro | Descripción |
|-----------|-------------|
| **RPM** | Velocidad de rotación |
| **Torque** | Par de torsión |
| **Intake Pressure** | Presión de succión |
| **Slip** | Eficiencia volumétrica |

---

## Funcionalidades Principales

### 1. Monitoreo en Tiempo Real

- Dashboard de campo con todos los pozos
- Estado de cada pozo (produciendo, cerrado, problema)
- Tasas instantáneas y acumuladas
- Tendencias y gráficos históricos
- Alarmas configurables

### 2. Optimización de Producción

- Optimización de frecuencia ESP
- Optimización de tasa de gas lift
- Análisis de eficiencia
- Recomendaciones automáticas

### 3. Análisis de Declinación

- DCA (Decline Curve Analysis)
- Pronósticos de producción
- EUR estimation
- Comparación plan vs real

### 4. Asignación de Producción

- Allocation de producción por pozo
- Back-allocation desde separadores
- Reconciliación con medidores fiscales

---

## Métricas Clave

| Métrica | Descripción |
|---------|-------------|
| **Uptime** | % tiempo produciendo |
| **Efficiency** | Producción real vs potencial |
| **Lifting Cost** | $/bbl de levantamiento |
| **Run Life** | Días de operación ESP/RP |
| **Deferred Production** | Producción diferida por problemas |

---

## Cronograma de Implementación

| Fase | Entregable | Duración |
|------|------------|----------|
| **Fase 1** | Dashboard de producción | 2 semanas |
| **Fase 2** | Monitoreo ESP | 2 semanas |
| **Fase 3** | Monitoreo Gas Lift | 2 semanas |
| **Fase 4** | Monitoreo Rod Pump | 2 semanas |
| **Fase 5** | Optimización básica | 2 semanas |
| **Fase 6** | DCA y pronósticos | 2 semanas |

**Total estimado: 12 semanas**

