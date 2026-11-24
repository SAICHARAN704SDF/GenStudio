# GenStudio: Local Generative AI Studio (ComfyUI Interface)

[![PyTorch](https://img.shields.io/badge/PyTorch-MPS_float16-EE4C2C?logo=pytorch)](https://pytorch.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Ollama](https://img.shields.io/badge/Ollama-qwen2.5%3A3b-black?logo=ollama)](https://ollama.ai/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **GenStudio** is a 100% local, privacy-first Generative AI creative suite built with an authentic **ComfyUI v1** node-graph interface. It runs completely offline on Apple Silicon (M1/M2/M3/M4) Macs using PyTorch Metal Performance Shaders (MPS), requiring zero paid APIs or cloud dependencies.

---

## 🌟 What is GenStudio?

GenStudio turns complex Generative AI workflows into an interactive, visual playground. Instead of just clicking a "Generate" button on a basic form, you get:

1. **Visual Node Graph (ComfyUI DAG):** See exactly how your prompts, models, latent vectors, and decoders connect via color-coded spline wires.
2. **Live Step-by-Step Inspector:** A right-side panel that explains in plain English and clear math what each node is doing at every moment.
3. **Multimodal Perception & Speech:** The AI analyzes its own output using computer vision, scores how well it matched your prompt, and speaks the description aloud.
4. **Autonomous AI Critic:** An agentic feedback loop that spots mistakes or missing subjects, automatically rewrites the prompt, and re-synthesizes an improved image.

---

## 🧠 How It Works (In Simple Terms)

Generating an image with AI usually feels like a black box. In GenStudio, every stage is transparent and visual:

```
[ Your Idea ]
      │
      ▼
1. Smart Prompt Augmentation (RAG + Local LLM)
      │
      ▼
2. Latent Space Preparation (Noise, Sketch, or Slerp)
      │
      ▼
3. Ultra-Fast Denoising (SD-Turbo on Apple Silicon MPS)
      │
      ▼
4. Image Decoding (VAE: Latents → 512x512 Pixels)
      │
      ▼
5. Seeing & Scoring (BLIP Captioning + OpenCLIP Score + TTS)
      │
      ▼
6. AI Critic Loop (Autonomous Refinement)
```

### 1. Smart Prompt Augmentation (RAG + Local LLM)
* **What happens:** When you enter a short idea (e.g. *"a samurai in rain"*), GenStudio searches a built-in library of 30 curated lighting and art techniques using semantic embeddings.
* **Why it matters:** A local lightweight language model (`qwen2.5:3b` via Ollama) blends these professional styles into your prompt so you get cinematic lighting without having to guess magic keywords.

### 2. Compressed Latent Space
* **What happens:** Working with full pixel images (512×512×3) requires huge amounts of memory. Instead, GenStudio works inside a compressed "latent" space (64×64×4) that is **64 times smaller**.
* **Three ways to start:**
  * **Text-to-Image (T2I):** Starts with pure random Gaussian noise.
  * **Image-to-Image (Img2Img):** Takes your uploaded reference sketch or photo, preserves the composition, and adds controlled noise for the AI to redraw.
  * **Latent Slerp (Spherical Interpolation):** Smoothly walks along the curved surface of the latent sphere between two different seeds, letting you explore intermediate variations without image distortion.

### 3. Fast Denoising (SD-Turbo on Apple Silicon MPS)
* **What happens:** Standard Stable Diffusion models take 20 to 50 steps to clear away noise. GenStudio uses **SD-Turbo** (Adversarial Diffusion Distillation), which predicts the final image in just **1 to 2 steps**.
* **Hardware optimization:** It runs on Apple Silicon Metal Performance Shaders (`torch.float16`) with attention slicing, consuming under 2GB of VRAM and generating in seconds on an 8GB RAM MacBook Air.

### 4. Converting Back to Pixels (VAE Decoder)
* **What happens:** Once the noise is removed from the 64×64 latent tensor, the Variational Autoencoder (VAE) decoder blows it back up by $8\times$ into a crisp 512×512 RGB picture.

### 5. Multimodal Perception & Speech (BLIP + OpenCLIP)
* **What happens:** GenStudio doesn't stop once the image is saved:
  * **BLIP Vision:** A vision model looks at the generated image and describes what it sees in natural language.
  * **Browser TTS:** The browser reads the BLIP caption aloud through your speakers.
  * **OpenCLIP ViT-B-32:** Compares your original prompt vector with the image vector to give an objective match score (e.g. *0.38 - Exceptional Alignment*).

### 6. Autonomous AI Critic (RLVF Feedback Loop)
* **What happens:** Clicking **"🤖 AI Critic & Auto-Refine"** feeds the user prompt, BLIP's caption, and the CLIP score to the local Ollama LLM. The critic diagnoses any missing elements (e.g. *"You asked for a red moon, but none appeared"*), formulates a targeted prompt and negative prompt, and immediately re-runs the pipeline.

---

## 🎨 Supported Generation Modes

| Mode | Input | Best For |
| :--- | :--- | :--- |
| **Text-to-Image (T2I)** | Text Prompt | Creating original concepts from scratch with 1-2 steps. |
| **Image-to-Image (Img2Img)** | Sketch + Prompt | Guiding layout and composition with your own reference art. |
| **Latent Slerp (Manifold)** | Seed A + Seed B | Smoothly interpolating between two seeds with a frame slider. |

---

## 🛠️ System Requirements

* **Operating System:** macOS (Apple Silicon M1, M2, M3, M4 recommended)
* **Memory:** 8GB RAM minimum
* **Python:** 3.10, 3.11, or 3.12
* **Node.js:** v18+ and npm
* **Ollama:** Installed locally with model `qwen2.5:3b`

---

## 🚀 Quickstart Guide

### 1. Clone the Repository
```bash
git clone https://github.com/SAICHARAN704SDF/GenStudio.git
cd GenStudio
```

### 2. Start Ollama (Local LLM)
Make sure Ollama is running and has the lightweight `qwen2.5:3b` model downloaded:
```bash
ollama run qwen2.5:3b
```
*(You can exit the chat with `/bye`; Ollama will continue serving on port 11434).*

### 3. Setup & Run the Backend
```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --host 127.0.0.1 --port 8000
```
Backend will be live at `http://127.0.0.1:8000`.

### 4. Setup & Run the Frontend
In a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Open [`http://localhost:5173`](http://localhost:5173) in your browser.

---

## 📂 Project Architecture

```
GenStudio/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application & CORS setup
│   │   ├── config.py            # Device selection (MPS/CPU) & model paths
│   │   ├── routes/              # API endpoints (/generate, /slerp, /enhance, /critic)
│   │   └── services/            # SD-Turbo engine, BLIP, CLIP, RAG vector search
│   ├── data/
│   │   └── style_snippets.json  # 30 curated lighting/art style embeddings
│   └── requirements.txt         # PyTorch, Diffusers, Transformers, FastAPI
│
├── frontend/
│   ├── src/
│   │   ├── components/comfy/    # ComfyUI node-graph components
│   │   │   ├── nodes/           # Individual graph nodes (KSampler, VAE, CLIP, LoRA)
│   │   │   ├── ComfyFlow.jsx    # React Flow canvas assembly & bezier splines
│   │   │   ├── ComfyInspector.jsx # Live right-side process explanation panel
│   │   │   ├── ComfyTopBar.jsx  # Window bar & Run button
│   │   │   └── ComfySidebar.jsx # Tool rail
│   │   ├── services/api.js      # REST API client
│   │   ├── comfy.css            # Authentic ComfyUI dark theme styles
│   │   └── App.jsx              # Application state and pipeline progression
│   ├── package.json
│   └── vite.config.js
│
├── run_backend.sh               # One-click backend startup script
├── run_frontend.sh              # One-click frontend startup script
└── README.md
```

---

## 🔒 Privacy & Local Execution

* **Zero Cloud Calls:** All text synthesis, image generation, vision captioning, and CLIP evaluation execute on your own machine.
* **Apple Silicon Accelerated:** Utilizes PyTorch MPS (`float16`) to maximize M-series unified memory bandwidth.
* **Low Memory Footprint:** Models automatically clear cache after every inference pass to stay under 4GB total RAM during peak load.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
