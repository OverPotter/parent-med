#!/bin/bash
set -e

echo "🏥 Starting PillPath Backend..."

echo "⏳ Waiting for PostgreSQL..."
python3 << 'EOF'
import socket
import sys
import time

def check_postgres():
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(1)
    try:
        result = sock.connect_ex(("postgres", 5432))
        sock.close()
        return result == 0
    except Exception:
        return False

max_attempts = 60
for _ in range(max_attempts):
    if check_postgres():
        print("✅ PostgreSQL is ready")
        sys.exit(0)
    time.sleep(1)

print("❌ PostgreSQL not available after 60 seconds")
sys.exit(1)
EOF

echo "🔄 Running database migrations..."
uv run alembic upgrade head

if [ "${RUN_CURATED_CATALOG_SEED:-0}" = "1" ] || [ "${RUN_CURATED_CATALOG_SEED:-false}" = "true" ]; then
  if [ -f "/app/scripts/seed_curated_medicine_catalog.py" ]; then
    echo "🧪 Seeding curated medicine catalog..."
    uv run python scripts/seed_curated_medicine_catalog.py
  else
    echo "ℹ️ RUN_CURATED_CATALOG_SEED is enabled, but scripts/seed_curated_medicine_catalog.py is missing. Skipping."
  fi
fi

echo "🚀 Starting FastAPI application..."
exec uv run uvicorn src.main:app --host 0.0.0.0 --port 8000 "$@"
