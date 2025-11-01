const fs=require('fs'), p='public/style.css';
const css = [
'html,body{height:100%;margin:0}',
'body{background:#0b0c10;color:#e6e6e6;font:14px/1.45 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Inter,Arial,sans-serif}',
'#app{display:grid;grid-template-columns:260px 1fr 300px;height:100vh;width:100vw;overflow:hidden}',
'.sidebar{background:#121318;border-right:1px solid #1d1f27;padding:14px}',
'.brand{font-weight:700;letter-spacing:.3px;margin-bottom:8px}',
'.pill{display:inline-flex;align-items:center;gap:8px;background:#161821;border:1px solid #222436;border-radius:999px;padding:6px 10px}',
'.dot{width:8px;height:8px;border-radius:50%;display:inline-block}.dot-ok{background:#25c059}.dot-bad{background:#c02525}',
'.mini{font-size:12px;opacity:.85;margin-top:8px}',
'.chat{display:flex;flex-direction:column;background:#0b0c10}',
'.msgs{flex:1;overflow:auto;padding:18px 22px;display:flex;flex-direction:column;gap:14px}',
'.msg{max-width:900px;border:1px solid #1e2030;background:#0f1016;border-radius:10px;padding:12px 14px;white-space:pre-wrap}',
'.msg.me{align-self:flex-end;background:#10131a;border-color:#23263a}',
'.composer{display:flex;gap:10px;padding:12px;border-top:1px solid #1d1f27;background:#0b0c10}',
'textarea{flex:1;resize:none;border:1px solid #24283b;border-radius:10px;background:#0f1016;color:#e6e6e6;padding:10px 12px;outline:none}',
'button{border:1px solid #24283b;background:#161821;color:#e6e6e6;border-radius:10px;padding:10px 14px;cursor:pointer}',
'button:active{transform:translateY(1px)}',
'.sources{background:#0b0c10;border-left:1px solid #1d1f27;padding:12px 14px}',
'.sourcesTitle{font-weight:600;margin-bottom:8px;opacity:.9}',
'.srcs{list-style:none;padding:0;margin:0;font-size:12px;opacity:.85;display:flex;flex-direction:column;gap:6px}',
].join('\n');
fs.writeFileSync(p, css);
console.log('style.css written');
