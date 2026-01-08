# ROADMAP: MÓDULO WELL TESTING (Pruebas de Pozo)

## Índice de Documentos

| Documento | Descripción | Estado |
|-----------|-------------|--------|
| `01_VISION_FUNCIONALIDADES.md` | Visión, funcionalidades y casos de uso | ✅ |
| `02_MODELO_DATOS.md` | Esquemas de base de datos | 📋 |
| `03_APIS_ENDPOINTS.md` | Definición de APIs REST | 📋 |
| `04_INTERFAZ_USUARIO.md` | Wireframes y diseño visual | 📋 |
| `05_CALCULOS_INGENIERIA.md` | Fórmulas y algoritmos | 📋 |

---

## Resumen Ejecutivo

El módulo de Well Testing proporciona herramientas para planificar, ejecutar y analizar pruebas de pozos, incluyendo:

- **Pruebas de producción** (production tests)
- **Pruebas de presión** (buildup, drawdown, interference)
- **Análisis IPR/VLP** (curvas de comportamiento)
- **Gestión de separadores y medición**

### Software Comparable

| Software | Fabricante | Características |
|----------|------------|-----------------|
| **Saphir** | KAPPA | Análisis de pruebas de presión |
| **PanSystem** | Weatherford | Well testing & production |
| **Topaze** | KAPPA | IPR/VLP nodal analysis |
| **Ecrin** | KAPPA | Rate transient analysis |

---

## Funcionalidades Principales

### 1. Gestión de Pruebas

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CICLO DE VIDA DE PRUEBA                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PLANIFICACIÓN ──▶ PREPARACIÓN ──▶ EJECUCIÓN ──▶ ANÁLISIS ──▶ REPORTE  │
│       │                │              │             │            │       │
│       ▼                ▼              ▼             ▼            ▼       │
│  ┌─────────┐      ┌─────────┐    ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │Objetivos│      │Equipos  │    │Mediciones│  │Cálculos │  │Documento│ │
│  │Duración │      │Personal │    │Real-time│  │IPR/VLP  │  │Oficial  │ │
│  │Recursos │      │Permisos │    │Muestras │  │Curvas   │  │Firmas   │ │
│  └─────────┘      └─────────┘    └─────────┘  └─────────┘  └─────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2. Tipos de Pruebas Soportadas

| Tipo | Descripción | Datos Requeridos |
|------|-------------|------------------|
| **Production Test** | Medición de tasas y presiones | Qo, Qw, Qg, Pwf, Pwh |
| **Buildup** | Cierre para medir recuperación de presión | P vs t, historial producción |
| **Drawdown** | Apertura para medir caída de presión | P vs t, tasa constante |
| **Interference** | Comunicación entre pozos | P en observador, Q en activo |
| **Isochronal** | Determinar AOF en pozos de gas | Multi-rate, estabilizado |
| **PVT Sampling** | Toma de muestras para laboratorio | Condiciones P, T, puntos |

### 3. Análisis IPR (Inflow Performance Relationship)

```
Modelos de IPR disponibles:
├── Vogel (petróleo subsaturado/saturado)
├── Fetkovitch (gas)
├── Jones, Blount & Glaze (turbulencia)
├── Standing (generalizado)
└── Composite (multi-layer)
```

### 4. Análisis VLP (Vertical Lift Performance)

```
Correlaciones de flujo multifásico:
├── Beggs & Brill
├── Hagedorn & Brown
├── Duns & Ros
├── Orkiszewski
├── Gray (gas)
└── Ansari (mecanístico)
```

---

## Interfaz de Usuario

### Pantallas Principales

| Pantalla | Descripción |
|----------|-------------|
| **Lista de Pruebas** | Tabla con todas las pruebas, filtros, búsqueda |
| **Detalle de Prueba** | Información completa, pestañas de datos |
| **Captura de Datos** | Formulario para ingreso de mediciones |
| **Gráficos IPR/VLP** | Visualización interactiva de curvas |
| **Análisis de Presión** | Gráficos log-log, derivada, Horner |
| **Reportes** | Generación de documentos oficiales |

### Mockup: Lista de Pruebas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  WELL TESTING                                              [+ Nueva Prueba] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Filtros: [Pozo ▼] [Tipo ▼] [Estado ▼] [Fecha desde] [Fecha hasta] [Buscar]│
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ ID     │ Pozo    │ Tipo       │ Fecha      │ Estado    │ Qo    │ Pwf  │ │
│  ├────────┼─────────┼────────────┼────────────┼───────────┼───────┼──────┤ │
│  │ WT-001 │ PDC-15  │ Production │ 2026-01-05 │ Completado│ 850   │ 1200 │ │
│  │ WT-002 │ PDC-23  │ Buildup    │ 2026-01-06 │ En curso  │ -     │ -    │ │
│  │ WT-003 │ TRU-08  │ Production │ 2026-01-07 │ Pendiente │ -     │ -    │ │
│  │ WT-004 │ PDC-15  │ Isochronal │ 2026-01-08 │ Análisis  │ 920   │ 1150 │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  Mostrando 1-4 de 156 pruebas                           [< 1 2 3 ... 39 >]  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Mockup: Gráfico IPR/VLP

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ANÁLISIS NODAL - PDC-15                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Pwf (psi)                                                                   │
│    │                                                                         │
│ 3000│                           Punto de                                    │
│    │   ╲                        Operación                                   │
│ 2500│    ╲  IPR                    ●──────────────────────                  │
│    │     ╲                        ╱                                         │
│ 2000│      ╲                    ╱                                           │
│    │       ╲                  ╱  VLP                                        │
│ 1500│        ╲              ╱                                               │
│    │         ╲            ╱                                                 │
│ 1000│          ╲        ╱                                                   │
│    │           ╲      ╱                                                     │
│  500│            ╲  ╱                                                       │
│    │             ╲╱                                                         │
│    └────────────────────────────────────────────────────────────────▶       │
│         200    400    600    800   1000   1200   1400   Qo (BOPD)           │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ Punto de Operación:  Qo = 850 BOPD  │  Pwf = 1,200 psi  │  WC = 25% │   │
│  │ AOF (IPR):  1,450 BOPD              │  Pr = 2,800 psi               │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  [Exportar PNG] [Exportar CSV] [Ajustar Parámetros] [Guardar Análisis]      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Integraciones

| Módulo | Tipo de Integración |
|--------|---------------------|
| **Yacimientos** | Datos PVT, propiedades de fluidos |
| **Well Management** | Datos de pozo, completación |
| **SCADA** | Lectura automática de sensores |
| **Inventario** | Equipos de prueba, consumibles |
| **Reportes** | Generación de documentos oficiales |

---

## Métricas de Éxito

| Métrica | Objetivo |
|---------|----------|
| Tiempo para registrar prueba | < 5 minutos |
| Generación de reporte | < 30 segundos |
| Precisión de cálculos IPR | ±5% vs software comercial |
| Adopción por operadores | > 80% de pruebas registradas |

---

## Próximos Pasos

1. Definir modelo de datos → `02_MODELO_DATOS.md`
2. Diseñar APIs → `03_APIS_ENDPOINTS.md`
3. Crear wireframes detallados → `04_INTERFAZ_USUARIO.md`
4. Documentar cálculos → `05_CALCULOS_INGENIERIA.md`

