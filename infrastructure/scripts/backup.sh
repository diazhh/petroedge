#!/bin/bash

# Automatic Backup Script for SCADA+ERP Edge
# Backs up PostgreSQL database, configurations, and volumes

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/scadaerp}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${BACKUP_DIR}/backup.log"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"
mkdir -p "${BACKUP_DIR}/postgres"
mkdir -p "${BACKUP_DIR}/configs"
mkdir -p "${BACKUP_DIR}/volumes"

log "=========================================="
log "Starting backup process"
log "=========================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    log_error "Docker is not running"
    exit 1
fi

# Check if PostgreSQL container is running
if ! docker ps | grep -q "scadaerp-postgres"; then
    log_error "PostgreSQL container is not running"
    exit 1
fi

# 1. Backup PostgreSQL Database
log "1. Backing up PostgreSQL database..."

POSTGRES_BACKUP_FILE="${BACKUP_DIR}/postgres/backup_${DATE}.dump"

if docker exec scadaerp-postgres pg_dump -U scadaerp -d scadaerp -F c -b -v -f /tmp/backup.dump 2>&1 | tee -a "$LOG_FILE"; then
    docker cp scadaerp-postgres:/tmp/backup.dump "${POSTGRES_BACKUP_FILE}"
    docker exec scadaerp-postgres rm /tmp/backup.dump
    
    # Compress backup
    gzip "${POSTGRES_BACKUP_FILE}"
    
    BACKUP_SIZE=$(du -h "${POSTGRES_BACKUP_FILE}.gz" | cut -f1)
    log_success "PostgreSQL backup completed: ${POSTGRES_BACKUP_FILE}.gz (${BACKUP_SIZE})"
else
    log_error "PostgreSQL backup failed"
    exit 1
fi

# 2. Backup PostgreSQL Configuration
log "2. Backing up PostgreSQL configuration..."

CONFIG_BACKUP_FILE="${BACKUP_DIR}/configs/postgres_config_${DATE}.tar.gz"

if docker exec scadaerp-postgres tar czf /tmp/pg_config.tar.gz /var/lib/postgresql/data/postgresql.conf /var/lib/postgresql/data/pg_hba.conf 2>/dev/null; then
    docker cp scadaerp-postgres:/tmp/pg_config.tar.gz "${CONFIG_BACKUP_FILE}"
    docker exec scadaerp-postgres rm /tmp/pg_config.tar.gz
    log_success "PostgreSQL configuration backed up"
else
    log_warning "PostgreSQL configuration backup failed (may not exist yet)"
fi

# 3. Backup Docker Compose Configuration
log "3. Backing up Docker Compose configuration..."

COMPOSE_BACKUP_FILE="${BACKUP_DIR}/configs/docker_compose_${DATE}.tar.gz"

if [ -f "infrastructure/docker/docker-compose.dev.yml" ]; then
    tar czf "${COMPOSE_BACKUP_FILE}" \
        infrastructure/docker/docker-compose.dev.yml \
        infrastructure/docker/prometheus/prometheus.yml \
        .env 2>/dev/null || true
    log_success "Docker Compose configuration backed up"
else
    log_warning "Docker Compose files not found"
fi

# 4. Backup Grafana Dashboards and Data Sources
log "4. Backing up Grafana data..."

GRAFANA_BACKUP_FILE="${BACKUP_DIR}/volumes/grafana_${DATE}.tar.gz"

if docker exec scadaerp-grafana tar czf /tmp/grafana_backup.tar.gz /var/lib/grafana 2>/dev/null; then
    docker cp scadaerp-grafana:/tmp/grafana_backup.tar.gz "${GRAFANA_BACKUP_FILE}"
    docker exec scadaerp-grafana rm /tmp/grafana_backup.tar.gz
    log_success "Grafana data backed up"
else
    log_warning "Grafana backup failed"
fi

# 5. Backup Prometheus Data (optional - can be large)
if [ "${BACKUP_PROMETHEUS:-false}" = "true" ]; then
    log "5. Backing up Prometheus data..."
    
    PROMETHEUS_BACKUP_FILE="${BACKUP_DIR}/volumes/prometheus_${DATE}.tar.gz"
    
    if docker exec scadaerp-prometheus tar czf /tmp/prometheus_backup.tar.gz /prometheus 2>/dev/null; then
        docker cp scadaerp-prometheus:/tmp/prometheus_backup.tar.gz "${PROMETHEUS_BACKUP_FILE}"
        docker exec scadaerp-prometheus rm /tmp/prometheus_backup.tar.gz
        log_success "Prometheus data backed up"
    else
        log_warning "Prometheus backup failed"
    fi
else
    log "5. Skipping Prometheus data backup (set BACKUP_PROMETHEUS=true to enable)"
fi

# 6. Create backup manifest
log "6. Creating backup manifest..."

MANIFEST_FILE="${BACKUP_DIR}/backup_manifest_${DATE}.txt"

cat > "${MANIFEST_FILE}" << EOF
SCADA+ERP Edge Backup Manifest
==============================
Backup Date: $(date)
Backup ID: ${DATE}

Files:
------
PostgreSQL Database: postgres/backup_${DATE}.dump.gz
PostgreSQL Config: configs/postgres_config_${DATE}.tar.gz
Docker Compose: configs/docker_compose_${DATE}.tar.gz
Grafana Data: volumes/grafana_${DATE}.tar.gz
$([ "${BACKUP_PROMETHEUS:-false}" = "true" ] && echo "Prometheus Data: volumes/prometheus_${DATE}.tar.gz")

System Information:
------------------
Hostname: $(hostname)
Docker Version: $(docker --version)
PostgreSQL Version: $(docker exec scadaerp-postgres psql -U scadaerp -d scadaerp -c "SELECT version();" -t | head -n1)

Container Status:
----------------
$(docker ps --filter "name=scadaerp" --format "{{.Names}}: {{.Status}}")

Backup Statistics:
-----------------
Total Backup Size: $(du -sh ${BACKUP_DIR} | cut -f1)
EOF

log_success "Backup manifest created: ${MANIFEST_FILE}"

# 7. Cleanup old backups
log "7. Cleaning up old backups (retention: ${RETENTION_DAYS} days)..."

DELETED_COUNT=0

# Delete old PostgreSQL backups
find "${BACKUP_DIR}/postgres" -name "backup_*.dump.gz" -mtime +${RETENTION_DAYS} -type f -delete 2>/dev/null && DELETED_COUNT=$((DELETED_COUNT + 1)) || true

# Delete old config backups
find "${BACKUP_DIR}/configs" -name "*_config_*.tar.gz" -mtime +${RETENTION_DAYS} -type f -delete 2>/dev/null && DELETED_COUNT=$((DELETED_COUNT + 1)) || true
find "${BACKUP_DIR}/configs" -name "docker_compose_*.tar.gz" -mtime +${RETENTION_DAYS} -type f -delete 2>/dev/null && DELETED_COUNT=$((DELETED_COUNT + 1)) || true

# Delete old volume backups
find "${BACKUP_DIR}/volumes" -name "grafana_*.tar.gz" -mtime +${RETENTION_DAYS} -type f -delete 2>/dev/null && DELETED_COUNT=$((DELETED_COUNT + 1)) || true
find "${BACKUP_DIR}/volumes" -name "prometheus_*.tar.gz" -mtime +${RETENTION_DAYS} -type f -delete 2>/dev/null && DELETED_COUNT=$((DELETED_COUNT + 1)) || true

# Delete old manifests
find "${BACKUP_DIR}" -name "backup_manifest_*.txt" -mtime +${RETENTION_DAYS} -type f -delete 2>/dev/null && DELETED_COUNT=$((DELETED_COUNT + 1)) || true

if [ $DELETED_COUNT -gt 0 ]; then
    log_success "Deleted ${DELETED_COUNT} old backup files"
else
    log "No old backups to delete"
fi

# 8. Verify backup integrity
log "8. Verifying backup integrity..."

if [ -f "${POSTGRES_BACKUP_FILE}.gz" ]; then
    if gzip -t "${POSTGRES_BACKUP_FILE}.gz" 2>/dev/null; then
        log_success "PostgreSQL backup integrity verified"
    else
        log_error "PostgreSQL backup is corrupted!"
        exit 1
    fi
else
    log_error "PostgreSQL backup file not found!"
    exit 1
fi

# 9. Summary
log "=========================================="
log "Backup completed successfully"
log "=========================================="
log ""
log "Backup Location: ${BACKUP_DIR}"
log "Backup ID: ${DATE}"
log "Total Size: $(du -sh ${BACKUP_DIR} | cut -f1)"
log ""
log "To restore from this backup, run:"
log "  ./infrastructure/scripts/restore.sh ${DATE}"
log ""

# Optional: Send notification (email, webhook, etc.)
if [ -n "${BACKUP_NOTIFICATION_WEBHOOK}" ]; then
    curl -X POST "${BACKUP_NOTIFICATION_WEBHOOK}" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"SCADA+ERP Backup completed successfully. Backup ID: ${DATE}\"}" \
        2>/dev/null || log_warning "Failed to send notification"
fi

exit 0
