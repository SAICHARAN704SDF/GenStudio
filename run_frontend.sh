#!/usr/bin/env bash
# GenStudio Frontend Startup Script
set -e
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/frontend"
echo "Starting GenStudio Vite React Frontend on http://localhost:5173..."
npm run dev
