# /improve Report — Mami_Docs

**Data:** 2026-05-06 | **Model:** Sonnet 4.6 | **Mod:** complet

---

## Profiling Real

| Metrică                     | Valoare                           |
| --------------------------- | --------------------------------- |
| Build time total            | **80 secunde** (71s Vite + 9s SW) |
| Moduluri transformate       | 925                               |
| Entry point (index.js gzip) | **14.77 kB** → excelent           |
| SW precache                 | 24 intrări, 665 kB                |
| Dist total                  | ~6 MiB                            |
| Lighthouse Performance      | 94 (FCP 1.1s, LCP 1.6s) ✅        |

### Bundle breakdown (top 10)

| Chunk              | Size raw | Gzip                     |
| ------------------ | -------- | ------------------------ |
| pdf.worker.min     | 1,375 kB | (no gzip — workers file) |
| xlsx               | 429 kB   | 143 kB                   |
| jspdf              | 390 kB   | 129 kB                   |
| pdf (pdfjs)        | 334 kB   | 98 kB                    |
| html2canvas        | 201 kB   | 48 kB                    |
| mammoth (index.es) | 151 kB   | 52 kB                    |
| marked.esm         | 35 kB    | 11 kB                    |
| purify.es          | 24 kB    | 9 kB                     |
| main index         | 14.77 kB | 6.4 kB                   |

> Toate chunk-urile mari sunt lazy-loaded — entry point excelent la 14.77 kB.

---

## SECURITATE — P0 URGENT

### [S1] DOMPurify 3.1.5 → 3.4.2 [RECOMANDAT] 🚨

```
Ce:    4 CVE-uri XSS active în versiunea curentă, inclusiv bypass prin textarea rawtext
De ce: Procesezi conținut HTML dinamic (markdownToHTML + doc viewer) — risc real de XSS
Cum:   npm install dompurify@3.4.2 @types/dompurify@latest
       Verifică că API-ul DOMPurify.sanitize() e identical (breaking-free între patches)
Efort: MIC (30min)
Risc:  LOW (API identic)
ROI:   10/10 — securitate critică
Sursa: CVE-2025-15599, CVE-2026-0540, CVE-2026-41239/40 [CERT]
```

### [S2] mammoth 1.8.0 → 1.12.0 [RECOMANDAT] 🚨

```
Ce:    CVE-2025-11849 — Directory Traversal prin imagini cu r:link în docx
De ce: App-ul permite upload DOCX și le randează cu mammoth — risc real dacă mama
       deschide un fișier docx craftat malițios
Cum:   npm install mammoth@1.12.0
       Verifică că opțiunile convertToHtml() sunt identice
Efort: MIC (30min)
Risc:  LOW
ROI:   9/10 — securitate HIGH
Sursa: SNYK-JS-MAMMOTH-13554470 [CERT]
```

---

## DEPENDINTE — P1 HIGH

### [D1] @xenova/transformers → @huggingface/transformers v4 [RECOMANDAT]

```
Ce:    Migrare de la pachetul abandonat (@xenova) la cel oficial (@huggingface/transformers v4)
De ce: @xenova/transformers nu a mai primit update din iunie 2024 (18+ luni!)
       v4 are runtime C++ nativ, WebGPU nativ, bundle -53%, API compatible cu v2
Cum:   npm uninstall @xenova/transformers
       npm install @huggingface/transformers
       src/ai/embeddings.ts: înlocuiește import "@xenova/transformers" cu "@huggingface/transformers"
       Verifică că pipeline("feature-extraction", model) există — API identical v2→v3→v4
Efort: MIC (1-2h, testare inclusa)
Risc:  MEDIUM — verifică comportamentul modelului Xenova/multilingual-e5-small în v4
ROI:   8/10 — securitate + performance + suport activ
Sursa: huggingface.co/blog/transformersjs-v4 [CERT]
```

### [D2] pdfjs-dist 4.4.168 → 5.7.284 [RELEVANT]

```
Ce:    Major version bump cu fix-uri de securitate și performance
De ce: v5 are rendering mai rapid, API curat pentru workers, fix post-CVE-2024-4367
Cum:   npm install pdfjs-dist@5.7.284
       ATENTIE: API worker path s-a schimbat în v5 — verifică vite.config.ts globIgnore
       și modul de import pdfjs-dist/build/pdf.worker.mjs
       Testează că renderingul PDF continuă să funcționeze (3-4 documente test)
Efort: MEDIU (3-4h — testare extensivă necesară)
Risc:  MEDIUM — breaking API changes la workers în v5
ROI:   7/10
Sursa: npmjs.com pdfjs-dist (mai 2026) [CERT]
```

### [D3] xlsx 0.18.5 → evaluare exceljs [RELEVANT]

```
Ce:    xlsx pe npm e înghețat la 0.18.5 (Prototype Pollution known), SheetJS s-a mutat
       la propriul git (git.sheetjs.com, non-standard, fără npm updates)
De ce: Risc de securitate pe termen lung + pachet practic abandonat pe npm
Cum:   OPȚIUNE A: exceljs (MIT, activ, streaming, mai mic)
         npm install exceljs
         Rescrie mami-menu.ts pentru export Excel cu exceljs API (diferit de SheetJS)
       OPȚIUNE B: @e965/xlsx (fork activ pe npm cu patch-uri)
         npm install @e965/xlsx
         Schimbă import din 'xlsx' în '@e965/xlsx' — API identic
       RECOMAND B pe termen scurt, A pe termen lung
Efort: MIC pentru B (2h), MEDIU pentru A (4-6h rewrite)
Risc:  LOW pentru B, MEDIUM pentru A
ROI:   6/10
Sursa: snyk.io/package/npm/xlsx/0.18.5 [CERT]
```

---

## MODERNIZARE STACK — P2 MEDIUM

### [M1] Vite 5.2.11 → 8.x [RELEVANT]

```
Ce:    Vite 8.0.10 e actualul major (3 versiuni în urmă față de 5.2.11)
De ce: HMR mai rapid, tree-shaking îmbunătățit, compatibilitate Node 22+
Cum:   npm install vite@latest vite-plugin-pwa@latest
       ATENȚIE breaking changes Vite 6→7→8:
         - resolve.conditions nu mai sunt adăugate implicit
         - Sass: adaugă css.preprocessorOptions.scss.api: 'modern' (dacă folosești SCSS)
         - Node minim: 20+ pentru Vite 8
       Testează build complet + SW generation + Lighthouse după upgrade
Efort: MEDIU (4-6h)
Risc:  MEDIUM — breaking changes documentate, vite.config.ts minimal reduce riscul
ROI:   6/10 — beneficii DX + long-term support
Sursa: vite.dev/blog/announcing-vite7, v6.vite.dev/guide/migration [CERT]
```

### [M2] TypeScript 5.4.5 → 6.0.3 [RELEVANT]

```
Ce:    TS 6.0.3 cu inferred type predicates, regex syntax checking, --erasableSyntaxOnly
De ce: strict:true deja activ → migrare low-risk; TS 7.0 (Go compiler, 10x faster) va
       urma în 2026-H2, mai bine fi pe 6.x înainte
Cum:   npm install typescript@6.0.3
       tsc --noEmit → verifică 0 erori
       Nimic altceva de schimbat (tsconfig.json e deja compat)
Efort: MIC (1h)
Risc:  LOW — proiectul are deja strict:true
ROI:   6/10
Sursa: devblogs.microsoft.com/typescript [CERT]
```

### [M3] marked 12 → 18 [RELEVANT]

```
Ce:    6 versiuni majore în urmă (12.0.0 → 18.0.3)
De ce: Breaking changes API acumulate + fix-uri XSS suplimentare (complement DOMPurify)
Cum:   npm install marked@18
       Verifică opțiunile used: marked({ breaks, gfm }) — API poate fi schimbat
       Testează că markdown render în mami-chat.ts și doc-viewer funcționează corect
Efort: MIC-MEDIU (2-3h — testare)
Risc:  MEDIUM — 6 majors = breaking changes posibile la opțiuni
ROI:   6/10
Sursa: npmjs.com/package/marked [CERT]
```

---

## ARHITECTURA — P2 MEDIUM

### [A1] System Prompts specializate per tab [RECOMANDAT]

```
Ce:    src/ai/system-prompts.ts are 1 singur prompt (chat). Wellness, Drug Checker,
       Menu generator, Gallery au prompt-uri generice → răspunsuri AI slabe pe context
De ce: Mama primește răspunsuri mai relevante cu prompts specializate pe domeniu
Cum:   Adaugă în PROMPTS[]:
         wellness: "Ești Mami AI în secțiunea Sănătate. Ajuți cu: hidratare, tensiune,
           somn, emoții. OBLIGATORIU la recomandări: '⚠️ Consultă medicul înainte...'"
         medicamente: "Ești Mami AI în secțiunea Medicamente. Explici interacțiuni
           medicamentoase pe înțeles. OBLIGATORIU: disclaimer medical la fiecare răspuns."
         meniu: "Ești Mami AI nutriționist. Sugerezi meniuri sănătoase pentru ~60 ani."
Efort: MIC (1-2h)
Risc:  LOW
ROI:   9/10 — impact direct pe calitatea AI pentru mama
```

### [A2] Circuit breaker persistent (Workers KV vs in-memory) [RELEVANT]

```
Ce:    Circuit breaker în ai-gateway e in-memory (CircuitState). CF Workers pot fi
       instanțe multiple → state-ul se pierde între instanțe → circuit nu funcționează
       corect sub load distribuit
De ce: La erori repetate Groq, toate instanțele Worker pot "deschide" circuitul simultan
       dar nu "văd" eșecurile celorlalte
Cum:   Folosește CF Workers KV sau Durable Objects pentru CircuitState
         const circuitKv = env.CIRCUIT_KV; // binding KV în wrangler.toml
         La citire: const state = await circuitKv.get("groq_circuit", "json")
         La scriere: await circuitKv.put("groq_circuit", JSON.stringify(state))
       Alternativ: acceptă că circuit e per-instance (mai simplu, suficient pentru trafic mic)
Efort: MEDIU (4h)
Risc:  LOW
ROI:   5/10 — relevant doar la trafic concurrent >10 req/s (mama are 1 user)
```

### [A3] Error tracking cu Cloudflare Workers Observability [RELEVANT]

```
Ce:    Zero error tracking în producție. Erorile AI Gateway dispar în console Workers
De ce: Fără monitoring nu știi când Groq/Cerebras cad sau când fallback chain se
       activează
Cum:   OPȚIUNE GRATUITĂ: Cloudflare Workers built-in Observability (dashboard CF)
         În wrangler.toml: [observability] enabled = true
         CF loghează automat exceptions + durate + status codes
       OPȚIUNE AVANSATĂ: Sentry free tier (5k errors/lună)
         npm install @sentry/cloudflare în workers/ai-gateway
Efort: MIC pentru CF Observability (30min), MEDIU pentru Sentry (3h)
Risc:  LOW
ROI:   7/10 — vizibilitate producție
```

---

## PERFORMANCE — P3 LOW

### [P1] Build time 80s — cache npm + parallelizare [RELEVANT]

```
Ce:    Build durează 80 secunde (71s Vite + 9s SW) cu 925 module
De ce: Normal pentru proiectul actual, dar GitHub Actions reconstruiește de la zero
Cum:   deploy.yml deja are cache: npm (Node setup). Adaugă și cache Vite:
         - name: Cache Vite
           uses: actions/cache@v4
           with:
             path: node_modules/.vite
             key: vite-${{ hashFiles('vite.config.ts') }}
Efort: MIC (30min)
Risc:  LOW
ROI:   5/10 — economie 20-30s per deploy
```

### [P2] OPFS (Origin Private File System) pentru RAG index [RELEVANT]

```
Ce:    RAG-ul stochează vectori în localStorage (limitat 5-10MB, sincron)
       OPFS = file system privat browser, async, fără limită, mai rapid pentru binary
De ce: La >100 documente indexate, localStorage poate fi plin; OPFS nu are limite clare
Cum:   src/data/local-store.ts: adaugă OPFS adapter pentru DocIndexEntry
         const root = await navigator.storage.getDirectory()
         const fh = await root.getFileHandle('doc-index.bin', {create: true})
       Fallback: localStorage dacă OPFS nu e disponibil (Safari < 17)
Efort: MARE (8-12h)
Risc:  MEDIUM — API diferit, necesită testare extensivă
ROI:   4/10 — prematur la volumul actual (mama are câteva documente)
```

---

## DX — P3 LOW

### [DX1] Pre-commit hooks cu Husky + lint-staged [RELEVANT]

```
Ce:    Zero pre-commit hooks → tsc/test rulează doar în CI
De ce: Prinde erori TS înainte de push, fără rundă CI eșuată
Cum:   npm install -D husky lint-staged
       npx husky init
       echo "npx tsc --noEmit" > .husky/pre-commit
Efort: MIC (1h)
Risc:  LOW
ROI:   5/10 — DX improvement
```

### [DX2] Coverage thresholds în vitest.config [RELEVANT]

```
Ce:    vitest rulează dar fără prag minim coverage → poate scădea fără alertă
De ce: Proiectul are 115 teste — bun start, dar 0 guardrails
Cum:   vitest.config.ts sau package.json scripts:
         coverage: { thresholds: { lines: 70, functions: 70, branches: 60 } }
Efort: MIC (30min)
Risc:  LOW
ROI:   5/10
```

### [DX3] Staging environment pe CF Pages Preview [RELEVANT]

```
Ce:    Deployezi direct pe main/production. Fără staging environment
De ce: Orice push direct la mama; nu poți testa features noi înainte
Cum:   Creează branch `staging` în GitHub
       CF Pages auto-generează URL preview pentru orice branch non-main:
         staging.mami-docs.pages.dev (automat din CF Pages)
       Workflow: dev → staging → validare Roland → merge main → mama
Efort: MIC (1h configurare workflow mental)
Risc:  LOW
ROI:   6/10 — protecție experiență mama
```

---

## SUMAR ACȚIUNI

| ID  | Titlu                                  | Prioritate | Efort | ROI |
| --- | -------------------------------------- | ---------- | ----- | --- |
| S1  | DOMPurify 3.1.5 → 3.4.2                | P0 🚨      | 30min | 10  |
| S2  | mammoth 1.8.0 → 1.12.0                 | P0 🚨      | 30min | 9   |
| D1  | @xenova → @huggingface/transformers v4 | P1         | 2h    | 8   |
| A1  | System prompts specializate per tab    | P1         | 2h    | 9   |
| D2  | pdfjs-dist → 5.7.284                   | P1         | 4h    | 7   |
| A3  | CF Workers Observability               | P2         | 30min | 7   |
| DX3 | Staging branch CF Pages                | P2         | 1h    | 6   |
| D3  | xlsx → @e965/xlsx sau exceljs          | P2         | 2h    | 6   |
| M1  | Vite 5 → 8                             | P2         | 6h    | 6   |
| M2  | TypeScript 5.4 → 6.0                   | P2         | 1h    | 6   |
| M3  | marked 12 → 18                         | P2         | 3h    | 6   |
| P1  | Build cache Vite în Actions            | P3         | 30min | 5   |
| DX1 | Husky pre-commit hooks                 | P3         | 1h    | 5   |
| DX2 | Coverage thresholds                    | P3         | 30min | 5   |
| A2  | Circuit breaker persistent (KV)        | P3         | 4h    | 5   |
| P2  | OPFS pentru RAG index                  | P3         | 12h   | 4   |
