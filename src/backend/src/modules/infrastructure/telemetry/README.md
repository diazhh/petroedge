# Telemetry Module - Digital Twins Infrastructure

## Overview

This module provides telemetry ingestion, storage, and querying capabilities for Digital Twin assets using TimescaleDB for time-series data and Kafka for real-time streaming.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TELEMETRY FLOW                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Edge Gateway → Kafka Topics → Telemetry Consumer           │
│                      ↓                                       │
│                 Validation (Zod)                             │
│                      ↓                                       │
│              Telemetry Service                               │
│                      ↓                                       │
│         ┌────────────┴────────────┐                         │
│         ↓                         ↓                          │
│  TimescaleDB (historical)   Assets.currentTelemetry         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Telemetry Schema (`telemetry.schema.ts`)
- Zod validation schemas for telemetry ingestion
- Single point and batch ingestion
- Query schemas with time bucketing and aggregation

### 2. Telemetry Repository (`telemetry.repository.ts`)
- TimescaleDB optimized queries
- `time_bucket` aggregations (avg, min, max, sum, count, first, last)
- Latest values retrieval with DISTINCT ON
- Raw data queries with pagination
- Statistical calculations (min, max, avg, stddev)

### 3. Telemetry Service (`telemetry.service.ts`)
- Business logic for telemetry operations
- Asset validation
- Current telemetry cache updates on assets table
- Batch processing with error handling

### 4. Telemetry Controller (`telemetry.controller.ts`)
- HTTP request handlers
- Error handling and validation
- Response formatting

### 5. Telemetry Routes (`telemetry.routes.ts`)
- RESTful API endpoints
- OpenAPI/Swagger documentation
- Authentication middleware

### 6. Telemetry Consumer (`telemetry-consumer.service.ts`) 🆕
- **Kafka consumer for automatic ingestion**
- Subscribes to: `scada.telemetry.raw`, `scada.telemetry.validated`
- Supports single and batch messages
- Automatic validation and error handling
- Graceful startup/shutdown

## API Endpoints

### Ingest Telemetry
```http
POST /api/v1/telemetry
Content-Type: application/json
Authorization: Bearer <token>

{
  "assetId": "uuid",
  "telemetryKey": "pressure",
  "valueNumeric": 1500.5,
  "unit": "psi",
  "quality": "GOOD",
  "source": "SENSOR",
  "time": "2026-01-09T10:00:00Z"
}
```

### Batch Ingest
```http
POST /api/v1/telemetry/batch
Content-Type: application/json
Authorization: Bearer <token>

{
  "points": [
    {
      "assetId": "uuid",
      "telemetryKey": "pressure",
      "valueNumeric": 1500.5,
      "unit": "psi"
    },
    // ... up to 1000 points
  ]
}
```

### Query with Aggregation
```http
GET /api/v1/telemetry/query?assetId=uuid&telemetryKey=pressure&startTime=2026-01-09T00:00:00Z&endTime=2026-01-09T23:59:59Z&interval=1%20hour&aggregation=avg
```

### Get Latest Values
```http
GET /api/v1/telemetry/assets/:id/latest?telemetryKeys=pressure,temperature
```

### Get Raw Data
```http
GET /api/v1/telemetry/assets/:id/raw?telemetryKey=pressure&startTime=2026-01-09T00:00:00Z&endTime=2026-01-09T23:59:59Z&limit=1000
```

### Get Statistics
```http
GET /api/v1/telemetry/assets/:id/stats?telemetryKey=pressure&startTime=2026-01-09T00:00:00Z&endTime=2026-01-09T23:59:59Z
```

## Kafka Integration

### Topics
- **scada.telemetry.raw**: Raw sensor data from Edge Gateway
- **scada.telemetry.validated**: Validated telemetry data

### Message Format (Single Point)
```json
{
  "tenantId": "uuid",
  "assetId": "uuid",
  "telemetryKey": "pressure",
  "valueNumeric": 1500.5,
  "unit": "psi",
  "quality": "GOOD",
  "source": "SENSOR",
  "sourceId": "sensor-001",
  "time": "2026-01-09T10:00:00Z"
}
```

### Message Format (Batch)
```json
{
  "tenantId": "uuid",
  "points": [
    {
      "assetId": "uuid",
      "telemetryKey": "pressure",
      "valueNumeric": 1500.5,
      "unit": "psi"
    }
  ]
}
```

### Consumer Configuration
- **Group ID**: `telemetry-ingest-group`
- **Session Timeout**: 30s
- **Heartbeat Interval**: 3s
- **Auto-start**: Yes (on application startup)

## TimescaleDB Features

### Hypertable
- Table: `asset_telemetry`
- Partitioned by: `time` column
- Chunk interval: 7 days (default)

### Retention Policy
- Automatic data retention: 1 year
- Older data automatically dropped

### Indexes
- `(asset_id, time DESC)` - Asset time-series queries
- `(telemetry_key, time DESC)` - Key-based queries

### Aggregations
Using TimescaleDB's `time_bucket` function:
```sql
SELECT 
  time_bucket('1 hour', time) AS bucket,
  AVG(value_numeric) AS value
FROM asset_telemetry
WHERE asset_id = $1
  AND time >= $2
  AND time <= $3
GROUP BY bucket
ORDER BY bucket DESC
```

## Data Quality

### Quality Levels
- **GOOD**: Valid, reliable data
- **BAD**: Invalid or out-of-range data
- **UNCERTAIN**: Questionable data quality
- **SIMULATED**: Simulated/calculated data

### Sources
- **SENSOR**: Direct from physical sensor
- **MANUAL**: Manually entered
- **CALCULATED**: Computed from other values
- **IMPORTED**: Imported from external system
- **EDGE**: From Edge Gateway

## Performance Considerations

1. **Batch Ingestion**: Use batch endpoint for bulk data (up to 1000 points)
2. **Aggregation**: Use time_bucket queries instead of raw data for large time ranges
3. **Current Values**: Cached in `assets.currentTelemetry` JSONB field
4. **Indexes**: Optimized for time-series queries
5. **Retention**: Automatic cleanup of old data

## Error Handling

### Kafka Consumer
- Invalid messages logged but don't stop consumer
- Validation errors tracked per message
- Asset not found errors handled gracefully

### API Endpoints
- Zod validation for all inputs
- Asset existence verification
- Detailed error responses with codes

## Monitoring

### Consumer Status
```typescript
telemetryConsumerService.isConsumerRunning(); // boolean
```

### Logs
- Consumer start/stop events
- Message processing (debug level)
- Validation errors
- Ingestion errors

## Next Steps

1. **Redis Cache**: Implement Redis caching for current telemetry values
2. **WebSocket**: Real-time telemetry updates via WebSocket
3. **Computed Fields**: Rule engine for calculated telemetry
4. **Alarms**: Threshold-based alarm generation
5. **Data Quality**: Advanced quality checks and anomaly detection

## Testing

```bash
# Unit tests
npm test src/modules/infrastructure/telemetry

# Integration tests
npm test:integration telemetry

# Load test Kafka consumer
npm run test:load telemetry-consumer
```

## Configuration

Environment variables:
```env
# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=scadaerp-backend
KAFKA_GROUP_ID=scadaerp-consumers

# Database
DATABASE_URL=postgresql://user:pass@localhost:15432/scadaerp
```
