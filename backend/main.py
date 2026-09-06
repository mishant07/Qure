"""
FastAPI entry — backend/main.py (thin; routes live in backend/routes/prediction.py)
Run: .venv/bin/python -m uvicorn backend.main:app --port 8000
Dev: the vite dev server proxies /predict,/benchmark,/health,/models to :8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routes.prediction import router

app = FastAPI(title="SIH26139 Hybrid QML Platform", version="2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)



