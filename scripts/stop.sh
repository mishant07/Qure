#!/usr/bin/env bash
# Stop background dev processes started by scripts/dev.sh (backend :8000 + frontend :4173).
set -euo pipefail
cd "$(dirname "$0")/.."

log() { printf '\033[1;36m%s\033[0m %s\n' "[stop]" "$*"; }

log "killing uvicorn :8000"
pkill -f "uvicorn backend.main:app" 2>/dev/null || true
log "killing vite preview :4173"
pkill -f "vite preview"             2>/dev/null || true
# also any stray python http.server that someone left on :4173
pkill -f "http.server 4173"         2>/dev/null || true
sleep 1

if ss -ltn 2>/dev/null | grep -qE ':(8000|4173) '; then
  echo "still listening:"
  ss -ltnp 2>/dev/null | grep -E ':(8000|4173) ' || true
  exit 1
fi
log "stack stopped ✓"