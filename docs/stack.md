# Stack Tehnic — Mami_Docs PWA

**Data ultimei actualizări:** 2026-05-01  
**Versiune stack:** 1.0 (confirmată Anexa C v2)

---

## Frontend

| Tehnologie              | Rol                     | Rationale                                                       |
| ----------------------- | ----------------------- | --------------------------------------------------------------- |
| **Vanilla JS**          | Logică aplicație        | Bundle mic, zero overhead framework, potrivit pentru PWA simplă |
| **Web Components**      | Componente UI           | Native browser, prefix `mami-`, fără dependențe runtime         |
| **Vite**                | Build tool + dev server | HMR rapid, build optimizat, plugin Workbox integrat             |
| **TypeScript (strict)** | Type safety             | `strict: true`, `noUncheckedIndexedAccess: true` din Faza 1     |

**Docs oficiale:**

- Vite: https://vitejs.dev/guide/
- Web Components MDN: https://developer.mozilla.org/en-US/docs/Web/API/Web_components

---

## PWA

| Tehnologie           | Rol                       | Rationale                                                         |
| -------------------- | ------------------------- | ----------------------------------------------------------------- |
| **Workbox**          | Service Worker management | Standard industry, strategies predefinite, plugin Vite disponibil |
| **Web App Manifest** | Instalare home screen     | PWA nativă Android Chrome                                         |
| **Background Sync**  | Sync offline→online       | Workbox BackgroundSync pentru date Supabase                       |

**Docs oficiale:** https://developer.chrome.com/docs/workbox/

---

## Backend & Infra

| Tehnologie             | Rol                                               | Rationale                                                            |
| ---------------------- | ------------------------------------------------- | -------------------------------------------------------------------- |
| **Cloudflare Pages**   | Hosting + deploy                                  | Bandwidth nelimitat, build automat la push main, preview deployments |
| **Cloudflare Workers** | Auth proxy + AI gateway + cron-uri                | Fără cold start, 0ms latency la edge, Cron Triggers permanent        |
| **Cloudflare R2**      | Backup primar + arhivă poze                       | Egress $0, 10GB free, S3-compatible API                              |
| **Cloudflare KV**      | Config/state distribuit                           | Key-value la edge pentru config și rate limiting                     |
| **Supabase**           | DB (PostgreSQL) + Storage + Auth + Edge Functions | Free tier generos, pgvector disponibil, RLS nativ                    |

**Docs oficiale:**

- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Cloudflare Pages: https://developers.cloudflare.com/pages/
- Cloudflare R2: https://developers.cloudflare.com/r2/
- Supabase: https://supabase.com/docs

---

## Randare Documente (client-side)

| Librărie                           | Format               | Rationale                                               |
| ---------------------------------- | -------------------- | ------------------------------------------------------- |
| **mammoth.js**                     | DOCX                 | Convertor DOCX→HTML fiabil, menține formatarea          |
| **PDF.js**                         | PDF                  | Mozilla standard, renderizare fidelă, fără server       |
| **marked**                         | Markdown             | Rapid, extensibil, CommonMark compliant                 |
| **SheetJS (xlsx)**                 | XLSX/XLS/CSV         | Citire/scriere spreadsheets, cel mai complet în browser |
| **Native `<img>/<video>/<audio>`** | JPG/PNG/MP4/MP3      | Zero dependențe pentru media                            |
| **Tesseract.js**                   | OCR imagini          | Offline, `ron` lang pack pentru română (~10MB)          |
| **transformers.js**                | Embeddings offline   | Hugging Face, rulează în browser via ONNX (~50MB model) |
| **jsPDF**                          | Generare PDF medical | Client-side, fără server, output printabil pentru medic |

**Docs oficiale:**

- mammoth.js: https://github.com/mwilliamson/mammoth.js
- PDF.js: https://mozilla.github.io/pdf.js/
- marked: https://marked.js.org/
- SheetJS: https://docs.sheetjs.com/
- Tesseract.js: https://tesseract.projectnaptha.com/
- transformers.js: https://huggingface.co/docs/transformers.js/
- jsPDF: https://rawgit.com/MrRio/jsPDF/master/docs/

---

## AI Providers

| Provider                  | Use Case                            | Model principal                | Fallback            |
| ------------------------- | ----------------------------------- | ------------------------------ | ------------------- |
| **Groq**                  | Text conversațional + STT           | Llama 3.1 8B, Whisper Large v3 | Llama 3.3 70B       |
| **Cerebras**              | Text conversațional                 | Llama 3.3 70B                  | —                   |
| **OpenRouter**            | Text conversațional                 | `:free` rotație                | —                   |
| **Gemini (Google)**       | Vision/OCR + embeddings + traducere | 2.5 Flash                      | Flash-Lite          |
| **Mistral**               | OCR + embeddings                    | Mistral OCR, Mistral Embed     | —                   |
| **Cohere**                | Embeddings multilingv               | embed-multilingual-v3.0        | —                   |
| **Brave Search**          | Web search                          | Search API                     | Tavily → Jina       |
| **Tavily**                | Web search                          | Search API                     | —                   |
| **Jina Reader**           | Web content extraction              | Reader API                     | —                   |
| **DeepL**                 | Traducere                           | v2 API                         | DeepL key 2 → Azure |
| **Azure Translator**      | Traducere                           | Cognitive Services             | —                   |
| **Cloudflare Workers AI** | STT fallback                        | Whisper                        | —                   |

**EXCLUS:** DeepSeek (servere China, GDPR risk pentru date medicale mama)

**Detalii complete lanț fallback:** `docs/ai-fallback-chain.md`

---

## Notificări

| Tehnologie         | Tip                   | Rol                                     |
| ------------------ | --------------------- | --------------------------------------- |
| **FCM (Firebase)** | Push Android nativ    | Notificări silențioase + normale        |
| **ntfy.sh**        | Push cu prioritate    | Priority 5 = bypass DND, alarme critice |
| **Telegram Bot**   | Mesaj text            | Backup notificări + admin alerts        |
| **CallMeBot**      | Apel vocal + WhatsApp | Ultimul resort urgențe + TTS            |
| **Web Push API**   | Push browser standard | PWA push notifications                  |

---

## Date Externe (fără key)

| API             | Scop                       | Limite                                   |
| --------------- | -------------------------- | ---------------------------------------- |
| **Open-Meteo**  | Vreme pentru livadă/ieșiri | Gratuit, fără key, User-Agent recomandat |
| **RxNorm REST** | Lookup medicamente (EN)    | Gratuit, fără key                        |
| **openFDA**     | Interacțiuni medicamente   | Gratuit, fără key, 1000 req/oră          |

---

## Audio

| Fișier                 | Sursă    | Licență                 | Rol                    |
| ---------------------- | -------- | ----------------------- | ---------------------- |
| `tenderness.mp3`       | Bensound | CC-BY (atribuție în UI) | Ambient de fundal      |
| `alarm_clock_loop.mp3` | TBD      | TBD                     | Alarmă ntfy priority 5 |

**Notă:** Verificare licență Bensound via WebFetch înainte de implementare.

---

## Tooling Dev

| Tool       | Rol                     |
| ---------- | ----------------------- |
| ESLint     | Linting JS/TS           |
| Prettier   | Formatare cod           |
| Lighthouse | Audit PWA (target: ≥90) |
| Playwright | E2E testing UI          |

---

## Versioning

- **Scheme:** SemVer (`vMAJOR.MINOR.PATCH`)
- **Git tags:** la fiecare release deployment
- **`version.json`:** în rădăcină, citit de Service Worker pentru cache invalidation

```json
{
  "version": "0.1.0",
  "buildDate": "2026-05-01T00:00:00Z",
  "gitTag": "v0.1.0"
}
```
