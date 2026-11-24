import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, ArrowUpRight, Image as ImageIcon, SlidersHorizontal, History, Download, Upload, X, Wand2, Layers, Volume2, Loader2, RefreshCw } from 'lucide-react';
import { fetchHealth, enhancePrompt, generateImage, generateSlerp, critiqueGeneration, fetchHistory, clearHistory } from './services/api';
import './studio.css';

const ideas = [
  ['Architecture', 'A tranquil concrete house nestled in a lush Japanese garden, soft morning light, architectural photography'],
  ['Dreamscape', 'An island floating above a sea of clouds, tiny wildflowers, warm sunset, cinematic dreamscape'],
  ['Product', 'A sculptural amber glass perfume bottle on warm sandstone, dramatic studio lighting, editorial product photography'],
];
const modes = [['t2i', 'Text to image', Sparkles], ['img2img', 'Image to image', ImageIcon], ['slerp', 'Seed exploration', Layers]];
export default function App() {
  const [mode, setMode] = useState('t2i');
  const [prompt, setPrompt] = useState('');
  const [negative, setNegative] = useState('');
  const [steps, setSteps] = useState(2);
  const [seed, setSeed] = useState('42');
  const [seedB, setSeedB] = useState('999');
  const [strength, setStrength] = useState(0.6);
  const [reference, setReference] = useState(null);
  const [lora, setLora] = useState('');
  const [scale, setScale] = useState(0.8);
  const [result, setResult] = useState(null);
  const [frames, setFrames] = useState([]);
  const [frame, setFrame] = useState(0);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('studio');
  const [health, setHealth] = useState(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [enhancement, setEnhancement] = useState(null);
  const [report, setReport] = useState(null);
  const lock = useRef(false);
  const maxLength = mode === 'slerp' ? 500 : 1000;
  const image = frames.length ? frames[frame]?.image : result?.image;
  const valid = prompt.trim().length >= 2 && prompt.length <= maxLength && (mode !== 'img2img' || reference);
  async function checkHealth() {
    setChecking(true);
    try { setHealth(await fetchHealth()); } catch { setHealth(null); }
    finally { setChecking(false); }
  }
  useEffect(() => { checkHealth(); fetchHistory().then(d => setHistory(d.history || [])).catch(() => {}); }, []);
  function editPrompt(value) { setPrompt(value); setEnhancement(null); }
  async function task(name, fn) {
    if (lock.current) return;
    lock.current = true; setBusy(name); setError('');
    try { await fn(); } catch (e) { setError(e.message || 'Something went wrong. Please try again.'); }
    finally { lock.current = false; setBusy(''); }
  }
  async function generate() {
    if (!valid) return;
    await task('Generating your image', async () => {
      if (mode === 'slerp') {
        const data = await generateSlerp({ prompt: prompt.trim(), seed_a: Number(seed || 0), seed_b: Number(seedB || 0), num_frames: 4, steps });
        setFrames(data.frames || []); setFrame(0); setResult(null);
      } else {
        const data = await generateImage({ prompt: prompt.trim(), negative_prompt: negative.trim() || null, steps, seed: seed === '' ? null : Number(seed), lora_path: lora.trim() || null, lora_scale: scale, init_image: mode === 'img2img' ? reference : null, strength, compare_side_by_side: false });
        setResult(data); setFrames([]);
        try { const data = await fetchHistory(); setHistory(data.history || []); }
        catch { setError('Your image is ready, but session history could not refresh.'); }
      }
      setReport(null);
    });
  }
  function upload(event) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) { setError('Choose a PNG, JPG or WebP image smaller than 10 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => { setReference(reader.result); setError(''); };
    reader.onerror = () => setError('Could not read this image. Please try another file.');
    reader.readAsDataURL(file);
  }
  const numberInput = (value, setter, label) => <label className="field">{label}<input type="number" min="0" max="4294967295" step="1" value={value} onChange={e => setter(e.target.value)} onBlur={() => { if (value !== '') setter(String(Math.min(4294967295, Math.max(0, Math.floor(Number(value) || 0))))); }} placeholder="Random" /></label>;
  return <div className="studio-app">
    <header className="app-header"><a className="brand" href="#" onClick={e => { e.preventDefault(); setTab('studio'); }}><span className="brand-icon"><Sparkles size={20}/></span>GenStudio<span className="brand-tag">LOCAL AI</span></a>
      <nav aria-label="Main navigation"><button className={tab === 'studio' ? 'nav-active' : ''} onClick={() => setTab('studio')}><Wand2 size={15}/>Create</button><button className={tab === 'history' ? 'nav-active' : ''} onClick={() => setTab('history')}><History size={15}/>History<span className="count">{history.length}</span></button></nav>
      <button className="connection" onClick={checkHealth} disabled={checking}><span className={`status-dot ${health ? 'online' : ''}`}/>{checking ? 'Connecting…' : health ? 'Local engine connected' : 'Engine offline'}<RefreshCw size={12}/></button>
    </header>
    <main>
      <div className="page-heading"><div><div className="eyebrow">YOUR PERSONAL CREATIVE SPACE</div><h1>{tab === 'studio' ? 'A little imagination. Endless possibilities.' : 'Your creative history.'}</h1><p>{tab === 'studio' ? 'Turn an idea into something you can see. Created locally, entirely yours.' : 'Revisit images from this backend session and bring an idea back to the canvas.'}</p></div><span className="model-label"><span className="model-dot"/> SD-Turbo <span> / 512 × 512</span></span></div>
      {!checking && !health && <div className="notice">The local engine is unavailable. Start the backend to generate images. <button onClick={checkHealth}>Retry connection</button></div>}
      {error && <div className="error" role="alert">{error}<button aria-label="Dismiss error" onClick={() => setError('')}><X size={16}/></button></div>}
      {tab === 'studio' ? <div className="workspace">
        <section className="editor panel"><div className="panel-heading"><span><SlidersHorizontal size={16}/> Creation settings</span><span className="small-tag">01</span></div>
          <fieldset disabled={!!busy}><div className="mode-tabs" role="group" aria-label="Generation mode">{modes.map(([id, title, Icon]) => <button key={id} className={mode === id ? 'selected' : ''} onClick={() => { setMode(id); setEnhancement(null); }} aria-pressed={mode === id}><Icon size={15}/>{title}</button>)}</div>
          <div className="prompt-label"><label htmlFor="prompt">Your prompt</label><span>Start with an idea</span></div>
          <textarea id="prompt" value={prompt} maxLength={maxLength} onChange={e => editPrompt(e.target.value)} placeholder="A quiet cabin beside a mountain lake, soft morning mist, warm light through the windows…"/>
          <div className="prompt-footer"><span className={prompt.length > maxLength ? 'invalid' : ''}>{prompt.length} / {maxLength}</span><button className="text-button" disabled={prompt.trim().length < 2 || !health?.ollama?.connected} title={!health?.ollama?.connected ? 'Connect Ollama to enhance prompts' : 'Enhance using local AI'} onClick={() => task('Enhancing your prompt', async () => setEnhancement(await enhancePrompt(prompt)))}><Sparkles size={13}/>Enhance prompt</button></div>
          {enhancement && <div className="enhancement"><strong>Suggested prompt</strong><p>{enhancement.enhanced_prompt}</p><button className="text-button" disabled={enhancement.enhanced_prompt?.length > maxLength} onClick={() => editPrompt(enhancement.enhanced_prompt)}>Use this prompt <ArrowUpRight size={13}/></button><button className="text-button" onClick={() => setEnhancement(null)}>Dismiss</button></div>}
          {mode === 'img2img' && <div className="reference"><label className="upload"><Upload size={18}/>{reference ? 'Replace reference image' : 'Upload a reference image'}<small>PNG, JPG or WebP · Up to 10 MB</small><input aria-label="Reference image" type="file" accept="image/png,image/jpeg,image/webp" onChange={upload}/></label>{reference && <div className="reference-preview"><img src={reference} alt="Reference for generation"/><button aria-label="Remove reference" onClick={() => setReference(null)}><X size={15}/></button></div>}<label className="field">Transformation strength <span>{strength.toFixed(2)}</span><input type="range" min="0.1" max="1" step="0.05" value={strength} onChange={e => setStrength(Number(e.target.value))}/></label></div>}
          <div className="section-divider"/>
          <div className="setting-heading">Make it yours<span>Generation controls</span></div>
          <div className="settings-grid"><label className="field">Inference steps<select value={steps} onChange={e => setSteps(Number(e.target.value))}>{[1,2,3,4].map(n => <option key={n} value={n}>{n} {n === 1 ? 'step' : 'steps'}{n === 2 ? ' · Recommended' : ''}</option>)}</select></label>{numberInput(seed, setSeed, mode === 'slerp' ? 'Starting seed' : 'Seed')}</div>
          {mode === 'slerp' ? <>{numberInput(seedB, setSeedB, 'Ending seed')}<p className="helper">Explore four variations between two seeds using spherical interpolation.</p></> : <details><summary>Advanced settings <SlidersHorizontal size={13}/></summary><label className="field">Negative prompt<input value={negative} onChange={e => setNegative(e.target.value)} placeholder="Elements to avoid"/></label><label className="field">LoRA adapter path<input value={lora} onChange={e => setLora(e.target.value)} placeholder="Optional local .safetensors path"/></label>{lora && <label className="field">Adapter strength · {scale.toFixed(2)}<input type="range" min="0" max="1" step="0.05" value={scale} onChange={e => setScale(Number(e.target.value))}/></label>}</details>}
          <button className="generate-button" disabled={!valid || !health} onClick={generate}>{busy ? <Loader2 className="spin" size={18}/> : <Sparkles size={18}/>} {busy || (mode === 'slerp' ? 'Explore seeds' : 'Generate image')}<ArrowUpRight size={18}/></button>
          <p className="generation-note">{mode === 'img2img' && !reference ? 'Add a reference image to get started.' : 'Powered by your local engine. Your ideas stay private.'}</p></fieldset>
        </section>
        <section className="preview panel"><div className="panel-heading"><span><ImageIcon size={16}/> Your canvas</span><span className="small-tag">{busy ? 'WORKING' : image ? 'GENERATED' : 'READY WHEN YOU ARE'}</span></div>
          <div className={`canvas ${image ? 'has-image' : ''}`} aria-live="polite">{image ? <img className="generated-image" src={image} alt={result?.prompt || 'Generated seed exploration frame'}/> : <div className="canvas-empty"><div className="art-mark"><div/><div/><div/><Sparkles size={31}/></div><span className="eyebrow">FROM THOUGHT TO FRAME</span><h2>Make room for your next idea.</h2><p>Describe what you imagine.<br/>We’ll take it from there.</p><span className="canvas-spec">512 × 512 <span>·</span> LOCAL GENERATION</span></div>}{busy && <div className="loading-overlay" role="status"><Loader2 className="spin" size={30}/><strong>{busy}…</strong><span>Local model loading and inference can take a moment.</span></div>}</div>
          {frames.length > 0 && <div className="frames">{frames.map((f,i) => <button key={i} aria-label={`View frame ${i+1}`} aria-pressed={frame === i} className={frame === i ? 'active' : ''} onClick={() => setFrame(i)}><img src={f.image} alt=""/>λ {Number(f.lambda).toFixed(2)}</button>)}</div>}
          <div className="canvas-footer"><span><span className="status-dot online"/>{image ? 'Ready to make it yours' : 'Your next creation starts with a prompt'}</span>{image && <a className="download" href={image} download={`genstudio-${result?.id || `frame-${frame+1}`}.jpg`}><Download size={14}/>Download</a>}</div>
          {result && <div className="result-details"><p>{result.caption}</p><div className="result-actions"><span>CLIP {result.clip_score?.toFixed(3) ?? '—'} · {result.generation_time}s</span><button disabled={!('speechSynthesis' in window)} onClick={() => { window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(result.caption)); }}><Volume2 size={14}/>Read caption</button><button disabled={!!busy || !health?.ollama?.connected} onClick={() => task('Reviewing your image', async () => { const data = await critiqueGeneration(result); setReport(data); })}><Wand2 size={14}/>Review with AI</button></div>{report && <div className="enhancement"><p>{report.critique}</p><button className="text-button" disabled={!!busy} onClick={() => { setMode('t2i'); editPrompt(report.refined_prompt); setNegative(report.negative_prompt || ''); setReport(null); }}>Use refined prompt <ArrowUpRight size={13}/></button></div>}</div>}
        </section>
        <section className="inspiration"><div><span className="eyebrow">A SPARK TO GET STARTED</span><h3>Where will your imagination go?</h3></div><div className="idea-grid">{ideas.map(([name,text], i) => <button key={name} disabled={!!busy} className={`idea idea-${i}`} onClick={() => editPrompt(text)}><span className="idea-symbol">{i === 0 ? '⌂' : i === 1 ? '✧' : '◉'}</span><span><strong>{name}</strong><small>{['Spaces with a story', 'Beyond the everyday', 'Objects in a new light'][i]}</small></span><ArrowUpRight size={17}/></button>)}</div></section>
      </div> : <section className="history-panel panel"><div className="panel-heading"><span><History size={16}/>Session history · {history.length}</span><button disabled={!history.length || !!busy} onClick={() => task('Clearing history', async () => { await clearHistory(); setHistory([]); })}>Clear history</button></div>{history.length ? <div className="history-grid">{history.map((entry,i) => <button className="history-card" key={entry.id || i} disabled={!!busy} onClick={() => { setResult(entry); setFrames([]); setReport(null); setTab('studio'); }}><img src={entry.image} alt={entry.prompt}/><strong>{entry.prompt}</strong><small>View image <ArrowUpRight size={13}/></small></button>)}</div> : <div className="history-empty"><History size={32}/><h2>A fresh start.</h2><p>Your generated images will appear here for this session.</p><button className="text-button" onClick={() => setTab('studio')}>Create your first image <ArrowUpRight size={15}/></button></div>}</section>}
      <footer className="app-footer"><span>GenStudio <span> / </span> An open space for imagination.</span><span>LOCAL FIRST. CREATIVITY ALWAYS.</span></footer>
    </main>
  </div>;
}
