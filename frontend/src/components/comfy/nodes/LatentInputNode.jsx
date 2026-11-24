import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Box, ImagePlus, GitMerge } from 'lucide-react';

export default function LatentInputNode({ data }) {
  const {
    mode,
    initImage,
    setInitImage,
    strength,
    setStrength,
    slerpSeedA,
    setSlerpSeedA,
    slerpSeedB,
    setSlerpSeedB,
  } = data;

  const isActive = data.activeNode === 'latent';
  const isCompleted = data.completedNodes?.includes('latent');

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setInitImage(evt.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`comfy-node ${isActive ? 'node-active' : ''} ${isCompleted ? 'node-completed' : ''}`} style={{ minWidth: '280px' }}>
      <div className="comfy-node-header" style={{ borderTop: '3px solid var(--socket-latent)' }}>
        <div className="comfy-node-header-left">
          {mode === 't2i' && <Box size={13} color="var(--socket-latent)" />}
          {mode === 'img2img' && <ImagePlus size={13} color="var(--socket-latent)" />}
          {mode === 'slerp' && <GitMerge size={13} color="var(--socket-latent)" />}

          <span>
            {mode === 't2i' && 'Empty Latent Image'}
            {mode === 'img2img' && 'Load Reference & Latent Noise'}
            {mode === 'slerp' && 'Latent Slerp Manifold'}
          </span>
        </div>
        <span className="comfy-node-badge" style={{ background: 'rgba(236, 72, 153, 0.2)', color: 'var(--socket-latent)' }}>
          {mode.toUpperCase()}
        </span>
      </div>

      <div className="comfy-node-body">
        {/* Mode: T2I */}
        {mode === 't2i' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--comfy-text-dim)' }}>width:</label>
              <input type="number" className="comfy-input" value={512} disabled />
            </div>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--comfy-text-dim)' }}>height:</label>
              <input type="number" className="comfy-input" value={512} disabled />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '10px', color: 'var(--comfy-text-dim)' }}>batch_size:</label>
              <input type="number" className="comfy-input" value={1} disabled />
            </div>
          </div>
        )}

        {/* Mode: Img2Img */}
        {mode === 'img2img' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '6px',
              background: 'rgba(236, 72, 153, 0.15)',
              border: '1px dashed var(--socket-latent)',
              borderRadius: '6px',
              color: '#f472b6',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}>
              Browse Reference Sketch
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </label>

            {initImage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img
                  src={initImage}
                  alt="Reference"
                  style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1 }}>
                  <div className="comfy-slider-label">
                    <span>denoise (η):</span>
                    <span style={{ fontFamily: 'monospace', color: '#f472b6' }}>{strength.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.95"
                    step="0.05"
                    value={strength}
                    onChange={(e) => setStrength(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--socket-latent)' }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mode: Slerp */}
        {mode === 'slerp' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--comfy-text-dim)' }}>seed_a (z₀):</label>
              <input
                type="number"
                className="comfy-input"
                value={slerpSeedA}
                onChange={(e) => setSlerpSeedA(Number(e.target.value))}
              />
            </div>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--comfy-text-dim)' }}>seed_b (z₁):</label>
              <input
                type="number"
                className="comfy-input"
                value={slerpSeedB}
                onChange={(e) => setSlerpSeedB(Number(e.target.value))}
              />
            </div>
          </div>
        )}

        {/* Output Socket: LATENT */}
        <div style={{ borderTop: '1px solid var(--comfy-border)', paddingTop: '6px', marginTop: '4px' }}>
          <div className="comfy-socket-row">
            <span className="socket-label-right" style={{ color: 'var(--socket-latent)' }}>LATENT</span>
            <Handle
              type="source"
              position={Position.Right}
              id="latent"
              className="comfy-handle"
              style={{ background: 'var(--socket-latent)', top: '10px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
