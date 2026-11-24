import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap, Shuffle } from 'lucide-react';

export default function KSamplerNode({ data }) {
  const { steps, setSteps, seed, setSeed } = data;
  const isActive = data.activeNode === 'ksampler';
  const isCompleted = data.completedNodes?.includes('ksampler');

  const randomizeSeed = () => {
    setSeed(Math.floor(Math.random() * 1000000000));
  };

  return (
    <div className={`comfy-node ${isActive ? 'node-active' : ''} ${isCompleted ? 'node-completed' : ''}`} style={{ minWidth: '310px' }}>
      <div className="comfy-node-header" style={{ borderTop: '3px solid #3b82f6' }}>
        <div className="comfy-node-header-left">
          <Zap size={13} color="#38bdf8" />
          <span>KSampler (SD-Turbo)</span>
        </div>
        <span className="comfy-node-badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
          ADD Solver (MPS)
        </span>
      </div>

      <div className="comfy-node-body">
        {/* Left Inputs */}
        <div style={{ position: 'relative', marginBottom: '8px' }}>
          <div className="comfy-socket-row">
            <Handle
              type="target"
              position={Position.Left}
              id="model"
              className="comfy-handle"
              style={{ background: 'var(--socket-model)', top: '10px' }}
            />
            <span className="socket-label-left" style={{ color: 'var(--socket-model)' }}>model</span>
          </div>

          <div className="comfy-socket-row">
            <Handle
              type="target"
              position={Position.Left}
              id="positive"
              className="comfy-handle"
              style={{ background: 'var(--socket-conditioning)', top: '30px' }}
            />
            <span className="socket-label-left" style={{ color: 'var(--socket-conditioning)' }}>positive</span>
          </div>

          <div className="comfy-socket-row">
            <Handle
              type="target"
              position={Position.Left}
              id="negative"
              className="comfy-handle"
              style={{ background: 'var(--socket-conditioning)', top: '50px' }}
            />
            <span className="socket-label-left" style={{ color: 'var(--socket-conditioning)' }}>negative</span>
          </div>

          <div className="comfy-socket-row">
            <Handle
              type="target"
              position={Position.Left}
              id="latent"
              className="comfy-handle"
              style={{ background: 'var(--socket-latent)', top: '70px' }}
            />
            <span className="socket-label-left" style={{ color: 'var(--socket-latent)' }}>latent_image</span>
          </div>
        </div>

        {/* KSampler Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--comfy-border)', paddingTop: '8px' }}>
          <div>
            <div className="comfy-slider-label">
              <span>seed:</span>
              <button
                type="button"
                onClick={randomizeSeed}
                style={{ background: 'transparent', color: '#38bdf8', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                <Shuffle size={10} />
                Randomize
              </button>
            </div>
            <input
              type="number"
              className="comfy-input"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--comfy-text-dim)' }}>steps:</label>
              <select
                className="comfy-select"
                value={steps}
                onChange={(e) => setSteps(Number(e.target.value))}
              >
                <option value={1}>1 (Fastest)</option>
                <option value={2}>2 (Optimal)</option>
                <option value={3}>3</option>
                <option value={4}>4 (Detailed)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--comfy-text-dim)' }}>cfg:</label>
              <input type="text" className="comfy-input" value="0.0 (Distilled)" disabled />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--comfy-text-dim)' }}>sampler_name:</label>
              <input type="text" className="comfy-input" value="euler_ancestral" disabled />
            </div>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--comfy-text-dim)' }}>scheduler:</label>
              <input type="text" className="comfy-input" value="turbo" disabled />
            </div>
          </div>
        </div>

        {/* Output Socket: LATENT */}
        <div style={{ borderTop: '1px solid var(--comfy-border)', paddingTop: '6px', marginTop: '4px' }}>
          <div className="comfy-socket-row">
            <span className="socket-label-right" style={{ color: 'var(--socket-latent)' }}>LATENT</span>
            <Handle
              type="source"
              position={Position.Right}
              id="latent-out"
              className="comfy-handle"
              style={{ background: 'var(--socket-latent)', top: '10px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
