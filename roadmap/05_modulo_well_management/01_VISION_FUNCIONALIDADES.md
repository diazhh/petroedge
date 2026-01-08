# WELL MANAGEMENT - VISIÓN Y FUNCIONALIDADES

## 1. Visión del Módulo

### 1.1 Propósito

Gestionar la **producción de pozos** desde la completación hasta el abandono, incluyendo monitoreo en tiempo real, optimización de sistemas de levantamiento artificial y análisis de desempeño.

### 1.2 Usuarios Objetivo

| Rol | Necesidades |
|-----|-------------|
| **Production Engineer** | Optimización, análisis, troubleshooting |
| **Field Operator** | Monitoreo, ajustes, reportes |
| **Reservoir Engineer** | DCA, pronósticos, reservas |
| **Operations Manager** | KPIs, costos, eficiencia |

---

## 2. Ciclo de Vida del Pozo Productor

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CICLO DE VIDA DEL POZO                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  COMPLETACIÓN ──▶ INICIO ──▶ PRODUCCIÓN ──▶ DECLINACIÓN ──▶ INTERVENCIÓN   │
│       │            │            │              │               │            │
│       ▼            ▼            ▼              ▼               ▼            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐   ┌─────────┐    ┌─────────┐       │
│  │Selección│  │ Puesta  │  │Monitoreo│   │Análisis │    │Workover │       │
│  │  A.L.   │  │en marcha│  │Continuo │   │   DCA   │    │   CT    │       │
│  └─────────┘  └─────────┘  └─────────┘   └─────────┘    └─────────┘       │
│       │                         │              │               │            │
│       │                         ▼              ▼               │            │
│       │                   ┌─────────┐    ┌─────────┐          │            │
│       └──────────────────▶│Optimiza-│    │Forecast │◀─────────┘            │
│                           │  ción   │    │         │                       │
│                           └─────────┘    └─────────┘                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Selección de Sistema de Levantamiento

### 3.1 Criterios de Selección

| Factor | ESP | Gas Lift | Rod Pump | PCP |
|--------|-----|----------|----------|-----|
| **Tasa alta (>1000 bpd)** | ✅ | ⚠️ | ❌ | ❌ |
| **Tasa baja (<100 bpd)** | ❌ | ✅ | ✅ | ✅ |
| **Pozo profundo (>10,000 ft)** | ⚠️ | ✅ | ⚠️ | ❌ |
| **Alto GOR** | ⚠️ | ✅ | ✅ | ❌ |
| **Corte de agua alto** | ✅ | ✅ | ✅ | ✅ |
| **Arena/sólidos** | ❌ | ✅ | ⚠️ | ✅ |
| **Crudo viscoso** | ❌ | ⚠️ | ✅ | ✅ |
| **Pozo desviado** | ⚠️ | ✅ | ❌ | ✅ |
| **Costo inicial** | Alto | Medio | Bajo | Medio |
| **Costo operativo** | Medio | Alto (gas) | Bajo | Bajo |

### 3.2 Árbol de Decisión

```
                            ┌─────────────────┐
                            │  ¿Tasa > 1000   │
                            │     BFPD?       │
                            └────────┬────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │ Sí             │                │ No
                    ▼                │                ▼
            ┌───────────────┐       │        ┌───────────────┐
            │  ¿GOR < 500?  │       │        │  ¿Crudo       │
            └───────┬───────┘       │        │   viscoso?    │
                    │               │        └───────┬───────┘
           ┌────────┼────────┐      │       ┌────────┼────────┐
           │ Sí     │        │ No   │       │ Sí     │        │ No
           ▼        │        ▼      │       ▼        │        ▼
        ┌─────┐     │    ┌──────┐   │    ┌─────┐     │    ┌──────┐
        │ ESP │     │    │ Gas  │   │    │ PCP │     │    │ Gas  │
        └─────┘     │    │ Lift │   │    │     │     │    │ Lift │
                    │    └──────┘   │    └─────┘     │    │  o   │
                    │               │                │    │Rod   │
                    │               │                │    │Pump  │
                    │               │                │    └──────┘
```

---

## 4. Monitoreo ESP

### 4.1 Parámetros Monitoreados

| Parámetro | Unidad | Fuente | Alarma Típica |
|-----------|--------|--------|---------------|
| **Frecuencia** | Hz | VSD | < 35 Hz, > 65 Hz |
| **Corriente Motor** | A | VSD | > 80% nominal |
| **Voltaje** | V | VSD | ±10% nominal |
| **Intake Pressure** | psi | Sensor BH | < NPSH mínimo |
| **Discharge Pressure** | psi | Sensor BH | Cambio >20% |
| **Motor Temp** | °F | Sensor BH | > 280°F |
| **Vibration** | g | Sensor BH | > 2g |
| **Wellhead Pressure** | psi | Surface | Cambio súbito |
| **Flow Rate** | bpd | Medidor | < 50% esperado |

### 4.2 Dashboard ESP

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ESP MONITORING - PDC-15                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Estado: 🟢 PRODUCIENDO     Run Life: 425 días     Última Alarma: 3 días   │
│                                                                              │
│  ┌─ VSD ───────────────────┐  ┌─ Motor ────────────────┐                   │
│  │                         │  │                         │                   │
│  │  Frecuencia: 52 Hz      │  │  Corriente: 45 A       │                   │
│  │  ████████████░░░ 65 Hz  │  │  ██████████░░░ 60 A    │                   │
│  │                         │  │                         │                   │
│  │  Voltaje: 2,400 V       │  │  Temperatura: 245°F    │                   │
│  │  OK ✅                  │  │  ████████░░░░ 300°F    │                   │
│  │                         │  │                         │                   │
│  └─────────────────────────┘  └─────────────────────────┘                   │
│                                                                              │
│  ┌─ Presiones ─────────────┐  ┌─ Producción ───────────┐                   │
│  │                         │  │                         │                   │
│  │  Intake: 850 psi        │  │  Petróleo: 1,250 BOPD  │                   │
│  │  Discharge: 2,100 psi   │  │  Agua: 320 BWPD        │                   │
│  │  ΔP Bomba: 1,250 psi    │  │  Gas: 580 MSCFD        │                   │
│  │                         │  │  WC: 20.4%             │                   │
│  │  WHP: 180 psi           │  │                         │                   │
│  │                         │  │                         │                   │
│  └─────────────────────────┘  └─────────────────────────┘                   │
│                                                                              │
│  ┌─ Curva de Bomba ────────────────────────────────────────────────────┐   │
│  │  Head (ft)                                                           │   │
│  │   6000│ ─────                                                        │   │
│  │   5000│      ─────    ● Punto Operación                             │   │
│  │   4000│           ─────●                                             │   │
│  │   3000│                 ─────                                        │   │
│  │   2000│                      ─────                                   │   │
│  │   1000│                           ─────                              │   │
│  │       └─────────────────────────────────────────▶ Flow (bpd)        │   │
│  │           500  1000  1500  2000  2500  3000                         │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  [Ajustar Frecuencia] [Ver Historial] [Generar Reporte] [Alarmas]           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Optimización de Frecuencia ESP

**Objetivo**: Maximizar producción sin dañar el equipo

```
Algoritmo de Optimización:
1. Calcular punto de operación actual en curva de bomba
2. Verificar que intake pressure > NPSH mínimo + margen
3. Verificar que motor temp < límite
4. Si hay margen: incrementar frecuencia 1-2 Hz
5. Monitorear respuesta por 24-48 hrs
6. Repetir hasta alcanzar límite
```

---

## 5. Monitoreo Gas Lift

### 5.1 Parámetros Monitoreados

| Parámetro | Unidad | Descripción |
|-----------|--------|-------------|
| **Gas Inyectado** | MSCFD | Tasa de inyección |
| **Presión Inyección** | psi | Presión en casing |
| **Presión Tubing** | psi | Presión de cabeza |
| **GLR Total** | scf/stb | Ratio gas-líquido |
| **Producción** | BFPD | Tasa de líquido |

### 5.2 Curva de Gas Lift

```
Producción (BFPD)
      │
 1400 │              ●────────●────────●
      │           ●                     ──●──────
 1200 │        ●                              ───●
      │     ●
 1000 │   ●                              Punto Óptimo
      │ ●                                     ↓
  800 │●                                ┌─────────┐
      │                                 │ 1,350   │
  600 │                                 │  BFPD   │
      │                                 │ @ 1.2   │
  400 │                                 │ MMSCFD  │
      │                                 └─────────┘
  200 │
      │
      └────────────────────────────────────────────▶ Gas Inyectado (MMSCFD)
          0.2   0.4   0.6   0.8   1.0   1.2   1.4   1.6
```

### 5.3 Optimización Gas Lift

**Objetivo**: Encontrar tasa de inyección óptima (máximo $/día)

```
Beneficio Neto = (Qo × Precio_crudo) - (Qg_iny × Costo_gas) - Otros_costos

Algoritmo:
1. Generar curva de producción vs gas inyectado
2. Calcular beneficio neto para cada punto
3. Encontrar máximo
4. Ajustar inyección al óptimo económico
```

---

## 6. Monitoreo Rod Pump

### 6.1 Cartas Dinamométricas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DYNAMOMETER CARD - PDC-23                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Load (lbs)                                                                  │
│      │                                                                       │
│ 8000 │    ╭────────────────────╮                                            │
│      │   ╱                      ╲                                           │
│ 6000 │  ╱                        ╲       Carta Ideal                        │
│      │ ╱                          ╲      ──────                             │
│ 4000 │╱                            ╲     Carta Real                         │
│      │                              ╲    ━━━━━━                             │
│ 2000 │                               ╲                                      │
│      │                                ╲                                     │
│    0 │╰────────────────────────────────╯                                    │
│      └──────────────────────────────────────────▶ Position (in)             │
│          0     20    40    60    80   100   120                             │
│                                                                              │
│  Diagnóstico: ⚠️ LLENADO PARCIAL (75%)                                      │
│  Recomendación: Reducir SPM de 8 a 6                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Patrones de Carta

| Patrón | Diagnóstico | Acción |
|--------|-------------|--------|
| **Rectangular** | Pump-off | Reducir velocidad |
| **Triangular** | Gas interference | Ancla de gas |
| **Errático** | Golpe de fluido | Ajustar espaciamiento |
| **Estrecho** | Varillas rotas | Inspeccionar |
| **Normal expandido** | Arenamiento | Limpiar |

---

## 7. Análisis de Declinación (DCA)

### 7.1 Tipos de Declinación

| Tipo | Exponente b | Ecuación | Aplicación |
|------|-------------|----------|------------|
| **Exponencial** | b = 0 | q = qi × e^(-Dt) | Empuje por agua |
| **Hiperbólico** | 0 < b < 1 | q = qi / (1+bDt)^(1/b) | General |
| **Armónico** | b = 1 | q = qi / (1+Dt) | Empuje por gas |

### 7.2 Cálculo de EUR

```
EUR (Exponencial) = qi / D

EUR (Hiperbólico) = qi × t_ab / (1-b) × [1 - (q_ab/qi)^(1-b)]

Donde:
  qi = Tasa inicial
  D = Decline rate
  b = Exponente
  t_ab = Tiempo de abandono
  q_ab = Tasa de abandono económico
```

---

## 8. Casos de Uso

### UC-01: Optimizar Pozo ESP

**Actor**: Production Engineer
**Flujo**:
1. Revisar parámetros actuales del ESP
2. Verificar márgenes (intake, temperatura)
3. Incrementar frecuencia 2 Hz
4. Monitorear respuesta 48 hrs
5. Registrar nuevo punto de operación
6. Repetir hasta optimizar

### UC-02: Diagnosticar Problema Rod Pump

**Actor**: Field Operator
**Flujo**:
1. Recibir alarma de baja producción
2. Revisar carta dinamométrica
3. Comparar con patrón normal
4. Identificar diagnóstico (pump-off, gas, etc.)
5. Aplicar acción correctiva
6. Verificar mejora

---

## 9. Modelo de Datos Simplificado

```sql
-- Instalaciones de producción
CREATE TABLE production_installations (
    id UUID PRIMARY KEY,
    well_id UUID REFERENCES wells(id),
    lift_type VARCHAR(20), -- ESP, GAS_LIFT, ROD_PUMP, PCP, NATURAL
    installation_date DATE,
    status VARCHAR(20)
);

-- Datos de producción diaria
CREATE TABLE daily_production (
    id UUID PRIMARY KEY,
    well_id UUID REFERENCES wells(id),
    production_date DATE,
    oil_rate_bopd DECIMAL(12,2),
    water_rate_bwpd DECIMAL(12,2),
    gas_rate_mscfd DECIMAL(12,2),
    hours_on DECIMAL(4,2),
    choke_size INTEGER
);

-- Datos ESP
CREATE TABLE esp_data (
    time TIMESTAMPTZ,
    well_id UUID,
    frequency_hz DECIMAL(6,2),
    current_amps DECIMAL(8,2),
    intake_pressure_psi DECIMAL(10,2),
    motor_temp_f DECIMAL(8,2),
    PRIMARY KEY (time, well_id)
);
```

---

## 10. Entregables

| Fase | Entregable | Duración |
|------|------------|----------|
| **1** | Dashboard de campo | 2 semanas |
| **2** | Monitoreo ESP completo | 3 semanas |
| **3** | Monitoreo Gas Lift | 2 semanas |
| **4** | Monitoreo Rod Pump + cartas | 3 semanas |
| **5** | Optimización automática | 2 semanas |
| **6** | DCA y pronósticos | 2 semanas |

**Total: 14 semanas**

