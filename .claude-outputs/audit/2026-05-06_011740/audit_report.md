# AUDIT COMPLET — Mami_Docs

**Data:** 2026-05-06 | **Model:** Claude Sonnet 4.6 | **Mod:** complet (18 domenii)  
**Branch:** main | **Commit:** 094797d | **Protocol:** AGENT_PROTOCOL v1.0

---

## SCOR FINAL: 58/100

| Domeniu          | Scor  | Note                                                  |
| ---------------- | ----- | ----------------------------------------------------- |
| Securitate       | 8/25  | XSS OCR, CORS wildcard, key client-side               |
| Calitate cod     | 10/20 | 4 bug-uri critice (race condition, null deref, leaks) |
| Arhitectură      | 12/15 | Structură bună, câteva antipattern-uri                |
| Dependențe       | 4/10  | 2 CVE-uri nepatched (xlsx + protobufjs)               |
| Testare          | 7/10  | 114/115 teste pass, lipsă teste UI components         |
| Deploy readiness | 8/10  | GitHub Actions OK, 2 fișiere necommise                |
| Accesibilitate   | 3/10  | 2 bug-uri CRITICE tap targets sub 44px                |
| Documentație     | 6/10  | Spec vs impl: RAG neintegrat, prompts incomplete      |

---

## ACȚIUNE IMEDIATĂ — BLOCKERS

### [CRITICA-1] XSS în OCR — mami-image-viewer.ts:211,219,227,230

**Impact:** 10/10 | **Efort:** MIC (<30min)  
innerHTML cu rezultat OCR (Tesseract.js) scris direct fără DOMPurify. O imagine malițioasă poate injecta JS.  
**Impact business:** Atac XSS executabil pe dispozitivul mamei.  
**FIX:**

```typescript
// Înlocuiește:
bodyEl.innerHTML = `<p>Citesc ${Math.round(m.progress * 100)}%</p>`;
// Cu:
bodyEl.textContent = `Citesc ${Math.round(m.progress * 100)}%`;
// SAU pt HTML complex, wrapeazp cu DOMPurify.sanitize(...)
```

---

### [CRITICA-2] Tap target 28px — mami-chat.ts (buton Ascultă)

**Impact:** 9/10 | **Efort:** MIC (<30min)  
Butonul "🔊 Ascultă" are `min-height: 28px` — sub limita WCAG 44×44px.  
**Impact business:** Mama ~60 ani nu poate apăsa butonul cu precizie.  
**FIX:** `min-height: 44px; min-width: 44px;` în CSS buton listen.

---

### [CRITICA-3] Tap target 32px — mami-search.ts:103-104 (buton Șterge)

**Impact:** 9/10 | **Efort:** MIC (<30min)  
`.delete-btn { min-height: 32px; min-width: 32px; }` — sub 44px.  
**Impact business:** Erori de tap frecvente la ștergere rezultate căutare.  
**FIX:** `min-height: 44px; min-width: 44px;`

---

### [CRITICA-4] Race condition syncDeviceRole — mami-settings.ts:521-523

**Impact:** 8/10 | **Efort:** MIC (<30min)  
`void syncDeviceRole("mom")` e fire-and-forget. localStorage se setează instant, Supabase poate eșua tăcut. Multi-device inconsistent.  
**Impact business:** Family sharing state se pierde; device_role nu se sincronizează fiabil.  
**FIX:**

```typescript
// Înlocuiește:
void syncDeviceRole("mom");
// Cu:
await syncDeviceRole("mom");
```

---

### [CRITICA-5] Null pointer în \_wrapText — mami-doc-viewer.ts:620-643

**Impact:** 7/10 | **Efort:** MIC (<30min)  
`parent.replaceChild(after, textNode)` fără verificare `parent !== null`. Pe noduri text izolate → TypeError crash.  
**Impact business:** Highlight text eșuează cu crash vizibil în viewer.  
**FIX:** Adaugă `if (!parent) continue;` înainte de replaceChild.

---

### [CRITICA-6] Chat message build incorect — mami-chat.ts:368

**Impact:** 7/10 | **Efort:** MIC (<30min)  
Sentinelul e eliminat incorect, mesajul user adăugat duplicat în unele scenarii.  
**Impact business:** AI primește context greșit → răspunsuri necontextuale.  
**FIX:**

```typescript
// Înlocuiește logica slice(0, -1) + push cu:
const msgs = [...history, { role: "user", content: text }];
```

---

### [CRITICA-7] RLS prea permisiv (anon read/write pe toate tabelele) — pgvector_migration.sql:56-67

**Impact:** 9/10 | **Efort:** MARE (>4h)  
`FOR ALL TO anon USING (true) WITH CHECK (true)` — oricine cu Supabase URL citește/scrie datele medicale ale mamei.  
**Impact business:** Date de sănătate (vitale, somn, wellness) accesibile public.  
**FIX:** Implementează RLS cu `device_id` verificat via Workers:

```sql
CREATE POLICY "device_read_only" ON hydration
  FOR SELECT TO anon
  USING (device_id = current_setting('app.device_id', true));
```

⚠️ Necesită confirmare admin — modificare Supabase.

---

## ACEASTĂ SĂPTĂMÂNĂ — HIGH

### [HIGH-1] CALLMEBOT API key expus client-side — notifications.ts:12-14

**Impact:** 7/10 | **Efort:** MEDIU (1-4h)  
`VITE_CALLMEBOT_API_KEY` e public în bundle. Oricine poate face apeluri voce neautorizate.  
**FIX:** Mută apelul CallMeBot în keepalive worker. Client trimite `POST /notify` la worker.

---

### [HIGH-2] PDF generate fără error handling — mami-doc-viewer.ts:573-590

**Impact:** 7/10 | **Efort:** MIC (<30min)  
`await import("jspdf")` poate eșua. UI rămâne blocat în `_reading=true` indefinit.  
**FIX:** Înconjoară cu try/catch și afișează toast de eroare.

---

### [HIGH-3] Memory leak listen buttons — mami-chat.ts:438-448

**Impact:** 6/10 | **Efort:** MEDIU (1-4h)  
Event listeners pe butoane "Ascultă" nu se curăță la clear(). La 10+ clear()-uri → listeners fantomă.  
**FIX:** Implementează `disconnectedCallback()` cu cleanup explicit.

---

### [HIGH-4] Duplicate error handling (5×) — src/ai/client.ts:36-194

**Impact:** 5/10 | **Efort:** MEDIU (1-4h)  
Pattern fetch+catch repetat de 5 ori. La bug fix → 5 locuri de updatat.  
**FIX:** Extrage `fetchJson<T>(endpoint, body, signal)` helper generic.

---

### [HIGH-5] System prompts incomplete (wellness/menu/medicamente) — system-prompts.ts

**Impact:** 8/10 | **Efort:** MIC (<30min)  
`PROMPTS` are doar entry pentru `chat`. Tab-urile wellness, menu, medicamente folosesc fallback generic fără disclaimers medicale obligatorii.  
**Impact business:** AI dă sfaturi medicale fără disclaimer → risc legal.  
**FIX:** Adaugă prompts cu disclaimer pentru wellness și medicamente:

```typescript
wellness: `Ești Mami AI. ⚠️ Nu înlocuiesc medicul. Consultă medicul pentru orice diagnostic.`,
medicamente: `Verificator medicamente. ⚠️ Informație generală, nu prescripție.`,
```

---

### [HIGH-6] xlsx 0.18.5 — CVE GHSA-4r6h-8v6p-xvw6 (Prototype Pollution)

**Impact:** 6/10 | **Efort:** MEDIU (1-4h)  
SheetJS 0.18.5 are Prototype Pollution + ReDoS. Nu există patch pentru 0.18.x.  
**FIX:** Testează upgrade la `xlsx@0.20.x`:

```bash
npm install xlsx@latest
npm run build && npm test
```

---

### [HIGH-7] Contrast insuficient #aaa/#bbb — mami-search.ts:101,108

**Impact:** 7/10 | **Efort:** MIC (<30min)  
`color: #aaa` și `color: #bbb` pe fundal alb sub WCAG AA minim.  
**FIX:** `#aaa` → `#666`, `#bbb` → `#777`

---

### [HIGH-8] RAG neintegrat în chat — mami-chat.ts / rag.ts

**Impact:** 7/10 | **Efort:** MEDIU (1-4h)  
`src/ai/rag.ts` e complet implementat dar NICIODATĂ importat în `mami-chat.ts`. Faza 3 finalizată în plan, dar nu conectată.  
**Impact business:** Mama nu beneficiază de răspunsuri contextuale bazate pe documente.  
**FIX:** Integrează în sendChat:

```typescript
const context = await buildRagContext(userMessage);
const systemWithContext =
  systemPrompt + (context ? `\n\nContext din documente:\n${context}` : "");
```

---

### [HIGH-9] protobufjs CVE-2024-24999 via @xenova/transformers

**Impact:** 4/10 | **Efort:** MEDIU (1-4h)  
Arbitrary code execution prin .proto malițios. Risc practic VERY LOW (model ONNX oficial).  
**FIX:**

```bash
npm audit fix --force
# Verifică compat API transformers.js în embeddings.ts
```

---

## CÂND AI TIMP — MEDIUM

### [MED-1] CORS fallback la \* în AI Gateway — ai-gateway/index.ts:962

Dacă `ALLOWED_ORIGIN` nu e setat → accept orice origin. Rate limit abuse.  
**FIX:** Deny explicit dacă origin nu e în whitelist.

### [MED-2] PIN hash fără salt — mami-settings.ts:162-169

SHA-256 fără salt → rainbow table pe 4-8 cifre (max 100.000 combinații).  
**FIX:** `crypto.getRandomValues()` salt + salvat în localStorage.

### [MED-3] Rate limiting absent în AI Gateway

100+ req/sec → exhaust Groq/Mistral quota.  
**FIX:** Cloudflare KV counter per IP cu TTL 60s.

### [MED-4] Toast setTimeout fără cleanup — mami-wellness.ts:444-450

Timeout nu e cancelat la `disconnectedCallback`. Crash pe componentă distrugere.  
**FIX:** Track `_toastTimerId` și clear în disconnectedCallback.

### [MED-5] Empty catch blocks (6 locații)

`client.ts:67`, `embeddings.ts:104`, `local-store.ts:83`, `speech.ts:117,169`, `supabase.ts:43`  
**FIX:** Log minimal: `console.warn("[module] eroare:", err instanceof Error ? err.message : String(err))`

### [MED-6] Transcribe fallback (Web Speech → Whisper) neimplementat — mami-chat.ts

`transcribeAudio()` există în client.ts dar nu e invocat la eșec Web Speech.  
**FIX:** La catch STT, apelează `transcribeAudio(blob, signal)`.

### [MED-7] STT fallback neconectat — mami-chat.ts

Web Speech → Whisper în client.ts există dar nu e invocat la eșec Web Speech.

### [MED-8] Lipsă aria-label pe butoane — mami-search.ts:132, mami-chat.ts

Buton ștergere: `aria-label="Șterge din rezultate"`. Buton ascultă: `aria-label="Ascultă răspunsul"`.

### [MED-9] Fișiere necommise — git status

`docs/ai-fallback-chain.md` și `info_chat.txt` modificate local, necommise.  
**FIX:** `git add docs/ai-fallback-chain.md info_chat.txt && git commit -m "docs: update ai-fallback-chain + info_chat"`

### [MED-10] Dead code — mami-ambient-player.ts

`src/components/mami-ambient-player.ts` nu e importat nicăieri în main.ts.  
**FIX:** Verifică dacă e planned, altfel șterge.

### [MED-11] family_sharing.sql — invites cleanup după 30 zile + 7 (prea târziu)

Cod expiră în 7 zile, se șterge abia după 30 zile suplimentar.  
**FIX:** `< now()` în loc de `< now() - interval '30 days'`

### [MED-12] Vite manualChunks lipsă (opțional, Lighthouse 94 deja)

Splitting implicit funcționează, dar fără control granular.

---

## IGNORABIL — LOW

- `.gitkeep` fișiere placeholder fără conținut (folderele sunt populate)
- pgvector SQL — dimension 384 hardcodat (adaugă comentariu dacă schimbi)
- Test timeout AI Gateway (edge case all-providers-down, mărește la 15s)
- SITEMAP.json — actualizează cu tab-urile noi
- `getSelection()` pe shadow root via `(this._sr as any)` — compatibility edge case Android

---

## POZITIVE (ce e bine)

✅ DOMPurify implementat corect în doc-viewer (6 locuri)  
✅ TypeScript strict + noUncheckedIndexedAccess activ  
✅ Build 0 erori TypeScript  
✅ Lighthouse Performance 94 (FCP 1.1s, LCP 1.6s)  
✅ Service Worker precache optimizat (656kB, chunki heavy excluși)  
✅ Chei AI în Secrets (nu în client) — pattern corect  
✅ Fallback chain AI complet implementat (8 categorii × 3-6 providers)  
✅ 114/115 teste passing  
✅ GitHub Actions auto-deploy funcțional  
✅ .gitignore complet (.env\*, dist, node_modules, .wrangler)  
✅ SHA-256 pe PIN (nu plaintext)  
✅ Soft-delete galerie + purge automat 30 zile

---

## PLAN DE REMEDIERE RECOMANDAT

### Sesiunea 1 (azi, ~2h): Fix-uri CRITICE fără confirmare admin

1. CRITICA-2: Tap 28px → 44px (mami-chat.ts)
2. CRITICA-3: Tap 32px → 44px (mami-search.ts)
3. CRITICA-1: XSS OCR — înlocuiește innerHTML cu textContent
4. CRITICA-4: await syncDeviceRole()
5. CRITICA-5: null check în \_wrapText
6. CRITICA-6: chat message build fix
7. HIGH-5: system prompts wellness/medicamente cu disclaimer
8. MED-8: aria-labels butoane
9. MED-9: Commit fișiere modificate
10. HIGH-7: Contrast #aaa → #666

### Sesiunea 2 (cu confirmare admin): RLS Supabase + RAG

11. CRITICA-7: RLS fix (necesită rulare SQL în Supabase)
12. HIGH-8: RAG integration în chat

### Sesiunea 3 (opțional, optimizări):

13. HIGH-1: CALLMEBOT → worker
14. HIGH-6: Upgrade xlsx
15. MED-1: CORS strict
16. MED-2: PIN salt
17. MED-3: Rate limiting

---

_Generat automat de /audit complet | Mami_Docs Agent Protocol v1.0_
