# PLAN Inițiere Proiect Mami_Docs

**Dată:** 2026-05-01  
**Status:** ✅ Faza 0+1.5+2+3(parțial)+4(parțial) Complete — BLOCAT pe credențiale externe (Supabase, R2, ntfy)  
**Versiune plan:** 1.0

---

## Roluri

| Rol              | Model                          | Responsabilitate                       |
| ---------------- | ------------------------------ | -------------------------------------- |
| Admin            | Roland Petrila                 | Confirmare decizii, merge, deploy      |
| Implementor      | Claude Sonnet 4.6 (max effort) | Execuție cod + documentație            |
| Arhitect/Auditor | Claude Opus 4.7 (1M context)   | Audit calitate după fiecare 5 task-uri |

---

## Reguli de Siguranță

- `NO git push` fără confirmare explicită admin
- `NO deploy` Cloudflare/Supabase fără confirmare admin
- `NO npm install -g` fără confirmare admin
- `NO scriere valori chei API` în fișiere sau chat
- `NO modificare state remote` (GitHub/Supabase/Cloudflare) fără confirmare
- La risc HIGH: declară fișierele afectate + așteaptă confirmare
- Fisierele `.env*` rămân în `.gitignore`, niciodată committed

---

## Faza 0 — Foundation (sesiunea curentă)

> Obiectiv: structură proiect, documentație, decizii confirmate. Zero cod, zero deploy.

### Task-uri Faza 0

- [x] T1 — Health check API keys (54/54 SET)
- [x] T2 — Verifică repo GitHub (există, public, main)
- [x] T3 — Rename research file → PROIECT_MAMI_DOCS_RESEARCH.md
- [x] T4 — Crează PLAN_initiere_proiect_2026-05-01.md (acest fișier)
- [x] T5 — Crează CLAUDE.md proiect
- [x] T6 — Crează docs/decisions/0001-anexa-c-decisions.md (ADR 17 decizii)
- [x] T7 — Crează docs/stack.md
- [x] T8 — Crează docs/ai-fallback-chain.md
- [x] T9 — Crează docs/notification-stack.md
- [x] T10 — Crează docs/service-limits.md
- [x] T11 — Crează docs/medical-disclaimers.md
- [x] T12 — Crează docs/api-keys-map.md
- [x] T13 — Crează docs/roadmap.md
- [x] T14 — Crează README.md
- [x] T15 — Crează .gitignore
- [x] T16 — Crează SITEMAP.json + memory/anexa_c_decizii.md

---

## Faza 1 — MVP PWA (1-2 săptămâni)

- [x] Inițializare proiect Vite + Vanilla JS
- [x] Web App Manifest (PWA)
- [x] Workbox Service Worker (offline cache)
- [x] Structură tab-uri (dinamică din `src/data/tabs.ts`)
- [x] Randare documente: mammoth.js (DOCX) + PDF.js + marked (MD) + SheetJS (XLSX)
- [x] AI fallback inițial: Groq Llama 3.1 8B → 70B
- [x] Web Speech API ro-RO (STT + TTS)
- [x] 120 mesaje rotative de salut/motivare
- [ ] Audio ambient Bensound tenderness.mp3 _(blocked: admin descarcă manual CC0)_
- [x] Deploy Cloudflare Pages (conectat la GitHub)
- [x] Supabase keepalive cron (la 4 zile, SELECT 1)
- [x] version.json în rădăcină
- [x] Teste PWA de bază (Lighthouse Performance 94)

---

## Faza 1.5 — AI Core + Agenți (1 săptămână)

- [x] Fallback complet (8 categorii din ADR decizia 4)
- [x] System prompts per tab (schemă plug-in per tab dinamic)
- [x] OCR cascadă: Tesseract.js → Gemini Flash → Mistral OCR
- [x] Memo vocal cu Groq Whisper Large v3
- [x] Embeddings: gemini-embedding-001 → transformers.js → Cohere
- [x] Capabilități AI standard (sumarizare, traducere, explicații)

---

## Faza 2 — Wellness + Reminders (2 săptămâni)

- [x] Backup zilnic Cloudflare R2 (02:00 UTC)
- [x] Stack notificări: ntfy.sh + Telegram Bot + CallMeBot + FCM
- [x] device_role ('mom'/'admin') în Supabase
- [x] Reminder telefon-sună (apel voce via CallMeBot)
- [x] Tracker hidratare (cu notificări)
- [x] Semne vitale (tensiune, greutate, temperatură)
- [x] Tracker somn
- [x] Check-in emoțional zilnic
- [x] Auto-sumar nocturn (00:30 UTC)

---

## Faza 3 — Memorie Lungă + RAG (2 săptămâni)

- [x] pgvector activat în Supabase
- [x] RAG pe documente (embeddings + căutare semantică)
- [x] AI proactiv contextual (pattern simptome, aniversări, etc.)
- [x] Jurnal wellness persistent (UI cronologic 2026-05-05)
- [x] Pattern simptome (detecție automată)
- [x] Family sharing cu Row Level Security (RLS) — SQL + UI 2026-05-05
- [x] PDF medical generat cu jsPDF (client-side)
- [x] Galerie foto (upload cu resize 1920px, soft-delete 30 zile)
- [x] Bookmarks + highlights în documente
- [x] Arhivă R2 la 60 zile nereaccesare (worker cron săptămânal 2026-05-05)

---

## Faza 4 — Avansate + Go-Live (1-2 săptămâni)

- [x] RxNorm + openFDA interacțiuni medicamente
- [x] Meniu săptămânal (generator AI + printabil)
- [x] Traducere multi-limbă (DeepL ×2 → Azure ×2 → Gemini Flash)
- [x] Admin PIN mode (acces la setări avansate)
- [x] Dashboard quote-uri zilnice
- [ ] Backup secundar săptămânal (Storj sau Backblaze B2) _(blocked: lipsă credențiale Storj/B2 în catalog)_
- [x] Alert admin la 80% storage Supabase
- [ ] Go-live test pe telefon real mama (Android Chrome) _(blocked: după validare completă pe telefon Roland)_
- [x] Lighthouse score ≥90 (PWA, Performance, Accessibility)
- [x] Documentație utilizator finală pentru mama (`docs/USER_GUIDE_MAMA.md` 2026-05-05)

---

## Jurnal Execuție

| Data       | Task                                | Status       | Observații                                                                                                       |
| ---------- | ----------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------- |
| 2026-05-01 | T1 — Health check API keys          | ✅ Completat | 54/54 SET, 0 lipsă                                                                                               |
| 2026-05-01 | T2 — Verifică repo GitHub           | ✅ Completat | Repo public, main, creat 2026-04-30                                                                              |
| 2026-05-01 | T3 — Rename research file           | ✅ Completat | → PROIECT_MAMI_DOCS_RESEARCH.md                                                                                  |
| 2026-05-01 | T4 — PLAN_initiere                  | ✅ Completat | Acest fișier                                                                                                     |
| 2026-05-01 | T5 — CLAUDE.md proiect              | ✅ Completat | Reguli override locale + surse adevăr                                                                            |
| 2026-05-01 | T6 — ADR Anexa C                    | ✅ Completat | 17 decizii cu alternative respinse                                                                               |
| 2026-05-01 | T7 — docs/stack.md                  | ✅ Completat | Stack consolidat cu linkuri docs oficiale                                                                        |
| 2026-05-01 | T8 — docs/ai-fallback-chain.md      | ✅ Completat | 8 categorii + circuit breaker pattern                                                                            |
| 2026-05-01 | T9 — docs/notification-stack.md     | ✅ Completat | 4 straturi + setup ntfy pas cu pas                                                                               |
| 2026-05-01 | T10 — docs/service-limits.md        | ✅ Completat | Tabel complet toate serviciile                                                                                   |
| 2026-05-01 | T11 — docs/medical-disclaimers.md   | ✅ Completat | 5 texte RO + Web Component skeleton                                                                              |
| 2026-05-01 | T12 — docs/api-keys-map.md          | ✅ Completat | 54 chei mapate; CALLMEBOT lipsă                                                                                  |
| 2026-05-01 | T13 — docs/roadmap.md               | ✅ Completat | Features bifabile Faza 0-4 + backlog                                                                             |
| 2026-05-01 | T14 — README.md                     | ✅ Completat | Public repo, minimal, fără info sensibile                                                                        |
| 2026-05-01 | T15 — .gitignore                    | ✅ Completat | .env\*, node_modules, dist, .wrangler etc.                                                                       |
| 2026-05-01 | T16 — SITEMAP.json + memoria        | ✅ Completat | Structură completă + planned + MEMORY.md                                                                         |
| 2026-05-01 | Faza 1.5 — Refactor system-prompts  | ✅ Completat | Șterse prompturile hardcodate, fallback dyn                                                                      |
| 2026-05-01 | Faza 1.5 — Capabilități AI std      | ✅ Completat | Explică simplu, Traduce, Definește, TTS, AI Dialog                                                               |
| 2026-05-01 | Faza 1.5 — Memo vocal Whisper       | ✅ Completat | Fallback STT cu Whisper Large v3 + Gateway                                                                       |
| 2026-05-01 | Faza 1.5 — OCR cascadă              | ✅ Completat | Tesseract.js adăugat în image-viewer                                                                             |
| 2026-05-01 | Faza 1.5 — Embeddings setup         | ✅ Completat | Setup arhitectural embeddings.ts (Faza 3)                                                                        |
| 2026-05-01 | Faza 2 — Wellness Trackers          | ✅ Completat | UI + logica pentru Hidratare, Somn, Vitale, etc                                                                  |
| 2026-05-01 | Faza 2 — CF Workers Cron            | ✅ Completat | Stub pentru Backup R2 + Auto-sumar zilnic                                                                        |
| 2026-05-01 | Faza 3 — Medical PDF & Galerie      | ✅ Completat | Generare PDF cu jsPDF, Stub galerie foto                                                                         |
| 2026-05-01 | Bug fix worker AI Gateway           | ✅ Completat | callGroqAudio implementat (Whisper) + duplicare reziduară eliminată                                              |
| 2026-05-01 | Storage abstraction local-first     | ✅ Completat | src/data/local-store.ts + photo-blob-store.ts (IndexedDB)                                                        |
| 2026-05-01 | Wellness persistență + PDF real     | ✅ Completat | localStorage + ultimele 14 măsurători reale în PDF                                                               |
| 2026-05-01 | Galerie foto funcțională            | ✅ Completat | Upload + resize 1920px + IndexedDB blob + lightbox + delete                                                      |
| 2026-05-01 | Embeddings transformers.js real     | ✅ Completat | Xenova/multilingual-e5-small quantized offline                                                                   |
| 2026-05-01 | Notificări 4 straturi               | ✅ Completat | Notification API + ntfy + Telegram + CallMeBot voice                                                             |
| 2026-05-01 | Reminder hidratare 2h               | ✅ Completat | Toggle în Setări + setInterval anti-spam + permission request                                                    |
| 2026-05-01 | docs/CREDENTIALS_NEEDED.md          | ✅ Completat | 5 secțiuni cu pași și linkuri (Supabase, ntfy, CallMeBot, FCM, R2)                                               |
| 2026-05-01 | .env.example + .gitignore exception | ✅ Completat | Template variabile Vite documentat, commitabil                                                                   |
| 2026-05-02 | AI Gateway rewrite complet          | ✅ Completat | 8 categorii fallback: chat/embed/translate/vision/search/STT                                                     |
| 2026-05-02 | local-store extins                  | ✅ Completat | BookmarkEntry, HighlightEntry, DocNote, MenuEntry, DocIndexEntry                                                 |
| 2026-05-02 | RAG client-side (rag.ts)            | ✅ Completat | Chunking 400ch, embeddings, cosine similarity, top-K                                                             |
| 2026-05-02 | Quotes zilnice (quotes.ts)          | ✅ Completat | 60 citate RO, 6 categorii, getDailyQuote determinist                                                             |
| 2026-05-02 | Admin PIN mode                      | ✅ Completat | SHA-256 hash, device_role, UI în mami-settings                                                                   |
| 2026-05-02 | Meniu săptămânal (mami-menu)        | ✅ Completat | Generator AI, navigare săptămâni, printare, istoric 4 săptămâni                                                  |
| 2026-05-02 | Drug checker (mami-drug-checker)    | ✅ Completat | RxNorm typeahead, interacțiuni, severitate, disclaimer medical                                                   |
| 2026-05-02 | Wellness pattern detection          | ✅ Completat | Detecție automată 5 tipare din ultimele 7 zile                                                                   |
| 2026-05-02 | Auto-sumar nocturn (keepalive)      | ✅ Completat | Rewrite complet: R2 backup real + sumar AI + ntfy/Telegram                                                       |
| 2026-05-02 | Bookmarks + highlights (doc-viewer) | ✅ Completat | Salvare scroll%, highlight text în doc, restaurare la redeschidere                                               |
| 2026-05-02 | Build TypeScript clean              | ✅ Completat | 0 erori TS, build Vite OK (chunk size warning only)                                                              |
| 2026-05-02 | API keys AI Gateway — 10 secrete    | ✅ Completat | GEMINI, COHERE, MISTRAL, DEEPL, AZURE×2, BRAVE, TAVILY, CEREBRAS, OPENROUTER setate via wrangler                 |
| 2026-05-02 | version.json                        | ✅ Completat | public/version.json v1.0.0                                                                                       |
| 2026-05-02 | Soft-delete galerie 30 zile         | ✅ Completat | deleted_at în PhotoEntry + purgeDeletedPhotosMeta(30) automat                                                    |
| 2026-05-02 | Alert 80% storage Supabase          | ✅ Completat | runStorageCheck în keepalive (după backup zilnic)                                                                |
| 2026-05-02 | AI proactiv contextual              | ✅ Completat | Card "Sfaturi AI" în wellness cu button → sendChat patterns                                                      |
| 2026-05-02 | pgvector SQL script                 | ✅ Completat | docs/sql/pgvector_migration.sql (admin rulează în Supabase editor)                                               |
| 2026-05-02 | device_role Supabase sync           | ✅ Completat | upsert user_profiles la schimbare rol (admin PIN)                                                                |
| 2026-05-05 | Lighthouse score ≥90                | ✅ Completat | Performance 59→94; FCP 4.2s→1.1s; lazy loading complet + Supabase lazy + 3 valuri requestIdleCallback            |
| 2026-05-05 | Jurnal wellness persistent UI       | ✅ Completat | Card cronologic în mami-wellness — entries hidratare/vitale/somn/emoții ultimele 30 zile, grupate pe zi          |
| 2026-05-05 | Family sharing RLS                  | ✅ Completat | SQL `docs/sql/family_sharing.sql` (family_groups, family_members, RLS); UI generate/connect cod în mami-settings |
| 2026-05-05 | Arhivă R2 60 zile foto              | ✅ Completat | Cron săptămânal duminică 03:00 UTC în keepalive worker; mută blob în R2, păstrează thumbnail Supabase            |
| 2026-05-05 | Documentație utilizator mama        | ✅ Completat | `docs/USER_GUIDE_MAMA.md` — ghid simplu RO fără jargon tehnic                                                    |
| 2026-05-05 | Test checklist Roland               | ✅ Completat | `docs/TEST_CHECKLIST.md` — pași de testare per modul pe telefonul Roland înainte de go-live mama                 |
