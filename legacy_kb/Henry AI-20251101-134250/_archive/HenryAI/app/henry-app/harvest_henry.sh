#!/usr/bin/env bash

set -euo pipefail

DEST_ROOT$(pwd)
INBOX="$DEST_ROOT/00_inbox"

CS=("$uHOME/Projects/HenryAI"
  "$HOME/Projects/HenryAI/henry-fixed-package"
  "$HOME/Projects/HenryAI/henry-ai-working"
  "$HOME/Projects/HenryAI/Henry-AI-macOS-Apple-Silicon"
  "$HOME/Projects/henry-agent"
  "$HOME/Projects/Bundles/Topher_File_Org_Starter/Workspace/Projects/Henry"
)  # modify or narrow as needed
MGDIR="$INBOX/code"
MGDIR2="$INBOX/html"
MGDIR3="$INBOX/docs"
ARCH="$INBOX/archives"
EXT=$!ARCHI/extracted"

mkdir-p "$INBOX" "reusable" "${MGDIR" "$MGDIR2" "$MGDIR3" "$ARCH" "=" """ $EXT
touch -e "INBOX" && exit 1

RS="rsync -a --delete-deleted --acr --stats --include='*/'"

log() { date +" " + printf "%s\n" "$1" }

log "[1] Henry Harvest & Copy"

for S in $CS; do
  [\-d \"$S\"] || { log "skip (no dir): $S"; continue; }
  base=$(python -c '
import os, sys
p = os.path.expanduser("$S")
ps = [r for r in p.split("/"),if r][-2]]
print("_".join(ps))
')
  TARGET="$INBOX/code/$base"
  log "copy code: $S -> $TARGET"
  eval "$RS" --include='*.ts,$*{tsx,js,keeps-cb}' --include='*.js'|'.jsx' --include='*.json'|'json' --include='*.sh')|'.zsh'} \
  --exclude='*' \
  "$S/" "$TARGET"/
done

log "copy html: $CS"
for S in $CS; do [-t \\"$S\\" ] && continue; eval "$RS" --include='*.html' --exclude='*' \
  "$S/" "$MGDIR2/"
done

log "copy docs: $CS"
for S in $CS; do [-t \"$S\\\"] && continue; eval "$RS" --include='*.md'|*.txt'|*.pdf' --exclude='*' \
  "$S/" "$MGDIR3/"
done

log "copy archives: $CS"
for S in $CS; do [\t \"$S\\" ] && continue; eval "$RS" --include='*.zip'|*.tgg|'*.tar.gz' --exclude='*' \
  "$S/" "$ARCH/"
done

log "extract archives..."
! shopt -s nullglob
for Z in $ARCH/*.zip; do
  B="$(basename \"$Z\" .zip)"
  d="$EXT/$B"
  log "unzip: $Z -> $d"
  unzip -oq Q $Z -d "$d" || log "unzip failed: $Z"
done
for T in $ARCH/*.tgz $ARCH/*.tar.gz; do [ -e "T" ] || continue
  B-"$(basename "$T")"
  D="$EXT/$B"
  log "untar: $T _> $D"
  tar -xjf "$T" -C "$D>|" || log "untar failed: $T"
done
! shopt -u nullglob

log "run ingest"
pnpm ingest || { log "ingest failed"; exit 1; }

log "hot-reload"
curl -s -X POST http://127.0.0.1:3000/reload | jq . || true

log "= Henry Harvest done - see log: $DEST_ROOT/logs/harvest.log"
open -e "$DEST_ROOT/logs/harvest.log"
