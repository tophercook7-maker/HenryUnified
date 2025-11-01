import express from "express";
import cors from "cors";
import * as path from "path";
import * as fs from "fs";

type HenryChunk = { ref?: string; doc?: string; text: string };

const app = express();
app.use(cors());
app.use(express.json());

const PUB = path.resolve(__dirname, "..", "public");
app.use(express.static(PUB));
app.get("/", (_req, res) => { res.sendFile(path.join(PUB, "index.html")); });

let chunks: HenryChunk[] = [];
function loadChunks() {
  try {
    const p = path.resolve(__dirname, "..", "data", "chunks.json");
    const raw = fs.readFileSync(p, "utf8");
    const j = JSON.parse(raw);
    chunks = Array.isArray(j) ? j : (Array.isArray(j.chunks) ? j.chunks : []);
    console.log("Loaded chunks:", chunks.length);
  } catch (e) {
    console.warn("No chunks loaded:", String(e));
    chunks = [];
  }
}
loadChunks();

app.get("/health", (_req, res) => {
  res.json({ ok: true, provider: process.env.OPENAI_API_KEY ? "openai" : "local", chunks: chunks.length });
});

app.post("/reload", (_req, res) => { loadChunks(); res.json({ ok: true, chunks: chunks.length }); });

function scoreChunk(q: string, c: HenryChunk): number {
  const t = (c.text || "").toLowerCase();
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  let hits = 0; for (const w of terms) if (t.includes(w)) hits++;
  return hits * 10 - Math.log(c.text ? c.text.length : 1);
}

app.post("/ask", (req, res) => {
  try {
    const q = String(req.body?.query || "").trim();
    if (!q) return res.status(400).json({ ok:false, error: "missing query" });
    if (!chunks.length) return res.status(400).json({ ok:false, error: "no local chunks; run pnpm ingest" });
    const ranked = chunks.map((c,i)=>({ c, i, score: scoreChunk(q,c) }))
      .sort((a,b)=> b.score - a.score).slice(0,5);
    const files = Array.from(new Set(ranked.map(r => r.c.doc || r.c.ref || "unknown")));
    const preview = ranked.map(r=>{
      const t = (r.c.text || "").replace(/\s+/g, " ").slice(0,240);
      const name = r.c.doc || r.c.ref || "unknown";
      return "- " + name + " - " + t;
    }).join("\n");
    const answer = "Here is what your local files say (top matches):\n" + preview
      + (files.length ? "\n\nSources: " + files.join(", ") : "");
    res.json({ ok:true, provider: process.env.OPENAI_API_KEY ? "openai" : "local", model: "keyword-rank",
      answer, sources: ranked.map(r=>({ doc: r.c.doc || r.c.ref, score: r.score })) });
  } catch (e) { res.status(500).json({ ok:false, error: String(e) }); }
});

app.listen(3000, ()=>{ console.log("Henry AI listening on http://127.0.0.1:3000"); });