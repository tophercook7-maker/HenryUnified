#!/usr/bin/env bash
set -euo pipefail
DIR="$(osascript -e 'tell app "System Events" to POSIX path of (choose folder with prompt "Choose your LostBible folder (the one with the .txt files):")' 2>/dev/null | tr -d '\r\n')"
[ -n "$DIR" ] || { echo "No folder chosen."; exit 1; }
perl -i.bak -pe 's|^KNOWLEDGE_DIR=.*$||g' .env 2>/dev/null || true
grep -q '^KNOWLEDGE_DIR=' .env 2>/dev/null || echo "KNOWLEDGE_DIR=$DIR" >> .env
sed -i.bak -e "s|^KNOWLEDGE_DIR=.*|KNOWLEDGE_DIR=$DIR|" .env
echo "KNOWLEDGE_DIR set to: $DIR"
pnpm ingest
curl -s -X POST http://127.0.0.1:3000/reload | jq .
