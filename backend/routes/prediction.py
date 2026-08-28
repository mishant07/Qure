"""Deprecated — logic moved to backend/main.py for brevity. Keep file for modular future."""
from fastapi import APIRouter
router = APIRouter()

@router.get("/ping")
def ping():
    return {"ok": True}
