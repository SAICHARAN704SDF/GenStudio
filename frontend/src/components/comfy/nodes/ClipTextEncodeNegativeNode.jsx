import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { MinusCircle } from 'lucide-react';

const NEGATIVE_PRESETS = [
  'blurry, low quality, distorted, extra limbs',
  'deformed faces, bad anatomy, poorly drawn hands',
  'watermark, signature, text, oversaturated',
];

export default function ClipTextEncodeNegativeNode({ data }) {
  const { negativePrompt, setNegativePrompt } = data;
  const isActive = data.activeNode === 'prompt_neg';
  const isCompleted = data.completedNodes?.includes('prompt_neg');

  return (
    <div className={`comfy-node ${isActive ? 'node-active' : ''} ${isCompleted ? 'node-completed' : ''}`} style={{ minWidth: '320px' }}>
      <div className="comfy-node-header" style={{ borderTop: '3px solid var(--socket-conditioning)' }}>
        <div className="comfy-node-header-left">
          <MinusCircle size={13} color="var(--socket-conditioning)" />
          <span>CLIP Text Encode (Negative)</span>
        </div>
        <span className="comfy-node-badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
          Latent Vector Subtraction
        </span>
      </div>

      <div className="comfy-node-body">
        {/* Input Socket: clip */}
        <div style={{ position: 'relative', marginBottom: '6px' }}>
          <div className="comfy-socket-row">
            <Handle
              type="target"
              position={Position.Left}
              id="clip-in"
              className="comfy-handle"
              style={{ background: 'var(--socket-clip)', top: '10px' }}
            />
            <span className="socket-label-left" style={{ color: 'var(--socket-clip)' }}>clip</span>
          </div>
        </div>

        <textarea
          className="comfy-textarea"
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          placeholder="Undesired attributes to suppress (e.g., 'blurry, bad anatomy, text')..."
          rows={2}
        />

        {/* Quick Presets */}
        <div className="comfy-chips-row">
          {NEGATIVE_PRESETS.map((np, i) => (
            <button
              key={i}
              type="button"
              className="comfy-chip"
              onClick={() => setNegativePrompt(np)}
              style={{ fontSize: '9px' }}
            >
              {np.slice(0, 24)}...
            </button>
          ))}
        </div>

        {/* Output Socket: CONDITIONING */}
        <div style={{ borderTop: '1px solid var(--comfy-border)', paddingTop: '6px', marginTop: '4px' }}>
          <div className="comfy-socket-row">
            <span className="socket-label-right" style={{ color: 'var(--socket-conditioning)' }}>CONDITIONING</span>
            <Handle
              type="source"
              position={Position.Right}
              id="conditioning"
              className="comfy-handle"
              style={{ background: 'var(--socket-conditioning)', top: '10px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
