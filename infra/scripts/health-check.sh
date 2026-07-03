#!/bin/sh
# FoodFlow Health Check Script
# Verifies all services are running and healthy

echo "=== FoodFlow Health Check ==="
echo ""

check_service() {
  NAME=$1
  URL=$2
  EXPECTED=${3:-200}
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" 2>/dev/null)
  if [ "$STATUS" = "$EXPECTED" ]; then
    echo "✅ $NAME: OK ($STATUS)"
  else
    echo "❌ $NAME: FAIL ($STATUS)"
  fi
}

check_service "Backend API" "http://localhost:3001/api/healthz"
check_service "MinIO" "http://localhost:9000/minio/health/live"

echo ""
echo "Docker containers:"
docker ps --filter "name=foodflow" --format "  {{.Names}}: {{.Status}}" 2>/dev/null || echo "  Docker not available"

echo ""
echo "=== Health Check Complete ==="
