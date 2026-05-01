# Service Limits — Mami_Docs

**Data:** 2026-05-01 | **Versiune:** 1.0  
**Scop:** Referință rapidă limite free tier pentru toate serviciile din stack. Verifică înainte de implementare.

> **Regulă:** La 80% din limită → alertă Telegram admin. La 100% → activează fallback automat.

---

## Hosting & Infra

### Cloudflare Pages (Free)

| Limită             | Valoare   | Reset      | La depășire    |
| ------------------ | --------- | ---------- | -------------- |
| Bandwidth          | Nelimitat | —          | —              |
| Build-uri/lună     | 500       | Lunar      | Build eșuează  |
| Build timp maxim   | 20 min    | Per build  | Build anulat   |
| Fișiere per deploy | 20,000    | Per deploy | Deploy eșuează |
| Dimensiune fișier  | 25 MB     | Per fișier | Upload respins |
| Domenii custom     | Nelimitat | —          | —              |

**Risc:** Build-urile lunare (500) sunt mai mult decât suficiente pentru uz personal.

---

### Cloudflare Workers (Free)

| Limită             | Valoare | Reset            | La depășire             |
| ------------------ | ------- | ---------------- | ----------------------- |
| Requests/zi        | 100,000 | Zilnic 00:00 UTC | HTTP 429                |
| CPU time/request   | 10 ms   | Per request      | Request terminat forțat |
| Memory/Worker      | 128 MB  | Per invocation   | Worker crash            |
| Subrequest-uri     | 50      | Per request      | Eroare subrequest       |
| Cron Triggers      | 5       | Per cont         | —                       |
| Cron granularitate | 1 minut | —                | —                       |
| KV reads/zi        | 100,000 | Zilnic           | HTTP 429                |
| KV writes/zi       | 1,000   | Zilnic           | HTTP 429                |
| KV storage         | 1 GB    | —                | Write respins           |

**Risc:** CPU 10ms/request este CRITIC — AI gateway-ul NU poate procesa în Worker direct (depășește 10ms). Soluție: Workers face proxy la API-uri externe, procesarea e la provider.

---

### Cloudflare R2 (Free)

| Limită                   | Valoare         | Reset | La depășire       |
| ------------------------ | --------------- | ----- | ----------------- |
| Storage                  | 10 GB           | —     | Write respins     |
| Class A ops (write/list) | 1,000,000/lună  | Lunar | Taxat ($4.50/mil) |
| Class B ops (read)       | 10,000,000/lună | Lunar | Taxat ($0.36/mil) |
| Egress                   | $0              | —     | —                 |

**Risc:** Egress zero = ideal pentru backup și arhivă poze. 10GB free = ~3,000 backup-uri zilnice de 3MB fiecare.

---

## Supabase (Free Tier)

| Resursă                         | Limită        | Reset | La depășire        |
| ------------------------------- | ------------- | ----- | ------------------ |
| Database                        | 500 MB        | —     | Write respins      |
| Storage (fișiere)               | 1 GB          | —     | Upload respins     |
| Bandwidth (egress)              | 2 GB/lună     | Lunar | Taxat sau blocat   |
| Edge Functions invocations      | 500,000/lună  | Lunar | HTTP 429           |
| Auth MAU (Monthly Active Users) | 50,000        | Lunar | Auth blocat        |
| Realtime connections            | 200 simultane | —     | Conexiune refuzată |
| **PAUZĂ INACTIVITATE**          | **7 zile**    | —     | **Proiect pauzat** |

**CRITIC:** Pauza la 7 zile inactivitate → keepalive obligatoriu la 4 zile (Cron Worker).  
**Alert:** La 400MB DB (80%) → alertă admin. La 800MB Storage (80%) → alertă admin.

---

## GitHub

### GitHub Pages (dezactivat, backup secundar)

| Limită                     | Valoare                             |
| -------------------------- | ----------------------------------- |
| Bandwidth/lună             | 100 GB                              |
| Dimensiune repo recomandat | < 1 GB                              |
| Dimensiune fișier          | < 100 MB (hard: < 50 MB cu Git LFS) |

**Notă:** GitHub Pages este backup secundar. Deploy primar = Cloudflare Pages.

---

## AI Providers

### Groq (Free)

| Model                   | Requests/zi | Tokens/min | Tokens/zi | La depășire |
| ----------------------- | ----------- | ---------- | --------- | ----------- |
| llama-3.1-8b-instant    | 14,400      | 30,000     | 500,000   | HTTP 429    |
| llama-3.3-70b-versatile | 14,400      | 12,000     | 100,000   | HTTP 429    |
| whisper-large-v3        | 20 req/min  | —          | —         | HTTP 429    |

**Reset:** Zilnic (tokens/zi) sau per minut (rate limit).

---

### Google Gemini (Free via AI Studio)

| Model                 | Requests/min | Requests/zi | Tokens/min | La depășire |
| --------------------- | ------------ | ----------- | ---------- | ----------- |
| gemini-2.5-flash      | 10           | 1,500       | 250,000    | HTTP 429    |
| gemini-2.5-flash-lite | 30           | 1,500       | 1,000,000  | HTTP 429    |
| gemini-embedding-001  | 5            | 100         | —          | HTTP 429    |

**CRITIC:** gemini-embedding-001 doar 100 req/zi → folosește transformers.js offline ca primar pentru embeddings bulk.

---

### Cerebras (Free)

| Model         | Requests/min | Tokens/min | La depășire |
| ------------- | ------------ | ---------- | ----------- |
| llama-3.3-70b | 30           | 60,000     | HTTP 429    |

---

### OpenRouter (Free Models)

| Limită                       | Valoare            | La depășire |
| ---------------------------- | ------------------ | ----------- |
| Requests/zi (`:free` models) | Variabil per model | HTTP 429    |
| Rate limit                   | 20 req/min         | HTTP 429    |

**Notă:** Modelele `:free` au limite mai stricte și latency variabilă. Doar ca fallback final pentru conversațional.

---

### Mistral (Free/Pay-as-you-go)

| Model              | Rate limit       | La depășire |
| ------------------ | ---------------- | ----------- |
| mistral-ocr-latest | 5 req/min (free) | HTTP 429    |
| mistral-embed      | 5 req/min (free) | HTTP 429    |

---

### Cohere (Free)

| Model                     | Requests/min | La depășire |
| ------------------------- | ------------ | ----------- |
| embed-multilingual-v3.0   | 100          | HTTP 429    |
| Trial key (100/min total) | —            | HTTP 429    |

---

### DeepL (Free)

| Limită                 | Valoare   | Reset | La depășire    |
| ---------------------- | --------- | ----- | -------------- |
| Caractere/lună per key | 500,000   | Lunar | HTTP 456       |
| 2 keys total           | 1,000,000 | Lunar | Fallback Azure |

---

### Azure Translator (Free)

| Limită                 | Valoare   | Reset | La depășire           |
| ---------------------- | --------- | ----- | --------------------- |
| Caractere/lună per key | 2,000,000 | Lunar | HTTP 429              |
| 2 keys total           | 4,000,000 | Lunar | Fallback Gemini Flash |

---

### Brave Search (Free)

| Limită       | Valoare | Reset | La depășire |
| ------------ | ------- | ----- | ----------- |
| Queries/lună | 2,000   | Lunar | HTTP 429    |

---

### Tavily (Free)

| Limită       | Valoare | Reset | La depășire |
| ------------ | ------- | ----- | ----------- |
| Queries/lună | 1,000   | Lunar | HTTP 429    |

---

### openFDA (Fără key)

| Limită       | Valoare | Reset  | La depășire |
| ------------ | ------- | ------ | ----------- |
| Requests/oră | 1,000   | Pe oră | HTTP 429    |
| Requests/zi  | 40,000  | Zilnic | HTTP 429    |

---

### Open-Meteo (Fără key)

| Limită      | Valoare                 | Note                        |
| ----------- | ----------------------- | --------------------------- |
| Requests/zi | ~10,000 (neoficial)     | Gratuit, fără key           |
| Rate limit  | Rezonabil cu User-Agent | Identifică-te în User-Agent |

**Implementare:** Cache 1h local → max 24 req/zi la uz normal.

---

## Notificări

### ntfy.sh (Gratuit, self-hosted optional)

| Limită                        | Valoare     | La depășire   |
| ----------------------------- | ----------- | ------------- |
| Mesaje/oră per topic (public) | 60          | Rate limited  |
| Dimensiune mesaj              | 4,096 bytes | Mesaj respins |
| Attachments                   | 15 MB       | Respins       |

---

### Telegram Bot API

| Limită                 | Valoare | La depășire |
| ---------------------- | ------- | ----------- |
| Mesaje/secundă per bot | 30      | HTTP 429    |
| Mesaje/minut per chat  | 20      | HTTP 429    |

---

### CallMeBot (Gratuit)

| Limită             | Valoare          | Note                                 |
| ------------------ | ---------------- | ------------------------------------ |
| Mesaje WhatsApp/zi | Rezonabil        | Fără limită publicată explicită      |
| Tip apel           | WhatsApp + Voice | Setup obligatoriu cu telefonul mamei |

---

## Sumar Riscuri Critice

| Serviciu           | Risc                      | Mitigare                                    |
| ------------------ | ------------------------- | ------------------------------------------- |
| Supabase           | Pauză 7 zile inactivitate | Keepalive Cron la 4 zile (OBLIGATORIU)      |
| Cloudflare Workers | CPU 10ms/req              | Workers = proxy only, procesare la provider |
| Gemini Embeddings  | Doar 100 req/zi           | transformers.js offline ca primar           |
| Supabase Storage   | 1GB total                 | Resize la upload + arhivă R2 la 60 zile     |
| Groq Whisper       | 20 req/min                | Rate limiting local + queue                 |
| DeepL              | 500k char/lună/key        | 2 keys = 1M + fallback Azure                |
