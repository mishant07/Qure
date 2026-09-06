#!/usr/bin/env bash
# One-shot full-stack bringup: backend on :8000 + vite preview on :4173.
# Both servers run as detached processes; this script returns immediately.
# Tail the logs to monitor; use scripts/stop.sh to tear down.
#
# Usage:  ./scripts/dev.sh            # start everything
#         ./scripts/dev.sh --rebuild   # also rebuild frontend dist with VITE_API_URL
#         ./scripts/dev.sh --clean     # kill any pre-existing instances first
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

CLEAN=0
REBUILD=0
for arg in "$@"; do
  case "$arg" in
    --clean)   CLEAN=1 ;;
    --rebuild) REBUILD=1 ;;
    *) echo "unknown flag: $arg"; exit 1 ;;
  esac
done

log() { printf '\033[1;36m%s\033[0m %s\n' "[dev]" "$*"; }
warn() { printf '\033[1;33m%s\033[0m %s\n' "[dev]" "$*" >&2; }
fail() { printf '\033[1;31m%s\033[0m %s\n' "[dev]" "$*" >&2; exit 1; }

[[ -d "$ROOT/.venv" ]] || fail "missing .venv at $ROOT/.venv — run: python -m venv .venv && .venv/bin/pip install -r requirements.txt"

if [[ "$CLEAN" == "1" ]]; then
  log "killing any pre-existing dev processes on :8000 / :4173"
  pkill -f "uvicorn backend.main:app" 2>/dev/null || true
  pkill -f "vite preview"             2>/dev/null || true
  sleep 1
fi

mkdir -p "$ROOT/.devlogs"

# 1. backend on :8000
if ss -ltn 2>/dev/null | grep -q ':8000 '; then
  log "backend already listening on :8000 — skipping start"
else
  log "starting backend (uvicorn :8000) → $ROOT/.devlogs/backend.log"
  PYTHONPATH="$ROOT" nohup "$ROOT/.venv/bin/python" -m uvicorn backend.main:app \
    --port 8000 --host 127.0.0.1 \
    > "$ROOT/.devlogs/backend.log" 2>&1 &
  disown
  for i in 1 2 3 4 5 6 7 8 9 10; do
    sleep 1
    if curl -fsS -o /dev/null http://127.0.0.1:8000/health; then break; fi
  done
  curl -fsS http://127.0.0.1:8000/health >/dev/null || fail "backend did not come up — see $ROOT/.devlogs/backend.log"
  log "backend healthy at http://127.0.0.1:8000/health"
fi

# 2. frontend on :4173 (rebuild dist if requested so VITE_API_URL is baked in)
if [[ "$REBUILD" == "1" || ! -d "$ROOT/frontend/dist/assets" ]]; then
  log "rebuilding frontend dist (VITE_API_URL=http://localhost:8000)"
  cd "$ROOT/frontend"
  VITE_API_URL=http://localhost:8000 npm run build
  cd "$ROOT"
fi

if ss -ltn 2>/dev/null | grep -q ':4173 '; then
  log "frontend already listening on :4173 — skipping start"
else
  log "starting frontend (vite preview :4173) → $ROOT/.devlogs/frontend.log"
  cd "$ROOT/frontend"
  nohup npm run preview -- --port 4173 --host 127.0.0.1 --strictPort \
    > "$ROOT/.devlogs/frontend.log" 2>&1 &
  disown
  cd "$ROOT"
  for i in 1 2 3 4 5 6 7 8 9 10; do
    sleep 1
    if curl -fsS -o /dev/null http://127.0.0.1:4173/; then break; fi
  done
  curl -fsS http://127.0.0.1:4173/ >/dev/null || fail "frontend did not come up — see $ROOT/.devlogs/frontend.log"
  log "frontend serving at http://127.0.0.1:4173/"
fi

log "stack ready ✓"
log "  • backend  → http://127.0.0.1:8000  (Swagger: /docs, OpenAPI: /openapi.json)"
log "  • frontend → http://127.0.0.1:4173"
log "logs in $ROOT/.devlogs/ — tail with: tail -f $ROOT/.devlogs/{backend,frontend}.log"
log "stop with: ./scripts/stop.sh"