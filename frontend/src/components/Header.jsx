import React from 'react';
import { Cpu, Sparkles, BookOpen, Server } from 'lucide-react';

export default function Header({ health, onOpenVivaGuide }) {
  const isMps = health?.device === 'mps' || health?.mps_available;
  const isOllamaConnected = health?.ollama?.connected;

  return (
    <header className="studio-header">
      <div className="header-brand">
        <div className="brand-icon">
          <Sparkles size={24} color="#ffffff" />
        </div>
        <div>
          <h1 className="brand-title">GenStudio</h1>
          <p className="brand-subtitle">Interactive Generative AI Workbench &bull; Apple Silicon M3</p>
        </div>
      </div>

      <div className="header-meta">
        {/* Hardware Status */}
        <div className="status-badge" title="Apple Silicon Metal Performance Shaders (MPS)">
          <span className={`status-dot ${isMps ? 'active' : 'warning'}`}></span>
          <Cpu size={14} color="#a5b4fc" />
          <span>{isMps ? 'Apple Silicon (MPS float16)' : 'CPU Mode'}</span>
        </div>

        {/* Local Ollama Status */}
        <div className="status-badge" title="Local Ollama Inference Engine">
          <span className={`status-dot ${isOllamaConnected ? 'active' : 'warning'}`}></span>
          <Server size={14} color="#06b6d4" />
          <span>{isOllamaConnected ? 'Ollama (qwen2.5:3b)' : 'Ollama Offline'}</span>
        </div>

        {/* Viva Defense Cheat Sheet Modal Trigger */}
        <button className="btn-secondary" onClick={onOpenVivaGuide} style={{ fontSize: '12px', padding: '7px 12px' }}>
          <BookOpen size={14} color="#f59e0b" />
          <span>Viva Syllabus Guide</span>
        </button>
      </div>
    </header>
  );
}
