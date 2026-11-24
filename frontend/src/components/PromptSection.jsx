import React, { useState } from 'react';
import { Wand2, Check, ArrowRight, Layers, Loader2, MinusCircle, ImagePlus, Eye, Compass } from 'lucide-react';

const PRESETS = [
  'A lone samurai standing under cherry blossoms at twilight',
  'Cyberpunk rain-slicked neon street with reflection',
  'Golden retriever puppy playing in vibrant autumn leaves',
  'Macro dewdrop on an emerald botanical leaf, morning light',
  'Baroque chiaroscuro portrait of an alchemist with glowing vials',
];

const NEGATIVE_PRESETS = [
  'blurry, low quality, distorted, extra limbs',
  'deformed faces, bad anatomy, poorly drawn hands',
  'watermark, signature, text, oversaturated, pixelated',
];

export default function PromptSection({
  mode,
  setMode,
  prompt,
  setPrompt,
  negativePrompt,
  setNegativePrompt,
  initImage,
  setInitImage,
  strength,
  setStrength,
  slerpSeedA,
  setSlerpSeedA,
  slerpSeedB,
  setSlerpSeedB,
  enhancedData,
  onEnhance,
  isEnhancing,
  onApplyEnhanced,
}) {
  const [showNegative, setShowNegative] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setInitImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="panel-card">
      {/* Mode Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '6px',
        padding: '4px',
        background: 'var(--bg-input)',
        borderRadius: '10px',
        border: '1px solid var(--border-subtle)',
      }}>
        <button
          type="button"
          onClick={() => setMode('t2i')}
          style={{
            flex: 1,
            padding: '7px 10px',
            borderRadius: '7px',
            fontSize: '12px',
            fontWeight: 700,
            background: mode === 't2i' ? 'var(--primary)' : 'transparent',
            color: mode === 't2i' ? '#ffffff' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Wand2 size={13} />
          <span>Text-to-Image</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('img2img')}
          style={{
            flex: 1,
            padding: '7px 10px',
            borderRadius: '7px',
            fontSize: '12px',
            fontWeight: 700,
            background: mode === 'img2img' ? 'var(--primary)' : 'transparent',
            color: mode === 'img2img' ? '#ffffff' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <ImagePlus size={13} />
          <span>Image-to-Image</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('slerp')}
          style={{
            flex: 1,
            padding: '7px 10px',
            borderRadius: '7px',
            fontSize: '12px',
            fontWeight: 700,
            background: mode === 'slerp' ? 'var(--primary)' : 'transparent',
            color: mode === 'slerp' ? '#ffffff' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Compass size={13} />
          <span>Latent Slerp</span>
        </button>
      </div>

      <div className="card-title-row">
        <span className="card-title">
          <Wand2 size={18} color="#6366f1" />
          {mode === 't2i' && 'Text Prompt Conditioning'}
          {mode === 'img2img' && 'Image-to-Image (Markov Latent Guide)'}
          {mode === 'slerp' && 'Latent Manifold Spherical Interpolation'}
        </span>

        {mode !== 'slerp' && (
          <button
            className="btn-secondary"
            onClick={onEnhance}
            disabled={isEnhancing || !prompt.trim()}
            style={{ padding: '6px 12px', fontSize: '12px' }}
            title="Embed prompt, retrieve top-3 styles via cosine similarity, and augment via Ollama LLM"
          >
            {isEnhancing ? (
              <>
                <Loader2 size={13} className="spin" />
                <span>RAG Enhancing...</span>
              </>
            ) : (
              <>
                <Layers size={13} color="#06b6d4" />
                <span>Enhance with RAG</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Img2Img Initial Image Upload Box */}
      {mode === 'img2img' && (
        <div style={{
          padding: '14px',
          background: 'var(--bg-input)',
          borderRadius: '12px',
          border: '1px dashed var(--border-focus)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0' }}>
              Reference / Sketch Image Input:
            </span>
            <label style={{
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'var(--primary)',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: 600
            }}>
              Browse Image
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </label>
          </div>

          {initImage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img
                src={initImage}
                alt="Input reference"
                style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Denoising Strength (&eta;):</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#a5b4fc', fontWeight: 700 }}>
                    {strength.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.95"
                  step="0.05"
                  value={strength}
                  onChange={(e) => setStrength(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>
                  Lower = Keeps exact structure | Higher = Creative restyling
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Slerp Specific Seed Pair Controls */}
      {mode === 'slerp' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          padding: '12px',
          background: 'var(--bg-input)',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)'
        }}>
          <div>
            <label className="control-label">Latent Origin Seed ($z_0$):</label>
            <input
              type="number"
              className="control-input"
              value={slerpSeedA}
              onChange={(e) => setSlerpSeedA(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="control-label">Latent Target Seed ($z_1$):</label>
            <input
              type="number"
              className="control-input"
              value={slerpSeedB}
              onChange={(e) => setSlerpSeedB(Number(e.target.value))}
            />
          </div>
        </div>
      )}

      {/* Main Prompt Textarea */}
      <textarea
        className="prompt-input"
        placeholder={mode === 'slerp' ? "Enter prompt to smoothly interpolate along the latent manifold..." : "Describe the image to synthesize (e.g., 'A cyberpunk street in the rain')..."}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      {/* Quick Prompt Presets */}
      <div>
        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '8px', fontWeight: 600 }}>
          SAMPLE INSPIRATIONS:
        </div>
        <div className="preset-row">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              className="preset-chip"
              onClick={() => setPrompt(p)}
              type="button"
            >
              {p.length > 36 ? p.slice(0, 36) + '...' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Negative Prompting Toggle & Input (Vector Subtraction in Latent Space) */}
      {mode !== 'slerp' && (
        <div>
          <button
            type="button"
            onClick={() => setShowNegative(!showNegative)}
            style={{
              background: 'transparent',
              color: showNegative ? 'var(--accent-rose)' : 'var(--text-dim)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: showNegative ? '8px' : '0'
            }}
          >
            <MinusCircle size={13} />
            <span>{showNegative ? 'Hide Negative Prompt' : '+ Add Negative Prompt (Latent Vector Subtraction)'}</span>
          </button>

          {showNegative && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                className="control-input"
                placeholder="Undesired elements (e.g. blurry, deformed faces, oversaturated, lowres)"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
              />
              <div className="preset-row">
                {NEGATIVE_PRESETS.map((np, idx) => (
                  <button
                    key={idx}
                    className="preset-chip"
                    onClick={() => setNegativePrompt(np)}
                    type="button"
                    style={{ fontSize: '10px' }}
                  >
                    {np.slice(0, 32)}...
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* RAG Context Enhancement Output Box */}
      {enhancedData && mode !== 'slerp' && (
        <div className="rag-box">
          <div className="rag-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={14} color="#06b6d4" />
              RAG Augmented Prompt (Retrieved + Ollama Synthesized)
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              Latency: {enhancedData.latency_seconds}s
            </span>
          </div>

          <div className="rag-content">
            {enhancedData.enhanced_prompt}
          </div>

          {enhancedData.retrieved_snippets && (
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '6px' }}>
                Retrieved Vector Matches (MiniLM-L6-v2 Cosine Similarity):
              </div>
              <div className="rag-snippets-tags">
                {enhancedData.retrieved_snippets.map((snip, i) => (
                  <span key={i} className="snippet-tag" title={snip.text}>
                    {snip.name} ({(snip.similarity_score * 100).toFixed(0)}%)
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            className="btn-secondary"
            onClick={onApplyEnhanced}
            style={{
              borderColor: 'var(--border-focus)',
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#ffffff',
              fontSize: '12px',
              padding: '8px 12px',
            }}
          >
            <Check size={14} color="#34d399" />
            <span>Apply Enhanced Prompt to Generator</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
