# DATABASE - SCADA+ERP Petroleum Platform

Este componente contiene los esquemas de base de datos, migraciones y seeds para PostgreSQL + TimescaleDB.

---

## TRACKING DE PROGRESO

**IMPORTANTE**: El seguimiento de progreso se hace en `/PROGRESS.md` (raíz del proyecto).

### Antes de Trabajar en Base de Datos
1. Consultar `/PROGRESS.md` → Sección "1.2 Base de Datos PostgreSQL + TimescaleDB"
2. Verificar "Siguiente paso" y dependencias
3. Revisar roadmap en `/roadmap/01_arquitectura/` si es necesario

### Después de Completar Trabajo
1. Actualizar `/PROGRESS.md` → Sección "1.2 Base de Datos"
2. Mover tareas a "Completadas" (ej: migraciones, schemas)
3. Actualizar porcentaje y "Siguiente paso"
4. Documentar bloqueadores si existen

**NO crear archivos STATUS.md o TODO.md en esta carpeta.**

---

Este componente contiene todos los esquemas, migraciones y funciones SQL para la base de datos del sistema Edge.

## Stack Tecnológico

- **RDBMS**: PostgreSQL 16
- **Time-Series**: TimescaleDB 2.x (extensión de PostgreSQL)
- **Geoespacial**: PostGIS (para coordenadas de pozos y mapas)
- **ORM**: Drizzle ORM (en backend)

## Estructura de Base de Datos

### Esquemas PostgreSQL

```
scadaerp/
├── public                    # Esquema por defecto
│   ├── Tablas maestras
│   ├── Tablas operacionales
│   └── Tablas ERP
├── timeseries               # Esquema para hypertables
│   ├── well_production
│   ├── well_telemetry
│   ├── drilling_telemetry
│   └── alarms_history
└── sync                     # Esquema para sincronización
    ├── sync_outbox
    └── sync_log
```

## Tablas Principales

### Core Tables
- `tenants` - Multi-tenancy
- `users` - Usuarios del sistema
- `roles` - Roles RBAC
- `permissions` - Permisos granulares
- `audit_log` - Auditoría de acciones

### Wells & Fields
- `fields` - Campos petroleros
- `wells` - Pozos
- `well_completions` - Completaciones de pozos
- `well_equipment` - Equipos instalados

### Well Testing
- `well_tests` - Pruebas de pozo
- `ipr_data` - Datos IPR (Inflow Performance)
- `vlp_data` - Datos VLP (Vertical Lift Performance)
- `pressure_surveys` - Surveys de presión

### Drilling
- `drilling_programs` - Programas de perforación
- `drilling_daily_reports` - Reportes diarios
- `drilling_bha` - Bottom Hole Assemblies
- `drilling_mud_properties` - Propiedades de lodo

### Production
- `production_daily` - Producción diaria
- `production_monthly` - Producción mensual (agregada)
- `well_downtime` - Tiempos muertos
- `artificial_lift` - Sistemas de levantamiento artificial

### Coiled Tubing
- `ct_jobs` - Trabajos de coiled tubing
- `ct_strings` - Strings de CT
- `ct_fatigue_tracking` - Seguimiento de fatiga

### Reservoirs
- `reservoirs` - Yacimientos
- `reservoir_zones` - Zonas productoras
- `pvt_data` - Datos PVT
- `reserves` - Reservas

### ERP
- `inventory_items` - Items de inventario
- `inventory_transactions` - Movimientos
- `purchase_orders` - Órdenes de compra
- `invoices` - Facturas
- `employees` - Empleados
- `work_orders` - Órdenes de trabajo

### Time-Series (Hypertables)
- `well_production_ts` - Producción en tiempo real
- `well_telemetry_ts` - Telemetría de pozos
- `drilling_telemetry_ts` - Telemetría de perforación
- `alarms_ts` - Histórico de alarmas
- `scada_tags_ts` - Tags SCADA

## Convenciones de Diseño

### Naming Conventions
- **Tablas**: snake_case, plural (`wells`, `well_tests`)
- **Columnas**: snake_case (`well_name`, `oil_rate_bopd`)
- **Primary Keys**: `id` (UUID v4)
- **Foreign Keys**: `<tabla>_id` (`well_id`, `field_id`)
- **Timestamps**: `created_at`, `updated_at`
- **Soft deletes**: `deleted_at`

### Campos Estándar en Todas las Tablas
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
tenant_id UUID NOT NULL REFERENCES tenants(id),
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
created_by UUID REFERENCES users(id),
updated_by UUID REFERENCES users(id)
```

### Índices
- Primary key en `id`
- Index en `tenant_id` (multi-tenancy)
- Index en foreign keys
- Index en campos de búsqueda frecuente
- Composite index para queries comunes

## TimescaleDB Hypertables

### Creación de Hypertable
```sql
-- Crear tabla normal
CREATE TABLE well_production_ts (
    time TIMESTAMPTZ NOT NULL,
    well_id UUID NOT NULL,
    oil_rate_bopd NUMERIC(10,2),
    gas_rate_mcfd NUMERIC(10,2),
    water_rate_bwpd NUMERIC(10,2),
    thp_psi NUMERIC(10,2),
    quality_code SMALLINT DEFAULT 192
);

-- Convertir a hypertable
SELECT create_hypertable('well_production_ts', 'time');

-- Crear índices
CREATE INDEX idx_well_production_ts_well_time 
    ON well_production_ts (well_id, time DESC);
```

### Continuous Aggregates
```sql
-- Agregación horaria automática
CREATE MATERIALIZED VIEW well_production_hourly
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', time) AS bucket,
    well_id,
    AVG(oil_rate_bopd) as avg_oil_rate,
    AVG(gas_rate_mcfd) as avg_gas_rate,
    AVG(water_rate_bwpd) as avg_water_rate,
    AVG(thp_psi) as avg_thp
FROM well_production_ts
GROUP BY bucket, well_id;

-- Política de refresh
SELECT add_continuous_aggregate_policy('well_production_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');
```

### Retention Policies
```sql
-- Retener datos raw por 90 días
SELECT add_retention_policy('well_production_ts', INTERVAL '90 days');

-- Retener agregados horarios por 2 años
SELECT add_retention_policy('well_production_hourly', INTERVAL '2 years');

-- Retener agregados diarios indefinidamente
-- (no agregar retention policy)
```

### Compression Policies
```sql
-- Comprimir datos mayores a 7 días
SELECT add_compression_policy('well_production_ts', INTERVAL '7 days');

-- Verificar compresión
SELECT * FROM timescaledb_information.compression_settings
WHERE hypertable_name = 'well_production_ts';
```

## Migraciones

Las migraciones se gestionan con Drizzle Kit:

```bash
# Crear nueva migración
npm run db:generate

# Aplicar migraciones
npm run db:migrate

# Rollback última migración
npm run db:rollback
```

### Estructura de Migraciones
```
migrations/
├── 0001_create_core_tables.sql
├── 0002_create_wells_tables.sql
├── 0003_create_well_testing_tables.sql
├── 0004_create_drilling_tables.sql
├── 0005_create_production_tables.sql
├── 0006_create_timeseries_hypertables.sql
├── 0007_create_erp_tables.sql
└── 0008_create_sync_tables.sql
```

## Funciones SQL

### Cálculos de Ingeniería
```sql
-- Calcular IPR (Vogel)
CREATE OR REPLACE FUNCTION calculate_ipr_vogel(
    p_reservoir NUMERIC,
    p_wellbore NUMERIC,
    q_test NUMERIC,
    p_test NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
    j NUMERIC;
    q_max NUMERIC;
BEGIN
    j := q_test / (p_reservoir - p_test);
    q_max := j * p_reservoir;
    RETURN q_max * (1 - 0.2*(p_wellbore/p_reservoir) - 0.8*(p_wellbore/p_reservoir)^2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calcular decline exponencial
CREATE OR REPLACE FUNCTION calculate_exponential_decline(
    q_initial NUMERIC,
    decline_rate NUMERIC,
    time_days NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
    RETURN q_initial * EXP(-decline_rate * time_days / 365.25);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### Triggers
```sql
-- Auto-actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas
CREATE TRIGGER update_wells_updated_at 
    BEFORE UPDATE ON wells
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Seeds (Datos de Prueba)

```bash
# Cargar datos de desarrollo
npm run db:seed:dev

# Cargar datos de test
npm run db:seed:test
```

Seeds incluyen:
- Usuario admin por defecto
- Campos y pozos de ejemplo
- Datos de producción históricos
- Configuración de tags SCADA

## Backup y Restore

### Backup Completo
```bash
# Backup con pg_dump
pg_dump -h localhost -U postgres -d scadaerp \
    -F c -b -v -f backup_$(date +%Y%m%d_%H%M%S).dump

# Backup solo esquema
pg_dump -h localhost -U postgres -d scadaerp \
    --schema-only -f schema.sql

# Backup solo datos
pg_dump -h localhost -U postgres -d scadaerp \
    --data-only -f data.sql
```

### Restore
```bash
# Restore desde dump
pg_restore -h localhost -U postgres -d scadaerp \
    -v backup_20260108_120000.dump

# Restore desde SQL
psql -h localhost -U postgres -d scadaerp -f backup.sql
```

### Backup Automático
```bash
# Cron job diario (3 AM)
0 3 * * * /usr/local/bin/backup-scadaerp.sh
```

## Monitoreo

### Queries Útiles
```sql
-- Tamaño de base de datos
SELECT pg_size_pretty(pg_database_size('scadaerp'));

-- Tamaño por tabla
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Hypertables y compresión
SELECT 
    hypertable_name,
    pg_size_pretty(total_bytes) as total_size,
    pg_size_pretty(compressed_total_bytes) as compressed_size,
    compression_ratio
FROM timescaledb_information.hypertables
ORDER BY total_bytes DESC;

-- Queries lentas
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Performance Tuning

### postgresql.conf
```ini
# Memoria
shared_buffers = 4GB
effective_cache_size = 12GB
work_mem = 64MB
maintenance_work_mem = 1GB

# TimescaleDB
timescaledb.max_background_workers = 8

# Checkpoints
checkpoint_completion_target = 0.9
wal_buffers = 16MB

# Logging
log_min_duration_statement = 1000  # Log queries > 1s
```

### Vacuum y Analyze
```sql
-- Vacuum automático configurado
ALTER TABLE wells SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);

-- Vacuum manual
VACUUM ANALYZE wells;
```

## Seguridad

- Usuarios con privilegios mínimos necesarios
- Row Level Security (RLS) para multi-tenancy
- Encriptación en reposo (PostgreSQL TDE)
- Encriptación en tránsito (SSL/TLS)
- Backups encriptados
- Auditoría de accesos en `audit_log`
