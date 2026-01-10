# HEALTH CHECKS - SCADA+ERP EDGE

## Overview

Health checks are critical for monitoring service availability and enabling automatic recovery in Docker Compose and Kubernetes environments. This document describes the health check configuration for all Edge services.

---

## Health Check Configuration

### 1. PostgreSQL + TimescaleDB

**Health Check Command**: `pg_isready -U scadaerp`

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U scadaerp"]
  interval: 10s
  timeout: 5s
  retries: 5
```

**What it checks**:
- PostgreSQL server is accepting connections
- Database is ready to accept queries

**Expected response**: `accepting connections`

---

### 2. Zookeeper

**Health Check Command**: `nc -z localhost 2181`

```yaml
healthcheck:
  test: ["CMD", "nc", "-z", "localhost", "2181"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 10s
```

**What it checks**:
- Zookeeper is listening on port 2181
- Service is accepting connections

**Expected response**: Connection successful

---

### 3. Kafka

**Health Check Command**: `kafka-broker-api-versions --bootstrap-server localhost:9092`

```yaml
healthcheck:
  test: ["CMD", "kafka-broker-api-versions", "--bootstrap-server", "localhost:9092"]
  interval: 10s
  timeout: 10s
  retries: 5
```

**What it checks**:
- Kafka broker is responding
- API versions are available
- Broker is ready to accept connections

**Expected response**: List of API versions

---

### 4. Redis

**Health Check Command**: `redis-cli ping`

```yaml
healthcheck:
  test: ["CMD", "redis-cli", "ping"]
  interval: 10s
  timeout: 5s
  retries: 5
```

**What it checks**:
- Redis server is responding
- Server can process commands

**Expected response**: `PONG`

---

### 5. Kafka UI

**Health Check Command**: `wget --spider http://localhost:8080/actuator/health`

```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080/actuator/health"]
  interval: 15s
  timeout: 10s
  retries: 3
  start_period: 30s
```

**What it checks**:
- Web UI is accessible
- Application health endpoint responds
- Service is fully initialized

**Expected response**: HTTP 200 OK

---

### 6. Grafana

**Health Check Command**: `wget --spider http://localhost:3000/api/health`

```yaml
healthcheck:
  test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1"]
  interval: 15s
  timeout: 10s
  retries: 5
  start_period: 30s
```

**What it checks**:
- Grafana API is responding
- Database connections are working
- Service is ready to serve dashboards

**Expected response**: HTTP 200 OK with health status

---

### 7. Prometheus

**Health Check Command**: `wget --spider http://localhost:9090/-/healthy`

```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:9090/-/healthy"]
  interval: 15s
  timeout: 10s
  retries: 3
  start_period: 20s
```

**What it checks**:
- Prometheus server is running
- Configuration is valid
- Ready to scrape metrics

**Expected response**: HTTP 200 OK

---

### 8. pgAdmin

**Health Check Command**: `wget --spider http://localhost:80/misc/ping`

```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:80/misc/ping"]
  interval: 15s
  timeout: 10s
  retries: 3
  start_period: 30s
```

**What it checks**:
- pgAdmin web interface is accessible
- Application is initialized
- Can connect to PostgreSQL

**Expected response**: HTTP 200 OK

---

## Health Check Parameters

### interval
Time between health checks. Shorter intervals detect failures faster but use more resources.

**Recommended values**:
- Critical services (DB, Kafka): 10s
- Web UIs: 15s
- Monitoring tools: 15-30s

### timeout
Maximum time to wait for health check response.

**Recommended values**:
- Fast services (Redis): 5s
- Database services: 5-10s
- Web services: 10s

### retries
Number of consecutive failures before marking as unhealthy.

**Recommended values**:
- Critical services: 5 retries
- Non-critical services: 3 retries

### start_period
Grace period during container startup before health checks count toward retries.

**Recommended values**:
- Fast-starting services: 10s
- Database services: 20s
- Complex web apps: 30s

---

## Service Dependencies

Services can depend on other services being healthy:

```yaml
depends_on:
  postgres:
    condition: service_healthy
  kafka:
    condition: service_healthy
```

**Dependency Chain**:
```
Zookeeper (no deps)
  ↓
Kafka (depends on: Zookeeper)
  ↓
Kafka UI (depends on: Kafka, Zookeeper)

PostgreSQL (no deps)
  ↓
Grafana (depends on: PostgreSQL)
pgAdmin (depends on: PostgreSQL)
```

---

## Monitoring Health Status

### Check All Services

```bash
# Using Docker Compose
docker-compose -f infrastructure/docker/docker-compose.dev.yml ps

# Using custom script
./infrastructure/scripts/health-check.sh
```

### Check Individual Service

```bash
# Get health status
docker inspect --format='{{.State.Health.Status}}' scadaerp-postgres

# Get health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' scadaerp-postgres
```

### Watch Health Status

```bash
# Watch all services
watch -n 2 'docker ps --format "table {{.Names}}\t{{.Status}}"'

# Continuous health check
watch -n 5 './infrastructure/scripts/health-check.sh'
```

---

## Health Check States

| State | Description | Action |
|-------|-------------|--------|
| **healthy** | Service is working correctly | None |
| **unhealthy** | Service failed health checks | Investigate logs, restart if needed |
| **starting** | Service is initializing | Wait for start_period to complete |
| **no healthcheck** | No health check configured | Monitor manually |

---

## Troubleshooting Unhealthy Services

### 1. Check Logs

```bash
# View recent logs
docker logs --tail 100 scadaerp-<service>

# Follow logs in real-time
docker logs -f scadaerp-<service>
```

### 2. Check Health Check Output

```bash
# Get last health check result
docker inspect scadaerp-<service> | jq '.[0].State.Health'
```

### 3. Manual Health Check

```bash
# Run health check command manually
docker exec scadaerp-postgres pg_isready -U scadaerp
docker exec scadaerp-redis redis-cli ping
docker exec scadaerp-kafka kafka-broker-api-versions --bootstrap-server localhost:9092
```

### 4. Restart Service

```bash
# Restart single service
docker-compose -f infrastructure/docker/docker-compose.dev.yml restart <service>

# Restart all services
docker-compose -f infrastructure/docker/docker-compose.dev.yml restart
```

### 5. Check Resource Usage

```bash
# Check if service is resource-constrained
docker stats scadaerp-<service>
```

---

## Common Issues

### PostgreSQL: "not accepting connections"

**Causes**:
- Database is still initializing
- Configuration error
- Disk space full

**Solutions**:
```bash
# Check logs
docker logs scadaerp-postgres

# Check disk space
df -h

# Restart service
docker-compose restart postgres
```

### Kafka: "Connection refused"

**Causes**:
- Zookeeper not ready
- Network issues
- Configuration error

**Solutions**:
```bash
# Check Zookeeper first
docker logs scadaerp-zookeeper

# Check Kafka logs
docker logs scadaerp-kafka

# Verify network
docker exec scadaerp-kafka nc -zv zookeeper 2181
```

### Redis: "Connection refused"

**Causes**:
- Service crashed
- Memory limit reached
- Configuration error

**Solutions**:
```bash
# Check logs
docker logs scadaerp-redis

# Check memory usage
docker stats scadaerp-redis

# Restart service
docker-compose restart redis
```

### Web Services: "404 Not Found"

**Causes**:
- Service not fully initialized
- Wrong health check endpoint
- Application error

**Solutions**:
```bash
# Wait for start_period
sleep 30

# Check application logs
docker logs scadaerp-<service>

# Test endpoint manually
docker exec scadaerp-<service> wget -O- http://localhost:<port>/health
```

---

## Best Practices

### 1. Always Configure Health Checks

Every service should have a health check. For services without built-in health endpoints, use port checks:

```yaml
healthcheck:
  test: ["CMD", "nc", "-z", "localhost", "<port>"]
```

### 2. Use Appropriate Intervals

- Critical services: 10s interval
- Non-critical services: 15-30s interval
- Balance between detection speed and resource usage

### 3. Set Realistic Timeouts

- Account for slow startups
- Consider network latency
- Don't set too short (false positives)

### 4. Configure Start Period

- Give services time to initialize
- Prevents premature failure detection
- Especially important for databases and complex apps

### 5. Monitor Health Check Logs

```bash
# Regular monitoring
./infrastructure/scripts/health-check.sh

# Set up alerts for unhealthy services
# (integrate with monitoring system)
```

### 6. Test Health Checks

Before deploying, test health checks manually:

```bash
# Start services
docker-compose up -d

# Wait for initialization
sleep 30

# Run health check script
./infrastructure/scripts/health-check.sh

# Check for any unhealthy services
docker ps --filter "health=unhealthy"
```

---

## Integration with Monitoring

### Prometheus

Export health check status as metrics:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'docker'
    static_configs:
      - targets: ['172.20.0.1:9323']
```

### Grafana

Create dashboards showing:
- Service health status
- Health check failure rate
- Time to healthy state
- Resource usage correlation

### Alerting

Set up alerts for:
- Service unhealthy > 5 minutes
- Multiple services unhealthy
- Repeated health check failures

---

## Scripts

### Health Check Script

Location: `/infrastructure/scripts/health-check.sh`

Usage:
```bash
# Run health check
./infrastructure/scripts/health-check.sh

# Exit codes:
# 0 - All services healthy
# 1 - Some services unhealthy
# 2 - Some services still starting
```

### Network Test Script

Location: `/infrastructure/scripts/test-network.sh`

Usage:
```bash
# Test network connectivity
./infrastructure/scripts/test-network.sh
```

---

**Last Updated**: 2026-01-08  
**Version**: 1.0.0
