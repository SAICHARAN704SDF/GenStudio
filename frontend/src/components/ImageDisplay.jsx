import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Award, Clock, Image as ImageIcon, Sparkles, Download, BrainCircuit, RefreshCw, Layers } from 'lucide-react';

export default function ImageDisplay({
  result,
  slerpResult,
  isGenerating,
  prompt,
  onCritiqueAndRefine,
  isCritiquing,
  criticReport,
}) {
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [slerpIndex, setSlerpIndex] = useState(0);

  // Trigger browser Web Speech API when new caption arrives
  useEffect(() => {
    if (result?.caption && autoSpeak) {
      speakCaption(result.caption);
    }
  }, [result?.id]);

  const speakCaption = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const downloadImage = (dataUrl, filename = 'genstudio-output.jpg') => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="canvas-container">
      <div className="display-box">
        {/* Loading State */}
        {isGenerating && (
          <div className="skeleton-loader">
            <Sparkles size={36} color="#6366f1" className="spin" />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#ffffff' }}>
                Executing Latent Diffusion
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                SD-Turbo &bull; Apple Silicon MPS float16 &bull; Slicing Enabled
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isGenerating && !result && !slerpResult && (
          <div className="empty-state">
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'var(--bg-input)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-subtle)'
            }}>
              <ImageIcon size={32} color="#64748b" />
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0' }}>
              Creative Canvas Ready
            </div>
            <p style={{ fontSize: '13px', maxWidth: '340px', lineHeight: '1.5' }}>
              Configure prompt conditioning, adjust LoRA scale or reference sketch, and click Generate to run diffusion on Apple Silicon MPS.
            </p>
          </div>
        )}

        {/* Slerp Manifold Visualizer Mode */}
        {!isGenerating && slerpResult && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="snippet-tag" style={{ background: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)' }}>
                Latent Slerp Manifold: {slerpResult.frames?.length} Interpolated Hypersphere States
              </span>
            </div>

            {/* Main Interactive Scrubbing Frame */}
            {slerpResult.frames?.[slerpIndex] && (
              <div style={{ position: 'relative', width: '100%', maxWidth: '512px' }}>
                <img
                  src={slerpResult.frames[slerpIndex].image}
                  alt={`Slerp frame ${slerpIndex}`}
                  className="image-frame"
                />
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  background: 'rgba(0,0,0,0.7)',
                  backdropFilter: 'blur(4px)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  color: '#ffffff'
                }}>
                  &lambda; = {slerpResult.frames[slerpIndex].lambda.toFixed(2)}
                </div>
              </div>
            )}

            {/* Scrubbing Slider */}
            <div style={{ width: '100%', maxWidth: '512px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>$z_0$</span>
              <input
                type="range"
                min="0"
                max={(slerpResult.frames?.length || 1) - 1}
                value={slerpIndex}
                onChange={(e) => setSlerpIndex(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--accent-cyan)' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>$z_1$</span>
            </div>

            {/* Thumbnail Strip */}
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
              {slerpResult.frames?.map((f, i) => (
                <div
                  key={i}
                  onClick={() => setSlerpIndex(i)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: '8px',
                    border: `2px solid ${slerpIndex === i ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                    overflow: 'hidden'
                  }}
                >
                  <img src={f.image} alt={`Frame ${i}`} style={{ width: '70px', height: '70px', objectFit: 'cover' }} />
                  <div style={{ textAlign: 'center', fontSize: '10px', background: 'var(--bg-input)', padding: '2px' }}>
                    &lambda;={f.lambda}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Output Display: Single Image Mode */}
        {!isGenerating && result && !result.comparison && !slerpResult && (
          <>
            <div style={{ position: 'relative', width: '100%', maxWidth: '512px' }}>
              <img
                src={result.image}
                alt={result.prompt}
                className="image-frame"
              />
              <button
                className="speech-btn"
                onClick={() => downloadImage(result.image, `genstudio-${result.id}.jpg`)}
                title="Download image"
                style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.65)' }}
              >
                <Download size={16} />
              </button>
            </div>

            {/* Evaluation & Multimodal Perception Card */}
            <div className="eval-card">
              <div className="caption-row">
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '2px' }}>
                    BLIP MULTIMODAL CAPTION:
                  </div>
                  <div className="caption-text">
                    &ldquo;{result.caption}&rdquo;
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    className="speech-btn"
                    onClick={() => speakCaption(result.caption)}
                    title="Speak caption aloud with browser Web Speech API"
                  >
                    <Volume2 size={16} />
                  </button>
                  <button
                    className="speech-btn"
                    onClick={() => setAutoSpeak(!autoSpeak)}
                    title={autoSpeak ? "Auto-speak enabled" : "Auto-speak disabled"}
                    style={{ color: autoSpeak ? '#34d399' : '#94a3b8' }}
                  >
                    {autoSpeak ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  </button>
                </div>
              </div>

              {/* CLIP Alignment Score & Performance Metrics */}
              <div className="metrics-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={14} color="#6366f1" />
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>CLIP Score:</span>
                  <span className={`clip-badge ${result.badge_color || 'blue'}`}>
                    {result.clip_score.toFixed(3)} ({result.clip_normalized}% - {result.clip_rating})
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  <Clock size={13} />
                  <span>{result.generation_time}s</span>
                </div>
              </div>

              {/* Autonomous AI Critic & Refinement Loop Button */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onCritiqueAndRefine}
                  disabled={isCritiquing}
                  style={{
                    width: '100%',
                    fontSize: '12px',
                    borderColor: 'rgba(99, 102, 241, 0.4)',
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: '#a5b4fc',
                  }}
                >
                  <BrainCircuit size={14} color="#6366f1" />
                  <span>{isCritiquing ? 'AI Critic Diagnosing Gaps (Ollama)...' : '🤖 AI Critic & Auto-Refine (RLVF Loop)'}</span>
                </button>
              </div>

              {/* AI Critic Report Box */}
              {criticReport && (
                <div style={{
                  background: 'rgba(6, 182, 212, 0.05)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BrainCircuit size={13} />
                    Critic Diagnosis & Improvement Recommendation:
                  </div>
                  <p style={{ color: '#e2e8f0', lineHeight: '1.4' }}>
                    {criticReport.critique}
                  </p>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                    <strong>Refined Prompt:</strong> {criticReport.refined_prompt}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--accent-rose)' }}>
                    <strong>Negative Constraints:</strong> {criticReport.negative_prompt}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Output Display: Side-by-Side LoRA Comparison Mode */}
        {!isGenerating && result && result.comparison && !slerpResult && (
          <div style={{ width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <span className="snippet-tag" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', fontSize: '12px', padding: '4px 12px' }}>
                LoRA A/B Comparative Evaluation: Base Model (Scale 0.0) vs. Adapted (Scale {result.lora_scale})
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px' }}>
                  Base Model (LoRA Scale 0.0)
                </div>
                <img
                  src={result.comparison.base_image}
                  alt="Base model output"
                  className="image-frame"
                />
                <div className="eval-card" style={{ maxWidth: '100%', marginTop: '12px' }}>
                  <div className="caption-text">
                    &ldquo;{result.comparison.base_caption}&rdquo;
                  </div>
                  <div className="metrics-row">
                    <span className={`clip-badge ${result.comparison.base_clip.badge_color}`}>
                      CLIP: {result.comparison.base_clip.raw_clip_score.toFixed(3)}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      {result.comparison.base_latency}s
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#a5b4fc', marginBottom: '8px' }}>
                  LoRA Adapted (Scale {result.lora_scale})
                </div>
                <img
                  src={result.image}
                  alt="LoRA fine-tuned output"
                  className="image-frame"
                />
                <div className="eval-card" style={{ maxWidth: '100%', marginTop: '12px' }}>
                  <div className="caption-text">
                    &ldquo;{result.caption}&rdquo;
                  </div>
                  <div className="metrics-row">
                    <span className={`clip-badge ${result.badge_color}`}>
                      CLIP: {result.clip_score.toFixed(3)}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      {result.generation_time}s
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
