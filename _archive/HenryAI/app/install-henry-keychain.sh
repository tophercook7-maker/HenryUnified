#!/usr/bin/env bash
set -euo pipefail
KEY="$(osascript -e 'display dialog "OpenAI API key (personal sk-… easiest). This will be stored in Keychain." default answer "" with hidden answer buttons {"OK"} default button "OK"' -e 'text returned of result' 2>/dev/null | tr -d '\r\n ')"
[ -n "$KEY" ] || { echo "No key entered."; exit 1; }
PROJ=""
if [[ "$KEY" == sk-proj-* ]]; then
  PROJ="$(osascript -e 'display dialog "OpenAI Project ID (proj_…):" default answer "" buttons {"OK"} default button "OK"' -e 'text returned of result' 2>/dev/null | tr -d '\r\n ')"
  [[ "$PROJ" == proj_* ]] || { echo "Project keys require proj_…"; exit 2; }
fi
security add-generic-password -a "$USER" -s HENRY_OPENAI_KEY -w "$KEY" -U >/dev/null
[ -n "$PROJ" ] && security add-generic-password -a "$USER" -s HENRY_OPENAI_PROJECT -w "$PROJ" -U >/dev/null || true
curl -s -X POST http://127.0.0.1:3000/keychain/apply | jq .
