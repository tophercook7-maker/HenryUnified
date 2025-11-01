#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
echo "[rebuild] killing :3000 …"
lsof -ti :3000 | xargs -r kill -9 || true
pkill -f "ts-node src/server.ts" 2>/dev/null || true
rm -f server.pid .rebuild.lock
echo "[rebuild] client build …"
cd client && pnpm build && cd ..
rsync -a --delete client/dist/ public/
echo "[rebuild] starting server …"
nohup npx ts-node --transpile-only src/server.ts > server.log 2>&1 & echo $! > server.pid
echo "[rebuild] waiting for health …"
for i in {1..40}; do
  if curl -sf http://127.0.0.1:3000/health >/dev/null; then echo "[rebuild] healthy ✅"; exit 0; fi
  sleep 0.25
done
echo "[rebuild] ❌ server not healthy; last logs:"
tail -n 120 server.log || true
exit 1
