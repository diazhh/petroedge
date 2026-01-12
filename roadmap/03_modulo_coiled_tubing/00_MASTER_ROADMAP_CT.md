# MÓDULO COILED TUBING - MASTER ROADMAP (REFACTORIZADO)

> **Versión**: 3.0 - Arquitectura Digital Twins  
> **Fecha**: 2026-01-12  
> **Estado**: 🔄 En Refactorización Total

---

## 📋 RESUMEN EJECUTIVO

Este roadmap documenta la **refactorización completa** del módulo Coiled Tubing para integrarlo correctamente con la arquitectura de **Digital Twins** existente en PetroEdge.

### ❌ Problema Identificado

El módulo CT original se desarrolló con:
- 11 tablas dedicadas (ct_units, ct_reels, ct_realtime_data, ct_alarms, etc.)
- Consumer Kafka propio (CoiledTubingRealtimeConsumer)
- Sistema de alarmas duplicado
- **NO integrado** con sistema de Assets, Edge Gateway ni Motor de Reglas

### ✅ Solución: Arquitectura Digital Twins

Refactorizar completamente para:
- **Usar `assets`** para Units, Reels, BHA Components (gemelos digitales)
- **Usar `asset_telemetry`** para datos en tiempo real (TimescaleDB)
- **Usar `alarms`** core para alarmas unificadas
- **Usar `TelemetryConsumerService`** existente vía Kafka
- **Usar `RuleEngineService`** para cálculos y detección de alarmas
- **Edge Gateway** con Device Profiles y Connectivity Profiles

---

## 🎯 OBJETIVOS DEL PROYECTO

1. ✅ **Integración Total** con infraestructura Digital Twins
2. ✅ **Telemetría Unificada** vía Edge Gateway → Kafka → Assets
3. ✅ **Motor de Reglas** para cálculos de fatiga, buckling, alarmas
4. ✅ **Frontend Profesional** con dashboards impresionantes
5. ✅ **Simulador Completo** para pruebas del módulo
6. ✅ **Eliminar Código Legacy** (tablas, servicios, consumers obsoletos)

---

## 📦 ESTRUCTURA DEL ROADMAP

Este Master Roadmap se divide en **7 bloques** detallados:

### 1️⃣ [Arquitectura y Asset Types](./01_ARQUITECTURA_ASSET_TYPES.md)
- Arquitectura general refactorizada
- Asset Types: CT_UNIT, CT_REEL, CT_BHA_COMPONENT, etc.
- Asset Templates para configuraciones complejas
- Fixed Schema, Attribute Schema, Telemetry Schema
- Computed Fields

**Duración**: 1-2 semanas

### 2️⃣ [Edge Gateway e Ingesta de Datos](./02_EDGE_GATEWAY_INGESTA.md)
- Device Profiles para sensores CT
- Data Source Tags (profundidad, peso, presión, etc.)
- Connectivity Profiles (mapeo tag → asset)
- Device Bindings (instancias específicas)
- Kafka Topics y flujo de datos

**Duración**: 1-2 semanas

### 3️⃣ [Motor de Reglas y Nodos CT](./03_MOTOR_REGLAS_NODOS_CT.md)
- Nodos específicos CT para Rule Engine
- Cálculo de fatiga en tiempo real
- Cálculo de buckling y lockup prediction
- Detección de alarmas (overpull, slack-off, high pressure)
- Integración con Python Calculation Service

**Duración**: 2-3 semanas

### 4️⃣ [Backend Refactorizado](./04_BACKEND_REFACTORIZADO.md)
- Eliminar tablas obsoletas
- Refactorizar servicios para usar Assets
- APIs REST para Jobs, BHA, Tickets
- Calculaciones de ingeniería (fatiga, hidráulica, mecánica)
- WebSocket para tiempo real

**Duración**: 2-3 semanas

### 5️⃣ [Frontend Profesional](./05_FRONTEND_PROFESIONAL.md)
- Dashboard principal impresionante
- Wizard de Jobs (6 pasos)
- Monitor RT avanzado (Broomstick chart, alarmas)
- Mapa de fatiga interactivo
- Reportes y Job Tickets PDF

**Duración**: 3-4 semanas

### 6️⃣ [Simulador y Seeds](./06_SIMULADOR_SEEDS.md)
- Simulador Python mejorado
- Seeds completos (3 Units, 6 Reels, 12 Jobs)
- Generación de telemetría sintética
- Casos de uso de prueba

**Duración**: 1 semana

### 7️⃣ [Plan de Migración y Limpieza](./07_MIGRACION_LIMPIEZA.md)
- Scripts de migración de datos
- Eliminación de código legacy
- Pruebas E2E completas
- Validación y rollout

**Duración**: 1 semana

---

## ⏱️ CRONOGRAMA GENERAL

| Fase | Semanas | Acumulado |
|------|---------|-----------|
| 1. Arquitectura y Asset Types | 1-2 | 2 sem |
| 2. Edge Gateway e Ingesta | 1-2 | 4 sem |
| 3. Motor de Reglas y Nodos CT | 2-3 | 7 sem |
| 4. Backend Refactorizado | 2-3 | 10 sem |
| 5. Frontend Profesional | 3-4 | 14 sem |
| 6. Simulador y Seeds | 1 | 15 sem |
| 7. Migración y Limpieza | 1 | 16 sem |

**Total estimado**: **12-16 semanas** (~3-4 meses)

---

## 🔑 CONCEPTOS CLAVE

### Digital Twin de CT Unit

Un CT Unit será un **Asset** con:
- **Asset Type**: `CT_UNIT`
- **Fixed Properties**: manufacturer, model, serialNumber, injectorCapacityLbs
- **Attributes**: certificationStatus, location, currentJobId
- **Telemetry**: (vía reels/BHA conectados)
- **Relationships**: hasReels (1:N), hasJobs (1:N)

### Digital Twin de CT Reel

Un CT Reel será un **Asset** con:
- **Asset Type**: `CT_REEL`
- **Fixed Properties**: reelNumber, outerDiameterIn, steelGrade, totalLengthFt
- **Attributes**: fatiguePercentage, status, condition
- **Telemetry**: realtime fatigue (calculado por reglas)
- **Computed Fields**: currentFatigue, estimatedLifeRemaining
- **Children Assets**: Secciones del reel (CT_REEL_SECTION)

### Flujo de Telemetría CT

```
Sensores CT (Modbus/OPC-UA)
    ↓
Edge Gateway (tags mapeados)
    ↓
Kafka Topic: scada.telemetry.raw
    ↓
TelemetryConsumerService (core)
    ↓
asset_telemetry (TimescaleDB)
    ↓
Rule Engine (evalúa reglas CT)
    ↓
Computed Fields + Alarms
    ↓
WebSocket → Frontend
```

---

## 🚀 INICIO RÁPIDO

### Para Desarrolladores

1. **Leer Bloque 1**: Arquitectura y Asset Types
2. **Revisar schema existente**: `/src/backend/src/common/database/schema.ts` (tablas assets, asset_types)
3. **Familiarizarse con Digital Twins**: `http://localhost:5173/digital-twins`
4. **Revisar Motor de Reglas**: `http://localhost:5173/rule-engine`

### Para Product Owners

1. **Dashboard objetivo**: Ver mockups en Bloque 5
2. **Casos de uso**: Definidos en cada bloque
3. **KPIs**: Listados en sección 11 del ct.md original

---

## 📊 PROGRESO ACTUAL

- [x] Análisis del problema (módulo desviado)
- [x] Informe de desviación generado
- [ ] Bloque 1: Arquitectura y Asset Types
- [ ] Bloque 2: Edge Gateway e Ingesta
- [ ] Bloque 3: Motor de Reglas
- [ ] Bloque 4: Backend Refactorizado
- [ ] Bloque 5: Frontend Profesional
- [ ] Bloque 6: Simulador y Seeds
- [ ] Bloque 7: Migración y Limpieza

---

## 🔗 REFERENCIAS

- **Arquitectura Digital Twins**: `/roadmap/01_arquitectura/06_ARQUITECTURA_MODULAR_DIGITAL_TWINS.md`
- **Motor de Reglas**: `/roadmap/01_arquitectura/10_ECLIPSE_DITTO_RULE_ENGINE_ADVANCED.md`
- **Python Calculation Service**: `/roadmap/01_arquitectura/12_PYTHON_CALCULATION_SERVICE.md`
- **Frontend Standards**: `/roadmap/01_arquitectura/08_FRONTEND_STANDARDS.md`
- **Roadmap Original CT** (legacy): `/ct.md`

---

## 👥 EQUIPO

- **Arquitecto**: Revisar y aprobar Asset Types
- **Backend Lead**: Implementar servicios refactorizados
- **Frontend Lead**: Dashboards profesionales
- **DevOps**: Edge Gateway setup y despliegue

---

**Siguiente paso**: Leer `01_ARQUITECTURA_ASSET_TYPES.md` →
