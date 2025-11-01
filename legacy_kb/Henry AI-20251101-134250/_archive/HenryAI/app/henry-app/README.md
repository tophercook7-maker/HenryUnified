# Henry Companion (local)
- Local RAG over Bible + Lost Books you place in `../../10_knowledge/`
- API: POST /ask { "query": "..." } → { answer, sources }

## Quick start
1) `cp .env.example .env` and paste your OPENAI_API_KEY
2) Put .txt chapters into `../../10_knowledge/` (see structure below)
3) `pnpm i` (or `npm i`)
4) `pnpm ingest`
5) `pnpm dev`
6) `curl -s http://127.0.0.1:3000/ask -H 'content-type: application/json' -d '{"query":"Summarize Genesis 1 (KJV)."}' | jq .`

## Knowledge layout suggestion
10_knowledge/
  bibles/
    KJV/Genesis_01.txt
    KJV/Genesis_02.txt
    ...
  apocrypha/
    Tobit/01.txt
    ...
  pseudepigrapha/
    1_Enoch/01.txt
  dead_sea_scrolls/
    Community_Rule/col1.txt
