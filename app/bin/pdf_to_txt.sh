#!/usr/bin/env bash
set -euo pipefail
KNOW="${KNOWLEDGE_DIR:-$HOME/Desktop/HENRY_COMPANION/10_knowledge}"
OUT="$KNOW/.converted_pdfs_txt"
mkdir -p "$OUT"
command -v pdftotext >/dev/null || { echo "pdftotext not found (brew install poppler)"; exit 1; }
find "$KNOW" -type f -iname "*.pdf" | while IFS= read -r pdf; do
  rel="${pdf#"$KNOW/"}"
  base="${rel%.*}".txt
  outdir="$OUT/$(dirname "$rel")"
  mkdir -p "$outdir"
  outf="$outdir/$(basename "$base")"
  pdftotext -layout -nopgbrk "$pdf" "$outf" || pdftotext "$pdf" "$outf"
  touch -r "$pdf" "$outf" || true
  echo "pdf→txt: $rel → ${outf#"$OUT/"}"
done
