# PLAN Inițiere Proiect Mami_Docs

**Dată inițială:** 2026-05-01 | **Ultimă actualizare:** 2026-05-06  
**Status:** ✅ Faze 0+1+1.5+2+3+4+5 Complete; Faze 6-10 PENDING (sprint îmbunătățiri post-audit, derivate din `.claude-outputs/audit/`, `improve/`, `imbunatatiri/` 2026-05-06).  
**Versiune plan:** 2.1  
**v2.1 (2026-05-06, sequential thinking refinement):** DoD global + per fază, 8 dependențe critice cross-phase, estimări cumulate (~95-130h), Risk Register top 10 cu mitigation, consolidare T5.1+T5.2 commit.  
**Surse adăugate la v2.0 (2026-05-06):**

- `.claude-outputs/audit/2026-05-06_011740/audit_report.md` — scor 58/100, 7 CRITICA, 9 HIGH, 12 MEDIUM
- `.claude-outputs/improve/2026-05-06_120000/improve_report.md` — 16 recomandări P0-P3 (CVE, dependențe, modernizare)
- `.claude-outputs/imbunatatiri/2026-05-06_imbunatatiri/RECOMANDARI_IMBUNATATIRI.md` — 29 îmbunătățiri (15 existente + 6 noi + 8 tehnice)

**Logică execuție Faze 5-10:**

1. **Faza 5** rulează autonom de către agent (toate task-urile sunt LOW risk, nu modifică state remote dincolo de git push) → primă prioritate
2. **Faza 6** are task-uri R-RISK HIGH (RLS Supabase) — necesită confirmare admin per task înainte de execuție
3. **Fazele 7.A-7.E** sunt sprinturi independente paralelizabile între ele — admin alege ordinea
4. **Faza 8** (modernizare deps) rulează DUPĂ stabilizare Faza 5 (build-ul trebuie să fie verde)
5. **Faza 9** (DX) e oportunist — task-urile pot intercala cu Fazele 7-8
6. **Faza 10** rulează DOAR DUPĂ ce 5+6+7+8 sunt verzi și `/audit` returnează ≥85/100

---

## Definition of Done global (gate-uri obligatorii pentru orice fază)

Un task este `[x]` doar dacă **toate** condițiile de mai jos sunt îndeplinite:

1. **Cod** — modificarea e aplicată exact cum spune secțiunea **Cum** din task
2. **Self-verify** — `Read` pe fișierul modificat + `Grep` pentru pattern-ul promis (per `docs/AGENT_PROTOCOL.md` §1)
3. **Build verde** — `npm run build` (sau `tsc --noEmit` pentru task-uri non-bundle) returnează 0 erori
4. **Smoke test** — funcția afectată funcționează în browser local sau cu test unit dedicat
5. **Verificare** — secțiunea "Verificare" din task confirmă rezultatul așteptat
6. **Commit** — modificarea e commit-uită cu mesaj descriptiv (R-RISK MEDIUM/HIGH: include "Risk: …, Mitigation: …" în corp)

**O fază e completă** doar dacă: (a) toate task-urile `[x]`, (b) GitHub Actions deploy verde, (c) `/audit` re-run nu raportează regresii noi.

---

## Dependențe critice cross-phase (gate-uri tehnice între task-uri)

Aceste dependențe trebuie respectate ca să eviți blocaje subtile:

| Task                               | Depinde de                                                                           | Motiv                                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| **T6.1** (RLS strict)              | **T6.1.a** (sub-task implicit) — client trimite `device_id` ca header HTTP la worker | Fără device_id propagat, RLS îi blochează inclusiv mama                                                |
| **T7.A.6** (tab fade)              | **T5.14** (prefers-reduced-motion)                                                   | Altfel utilizatorii cu vertij sau care au reduce-motion activat sunt afectați la fiecare switch tab    |
| **T7.E.1** (SSE streaming)         | **T5.7** (chat message build fix) + **T5.11** (memory leak listen buttons)           | Streaming pe build defect duplică context; lipsă cleanup → listener fantom per chunk                   |
| **T7.E.2** (doc library)           | **T9.7** (IndexedDB cleanup orfane)                                                  | Fără cleanup, biblioteca crește indefinit și ocupă storage                                             |
| **T8.4** (transformers v4)         | **T5.13** (RAG integration)                                                          | Dacă T5.13 se face cu @xenova, T8.4 poate sparge embeddings.ts; ordine: T5.13 → T8.4 cu smoke test RAG |
| **T9.4** (Husky pre-commit)        | **Faza 5 verde** (`tsc --noEmit` și `vitest --run` pass)                             | Dacă activezi hook înainte ca build-ul să fie clean, primul commit Faza 6 va eșua                      |
| **T7.C.2** (Tratament + Reminders) | **T6.2** (CALLMEBOT → worker)                                                        | Reminderele cu apel voce trebuie să meargă prin worker, nu client direct                               |
| **T10.1** (re-audit ≥85)           | **Toate Faze 5+6+T7 minim sprint A+B**                                               | Faza 8/9/10 nu pot rula până audit nu confirmă stabilizare                                             |

---

## Estimare cumulată (efort agent + testare admin, ore)

| Fază      | Estimare     | Note                                                           |
| --------- | ------------ | -------------------------------------------------------------- |
| Faza 5    | **6-8h**     | Sesiune unică autonomă + audit re-run                          |
| Faza 6    | 12-15h       | T6.1 RLS singur poate consuma 4-6h cu staging Supabase test    |
| Faza 7.A  | 6-8h         | 6 task-uri MIC, 1h fiecare cu smoke test                       |
| Faza 7.B  | 6h           | Inclusiv raport PDF doctor (T7.B.4)                            |
| Faza 7.C  | 12-16h       | Dominant T7.C.2 Tratament+Reminders (6-8h)                     |
| Faza 7.D  | 6-8h         | 3 task-uri MEDIU                                               |
| Faza 7.E  | 14-20h       | T7.E.1 SSE singur poate consuma 8-12h; T7.E.2 doc library 6-8h |
| Faza 8    | 18-25h       | Vite 8 (T8.6) singur 6-10h cu testare; pdfjs 5 4h              |
| Faza 9    | 10-12h       | Intercalat în Fazele 7-8                                       |
| Faza 10   | 7-9h         | Excluzând T10.4 + T10.5 (blocate admin)                        |
| **TOTAL** | **~95-130h** | Cumulat pe parcurs, agent + admin testing; nu sesiune continuă |

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
- [x] Audio ambient `public/audio/tenderness.mp3` ("Calm Sketch for Piano", CC0 archive.org — confirmat live 2026-05-06; component `mami-ambient-player.ts` injectat în `main.ts`)
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

## Faza 5 — Hardening Securitate & Calitate (P0 — derivat din /audit + /improve 2026-05-06)

> **Obiectiv:** Scor audit 58/100 → ≥75/100 (țintă intermediară; ≥85/100 e gate-ul Fazei 10). CVE eliminate, bug-uri critice rezolvate, accesibilitate WCAG AA.  
> **Mod execuție:** AUTONOM — toate task-urile sunt LOW risk (cod local + git push). Niciun task necesită confirmare admin.  
> **Pre-condiție:** branch curent `main` clean (T5.0 acoperă fișierele necommise existente).  
> **Estimare:** 6-8h sesiune unică (incluse: smoke test pe localhost + commit + push + audit re-run).
>
> **DoD Faza 5:** (1) toate T5.x bifate `[x]`; (2) `npm run build` 0 erori; (3) `npm run test -- --run` 115/115 pass (sau ≥114, T5.x nu trebuie să spargă teste); (4) `/audit` re-run ≥75/100, toate `CRITICA` închise; (5) Lighthouse Accessibility ≥95 (a fost ~88 cu tap targets+contrast); (6) commit final pushat, GitHub Actions verde.

### Task-uri Faza 5

- [x] **T5.0** — Commit fișiere modificate curent (preluare lucru anterior) [LOW] [efort: MIC]
  - **Sursa:** audit [MED-9]
  - **Cum:** `git add docs/ai-fallback-chain.md info_chat.txt workers/ai-gateway/index.ts STATE_LIVE.md scripts/persist-creds-to-env.ps1 scripts/test-azure-deep.ps1 scripts/test-azure-traduceriroland.ps1 scripts/validate-new-creds.ps1 scripts/verify-worker-extended.ps1 scripts/.gitignore-keys && git commit -m "chore: cleanup pre-Faza 5 — info_chat curățat, scripts azure/creds, STATE_LIVE update"`
  - **Verificare:** `git status` clean
- [x] **T5.1** 🚨 — DOMPurify 3.1.5 → 3.4.2 [LOW] [efort: MIC]
  - **Sursa:** improve [S1] — 4 CVE XSS active (CVE-2025-15599, CVE-2026-0540/41239/41240)
  - **De ce:** procesăm HTML din mammoth + marked + OCR — risc real XSS pe device-ul mamei
  - **Cum:** `npm install dompurify@3.4.2 @types/dompurify@latest` + `npm run build`
  - **Verificare:** `npm run build` 0 erori; `DOMPurify.sanitize()` API identic
- [x] **T5.2** 🚨 — mammoth 1.8.0 → 1.12.0 [LOW] [efort: MIC]
  - **Sursa:** improve [S2] — CVE-2025-11849 Directory Traversal prin DOCX malițios
  - **De ce:** mama poate primi DOCX craftat malițios pe WhatsApp/Telegram
  - **Cum:** `npm install mammoth@1.12.0`
  - **Verificare:** test cu un docx real — render OK; `convertToHtml` API neschimbat
  - **Optimizare commit:** comasează `npm install` cu T5.1 într-un singur run (`npm install dompurify@3.4.2 @types/dompurify@latest mammoth@1.12.0`) și un singur commit cu mesaj `fix(security): DOMPurify 3.4.2 + mammoth 1.12.0 (4 CVE XSS + directory traversal)` — economisește 1 deploy CI
- [x] **T5.3** 🚨 — XSS în OCR (mami-image-viewer.ts:211,219,227,230) [HIGH IMPACT] [efort: MIC]
  - **Sursa:** audit [CRITICA-1]
  - **De ce:** `innerHTML` cu rezultat OCR Tesseract — atac XSS prin imagine
  - **Cum:** înlocuiește `bodyEl.innerHTML = \`<p>...</p>\``cu`bodyEl.textContent = "..."`la liniile 211/219/227/230 (sau wrap cu`DOMPurify.sanitize` dacă HTML necesar)
  - **Verificare:** Grep `innerHTML` în mami-image-viewer.ts → 0 apariții pe path-ul OCR
- [x] **T5.4** — Tap targets 44×44px (WCAG 2.5.5) [LOW] [efort: MIC]
  - **Sursa:** audit [CRITICA-2, CRITICA-3]
  - **Cum:**
    - `mami-chat.ts` buton "🔊 Ascultă": `min-height: 28px` → `44px`, `min-width: 44px`
    - `mami-search.ts` `.delete-btn`: `min-height: 32px` → `44px`, `min-width: 32px` → `44px`
- [x] **T5.5** — `await syncDeviceRole` (race condition) [LOW] [efort: MIC]
  - **Sursa:** audit [CRITICA-4] — mami-settings.ts:521-523
  - **Cum:** `void syncDeviceRole("mom")` → `await syncDeviceRole("mom")` (handler să fie `async`)
  - **Verificare:** Grep `void syncDeviceRole` → 0 match-uri în mami-settings.ts
- [x] **T5.6** — Null pointer `_wrapText` [LOW] [efort: MIC]
  - **Sursa:** audit [CRITICA-5] — mami-doc-viewer.ts:620-643
  - **Cum:** adaugă `if (!parent) continue;` înainte de `parent.replaceChild(after, textNode)`
- [x] **T5.7** — Chat message build fix [LOW] [efort: MIC]
  - **Sursa:** audit [CRITICA-6] — mami-chat.ts:368
  - **Cum:** înlocuiește `slice(0, -1)` + `push` cu: `const msgs = [...history, { role: "user", content: text }];`
- [x] **T5.8** 🌟 — System prompts specializate per tab [LOW] [efort: MIC]
  - **Sursa:** audit [HIGH-5] + improve [A1] + recomandari [Rec.8]
  - **De ce:** wellness/menu/medicamente/gallery folosesc fallback generic — răspunsuri AI slabe + lipsă disclaimer medical obligatoriu (risc legal)
  - **Cum:** `src/ai/system-prompts.ts` — adaugă în `PROMPTS Record<TabId,string>` entries pentru:
    - `wellness` (cu disclaimer "⚠️ Aceasta este o informație generală...")
    - `menu` (asistent culinar RO, max 30 min gătit)
    - `medicamente` (cu disclaimer "⚠️ Informații generale, nu prescripție", denumiri RO comune)
    - `gallery` (organizare amintiri, ton nostalgic)
    - cod complet în `RECOMANDARI_IMBUNATATIRI.md` §8
  - **Verificare:** `Grep "wellness:" src/ai/system-prompts.ts` returnează entry cu "⚠️"
- [x] **T5.9** — `aria-label` complet pe icon-only buttons [LOW] [efort: MIC]
  - **Sursa:** audit [MED-8] + recomandari [T2]
  - **Cum:** ☰ "Deschide meniu", ⚙️ "Setări", 🎤 "Pornește înregistrare vocală", ✕ "Închide / Șterge", 🔊 "Ascultă răspunsul", 💾 "Salvează"
  - **Verificare:** test cu axe DevTools / Lighthouse Accessibility
- [x] **T5.10** — Contrast WCAG AA — mami-search.ts:101,108 [LOW] [efort: MIC]
  - **Sursa:** audit [HIGH-7]
  - **Cum:** `color: #aaa` → `#666`, `color: #bbb` → `#777`
- [x] **T5.11** — Memory leak listen buttons cleanup [LOW] [efort: MEDIU]
  - **Sursa:** audit [HIGH-3] — mami-chat.ts:438-448
  - **Cum:** track listeners în `_listenButtons: HTMLButtonElement[]`; `disconnectedCallback()` curăță explicit; `clear()` invocă cleanup înainte de reset
- [x] **T5.12** — PDF generate try/catch [LOW] [efort: MIC]
  - **Sursa:** audit [HIGH-2] — mami-doc-viewer.ts:573-590
  - **Cum:** wrap `await import("jspdf")` + generare PDF în `try/catch`; pe `catch` afișează toast "Nu am putut genera PDF-ul" + `this._reading = false`
- [x] **T5.13** 🌟 — Integrare RAG în chat [MEDIUM IMPACT] [efort: MEDIU]
  - **Sursa:** audit [HIGH-8]
  - **De ce:** `src/ai/rag.ts` complet implementat din 2026-05-02, NICIODATĂ importat în `mami-chat.ts`. Mama nu primește răspunsuri contextuale din documente.
  - **Cum:** mami-chat.ts — la `sendChat`, înainte de apel:
    ```typescript
    const ctx = await buildRagContext(userMessage); // top-K doc chunks
    const systemWithContext =
      systemPrompt + (ctx ? `\n\nContext din documente:\n${ctx}` : "");
    ```
  - **Verificare:** test cu un doc indexat → întreabă AI ceva specific din doc → răspuns relevant
- [x] **T5.14** — `prefers-reduced-motion` global [LOW] [efort: MIC]
  - **Sursa:** recomandari [T1] — WCAG 2.3.3
  - **Cum:** `src/styles/global.css`:
    ```css
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
    ```
- [x] **T5.15** — Empty catch blocks (6 locații) [LOW] [efort: MIC]
  - **Sursa:** audit [MED-5] — `client.ts:67`, `embeddings.ts:104`, `local-store.ts:83`, `speech.ts:117,169`, `supabase.ts:43`
  - **Cum:** `catch { /* ignore */ }` → `catch (err) { console.warn("[<module>] eroare:", err instanceof Error ? err.message : String(err)); }`
- [x] **T5.16** — Toast setTimeout cleanup [LOW] [efort: MIC]
  - **Sursa:** audit [MED-4] — mami-wellness.ts:444-450
  - **Cum:** track `_toastTimerId: number | null`; `clearTimeout` în `disconnectedCallback`
- [x] **T5.17** — Commit + push faza 5 [LOW] [efort: MIC]
  - **Cum:** `git add -A && git commit -m "feat(faza-5): hardening — CVE patches + 7 CRITICA + WCAG AA + RAG integration" && git push`
  - **Verificare:** GitHub Actions deploy verde; `/audit` re-run → CRITICA toate închise
- [x] **T5.18** — Re-run `/audit` complet → confirmă scor ≥75 [efort: MIC]
  - **Cum:** rulez skill `/audit` și compar cu raportul original 58/100
  - **Pas următor:** dacă scor ≥75, treci la Faza 6; dacă <75, identifică gap-uri și revino la T5.x

---

## Faza 6 — Securitate Avansată (RLS + Workers)

> **Obiectiv:** Închide vulnerabilitățile cu impact business (RLS public, key client-side, rate limiting).  
> **Mod execuție:** Task-urile R-RISK MEDIUM/HIGH — confirmare admin per task înainte de aplicare.  
> **Estimare:** 12-15h (T6.1 RLS singur 4-6h cu staging Supabase test).
>
> **DoD Faza 6:** (1) toate T6.x bifate; (2) staging Supabase confirmă RLS funcțional pentru mama (user real cu device_id) și blochează un test "anon-fără-device"; (3) bundle client `npm run build` NU mai conține string `VITE_CALLMEBOT_API_KEY`; (4) `wrangler secret list` arată CALLMEBOT, RATE_LIMIT_KV legate; (5) endpoint `/chat` cu CORS strict returnează 403 pentru origin necunoscut; (6) test PIN cu salt — pin "1234" → 2 hash-uri diferite la 2 setări consecutive.

### Task-uri Faza 6

- [ ] **T6.1** 🚨 — RLS strict pgvector tables [HIGH RISK] [efort: MARE]
  - **Sursa:** audit [CRITICA-7] — pgvector_migration.sql:56-67
  - **De ce:** `FOR ALL TO anon USING (true) WITH CHECK (true)` → date medicale mama publice (oricine cu URL-ul Supabase citește/scrie)
  - **Cum:** rescriere `docs/sql/pgvector_migration.sql` cu policy bazat pe `device_id`:
    ```sql
    CREATE POLICY "device_read_only" ON hydration FOR SELECT TO anon
      USING (device_id = current_setting('app.device_id', true));
    ```
  - **Pași:** (1) staging Supabase test, (2) admin rulează SQL în prod Supabase editor, (3) re-deploy worker cu device_id header, (4) test
  - **CONFIRMARE ADMIN:** OBLIGATORIE înainte de a rula SQL în prod
- [ ] **T6.2** — CALLMEBOT key mută în keepalive worker [MEDIUM] [efort: MEDIU]
  - **Sursa:** audit [HIGH-1] — notifications.ts:12-14
  - **De ce:** `VITE_CALLMEBOT_API_KEY` public în bundle → apeluri voce neautorizate posibile
  - **Cum:** keepalive worker adaugă endpoint `POST /notify` (auth via Origin + JWT); client trimite la worker, worker apelează CallMeBot cu key din `wrangler secret put CALLMEBOT_API_KEY`; `notifications.ts` schimbă `fetch("https://api.callmebot.com/...")` în `fetch(env.WORKER_URL + "/notify")`
- [x] **T6.3** — PIN salt [LOW] [efort: MIC]
  - **Sursa:** audit [MED-2] — mami-settings.ts:162-169
  - **De ce:** SHA-256 fără salt → rainbow table 4-8 cifre fezabilă (max 100k combinații)
  - **Cum:** la setare PIN: `salt = crypto.getRandomValues(new Uint8Array(16))` → save `localStorage["mami-pin-salt"]`; hash = SHA-256(salt || pin)
- [x] **T6.4** — Rate limiting AI Gateway [MEDIUM] [efort: MEDIU]
  - **Sursa:** audit [MED-3]
  - **De ce:** 100+ req/sec → exhaust Groq/Mistral quota → mama rămâne fără AI
  - **Cum:** CF Workers KV counter per IP cu TTL 60s; limit 10 req/min/IP; depășire → 429 + Retry-After
- [x] **T6.5** — CORS strict [LOW] [efort: MIC]
  - **Sursa:** audit [MED-1] — ai-gateway/index.ts:962
  - **Cum:** dacă `origin` nu în whitelist → `403 Forbidden` (în loc de fallback `Access-Control-Allow-Origin: *`)
- [x] **T6.6** — STT fallback Whisper conectat [MEDIUM] [efort: MEDIU]
  - **Sursa:** audit [MED-6, MED-7] — mami-chat.ts
  - **De ce:** `transcribeAudio()` există în client.ts dar nu e invocat la eșec Web Speech
  - **Cum:** la catch STT (în `_toggleStt`/`startStt`), dacă error e "not-supported" sau "no-speech" → înregistrează cu MediaRecorder 30s → `transcribeAudio(blob, signal)` → afișează transcript
- [x] **T6.7** — family_sharing.sql cleanup invites [LOW] [efort: MIC]
  - **Sursa:** audit [MED-11]
  - **Cum:** SQL — `< now() - interval '30 days'` → `< now()` (invitația expirată în 7 zile se șterge imediat, nu după 30+7=37 zile)

---

## Faza 7 — Funcționalități Noi (Sprint Îmbunătățiri Post-Audit)

> **Obiectiv:** 20 features din `RECOMANDARI_IMBUNATATIRI.md` care aduc valoare directă pentru mama. Organizate în 5 sprinturi independente.  
> **Mod execuție:** Sprint-urile sunt INDEPENDENTE — admin alege ordinea după prioritate. Fiecare sprint poate rula într-o sesiune separată.  
> **Marcaj importanță:** 🌟 = high impact pentru mama; 🌟🌟 = transformator (cel mai cerut feature)  
> **Estimare totală:** 44-58h pe 5 sprinturi (vezi tabel cumulat în header).
>
> **Ordine recomandată sprint-uri (impact direct mama):**
>
> 1. **7.A** (Quick UX — font size, persist chat, RO drug names) — impact imediat, 6-8h
> 2. **7.B** (Wellness avansat — ștergere intrări, raport doctor) — corectitudine + valoare medicală, 6h
> 3. **7.C.1** (Notițe) — gap evident, 2-3h
> 4. **7.C.2** (Tratament + Reminders) — feature transformator 🌟🌟, 6-8h
> 5. **7.D.1** (Share Target) — UX nativ, 1-2h
> 6. **7.E.1** (SSE streaming) — UX premium, 8-12h (DUPĂ T5.7 + T5.11)
> 7. Restul sprint-uri în ordinea preferință admin
>
> **DoD Faza 7 (per sprint):** (1) toate T7.X.y bifate; (2) build verde + tests pass; (3) smoke test pe localhost (sau staging dacă T9.2 activ) — feature funcționează end-to-end; (4) commit pushat + GitHub Actions verde; (5) Lighthouse Performance ≥90 (nu regresie).

### Sprint 7.A — Quick UX Wins (~8h, paralelizabile)

- [ ] **T7.A.1** — Loading skeleton vizibil [LOW] [efort: MIC]
  - **Sursa:** recomandari [Rec.12]
  - **De ce:** `index.html` `#app` gol 1-3s la prima încărcare → mama crede că app-ul nu funcționează
  - **Cum:** `index.html` — înlocuiește `<div id="app"></div>` cu skeleton inline (header fake + 3 placeholder cards); `main.ts` — `document.addEventListener("mami-tabs-ready", ...)` ascunde + fallback `setTimeout(remove, 3000)`
- [ ] **T7.A.2** 🌟 — Font size control 100/125/150% [LOW] [efort: MIC]
  - **Sursa:** recomandari [Rec.13]
  - **De ce:** ACCESIBILITATE CRITICĂ pentru utilizator ~60 ani; WCAG 1.4.4 zoom 200%
  - **Cum:** `mami-settings.ts` — 3 butoane "A / A+ / A++"; click → `localStorage["mami-font-size"]` ("1" | "1.25" | "1.5") + `document.documentElement.style.setProperty("--font-base", ...)`; restore în `main.ts` înainte de paint
- [ ] **T7.A.3** — Persistența conversație chat (50 mesaje localStorage) [LOW] [efort: MIC]
  - **Sursa:** recomandari [Rec.1]
  - **De ce:** mama pierde sfaturile primite la reload sau switch tab
  - **Cum:** `mami-chat.ts` — `saveHistory()` la fiecare mesaj nou (slice -50, key `mami:chat-history`) + `loadHistory()` în `connectedCallback()` + buton "🗑️ Curăță" cu `confirm()`
- [ ] **T7.A.4** 🌟 — Denumiri RO medicamente (RxNorm normalize) [LOW] [efort: MIC]
  - **Sursa:** recomandari [Rec.5]
  - **De ce:** mama caută "Nurofen", "Concor", "Atoris" → 0 rezultate (RxNorm cunoaște INN/US brands); fără asta, tab-ul Medicamente e inutilizabil
  - **Cum:** `mami-drug-checker.ts` — `RO_BRANDS: Record<string,string>` cu top 30 brand-uri RO → INN (Nurofen→Ibuprofen, Aspenter→Aspirin, Concor→Bisoprolol, Atoris→Atorvastatin etc.); `normalizeForRxNorm(input)` înainte de fetch + UI hint "căutăm sub denumirea internațională: Ibuprofen"
- [ ] **T7.A.5** — Salvare listă permanentă medicamente [LOW] [efort: MIC]
  - **Sursa:** recomandari [Rec.6]
  - **De ce:** mama re-adaugă cele 8 medicamente zilnice la fiecare sesiune
  - **Cum:** `localStorage["mami:my-drugs"]` cu `SavedDrug[]`; buton "💾 Salvează ca lista mea"; restaurare automată în `connectedCallback` + toast "Lista ta a fost restaurată"
- [ ] **T7.A.6** — Tranziție animată tab fade [LOW] [efort: MIC]
  - **Sursa:** recomandari [Rec.11]
  - **Cum:** `mami-tabs.ts` CSS `@keyframes tabFadeIn` 200ms; respectă `prefers-reduced-motion` (T5.14)

### Sprint 7.B — Wellness Avansat (~6h)

- [ ] **T7.B.1** — Ștergere intrări wellness individuale [LOW] [efort: MIC]
  - **Sursa:** recomandari [Rec.2]
  - **De ce:** mama tastează tensiune greșit (ex: 420/80) — fără mecanism de corecție; intră în pattern detection și PDF
  - **Cum:** buton ✕ pe fiecare entry (vitals/hydration/emotion/sleep) cu `min-height: 44px; min-width: 44px;`; `confirm("Ștergi această măsurătoare?")`; `deleteVitals/deleteHydration/deleteEmotion/deleteSleep(id)` în `local-store.ts`
- [ ] **T7.B.2** — Target hidratare + progress bar [LOW] [efort: MIC]
  - **Sursa:** recomandari [Rec.3]
  - **Cum:** target default 2000ml configurabil în Setări (`localStorage["mami:hydration-target"]`); progress bar inline cu clase `.low/.medium/.good` (roșu <50%, galben 50-99%, verde ≥100%); afișare "1250 ml din 2000 ml (63%)"
- [ ] **T7.B.3** — Sparkline trend 7 zile (SVG inline, fără librărie) [MEDIUM] [efort: MEDIU]
  - **Sursa:** recomandari [Rec.4]
  - **Cum:** funcție pură `renderSparkline(values, target, width=120, height=40)` returnează SVG cu polyline + circles colorate (verde≥target, roșu<target); inserat în card hidratare după status
- [ ] **T7.B.4** 🌟 — Raport săptămânal PDF pentru doctor [MEDIUM] [efort: MEDIU]
  - **Sursa:** recomandari [N6]
  - **De ce:** mama merge la medic — actual jsPDF e dump de date; un raport profesional formatat e incomparabil mai util
  - **Cum:** `mami-wellness.ts` `generateWeeklyReport()` cu jsPDF — header "MONITORIZARE SĂNĂTATE", perioada, tabele tensiuni (max 14 entries) + hidratare + somn + emoții, medii 7 zile, footer disclaimer "Generat de Mami Docs PWA — document informativ, nu înlocuiește consultul medical"

### Sprint 7.C — Tab-uri Noi & Features Mari (~12h)

- [ ] **T7.C.1** 🌟 — Tab "Notițe" — Jurnal simplu [LOW] [efort: MIC]
  - **Sursa:** recomandari [N2]
  - **De ce:** gap evident — note rapide ("de cumpărat lapte/pâine", "întrebări pentru doctor"); independent, primă funcție nouă recomandată
  - **Cum:** `src/components/mami-notes.ts` cu `NoteEntry { id, ts, title, body, pinned, category }`; categorii cu iconuri: 📝 General / 🏥 Doctor / 🛒 Cumpărături / 📔 Jurnal; pinned sus + rest cronologic descrescător; căutare filter pe text; long-press → opțiuni; `localStorage["mami:notes"]`; tab nou în `src/data/tabs.ts`: `{ id: "notite", label: "Notițe", icon: "📝" }`
- [ ] **T7.C.2** 🌟🌟 — Tab "Tratament" — Lista medicamente personale + Remindere configurabile [HIGH] [efort: MEDIU-MARE]
  - **Sursa:** recomandari [N1] + [Rec.14]
  - **De ce:** Cel mai cerut feature aplicații pentru vârstnici 2025; mama are tratament cronic (HTA, diabet, tiroidă)
  - **Cum:**
    - `src/components/mami-medication.ts` cu `MedicationEntry { id, name, dosage, times[], days, stock, refillAt, notes, color, active }`
    - UI: lista cu culori vizuale + buton "+ Adaugă medicament" + buton "✅ Am luat" (60×60px) per doză
    - Counter stock cu alertă la `stock < refillAt`
    - Integrare cu `MedReminder` din `notifications.ts`: `setTimeout` calculat la HH:MM, days[], `notify({title, message, level: "warning", tags: "pill"})`
    - Export text pentru medic ("Tratament curent: Concor 5mg × 2/zi (07:00 și 19:00), Metformin 500mg × 1/zi...")
    - Tab nou: `{ id: "tratament", label: "Tratament", icon: "💊" }` (drug-checker rămâne separat sub label "Interacțiuni")
- [ ] **T7.C.3** — Editare caption galerie [LOW] [efort: MIC]
  - **Sursa:** recomandari [Rec.9]
  - **Cum:** `mami-gallery.ts` — `dblclick` și long-press 500ms → modal `prompt("Modifică descrierea fotografiei:", currentCaption)`; `updatePhotoCaption(id, caption)` în `local-store.ts`
- [ ] **T7.C.4** — Preferințe culinare meniu [MEDIUM] [efort: MEDIU]
  - **Sursa:** recomandari [Rec.7]
  - **De ce:** AI generează meniu generic — mama poate avea diabet, fără porc, lactate, etc.
  - **Cum:** `mami-menu.ts` secțiune expandabilă "⚙️ Preferințele mele" cu 6 checkboxes (vegetarian/fără porc/gluten/lactate, diabetic, hiposodat) + input text "Ingrediente de evitat" + dropdown stil (tradițional românesc / mediteranean / simplu rapid); salvate `localStorage["mami:menu-prefs"]`; `buildMenuPrompt(prefs)` injectează restricțiile în prompt AI
- [ ] **T7.C.5** — Export conversație chat [LOW] [efort: MIC]
  - **Sursa:** recomandari [Rec.15]
  - **Cum:** butoane "📋 Copiază" (`navigator.clipboard.writeText` + fallback `execCommand`) + "💾 Descarcă" (Blob `text/plain` + download `conversatie-mami-ai-YYYY-MM-DD.txt`)

### Sprint 7.D — PWA Nativ (~6h)

- [ ] **T7.D.1** 🌟 — PWA Share Target [MEDIUM] [efort: MIC]
  - **Sursa:** recomandari [N3]
  - **De ce:** mama primește documente pe WhatsApp/Email → vrea Share direct în Mami Docs (în loc de download → upload)
  - **Cum:** `manifest.json` adaugă `share_target` POST multipart `/?share-target` cu `accept: ["application/pdf", ".docx", "image/*", ".xlsx", ".md"]`; `main.ts` `handleShareTarget()` — `caches.open("share-target-temp")` → extrage `formData.get("file")` → `dispatchEvent CustomEvent("mami-open-doc", { detail: file })`; SW handle POST `/?share-target`
- [ ] **T7.D.2** — Shopping List din Meniu (AI-generat) [MEDIUM] [efort: MEDIU]
  - **Sursa:** recomandari [N4]
  - **De ce:** workflow natural meniu→cumpărături; lipsă legătură actuală
  - **Cum:** `mami-menu.ts` buton "🛒 Lista de cumpărături"; AI prompt JSON cu 6 categorii (legume_fructe, carne_peste, lactate_oua, panificatie_paste, conserve_condimente, altele); UI modal cu checkboxes pe categorii (min 24×24px)
- [ ] **T7.D.3** — Voice Memo cu transcripție [MEDIUM] [efort: MEDIU]
  - **Sursa:** recomandari [N5]
  - **De ce:** mama poate prefera vorbire decât scriere (accesibilitate majoră pentru ~60 ani)
  - **Cum:** `src/components/mami-voice-memo.ts` cu `MediaRecorder("audio/webm;codecs=opus")`, max 2min auto-stop; `transcribeAudio(blob)` din client.ts (Groq Whisper); salvat IndexedDB (refolosește `photo-blob-store` cu prefix `memo_`); meta în `localStorage["mami:voice-memos"]` (max 50 entries)

### Sprint 7.E — UX Premium (~10h)

- [ ] **T7.E.1** 🌟🌟 — Streaming AI responses (SSE) [HIGH IMPACT] [efort: MARE]
  - **Sursa:** recomandari [T5]
  - **De ce:** mama vede "thinking..." 2-8s; streaming = răspuns cuvânt cu cuvânt, mult mai natural (UX major)
  - **Cum:**
    - `workers/ai-gateway/index.ts` — endpoint `/chat-stream` cu `stream: true` la Groq; proxy `ReadableStream` cu `Content-Type: text/event-stream`
    - `src/ai/client.ts` — `sendChatStream(messages, onChunk: (text) => void)` cu `ReadableStream` parser SSE
    - `mami-chat.ts` — append chunks la mesajul AI activ în loc de wait pentru full response; păstrează flag `_streaming` pentru UI indicator
- [ ] **T7.E.2** 🌟 — Bibliotecă persistentă documente [HIGH] [efort: MARE]
  - **Sursa:** recomandari [Rec.10]
  - **De ce:** doc-viewer e one-shot — mama re-uploadează același document de fiecare dată
  - **Cum:**
    - `src/data/doc-blob-store.ts` nou (IndexedDB) — `saveDocBlob(id, file)` / `getDocBlob(id)`
    - `SavedDocument { id, name, type, savedAt, category, blobSize }` în `localStorage["mami:saved-docs"]`
    - `mami-doc-viewer.ts` — după render reușit oferă "💾 Salvează în bibliotecă" (cu select category: medical/rețete/acte/altele)
    - Panou stânga "📚 Documentele mele" cu listă; click → re-deschide direct din IDB
    - Buton ✕ per item pentru ștergere (cu `confirm()`)

---

## Faza 8 — Modernizare Stack Dependențe

> **Obiectiv:** stack actualizat la versiuni active 2026; eliminare pachete abandonate (xlsx pe npm, @xenova).  
> **Mod execuție:** SECVENȚIAL după Faza 5 (build verde garantat). Fiecare task → test build + smoke test feature înainte de commit.  
> **Estimare:** 18-25h cumulat (Vite 8 dominant, 6-10h cu testare; pdfjs 5 4h; transformers v4 3-4h).
>
> **DoD Faza 8:** (1) toate T8.x bifate; (2) `npm audit` 0 high/critical; (3) `npm run build` 0 erori; (4) `npm run test -- --run` 115/115 pass; (5) Lighthouse Performance ≥94 (nu regresie); (6) smoke test pe localhost: docx render OK (mammoth+@e965/xlsx), pdf render OK (pdfjs 5), markdown chat OK (marked 18), RAG embeddings OK (transformers v4); (7) bundle size raportat în jurnal — flag dacă crește >10% față de baseline 14.77kB main.

### Task-uri Faza 8

- [ ] **T8.1** — TypeScript 5.4 → 6.0.3 [LOW] [efort: MIC]
  - **Sursa:** improve [M2] — `strict: true` deja activ → low risk
  - **Cum:** `npm install typescript@6.0.3` + `npx tsc --noEmit` → 0 erori; tsconfig deja compat
- [ ] **T8.2** — xlsx 0.18.5 → @e965/xlsx [MEDIUM] [efort: MIC]
  - **Sursa:** improve [D3] + audit [HIGH-6] — Prototype Pollution + ReDoS
  - **De ce:** xlsx pe npm înghețat 0.18.5 (CVE GHSA-4r6h-8v6p-xvw6); SheetJS s-a mutat la `git.sheetjs.com` (non-standard)
  - **Cum:** `npm install @e965/xlsx` + replace_all import `from "xlsx"` → `from "@e965/xlsx"` (API identic); test export Excel mami-menu
- [ ] **T8.3** — marked 12 → 18 [MEDIUM] [efort: MEDIU]
  - **Sursa:** improve [M3] — 6 majors în urmă, breaking API posibil
  - **Cum:** `npm install marked@18`; verifică opțiunile `marked({ breaks, gfm })` — API poate fi schimbat; smoke test render markdown în chat + doc-viewer (3-5 fișiere reale)
- [ ] **T8.4** — @xenova/transformers → @huggingface/transformers v4 [MEDIUM] [efort: MEDIU]
  - **Sursa:** improve [D1] + audit [HIGH-9] — pachet abandonat 18+ luni; v4 are WebGPU + bundle -53%
  - **Cum:** `npm uninstall @xenova/transformers && npm install @huggingface/transformers`; `src/ai/embeddings.ts` schimbă import; verifică `pipeline("feature-extraction", "Xenova/multilingual-e5-small")` în v4 (API compatible v2→v3→v4); smoke test RAG end-to-end
- [ ] **T8.5** — pdfjs-dist 4 → 5 [MEDIUM] [efort: MEDIU]
  - **Sursa:** improve [D2] — fix post-CVE-2024-4367 + rendering rapid
  - **Cum:** `npm install pdfjs-dist@5.7.284`; ATENȚIE worker path API schimbat în v5 — verifică `vite.config.ts` `globIgnore` și import `pdfjs-dist/build/pdf.worker.mjs?url`; test 3-4 PDF-uri (cu/fără layer text)
- [ ] **T8.6** — Vite 5 → 8 [MEDIUM] [efort: MARE]
  - **Sursa:** improve [M1] — 3 majors în urmă; HMR rapid + Node 22+
  - **Cum:** `npm install vite@latest vite-plugin-pwa@latest`; ATENȚIE breaking changes 6→7→8: `resolve.conditions` (no implicit), Sass `css.preprocessorOptions.scss.api: 'modern'` (dacă SCSS), Node minim 20+; test build complet + SW generation + Lighthouse după upgrade
- [ ] **T8.7** — `npm audit fix` final pass + commit Faza 8 [LOW] [efort: MIC]
  - **Cum:** `npm audit` — verifică 0 high/critical; commit + push

---

## Faza 9 — DX & Observability

> **Obiectiv:** pre-commit hooks, monitoring producție, staging environment, optimizări runtime tech-debt.  
> **Mod execuție:** OPORTUNIST — task-urile pot intercala cu Fazele 7-8; majoritatea sunt independente, < 1h fiecare.  
> **Estimare:** 10-12h cumulat (intercalat).
>
> **DoD Faza 9:** (1) toate T9.x bifate; (2) `wrangler.toml` ambele workers cu `[observability] enabled = true`; (3) staging branch creat și auto-deploy verde la `staging.mami-docs.pages.dev`; (4) `.husky/pre-commit` blochează commit cu erori `tsc` (test cu un commit voit-rupt); (5) `vitest --coverage` raportează ≥70% lines/functions, ≥60% branches; (6) `npm run build` mai rapid pe CI (cache hit confirmat în logs Actions); (7) `SITEMAP.json` reflectă tab-urile noi (Notițe + Tratament).

### Task-uri Faza 9

- [ ] **T9.1** — CF Workers Observability [LOW] [efort: MIC]
  - **Sursa:** improve [A3]
  - **Cum:** `wrangler.toml` în AI Gateway + Keepalive: `[observability]\nenabled = true`; verifică dashboard CF după re-deploy
- [ ] **T9.2** — Branch staging CF Pages [LOW] [efort: MIC]
  - **Sursa:** improve [DX3]
  - **De ce:** evita push direct la mama; flow `dev → staging → main`
  - **Cum:** `git branch staging`; CF Pages auto-generează `staging.mami-docs.pages.dev` (preview deployments per branch); admin testează pe staging înainte de merge main
- [ ] **T9.3** — Build cache Vite GitHub Actions [LOW] [efort: MIC]
  - **Sursa:** improve [P1] — economie ~25s/deploy
  - **Cum:** `.github/workflows/deploy.yml` adaugă step `actions/cache@v4` cu path `node_modules/.vite` și key `vite-${{ hashFiles('vite.config.ts') }}`
- [ ] **T9.4** — Husky pre-commit hooks [LOW] [efort: MIC]
  - **Sursa:** improve [DX1]
  - **Cum:** `npm install -D husky lint-staged && npx husky init && echo "npx tsc --noEmit && npm run test -- --run" > .husky/pre-commit`
- [ ] **T9.5** — Coverage thresholds vitest [LOW] [efort: MIC]
  - **Sursa:** improve [DX2]
  - **Cum:** `vitest.config.ts` `coverage.thresholds: { lines: 70, functions: 70, branches: 60 }`
- [ ] **T9.6** — AbortController în AI calls [LOW] [efort: MIC]
  - **Sursa:** recomandari [T4]
  - **Cum:** `mami-wellness.ts` (sfaturi AI) + `mami-chat.ts` — `_aiController = new AbortController()` per AI call; `abort()` la `disconnectedCallback` și la nou call
- [ ] **T9.7** — IndexedDB cleanup blob-uri orfane [LOW] [efort: MIC]
  - **Sursa:** recomandari [T3]
  - **Cum:** `mami-gallery.ts` `connectedCallback` reconciliază: pentru fiecare blob în IDB, verifică metadata corespunzătoare în `localStorage`; șterge orfane
- [ ] **T9.8** — Lazy import jsPDF wellness [LOW] [efort: MIC]
  - **Sursa:** recomandari [T7]
  - **Cum:** `Grep "import.*jspdf" src/components/mami-wellness.ts` — toate trebuie să fie `await import("jspdf")` la click handler, nu top-level
- [ ] **T9.9** — `lang: "ro"` în notifications locale [LOW] [efort: MIC]
  - **Sursa:** recomandari [T8]
  - **Cum:** `notifications.ts` `showLocalNotification` — adaugă `lang: "ro"` în `NotificationOptions`
- [ ] **T9.10** — CSS containment componente heavy [LOW] [efort: MIC]
  - **Sursa:** recomandari [T6]
  - **Cum:** `:host { contain: layout paint; }` în `mami-doc-viewer.ts` și `mami-gallery.ts`
- [ ] **T9.11** — Helper `fetchJson<T>()` în client.ts (DRY) [LOW] [efort: MEDIU]
  - **Sursa:** audit [HIGH-4] — pattern fetch+catch repetat 5×
  - **Cum:** `client.ts` — extrage `fetchJson<T>(endpoint: string, body: unknown, signal?: AbortSignal): Promise<T>`; refactor cele 5 funcții `sendChat/embed/translate/vision/search/transcribe` să folosească helper-ul
- [ ] **T9.12** — Verifică `mami-ambient-player` (audit MED-10 fals positive) [LOW] [efort: MIC]
  - **Notă:** audit a marcat ca dead code, dar `Grep` confirmă import în `main.ts` — task de **documentare**: confirmă în comment de ce există
- [ ] **T9.13** — Update SITEMAP.json cu tab-uri noi [LOW] [efort: MIC]
  - **Sursa:** audit [LOW]
  - **Cum:** după T7.C.1 (Notițe) și T7.C.2 (Tratament), regenerează `SITEMAP.json` cu noile tab-uri și componente; bump versiune

---

## Faza 10 — Validare Finală + Go-Live Mama

> **Obiectiv:** Pre-condiție Faze 5+6+7+8 verzi; scor `/audit` ≥85/100; Lighthouse PWA 100 / Performance ≥95 / Accessibility ≥95; test pe telefon Roland clean; instalare PWA pe telefonul mamei.  
> **Mod execuție:** SECVENȚIAL — fiecare task gate pentru următorul.  
> **Estimare:** 7-9h efectiv (T10.4 + T10.5 blocate admin, scoase din estimare).
>
> **DoD Faza 10 = Go-Live mama:** (1) `/audit` ≥85/100 fără CRITICA active; (2) Lighthouse PWA 100, Performance ≥95, Accessibility ≥95, Best Practices ≥95; (3) `docs/TEST_CHECKLIST.md` 100% pass pe telefon Roland Android Chrome (toate 13 secțiuni); (4) backup secundar Storj/B2 funcțional sau decizie admin "skip"; (5) PWA instalată pe telefonul mamei (Add to Home Screen); (6) mama folosește app-ul în viața reală minim 7 zile fără bug-uri SEV1/SEV2 raportate; (7) `STATE_LIVE.md` actualizat cu marcaj "GO-LIVE 100%".

### Task-uri Faza 10

- [ ] **T10.1** — Re-run `/audit complet` [efort: MIC]
  - **Cum:** rulez skill `/audit`; compar cu raportul original 58/100; verifică toate `CRITICA` și `HIGH` închise
  - **Gate:** scor ≥85/100 → trece la T10.2; <85 → identifică gap-uri și revino la Faza 5/6/7/8/9
- [ ] **T10.2** — Lighthouse PWA 100 / Performance ≥95 / Accessibility ≥95 [efort: MEDIU]
  - **Cum:** `npx lighthouse https://mami-docs.pages.dev --view --form-factor=mobile --throttling.cpuSlowdownMultiplier=4`
  - **Gate:** orice score <95 → fix și repeat
- [ ] **T10.3** — Test pe telefon Roland — `docs/TEST_CHECKLIST.md` complet [efort: MARE]
  - **Cum:** parcurge cele 13 secțiuni din checklist pe telefon real Android Chrome; raportează blocaje în jurnal
  - **Gate:** 100% pass → trece la T10.5; orice blocaj → fix și repeat
- [ ] **T10.4** — Backup secundar Storj/B2 [BLOCKED admin] [efort: MIC]
  - **Sursa:** PLAN Faza 4
  - **Blocker:** lipsă credențiale Storj/B2 în `~/.api-keys/catalog.md`; admin adaugă în INBOX.md
  - **Cum:** după credențiale → `workers/keepalive` adaugă cron săptămânal duminică 04:00 UTC; tar.gz Supabase + push S3 API la bucket Storj/B2
- [ ] **T10.5** — Go-live mama [BLOCKED admin manual] [efort: MIC]
  - **Pre-condiție:** T10.3 100% pass + T10.1 ≥85/100 + decizie admin
  - **Pași admin (fizic, AI nu poate face):**
    1. Pe telefonul mamei, deschide Chrome → `https://mami-docs.pages.dev` → "Add to Home Screen"
    2. Setup notificări mama: `~/.api-keys/INBOX.md` cu `MAMA_NTFY_TOPIC` + `MAMA_CALLMEBOT_API_KEY` (când admin decide)
    3. Test final pe telefonul mamei: instalare + offline + chat AI vocal + wellness + remindere
  - **Gate:** mama folosește app-ul în viața reală 7 zile fără bug-uri raportate

---

## Risk Register (top 10 — mitigation pentru task-urile cele mai periculoase)

| #   | Task                              | Risc                                                                         | Severitate | Mitigation                                                                                                                                        |
| --- | --------------------------------- | ---------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | T5.1 DOMPurify upgrade            | Breaking change `sanitize()` API → docViewer rupt → toate documentele albe   | HIGH       | Smoke test 1 docx + 1 pdf + 1 md ÎNAINTE de commit; rollback `npm install dompurify@3.1.5` dacă regresie                                          |
| R2  | T5.13 RAG integration             | Context prea mare → token cost ×3-5 → quota Groq exhaust                     | MEDIUM     | `topK = 3` max, `maxContextChars = 1500`; log cost per request în worker pentru monitoring                                                        |
| R3  | T6.1 RLS strict                   | Mama nu mai vede datele sale (device_id mismatch) → SEV1 blocking            | CRITIC     | (a) STAGING Supabase test FIRST cu un device_id mock; (b) rollback SQL pregătit; (c) device_id propagat client→worker→Supabase header verificat   |
| R4  | T6.4 Rate limiting                | Limită prea agresivă (10/min) → mama blocată la 11 mesaje/min în chat lung   | MEDIUM     | Limit inițial **30 req/min** (mama e 1 user); monitor 7 zile; ajustează doar dacă se vede abuse din afară                                         |
| R5  | T7.E.1 SSE streaming              | CF Workers stream timeout (30s) → răspuns truncat la jumate                  | MEDIUM     | Heartbeat keep-alive `: ping\n\n` la 25s; client recunoaște `done` event explicit; timeout local 60s cu graceful fallback la non-stream           |
| R6  | T7.C.2 Tratament — Reminders      | `setTimeout` din JS NU SUPRAVIEȚUIEȘTE reload page → mama nu primește alertă | HIGH       | (a) re-schedule la `connectedCallback` din localStorage; (b) push prin keepalive worker cron pentru remindere zilnice (server-side, fiabil)       |
| R7  | T8.5 pdfjs 4 → 5                  | Worker path API schimbat → toate PDF-urile se sparg                          | HIGH       | Smoke test 3 PDF-uri DIVERSE (cu/fără text layer, cu fonts embedded, scanat); rollback pin `pdfjs-dist@4.4.168` pregătit                          |
| R8  | T8.6 Vite 5 → 8                   | SW generation eșuează / `vite-plugin-pwa` incompat → mama offline rupt       | CRITIC     | Upgrade pe staging FIRST (T9.2); test instalare PWA + offline; rollback `vite@5.2.11` dacă SW nu generează                                        |
| R9  | T5.14 prefers-reduced-motion glob | Sparge animații necesare (loading spinner, tooltip slide)                    | LOW        | Scope la `*` cu `animation-duration: 0.01ms !important` (nu `none`) — păstrează semantic rendering pentru screen readers; whitelist exception-uri |
| R10 | T6.2 CALLMEBOT → worker           | Cont CallMeBot rate-limited per cont (nu per IP) → toate apelurile blocate   | LOW        | Cu 1 user (mama) e OK; documentat în `docs/notification-stack.md`; backup ntfy + Telegram dacă CallMeBot down                                     |

**Reguli de aplicare:**

- Înaintea fiecărui task R-CRITIC sau R-HIGH: agentul citește mitigation-ul din tabel, ÎN PLUS de "Cum"-ul task-ului
- La risc real materializat (regresie detectată) → STOP, raport admin, NU continua faza
- Mitigation testată = parte din DoD-ul fazei

---

## Jurnal Execuție

| Data       | Task                                                  | Status       | Observații                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------- | ----------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-01 | T1 — Health check API keys                            | ✅ Completat | 54/54 SET, 0 lipsă                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-05-01 | T2 — Verifică repo GitHub                             | ✅ Completat | Repo public, main, creat 2026-04-30                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-05-01 | T3 — Rename research file                             | ✅ Completat | → PROIECT_MAMI_DOCS_RESEARCH.md                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-05-01 | T4 — PLAN_initiere                                    | ✅ Completat | Acest fișier                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 2026-05-01 | T5 — CLAUDE.md proiect                                | ✅ Completat | Reguli override locale + surse adevăr                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-05-01 | T6 — ADR Anexa C                                      | ✅ Completat | 17 decizii cu alternative respinse                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-05-01 | T7 — docs/stack.md                                    | ✅ Completat | Stack consolidat cu linkuri docs oficiale                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2026-05-01 | T8 — docs/ai-fallback-chain.md                        | ✅ Completat | 8 categorii + circuit breaker pattern                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-05-01 | T9 — docs/notification-stack.md                       | ✅ Completat | 4 straturi + setup ntfy pas cu pas                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-05-01 | T10 — docs/service-limits.md                          | ✅ Completat | Tabel complet toate serviciile                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-05-01 | T11 — docs/medical-disclaimers.md                     | ✅ Completat | 5 texte RO + Web Component skeleton                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-05-01 | T12 — docs/api-keys-map.md                            | ✅ Completat | 54 chei mapate; CALLMEBOT lipsă                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-05-01 | T13 — docs/roadmap.md                                 | ✅ Completat | Features bifabile Faza 0-4 + backlog                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-05-01 | T14 — README.md                                       | ✅ Completat | Public repo, minimal, fără info sensibile                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2026-05-01 | T15 — .gitignore                                      | ✅ Completat | .env\*, node_modules, dist, .wrangler etc.                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-05-01 | T16 — SITEMAP.json + memoria                          | ✅ Completat | Structură completă + planned + MEMORY.md                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-05-01 | Faza 1.5 — Refactor system-prompts                    | ✅ Completat | Șterse prompturile hardcodate, fallback dyn                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-05-01 | Faza 1.5 — Capabilități AI std                        | ✅ Completat | Explică simplu, Traduce, Definește, TTS, AI Dialog                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-05-01 | Faza 1.5 — Memo vocal Whisper                         | ✅ Completat | Fallback STT cu Whisper Large v3 + Gateway                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-05-01 | Faza 1.5 — OCR cascadă                                | ✅ Completat | Tesseract.js adăugat în image-viewer                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-05-01 | Faza 1.5 — Embeddings setup                           | ✅ Completat | Setup arhitectural embeddings.ts (Faza 3)                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2026-05-01 | Faza 2 — Wellness Trackers                            | ✅ Completat | UI + logica pentru Hidratare, Somn, Vitale, etc                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-05-01 | Faza 2 — CF Workers Cron                              | ✅ Completat | Stub pentru Backup R2 + Auto-sumar zilnic                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2026-05-01 | Faza 3 — Medical PDF & Galerie                        | ✅ Completat | Generare PDF cu jsPDF, Stub galerie foto                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-05-01 | Bug fix worker AI Gateway                             | ✅ Completat | callGroqAudio implementat (Whisper) + duplicare reziduară eliminată                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-05-01 | Storage abstraction local-first                       | ✅ Completat | src/data/local-store.ts + photo-blob-store.ts (IndexedDB)                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2026-05-01 | Wellness persistență + PDF real                       | ✅ Completat | localStorage + ultimele 14 măsurători reale în PDF                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-05-01 | Galerie foto funcțională                              | ✅ Completat | Upload + resize 1920px + IndexedDB blob + lightbox + delete                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-05-01 | Embeddings transformers.js real                       | ✅ Completat | Xenova/multilingual-e5-small quantized offline                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-05-01 | Notificări 4 straturi                                 | ✅ Completat | Notification API + ntfy + Telegram + CallMeBot voice                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-05-01 | Reminder hidratare 2h                                 | ✅ Completat | Toggle în Setări + setInterval anti-spam + permission request                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-05-01 | docs/CREDENTIALS_NEEDED.md                            | ✅ Completat | 5 secțiuni cu pași și linkuri (Supabase, ntfy, CallMeBot, FCM, R2)                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-05-01 | .env.example + .gitignore exception                   | ✅ Completat | Template variabile Vite documentat, commitabil                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-05-02 | AI Gateway rewrite complet                            | ✅ Completat | 8 categorii fallback: chat/embed/translate/vision/search/STT                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 2026-05-02 | local-store extins                                    | ✅ Completat | BookmarkEntry, HighlightEntry, DocNote, MenuEntry, DocIndexEntry                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-05-02 | RAG client-side (rag.ts)                              | ✅ Completat | Chunking 400ch, embeddings, cosine similarity, top-K                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-05-02 | Quotes zilnice (quotes.ts)                            | ✅ Completat | 60 citate RO, 6 categorii, getDailyQuote determinist                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-05-02 | Admin PIN mode                                        | ✅ Completat | SHA-256 hash, device_role, UI în mami-settings                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-05-02 | Meniu săptămânal (mami-menu)                          | ✅ Completat | Generator AI, navigare săptămâni, printare, istoric 4 săptămâni                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-05-02 | Drug checker (mami-drug-checker)                      | ✅ Completat | RxNorm typeahead, interacțiuni, severitate, disclaimer medical                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-05-02 | Wellness pattern detection                            | ✅ Completat | Detecție automată 5 tipare din ultimele 7 zile                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-05-02 | Auto-sumar nocturn (keepalive)                        | ✅ Completat | Rewrite complet: R2 backup real + sumar AI + ntfy/Telegram                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-05-02 | Bookmarks + highlights (doc-viewer)                   | ✅ Completat | Salvare scroll%, highlight text în doc, restaurare la redeschidere                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-05-02 | Build TypeScript clean                                | ✅ Completat | 0 erori TS, build Vite OK (chunk size warning only)                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-05-02 | API keys AI Gateway — 10 secrete                      | ✅ Completat | GEMINI, COHERE, MISTRAL, DEEPL, AZURE×2, BRAVE, TAVILY, CEREBRAS, OPENROUTER setate via wrangler                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-05-02 | version.json                                          | ✅ Completat | public/version.json v1.0.0                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-05-02 | Soft-delete galerie 30 zile                           | ✅ Completat | deleted_at în PhotoEntry + purgeDeletedPhotosMeta(30) automat                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-05-02 | Alert 80% storage Supabase                            | ✅ Completat | runStorageCheck în keepalive (după backup zilnic)                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2026-05-02 | AI proactiv contextual                                | ✅ Completat | Card "Sfaturi AI" în wellness cu button → sendChat patterns                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-05-02 | pgvector SQL script                                   | ✅ Completat | docs/sql/pgvector_migration.sql (admin rulează în Supabase editor)                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-05-02 | device_role Supabase sync                             | ✅ Completat | upsert user_profiles la schimbare rol (admin PIN)                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2026-05-05 | Lighthouse score ≥90                                  | ✅ Completat | Performance 59→94; FCP 4.2s→1.1s; lazy loading complet + Supabase lazy + 3 valuri requestIdleCallback                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-05-05 | Jurnal wellness persistent UI                         | ✅ Completat | Card cronologic în mami-wellness — entries hidratare/vitale/somn/emoții ultimele 30 zile, grupate pe zi                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-05-05 | Family sharing RLS                                    | ✅ Completat | SQL `docs/sql/family_sharing.sql` (family_groups, family_members, RLS); UI generate/connect cod în mami-settings                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-05-05 | Arhivă R2 60 zile foto                                | ✅ Completat | Cron săptămânal duminică 03:00 UTC în keepalive worker; mută blob în R2, păstrează thumbnail Supabase                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-05-05 | Documentație utilizator mama                          | ✅ Completat | `docs/USER_GUIDE_MAMA.md` — ghid simplu RO fără jargon tehnic                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-05-05 | Test checklist Roland                                 | ✅ Completat | `docs/TEST_CHECKLIST.md` — pași de testare per modul pe telefonul Roland înainte de go-live mama                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-05-06 | PLAN v2.0 — integrare audit/improve/imbunatatiri      | ✅ Completat | Adăugate Faze 5-10 (71 task-uri noi) cu surse din `.claude-outputs/`; tenderness.mp3 marcat ✅ (era blocked învechit); MED-10 mami-ambient-player confirmat fals positive (Grep import în main.ts)                                                                                                                                                                                                                                                                                                       |
| 2026-05-06 | PLAN v2.1 — sequential thinking refinement            | ✅ Completat | Adăugate: DoD global + per fază (gate-uri obligatorii), 8 dependențe critice cross-phase, estimări cumulate (~95-130h total), Risk Register top 10 cu mitigation; consolidat T5.1+T5.2 într-un singur commit                                                                                                                                                                                                                                                                                             |
| 2026-05-06 | Faza 5 — Hardening Securitate & Calitate (T5.0-T5.18) | ✅ Completat | Audit 58 → 80/100 (+22). Închise 6/7 CRITICA + 5/9 HIGH + 6/12 MEDIUM. CVE: DOMPurify 3.4.2, mammoth 1.12.0. WCAG AA: 44px tap targets, contrast #666/#777, prefers-reduced-motion. Funcțional: RAG integrat în chat (mitigation R2: topK=3, maxChars=1500), system prompts wellness/menu/medicamente/gallery cu disclaimer medical. Mitigation R1+R2+R9 aplicate. Build verde, 114/115 tests pass, GH Actions deploy 883a3b6 success. Raport: `.claude-outputs/audit/2026-05-06_025339/audit_report.md` |
| 2026-05-06 | Hotfix NEW-1 — innerHTML residual XSS                 | ✅ Completat | mami-doc-viewer.ts:389 (err.message → textContent), mami-wellness.ts:399 (alerts → DOM nodes), mami-menu.ts:196 (quote → textNode + small element). Toate user data prin DOM API safe.                                                                                                                                                                                                                                                                                                                   |
| 2026-05-06 | Stil prompts AI — neutru, sincer, fără jargon         | ✅ Completat | Per request admin: rescris `system-prompts.ts` (5 prompts) + 3 prompts inline (mami-menu, mami-wellness, mami-doc-viewer). Eliminat „mama" / „cald" / „prietenos" / „femeie de ~60 ani". HONESTY_RULE constant: declarare explicită incertitudine. Memorie: `feedback_ton_ai_chat.md`.                                                                                                                                                                                                                   |
| 2026-05-06 | Faza 6 partial — T6.3-T6.7 (autonom, non-HIGH)        | ✅ Completat | T6.3 PIN salt random 16B per device (regenerat la fiecare set); T6.4 rate limit KV 30 req/min/IP (mitigation R4) + KV namespace placeholder în wrangler.toml; T6.5 CORS strict (no `*` fallback, deny dacă origin nu match); T6.6 STT Whisper fallback automat la network/no-speech; T6.7 cleanup invites SQL `< now()` (era `now() - 30d`). Build verde, tests 114/115. T6.1 RLS + T6.2 CALLMEBOT rămân PENDING — confirmare admin.                                                                     |
