import React from 'react';
import {
  Layers,
  Plus,
  List,
  FolderGit2,
  HardDrive,
  Settings,
  Cpu,
  Activity
} from 'lucide-react';

export default function ComfySidebar({ onSelectNodeCategory }) {
  return (
    <nav className="comfy-left-rail">
      {/* Top Comfy 'C' Logo */}
      <div className="comfy-logo-icon" title="ComfyUI GenStudio">
        C
      </div>

      {/* Nav Tool Buttons */}
      <button type="button" className="comfy-rail-btn active" title="Graph Canvas">
        <Layers size={16} />
      </button>

      <button type="button" className="comfy-rail-btn" title="Add Node Library">
        <Plus size={16} />
      </button>

      <button type="button" className="comfy-rail-btn" title="Execution Queue">
        <List size={16} />
      </button>

      <button type="button" className="comfy-rail-btn" title="Workflow Presets">
        <FolderGit2 size={16} />
      </button>

      <button type="button" className="comfy-rail-btn" title="Model & LoRA Adapters">
        <HardDrive size={16} />
      </button>

      <button type="button" className="comfy-rail-btn" title="Live Telemetry">
        <Activity size={16} />
      </button>

      {/* Bottom controls */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
        <button type="button" className="comfy-rail-btn" title="Apple Silicon MPS Active">
          <Cpu size={16} color="#34d399" />
        </button>

        <button type="button" className="comfy-rail-btn" title="Settings">
          <Settings size={16} />
        </button>
      </div>
    </nav>
  );
}
