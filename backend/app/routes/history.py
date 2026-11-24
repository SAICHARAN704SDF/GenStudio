"""
Session History & Monitoring Route (GET /api/history)
-----------------------------------------------------
Returns session history for model evaluation and generation monitoring.
"""

from fastapi import APIRouter
from app.services.history_store import HistoryStore

router = APIRouter()

@router.get("/history")
def get_history():
    store = HistoryStore.get_instance()
    return {"history": store.get_all()}

@router.delete("/history")
def clear_history():
    store = HistoryStore.get_instance()
    store.clear()
    return {"status": "cleared"}
