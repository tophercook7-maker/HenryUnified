import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import { exec, spawn } from "child_process";
import path from "path";
import fs from "fs";
import { OpenAI } from "openai";

const app = express();
app.use(bodyParser.json({ limit: "25mb" }));

// file uploads (for big books, etc.)
const upload = multer({ dest: path.join(process.cwd(), "uploads") });

// --- OpenAI setup (simple in-memory; later move to Keychain) ---
let OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const openai = () => new OpenAI({ apiKey: OPENAI_API_KEY });

// ---- Health ----
app.get("/health", (_req, res) => res.json({ ok: true }));

// ---- Security: store key (demo) ----
app.post("/security/set-openai-key", (req, res) => {
  const { key } = req.body || {};
  if (!key || !/^sk-|^ops-/.test(key)) return res.status(400).json({ error: "bad_key" });
  OPENAI_API_KEY = key;
  res.json({ ok: true });
});

// ---- LLM chat ----
app.post("/llm/chat", async (req, res) => {
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages)) return res.status(400).json({ error: "messages_required" });
    if (!OPENAI_API_KEY) return res.status(400).json({ error: "no_api_key" });

    const r = await openai().chat.completions.create({
      model: "gpt-4o-mini",
      messages,
    });
    res.json({ reply: r.choices?.[0]?.message?.content || "" });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "chat_failed" });
  }
});

// ---- Ingest raw text (books) ----
app.post("/ingest/text", (req, res) => {
  try {
    const { book_id, title, text } = req.body || {};
    if (!book_id || !text) return res.status(400).json({ error: "missing_book_or_text" });
    fs.mkdirSync("library", { recursive: true });
    fs.writeFileSync(`library/${book_id}.txt`, String(text), "utf8");
    res.json({ ok: true, book_id, title });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "ingest_failed" });
  }
});

// ---- Ingest file upload (store; parse later) ----
app.post("/ingest/file", upload.single("file"), (req, res) => {
  try {
    const { book_id, title } = req.body || {};
    if (!book_id || !req.file) return res.status(400).json({ error: "missing_book_or_file" });
    fs.mkdirSync("library", { recursive: true });
    const dest = `library/${book_id}.upload`;
    fs.renameSync(req.file.path, dest);
    res.json({ ok: true, book_id, title, path: dest });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "upload_failed" });
  }
});

// ---- Naive deep summary (demo) ----
app.post("/summarize", async (req, res) => {
  try {
    const { book_id, query } = req.body || {};
    if (!book_id) return res.status(400).json({ error: "missing_book_id" });
    const p = `library/${book_id}.txt`;
    if (!fs.existsSync(p)) return res.status(404).json({ error: "book_not_found" });
    const text = fs.readFileSync(p, "utf8");
    const slice = text.slice(0, 16000); // later: chunk + embeddings + retrieval

    const r = await openai().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a biblical scholar and professor-level writer." },
        { role: "user", content: `Summarize deeply with structure for query "${query || ""}".\n---\n${slice}` }
      ],
    });
    res.json({ summary: r.choices?.[0]?.message?.content || "" });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "summarize_failed" });
  }
});

// ---- Apple Calendar (macOS) ----
app.post("/calendar/create", (req, res) => {
  const { title, start, end, location = "", notes = "" } = req.body || {};
  if (!title || !start || !end) return res.status(400).json({ error: "title_start_end_required" });

  const script = `
    tell application "Calendar"
      tell calendar "Home"
        make new event with properties {summary:"${title}", start date:date "${start}", end date:date "${end}", location:"${location}", description:"${notes.replace(/"/g,'\\"')}"}
      end tell
    end tell`;
  exec(`osascript -e ${JSON.stringify(script)}`, (err, _stdout, stderr) => {
    if (err) return res.status(500).json({ error: stderr || err.message });
    res.json({ ok: true });
  });
});

// ---- Apple Notes (macOS) ----
app.post("/notes/create", (req, res) => {
  const { title, body } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: "title_body_required" });

  const script = `
    tell application "Notes"
      tell account "iCloud"
        make new note at folder "Notes" with properties {name:"${title}", body:"${body.replace(/"/g,'\\"')}"}
      end tell
    end tell`;
  exec(`osascript -e ${JSON.stringify(script)}`, (err, _stdout, stderr) => {
    if (err) return res.status(500).json({ error: stderr || err.message });
    res.json({ ok: true });
  });
});

// ---- Guarded terminal (whitelist) ----
const ALLOW = new Set(["git","ls","cat","pwd","npm","node","python3","xcodebuild"]);
app.post("/terminal/run", (req, res) => {
  const { cmd, args = [], cwd, dry_run } = req.body || {};
  if (!cmd || !ALLOW.has(cmd)) return res.status(400).json({ error: "disallowed_command" });
  if (dry_run) return res.json({ dry_run: true, cmd, args, cwd });
  try {
    const child = spawn(cmd, Array.isArray(args) ? args : [], { cwd: cwd || process.cwd() });
    let out = "", err = "";
    child.stdout.on("data", d => out += d.toString());
    child.stderr.on("data", d => err += d.toString());
    child.on("close", code => res.json({ code, out, err }));
  } catch (e: any) {
    res.status(500).json({ error: e.message || "spawn_failed" });
  }
});

const PORT = 3123;
app.listen(PORT, () => console.log(`Henry Agent listening on http://127.0.0.1:${PORT}`));
