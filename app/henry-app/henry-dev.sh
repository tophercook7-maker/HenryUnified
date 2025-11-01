#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
lsof -ti :3000 | xargs -r kill -9 2>/dev/null || true
TS_NODE_PROJECT=tsconfig.server.json node -r ts-node/register/transpile-only src/server.ts > .server.log 2>&1 &
PID=$!
for i in $(seq 1 40); do curl -fsS http://127.0.0.1:3000/health >/dev/null && break; sleep 0.5; done
ELECTRON_DISABLE_GPU=1 ELECTRON_ENABLE_LOGGING=1 ELECTRON_DISABLE_SANDBOX=1 node_modules/.ignored_electron/dist/electron .
wait $PID || true
