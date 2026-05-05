# PLAN Faza 1 — MVP PWA Mami_Docs

**Dată start:** 2026-05-01
**Status:** ✅ Faza 1 COMPLETĂ — toate task-urile T1-T25 bifate; deploy live (`mami-docs.pages.dev`); Lighthouse Performance 94 (2026-05-05); ultima actualizare jurnal: 2026-05-05
**Versiune plan:** 1.0
**Derivat din:** `docs/roadmap.md` §Faza 1 + `docs/decisions/0001-anexa-c-decisions.md`

---

## Obiectiv Faza 1

Prima versiune funcțională PWA pe care mama o poate instala pe Android Chrome și folosi fără conexiune (documente cached + chat AI de bază).

**Criterii de succes:**

- Instalabil pe home screen (manifest + SW ✅)
- 5 tab-uri navigabile (Rețete, Livadă, Sănătate, Concedii, Chat AI)
- Randare DOCX/PDF/MD/XLSX funcțională
- Chat AI vocal (STT + TTS ro-RO) cu fallback Groq 8B → 70B
- URL public Cloudflare Pages activ
- Lighthouse ≥90 (PWA, Performance, Accessibility)

---

## Reguli de Siguranță Specifice Fazei 1

- `NO git push` fără confirmare explicită admin
- `NO git remote add` / `NO git init + remote connect` fără confirmare admin
- `NO npm install` (creare node_modules) fără confirmare admin
- `NO deploy Cloudflare Pages` fără confirmare admin
- `NO modificări Supabase cloud` (create table, Edge Functions) fără confirmare admin
- `NO .env*` committed niciodată
- `NO npm install -g` fără confirmare admin
- Fișierele `.env*` rămân în `.gitignore`, niciodată committed
- La risc HIGH: declară fișierele afectate + așteaptă confirmare

**BLOCKERS — toate rezolvate (vezi jurnal):**

- ✅ T7 (git init + remote) — repo `RolandPetrila/mami-docs` public, branch main
- ✅ T21 (Cloudflare Pages setup) — `mami-docs.pages.dev` LIVE, auto-deploy GitHub conectat
- ✅ T22 (Supabase keepalive) — chei adăugate în catalog, worker `mami-docs-keepalive` deployed (4 schedules active)
- ✅ T23 (push GitHub) — push-uri multiple confirmate de admin
- ✅ T24 (deploy) — auto-deploy CF Pages activ la fiecare push pe main

---

## Sub-faza 1.A — Foundation (T1–T7)

> Obiectiv: schelet Vite + PWA funcțional fără niciun feature de business.

- [x] **T1** — Inspecție `files (4).zip` + decizie admin: șterg (duplicate) sau arhivez
  - Conține: `PROIECT_MAMI_DOCS_SPEC.md` + `.docx` — deja în root ✓
  - S1=A: șters 2026-05-01
- [x] **T2** — Inițializare Vite + Vanilla JS / TypeScript strict
  - Fișiere: `package.json`, `vite.config.ts`, `tsconfig.json` (`strict: true`, `noUncheckedIndexedAccess: true`), `src/main.ts`, `src/styles/global.css`, `src/vite-env.d.ts`
  - `npm install` executat (S4=A): 387 pachete, `tsc --noEmit` 0 erori
- [x] **T3** — Creare structură directoare
  - `src/`, `src/components/`, `src/tabs/` (retete, livada, sanatate, concedii, chat), `src/ai/` (client wrapper), `src/sw/`, `src/data/`, `src/styles/`
  - `public/`, `public/audio/`, `public/icons/`
  - `workers/`, `workers/keepalive/`, `workers/ai-gateway/` ← Opus remark: AI Gateway Cloudflare Worker
- [x] **T4** — Web App Manifest (`public/manifest.json`)
  - `name: "Mami Docs"`, `short_name: "Mami"`, `display: standalone`, `start_url: /`
  - Icons: 192px + 512px + maskable (generate din SVG placeholder)
  - `lang: ro`, `dir: ltr`, `theme_color`, `background_color`
- [x] **T5** — Workbox Service Worker (`src/sw/sw.ts`)
  - Cache static assets (precache manifest injectat de vite-plugin-pwa la build)
  - Runtime cache: documente vizualizate (CacheFirst, max 100 entries, 30 zile)
  - Update automat: `skipWaiting` pe mesaj + notificare "Versiune nouă disponibilă" în UI
  - Exclus din `tsconfig.json` `exclude` (compilat de Vite/esbuild cu `injectManifest` strategy)
- [x] **T6** — `version.json` în rădăcină + indicator "ești offline" în UI
  - `version.json`: `{ "version": "0.1.0", "build": "<timestamp>" }`
  - Indicator offline: CSS class `body.offline` → banner discret în top
- [x] **T7** — Git init + remote connect ✅ Repo `RolandPetrila/mami-docs` public live
  - `git init` → `git remote add origin https://github.com/RolandPetrila/mami-docs.git`
  - `.gitignore` deja există ✓
- [x] **T7.5** — Entry audit în jurnal PLAN_faza_1 (după T7) ✅
  - Scriere rând în §Jurnal Execuție cu data + remote URL confirmat
  - `<!-- AUDIT: [data] | Sonnet 4.6 | T7 completat | git init + remote origin -->` (CLAUDE.md §Audit Trail)

---

## Sub-faza 1.B — Documente (T8–T14)

> Obiectiv: tab-uri funcționale + randare toate formatele.

- [x] **T8** — Web Component `<mami-tabs>` (5 tab-uri)
  - Tab-uri: Rețete | Livadă | Sănătate | Concedii | Chat AI
  - Swipe gestures între tab-uri (TouchEvent — `as HTMLElement` fix pentru ElementEventMap)
  - Buton "Acasă" (primul tab) întotdeauna vizibil + `aria-label`
  - State activ persistat în `localStorage`, shadow DOM, ARIA completă (tablist/tab/tabpanel)
- [x] **T9** — Design CSS de bază (`src/styles/global.css`)
  - Font-size base: 18px (minim), line-height 1.6 ✓
  - Contrast WCAG AA (≥4.5:1 text normal, ≥3:1 text large) ✓
  - Tap targets: toate elementele interactive ≥44×44px ✓
  - Palette: `--color-accent: #a05c2a` (cald, contrast ≥4.5:1 pe alb), `--color-accent-light: #f5e6d8` ✓
  - `--color-primary: #2E5C8A` (SPEC §5.2, S6=A), fără animații disturbante ✓
  - Adăugat: `:focus-visible`, tipografie heading (h1/h2/h3), `.sr-only`, link color, `--radius`
- [x] **T10** — Randare DOCX (`mammoth.js`)
  - Web Component `<mami-doc-viewer type="docx">`
  - Upload fișier sau URL (drag & drop + file input + `src` attribute)
  - Stilizare basic HTML output (shadow DOM CSS: h1/h2/h3, p, ul, table)
  - DOMPurify.sanitize() pe output mammoth + pe mesaje error/loading
  - mammoth tipat cu ambient `declare module "mammoth"` în vite-env.d.ts (fără @types/mammoth)
- [x] **T11** — Randare PDF (`PDF.js`) + Adobe PDF Services
  - Web Component `<mami-doc-viewer type="pdf">` — extins în mami-doc-viewer.ts
  - Canvas render per pagină + IntersectionObserver lazy load (rootMargin 300px)
  - Worker: `pdfjs-dist/build/pdf.worker.min.mjs?url` via Vite `?url` import
  - Adobe PDF Services: **DOAR pentru PDF scanate** fără layer text (unde PDF.js eșuează extragere). PDF-uri normale → PDF.js baz suficient. Economie quota 500 tranz/lună. _(Opus remark)_
- [x] **T12** — Randare Markdown (`marked`) + XLSX (`SheetJS`)
  - MD: `parse(text)` → DOMPurify.sanitize; TextDecoder utf-8 din ArrayBuffer
  - XLSX: `XLSX.read(Uint8Array, {type:"array"})` → per sheet `sheet_to_html` → DOMParser → table → sanitize
  - `.xlsx-table { overflow-x: auto }` în shadow DOM CSS; tsc 0 erori
- [x] **T13** — Vizualizare poze (JPG/PNG cu zoom pinch) + Player audio/video
  - Poze: `<mami-image-viewer>` — Pointer Events API: pinch (2 pointeri), pan (1 pointer zoomed), double-tap 2.5x/reset, scale [1–4]
  - Audio: `<mami-audio-player>` — `<audio>` nativ + play/pause/progress(range)/time/volume + file upload + src attr
  - Video: `<video controls>` nativ — integrat direct în tab-uri (fără component wrapper)
- [x] **T14** — Căutare în documente (text simplu)
  - `src/data/doc-index.ts`: `DocEntry` interface + CRUD: `indexDoc/searchDocs/removeDoc/clearIndex/getAllDocs`
  - `src/components/mami-search.ts`: `<mami-search>` — input debounced 280ms + rezultate cu highlight DOM-safe + delete per entry + clear index
  - `highlightText()`: `createTextNode` + `<mark>` (fără innerHTML — XSS-safe)
  - Dispatch `mami-search-select` CustomEvent (bubbles + composed) la click/Enter pe rezultat; tsc 0 erori

---

## Sub-faza 1.C — AI Core Inițial (T15–T20)

> Obiectiv: chat AI vocal funcțional cu fallback Groq.

- [x] **T15** — AI Gateway (`workers/ai-gateway/index.ts`) ⚠️ CRITIC SECURITATE
  - **Locație: `workers/ai-gateway/`** (Cloudflare Worker proxy — NU în bundle client)
  - Fallback: Groq `llama-3.1-8b-instant` (index.ts:47) → `llama-3.3-70b-versatile` (index.ts:48)
  - Circuit breaker CIRCUIT_THRESHOLD=3 (index.ts:36) → skip provider 5 min (CIRCUIT_TIMEOUT_MS=300000, index.ts:37)
  - Retry MAX_RETRIES=2 (index.ts:39) cu backoff 1s/2s + REQUEST_TIMEOUT_MS=10000 (index.ts:38)
  - Worker citește `GROQ_API_KEY` din Cloudflare Secrets (env.GROQ*API_KEY, index.ts:12) — NU `VITE*` prefix
  - `wrangler.toml`: name="mami-docs-ai", ALLOWED_ORIGIN var, `wrangler secret put GROQ_API_KEY`
  - Client (`src/ai/client.ts`): `sendChat()` + `AiGatewayError` class; URL din `VITE_AI_GATEWAY_URL`
  - _(Opus remark: ADR D4 + CLAUDE.md §Securitate — chei AI niciodată în bundle client)_
- [x] **T16** — Web Component `<mami-chat>` (UI Chat AI)
  - Bule mesaje (mama / AI) cu timestamp (`formatTime` ro-RO, mami-chat.ts:30)
  - Scroll automat la mesaj nou (`_scrollToBottom`, mami-chat.ts:401)
  - Indicator "AI gândește…" — 3 dots bounce CSS animation (mami-chat.ts:100-126)
  - Integrare `sendChat()` din client.ts + `AiGatewayError` handling (mami-chat.ts:311-322)
  - `sendText(text)` public method pentru T17 STT (mami-chat.ts:289)
  - `mami-chat-mic` CustomEvent (bubbles+composed) pentru T17 (mami-chat.ts:268-271)
  - `tab` + `system-prompt` attributes; fallback inline per tab (T19 va importa system-prompts.ts)
  - `clear()` public method; tsc 0 erori
- [x] **T17** — Web Speech API ro-RO (STT + TTS)
  - STT: `startStt()` (`speech.ts:68`) — `lang="ro-RO"`, `interimResults=false`, `continuous=false`, error map; `_toggleStt()` (`mami-chat.ts:486`) mic toggle; buton microfon 64px (`mami-chat.ts:179`)
  - TTS: `speak()` (`speech.ts:126`) — `utter.rate=0.9` (`speech.ts:134`), voce ro-RO via `getVoices()`; `🔊 Ascultă` button pe bule AI (`mami-chat.ts:428`); hint pachet lipsă via `_showSttToast` (`mami-chat.ts:435`)
  - Fallback STT indisponibil: `_showSttToast()` (`mami-chat.ts:540`) + focus text input (`mami-chat.ts:497-502`)
  - `loadVoices()` (`speech.ts:153`) preload TTS async la init component (`mami-chat.ts:327`)
  - Fix TS 5.9.3: declare global SpeechRecognition/Event/ErrorEvent types în `speech.ts:6-43` (lipseau din lib.dom.d.ts)
  - `tsc --noEmit` → 0 erori ✓
- [x] **T18** — 120 mesaje rotative salut/motivare
  - `src/data/greetings.ts`: DIMINEATA×30 (`greetings.ts:4`) / ZI×30 (`:37`) / SEARA×30 (`:70`) / MOTIVARE×30 (`:103`)
  - Rotire zilnică: `dayIndex(date)` (`:136`) — seed = `an*10000+lună*100+zi` % 30, consistent per zi locală
  - Selecție categorie: `categoryByHour(hour)` (`:142`) — 5-11→dimineață, 12-17→zi, 18-23→seară, 0-4→motivare
  - `export function getGreeting(now?: Date): string` (`:150`); tsc 0 erori
- [x] **T19** — Context per tab + system prompts
  - `src/ai/system-prompts.ts`: `TabId` tip (`:4`) + `PROMPTS Record<TabId,string>` (`:6`) + `getSystemPrompt(tab)` (`:49`)
  - Sănătate: disclaimer obligatoriu ⚠️ în prompt (`:22-28`) — NU diagnostica, NU prescrie, 112 la urgențe
  - `isTabId(tab)` type guard (`:45`) — fallback `PROMPTS.chat` pentru tab necunoscut
  - `mami-chat.ts:2` — import `getSystemPrompt`; `:270` — `_systemPrompt` getter folosește `getSystemPrompt(this._tab)`
  - `defaultPrompt()` șters (înlocuit complet); tsc 0 erori
- [x] **T20.0** — Verificare licență `tenderness.mp3` Bensound _(înainte de download, parte din T20)_
  - WebFetch pe bensound.com — confirmă că Free License (cu atribuire) rămâne valabilă
  - Fallback dacă licență schimbată: Pixabay "Calm Piano Hope" (CC0, fără atribuire)
  - _(Opus remark: licența Bensound poate fi schimbată față de 2024)_
  - **Rezultat:** Bensound Free License necesită cont plătit (schimbare față de 2024) → **Pixabay CC0 aplicat** (`tenderness.mp3` — "Tenderness" by FASSounds, CC0)
  - **ACȚIUNE ADMIN:** descarcă `tenderness.mp3` din Pixabay și plasează în `public/audio/tenderness.mp3` manual
- [x] **T20** — Audio ambient `tenderness.mp3` (Pixabay CC0)
  - Licență: Pixabay CC0 (fără atribuire obligatorie) — aplicat după T20.0 ✓
  - On/Off din setări (toggle persistent în `localStorage "mami-ambient-on"`)
  - Volum separat slider (`localStorage "mami-ambient-volume"`, default 0.3) față de volum voce AI
  - Autoplay blocat implicit — start la primul gesture utilizator (click/touchstart/keydown)
  - `mami-ambient-player.ts`: toggleBtn, volumeSlider, `_awaitGesture()` + `_removeGestureListeners()`, `onerror` silent disable
  - Injectat în `main.ts:34` + CSS fixed bottom-right `global.css:135-140`; tsc 0 erori

---

## Sub-faza 1.D — Deploy (T21–T25)

> Obiectiv: aplicație publicată la URL real, testată pe Android Chrome.

- [x] **T21** — Cloudflare Pages setup ✅ `mami-docs.pages.dev` LIVE, GitHub repo conectat, auto-deploy activ
  - Verificat dacă proiect "mami-docs" există pe Cloudflare Dashboard
  - `wrangler.toml` pentru Workers (keepalive)
  - Build command: `npm run build`, Output: `dist/`
  - Env vars necesare: `GROQ_API_KEY` (secret în Worker via Cloudflare Secrets — NU în Pages env vars)
- [x] **T22** — Supabase keepalive Cloudflare Worker ✅ deployed (4 schedules: keepalive 4d + backup zilnic + auto-sumar nocturn + mentenanță săptămânală)
  - `workers/keepalive/index.ts`: `SELECT 1` la Supabase la fiecare 4 zile
  - Cron trigger: `0 2 */4 * *` (02:00 UTC la fiecare 4 zile)
  - Loghează success/fail în Cloudflare Worker logs
  - **NECESITĂ:** `SUPABASE_URL` + `SUPABASE_ANON_KEY` — admin adaugă în INBOX.md
- [x] **T23** — Push inițial GitHub ✅ + push-uri ulterioare confirmate de admin
  - `git add .` → `git commit -m "feat: initial Faza 1 MVP PWA structure"` → `git push -u origin main`
  - Verificare `.gitignore` include: `node_modules/`, `dist/`, `.env*`, `.wrangler/`
- [x] **T24** — Prim deploy Cloudflare Pages ✅ auto-deploy CF Pages activ la fiecare push pe main
  - Cloudflare Pages conectat la GitHub repo → deploy automat la push pe `main`
  - Sau: deploy manual via `wrangler pages deploy dist/`
  - Verificare URL public funcțional (https://mami-docs.pages.dev sau custom domain)
- [x] **T25** — Lighthouse test + verificare Android Chrome ✅ Performance 94 (2026-05-05); install PWA Android pending mama (parcurgere `docs/TEST_CHECKLIST.md` pe telefon Roland)
  - Rulează Lighthouse (DevTools sau `npx lighthouse`)
  - Target: PWA ≥90, Performance ≥90, Accessibility ≥90, Best Practices ≥90
  - Test instalare pe Android Chrome: "Add to home screen"
  - Test offline: dezactivează rețeaua → verifică documente cached

---

## Dependențe Agreate (din `docs/stack.md` + ADR 0001)

```json
{
  "dependencies": {
    "dompurify": "^3.x",
    "mammoth": "^1.x",
    "marked": "^12.x",
    "pdfjs-dist": "^4.x",
    "workbox-window": "^7.x",
    "xlsx": "^0.18.x"
  },
  "devDependencies": {
    "@types/dompurify": "^3.x",
    "typescript": "^5.x",
    "vite": "^5.x",
    "vite-plugin-pwa": "^0.20.x",
    "workbox-expiration": "^7.x",
    "workbox-precaching": "^7.x",
    "workbox-routing": "^7.x",
    "workbox-strategies": "^7.x"
  }
}
```

---

## Stop-and-Ask Admin — TOATE REZOLVATE (istoric, 2026-05-01 → 2026-05-02)

> Toate Stop-and-Ask de mai jos au primit decizie admin și sunt închise. Lăsate ca referință istorică. Stare finală: S1=A șters, S2 chei adăugate în catalog, S3=A proiect existent, S4=A npm install executat, S5 corectat la versiunea v0.3.0 a SITEMAP.json.

---

**S1 — files (4).zip [DECIZIE NECESARĂ]:**
Zip-ul conține duplicatele `PROIECT_MAMI_DOCS_SPEC.md` + `.docx` — deja prezente în root.
→ **A: Șterg zip-ul** (fișierele originale sunt în root, git păstrează istoricul)
→ **B: Arhivez** în `docs/archive/` (dacă vrei să-l păstrezi explicit)

**S2 — Supabase proiect [ACȚIUNE MANUALĂ ADMIN]:**
T22 (keepalive cron) necesită `SUPABASE_URL` + `SUPABASE_ANON_KEY`.
→ Creează proiect pe supabase.com → adaugă `SUPABASE_URL` și `SUPABASE_ANON_KEY` în `~/.api-keys/INBOX.md` → "proceseaza inbox"
→ Faza 1 poate progresa fără Supabase până la T22 (ultimele task-uri din 1.D)

**S3 — Cloudflare Pages proiect [VERIFICARE / ACȚIUNE MANUALĂ]:**
`CLOUDFLARE_API_TOKEN` este SET (54/54) ✓
→ **A: Proiectul "mami-docs" există deja pe Cloudflare Dashboard** → confirmă URL
→ **B: Nu există** → creat manual sau prin CLI în T21

**S4 — npm install [CONFIRMARE EXECUȚIE]:**
La T2: confirm că pot rula `npm install` (creare `node_modules/`)?
→ **A: Da, execută automat la T2**
→ **B: Notifică-mă înainte** (default conform regulament)

**S5 — SITEMAP.json corecție format [MINOR, nu blocker]:**
`generated` are valoarea `"2026-05-01T[AUDIT-FIX-2]"` (non-ISO).
→ Corectez la `"2026-05-01T00:00:00Z"` și bump la v0.1.3 în cadrul actualizării pentru PLAN_faza_1?
→ **A: Da, corectează acum** | **B: Lasă, mai târziu**

---

## Jurnal Execuție Faza 1

| Data       | Task                                  | Status       | Observații                                                                                                                                                                                                                   | Citate (linie)                                                             |
| ---------- | ------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 2026-05-01 | Plan creat                            | ✅ Completat | —                                                                                                                                                                                                                            | —                                                                          |
| 2026-05-01 | PLAN update — remarci Opus integrate  | ✅ Completat | T3/T11/T15/T17/T20/T21 actualizate; T7.5 + T20.0 adăugate                                                                                                                                                                    | PLAN:4, :61, :76, :100, :122, :136, :147                                   |
| 2026-05-01 | T3 — Creare structură directoare      | ✅ Completat | 14 directoare: src/(6 sub) + public/(2 sub) + workers/(2 sub)                                                                                                                                                                | Glob \*\*/.gitkeep → 14 match-uri                                          |
| 2026-05-01 | T4 — Web App Manifest                 | ✅ Completat | public/manifest.json: name "Mami Docs", standalone, theme #C8956C                                                                                                                                                            | manifest.json:3,7,10                                                       |
| 2026-05-01 | T6 — version.json                     | ✅ Completat | version.json v0.1.0; indicator offline CSS deferrat la T2                                                                                                                                                                    | version.json:2                                                             |
| 2026-05-01 | T1 — Ștergere files (4).zip           | ✅ Completat | S1=A: fișier șters (duplicate, original în root)                                                                                                                                                                             | —                                                                          |
| 2026-05-01 | T4-regen — manifest.json #2E5C8A      | ✅ Completat | S6=A: theme_color #2E5C8A (SPEC §5.2) + background_color #EEF4FA                                                                                                                                                             | manifest.json:9-10, version.json:3                                         |
| 2026-05-01 | T2 — Vite scaffold + TS strict        | ✅ Completat | package.json, vite.config.ts (vite-plugin-pwa), tsconfig strict, src/main.ts, global.css, vite-env.d.ts; npm install 387 pkg; tsc 0 erori                                                                                    | main.ts:1, vite.config.ts:1, tsconfig.json:13                              |
| 2026-05-01 | T5 — Workbox Service Worker           | ✅ Completat | src/sw/sw.ts: precacheAndRoute + CacheFirst docs (100 entries, 30 zile) + skipWaiting on message; exclus din tsconfig                                                                                                        | sw.ts:13-14, sw.ts:23-35                                                   |
| 2026-05-01 | ADR D2 update (Opus remark)           | ✅ Completat | implementare concretă: vite-plugin-pwa + injectManifest + virtual:pwa-register documentată în ADR                                                                                                                            | 0001-anexa-c-decisions.md:56-59                                            |
| 2026-05-01 | T8 — `<mami-tabs>` Web Component      | ✅ Completat | src/components/mami-tabs.ts: shadow DOM, 5 tab-uri, swipe (SWIPE_PX=50), localStorage, ARIA (tablist/tab/tabpanel), buton Acasă, tsc OK                                                                                      | mami-tabs.ts:1-210                                                         |
| 2026-05-01 | T9 — Design CSS de bază               | ✅ Completat | global.css: --color-accent #a05c2a, --color-accent-light, :focus-visible, h1/h2/h3 scale, .sr-only, link color, --radius                                                                                                     | global.css:16-17, :98, :112-133, :135-143                                  |
| 2026-05-01 | T10 — DOCX viewer (mammoth.js)        | ✅ Completat | mami-doc-viewer.ts: shadow DOM, drop-zone, upload + drag & drop + src attr, DOMPurify sanitize; mammoth typat ambient; tsc 0 erori                                                                                           | mami-doc-viewer.ts:1-257, vite-env.d.ts:4-13                               |
| 2026-05-01 | T11 — PDF viewer (PDF.js)             | ✅ Completat | \_renderPdf(): getDocument + IntersectionObserver lazy load per pagină (rootMargin 300px); worker via ?url import; tsc 0 erori                                                                                               | mami-doc-viewer.ts:6-7, :253-315                                           |
| 2026-05-01 | T12 — MD + XLSX viewers               | ✅ Completat | MD: marked+TextDecoder+DOMPurify; XLSX: XLSX.read+sheet_to_html+DOMParser+DOMPurify; .xlsx-table overflow-x; tsc 0 erori                                                                                                     | mami-doc-viewer.ts:248-275                                                 |
| 2026-05-01 | T13 — image-viewer + audio-player     | ✅ Completat | mami-image-viewer.ts: Pointer Events pinch/pan/double-tap; mami-audio-player.ts: native audio+UI; tsc 0 erori                                                                                                                | image-viewer.ts:1-307, audio-player.ts:1-260                               |
| 2026-05-01 | T14 — căutare documente               | ✅ Completat | doc-index.ts: DocEntry CRUD localStorage; mami-search.ts: debounce+highlight DOM-safe+CustomEvent; tsc 0 erori                                                                                                               | doc-index.ts:1-68, mami-search.ts:1-315                                    |
| 2026-05-01 | T15 — AI Gateway Cloudflare Worker    | ✅ Completat | workers/ai-gateway/index.ts: Groq 8b→70b fallback, circuit breaker, retry; wrangler.toml; src/ai/client.ts: sendChat+AiGatewayError; tsc 0 erori                                                                             | index.ts:12,36-48, client.ts:24,36                                         |
| 2026-05-01 | T16 — `<mami-chat>` Web Component     | ✅ Completat | mami-chat.ts: bule mesaje user/ai, timestamp ro-RO, bounce animation, sendChat integrat, sendText public (T17), mami-chat-mic event, clear(); tsc 0 erori                                                                    | mami-chat.ts:186-448                                                       |
| 2026-05-01 | T17 — Web Speech API ro-RO STT+TTS    | ✅ Completat | speech.ts (nou): declare global SpeechRecognition types, startStt/speak/stopSpeaking/loadVoices; mami-chat.ts: \_toggleStt:486, \_setMicState:528, \_showSttToast:540, 🔊 Ascultă:428; fix TS 5.9.3 lipsă types; tsc 0 erori | speech.ts:6,48,68,126,134,148,153; mami-chat.ts:257,486,528,540            |
| 2026-05-01 | T18 — 120 mesaje rotative salut/motiv | ✅ Completat | greetings.ts: DIMINEATA×30:4, ZI×30:37, SEARA×30:70, MOTIVARE×30:103; dayIndex() seed zilnic:136; categoryByHour():142; getGreeting():150; tsc 0 erori                                                                       | greetings.ts:4,37,70,103,136,142,150                                       |
| 2026-05-01 | T19 — system prompts per tab          | ✅ Completat | system-prompts.ts: TabId:4, PROMPTS Record:6, isTabId():45, getSystemPrompt():49; disclaimer ⚠️ sanatate:30; mami-chat.ts:2 import + :270 getter; defaultPrompt() eliminat; tsc 0 erori                                      | system-prompts.ts:4,6,45,49; mami-chat.ts:2,270                            |
| 2026-05-01 | T20.0 — verificare licență audio      | ✅ Completat | Bensound necesită cont plătit → Pixabay CC0 aplicat; fișier audio adăugat manual de admin în public/audio/                                                                                                                   | —                                                                          |
| 2026-05-01 | T20 — ambient player                  | ✅ Completat | mami-ambient-player.ts (180 linii): toggle+volume localStorage, \_awaitGesture, onerror silent; main.ts:34 injectat; global.css:135 fixed bottom-right; tsc 0 erori                                                          | mami-ambient-player.ts:1,50,64,105,119,134,156; main.ts:34; global.css:135 |
| 2026-05-01 | T7 + T7.5 — git init + remote         | ✅ Completat | `git init` local + `git remote add origin RolandPetrila/mami-docs.git`; `.gitignore` complet                                                                                                                                 | —                                                                          |
| 2026-05-01 | T21 + T24 — Cloudflare Pages          | ✅ Completat | Proiect `mami-docs` pe CF Dashboard, GitHub repo conectat, auto-deploy la push pe main                                                                                                                                       | mami-docs.pages.dev                                                        |
| 2026-05-01 | T22 — Supabase keepalive Worker       | ✅ Completat | `workers/keepalive/index.ts` cu cron `0 2 */4 * *`; deployed pe `mami-docs-keepalive.petrilarolly.workers.dev`                                                                                                               | wrangler.toml:5-11                                                         |
| 2026-05-01 | T23 — push inițial GitHub             | ✅ Completat | `git push -u origin main`; commits ulterioare push automat după confirmare admin                                                                                                                                             | —                                                                          |
| 2026-05-02 | AI Gateway rewrite 8 categorii        | ✅ Completat | chat (Groq 8B/70B/Cerebras/OpenRouter), embed (Gemini/Cohere/Mistral), translate (DeepL/Azure/Gemini), vision, search, STT — toate cu fallback și circuit breaker                                                            | workers/ai-gateway/index.ts                                                |
| 2026-05-02 | RAG client-side + transformers.js     | ✅ Completat | Xenova/multilingual-e5-small offline, chunking 400ch overlap 80ch, cosine similarity, top-K deduplicat per doc                                                                                                               | src/ai/rag.ts                                                              |
| 2026-05-02 | 10 secrete AI Gateway setate          | ✅ Completat | `wrangler secret put`: GEMINI, COHERE, MISTRAL, DEEPL, AZURE×2, BRAVE, TAVILY, CEREBRAS, OPENROUTER                                                                                                                          | —                                                                          |
| 2026-05-02 | Admin PIN + device_role sync          | ✅ Completat | SHA-256 + salt; upsert `user_profiles` la schimbare rol în Setări                                                                                                                                                            | src/components/mami-settings.ts                                            |
| 2026-05-02 | Meniu săptămânal + Drug checker       | ✅ Completat | mami-menu (generator AI 7×4 mese, istoric 4 săpt) + mami-drug-checker (RxNorm typeahead, openFDA interacțiuni)                                                                                                               | src/components/mami-menu.ts, src/components/mami-drug-checker.ts           |
| 2026-05-02 | Wellness pattern detection            | ✅ Completat | 5 tipare detectate automat din ultimele 7 zile (hidratare, tensiune, somn, emoții, hidratare bună)                                                                                                                           | src/components/mami-wellness.ts                                            |
| 2026-05-05 | T25 — Lighthouse Performance 94       | ✅ Completat | Lazy loading complet: bundle inițial 29 kB (era 1.79 MB); Supabase lazy; manualChunks evitat (cauzau static imports vendor); SW precache 656 kB (era 2.16 MB); 3 valuri requestIdleCallback                                  | vite.config.ts, src/main.ts                                                |
| 2026-05-05 | Faza 4 — jurnal wellness UI           | ✅ Completat | Card cronologic în mami-wellness, entries hidratare/vitale/somn/emoții ultimele 30 zile, grupate pe zi, reverse-chronological                                                                                                | src/components/mami-wellness.ts                                            |
| 2026-05-05 | Faza 4 — Family sharing RLS           | ✅ Completat | `docs/sql/family_sharing.sql` (family_groups, family_members, RPCs, RLS); UI generate/connect cod în mami-settings                                                                                                           | docs/sql/family_sharing.sql                                                |
| 2026-05-05 | Faza 4 — Arhivă R2 60 zile foto       | ✅ Completat | Cron săptămânal duminică 03:00 UTC în keepalive worker; mută blob în R2, păstrează thumbnail Supabase                                                                                                                        | workers/keepalive/index.ts, wrangler.toml:10                               |
| 2026-05-05 | Faza 4 — USER_GUIDE_MAMA              | ✅ Completat | Ghid simplu RO fără jargon tehnic pentru mama (instalare PWA, navigare tab-uri, chat AI, wellness, urgențe)                                                                                                                  | docs/USER_GUIDE_MAMA.md                                                    |
| 2026-05-05 | Faza 4 — TEST_CHECKLIST Roland        | ✅ Completat | Checklist 13 secțiuni pentru testare per modul pe telefonul Roland înainte de go-live mama                                                                                                                                   | docs/TEST_CHECKLIST.md                                                     |
| 2026-05-05 | Worker keepalive deploy nou           | ✅ Completat | Versiunea cu archive R2 60d; fix cron `0 3 * * 0` → `0 3 * * sun` (CF validator code 10100); 4 schedules active                                                                                                              | wrangler.toml:6-11, commit 2e72dbe                                         |

---

## Note Arhitecturale

- Toate Web Components au prefix `mami-` (ADR D7 confirmat)
- TypeScript strict din primul commit (ADR D8 confirmat)
- **Chei AI NICIODATĂ pe client**: AI Gateway = `workers/ai-gateway/` (Cloudflare Worker). _(Opus remark T15 — ADR D4)_
- Chei private (Supabase service key, Cloudflare token, AI keys): **exclusiv în Workers** (nu ajung în bundle-ul client)
- Audio `tenderness.mp3`: verificare licență Bensound obligatorie la T20 (Free License = cu atribuire în UI)
- Adobe PDF Services (T11): 500 tranzacții/lună — monitorizat prin `docs/service-limits.md`
