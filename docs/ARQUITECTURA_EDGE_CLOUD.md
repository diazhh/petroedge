# ARQUITECTURA EDGE-CLOUD PARA ERP+SCADA PETROLERO

## Resumen Ejecutivo

Este documento define la arquitectura del sistema ERP+SCADA petrolero donde el **EDGE es el producto principal** y el Cloud es un **servicio opcional** para replicación de datos y funcionalidades corporativas.

El sistema EDGE es un producto completo que se vende a empresas petroleras para operar de forma **100% autónoma** en campo. Incluye todos los módulos de gestión de yacimientos, perforación, producción, intervenciones y análisis avanzado. El Cloud es un servicio adicional que permite consolidar datos de múltiples sitios edge, generar reportes corporativos y habilitar acceso remoto.

**Modelo de Negocio:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                      MODELO DE PRODUCTO                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    PRODUCTO PRINCIPAL: EDGE                        │  │
│  │                                                                    │  │
│  │  • Licencia perpetua o suscripción                                │  │
│  │  • Operación 100% standalone                                       │  │
│  │  • Todos los módulos incluidos                                     │  │
│  │  • Hardware industrial certificado                                 │  │
│  │  • Soporte y actualizaciones                                       │  │
│  │                                                                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                              │                                           │
│                              │ OPCIONAL                                  │
│                              ▼                                           │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    SERVICIO OPCIONAL: CLOUD                        │  │
│  │                                                                    │  │
│  │  • Suscripción mensual (SaaS)                                     │  │
│  │  • Replicación de datos del Edge                                  │  │
│  │  • Consolidación multi-sitio                                      │  │
│  │  • Reportes corporativos                                          │  │
│  │  • Acceso remoto                                                  │  │
│  │  • Analytics avanzado y ML                                        │  │
│  │                                                                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Principios clave:**
- **EDGE como producto completo**: Funciona sin Cloud, incluye todos los módulos
- **Cloud como servicio opcional**: Para empresas que quieren consolidar múltiples sitios
- **Edge-first design**: Toda la lógica de negocio corre en el Edge
- **Sincronización unidireccional**: Edge → Cloud (datos), Cloud → Edge (configuración)
- **Containerización**: Despliegue consistente en cualquier hardware

---

## 1. Definición de Edge Computing para Oil & Gas

### 1.1 ¿Qué es Edge Computing?

Edge computing procesa datos cerca de la fuente (sensores, PLCs, RTUs) en lugar de enviar todo a un datacenter centralizado. En campos petroleros esto significa:

- **Procesamiento local** de telemetría en tiempo real
- **Reducción de latencia** para control y alarmas
- **Operación offline** durante pérdidas de conectividad
- **Reducción de costos** de transmisión satelital/celular

### 1.2 Beneficios para Ubicaciones Remotas

| Desafío | Solución Edge |
|---------|---------------|
| Conectividad limitada/cara | Procesamiento local, solo sync de datos agregados |
| Alta latencia satelital | Control loop local <100ms |
| Pérdidas de conexión | Operación standalone con store-and-forward |
| Ancho de banda limitado | Compresión y downsampling antes de enviar |
| Costos de transmisión | Envío inteligente de solo cambios significativos |

### 1.3 Casos de Uso en Campos Petroleros

```
┌─────────────────────────────────────────────────────────────────┐
│                     CAMPO PETROLERO REMOTO                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │  Pozo 1 │  │  Pozo 2 │  │  Pozo N │  │Separador│            │
│  │   RTU   │  │   RTU   │  │   RTU   │  │   PLC   │            │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘            │
│       │            │            │            │                   │
│       └────────────┴─────┬──────┴────────────┘                  │
│                          │                                       │
│                          ▼                                       │
│              ┌───────────────────────┐                          │
│              │     EDGE GATEWAY      │                          │
│              │                       │                          │
│              │  - ERP Completo       │                          │
│              │  - SCADA/HMI          │                          │
│              │  - Yacimientos        │                          │
│              │  - Perforación        │                          │
│              │  - Producción         │                          │
│              │  - Intervenciones     │                          │
│              │  - Analytics Local    │                          │
│              │                       │                          │
│              └───────────┬───────────┘                          │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           │ VSAT / Celular / Fibra
                           │ (intermitente)
                           ▼
┌───────────────────────────────────────────────────────────────────┐
│                            CLOUD                                   │
│                                                                    │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│   │  Campo A    │  │  Campo B    │  │  Campo N    │              │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│          │                │                │                      │
│          └────────────────┼────────────────┘                      │
│                           │                                        │
│                           ▼                                        │
│              ┌───────────────────────┐                            │
│              │   CLOUD (OPCIONAL)    │                            │
│              │                       │                            │
│              │  - Consolidación      │                            │
│              │  - Reportes Corp.     │                            │
│              │  - Acceso Remoto      │                            │
│              │  - ML/AI avanzado     │                            │
│              └───────────────────────┘                            │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 2. Hardware Edge Recomendado

### 2.1 Requisitos para Campos Petroleros

| Requisito | Especificación |
|-----------|----------------|
| **Temperatura operativa** | -40°C a +70°C |
| **Protección** | IP67/IP68 mínimo |
| **Certificación** | ATEX/IECEx para Zone 2 (áreas clasificadas) |
| **Alimentación** | 12-48V DC, redundante |
| **Vibración** | MIL-STD-810G |
| **MTBF** | >100,000 horas |

### 2.2 Categorías de Hardware

#### 2.2.1 Edge Gateway Básico (1-50 pozos)

**Especificaciones típicas:**
- CPU: ARM Cortex-A72 quad-core o Intel Atom
- RAM: 4-8 GB
- Storage: 128-256 GB SSD industrial
- Conectividad: Ethernet, RS-485, CAN, WiFi/LTE
- Certificación: Class I Div 2 / ATEX Zone 2

**Ejemplos de productos:**
| Vendor | Modelo | Características |
|--------|--------|-----------------|
| **Advantech** | UNO-2484G | Intel Core i7, -20~60°C, fanless |
| **Moxa** | UC-8200 | ARM Cortex-A53, -40~70°C, IECEx |
| **Comark/Nematron** | ePC Industrial | ATEX Zone 2, UL Class I Div 2 |
| **Siemens** | SIMATIC IPC127E | Intel Atom, IP65, -30~60°C |
| **Dell** | Edge Gateway 5200 | Intel Atom, -30~70°C, TPM 2.0 |

#### 2.2.2 Edge Server (50-500 pozos)

**Especificaciones típicas:**
- CPU: Intel Xeon D o AMD EPYC Embedded
- RAM: 32-128 GB ECC
- Storage: 1-4 TB NVMe RAID
- Conectividad: 10GbE, redundante
- Certificación: Para sala de control (no clasificada)

**Ejemplos:**
| Vendor | Modelo | Características |
|--------|--------|-----------------|
| **HPE** | Edgeline EL8000 | 4U, GPU support, -5~55°C |
| **Dell** | PowerEdge XR4000 | 2U rugged, MIL-STD-810H |
| **Lenovo** | ThinkEdge SE450 | Compact, -20~55°C |

### 2.3 Arquitectura de Conectividad Edge

```
┌─────────────────────────────────────────────────────────────────┐
│                      EDGE GATEWAY                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    CONNECTIVITY LAYER                     │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                           │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │   │
│  │  │ RS-485  │  │Ethernet │  │  Fiber  │  │  Radio  │     │   │
│  │  │ Modbus  │  │ TCP/IP  │  │ Serial  │  │ 900MHz  │     │   │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘     │   │
│  │       │            │            │            │           │   │
│  │       ▼            ▼            ▼            ▼           │   │
│  │  ┌────────────────────────────────────────────────┐     │   │
│  │  │           PROTOCOL DRIVERS                      │     │   │
│  │  │  Modbus RTU/TCP | OPC-UA | WITSML | DNP3       │     │   │
│  │  └────────────────────────────────────────────────┘     │   │
│  │                          │                               │   │
│  └──────────────────────────┼───────────────────────────────┘   │
│                             │                                    │
│                             ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  APPLICATION LAYER                        │   │
│  │                                                           │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │   │
│  │  │  SCADA  │  │Historian│  │ Alarms  │  │Analytics│     │   │
│  │  │   HMI   │  │  TSDB   │  │ Engine  │  │  Engine │     │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                             │                                    │
│                             ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 CLOUD SYNC LAYER                          │   │
│  │                                                           │   │
│  │  ┌─────────────────┐  ┌─────────────────┐               │   │
│  │  │ Store & Forward │  │  MQTT Bridge    │               │   │
│  │  │     Queue       │  │  to Cloud       │               │   │
│  │  └─────────────────┘  └─────────────────┘               │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Containerización en Edge

### 3.1 Comparativa: Docker vs Podman vs K3s

| Característica | Docker Standalone | Podman | K3s |
|----------------|-------------------|--------|-----|
| **Orquestación** | Manual/Compose | Manual/Quadlet | Kubernetes nativo |
| **Daemon** | Requiere daemon | Daemonless | k3s server |
| **Recursos** | ~100MB | ~50MB | ~500MB |
| **HA/Clustering** | Docker Swarm | No nativo | Nativo |
| **Actualizaciones** | Manual | Manual | Rolling updates |
| **Secrets** | Docker Secrets | Podman Secrets | K8s Secrets |
| **Networking** | Bridge | CNI | Flannel/Calico |
| **Storage** | Volumes | Volumes | PV/PVC |
| **Curva aprendizaje** | Baja | Baja | Media |

### 3.2 K3s: Kubernetes Ligero para Edge

**¿Por qué K3s?**
- Binario único <100MB
- Mitad del uso de memoria vs K8s estándar
- SQLite como datastore por defecto (sin etcd)
- Incluye todo lo necesario: containerd, Flannel, CoreDNS, Traefik
- Certificado CNCF, 100% compatible con Kubernetes

**Requisitos mínimos K3s:**
| Componente | Server Node | Agent Node |
|------------|-------------|------------|
| CPU | 1 core | 1 core |
| RAM | 512 MB | 512 MB |
| Disco | 200 MB | 200 MB |

### 3.3 Instalación K3s en Edge

```bash
# Instalación server (master node)
curl -sfL https://get.k3s.io | sh -

# Verificar instalación
sudo k3s kubectl get nodes

# Obtener token para agents
sudo cat /var/lib/rancher/k3s/server/node-token

# Instalación agent (worker node)
curl -sfL https://get.k3s.io | K3S_URL=https://server-ip:6443 \
  K3S_TOKEN=token-from-server sh -
```

**Configuración para edge con recursos limitados:**

```yaml
# /etc/rancher/k3s/config.yaml
write-kubeconfig-mode: "0644"
tls-san:
  - "edge-gateway.local"
  - "192.168.1.100"

# Deshabilitar componentes no necesarios
disable:
  - traefik          # Usar ingress propio si no se necesita
  - servicelb        # Usar MetalLB o LoadBalancer externo
  
# Límites de recursos
kubelet-arg:
  - "max-pods=50"
  - "system-reserved=cpu=200m,memory=200Mi"
  - "kube-reserved=cpu=200m,memory=200Mi"

# SQLite para single-node (por defecto)
# Para HA usar PostgreSQL externo:
# datastore-endpoint: "postgres://user:pass@localhost:5432/k3s"
```

### 3.4 Alternativas a K3s

| Solución | Uso de Recursos | Complejidad | Mejor para |
|----------|-----------------|-------------|------------|
| **K3s** | ~500MB RAM | Media | Edge general, IoT gateways |
| **K0s** | ~400MB RAM | Media | Edge minimal |
| **MicroK8s** | ~600MB RAM | Baja | Desarrollo, single-node |
| **Docker Compose** | ~100MB RAM | Muy baja | Prototipos, edge simple |

### 3.5 Stack de Contenedores Edge

```yaml
# docker-compose.yaml para edge (alternativa simple a K3s)
version: '3.8'

services:
  # Base de datos time-series
  timescaledb:
    image: timescale/timescaledb:latest-pg16
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: scada
    volumes:
      - timescale_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 2G

  # MQTT Broker
  mosquitto:
    image: eclipse-mosquitto:2
    volumes:
      - ./mosquitto/config:/mosquitto/config
      - mosquitto_data:/mosquitto/data
    ports:
      - "1883:1883"
      - "8883:8883"
    restart: unless-stopped

  # Backend API
  scada-backend:
    image: ${REGISTRY}/scada-backend:${VERSION}
    environment:
      DATABASE_URL: postgres://postgres:${DB_PASSWORD}@timescaledb:5432/scada
      MQTT_BROKER: mqtt://mosquitto:1883
    ports:
      - "3000:3000"
    depends_on:
      - timescaledb
      - mosquitto
    restart: unless-stopped

  # Frontend HMI
  scada-frontend:
    image: ${REGISTRY}/scada-frontend:${VERSION}
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - scada-backend
    restart: unless-stopped

  # Grafana dashboards
  grafana:
    image: grafana/grafana:latest
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    ports:
      - "3001:3000"
    restart: unless-stopped

  # Sync agent (store-and-forward)
  sync-agent:
    image: ${REGISTRY}/sync-agent:${VERSION}
    environment:
      EDGE_DB_URL: postgres://postgres:${DB_PASSWORD}@timescaledb:5432/scada
      CLOUD_MQTT_URL: ${CLOUD_MQTT_URL}
      SITE_ID: ${SITE_ID}
    depends_on:
      - timescaledb
    restart: unless-stopped

volumes:
  timescale_data:
  mosquitto_data:
  grafana_data:
```

---

## 4. Sincronización Edge → Cloud

### 4.1 Patrones de Sincronización

#### 4.1.1 Store-and-Forward

```
┌─────────────────────────────────────────────────────────────┐
│                         EDGE                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │   Sensors   │────►│  Local DB   │────►│   Outbox    │   │
│  │   (MQTT)    │     │ (TimescaleDB)│     │   Queue     │   │
│  └─────────────┘     └─────────────┘     └──────┬──────┘   │
│                                                  │          │
│                                          ┌──────▼──────┐   │
│                                          │ Sync Agent  │   │
│                                          │             │   │
│                                          │ - Batch     │   │
│                                          │ - Compress  │   │
│                                          │ - Retry     │   │
│                                          └──────┬──────┘   │
│                                                  │          │
└──────────────────────────────────────────────────┼──────────┘
                                                   │
                          ┌────────────────────────┘
                          │ (Connectivity available)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                         CLOUD                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │   Inbox     │────►│  Processor  │────►│  Cloud DB   │   │
│  │   Queue     │     │ (Validate,  │     │  (QuestDB/  │   │
│  │   (Kafka)   │     │  Dedupe)    │     │ ClickHouse) │   │
│  └─────────────┘     └─────────────┘     └─────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### 4.1.2 Event Sourcing

Todos los cambios se registran como eventos inmutables:

```json
{
  "event_id": "uuid-v4",
  "event_type": "TELEMETRY_READING",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "site_id": "FIELD-NORTE-001",
  "payload": {
    "well_id": "WELL-001",
    "tag": "OIL_RATE",
    "value": 1250.5,
    "quality": 192
  },
  "metadata": {
    "edge_timestamp": "2024-01-15T10:30:00.100Z",
    "cloud_received": null,
    "sync_status": "pending"
  }
}
```

### 4.2 Priorización de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                    SYNC PRIORITY QUEUE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Priority 1 (Critical - Immediate)                          │
│  ├── Alarmas de seguridad                                   │
│  ├── Paradas de emergencia                                  │
│  ├── Detección de fugas                                     │
│  └── Eventos de well integrity                              │
│                                                              │
│  Priority 2 (High - Within 1 minute)                        │
│  ├── Alarmas operacionales                                  │
│  ├── Cambios de estado de equipos                          │
│  └── Mediciones fuera de rango                             │
│                                                              │
│  Priority 3 (Normal - Within 15 minutes)                    │
│  ├── Datos de producción (agregados)                       │
│  ├── Tendencias de proceso                                  │
│  └── Status de comunicaciones                              │
│                                                              │
│  Priority 4 (Low - Within 1 hour)                           │
│  ├── Datos históricos raw                                   │
│  ├── Logs de diagnóstico                                    │
│  └── Métricas de sistema                                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 4.3 Implementación Sync Agent

```python
# sync_agent.py - Edge to Cloud synchronization
import asyncio
import json
from datetime import datetime, timedelta
from typing import List, Dict
import aiohttp
import asyncpg
from paho.mqtt import client as mqtt

class SyncAgent:
    def __init__(self, config: Dict):
        self.site_id = config['site_id']
        self.edge_db_url = config['edge_db_url']
        self.cloud_mqtt_url = config['cloud_mqtt_url']
        self.batch_size = config.get('batch_size', 1000)
        self.sync_interval = config.get('sync_interval', 60)  # seconds
        
        self.outbox_table = 'sync_outbox'
        self.is_connected = False
        
    async def start(self):
        """Main sync loop"""
        self.db_pool = await asyncpg.create_pool(self.edge_db_url)
        
        while True:
            try:
                await self.sync_cycle()
            except Exception as e:
                print(f"Sync cycle error: {e}")
                
            await asyncio.sleep(self.sync_interval)
    
    async def sync_cycle(self):
        """Execute one sync cycle"""
        # Get pending events by priority
        for priority in [1, 2, 3, 4]:
            events = await self.get_pending_events(priority)
            if events:
                success = await self.send_to_cloud(events)
                if success:
                    await self.mark_synced(events)
    
    async def get_pending_events(self, priority: int) -> List[Dict]:
        """Fetch pending events from outbox"""
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, event_type, timestamp, payload
                FROM sync_outbox
                WHERE sync_status = 'pending'
                  AND priority = $1
                ORDER BY timestamp ASC
                LIMIT $2
            """, priority, self.batch_size)
            
            return [dict(row) for row in rows]
    
    async def send_to_cloud(self, events: List[Dict]) -> bool:
        """Send batch of events to cloud"""
        try:
            # Compress batch
            batch = {
                'site_id': self.site_id,
                'batch_id': str(uuid.uuid4()),
                'timestamp': datetime.utcnow().isoformat(),
                'events': events
            }
            
            # Send via MQTT with QoS 1
            payload = json.dumps(batch)
            # ... MQTT publish logic
            
            return True
        except Exception as e:
            print(f"Cloud send failed: {e}")
            return False
    
    async def mark_synced(self, events: List[Dict]):
        """Mark events as synchronized"""
        event_ids = [e['id'] for e in events]
        async with self.db_pool.acquire() as conn:
            await conn.execute("""
                UPDATE sync_outbox
                SET sync_status = 'synced',
                    synced_at = NOW()
                WHERE id = ANY($1)
            """, event_ids)
```

### 4.4 Soluciones Comerciales

#### Azure IoT Edge
- **Ventajas:** Integración Azure, módulos pre-construidos, ML en edge
- **Desventajas:** Vendor lock-in, costo
- **Mejor para:** Empresas con stack Microsoft/Azure

#### AWS IoT Greengrass
- **Ventajas:** Lambda en edge, ML inference, OTA updates
- **Desventajas:** Complejidad, costo AWS
- **Mejor para:** Empresas con stack AWS

#### Recomendación: Solución Custom
Para máxima flexibilidad y control, construir sync agent propio usando:
- MQTT con store-and-forward (Mosquitto bridge)
- PostgreSQL/TimescaleDB para outbox pattern
- Kafka en cloud como receptor

---

## 5. Edge Analytics

### 5.1 Procesamiento Local de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                     EDGE ANALYTICS PIPELINE                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Raw Data (1 Hz)                                            │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              DATA QUALITY CHECK                      │    │
│  │  - Range validation                                  │    │
│  │  - Spike detection                                   │    │
│  │  - Frozen value detection                           │    │
│  │  - Communication quality                            │    │
│  └────────────────────────┬────────────────────────────┘    │
│                           │                                  │
│       ┌───────────────────┼───────────────────┐             │
│       │                   │                   │             │
│       ▼                   ▼                   ▼             │
│  ┌─────────┐        ┌─────────┐        ┌─────────┐         │
│  │ Alarming│        │ Trending│        │   ML    │         │
│  │ Engine  │        │ Engine  │        │Inference│         │
│  └────┬────┘        └────┬────┘        └────┬────┘         │
│       │                   │                   │             │
│       ▼                   ▼                   ▼             │
│  - Trip alarms      - Rate of change   - Anomaly detection │
│  - Delay alarms     - Downsampling     - Predictive maint. │
│  - Deviation        - Aggregations     - Pattern matching  │
│  - Complex logic    - Compression      - Failure prediction│
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Inferencia ML en Edge

**Frameworks soportados:**
- **ONNX Runtime:** Portable, multi-framework
- **TensorFlow Lite:** Optimizado para edge
- **OpenVINO:** Intel hardware acceleration

**Casos de uso ML en edge petrolero:**
1. **Anomaly detection:** Detectar comportamiento anómalo en pozos
2. **Predictive maintenance:** Predecir fallas de ESP/bombas
3. **Production optimization:** Sugerir ajustes de choke
4. **Leak detection:** Identificar fugas en tiempo real

```python
# edge_ml_inference.py
import onnxruntime as ort
import numpy as np

class EdgeMLPredictor:
    def __init__(self, model_path: str):
        self.session = ort.InferenceSession(model_path)
        self.input_name = self.session.get_inputs()[0].name
        
    def predict_anomaly(self, features: np.ndarray) -> float:
        """Run anomaly detection model"""
        # Prepare input
        input_data = features.astype(np.float32).reshape(1, -1)
        
        # Run inference
        result = self.session.run(None, {self.input_name: input_data})
        
        # Return anomaly score (0-1)
        return float(result[0][0])

# Usage
predictor = EdgeMLPredictor('models/well_anomaly.onnx')

def process_well_data(well_data: dict):
    features = np.array([
        well_data['thp'],
        well_data['chp'],
        well_data['oil_rate'],
        well_data['gas_rate'],
        well_data['water_rate'],
        well_data['esp_current'],
        well_data['esp_frequency']
    ])
    
    anomaly_score = predictor.predict_anomaly(features)
    
    if anomaly_score > 0.8:
        raise_alarm('ANOMALY_DETECTED', well_data['well_id'], anomaly_score)
```

---

## 6. Arquitectura Cloud Multi-Tenant

### 6.1 Modelos de Multi-Tenancy

#### 6.1.1 Pool Model (Shared Database)

```
┌─────────────────────────────────────────────────────────────┐
│                    POOL MODEL                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              SHARED DATABASE                         │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │                                                      │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │ well_telemetry                               │    │    │
│  │  │ ──────────────                               │    │    │
│  │  │ tenant_id | well_id | timestamp | value      │    │    │
│  │  │ ─────────────────────────────────────────    │    │    │
│  │  │ TENANT_A  | WELL-001| 2024-01-15| 1250.5     │    │    │
│  │  │ TENANT_B  | WELL-001| 2024-01-15| 980.0      │    │    │
│  │  │ TENANT_A  | WELL-002| 2024-01-15| 1100.0     │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │                                                      │    │
│  │  Row-Level Security (RLS):                          │    │
│  │  CREATE POLICY tenant_isolation ON well_telemetry   │    │
│  │  USING (tenant_id = current_setting('app.tenant')); │    │
│  │                                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ✓ Máxima eficiencia de recursos                           │
│  ✓ Menor costo operacional                                  │
│  ✗ Riesgo de data leak (requiere RLS riguroso)             │
│  ✗ Noisy neighbor (un tenant afecta a otros)               │
│                                                              │
│  Ideal para: SMB, startups, bajo costo                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### 6.1.2 Bridge Model (Database per Tenant)

```
┌─────────────────────────────────────────────────────────────┐
│                    BRIDGE MODEL                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │   DB Tenant A │  │   DB Tenant B │  │   DB Tenant C │   │
│  │               │  │               │  │               │   │
│  │ wells         │  │ wells         │  │ wells         │   │
│  │ telemetry     │  │ telemetry     │  │ telemetry     │   │
│  │ alarms        │  │ alarms        │  │ alarms        │   │
│  └───────────────┘  └───────────────┘  └───────────────┘   │
│          │                  │                  │            │
│          └──────────────────┼──────────────────┘            │
│                             │                               │
│                             ▼                               │
│              ┌───────────────────────┐                      │
│              │  Connection Router    │                      │
│              │  (by tenant_id)       │                      │
│              └───────────────────────┘                      │
│                                                              │
│  ✓ Aislamiento completo de datos                           │
│  ✓ Backup/restore independiente                            │
│  ✓ Customización por tenant                                │
│  ✗ Mayor costo (más instancias DB)                         │
│  ✗ Complejidad de gestión                                  │
│                                                              │
│  Ideal para: Mid-market, compliance estricto               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### 6.1.3 Silo Model (Dedicated Infrastructure)

```
┌─────────────────────────────────────────────────────────────┐
│                    SILO MODEL                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              TENANT A - DEDICATED                    │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐             │    │
│  │  │  K8s    │  │   DB    │  │  Redis  │             │    │
│  │  │ Cluster │  │ Cluster │  │ Cluster │             │    │
│  │  └─────────┘  └─────────┘  └─────────┘             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              TENANT B - DEDICATED                    │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐             │    │
│  │  │  K8s    │  │   DB    │  │  Redis  │             │    │
│  │  │ Cluster │  │ Cluster │  │ Cluster │             │    │
│  │  └─────────┘  └─────────┘  └─────────┘             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ✓ Máximo aislamiento                                       │
│  ✓ Máxima customización                                     │
│  ✓ SLA dedicado                                             │
│  ✗ Costo muy alto                                           │
│  ✗ Complejidad operacional extrema                          │
│                                                              │
│  Ideal para: Enterprise, regulados (PDVSA, NOCs)           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Recomendación Multi-Tenant

| Tier Cliente | Modelo | Justificación |
|--------------|--------|---------------|
| **Basic/Starter** | Pool (RLS) | Costo optimizado |
| **Standard** | Pool (RLS) | Balance costo/aislamiento |
| **Premium** | Bridge (DB per tenant) | Aislamiento para mid-market |
| **Enterprise** | Silo (Dedicated) | Máximo aislamiento, SLA |

### 6.3 Implementación Row-Level Security (PostgreSQL)

```sql
-- Crear columna tenant_id en todas las tablas
ALTER TABLE wells ADD COLUMN tenant_id UUID NOT NULL;
ALTER TABLE well_telemetry ADD COLUMN tenant_id UUID NOT NULL;
ALTER TABLE alarms ADD COLUMN tenant_id UUID NOT NULL;

-- Crear política RLS
ALTER TABLE wells ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON wells
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- En la aplicación, setear tenant antes de queries
SET app.current_tenant = 'tenant-uuid-here';

-- Ahora todas las queries están filtradas automáticamente
SELECT * FROM wells;  -- Solo retorna wells del tenant actual
```

---

## 7. Disaster Recovery y Backup

### 7.1 Estrategia de Backup Edge

```yaml
# Backup strategy for edge nodes
edge_backup:
  # Local backup to attached storage
  local:
    frequency: every 6 hours
    retention: 7 days
    targets:
      - database: full dump
      - config: /etc/scada/*
      - certificates: /etc/ssl/certs/scada/*
  
  # Remote backup when connected
  remote:
    frequency: daily
    destination: s3://backups/edge/${SITE_ID}/
    encryption: AES-256
    retention: 90 days
```

### 7.2 Estrategia Cloud

```yaml
cloud_backup:
  # Database backups
  database:
    type: continuous (WAL archiving)
    point_in_time_recovery: 30 days
    snapshots:
      frequency: daily
      retention: 90 days
    geo_replication: secondary region
  
  # Disaster recovery
  dr:
    rto: 4 hours  # Recovery Time Objective
    rpo: 1 hour   # Recovery Point Objective
    failover: automatic (health checks)
```

---

## 8. Diagramas de Arquitectura

### 8.1 Arquitectura General Edge-Cloud

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CAMPO PETROLERO                             │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                         EDGE LAYER                                 │  │
│  │                                                                    │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │   RTU    │  │   PLC    │  │  Sensor  │  │   Flow   │          │  │
│  │  │ Modbus   │  │ OPC-UA   │  │  MQTT    │  │  Meter   │          │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘          │  │
│  │       │             │             │             │                 │  │
│  │       └─────────────┴──────┬──────┴─────────────┘                 │  │
│  │                            │                                       │  │
│  │                            ▼                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │                    EDGE GATEWAY (K3s)                        │  │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │  │  │
│  │  │  │  Protocol   │  │   MQTT      │  │ TimescaleDB │          │  │  │
│  │  │  │  Drivers    │  │  Mosquitto  │  │   (Local)   │          │  │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘          │  │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │  │  │
│  │  │  │   SCADA     │  │   Alarm     │  │    Sync     │          │  │  │
│  │  │  │  Backend    │  │   Engine    │  │   Agent     │          │  │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘          │  │  │
│  │  │  ┌─────────────┐  ┌─────────────┐                           │  │  │
│  │  │  │   Web UI    │  │   Grafana   │                           │  │  │
│  │  │  │    (HMI)    │  │ Dashboards  │                           │  │  │
│  │  │  └─────────────┘  └─────────────┘                           │  │  │
│  │  └──────────────────────────┬──────────────────────────────────┘  │  │
│  │                             │                                      │  │
│  └─────────────────────────────┼──────────────────────────────────────┘  │
│                                │                                         │
└────────────────────────────────┼─────────────────────────────────────────┘
                                 │
                                 │  VSAT / LTE / Fiber
                                 │  (Store & Forward)
                                 │
┌────────────────────────────────┼─────────────────────────────────────────┐
│                                │                                         │
│                                ▼                CLOUD LAYER              │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                         INGESTION LAYER                              ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  ││
│  │  │    EMQX     │  │   Kafka     │  │   Schema    │                  ││
│  │  │   Broker    │──│   Topics    │──│  Registry   │                  ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  ││
│  └──────────────────────────┬──────────────────────────────────────────┘│
│                             │                                            │
│  ┌──────────────────────────┼──────────────────────────────────────────┐│
│  │                          ▼         DATA LAYER                        ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  ││
│  │  │  PostgreSQL │  │   QuestDB   │  │    Redis    │                  ││
│  │  │ (Relational)│  │(Time-Series)│  │   (Cache)   │                  ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  ││
│  └──────────────────────────┬──────────────────────────────────────────┘│
│                             │                                            │
│  ┌──────────────────────────┼──────────────────────────────────────────┐│
│  │                          ▼       APPLICATION LAYER                   ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  ││
│  │  │   API       │  │  Analytics  │  │     ML      │                  ││
│  │  │  Gateway    │  │   Service   │  │   Service   │                  ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  ││
│  └──────────────────────────┬──────────────────────────────────────────┘│
│                             │                                            │
│  ┌──────────────────────────┼──────────────────────────────────────────┐│
│  │                          ▼      PRESENTATION LAYER                   ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  ││
│  │  │   Web App   │  │   Grafana   │  │  Mobile App │                  ││
│  │  │   (React)   │  │ Dashboards  │  │  (Flutter)  │                  ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Recomendaciones

### 9.1 Stack Recomendado

| Componente | Edge | Cloud |
|------------|------|-------|
| **Orquestación** | K3s | EKS/AKS/GKE |
| **Contenedores** | containerd | containerd |
| **Base de datos TS** | TimescaleDB | QuestDB/ClickHouse |
| **Base de datos Rel** | PostgreSQL 16 | PostgreSQL 16 (RDS) |
| **MQTT Broker** | Mosquitto | EMQX Cluster |
| **Message Queue** | - | Apache Kafka |
| **Cache** | Redis | Redis Cluster |
| **Ingress** | Traefik | NGINX/Kong |
| **Monitoring** | Prometheus + Grafana | Prometheus + Grafana |
| **Logging** | Loki | Loki / ELK |

### 9.2 Decisión de Arquitectura

**Para el sistema ERP+SCADA petrolero:**

1. **Edge:** K3s + TimescaleDB + Mosquitto
   - Funcionalidad completa standalone
   - Sincronización store-and-forward
   - ~4GB RAM mínimo

2. **Cloud:** Kubernetes managed + QuestDB + Kafka + EMQX
   - Multi-tenant con RLS (Basic/Standard)
   - Database per tenant (Premium)
   - Silo opcional (Enterprise)

3. **Sincronización:** MQTT bridge + custom sync agent
   - Priorización de datos
   - Compresión y batching
   - Retry con backoff exponencial

---

## 10. Siguientes Pasos

1. **POC Edge:** Instalar K3s en hardware industrial
2. **Definir esquema de datos:** Con tenant_id desde el inicio
3. **Implementar sync agent:** Prototipo Python
4. **Configurar MQTT bridge:** Mosquitto edge ↔ EMQX cloud
5. **Diseñar CI/CD:** Para deployment a edge nodes

---

## 11. Referencias

### Documentación Oficial
- [K3s Documentation](https://docs.k3s.io/)
- [Rancher K3s](https://www.rancher.com/products/k3s)
- [AWS IoT Greengrass](https://docs.aws.amazon.com/greengrass/)
- [Azure IoT Edge](https://docs.microsoft.com/en-us/azure/iot-edge/)

### Hardware Industrial
- [Advantech Industrial IoT](https://www.advantech.com/en/products/industrial-iot)
- [Moxa Industrial Computing](https://www.moxa.com/en/products/industrial-computing)
- [Comark ATEX Certified](https://comarkcorp.com/oil-gas/)

### Multi-Tenancy
- [Azure SQL Multi-Tenant Patterns](https://learn.microsoft.com/en-us/azure/azure-sql/database/saas-tenancy-app-design-patterns)
- [AWS Multi-Tenant Guidance](https://aws.amazon.com/solutions/guidance/multi-tenant-architectures-on-aws/)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

### Casos de Uso
- [Edge Computing in Oil & Gas - ScienceDirect](https://www.sciencedirect.com/science/article/pii/S2590123024012891)
- [Shell Edge Computing](https://www.shell.com/energy-and-innovation/digitalisation.html)
