# BACKUP & RESTORE - SCADA+ERP EDGE

## Overview

Comprehensive backup and restore solution for SCADA+ERP Edge services, including PostgreSQL database, configurations, and critical data.

---

## Backup Strategy

### What Gets Backed Up

1. **PostgreSQL Database** (scadaerp)
   - All tables and data
   - Schemas and indexes
   - Sequences and constraints
   - Custom format (pg_dump -Fc)

2. **PostgreSQL Configuration**
   - postgresql.conf
   - pg_hba.conf

3. **Docker Compose Configuration**
   - docker-compose.dev.yml
   - prometheus.yml
   - .env files

4. **Grafana Data**
   - Dashboards
   - Data sources
   - User preferences
   - Plugins

5. **Prometheus Data** (optional)
   - Metrics history
   - Can be large, disabled by default

---

## Backup Scripts

### Location

```
infrastructure/scripts/
├── backup.sh              # Main backup script
├── restore.sh             # Restore script
└── setup-backup-cron.sh   # Automatic backup setup
```

### Manual Backup

```bash
# Run backup manually
./infrastructure/scripts/backup.sh

# With custom settings
BACKUP_DIR=/custom/path RETENTION_DAYS=60 ./infrastructure/scripts/backup.sh

# Include Prometheus data
BACKUP_PROMETHEUS=true ./infrastructure/scripts/backup.sh
```

### Automatic Backups

```bash
# Setup automatic backups with cron
./infrastructure/scripts/setup-backup-cron.sh

# This will prompt for:
# - Cron schedule (default: daily at 2:00 AM)
# - Backup directory (default: /var/backups/scadaerp)
# - Retention days (default: 30)
```

---

## Backup Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKUP_DIR` | `/var/backups/scadaerp` | Backup destination directory |
| `RETENTION_DAYS` | `30` | Number of days to keep backups |
| `BACKUP_PROMETHEUS` | `false` | Include Prometheus data |
| `BACKUP_NOTIFICATION_WEBHOOK` | - | Webhook URL for notifications |

### Cron Schedules

| Schedule | Description |
|----------|-------------|
| `0 2 * * *` | Daily at 2:00 AM |
| `0 */6 * * *` | Every 6 hours |
| `0 2 * * 0` | Weekly on Sunday at 2:00 AM |
| `0 2 1 * *` | Monthly on 1st at 2:00 AM |
| `*/30 * * * *` | Every 30 minutes (testing) |

---

## Backup Structure

```
/var/backups/scadaerp/
├── postgres/
│   ├── backup_20260108_140000.dump.gz
│   ├── backup_20260109_140000.dump.gz
│   └── ...
├── configs/
│   ├── postgres_config_20260108_140000.tar.gz
│   ├── docker_compose_20260108_140000.tar.gz
│   └── ...
├── volumes/
│   ├── grafana_20260108_140000.tar.gz
│   └── ...
├── backup_manifest_20260108_140000.txt
├── backup.log
└── restore.log
```

---

## Restore Process

### List Available Backups

```bash
# List all backups
./infrastructure/scripts/restore.sh

# Output:
# Available backups:
#   20260108_140000
#   20260109_140000
#   20260110_140000
```

### Restore from Backup

```bash
# Restore with confirmation
./infrastructure/scripts/restore.sh 20260108_140000

# Skip confirmation (automated restore)
./infrastructure/scripts/restore.sh 20260108_140000 --skip-confirmation
```

### Restore Process Steps

1. **Pre-restore Backup**: Creates backup of current state
2. **Decompress**: Extracts backup file
3. **Stop Services**: Stops dependent services (Grafana, pgAdmin)
4. **Restore Database**: Restores PostgreSQL data
5. **Verify**: Checks database accessibility
6. **Restart Services**: Restarts all services

---

## Backup Verification

### Automatic Verification

The backup script automatically:
- Verifies gzip integrity
- Checks file existence
- Validates backup size
- Creates manifest file

### Manual Verification

```bash
# Test backup integrity
gzip -t /var/backups/scadaerp/postgres/backup_20260108_140000.dump.gz

# View backup manifest
cat /var/backups/scadaerp/backup_manifest_20260108_140000.txt

# Check backup size
du -h /var/backups/scadaerp/postgres/backup_20260108_140000.dump.gz
```

---

## Monitoring Backups

### Check Backup Logs

```bash
# View backup log
tail -f /var/backups/scadaerp/backup.log

# View cron log
tail -f /var/backups/scadaerp/backup-cron.log

# Check last backup
ls -lht /var/backups/scadaerp/postgres/ | head -n 5
```

### Backup Status

```bash
# Check if backup ran today
find /var/backups/scadaerp/postgres/ -name "backup_$(date +%Y%m%d)*.dump.gz"

# Count backups
ls -1 /var/backups/scadaerp/postgres/*.dump.gz | wc -l

# Total backup size
du -sh /var/backups/scadaerp/
```

---

## Disaster Recovery

### Complete System Restore

1. **Install Docker and Docker Compose**
2. **Clone repository**
3. **Start services**:
   ```bash
   cd infrastructure/docker
   docker-compose -f docker-compose.dev.yml up -d
   ```
4. **Wait for services to be healthy** (30-60 seconds)
5. **Restore backup**:
   ```bash
   ./infrastructure/scripts/restore.sh <backup_id>
   ```

### Partial Restore

#### Restore Only Database

```bash
# Extract backup
gunzip -c /var/backups/scadaerp/postgres/backup_20260108_140000.dump.gz > /tmp/restore.dump

# Copy to container
docker cp /tmp/restore.dump scadaerp-postgres:/tmp/restore.dump

# Restore
docker exec scadaerp-postgres pg_restore -U scadaerp -d scadaerp -v -c /tmp/restore.dump
```

#### Restore Only Grafana

```bash
# Stop Grafana
docker-compose stop grafana

# Extract backup
tar xzf /var/backups/scadaerp/volumes/grafana_20260108_140000.tar.gz -C /tmp/

# Copy to volume
docker cp /tmp/var/lib/grafana/. scadaerp-grafana:/var/lib/grafana/

# Start Grafana
docker-compose start grafana
```

---

## Backup Best Practices

### 1. Test Restores Regularly

```bash
# Monthly restore test
./infrastructure/scripts/restore.sh <latest_backup_id> --skip-confirmation
```

### 2. Monitor Backup Size

```bash
# Alert if backup size changes significantly
CURRENT_SIZE=$(du -sb /var/backups/scadaerp/postgres/backup_latest.dump.gz | cut -f1)
EXPECTED_SIZE=100000000  # 100MB

if [ $CURRENT_SIZE -lt $((EXPECTED_SIZE / 2)) ]; then
    echo "WARNING: Backup size is unusually small"
fi
```

### 3. Off-site Backups

```bash
# Copy to remote server
rsync -avz /var/backups/scadaerp/ user@backup-server:/backups/scadaerp/

# Copy to cloud storage (AWS S3)
aws s3 sync /var/backups/scadaerp/ s3://my-bucket/scadaerp-backups/

# Copy to cloud storage (Google Cloud)
gsutil -m rsync -r /var/backups/scadaerp/ gs://my-bucket/scadaerp-backups/
```

### 4. Encrypt Backups

```bash
# Encrypt backup
gpg --symmetric --cipher-algo AES256 backup_20260108_140000.dump.gz

# Decrypt backup
gpg --decrypt backup_20260108_140000.dump.gz.gpg > backup_20260108_140000.dump.gz
```

### 5. Retention Policy

- **Daily backups**: Keep for 7 days
- **Weekly backups**: Keep for 4 weeks
- **Monthly backups**: Keep for 12 months
- **Yearly backups**: Keep indefinitely

---

## Troubleshooting

### Backup Fails

**Issue**: `pg_dump: error: connection to server failed`

**Solution**:
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker logs scadaerp-postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Restore Fails

**Issue**: `pg_restore: error: could not execute query`

**Solution**:
```bash
# Check if database exists
docker exec scadaerp-postgres psql -U scadaerp -l

# Drop and recreate database
docker exec scadaerp-postgres psql -U scadaerp -d postgres -c "DROP DATABASE IF EXISTS scadaerp;"
docker exec scadaerp-postgres psql -U scadaerp -d postgres -c "CREATE DATABASE scadaerp;"

# Retry restore
./infrastructure/scripts/restore.sh <backup_id>
```

### Disk Space Full

**Issue**: `No space left on device`

**Solution**:
```bash
# Check disk space
df -h

# Remove old backups manually
find /var/backups/scadaerp/ -name "*.gz" -mtime +7 -delete

# Compress Prometheus data
docker exec scadaerp-prometheus promtool tsdb compact /prometheus
```

### Backup Too Large

**Issue**: Backup files are too large

**Solution**:
```bash
# Exclude Prometheus data
BACKUP_PROMETHEUS=false ./infrastructure/scripts/backup.sh

# Use higher compression
docker exec scadaerp-postgres pg_dump -U scadaerp -d scadaerp -F c -Z 9 -f /tmp/backup.dump

# Vacuum database before backup
docker exec scadaerp-postgres psql -U scadaerp -d scadaerp -c "VACUUM FULL;"
```

---

## Notifications

### Webhook Notifications

```bash
# Set webhook URL
export BACKUP_NOTIFICATION_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Run backup (will send notification on completion)
./infrastructure/scripts/backup.sh
```

### Email Notifications

```bash
# Install mailutils
sudo apt-get install mailutils

# Add to backup script
echo "Backup completed" | mail -s "SCADA+ERP Backup" admin@example.com
```

---

## Security

### Backup Permissions

```bash
# Set restrictive permissions
chmod 700 /var/backups/scadaerp
chmod 600 /var/backups/scadaerp/postgres/*.dump.gz
```

### Encrypted Backups

```bash
# Generate encryption key
openssl rand -base64 32 > /root/.backup-key

# Encrypt backup
openssl enc -aes-256-cbc -salt -in backup.dump.gz -out backup.dump.gz.enc -pass file:/root/.backup-key

# Decrypt backup
openssl enc -d -aes-256-cbc -in backup.dump.gz.enc -out backup.dump.gz -pass file:/root/.backup-key
```

---

## Performance

### Backup Duration

Typical backup times:
- Small database (<1GB): 1-2 minutes
- Medium database (1-10GB): 5-15 minutes
- Large database (>10GB): 30+ minutes

### Optimization

```bash
# Parallel backup (PostgreSQL 12+)
docker exec scadaerp-postgres pg_dump -U scadaerp -d scadaerp -F d -j 4 -f /tmp/backup

# Incremental backups (using pg_basebackup)
docker exec scadaerp-postgres pg_basebackup -U scadaerp -D /tmp/backup -F tar -z -P
```

---

**Last Updated**: 2026-01-08  
**Version**: 1.0.0
