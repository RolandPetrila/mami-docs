# STATE LIVE — Mami_Docs (bootstrap rapid sesiune nouă)

**Ultimul update:** 2026-05-05 by Opus 4.7 (Faza 3+4 completare autonomă: jurnal wellness, family sharing RLS, arhivă R2 60 zile, ghid utilizator)
**Status:** Faza 1-4 implementare COMPLETĂ ✅ — testare pe telefon Roland în desfășurare; mama primește app DOAR după validare completă

## Workflow Testare (CRITIC)

1. **Roland (telefon + laptop):** testează FIECARE modul după deploy folosind `docs/TEST_CHECKLIST.md`
2. **Validare admin:** doar după ce toate modulele trec checklist-ul
3. **Go-live mama:** instalare PWA + setup ntfy/CallMeBot pe telefonul ei DOAR după validare

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
| `public/audio/tenderness.mp3`         | ❌ Lipsește — descarcă CC0 de pe Pixabay    |
| CallMeBot pe telefonul MAMEI          | ❌ De făcut când ești cu mama lângă tine    |
| ntfy app Android pe telefonul MAMEI   | ❌ Instalează + subscrie la topic           |

## Pași imediați (în ordine)

1. **Confirmare layout pe telefon Roland** — deschide https://mami-docs.pages.dev și verifică că tab-urile se comută corect
2. **Implementabil automat de Claude**: documentație utilizator pentru mama, PDF medical, jurnal wellness
3. **Go-live pe telefonul mamei** — când ești pregătit

---

## Cum adaugă admin un tab nou (workflow operațional)

1. Editează `src/data/tabs.ts` — adaugă entry nou `{ id: "<slug>", label: "<Nume>", icon: "<emoji>" }`
2. Creează folder `src/tabs/<slug>/` cu documentele aferente (DOCX/PDF/MD/XLSX/etc.)
3. (Opțional) Editează `src/ai/system-prompts.ts` — adaugă prompt specific pentru `<slug>` în obiectul PROMPTS
4. `git add . && git commit -m "feat: tab <slug>" && git push`
5. Cloudflare Pages auto-deploy în 30-60 sec

---

## Stack consolidat

| Layer          | Tehnologie                                                   |
| -------------- | ------------------------------------------------------------ |
| Frontend       | Vanilla JS + Web Components + Vite + TypeScript strict       |
| PWA            | Workbox via `vite-plugin-pwa` mode `injectManifest`          |
| Hosting        | Cloudflare Pages (`mami-docs.pages.dev`)                     |
| Backend Worker | Cloudflare Workers (`mami-docs-ai.petrilarolly.workers.dev`) |
| AI text        | Groq 8B→70B→Cerebras→OpenRouter (circuit breaker, retry)     |
| AI embed       | Gemini embedding-001 → Cohere multilingual → Mistral         |
| AI vision      | Tesseract.js → Gemini 2.5 Flash → Mistral pixtral            |
| AI translate   | DeepL → Azure Translator → Gemini Flash                      |
| AI search      | Brave → Tavily → Jina Reader                                 |
| RAG            | transformers.js (Xenova/multilingual-e5-small) + cosine sim  |
| STT/TTS        | Web Speech API ro-RO native + Groq Whisper fallback          |
| Storage privat | Supabase (configurat de admin) + R2 backup zilnic            |
| Notificări     | ntfy.sh + Telegram Bot + CallMeBot + FCM (4 straturi)        |

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
2. **R2 bucket** (`mami-docs-backup`) + deploy `workers/keepalive` cu secrete reale
3. **ntfy.sh topic** + instalare app Android pe telefonul mamei
4. **Firebase FCM** (opțional, alternative = ntfy)
5. **Test pe telefon real mama** — deschide `mami-docs.pages.dev` în Chrome Android, "Add to home screen"
6. **Lighthouse ≥90** — audit PWA, Performance, Accessibility
7. **Documentație utilizator finală** pentru mama (simplu, cu poze, fără termeni tehnici)
8. **Backup secundar** (Storj/Backblaze B2) — opțional

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
