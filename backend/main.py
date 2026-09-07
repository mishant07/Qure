"""
FastAPI entry — backend/main.py (thin; routes live in backend/routes/prediction.py)
Run: .venv/bin/python -m uvicorn backend.main:app --port 8000
Dev: the vite dev server proxies /predict,/benchmark,/health,/models to :8000

Security posture (backend/security.py): CORS locked to FRONTEND_URL origins;
API_KEY set -> locked mode (X-API-Key required, /docs off). Unset -> open demo.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from backend.routes.prediction import router
from backend.security import FRONTEND_URLS, GuardMiddleware, locked

app = FastAPI(
    title="SIH26139 Hybrid QML Platform",
    version="2.0",
    docs_url=None if locked() else "/docs",
    redoc_url=None if locked() else "/redoc",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_URLS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GuardMiddleware)
app.include_router(router)

# Single-app serving: when frontend/dist exists (built UI), serve it + fall
# back to index.html for SPA routes. API router above wins on its paths.
# Absent locally on fresh clones -> API-only, nothing breaks.
import pathlib as _pl

_ROOT = _pl.Path(__file__).resolve().parents[1]
# Candidate UI dirs: local `vite build` emits frontend/dist, but some deploy
# platforms skip any directory named "dist" during packaging (it reads as
# disposable build output) — the deploy context then carries frontend/ui.
_DIST = next(
    (_ROOT / cand for cand in ("frontend/dist", "frontend/ui")
     if (_ROOT / cand / "index.html").is_file()),
    None,
)


if _DIST is not None:

    @app.get("/{path:path}")
    async def spa(path: str = "") -> FileResponse:
        # API-ish paths are never SPA pages: JSON 404, not index.html.
        if path.split("/")[0] in ("api", "docs", "redoc", "openapi.json"):
            raise HTTPException(404, "not found")
        target = (_DIST / path) if path else None
        if target is not None:
            try:
                target.relative_to(_DIST)
            except ValueError:
                target = None
        if target is None or not target.is_file():
            target = _DIST / "index.html"
        return FileResponse(target)
