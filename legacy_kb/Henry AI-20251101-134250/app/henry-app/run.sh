#!/usr/bin/env bash
set -euo pipefail
CMD="${1:-start}"
case "$CMD" in
  start)
    ( cd client && npm run build )
    TS_NODE_PROJECT=tsconfig.server.json node -r ts-node/register/transpile-only src/server.ts &
    echo $! > server.pid
    for i in {1..40}; do curl -sf http://127.0.0.1:3000/health >/dev/null && break || sleep 0.5; done
    ;;
  stop)
    kill -9 $(cat server.pid 2>/dev/null) 2>/dev/null || true
    rm -f server.pid
    ;;
  status)
    curl -s http://127.0.0.1:3000/health || echo down
    ;;
  *) echo "Usage: ./run.sh {start|stop|status}"; exit 2 ;;
esac
