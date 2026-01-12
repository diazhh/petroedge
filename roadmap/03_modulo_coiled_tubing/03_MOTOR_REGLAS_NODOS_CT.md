# BLOQUE 3: MOTOR DE REGLAS Y NODOS CT

> **Módulo**: Coiled Tubing  
> **Fase**: Implementación de Nodos Específicos en Rule Engine  
> **Duración estimada**: 2-3 semanas  
> **Prioridad**: 🔴 CRÍTICA (Lógica de negocio y cálculos)

---

## 📋 ÍNDICE

1. [Integración con Rule Engine](#integración-con-rule-engine)
2. [Nodos CT Específicos](#nodos-ct-específicos)
3. [Reglas Pre-configuradas](#reglas-pre-configuradas)
4. [Cálculos en Node.js vs Python](#cálculos-en-nodejs-vs-python)
5. [Ejemplos de Reglas](#ejemplos-de-reglas)
6. [Implementación](#implementación)

---

## 1. INTEGRACIÓN CON RULE ENGINE

### 1.1 ¿Qué es el Rule Engine?

El **Rule Engine** es un motor visual de reglas estilo Node-RED que permite:
- Procesar telemetría en tiempo real
- Ejecutar cálculos
- Detectar condiciones de alarma
- Enriquecer datos
- Tomar acciones automáticas

**Ubicación**: `http://localhost:5173/rule-engine`

### 1.2 ¿Dónde Entran las Reglas CT?

```
┌─────────────────────────────────────────────────────────────────────┐
│              FLUJO DE PROCESAMIENTO CON RULE ENGINE                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Kafka: scada.telemetry.raw                                          │
│         ↓                                                            │
│  TelemetryConsumerService                                            │
│         ↓                                                            │
│  Device Binding lookup                                               │
│         ↓                                                            │
│  Connectivity Profile → ruleChainId                                  │
│         ↓                                                            │
│  ┌──────────────────────────────────────────────────┐               │
│  │  RULE CHAIN: "CT Realtime Processing"           │               │
│  ├──────────────────────────────────────────────────┤               │
│  │                                                   │               │
│  │  [INPUT] → [CT_FATIGUE_CALC] → [CT_ALARM_CHECK] │               │
│  │              ↓                    ↓               │               │
│  │         Update Asset      Create Alarms          │               │
│  │                                                   │               │
│  └──────────────────────────────────────────────────┘               │
│         ↓                                                            │
│  asset_telemetry + alarms + computed_fields                          │
│         ↓                                                            │
│  WebSocket → Frontend                                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**CLAVE**: Las reglas se ejecutan **ANTES** de guardar en `asset_telemetry`, lo que permite:
1. Calcular fatiga en tiempo real
2. Detectar alarmas inmediatamente
3. Enriquecer datos con contexto del job
4. Validar límites operacionales

---

## 2. NODOS CT ESPECÍFICOS

### 2.1 Listado de Nodos a Implementar

| Nodo | Tipo | Propósito | Complejidad |
|------|------|-----------|-------------|
| `CT_FATIGUE_CALC` | Transform | Calcular fatiga acumulada | Media |
| `CT_BUCKLING_CHECK` | Transform | Verificar riesgo de buckling | Alta |
| `CT_LOCKUP_PREDICT` | Transform | Predecir lockup depth | Alta (Python) |
| `CT_ALARM_CHECK` | Condition | Evaluar condiciones de alarma | Baja |
| `CT_JOB_ENRICHMENT` | Transform | Agregar contexto del job activo | Baja |
| `CT_STRAIN_CALC` | Transform | Calcular strain por flexión | Media |
| `CT_HYDRAULICS_CALC` | Transform | Cálculos hidráulicos | Alta (Python) |
| `CT_GET_REEL_SECTION` | Transform | Identificar sección del reel | Baja |
| `CT_UPDATE_CYCLES` | Action | Actualizar contadores de ciclos | Baja |
| `CT_NOTIFY_FATIGUE` | Action | Notificar fatiga crítica | Baja |

### 2.2 Nodo: CT_FATIGUE_CALC

**Propósito**: Calcular incremento de fatiga en tiempo real usando Regla de Miner

**Inputs**:
- `depthFt`: Profundidad actual
- `pumpPressurePsi`: Presión de bomba
- `assetId`: ID del reel

**Configuración UI**:
```json
{
  "guideRadiusIn": 36,
  "safetyFactor": 0.75,
  "updateInterval": "PER_CYCLE"
}
```

**Lógica (TypeScript)**:
```typescript
async function processCT_FATIGUE_CALC(msg: RuleMessage, config: any) {
  const { depthFt, pumpPressurePsi, assetId } = msg;
  
  // 1. Obtener asset (reel)
  const reel = await assetsRepository.findById(assetId);
  const { outerDiameterIn, steelGrade, yieldStrengthPsi } = reel.properties;
  
  // 2. Calcular strain por flexión
  const strain = outerDiameterIn / (2 * config.guideRadiusIn);
  
  // 3. Ciclos hasta falla (modelo S-N simplificado)
  const params = STEEL_GRADE_PARAMS[steelGrade]; // {a: 4.5, b: 100} para CT90
  const Nf = Math.pow(10, params.a - params.b * strain);
  
  // 4. Daño por flexión (1 ciclo de RIH/POOH = ~6 flexiones)
  const bendingDamage = (6 / Nf);
  
  // 5. Daño por presión
  let pressureDamage = 0;
  if (pumpPressurePsi > 4000) {
    const pressureFactor = 1.0 + 0.3 * (pumpPressurePsi / (yieldStrengthPsi * 0.8));
    pressureDamage = bendingDamage * (pressureFactor - 1);
  }
  
  // 6. Daño total (Regla de Miner)
  const totalDamage = (bendingDamage + pressureDamage) * config.safetyFactor;
  
  // 7. Actualizar fatigue en asset attributes
  const currentFatigue = reel.attributes.fatiguePercentage || 0;
  const newFatigue = Math.min(100, currentFatigue + (totalDamage * 100));
  
  await assetsRepository.updateAttributes(assetId, {
    fatiguePercentage: newFatigue,
    totalCycles: (reel.attributes.totalCycles || 0) + 1,
    lastFatigueCalculation: new Date()
  });
  
  // 8. Output para siguiente nodo
  return {
    ...msg,
    computed: {
      fatigueIncrement: totalDamage * 100,
      newFatiguePercent: newFatigue,
      strain: strain,
      estimatedLifeCycles: Nf
    }
  };
}
```

**Outputs**:
- `fatigueIncrement`: Incremento de fatiga (%)
- `newFatiguePercent`: Fatiga total actualizada (%)
- `strain`: Strain calculado
- `estimatedLifeCycles`: Ciclos estimados hasta falla

---

### 2.3 Nodo: CT_ALARM_CHECK

**Propósito**: Evaluar múltiples condiciones de alarma en un solo nodo

**Inputs**:
- `surfaceWeightLbs`: Peso indicador
- `pumpPressurePsi`: Presión de bomba
- `speedFtMin`: Velocidad
- `annulusPressurePsi`: Presión anular
- `fatiguePercent`: Fatiga del reel

**Configuración UI**:
```json
{
  "alarms": [
    {
      "type": "OVERPULL",
      "condition": "surfaceWeightLbs > pickupLimit",
      "severity": "CRITICAL",
      "message": "Overpull detected: {{surfaceWeightLbs}} lbs (limit: {{pickupLimit}})"
    },
    {
      "type": "SLACK_OFF",
      "condition": "surfaceWeightLbs < slackoffLimit",
      "severity": "HIGH",
      "message": "Slack-off detected: {{surfaceWeightLbs}} lbs"
    },
    {
      "type": "HIGH_PUMP_PRESSURE",
      "condition": "pumpPressurePsi > maxPumpPressure",
      "severity": "CRITICAL",
      "message": "Pump pressure critical: {{pumpPressurePsi}} psi"
    },
    {
      "type": "FATIGUE_CRITICAL",
      "condition": "fatiguePercent > 85",
      "severity": "CRITICAL",
      "message": "Reel fatigue critical: {{fatiguePercent}}%"
    }
  ],
  "pickupLimit": 8000,
  "slackoffLimit": -5000,
  "maxPumpPressure": 5000
}
```

**Lógica**:
```typescript
async function processCT_ALARM_CHECK(msg: RuleMessage, config: any) {
  const triggeredAlarms = [];
  
  for (const alarmDef of config.alarms) {
    // Evaluar condición usando mathjs
    const context = { ...msg, ...config };
    const isTriggered = math.evaluate(alarmDef.condition, context);
    
    if (isTriggered) {
      // Verificar si ya existe alarma activa del mismo tipo
      const existingAlarm = await alarmsRepository.findActive({
        assetId: msg.assetId,
        alarmType: alarmDef.type
      });
      
      if (!existingAlarm) {
        // Crear nueva alarma
        const alarm = await alarmsRepository.create({
          tenantId: msg.tenantId,
          assetId: msg.assetId,
          alarmType: alarmDef.type,
          severity: alarmDef.severity,
          message: interpolate(alarmDef.message, context),
          triggeredAt: new Date(),
          status: 'ACTIVE'
        });
        
        triggeredAlarms.push(alarm);
      }
    }
  }
  
  return {
    ...msg,
    alarms: triggeredAlarms
  };
}
```

---

### 2.4 Nodo: CT_BUCKLING_CHECK

**Propósito**: Calcular carga crítica de buckling según Dawson-Paslay

**Inputs**:
- `depthFt`: Profundidad actual
- `inclinationDeg`: Ángulo de inclinación
- `wellboreDiameterIn`: Diámetro del pozo

**Configuración UI**:
```json
{
  "tubing": {
    "outerDiameterIn": 1.75,
    "wallThicknessIn": 0.134,
    "weightPerFtLbs": 2.35
  },
  "fluidDensityPpg": 8.5,
  "youngsModulusPsi": 30000000
}
```

**Lógica (Node.js - cálculo simple)**:
```typescript
async function processCT_BUCKLING_CHECK(msg: RuleMessage, config: any) {
  const { depthFt, inclinationDeg, wellboreDiameterIn } = msg;
  const { tubing, fluidDensityPpg, youngsModulusPsi } = config;
  
  // Momento de inercia
  const OD = tubing.outerDiameterIn;
  const ID = OD - 2 * tubing.wallThicknessIn;
  const I = (Math.PI / 64) * (Math.pow(OD, 4) - Math.pow(ID, 4));
  
  // Peso flotado
  const buoyancyFactor = 1 - (fluidDensityPpg * 0.052 / 7.85); // 7.85 = densidad acero
  const Wb = tubing.weightPerFtLbs * buoyancyFactor;
  
  // Ángulo en radianes
  const theta = inclinationDeg * Math.PI / 180;
  
  // Radio del wellbore
  const r = wellboreDiameterIn / 2;
  
  // Carga crítica sinusoidal (Dawson-Paslay)
  const F_cr_sin = 2 * Math.sqrt(youngsModulusPsi * I * Wb * Math.sin(theta) / r);
  
  // Carga crítica helicoidal
  const F_cr_hel = Math.sqrt(2) * F_cr_sin;
  
  // Verificar si hay buckling
  const currentLoad = msg.surfaceWeightLbs || 0;
  const bucklingRisk = currentLoad < -F_cr_sin;
  
  return {
    ...msg,
    computed: {
      criticalLoadSinusoidalLbs: F_cr_sin,
      criticalLoadHelicalLbs: F_cr_hel,
      currentLoad: currentLoad,
      bucklingRisk: bucklingRisk,
      safetyMargin: Math.abs(currentLoad) / F_cr_sin
    }
  };
}
```

---

### 2.5 Nodo: CT_LOCKUP_PREDICT (Python)

**Propósito**: Predicción avanzada de lockup usando modelos de fricción

**NOTA**: Este nodo **delega a Python Calculation Service** porque requiere:
- Simulación iterativa de fuerzas
- Modelos de fricción complejos
- Optimización numérica

**Lógica (Node.js - nodo que llama a Python)**:
```typescript
async function processCT_LOCKUP_PREDICT(msg: RuleMessage, config: any) {
  // Preparar request para Python
  const calculationRequest = {
    calculationType: 'CT_LOCKUP_PREDICTION',
    inputs: {
      wellTrajectory: config.wellTrajectory, // [[md, inc, azi], ...]
      tubingSpecs: config.tubing,
      fluidDensityPpg: config.fluidDensityPpg,
      frictionCoefficient: config.frictionCoefficient || 0.25,
      targetDepthFt: msg.depthFt + 5000 // Predecir 5000 ft adelante
    },
    tenantId: msg.tenantId
  };
  
  // Publicar a Kafka topic: calculation.request
  await kafkaService.publish('calculation.request', calculationRequest);
  
  // Esperar respuesta (con timeout)
  const result = await waitForCalculationResult(
    calculationRequest.id,
    { timeout: 5000 }
  );
  
  return {
    ...msg,
    computed: {
      lockupDepthFt: result.lockupDepthFt,
      maxDepthReachable: result.maxDepthReachable,
      pickupForceAtDepth: result.pickupForceAtDepth,
      slackoffForceAtDepth: result.slackoffForceAtDepth,
      broomstickCurve: result.broomstickCurve // [[depth, pickup, slackoff], ...]
    }
  };
}
```

**Python Service** (`calculation-service/ct_calculations.py`):
```python
import numpy as np
from scipy.integrate import odeint

def calculate_lockup_prediction(inputs):
    """
    Simula fuerzas de pickup/slackoff a lo largo del wellbore
    usando ecuaciones diferenciales de torque & drag
    """
    trajectory = np.array(inputs['wellTrajectory'])
    tubing = inputs['tubingSpecs']
    mu = inputs['frictionCoefficient']
    rho_fluid = inputs['fluidDensityPpg']
    
    # Algoritmo simplificado de Torque & Drag
    # (en producción usar modelo completo con soft string)
    
    depths = trajectory[:, 0]
    inclinations = trajectory[:, 1]
    
    pickup_forces = []
    slackoff_forces = []
    
    for i, depth in enumerate(depths):
        inc = inclinations[i]
        
        # Peso flotado
        w_b = tubing['weightPerFtLbs'] * (1 - rho_fluid * 0.052 / 7.85)
        
        # Fuerza de fricción acumulada
        if i == 0:
            F_friction = 0
        else:
            delta_inc = abs(inclinations[i] - inclinations[i-1])
            N = w_b * np.cos(np.radians(inc)) * delta_inc
            F_friction += mu * N
        
        # Pickup (pulling out)
        F_pickup = w_b * depth + F_friction
        
        # Slackoff (running in)
        F_slackoff = w_b * depth - F_friction
        
        pickup_forces.append(F_pickup)
        slackoff_forces.append(F_slackoff)
    
    # Detectar lockup (cuando pickup > límite o slackoff < límite crítico)
    lockup_idx = np.where(np.array(pickup_forces) > tubing['maxTensionLbs'])[0]
    
    lockup_depth = depths[lockup_idx[0]] if len(lockup_idx) > 0 else depths[-1]
    
    # Generar curva broomstick
    broomstick = [[float(d), float(p), float(s)] 
                  for d, p, s in zip(depths, pickup_forces, slackoff_forces)]
    
    return {
        'lockupDepthFt': float(lockup_depth),
        'maxDepthReachable': float(depths[-1]) if len(lockup_idx) == 0 else float(lockup_depth),
        'pickupForceAtDepth': pickup_forces,
        'slackoffForceAtDepth': slackoff_forces,
        'broomstickCurve': broomstick
    }
```

---

## 3. REGLAS PRE-CONFIGURADAS

### 3.1 Rule Chain: "CT Realtime Processing"

Esta regla se ejecuta **automáticamente** para TODA la telemetría de CT.

**Flujo Visual** (en React Flow):

```
┌────────────────────────────────────────────────────────────────────┐
│                  CT REALTIME PROCESSING RULE                        │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [TRIGGER: Telemetry Change]                                       │
│         ↓                                                           │
│  [CT_JOB_ENRICHMENT]  ← Agregar jobId activo, wellId               │
│         ↓                                                           │
│  [CT_GET_REEL_SECTION]  ← Identificar sección por profundidad      │
│         ↓                                                           │
│  [SWITCH: Operation Mode]                                           │
│         ↓                                                           │
│    ┌────┴────┬─────────────┬─────────────┐                        │
│    ↓         ↓             ↓             ↓                         │
│  [RIH]    [POOH]      [CIRCULATING]  [IDLE]                        │
│    ↓         ↓             ↓             ↓                         │
│  [CT_FATIGUE_CALC]  (solo RIH/POOH)                                │
│    ↓         ↓                                                      │
│  [CT_UPDATE_CYCLES]                                                 │
│         ↓                                                           │
│  [CT_ALARM_CHECK]  ← Evaluar TODAS las alarmas                     │
│         ↓                                                           │
│  [IF: Alarms Triggered]                                             │
│         ↓                                                           │
│    [CREATE_ALARM]                                                   │
│    [CT_NOTIFY_FATIGUE]  (si fatiga >85%)                           │
│         ↓                                                           │
│  [SAVE_TO_TELEMETRY]  ← Guardar en asset_telemetry                 │
│         ↓                                                           │
│  [WEBSOCKET_BROADCAST]  ← Enviar a frontend                        │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

**Configuración JSON** (para importar):
```json
{
  "name": "CT Realtime Processing",
  "description": "Procesamiento en tiempo real de telemetría CT con cálculos de fatiga y alarmas",
  "appliesToAssetTypes": ["CT_UNIT", "CT_REEL"],
  "triggerType": "TELEMETRY_CHANGE",
  "status": "ACTIVE",
  
  "nodes": [
    {
      "id": "node-1",
      "type": "TRIGGER",
      "subtype": "telemetry_change",
      "config": {
        "telemetryKeys": ["currentDepth", "surfaceWeight", "pumpPressure"]
      },
      "position": { "x": 100, "y": 100 }
    },
    {
      "id": "node-2",
      "type": "TRANSFORM",
      "subtype": "CT_JOB_ENRICHMENT",
      "config": {},
      "position": { "x": 100, "y": 200 }
    },
    {
      "id": "node-3",
      "type": "TRANSFORM",
      "subtype": "CT_GET_REEL_SECTION",
      "config": {},
      "position": { "x": 100, "y": 300 }
    },
    {
      "id": "node-4",
      "type": "CONDITION",
      "subtype": "SWITCH",
      "config": {
        "expression": "msg.operatingMode",
        "cases": ["RIH", "POOH", "CIRCULATING", "IDLE"]
      },
      "position": { "x": 100, "y": 400 }
    },
    {
      "id": "node-5",
      "type": "TRANSFORM",
      "subtype": "CT_FATIGUE_CALC",
      "config": {
        "guideRadiusIn": 36,
        "safetyFactor": 0.75
      },
      "position": { "x": 100, "y": 500 }
    },
    // ... resto de nodos
  ],
  
  "connections": [
    { "from": "node-1", "to": "node-2" },
    { "from": "node-2", "to": "node-3" },
    // ...
  ]
}
```

---

### 3.2 Rule Chain: "CT Fatigue Critical Alert"

**Propósito**: Detectar fatiga crítica y notificar

```
[TRIGGER: Attribute Change - fatiguePercentage]
    ↓
[IF: fatiguePercentage > 85]
    ↓
[CREATE_ALARM: FATIGUE_CRITICAL]
    ↓
[SEND_EMAIL: Maintenance Team]
    ↓
[SEND_SMS: CT Supervisor]
    ↓
[UPDATE_ATTRIBUTE: needsMaintenanceFlag = true]
```

---

### 3.3 Rule Chain: "CT Daily Summary"

**Propósito**: Generar resumen diario de operaciones

```
[TRIGGER: Schedule - Daily 06:00]
    ↓
[QUERY_ASSETS: type = CT_REEL]
    ↓
[FOREACH: reels]
    ↓
    [AGGREGATE_TELEMETRY: last 24h]
    ↓
    [CALCULATE: total cycles, max fatigue increment]
    ↓
[GENERATE_REPORT: PDF]
    ↓
[SEND_EMAIL: Operations Manager]
```

---

## 4. CÁLCULOS EN NODE.JS VS PYTHON

### 4.1 Criterios de Decisión

| Cálculo | Runtime | Justificación |
|---------|---------|---------------|
| **Fatiga incremental** | Node.js | Rápido, fórmula simple, <1ms |
| **Strain por flexión** | Node.js | Fórmula directa |
| **Alarmas (thresholds)** | Node.js | Comparaciones simples |
| **Buckling (Dawson-Paslay)** | Node.js | Fórmula analítica, <5ms |
| **Lockup prediction** | Python | Simulación iterativa, modelo complejo |
| **Hidráulica completa** | Python | Reynolds, fricción, ECD, >50ms |
| **Optimización BHA** | Python | Scipy.optimize, ML |
| **Decline curve fitting** | Python | Regression, curve fitting |

### 4.2 Latencia Objetivo

- **Node.js**: <10ms por mensaje (para mantener throughput >10K msg/s)
- **Python**: <100ms por cálculo (para casos específicos)

### 4.3 Patrón de Integración

**Asíncrono** (recomendado para RT):
```typescript
// Nodo Node.js publica a Kafka
await kafka.publish('calculation.request', {
  id: 'calc-123',
  type: 'CT_LOCKUP_PREDICTION',
  inputs: {...}
});

// NO espera respuesta, continúa flujo
// Python responde vía Kafka: 'calculation.result'
// Frontend se suscribe a ese topic vía WebSocket
```

**Síncrono** (solo para cálculos ON-DEMAND desde UI):
```typescript
// API endpoint
app.post('/api/v1/ct/calculate-lockup', async (req, res) => {
  const result = await pythonCalcService.calculateLockup(req.body);
  res.json(result);
});
```

---

## 5. EJEMPLOS DE REGLAS

### 5.1 Ejemplo Completo: Regla de Fatiga

**JSON Export** (para seed):
```json
{
  "name": "CT Fatigue Monitoring - Comprehensive",
  "description": "Monitoreo continuo de fatiga con alertas progresivas",
  "version": "1.0",
  "appliesToAssetTypes": ["CT_REEL"],
  "triggerType": "TELEMETRY_CHANGE",
  "status": "ACTIVE",
  
  "ruleDefinition": {
    "nodes": [
      {
        "id": "trigger",
        "type": "telemetry_change",
        "config": {
          "telemetryKeys": ["currentDepth", "pumpPressure"]
        }
      },
      {
        "id": "calc-fatigue",
        "type": "CT_FATIGUE_CALC",
        "config": {
          "guideRadiusIn": 36,
          "safetyFactor": 0.75,
          "updateInterval": "PER_CYCLE"
        }
      },
      {
        "id": "check-warning",
        "type": "if",
        "config": {
          "condition": "computed.newFatiguePercent > 75 && computed.newFatiguePercent <= 85"
        }
      },
      {
        "id": "alarm-warning",
        "type": "create_alarm",
        "config": {
          "alarmType": "FATIGUE_WARNING",
          "severity": "MEDIUM",
          "message": "Reel {{assetCode}} fatigue at {{computed.newFatiguePercent}}% - Consider cutting soon"
        }
      },
      {
        "id": "check-critical",
        "type": "if",
        "config": {
          "condition": "computed.newFatiguePercent > 85"
        }
      },
      {
        "id": "alarm-critical",
        "type": "create_alarm",
        "config": {
          "alarmType": "FATIGUE_CRITICAL",
          "severity": "CRITICAL",
          "message": "CRITICAL: Reel {{assetCode}} fatigue at {{computed.newFatiguePercent}}% - IMMEDIATE cutting required"
        }
      },
      {
        "id": "notify-email",
        "type": "send_email",
        "config": {
          "to": "ct-supervisor@company.com",
          "subject": "CRITICAL: Reel Fatigue Alert",
          "template": "ct-fatigue-critical"
        }
      }
    ],
    "connections": [
      { "from": "trigger", "to": "calc-fatigue" },
      { "from": "calc-fatigue", "to": "check-warning" },
      { "from": "check-warning:true", "to": "alarm-warning" },
      { "from": "calc-fatigue", "to": "check-critical" },
      { "from": "check-critical:true", "to": "alarm-critical" },
      { "from": "alarm-critical", "to": "notify-email" }
    ]
  }
}
```

---

## 6. IMPLEMENTACIÓN

### 6.1 Checklist de Desarrollo

**Nodos CT** (10 nodos):
- [ ] `CT_FATIGUE_CALC` - Cálculo de fatiga
- [ ] `CT_ALARM_CHECK` - Evaluación de alarmas
- [ ] `CT_BUCKLING_CHECK` - Verificación buckling
- [ ] `CT_LOCKUP_PREDICT` - Predicción lockup (Python)
- [ ] `CT_JOB_ENRICHMENT` - Enriquecimiento
- [ ] `CT_STRAIN_CALC` - Cálculo strain
- [ ] `CT_HYDRAULICS_CALC` - Hidráulica (Python)
- [ ] `CT_GET_REEL_SECTION` - Identificar sección
- [ ] `CT_UPDATE_CYCLES` - Actualizar contadores
- [ ] `CT_NOTIFY_FATIGUE` - Notificaciones

**Reglas Pre-configuradas** (3 reglas):
- [ ] "CT Realtime Processing" (principal)
- [ ] "CT Fatigue Critical Alert"
- [ ] "CT Daily Summary"

**Python Calculations** (3 funciones):
- [ ] `calculate_lockup_prediction()`
- [ ] `calculate_hydraulics_full()`
- [ ] `optimize_bha_configuration()`

### 6.2 Orden de Implementación

1. **Semana 1**: Nodos básicos (FATIGUE_CALC, ALARM_CHECK, JOB_ENRICHMENT)
2. **Semana 2**: Nodos mecánicos (BUCKLING_CHECK, STRAIN_CALC)
3. **Semana 3**: Integración Python (LOCKUP_PREDICT, HYDRAULICS_CALC)
4. **Semana 4**: Reglas pre-configuradas y testing

### 6.3 Ubicación de Código

```
/src/backend/src/modules/infrastructure/rules/
├── nodes/
│   ├── ct/
│   │   ├── ct-fatigue-calc.node.ts
│   │   ├── ct-alarm-check.node.ts
│   │   ├── ct-buckling-check.node.ts
│   │   ├── ct-lockup-predict.node.ts
│   │   └── index.ts
│   └── index.ts
└── presets/
    └── ct-realtime-processing.json

/src/python-calculation-service/
├── ct_calculations/
│   ├── __init__.py
│   ├── lockup_prediction.py
│   ├── hydraulics.py
│   └── bha_optimization.py
└── main.py
```

---

## 📊 CRITERIOS DE ÉXITO

- ✅ 10 nodos CT implementados y testeados
- ✅ 3 reglas pre-configuradas funcionando
- ✅ Fatiga calculándose en tiempo real (<10ms)
- ✅ Alarmas creándose automáticamente
- ✅ Integración Python funcional (lockup prediction)
- ✅ WebSocket broadcasting computed fields
- ✅ Editor visual mostrando nodos CT

---

**Siguiente bloque**: [04_BACKEND_REFACTORIZADO.md](./04_BACKEND_REFACTORIZADO.md) →
