#!/bin/sh
# ====================================================
# AI QUEST PLATFORM - AUTOMATED DATABASE & STORAGE BACKUP
# ====================================================

set -e

BACKUP_DIR="/var/backups/quest_platform"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=7

echo "[$(date)] Starting backup operation..."

# Create backup storage directory
mkdir -p "$BACKUP_DIR"

# ----------------------------------------------------
# 1. PostgreSQL Database Dump Backup
# ----------------------------------------------------
echo "[$(date)] Dumping PostgreSQL core tables..."
PGPASSWORD="secure_quest_db_password_2026" pg_dump -h localhost -U quest_admin -d quest_db -F c -b -v -f "$BACKUP_DIR/postgres_dump_$TIMESTAMP.sql"

# Compress database sql dump
gzip "$BACKUP_DIR/postgres_dump_$TIMESTAMP.sql"

# ----------------------------------------------------
# 2. MinIO S3 Assets Media Archive Backup
# ----------------------------------------------------
echo "[$(date)] Packaging MinIO user uploads and verification photographs..."
# Create a recursive tarball of the persistent minio folder mount
tar -czf "$BACKUP_DIR/minio_assets_$TIMESTAMP.tar.gz" -C /data/minio-volume/ . || echo "MinIO path not mounted yet, skipping..."

# ----------------------------------------------------
# 3. Apply Retention & Rotation Policies (Delete > 7 Days)
# ----------------------------------------------------
echo "[$(date)] Appling daily rotation limits..."
find "$BACKUP_DIR" -type f -name "postgres_dump_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -type f -name "minio_assets_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "[$(date)] Backup completed successfully. Outputs preserved under: $BACKUP_DIR"
