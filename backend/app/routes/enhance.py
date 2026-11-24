"""
RAG Prompt Enhancement Route (POST /api/enhance)
------------------------------------------------
Accepts a raw prompt, retrieves the top-3 most semantically aligned style snippets
from the in-process vector space via cosine similarity, and queries Ollama (qwen2.5:3b)
to return a context-augmented, rewritten prompt.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from app.services.rag import RAGEnhancer

router = APIRouter()

class EnhanceRequest(BaseModel):
    prompt: str = Field(..., min_length=2, max_length=500, description="Raw prompt to enhance")
    top_k: Optional[int] = Field(3, ge=1, le=5, description="Number of style snippets to retrieve")

@router.post("/enhance")
def enhance_prompt(req: EnhanceRequest):
    try:
        enhancer = RAGEnhancer.get_instance()
        enhanced_prompt, snippets, latency = enhancer.enhance(req.prompt, top_k=req.top_k or 3)
        return {
            "original_prompt": req.prompt,
            "enhanced_prompt": enhanced_prompt,
            "retrieved_snippets": snippets,
            "latency_seconds": round(latency, 3),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prompt enhancement failed: {str(e)}")
