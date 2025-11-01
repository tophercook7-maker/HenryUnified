const fs=require('fs'), p='public/index.html';
const html = [
'<!doctype html>',
'<html lang="en">',
'<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
'<title>Henry AI</title>',
'<link rel="stylesheet" href="style.css?v=2">',
'<body>',
'<div id="app">',
'  <aside class="sidebar">',
'    <div class="brand">Henry AI</div>',
'    <div class="pill"><span id="status-dot" class="dot dot-bad"></span><span id="status-text">offline</span></div>',
'    <div class="mini">Model: <span id="model">local</span></div>',
'    <div class="mini">Chunks: <span id="chunks">0</span></div>',
'  </aside>',
'  <main class="chat">',
'    <div id="msgs" class="msgs"></div>',
'    <div class="composer">',
'      <textarea id="box" rows="2" placeholder="Type and press Enter to send. Shift+Enter for newline."></textarea>',
'      <button id="send">Send</button>',
'    </div>',
'  </main>',
'  <aside class="sources">',
'    <div class="sourcesTitle">Sources</div>',
'    <ul id="srcList" class="srcs"></ul>',
'  </aside>',
'</div>',
'<script src="app.js?v=2"></script>',
'</body></html>'
].join('\n');
fs.writeFileSync(p, html);
console.log('index.html written');
