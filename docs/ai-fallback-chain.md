# AI Fallback Chain — Mami_Docs

**Data:** 2026-05-01 | **Versiune:** 1.0  
**Sursă:** Anexa C v2, Decizia D4 (confirmată admin 2026-05-01)

---

## Principii Generale

- **Trigger fallback:** eroare 5xx, HTTP 429 (rate limit), timeout >10s, quota epuizată
- **Retry înainte de fallback:** 1 retry cu backoff exponențial (1s, 2s) — dacă tot eșuează → fallback
- **Logging:** fiecare apel se loghează cu: provider, model, latency, status, error_code
- **Circuit breaker:** după 3 eșecuri consecutive pe un provider → skip acel provider pentru 5 minute
- **Nu loghezi:** conținut conversații, date medicale, text recunoscut din imagini

---

## Categoria 1 — Conversațional Text

**Use case:** Chat AI general, întrebări despre rețete, sfaturi livadă, explicații sănătate, asistent personal.

| Prioritate | Provider   | Model                         | Condiție trigger fallback |
| ---------- | ---------- | ----------------------------- | ------------------------- |
| 1 (primar) | Groq       | `llama-3.1-8b-instant`        | 5xx / 429 / timeout >10s  |
| 2          | Groq       | `llama-3.3-70b-versatile`     | idem (quota 8B epuizată)  |
| 3          | Cerebras   | `llama-3.3-70b`               | idem                      |
| 4 (ultim)  | OpenRouter | `:free` rotație (auto-select) | idem — cached responses   |

**Condiții speciale:**

- OpenRouter `:free` nu e folosit pentru date medicale sensibile (fallback la Cerebras devine final în acel caz)
- Răspunsurile OpenRouter se cachează local 1h pentru aceeași interogare (hash prompt)
- System prompt per tab: Rețete / Livadă / Sănătate / Concedii / General

**Logging level:** `INFO` pentru succes, `WARN` la fallback, `ERROR` la epuizare lanț

---

## Categoria 2 — Vision / OCR

**Use case:** OCR imagini documente, recunoaștere rețete scrise de mână, extragere text din poze acte.

| Prioritate  | Provider     | Model/Tool                | Condiție trigger fallback       |
| ----------- | ------------ | ------------------------- | ------------------------------- |
| 1 (offline) | Tesseract.js | `ron` lang pack (browser) | Confidence <60% sau eroare init |
| 2           | Gemini       | `gemini-2.5-flash`        | 5xx / 429 / timeout >15s        |
| 3           | Gemini       | `gemini-2.5-flash-lite`   | quota Flash epuizată            |
| 4 (ultim)   | Mistral      | `mistral-ocr-latest`      | idem                            |

**Condiții speciale:**

- Tesseract `ron` lang pack (~10MB): descărcat la prima utilizare OCR, cached în Service Worker
- La Confidence Tesseract <60%: afișează rezultat cu indicator "calitate scăzută" + buton "Încearcă cu AI"
- Imaginile NU se trimit la API extern fără confirmare utilizator (privacy mama)

**Logging level:** `INFO` succes + confidence score, `WARN` fallback + confidence trigger

---

## Categoria 3 — Embeddings

**Use case:** Indexare documente pentru căutare semantică (RAG — Faza 3), similar documents.

| Prioritate  | Provider        | Model                                      | Condiție trigger fallback |
| ----------- | --------------- | ------------------------------------------ | ------------------------- |
| 1 (primar)  | Google          | `gemini-embedding-001`                     | 5xx / 429 / quota         |
| 2 (offline) | transformers.js | `Xenova/multilingual-e5-small` sau similar | fallback complet offline  |
| 3           | Cohere          | `embed-multilingual-v3.0`                  | eroare transformers.js    |
| 4 (ultim)   | Mistral         | `mistral-embed`                            | idem                      |

**Condiții speciale:**

- transformers.js model (~50MB): descărcat la prima utilizare, cached local, loading indicator obligatoriu
- Embeddings Faza 3 — nu afectează MVP (Faza 1/2)
- Batching: max 100 documente per request API

**Logging level:** `INFO` succes + dimensiune vector, `WARN` fallback, `DEBUG` batch progress

---

## Categoria 4 — STT (Speech-to-Text)

**Use case:** Comandă vocală mama, memo vocal, transcriere notițe audio.

| Prioritate | Provider              | Model/API            | Condiție trigger fallback                                         |
| ---------- | --------------------- | -------------------- | ----------------------------------------------------------------- |
| 1 (nativ)  | Web Speech API        | `lang: 'ro-RO'`      | Browser not supported / permisiune refuzată / eroare recunoaștere |
| 2          | Groq                  | `whisper-large-v3`   | 5xx / 429 / timeout                                               |
| 3 (ultim)  | Cloudflare Workers AI | `@cf/openai/whisper` | idem                                                              |

**Condiții speciale:**

- Web Speech API: gratuit, niciun API call, funcționează offline parțial (depinde browser)
- La Web Speech eșec: audio înregistrat local (WebRTC/MediaRecorder) → trimis la Groq Whisper
- Groq Whisper: max 25MB audio per request; compresie la upload dacă >10MB
- Audio local: NU persistat pe server, procesat și șters

**Logging level:** `INFO` provider folosit + durată transcriere, `WARN` fallback activat

---

## Categoria 5 — TTS (Text-to-Speech)

**Use case:** Citit răspunsuri AI cu voce tare (mama preferă să asculte), alarme vocale.

| Prioritate | Provider         | API                     | Condiție trigger fallback      |
| ---------- | ---------------- | ----------------------- | ------------------------------ |
| 1 (nativ)  | Web Speech API   | `SpeechSynthesis ro-RO` | Voce RO nedisponibilă / eroare |
| 2 (ultim)  | Google Cloud TTS | via CallMeBot           | idem                           |

**Condiții speciale:**

- Web Speech API: sincron, niciun cost, funcționează offline
- Voce preferată: `ro-RO` female (dacă disponibilă pe dispozitiv mama)
- Google Cloud TTS: via CallMeBot pentru apel vocal (nu direct stream în browser)
- TTS nu se activează automat — doar la tap buton "Ascultă" (UX mama)

**Logging level:** `INFO` provider + durată, `WARN` fallback

---

## Categoria 6 — Traducere

**Use case:** Traducere documente sau răspunsuri AI în/din română, traducere denumiri medicamente RO→EN.

| Prioritate | Provider         | API                  | Condiție trigger fallback |
| ---------- | ---------------- | -------------------- | ------------------------- |
| 1          | DeepL            | v2 API (key 1)       | 5xx / 429 / quota lunară  |
| 2          | DeepL            | v2 API (key 2)       | idem key 1                |
| 3          | Azure Translator | key 1                | idem                      |
| 4 (ultim)  | Azure Translator | key 2 + Gemini Flash | idem                      |

**Condiții speciale:**

- DeepL free: 500,000 caractere/lună per key → 2 keys = 1M caractere/lună
- Azure: 2M caractere/lună gratuit
- Gemini Flash ca traducere de urgență (mai puțin precis pentru terminologie medicală)
- Cache traduceri: aceeași frază → cache local 24h

**Logging level:** `INFO` provider + caractere traduse, `WARN` fallback + caractere rămase

---

## Categoria 7 — Web Search

**Use case:** Căutare informații actualizate (vreme, știri, prețuri medicamente, rețete noi).

| Prioritate | Provider     | API                             | Condiție trigger fallback |
| ---------- | ------------ | ------------------------------- | ------------------------- |
| 1          | Brave Search | Search API                      | 5xx / 429 / quota         |
| 2          | Tavily       | Search API                      | idem                      |
| 3 (ultim)  | Jina Reader  | Reader API (content extraction) | idem                      |

**Condiții speciale:**

- Brave Search free: 2,000 query/lună
- Tavily free: 1,000 query/lună
- Jina Reader: gratuit pentru URL-uri publice, fallback pentru content extraction
- Rezultatele se cachează 1h pentru aceeași interogare

**Logging level:** `INFO` provider + nr rezultate, `WARN` fallback activat

---

## Categoria 8 — Date Excluse

**Providers EXCLUȘI permanent pentru orice date ale mamei:**

| Provider     | Motiv excludere                                                   |
| ------------ | ----------------------------------------------------------------- |
| **DeepSeek** | Servere China → GDPR risk explicit pentru date medicale/personale |

**Nicio excepție.** Nici măcar pentru date non-sensibile — risc de training data contamination.

---

## Implementare: Structura Funcției de Fallback

```javascript
// Pattern general pentru orice categorie AI
async function withFallback(providers, requestFn, context) {
  for (const provider of providers) {
    if (circuitBreaker.isOpen(provider.id)) continue;
    try {
      const result = await Promise.race([
        requestFn(provider),
        timeout(provider.timeoutMs ?? 10_000),
      ]);
      logger.info({ provider: provider.id, ...context });
      return result;
    } catch (err) {
      circuitBreaker.recordFailure(provider.id);
      logger.warn({ provider: provider.id, error: err.code, ...context });
    }
  }
  throw new Error(`All AI providers failed for: ${context.category}`);
}
```

**Env vars necesare (din catalog .api-keys):**

- `GROQ_API_KEY` — categoriile 1, 4
- `GOOGLE_API_KEY` / `GOOGLE_API_KEY_2` — categoriile 2, 3, 6
- `MISTRAL_API_KEY` — categoriile 2, 3
- `CEREBRAS_API_KEY` — categoria 1
- `OPENROUTER_API_KEY` — categoria 1
- `COHERE_API_KEY` — categoria 3
- `BRAVE_SEARCH_API_KEY` — categoria 7
- `TAVILY_API_KEY` — categoria 7
- `DEEPL_API_KEY` / `DEEPL_API_KEY_2` — categoria 6
- `AZURE_TRANSLATOR_KEY` / `AZURE_TRANSLATOR_KEY_2` — categoria 6
- `CLOUDFLARE_API_TOKEN` — categoria 4 (Workers AI)
