// server.js — ESM with settings + billing
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.join(__dirname, 'config.json');

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); }
  catch { return {}; }
}
function saveConfig(obj) { fs.writeFileSync(CONFIG_PATH, JSON.stringify(obj, null, 2)); }

let config = loadConfig();
if (process.env.OPENAI_API_KEY) config.OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (process.env.OPENAI_MODEL)   config.OPENAI_MODEL   = process.env.OPENAI_MODEL;
if (process.env.STRIPE_PORTAL_URL) config.STRIPE_PORTAL_URL = process.env.STRIPE_PORTAL_URL;

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));
app.set('x-powered-by', false);
app.use(rateLimit({ windowMs: 60_000, limit: 120 }));

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    model: config.OPENAI_MODEL || 'gpt-4o-mini',
    hasKey: !!config.OPENAI_API_KEY,
    billing: !!config.STRIPE_PORTAL_URL
  });
});

// SETTINGS
app.get('/settings', (_req, res) => {
  res.json({
    OPENAI_MODEL: config.OPENAI_MODEL || 'gpt-4o-mini',
    OPENAI_API_KEY: config.OPENAI_API_KEY ? '***' + config.OPENAI_API_KEY.slice(-4) : null,
    STRIPE_PORTAL_URL: config.STRIPE_PORTAL_URL ? 'set' : null
  });
});
app.post('/settings', (req, res) => {
  const { OPENAI_API_KEY, OPENAI_MODEL, STRIPE_PORTAL_URL } = req.body || {};
  if (OPENAI_MODEL) config.OPENAI_MODEL = String(OPENAI_MODEL);
  if (OPENAI_API_KEY) config.OPENAI_API_KEY = String(OPENAI_API_KEY);
  if (STRIPE_PORTAL_URL) config.STRIPE_PORTAL_URL = String(STRIPE_PORTAL_URL);
  saveConfig(config);
  res.json({ ok: true });
});

// BILLING (returns portal URL string if configured)
app.get('/billing', (_req, res) => {
  const url = config.STRIPE_PORTAL_URL || '';
  if (!url) return res.status(404).json({ error: 'no_portal' });
  res.json({ url });
});

// CHAT (non-stream)
app.post('/chat', async (req, res) => {
  try {
    const body = req.body || {};
    const OPENAI_API_KEY = config.OPENAI_API_KEY || '';
    const usedModel = body.model || config.OPENAI_MODEL || 'gpt-4o-mini';

    let messages = Array.isArray(body.messages) ? body.messages : [];
    if (!messages.length) {
      const single = (body.message ?? '').toString();
      if (!single.trim()) return res.status(400).json({ error: 'message is required' });
      if (body.system) messages.push({ role: 'system', content: String(body.system) });
      messages.push({ role: 'user', content: single });
    } else {
      messages = messages.map(m => ({ role: String(m.role), content: String(m.content ?? '') }));
    }

    if (!OPENAI_API_KEY) {
      const lastUser = [...messages].reverse().find(m => m.role === 'user')?.content ?? '';
      return res.json({ reply: `echo: ${lastUser}`, provider: 'echo' });
    }

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: usedModel, messages, temperature: 0.7 })
    });

    if (!r.ok) {
      const text = await r.text().catch(() => '');
      return res.status(502).json({ error: 'upstream_error', detail: text.slice(0, 1500) });
    }

    const data = await r.json();
    const choice = data?.choices?.[0] ?? {};
    let reply = '';
    if (typeof choice?.message?.content === 'string') reply = choice.message.content;
    else if (typeof choice?.delta?.content === 'string') reply = choice.delta.content;
    else if (typeof choice?.text === 'string') reply = choice.text;
    else if (Array.isArray(choice?.message?.content)) {
      reply = choice.message.content.map(p => p?.text ?? p?.content ?? '').join('').trim();
    }
    return res.json({ reply: reply || '(no content)', provider: 'openai', model: usedModel });
  } catch (err) {
    console.error('POST /chat error', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

// CHAT STREAM (SSE)
app.post('/chat/stream', async (req, res) => {
  try {
    const body = req.body || {};
    let messages = Array.isArray(body.messages) ? body.messages : [];
    if (!messages.length) {
      const single = (body.message ?? '').toString();
      if (!single.trim()) return res.status(400).end(`event: error\ndata: message required\n\n`);
      if (body.system) messages.push({ role: 'system', content: String(body.system) });
      messages.push({ role: 'user', content: single });
    } else {
      messages = messages.map(m => ({ role: String(m.role), content: String(m.content ?? '') }));
    }

    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    res.flushHeaders?.();

    const OPENAI_API_KEY = config.OPENAI_API_KEY || '';
    const usedModel = body.model || config.OPENAI_MODEL || 'gpt-4o-mini';

    const send = (d) => res.write(`data: ${d}\n\n`);
    const event = (e, d) => res.write(`event: ${e}\ndata: ${d}\n\n`);

    if (!OPENAI_API_KEY) {
      const lastUser = [...messages].reverse().find(m => m.role === 'user')?.content ?? '';
      for (const ch of (`echo: ${lastUser}`)) { send(ch); await new Promise(r => setTimeout(r, 10)); }
      event('done', JSON.stringify({ provider: 'echo' })); return res.end();
    }

    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: usedModel, messages, temperature: 0.7, stream: true })
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => '');
      event('error', text.slice(0, 1000) || 'upstream_error'); return res.end();
    }

    const reader = upstream.body.getReader();
    const td = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = td.decode(value);
      for (const line of chunk.split('\n')) {
        if (!line.trim()) continue;
        if (line.startsWith('data:')) res.write(line + '\n\n');
      }
    }
    event('done', JSON.stringify({ provider: 'openai', model: usedModel })); res.end();
  } catch (err) {
    console.error('POST /chat/stream error', err);
    res.write(`event: error\ndata: server_error\n\n`); res.end();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API listening on :${PORT}`));
