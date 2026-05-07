# STATE LIVE — Mami_Docs (bootstrap rapid sesiune nouă)

**Ultimul update:** 2026-05-07 by Opus 4.7 (cleanup chei + GHID v6 + routing tree + a11y 44px)
**Status:** Faze 0-9 + Sprint 7 cod COMPLETE. Lighthouse production: Performance **92** / Accessibility **96** / Best Practices **100** / SEO 91. 9 tab-uri (Chat, Sănătate, Tratament 💊, Notițe 📝, Memo Voce 🎙️, Bibliotecă 📚, Galerie, Meniu, Interacțiuni). 13 web components. SSE streaming AI activ. Husky pre-commit blochează commit cu erori TS/teste. Coverage thresholds 70/70/60/70 active. **PENDING admin manual:** T6.1 SQL prod (test staging FIRST), T10.3 TEST_CHECKLIST telefon, T10.5 go-live mama, Backup Storj/B2 (lipsă credențiale), GHID v6 signup 15 servicii (Reka/Voyage/Hume/Resend/Sentry/etc. — vezi `docs/GHID_CREDENTIALE_LIPSA.md`).

## Workflow Testare (CRITIC)

1. **Roland (telefon + laptop):** testează FIECARE modul după deploy folosind `docs/TEST_CHECKLIST.md`
2. **Validare admin:** doar după ce toate modulele trec checklist-ul
3. **Go-live mama:** instalare PWA pe telefonul mamei când admin decide. Setup ntfy/CallMeBot pe telefonul mamei = AMÂNAT pe termen nedefinit (admin va activa la cerere explicită)

---

## URLs Production

- **PWA mama:** https://mami-docs.pages.dev
- **AI Gateway:** https://mami-docs-ai.petrilarolly.workers.dev (`/health`, `/chat` cu Origin header)
- **GitHub:** https://github.com/RolandPetrila/mami-docs (branch `main`)
- **Cloudflare account:** `petrilarolly` (token în `~/.api-keys/`)

---

## Ce funcționează LIVE acum (deployat) + LOCAL (necomis)

### Deployat (commit `6adab9b`):

- ✅ PWA instalabilă pe Android Chrome (manifest + Workbox SW + 5 entries precached)
- ✅ Header sticky cu hamburger (☰) + titlu + tab-uri preferate (≥640px) + ⚙️ Setări
- ✅ Drawer slide-out cu lista tab-urilor (focus, ESC, backdrop click închide)
- ✅ Tab-uri DINAMICE din `src/data/tabs.ts`
- ✅ Pagină Setări modal (volum, mute, dark mode, viteză voce TTS)
- ✅ Dark mode CSS variables (`html.dark` switch fără flash)
- ✅ AI Gateway Cloudflare Worker `/chat` Groq Llama 8B/70B + circuit breaker
- ✅ Web Speech API ro-RO (STT + TTS cu rate=0.9)
- ✅ 120 mesaje rotative greetings.ts
- ✅ mami-doc-viewer + mami-image-viewer + mami-audio-player + mami-search
- ✅ Offline indicator + SW update banner

### Sesiunea 2026-05-07 (Opus 4.7) — cleanup chei + routing automation:

- ✅ **GHID v6** (`docs/GHID_CREDENTIALE_LIPSA.md`, 802 linii) — restrâns 36 → 15 servicii cu free tier permanent/lunar real (eliminate AI21/AssemblyAI/Cartesia/Hailuo/Nebius — toate trial one-shot)
- ✅ **Test 4 chei expirate**: DEEPSEEK 402 epuizat (eliminat din env+master+catalog), MAKE 200 OK pe eu2 (păstrat), PLANTID 36/50 active, PLANTNET OK
- ✅ **routing_decision_trees.md** în memorie sistem — primary→fallback per categorie (LLM/embed/search/STT/TTS/image/video/3D/OCR/translation/plant ID livadă/emotion/email/DB)
- ✅ **Auto-routing rule** în `CLAUDE.md` proiect — consult tree obligatoriu înainte de orice apel AI + auto-update tree la add/remove cheie
- ✅ **Catalog cleanup confuzii A1-A5**: GITHUB_TOKEN clarificat (gh CLI not LLM), CLOUDFLARE_API_TOKEN (full admin) vs CF_AI_TOKEN (least-priv), SCALEWAY pair credential, Google Gemini consolidat (Doc AI + Translate + Imagen 3 same key)
- ✅ **A11y fix 6 tap targets** 36px → 44px WCAG (mama touch): mami-chat (clear+export), mami-doc-library (filter), mami-notes (filter+search), mami-wellness (btn-link)
- ✅ Commits: `2c7ec47` (GHID v5) → `ff6ed64` (GHID v6 + routing tree) → `cc2002a` (a11y)
- ✅ **Wrangler secrets verificat**: keepalive 8 SET (Telegram + Supabase + ntfy + Groq), ai-gateway 17 SET (DEEPSEEK eliminat propagat)

### Reka AI integrare (2026-05-07, autonomy run):

- ✅ **REKA_API_KEY** procesat: master (Tier 1 Gratuit) + INBOX [PROCESAT] + Windows env var (length 64) + catalog regenerat + `wrangler secret put` ai-gateway
- ✅ **Worker `callRekaChat`**: format native API (POST `/v1/chat`, header `X-Api-Key`, content array `[{type:"text", text}]`); response parse `responses[0].message.content`
- ✅ **Provider entry chain**: `{id:"reka-flash", model:"reka-flash", provider:"reka", category:"frontier"}` poziție 2 după `xai-grok-mini`, înainte `mistral-large`
- ✅ **routing_decision_trees.md**: Reka promovat de la #6 (pending) la #3 (activ) în secțiunea LLM Frontier
- ✅ **GHID v7 → v8**: Reka eliminat din lista pending (rămân 14 servicii); secțiunea `## 1. Reka AI` complet ștearsă; tabel + Wave 1 + footer + GDPR sync
- ✅ **Validare cheie**: HTTP 200 reka-flash răspunde (test admin manual + worker)

### NOU local (necomis — gata de commit):

**Sesiunea 2026-05-01 (Opus/Sonnet):**

- ✅ **Bug fix critic** worker AI Gateway: `callGroqAudio` complet implementat (Whisper Large v3 ro-RO) + endpoint `/transcribe`
- ✅ **Wellness funcțional cu persistență localStorage** (hidratare, vitale, somn, emoții) + PDF export real
- ✅ **Galerie Foto** completă: upload, resize 1920px, IndexedDB blob, lightbox, ștergere
- ✅ **Embeddings transformers.js** offline (`Xenova/multilingual-e5-small` quantized)
- ✅ **Notificări 4 straturi**: Notification API + ntfy.sh + Telegram + CallMeBot voice
- ✅ **Storage abstraction** `src/data/local-store.ts` local-first cu auto-mirror Supabase

**Sesiunea 2026-05-02 (Sonnet 4.6, executor autonom — runda 2):**

- ✅ **10 secrete AI Gateway setate** via wrangler: GEMINI, COHERE, MISTRAL, DEEPL, AZURE×2, BRAVE, TAVILY, CEREBRAS, OPENROUTER — toate fallback-urile AI funcționale
- ✅ **version.json** — `public/version.json` v1.0.0
- ✅ **Soft-delete galerie** — `deleted_at` în PhotoEntry, purge automat după 30 zile la startup
- ✅ **Alert 80% storage** — `runStorageCheck` în keepalive (după backup zilnic), ntfy+Telegram dacă >400MB
- ✅ **AI proactiv contextual** — card "Sfaturi AI" în Wellness cu buton → sendChat pe baza pattern-urilor detectate
- ✅ **pgvector SQL** — `docs/sql/pgvector_migration.sql` (vector, embeddings table, get_db_size_bytes, RLS, user_profiles)
- ✅ **device_role Supabase sync** — upsert `user_profiles` la schimbare admin PIN în Setări

**Sesiunea 2026-05-02 (Sonnet 4.6, executor autonom — runda 1):**

- ✅ **AI Gateway rewrite complet** — 8 categorii fallback: chat (Groq 8B→70B→Cerebras→OpenRouter), embed (Gemini→Cohere→Mistral), translate (DeepL→Azure→Gemini), vision (Gemini 2.5 Flash→Mistral pixtral), search (Brave→Tavily→Jina), STT (Groq Whisper→CF AI), `/health` endpoint
- ✅ **local-store.ts extins** — BookmarkEntry, HighlightEntry, DocNote, MenuEntry (săptămânal), DocIndexEntry (RAG, cap 2000 chunks)
- ✅ **RAG client-side** (`src/ai/rag.ts`) — chunking 400ch/80ch overlap, embeddings, cosine similarity, top-K deduplicat per doc
- ✅ **Quotes zilnice** (`src/data/quotes.ts`) — 60 citate RO, 6 categorii, `getDailyQuote()` determinist per zi
- ✅ **Admin PIN mode** (`mami-settings.ts`) — SHA-256 + salt, device_role mom/admin, UI în modal setări
- ✅ **Meniu săptămânal** (`mami-menu.ts`) — generator AI (JSON strict 7 zile × 4 mese), navigare săptămâni, printare, istoric 4 săpt, quote zilnic
- ✅ **Drug checker** (`mami-drug-checker.ts`) — RxNorm typeahead (400ms debounce), interacțiuni openFDA, severitate, disclaimer WCAG
- ✅ **Wellness pattern detection** — 5 tipare detectate automat din ultimele 7 zile (hidratare, tensiune, somn, emoții, hidratare bună)
- ✅ **Keepalive worker rewrite** — R2 backup real (8 tabele, 30 backups history), auto-sumar AI nocturn (00:30 UTC) via ntfy+Telegram
- ✅ **Bookmarks + highlights** (`mami-doc-viewer.ts`) — salvare scroll%, highlight text cu wrapText, restaurare la redeschidere doc
- ✅ **Tab-uri noi** în `src/data/tabs.ts`: Meniu (🍽️) + Medicamente (💊)
- ✅ **Build TypeScript 0 erori** — 926 modules, Vite clean (chunk size warning ignorat)

---

## Status Infrastructură (actualizat 2026-05-05)

| Item                                  | Status                                      |
| ------------------------------------- | ------------------------------------------- |
| Supabase Frankfurt                    | ✅ Configurat complet (sesiunea 2026-05-02) |
| ntfy.sh topic `mami-docs-2026-roland` | ✅ Configurat + testat HTTP 200             |
| CallMeBot WhatsApp                    | ✅ Configurat pe telefonul Roland           |
| Firebase FCM                          | ✅ Sărit deliberat (ntfy suficient)         |
| Cloudflare R2 `mami-docs-backup`      | ✅ Creat EU + Keepalive Worker deploat      |
| Cloudflare Pages env vars             | ✅ Complete (Supabase + ntfy + AI Gateway)  |
| Mod admin PIN                         | ✅ SHA-256 + Supabase sync device_role      |
| Lighthouse Performance                | ✅ 94 (FCP 1.1s, LCP 1.6s)                  |
| Iconițe PWA (192/512/512-maskable)    | ✅ SVG (image/svg+xml) — fix 2026-05-05     |
| Keepalive worker HTTP fetch handler   | ✅ 200 OK — fix 1101 exception              |
| Cron sync worker keepalive            | ✅ "0 3 \* \* sun" sync code+wrangler.toml  |
| Env vars CF Pages (4 VITE\_\*)        | ✅ Setate via API REST + bundle baked       |
| Auto-deploy GitHub→CF Pages           | ✅ ACTIV via GitHub Actions (push to main)  |
| Workflow deploy actual                | Auto: `.github/workflows/deploy.yml`        |
| GitHub Actions deploy.yml             | ✅ 4 secrets setate (CF + VITE*SUPABASE*\*) |
| `public/audio/tenderness.mp3`         | ✅ Calm Sketch for Piano (CC0 archive.org)  |

## Pași imediați (în ordine)

1. **Confirmare layout pe telefon Roland** — deschide https://mami-docs.pages.dev și verifică că tab-urile se comută corect
2. **Implementabil automat de Claude**: documentație utilizator pentru mama, PDF medical, jurnal wellness, integrări AI noi
3. **Go-live pe telefonul mamei** — instalare PWA când admin decide (ntfy/CallMeBot pe telefonul mamei = AMÂNATE)

---

## Cum adaugă admin un tab nou (workflow operațional)

1. Editează `src/data/tabs.ts` — adaugă entry nou `{ id: "<slug>", label: "<Nume>", icon: "<emoji>" }`
2. Creează folder `src/tabs/<slug>/` cu documentele aferente (DOCX/PDF/MD/XLSX/etc.)
3. (Opțional) Editează `src/ai/system-prompts.ts` — adaugă prompt specific pentru `<slug>` în obiectul PROMPTS
4. `git add . && git commit -m "feat: tab <slug>" && git push`
5. Cloudflare Pages auto-deploy în 30-60 sec

---

## Stack consolidat

| Layer          | Tehnologie                                                                        |
| -------------- | --------------------------------------------------------------------------------- |
| Frontend       | Vanilla JS + Web Components + Vite + TypeScript strict                            |
| PWA            | Workbox via `vite-plugin-pwa` mode `injectManifest`                               |
| Hosting        | Cloudflare Pages (`mami-docs.pages.dev`)                                          |
| Backend Worker | Cloudflare Workers (`mami-docs-ai.petrilarolly.workers.dev`)                      |
| AI text        | Groq 8B→SambaNova 70B→Cerebras→xAI Grok→Mistral Large→GitHub Models→OpenRouter    |
| AI OCR docs    | Azure Document Intelligence (prebuilt-document/receipt/layout/invoice/idDocument) |
| AI embed       | Gemini embedding-001 → Cohere multilingual → Mistral                              |
| AI vision      | Tesseract.js → Gemini 2.5 Flash → Mistral pixtral                                 |
| AI translate   | DeepL → Azure Translator → Gemini Flash                                           |
| AI search      | Brave → Tavily → Jina Reader                                                      |
| RAG            | transformers.js (Xenova/multilingual-e5-small) + cosine sim                       |
| STT/TTS        | Web Speech API ro-RO native + Groq Whisper fallback                               |
| Storage privat | Supabase (configurat de admin) + R2 backup zilnic                                 |
| Notificări     | ntfy.sh + Telegram Bot + CallMeBot + FCM (4 straturi)                             |

---

## Fișiere cheie pentru context (citește în ordine la sesiune nouă)

1. `STATE_LIVE.md` — acesta (bootstrap rapid)
2. `CLAUDE.md` — reguli proiect
3. `docs/AGENT_PROTOCOL.md` — reguli execuție agent
4. `~/.claude/projects/C--Proiecte-Mami-Docs/memory/MEMORY.md` — index memorie
5. `Executor_Auditor` — jurnal complet comunicare (poate fi sărit dacă acest STATE_LIVE.md e suficient)
6. `PROIECT_MAMI_DOCS_SPEC.md` (cu ADENDA §17) — sursa de adevăr
7. `docs/decisions/0001-anexa-c-decisions.md` — 17 decizii arhitecturale

---

## Context critic istoric (lecții învățate)

### Lecție 1 — Tab-urile sunt DINAMICE, NU hardcoded

Implementarea inițială Sonnet a hardcodat 5 tab-uri ("Rețete/Livadă/Sănătate/Concedii/Chat AI") inventate de Claude AI mobil în răspunsul către admin. **Admin a cerut explicit (info_chat.txt RUNDA 1):** "fiecare tab se creează în funcție de numărul documentelor pe care doresc să le includ. **irelevant cât tab-uri inițial**". Fix aplicat: `src/data/tabs.ts` cu listă dinamică, inițial doar `chat`.

### Lecție 2 — Hamburger sticky în header, NU bottom tab bar

Implementarea inițială Sonnet a folosit pattern iOS-style bottom tab bar. **Admin a cerut explicit (info_chat.txt RUNDA 3):** "vreau ca bara de selecție meniu hamburger să rămână vizibilă chiar dacă eu fac scroll în jos să rămână în header". Fix aplicat: `mami-tabs.ts` cu `<header position: sticky>`, buton ☰ care deschide drawer slide-out + tab-uri preferate inline pe ecrane mari + buton ⚙️ Setări.

### Lecție 3 — Verifică info_chat.txt înainte de a presupune

Toate cerințele admin sunt în `info_chat.txt` (16 runde Q&A). Spec-ul `PROIECT_MAMI_DOCS_SPEC.md` reflectă majoritatea, dar Sonnet a deviat la T8 (tab-uri) și T9 (CSS). **La orice ambiguitate UX/structurală: citește info_chat.txt + caută cerința exactă a admin înainte de implementare.**

---

## Pași imediați următori (alegerea admin)

### Neimplementate (necesită credențiale externe — admin manual):

1. **Supabase** — pgvector activat, tabele schema SQL, RLS, device_role backend, Family sharing
2. **GHID v6 signup** — 15 servicii cu free tier permanent (Reka/Voyage/Hume/Resend/Sentry/Neon/Leonardo/Ideogram/Firefly/Luma/Fish Audio/D-ID/Meshy/Perplexity/ElevenLabs) — admin semnează când dorește, integrare în AI Gateway după
3. **Test pe telefon real mama** — instalare PWA când admin decide (ntfy/CallMeBot rămân deferre)
4. **Documentație utilizator finală** pentru mama (simplu, cu poze, fără termeni tehnici)
5. **Backup secundar** (Storj/Backblaze B2) — opțional

### REZOLVATE 2026-05-07 (verificate explicit):

- ✅ **Wrangler secrets keepalive** — toate 8 SET (Telegram + Supabase + ntfy + Groq + AI_GATEWAY_URL). CallMeBot e URL-based (no key needed), nu necesită secret.
- ✅ **R2 bucket + keepalive worker** — deploy LIVE, backup nocturn 02:00 UTC funcțional
- ✅ **Lighthouse ≥90** — Performance 92, Accessibility 96, Best Practices 100, SEO 91
- ✅ **Firebase FCM** — sărit deliberat (ntfy + Telegram + CallMeBot suficient)

### Faza 4 completă (2026-05-05):

- ✅ **Lighthouse Performance 94** — FCP 1.1s, LCP 1.6s, TBT 270ms, CLS 0
- ✅ **Lazy loading complet** — bundle inițial 29 kB (era 1.79 MB)
- ✅ **Supabase lazy** — @supabase/supabase-js nu mai blochează startup-ul
- ✅ **SW precache 656 kB** (era 2.16 MB) — vendor chunks excluse

### Faza 1 checklist complet (blocate pe admin gates):

- `public/audio/tenderness.mp3` — admin descarcă manual (Pixabay FASSounds CC0)
- Cloudflare Pages env vars — adaugă `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_NTFY_TOPIC` etc.

---

## Loop & polling

- **Cron loop OPUS:** anulat (Sonnet închis, polling nu mai necesar)
- **Workflow viitor:** admin deschide sesiune nouă pentru fiecare task major. Citește `STATE_LIVE.md` + `MEMORY.md`. Continuă de unde s-a oprit.
