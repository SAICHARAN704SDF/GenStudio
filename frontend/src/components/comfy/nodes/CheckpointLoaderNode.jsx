import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Cpu, HardDrive } from 'lucide-react';

export default function CheckpointLoaderNode({ data, selected }) {
  const isActive = data.activeNode === 'checkpoint';
  const isCompleted = data.completedNodes?.includes('checkpoint');

  return (
    <div className={`comfy-node ${isActive ? 'node-active' : ''} ${isCompleted ? 'node-completed' : ''}`}>
      <div className="comfy-node-header" style={{ borderTop: '3px solid var(--socket-model)' }}>
        <div className="comfy-node-header-left">
          <HardDrive size={13} color="var(--socket-model)" />
          <span>Load Diffusion Model</span>
        </div>
        <span className="comfy-node-badge" style={{ background: 'rgba(168, 85, 247, 0.2)', color: 'var(--socket-model)' }}>
          SD-Turbo
        </span>
      </div>

      <div className="comfy-node-body">
        <div>
          <label style={{ fontSize: '10px', color: 'var(--comfy-text-dim)', marginBottom: '3px', display: 'block' }}>
            ckpt_name:
          </label>
          <select className="comfy-select" defaultValue="sd_turbo_fp16.safetensors">
            <option value="sd_turbo_fp16.safetensors">stabilityai/sd-turbo (fp16)</option>
          </select>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 8px',
          background: 'var(--comfy-bg-input)',
          borderRadius: '4px',
          border: '1px solid var(--comfy-border)',
          fontSize: '10px'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#a5b4fc' }}>
            <Cpu size={11} />
            Device: Apple Silicon MPS
          </span>
          <span style={{ color: '#34d399', fontWeight: 600 }}>float16</span>
        </div>

        {/* Output Sockets */}
        <div style={{ borderTop: '1px solid var(--comfy-border)', paddingTop: '6px', marginTop: '4px' }}>
          <div className="comfy-socket-row">
            <span className="socket-label-right" style={{ color: 'var(--socket-model)' }}>MODEL</span>
            <Handle
              type="source"
              position={Position.Right}
              id="model"
              className="comfy-handle"
              style={{ background: 'var(--socket-model)', top: '12px' }}
            />
          </div>

          <div className="comfy-socket-row">
            <span className="socket-label-right" style={{ color: 'var(--socket-clip)' }}>CLIP</span>
            <Handle
              type="source"
              position={Position.Right}
              id="clip"
              className="comfy-handle"
              style={{ background: 'var(--socket-clip)', top: '34px' }}
            />
          </div>

          <div className="comfy-socket-row">
            <span className="socket-label-right" style={{ color: 'var(--socket-vae)' }}>VAE</span>
            <Handle
              type="source"
              position={Position.Right}
              id="vae"
              className="comfy-handle"
              style={{ background: 'var(--socket-vae)', top: '56px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
