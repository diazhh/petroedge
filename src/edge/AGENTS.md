# EDGE GATEWAY - SCADA+ERP Petroleum Platform

Este es el componente de **Edge Gateway** del sistema Edge. Maneja la comunicación con dispositivos industriales (PLCs, RTUs, sensores) y el procesamiento de datos SCADA en tiempo real.

## Stack Tecnológico

- **Runtime**: Node.js 20+ con TypeScript
- **Protocolos**: Modbus RTU/TCP, MQTT, OPC-UA
- **Base de Datos**: PostgreSQL + TimescaleDB (compartida con Backend)
- **Message Broker**: MQTT (Eclipse Mosquitto)

## Responsabilidades

### 1. Adquisición de Datos (Data Collection)
- Polling de PLCs vía Modbus TCP/RTU
- Suscripción a topics MQTT de sensores IoT
- Conexión a servidores OPC-UA
- Manejo de timeouts y reconexiones automáticas

### 2. Procesamiento en Tiempo Real
- Validación de calidad de datos (range checks, spike detection)
- Cálculos en tiempo real (agregaciones, promedios móviles)
- Detección de alarmas y eventos
- Conversión de unidades

### 3. Almacenamiento Local
- Escritura de telemetría en TimescaleDB hypertables
- Buffer local para datos de alta frecuencia
- Compresión automática de datos históricos

### 4. Sincronización con Cloud (Store-and-Forward)
- Cola persistente de eventos para enviar a Cloud
- Priorización de datos críticos
- Retry con backoff exponencial
- Compresión de batches

## Estructura de Servicios

```
services/
├── scada/
│   ├── modbus/              # Driver Modbus RTU/TCP
│   ├── mqtt/                # Cliente MQTT
│   ├── opcua/               # Cliente OPC-UA
│   ├── data-collector.service.ts
│   ├── alarm-manager.service.ts
│   └── tag-manager.service.ts
├── sync/
│   ├── sync-agent.service.ts
│   ├── outbox-processor.service.ts
│   └── conflict-resolver.service.ts
├── analytics/
│   ├── data-quality.service.ts
│   ├── aggregation.service.ts
│   └── calculations.service.ts
└── storage/
    ├── timeseries-writer.service.ts
    └── retention-manager.service.ts
```

## Protocolos Industriales

### Modbus TCP/IP
```typescript
// Configuración típica
{
  host: '192.168.1.100',
  port: 502,
  unitId: 1,
  timeout: 5000,
  retries: 3
}

// Lectura de registros
const values = await modbusClient.readHoldingRegisters(
  startAddress: 0,
  quantity: 10
);
```

### MQTT
```typescript
// Topics típicos
wells/WELL-001/production/oil_rate
wells/WELL-001/production/gas_rate
wells/WELL-001/alarms/high_pressure
separators/SEP-01/level

// QoS levels
0 - At most once (fire and forget)
1 - At least once (acknowledged delivery)
2 - Exactly once (assured delivery)
```

### OPC-UA
```typescript
// Conexión a servidor OPC-UA
const client = OPCUAClient.create({
  endpointUrl: 'opc.tcp://192.168.1.50:4840',
  securityMode: MessageSecurityMode.None,
  securityPolicy: SecurityPolicy.None
});

// Suscripción a nodos
const subscription = await session.createSubscription2({
  requestedPublishingInterval: 1000,
  requestedMaxKeepAliveCount: 10
});
```

## Configuración de Tags

Los tags se configuran en `config/tags.config.ts`:

```typescript
export const tagsConfig: TagConfig[] = [
  {
    tagId: 'WELL-001.OIL_RATE',
    description: 'Oil production rate',
    protocol: 'modbus',
    device: 'PLC-001',
    address: 40001,
    dataType: 'float32',
    unit: 'BOPD',
    scanRate: 5000, // ms
    deadband: 0.5,
    alarms: [
      { type: 'HIGH', value: 2000, priority: 2 },
      { type: 'LOW', value: 100, priority: 3 }
    ]
  },
  // ... más tags
];
```

## Gestión de Alarmas

### Prioridades
- **0**: Emergencia (parada de emergencia, fugas)
- **1**: Crítica (alarmas de seguridad)
- **2**: Alta (alarmas operacionales)
- **3**: Media (warnings)
- **4**: Baja (información)

### Estados de Alarma
- `NORMAL` - Valor dentro de rango
- `ACTIVE` - Alarma activa
- `ACKNOWLEDGED` - Alarma reconocida por operador
- `CLEARED` - Alarma resuelta

## Store-and-Forward

El sistema mantiene una cola persistente de eventos para sincronizar con Cloud:

```typescript
// Tabla sync_outbox
{
  id: uuid,
  event_type: 'TELEMETRY_READING' | 'ALARM' | 'EVENT',
  priority: 1-4,
  timestamp: timestamp,
  payload: jsonb,
  sync_status: 'pending' | 'synced' | 'failed',
  retry_count: number,
  next_retry_at: timestamp
}
```

### Estrategia de Sincronización
1. **Prioridad 1 (Crítica)**: Envío inmediato, retry cada 10s
2. **Prioridad 2 (Alta)**: Batch cada 1 min
3. **Prioridad 3 (Normal)**: Batch cada 15 min
4. **Prioridad 4 (Baja)**: Batch cada 1 hora

## Calidad de Datos

### Validaciones Automáticas
- **Range check**: Valor dentro de min/max configurado
- **Rate of change**: Detección de cambios bruscos (spikes)
- **Frozen value**: Detección de valores congelados
- **Communication quality**: Estado de comunicación con dispositivo

### Quality Codes (OPC-UA style)
- `192` - Good
- `128` - Uncertain
- `0` - Bad

## Monitoreo y Diagnóstico

### Métricas Clave
- Tags leídos/segundo
- Latencia de polling
- Tasa de errores de comunicación
- Tamaño de cola de sincronización
- Uso de memoria/CPU

### Logs
```bash
# Ver logs en tiempo real
docker logs -f edge-gateway

# Logs de protocolo específico
tail -f /var/log/scadaerp/modbus.log
tail -f /var/log/scadaerp/mqtt.log
```

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Producción
npm start

# Tests
npm test

# Verificar conectividad Modbus
npm run test:modbus -- --host 192.168.1.100

# Verificar conectividad MQTT
npm run test:mqtt -- --broker mqtt://localhost:1883
```

## Troubleshooting

### Problema: No se reciben datos de Modbus
1. Verificar conectividad de red: `ping 192.168.1.100`
2. Verificar puerto abierto: `telnet 192.168.1.100 502`
3. Revisar logs: `tail -f /var/log/scadaerp/modbus.log`
4. Verificar configuración de Unit ID y direcciones

### Problema: MQTT desconectado
1. Verificar broker: `systemctl status mosquitto`
2. Test de conexión: `mosquitto_sub -h localhost -t '#' -v`
3. Revisar credenciales y permisos ACL

### Problema: Cola de sincronización creciendo
1. Verificar conectividad con Cloud
2. Revisar logs de sync-agent
3. Aumentar batch size o frecuencia de sync
4. Verificar espacio en disco

## Seguridad

- Comunicación con PLCs en red OT segregada
- Firewall entre red OT e IT
- Autenticación en MQTT broker
- Encriptación TLS para OPC-UA
- Logs de auditoría de todas las configuraciones
