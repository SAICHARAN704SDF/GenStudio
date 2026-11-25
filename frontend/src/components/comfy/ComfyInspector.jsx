import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  Zap,
  Eye,
  Award,
  Cpu,
  BrainCircuit,
  Info,
  CheckCircle2,
  Clock,
  Database,
  ArrowRight,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

const PIPELINE_STEPS = [
  {
    id: 'rag',
    title: '1. RAG Vector Retrieval & Prompt Augmentation',
    nodeName: 'RAGRetrieverNode',
    icon: Database,
    accent: '#06b6d4',
    badge: 'MiniLM-L6-v2 + Ollama',
    summary: 'Dense vector search across 30 curated artistic/lighting techniques + local LLM prompt expansion.',
    howItWorks: [
      'Encodes raw user prompt into a 384-dimensional dense semantic embedding vector q ∈ ℝ³⁸⁴ using sentence-transformers/all-MiniLM-L6-v2.',
      'Computes cosine similarity against 30 pre-embedded style/lighting text snippets via vectorized NumPy dot product: s = V · q in <2ms.',
      'Retrieves the top-3 highest-scoring visual techniques (volumetric lighting, chiaroscuro, photorealism).',
      'Passes retrieved style snippets to local Ollama LLM (qwen2.5:3b) to synthesize an augmented, high-fidelity prompt with "keep_alive: 30s" to release RAM immediately.'
    ],
    math: 's_i = \\cos(\\mathbf{v}_i, \\mathbf{q}) = \\frac{\\mathbf{v}_i \\cdot \\mathbf{q}}{\\|\\mathbf{v}_i\\| \\|\\mathbf{q}\\|}',
    keyAdvantages: [
      'Eliminates LLM hallucination and domain knowledge gaps.',
      '100% in-process vector search: zero external database overhead (no Pinecone/ChromaDB), perfect for edge memory limits.',
      'Offloads RAM between calls via keep_alive to preserve >5GB for diffusion.'
    ]
  },
  {
    id: 'latent',
    title: '2. Latent Space Initialization (Noise, Img2Img, or Slerp)',
    nodeName: 'LatentInputNode',
    icon: Layers,
    accent: '#ec4899',
    badge: 'Latent Manifold [1, 4, 64, 64]',
    summary: 'Prepares the initial latent tensor on the Gaussian manifold based on the selected generation mode.',
    howItWorks: [
      'Text-to-Image (T2I): Samples random white noise tensor z_T ~ 𝒩(0, I) with shape [1, 4, 64, 64] on Apple Silicon MPS.',
      'Image-to-Image (Img2Img): Encodes reference sketch x_0 into latent z_0 = VAE_enc(x_0) and adds forward Markov noise up to timestep t = ⌊η · T⌋, where η is denoising strength.',
      'Latent Slerp: Samples noise vectors z_0 and z_1 from independent seeds and interpolates along the spherical arc on the Gaussian hypersphere manifold preserving constant radius ‖z‖ = √d.'
    ],
    math: 'T2I: z_T \\sim \\mathcal{N}(0, I) \\quad | \\quad \\text{Slerp}: \\frac{\\sin((1-\\lambda)\\theta)}{\\sin\\theta}z_0 + \\frac{\\sin(\\lambda\\theta)}{\\sin\\theta}z_1',
    keyAdvantages: [
      'Diffusion in latent space is 64x more computationally efficient than pixel space (512x512x3 vs 64x64x4).',
      'Slerp prevents norm collapse toward the origin seen in linear interpolation (LERP), preserving image variance and contrast.',
      'Img2Img preserves geometric composition while re-imagining details according to prompt guidance.'
    ]
  },
  {
    id: 'ksampler',
    title: '3. UNet Denoising & KSampler (SD-Turbo on MPS)',
    nodeName: 'KSamplerNode',
    icon: Zap,
    accent: '#3b82f6',
    badge: 'Adversarial Distillation (ADD)',
    summary: 'Single-step to 4-step latent denoising using distilled student UNet on Apple Silicon Metal Performance Shaders.',
    howItWorks: [
      'Executes stabilityai/sd-turbo UNet on device="mps" with torch.float16 precision.',
      'Applies Classifier-Free Guidance (CFG) with negative prompt latent vector subtraction: ε_pred = ε_θ(z_t, ∅) + s · (ε_θ(z_t, c_pos) - ε_θ(z_t, c_neg)).',
      'If LoRA is active, adapts cross-attention query/key/value projections via W = W_0 + α·(B·A) with zero base parameter retraining.',
      'Euler-ancestral solver takes deterministic large step jumps along the probability flow ODE in 1-4 steps.'
    ],
    math: 'W = W_0 + \\alpha (B \\cdot A) \\quad | \\quad \\epsilon_{\\text{pred}} = \\epsilon_\\theta(z_t, \\varnothing) + s(\\epsilon_\\theta(z_t, c_+) - \\epsilon_\\theta(z_t, c_-))',
    keyAdvantages: [
      'SD-Turbo ADD distillation generates photorealistic outputs in 1-2 steps vs 20-50 steps for SD 1.5/2.1.',
      'Apple Silicon MPS float16 halves memory footprint from 3.4GB down to 1.7GB.',
      'Attention slicing computes cross-attention in sequential tiles, preventing out-of-memory errors.'
    ]
  },
  {
    id: 'vae_decode',
    title: '4. VAE Latent Decoding (64x64 → 512x512)',
    nodeName: 'VaeDecodeNode',
    icon: Eye,
    accent: '#ef4444',
    badge: 'Spatial Decompression (8x)',
    summary: 'Transforms denoised latent representations back into 3-channel RGB pixel space via transposed convolutions.',
    howItWorks: [
      'Receives cleaned latent tensor z_0 ∈ ℝ¹ ˣ ⁴ ˣ ⁶⁴ ˣ ⁶⁴ from KSampler.',
      'Multiplies by VAE scaling factor (1 / 0.18215) to restore standard distribution variance.',
      'Passes through the AutoencoderKL decoder consisting of ResNet blocks and transposed 2D convolutions to achieve 8x spatial expansion.',
      'Clamps pixel values into [-1, 1], scales to [0, 255] RGB, and outputs a 512x512 JPEG image buffer.'
    ],
    math: 'x_{\\text{rgb}} = \\text{clamp}\\left(\\frac{\\mathcal{D}(z_0 / 0.18215) + 1}{2} \\times 255\\right) \\in [0, 255]^{512 \\times 512 \\times 3}',
    keyAdvantages: [
      'VAE decoding is deterministic and decoupled from the diffusion backbone.',
      'VAE slicing decodes latent frames individually, avoiding GPU activation spikes on Mac unified memory.'
    ]
  },
  {
    id: 'save_image',
    title: '5. Multimodal Perception & Objective Alignment',
    nodeName: 'SaveImageNode',
    icon: Award,
    accent: '#22c55e',
    badge: 'BLIP + OpenCLIP ViT-B-32',
    summary: 'Natural language image captioning, browser speech synthesis, and objective visual-semantic alignment scoring.',
    howItWorks: [
      'BLIP Captioner: Encodes generated image with Vision Transformer (ViT) into visual tokens; text decoder generates grounded natural language caption via cross-attention.',
      'Web Speech API: Triggers browser window.speechSynthesis.speak() to audibly announce the BLIP caption with zero Python audio dependencies.',
      'OpenCLIP ViT-B-32: Computes cosine similarity between OpenAI text embedding and vision embedding in a shared 512-dimensional multimodal space.',
      'Categorizes score into Poor, Moderate, Good Match, or Exceptional Alignment badges.'
    ],
    math: '\\text{CLIP Score} = \\cos(\\mathbf{e}_{\\text{text}}, \\mathbf{e}_{\\text{image}}) = \\frac{\\mathbf{e}_t \\cdot \\mathbf{e}_i}{\\|\\mathbf{e}_t\\| \\|\\mathbf{e}_i\\|}',
    keyAdvantages: [
      'Provides objective, reproducible evaluation metric for academic defense.',
      'Proves bidirectional multimodal perception: Text → Image (Diffusion) and Image → Text (BLIP).',
      'Client-side TTS saves 2GB of server memory compared to local Python audio models.'
    ]
  },
  {
    id: 'critic',
    title: '6. Autonomous Visual Critic (RLVF Feedback Loop)',
    nodeName: 'SaveImageNode',
    icon: BrainCircuit,
    accent: '#a855f7',
    badge: 'Reinforcement Learning from Visual Feedback',
    summary: 'Agentic closed loop diagnosing disparities between prompt and visual perception, auto-refining generation.',
    howItWorks: [
      'Inputs the user prompt, BLIP generated caption, and CLIP alignment score into Ollama LLM.',
      'The Critic diagnoses omissions and hallucinations (e.g., "The prompt asked for a cybernetic samurai, but BLIP perceives only a woman in red").',
      'Synthesizes an improved positive prompt emphasizing missing subjects and formulates a targeted negative prompt.',
      'Automatically triggers re-generation on the diffusion pipeline, completing the autonomous visual feedback loop.'
    ],
    math: '\\text{Agent Loop}: \\text{Prompt} \\to \\text{Image} \\to \\text{BLIP} \\to \\text{Critic} \\to \\text{Refined Prompt} \\to \\text{Auto-Run}',
    keyAdvantages: [
      'Demonstrates autonomous agentic reasoning beyond simple one-shot generation.',
      'Implements closed-loop Reinforcement Learning from Visual Feedback (RLVF).',
      'Solves prompt sensitivity without requiring human trial-and-error.'
    ]
  }
];

export default function ComfyInspector({
  activeStep,
  selectedNode,
  isGenerating,
  result,
  telemetry
}) {
  const [expandedStep, setExpandedStep] = useState(null);

  // Determine which step to highlight
  const currentStepId = activeStep || selectedNode || (isGenerating ? 'ksampler' : 'save_image');

  return (
    <aside className="comfy-inspector">
      <div className="comfy-inspector-header">
        <div className="comfy-inspector-title">
          <Info size={15} color="#3b82f6" />
          <span>Process & Execution Inspector</span>
        </div>
        <span style={{ fontSize: '10px', color: 'var(--comfy-text-dim)', fontFamily: 'monospace' }}>
          LIVE EXPLAINER
        </span>
      </div>

      {/* Telemetry Summary Bar */}
      <div style={{
        padding: '10px 16px',
        background: '#121316',
        borderBottom: '1px solid var(--comfy-border)',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '11px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#a5b4fc' }}>
          <Cpu size={12} />
          <span>Backend: MPS float16</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#34d399' }}>
          <Clock size={12} />
          <span>Latency: {result?.generation_time ? `${result.generation_time}s` : '0.00s'}</span>
        </div>
      </div>

      <div className="comfy-inspector-content">
        <div style={{ fontSize: '11px', color: 'var(--comfy-text-dim)', lineHeight: 1.4 }}>
          Each node in the ComfyUI Directed Acyclic Graph (DAG) corresponds to a theoretical Generative AI method. Click any step below or any node on the canvas to inspect its live process and mathematical formulation.
        </div>

        {/* Step Cards List */}
        {PIPELINE_STEPS.map((step) => {
          const isCurrent = currentStepId === step.id;
          const isExpanded = expandedStep === step.id || isCurrent;
          const StepIcon = step.icon;

          return (
            <div
              key={step.id}
              className={`comfy-step-card ${isCurrent ? 'active-step' : ''}`}
              onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: `${step.accent}25`,
                    border: `1px solid ${step.accent}60`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <StepIcon size={13} color={step.accent} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: '10px', color: step.accent, fontFamily: 'monospace' }}>
                      {step.badge}
                    </div>
                  </div>
                </div>

                {isExpanded ? <ChevronDown size={14} color="#9ba1ad" /> : <ChevronRight size={14} color="#9ba1ad" />}
              </div>

              {/* Summary */}
              <div style={{ fontSize: '11px', color: 'var(--comfy-text-dim)', lineHeight: 1.4, marginTop: '2px' }}>
                {step.summary}
              </div>

              {/* Detailed Breakdown when Expanded */}
              {isExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px', borderTop: '1px solid var(--comfy-border)', paddingTop: '8px' }}>
                  {/* How it works */}
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#e2e8f0', marginBottom: '4px', textTransform: 'uppercase' }}>
                      How This Process Works:
                    </div>
                    <ul style={{ paddingLeft: '14px', fontSize: '10px', color: '#cbd5e1', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {step.howItWorks.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Math Formula Box */}
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#38bdf8', marginBottom: '3px' }}>
                      Mathematical Foundation:
                    </div>
                    <div className="comfy-math-box">
                      {step.math}
                    </div>
                  </div>

                  {/* Key Engineering Advantages */}
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#34d399', marginBottom: '4px', textTransform: 'uppercase' }}>
                      Key Engineering Advantages:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {step.keyAdvantages.map((point, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', fontSize: '10px', color: '#94a3b8' }}>
                          <CheckCircle2 size={11} color="#34d399" style={{ minWidth: '11px', marginTop: '2px' }} />
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
