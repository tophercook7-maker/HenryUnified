#!/usr/bin/env bash
set -euo pipefail

read -r -s -p "Paste OpenAI key (sk-... or sk-proj-...): " KEY; echo
read -r -p  "Project ID (proj_..., leave blank if personal key): " PROJ

KEY="$(printf "%s" "$KEY" | tr -d '\r' | sed 's/[[:space:]]//g')"
PROJ="$(printf "%s" "$PROJ" | tr -d '\r' | sed 's/[[:space:]]//g')"

case "$KEY" in
  sk-* ) ;;
  * ) echo "❌ That does not look like an OpenAI key (should start with sk-)"; exit 2;;
esac

if [[ "$KEY" == sk-proj-* ]]; then
  [[ "$PROJ" == proj_* ]] || { echo "❌ Project key requires a Project ID (starts with proj_)"; exit 3; }
  STATUS=$(curl -sS -o /tmp/oai.json -w "%{http_code}" https://api.openai.com/v1/models \
    -H "Authorization: Bearer $KEY" -H "OpenAI-Project: $PROJ")
else
  STATUS=$(curl -sS -o /tmp/oai.json -w "%{http_code}" https://api.openai.com/v1/models \
    -H "Authorization: Bearer $KEY")
fi

if [ "$STATUS" != "200" ]; then
  echo "❌ API rejected the key (HTTP $STATUS). First lines:"; head -n 3 /tmp/oai.json; exit 4
fi

# Apply to Henry AI (runtime, in-memory)
if [[ "$KEY" == sk-proj-* ]]; then
  curl -s http://127.0.0.1:3000/config -H 'content-type: application/json' \
    -d "{\"provider\":\"openai\",\"openaiKey\":\"$KEY\",\"openaiProject\":\"$PROJ\",\"chatModelOpenAI\":\"gpt-4o-mini\"}" | jq .
else
  curl -s http://127.0.0.1:3000/config -H 'content-type: application/json' \
    -d "{\"provider\":\"openai\",\"openaiKey\":\"$KEY\",\"chatModelOpenAI\":\"gpt-4o-mini\"}" | jq .
fi

curl -s http://127.0.0.1:3000/health | jq .
echo "✅ OpenAI configured. Try an /ask now."
