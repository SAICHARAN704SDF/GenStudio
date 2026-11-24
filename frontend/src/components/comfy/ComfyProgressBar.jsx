import React from 'react';
import { Cpu, Sparkles } from 'lucide-react';

export default function ComfyProgressBar({
  isGenerating,
  activeNode,
  progress = 0
}) {
  if (!isGenerating) {
    return (
      <div className="comfy-progress-bar-container">
        <div className="comfy-progress-content">
          <span style={{ color: 'var(--comfy-text-dim)' }}>
            System Ready &bull; stabilityai/sd-turbo &bull; MPS float16 &bull; Slicing Enabled
          </span>
          <span style={{ color: '#34d399', fontFamily: 'monospace', fontWeight: 600 }}>
            Graph Idle
          </span>
        </div>
      </div>
    );
  }

  const getNodeLabel = (nodeId) => {
    switch (nodeId) {
      case 'rag': return 'RAG Vector Retriever (MiniLM-L6-v2 + Ollama)';
      case 'prompt_pos': return 'CLIP Text Encode (Positive Conditioning)';
      case 'prompt_neg': return 'CLIP Text Encode (Negative Conditioning)';
      case 'latent': return 'Latent Space Initialization (Noise/Slerp/Img2Img)';
      case 'ksampler': return 'KSampler (SD-Turbo on Apple Silicon MPS)';
      case 'vae_decode': return 'VAE Decode (Latents 64x64 → RGB 512x512)';
      case 'save_image': return 'Save Image & Multimodal Evaluation (BLIP + CLIP)';
      default: return 'Executing Diffusion Graph...';
    }
  };

  return (
    <div className="comfy-progress-bar-container">
      <div className="comfy-progress-indicator" style={{ width: `${progress}%` }} />
      <div className="comfy-progress-line" style={{ width: `${progress}%` }} />

      <div className="comfy-progress-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff' }}>
          <Sparkles size={11} color="#38bdf8" className="spin" />
          <span>
            Total: <strong>{progress}%</strong> &nbsp;&bull;&nbsp; Current node:{' '}
            <strong style={{ color: '#38bdf8' }}>{getNodeLabel(activeNode)}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a5b4fc', fontFamily: 'monospace' }}>
          <Cpu size={12} color="#34d399" />
          <span>MPS Active</span>
        </div>
      </div>
    </div>
  );
}
