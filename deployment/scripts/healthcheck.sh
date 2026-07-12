#!/bin/sh
# ====================================================
# AI QUEST PLATFORM - STATUS & HEALTH DIAGNOSTICS
# ====================================================

set -e

echo "=== DIAGNOSING AI QUEST PLATFORM HEALTH STATUS ==="

# 1. Inspect Docker Container States
echo "\n[1/4] Checking Docker container states..."
docker compose -f deployment/compose/docker-compose.yml ps

# 2. Query Unified Applet Service /health endpoint
echo "\n[2/4] Pinging App Core API Service /health..."
HEALTH_RESP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "FAILED")

if [ "$HEALTH_RESP" = "200" ]; then
  echo ">>> [OK] App core backend is healthy and responding with HTTP 200."
else
  echo ">>> [CRITICAL] App service endpoint failed! Status Code: $HEALTH_RESP"
fi

# 3. Test Database Ping
echo "\n[3/4] Querying PostgreSQL readiness..."
if docker exec quest_platform_postgres pg_isready -U quest_admin -d quest_db >/dev/null 2>&1; then
  echo ">>> [OK] PostgreSQL is healthy and accepting socket queries."
else
  echo ">>> [CRITICAL] PostgreSQL connection pool failed!"
fi

# 4. Test Memory Store Ping
echo "\n[4/4] Querying Redis latency status..."
if docker exec quest_platform_redis redis-cli -a secure_redis_auth_2026 ping | grep PONG >/dev/null 2>&1; then
  echo ">>> [OK] Redis is fully operational."
else
  echo ">>> [CRITICAL] Redis is unresponsive!"
fi

echo "\nDiagnostic scan complete."
