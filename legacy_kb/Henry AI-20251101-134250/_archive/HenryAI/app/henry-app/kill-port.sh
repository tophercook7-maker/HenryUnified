#!/usr/bin/env bash
set -euo pipefail
lsof -nP -iTCP:3000 -sTCP:LISTEN -t | xargs -r kill -9
pkill -f "ts-node src/server.ts" 2>/dev/null || true
[ -f server.pid ] && { kill "$(cat server.pid)" 2>/dev/null || true; rm -f server.pid; }
