# API Keys Map — Mami_Docs

**Data:** 2026-05-01 | **Versiune:** 1.0  
**Sursă status:** verify.ps1 rulat 2026-05-01 (54/54 SET)

> Tabel complet: env var → use case în proiect → fallback → status.  
> **Fără valori.** Valorile sunt exclusiv în Windows User Environment Variables.

---

## AI — Text Conversațional

| Env Var              | Use Case în Mami_Docs                                | Fallback la epuizare | Status |
| -------------------- | ---------------------------------------------------- | -------------------- | ------ |
| `GROQ_API_KEY`       | Chat AI primar (Llama 3.1 8B, 3.3 70B) + STT Whisper | Cerebras             | ✅ SET |
| `CEREBRAS_API_KEY`   | Chat AI fallback 3 (Llama 3.3 70B)                   | OpenRouter           | ✅ SET |
| `OPENROUTER_API_KEY` | Chat AI fallback 4 (`:free` models rotație)          | Lanț epuizat         | ✅ SET |

---

## AI — Vision / OCR

| Env Var             | Use Case în Mami_Docs                               | Fallback la epuizare | Status |
| ------------------- | --------------------------------------------------- | -------------------- | ------ |
| `GOOGLE_API_KEY`    | Gemini 2.5 Flash OCR (fallback 2 după Tesseract.js) | Flash-Lite → Mistral | ✅ SET |
| `GOOGLE_API_KEY_2`  | Backup Gemini (quota Flash-Lite)                    | Mistral OCR          | ✅ SET |
| `MISTRAL_API_KEY`   | OCR fallback 4 + Embeddings fallback 4              | Lanț epuizat         | ✅ SET |
| `MISTRAL_API_KEY_2` | Backup Mistral                                      | Lanț epuizat         | ✅ SET |

---

## AI — Embeddings (Faza 3)

| Env Var           | Use Case în Mami_Docs                     | Fallback la epuizare    | Status |
| ----------------- | ----------------------------------------- | ----------------------- | ------ |
| `GOOGLE_API_KEY`  | gemini-embedding-001 primar               | transformers.js offline | ✅ SET |
| `COHERE_API_KEY`  | Embeddings fallback 3 (multilingual-v3.0) | Mistral Embed           | ✅ SET |
| `MISTRAL_API_KEY` | Embeddings fallback 4 (mistral-embed)     | Lanț epuizat            | ✅ SET |

---

## AI — Traducere

| Env Var                  | Use Case în Mami_Docs                 | Fallback la epuizare | Status |
| ------------------------ | ------------------------------------- | -------------------- | ------ |
| `DEEPL_API_KEY`          | Traducere primar (500k char/lună)     | DeepL key 2          | ✅ SET |
| `DEEPL_API_KEY_2`        | Traducere fallback 2 (500k char/lună) | Azure Translator     | ✅ SET |
| `AZURE_TRANSLATOR_KEY`   | Traducere fallback 3 (2M char/lună)   | Azure key 2          | ✅ SET |
| `AZURE_TRANSLATOR_KEY_2` | Traducere fallback 4 + Gemini Flash   | Lanț epuizat         | ✅ SET |

---

## AI — STT (Speech-to-Text)

| Env Var                | Use Case în Mami_Docs                                 | Fallback la epuizare  | Status |
| ---------------------- | ----------------------------------------------------- | --------------------- | ------ |
| `GROQ_API_KEY`         | Whisper Large v3 STT (fallback 2 după Web Speech API) | Cloudflare Workers AI | ✅ SET |
| `CLOUDFLARE_API_TOKEN` | Workers AI Whisper STT (fallback 3)                   | Lanț epuizat          | ✅ SET |

---

## AI — TTS (Text-to-Speech)

| Env Var                | Use Case în Mami_Docs                                       | Fallback la epuizare | Status |
| ---------------------- | ----------------------------------------------------------- | -------------------- | ------ |
| `GOOGLE_CLOUD_API_KEY` | Google Cloud TTS via CallMeBot (fallback 2 după Web Speech) | Lanț epuizat         | ✅ SET |

---

## Web Search

| Env Var                | Use Case în Mami_Docs                   | Fallback la epuizare | Status |
| ---------------------- | --------------------------------------- | -------------------- | ------ |
| `BRAVE_SEARCH_API_KEY` | Web search primar (2000 query/lună)     | Tavily               | ✅ SET |
| `TAVILY_API_KEY`       | Web search fallback 2 (1000 query/lună) | Jina Reader          | ✅ SET |
| `JINA_API_KEY`         | Content extraction fallback 3           | Lanț epuizat         | ✅ SET |

---

## Notificări

| Env Var                 | Use Case în Mami_Docs                | Note                              | Status   |
| ----------------------- | ------------------------------------ | --------------------------------- | -------- |
| `TELEGRAM_BOT_TOKEN`    | Telegram Bot notificări (stratul 3)  | Bot deja configurat               | ✅ SET   |
| `TELEGRAM_BOT_URL`      | URL API Telegram Bot                 | —                                 | ✅ SET   |
| `TELEGRAM_BOT_USERNAME` | Username bot Telegram                | —                                 | ✅ SET   |
| `TELEGRAM_BOT_NAME`     | Nume display bot                     | —                                 | ✅ SET   |
| `TELEGRAM_CHAT_ID`      | Chat ID mama (destinatar reminder)   | —                                 | ✅ SET   |
| `TELEGRAM_BOT_API_BASE` | Base URL API Telegram                | —                                 | ✅ SET   |
| `GOOGLE_API_KEY`        | FCM HTTP v1 API pentru push Android  | Sau service account               | ✅ SET   |
| `CALLMEBOT_API_KEY`     | CallMeBot Voice/WhatsApp (stratul 4) | **DE ADĂUGAT** după setup cu mama | ❌ LIPSĂ |

---

## Cloudflare Infrastructure

| Env Var                 | Use Case în Mami_Docs                   | Note                  | Status |
| ----------------------- | --------------------------------------- | --------------------- | ------ |
| `CLOUDFLARE_API_TOKEN`  | Deploy Workers + R2 backup + Workers AI | Scope limitat la repo | ✅ SET |
| `CLOUDFLARE_ACCOUNT_ID` | ID cont Cloudflare pentru Workers       | —                     | ✅ SET |

---

## Google / Auth

| Env Var                | Use Case în Mami_Docs                 | Note                | Status |
| ---------------------- | ------------------------------------- | ------------------- | ------ |
| `GOOGLE_CLIENT_ID`     | OAuth2 pentru Supabase Auth Google    | —                   | ✅ SET |
| `GOOGLE_CLIENT_SECRET` | OAuth2 secret (doar pe server/Worker) | Niciodată în client | ✅ SET |
| `GOOGLE_CLOUD_API_KEY` | Google Cloud TTS                      | —                   | ✅ SET |

---

## PDF Avansat (Adobe PDF Services)

| Env Var               | Use Case în Mami_Docs                                                                                 | Note                   | Status |
| --------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------- | ------ |
| `ADOBE_API_KEY`       | Adobe PDF Services — split/merge/extract PDF avansat (Faza 1+ randare îmbogățită; Faza 3 PDF medical) | 500 tranz/lună gratuit | ✅ SET |
| `ADOBE_CLIENT_SECRET` | Adobe PDF Services secret OAuth                                                                       | Niciodată în client    | ✅ SET |

---

## GitHub

| Env Var        | Use Case în Mami_Docs                                                                                                                                                                              | Note                           | Status |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------ |
| `GITHUB_TOKEN` | (1) Deploy automations + mami-docs-bot commits scope `repo` strict pe RolandPetrila/mami-docs; (2) **GitHub Models GPT-5 / GPT-4.1 GRATUIT** (50-150 RPD) — fallback cazuri excepționale Faza 1.5+ | Dual use: deploy + AI fallback | ✅ SET |

---

## Chei Nefolosite în Mami_Docs (prezente în catalog, fără rol în stack)

| Env Var                       | Motivul excluderii                                              |
| ----------------------------- | --------------------------------------------------------------- |
| `AZURE_DOC_INTEL_KEY` / `*_2` | Azure Document Intelligence — înlocuit de Tesseract.js + Gemini |
| `FACEBOOK_*`                  | Social media — nu e în scope proiect                            |
| `FIRECRAWL_API_KEY`           | Web scraping — nu e în scope (web search via Brave/Tavily)      |
| `FIREWORKS_API_KEY`           | AI provider alternativ — nu e în lanțul de fallback             |
| `FREYA_API_KEY`               | —                                                               |
| `HF_TOKEN`                    | Hugging Face Hub — transformers.js rulează local fără token     |
| `HYPERBOLIC_API_KEY`          | AI provider — nu e în lanțul de fallback                        |
| `MAKE_API_KEY`                | Automation platformă — nu e în stack                            |
| `NVIDIA_API_KEY`              | AI provider — nu e în lanțul de fallback                        |
| `REPLICATE_API_TOKEN`         | AI media generation — nu e în scope                             |
| `SAMBANOVA_API_KEY`           | AI provider — nu e în lanțul de fallback                        |
| `SCALEWAY_*`                  | Cloud provider — nu e în stack                                  |
| `VERCEL_API_KEY`              | Hosting alternativ — Cloudflare Pages e ales                    |

---

## EXCLUSE Definitiv (override spec original — confirmat admin 2026-05-01)

| Env Var                                     | Motiv excludere                                                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `DEEPSEEK_API_KEY`                          | **EXCLUS** — servere China, GDPR risk date medicale mama (Italia a interzis în 2025)                    |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_API_KEY_2` | **EXCLUS din runtime** — rezervate strict pentru dev-time admin (Claude Code); niciodată în cod proiect |
| `OPENAI_API_KEY`                            | **EXCLUS din runtime** — cost; rezervat doar pentru dev                                                 |
| `XAI_API_KEY`                               | **EXCLUS** dacă data sharing activat — privacy concerns                                                 |
| `PLANTID_API_KEY`                           | **EXCLUS** — implementat în proiect separat "Livada", nu se duplică în Mami_Docs                        |
| `PLANTNET_API_KEY`                          | **EXCLUS** — același motiv ca Plant.ID                                                                  |

---

## Chei de Adăugat la Implementare

| Env Var                     | Când   | Metodă                                                                                   |
| --------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| `CALLMEBOT_API_KEY`         | Faza 2 | Setup manual cu mama (WhatsApp) → adaugă în `.api-keys INBOX.md`                         |
| `SUPABASE_URL`              | Faza 1 | La configurare proiect Supabase → adaugă în `.api-keys INBOX.md`                         |
| `SUPABASE_ANON_KEY`         | Faza 1 | La configurare proiect Supabase → adaugă în `.api-keys INBOX.md`                         |
| `SUPABASE_SERVICE_ROLE_KEY` | Faza 1 | La configurare proiect Supabase → exclusiv în Cloudflare Secrets, NU în env vars Windows |
| `FIREBASE_*` (config FCM)   | Faza 2 | La configurare Firebase → config client e public, service account în Cloudflare Secrets  |
