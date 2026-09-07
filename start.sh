#!/usr/bin/env bash
set -euo pipefail

# Find python binary on Antideploy image
PY=""
for candidate in python3.13 python3.12 python3.11 python3.10 python3 python; do
  if command -v "$candidate" &>/dev/null; then
    PY="$candidate"
    break
  fi
done
for path in /usr/local/bin/python3 /usr/bin/python3 /usr/local/bin/python /usr/bin/python; do
  if [ -z "$PY" ] && [ -x "$path" ]; then
    PY="$path"
    break
  fi
done
if [ -z "$PY" ]; then
  echo "ERROR: no python found" >&2
  find / -name "python*" -type f 2>/dev/null | head -5
  exit 1
fi
echo "Using python: $PY ($($PY --version 2>&1))"

exec "$PY" -m uvicorn backend.main:app --host 0.0.0.0 --port "${PORT:-8000}"
