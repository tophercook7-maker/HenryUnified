import { useEffect, useRef, useState } from "react";

type Msg = { role:"user"|"assistant"|"system"; text:string; sources?:string[] };

export default function App(){
  const [health,setHealth]=useState<{provider?:string;model?:string;chunks?:number;ok?:boolean}|null>(null);
  const [msgs,setMsgs]=useState<Msg[]>([
    {role:"assistant",text:"Hi Topher — Henry here. What do you want to do?"}
  ]);
  const [q,setQ]=useState("");
  const [citeOnly,setCiteOnly]=useState(false);
  const [showSources,setShowSources]=useState(false);
  const [voiceOn,setVoiceOn]=useState<boolean>(()=>{try{return !!JSON.parse(localStorage.getItem("henry.voiceOn")||"true");}catch{return true;}});
  const scrollerRef=useRef<HTMLDivElement>(null);
  const sendingRef=useRef(false);

  useEffect(()=>{(async()=>{
    try{ const r=await fetch("/health"); const j=await r.json(); setHealth(j); }
    catch{ setHealth({provider:"offline",ok:false}); }
  })()},[]);
  useEffect(()=>{ scrollerRef.current?.scrollTo({top:1e9,behavior:"smooth"}); },[msgs]);

  async function ask(query:string){
    const text=query.trim(); if(!text||sendingRef.current) return;
    sendingRef.current=true; setMsgs(m=>[...m,{role:"user",text}]); setQ("");
    try{
      const r=await fetch(`${import.meta.env.VITE_API_URL}/ask`, {method:"POST",headers:{"content-type":"application/json"},body: JSON.stringify({query:text})});
      const j=await r.json();
      if(j?.error){ setMsgs(m=>[...m,{role:"assistant",text:`(error) ${j.error}`}]); }
      else {
        const answer = (j?.answer||j?.text||"").trim() || "I answered based on your settings.";
        const srcs = Array.isArray(j?.sources)? j.sources.map((s:any)=>String(s?.doc||s?.ref||"").split("/").pop()).filter(Boolean): [];
        setMsgs(m=>[...m,{role:"assistant",text:answer,sources:srcs}]);
      }
    }catch(e:any){ setMsgs(m=>[...m,{role:"assistant",text:`(network) ${e?.message||String(e)}`}]); }
    finally{ sendingRef.current=false; }
  }

  function onKey(e:React.KeyboardEvent<HTMLTextAreaElement>){
    if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); ask(q); }
  }

  const quick = [
    "Summarize Genesis 1 in 5 sentences.",
    "Find passages on wisdom and cite sources.",
    "Create an outline for a sermon on hope.",
    "Explain differences between Gospels (cite only my files)."
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">Henry AI</div>
        <div className="pill"><span className="dot"/> {(health?.ok!==false)?"online":"offline"}</div>
        <div style={{marginTop:8,color:"#9aa8bf",fontSize:12}}>
          {(health?.provider||"provider")}{health?.model?` • ${health.model}`:""}{health?.chunks?` • chunks:${health.chunks}`:""}
        </div>
      </aside>

      <header className="header">
        <span className="badge">openai · chunks:{health?.chunks??"-"}</span>
        <span className="badge">{health?.model??"model"}</span>
        <span className="badge" style={{cursor:"pointer"}} onClick={()=>setShowSources(s=>!s)}>
          {showSources?"Hide":"Show"} sources
        </span>
        <span className="badge" style={{cursor:"pointer"}} onClick={()=>{setVoiceOn(v=>{localStorage.setItem("henry.voiceOn", JSON.stringify(!v)); return !v;});}}>
          {voiceOn?"Voice: On":"Voice: Off"}
        </span>
      </header>

      <main className="main" ref={scrollerRef}>
        <div className="quick">
          {quick.map((t,i)=>(<button key={i} onClick={()=>ask(t)}>{t}</button>))}
        </div>

        {msgs.map((m,i)=>(
          <div key={i} className={"message "+(m.role==="user"?"user":m.role==="system"?"sys":"")}>
            <div className="bubble">{m.text}</div>
            {(m.sources && m.sources.length>0 && showSources) && (
              <div className="sources show" style={{marginTop:8}}>
                Sources: {m.sources.slice(0,10).join(", ")}
              </div>
            )}
          </div>
        ))}

        <div className="controls">
          <label><input type="checkbox" checked={citeOnly} onChange={e=>setCiteOnly(e.target.checked)} /> Cite only my files</label>
        </div>
      </main>

      <div className="composerWrap">
        <div className="composer">
          <textarea className="input" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={onKey}
            placeholder="Type and press Enter... (Shift+Enter for newline)"/>
          <button className="send" onClick={()=>ask(q)}>Send</button>
        </div>
      </div>
    </div>
  );
}

import { speak } from "./voice";
