#!/usr/bin/env bash
set -euo pipefail
mkdir -p logs
lsof -ti :3000 | xargs -r kill -9
pnpm dev >> logs/server.log 2>&1 & echo $! > .henry.pid
echo "Henry started (PID $(cat .henry.pid)). Logs: logs/server.log"
