import "dotenv/config";
import fs from "fs";
import path from "path";
import crypto from "crypto";

type Chunk = { id:string; doc:string; ref:string; content:string; embedding:number[] };

async function embedMany(input: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (const text of input) {
    const resp = await fetch("http://127.0.0.1:11434/api/embeddings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: process.env.HENRY_EMBED_MODEL || "all-minilm", prompt: text })
    });
    if (!resp.ok) throw new Error("Ollama embeddings failed: " + resp.status + " " + (await resp.text()));
    const j: any = await resp.json();
    const v = j && (Array.isArray(j.embeddings) ? j.embeddings[0] : j.embedding);
    if (!Array.isArray(v) || v.length === 0) throw new Error("No embeddings returned");
    out.push(v.map(Number));
  }
  return out;
}

function walk(base: string, acc: string[] = []) {
  for (const e of fs.readdirSync(base)) {
    const f = path.join(base, e);
    const st = fs.statSync(f);
    if (st.isDirectory()) walk(f, acc);
    else if (e.toLowerCase().endsWith(".txt")) acc.push(f);
  }
  return acc;
}

function makeChunks(text: string, ref: string, size=1200, overlap=200) {
  const out: Omit<Chunk,"embedding">[] = [];
  for (let i=0;i<text.length;i+=(size-overlap)) {
    const slice = text.slice(i, Math.min(text.length, i+size));
    const id = crypto.createHash("md5").update(ref+":"+i).digest("hex");
    out.push({ id, doc: path.basename(ref), ref, content: slice });
  }
  return out;
}

const outDir = path.resolve(__dirname, "../data");
const outFile = path.join(outDir, "chunks.json");

(async () => {
  const base = path.resolve(process.env.KNOWLEDGE_DIR || path.resolve(__dirname, "../../../10_knowledge"));
  if (!fs.existsSync(base)) { console.error("Knowledge dir missing:", base); process.exit(1); }
  const files = walk(base);
  if (!files.length) { console.error("No .txt files found under:", base); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });

  const chunks: Chunk[] = [];
  for (const f of files) {
    const text = fs.readFileSync(f, "utf8");
    const pieces = makeChunks(text, f);
    const embs = await embedMany(pieces.map(p => p.content));
    for (let i=0;i<pieces.length;i++) chunks.push({ ...pieces[i], embedding: embs[i] });
    console.log("Indexed:", f);
  }
  fs.writeFileSync(outFile, JSON.stringify(chunks), "utf8");
  console.log("Wrote:", outFile, "chunks:", chunks.length);
})();
