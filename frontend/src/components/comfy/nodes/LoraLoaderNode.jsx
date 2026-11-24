import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Layers, Sparkles } from 'lucide-react';

const SAMPLE_LORA_PATH = 'backend/data/sample_style_lora.safetensors';

export default function LoraLoaderNode({ data }) {
  const { loraPath, setLoraPath, loraScale, setLoraScale } = data;
  const isActive = data.activeNode === 'lora';
  const isCompleted = data.completedNodes?.includes('lora');

  return (
    <div className={`comfy-node ${isActive ? 'node-active' : ''} ${isCompleted ? 'node-completed' : ''}`}>
      <div className="comfy-node-header" style={{ borderTop: '3px solid var(--socket-model)' }}>
        <div className="comfy-node-header-left">
          <Layers size={13} color="var(--socket-model)" />
          <span>LoRA Loader (Cross-Attention)</span>
        </div>
        <span className="comfy-node-badge" style={{ background: 'rgba(168, 85, 247, 0.2)', color: 'var(--socket-model)' }}>
          PEFT W = W₀ + α·ΔW
        </span>
      </div>

      <div className="comfy-node-body">
        {/* Input Sockets */}
        <div style={{ position: 'relative', marginBottom: '8px' }}>
          <div className="comfy-socket-row">
            <Handle
              type="target"
              position={Position.Left}
              id="model-in"
              className="comfy-handle"
              style={{ background: 'var(--socket-model)', top: '10px' }}
            />
            <span className="socket-label-left" style={{ color: 'var(--socket-model)' }}>model</span>
          </div>
          <div className="comfy-socket-row">
            <Handle
              type="target"
              position={Position.Left}
              id="clip-in"
              className="comfy-handle"
              style={{ background: 'var(--socket-clip)', top: '32px' }}
            />
            <span className="socket-label-left" style={{ color: 'var(--socket-clip)' }}>clip</span>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="comfy-chips-row">
          <button
            type="button"
            className="comfy-chip"
            onClick={() => setLoraPath('')}
            style={{
              borderColor: !loraPath ? '#3b82f6' : 'var(--comfy-border)',
              color: !loraPath ? '#ffffff' : 'var(--comfy-text-dim)',
              background: !loraPath ? 'rgba(59, 130, 246, 0.2)' : 'transparent'
            }}
          >
            Base Model (0.0)
          </button>
          <button
            type="button"
            className="comfy-chip"
            onClick={() => {
              setLoraPath(SAMPLE_LORA_PATH);
              if (loraScale === 0) setLoraScale(0.8);
            }}
            style={{
              borderColor: loraPath ? '#34d399' : 'var(--comfy-border)',
              color: loraPath ? '#34d399' : 'var(--comfy-text-dim)',
              background: loraPath ? 'rgba(52, 211, 153, 0.2)' : 'transparent'
            }}
          >
            ✨ Built-in Sample LoRA
          </button>
        </div>

        {/* Strength Slider */}
        <div className="comfy-slider-group">
          <div className="comfy-slider-label">
            <span>strength_model (α):</span>
            <span style={{ fontFamily: 'monospace', color: loraPath ? '#38bdf8' : 'var(--comfy-text-muted)' }}>
              {loraPath ? loraScale.toFixed(2) : '0.00 (Base)'}
            </span>
          </div>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={loraPath ? loraScale : 0}
            onChange={(e) => setLoraScale(Number(e.target.value))}
            disabled={!loraPath.trim()}
            style={{ width: '100%', accentColor: '#3b82f6' }}
          />
        </div>

        {/* Output Sockets */}
        <div style={{ borderTop: '1px solid var(--comfy-border)', paddingTop: '6px', marginTop: '4px' }}>
          <div className="comfy-socket-row">
            <span className="socket-label-right" style={{ color: 'var(--socket-model)' }}>MODEL</span>
            <Handle
              type="source"
              position={Position.Right}
              id="model-out"
              className="comfy-handle"
              style={{ background: 'var(--socket-model)', top: '10px' }}
            />
          </div>
          <div className="comfy-socket-row">
            <span className="socket-label-right" style={{ color: 'var(--socket-clip)' }}>CLIP</span>
            <Handle
              type="source"
              position={Position.Right}
              id="clip-out"
              className="comfy-handle"
              style={{ background: 'var(--socket-clip)', top: '32px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
