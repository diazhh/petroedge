# MIGRACIÓN A ECLIPSE DITTO - DIGITAL TWINS

**Fecha**: 2026-01-10  
**Estado**: ⚪ Propuesta  
**Prioridad**: CRÍTICA  
**Dependencias**: Módulo 1.11 Fase 1 completada

---

## 1. Estrategia de Migración

### 1.1 Enfoque: Dual Write Pattern

```
Legacy Tables (PostgreSQL)  +  Eclipse Ditto Things
         ↓                              ↓
    Sync Service (bidireccional)
         ↓
    Gradual cutover a Ditto como fuente principal
```

### 1.2 Fases

**Fase 1: Setup Ditto** (✅ COMPLETADO - 2026-01-10)
- ✅ Eclipse Ditto instalado con K3s + Helm (v3.6.9)
- ✅ Credenciales configuradas (ditto:ditto)
- ✅ Servicio expuesto en puerto 30080
- ✅ Verificado funcionamiento con pruebas CRUD
- ⬜ Crear policies y thing types para el proyecto
- ⬜ Configurar conexión Kafka

**IMPORTANTE**: Ditto se levanta con K3s + Helm, NO con Docker Compose.
Ver documentación completa en: `/infrastructure/k3s/DITTO_K3S_DEPLOYMENT.md`

**Fase 2: Dual Write** (3 semanas)
- Escribir en ambos sistemas
- Leer desde Ditto (fallback legacy)
- Sincronización automática

**Fase 3: Migración Datos** (2 semanas)
- Migrar datos históricos
- Validar integridad
- Rollback plan

**Fase 4: Cutover** (1 semana)
- Ditto como fuente única
- Deprecar legacy
- Monitoreo intensivo

---

## 2. Mapeo de Entidades

### 2.1 Basins → Ditto Things

```json
{
  "thingId": "acme:basin-cuenca-oriental",
  "policyId": "acme:default-policy",
  "attributes": {
    "type": "BASIN",
    "name": "Cuenca Oriental de Venezuela",
    "country": "Venezuela",
    "region": "Anzoátegui"
  },
  "features": {
    "geology": {
      "properties": {
        "basinType": "FORELAND",
        "age": "Cretaceous-Tertiary",
        "tectonicSetting": "Foreland basin"
      }
    },
    "location": {
      "properties": {
        "areaKm2": 153000,
        "bounds": {
          "minLat": 7.5, "maxLat": 10.5,
          "minLon": -65.0, "maxLon": -60.0
        }
      }
    }
  }
}
```

### 2.2 Wells → Ditto Things

```json
{
  "thingId": "acme:well-mor-001",
  "policyId": "acme:default-policy",
  "attributes": {
    "type": "WELL",
    "name": "MOR-001",
    "wellCode": "MOR-001",
    "apiNumber": "VE-12345"
  },
  "features": {
    "completion": {
      "properties": {
        "wellType": "PRODUCER",
        "liftMethod": "ESP",
        "tubingSize": 2.875,
        "casingSize": 7.0
      }
    },
    "production": {
      "properties": {
        "oilRateBopd": 450,
        "gasRateMscfd": 850,
        "waterRateBwpd": 120
      }
    },
    "status": {
      "properties": {
        "current": "PRODUCING",
        "lastUpdate": "2026-01-10T12:00:00Z"
      }
    }
  }
}
```

---

## 3. Servicios de Migración

### 3.1 Sync Service

```typescript
// src/worker/services/ditto-sync.service.ts
export class DittoSyncService {
  async syncLegacyToDitto(entityType: string, entityId: string) {
    const legacyData = await this.getLegacyData(entityType, entityId);
    const dittoThing = this.transformToDitto(legacyData);
    await dittoClient.createOrUpdateThing(dittoThing);
  }
  
  async syncDittoToLegacy(thingId: string) {
    const thing = await dittoClient.getThing(thingId);
    const legacyData = this.transformToLegacy(thing);
    await this.updateLegacyData(legacyData);
  }
}
```

---

## 4. Cronograma

| Semana | Actividad | Entregable |
|--------|-----------|------------|
| 1-2 | Setup Ditto | Ditto operativo + policies |
| 3-5 | Dual Write | Sync service funcionando |
| 6-7 | Migración | Datos históricos en Ditto |
| 8 | Cutover | Ditto como fuente principal |

**Total**: 8 semanas

---

## 5. Checklist de Migración

- [ ] Ditto instalado y configurado
- [ ] Policies creadas por tenant
- [ ] Thing types definidos
- [ ] Sync service implementado
- [ ] Dual write funcionando
- [ ] Datos históricos migrados
- [ ] Tests de integración pasando
- [ ] Monitoreo configurado
- [ ] Rollback plan documentado
- [ ] Cutover ejecutado

---

**Siguiente paso**: Instalar Eclipse Ditto en Docker Compose
