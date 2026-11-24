"""
GenStudio FastAPI Backend Entrypoint
------------------------------------
Why this file exists:
Assembles the complete asynchronous backend service for GenStudio.
Configures CORS, lifespan events (preloading RAG vector indexes and model singletons),
and registers the REST endpoints:
- POST /api/generate : Diffusion synthesis + BLIP captioning + CLIP evaluation
- POST /api/enhance  : In-process RAG prompt enhancement via Ollama (qwen2.5:3b)
- GET  /api/history  : Session evaluation & monitoring telemetry
- GET  /api/health   : Hardware and connectivity diagnostics
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.health import router as health_router
from app.routes.enhance import router as enhance_router
from app.routes.generate import router as generate_router
from app.routes.history import router as history_router
from app.services.rag import RAGEnhancer
from app.services.generator import SDTurboGenerator
from app.services.captioner import ImageCaptioner
from app.services.evaluator import CLIPEvaluator


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application Lifespan:
    Pre-warms in-memory RAG vector index during server boot.
    Vision and diffusion models load on-demand via thread-safe singletons to minimize
    peak memory allocation on Apple Silicon M3 (8GB RAM).
    """
    print("\n" + "="*60)
    print("🚀 Booting GenStudio Backend (Apple Silicon M3 Optimized)")
    print("="*60)

    # 1. Initialize in-process RAG index (~80MB footprint)
    try:
        RAGEnhancer.get_instance()
    except Exception as e:
        print(f"[Startup Warning] Could not preload RAGEnhancer: {e}")

    print("="*60)
    print("✅ GenStudio Backend is fully initialized and ready.")
    print("="*60 + "\n")

    yield

    print("Shutting down GenStudio Backend...")


app = FastAPI(
    title="GenStudio API",
    description="Full-Stack Generative AI Studio Backend (SD-Turbo, Local RAG, BLIP, CLIP)",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure Cross-Origin Resource Sharing (CORS) for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes under the /api prefix
app.include_router(health_router, prefix="/api", tags=["Health"])
app.include_router(enhance_router, prefix="/api", tags=["RAG Prompt Enhancement"])
app.include_router(generate_router, prefix="/api", tags=["Image Generation & Evaluation"])
app.include_router(history_router, prefix="/api", tags=["Session History"])

if __name__ == "__main__":
    import uvicorn
    from app.config import HOST, PORT
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=False)
