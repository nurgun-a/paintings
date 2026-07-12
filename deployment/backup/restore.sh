#!/bin/sh
# ====================================================
# AI QUEST PLATFORM - DISASTER RESTORATION UTILITY
# ====================================================

set -e

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: $0 <path_to_postgres_dump.sql.gz> <path_to_minio_assets.tar.gz>"
  exit 1
fi

DB_BACKUP_FILE=$1
MINIO_BACKUP_FILE=$2

echo "[$(date)] Launching system restoration procedure..."

# ----------------------------------------------------
# 1. Recover PostgreSQL Core Database Tables
# ----------------------------------------------------
echo "[$(date)] Unpacking database files..."
gunzip -c "$DB_BACKUP_FILE" > /tmp/temp_restore.sql

echo "[$(date)] Restoring tables via pg_restore..."
PGPASSWORD="secure_quest_db_password_2026" pg_restore -h localhost -U quest_admin -d quest_db -v -c --if-exists /tmp/temp_restore.sql || echo "Database restore completed with warnings."

rm -f /tmp/temp_restore.sql

# ----------------------------------------------------
# 2. Recover MinIO User Media Folders
# ----------------------------------------------------
echo "[$(date)] Restoring file assets storage volume..."
tar -xzf "$MINIO_BACKUP_FILE" -C /data/minio-volume/

echo "[$(date)] Restoration finished successfully."
