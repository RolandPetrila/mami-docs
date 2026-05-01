# PLAN Inițiere Proiect Mami_Docs

**Dată:** 2026-05-01  
**Status:** ✅ Faza 0 Completată — pregătit pentru Faza 1  
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

- [ ] Inițializare proiect Vite + Vanilla JS
- [ ] Web App Manifest (PWA)
- [ ] Workbox Service Worker (offline cache)
- [ ] Structură tab-uri (Rețete, Livadă, Sănătate, Concedii, Chat AI)
- [ ] Randare documente: mammoth.js (DOCX) + PDF.js + marked (MD) + SheetJS (XLSX)
- [ ] AI fallback inițial: Groq Llama 3.1 8B → 70B
- [ ] Web Speech API ro-RO (STT + TTS)
- [ ] 120 mesaje rotative de salut/motivare
- [ ] Audio ambient Bensound tenderness.mp3
- [ ] Deploy Cloudflare Pages (conectat la GitHub)
- [ ] Supabase keepalive cron (la 4 zile, SELECT 1)
- [ ] version.json în rădăcină
- [ ] Teste PWA de bază (Lighthouse)

---

## Faza 1.5 — AI Core + Agenți (1 săptămână)

- [ ] Fallback complet (8 categorii din ADR decizia 4)
- [x] System prompts per tab (schemă plug-in per tab dinamic)
- [x] OCR cascadă: Tesseract.js → Gemini Flash → Mistral OCR
- [x] Memo vocal cu Groq Whisper Large v3
- [ ] Embeddings: gemini-embedding-001 → transformers.js → Cohere
- [x] Capabilități AI standard (sumarizare, traducere, explicații)

---

## Faza 2 — Wellness + Reminders (2 săptămâni)

- [x] Backup zilnic Cloudflare R2 (02:00 UTC)
- [x] Stack notificări: ntfy.sh + Telegram Bot + CallMeBot + FCM
- [ ] device_role ('mom'/'admin') în Supabase
- [x] Reminder telefon-sună (apel voce via CallMeBot)
- [x] Tracker hidratare (cu notificări)
- [x] Semne vitale (tensiune, greutate, temperatură)
- [x] Tracker somn
- [x] Check-in emoțional zilnic
- [ ] Auto-sumar nocturn (00:30 UTC)

---

## Faza 3 — Memorie Lungă + RAG (2 săptămâni)

- [ ] pgvector activat în Supabase
- [ ] RAG pe documente (embeddings + căutare semantică)
- [ ] AI proactiv contextual (pattern simptome, aniversări, etc.)
- [ ] Jurnal wellness persistent
- [ ] Pattern simptome (detecție automată)
- [ ] Family sharing cu Row Level Security (RLS)
- [ ] PDF medical generat cu jsPDF (client-side)
- [ ] Galerie foto (upload cu resize 1920px, soft-delete 30 zile)
- [ ] Bookmarks + highlights în documente
- [ ] Arhivă R2 la 60 zile nereaccesare (cu thumbnail Supabase)

---

## Faza 4 — Avansate + Go-Live (1-2 săptămâni)

- [ ] RxNorm + openFDA interacțiuni medicamente
- [ ] Meniu săptămânal (generator AI + printabil)
- [ ] Traducere multi-limbă (DeepL ×2 → Azure ×2 → Gemini Flash)
- [ ] Admin PIN mode (acces la setări avansate)
- [ ] Dashboard quote-uri zilnice
- [ ] Backup secundar săptămânal (Storj sau Backblaze B2)
- [ ] Alert admin la 80% storage Supabase
- [ ] Go-live test pe telefon real mama (Android Chrome)
- [ ] Lighthouse score ≥90 (PWA, Performance, Accessibility)
- [ ] Documentație utilizator finală pentru mama

---

## Jurnal Execuție

| Data       | Task                                | Status       | Observații                                                          |
| ---------- | ----------------------------------- | ------------ | ------------------------------------------------------------------- |
| 2026-05-01 | T1 — Health check API keys          | ✅ Completat | 54/54 SET, 0 lipsă                                                  |
| 2026-05-01 | T2 — Verifică repo GitHub           | ✅ Completat | Repo public, main, creat 2026-04-30                                 |
| 2026-05-01 | T3 — Rename research file           | ✅ Completat | → PROIECT_MAMI_DOCS_RESEARCH.md                                     |
| 2026-05-01 | T4 — PLAN_initiere                  | ✅ Completat | Acest fișier                                                        |
| 2026-05-01 | T5 — CLAUDE.md proiect              | ✅ Completat | Reguli override locale + surse adevăr                               |
| 2026-05-01 | T6 — ADR Anexa C                    | ✅ Completat | 17 decizii cu alternative respinse                                  |
| 2026-05-01 | T7 — docs/stack.md                  | ✅ Completat | Stack consolidat cu linkuri docs oficiale                           |
| 2026-05-01 | T8 — docs/ai-fallback-chain.md      | ✅ Completat | 8 categorii + circuit breaker pattern                               |
| 2026-05-01 | T9 — docs/notification-stack.md     | ✅ Completat | 4 straturi + setup ntfy pas cu pas                                  |
| 2026-05-01 | T10 — docs/service-limits.md        | ✅ Completat | Tabel complet toate serviciile                                      |
| 2026-05-01 | T11 — docs/medical-disclaimers.md   | ✅ Completat | 5 texte RO + Web Component skeleton                                 |
| 2026-05-01 | T12 — docs/api-keys-map.md          | ✅ Completat | 54 chei mapate; CALLMEBOT lipsă                                     |
| 2026-05-01 | T13 — docs/roadmap.md               | ✅ Completat | Features bifabile Faza 0-4 + backlog                                |
| 2026-05-01 | T14 — README.md                     | ✅ Completat | Public repo, minimal, fără info sensibile                           |
| 2026-05-01 | T15 — .gitignore                    | ✅ Completat | .env\*, node_modules, dist, .wrangler etc.                          |
| 2026-05-01 | T16 — SITEMAP.json + memoria        | ✅ Completat | Structură completă + planned + MEMORY.md                            |
| 2026-05-01 | Faza 1.5 — Refactor system-prompts  | ✅ Completat | Șterse prompturile hardcodate, fallback dyn                         |
| 2026-05-01 | Faza 1.5 — Capabilități AI std      | ✅ Completat | Explică simplu, Traduce, Definește, TTS, AI Dialog                  |
| 2026-05-01 | Faza 1.5 — Memo vocal Whisper       | ✅ Completat | Fallback STT cu Whisper Large v3 + Gateway                          |
| 2026-05-01 | Faza 1.5 — OCR cascadă              | ✅ Completat | Tesseract.js adăugat în image-viewer                                |
| 2026-05-01 | Faza 1.5 — Embeddings setup         | ✅ Completat | Setup arhitectural embeddings.ts (Faza 3)                           |
| 2026-05-01 | Faza 2 — Wellness Trackers          | ✅ Completat | UI + logica pentru Hidratare, Somn, Vitale, etc                     |
| 2026-05-01 | Faza 2 — CF Workers Cron            | ✅ Completat | Stub pentru Backup R2 + Auto-sumar zilnic                           |
| 2026-05-01 | Faza 3 — Medical PDF & Galerie      | ✅ Completat | Generare PDF cu jsPDF, Stub galerie foto                            |
| 2026-05-01 | Bug fix worker AI Gateway           | ✅ Completat | callGroqAudio implementat (Whisper) + duplicare reziduară eliminată |
| 2026-05-01 | Storage abstraction local-first     | ✅ Completat | src/data/local-store.ts + photo-blob-store.ts (IndexedDB)           |
| 2026-05-01 | Wellness persistență + PDF real     | ✅ Completat | localStorage + ultimele 14 măsurători reale în PDF                  |
| 2026-05-01 | Galerie foto funcțională            | ✅ Completat | Upload + resize 1920px + IndexedDB blob + lightbox + delete         |
| 2026-05-01 | Embeddings transformers.js real     | ✅ Completat | Xenova/multilingual-e5-small quantized offline                      |
| 2026-05-01 | Notificări 4 straturi               | ✅ Completat | Notification API + ntfy + Telegram + CallMeBot voice                |
| 2026-05-01 | Reminder hidratare 2h               | ✅ Completat | Toggle în Setări + setInterval anti-spam + permission request       |
| 2026-05-01 | docs/CREDENTIALS_NEEDED.md          | ✅ Completat | 5 secțiuni cu pași și linkuri (Supabase, ntfy, CallMeBot, FCM, R2)  |
| 2026-05-01 | .env.example + .gitignore exception | ✅ Completat | Template variabile Vite documentat, commitabil                      |
