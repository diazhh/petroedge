# NETWORKING CONFIGURATION - SCADA+ERP EDGE

## Arquitectura de Red

### Topología de Red Docker

```
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Network: scadaerp-network              │
│                    Subnet: 172.20.0.0/16                         │
│                    Gateway: 172.20.0.1                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  PostgreSQL  │  │  Zookeeper   │  │    Kafka     │          │
│  │  :5432       │  │  :2181       │  │  :9092       │          │
│  │              │  │              │  │  :29092      │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┴─────────────────┘                   │
│                           │                                      │
│         ┌─────────────────┴─────────────────┐                   │
│         │                                   │                   │
│  ┌──────▼───────┐  ┌──────────────┐  ┌─────▼──────┐            │
│  │    Redis     │  │   Kafka UI   │  │  Grafana   │            │
│  │    :6379     │  │   :8080      │  │   :3000    │            │
│  └──────────────┘  └──────────────┘  └────────────┘            │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │  Prometheus  │  │   pgAdmin    │                             │
│  │   :9090      │  │    :80       │                             │
│  └──────────────┘  └──────────────┘                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Comunicación entre Servicios

### 1. Backend → PostgreSQL

**Protocolo**: PostgreSQL Wire Protocol (TCP)  
**Puerto**: 5432 (interno), 15432 (host)  
**DNS**: `postgres:5432`

```typescript
// Backend connection
const pool = new Pool({
  host: 'postgres',  // DNS interno de Docker
  port: 5432,
  database: 'scadaerp',
  user: 'scadaerp',
  password: process.env.DB_PASSWORD
});
```

### 2. Backend → Kafka

**Protocolo**: Kafka Protocol (TCP)  
**Puerto**: 29092 (interno), 9092 (host)  
**DNS**: `kafka:29092`

```typescript
// Backend Kafka producer
const kafka = new Kafka({
  clientId: 'scadaerp-backend',
  brokers: ['kafka:29092']  // DNS interno
});
```

### 3. Backend → Redis

**Protocolo**: Redis Protocol (TCP)  
**Puerto**: 6379 (interno), 16379 (host)  
**DNS**: `redis:6379`

```typescript
// Backend Redis client
const redis = new Redis({
  host: 'redis',
  port: 6379
});
```

### 4. Kafka → Zookeeper

**Protocolo**: Zookeeper Protocol (TCP)  
**Puerto**: 2181  
**DNS**: `zookeeper:2181`

```yaml
KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
```

### 5. Grafana → PostgreSQL

**Protocolo**: PostgreSQL Wire Protocol (TCP)  
**Puerto**: 5432  
**DNS**: `postgres:5432`

Configuración de datasource en Grafana:
- Host: `postgres:5432`
- Database: `scadaerp`

### 6. Prometheus → Servicios

**Protocolo**: HTTP (Metrics endpoint)  
**Puertos**: Varios (según servicio)

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:9187']
  
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:3000']
```

## Service Discovery

### DNS Interno de Docker

Docker Compose crea automáticamente entradas DNS para cada servicio:

| Servicio | DNS Name | IP Range |
|----------|----------|----------|
| postgres | postgres | 172.20.0.x |
| zookeeper | zookeeper | 172.20.0.x |
| kafka | kafka | 172.20.0.x |
| redis | redis | 172.20.0.x |
| grafana | grafana | 172.20.0.x |
| prometheus | prometheus | 172.20.0.x |
| kafka-ui | kafka-ui | 172.20.0.x |
| pgadmin | pgadmin | 172.20.0.x |

### Aliases de Red

Cada servicio puede tener múltiples aliases para facilitar la comunicación:

```yaml
services:
  postgres:
    networks:
      scadaerp-network:
        aliases:
          - db
          - database
          - postgresql
```

## Health Checks

### PostgreSQL

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U scadaerp"]
  interval: 10s
  timeout: 5s
  retries: 5
```

### Kafka

```yaml
healthcheck:
  test: ["CMD", "kafka-broker-api-versions", "--bootstrap-server", "localhost:9092"]
  interval: 10s
  timeout: 10s
  retries: 5
```

### Redis

```yaml
healthcheck:
  test: ["CMD", "redis-cli", "ping"]
  interval: 10s
  timeout: 5s
  retries: 5
```

## Port Mapping

### Puertos Expuestos al Host

| Servicio | Puerto Interno | Puerto Host | Propósito |
|----------|---------------|-------------|-----------|
| PostgreSQL | 5432 | 15432 | Acceso desde host |
| Kafka | 9092 | 9092 | Acceso desde host |
| Kafka (interno) | 29092 | - | Solo contenedores |
| Zookeeper | 2181 | 2181 | Acceso desde host |
| Redis | 6379 | 16379 | Acceso desde host |
| Grafana | 3000 | 3001 | Web UI |
| Prometheus | 9090 | 9090 | Web UI |
| Kafka UI | 8080 | 8081 | Web UI |
| pgAdmin | 80 | 5050 | Web UI |

### Puertos Solo Internos

Estos puertos solo son accesibles dentro de la red Docker:

- Kafka interno: 29092
- PostgreSQL: 5432 (también expuesto como 15432)
- Redis: 6379 (también expuesto como 16379)

## Seguridad de Red

### 1. Aislamiento de Red

Todos los servicios están en una red bridge aislada (`scadaerp-network`):

```yaml
networks:
  scadaerp-network:
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 172.20.0.0/16
          gateway: 172.20.0.1
```

### 2. Comunicación Interna

- Los servicios se comunican usando DNS interno
- No se requiere exponer puertos al host para comunicación interna
- El tráfico nunca sale de la red Docker

### 3. Puertos Expuestos

Solo los puertos necesarios están expuestos al host:

```yaml
ports:
  - "15432:5432"  # PostgreSQL - solo para desarrollo
  - "9092:9092"   # Kafka - acceso externo
  - "3001:3000"   # Grafana - UI
```

### 4. Firewall (Producción)

En producción, configurar firewall para limitar acceso:

```bash
# Permitir solo HTTPS
sudo ufw allow 443/tcp

# Bloquear acceso directo a servicios
sudo ufw deny 15432/tcp  # PostgreSQL
sudo ufw deny 9092/tcp   # Kafka
sudo ufw deny 16379/tcp  # Redis
```

## Troubleshooting

### Verificar Conectividad entre Servicios

```bash
# Desde el host, entrar a un contenedor
docker exec -it scadaerp-postgres bash

# Dentro del contenedor, probar conectividad
ping kafka
ping redis
ping zookeeper

# Probar puertos
nc -zv kafka 29092
nc -zv redis 6379
nc -zv postgres 5432
```

### Verificar DNS

```bash
# Resolver DNS interno
docker exec scadaerp-postgres nslookup kafka
docker exec scadaerp-postgres nslookup redis
```

### Verificar Red Docker

```bash
# Listar redes
docker network ls

# Inspeccionar red
docker network inspect scadaerp_scadaerp-network

# Ver IPs asignadas
docker network inspect scadaerp_scadaerp-network | grep -A 3 "Containers"
```

### Logs de Red

```bash
# Ver logs de un servicio
docker logs scadaerp-postgres
docker logs scadaerp-kafka

# Seguir logs en tiempo real
docker logs -f scadaerp-postgres
```

## Configuración de Backend

### Variables de Entorno

```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=scadaerp
DB_USER=scadaerp
DB_PASSWORD=scadaerp_dev_password

# Kafka
KAFKA_BROKERS=kafka:29092
KAFKA_CLIENT_ID=scadaerp-backend
KAFKA_GROUP_ID=scadaerp-consumers

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
```

### Connection Strings

```bash
# PostgreSQL
DATABASE_URL=postgresql://scadaerp:scadaerp_dev_password@postgres:5432/scadaerp

# Redis
REDIS_URL=redis://redis:6379
```

## Monitoreo de Red

### Métricas de Red

Prometheus puede recolectar métricas de red:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'docker'
    static_configs:
      - targets: ['172.20.0.1:9323']  # Docker daemon metrics
```

### Grafana Dashboards

Dashboards recomendados:
- Docker Container Metrics
- PostgreSQL Database Metrics
- Kafka Cluster Metrics
- Redis Metrics

## Escalabilidad

### Múltiples Instancias

Para escalar servicios, usar Docker Compose scale:

```bash
# Escalar backend a 3 instancias
docker-compose up -d --scale backend=3
```

### Load Balancing

Para producción, usar un load balancer (nginx, traefik):

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    networks:
      - scadaerp-network
```

## Migración a Kubernetes

Cuando se migre a K3s, la configuración de red será:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
  type: ClusterIP
```

Los servicios se comunicarán usando:
- DNS: `postgres.scadaerp.svc.cluster.local`
- Puerto: 5432

---

**Última actualización**: 2026-01-08  
**Versión**: 1.0.0
