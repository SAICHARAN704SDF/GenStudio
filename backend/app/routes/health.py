"""
Health & Diagnostic Endpoint
-----------------------------
Returns server status, hardware acceleration info (MPS), memory details,
and Ollama LLM connectivity.
"""

from fastapi import APIRouter
import torch
import requests
from app.config import DEVICE, TORCH_DTYPE, OLLAMA_API_URL, OLLAMA_MODEL

router = APIRouter()

@router.get("/health")
def health_check():
    # Check Ollama connectivity
    ollama_ready = False
    try:
        res = requests.get("http://localhost:11434/api/tags", timeout=2)
        ollama_ready = (res.status_code == 200)
    except Exception:
        ollama_ready = False

    return {
        "status": "healthy",
        "device": DEVICE,
        "dtype": str(TORCH_DTYPE),
        "mps_available": torch.backends.mps.is_available(),
        "ollama": {
            "connected": ollama_ready,
            "target_model": OLLAMA_MODEL,
            "url": OLLAMA_API_URL,
        }
    }
