import { useEffect, useMemo, useRef, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:3000';
type Msg = { role: 'user' | 'assistant'; content: string };

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: 'Henry Chat ready — ask me anything.' }
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<'idle'|'sending'|'waiting'|'done'|'error'>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const t0 = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    if (!busy) { setElapsedMs(0); t0.current = null; return; }
    t0.current = performance.now();
    const id = setInterval(()=>{ if (t0.current!=null) setElapsedMs(performance.now()-t0.current); }, 100);
    return ()=>clearInterval(id);
  }, [busy]);

  const status = useMemo(() => {
    const s = (elapsedMs/1000).toFixed(1)+'s';
    if (phase==='sending') return `Sending… ${s}`;
    if (phase==='waiting') return `Waiting for server… ${s}`;
    if (phase==='error')   return `Error (${s})`;
    if (phase==='done')    return `Done in ${(elapsedMs/1000).toFixed(1)}s`;
    return 'Idle';
  }, [phase, elapsedMs]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: 'user' as const, content: text }];
    setMessages(next);
    setInput('');
    setBusy(true);
    setPhase('sending');
    try {
      await new Promise(r=>setTimeout(r,50));
      setPhase('waiting');
      const res = await fetch(`${API_BASE}/chat/stream`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ messages: next })
      });
      if (!res.ok || !res.body) throw new Error('stream failed');
      const reader = res.body.getReader();
      const td = new TextDecoder();
      let acc=''; let carry=''; let leftover='';
      function handlePayload(raw:string){
        const payload = raw.trim();
        if (!payload || payload==='[DONE]') return;
        if (payload.startsWith('{')) {
          carry += payload;
          try {
            const obj = JSON.parse(carry);
            const piece = obj?.choices?.[0]?.delta?.content ?? obj?.choices?.[0]?.message?.content ?? obj?.text ?? '';
            acc += (piece||''); setMessages([...next, { role:'assistant', content: acc }]); carry='';
          } catch { /* wait for more */ }
          return;
        }
        acc += payload; setMessages([...next, { role:'assistant', content: acc }]);
      }
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = td.decode(value, { stream:true });
        const textChunk = leftover + chunk;
        const lines = textChunk.split('\n');
        leftover = lines.pop() ?? '';
        for (const line of lines) {
          const t = line.trim();
          if (!t) continue;
          if (t.startsWith('data:')) handlePayload(t.slice(5));
        }
      }
      if (leftover.startsWith('data:')) handlePayload(leftover.slice(5));
      setPhase('done');
    } catch (e:any) {
      setMessages([...next, { role:'assistant', content:`Error: ${e?.message||e}` }]);
      setPhase('error');
    } finally { setBusy(false); }
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div style={{height:'100%', display:'flex', flexDirection:'column'}}>
      <header style={{padding:'12px 16px', borderBottom:'1px solid #ddd', display:'flex', gap:8, alignItems:'baseline', justifyContent:'space-between'}}>
        <strong>Henry Chat</strong>
        <span style={{opacity:.6}}>{API_BASE}</span>
        <span style={{opacity:.8}}>{busy?'⏳ ':'✅ '}{status}</span>
      </header>
      <div ref={listRef} style={{flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:8}}>
        {messages.map((m,i)=>(
          <div key={i} style={{maxWidth:720, lineHeight:1.5, padding:'10px 12px', borderRadius:12, border:'1px solid #e5e5e5',
                               background: m.role==='user' ? '#eef5ff' : '#f7f7f7',
                               alignSelf: m.role==='user' ? 'flex-end' : 'flex-start'}}>
            <div style={{fontSize:11, opacity:.55, marginBottom:4, textTransform:'uppercase', letterSpacing:.3}}>{m.role}</div>
            <div>{m.content}</div>
          </div>
        ))}
      </div>
      <footer style={{padding:12, borderTop:'1px solid #ddd', display:'flex', gap:8}}>
        <input placeholder={busy?'Thinking…':'Type a message and press Enter'} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={onKey} disabled={busy}
               style={{flex:1, padding:'10px 12px', borderRadius:8, border:'1px solid #ccc'}} />
        <button onClick={send} disabled={busy || !input.trim()} style={{padding:'10px 14px', borderRadius:8, border:'1px solid #ccc', background:'#fff', cursor:'pointer'}}>
          {busy?'Sending…':'Send'}
        </button>
      </footer>
    </div>
  );
}
