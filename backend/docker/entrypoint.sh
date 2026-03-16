#!/bin/bash
set -e

echo "🏥 Starting Parent Med Backend..."

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

echo "🚀 Starting FastAPI application..."
exec uv run uvicorn src.main:app --host 0.0.0.0 --port 8000 "$@"
