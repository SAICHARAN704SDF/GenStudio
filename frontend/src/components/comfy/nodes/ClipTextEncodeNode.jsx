import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileText } from 'lucide-react';

const PRESETS = [
  'A lone samurai standing under cherry blossoms at twilight',
  'Cyberpunk rain-slicked neon street with reflection',
  'Baroque chiaroscuro portrait of an alchemist with glowing vials',
  'Macro dewdrop on an emerald botanical leaf, morning light',
];

export default function ClipTextEncodeNode({ data }) {
  const { prompt, setPrompt, enhancedData } = data;
  const isActive = data.activeNode === 'prompt_pos';
  const isCompleted = data.completedNodes?.includes('prompt_pos');

  return (
    <div className={`comfy-node ${isActive ? 'node-active' : ''} ${isCompleted ? 'node-completed' : ''}`} style={{ minWidth: '320px' }}>
      <div className="comfy-node-header" style={{ borderTop: '3px solid var(--socket-conditioning)' }}>
        <div className="comfy-node-header-left">
          <FileText size={13} color="var(--socket-conditioning)" />
          <span>CLIP Text Encode (Prompt)</span>
        </div>
        <span className="comfy-node-badge" style={{ background: 'rgba(249, 115, 22, 0.2)', color: 'var(--socket-conditioning)' }}>
          Positive Conditioning
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
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your visual concept (e.g., 'A cyberpunk samurai in neon rain')..."
          rows={3}
        />

        {/* Quick Presets */}
        <div>
          <div style={{ fontSize: '10px', color: 'var(--comfy-text-muted)', marginBottom: '4px' }}>
            Inspirations:
          </div>
          <div className="comfy-chips-row">
            {PRESETS.map((p, i) => (
              <button
                key={i}
                type="button"
                className="comfy-chip"
                onClick={() => setPrompt(p)}
              >
                {p.slice(0, 24)}...
              </button>
            ))}
          </div>
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
