import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Eye } from 'lucide-react';

export default function VaeDecodeNode({ data }) {
  const isActive = data.activeNode === 'vae_decode';
  const isCompleted = data.completedNodes?.includes('vae_decode');

  return (
    <div className={`comfy-node ${isActive ? 'node-active' : ''} ${isCompleted ? 'node-completed' : ''}`} style={{ minWidth: '220px' }}>
      <div className="comfy-node-header" style={{ borderTop: '3px solid var(--socket-vae)' }}>
        <div className="comfy-node-header-left">
          <Eye size={13} color="var(--socket-vae)" />
          <span>VAE Decode</span>
        </div>
        <span className="comfy-node-badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--socket-vae)' }}>
          8x Upscale
        </span>
      </div>

      <div className="comfy-node-body">
        {/* Input Sockets: samples & vae */}
        <div style={{ position: 'relative', marginBottom: '8px' }}>
          <div className="comfy-socket-row">
            <Handle
              type="target"
              position={Position.Left}
              id="samples"
              className="comfy-handle"
              style={{ background: 'var(--socket-latent)', top: '10px' }}
            />
            <span className="socket-label-left" style={{ color: 'var(--socket-latent)' }}>samples</span>
          </div>

          <div className="comfy-socket-row">
            <Handle
              type="target"
              position={Position.Left}
              id="vae"
              className="comfy-handle"
              style={{ background: 'var(--socket-vae)', top: '30px' }}
            />
            <span className="socket-label-left" style={{ color: 'var(--socket-vae)' }}>vae</span>
          </div>
        </div>

        <div style={{
          padding: '6px 8px',
          background: 'var(--comfy-bg-input)',
          borderRadius: '4px',
          fontSize: '10px',
          color: 'var(--comfy-text-dim)',
          lineHeight: 1.4
        }}>
          Maps latent representation <span style={{ color: '#ec4899', fontFamily: 'monospace' }}>[1, 4, 64, 64]</span> &rarr; RGB pixels <span style={{ color: '#22c55e', fontFamily: 'monospace' }}>[1, 3, 512, 512]</span>.
        </div>

        {/* Output Socket: IMAGE */}
        <div style={{ borderTop: '1px solid var(--comfy-border)', paddingTop: '6px', marginTop: '4px' }}>
          <div className="comfy-socket-row">
            <span className="socket-label-right" style={{ color: 'var(--socket-image)' }}>IMAGE</span>
            <Handle
              type="source"
              position={Position.Right}
              id="image"
              className="comfy-handle"
              style={{ background: 'var(--socket-image)', top: '10px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
