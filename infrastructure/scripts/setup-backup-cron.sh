#!/bin/bash

# Setup Automatic Backup Cron Job for SCADA+ERP Edge
# This script configures a cron job to run backups automatically

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "SCADA+ERP Automatic Backup Setup"
echo "=========================================="
echo ""

# Get the absolute path to the backup script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/backup.sh"

if [ ! -f "${BACKUP_SCRIPT}" ]; then
    echo -e "${RED}ERROR: Backup script not found at ${BACKUP_SCRIPT}${NC}"
    exit 1
fi

# Make sure backup script is executable
chmod +x "${BACKUP_SCRIPT}"

# Default schedule: Daily at 2:00 AM
DEFAULT_SCHEDULE="0 2 * * *"

echo "This script will configure automatic backups for SCADA+ERP Edge."
echo ""
echo "Backup script location: ${BACKUP_SCRIPT}"
echo ""

# Ask for schedule
echo "Enter cron schedule (default: ${DEFAULT_SCHEDULE} - Daily at 2:00 AM)"
echo "Examples:"
echo "  0 2 * * *     - Daily at 2:00 AM"
echo "  0 */6 * * *   - Every 6 hours"
echo "  0 2 * * 0     - Weekly on Sunday at 2:00 AM"
echo "  0 2 1 * *     - Monthly on 1st at 2:00 AM"
echo ""
read -p "Cron schedule [${DEFAULT_SCHEDULE}]: " CRON_SCHEDULE
CRON_SCHEDULE=${CRON_SCHEDULE:-$DEFAULT_SCHEDULE}

# Ask for backup directory
echo ""
read -p "Backup directory [/var/backups/scadaerp]: " BACKUP_DIR
BACKUP_DIR=${BACKUP_DIR:-/var/backups/scadaerp}

# Ask for retention days
echo ""
read -p "Retention days [30]: " RETENTION_DAYS
RETENTION_DAYS=${RETENTION_DAYS:-30}

# Create backup directory
echo ""
echo "Creating backup directory..."
sudo mkdir -p "${BACKUP_DIR}"
sudo chown $(whoami):$(whoami) "${BACKUP_DIR}"
echo -e "${GREEN}✓ Backup directory created${NC}"

# Create cron job entry
CRON_ENTRY="${CRON_SCHEDULE} BACKUP_DIR=${BACKUP_DIR} RETENTION_DAYS=${RETENTION_DAYS} ${BACKUP_SCRIPT} >> ${BACKUP_DIR}/backup-cron.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "${BACKUP_SCRIPT}"; then
    echo ""
    echo -e "${YELLOW}WARNING: A cron job for this backup script already exists.${NC}"
    read -p "Do you want to replace it? (yes/no): " REPLACE
    
    if [ "${REPLACE}" = "yes" ]; then
        # Remove old entry
        crontab -l 2>/dev/null | grep -v "${BACKUP_SCRIPT}" | crontab -
        echo -e "${GREEN}✓ Old cron job removed${NC}"
    else
        echo "Setup cancelled."
        exit 0
    fi
fi

# Add new cron job
echo ""
echo "Adding cron job..."
(crontab -l 2>/dev/null; echo "${CRON_ENTRY}") | crontab -
echo -e "${GREEN}✓ Cron job added successfully${NC}"

# Verify cron job
echo ""
echo "Verifying cron job..."
if crontab -l | grep -q "${BACKUP_SCRIPT}"; then
    echo -e "${GREEN}✓ Cron job verified${NC}"
else
    echo -e "${RED}✗ Cron job verification failed${NC}"
    exit 1
fi

# Summary
echo ""
echo "=========================================="
echo "Setup Complete"
echo "=========================================="
echo ""
echo "Backup Configuration:"
echo "  Schedule: ${CRON_SCHEDULE}"
echo "  Backup Directory: ${BACKUP_DIR}"
echo "  Retention: ${RETENTION_DAYS} days"
echo "  Log File: ${BACKUP_DIR}/backup-cron.log"
echo ""
echo "Current cron jobs:"
crontab -l | grep "${BACKUP_SCRIPT}"
echo ""
echo "To test the backup manually, run:"
echo "  ${BACKUP_SCRIPT}"
echo ""
echo "To view backup logs:"
echo "  tail -f ${BACKUP_DIR}/backup-cron.log"
echo ""
echo "To remove the cron job:"
echo "  crontab -e"
echo "  (then delete the line containing: ${BACKUP_SCRIPT})"
echo ""

exit 0
