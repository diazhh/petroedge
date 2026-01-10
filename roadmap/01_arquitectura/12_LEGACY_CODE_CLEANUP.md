# LIMPIEZA DE CÓDIGO LEGACY - YACIMIENTOS Y POZOS

**Fecha**: 2026-01-10  
**Estado**: ⚪ Propuesta  
**Prioridad**: ALTA  
**Dependencias**: Módulo 1.11 (Eclipse Ditto) completado

---

## 1. Análisis de Código Legacy

### 1.1 Tablas Obsoletas (A ELIMINAR)

Las siguientes tablas serán reemplazadas por Eclipse Ditto Things:

```sql
-- TABLAS LEGACY DE YACIMIENTOS (ELIMINAR DESPUÉS DE MIGRACIÓN)
basins           -- → Ditto Thing (tipo: BASIN)
fields           -- → Ditto Thing (tipo: FIELD)  
reservoirs       -- → Ditto Thing (tipo: RESERVOIR)
wells            -- → Ditto Thing (tipo: WELL)
```

### 1.2 Módulos de Código Obsoletos

```
src/backend/src/modules/
├── basins/                    ❌ ELIMINAR (migrar a assets/digital-twins)
│   ├── basins.controller.ts
│   ├── basins.service.ts
│   ├── basins.repository.ts
│   ├── basins.routes.ts
│   └── basins.schema.ts
│
├── fields/                    ❌ ELIMINAR (migrar a assets/digital-twins)
│   ├── fields.controller.ts
│   ├── fields.service.ts
│   ├── fields.repository.ts
│   ├── fields.routes.ts
│   └── fields.schema.ts
│
├── reservoirs/                ❌ ELIMINAR (migrar a assets/digital-twins)
│   ├── reservoirs.controller.ts
│   ├── reservoirs.service.ts
│   ├── reservoirs.repository.ts
│   ├── reservoirs.routes.ts
│   └── reservoirs.schema.ts
│
├── wells/                     ❌ ELIMINAR (migrar a assets/digital-twins)
│   ├── wells.controller.ts
│   ├── wells.service.ts
│   ├── wells.repository.ts
│   ├── wells.routes.ts
│   └── wells.schema.ts
│
└── yacimientos/               ❌ ELIMINAR (funcionalidad duplicada)
```

### 1.3 Código de Migración (MANTENER TEMPORALMENTE)

```
src/backend/src/modules/infrastructure/migration/
└── legacy-to-digital-twin.service.ts  ✅ MANTENER hasta completar migración
```

---

## 2. Estrategia de Migración

### 2.1 Enfoque Gradual

```
┌─────────────────────────────────────────────────────────────┐
│                    ESTRATEGIA DE MIGRACIÓN                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  FASE 1: Dual Mode (2-3 semanas)                           │
│  ├─ Legacy tables + Ditto Things coexisten                 │
│  ├─ Crear en ambos sistemas                                │
│  ├─ Leer desde Ditto (fallback a legacy)                   │
│  └─ Sincronización bidireccional                           │
│                                                              │
│  FASE 2: Ditto Primary (1-2 semanas)                       │
│  ├─ Ditto es fuente de verdad                              │
│  ├─ Legacy solo lectura                                    │
│  └─ Migración de datos históricos                          │
│                                                              │
│  FASE 3: Legacy Deprecation (1 semana)                     │
│  ├─ Eliminar código legacy                                 │
│  ├─ Eliminar tablas legacy                                 │
│  └─ Cleanup completo                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Mapeo Legacy → Ditto

| Legacy Table | Ditto Thing Type | Features |
|--------------|------------------|----------|
| `basins` | `BASIN` | geology, location, metadata |
| `fields` | `FIELD` | operations, production, wells_summary |
| `reservoirs` | `RESERVOIR` | petrophysics, fluids, reserves |
| `wells` | `WELL` | completion, production, status |

---

## 3. Plan de Limpieza Detallado

### 3.1 FASE 1: Preparación (Semana 1)

#### Tareas
- [ ] Auditar dependencias de tablas legacy
- [ ] Identificar queries que usan tablas legacy
- [ ] Crear feature flags para dual mode
- [ ] Documentar APIs que cambian

#### Queries a Actualizar

```typescript
// ANTES (Legacy)
const basins = await db.select().from(basins).where(eq(basins.tenantId, tenantId));

// DESPUÉS (Ditto)
const basins = await dittoClient.getThings({
  filter: `eq(attributes/tenantId,"${tenantId}") and eq(attributes/type,"BASIN")`
});
```

### 3.2 FASE 2: Migración de Datos (Semana 2-3)

#### Script de Migración

```typescript
// scripts/migrate-legacy-to-ditto.ts
async function migrateLegacyData(tenantId: string) {
  console.log('Starting migration for tenant:', tenantId);
  
  // 1. Migrar Basins
  const basins = await db.select().from(basinsTable).where(eq(basinsTable.tenantId, tenantId));
  for (const basin of basins) {
    await createDittoThing({
      thingId: `${tenantId}:basin-${basin.id}`,
      policyId: `${tenantId}:default-policy`,
      attributes: {
        type: 'BASIN',
        legacyId: basin.id,
        name: basin.name,
        country: basin.country,
        region: basin.region,
      },
      features: {
        geology: {
          properties: {
            basinType: basin.basinType,
            age: basin.age,
            tectonicSetting: basin.tectonicSetting,
          }
        },
        location: {
          properties: {
            areaKm2: parseFloat(basin.areaKm2),
            bounds: {
              minLat: parseFloat(basin.minLatitude),
              maxLat: parseFloat(basin.maxLatitude),
              minLon: parseFloat(basin.minLongitude),
              maxLon: parseFloat(basin.maxLongitude),
            }
          }
        }
      }
    });
  }
  
  // 2. Migrar Fields (con parent basin)
  // 3. Migrar Reservoirs (con parent field)
  // 4. Migrar Wells (con parent field/reservoir)
  
  console.log('Migration completed');
}
```

### 3.3 FASE 3: Actualizar Servicios (Semana 4-5)

#### Servicios a Refactorizar

```typescript
// ANTES: basins.service.ts (ELIMINAR)
export class BasinsService {
  async getAllBasins(tenantId: string, query: BasinQuery) {
    return basinsRepository.findAll(tenantId, query);
  }
}

// DESPUÉS: Usar assets.service.ts con Ditto
export class AssetsService {
  async getAssetsByType(tenantId: string, assetType: string, query: AssetQuery) {
    // Consultar Ditto Things filtrados por tipo
    const things = await dittoClient.getThings({
      filter: `eq(attributes/tenantId,"${tenantId}") and eq(attributes/assetType,"${assetType}")`,
      option: `sort(+attributes/name),size(${query.perPage}),cursor(${query.cursor})`
    });
    
    return {
      data: things.items,
      cursor: things.cursor,
      total: things.total
    };
  }
}
```

### 3.4 FASE 4: Actualizar APIs (Semana 6)

#### Endpoints a Deprecar

```typescript
// DEPRECAR (mantener por compatibilidad temporal)
GET    /api/v1/basins              → GET /api/v1/assets?type=BASIN
POST   /api/v1/basins              → POST /api/v1/assets (con assetTypeId)
GET    /api/v1/basins/:id          → GET /api/v1/assets/:id
PUT    /api/v1/basins/:id          → PUT /api/v1/assets/:id
DELETE /api/v1/basins/:id          → DELETE /api/v1/assets/:id

// Lo mismo para fields, reservoirs, wells
```

#### Wrapper de Compatibilidad

```typescript
// basins.routes.ts (TEMPORAL - mantener 3 meses)
fastify.get('/', {
  schema: {
    deprecated: true,
    description: 'DEPRECATED: Use /api/v1/assets?type=BASIN instead'
  },
  handler: async (request, reply) => {
    // Redirigir a nuevo endpoint
    const assets = await assetsService.getAssetsByType(
      request.user.tenantId,
      'BASIN',
      request.query
    );
    
    // Transformar respuesta al formato legacy
    return {
      data: assets.data.map(transformDittoToLegacy),
      total: assets.total
    };
  }
});
```

### 3.5 FASE 5: Eliminar Código Legacy (Semana 7)

#### Checklist de Eliminación

- [ ] Verificar que no hay referencias a tablas legacy
- [ ] Eliminar módulos: basins/, fields/, reservoirs/, wells/, yacimientos/
- [ ] Eliminar tablas de base de datos
- [ ] Eliminar enums obsoletos
- [ ] Eliminar seeds de datos legacy
- [ ] Actualizar documentación
- [ ] Eliminar tests legacy

#### Script de Limpieza

```bash
#!/bin/bash
# scripts/cleanup-legacy-code.sh

echo "🧹 Cleaning up legacy code..."

# 1. Eliminar módulos
rm -rf src/backend/src/modules/basins
rm -rf src/backend/src/modules/fields
rm -rf src/backend/src/modules/reservoirs
rm -rf src/backend/src/modules/wells
rm -rf src/backend/src/modules/yacimientos

# 2. Eliminar de schema.ts
# (manual - eliminar secciones de basins, fields, reservoirs, wells)

# 3. Eliminar migraciones legacy
rm -rf src/backend/drizzle/migrations/*basins*
rm -rf src/backend/drizzle/migrations/*fields*
rm -rf src/backend/drizzle/migrations/*reservoirs*
rm -rf src/backend/drizzle/migrations/*wells*

# 4. Eliminar tests legacy
rm -rf src/backend/tests/basins*
rm -rf src/backend/tests/fields*
rm -rf src/backend/tests/reservoirs*
rm -rf src/backend/tests/wells*

echo "✅ Legacy code cleanup completed"
```

---

## 4. Frontend - Limpieza

### 4.1 Componentes a Actualizar

```
src/frontend/src/features/
├── basins/          → Actualizar para usar /api/v1/assets?type=BASIN
├── fields/          → Actualizar para usar /api/v1/assets?type=FIELD
├── reservoirs/      → Actualizar para usar /api/v1/assets?type=RESERVOIR
└── wells/           → Actualizar para usar /api/v1/assets?type=WELL
```

### 4.2 APIs de Frontend

```typescript
// ANTES: basins.api.ts
export const basinsApi = {
  getAll: (params) => api.get('/basins', { params }),
  getById: (id) => api.get(`/basins/${id}`),
  create: (data) => api.post('/basins', data),
  update: (id, data) => api.put(`/basins/${id}`, data),
  delete: (id) => api.delete(`/basins/${id}`),
};

// DESPUÉS: assets.api.ts (genérico)
export const assetsApi = {
  getByType: (type, params) => api.get('/assets', { params: { ...params, type } }),
  getById: (id) => api.get(`/assets/${id}`),
  create: (data) => api.post('/assets', data),
  update: (id, data) => api.put(`/assets/${id}`, data),
  delete: (id) => api.delete(`/assets/${id}`),
};

// Helper específico
export const basinsApi = {
  getAll: (params) => assetsApi.getByType('BASIN', params),
  // ... resto de métodos usando assetsApi
};
```

---

## 5. Tablas de Base de Datos - Eliminación

### 5.1 Orden de Eliminación (Respetando Foreign Keys)

```sql
-- 1. Eliminar tablas dependientes primero
DROP TABLE IF EXISTS well_tests CASCADE;
DROP TABLE IF EXISTS well_test_readings CASCADE;
DROP TABLE IF EXISTS ipr_analyses CASCADE;

-- 2. Eliminar tablas principales
DROP TABLE IF EXISTS wells CASCADE;
DROP TABLE IF EXISTS reservoirs CASCADE;
DROP TABLE IF EXISTS fields CASCADE;
DROP TABLE IF EXISTS basins CASCADE;

-- 3. Eliminar enums obsoletos
DROP TYPE IF EXISTS basin_type CASCADE;
DROP TYPE IF EXISTS field_status CASCADE;
DROP TYPE IF EXISTS field_type CASCADE;
DROP TYPE IF EXISTS lithology CASCADE;
DROP TYPE IF EXISTS fluid_type CASCADE;
DROP TYPE IF EXISTS drive_mechanism CASCADE;
DROP TYPE IF EXISTS well_status CASCADE;
DROP TYPE IF EXISTS well_type CASCADE;
DROP TYPE IF EXISTS lift_method CASCADE;
```

### 5.2 Backup Antes de Eliminar

```bash
# Backup de tablas legacy antes de eliminar
pg_dump -h localhost -p 15432 -U scadaerp -d scadaerp \
  -t basins -t fields -t reservoirs -t wells \
  > backup_legacy_tables_$(date +%Y%m%d).sql
```

---

## 6. Cronograma de Ejecución

| Semana | Fase | Tareas | Estado |
|--------|------|--------|--------|
| 1 | Preparación | Auditoría, feature flags, documentación | ⚪ |
| 2-3 | Migración Datos | Script migración, dual mode | ⚪ |
| 4-5 | Refactor Servicios | Actualizar a Ditto APIs | ⚪ |
| 6 | Actualizar APIs | Deprecar endpoints, wrappers | ⚪ |
| 7 | Cleanup | Eliminar código y tablas legacy | ⚪ |

**Total**: 7 semanas (paralelo con implementación Ditto)

---

## 7. Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Pérdida de datos | ALTO | Backups completos antes de cada fase |
| Downtime | MEDIO | Migración gradual con dual mode |
| Bugs en producción | ALTO | Tests exhaustivos, rollback plan |
| Dependencias ocultas | MEDIO | Auditoría completa de código |

---

## 8. Criterios de Éxito

- [ ] 100% de datos migrados a Ditto
- [ ] 0 referencias a tablas legacy en código
- [ ] Todos los tests pasando
- [ ] APIs funcionando con Ditto
- [ ] Frontend actualizado
- [ ] Documentación actualizada
- [ ] Tablas legacy eliminadas

---

**Siguiente paso**: Ejecutar auditoría de dependencias y crear feature flags
