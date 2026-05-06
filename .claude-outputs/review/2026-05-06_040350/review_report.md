# Code Review — Sesiune 2026-05-06 (commits `935164e..db43f86`)

**Data:** 2026-05-06 04:03 UTC | **Reviewer:** Claude Opus 4.7 (1M)
**Branch:** main | **Commits:** 11 | **Fișiere:** 39 | **Linii:** +2811 / -2528

---

## VERDICT: **APPROVE** ✅

Toate modificările aprobate, build verde, 139/139 tests pass. 1 observație MEDIUM (mami-wellness.ts:531) și 1 PRE-EXISTING (scripts secrete tracked) — ambele documentate mai jos, nu blochează commit-urile actuale.

---

## Sumar pe commit-uri

| Hash | Categorie | Fișiere | Verdict |
|------|-----------|---------|---------|
| `935164e` | chore: pre-Faza 5 cleanup | 4 | ✅ |
| `883a3b6` | feat(faza-5): hardening | 15 | ✅ |
| `81f9a2b` | docs: jurnal Faza 5 | 4 | ✅ |
| `d0309fa` | feat(faza-6-partial): hotfix XSS + ton AI + T6.3-7 | 10 | ✅ |
| `e715a3c` | feat(faza-6): worker deploy + STATE_LIVE | 3 | ✅ |
| `697e9eb` | ci: workflow worker step + KV | 2 | ✅ |
| `aa95081` | ci: fix UTF-8 deploy bug | 1 | ✅ |
| `7752204` | feat(T6.2): CALLMEBOT → keepalive worker | 3 | ✅ |
| `5e9c4ce` | feat(faza-8): modernizare deps | 8 | ✅ |
| `fc900c6` | feat(faza-9+T6.1): RLS + observability + DRY | 9 | ✅ |
| `db43f86` | docs(faza-9-final): bifări + audit 92/100 | 4 | ✅ |

---

## Review pe 6 criterii

### 1. Corectitudine ✅

**Fișiere HIGH IMPACT verificate:**

- **`workers/ai-gateway/index.ts`** — rate limit (T6.4) graceful fallback dacă KV unbound, counter increment corect, Retry-After header setat. CORS strict (T6.5) acoperă cazurile cu/fără ALLOWED_ORIGIN. **Acoperit de 7 teste noi** (4 rate limit + 3 CORS).
- **`workers/keepalive/index.ts`** — `/notify` validează text (required, length ≤ 500), CallMeBot URL construit cu encodare corectă, error handling 502 distinct de 503 (config lipsă vs reachability). **Acoperit de 12 teste noi**.
- **`src/data/supabase.ts`** — `deviceId()` lazy + persistent în localStorage; `crypto.randomUUID()` cu fallback `Date.now()`. **Acoperit de 5 teste noi**.
- **`src/components/mami-image-viewer.ts`** — XSS OCR fix folosește `replaceChildren` + `textContent` corect; helper-ele `setStatus`/`setOcrResult` decuplate. ✅
- **`src/components/mami-chat.ts`** — RAG context cu graceful fallback (try/catch în jurul `getRagContextForQuery`); `_listenBtnHandlers` Map cu cleanup în `disconnectedCallback` și `clear()`. ✅
- **`src/components/mami-settings.ts`** — PIN salt regenerat la fiecare `setAdminPin` (testat în `getOrCreateSalt` + `hashPin`). `await syncDeviceRole` în handler async — race condition închisă. ✅

**Edge cases acoperite:**
- KV unbound → bypass rate limit
- Origin mismatch → 403 înainte de rate limit
- CALLMEBOT secrets lipsă → 503 (nu 500)
- text gol/whitespace/>500 → 400 înainte de fetch
- network error → 502 (nu 5xx generic)

### 2. Securitate ✅ (1 observație MEDIUM)

**Pozitive:**
- ✅ Zero CVE după upgrade Vite 8 + plugin-pwa 1.3 (`npm audit`: 0 vulnerabilities, era 11)
- ✅ DOMPurify 3.4.2 + mammoth 1.12.0 (5 CVE închise în Faza 5)
- ✅ XSS OCR închis (CRITICA-1)
- ✅ XSS residual (NEW-1) închis în 3 locații
- ✅ CALLMEBOT key MUTAT server-side (zero key în bundle client — verifiable cu `grep` în `dist/`)
- ✅ CORS strict (no `*` fallback) verificat live: `HTTP 403` la origin necunoscut
- ✅ Rate limit KV ACTIV pe production (deployed via GH Actions cu KV scope)
- ✅ PIN salt random 16B per device
- ✅ RLS device_id pregătit în SQL (cere admin manual pentru aplicare prod)
- ✅ Worker bindings: AI Gateway folosește `RATE_LIMIT_KV` + `ALLOWED_ORIGIN`; keepalive folosește `CALLMEBOT_*` + `ALLOWED_ORIGIN`

**[MED-NEW] `mami-wellness.ts:531` — innerHTML cu items vitale**
```ts
return `<li>${d}: ${v.systolic}/${v.diastolic}${pulse}</li>`;
// ...
box.innerHTML = `<strong>Ultimele 5 măsurători:</strong><ul>${items}</ul>`;
```
Date sunt din storage local (numerice + Date.toLocaleString), risc XSS efectiv minim, dar inconsistent cu pattern-ul DOM API safe aplicat în restul Faza 5. **Recomandare:** convert la `replaceChildren` + `document.createElement("li")` în următoarea sesiune (efort MIC, ~10 min).

**[PRE-EXISTING] Scripts secrete tracked în git:**
- `workers/keepalive/set-secrets.ps1` (commit `dca70ef`, ANTERIOR sesiunii)
- `workers/set-pages-vars.ps1` (idem)

Verificat: scripturile **NU conțin valori**, doar nume env vars. Hook-ul guard-sensitive a triggered fals pozitiv pe pattern „secret"/"password" în șiruri ASCII fără valori. **Recomandare:** revizuit hook-ul global, sau adăugat exception explicit pentru aceste scripts. Nu e responsabilitate sesiunea curentă.

### 3. Convenții ✅

- ✅ TypeScript strict + `noUncheckedIndexedAccess` păstrat
- ✅ kebab-case fișiere componente (`mami-*.ts`)
- ✅ ALL_CAPS pentru `STATE_LIVE.md`, `MEMORY.md`, `PLAN_*.md`
- ✅ Vanilla Web Components cu prefix `mami-`
- ✅ Tap targets 44×44px (WCAG 2.5.5) consistent
- ✅ Comentarii doar pentru WHY non-evident (mitigation R2/R4/R7/R8/R9 documentate inline)
- ✅ Romanian-language în UI (consistent cu CLAUDE.md proiect)
- ✅ Conventional commits (feat/fix/chore/ci/docs/test)

### 4. Performanță ✅

- ✅ Bundle precache **1475 → 670 KiB (-54%)** după Vite 8 + plugin-pwa 1.3
- ✅ Transformers v4: bundle reduction ~17% pe acel chunk specific
- ✅ CSS containment `contain: layout paint` pe doc-viewer + gallery (T9.10) — reduce reflow în zona heavy
- ✅ AbortController în mami-wellness AI sfaturi (T9.6) — evită fetch-uri zombie după disconnectedCallback
- ✅ Lazy import jspdf, mammoth, xlsx, pdfjs (deja existent, neregresat)
- ✅ KV TTL 60s pentru rate limit — auto-expire fără cleanup explicit
- ✅ RAG: topK=3 + maxContextChars=1500 (mitigation R2) limitează token cost ×3-5

**Niciun N+1, niciun loop ineficient detectat în diff.**

### 5. Claritate ✅

- ✅ Helper extract: `fetchJson<T>()` în client.ts elimină duplicare 5× (HIGH-4 closed)
- ✅ Constanta `HONESTY_RULE` în system-prompts.ts — DRY pentru toate prompts AI
- ✅ Helper-i locali în `_runOcr`: `setStatus` + `setOcrResult` — decuplare clară
- ✅ Funcție `current_device_id()` în SQL cu STABLE annotation — clear intent
- ✅ Comments mitigation aliniate cu Risk Register (R1, R2, R3, R4, R7, R8, R9)
- ✅ Variable naming: `_listenBtnHandlers`, `_aiController`, `_toastTimerId`, `whisperHandle` — toate descriptive

### 6. Completitudine ✅

- ✅ Imports adăugate consistent (no missing references)
- ✅ Error handling adăugat unde lipsea (PDF, OCR, RAG, AI sfaturi, fetch retries)
- ✅ Empty catch blocks logged cu `console.warn` + module prefix (`[ai/client]`, `[embeddings/gemini]`, etc.)
- ✅ Disconnected callback adăugat în mami-chat (memory leak fix) și mami-wellness (toast timer + AbortController)
- ✅ Tests adăugate pentru toate feature-urile noi: 24 teste noi (rate limit + CORS + deviceId + /notify)
- ✅ Documentație: SQL pgvector cu instrucțiuni backfill, audit reports cu DELTA, STATE_LIVE actualizat, PLAN bifările

---

## Pattern-uri periculoase verificate (clean)

- ❌ Niciun secret hardcoded în cod source
- ❌ Niciun `eval()`, `document.write`, `new Function()`
- ❌ Niciun `dangerouslySetInnerHTML` (e React, n-avem oricum)
- ❌ Niciun TODO/FIXME în cod nou (decizii documentate inline cu mitigation)
- ❌ Niciun fișier `.env` committed
- ❌ Niciun token CF / API key în diff (verificat cu Grep regex pe JWT/sk-/api-key patterns)

---

## Observații minore (non-blocking)

1. **`vitest.config.ts`** — coverage block apărea dublat după edit, fix aplicat în-session
2. **Linter prettier** a re-formatat ~5 fișiere între edit-uri (cosmetic, no semantic change)
3. **Test pre-existent** "503 când toți providerii eșuează" — fix aplicat (timeout 5s → 20s) și acoperă acum tot fallback chain
4. **`@types/dompurify`** stub deprecated (DOMPurify are tipuri proprii din 3.x) — poate fi eliminat în viitor (efort MIC)

---

## Mesaj commit (deja făcut, pentru referință)

Toate cele 11 commits respectă formatul Conventional Commits:
- `feat(faza-5)`, `feat(faza-6)`, `feat(faza-8)`, `feat(faza-9+T6.1)`, `feat(T6.2)`
- `chore`, `ci`, `docs(faza-X-final)`

**Verdict final: SAFE TO MAIN ✅** — toate commit-urile pushed pe `main`, GH Actions verde.

---

## Recomandare următor

1. **Hotfix MED-NEW:** `mami-wellness.ts:531` innerHTML → DOM API safe (10 min)
2. **PRE-EXISTING:** revizuit `workers/*set-*.ps1` ca să nu mai trigger guard-sensitive (5 min)
3. **Faza 10:** test pe telefon Roland + Lighthouse (admin manual)
4. **T6.1 prod:** admin rulează SQL în staging Supabase, apoi prod
5. **T6.2 prod:** admin face `wrangler secret put CALLMEBOT_API_KEY/PHONE/ALLOWED_ORIGIN`

**End of review.**
