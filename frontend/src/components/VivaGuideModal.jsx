import React from 'react';
import { X, BookOpen, CheckCircle, Cpu, Layers, Sparkles, Sliders, Award, Eye } from 'lucide-react';

const SYLLABUS_SECTIONS = [
  {
    title: '1. Diffusion Models & Distillation',
    icon: Sparkles,
    color: '#6366f1',
    concept: 'Latent Diffusion Models (LDMs) & Adversarial Diffusion Distillation (ADD)',
    vivaSummary: 'Traditional DDPMs simulate reverse Brownian motion over 20-50 denoising steps using classifier-free guidance. SD-Turbo distills this entire trajectory into 1 to 4 steps via ADD by combining adversarial objectives with score distillation loss, enabling sub-2-second generation on Apple Silicon M3.',
    codeMapping: 'backend/app/services/generator.py (AutoPipelineForText2Image, guidance_scale=0.0)',
  },
  {
    title: '2. Transformers & Autoregressive LLMs',
    icon: Layers,
    color: '#06b6d4',
    concept: 'Decoder-Only Causal Language Models & Prompt Conditioning',
    vivaSummary: 'Local Ollama (qwen2.5:3b) acts as an autoregressive generative agent that translates brief user ideas into detailed, conditioned descriptive prompts for the diffusion model, using causal self-attention across retrieved context.',
    codeMapping: 'backend/app/services/rag.py (Ollama API /api/generate with temperature=0.7)',
  },
  {
    title: '3. Retrieval-Augmented Generation (RAG)',
    icon: Layers,
    color: '#10b981',
    concept: 'Dense Vector Embeddings & In-Process Cosine Similarity Search',
    vivaSummary: 'Instead of external database bloat, the 30-item style corpus is mapped into a 384-dimensional vector space using sentence-transformers (all-MiniLM-L6-v2). Cosine similarity dot product computes semantic distance in sub-millisecond O(N*D) time.',
    codeMapping: 'backend/app/services/rag.py (MiniLM-L6-v2 + NumPy dot product L2 normalized)',
  },
  {
    title: '4. Parameter-Efficient Fine-Tuning (PEFT / LoRA)',
    icon: Sliders,
    color: '#f59e0b',
    concept: 'Low-Rank Adaptation of Large Models (W = W_0 + B * A)',
    vivaSummary: 'Rather than updating all model parameters, LoRA freezes base weights W_0 and injects rank decomposition matrices B (d x r) and A (r x k) with rank r << d into cross-attention layers. Changing the multiplier scale (0.0 to 1.0) dynamically blends or removes the fine-tuned domain knowledge.',
    codeMapping: 'backend/app/services/generator.py (pipe.load_lora_weights, set_adapters)',
  },
  {
    title: '5. Objective Generative Evaluation (CLIP Score)',
    icon: Award,
    color: '#3b82f6',
    concept: 'Multimodal Contrastive Alignment Metric',
    vivaSummary: 'Visual quality cannot be judged solely by subjective perception. OpenCLIP ViT-B-32 maps both the conditioning text and the synthesized image into a shared geometric space; the cosine similarity between their normalized feature vectors provides an objective semantic fidelity metric.',
    codeMapping: 'backend/app/services/evaluator.py (OpenCLIP ViT-B-32, cosine similarity in [-1, 1])',
  },
  {
    title: '6. Multimodal Perception (Vision-to-Language)',
    icon: Eye,
    color: '#ec4899',
    concept: 'BLIP Encoder-Decoder Image Captioning',
    vivaSummary: 'Completes the multimodal loop: diffusion maps Text -> Image, and BLIP performs Image -> Text using vision transformer patch tokens cross-attending to language tokens, identifying whether the synthesized image captured the intended subject.',
    codeMapping: 'backend/app/services/captioner.py (Salesforce/blip-image-captioning-base on CPU)',
  },
  {
    title: '7. Edge Deployment & System Constraints',
    icon: Cpu,
    color: '#8b5cf6',
    concept: 'Apple Silicon Unified Memory (UMA) & Client-Side Offloading',
    vivaSummary: 'Engineered for a strict 8GB RAM MacBook Air M3: PyTorch MPS float16 backend halves VRAM footprint, memory caches are cleared post-inference, vision evaluation runs on CPU, and Text-to-Speech is offloaded entirely to the client browser via Web Speech API.',
    codeMapping: 'backend/app/config.py (MPS device detection) + ImageDisplay.jsx (speechSynthesis)',
  },
];

export default function VivaGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={24} color="#f59e0b" />
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Viva Defense & Syllabus Mapping Guide</h2>
          </div>
          <button className="speech-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px' }}>
          Use this interactive cheat sheet to defend the GenStudio architectural decisions during your live oral examination (viva).
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {SYLLABUS_SECTIONS.map((sec, i) => {
            const Icon = sec.icon;
            return (
              <div
                key={i}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Icon size={18} color={sec.color} />
                  <span style={{ fontWeight: 700, fontSize: '15px', color: '#ffffff' }}>
                    {sec.title}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: sec.color, fontWeight: 600, marginBottom: '6px' }}>
                  Concept: {sec.concept}
                </div>

                <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '8px' }}>
                  <strong>Viva Defense Point:</strong> {sec.vivaSummary}
                </p>

                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                  File: {sec.codeMapping}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
