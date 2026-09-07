#!/usr/bin/env bash
set -euo pipefail

# Cloud Native Buildpacks put python in /layers/google.python.pip/
BUILD_PYTHON="/layers/google.python.pip/bin/python3"
if [ -x "$BUILD_PYTHON" ]; then
  exec "$BUILD_PYTHON" -m uvicorn backend.main:app --host 0.0.0.0 --port "${PORT:-8000}"
fi

# Fallback: find python3 anywhere
for candidate in python3.13 python3 python; do
  if command -v "$candidate" &>/dev/null; then
    exec "$candidate" -m uvicorn backend.main:app --host 0.0.0.0 --port "${PORT:-8000}"
  fi
done

# Last resort: absolute paths
for p in /usr/local/bin/python3 /usr/bin/python3; do
  if [ -x "$p" ]; then
    exec "$p" -m uvicorn backend.main:app --host 0.0.0.0 --port "${PORT:-8000}"
  fi
done

echo "FATAL: no python3 found" >&2
exit 1
