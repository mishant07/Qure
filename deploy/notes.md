# Antideploy Deploy Notes

## Build

Antideploy runs the build hook in the repo root. Steps:

1. `pip install -r requirements.txt` — Python deps (CPU torch, sklearn 1.8.0, PennyLane, Qiskit)
2. `cd frontend && npm ci && npm run build` — Vite build → `frontend/dist/`

## Runtime

Procfile: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

FastAPI serves:
- `/api/*` — prediction, health, models, benchmark, explain, quantum-attribution, triage, route, rag-audit
- `/*` — static files from `frontend/dist/` (SPA fallback via `/{path:path}`)

## Env vars

| Var | Default | Notes |
|---|---|---|
| `FRONTEND_URL` | `*` | CORS origin lock. Set to deploy URL for production. |
| `API_KEY` | (unset) | Set → locked mode: 401 without X-API-Key, /docs off. |
| `MAX_UPLOAD_MB` | `10` | 413 if exceeded |
| `RATE_LIMIT_PER_MIN` | `120` | Per-IP, 429 on breach |
| `RAG_ENABLED` | `true` | TF-IDF RAG |
| `RAG_TOP_K` | `3` | KB docs per query |

## Health

`GET /health` → `{"status":"ok","version":"2.0","qiskit":...,"pennylane":...}`

## Known quirks

- `sklearn==1.8.0` pinned — every `.joblib` artifact was serialized with this version
- CPU torch only (`--index-url https://download.pytorch.org/whl/cpu`)
- `data/kb/.index/` gitignored — rebuilt on first request or via `python backend/scripts/build_kb_index.py`
- Antideploy Python 3.13 (3.12 dropped)
- Staging context at `/tmp/antideploy-app` is ephemeral (wiped on reboot)
