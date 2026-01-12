# Coiled Tubing - Quickstart

Guía rápida para probar el módulo de Coiled Tubing con datos de prueba y simulador.

## 1. Aplicar Migración de Base de Datos

```bash
cd /home/diazhh/dev/scadaerp
PGPASSWORD=scadaerp_dev_password psql -h localhost -p 15432 -U scadaerp -d scadaerp \
    -f database/postgres/migrations/017_create_coiled_tubing_module.sql
```

## 2. Cargar Seeds de Datos de Prueba

```bash
PGPASSWORD=scadaerp_dev_password psql -h localhost -p 15432 -U scadaerp -d scadaerp \
    -f database/seeds/coiled_tubing_seed.sql
```

**Datos creados:**
- 3 CT Units (60K, 80K, 100K lbs capacidad)
- 6 Reels con diferentes niveles de fatiga y secciones
- 12 Jobs (CLN, N2L, ACT, MIL, FSH, LOG, etc.) en diferentes estados
- BHA configurations, operaciones, fluidos, alarmas

## 3. Verificar Datos en PostgreSQL

```sql
-- Ver CT Units
SELECT unit_number, status, injector_capacity_lbs, location FROM ct_units;

-- Ver Reels con fatiga
SELECT reel_number, steel_grade, total_length_ft, fatigue_percentage, condition 
FROM ct_reels ORDER BY fatigue_percentage DESC;

-- Ver Jobs
SELECT job_number, job_type, status, planned_depth_ft, client_name 
FROM ct_jobs ORDER BY created_at DESC;
```

## 4. Configurar Simulador

```bash
cd /home/diazhh/dev/scadaerp/simulators/coiled-tubing

# Crear virtual environment
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

## 5. Obtener IDs para Simulación

```bash
# Obtener Job ID del job en progreso (CT-2026-043)
PGPASSWORD=scadaerp_dev_password psql -h localhost -p 15432 -U scadaerp -d scadaerp \
    -t -c "SELECT id FROM ct_jobs WHERE job_number = 'CT-2026-043';" | tr -d ' '

# Obtener Unit ID (CT-UNIT-02)
PGPASSWORD=scadaerp_dev_password psql -h localhost -p 15432 -U scadaerp -d scadaerp \
    -t -c "SELECT id FROM ct_units WHERE unit_number = 'CT-UNIT-02';" | tr -d ' '
```

## 6. Ejecutar Simulador

```bash
# Reemplazar <JOB_ID> y <UNIT_ID> con los valores obtenidos arriba
python3 ct_simulator.py \
    --job-id <JOB_ID> \
    --unit-id <UNIT_ID> \
    --job-type N2L \
    --target-depth 6500
```

**Output esperado:**
```
==============================================================
SIMULADOR COILED TUBING
Job: <uuid> | Type: N2L
Unit: <uuid>
Target Depth: 6500 ft
Kafka: localhost:9092 -> ct.telemetry
==============================================================

=== INICIANDO RIH - Target: 6500 ft ===
[2026-01-12T...] Depth: 58.2 ft | Weight: -142 lbs | Pressure: 0 psi | Op: RIH
[2026-01-12T...] Depth: 116.8 ft | Weight: -286 lbs | Pressure: 0 psi | Op: RIH
...
```

## 7. Verificar Telemetría en Dashboard

1. Iniciar backend (si no está corriendo):
```bash
cd /home/diazhh/dev/scadaerp/src/backend
npm run dev
```

2. Iniciar frontend (si no está corriendo):
```bash
cd /home/diazhh/dev/scadaerp/src/frontend
npm run dev
```

3. Abrir navegador: `http://localhost:5173`

4. Login con:
   - Email: `operator@acme-petroleum.com`
   - Password: `Operator123!`

5. Navegar a: **Coiled Tubing → Jobs → CT-2026-043 → Real-time**

Deberías ver:
- Gráfico de profundidad vs tiempo
- Peso en superficie actualizándose
- Presiones de bomba y anular
- Velocidad del inyector
- Estado de la operación (RIH/CIRCULATE/POOH)

## 8. Verificar Datos en TimescaleDB

```sql
-- Ver telemetría reciente
SELECT 
    time, 
    depth_ft, 
    surface_weight_lbs, 
    pump_pressure_psi, 
    operation_mode 
FROM ct_realtime_data 
WHERE job_id = '<JOB_ID>'
ORDER BY time DESC 
LIMIT 20;

-- Estadísticas del job
SELECT 
    COUNT(*) as total_points,
    MIN(depth_ft) as min_depth,
    MAX(depth_ft) as max_depth,
    AVG(surface_weight_lbs) as avg_weight,
    MAX(pump_pressure_psi) as max_pressure
FROM ct_realtime_data 
WHERE job_id = '<JOB_ID>';
```

## Troubleshooting

### "Kafka broker not available"
```bash
cd /home/diazhh/dev/scadaerp/infrastructure/docker
docker-compose ps
docker-compose restart kafka
```

### No aparecen datos en dashboard
- Verificar que el consumer de backend esté corriendo
- Revisar logs: `cd src/backend && npm run dev`
- Verificar WebSocket connection en DevTools → Network → WS

### Seeds fallan
Si ya existen datos, eliminar primero:
```sql
DELETE FROM ct_fatigue_cycles;
DELETE FROM ct_alarms;
DELETE FROM ct_bha_components;
DELETE FROM ct_job_bha;
DELETE FROM ct_job_fluids;
DELETE FROM ct_job_operations;
DELETE FROM ct_job_tickets;
DELETE FROM ct_jobs;
DELETE FROM ct_reel_sections;
DELETE FROM ct_reels;
DELETE FROM ct_units;
```

## Próximos Pasos

- Explorar diferentes tipos de jobs (CLN, ACT, MIL)
- Ver mapa de fatiga de reels
- Probar cálculos de ingeniería
- Generar job tickets
- Configurar alarmas personalizadas
