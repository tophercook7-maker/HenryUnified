#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

lsof -ti :3000 | xargs -r kill -9 || true
mkdir -p logs

# start detached; do not tie to current shell’s job control
nohup pnpm dev >> logs/server.log 2>&1 < /dev/null &
echo $! > .henry.pid

# wait up to ~10s for /health to respond
for i in {1..20}; do
  if curl -fsS http://127.0.0.1:3000/health >/dev/null 2>&1; then
    echo "Henry is up on http://127.0.0.1:3000"
    exit 0
  fi
  sleep 0.5
done

echo "Henry failed to start. Recent log:"
tail -n 80 logs/server.log
exit 1
