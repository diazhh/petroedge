# MIGRACIÓN YACIMIENTOS/POZOS A DITTO - PLAN DE EJECUCIÓN

**Fecha**: 2026-01-10  
**Estado**: 🟡 En Ejecución  
**Prioridad**: CRÍTICA

---

## 📋 RESUMEN EJECUTIVO

### Situación Actual (Actualizado 2026-01-10)
- ✅ Eclipse Ditto instalado con **K3s + Helm v3.6.9** (NO Docker Compose)
- ✅ Ditto funcionando correctamente en `http://localhost:30080`
- ✅ Credenciales: `ditto:ditto`
- ✅ Worker Service con `DittoClientService` configurado
- ✅ Backend API con 13 endpoints REST para Digital Twins
- ❌ Módulos legacy SIGUEN ACTIVOS (basins, fields, reservoirs, wells)
- ❌ Frontend usa rutas legacy (/basins, /fields, /reservoirs, /wells)
- ❌ NO existe módulo de gestión centralizada de Digital Twins

**IMPORTANTE**: Ditto se levanta con K3s + Helm, NO con Docker Compose.
Ver documentación: `/infrastructure/k3s/DITTO_K3S_DEPLOYMENT.md`

### Arquitectura Objetivo

```
┌─────────────────────────────────────────────────────────┐
│         MÓDULOS OPERACIONALES (Well Testing, etc.)      │
│  Al crear elemento → Crea Asset en Ditto               │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│       MÓDULO DE GESTIÓN DE GEMELOS DIGITALES            │
│  • Ver todos los assets (CRUD completo)                 │
│  • Gestionar atributos, telemetría, features            │
│  • Usar plantillas (asset types)                        │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   ECLIPSE DITTO                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 PLAN DE EJECUCIÓN (6 FASES)

### FASE 1: Verificación y Setup (✅ COMPLETADO - 2026-01-10)
**Objetivo**: Asegurar que Eclipse Ditto está operativo

- [x] ✅ Ditto instalado con K3s + Helm v3.6.9
- [x] ✅ Verificar Ditto está corriendo: `kubectl get pods -n ditto`
- [x] ✅ Verificar API funcionando: `curl -u ditto:ditto http://localhost:30080/api/2/things`
- [x] ✅ Worker Service configurado con URL correcta (puerto 30080)
- [x] ✅ Pruebas CRUD exitosas (Policy + Thing creados)

**Entregable**: ✅ Ditto operativo y Worker Service configurado

**Comandos útiles**:
```bash
# Ver estado de Ditto
kubectl get pods -n ditto

# Probar API
curl -u ditto:ditto http://localhost:30080/api/2/things

# Ver documentación completa
cat /infrastructure/k3s/DITTO_K3S_DEPLOYMENT.md
```

---

### FASE 2: Migración de Datos Legacy (1 hora)
**Objetivo**: Migrar basins, fields, reservoirs, wells a Ditto Things

#### 2.1 Crear Script de Migración
```typescript
// src/worker/scripts/migrate-yacimientos-to-ditto.ts
import { DittoSyncService } from '../services/ditto-sync.service.js';
import postgres from 'postgres';

async function main() {
  const client = postgres(process.env.DATABASE_URL!);
  const syncService = new DittoSyncService();
  
  // Obtener todos los tenants
  const tenants = await client`SELECT id FROM tenants WHERE is_active = true`;
  
  for (const tenant of tenants) {
    console.log(`\n🔄 Migrando tenant: ${tenant.id}`);
    
    const result = await syncService.migrateAllEntities(tenant.id);
    
    console.log(`✅ Migración completada:`, result);
  }
  
  await client.end();
  await syncService.close();
}

main().catch(console.error);
```

#### 2.2 Ejecutar Migración
```bash
cd src/worker
npm install
npm run migrate:ditto
```

#### 2.3 Validar Migración
- Verificar Things creados en Ditto API
- Comparar conteos: DB legacy vs Ditto
- Validar estructura de features

**Entregable**: Todos los datos legacy migrados a Ditto

---

### FASE 3: Módulo Frontend - Gestión de Digital Twins (3 horas)
**Objetivo**: Crear interfaz completa para gestionar Digital Twins

#### 3.1 Estructura de Archivos
```
src/frontend/src/features/digital-twins/
├── api/
│   └── digital-twins.api.ts          # React Query hooks
├── components/
│   ├── ThingCard.tsx                 # Card de Thing
│   ├── ThingFilters.tsx              # Filtros (tipo, estado)
│   ├── AttributeEditor.tsx           # Editor de atributos
│   ├── FeatureEditor.tsx             # Editor de features
│   ├── TelemetryViewer.tsx           # Visor de telemetría
│   └── ThingFormDialog.tsx           # Formulario crear/editar
├── pages/
│   ├── DigitalTwinsList.tsx          # Lista paginada
│   ├── DigitalTwinDetail.tsx         # Detalle con tabs
│   └── DigitalTwinForm.tsx           # Formulario completo
├── types/
│   └── digital-twins.types.ts        # Tipos TypeScript
└── index.ts                          # Barrel export
```

#### 3.2 Funcionalidades Clave
- **Lista**: Tabla paginada con filtros (tipo, tenant, búsqueda)
- **Detalle**: Tabs (Info, Atributos, Features, Telemetría, Historial)
- **CRUD**: Crear, editar, eliminar Things
- **Atributos**: Editor JSON con validación
- **Features**: Editor por feature con properties
- **Telemetría**: Gráficos en tiempo real (Recharts)

#### 3.3 Rutas
```typescript
// App.tsx
<Route path="/digital-twins" element={<DigitalTwinsList />} />
<Route path="/digital-twins/:thingId" element={<DigitalTwinDetail />} />
<Route path="/digital-twins/new" element={<DigitalTwinForm />} />
<Route path="/digital-twins/:thingId/edit" element={<DigitalTwinForm />} />
```

**Entregable**: Módulo frontend completo y funcional

---

### FASE 4: Integración con Módulos Operacionales (2 horas)
**Objetivo**: Al crear entidad en módulo operacional → Crear Asset en Ditto

#### 4.1 Módulos a Actualizar
- **Wells** (pozos)
- **Well Testing** (equipos de prueba)
- **Drilling** (equipos de perforación)
- **Coiled Tubing** (equipos CT)

#### 4.2 Patrón de Integración
```typescript
// Ejemplo: wells.service.ts
async createWell(data: CreateWellInput, tenantId: string) {
  // 1. Crear en tabla legacy (temporal)
  const well = await wellsRepository.create(data, tenantId);
  
  // 2. Crear Digital Twin en Ditto
  const thingId = await digitalTwinService.createThing({
    tenantId,
    type: 'WELL',
    code: well.wellCode,
    name: well.name,
    attributes: {
      apiNumber: well.apiNumber,
      wellType: well.wellType,
      // ... más atributos
    },
    features: {
      completion: {
        properties: {
          liftMethod: well.liftMethod,
          tubingSize: well.tubingSize,
          // ...
        }
      },
      location: {
        properties: {
          latitude: well.latitude,
          longitude: well.longitude,
          // ...
        }
      }
    }
  });
  
  // 3. Guardar referencia thingId en tabla legacy
  await wellsRepository.update(well.id, { dittoThingId: thingId });
  
  return { ...well, dittoThingId: thingId };
}
```

#### 4.3 Agregar Campo `ditto_thing_id`
```sql
ALTER TABLE wells ADD COLUMN ditto_thing_id VARCHAR(255);
ALTER TABLE basins ADD COLUMN ditto_thing_id VARCHAR(255);
ALTER TABLE fields ADD COLUMN ditto_thing_id VARCHAR(255);
ALTER TABLE reservoirs ADD COLUMN ditto_thing_id VARCHAR(255);
```

**Entregable**: Módulos operacionales crean assets en Ditto automáticamente

---

### FASE 5: Wrappers de Compatibilidad (1.5 horas)
**Objetivo**: Módulos legacy leen desde Ditto con fallback a PostgreSQL

#### 5.1 Actualizar Servicios Legacy
```typescript
// basins.service.ts
async getBasinById(id: string, tenantId: string) {
  // 1. Buscar en tabla legacy para obtener thingId
  const basin = await basinsRepository.findById(id, tenantId);
  
  if (!basin) {
    throw new Error('Basin not found');
  }
  
  // 2. Si tiene thingId, leer desde Ditto
  if (basin.dittoThingId) {
    const thing = await dittoClient.getThing(basin.dittoThingId);
    
    if (thing) {
      return this.transformDittoToBasin(thing);
    }
  }
  
  // 3. Fallback: retornar datos legacy
  return basin;
}
```

#### 5.2 Módulos a Actualizar
- `basins.service.ts`
- `fields.service.ts`
- `reservoirs.service.ts`
- `wells.service.ts`

**Entregable**: Lectura desde Ditto con fallback legacy

---

### FASE 6: Deprecación y Limpieza (Futuro)
**Objetivo**: Eliminar código legacy después de validación

**Actividades** (NO ejecutar ahora):
1. Monitorear uso de APIs legacy (2 semanas)
2. Validar integridad de datos Ditto vs Legacy
3. Crear backups completos
4. Eliminar tablas legacy (basins, fields, reservoirs, wells)
5. Eliminar módulos legacy del backend
6. Actualizar frontend para usar solo `/digital-twins`
7. Eliminar rutas legacy

**Entregable**: Código limpio sin legacy

---

## 📊 CHECKLIST DE VALIDACIÓN

### Después de Fase 2 (Migración)
- [ ] Contar Things en Ditto por tipo (BASIN, FIELD, RESERVOIR, WELL)
- [ ] Comparar conteos con tablas legacy
- [ ] Verificar estructura de features está completa
- [ ] Validar atributos críticos (name, code, status)

### Después de Fase 3 (Frontend)
- [ ] Navegar a `/digital-twins` y ver lista
- [ ] Filtrar por tipo de asset
- [ ] Abrir detalle de un Thing
- [ ] Editar atributos y verificar cambios
- [ ] Ver telemetría en tiempo real

### Después de Fase 4 (Integración)
- [ ] Crear un pozo nuevo
- [ ] Verificar que se creó Thing en Ditto
- [ ] Verificar campo `ditto_thing_id` en tabla legacy
- [ ] Ver el pozo en módulo Digital Twins

### Después de Fase 5 (Wrappers)
- [ ] Leer un basin desde API legacy
- [ ] Verificar que datos vienen desde Ditto
- [ ] Desactivar Ditto y verificar fallback a PostgreSQL

---

## 🚨 ROLLBACK PLAN

Si algo falla durante la migración:

1. **Fase 2 falla**: 
   - Eliminar Things creados en Ditto
   - Datos legacy intactos, no hay pérdida

2. **Fase 4 falla**:
   - Revertir cambios en servicios
   - Eliminar columna `ditto_thing_id`
   - Sistema sigue usando legacy

3. **Fase 5 falla**:
   - Revertir wrappers
   - Sistema vuelve a leer solo desde PostgreSQL

---

## 📝 COMANDOS ÚTILES

### Verificar Ditto
```bash
# Health check
curl http://localhost:8080/health

# Listar Things de un tenant
curl -u ditto:ditto http://localhost:8080/api/2/search/things?filter=like(thingId,"acme:*")

# Ver Thing específico
curl -u ditto:ditto http://localhost:8080/api/2/things/acme:well-mor-001
```

### Worker Service
```bash
cd src/worker
npm install
npm run dev                    # Desarrollo
npm run migrate:ditto          # Migración
```

### Backend API
```bash
cd src/backend
npm run dev                    # Puerto 3000
```

### Frontend
```bash
cd src/frontend
npm run dev                    # Puerto 5173
```

---

## 🎯 PRÓXIMO PASO INMEDIATO

**Ejecutar Fase 1**: Verificar que Eclipse Ditto está operativo

```bash
# 1. Verificar servicios Docker
docker ps | grep ditto

# 2. Health check
curl http://localhost:8080/health

# 3. Instalar dependencias Worker
cd src/worker && npm install
```

---

**Última actualización**: 2026-01-10  
**Responsable**: Sistema  
**Duración estimada**: 8 horas (1 día de trabajo)
