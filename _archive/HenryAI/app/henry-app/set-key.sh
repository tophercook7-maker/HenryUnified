#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(pwd)"
ENV_FILE="$APP_DIR/.env"
SERVICE="HENRY_OPENAI_KEY"

# 1) Get key (arg or secure prompt)
KEY="${1-}"
if [ -z "${KEY}" ]; then
  read -r -s -p "Paste your OpenAI key (will be hidden): " KEY
  echo
fi

# Basic sanity
case "$KEY" in
  sk-*) : ;;
  *) echo "Error: That doesn't look like an OpenAI key (should start with sk-)." >&2; exit 2 ;;
esac

# 2) Store in Keychain (creates or updates)
security add-generic-password -a "$USER" -s "$SERVICE" -w "$KEY" -U >/dev/null

# 3) Ensure .env exists
touch "$ENV_FILE"

# 4) Make .env load key from Keychain dynamically (no plain-text key on disk)
if grep -q '^OPENAI_API_KEY=' "$ENV_FILE"; then
  # Replace existing line
  perl -pi -e 's|^OPENAI_API_KEY=.*|OPENAI_API_KEY=$(security find-generic-password -a "$ENV{USER}" -s HENRY_OPENAI_KEY -w)|' "$ENV_FILE"
else
  # Append line
  echo 'OPENAI_API_KEY=$(security find-generic-password -a "$USER" -s HENRY_OPENAI_KEY -w)' >> "$ENV_FILE"
fi

# Keep your knowledge dir if present; otherwise leave it alone
if ! grep -q '^KNOWLEDGE_DIR=' "$ENV_FILE"; then
  # no-op; you can add KNOWLEDGE_DIR later if needed
  :
fi

# 5) Quick verification
LOAD_TEST="$(node -e 'require("dotenv").config(); const {execSync}=require("child_process"); let k=process.env.OPENAI_API_KEY||""; if(k.startsWith("$(security find-generic-password -a \"$USER\" -s \"$SERVICE\" -w 2>/dev/null | sed -E s/.{7}.+//)")){console.log("KEY_OK");} else {console.log(k? "KEY_VISIBLE" : "NO_KEY");}' 2>/dev/null || true)"

echo ">>> .env now references Keychain. Verification: ${LOAD_TEST}"
echo "Done. To re-run later: ./set-key.sh sk-********"
