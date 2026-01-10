# Edge Gateway - SCADA Data Acquisition

Edge Gateway para adquisición de datos SCADA desde dispositivos industriales (PLCs, RTUs, sensores) y publicación a Kafka.

## 🚀 Quick Start

```bash
# Instalar dependencias
npm install

# Copiar configuración
cp .env.example .env

# Editar configuración (ajustar IPs de PLCs)
nano .env

# Modo desarrollo (con hot reload)
npm run dev

# Build para producción
npm run build

# Ejecutar en producción
npm start
```

## 📊 Arquitectura

```
Edge Gateway V2 (Multi-Protocol)
├── Protocol Drivers (via ProtocolFactory)
│   ├── Modbus TCP → PLCs genéricos
│   ├── EtherNet/IP → Allen-Bradley (ControlLogix, CompactLogix)
│   ├── S7 Communication → Siemens (S7-300/400/1200/1500)
│   └── OPC-UA → Servidores OPC-UA universales
├── Data Collector V2 → Polling multi-protocolo y buffering
├── Kafka Producer → Publicación a scada.telemetry.raw
└── Health Check → HTTP endpoint en puerto 3001
```

## 🔧 Configuración

### Variables de Entorno (.env)

```env
# Gateway Identity
GATEWAY_ID=edge-gateway-001
GATEWAY_NAME=Edge Gateway 1
SITE_NAME=Site Alpha

# Kafka
KAFKA_BROKERS=localhost:9092

# Modbus TCP
MODBUS_ENABLED=true
MODBUS_HOST=192.168.1.100
MODBUS_PORT=502
MODBUS_TIMEOUT=5000

# Data Collection
POLLING_INTERVAL_MS=1000
BATCH_SIZE=100
BUFFER_SIZE=1000
```

### Configuración de Tags

Los tags se configuran en `src/index.ts` (en producción vendrían de un archivo de configuración o API):

```typescript
const tags: TagConfig[] = [
  {
    tagId: 'WELL-001.OIL_RATE',
    assetId: 'well-001-uuid',
    description: 'Oil production rate',
    protocol: 'modbus',
    modbusConfig: {
      unitId: 1,
      registerType: 'holding',
      address: 0,
      quantity: 2,
      dataType: 'float32',
    },
    unit: 'BOPD',
    scanRate: 5000,
    deadband: 0.5,
  },
];
```

## 📡 Protocolos Soportados

### Modbus TCP/IP

- **Function Codes**:
  - FC03: Read Holding Registers
  - FC04: Read Input Registers
  - FC01: Read Coils
  - FC02: Read Discrete Inputs

- **Data Types**:
  - int16, uint16
  - int32, uint32
  - float32 (IEEE 754)
  - boolean

### Conversión de Registros

```typescript
// Float32 (2 registros)
const value = modbusService.registersToFloat32([reg1, reg2]);

// Int32 (2 registros)
const value = modbusService.registersToInt32([reg1, reg2]);
```

## 🔄 Flujo de Datos

```
1. Modbus Service → Lee registros del PLC
2. Data Collector → Convierte a valores reales
3. Deadband Filter → Filtra cambios pequeños
4. Buffer → Acumula lecturas
5. Kafka Producer → Publica batch a Kafka
```

## 📈 Características

### Reconexión Automática
- Reconecta automáticamente si se pierde conexión con PLC
- Retry cada 5 segundos
- Marca calidad de datos como 'bad' durante desconexión

### Deadband Filtering
- Solo publica si el cambio excede el deadband configurado
- Reduce tráfico de red y carga en Kafka
- Configurable por tag

### Buffering y Batching
- Buffer local para alta frecuencia de datos
- Publica en batches para eficiencia
- Prevención de overflow con descarte de datos antiguos

### Quality Codes
- `good`: Lectura exitosa
- `bad`: Error de comunicación
- `uncertain`: Valor dudoso

## 🏥 Health Check

```bash
# Verificar estado del gateway
curl http://localhost:3001/health

# Respuesta
{
  "status": "ok",
  "gateway": {
    "id": "edge-gateway-001",
    "name": "Edge Gateway 1",
    "site": "Site Alpha"
  },
  "collector": {
    "isRunning": true,
    "tagsCount": 4,
    "bufferSize": 12,
    "modbusConnected": true
  },
  "timestamp": "2026-01-09T14:00:00.000Z"
}
```

## 🔍 Troubleshooting

### No se conecta a Modbus

```bash
# Verificar conectividad
ping 192.168.1.100

# Verificar puerto abierto
telnet 192.168.1.100 502

# Revisar logs
npm run dev
# Buscar: "Failed to connect to Modbus TCP"
```

### No publica a Kafka

```bash
# Verificar Kafka está corriendo
docker ps | grep kafka

# Verificar topic existe
docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092

# Revisar logs del gateway
# Buscar: "Failed to publish telemetry"
```

## 📝 Logs

El gateway usa Pino para logging estructurado:

```bash
# Modo desarrollo (pretty print)
npm run dev

# Producción (JSON)
npm start

# Filtrar por nivel
npm start | grep '"level":50'  # Errores
npm start | grep '"level":30'  # Info
```

## 🛠️ Desarrollo

### Agregar Nuevo Protocolo

1. Crear servicio en `src/services/`
2. Implementar interfaz de lectura
3. Agregar tipo de protocolo en `TagConfig`
4. Integrar en `DataCollectorService.readTag()`

### Testing con Simulador Modbus

```bash
# Instalar simulador
npm install -g modbus-server

# Ejecutar simulador
modbus-server --port 502
```

## 📦 Dependencias Principales

- `modbus-serial`: Driver Modbus TCP/RTU
- `kafkajs`: Cliente Kafka
- `pino`: Logging estructurado
- `zod`: Validación de configuración
- `dotenv`: Variables de entorno

## 🚀 Deployment

### Docker (Recomendado)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
CMD ["node", "dist/index.js"]
```

### PM2 (Alternativa)

```bash
npm install -g pm2
pm2 start dist/index.js --name edge-gateway
pm2 save
pm2 startup
```

## 📊 Métricas

El gateway expone métricas vía health endpoint:

- Tags configurados
- Estado de conexión Modbus
- Tamaño de buffer actual
- Estado del collector

## 🔐 Seguridad

- Comunicación con PLCs en red OT segregada
- Sin credenciales hardcodeadas
- Logs de auditoría de todas las lecturas
- Validación de configuración con Zod

## 📚 Documentación Adicional

- [Arquitectura Edge-Cloud](../../docs/ARQUITECTURA_EDGE_CLOUD.md)
- [Protocolo Modbus](https://modbus.org/docs/Modbus_Application_Protocol_V1_1b3.pdf)
- [Kafka Topics](../../docs/KAFKA_TOPICS.md)
