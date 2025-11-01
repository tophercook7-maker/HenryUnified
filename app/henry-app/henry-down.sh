#!/usr/bin/env bash
set -euo pipefail
[ -f .henry.pid ] && kill "$(cat .henry.pid)" 2>/dev/null || true
rm -f .henry.pid
lsof -ti :3000 | xargs -r kill -9
echo "Henry stopped."
