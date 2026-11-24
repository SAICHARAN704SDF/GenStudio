import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Download, Volume2, Sparkles, BrainCircuit, RefreshCw, Image as ImageIcon, Award } from 'lucide-react';

export default function SaveImageNode({ data }) {
  const {
    result,
    slerpResult,
    isGenerating,
    onCritiqueAndRefine,
    isCritiquing,
    criticReport,
  } = data;

  const [slerpIndex, setSlerpIndex] = useState(0);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const isActive = data.activeNode === 'save_image';
  const isCompleted = data.completedNodes?.includes('save_image');

  useEffect(() => {
    if (result?.caption && autoSpeak) {
      speakCaption(result.caption);
    }
  }, [result?.id]);

  const speakCaption = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const downloadImage = (dataUrl, filename = 'comfy-genstudio-output.jpg') => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`comfy-node ${isActive ? 'node-active' : ''} ${isCompleted ? 'node-completed' : ''}`} style={{ minWidth: '380px' }}>
      <div className="comfy-node-header" style={{ borderTop: '3px solid var(--socket-image)' }}>
        <div className="comfy-node-header-left">
          <ImageIcon size={13} color="var(--socket-image)" />
          <span>Save Image & Multimodal Evaluation</span>
        </div>
        <span className="comfy-node-badge" style={{ background: 'rgba(34, 197, 94, 0.2)', color: 'var(--socket-image)' }}>
          Output & Metrics
        </span>
      </div>

      <div className="comfy-node-body">
        {/* Input Socket: images */}
        <div style={{ position: 'relative', marginBottom: '8px' }}>
          <div className="comfy-socket-row">
            <Handle
              type="target"
              position={Position.Left}
              id="images"
              className="comfy-handle"
              style={{ background: 'var(--socket-image)', top: '10px' }}
            />
            <span className="socket-label-left" style={{ color: 'var(--socket-image)' }}>images</span>
          </div>
        </div>

        {/* Display Canvas or Loading State */}
        <div style={{
          width: '100%',
          minHeight: '260px',
          background: 'var(--comfy-bg-input)',
          border: '1px solid var(--comfy-border)',
          borderRadius: '6px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {isGenerating && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={28} color="#3b82f6" className="spin" />
              <span style={{ fontSize: '11px', color: '#9ba1ad' }}>Sampling on Apple Silicon MPS...</span>
            </div>
          )}

          {!isGenerating && !result && !slerpResult && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '24px', textAlign: 'center' }}>
              <ImageIcon size={32} color="#4b5563" />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#9ba1ad' }}>Queue is Empty</span>
              <span style={{ fontSize: '10px', color: '#6b7280' }}>Click "▷ Run" to execute graph on MPS</span>
            </div>
          )}

          {/* Slerp Manifold Frame */}
          {!isGenerating && slerpResult && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '8px' }}>
              <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>
                Latent Slerp: {slerpResult.frames?.length} Interpolated States
              </div>
              {slerpResult.frames?.[slerpIndex] && (
                <img
                  src={slerpResult.frames[slerpIndex].image}
                  alt={`Slerp frame ${slerpIndex}`}
                  style={{ width: '100%', maxWidth: '340px', borderRadius: '4px', border: '1px solid var(--comfy-border)' }}
                />
              )}
              {/* Scrub Slider */}
              <div style={{ width: '100%', padding: '0 8px' }}>
                <input
                  type="range"
                  min="0"
                  max={(slerpResult.frames?.length || 1) - 1}
                  step="1"
                  value={slerpIndex}
                  onChange={(e) => setSlerpIndex(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#06b6d4' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#9ba1ad' }}>
                  <span>Seed A (λ=0.0)</span>
                  <span>Midpoint (λ=0.5)</span>
                  <span>Seed B (λ=1.0)</span>
                </div>
              </div>
            </div>
          )}

          {/* Single Image Result */}
          {!isGenerating && result && !slerpResult && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <img
                src={result.image}
                alt="Output"
                style={{ width: '100%', maxHeight: '340px', objectFit: 'contain' }}
              />

              {/* Download Overlay Pill */}
              <button
                type="button"
                onClick={() => downloadImage(result.image)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'rgba(0,0,0,0.7)',
                  border: '1px solid var(--comfy-border)',
                  color: '#ffffff',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Download size={11} />
                Save
              </button>
            </div>
          )}
        </div>

        {/* Multimodal Perception: BLIP Caption + Audio TTS */}
        {result?.caption && (
          <div style={{
            background: 'var(--comfy-bg-input)',
            border: '1px solid var(--comfy-border)',
            borderRadius: '6px',
            padding: '8px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#a5b4fc' }}>
                BLIP Vision Caption (Vision &rarr; Text):
              </span>
              <button
                type="button"
                onClick={() => speakCaption(result.caption)}
                style={{
                  background: 'transparent',
                  color: '#38bdf8',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <Volume2 size={11} />
                Speak
              </button>
            </div>
            <div style={{ fontSize: '11px', color: '#e2e8f0', fontStyle: 'italic' }}>
              "{result.caption}"
            </div>
          </div>
        )}

        {/* Objective Evaluation: CLIP Score Badge */}
        {result?.clip_score !== undefined && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--comfy-bg-input)',
            border: '1px solid var(--comfy-border)',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '11px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Award size={13} color="#34d399" />
              <span style={{ color: '#9ba1ad' }}>OpenCLIP Alignment:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: result.badge_color || '#34d399' }}>
                {(result.clip_score).toFixed(3)}
              </span>
            </div>
            <span style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(52, 211, 153, 0.15)',
              color: result.badge_color || '#34d399',
              fontWeight: 600
            }}>
              {result.clip_rating}
            </span>
          </div>
        )}

        {/* Autonomous AI Art Critic & Auto-Refine Action */}
        {result && (
          <div style={{ marginTop: '4px' }}>
            <button
              type="button"
              onClick={onCritiqueAndRefine}
              disabled={isCritiquing || isGenerating}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: 'rgba(99, 102, 241, 0.18)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: '#a5b4fc',
                padding: '7px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: isCritiquing ? 'wait' : 'pointer'
              }}
            >
              {isCritiquing ? (
                <>
                  <RefreshCw size={12} className="spin" />
                  <span>Agent Diagnosing Disparity (Ollama)...</span>
                </>
              ) : (
                <>
                  <BrainCircuit size={13} />
                  <span>🤖 AI Critic & Auto-Refine (RLVF Loop)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Critic Diagnosis Report Box */}
        {criticReport && (
          <div style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '6px',
            padding: '8px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            fontSize: '10px'
          }}>
            <div style={{ fontWeight: 700, color: '#c7d2fe' }}>Critic Diagnosis:</div>
            <div style={{ color: '#e0e7ff', lineHeight: 1.4 }}>{criticReport.critique}</div>
            <div style={{ color: '#34d399', marginTop: '2px' }}>
              &bull; <strong>Auto-Refined:</strong> {criticReport.refined_prompt.slice(0, 70)}...
            </div>
            {criticReport.negative_prompt && (
              <div style={{ color: '#f87171' }}>
                &bull; <strong>Targeted Negative:</strong> {criticReport.negative_prompt}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
