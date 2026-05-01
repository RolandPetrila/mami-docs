# ADR 0001 — Decizii Tehnice Finale (Anexa C v2)

**Status:** Acceptat  
**Dată confirmare admin:** 2026-05-01  
**Confirmat de:** Roland Petrila (admin)  
**Sesiune confirmare:** Prima sesiune de implementare proiect Mami_Docs

---

## Context

Proiectul Mami_Docs este o PWA personală pentru mama lui Roland (~60 ani, Android Chrome).
Deciziile de mai jos au fost stabilite după parcurgerea specificației funcționale (`PROIECT_MAMI_DOCS_SPEC.md`)
și a raportului de cercetare (`PROIECT_MAMI_DOCS_RESEARCH.md`), integrate în Anexa C v2 confirmată de admin.

Aceste decizii sunt **finale** și suprascrieie orice sugestie anterioară din sesiunile de cercetare.
Orice modificare ulterioară se face cu confirmare explicită admin și actualizare a acestui ADR.

---

## Decizii

### D1 — Stack Frontend

**Decizie:** Vanilla JS + Web Components + Vite (build static)

**Context:** PWA simplă, audiență non-tech (mama), nu necesită reactivity framework complex.

**Alternative respinse:**

- React: overhead bundle inutil, mama nu interacționează cu complexitate SPA
- Vue: similar React, overhead nejustificat pentru use case
- Svelte: mai puțin familiar, comunitate mai mică pentru PWA specifică

**Consecințe:**

- Bundle mic, load rapid pe conexiuni mobile slabe
- Web Components native: `<mami-tab-card>`, `<mami-voice-button>` etc.
- Vite pentru HMR în dev + build optimizat în producție
- TypeScript strict din Faza 1

---

### D2 — PWA Helper

**Decizie:** Workbox

**Context:** Standard industry pentru Service Worker management, generat de Vite plugin.

**Alternative respinse:**

- Service Worker manual: prea complex, error-prone pentru caching strategies
- sw-precache: deprecat

**Consecințe:**

- Cache strategies predefinite (StaleWhileRevalidate, CacheFirst)
- Offline funcțional automat pentru assets statice
- Background sync pentru sync Supabase când revine conexiunea

**Implementare concretă (T2, 2026-05-01):**
`vite-plugin-pwa@^0.20.5` cu mode `injectManifest`. SW sursă în `src/sw/sw.ts` compilat de Vite (exclus din tsconfig). Client folosește `virtual:pwa-register` (NU `workbox-window` Workbox class direct). Adaptare la stack Vite față de webpack original.

---

### D3 — Randare Documente

**Decizie:** mammoth.js (DOCX) + PDF.js (PDF) + marked (MD) + SheetJS (XLSX) + native `<img>/<video>/<audio>` + Tesseract.js (OCR offline cu `ron` lang pack) + transformers.js (embeddings offline) + jsPDF (PDF medical client-side)

**Context:** Mama are documente în formate diverse (rețete DOCX, acte PDF, notițe MD, tabele XLSX, poze JPG).

**Alternative respinse:**

- Server-side rendering: latency mare, necesită serverless cold starts
- Google Docs viewer embed: GDPR risk, dependență externă, nu funcționează offline
- Apache Tika: prea heavy pentru browser

**Consecințe:**

- Toate renderingurile sunt client-side → offline complet
- Tesseract.js `ron` lang pack (~10MB) se descarcă la prima utilizare OCR
- transformers.js pentru embeddings offline (~50MB model) — loading indicator necesar
- jsPDF generează PDF-uri medicale direct în browser fără server

---

### D4 — AI Fallback (Stratificat per Use-Case)

**Decizie:** Lanț de fallback diferențiat per categorie:

| Categorie                             | Ordine Fallback                                                                                                                              |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Conversațional text                   | Groq Llama 3.1 8B → Groq Llama 3.3 70B → Cerebras Llama 70B → OpenRouter `:free` rotație + cached                                            |
| Vision/OCR                            | Tesseract.js client → Gemini 2.5 Flash → Gemini Flash-Lite → Mistral OCR                                                                     |
| Embeddings                            | gemini-embedding-001 → transformers.js (browser) → Cohere Multilingual → Mistral Embed                                                       |
| STT                                   | Web Speech API ro-RO → Groq Whisper Large v3 → Cloudflare Workers AI Whisper                                                                 |
| TTS                                   | Web Speech API ro-RO → Google Cloud TTS via CallMeBot                                                                                        |
| Traducere                             | DeepL ×2 → Azure Translator ×2 → Gemini Flash                                                                                                |
| Web search                            | Brave → Tavily → Jina Reader                                                                                                                 |
| EXCLUS pentru date personale/medicale | DeepSeek (servere China, GDPR risk) · Anthropic/OpenAI runtime (cost; rezervate dev-time admin) · xAI Grok cu data sharing activat (privacy) |

**Context:** Fiabilitate 24/7 fără cost lunar fix. Mama folosește aplicația zilnic.

**Alternative respinse:**

- OpenAI GPT-4o singur: cost lunar ridicat, GDPR incert pentru date mama
- Ollama local: necesită server local mereu pornit
- DeepSeek: servere China → GDPR risk explicit pentru date medicale mama

**Consecințe:**

- Implementare mai complexă (8 categorii × N fallback-uri)
- Cost efectiv ~$0 la volum normal de utilizare
- Degradare gracefully când un provider este down
- Logging per provider necesar pentru debugging

---

### D5 — Format Documente

**Decizie:** Mix MD (text uman/AI) + JSON (structuri programabile: SITEMAP.json, welcome-messages.json, manifest, version.json, configs)

**Context:** Mama creează documente în Word sau notițe simple; AI generează/editează în MD.

**Consecințe:**

- MD: ușor de editat, versionat în Git, renderizat de marked
- JSON: mașini-citibile, fără ambiguitate, ușor de actualizat via API

---

### D6 — Convenție Denumire

**Decizie:** kebab-case pentru fișiere/foldere; ALL_CAPS pentru protocol files

**Protocol files (ALL_CAPS):** CLAUDE.md, MEMORY.md, README.md, SITEMAP.json, PLAN\_\*.md

**Consecințe:**

- Consistență cross-platform (case-insensitive Windows vs case-sensitive Linux/Cloudflare)
- Ușor de citit în file listings

---

### D7 — Versioning

**Decizie:** SemVer + Git tags (`vX.Y.Z`) + `version.json` în rădăcină

**Context:** Service Worker are nevoie de version check pentru invalidare cache.

**Consecințe:**

- `version.json` conține `{ "version": "0.1.0", "buildDate": "..." }`
- SW compară version la startup și notifică utilizatorul la update disponibil
- Git tags marchează release-urile deployate pe Cloudflare Pages

---

### D8 — Cron Backup Zilnic

**Decizie:** 02:00 UTC (~05:00 RO iarnă / 04:00 RO vară)

**Context:** Evită orele de utilizare activă. Supabase → R2 dump complet.

**Consecințe:**

- Cloudflare Workers Cron Trigger la `0 2 * * *`
- La eșec: retry x3, alert Telegram admin

---

### D9 — Purge Poze Supabase

**Decizie:** Auto-resize la upload (max 1920px, 80% JPEG) + soft-delete 30 zile + arhivă R2 la 60 zile nereaccesare + thumbnail Supabase + alert admin la 80% storage

**Context:** Supabase free tier: 1GB Storage. Mama poate urca multe poze.

**Consecințe:**

- Reducer automat dimensiune la upload (Cloudflare Worker sau browser Canvas)
- Soft-delete: fișierul marcheat `deleted_at`, nu șters imediat
- La 60 zile nereaccesare: mutat în R2 (egress 0), thumbnail mic rămâne în Supabase
- Alert Telegram admin la 80% din 1GB (800MB)

---

### D10 — Audio

**Decizie:** Bensound `tenderness.mp3` (CC-BY, atribuție în Setări/Despre) ambient + `alarm_clock_loop.mp3` separat pentru ntfy priority 5

**Context:** Mama apreciază muzică ambientă liniștitoare. Alarmele trebuie să fie distincte.

**Consecințe:**

- Bensound atribuție obligatorie vizibilă în UI (Setări > Despre > Licențe)
- Verificare licență finală via WebFetch înainte de implementare
- `tenderness.mp3` în cache Service Worker
- `alarm_clock_loop.mp3` se opreste numai la tap confirm (UX accesibilitate mama)

---

### D11 — Hosting Deploy

**Decizie:** Cloudflare Pages (bandwidth nelimitat, conectat la repo GitHub public)

**Context:** GitHub Pages dezactivat (backup secundar). Cloudflare Pages: builds automate la push main.

**Alternative respinse:**

- GitHub Pages: bandwidth limitat (100GB/lună), configurare custom domain mai complexă
- Vercel: free tier mai restrictiv pentru PWA cu assets mari
- Netlify: similar Vercel

**Consecințe:**

- La fiecare `git push origin main` → build automat Cloudflare Pages
- URL producție: `https://mami-docs.pages.dev` (sau custom domain ulterior)
- Preview deployments la fiecare PR (util pentru testing)

---

### D12 — Notification Stack

**Decizie:** ntfy.sh priority 5 + Telegram Bot + CallMeBot Voice + FCM topic dedicat, stratificat. `device_role` ('mom'/'admin') în Supabase pentru targeting strict.

**Context:** Admin NU primește reminder-ele mamei. Mama are nevoie de notificări fiabile pe Android.

**Ordine stratificată (corectată conform SPEC adendă §17.2 #12):**

1. ntfy.sh priority 5 — primar, bypass DND, ringtone alarm dedicat (configurat o dată manual pe telefon mama)
2. Telegram Bot — al doilea nivel, nelimitat, rapid și familiar mamei
3. CallMeBot Voice — al treilea, apel TTS în română pentru medicamente critice
4. FCM topic dedicat — al patrulea, redundanță push pură

**Consecințe:**

- `device_role` în tabela `profiles` Supabase: `'mom'` | `'admin'`
- Cron-urile targetează exclusiv `device_role = 'mom'`
- Admin primește doar: erori sistem, alert 80% storage, backup eșuat

---

### D13 — Backup Primar

**Decizie:** Cloudflare R2 (egress 0, 10GB free) zilnic. Secundar opțional săptămânal Storj sau Backblaze B2 (3-2-1 rule).

**Context:** R2 egress 0 = costul transferului de date din R2 este zero. 10GB free acoperă mult timp.

**Alternative respinse:**

- AWS S3: egress cost semnificativ
- Google Cloud Storage: similar S3
- GitHub repository: nu e destinat pentru backup date binare/user

**Consecințe:**

- Backup zilnic automat via Cloudflare Worker Cron
- 3-2-1 rule: 3 copii, 2 media diferite, 1 offsite → implementat în Faza 4

---

### D14 — Supabase Keepalive

**Decizie:** Cron Cloudflare Workers la fiecare 4 zile cu `SELECT 1` pe tabelă publică

**Context:** Supabase free tier pune proiectele în pauză după 7 zile inactivitate. Obligatoriu de la MVP.

**Consecințe:**

- Cloudflare Worker Cron: `0 3 */4 * *` (03:00 UTC la fiecare 4 zile)
- Query pe tabela publică `site_config` (nu date private)
- Alert Telegram admin dacă keepalive eșuează

---

### D15 — Cron Infrastructură

**Decizie:** Cloudflare Workers Cron (granularitate 1 min, fără 60-zile-deactivate)

**Context:** GitHub Actions se dezactivează la inactivitate repo (60 zile). Cloudflare Workers Cron rulează permanent.

**Alternative respinse:**

- GitHub Actions: risc dezactivare automată, nu potrivit pentru cron-uri active producție
- Vercel Cron: limitat pe free tier
- Render Cron: cold start

**Consecințe:**

- Toate cron-urile proiectului (keepalive, backup, notificări) → Cloudflare Workers

---

### D16 — Weather Data

**Decizie:** Open-Meteo API (gratuit, fără key, User-Agent identificat)

**Context:** Mama vrea să știe vremea pentru livadă și ieșiri. Gratuit complet fără înregistrare.

**Implementare:**

- User-Agent header: `MamiDocs/1.0 (personal-app; contact: petrilarolly@gmail.com)`
- Cache local 1 oră (nu interoga la fiecare page load)
- Locație configurabilă (default: coordonate hometown mama)

---

### D17 — Drug Interactions

**Decizie:** RxNorm REST API + openFDA (ambele gratuite, fără key). Mapare denumiri RO → EN via Gemini Flash (~70% acuratețe). Disclaimer "verifică farmacistul" obligatoriu.

**Context:** Mama ia mai multe medicamente. Feature util dar cu risc medical → disclaimer critic.

**Implementare:**

- Step 1: Gemini Flash traduce denumire RO → EN (cu confidence score)
- Step 2: RxNorm lookup → RxCUI
- Step 3: openFDA drug interactions check
- Disclaimer afișat obligatoriu înainte de orice rezultat: text din `docs/medical-disclaimers.md`
- Acuratețe mapare RO→EN ~70% → disclaimer suplimentar privind limitele

**Consecințe:**

- Feature disponibil offline parțial (cache RxNorm pentru medicamente frecvente)
- Rezultatele NU înlocuiesc consultul medical/farmaceutic
- Log separat pentru interogări medicamente (audit medical)

---

## Servicii Suplimentare Confirmate (post-verificare 54 chei API SET)

### Adobe PDF Services

- **Env:** `ADOBE_API_KEY` + `ADOBE_CLIENT_SECRET`
- **Limită:** 500 tranzacții/lună gratuit
- **Use în proiect:**
  - Faza 1+ — randare PDF avansată (split, merge, extract text) îmbogățită vs PDF.js bază
  - Faza 3 — generare PDF medical pentru consultație îmbogățit (combinat cu jsPDF)
- **Confirmat de admin:** 2026-05-01

### GitHub Models GPT-5 / GPT-4.1 free

- **Env:** `GITHUB_TOKEN` (deja existent pentru deploy mami-docs-bot, dual-use)
- **Limită:** 50-150 RPD per model (free tier prin GitHub account, fără cost suplimentar)
- **Use în proiect:** Faza 1.5+ ca fallback pentru cazuri excepționale unde Gemini/Groq nu sunt suficienți (raționament complex, traducere nuanțată, sinteză largă)
- **Confirmat de admin:** 2026-05-01

---

## EXCLUSE Definitiv (override la spec original — confirmat admin 2026-05-01)

| Element                                                                                       | Motiv                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Plant.ID + PlantNet** (`PLANTID_API_KEY`, `PLANTNET_API_KEY`)                               | Implementate în proiect separat **"Livada"** — nu se duplică în Mami_Docs. Tab "Livadă" rămâne doar pentru documente text/foto despre îngrijirea pomilor, NU identificare automată plante. |
| **DeepSeek direct** (`DEEPSEEK_API_KEY`)                                                      | Servere China, GDPR risk pentru date medicale (Italia a interzis în 2025). Permis indirect doar prin OpenRouter `:free` cu DeepSeek-distilled (weights, fără trafic la China).             |
| **Anthropic / OpenAI runtime** (`ANTHROPIC_API_KEY`, `ANTHROPIC_API_KEY_2`, `OPENAI_API_KEY`) | Cost — rezervate strict pentru dev-time admin (Claude Code), niciodată în runtime mama.                                                                                                    |
| **xAI Grok cu data sharing activat** (`XAI_API_KEY`)                                          | Privacy concerns dacă data sharing e ON. Permis doar dacă admin confirmă explicit data sharing OFF.                                                                                        |

---

## Sumar Decizii

| #   | Decizie                                                                                 | Status       |
| --- | --------------------------------------------------------------------------------------- | ------------ |
| D1  | Frontend: Vanilla JS + Web Components + Vite                                            | ✅ Confirmat |
| D2  | PWA helper: Workbox                                                                     | ✅ Confirmat |
| D3  | Randare docs: mammoth + PDF.js + marked + SheetJS + Tesseract + transformers.js + jsPDF | ✅ Confirmat |
| D4  | AI fallback stratificat per use-case (8 categorii)                                      | ✅ Confirmat |
| D5  | Format: MD + JSON                                                                       | ✅ Confirmat |
| D6  | Convenție: kebab-case + ALL_CAPS protocol                                               | ✅ Confirmat |
| D7  | Versioning: SemVer + Git tags + version.json                                            | ✅ Confirmat |
| D8  | Cron backup: 02:00 UTC                                                                  | ✅ Confirmat |
| D9  | Purge poze: resize + soft-delete 30z + arhivă R2 60z                                    | ✅ Confirmat |
| D10 | Audio: Bensound tenderness + alarm_clock_loop                                           | ✅ Confirmat |
| D11 | Hosting: Cloudflare Pages                                                               | ✅ Confirmat |
| D12 | Notificări: ntfy + Telegram + CallMeBot + FCM + device_role                             | ✅ Confirmat |
| D13 | Backup: R2 primar (zilnic) + secundar opțional (3-2-1)                                  | ✅ Confirmat |
| D14 | Supabase keepalive: Cron la 4 zile                                                      | ✅ Confirmat |
| D15 | Cron infra: Cloudflare Workers (nu GitHub Actions)                                      | ✅ Confirmat |
| D16 | Weather: Open-Meteo fără key                                                            | ✅ Confirmat |
| D17 | Drug interactions: RxNorm + openFDA + mapare Gemini + disclaimer                        | ✅ Confirmat |
