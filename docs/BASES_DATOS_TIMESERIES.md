# BASES DE DATOS TIME-SERIES PARA ERP+SCADA PETROLERO

## Resumen Ejecutivo

Este documento analiza las principales bases de datos time-series para el sistema ERP+SCADA petrolero. Las bases de datos time-series (TSDB) están optimizadas para ingestar, procesar y almacenar datos con marca temporal - crítico para telemetría de sensores, mediciones de producción y monitoreo de equipos en campos petroleros.

Se evalúan cuatro alternativas principales: **TimescaleDB** (extensión PostgreSQL), **InfluxDB** (TSDB especializada), **QuestDB** (alto rendimiento) y **ClickHouse** (OLAP columnar). La selección final depende del balance entre compatibilidad SQL, velocidad de ingesta, compresión y recursos disponibles en entornos edge.

**Recomendación:** TimescaleDB para edge (compatibilidad PostgreSQL, recursos moderados) y QuestDB o ClickHouse para cloud analytics (máxima performance).

---

## 1. ¿Por Qué una Base de Datos Time-Series?

### 1.1 Diferencia vs SQL Tradicional

| Aspecto | SQL Tradicional (PostgreSQL) | Time-Series DB |
|---------|------------------------------|----------------|
| **Optimización** | Transacciones OLTP | Ingesta masiva, consultas analíticas |
| **Modelo de escritura** | Random writes | Append-only |
| **Indexación** | B-tree general | Basada en tiempo |
| **Compresión** | General | Especializada para series temporales |
| **Retención** | Manual DELETE | Políticas automáticas |
| **Agregaciones** | Por consulta | Pre-calculadas (continuous aggregates) |

### 1.2 Características Clave de TSDBs

1. **Alto throughput de escritura:** Millones de puntos por segundo
2. **Indexación basada en tiempo:** Consultas eficientes por rangos temporales
3. **Compresión eficiente:** 10-20x reducción de almacenamiento
4. **Agregaciones rápidas:** Promedios, máximos, mínimos por ventanas de tiempo
5. **Soporte para alta cardinalidad:** Millones de tags/sensores únicos

### 1.3 Arquitectura Típica de TSDB

```
┌─────────────────────────────────────────────────────────────┐
│                    TIME-SERIES DATABASE                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │   Write Buffer  │  │   Query Engine  │                   │
│  │   (Batch/Buffer)│  │  (Vectorized)   │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
│           │                    │                             │
│           ▼                    ▼                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Time-Based Partitioning                  │   │
│  │   [Hour 1] [Hour 2] [Hour 3] ... [Hour N]            │   │
│  └──────────────────────────────────────────────────────┘   │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Columnar/Compressed Storage                 │   │
│  │   - Delta encoding for timestamps                     │   │
│  │   - Gorilla compression for floats                   │   │
│  │   - Dictionary encoding for strings                  │   │
│  └──────────────────────────────────────────────────────┘   │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │     Retention & Downsampling (Background Jobs)        │   │
│  │   - Auto-expire old partitions                        │   │
│  │   - Rollup to lower resolution                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Comparativa Detallada

### 2.1 TimescaleDB

**Descripción:** Extensión de PostgreSQL para time-series, proporcionando el poder de PostgreSQL con optimizaciones específicas para datos temporales.

**Licencia:** Apache 2.0 (Community) + Timescale License (Enterprise features)

**Arquitectura:**
- Construido sobre PostgreSQL (row-based con optimizaciones)
- **Hypertables:** Tablas particionadas automáticamente por tiempo
- **Continuous Aggregates:** Vistas materializadas actualizadas incrementalmente
- **Compression:** Almacenamiento columnar para datos históricos (90%+ reducción)

**Características principales:**

| Feature | Detalle |
|---------|---------|
| **SQL** | 100% compatible PostgreSQL |
| **Hypertables** | Particionamiento automático por tiempo |
| **Compression** | Columnar (10-20x), configurable |
| **Continuous Aggregates** | Rollups incrementales automáticos |
| **Retention Policies** | drop_chunks automático |
| **PostGIS** | Soporte geoespacial nativo |
| **JOINs** | Completo soporte SQL |

**Ejemplo de uso:**

```sql
-- Crear extensión
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Crear tabla de telemetría
CREATE TABLE well_telemetry (
    time        TIMESTAMPTZ NOT NULL,
    well_id     TEXT NOT NULL,
    tag_name    TEXT NOT NULL,
    value       DOUBLE PRECISION,
    quality     SMALLINT DEFAULT 192
);

-- Convertir a hypertable (partición por tiempo)
SELECT create_hypertable('well_telemetry', 'time',
    chunk_time_interval => INTERVAL '1 day'
);

-- Crear índice para búsquedas por pozo
CREATE INDEX idx_well_telemetry_well_id 
ON well_telemetry (well_id, time DESC);

-- Habilitar compresión para datos antiguos
ALTER TABLE well_telemetry SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'well_id,tag_name'
);

-- Política de compresión automática (después de 7 días)
SELECT add_compression_policy('well_telemetry', INTERVAL '7 days');

-- Política de retención (eliminar después de 1 año)
SELECT add_retention_policy('well_telemetry', INTERVAL '1 year');

-- Continuous aggregate para promedios horarios
CREATE MATERIALIZED VIEW well_hourly_avg
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    well_id,
    tag_name,
    AVG(value) as avg_value,
    MIN(value) as min_value,
    MAX(value) as max_value,
    COUNT(*) as sample_count
FROM well_telemetry
GROUP BY bucket, well_id, tag_name;

-- Política de refresh automático
SELECT add_continuous_aggregate_policy('well_hourly_avg',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour'
);

-- Consulta de producción del último día
SELECT
    time_bucket('1 hour', time) AS hour,
    well_id,
    AVG(value) FILTER (WHERE tag_name = 'OIL_RATE') as oil_bopd,
    AVG(value) FILTER (WHERE tag_name = 'GAS_RATE') as gas_mcfd,
    AVG(value) FILTER (WHERE tag_name = 'WATER_RATE') as water_bwpd
FROM well_telemetry
WHERE time > NOW() - INTERVAL '1 day'
GROUP BY hour, well_id
ORDER BY hour DESC;
```

**Pros:**
- Compatibilidad total PostgreSQL (ecosistema, herramientas, ORMs)
- PostGIS para datos geoespaciales de campos
- JOINs con datos relacionales (pozos, equipos, usuarios)
- Madurez y estabilidad
- Ideal para equipos con experiencia PostgreSQL

**Contras:**
- Menor velocidad de ingesta vs QuestDB/ClickHouse
- Arquitectura row-based (OLTP) limita analytics
- Compresión solo para datos "fríos"
- Requiere tuning de chunks

**Caso de uso ideal:** Edge deployment donde la compatibilidad PostgreSQL y JOINs con datos relacionales son prioritarios.

---

### 2.2 InfluxDB

**Descripción:** Base de datos time-series purpose-built, líder del mercado con amplio ecosistema.

**Licencia:** MIT (OSS) / Comercial (Cloud)

**Versiones:**
- **InfluxDB 1.x:** InfluxQL, Kapacitor, legacy
- **InfluxDB 2.x:** Flux language, UI integrada, tasks
- **InfluxDB 3.x (IOx):** Reescrito en Rust, Apache Arrow, Parquet

**Arquitectura InfluxDB 3.x:**
- Motor de storage basado en Apache Arrow/DataFusion
- Formato Parquet para almacenamiento
- SQL + InfluxQL support
- Separación compute/storage

**Características principales:**

| Feature | Detalle |
|---------|---------|
| **Query Language** | InfluxQL, Flux, SQL (v3) |
| **Line Protocol** | Protocolo de ingesta optimizado |
| **Cardinality** | Limitada en v1/v2, mejorada en v3 |
| **Retention** | Políticas configurables |
| **Tasks** | Procesamiento periódico integrado |
| **Telegraf** | Agente de recolección potente |

**Ejemplo de uso:**

```bash
# Ingesta via Line Protocol
curl -i -XPOST 'http://localhost:8086/write?db=scada' \
  --data-binary '
well_production,well_id=WELL-001,field=NORTE oil_rate=1250.5,gas_rate=2500.0,water_rate=150.0 1704067200000000000
well_production,well_id=WELL-002,field=NORTE oil_rate=980.0,gas_rate=1800.0,water_rate=220.0 1704067200000000000
'
```

```sql
-- InfluxQL query
SELECT 
    MEAN(oil_rate) as avg_oil,
    MAX(oil_rate) as max_oil
FROM well_production
WHERE time > now() - 24h
GROUP BY time(1h), well_id
```

```javascript
// Flux query (InfluxDB 2.x)
from(bucket: "scada")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "well_production")
  |> filter(fn: (r) => r.field == "NORTE")
  |> aggregateWindow(every: 1h, fn: mean)
  |> yield()
```

**Pros:**
- Telegraf: 300+ plugins de entrada (Modbus, MQTT, OPC-UA)
- Line Protocol: Ingesta muy simple
- Ecosistema maduro
- InfluxDB 3.x promete mejoras significativas

**Contras:**
- Flux tiene curva de aprendizaje
- Problemas de cardinalidad en v1/v2
- v3 aún en desarrollo
- No SQL nativo (hasta v3)

**Caso de uso ideal:** Cuando Telegraf simplifica significativamente la recolección de datos.

---

### 2.3 QuestDB

**Descripción:** Base de datos time-series de alto rendimiento, escrita en Java/C++, con arquitectura columnar y soporte SQL.

**Licencia:** Apache 2.0

**Arquitectura:**
- Columnar storage nativo
- SIMD vectorization para queries
- Zero-GC design (memoria optimizada)
- Soporte para InfluxDB Line Protocol + PostgreSQL wire

**Benchmarks:**
- **Ingesta:** 4.3 millones rows/segundo (TSBS benchmark)
- **Queries:** 10-150x más rápido que TimescaleDB en analytics
- **Compresión:** Alta, comparable a ClickHouse

**Características principales:**

| Feature | Detalle |
|---------|---------|
| **Query Language** | SQL (PostgreSQL compatible) |
| **Ingestion** | Line Protocol, PostgreSQL wire, REST |
| **Partitioning** | Por tiempo automático |
| **SIMD** | Vectorización de queries |
| **WAL** | Write-Ahead Log para durabilidad |
| **Grafana** | Plugin nativo |

**Ejemplo de uso:**

```sql
-- Crear tabla particionada por día
CREATE TABLE well_telemetry (
    timestamp TIMESTAMP,
    well_id SYMBOL,
    tag_name SYMBOL,
    value DOUBLE,
    quality INT
) TIMESTAMP(timestamp) PARTITION BY DAY;

-- Insertar datos
INSERT INTO well_telemetry VALUES
    (systimestamp(), 'WELL-001', 'OIL_RATE', 1250.5, 192),
    (systimestamp(), 'WELL-001', 'GAS_RATE', 2500.0, 192),
    (systimestamp(), 'WELL-001', 'THP', 450.0, 192);

-- Query con SAMPLE BY (downsampling nativo)
SELECT
    timestamp,
    well_id,
    avg(value) as avg_value,
    min(value) as min_value,
    max(value) as max_value
FROM well_telemetry
WHERE tag_name = 'OIL_RATE'
    AND timestamp > dateadd('d', -7, now())
SAMPLE BY 1h
ORDER BY timestamp DESC;

-- ASOF JOIN para correlacionar datos de diferentes frecuencias
SELECT
    p.timestamp,
    p.well_id,
    p.value as pressure,
    t.value as temperature
FROM (
    SELECT * FROM well_telemetry WHERE tag_name = 'THP'
) p
ASOF JOIN (
    SELECT * FROM well_telemetry WHERE tag_name = 'TEMP'
) t ON p.well_id = t.well_id;
```

**Ingesta via Line Protocol (compatible con InfluxDB):**

```python
import socket

def send_to_questdb(data):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.connect(("localhost", 9009))
        sock.sendall(data.encode())

# Formato: table,tag1=val1,tag2=val2 field1=val1,field2=val2 timestamp
data = "well_telemetry,well_id=WELL-001,tag_name=OIL_RATE value=1250.5 1704067200000000000\n"
send_to_questdb(data)
```

**Pros:**
- Rendimiento excepcional (ingesta y queries)
- SQL estándar
- Dual protocol: InfluxDB Line + PostgreSQL wire
- SAMPLE BY nativo para downsampling
- ASOF JOIN para series temporales
- Bajo consumo de recursos

**Contras:**
- Comunidad más pequeña
- Menos integraciones que competidores
- No soporta JOINs complejos con tablas externas
- Window functions recientes (aún madurando)

**Caso de uso ideal:** Cloud analytics de alta performance donde la velocidad es crítica.

---

### 2.4 ClickHouse

**Descripción:** Base de datos OLAP columnar de alto rendimiento, desarrollada por Yandex. No es TSDB pura pero excelente para time-series analytics.

**Licencia:** Apache 2.0

**Arquitectura:**
- Columnar storage
- Vectorized query execution
- MergeTree engine family
- Soporte para replicación y sharding

**Características principales:**

| Feature | Detalle |
|---------|---------|
| **Query Language** | SQL (extensiones propias) |
| **Storage Engine** | MergeTree (optimizado para analytics) |
| **Compression** | LZ4, ZSTD, Delta, Gorilla |
| **Partitioning** | Flexible (tiempo, hash, etc.) |
| **Materialized Views** | Para pre-agregaciones |
| **TTL** | Time-To-Live para retención |

**Ejemplo de uso:**

```sql
-- Crear tabla con MergeTree
CREATE TABLE well_telemetry (
    timestamp DateTime64(3),
    well_id LowCardinality(String),
    tag_name LowCardinality(String),
    value Float64,
    quality UInt8
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (well_id, tag_name, timestamp)
TTL timestamp + INTERVAL 1 YEAR DELETE
SETTINGS index_granularity = 8192;

-- Insertar datos
INSERT INTO well_telemetry VALUES
    (now64(3), 'WELL-001', 'OIL_RATE', 1250.5, 192),
    (now64(3), 'WELL-001', 'GAS_RATE', 2500.0, 192);

-- Query analítico
SELECT
    toStartOfHour(timestamp) as hour,
    well_id,
    avg(value) as avg_value,
    quantile(0.95)(value) as p95_value
FROM well_telemetry
WHERE tag_name = 'OIL_RATE'
    AND timestamp > now() - INTERVAL 7 DAY
GROUP BY hour, well_id
ORDER BY hour DESC;

-- Materialized View para agregaciones automáticas
CREATE MATERIALIZED VIEW well_hourly_mv
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (well_id, tag_name, hour)
AS SELECT
    toStartOfHour(timestamp) as hour,
    well_id,
    tag_name,
    sum(value) as sum_value,
    count() as count_value,
    min(value) as min_value,
    max(value) as max_value
FROM well_telemetry
GROUP BY hour, well_id, tag_name;
```

**Pros:**
- Rendimiento analytics excepcional (petabyte scale)
- Compresión superior (10-40x)
- SQL rico con funciones analíticas avanzadas
- Escalabilidad horizontal masiva
- Materialized Views potentes

**Contras:**
- No diseñado específicamente para time-series
- Complejidad operacional mayor
- Updates/deletes costosos
- Overkill para edge pequeño

**Caso de uso ideal:** Data warehouse central para analytics histórico a gran escala.

---

## 3. Tabla Comparativa

| Feature | TimescaleDB | InfluxDB 2.x | QuestDB | ClickHouse |
|---------|-------------|--------------|---------|------------|
| **Licencia** | Apache 2.0 + TSL | MIT/Commercial | Apache 2.0 | Apache 2.0 |
| **Query Language** | SQL (PostgreSQL) | Flux/InfluxQL | SQL | SQL |
| **Ingesta (rows/s)** | ~500K | ~1M | ~4M | ~2M |
| **Compresión** | 10-20x | 5-10x | 10-15x | 10-40x |
| **RAM mínima** | 2GB | 2GB | 1GB | 4GB |
| **Edge viable** | ✓ Excelente | ✓ Bueno | ✓ Bueno | ✗ Pesado |
| **JOINs SQL** | ✓ Completo | ✗ Limitado | ✓ Básico | ✓ Completo |
| **PostGIS** | ✓ | ✗ | ✗ | ✗ |
| **Telegraf** | ✓ Plugin | ✓ Nativo | ✓ Line Protocol | ✓ Plugin |
| **Grafana** | ✓ PostgreSQL | ✓ Plugin | ✓ Plugin | ✓ Plugin |
| **Continuous Agg** | ✓ | ✓ Tasks | ✗ | ✓ Mat. Views |
| **Cardinalidad** | Alta | Limitada | Alta | Muy Alta |
| **Clustering** | ✓ (Enterprise) | ✓ (Cloud) | ✓ (Enterprise) | ✓ |

---

## 4. Casos de Uso Específicos

### 4.1 Escenario: 100,000 tags a 1 Hz

**Requerimientos:**
- 100,000 puntos por segundo de ingesta
- Retención: 1 año en alta resolución, 5 años downsampled
- Queries: dashboards real-time + analytics histórico

**Recomendación:** **QuestDB** o **ClickHouse**

- QuestDB maneja 4M+ rows/s, sobra capacidad
- ClickHouse ideal si se requieren queries analíticos complejos
- TimescaleDB podría funcionar con tuning agresivo

### 4.2 Escenario: Edge con recursos limitados

**Requerimientos:**
- Hardware: 4 cores, 8GB RAM, SSD 256GB
- Conectividad intermitente
- Sincronización con cloud

**Recomendación:** **TimescaleDB**

- Mínimo overhead (extensión PostgreSQL)
- Compresión configurable
- JOINs con datos relacionales
- Familiar para desarrolladores
- pg_dump/pg_restore para sincronización

### 4.3 Escenario: Analytics cloud multi-tenant

**Requerimientos:**
- Múltiples clientes (tenants)
- Queries históricos complejos
- Alta cardinalidad (millones de pozos)

**Recomendación:** **ClickHouse**

- Escalabilidad horizontal
- Rendimiento queries analíticos
- Manejo superior de alta cardinalidad
- Materialized Views para pre-agregaciones

---

## 5. Integración con Grafana

Todas las bases de datos evaluadas tienen excelente integración con Grafana:

### 5.1 TimescaleDB (via PostgreSQL datasource)

```sql
-- Variable: $well_id
-- Query para panel de producción
SELECT
    $__timeGroup(time, $__interval) AS time,
    well_id,
    AVG(value) as oil_rate
FROM well_telemetry
WHERE 
    $__timeFilter(time)
    AND tag_name = 'OIL_RATE'
    AND well_id IN ($well_id)
GROUP BY 1, 2
ORDER BY 1
```

### 5.2 QuestDB (plugin nativo)

```sql
SELECT
    timestamp AS time,
    well_id,
    value as oil_rate
FROM well_telemetry
WHERE 
    timestamp BETWEEN $__fromTime AND $__toTime
    AND tag_name = 'OIL_RATE'
    AND well_id = '$well_id'
SAMPLE BY $__sampleByInterval
```

### 5.3 ClickHouse (plugin nativo)

```sql
SELECT
    $timeSeries as t,
    well_id,
    avg(value) as oil_rate
FROM well_telemetry
WHERE 
    $timeFilter
    AND tag_name = 'OIL_RATE'
    AND well_id IN ($well_id)
GROUP BY t, well_id
ORDER BY t
```

---

## 6. Data Retention Policies

### 6.1 Estrategia de Retención Multi-Tier

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA RETENTION TIERS                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  HOT (0-7 días)     │  Raw data, 1 second resolution        │
│  ─────────────────  │  No compression, fast queries         │
│                     │                                        │
│  WARM (7-90 días)   │  Compressed, 1 second resolution      │
│  ─────────────────  │  10-20x compression                   │
│                     │                                        │
│  COLD (90d-1 año)   │  Downsampled, 1 minute resolution     │
│  ─────────────────  │  Continuous aggregates                │
│                     │                                        │
│  ARCHIVE (>1 año)   │  Downsampled, 1 hour resolution       │
│  ─────────────────  │  Object storage (S3/MinIO)            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Implementación en TimescaleDB

```sql
-- Compression policy (después de 7 días)
SELECT add_compression_policy('well_telemetry', INTERVAL '7 days');

-- Retention policy (eliminar raw después de 90 días)
SELECT add_retention_policy('well_telemetry', INTERVAL '90 days');

-- Continuous aggregate para datos fríos (1 minuto)
CREATE MATERIALIZED VIEW well_1min
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 minute', time) AS bucket,
    well_id, tag_name,
    AVG(value) as avg_val,
    MIN(value) as min_val,
    MAX(value) as max_val
FROM well_telemetry
GROUP BY bucket, well_id, tag_name;

-- Refresh policy
SELECT add_continuous_aggregate_policy('well_1min',
    start_offset => INTERVAL '2 hours',
    end_offset => INTERVAL '1 minute',
    schedule_interval => INTERVAL '1 minute'
);

-- Continuous aggregate para archivo (1 hora)
CREATE MATERIALIZED VIEW well_1hour
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', bucket) AS bucket,
    well_id, tag_name,
    AVG(avg_val) as avg_val,
    MIN(min_val) as min_val,
    MAX(max_val) as max_val
FROM well_1min
GROUP BY 1, well_id, tag_name;
```

---

## 7. Recomendaciones

### 7.1 Arquitectura Edge-Cloud Propuesta

```
┌─────────────────────────────────────────────────────────────┐
│                         EDGE NODE                            │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              TimescaleDB (PostgreSQL)                │    │
│  │  - Raw telemetry (últimos 30 días)                  │    │
│  │  - Continuous aggregates (1 año)                    │    │
│  │  - Datos relacionales (wells, equipment)            │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           │ Sync (pg_dump / Kafka Connect)  │
│                           ▼                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            │ Internet (store-and-forward)
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                          CLOUD                                 │
│                                                                │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │   PostgreSQL     │  │    QuestDB /     │                   │
│  │  (Relational)    │  │   ClickHouse     │                   │
│  │                  │  │  (Time-Series)   │                   │
│  │  - Wells         │  │                  │                   │
│  │  - Equipment     │  │  - All telemetry │                   │
│  │  - Users         │  │  - Multi-tenant  │                   │
│  │  - Reports       │  │  - Analytics     │                   │
│  └──────────────────┘  └──────────────────┘                   │
│           │                     │                              │
│           └─────────┬───────────┘                              │
│                     │                                          │
│                     ▼                                          │
│            ┌──────────────────┐                                │
│            │     Grafana      │                                │
│            │   (Dashboards)   │                                │
│            └──────────────────┘                                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 7.2 Decisión Recomendada

| Componente | Base de Datos | Justificación |
|------------|---------------|---------------|
| **Edge** | TimescaleDB | Compatibilidad PostgreSQL, JOINs, recursos moderados |
| **Cloud Analytics** | QuestDB | Máxima performance ingesta/query, SQL estándar |
| **Cloud Archive** | ClickHouse | Petabyte scale, compresión superior |
| **Relational** | PostgreSQL | Datos de configuración, usuarios, reportes |

### 7.3 Stack Recomendado

```yaml
Edge:
  Database: TimescaleDB 2.x
  PostgreSQL: 16
  Storage: SSD local
  Retention: 30 días raw, 1 año aggregated

Cloud:
  TimeSeriesDB: QuestDB (OSS) o ClickHouse
  RelationalDB: PostgreSQL 16
  Archive: S3/MinIO + Parquet
  Visualization: Grafana

Ingestion:
  Protocol: InfluxDB Line Protocol (compatible QuestDB)
  Agent: Telegraf (edge) → MQTT → Kafka → QuestDB
```

---

## 8. Siguientes Pasos

1. **POC TimescaleDB Edge:** Instalar en hardware edge representativo
2. **Benchmark ingesta:** Validar 100K tags/segundo en edge
3. **POC QuestDB Cloud:** Evaluar queries analíticos
4. **Diseño de sincronización:** Edge → Cloud via Kafka Connect
5. **Definir retention policies:** Por tipo de dato y cliente

---

## 9. Referencias

### Documentación Oficial
- [TimescaleDB Documentation](https://docs.timescale.com/)
- [InfluxDB Documentation](https://docs.influxdata.com/)
- [QuestDB Documentation](https://questdb.io/docs/)
- [ClickHouse Documentation](https://clickhouse.com/docs/)

### Repositorios GitHub
- [TimescaleDB](https://github.com/timescale/timescaledb)
- [QuestDB](https://github.com/questdb/questdb)
- [ClickHouse](https://github.com/ClickHouse/ClickHouse)

### Benchmarks y Comparativas
- [QuestDB vs TimescaleDB](https://questdb.io/blog/timescaledb-vs-questdb-comparison/)
- [ClickHouse Time-Series Guide](https://clickhouse.com/docs/en/guides/developer/time-series)
- [TSBS Benchmark](https://github.com/timescale/tsbs)
- [ClickBench](https://benchmark.clickhouse.com/)

### Casos de Uso Industrial
- [TimescaleDB for Industrial IoT](https://www.timescale.com/customers)
- [Newtrax (Mining) with TimescaleDB](https://www.timescale.com/case-studies/newtrax)
- [QuestDB for IoT](https://questdb.io/use-cases/industrial-iot/)
