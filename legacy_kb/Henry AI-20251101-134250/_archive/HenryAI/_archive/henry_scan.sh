#!/usr/bin/env bash
set -euo pipefail
ROOTS=("$HOME" "/Volumes" "/Users" "/Applications")
OUT="$HOME/Desktop/HENRY_REASSEMBLE"
INBOX="$OUT/00_inbox"
MANI="$OUT/manifest.jsonl"
LOG="$OUT/scan.log"
mkdir -p "$INBOX"
: > "$MANI"

ts() { date +"%Y-%m-%d %H:%M:%S"; }

log() { echo "[$(ts)] $*" | tee -a "$LOG" >&2; }

has() { command -v "$1" >/dev/null 2>&1; }

# --- find & filter ---
log "Scanning for paths and files mentioning henry…"
if has fd; then
  FD="fd --hidden --follow --strip-cwd-prefix --color=never"
  $FD -t f -g '*henry*' "${ROOTS[@]}" 2>/dev/null | sed 's/^/FILE /' > "$INBOX/paths.txt" || true
  $FD -t d -g '*henry*' "${ROOTS[@]}" 2>/dev/null | sed 's/^/DIR  /' >> "$INBOX/paths.txt" || true
else
  { find "${ROOTS[@]}" -type f -iname '*henry*' -print 2>/dev/null | sed 's/^/FILE /';
    find "${ROOTS[@]}" -type d -iname '*henry*' -print 2>/dev/null | sed 's/^/DIR  /'; } > "$INBOX/paths.txt" || true
fi

log "Content search (source files that mention henry)…"
if has rg; then
  rg -n --hidden --follow -S -g '!node_modules' -g '!*.log' -e 'henry[-_ ]?(ai|companion)?' "${ROOTS[@]}" 2>/dev/null \
    | tee "$INBOX/content_hits.txt" >/dev/null || true
else
  grep -RIn --exclude-dir=node_modules --binary-files=without-match -E 'henry[-_ ]?(ai|companion)?' "${ROOTS[@]}" \
    > "$INBOX/content_hits.txt" 2>/dev/null || true
fi

# --- write manifest JSONL ---
log "Writing manifest…"
while IFS= read -r line; do
  kind="${line:0:4}"
  path="${line:5}"
  [ -e "$path" ] || continue
  name="$(basename "$path")"
  size=$( [ -f "$path" ] && stat -f%z "$path" 2>/dev/null || echo 0 )
  mtime=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$path" 2>/dev/null || echo "")
  pkg=$([ -f "$path/package.json" ] && echo true || echo false)
  server=$([ -f "$path/src/server.ts" ] && echo true || echo false)
  ingest=$([ -f "$path/scripts/ingest.ts" ] && echo true || echo false)
  score=0
  [[ "$pkg" == true ]] && score=$((score+3))
  [[ "$server" == true ]] && score=$((score+3))
  [[ "$ingest" == true ]] && score=$((score+3))
  [[ "$path" =~ henry-ai|henry_companion|henry-companion ]] && score=$((score+1))
  printf '{"kind":"%s","path":"%s","name":"%s","size":%s,"mtime":"%s","pkg":%s,"server":%s,"ingest":%s,"score":%s}\n' \
    "$kind" "$path" "$name" "$size" "$mtime" "$pkg" "$server" "$ingest" "$score" >> "$MANI"
done < "$INBOX/paths.txt"

log "Manifest: $MANI"
log "Scan complete."
