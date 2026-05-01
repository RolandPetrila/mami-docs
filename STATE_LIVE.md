# STATE LIVE — Mami_Docs (bootstrap rapid sesiune nouă)

**Ultimul update:** 2026-05-01T11:55Z by Opus 4.7 (executor mode)
**Status:** FAZA 1 LIVE PRODUCTION + FIX A+B+C aplicate

---

## URLs Production

- **PWA mama:** https://mami-docs.pages.dev
- **AI Gateway:** https://mami-docs-ai.petrilarolly.workers.dev (`/health`, `/chat` cu Origin header)
- **GitHub:** https://github.com/RolandPetrila/mami-docs (branch `main`)
- **Cloudflare account:** `petrilarolly` (token în `~/.api-keys/`)

---

## Ce funcționează LIVE acum

- ✅ PWA instalabilă pe Android Chrome (manifest + Workbox SW + 5 entries precached)
- ✅ Header sticky cu hamburger (☰) + titlu + tab-uri preferate (≥640px) + ⚙️ Setări
- ✅ Drawer slide-out cu lista tab-urilor (focus, ESC, backdrop click închide)
- ✅ Tab-uri DINAMICE din `src/data/tabs.ts` — inițial doar `Chat AI` (admin adaugă altele)
- ✅ Pagină Setări modal (volum, mute, dark mode, viteză voce TTS) — persistă în localStorage
- ✅ Dark mode CSS variables (`html.dark` switch fără flash)
- ✅ AI Gateway Cloudflare Worker (Groq Llama 8B/70B + circuit breaker + ALLOWED_ORIGIN strict)
- ✅ Web Speech API ro-RO (STT + TTS cu rate=0.9)
- ✅ 120 mesaje rotative greetings.ts (4 categorii × 30, seed zilnic)
- ✅ system-prompts.ts cu fallback la generic pentru tab-uri necunoscute
- ✅ mami-doc-viewer (DOCX/PDF/MD/XLSX) + mami-image-viewer (pinch zoom) + mami-audio-player + mami-search
- ✅ mami-ambient-player (graceful onerror dacă MP3 lipsește)
- ✅ Offline indicator + service worker update banner

---

## Ce LIPSEȘTE (admin manual sau Faza 2+)

| Item                                                | Status             | Acțiune                                                                                       |
| --------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------- |
| `public/audio/tenderness.mp3`                       | LIPSEȘTE           | Admin descarcă manual de pe Pixabay (FASSounds CC0)                                           |
| Supabase chei (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) | LIPSEȘTE           | Admin: cont supabase.com → API → copy → adaugă în `~/.api-keys/INBOX.md` → "proceseaza inbox" |
| Keepalive Worker deploy                             | BLOCAT pe Supabase | După chei: `cd workers/keepalive && npx wrangler deploy`                                      |
| Buton `?` contextual per pagină                     | NU implementat     | Faza 1.5                                                                                      |
| Badge verde tab cu modificări noi                   | NU implementat     | Faza 2 (necesită Supabase pentru detectare)                                                   |
| Mod admin PIN                                       | NU implementat     | Faza 4                                                                                        |
| Camera + upload foto + upload doc cu limită 10      | NU implementat     | Faza 2 (necesită Supabase)                                                                    |
| Reminder telefon mama (ntfy + CallMeBot)            | Cod parțial        | Faza 2                                                                                        |

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
4. **Refactor system-prompts.ts** — eliminare prompts hardcoded specifice (retete/livada/sanatate/concedii) → schemă plug-in unde admin definește prompt când creează tab nou

---

## Loop & polling

- **Cron loop OPUS:** anulat (Sonnet închis, polling nu mai necesar)
- **Workflow viitor:** admin deschide sesiune nouă pentru fiecare task major. Citește `STATE_LIVE.md` + `MEMORY.md`. Continuă de unde s-a oprit.
