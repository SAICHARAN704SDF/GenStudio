/**
 * GenStudio Frontend API Service
 * Communicates with the FastAPI backend endpoints.
 */

const API_BASE = '/api';
function errorMessage(detail, fallback) {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map(item => `${item.loc?.slice(1).join('.') || 'Input'}: ${item.msg}`).join('; ');
  return fallback;
}

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function enhancePrompt(prompt, topK = 3) {
  const res = await fetch(`${API_BASE}/enhance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, top_k: topK }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorMessage(errorData.detail, 'Prompt enhancement failed'));
  }
  return res.json();
}

export async function generateImage(payload) {
  const res = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorMessage(errorData.detail, 'Image generation failed'));
  }
  return res.json();
}

export async function generateSlerp(payload) {
  const res = await fetch(`${API_BASE}/slerp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorMessage(errorData.detail, 'Slerp interpolation failed'));
  }
  return res.json();
}

export async function critiqueGeneration(payload) {
  const res = await fetch(`${API_BASE}/critique`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorMessage(errorData.detail, 'Critique agent failed'));
  }
  return res.json();
}

export async function fetchHistory() {
  const res = await fetch(`${API_BASE}/history`);
  if (!res.ok) throw new Error('Failed to load history');
  return res.json();
}

export async function clearHistory() {
  const res = await fetch(`${API_BASE}/history`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to clear history');
  return res.json();
}
