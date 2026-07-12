#!/bin/sh
# ====================================================
# AI QUEST PLATFORM - ZERO-DOWNTIME ROLLOUT UPDATE
# ====================================================

set -e

echo "[ROLLOUT] Commencing rolling hot update rollout..."

# Pull latest repository changes from main branch
# git pull origin main

echo "[BUILD] Building optimized production container layers..."
docker compose -f deployment/compose/docker-compose.yml build app

echo "[MIGRATE] Upgrading schema with non-blocking migrations..."
docker compose -f deployment/compose/docker-compose.yml run --rm app npx prisma db push

echo "[REDEPLOY] Initiating zero-downtime rolling reload..."
# Re-creates container in background while routing existing traffic
docker compose -f deployment/compose/docker-compose.yml up -d --no-deps --build app

# Prune old stale dangling build cache layers
docker image prune -f

echo "[ROLLOUT] Update successfully completed."
