"""
GenStudio Configuration Module
-------------------------------
Centralizes hardware acceleration settings (PyTorch MPS / CUDA / CPU),
model checkpoints, resource thresholds, and external service URLs (Ollama).
"""

import os
from pathlib import Path
import torch

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
STYLE_SNIPPETS_FILE = DATA_DIR / "style_snippets.json"

# Hardware Acceleration:
# Detects Apple Silicon Metal Performance Shaders (MPS), CUDA, or CPU fallback.
if torch.backends.mps.is_available():
    DEVICE = "mps"
    TORCH_DTYPE = torch.float16
elif torch.cuda.is_available():
    DEVICE = "cuda"
    TORCH_DTYPE = torch.float16
else:
    DEVICE = "cpu"
    TORCH_DTYPE = torch.float32

# Diffusion Model:
# "stabilityai/sd-turbo" uses Adversarial Diffusion Distillation (ADD).
# SD-Turbo produces high-fidelity 512x512 images in only 1 to 4 steps.
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
