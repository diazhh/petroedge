# BLOQUE 7: PLAN DE MIGRACIÓN Y LIMPIEZA

> **Módulo**: Coiled Tubing  
> **Fase**: Migración de Datos y Eliminación de Código Legacy  
> **Duración estimada**: 1 semana  
> **Prioridad**: 🔴 CRÍTICA (Cleanup final)

---

## 📋 ÍNDICE

1. [Estrategia de Migración](#estrategia-de-migración)
2. [Migración de Datos](#migración-de-datos)
3. [Eliminación de Código](#eliminación-de-código)
4. [Validación Post-Migración](#validación-post-migración)
5. [Rollback Plan](#rollback-plan)
6. [Implementación](#implementación)

---

## 1. ESTRATEGIA DE MIGRACIÓN

### 1.1 Enfoque

**IMPORTANTE**: No migrar datos de las tablas antiguas a assets porque:
1. Las tablas `ct_units` y `ct_reels` antiguas **nunca se poblaron correctamente**
2. El módulo CT original **nunca se usó en producción**
3. Es más limpio comenzar desde cero con seeds

**Estrategia**: **DROP & RECREATE**

```
1. Backup de DB (precaución)
2. DROP tablas obsoletas
3. Crear nuevos seeds con Digital Twins
4. Validar funcionamiento
5. Eliminar código backend legacy
6. Eliminar frontend legacy
```

### 1.2 Timeline

| Día | Actividad | Responsable |
|-----|-----------|-------------|
| **Día 1** | Backup DB + DROP tablas | DevOps |
| **Día 2** | Crear Asset Types y Templates | Backend |
| **Día 3** | Seed assets CT (units, reels) | Backend |
| **Día 4** | Seed jobs y datos transaccionales | Backend |
| **Día 5** | Eliminar código backend obsoleto | Backend |
| **Día 6** | Eliminar código frontend obsoleto | Frontend |
| **Día 7** | Testing E2E + Validación | QA |

---

## 2. MIGRACIÓN DE DATOS

### 2.1 Backup

```bash
#!/bin/bash
# backup-before-migration.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="scadaerp_backup_pre_ct_migration_${TIMESTAMP}.sql"

echo "📦 Creando backup de base de datos..."

PGPASSWORD=scadaerp_dev_password pg_dump \
  -h localhost \
  -p 15432 \
  -U scadaerp \
  -d scadaerp \
  -F c \
  -f "/tmp/${BACKUP_FILE}"

echo "✅ Backup creado: /tmp/${BACKUP_FILE}"
echo "📊 Tamaño: $(du -h /tmp/${BACKUP_FILE} | cut -f1)"
```

### 2.2 Migration SQL: DROP Tablas Obsoletas

**Archivo**: `/src/backend/drizzle/migrations/0015_drop_ct_legacy_tables.sql`

```sql
-- ============================================================================
-- MIGRATION: Drop CT Legacy Tables
-- Fecha: 2026-01-12
-- Descripción: Elimina tablas obsoletas del módulo CT que serán reemplazadas
--              por arquitectura Digital Twins (Assets)
-- ============================================================================

-- IMPORTANTE: Este script NO migra datos porque las tablas legacy nunca
-- se poblaron en producción. Se crearán seeds nuevos con Digital Twins.

BEGIN;

-- 1. Verificar que las tablas están vacías (safety check)
DO $$
DECLARE
  ct_units_count INTEGER;
  ct_reels_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO ct_units_count FROM ct_units;
  SELECT COUNT(*) INTO ct_reels_count FROM ct_reels;
  
  IF ct_units_count > 0 OR ct_reels_count > 0 THEN
    RAISE EXCEPTION 'CT legacy tables contain data! Migration aborted. Manual review required.';
  END IF;
  
  RAISE NOTICE 'Safety check passed: Legacy tables are empty';
END $$;

-- 2. DROP tablas en orden (respetando foreign keys)
RAISE NOTICE 'Dropping CT legacy tables...';

DROP TABLE IF EXISTS ct_realtime_data CASCADE;
DROP TABLE IF EXISTS ct_alarms CASCADE;
DROP TABLE IF EXISTS ct_fatigue_cycles CASCADE;
DROP TABLE IF EXISTS ct_bha_components CASCADE;
DROP TABLE IF EXISTS ct_job_bha CASCADE;
DROP TABLE IF EXISTS ct_job_tickets CASCADE;
DROP TABLE IF EXISTS ct_job_fluids CASCADE;
DROP TABLE IF EXISTS ct_job_operations CASCADE;
DROP TABLE IF EXISTS ct_jobs CASCADE;
DROP TABLE IF EXISTS ct_reel_sections CASCADE;
DROP TABLE IF EXISTS ct_reels CASCADE;
DROP TABLE IF EXISTS ct_units CASCADE;

RAISE NOTICE '✅ CT legacy tables dropped successfully';

-- 3. Recrear SOLO las tablas transaccionales necesarias
RAISE NOTICE 'Creating new CT transactional tables...';

-- ct_jobs (mantiene transacciones de jobs)
CREATE TABLE ct_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  job_number VARCHAR(50) NOT NULL,
  job_type VARCHAR(50) NOT NULL,
  
  -- Relaciones con Digital Twins
  well_id VARCHAR(200),  -- Ditto Thing ID
  field_name VARCHAR(100),
  ct_unit_id UUID REFERENCES assets(id),  -- Asset ID
  ct_reel_id UUID REFERENCES assets(id),  -- Asset ID
  
  planned_start_date TIMESTAMP,
  actual_start_date TIMESTAMP,
  planned_end_date TIMESTAMP,
  actual_end_date TIMESTAMP,
  
  supervisor VARCHAR(100),
  operator VARCHAR(100),
  client VARCHAR(100),
  client_representative VARCHAR(100),
  
  objective TEXT,
  well_depth_ft INTEGER,
  target_depth_ft INTEGER,
  estimated_duration_hours NUMERIC,
  
  status VARCHAR(20) DEFAULT 'DRAFT',
  description TEXT,
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  
  UNIQUE(tenant_id, job_number)
);

CREATE INDEX idx_ct_jobs_status ON ct_jobs(status);
CREATE INDEX idx_ct_jobs_unit ON ct_jobs(ct_unit_id);
CREATE INDEX idx_ct_jobs_reel ON ct_jobs(ct_reel_id);
CREATE INDEX idx_ct_jobs_dates ON ct_jobs(actual_start_date, actual_end_date);

-- ct_job_operations
CREATE TABLE ct_job_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES ct_jobs(id) ON DELETE CASCADE,
  
  sequence_number INTEGER NOT NULL,
  operation_type VARCHAR(50) NOT NULL,
  
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_minutes INTEGER,
  
  start_depth_ft INTEGER,
  end_depth_ft INTEGER,
  max_weight_lbs INTEGER,
  max_pressure_psi INTEGER,
  pump_rate_bpm NUMERIC(6, 2),
  
  description TEXT,
  observations TEXT,
  status VARCHAR(20) DEFAULT 'IN_PROGRESS',
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ct_job_operations_job ON ct_job_operations(job_id);

-- ct_job_fluids
CREATE TABLE ct_job_fluids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES ct_jobs(id) ON DELETE CASCADE,
  
  sequence_number INTEGER NOT NULL,
  fluid_type VARCHAR(50) NOT NULL,
  fluid_name VARCHAR(100),
  density_ppg NUMERIC(5, 2),
  viscosity_cp NUMERIC(6, 2),
  
  planned_volume_bbl NUMERIC(10, 2),
  actual_volume_bbl NUMERIC(10, 2),
  pump_rate_bpm NUMERIC(6, 2),
  pump_pressure_psi INTEGER,
  
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  observations TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ct_job_fluids_job ON ct_job_fluids(job_id);

-- ct_job_bha
CREATE TABLE ct_job_bha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES ct_jobs(id) ON DELETE CASCADE,
  
  bha_config_name VARCHAR(100),
  total_length_ft NUMERIC(8, 2),
  total_weight_lbs NUMERIC(10, 2),
  description TEXT,
  schematic_url VARCHAR(500),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ct_bha_components
CREATE TABLE ct_bha_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bha_id UUID NOT NULL REFERENCES ct_job_bha(id) ON DELETE CASCADE,
  
  sequence_number INTEGER NOT NULL,
  component_asset_id UUID REFERENCES assets(id),
  component_type VARCHAR(50) NOT NULL,
  component_name VARCHAR(100),
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100),
  
  length_ft NUMERIC(6, 2),
  outer_diameter_in NUMERIC(5, 3),
  inner_diameter_in NUMERIC(5, 3),
  weight_lbs NUMERIC(8, 2),
  specifications JSONB
);

CREATE INDEX idx_ct_bha_components_bha ON ct_bha_components(bha_id);

-- ct_job_tickets
CREATE TABLE ct_job_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES ct_jobs(id) ON DELETE CASCADE,
  
  ticket_number VARCHAR(50) NOT NULL,
  summary TEXT,
  operations_summary TEXT,
  fluids_summary TEXT,
  results_summary TEXT,
  
  operator_signature VARCHAR(200),
  operator_signed_at TIMESTAMP,
  supervisor_signature VARCHAR(200),
  supervisor_signed_at TIMESTAMP,
  client_signature VARCHAR(200),
  client_signed_at TIMESTAMP,
  
  pdf_url VARCHAR(500),
  pdf_generated_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'DRAFT',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ct_fatigue_cycles (histórico/auditoría)
CREATE TABLE ct_fatigue_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id UUID NOT NULL REFERENCES assets(id),
  section_id UUID REFERENCES assets(id),
  job_id UUID REFERENCES ct_jobs(id) ON DELETE SET NULL,
  
  cycle_type VARCHAR(20) NOT NULL,
  max_strain NUMERIC(8, 6),
  max_pressure_psi INTEGER,
  guide_radius_in NUMERIC(6, 2),
  
  cycles_applied INTEGER DEFAULT 1,
  cycles_to_failure INTEGER,
  damage_ratio NUMERIC(10, 8),
  
  occurred_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ct_fatigue_cycles_reel ON ct_fatigue_cycles(reel_id);
CREATE INDEX idx_ct_fatigue_cycles_job ON ct_fatigue_cycles(job_id);

RAISE NOTICE '✅ New CT transactional tables created';

COMMIT;

RAISE NOTICE '🎉 CT migration completed successfully!';
```

### 2.3 Ejecutar Migration

```bash
# Aplicar migration
cd src/backend
npm run db:migrate

# Verificar
psql -h localhost -p 15432 -U scadaerp -d scadaerp -c "\dt ct_*"
```

---

## 3. ELIMINACIÓN DE CÓDIGO

### 3.1 Archivos Backend a Eliminar

```bash
# Script: cleanup-ct-backend-legacy.sh

echo "🗑️ Eliminando código backend legacy del módulo CT..."

# 1. Consumer de telemetría obsoleto
rm -f src/backend/src/modules/coiled-tubing/realtime-consumer.service.ts

# 2. Repositorios de tablas obsoletas
rm -f src/backend/src/modules/coiled-tubing/repositories/ct-units.repository.ts
rm -f src/backend/src/modules/coiled-tubing/repositories/ct-reels.repository.ts
rm -f src/backend/src/modules/coiled-tubing/repositories/ct-realtime-data.repository.ts
rm -f src/backend/src/modules/coiled-tubing/repositories/ct-alarms.repository.ts

# 3. Servicios que usan las tablas obsoletas (refactorizar, no eliminar)
# NOTA: ct-jobs.service.ts se REFACTORIZA para usar assets en lugar de eliminar

echo "✅ Archivos legacy eliminados"
echo "⚠️ IMPORTANTE: Refactorizar ct-jobs.service.ts para usar AssetsService"
```

### 3.2 Actualizar schema.ts

**Archivo**: `/src/backend/src/common/database/schema.ts`

Eliminar las definiciones de tablas obsoletas:

```typescript
// ❌ ELIMINAR estas líneas:

export const ctUnits = pgTable('ct_units', { ... });
export const ctReels = pgTable('ct_reels', { ... });
export const ctReelSections = pgTable('ct_reel_sections', { ... });
export const ctRealtimeData = pgTable('ct_realtime_data', { ... });
export const ctAlarms = pgTable('ct_alarms', { ... });

// Las siguientes tablas se MANTIENEN (son transaccionales):
// - ct_jobs
// - ct_job_operations
// - ct_job_fluids
// - ct_job_bha
// - ct_bha_components
// - ct_job_tickets
// - ct_fatigue_cycles
```

### 3.3 Refactorizar ct-jobs.service.ts

```typescript
// Antes (usando ct_units y ct_reels tables)
const unit = await ctUnitsRepository.findById(unitId);
const reel = await ctReelsRepository.findById(reelId);

// Después (usando Assets)
const unit = await assetsService.findById(unitId);
const reel = await assetsService.findById(reelId);

// Validar que son del tipo correcto
if (unit.assetType !== 'CT_UNIT') {
  throw new Error('Invalid unit: not a CT_UNIT asset');
}
if (reel.assetType !== 'CT_REEL') {
  throw new Error('Invalid reel: not a CT_REEL asset');
}
```

### 3.4 Archivos Frontend a Eliminar

**NOTA**: Si el frontend antiguo nunca se implementó, no hay nada que eliminar. Construir todo desde cero según Bloque 5.

---

## 4. VALIDACIÓN POST-MIGRACIÓN

### 4.1 Checklist de Validación

**Database**:
- [ ] Tablas legacy eliminadas (`\dt ct_units` retorna vacío)
- [ ] Tablas transaccionales creadas correctamente
- [ ] Assets tables intactas (`assets`, `asset_types`, `asset_telemetry`)

**Backend**:
- [ ] Server inicia sin errores
- [ ] Assets API funciona: `GET /api/v1/assets?assetType=CT_UNIT`
- [ ] Jobs API funciona: `GET /api/v1/coiled-tubing/jobs`
- [ ] Calculations API responde

**Frontend**:
- [ ] Dashboard carga sin errores
- [ ] Asset templates visibles en `/asset-templates`
- [ ] Digital twins visibles en `/digital-twins`

**Telemetry Flow**:
- [ ] Simulador envía a Kafka
- [ ] TelemetryConsumerService procesa mensajes
- [ ] Datos aparecen en `asset_telemetry`
- [ ] WebSocket broadcast funciona

**Rule Engine**:
- [ ] Reglas CT se ejecutan
- [ ] Fatiga se calcula
- [ ] Alarmas se crean en `alarms` table

### 4.2 Test Script

```bash
#!/bin/bash
# validate-ct-migration.sh

echo "🧪 Validando migración del módulo CT..."

# 1. Check database
echo "1️⃣ Verificando base de datos..."
psql -h localhost -p 15432 -U scadaerp -d scadaerp <<EOF
-- Verificar que legacy tables NO existen
SELECT 'FAIL: ct_units still exists' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ct_units');
SELECT 'FAIL: ct_reels still exists' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ct_reels');

-- Verificar que nuevas tables existen
SELECT 'OK: ct_jobs exists' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ct_jobs');
SELECT 'OK: assets exists' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assets');

-- Contar asset types CT
SELECT 'Asset Types CT: ' || COUNT(*) FROM asset_types WHERE code LIKE 'CT_%';

-- Contar assets CT
SELECT 'CT Assets: ' || COUNT(*) FROM assets WHERE asset_type LIKE 'CT_%';
EOF

# 2. Check backend APIs
echo "2️⃣ Verificando APIs backend..."
curl -s http://localhost:3000/api/v1/assets?assetType=CT_UNIT | jq '.data | length'
curl -s http://localhost:3000/api/v1/coiled-tubing/jobs | jq '.data | length'

# 3. Check telemetry flow
echo "3️⃣ Verificando flujo de telemetría..."
# (requiere que simulador esté corriendo)

echo "✅ Validación completada"
```

---

## 5. ROLLBACK PLAN

### 5.1 En Caso de Fallo

```bash
#!/bin/bash
# rollback-ct-migration.sh

echo "⚠️ Ejecutando rollback de migración CT..."

# 1. Detener backend
pm2 stop backend

# 2. Restaurar backup
BACKUP_FILE="/tmp/scadaerp_backup_pre_ct_migration_YYYYMMDD_HHMMSS.sql"

PGPASSWORD=scadaerp_dev_password pg_restore \
  -h localhost \
  -p 15432 \
  -U scadaerp \
  -d scadaerp \
  -c \
  "$BACKUP_FILE"

# 3. Revertir código (git)
cd /home/diazhh/dev/scadaerp
git checkout HEAD~1  # Volver al commit anterior

# 4. Reiniciar backend
pm2 start backend

echo "✅ Rollback completado"
```

### 5.2 Criterios para Rollback

Ejecutar rollback SI:
- ❌ Migration SQL falla
- ❌ Backend no inicia después de migración
- ❌ Telemetry flow completamente roto
- ❌ Pérdida de datos críticos

NO ejecutar rollback si:
- ✅ Solo hay bugs menores en frontend
- ✅ Alarmas no se disparan (se puede arreglar después)
- ✅ Dashboard muestra datos incorrectos (problema de UI)

---

## 6. IMPLEMENTACIÓN

### 6.1 Orden de Ejecución

**Pre-Migración** (Día 0):
1. Code freeze del módulo CT
2. Comunicar a usuarios (si aplica)
3. Crear backup de DB

**Migración** (Día 1-7):

**Día 1: Database**
```bash
# 1. Backup
./backup-before-migration.sh

# 2. Aplicar migration
cd src/backend
npm run db:migrate

# 3. Validar
./validate-ct-migration.sh
```

**Día 2-3: Backend**
```bash
# 1. Eliminar código legacy
./cleanup-ct-backend-legacy.sh

# 2. Refactorizar ct-jobs.service.ts
# (manual)

# 3. Ejecutar tests
npm test -- --grep "CT"
```

**Día 4: Seeds**
```bash
# 1. Crear asset types
npm run seed:ct-asset-types

# 2. Crear assets
npm run seed:ct-assets

# 3. Crear jobs
npm run seed:ct-jobs
```

**Día 5-6: Frontend**
```bash
# Implementar según Bloque 5
# (si hay frontend legacy, eliminarlo primero)
```

**Día 7: Validación Final**
```bash
# 1. E2E tests
npm run test:e2e

# 2. Validación manual
./validate-ct-migration.sh

# 3. Sign-off
```

### 6.2 Checklist Completo

**Pre-Migración**:
- [ ] Code freeze anunciado
- [ ] Backup de DB creado
- [ ] Rollback plan documentado
- [ ] Team briefed

**Migración DB**:
- [ ] Migration SQL ejecutada
- [ ] Tablas legacy eliminadas
- [ ] Tablas transaccionales creadas
- [ ] Constraints verificados

**Backend Cleanup**:
- [ ] Archivos legacy eliminados
- [ ] schema.ts actualizado
- [ ] ct-jobs.service.ts refactorizado
- [ ] Tests unitarios pasan

**Seeds**:
- [ ] Asset Types CT creados (7 tipos)
- [ ] Assets CT creados (3 units, 6 reels)
- [ ] Jobs CT creados (12 jobs)
- [ ] Edge config creada (device profiles, bindings)

**Frontend**:
- [ ] Dashboard implementado
- [ ] Wizard implementado
- [ ] Monitor RT implementado
- [ ] Components reutilizables creados

**Testing**:
- [ ] Unit tests pasan (>80% coverage)
- [ ] Integration tests pasan
- [ ] E2E tests pasan
- [ ] Manual testing completado

**Documentación**:
- [ ] README actualizado
- [ ] API docs actualizadas (Swagger)
- [ ] User guide creado
- [ ] Runbook de operaciones

**Deployment**:
- [ ] Staging deployed
- [ ] Production deployed
- [ ] Monitoring configurado
- [ ] Alertas configuradas

---

## 📊 CRITERIOS DE ÉXITO

- ✅ Todas las tablas legacy eliminadas
- ✅ Código legacy eliminado
- ✅ 0 errores en logs post-migración
- ✅ Telemetría fluyendo correctamente
- ✅ Dashboard mostrando datos reales
- ✅ Simulador funcionando
- ✅ Tests E2E pasando (>95%)
- ✅ Documentation completa

---

## 🎉 POST-MIGRACIÓN

### Comunicación

**Email a Stakeholders**:
```
Asunto: Módulo Coiled Tubing - Refactorización Completada

El módulo de Coiled Tubing ha sido refactorizado exitosamente con la nueva arquitectura de Digital Twins.

Cambios principales:
- ✅ Integración con sistema de Assets core
- ✅ Telemetría en tiempo real mejorada
- ✅ Motor de reglas para cálculos automáticos
- ✅ Dashboard profesional
- ✅ Simulador para testing

Acceso:
- Dashboard: http://localhost:5173/coiled-tubing
- Assets CT: http://localhost:5173/digital-twins?type=CT_UNIT

Documentación: /roadmap/03_modulo_coiled_tubing/

Equipo PetroEdge
```

### Monitoreo Post-Deployment

**Métricas a vigilar** (primeras 48 horas):
- Errores en logs
- Latencia de APIs
- Throughput de Kafka
- CPU/Memoria del backend
- Queries lentas en DB

---

**FIN DEL ROADMAP CT** 🎉

---

## 📚 REFERENCIAS

- Bloque 1: [Arquitectura y Asset Types](./01_ARQUITECTURA_ASSET_TYPES.md)
- Bloque 2: [Edge Gateway e Ingesta](./02_EDGE_GATEWAY_INGESTA.md)
- Bloque 3: [Motor de Reglas](./03_MOTOR_REGLAS_NODOS_CT.md)
- Bloque 4: [Backend Refactorizado](./04_BACKEND_REFACTORIZADO.md)
- Bloque 5: [Frontend Profesional](./05_FRONTEND_PROFESIONAL.md)
- Bloque 6: [Simulador y Seeds](./06_SIMULADOR_SEEDS.md)
- Master Roadmap: [00_MASTER_ROADMAP_CT.md](./00_MASTER_ROADMAP_CT.md)
