#!/usr/bin/env bash
set -euo pipefail
ROOT="$HOME"
DEST="$HOME/Desktop/HENRY_COMPANION/00_inbox"
LOG="$HOME/Desktop/HENRY_COMPANION/scan.log"
MANI="$HOME/Desktop/HENRY_COMPANION/manifest.jsonl"
: >"$LOG"; : >"$MANI"

# Directories likely relevant; add/remove as needed
CANDIDATES=(
  "$HOME/Projects"
  "$HOME/Documents"
  "$HOME/Desktop"
  "$HOME/Downloads"
  "$HOME/Library/CloudStorage/iCloudDrive"
)

copy_safely(){
  local src="$1"; local dest="$2";
  mkdir -p "$dest"
  if [ -d "$src" ]; then
    rsync -a --exclude "node_modules" --exclude ".git" --exclude "dist" --exclude "build" \
      --exclude "*.zip" --exclude "*.tar" --exclude "*.tar.gz" "$src" "$dest/" 2>>"$LOG"
  else
    rsync -a "$src" "$dest/" 2>>"$LOG"
  fi
}

write_manifest(){
  local p="$1"
  local size md5 mtime
  if [ -f "$p" ]; then
    size=$(stat -f%z "$p" 2>/dev/null || echo 0)
    md5=$(md5 -q "$p" 2>/dev/null || echo "")
    mtime=$(stat -f%Sm -t "%Y-%m-%d %H:%M:%S" "$p" 2>/dev/null || echo "")
    printf '{"path":"%s","size":%s,"md5":"%s","mtime":"%s"}\n' \
      "$p" "$size" "$md5" "$mtime" >>"$MANI"
  fi
}

# 1) Name-based search (fast)
for base in "${CANDIDATES[@]}"; do
  [ -d "$base" ] || continue
  while IFS= read -r path; do
    echo "NAME hit: $path" >>"$LOG"
    copy_safely "$path" "$DEST/name_hits"
  done < <(mdfind -onlyin "$base" 'kMDItemFSName == "*henry*"cdw' || true)

done

# 2) Content-based search (slower, code/doc types)
FILE_TYPES=("public.plain-text" "public.source-code" "com.apple.rtfd" "net.daringfireball.markdown" "org.openxmlformats.wordprocessingml.document")
for base in "${CANDIDATES[@]}"; do
  [ -d "$base" ] || continue
  for ut in "${FILE_TYPES[@]}"; do
    while IFS= read -r path; do
      echo "CONTENT hit: $path" >>"$LOG"
      copy_safely "$path" "$DEST/content_hits"
    done < <(mdfind -onlyin "$base" "kMDItemContentType == '$ut' && kMDItemTextContent == '*henry*'" || true)
  done

done

# 3) Classic find fallback
for base in "${CANDIDATES[@]}"; do
  [ -d "$base" ] || continue
  while IFS= read -r path; do
    echo "FIND hit: $path" >>"$LOG"
    copy_safely "$path" "$DEST/find_hits"
  done < <(find "$base" -type f -iname "*henry*" 2>/dev/null)
done

# 4) Build a manifest for every regular file collected
while IFS= read -r p; do
  write_manifest "$p"
done < <(find "$DEST" -type f)

echo "Scan complete. See $LOG and manifest at $MANI"
