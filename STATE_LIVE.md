# STATE LIVE — Mami_Docs (bootstrap rapid sesiune nouă)

**Ultimul update:** 2026-05-01T18:00Z by Opus 4.7 (executor mode)
**Status:** Frontend complet local-first (fără credentiale) — așteaptă Setup Supabase + ntfy + (opțional) CallMeBot/FCM/R2

> 📋 **Pentru obținere credentiale:** vezi `docs/CREDENTIALS_NEEDED.md` cu pași + linkuri surse.

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

- ✅ **Bug fix critic** worker AI Gateway: `callGroqAudio` complet implementat (Whisper Large v3 ro-RO) + endpoint `/transcribe` funcțional + duplicare reziduară eliminată
- ✅ **Wellness funcțional cu persistență localStorage** (hidratare, vitale, somn, emoții) + buton "Descarcă raport PDF" cu date reale din ultimele 14 măsurători
- ✅ **Galerie Foto** completă: upload (capture mama Android), resize automat la 1920px JPEG, IndexedDB pentru blob-uri, lightbox + ștergere
- ✅ **Tab Galerie** adăugat în `src/data/tabs.ts` (al treilea după Chat și Sănătate)
- ✅ **Embeddings transformers.js** offline real (`Xenova/multilingual-e5-small` quantized) cu fallback la AI Gateway `/embed` când va exista
- ✅ **Notificări 4 straturi**: Notification API local + ntfy.sh push + Telegram (worker) + CallMeBot voice — toate cu graceful skip dacă lipsesc credentiale
- ✅ **Toggle "Reminder apă (la 2h)"** în Setări — activează `Notification.requestPermission()` + setInterval cu anti-spam
- ✅ **Storage abstraction** `src/data/local-store.ts` — local-first cu auto-mirror Supabase când conectat (`mirrorAllToSupabase()`)
- ✅ **`.env.example`** (commitabil) cu documentație completă variabile Vite necesare
- ✅ **Build TypeScript + Vite** trece curat (923 modules, 1.7MB JS bundle, 7 entries precache)

---

## Ce LIPSEȘTE (admin manual)

> 📋 **Pași complete cu linkuri sursă:** `docs/CREDENTIALS_NEEDED.md`

| Item                                 | Status                        | Cum se obține                                                 |
| ------------------------------------ | ----------------------------- | ------------------------------------------------------------- |
| `public/audio/tenderness.mp3`        | LIPSEȘTE                      | Admin descarcă manual de pe Pixabay (FASSounds CC0)           |
| Supabase (URL + anon + service_role) | LIPSEȘTE → vezi §1            | supabase.com cont nou + proiect Frankfurt + SQL schema        |
| ntfy.sh topic                        | LIPSEȘTE → vezi §2            | Topic random + app Android pe telefonul mamei                 |
| CallMeBot WhatsApp                   | LIPSEȘTE → vezi §3            | Setup cu mama lângă tine (WhatsApp +34 644 51 95 23)          |
| Firebase FCM                         | LIPSEȘTE → vezi §4 (opțional) | console.firebase.google.com (alternativ ntfy)                 |
| Cloudflare R2 bucket                 | LIPSEȘTE → vezi §5 (opțional) | dash.cloudflare.com R2 → bucket `mami-docs-backup`            |
| Keepalive Worker deploy              | BLOCAT pe Supabase            | După chei §1: `cd workers/keepalive && npx wrangler deploy`   |
| Cloudflare Pages env vars            | Doar `VITE_AI_GATEWAY_URL` ✅ | După chei: dashboard Pages → Settings → Environment Variables |
| Buton `?` contextual per pagină      | NU implementat                | Faza 1.5                                                      |
| Mod admin PIN                        | NU implementat                | Faza 4                                                        |

---

## Cum adaugă admin un tab nou (workflow operațional)

1. Editează `src/data/tabs.ts` — adaugă entry nou `{ id: "<slug>", label: "<Nume>", icon: "<emoji>" }`
2. Creează folder `src/tabs/<slug>/` cu documentele aferente (DOCX/PDF/MD/XLSX/etc.)
3. (Opțional) Editează `src/ai/system-prompts.ts` — adaugă prompt specific pentru `<slug>` în obiectul PROMPTS
4. `git add . && git commit -m "feat: tab <slug>" && git push`
5. Cloudflare Pages auto-deploy în 30-60 sec

---

## Stack consolidat

| Layer                   | Tehnologie                                                        |
| ----------------------- | ----------------------------------------------------------------- |
| Frontend                | Vanilla JS + Web Components + Vite + TypeScript strict            |
| PWA                     | Workbox via `vite-plugin-pwa` mode `injectManifest`               |
| Hosting                 | Cloudflare Pages (`mami-docs.pages.dev`)                          |
| Backend Worker          | Cloudflare Workers (`mami-docs-ai.petrilarolly.workers.dev`)      |
| AI text                 | Groq Llama 3.1 8B → 3.3 70B (circuit breaker, retry, timeout 10s) |
| AI vision (viitor)      | Tesseract.js client → Gemini 2.5 Flash                            |
| Embeddings (viitor)     | `gemini-embedding-001` cu pgvector Supabase                       |
| STT/TTS                 | Web Speech API ro-RO native                                       |
| Storage privat (viitor) | Supabase + R2 backup                                              |
| Notificări (viitor)     | ntfy.sh + Telegram + CallMeBot + FCM                              |

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

1. **Faza 1.5 — AI Core extins** (sumarizare, traducere, OCR cascadă Tesseract+Gemini, "explică simplu", "rezumat 3 puncte", definire cuvânt) ~1 săpt.
2. **G3 Supabase + G6 Audio** — admin manual, deblochează Faza 2
3. **Test pe telefon real mama** — deschide `mami-docs.pages.dev` în Chrome Android, "Add to home screen", testează tot
4. ~~**Refactor system-prompts.ts** — eliminare prompts hardcoded specifice~~ (Completat)

---

## Loop & polling

- **Cron loop OPUS:** anulat (Sonnet închis, polling nu mai necesar)
- **Workflow viitor:** admin deschide sesiune nouă pentru fiecare task major. Citește `STATE_LIVE.md` + `MEMORY.md`. Continuă de unde s-a oprit.
