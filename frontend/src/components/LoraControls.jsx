import React from 'react';
import { Sliders, Sparkles, Shuffle, SplitSquareVertical, FileCode, CheckCircle2 } from 'lucide-react';

const SAMPLE_LORA_PATH = 'backend/data/sample_style_lora.safetensors';

export default function LoraControls({
  steps,
  setSteps,
  seed,
  setSeed,
  loraPath,
  setLoraPath,
  loraScale,
  setLoraScale,
  compareSideBySide,
  setCompareSideBySide,
  onGenerate,
  isGenerating,
  disabled,
}) {
  const randomizeSeed = () => {
    setSeed(Math.floor(Math.random() * 1000000));
  };

  const handleToggleSideBySide = (checked) => {
    setCompareSideBySide(checked);
    // If user wants to compare side-by-side but hasn't picked a LoRA, auto-fill the sample LoRA!
    if (checked && !loraPath.trim()) {
      setLoraPath(SAMPLE_LORA_PATH);
      if (loraScale === 0) setLoraScale(0.8);
    }
  };

  return (
    <div className="panel-card">
      <div className="card-title-row">
        <span className="card-title">
          <Sliders size={18} color="#6366f1" />
          Model Parameters & LoRA Fine-Tuning
        </span>
      </div>

      <div className="controls-grid">
        {/* Inference Steps (1-4 for SD-Turbo ADD Distillation) */}
        <div className="control-item">
          <label className="control-label">Inference Steps (SD-Turbo ADD):</label>
          <select
            className="control-select"
            value={steps}
            onChange={(e) => setSteps(Number(e.target.value))}
          >
            <option value={1}>1 Step (~1.2s ultra-fast)</option>
            <option value={2}>2 Steps (~2.0s balanced)</option>
            <option value={3}>3 Steps (~2.8s crisp details)</option>
            <option value={4}>4 Steps (~3.5s maximum quality)</option>
          </select>
        </div>

        {/* Latent Generator Seed */}
        <div className="control-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="control-label">Latent Seed:</label>
            <button
              type="button"
              onClick={randomizeSeed}
              style={{ background: 'transparent', color: 'var(--accent-cyan)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}
            >
              <Shuffle size={11} />
              Random
            </button>
          </div>
          <input
            type="number"
            className="control-input"
            placeholder="Random seed (e.g. 42)"
            value={seed ?? ''}
            onChange={(e) => setSeed(e.target.value ? Number(e.target.value) : null)}
          />
        </div>
      </div>

      {/* LoRA File Selection & Presets */}
      <div className="control-item">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <label className="control-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <FileCode size={13} color="#a5b4fc" />
            LoRA Adapter Weights (.safetensors path):
          </label>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>PEFT Cross-Attention</span>
        </div>

        {/* Quick LoRA Presets Bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <button
            type="button"
            className="preset-chip"
            onClick={() => setLoraPath('')}
            style={{
              borderColor: !loraPath ? 'var(--primary)' : 'var(--border-subtle)',
              color: !loraPath ? '#ffffff' : 'var(--text-muted)',
              background: !loraPath ? 'var(--primary-glow)' : 'var(--bg-input)'
            }}
          >
            Base Model (No LoRA)
          </button>
          <button
            type="button"
            className="preset-chip"
            onClick={() => {
              setLoraPath(SAMPLE_LORA_PATH);
              if (loraScale === 0) setLoraScale(0.8);
            }}
            style={{
              borderColor: loraPath === SAMPLE_LORA_PATH ? '#34d399' : 'var(--border-subtle)',
              color: loraPath === SAMPLE_LORA_PATH ? '#34d399' : 'var(--text-muted)',
              background: loraPath === SAMPLE_LORA_PATH ? 'rgba(52, 211, 153, 0.15)' : 'var(--bg-input)'
            }}
          >
            ✨ Built-in Sample LoRA
          </button>
        </div>

        <input
          type="text"
          className="control-input"
          placeholder="Path to .safetensors (or click Built-in Sample LoRA above)"
          value={loraPath}
          onChange={(e) => setLoraPath(e.target.value)}
        />
      </div>

      {/* LoRA Strength Slider (0.0 to 1.0) */}
      <div className="control-item">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className="control-label">
            LoRA Adaptation Scale (W = W_0 + scale &times; &Delta;W):
          </label>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: loraPath ? '#a5b4fc' : 'var(--text-dim)', fontWeight: 700 }}>
            {loraPath ? loraScale.toFixed(2) : '0.00 (Base)'}
          </span>
        </div>
        <div className="slider-container">
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={loraPath ? loraScale : 0}
            onChange={(e) => setLoraScale(Number(e.target.value))}
            disabled={!loraPath.trim()}
          />
        </div>
      </div>

      {/* Side-by-Side Comparison Toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 14px',
          background: 'var(--bg-input)',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <input
          type="checkbox"
          id="compareToggle"
          checked={compareSideBySide}
          onChange={(e) => handleToggleSideBySide(e.target.checked)}
          style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
        />
        <label
          htmlFor="compareToggle"
          style={{
            fontSize: '13px',
            color: '#e2e8f0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <SplitSquareVertical size={16} color="#06b6d4" />
          <span>Compare LoRA Strength Side-by-Side (0.0 vs ~0.8)</span>
        </label>
      </div>

      {/* Generate Button */}
      <button
        className="btn-primary"
        onClick={onGenerate}
        disabled={isGenerating || disabled}
        style={{ padding: '14px 24px', fontSize: '15px' }}
      >
        <Sparkles size={18} />
        <span>{isGenerating ? 'Synthesizing on Apple Silicon MPS...' : 'Generate with GenStudio'}</span>
      </button>
    </div>
  );
}
