"""
FastAPI entry — backend/main.py (thin; routes live in backend/routes/prediction.py)
Run: .venv/bin/python -m uvicorn backend.main:app --port 8000
Dev: the vite dev server proxies /predict,/benchmark,/health,/models to :8000

Security posture (backend/security.py): CORS locked to FRONTEND_URL origins;
API_KEY set -> locked mode (X-API-Key required, /docs off). Unset -> open demo.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
