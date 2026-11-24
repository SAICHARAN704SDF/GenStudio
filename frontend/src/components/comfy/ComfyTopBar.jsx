import React from 'react';
import {
  Play,
  X,
  Layers,
  ChevronDown,
  RotateCw,
  Bell,
  PanelRight,
  Maximize2,
  Minus,
  Square,
  Sparkles
} from 'lucide-react';

export default function ComfyTopBar({
  mode,
  setMode,
  isGenerating,
  onRun,
  onCancel,
  inspectorOpen,
  setInspectorOpen,
}) {
  return (
    <>
      {/* 1. Window Title Bar (Topmost system bar) */}
      <div className="comfy-title-bar">
        <div className="comfy-title-left">
          <button type="button" className="comfy-window-btn" title="Menu">
            <span style={{ fontSize: '14px', lineHeight: 1 }}>☰</span>
          </button>
          <button type="button" className="comfy-window-btn" title="Refresh Graph">
            <RotateCw size={12} />
          </button>

          {/* Workflow Tabs */}
          <div className="comfy-tab">
            <span className="comfy-tab-dot" />
            <span>DefaultWorkflow</span>
            <span style={{ fontSize: '10px', color: 'var(--comfy-text-dim)' }}>&times;</span>
          </div>
          <button type="button" className="comfy-window-btn" title="New Workflow">
            +
          </button>
        </div>

        {/* Center: Comfy dropdown */}
        <div className="comfy-title-center">
          <span style={{ fontWeight: 800, letterSpacing: '0.5px' }}>ComfyUI</span>
          <span style={{ fontSize: '10px', color: '#60a5fa', fontWeight: 600 }}>v1 Desktop</span>
          <ChevronDown size={11} color="var(--comfy-text-dim)" />
        </div>

        {/* Window controls */}
        <div className="comfy-title-right">
          <button type="button" className="comfy-window-btn" title="Notifications">
            <Bell size={12} />
          </button>
          <button type="button" className="comfy-window-btn" title="Minimize">
            <Minus size={11} />
          </button>
          <button type="button" className="comfy-window-btn" title="Maximize">
            <Square size={10} />
          </button>
          <button type="button" className="comfy-window-btn" title="Close">
            <X size={12} />
          </button>
        </div>
      </div>

      {/* 2. Top Application Toolbar */}
      <div className="comfy-toolbar">
        <div className="comfy-toolbar-left">
          {/* Workflow Mode Selector (Graph modes) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className={`comfy-mode-pill ${mode === 't2i' ? 'active' : ''}`}
              onClick={() => setMode('t2i')}
            >
              <Sparkles size={13} color={mode === 't2i' ? '#38bdf8' : '#9ba1ad'} />
              <span>Text-to-Image (T2I)</span>
            </button>

            <button
              type="button"
              className={`comfy-mode-pill ${mode === 'img2img' ? 'active' : ''}`}
              onClick={() => setMode('img2img')}
            >
              <Layers size={13} color={mode === 'img2img' ? '#ec4899' : '#9ba1ad'} />
              <span>Img2Img (Reference Sketch)</span>
            </button>

            <button
              type="button"
              className={`comfy-mode-pill ${mode === 'slerp' ? 'active' : ''}`}
              onClick={() => setMode('slerp')}
            >
              <RotateCw size={13} color={mode === 'slerp' ? '#06b6d4' : '#9ba1ad'} />
              <span>Latent Slerp (Manifold)</span>
            </button>
          </div>
        </div>

        {/* Action Controls on Right */}
        <div className="comfy-toolbar-right">
          <div className="comfy-queue-badge">
            Queue: 1
          </div>

          {/* Big Blue Run Button */}
          <button
            type="button"
            className="comfy-run-btn"
            onClick={onRun}
            disabled={isGenerating}
          >
            <Play size={14} fill="#ffffff" />
            <span>{isGenerating ? 'Running...' : '▷ Run'}</span>
          </button>

          {/* Cancel button */}
          <button
            type="button"
            className="comfy-cancel-btn"
            onClick={onCancel}
            title="Cancel execution"
          >
            <X size={14} />
          </button>

          {/* Status Badge */}
          <div className="comfy-active-badge">
            {isGenerating ? '1 active' : 'Idle'}
          </div>

          {/* Right Inspector Toggle */}
          <button
            type="button"
            className={`comfy-window-btn ${inspectorOpen ? 'active' : ''}`}
            onClick={() => setInspectorOpen(!inspectorOpen)}
            title="Toggle Process Inspector"
            style={{
              padding: '6px 8px',
              border: '1px solid var(--comfy-border)',
              background: inspectorOpen ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: inspectorOpen ? '#38bdf8' : 'var(--comfy-text-dim)'
            }}
          >
            <PanelRight size={15} />
          </button>
        </div>
      </div>
    </>
  );
}
