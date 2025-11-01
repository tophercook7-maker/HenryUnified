#!/usr/bin/env bash
set -euo pipefail
echo "Watcher (frontend-only) starting…"
while true; do
  npx chokidar "client/src/**/*" "client/index.html" -d 200 -c "cd client && pnpm build && cd .. && rsync -a --delete client/dist/ public/ && echo OK $(date)" || true
  echo "Watcher exited; restarting in 1s…"; sleep 1
done
