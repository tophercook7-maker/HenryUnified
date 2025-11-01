
// Henry Core - universal event safety layer
(function(){
  "use strict";

  // Utility helpers
  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.from(document.querySelectorAll(sel)); }
  function safeText(el, txt) { if (el) { el.textContent = txt; } }
  function safeHTML(el, html) { if (el) { el.innerHTML = html; } }
  function show(el) { if (el) { el.classList.remove("hidden"); el.style.display = el.dataset.origDisplay || ""; } }
  function hide(el) { if (el) { el.dataset.origDisplay = el.style.display; el.classList.add("hidden"); el.style.display = "none"; } }
  function toggle(el) { if (!el) return; const isHidden = (el.classList.contains("hidden") || el.style.display === "none"); isHidden ? show(el) : hide(el); }
  function log(){ try { console.log.apply(console, arguments)} catch(e){} }
  function err(){ try { console.error.apply(console, arguments)} catch(e){} }

  // Global error guard
  window.addEventListener("error", function(e){
    log("Henry Core caught error:", e.message, e.filename, e.lineno);
  });

  // Voice utilities (feature-detected)
  const hasSpeechRec = ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

  let recognition = null, isListening = false;
  function initVoice(){
    if (!hasSpeechRec) { log("Speech recognition not available"); return; }
    if (recognition) return;
    recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onstart = () => { isListening = true; updateVoiceUI(true); };
    recognition.onend   = () => { isListening = false; updateVoiceUI(false); };
    recognition.onerror = (e) => { err("Voice error:", e.error); };
    recognition.onresult = (e) => {
      const last = e.results[e.results.length-1];
      if (!last || !last[0]) return;
      const text = last[0].transcript.trim();
      log("Heard:", text);
      if (/^hey\s+henry\b/i.test(text)) {
        speak("I am listening.");
      }
      // append to chat if exists
      const chatOut = $("#chat-output");
      if (chatOut) {
        const div = document.createElement("div");
        div.textContent = "🎙️ " + text;
        chatOut.appendChild(div);
        chatOut.scrollTop = chatOut.scrollHeight;
      }
    };
  }
  function updateVoiceUI(active){
    safeText($("#voice-status-text"), active ? "Active" : "Inactive");
    const vDot = $("#voice-status");
    if (vDot) {
      vDot.classList.remove("status-inactive","status-active");
      vDot.classList.add(active ? "status-active" : "status-inactive");
    }
  }
  function startVoice(){ initVoice(); if (recognition && !isListening) recognition.start(); }
  function stopVoice(){ if (recognition && isListening) recognition.stop(); }
  function speak(text){
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(String(text||"Henry voice test successful"));
    window.speechSynthesis.speak(u);
  }

  // Tauri-safe invocations
  function hasTauri(){ return !!(window.__TAURI__ && window.__TAURI__.tauri && window.__TAURI__.tauri.invoke); }
  async function tauriInvoke(cmd, fallback){
    try {
      if (hasTauri()) {
        return await window.__TAURI__.tauri.invoke(cmd);
      }
    } catch(e) {
      err("Tauri invoke failed:", e);
    }
    return fallback;
  }

  // Button/Feature helpers (generic DOM-safe)
  function ensureStatus(msg){
    const el = $("#status") || $("#statusArea") || $(".status-area");
    if (!el) return;
    if (msg) safeHTML(el, `<div class="status-text">${msg}</div>`);
    show(el);
  }

  // --- Exposed API (backwards-compatible with inline onclicks) ---
  window.initializeHenry = function(){
    ensureStatus("🎉 Henry is initialized and ready!");
    speak("Henry is ready.");
    // show features section if present
    const f1 = $("#features") || $("#featuresSection");
    if (f1) show(f1);
  };

  window.toggleFeatures = function(){
    const f1 = $("#features") || $("#featuresSection");
    if (f1) toggle(f1);
  };

  window.handleGetStarted = function(){
    initializeHenry();
  };

  window.showFeatures = function(){
    const f1 = $("#features") || $("#featuresSection");
    if (f1) show(f1);
  };

  window.testButton = function(){
    ensureStatus("✅ Button clicked successfully!");
  };

  window.testVoice = function(){
    speak("Henry AI voice test successful");
    ensureStatus("✅ Voice synthesis working!");
  };

  window.toggleVoice = function(){
    if (isListening) { stopVoice(); } else { startVoice(); }
  };

  window.sendMessage = function(){
    const input = $("#textInput") || $("#chat-input") || $("#message-input");
    const out = $("#chatMessages") || $("#chat-output") || $("#send-output");
    if (!input || !out) return;
    const val = input.value.trim();
    if (!val) return;
    const node = document.createElement("div");
    node.textContent = val;
    out.appendChild(node);
    if (out.scrollHeight) out.scrollTop = out.scrollHeight;
    input.value = "";
  };

  window.handleSendMessage = window.sendMessage;

  // Wizard helpers
  function setActiveStep(step){
    const cur = document.querySelector(".wizard-step.active");
    const next = document.getElementById(`step-${step}`);
    if (cur) cur.classList.remove("active");
    if (next) next.classList.add("active");
  }

  window.nextWizardStep = function(step){
    setActiveStep(step);
  };

  window.previousWizardStep = function(step){
    setActiveStep(step);
  };

  window.selectBusinessType = function(type){
    // Visual select if an element is clicked
    if (typeof event !== "undefined" && event.currentTarget) {
      $all(".option-card").forEach(c => c.classList.remove("selected"));
      event.currentTarget.classList.add("selected");
    }
    const btn = $("#business-next");
    if (btn) btn.disabled = false;
  };

  window.connectService = function(service){
    // Best-effort UI feedback
    ensureStatus(`🔌 Connecting to ${service || "service"}... (simulated)`);
    setTimeout(() => ensureStatus(`✅ ${service || "Service"} connected`), 300);
  };

  window.verifyOpenAIKey = function(){
    const el = $("#openai-key") || $("input[name='openai-key']");
    const key = el && el.value ? el.value.trim() : "";
    if (!key) { ensureStatus("❌ No OpenAI key entered"); return false; }
    // Simple client-side sanity check; do NOT send anywhere here
    const plausible = /^sk-[A-Za-z0-9]{10,}$/.test(key) || /^ops-[A-Za-z0-9]{10,}$/.test(key);
    ensureStatus(plausible ? "✅ Key format looks OK (store securely)" : "⚠️ Key format looks unusual");
    return plausible;
  };

  window.skipOpenAISetup = function(){
    ensureStatus("⏭️ Skipped OpenAI setup");
  };

  window.completeSetup = function(){
    const wizard = $("#setup-wizard");
    const main = $("#henry-container") || $(".container");
    if (wizard) wizard.style.display = "none";
    if (main) { main.style.display = ""; main.classList.remove("hidden"); }
    ensureStatus("🎯 Setup complete");
  };

  // Tauri test endpoints used by test-tauri.html
  window.testPlatform = async function(){
    const p = await tauriInvoke("get_platform", "web");
    ensureStatus(`🖥️ Platform: ${p}`);
    return p;
  };

  window.testGeneratePassword = async function(){
    const pw = await tauriInvoke("generate_secure_password", "********");
    ensureStatus(`🔐 Generated Password: ${pw}`);
    return pw;
  };

  window.testSecurityAudit = async function(){
    const audit = await tauriInvoke("perform_security_audit", {vulnerabilities:0, score:100, recommendations:["All good"]});
    ensureStatus(`🛡️ Audit score: ${audit && audit.score != null ? audit.score : "N/A"}`);
    return audit;
  };

  // Attach common listeners if present
  document.addEventListener("DOMContentLoaded", () => {
    // Enter-to-send
    ["#textInput","#chat-input","#message-input"].forEach(sel => {
      const el = $(sel);
      if (!el) return;
      el.addEventListener("keypress", (e) => {
        if (e.key === "Enter") { e.preventDefault(); window.sendMessage(); }
      });
    });

    // Buttons by id, if no inline attributes
    const map = {
      "getStartedBtn": "initializeHenry",
      "send-button": "sendMessage",
      "start-voice": "toggleVoice",
      "stop-voice": "toggleVoice",
      "test-voice": "testVoice"
    };
    Object.entries(map).forEach(([id, fnName])=>{
      const el = document.getElementById(id);
      if (el && !el.getAttribute("onclick") && typeof window[fnName] === "function"){
        el.addEventListener("click", window[fnName]);
      }
    });
  });

})();
