#!/usr/bin/env bash
# GenStudio Backend Startup Script
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/backend"
source .venv/bin/activate
echo "Starting GenStudio FastAPI Backend on http://127.0.0.1:8000..."
uvicorn app.main:app --host 127.0.0.1 --port 8000
