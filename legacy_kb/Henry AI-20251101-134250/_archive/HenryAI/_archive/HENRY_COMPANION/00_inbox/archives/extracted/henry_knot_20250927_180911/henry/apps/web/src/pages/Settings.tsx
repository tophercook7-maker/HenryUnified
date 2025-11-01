import { useEffect, useState } from 'react';
const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:3000';

export default function Settings(){
  const [model, setModel] = useState('gpt-4o-mini');
  const [masked, setMasked] = useState<string|null>(null);
  const [portal, setPortal] = useState<string>('not set');
  const [key, setKey] = useState('');

  useEffect(()=>{ (async()=>{
    const r = await fetch(`${API_BASE}/settings`);
    const s = await r.json();
    setModel(s.OPENAI_MODEL || 'gpt-4o-mini');
    setMasked(s.OPENAI_API_KEY);
    setPortal(s.STRIPE_PORTAL_URL ? 'set' : 'not set');
  })(); },[]);

  async function save(){
    const body:any = { OPENAI_MODEL: model };
    if (key.trim()) body.OPENAI_API_KEY = key.trim();
    const r = await fetch(`${API_BASE}/settings`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if (r.ok){ setKey(''); alert('Saved'); } else { alert('Save failed'); }
  }

  async function savePortal(){
    const url = prompt('Paste your Stripe customer portal URL');
    if (!url) return;
    const r = await fetch(`${API_BASE}/settings`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ STRIPE_PORTAL_URL: url }) });
    if (r.ok){ setPortal('set'); alert('Portal saved'); } else { alert('Save failed'); }
  }

  return (
    <div style={{padding:16, display:'grid', gap:12, maxWidth:640}}>
      <h2>Settings</h2>
      <label>Model
        <input value={model} onChange={e=>setModel(e.target.value)} style={{width:'100%', padding:'10px 12px', border:'1px solid #ccc', borderRadius:8}} />
      </label>
      <label>OpenAI API Key {masked ? `(${masked})` : '(none)'}
        <input value={key} onChange={e=>setKey(e.target.value)} placeholder="sk-..." style={{width:'100%', padding:'10px 12px', border:'1px solid #ccc', borderRadius:8}} />
      </label>
      <div style={{display:'flex', gap:8}}>
        <button onClick={save} style={{padding:'10px 14px', border:'1px solid #ccc', borderRadius:8, background:'#fff', cursor:'pointer'}}>Save</button>
        <button onClick={savePortal} style={{padding:'10px 14px', border:'1px solid #ccc', borderRadius:8, background:'#fff', cursor:'pointer'}}>Set Billing Portal</button>
      </div>
      <div style={{opacity:.7}}>Billing portal: {portal}</div>
    </div>
  );
}
