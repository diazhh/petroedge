# EJECUCIÓN DE MIGRACIÓN A ECLIPSE DITTO

**Fecha**: 2026-01-10  
**Estado**: 🟡 En Progreso  
**Responsable**: Sistema

---

## ✅ Trabajo Completado

### 1. Servicios de Migración Implementados

#### ✅ DittoSyncService (`ditto-sync.service.ts`)
Servicio de sincronización bidireccional Legacy → Ditto:

**Funcionalidades**:
- `migrateBasinToDitto()` - Migrar cuencas
- `migrateFieldToDitto()` - Migrar campos
- `migrateReservoirToDitto()` - Migrar yacimientos
- `migrateWellToDitto()` - Migrar pozos
- `migrateAllEntities()` - Migración masiva por tenant

**Mapeo de Entidades**:
```
basins     → Ditto Thing (tipo: BASIN)
  └─ Features: geology, location, metadata

fields     → Ditto Thing (tipo: FIELD)
  └─ Features: operations, location, production, metadata

reservoirs → Ditto Thing (tipo: RESERVOIR)
  └─ Features: petrophysics, fluids, reserves, pressure, metadata

wells      → Ditto Thing (tipo: WELL)
  └─ Features: completion, location, production, pressure, status, metadata
```

#### ✅ DigitalTwinManagementService (`digital-twin-management.service.ts`)
Servicio de gestión completa de Digital Twins:

**Funcionalidades CRUD**:
- `createThing()` - Crear nuevo Digital Twin
- `getThing()` - Obtener Digital Twin
- `updateThing()` - Actualizar Digital Twin
- `deleteThing()` - Eliminar Digital Twin

**Gestión de Atributos**:
- `getAttributes()` - Obtener atributos
- `updateAttributes()` - Actualizar atributos

**Gestión de Features**:
- `getFeatureProperties()` - Obtener properties de feature
- `updateFeatureProperties()` - Actualizar properties (PUT - reemplazo completo)
- `patchFeatureProperties()` - Actualizar properties (PATCH - parcial)
- `upsertFeature()` - Crear o actualizar feature completo
- `deleteFeature()` - Eliminar feature

**Gestión de Telemetría**:
- `updateTelemetry()` - Actualizar telemetría en tiempo real
- `getTelemetry()` - Obtener telemetría actual

---

## 📋 Próximos Pasos

### Paso 1: Crear APIs REST en Backend

Crear módulo en Backend API para exponer gestión de Digital Twins:

```
src/backend/src/modules/infrastructure/digital-twins/
├── digital-twins.types.ts
├── digital-twins.schema.ts
├── digital-twins.controller.ts
├── digital-twins.routes.ts
└── index.ts
```

**Endpoints a implementar**:
```
POST   /api/v1/digital-twins              - Crear Thing
GET    /api/v1/digital-twins/:thingId     - Obtener Thing
PUT    /api/v1/digital-twins/:thingId     - Actualizar Thing
DELETE /api/v1/digital-twins/:thingId     - Eliminar Thing

GET    /api/v1/digital-twins/:thingId/attributes           - Obtener atributos
PATCH  /api/v1/digital-twins/:thingId/attributes           - Actualizar atributos

GET    /api/v1/digital-twins/:thingId/features/:featureId  - Obtener feature
PUT    /api/v1/digital-twins/:thingId/features/:featureId  - Actualizar feature
PATCH  /api/v1/digital-twins/:thingId/features/:featureId  - Patch feature
DELETE /api/v1/digital-twins/:thingId/features/:featureId  - Eliminar feature

GET    /api/v1/digital-twins/:thingId/telemetry            - Obtener telemetría
POST   /api/v1/digital-twins/:thingId/telemetry            - Actualizar telemetría

POST   /api/v1/digital-twins/migrate                       - Migrar entidades legacy
```

### Paso 2: Ejecutar Migración de Datos

Script de migración para ejecutar en Worker Service:

```typescript
// src/worker/scripts/migrate-to-ditto.ts
import { DittoSyncService } from '../services/ditto-sync.service.js';

async function main() {
  const syncService = new DittoSyncService();
  
  // Obtener todos los tenants
  const tenants = await getTenants();
  
  for (const tenant of tenants) {
    console.log(`Migrating tenant: ${tenant.id}`);
    
    const result = await syncService.migrateAllEntities(tenant.id);
    
    console.log(`Migration completed:`, result);
  }
  
  await syncService.close();
}

main();
```

### Paso 3: Crear Wrappers de Compatibilidad

Actualizar módulos legacy para leer desde Ditto:

```typescript
// src/backend/src/modules/wells/wells.service.ts
async getWellById(id: string, tenantId: string) {
  // Intentar obtener desde Ditto
  const thingId = `${tenantId}:well-${id}`;
  const dittoThing = await dittoClient.getThing(thingId);
  
  if (dittoThing) {
    return transformDittoToWell(dittoThing);
  }
  
  // Fallback a legacy
  return await wellsRepository.findById(id, tenantId);
}
```

### Paso 4: Frontend - Gestión de Digital Twins

Crear páginas de gestión en frontend:

```
src/frontend/src/features/digital-twins/
├── api/digital-twins.api.ts
├── components/
│   ├── ThingCard.tsx
│   ├── FeatureEditor.tsx
│   └── TelemetryViewer.tsx
├── pages/
│   ├── DigitalTwinsList.tsx
│   ├── DigitalTwinDetail.tsx
│   └── DigitalTwinForm.tsx
├── types/digital-twins.types.ts
└── index.ts
```

### Paso 5: Deprecar Código Legacy

Una vez migrado y verificado:

1. Marcar módulos legacy como deprecated
2. Agregar warnings en APIs legacy
3. Documentar plan de eliminación (3 meses)
4. Eliminar tablas legacy después del período de gracia

---

## 🎯 Checklist de Migración

### Infraestructura
- [x] Eclipse Ditto configurado en Worker Service
- [x] DittoClientService implementado
- [x] DittoSyncService implementado
- [x] DigitalTwinManagementService implementado

### Backend API
- [ ] Módulo digital-twins creado
- [ ] 10+ endpoints REST implementados
- [ ] Integración con Worker Service
- [ ] Permisos RBAC configurados

### Migración de Datos
- [ ] Script de migración creado
- [ ] Migración ejecutada para tenant ACME
- [ ] Validación de integridad de datos
- [ ] Backup de datos legacy

### Frontend
- [ ] Módulo digital-twins creado
- [ ] Páginas de gestión implementadas
- [ ] Componentes de visualización
- [ ] Integración con APIs

### Wrappers de Compatibilidad
- [ ] Wells service actualizado
- [ ] Fields service actualizado
- [ ] Reservoirs service actualizado
- [ ] Basins service actualizado

### Limpieza
- [ ] Código legacy marcado como deprecated
- [ ] Documentación de migración
- [ ] Plan de eliminación de tablas legacy
- [ ] Tests de integración

---

## 📊 Estado de Módulos

| Módulo | Estado Legacy | Estado Ditto | Migración |
|--------|---------------|--------------|-----------|
| Basins | ✅ Activo | 🟡 Servicio listo | ⚪ Pendiente |
| Fields | ✅ Activo | 🟡 Servicio listo | ⚪ Pendiente |
| Reservoirs | ✅ Activo | 🟡 Servicio listo | ⚪ Pendiente |
| Wells | ✅ Activo | 🟡 Servicio listo | ⚪ Pendiente |

---

## 🚀 Comando de Ejecución

```bash
# 1. Instalar dependencias del Worker Service
cd src/worker
npm install

# 2. Ejecutar migración
npm run migrate:ditto

# 3. Verificar en Ditto
curl -u ditto:ditto http://localhost:8080/api/2/things

# 4. Verificar logs
docker logs scadaerp-worker-1
```

---

**Siguiente paso**: Crear módulo digital-twins en Backend API
