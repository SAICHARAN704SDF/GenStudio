import React from 'react';
import { History, Trash2, ArrowUpRight, Award, Clock } from 'lucide-react';

export default function HistoryTable({ history, onSelectEntry, onClearHistory }) {
  if (!history || history.length === 0) {
    return (
      <div className="history-section">
        <div className="card-title-row">
          <span className="card-title">
            <History size={18} color="#6366f1" />
            Evaluation & Monitoring Telemetry
          </span>
        </div>
        <p style={{ color: 'var(--text-dim)', fontSize: '13px', marginTop: '12px' }}>
          No generations recorded in this session yet. Synthesize an image above to log evaluation metrics.
        </p>
      </div>
    );
  }

  return (
    <div className="history-section">
      <div className="card-title-row">
        <span className="card-title">
          <History size={18} color="#6366f1" />
          Evaluation & Monitoring Telemetry ({history.length} logged)
        </span>
        <button
          className="btn-secondary"
          onClick={onClearHistory}
          style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--accent-rose)' }}
        >
          <Trash2 size={13} />
          <span>Clear Session</span>
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="history-table">
          <thead>
            <tr>
              <th>Preview</th>
              <th>Prompt Conditioning</th>
              <th>BLIP Perception Caption</th>
              <th>CLIP Alignment</th>
              <th>Latency</th>
              <th>LoRA</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item, idx) => (
              <tr key={item.id || idx}>
                <td>
                  <img src={item.image} alt={item.prompt} className="table-thumb" />
                </td>
                <td style={{ maxWidth: '280px' }}>
                  <div style={{ fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.prompt}
                  </div>
                  {item.enhanced_prompt && (
                    <div style={{ fontSize: '11px', color: '#06b6d4', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      RAG Enhanced: {item.enhanced_prompt}
                    </div>
                  )}
                </td>
                <td style={{ maxWidth: '240px', color: 'var(--text-muted)' }}>
                  &ldquo;{item.caption}&rdquo;
                </td>
                <td>
                  <span className={`clip-badge ${item.badge_color || 'blue'}`} style={{ fontSize: '11px' }}>
                    {item.clip_score?.toFixed(3)}
                  </span>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-dim)' }}>
                  {item.generation_time}s
                </td>
                <td>
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: item.lora_path ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-input)',
                    color: item.lora_path ? '#a5b4fc' : 'var(--text-dim)',
                  }}>
                    {item.lora_path ? `LoRA (${item.lora_scale})` : 'Base (0.0)'}
                  </span>
                </td>
                <td>
                  <button
                    className="speech-btn"
                    onClick={() => onSelectEntry(item)}
                    title="Load into Canvas"
                    style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>View</span>
                    <ArrowUpRight size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
