const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:3000';
export default function Billing(){
  async function openPortal(){
    const r = await fetch(`${API_BASE}/billing`);
    if (!r.ok){ alert('Portal not set yet in Settings'); return; }
    const j = await r.json();
    window.location.href = j.url;
  }
  return (
    <div style={{padding:16, display:'grid', gap:12}}>
      <h2>Pay</h2>
      <p>Open your billing portal to manage subscription and payment.</p>
      <button onClick={openPortal} style={{padding:'10px 14px', border:'1px solid #ccc', borderRadius:8, background:'#fff', cursor:'pointer'}}>Open Billing Portal</button>
    </div>
  );
}
