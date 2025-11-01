"use strict";
(function(){
  const box = document.getElementById("box");
  const send = document.getElementById("send");
  const msgs = document.getElementById("msgs");
  const dot  = document.getElementById("status-dot");
  const stx  = document.getElementById("status-text");
  const model= document.getElementById("model");
  const chunks = document.getElementById("chunks");
  const srcList = document.getElementById("srcList");

  function addMsg(text, me){
    const div = document.createElement("div");
    div.className = "msg" + (me ? " me" : "");
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }
  function setSources(arr){
    srcList.innerHTML = "";
    if(!Array.isArray(arr)) return;
    arr.forEach(s=>{
      const li = document.createElement("li");
      li.textContent = (s.doc || "unknown");
      srcList.appendChild(li);
    });
  }

  async function health(){
    try{
      const r = await fetch("/health");
      if(!r.ok) throw new Error(String(r.status));
      const j = await r.json();
      stx.textContent = "online";
      dot.className = "dot dot-ok";
      model.textContent = j.provider || (j.hasOpenAIKey?"openai":"local");
      chunks.textContent = j.chunks || 0;
    }catch(e){
      stx.textContent = "offline";
      dot.className = "dot dot-bad";
    }
  }

  async function ask(q){
    addMsg(q,true);
    try{
      const r = await fetch("/ask",{
        method:"POST",
        headers:{ "content-type":"application/json" },
        body: JSON.stringify({ query:q })
      });
      const j = await r.json();
      if(!j.ok) throw new Error(j.error || "error");
      addMsg(j.answer || "(no answer)", false);
      setSources(j.sources);
    }catch(e){
      addMsg("Error: " + (e && e.message ? e.message : String(e)), false);
    }
  }

  send.addEventListener("click",()=>{
    const q = box.value.trim(); if(!q) return;
    box.value = ""; ask(q);
  });
  box.addEventListener("keydown",(ev)=>{
    if(ev.key === "Enter" && !ev.shiftKey){
      ev.preventDefault();
      const q = box.value.trim(); if(!q) return;
      box.value = ""; ask(q);
    }
  });

  health();
})();
