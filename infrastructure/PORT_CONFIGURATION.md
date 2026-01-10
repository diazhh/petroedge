# PORT CONFIGURATION - SCADA+ERP PETROLERO

## Puertos Asignados

### Servicios Core

| Servicio | Puerto | Protocolo | Descripción | Estado |
|----------|--------|-----------|-------------|--------|
| **Backend API** | 3000 | HTTP | API REST principal (Fastify) | ✅ Asignado |
| **Frontend Dev** | 5173 | HTTP | Vite dev server | ⚠️ En uso |
| **Frontend Prod** | 80/443 | HTTP/HTTPS | Nginx production | Pendiente |
| **PostgreSQL** | 15432 | TCP | Base de datos principal | ✅ Asignado |
| **TimescaleDB** | 15432 | TCP | Extensión de PostgreSQL | ✅ Asignado |

### Servicios de Mensajería y SCADA

| Servicio | Puerto | Protocolo | Descripción | Estado |
|----------|--------|-----------|-------------|--------|
| **Kafka Broker** | 9092 | TCP | Event streaming (externo) | ✅ Asignado |
| **Kafka Internal** | 29092 | TCP | Comunicación interna | ✅ Asignado |
| **Zookeeper** | 2181 | TCP | Coordinación Kafka | ✅ Asignado |
| **Kafka UI** | 8080 | HTTP | Interfaz web Kafka (dev) | ✅ Asignado |
| **Modbus TCP** | 502 | TCP | Modbus gateway | ✅ Asignado |
| **OPC-UA** | 4840 | TCP | OPC-UA server | ✅ Asignado |

### Servicios de Monitoreo

| Servicio | Puerto | Protocolo | Descripción | Estado |
|----------|--------|-----------|-------------|--------|
| **Grafana** | 3001 | HTTP | Dashboards y visualización | ✅ Asignado |
| **Prometheus** | 9090 | HTTP | Métricas y monitoring | ✅ Asignado |
| **Node Exporter** | 9100 | HTTP | Métricas del sistema | ✅ Asignado |
| **Postgres Exporter** | 9187 | HTTP | Métricas de PostgreSQL | ✅ Asignado |

### Servicios de Desarrollo

| Servicio | Puerto | Protocolo | Descripción | Estado |
|----------|--------|-----------|-------------|--------|
| **Backend Dev** | 3000 | HTTP | Fastify con hot reload | ✅ Asignado |
| **Frontend Dev** | 5173 | HTTP | Vite dev server | ⚠️ En uso |
| **Storybook** | 6006 | HTTP | Component library | ✅ Asignado |
| **API Docs** | 3000/docs | HTTP | Swagger/OpenAPI UI | ✅ Asignado |

### Servicios Cloud (Opcional)

| Servicio | Puerto | Protocolo | Descripción | Estado |
|----------|--------|-----------|-------------|--------|
| **Cloud API** | 4000 | HTTP | API Gateway Cloud | ✅ Asignado |
| **Redis** | 16379 | TCP | Cache y sessions | ✅ Asignado |
| **MinIO** | 9000 | HTTP | Object storage | ✅ Asignado |

## Resolución de Conflictos

### Puertos en Uso Detectados

Los siguientes puertos están actualmente en uso y necesitan verificación:

1. **Puerto 5000** - Servicio desconocido
   - Acción: Identificar servicio y reasignar si es necesario
   
2. **Puerto 8080** - Servicio desconocido
   - Acción: Identificar servicio y reasignar si es necesario
   
3. **Puerto 8081** - Servicio desconocido
   - Acción: Identificar servicio y reasignar si es necesario

### Puertos Alternativos

Si los puertos principales no están disponibles:

| Servicio | Puerto Principal | Puerto Alternativo |
|----------|------------------|-------------------|
| Backend API | 3000 | 4000 |
| PostgreSQL | 15432 | 15433 |
| MQTT | 15883 | 15884 |
| Redis | 16379 | 16380 |
| Grafana | 3001 | 3002 |

## Variables de Entorno

```bash
# Backend
BACKEND_PORT=3000
BACKEND_HOST=0.0.0.0

# Database
DB_HOST=localhost
DB_PORT=15432
DB_NAME=scadaerp
DB_USER=scadaerp
DB_PASSWORD=<secure_password>

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=scadaerp-backend
KAFKA_GROUP_ID=scadaerp-consumers

# Frontend
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000

# Monitoring
GRAFANA_PORT=3001
PROMETHEUS_PORT=9090
```

## Firewall Rules (Producción)

```bash
# Permitir acceso externo solo a servicios necesarios
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Bloquear acceso externo a servicios internos
sudo ufw deny 5432/tcp   # PostgreSQL
sudo ufw deny 3000/tcp   # Backend API (usar reverse proxy)
sudo ufw deny 9092/tcp   # Kafka
sudo ufw deny 9090/tcp   # Prometheus
```

## Docker Port Mapping

```yaml
# docker-compose.yml
services:
  backend:
    ports:
      - "3000:3000"
  
  postgres:
    ports:
      - "5432:5432"
  
  kafka:
    ports:
      - "9092:9092"
      - "9093:9093"
  
  zookeeper:
    ports:
      - "2181:2181"
  
  grafana:
    ports:
      - "3001:3000"
  
  prometheus:
    ports:
      - "9090:9090"
```

## Notas de Seguridad

1. **Producción**: Nunca exponer puertos de base de datos directamente
2. **TLS**: Usar siempre TLS/SSL en producción (puertos 443, 8883)
3. **Firewall**: Configurar firewall para limitar acceso
4. **VPN**: Considerar VPN para acceso remoto a servicios internos
5. **Rate Limiting**: Implementar rate limiting en API Gateway

## Actualización de Documentos

Los siguientes documentos deben actualizarse con esta configuración:

- [ ] `docs/ARQUITECTURA_EDGE_CLOUD.md`
- [ ] `docs/BACKEND_STACK.md`
- [ ] `infrastructure/docker/docker-compose.yml`
- [ ] `src/backend/.env.example`
- [ ] `src/frontend/.env.example`
- [ ] `README.md`

---

**Última actualización**: 2026-01-08  
**Versión**: 1.1.0 (Migrado de MQTT a Kafka)
