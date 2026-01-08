# WELL TESTING - VISIÓN Y FUNCIONALIDADES

## 1. Visión del Módulo

### 1.1 Propósito

Proporcionar un sistema completo para **planificar, ejecutar y analizar pruebas de pozos** con capacidades profesionales comparables a software como Saphir, PanSystem y Topaze.

### 1.2 Usuarios Objetivo

| Rol | Necesidades |
|-----|-------------|
| **Ingeniero de Yacimientos** | Análisis de productividad, IPR/VLP, caracterización |
| **Ingeniero de Producción** | Optimización, troubleshooting, monitoreo |
| **Operador de Campo** | Captura de datos, ejecución de pruebas |
| **Supervisor** | Aprobación, reportes, KPIs |

---

## 2. Funcionalidades Detalladas

### 2.1 Gestión de Pruebas de Producción

#### 2.1.1 Captura de Datos

**Datos de entrada requeridos:**

| Campo | Unidad | Descripción |
|-------|--------|-------------|
| `well_id` | - | Pozo seleccionado |
| `test_date` | datetime | Fecha y hora de la prueba |
| `duration_hours` | hrs | Duración de la prueba |
| `choke_size` | /64" | Tamaño del estrangulador |
| `oil_rate` | BOPD | Tasa de petróleo |
| `water_rate` | BWPD | Tasa de agua |
| `gas_rate` | MSCFD | Tasa de gas |
| `tubing_pressure` | psi | Presión en cabeza (Pwh) |
| `casing_pressure` | psi | Presión en anular |
| `flowing_bhp` | psi | Presión de fondo fluyente (Pwf) |
| `temperature_wh` | °F | Temperatura en cabeza |
| `temperature_bh` | °F | Temperatura de fondo |
| `bsw` | % | Porcentaje de agua y sedimento |
| `api_gravity` | °API | Gravedad API del crudo |
| `gor` | scf/stb | Relación gas-petróleo |

**Datos calculados automáticamente:**

| Campo | Fórmula | Descripción |
|-------|---------|-------------|
| `liquid_rate` | Qo + Qw | Tasa total de líquidos |
| `water_cut` | Qw / (Qo + Qw) × 100 | Corte de agua |
| `oil_cut` | Qo / (Qo + Qw) × 100 | Corte de petróleo |
| `productivity_index` | Qo / (Pr - Pwf) | Índice de productividad |

#### 2.1.2 Validación de Datos

```
Reglas de validación:
├── oil_rate >= 0
├── water_rate >= 0
├── gas_rate >= 0
├── tubing_pressure > 0 AND < 15000
├── casing_pressure >= tubing_pressure
├── bsw >= 0 AND <= 100
├── api_gravity >= 5 AND <= 70
├── gor >= 0 AND < 100000
└── flowing_bhp > tubing_pressure
```

#### 2.1.3 Flujo de Estados

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ESTADOS DE PRUEBA                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │PLANIFICADO│───▶│EN CURSO │───▶│COMPLETADO│───▶│ANALIZADO│          │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘          │
│       │               │               │               │                 │
│       │               │               │               ▼                 │
│       │               │               │         ┌──────────┐           │
│       │               │               │         │APROBADO  │           │
│       │               │               │         └──────────┘           │
│       │               │               │               │                 │
│       ▼               ▼               │               ▼                 │
│  ┌──────────┐    ┌──────────┐        │         ┌──────────┐           │
│  │CANCELADO │    │SUSPENDIDO│────────┘         │REPORTADO │           │
│  └──────────┘    └──────────┘                  └──────────┘           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 2.2 Análisis IPR (Inflow Performance Relationship)

#### 2.2.1 Modelo de Vogel

Para pozos de petróleo por debajo del punto de burbuja:

```
Qo/Qmax = 1 - 0.2(Pwf/Pr) - 0.8(Pwf/Pr)²

Donde:
  Qo   = Tasa de petróleo a Pwf
  Qmax = Tasa máxima (AOF) a Pwf = 0
  Pwf  = Presión de fondo fluyente
  Pr   = Presión promedio del yacimiento
```

**Cálculo de AOF (Absolute Open Flow):**
```
Qmax = Qo_test / [1 - 0.2(Pwf_test/Pr) - 0.8(Pwf_test/Pr)²]
```

**Índice de Productividad (J) a Pr:**
```
J = 1.8 × Qmax / Pr
```

#### 2.2.2 Modelo de Fetkovitch (Gas)

```
Qg = C × (Pr² - Pwf²)^n

Donde:
  C = Coeficiente de flujo
  n = Exponente (0.5 < n < 1.0)
```

**Determinación de C y n:**
Requiere prueba multi-rate o isocronal.

#### 2.2.3 Modelo Compuesto

Para pozos con flujo bifásico (P < Pb):

```
Si Pwf >= Pb:
  Qo = J × (Pr - Pwf)  [Flujo lineal]

Si Pwf < Pb:
  Qo = J × (Pr - Pb) + (J × Pb / 1.8) × [1 - 0.2(Pwf/Pb) - 0.8(Pwf/Pb)²]
```

---

### 2.3 Análisis VLP (Vertical Lift Performance)

#### 2.3.1 Correlaciones Disponibles

| Correlación | Tipo | Aplicación |
|-------------|------|------------|
| **Beggs & Brill** | Empírica | Flujo multifásico general |
| **Hagedorn & Brown** | Empírica | Pozos verticales, petróleo |
| **Duns & Ros** | Empírica | Pozos verticales |
| **Orkiszewski** | Empírica | Flujo slug |
| **Gray** | Empírica | Pozos de gas |
| **Ansari** | Mecanística | Flujo multifásico avanzado |

#### 2.3.2 Variables de Entrada VLP

| Variable | Unidad | Descripción |
|----------|--------|-------------|
| `tubing_id` | in | Diámetro interno del tubing |
| `tubing_depth` | ft | Profundidad del tubing |
| `well_deviation` | ° | Desviación promedio |
| `surface_temperature` | °F | Temperatura en superficie |
| `bottom_temperature` | °F | Temperatura de fondo |
| `water_cut` | % | Corte de agua |
| `gor` | scf/stb | Relación gas-petróleo |
| `oil_api` | °API | Gravedad del crudo |
| `gas_sg` | - | Gravedad específica del gas |
| `water_sg` | - | Gravedad específica del agua |

#### 2.3.3 Cálculo de Gradiente de Presión

```
dP/dL = (dP/dL)_elevación + (dP/dL)_fricción + (dP/dL)_aceleración

(dP/dL)_elevación = ρ_m × g × sin(θ)
(dP/dL)_fricción = f × ρ_m × v² / (2 × D)
(dP/dL)_aceleración ≈ 0 (despreciable en la mayoría de casos)
```

---

### 2.4 Análisis Nodal (IPR + VLP)

#### 2.4.1 Punto de Operación

El punto de operación se encuentra donde IPR = VLP:

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  Pwf                                                         │
│   │                                                          │
│   │      IPR                                                 │
│   │   ╲                                                      │
│   │    ╲      Punto de Operación                            │
│   │     ╲         ●                                          │
│   │      ╲       ╱                                           │
│   │       ╲    ╱                                             │
│   │        ╲ ╱   VLP                                         │
│   │         ╳                                                │
│   │        ╱ ╲                                               │
│   │      ╱   ╲                                               │
│   └──────────────────────────────────────────────────▶ Q     │
│                                                              │
│   Q_op = Tasa de operación                                   │
│   Pwf_op = Presión de fondo en operación                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 2.4.2 Análisis de Sensibilidad

Permite evaluar el impacto de cambios en:
- Tamaño de tubing
- Presión de cabeza
- Corte de agua
- GOR
- Tipo de levantamiento artificial

---

### 2.5 Pruebas de Presión Transitoria

#### 2.5.1 Tipos de Pruebas

| Prueba | Descripción | Análisis |
|--------|-------------|----------|
| **Drawdown** | Flujo a tasa constante | Identificar régimen de flujo |
| **Buildup** | Cierre después de producción | kh, skin, límites |
| **Falloff** | Cierre después de inyección | Inyectores |
| **Interference** | Pulso entre pozos | Conectividad |

#### 2.5.2 Gráficos de Diagnóstico

**Gráfico Log-Log (Bourdet):**
- Presión vs tiempo en log-log
- Derivada de presión
- Identificación de regímenes de flujo

**Gráfico Horner:**
- Extrapolación a P* (presión inicial)
- Determinación de skin

**Gráfico Semilog:**
- Determinación de kh

#### 2.5.3 Parámetros Calculados

| Parámetro | Símbolo | Unidad | Descripción |
|-----------|---------|--------|-------------|
| Permeabilidad-espesor | kh | md.ft | Capacidad de flujo |
| Skin | S | - | Daño/estimulación |
| Wellbore Storage | C | bbl/psi | Almacenamiento |
| Presión inicial | Pi | psi | Presión del yacimiento |
| Radio de investigación | ri | ft | Alcance de la prueba |

---

## 3. Casos de Uso

### UC-01: Registrar Prueba de Producción

**Actor**: Operador de campo
**Precondiciones**: Pozo existe en el sistema
**Flujo principal**:
1. Seleccionar pozo
2. Crear nueva prueba
3. Ingresar datos de medición
4. Sistema valida datos
5. Guardar prueba
6. Sistema calcula parámetros derivados

### UC-02: Generar Curva IPR

**Actor**: Ingeniero de producción
**Precondiciones**: Prueba con datos de presión y tasa
**Flujo principal**:
1. Seleccionar prueba
2. Seleccionar modelo IPR (Vogel, Fetkovitch, etc.)
3. Ingresar Pr (presión de yacimiento)
4. Sistema genera curva IPR
5. Visualizar AOF, J
6. Exportar o guardar análisis

### UC-03: Análisis Nodal Completo

**Actor**: Ingeniero de yacimientos
**Precondiciones**: Datos PVT, datos de pozo, prueba de producción
**Flujo principal**:
1. Seleccionar pozo
2. Cargar datos PVT desde módulo Yacimientos
3. Configurar parámetros VLP
4. Seleccionar modelo IPR
5. Sistema calcula punto de operación
6. Realizar análisis de sensibilidad
7. Generar reporte

---

## 4. Requerimientos No Funcionales

| Requerimiento | Especificación |
|---------------|----------------|
| **Rendimiento** | Cálculo IPR/VLP < 2 segundos |
| **Precisión** | ±5% respecto a software comercial |
| **Disponibilidad** | 99.9% uptime |
| **Escalabilidad** | 10,000+ pruebas por pozo |
| **Usabilidad** | Operador capacitado en < 2 horas |

---

## 5. Entregables

| Fase | Entregable | Duración |
|------|------------|----------|
| **Fase 1** | CRUD de pruebas de producción | 2 semanas |
| **Fase 2** | Análisis IPR (Vogel, Fetkovitch) | 2 semanas |
| **Fase 3** | Análisis VLP (Beggs & Brill) | 2 semanas |
| **Fase 4** | Análisis Nodal integrado | 1 semana |
| **Fase 5** | Reportes y exportación | 1 semana |

**Total estimado: 8 semanas**

