#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
API_LOG="$ROOT/logs/api.dev.log"
CLIENT_LOG="$ROOT/logs/client.dev.log"
mkdir -p "$ROOT/logs"

# Clean ports
lsof -nP -i :3000  -sTCP:LISTEN | awk 'NR>1{print $2}' | xargs -I{} kill -9 {} 2>/dev/null || true
lsof -nP -i :5173  -sTCP:LISTEN | awk 'NR>1{print $2}' | xargs -I{} kill -9 {} 2>/dev/null || true

# Start API
echo "[dev] starting API → http://127.0.0.1:3000" | tee "$API_LOG"
TS_NODE_PROJECT=tsconfig.server.json node -r ts-node/register/transpile-only src/server.ts >>"$API_LOG" 2>&1 &
API_PID=$!

# Wait for API health
npx wait-on http://127.0.0.1:3000/health

# Start client (strictly on 5173 so the URL never drifts again)
echo "[dev] starting Vite → http://localhost:5173" | tee "$CLIENT_LOG"
( cd "$ROOT/client" && npx vite --port 5173 --strictPort ) >>"$CLIENT_LOG" 2>&1 &
CLIENT_PID=$!

# Clean up both on exit
cleanup() {
  kill $CLIENT_PID 2>/dev/null || true
  kill $API_PID 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "[dev] running. API pid=$API_PID  client pid=$CLIENT_PID"
wait
