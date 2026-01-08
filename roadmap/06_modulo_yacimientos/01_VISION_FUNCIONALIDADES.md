# YACIMIENTOS - VISIÓN Y FUNCIONALIDADES

## 1. Visión del Módulo

### 1.1 Propósito

Proporcionar una **base de datos integral de yacimientos** con capacidades de análisis profesional para gestión de reservorios, comparable a software como OFM, MBAL y Petrel.

### 1.2 Usuarios Objetivo

| Rol | Necesidades |
|-----|-------------|
| **Reservoir Engineer** | PVT, balance materiales, reservas |
| **Geologist** | Datos geológicos, mapas |
| **Production Engineer** | Pronósticos, surveillance |
| **Asset Manager** | Reportes de reservas, valoración |

---

## 2. Base de Datos Jerárquica

### 2.1 Modelo de Datos

```sql
-- Cuencas
CREATE TABLE basins (
    id UUID PRIMARY KEY,
    name VARCHAR(100),
    country VARCHAR(50),
    area_km2 DECIMAL(12,2),
    basin_type VARCHAR(50)  -- FORELAND, RIFT, PASSIVE_MARGIN
);

-- Campos
CREATE TABLE fields (
    id UUID PRIMARY KEY,
    basin_id UUID REFERENCES basins(id),
    name VARCHAR(100),
    discovery_date DATE,
    operator VARCHAR(100),
    area_acres DECIMAL(12,2)
);

-- Yacimientos
CREATE TABLE reservoirs (
    id UUID PRIMARY KEY,
    field_id UUID REFERENCES fields(id),
    name VARCHAR(100),
    formation VARCHAR(100),
    lithology VARCHAR(50),
    depth_tvd_ft DECIMAL(10,2),
    net_pay_ft DECIMAL(10,2),
    porosity DECIMAL(5,4),
    permeability_md DECIMAL(10,2),
    water_saturation DECIMAL(5,4),
    initial_pressure_psi DECIMAL(10,2),
    temperature_f DECIMAL(8,2),
    drive_mechanism VARCHAR(50)
);
```

### 2.2 Propiedades del Yacimiento

| Categoría | Propiedades |
|-----------|-------------|
| **Geológicas** | Litología, formación, edad, ambiente |
| **Petrofísicas** | Porosidad, permeabilidad, Sw, NTG |
| **Presión/Temp** | Pi, Ti, gradientes |
| **Fluidos** | API, GOR, Pb, composición |
| **Volumétricas** | OOIP, OGIP, área, espesor |

---

## 3. Propiedades PVT

### 3.1 Datos de Laboratorio

```
INFORME PVT - LABORATORIO:
├── Información de Muestra
│   ├── Pozo de origen
│   ├── Profundidad de muestra
│   ├── Tipo (DST, separador, PVT cell)
│   └── Fecha de muestreo
│
├── Propiedades en Superficie
│   ├── API gravity
│   ├── GOR de separador
│   └── Gas gravity
│
├── Propiedades en Yacimiento
│   ├── Presión de burbuja (Pb)
│   ├── Bo @ Pb
│   ├── Rs @ Pb
│   └── Viscosidad @ Pb
│
├── Liberación Diferencial
│   └── Tablas: P, Bo, Rs, Bg, μo, μg, Z
│
└── Pruebas de Separador
    └── Etapas, P, T, GOR, API
```

### 3.2 Correlaciones Implementadas

#### Presión de Burbuja

**Standing (1947):**
```
Pb = 18.2 × [(Rs/γg)^0.83 × 10^(0.00091×T - 0.0125×API) - 1.4]
```

**Vazquez-Beggs (1980):**
```
API ≤ 30: Pb = (Rs / (C1×γg×exp(C3×API/(T+460))))^(1/C2)
          C1=0.0362, C2=1.0937, C3=25.724

API > 30: C1=0.0178, C2=1.187, C3=23.931
```

#### Factor Volumétrico del Petróleo

**Standing:**
```
Bo = 0.9759 + 0.00012 × [Rs×(γg/γo)^0.5 + 1.25×T]^1.2
```

#### Viscosidad

**Beggs-Robinson (Dead Oil):**
```
μod = 10^x - 1
x = 10^(3.0324 - 0.02023×API) × T^(-1.163)
```

**Beggs-Robinson (Live Oil):**
```
μo = A × μod^B
A = 10.715 × (Rs + 100)^(-0.515)
B = 5.44 × (Rs + 150)^(-0.338)
```

---

## 4. Balance de Materiales

### 4.1 Ecuación General

```
F = N × Eo + Gfgi × Eg + N×m×Bti/Bgi × (Bg-Bgi) + (1+m)×N×Bti × (cw×Sw+cf)/(1-Swi) × ΔP + We

Simplificado (Havlena-Odeh):
F = N × Et + We

Donde:
  F = Np×Bo + (Gp-Np×Rs)×Bg + Wp×Bw  [Underground Withdrawal]
  Et = Eo + m×Eg + Efw               [Total Expansion]
  We = Entrada de agua
```

### 4.2 Identificación de Mecanismo de Empuje

| Mecanismo | Características | Gráfico F vs Et |
|-----------|-----------------|-----------------|
| **Depleción (volumétrico)** | F/Et = constante = N | Línea por origen |
| **Gas cap** | m > 0 | Línea con pendiente |
| **Acuífero** | We > 0 | Curva hacia arriba |
| **Combinado** | Múltiples | Análisis iterativo |

### 4.3 Modelos de Acuífero

| Modelo | Aplicación |
|--------|------------|
| **Schilthuis** | Acuífero infinito, estado estable |
| **Hurst-van Everdingen** | Acuífero radial, transitorio |
| **Fetkovich** | Pseudo-estado estable |
| **Carter-Tracy** | Aproximación práctica |

---

## 5. Estimación de Reservas

### 5.1 Clasificación PRMS/SEC

| Categoría | Probabilidad | Descripción |
|-----------|--------------|-------------|
| **1P (Proved)** | ≥90% (P90) | Razonable certeza |
| **2P (Proved+Probable)** | ≥50% (P50) | Probable adicional |
| **3P (Proved+Probable+Possible)** | ≥10% (P10) | Posible adicional |

**Subcategorías Proved:**
- **PDP**: Proved Developed Producing
- **PDNP**: Proved Developed Non-Producing
- **PUD**: Proved Undeveloped

### 5.2 Método Volumétrico

```
OOIP = 7758 × A × h × φ × (1 - Sw) / Boi

Reservas = OOIP × RF

Donde:
  7758 = acre-ft a bbl
  A = Área (acres)
  h = Espesor neto (ft)
  φ = Porosidad (fracción)
  Sw = Saturación de agua
  Boi = Factor volumétrico inicial
  RF = Factor de recobro
```

### 5.3 Decline Curve Analysis

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DECLINE CURVE ANALYSIS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Log(q)                                                                      │
│    │                                                                         │
│  3.0│●                                                                       │
│    │ ●●                                                                      │
│  2.5│   ●●●                                                                  │
│    │      ●●●●                                                               │
│  2.0│          ●●●●●                                                         │
│    │               ●●●●●●                                                    │
│  1.5│                    ●●●●●●●●                                            │
│    │                           ●●●●●●●●●●                                    │
│  1.0│                                   ●●●●●●●●●●●●●                        │
│    │                                                ────────  Pronóstico    │
│  0.5│                                                                        │
│    │                                                                         │
│    └───────────────────────────────────────────────────────────▶ t (meses)  │
│        12   24   36   48   60   72   84   96  108  120                      │
│                                                                              │
│  Parámetros Ajustados:                                                       │
│  qi = 1,200 BOPD    Di = 15%/año    b = 0.8                                 │
│                                                                              │
│  EUR = 2.45 MMbbl    Remaining = 1.82 MMbbl                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Pronósticos de Producción

### 6.1 Parámetros de Entrada

| Parámetro | Descripción |
|-----------|-------------|
| **qi** | Tasa inicial (BOPD) |
| **Di** | Decline rate inicial (%/año) |
| **b** | Exponente de Arps (0-1) |
| **Dmin** | Decline mínimo (terminal) |
| **qec** | Tasa económica límite |

### 6.2 Escenarios

| Escenario | Descripción | Uso |
|-----------|-------------|-----|
| **Base** | Parámetros ajustados | Planificación |
| **Optimista (P10)** | Mejor performance | Upside |
| **Pesimista (P90)** | Peor performance | Riesgo |

---

## 7. Visualización y Mapas

### 7.1 Tipos de Mapas

| Mapa | Descripción |
|------|-------------|
| **Bubble Map** | Producción acumulada/actual por pozo |
| **Isobáricas** | Contornos de presión de yacimiento |
| **Isosaturación** | Distribución de WC, GOR |
| **EUR Map** | Reservas remanentes |
| **Rate Map** | Tasas actuales |

### 7.2 Gráficos de Surveillance

- Producción vs tiempo (todos los pozos)
- Presión de yacimiento vs tiempo
- WC vs recuperación acumulada
- GOR vs recuperación
- Hall plot (inyectores)
- Chan plot (diagnóstico de agua)

---

## 8. Casos de Uso

### UC-01: Crear Estudio PVT

**Actor**: Reservoir Engineer
**Flujo**:
1. Cargar datos de laboratorio
2. Validar consistencia
3. Aplicar correlaciones faltantes
4. Generar tablas Black Oil
5. Asociar a yacimiento

### UC-02: Calcular OOIP por Balance de Materiales

**Actor**: Reservoir Engineer
**Flujo**:
1. Seleccionar yacimiento
2. Cargar historial de presión-producción
3. Calcular F, Eo, Eg para cada punto
4. Graficar Havlena-Odeh
5. Ajustar N y We (si aplica)
6. Reportar OOIP estimado

### UC-03: Generar Pronóstico DCA

**Actor**: Production Engineer
**Flujo**:
1. Seleccionar pozo
2. Cargar historial de producción
3. Ajustar parámetros de Arps
4. Generar pronóstico hasta límite económico
5. Calcular EUR
6. Comparar con volumétrico

---

## 9. Entregables

| Fase | Entregable | Duración |
|------|------------|----------|
| **1** | Base de datos jerárquica | 2 semanas |
| **2** | Módulo PVT completo | 3 semanas |
| **3** | Balance de materiales | 3 semanas |
| **4** | DCA y pronósticos | 2 semanas |
| **5** | Mapas y visualización | 2 semanas |

**Total: 12 semanas**

