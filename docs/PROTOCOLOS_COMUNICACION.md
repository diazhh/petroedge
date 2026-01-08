# PROTOCOLOS DE COMUNICACIÓN PARA ERP+SCADA PETROLERO

## Resumen Ejecutivo

Este documento presenta un análisis exhaustivo de los protocolos de comunicación críticos para el sistema ERP+SCADA petrolero. Los protocolos seleccionados permiten la integración completa desde dispositivos de campo hasta sistemas empresariales en la nube.

Los cuatro protocolos principales son: **WITSML** para datos de perforación y operaciones de pozo, **MQTT** para telemetría IoT de alta escala, **Modbus** para dispositivos industriales legacy y modernos, y **OPC-UA** como estándar unificador para automatización industrial. La integración multi-protocolo se logra mediante patrones de gateway y Apache Kafka como hub central de datos.

La arquitectura propuesta soporta tanto operaciones edge standalone como sincronización con cloud, cumpliendo con los requisitos de conectividad intermitente típicos de campos petroleros remotos.

---

## 1. WITSML (Wellsite Information Transfer Standard Markup Language)

### 1.1 Descripción General

WITSML es el estándar de la industria petrolera para la transferencia de datos de operaciones de perforación, completación e intervención de pozos. Desarrollado y mantenido por **Energistics**, organización sin fines de lucro que agrupa a las principales empresas del sector.

**Problema que resuelve:**
- "Digital oilfield", "iFields", "eFields", "Smart fields" - todos estos conceptos requieren que las tecnologías trabajen juntas, pero frecuentemente no lo hacen debido a estructuras de datos incompatibles
- WITSML proporciona interfaces estándar, abiertas y no propietarias para el intercambio de datos

**WITS vs WITSML:**
| Aspecto | WITS | WITSML |
|---------|------|--------|
| Origen | Década de 1980 | Era moderna (Web) |
| Formato | Binario | XML |
| Tecnología | TCP/IP legacy | Web-based, independiente de plataforma |
| Estado | Legacy, obsoleto | Desarrollo activo |

### 1.2 Versiones del Estándar

#### WITSML v1.4.1.1 (Legacy pero ampliamente usado)
- **API:** SOAP Web Services
- **Objetos principales:**
  - `well` - Información del pozo
  - `wellbore` - Sección del pozo
  - `log` - Registros de fondo
  - `mudLog` - Registro de lodo
  - `trajectory` - Trayectoria del pozo
  - `bhaRun` - Corrida de BHA
  - `attachment` - Archivos adjuntos
- **Adopción:** Mayoría de sistemas existentes
- **Ventaja:** Amplio soporte de vendors

#### WITSML v2.0/2.1 (Moderno)
- **API:** Energistics Transfer Protocol (ETP)
- **Mejoras:**
  - Protocolo basado en WebSocket para streaming real-time
  - Mejor performance que SOAP
  - Soporte nativo para datos en tiempo real
  - Integración con PRODML y RESQML
- **Estado:** Adoptándose gradualmente

### 1.3 Energistics Transfer Protocol (ETP)

ETP es el protocolo de aplicación moderno que reemplaza SOAP para WITSML 2.0+:

**Características:**
- Basado en WebSocket para comunicación bidireccional
- Soporte para streaming de datos en tiempo real
- Diseñado específicamente para oil & gas
- Facilita intercambio de datos entre WITSML, PRODML y RESQML

**Arquitectura ETP:**
```
┌─────────────────┐         ┌─────────────────┐
│   ETP Client    │◄──WS───►│   ETP Server    │
│  (Consumer)     │         │   (Provider)    │
└─────────────────┘         └─────────────────┘
         │                           │
         ▼                           ▼
   Request/Response           Data Store
   Streaming                  (WITSML Objects)
   Notifications
```

### 1.4 Objetos de Datos Principales

```xml
<!-- Ejemplo de objeto Well en WITSML -->
<wells xmlns="http://www.witsml.org/schemas/1series" version="1.4.1.1">
  <well uid="well-001">
    <name>Pozo Exploratorio Norte-1</name>
    <numGovt>VEN-2024-001</numGovt>
    <country>Venezuela</country>
    <state>Zulia</state>
    <field>Campo Norte</field>
    <operator>Operadora Nacional</operator>
    <statusWell>drilling</statusWell>
    <purposeWell>exploration</purposeWell>
  </well>
</wells>
```

### 1.5 Librerías de Implementación

| Lenguaje | Librería | Licencia | Notas |
|----------|----------|----------|-------|
| C# | PDS.Witsml | Apache 2.0 | Referencia de Energistics |
| C# | etp-devkit | Apache 2.0 | Cliente/Servidor ETP |
| Python | witsml-python | MIT | Cliente básico |
| Java | energistics-common | Apache 2.0 | Soporte completo |

**ETP DevKit (Referencia):**
```bash
# Repositorio oficial de Energistics
git clone https://github.com/pds-technology/etp-devkit
```

### 1.6 Recomendaciones para Implementación

**Para el sistema ERP+SCADA:**
1. **Fase inicial:** Implementar cliente WITSML v1.4.1.1 para compatibilidad con sistemas existentes
2. **Migración gradual:** Añadir soporte ETP/WITSML v2.0 para clientes con equipos modernos
3. **Gateway approach:** Crear adaptador que normalice ambas versiones a formato interno

**Fuentes:**
- [Energistics WITSML Standards](https://energistics.org/witsml-data-standards)
- [WITSML v2.0 Documentation](https://docs.energistics.org/WITSML/WITSML_TOPICS/WITSML-000-000-titlepage.html)
- [ETP DevKit GitHub](https://github.com/pds-technology/etp-devkit)
- [Energistics Transfer Protocol](https://energistics.org/energistics-transfer-protocol)

---

## 2. MQTT (Message Queuing Telemetry Transport)

### 2.1 Descripción General

MQTT es un protocolo de mensajería ligero basado en el patrón publish/subscribe, originalmente desarrollado para el sector oil & gas por IBM y Arcom (ahora Eurotech) en 1999. Es ideal para conexiones con ancho de banda limitado y alta latencia.

**Características clave:**
- Extremadamente ligero (cabecera mínima de 2 bytes)
- Publish/Subscribe desacoplado
- Tres niveles de QoS (Quality of Service)
- Conexiones persistentes con keep-alive
- Last Will and Testament (LWT)
- Retain messages

### 2.2 Arquitectura Publish/Subscribe

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Publisher  │────►│   BROKER    │────►│  Subscriber │
│  (Sensor)   │     │   (EMQX)    │     │   (SCADA)   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │    MQTT Topic     │                   │
       │  field/well/temp  │                   │
       └───────────────────┴───────────────────┘
```

### 2.3 Niveles de QoS

| QoS | Nombre | Garantía | Uso en Oil & Gas |
|-----|--------|----------|------------------|
| 0 | At most once | Fire and forget | Telemetría no crítica (temperatura ambiente) |
| 1 | At least once | Entrega garantizada, posibles duplicados | Mediciones de producción |
| 2 | Exactly once | Entrega garantizada, sin duplicados | Alarmas críticas, comandos de control |

### 2.4 Jerarquía de Topics para Sistema Petrolero

```
# Estructura propuesta de topics MQTT
organization/
├── {org_id}/
│   ├── field/
│   │   ├── {field_id}/
│   │   │   ├── well/
│   │   │   │   ├── {well_id}/
│   │   │   │   │   ├── production/
│   │   │   │   │   │   ├── oil_rate      # BOPD
│   │   │   │   │   │   ├── gas_rate      # MCFD
│   │   │   │   │   │   ├── water_rate    # BWPD
│   │   │   │   │   │   └── bsw           # %
│   │   │   │   │   ├── pressure/
│   │   │   │   │   │   ├── thp           # Tubing Head Pressure
│   │   │   │   │   │   ├── chp           # Casing Head Pressure
│   │   │   │   │   │   └── bhp           # Bottom Hole Pressure
│   │   │   │   │   ├── temperature/
│   │   │   │   │   │   ├── wellhead
│   │   │   │   │   │   └── bottomhole
│   │   │   │   │   ├── alarms/
│   │   │   │   │   │   ├── critical
│   │   │   │   │   │   ├── warning
│   │   │   │   │   │   └── info
│   │   │   │   │   └── status/
│   │   │   │   │       ├── online
│   │   │   │   │       └── esp_status
│   │   │   └── separator/
│   │   │       └── {separator_id}/
│   │   └── infrastructure/
│   │       ├── power/
│   │       └── communications/
```

### 2.5 Sparkplug B Specification

Sparkplug B es una especificación abierta de Eclipse Foundation que estandariza MQTT para IIoT:

**Beneficios:**
- Definición estándar de payloads (Protocol Buffers)
- Gestión de estado de sesión
- Auto-discovery de dispositivos
- Interoperabilidad garantizada entre vendors
- Soporte nativo en SCADA/HMI modernos

**Componentes Sparkplug:**
- **EoN Node (Edge of Network):** Gateway que conecta dispositivos legacy
- **SCADA/IIoT Host:** Aplicación supervisora principal
- **Device:** Sensor o actuador individual

**Ejemplo de Topic Sparkplug:**
```
spBv1.0/{group_id}/NBIRTH/{edge_node_id}
spBv1.0/{group_id}/DBIRTH/{edge_node_id}/{device_id}
spBv1.0/{group_id}/DDATA/{edge_node_id}/{device_id}
spBv1.0/{group_id}/DCMD/{edge_node_id}/{device_id}
```

### 2.6 Comparativa de Brokers MQTT

| Característica | Mosquitto | EMQX | HiveMQ |
|----------------|-----------|------|--------|
| **Licencia** | EPL/EDL | Apache 2.0 | Commercial/CE |
| **Escalabilidad** | ~100K conexiones | 100M+ conexiones | Millones |
| **Clustering** | Bridge only | Nativo masterless | Nativo |
| **Sparkplug B** | Plugin | Nativo | Nativo |
| **MQTT 5.0** | ✓ | ✓ | ✓ |
| **Uso ideal** | Edge, desarrollo | Cloud, enterprise | Enterprise |
| **Recursos** | <50MB RAM | ~2GB RAM (cluster) | ~1GB RAM |
| **Persistencia** | SQLite | RocksDB/Mnesia | Disco |

**Recomendación para arquitectura Edge-Cloud:**
- **Edge:** Mosquitto (ligero, bajo consumo)
- **Cloud:** EMQX (escalabilidad, clustering, 100M+ conexiones probadas)
- **Bridge:** MQTT bridge entre edge y cloud con store-and-forward

### 2.7 Ejemplo de Implementación

**Publisher Python (Edge Gateway):**
```python
import paho.mqtt.client as mqtt
import json
from datetime import datetime

# Configuración
BROKER = "localhost"
PORT = 1883
TOPIC_BASE = "org001/field001/well001"

def publish_production_data(client, well_data):
    """Publica datos de producción del pozo"""
    payload = {
        "timestamp": datetime.utcnow().isoformat(),
        "oil_rate": well_data["oil_bopd"],
        "gas_rate": well_data["gas_mcfd"],
        "water_rate": well_data["water_bwpd"],
        "bsw": well_data["bsw_percent"],
        "thp": well_data["tubing_head_pressure_psi"],
        "chp": well_data["casing_head_pressure_psi"]
    }
    
    # QoS 1 para datos de producción
    client.publish(
        f"{TOPIC_BASE}/production",
        json.dumps(payload),
        qos=1,
        retain=True
    )

def publish_alarm(client, alarm_type, message, severity):
    """Publica alarma con QoS 2 para garantía de entrega"""
    payload = {
        "timestamp": datetime.utcnow().isoformat(),
        "type": alarm_type,
        "message": message,
        "severity": severity
    }
    
    # QoS 2 para alarmas críticas
    client.publish(
        f"{TOPIC_BASE}/alarms/{severity}",
        json.dumps(payload),
        qos=2
    )

# Conexión con Last Will
client = mqtt.Client()
client.will_set(
    f"{TOPIC_BASE}/status/online",
    payload="false",
    qos=1,
    retain=True
)
client.connect(BROKER, PORT, 60)

# Publicar estado online
client.publish(f"{TOPIC_BASE}/status/online", "true", qos=1, retain=True)
```

**Subscriber Node.js (SCADA Backend):**
```javascript
const mqtt = require('mqtt');

const client = mqtt.connect('mqtt://localhost:1883');

// Suscribirse a todos los pozos de un campo
client.on('connect', () => {
    console.log('Connected to MQTT broker');
    
    // Wildcard subscription
    client.subscribe('org001/field001/+/production', { qos: 1 });
    client.subscribe('org001/field001/+/alarms/#', { qos: 2 });
});

client.on('message', (topic, message) => {
    const data = JSON.parse(message.toString());
    const topicParts = topic.split('/');
    
    if (topic.includes('/production')) {
        // Procesar datos de producción
        processProductionData(topicParts[2], data);
    } else if (topic.includes('/alarms/')) {
        // Procesar alarmas
        processAlarm(topicParts[2], data);
    }
});

function processProductionData(wellId, data) {
    // Insertar en TimescaleDB
    console.log(`Well ${wellId}: ${data.oil_rate} BOPD`);
}

function processAlarm(wellId, data) {
    // Enviar notificación
    console.log(`ALARM [${data.severity}] Well ${wellId}: ${data.message}`);
}
```

### 2.8 Fuentes

- [MQTT.org Specification](https://mqtt.org/mqtt-specification/)
- [Eclipse Sparkplug Specification](https://sparkplug.eclipse.org/specification/)
- [EMQX Documentation](https://docs.emqx.com/)
- [Eclipse Mosquitto](https://mosquitto.org/)
- [HiveMQ Documentation](https://www.hivemq.com/docs/)

---

## 3. MODBUS (RTU y TCP)

### 3.1 Descripción General

Modbus es el protocolo de comunicación serial más antiguo y ampliamente utilizado en automatización industrial. Desarrollado por Modicon (ahora Schneider Electric) en 1979, se ha convertido en un estándar de facto.

**Variantes:**
- **Modbus RTU:** Serial RS-485/RS-232, binario compacto
- **Modbus ASCII:** Serial, texto hexadecimal (obsoleto)
- **Modbus TCP:** Ethernet, encapsulación TCP/IP

### 3.2 Modelo de Datos

Modbus organiza los datos en cuatro tipos de registros:

| Tipo | Rango de Direcciones | Acceso | Tamaño | Uso típico |
|------|---------------------|--------|--------|------------|
| **Coils** | 00001-09999 | R/W | 1 bit | Salidas digitales (válvulas, bombas) |
| **Discrete Inputs** | 10001-19999 | R | 1 bit | Entradas digitales (sensores on/off) |
| **Input Registers** | 30001-39999 | R | 16 bits | Mediciones analógicas (presión, temp) |
| **Holding Registers** | 40001-49999 | R/W | 16 bits | Setpoints, configuración |

### 3.3 Function Codes Principales

| Código | Función | Descripción |
|--------|---------|-------------|
| 01 | Read Coils | Leer estado de salidas digitales |
| 02 | Read Discrete Inputs | Leer entradas digitales |
| 03 | Read Holding Registers | Leer registros de configuración |
| 04 | Read Input Registers | Leer registros de entrada (sensores) |
| 05 | Write Single Coil | Escribir una salida digital |
| 06 | Write Single Register | Escribir un registro |
| 15 | Write Multiple Coils | Escribir múltiples salidas |
| 16 | Write Multiple Registers | Escribir múltiples registros |

### 3.4 Mapa de Registros Típico en Equipos Petroleros

**Ejemplo: Separador de Prueba**
```
Holding Registers (40001-40100):
├── 40001-40002: Caudal de petróleo (BOPD) - FLOAT32
├── 40003-40004: Caudal de gas (MCFD) - FLOAT32
├── 40005-40006: Caudal de agua (BWPD) - FLOAT32
├── 40007-40008: Presión del separador (PSI) - FLOAT32
├── 40009-40010: Temperatura (°F) - FLOAT32
├── 40011-40012: Nivel del tanque (%) - FLOAT32
├── 40013: Estado del separador - UINT16
│   └── 0=Offline, 1=Standby, 2=Running, 3=Fault
└── 40014: Código de alarma - UINT16

Coils (00001-00020):
├── 00001: Válvula de entrada - ON/OFF
├── 00002: Válvula de salida de petróleo - ON/OFF
├── 00003: Válvula de salida de gas - ON/OFF
├── 00004: Válvula de drenaje - ON/OFF
└── 00005: Bomba de transferencia - ON/OFF
```

### 3.5 Implementación con PyModbus

**Instalación:**
```bash
pip install pymodbus
```

**Cliente Modbus TCP:**
```python
from pymodbus.client import ModbusTcpClient
from pymodbus.payload import BinaryPayloadDecoder
from pymodbus.constants import Endian
import struct

class SeparadorModbus:
    def __init__(self, ip_address, port=502, unit_id=1):
        self.client = ModbusTcpClient(ip_address, port=port)
        self.unit_id = unit_id
    
    def connect(self):
        return self.client.connect()
    
    def disconnect(self):
        self.client.close()
    
    def read_float32(self, address, count=1):
        """Lee valores FLOAT32 de registros holding"""
        result = self.client.read_holding_registers(
            address - 40001,  # Ajuste de offset
            count * 2,
            slave=self.unit_id
        )
        if result.isError():
            raise Exception(f"Error leyendo registros: {result}")
        
        values = []
        for i in range(0, len(result.registers), 2):
            decoder = BinaryPayloadDecoder.fromRegisters(
                result.registers[i:i+2],
                byteorder=Endian.BIG,
                wordorder=Endian.BIG
            )
            values.append(decoder.decode_32bit_float())
        return values if count > 1 else values[0]
    
    def read_production_data(self):
        """Lee todos los datos de producción del separador"""
        data = {
            "oil_rate_bopd": self.read_float32(40001),
            "gas_rate_mcfd": self.read_float32(40003),
            "water_rate_bwpd": self.read_float32(40005),
            "pressure_psi": self.read_float32(40007),
            "temperature_f": self.read_float32(40009),
            "level_percent": self.read_float32(40011),
        }
        
        # Leer estado (UINT16)
        status_result = self.client.read_holding_registers(
            40013 - 40001, 1, slave=self.unit_id
        )
        data["status"] = status_result.registers[0]
        
        return data
    
    def write_valve(self, coil_address, state):
        """Controla una válvula"""
        self.client.write_coil(
            coil_address - 1,  # Ajuste de offset
            state,
            slave=self.unit_id
        )

# Uso
separador = SeparadorModbus("192.168.1.100")
if separador.connect():
    try:
        data = separador.read_production_data()
        print(f"Producción: {data['oil_rate_bopd']:.1f} BOPD")
        print(f"Gas: {data['gas_rate_mcfd']:.1f} MCFD")
        print(f"Agua: {data['water_rate_bwpd']:.1f} BWPD")
    finally:
        separador.disconnect()
```

**Cliente Modbus RTU (RS-485):**
```python
from pymodbus.client import ModbusSerialClient

# Configuración para RS-485
client = ModbusSerialClient(
    port='/dev/ttyUSB0',
    baudrate=9600,
    parity='N',
    stopbits=1,
    bytesize=8,
    timeout=3
)

if client.connect():
    # Leer 10 registros holding del dispositivo con ID 1
    result = client.read_holding_registers(0, 10, slave=1)
    if not result.isError():
        print(f"Registros: {result.registers}")
    client.close()
```

### 3.6 Consideraciones para Implementación

**Polling vs Event-Driven:**
- Modbus es inherentemente polling-based
- Implementar polling inteligente con intervalos variables según criticidad
- Tags críticos: 1 segundo
- Tags normales: 5-10 segundos
- Tags de configuración: 60 segundos

**Manejo de errores:**
- Timeouts y reintentos configurables
- Monitoreo de calidad de comunicación
- Alarma por pérdida de comunicación

### 3.7 Fuentes

- [Modbus Organization](https://www.modbus.org/)
- [PyModbus Documentation](https://www.pymodbus.org/docs)
- [Modbus Protocol Guide - Maple Systems](https://maplesystems.com/modbus-protocol/)

---

## 4. OPC-UA (Unified Architecture)

### 4.1 Descripción General

OPC-UA (IEC 62541) es el estándar moderno para interoperabilidad en automatización industrial, diseñado para reemplazar el legacy OPC-DA (basado en DCOM de Windows).

**Ventajas sobre OPC-DA:**
- Independiente de plataforma (no requiere Windows/DCOM)
- Seguridad integrada (certificados, encriptación)
- Modelado de información rico
- Soporte para históricos y alarmas
- Pub/Sub para arquitecturas cloud

### 4.2 Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    OPC-UA Server                         │
├─────────────────────────────────────────────────────────┤
│  Address Space                                           │
│  ├── Objects/                                           │
│  │   ├── Separator_001/                                 │
│  │   │   ├── Pressure (Variable)                        │
│  │   │   ├── Temperature (Variable)                     │
│  │   │   └── Start() (Method)                          │
│  │   └── Well_001/                                      │
│  └── Types/                                             │
│      └── SeparatorType (ObjectType)                     │
├─────────────────────────────────────────────────────────┤
│  Services: Read, Write, Subscribe, Browse, Call         │
├─────────────────────────────────────────────────────────┤
│  Security: X.509 Certificates, Encryption, Auth         │
└─────────────────────────────────────────────────────────┘
```

### 4.3 Security Modes

| Mode | Descripción | Uso |
|------|-------------|-----|
| None | Sin seguridad | Solo desarrollo/testing |
| Sign | Mensajes firmados | Integridad sin confidencialidad |
| SignAndEncrypt | Firma + encriptación | Producción (recomendado) |

### 4.4 Librerías de Implementación

| Librería | Lenguaje | Licencia | Características |
|----------|----------|----------|-----------------|
| **open62541** | C | MPL 2.0 | Embebido, alta performance |
| **node-opcua** | Node.js/TS | MIT | Full-featured, fácil uso |
| **python-opcua** | Python | LGPL | Cliente/servidor completo |
| **Eclipse Milo** | Java | EPL 2.0 | Enterprise-grade |

### 4.5 Implementación con node-opcua

**Instalación:**
```bash
npm install node-opcua
```

**Cliente OPC-UA:**
```javascript
const { OPCUAClient, AttributeIds, DataType } = require("node-opcua");

async function readOPCUA() {
    const client = OPCUAClient.create({
        endpointMustExist: false,
        securityMode: 1, // None (para desarrollo)
        securityPolicy: "None"
    });
    
    const endpointUrl = "opc.tcp://192.168.1.100:4840";
    
    try {
        await client.connect(endpointUrl);
        console.log("Connected to OPC-UA server");
        
        const session = await client.createSession();
        
        // Leer un valor
        const nodeId = "ns=2;s=Separator.Pressure";
        const dataValue = await session.read({
            nodeId: nodeId,
            attributeId: AttributeIds.Value
        });
        
        console.log(`Pressure: ${dataValue.value.value} PSI`);
        
        // Suscripción para cambios
        const subscription = await session.createSubscription2({
            requestedPublishingInterval: 1000,
            requestedMaxKeepAliveCount: 10,
            publishingEnabled: true
        });
        
        const monitoredItem = await subscription.monitor(
            { nodeId: nodeId, attributeId: AttributeIds.Value },
            { samplingInterval: 100, discardOldest: true, queueSize: 10 },
            2 // TimestampsToReturn.Both
        );
        
        monitoredItem.on("changed", (dataValue) => {
            console.log(`Value changed: ${dataValue.value.value}`);
        });
        
        // Mantener conexión por 60 segundos
        await new Promise(resolve => setTimeout(resolve, 60000));
        
        await session.close();
        await client.disconnect();
        
    } catch (err) {
        console.error("Error:", err);
    }
}

readOPCUA();
```

### 4.6 OPC-UA Pub/Sub

OPC-UA Part 14 define Pub/Sub para arquitecturas orientadas a cloud:

**Transporte soportado:**
- MQTT (recomendado para cloud)
- AMQP
- UDP Multicast

**Beneficio:** Combina modelado rico de OPC-UA con escalabilidad de MQTT.

### 4.7 Fuentes

- [OPC Foundation](https://opcfoundation.org/)
- [open62541 GitHub](https://github.com/open62541/open62541)
- [node-opcua GitHub](https://github.com/node-opcua/node-opcua)
- [OPC-UA Wikipedia](https://en.wikipedia.org/wiki/OPC_Unified_Architecture)

---

## 5. Integración Multi-Protocolo

### 5.1 Arquitectura de Gateway

```
┌──────────────────────────────────────────────────────────────────┐
│                         EDGE GATEWAY                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Modbus    │  │   OPC-UA    │  │   WITSML    │              │
│  │   Driver    │  │   Client    │  │   Client    │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         ▼                ▼                ▼                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              DATA NORMALIZATION LAYER                     │   │
│  │   - Unified tag naming                                    │   │
│  │   - Timestamp synchronization                             │   │
│  │   - Unit conversion                                       │   │
│  │   - Quality flags                                         │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    MQTT Publisher                         │   │
│  │              (Sparkplug B format)                         │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                      MQTT BROKER (Edge)                           │
│                        Mosquitto                                  │
└───────────────────────────┬───────────────────────────────────────┘
                            │
                            │ MQTT Bridge (store-and-forward)
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                      MQTT BROKER (Cloud)                          │
│                          EMQX                                     │
└───────────────────────────┬───────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                      APACHE KAFKA                                 │
│              (Central Data Hub / Data Historian)                  │
└───────────────────────────────────────────────────────────────────┘
```

### 5.2 Apache Kafka como Hub Central

Kafka actúa como "sistema nervioso central" integrando OT/IT:

**Caso de éxito: 50hertz (Alemania)**
- Operador de transmisión eléctrica
- Sistema SCADA cloud-native construido con Kafka
- Integración de datos en tiempo real de múltiples fuentes
- Arquitectura de microservicios event-driven

**Kafka Connect para protocolos industriales:**
- Connectors para MQTT, OPC-UA, Modbus
- Transformación y enriquecimiento de datos en streaming
- Integración con TimescaleDB, PostgreSQL, S3

### 5.3 Formato de Mensaje Normalizado

```json
{
  "source": {
    "protocol": "modbus",
    "device_id": "separator_001",
    "address": "192.168.1.100:502"
  },
  "tag": {
    "id": "SEP001.PRESSURE",
    "name": "Separator Pressure",
    "unit": "PSI",
    "type": "FLOAT32"
  },
  "value": 125.5,
  "quality": "GOOD",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "metadata": {
    "field": "NORTE",
    "well": "WELL-001",
    "equipment": "SEPARATOR-001"
  }
}
```

---

## 6. Recomendaciones

### 6.1 Stack de Protocolos Recomendado

| Capa | Protocolo | Justificación |
|------|-----------|---------------|
| **Field Devices** | Modbus RTU/TCP | Compatibilidad universal con PLCs/RTUs |
| **SCADA Local** | OPC-UA | Modelado rico, seguridad integrada |
| **Drilling Data** | WITSML 1.4.1.1 + ETP | Estándar de industria, compatibilidad |
| **Edge → Cloud** | MQTT + Sparkplug B | Ligero, resiliente, estandarizado |
| **Cloud Hub** | Apache Kafka | Escalabilidad, integración OT/IT |

### 6.2 Decisión Recomendada

Para el sistema ERP+SCADA petrolero, implementar arquitectura **multi-protocolo con gateway unificador**:

1. **Edge Gateway** en cada ubicación que soporte:
   - Modbus RTU/TCP para equipos industriales
   - OPC-UA para sistemas modernos
   - WITSML client para equipos de perforación

2. **Normalización** a formato interno con:
   - Naming convention unificado
   - Timestamps UTC sincronizados
   - Quality flags estandarizados

3. **Transporte** vía MQTT con Sparkplug B:
   - Mosquitto en edge (ligero)
   - EMQX en cloud (escalable)
   - Bridge con store-and-forward

4. **Hub Central** con Apache Kafka:
   - Integración con sistemas IT (ERP, BI)
   - Persistencia en TimescaleDB
   - Stream processing para analytics

---

## 7. Siguientes Pasos

1. **Prototipo de Gateway Modbus → MQTT** con Python/PyModbus
2. **Configuración de bridge Mosquitto ↔ EMQX**
3. **Definición de naming convention para tags**
4. **Evaluación de WITSML server open source**
5. **POC de integración Kafka Connect con OPC-UA**

---

## 8. Referencias

### Documentación Oficial
- [Energistics WITSML Standards](https://energistics.org/witsml-data-standards)
- [WITSML v2.0 Documentation](https://docs.energistics.org/WITSML/)
- [MQTT.org Specification](https://mqtt.org/mqtt-specification/)
- [Eclipse Sparkplug](https://sparkplug.eclipse.org/)
- [OPC Foundation](https://opcfoundation.org/)
- [Modbus Organization](https://www.modbus.org/)

### Librerías y Herramientas
- [ETP DevKit - Energistics](https://github.com/pds-technology/etp-devkit)
- [PyModbus](https://www.pymodbus.org/docs)
- [open62541](https://github.com/open62541/open62541)
- [node-opcua](https://github.com/node-opcua/node-opcua)
- [Eclipse Mosquitto](https://mosquitto.org/)
- [EMQX](https://www.emqx.io/)
- [Apache Kafka](https://kafka.apache.org/)

### Casos de Éxito
- [50hertz SCADA with Kafka](https://www.kai-waehner.de/blog/2022/10/04/cloud-native-scada-system-for-industrial-iot-with-apache-kafka/)
- [Modernizing SCADA Systems](https://www.kai-waehner.de/blog/2023/09/10/modernizing-scada-systems-and-ot-it-integration-with-data-streaming/)

### Papers y Artículos Técnicos
- [ISA - IoT Architecture with MQTT Sparkplug B](https://blog.isa.org/iot-architecture-with-mqtt-sparkplugb)
- [Azure Event Grid - Sparkplug B Support](https://learn.microsoft.com/en-us/azure/event-grid/sparkplug-support)
