"""
GenStudio Configuration Module
-------------------------------
Why this file exists:
Centralizes hardware acceleration settings (PyTorch MPS for Apple Silicon M3),
model checkpoints, resource thresholds, and external service URLs (Ollama).
Centralizing configuration ensures that when defending the viva, we can explain
hardware-specific choices (e.g. float16 on MPS vs float32 on CPU) in one place.
"""

import os
from pathlib import Path
import torch

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
STYLE_SNIPPETS_FILE = DATA_DIR / "style_snippets.json"

# Hardware Acceleration:
# Apple Silicon M3 uses the Metal Performance Shaders (MPS) backend in PyTorch.
# MPS leverages the unified memory architecture (UMA) of the M3 chip.
# If MPS is unavailable (e.g., standard x86 container), fall back to CPU.
if torch.backends.mps.is_available():
    DEVICE = "mps"
    # float16 halves memory consumption from ~5GB to ~2.5GB, essential for 8GB RAM
    TORCH_DTYPE = torch.float16
else:
    DEVICE = "cpu"
    TORCH_DTYPE = torch.float32

# Diffusion Model:
# "stabilityai/sd-turbo" uses Adversarial Diffusion Distillation (ADD).
# Traditional diffusion requires 20-50 denoising steps; SD-Turbo produces high-fidelity
# 512x512 images in only 1 to 4 steps, running comfortably under 2-3 seconds on M3 MPS.
SD_MODEL_ID = "stabilityai/sd-turbo"

# Embedding Model for RAG:
# all-MiniLM-L6-v2 maps sentences to a 384-dimensional dense vector space.
# It is extremely fast (~80MB footprint) and ideal for in-process cosine similarity search.
EMBEDDING_MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2"

# Vision-Language Models:
# BLIP (Bootstrapping Language-Image Pre-training) base model for captioning (~900MB).
BLIP_MODEL_ID = "Salesforce/blip-image-captioning-base"

# OpenCLIP architecture and pretrained weights for objective prompt-image alignment scoring.
CLIP_MODEL_NAME = "ViT-B-32"
CLIP_PRETRAINED = "openai"

# Local LLM Server (Ollama):
# Connects to the local Ollama daemon for instruction-following prompt rewriting.
OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")

# Server settings
HOST = "127.0.0.1"
PORT = 8000
