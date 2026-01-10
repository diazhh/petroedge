#!/bin/bash

# Restore Script for SCADA+ERP Edge
# Restores PostgreSQL database and configurations from backup

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/scadaerp}"
LOG_FILE="${BACKUP_DIR}/restore.log"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_id> [--skip-confirmation]"
    echo ""
    echo "Available backups:"
    ls -1 "${BACKUP_DIR}/postgres/" | grep "backup_.*\.dump\.gz" | sed 's/backup_/  /' | sed 's/\.dump\.gz//'
    exit 1
fi

BACKUP_ID=$1
SKIP_CONFIRMATION=${2:-""}

POSTGRES_BACKUP_FILE="${BACKUP_DIR}/postgres/backup_${BACKUP_ID}.dump.gz"
MANIFEST_FILE="${BACKUP_DIR}/backup_manifest_${BACKUP_ID}.txt"

log "=========================================="
log "Starting restore process"
log "=========================================="

# Check if backup exists
if [ ! -f "${POSTGRES_BACKUP_FILE}" ]; then
    log_error "Backup file not found: ${POSTGRES_BACKUP_FILE}"
    log_error "Available backups:"
    ls -1 "${BACKUP_DIR}/postgres/" | grep "backup_.*\.dump\.gz" | sed 's/backup_/  /' | sed 's/\.dump\.gz//'
    exit 1
fi

# Show backup information
if [ -f "${MANIFEST_FILE}" ]; then
    echo ""
    echo -e "${BLUE}Backup Information:${NC}"
    cat "${MANIFEST_FILE}"
    echo ""
fi

# Confirmation
if [ "${SKIP_CONFIRMATION}" != "--skip-confirmation" ]; then
    echo -e "${YELLOW}WARNING: This will replace the current database with the backup!${NC}"
    echo -e "${YELLOW}All current data will be lost!${NC}"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " CONFIRM
    
    if [ "${CONFIRM}" != "yes" ]; then
        log "Restore cancelled by user"
        exit 0
    fi
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    log_error "Docker is not running"
    exit 1
fi

# Check if PostgreSQL container is running
if ! docker ps | grep -q "scadaerp-postgres"; then
    log_error "PostgreSQL container is not running"
    log "Please start the services first:"
    log "  cd infrastructure/docker && docker-compose -f docker-compose.dev.yml up -d"
    exit 1
fi

# 1. Create pre-restore backup
log "1. Creating pre-restore backup..."

PRE_RESTORE_BACKUP="${BACKUP_DIR}/postgres/pre_restore_backup_$(date +%Y%m%d_%H%M%S).dump"

if docker exec scadaerp-postgres pg_dump -U scadaerp -d scadaerp -F c -b -f /tmp/pre_restore.dump 2>&1 | tee -a "$LOG_FILE"; then
    docker cp scadaerp-postgres:/tmp/pre_restore.dump "${PRE_RESTORE_BACKUP}"
    docker exec scadaerp-postgres rm /tmp/pre_restore.dump
    gzip "${PRE_RESTORE_BACKUP}"
    log_success "Pre-restore backup created: ${PRE_RESTORE_BACKUP}.gz"
else
    log_warning "Pre-restore backup failed (database may be empty)"
fi

# 2. Decompress backup if needed
log "2. Preparing backup file..."

TEMP_BACKUP="/tmp/restore_backup_${BACKUP_ID}.dump"

if [[ "${POSTGRES_BACKUP_FILE}" == *.gz ]]; then
    gunzip -c "${POSTGRES_BACKUP_FILE}" > "${TEMP_BACKUP}"
    log_success "Backup decompressed"
else
    cp "${POSTGRES_BACKUP_FILE}" "${TEMP_BACKUP}"
fi

# 3. Copy backup to container
log "3. Copying backup to PostgreSQL container..."

docker cp "${TEMP_BACKUP}" scadaerp-postgres:/tmp/restore.dump
rm "${TEMP_BACKUP}"

log_success "Backup copied to container"

# 4. Stop dependent services
log "4. Stopping dependent services..."

docker-compose -f infrastructure/docker/docker-compose.dev.yml stop grafana pgadmin 2>/dev/null || true

log_success "Dependent services stopped"

# 5. Restore database
log "5. Restoring PostgreSQL database..."

# Drop existing connections
docker exec scadaerp-postgres psql -U scadaerp -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'scadaerp' AND pid <> pg_backend_pid();" 2>&1 | tee -a "$LOG_FILE" || true

# Restore
if docker exec scadaerp-postgres pg_restore -U scadaerp -d scadaerp -v -c --if-exists /tmp/restore.dump 2>&1 | tee -a "$LOG_FILE"; then
    log_success "Database restored successfully"
else
    log_error "Database restore failed"
    log "Check the log file for details: ${LOG_FILE}"
    exit 1
fi

# Cleanup
docker exec scadaerp-postgres rm /tmp/restore.dump

# 6. Verify restore
log "6. Verifying restore..."

# Check if database is accessible
if docker exec scadaerp-postgres psql -U scadaerp -d scadaerp -c "SELECT COUNT(*) FROM users;" 2>&1 | tee -a "$LOG_FILE"; then
    log_success "Database is accessible and functional"
else
    log_error "Database verification failed"
    exit 1
fi

# 7. Restart dependent services
log "7. Restarting dependent services..."

docker-compose -f infrastructure/docker/docker-compose.dev.yml start grafana pgadmin 2>/dev/null || true

log_success "Dependent services restarted"

# 8. Summary
log "=========================================="
log "Restore completed successfully"
log "=========================================="
log ""
log "Restored from: ${POSTGRES_BACKUP_FILE}"
log "Backup ID: ${BACKUP_ID}"
log ""
log "Pre-restore backup saved at:"
log "  ${PRE_RESTORE_BACKUP}.gz"
log ""
log "Services status:"
docker-compose -f infrastructure/docker/docker-compose.dev.yml ps 2>/dev/null || docker ps --filter "name=scadaerp"
log ""

exit 0
