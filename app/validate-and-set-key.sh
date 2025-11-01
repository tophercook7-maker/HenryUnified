#!/usr/bin/env bash
set -euo pipefail
SERVICE="HENRY_OPENAI_KEY"

# 1) Prompt (hidden), sanitize whitespace
read -r -s -p "Paste your REAL OpenAI API key (starts with sk-): " RAW
echo
KEY="$(printf "%s" "$RAW" | tr -d '\r' | sed 's/[[:space:]]//g')"

# 2) Quick shape check
case "$KEY" in
  sk-*) ;;
  *) echo "❌ That does not look like an OpenAI key (should start with sk-)"; exit 2;;
esac

# 3) Validate directly with the API BEFORE saving
STATUS=$(curl -sS -o /tmp/oai_models.json -w "%{http_code}" \
  https://api.openai.com/v1/models \
  -H "Authorization: Bearer $KEY")

if [ "$STATUS" != "200" ]; then
  echo "❌ API rejected the key (HTTP $STATUS)."
  echo "    Response head:"
  head -n 3 /tmp/oai_models.json
  exit 3
fi

# 4) Save to Keychain (replace old if present)
security delete-generic-password -a "$USER" -s "$SERVICE" 2>/dev/null || true
security add-generic-password -a "$USER" -s "$SERVICE" -w "$KEY" -U >/dev/null

# 5) Ensure .env doesn't override it; keep blank so code falls back to Keychain
touch .env
if grep -q '^OPENAI_API_KEY=' .env; then
  sed -i.bak 's|^OPENAI_API_KEY=.*|OPENAI_API_KEY=|' .env
else
  echo 'OPENAI_API_KEY=' >> .env
fi

# 6) Prove we can read the saved key (masked)
READBK=$(security find-generic-password -a "$USER" -s "$SERVICE" -w | sed 's/\(.......\).*/\1…/')
echo "✅ Key saved to Keychain: $READBK"
