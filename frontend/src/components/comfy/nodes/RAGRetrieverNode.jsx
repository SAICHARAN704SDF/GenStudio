import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Database, Wand2, Sparkles, Check } from 'lucide-react';

export default function RAGRetrieverNode({ data }) {
  const { prompt, onEnhance, isEnhancing, enhancedData, onApplyEnhanced } = data;
  const isActive = data.activeNode === 'rag';
  const isCompleted = data.completedNodes?.includes('rag');

  return (
    <div className={`comfy-node ${isActive ? 'node-active' : ''} ${isCompleted ? 'node-completed' : ''}`} style={{ minWidth: '310px' }}>
      <div className="comfy-node-header" style={{ borderTop: '3px solid var(--socket-context)' }}>
        <div className="comfy-node-header-left">
          <Database size={13} color="var(--socket-context)" />
          <span>RAG Vector Retriever & Enhancer</span>
        </div>
        <span className="comfy-node-badge" style={{ background: 'rgba(6, 182, 212, 0.2)', color: 'var(--socket-context)' }}>
          MiniLM-L6-v2 + Ollama
        </span>
      </div>

      <div className="comfy-node-body">
        <p style={{ fontSize: '10px', color: 'var(--comfy-text-dim)', lineHeight: 1.4 }}>
          Dense vector search across 30 style/lighting embeddings via in-process cosine similarity.
        </p>

        {/* Enhance Button */}
        <button
          type="button"
          onClick={onEnhance}
          disabled={isEnhancing || !prompt.trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: 'rgba(6, 182, 212, 0.18)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            color: '#38bdf8',
            padding: '7px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: isEnhancing ? 'wait' : 'pointer'
          }}
        >
          {isEnhancing ? (
            <>
              <Sparkles size={13} className="spin" />
              <span>Retrieving & Ollama Synthesizing...</span>
            </>
          ) : (
            <>
              <Wand2 size={13} />
              <span>Run RAG Prompt Enhancement</span>
            </>
          )}
        </button>

        {/* Retrieved Snippets Preview */}
        {enhancedData?.retrieved_snippets && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '10px', color: 'var(--comfy-text-muted)' }}>Top Vector Matches:</span>
            <div className="comfy-chips-row">
              {enhancedData.retrieved_snippets.map((snip, i) => (
                <span
                  key={i}
                  className="comfy-chip"
                  style={{ borderColor: 'rgba(6, 182, 212, 0.3)', color: '#38bdf8' }}
                  title={snip.text}
                >
                  {snip.name} ({(snip.similarity_score * 100).toFixed(0)}%)
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={onApplyEnhanced}
              style={{
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                background: 'rgba(52, 211, 153, 0.15)',
                border: '1px solid rgba(52, 211, 153, 0.4)',
                color: '#34d399',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 600
              }}
            >
              <Check size={12} />
              <span>Apply to Positive Prompt Node</span>
            </button>
          </div>
        )}

        {/* Output Sockets */}
        <div style={{ borderTop: '1px solid var(--comfy-border)', paddingTop: '6px', marginTop: '4px' }}>
          <div className="comfy-socket-row">
            <span className="socket-label-right" style={{ color: 'var(--socket-context)' }}>CONTEXT</span>
            <Handle
              type="source"
              position={Position.Right}
              id="context"
              className="comfy-handle"
              style={{ background: 'var(--socket-context)', top: '10px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
