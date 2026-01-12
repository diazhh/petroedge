# Simulador de Coiled Tubing

Simulador independiente que genera telemetría en tiempo real para operaciones de Coiled Tubing, publicando datos a Kafka para visualización en el dashboard.

## Características

- **Simulación realista** de operaciones CT (RIH, POOH, Circulación)
- **Cálculos dinámicos** de peso, presiones y velocidades
- **Publicación a Kafka** para integración con el sistema principal
- **Múltiples tipos de jobs** soportados (CLN, N2L, ACT, MIL, etc.)

## Instalación

```bash
# Crear virtual environment
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

## Uso

### Cargar Seeds en Base de Datos

Primero, carga los datos de prueba en PostgreSQL:

```bash
cd /home/diazhh/dev/scadaerp
PGPASSWORD=scadaerp_dev_password psql -h localhost -p 15432 -U scadaerp -d scadaerp -f database/seeds/coiled_tubing_seed.sql
```

Esto creará:
- **3 CT Units** (CT-UNIT-01, CT-UNIT-02, CT-UNIT-03)
- **6 Reels** con diferentes niveles de fatiga
- **12 Jobs** de diferentes tipos y estados
- Secciones de fatiga, BHA configurations, operaciones, fluidos y alarmas

### Obtener IDs del Seed

```sql
-- Obtener Job ID
SELECT id, job_number, job_type, status FROM ct_jobs WHERE job_number = 'CT-2026-043';

-- Obtener Unit ID
SELECT id, unit_number FROM ct_units WHERE unit_number = 'CT-UNIT-02';
```

### Ejecutar Simulador

```bash
python3 ct_simulator.py \
    --job-id <JOB_UUID> \
    --unit-id <UNIT_UUID> \
    --job-type N2L \
    --target-depth 6500 \
    --kafka-broker localhost:9092 \
    --kafka-topic ct.telemetry
```

### Ejemplo Completo

```bash
# 1. Obtener IDs (copia el resultado)
psql -h localhost -p 15432 -U scadaerp -d scadaerp -c \
    "SELECT id as job_id FROM ct_jobs WHERE job_number = 'CT-2026-043';"

psql -h localhost -p 15432 -U scadaerp -d scadaerp -c \
    "SELECT id as unit_id FROM ct_units WHERE unit_number = 'CT-UNIT-02';"

# 2. Ejecutar simulador (reemplaza los UUIDs)
python3 ct_simulator.py \
    --job-id "abc123..." \
    --unit-id "def456..." \
    --job-type N2L \
    --target-depth 6500
```

## Tipos de Jobs Soportados

| Código | Nombre | Descripción | Duración Aprox |
|--------|--------|-------------|----------------|
| **CLN** | Cleanout | Limpieza de pozo | 20-30 min |
| **N2L** | Nitrogen Lift | Inducción con N₂ | 25-35 min |
| **ACT** | Acid Treatment | Tratamiento ácido | 35-45 min |
| **MIL** | Milling | Fresado | Variable |
| **FSH** | Fishing | Recuperación | Variable |
| **LOG** | Logging | Corrida de registros | 15-25 min |

## Telemetría Generada

El simulador publica los siguientes datos a Kafka cada segundo:

```json
{
  "time": "2026-01-12T15:30:45Z",
  "job_id": "uuid",
  "ct_unit_id": "uuid",
  "depth_ft": 3542.5,
  "speed_ft_min": -58.2,
  "surface_weight_lbs": -8650,
  "hookload_lbs": 8650,
  "pump_pressure_psi": 2850,
  "annulus_pressure_psi": 125,
  "pump_rate_bpm": 2.5,
  "injector_speed_ft_min": -58.2,
  "injector_force_lbs": 6920,
  "operation_mode": "RIH"
}
```

## Operaciones Simuladas

1. **RIH (Running In Hole)**: Bajar tubería a velocidad ~60 ft/min
2. **CIRCULATE**: Circular/bombear fluidos (duración configurable)
3. **POOH (Pulling Out Of Hole)**: Sacar tubería a velocidad ~80 ft/min

## Cálculos Implementados

### Peso en Superficie
- **RIH**: Peso negativo (compresión) = -string_weight × 0.8-0.95
- **POOH**: Peso positivo (tensión) = string_weight × 1.1-1.25
- **CIRCULATE**: Peso neutral = string_weight × 0.95-1.05

### Presiones
- **Pump Pressure**: friction + variación aleatoria (limitado a max_pressure_psi)
- **Annulus Pressure**: 10-30% de la presión hidrostática

## Integración con Backend

El backend debe tener un consumer Kafka que:

1. Escuche el topic `ct.telemetry`
2. Valide los mensajes con Zod
3. Inserte en la hypertable `ct_realtime_data`
4. Publique a WebSocket para dashboard en tiempo real
5. Cache en Redis los últimos valores

Ver: `/src/backend/src/modules/coiled-tubing/realtime-consumer.service.ts`

## Verificar Datos en Dashboard

Una vez que el simulador esté corriendo:

1. Abrir frontend: `http://localhost:5173`
2. Navegar a: **Coiled Tubing → Jobs → [Job en Progreso]**
3. Click en "Real-time Dashboard"
4. Deberías ver gráficos actualizándose en tiempo real

## Troubleshooting

### Error: "Kafka broker not available"
```bash
# Verificar que Kafka esté corriendo
docker ps | grep kafka

# Reiniciar servicios si es necesario
cd infrastructure/docker
docker-compose restart kafka
```

### No se ven datos en el dashboard
```bash
# Verificar que el consumer está corriendo
cd /home/diazhh/dev/scadaerp/src/backend
npm run dev

# Verificar logs del consumer
# Debe mostrar: "CT Realtime Consumer started..."
```

### Datos no se guardan en TimescaleDB
```sql
-- Verificar tabla
SELECT COUNT(*) FROM ct_realtime_data;

-- Ver últimos datos
SELECT * FROM ct_realtime_data 
ORDER BY time DESC 
LIMIT 10;
```

## Próximas Mejoras

- [ ] Simulación de alarmas (overpull, overpressure, fatigue warning)
- [ ] Generación de fatiga cycles en tiempo real
- [ ] Soporte para múltiples jobs simultáneos
- [ ] Simulación de NPT (Non-Productive Time)
- [ ] Gráfico de broomstick (peso vs profundidad) en tiempo real

## Licencia

Parte del sistema SCADA+ERP PetroEdge.
