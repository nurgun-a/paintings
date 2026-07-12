#!/bin/sh
# ====================================================
# AI QUEST PLATFORM - PRODUCTION SETUP BOOTLOADER
# ====================================================

set -e

echo "===================================================="
echo "    AI QUEST PLATFORM - INITIAL INSTALLATION        "
echo "===================================================="

# Check for Docker and Compose availability
if ! command -v docker >/dev/null 2>&1; then
  echo "[ERROR] Docker engine is not installed. Please install docker daemon first."
  exit 1
fi

if ! command -v docker-compose >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
  echo "[ERROR] Docker Compose plugin is not installed."
  exit 1
fi

# Ensure .env config exist, create sample if missing
if [ ! -f ".env" ]; then
  echo "[BOOTSTRAP] Creating default environment variables .env file..."
  cat <<EOF > .env
GEMINI_API_KEY=your_gemini_api_key_here_2026
JWT_ACCESS_SECRET=super_secret_jwt_access_token_sign_key_2026
JWT_REFRESH_SECRET=super_secret_jwt_refresh_token_sign_key_2026
DATABASE_URL=postgresql://quest_admin:secure_quest_db_password_2026@postgres:5432/quest_db?schema=public
REDIS_URL=redis://redis:6379/0
EOF
fi

echo "[COMPILE] Triggering Multi-Stage Docker builds..."
docker compose -f deployment/compose/docker-compose.yml build

echo "[DATABASE] Starting database and dependencies services..."
docker compose -f deployment/compose/docker-compose.yml up -d postgres redis minio

echo "[MIGRATE] Running prisma schema initialization and seed migrations..."
docker compose -f deployment/compose/docker-compose.yml run --rm app npx prisma db push

echo "[LAUNCH] Starting Nginx Load Balancer and application modules..."
docker compose -f deployment/compose/docker-compose.yml up -d

echo "===================================================="
echo "  AI Quest Platform setup completed successfully!"
echo "  - Nginx Reverse Proxy listening on Port 80"
echo "  - MinIO Dashboard: http://localhost:9001"
echo "  - Grafana Analytics: http://localhost:3001"
echo "===================================================="
