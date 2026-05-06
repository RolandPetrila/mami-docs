# Ghid Pas-cu-Pas — Credențiale ce trebuie obținute manual (v5 — 2026-05-06)

> **Versiune 5** — restrâns de la 36 la **20 servicii** care **necesită semnare manuală** (signup + click "Generate API Key" pe site-ul lor — pași fizici imposibili pentru AI).
>
> **16 servicii eliminate** au echivalent prin chei deja deținute (Replicate / OpenRouter / HuggingFace) → mutate în memoria sistemului `~/.claude/projects/C--Proiecte-Mami-Docs/memory/system_no_key_services.md`. Le execut automat fără setup nou.
>
> **La fiecare serviciu am adăugat un bloc `📥 TEMPLATE` la final** — copiezi blocul, înlocuiești `<paste...>` cu valoarea reală, lipești în `~/.api-keys/INBOX.md`, deschizi Claude Code în `.api-keys` și rulezi `proceseaza inbox`. Restul (Windows env var + catalog + worker secret + integrare AI Gateway) îl fac eu automat.

---

## ✅ Status v1 — credențiale deja obținute (recap)

| Cred                     | Env Var                    | Status               |
| ------------------------ | -------------------------- | -------------------- |
| GitHub Models PAT        | `GITHUB_MODELS_TOKEN`      | ✅ SET (93 chars)    |
| Azure Doc Intel Key 1+2  | `AZURE_DOC_INTEL_KEY[_2]`  | ✅ SET (84/84 chars) |
| Azure Doc Intel Endpoint | `AZURE_DOC_INTEL_ENDPOINT` | ✅ SET               |
| CF Workers AI Token      | `CF_AI_TOKEN`              | ✅ SET (53 chars)    |

---

## ⛔ Eliminate din v5 (rezolvate cu chei existente — vezi memorie sistem)

| Eliminat                | Echivalent automat                                |
| ----------------------- | ------------------------------------------------- |
| Z.ai (Zhipu GLM)        | OpenRouter `zhipu/glm-4-plus` / `glm-4-air`       |
| Alibaba Qwen Intl       | OpenRouter `qwen/qwen-2.5-72b` / HuggingFace      |
| Together AI             | OpenRouter (Together oglindit majoritar)          |
| DeepInfra               | OpenRouter (DeepInfra oglindit)                   |
| Pollinations.AI         | Anonim direct (no key)                            |
| ApiFreeLLM              | Drop (verdict `[INCERT]`)                         |
| Lambda Inference        | Replicate `meta/llama-3-70b-instruct`             |
| Fal.ai                  | Replicate `black-forest-labs/flux-schnell`        |
| Recraft V4              | Replicate `recraft-ai/recraft-v3-svg`             |
| Stability AI            | Replicate `stability-ai/sdxl` + `sd3.5`           |
| ModelsLab               | Replicate (10k+ modele oglindite)                 |
| Sync.so (lip sync)      | Replicate `cjwbw/wav2lip` / `sync-labs/sync-labs` |
| Tripo AI (3D)           | Replicate `camenduru/triposr`                     |
| TensorPix (upscale vid) | Replicate `nateraw/video-real-esrgan`             |
| Cutout Pro              | Replicate `cjwbw/rembg` + `tencentarc/gfpgan`     |
| LALAL.AI                | Replicate `cjwbw/voicefixer`                      |

> Workflow auto-execute pentru toate cele de mai sus → `system_no_key_services.md` (memorie). Spui *"fă-mi un logo"* → eu aleg automat provider-ul potrivit din chei existente, fac apelul, salvez fișierul.

---

## 🆕 TOP 20 servicii — necesită signup manual

| Cat              | #     | Provider         | Free tier                      | Env var propus                            |
| ---------------- | ----- | ---------------- | ------------------------------ | ----------------------------------------- |
| **LLM**          | 1     | Reka AI          | $10 RECURRING LUNAR            | `REKA_API_KEY`                            |
|                  | 2     | AI21 Studio      | $10 / 3 luni, 256K ctx         | `AI21_API_KEY`                            |
|                  | 3     | Perplexity       | $5 + Sonar gratis nelimitat    | `PERPLEXITY_API_KEY`                      |
|                  | 4     | Voyage AI        | 200M tokens/lună embed         | `VOYAGE_API_KEY`                          |
|                  | 5     | Nebius AI Studio | $1 + Llama 405B free (EU)      | `NEBIUS_API_KEY`                          |
| **Speech**       | 6     | AssemblyAI       | $50 credit (~16h ro-RO STT)    | `ASSEMBLYAI_API_KEY`                      |
|                  | 7     | ElevenLabs       | 10k chars/lună permanent       | `ELEVENLABS_API_KEY`                      |
|                  | 8     | Cartesia         | TTS sub 75ms (signup credits)  | `CARTESIA_API_KEY`                        |
| **Multimodal**   | 9     | Hume AI          | 10k min/lună emotion analysis  | `HUME_API_KEY`                            |
| **Email**        | 10    | Resend           | 3000 emails/lună permanent     | `RESEND_API_KEY`                          |
| **Monitoring**   | 11    | Sentry           | 5k errors + 10k tx/lună        | `SENTRY_DSN`                              |
| **DB**           | 12    | Neon Postgres    | 500MB + branching permanent    | `NEON_DATABASE_URL`                       |
| **Image**        | 13    | Leonardo.AI      | 1500-2250 imagini/lună         | `LEONARDO_API_KEY`                        |
|                  | 14    | Ideogram         | 1200 imagini/lună (text-best)  | `IDEOGRAM_API_KEY`                        |
|                  | 15    | Adobe Firefly    | 25 credits/lună commercial     | `FIREFLY_CLIENT_ID` + `FIREFLY_CLIENT_SECRET` |
| **Video**        | 16    | Luma Dream Mach. | 30 video gens/lună             | `LUMA_API_KEY`                            |
|                  | 17    | Hailuo MiniMax   | $5-30 credits + multimodal     | `MINIMAX_API_KEY` + `MINIMAX_GROUP_ID`    |
| **Audio**        | 18    | Fish Audio       | Free permanent + 2M voci RO    | `FISHAUDIO_API_KEY`                       |
| **Talking head** | 19    | D-ID             | 5 min video/lună               | `DID_API_KEY`                             |
| **3D**           | 20    | Meshy AI         | 200 credits/lună permanent     | `MESHY_API_KEY`                           |

**Timp total semnare manuală:** ~75 min pentru toate 20 (~3-5 min fiecare).

---

## 📥 Workflow standard (după ce obții o cheie)

1. Copiezi blocul `TEMPLATE` de la finalul serviciului
2. Înlocuiești `<paste...>` cu valoarea reală obținută de pe site-ul furnizorului
3. Lipești blocul în `C:\Users\ALIENWARE\.api-keys\INBOX.md` (poți pune mai multe odată)
4. Deschizi Claude Code în `C:\Users\ALIENWARE\.api-keys\` și scrii `proceseaza inbox`
5. **Eu fac restul automat:**
   - Adaug în master file
   - Setez Windows User env var
   - Regenerez `catalog.md`
   - (Pentru integrare în Mami_Docs AI Gateway) anunță-mă într-o sesiune `Mami_Docs` și integrez fallback-ul / endpoint-ul nou

---

## 1. Reka AI ⭐⭐ — $10 RECURRING LUNAR (UNIC)

### Ce câștigi

- **$10 RECURRING LUNAR (resetabil)** — singurul cu credit care se reîncarcă lunar
- Modele Reka Core (frontier multimodal) + Reka Flash (rapid) + Reka Edge
- Multimodal real: text + imagine + video + audio understanding
- API OpenAI-compatible

### Pași (~4 min)

1. [Reka platform signup](https://platform.reka.ai/) → continuă cu Google/email
2. Verifică email → click link activare
3. **Settings → API Keys** ([direct](https://platform.reka.ai/apikeys)) → **Generate New Key**
4. Name `claude-code-mami` → **Create** → **Copy** valoarea (`reka_...`) — **DOAR O DATĂ**

### Test imediat

```powershell
$body = @{
  model = "reka-flash"
  messages = @(@{ role = "user"; content = @(@{ type = "text"; text = "Reply OK" }) })
} | ConvertTo-Json -Depth 5
Invoke-RestMethod -Method POST -Uri "https://api.reka.ai/v1/chat" `
    -Headers @{ "X-Api-Key" = $env:REKA_API_KEY; "Content-Type" = "application/json" } -Body $body
```

### Note

- $10/lună ≈ ~5,000 mesaje pe Reka Flash sau ~1,000 pe Reka Core
- Resetabil lunar → sustainable long-term ca fallback
- Rate limit: 60 RPM gratis

### Link-uri

- 🔧 [API Keys](https://platform.reka.ai/apikeys) | 📚 [Docs](https://docs.reka.ai/) | 📊 [Usage](https://platform.reka.ai/usage)

### 📥 TEMPLATE — completare credențiale

```markdown
### Reka AI

- **Key:** <paste_reka_key_here>
- **Env Var:** REKA_API_KEY
- **Tip:** LLM Multimodal Frontier
- **Limita:** $10 RECURRING LUNAR (reset automat fiecare lună)
- **Base URL:** https://api.reka.ai/v1/chat
- **Note:** Multimodal text+image+video+audio. Modele: reka-core, reka-flash, reka-edge.
```

---

## 2. AI21 Studio ⭐ — 256K context long-document

### Ce câștigi

- **$10 free credit / 3 luni** (~10M tokens echivalent)
- **Jamba 1.5 Large** + **Jamba 1.5 Mini** — arhitectură Mamba+Transformer hibrid
- **256K context** — printre cele mai mari pe free tier
- Util pentru rețete medicale lungi, contracte, jurnale wellness extensive

### Pași (~3 min)

1. [AI21 signup](https://studio.ai21.com/sign-up) → email/Google
2. Verifică email → activare
3. Header dropdown nume → `Settings` → [API Key page](https://studio.ai21.com/account/api-key)
4. Cheia e **deja generată** automat la signup → **Copy**

### Test imediat

```powershell
$body = @{
  model = "jamba-1.5-mini"
  messages = @(@{ role = "user"; content = "Reply OK" })
  max_tokens = 5
} | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "https://api.ai21.com/studio/v1/chat/completions" `
    -Headers @{ Authorization = "Bearer $env:AI21_API_KEY"; "Content-Type" = "application/json" } -Body $body
```

### Note

- După $10 consumat → blocare clean (nu surprize de cost)
- Rate limit: 100 RPM gratis

### Link-uri

- 🔧 [API Key](https://studio.ai21.com/account/api-key) | 📚 [Docs](https://docs.ai21.com/) | 📊 [Usage](https://studio.ai21.com/account/usage)

### 📥 TEMPLATE — completare credențiale

```markdown
### AI21 Studio

- **Key:** <paste_ai21_key_here>
- **Env Var:** AI21_API_KEY
- **Tip:** LLM Long-Context (Jamba family)
- **Limita:** $10 credit / 3 luni
- **Base URL:** https://api.ai21.com/studio/v1
- **Note:** Jamba 1.5 Large/Mini. 256K context window. Util pentru documente lungi.
```

---

## 3. Perplexity API ⭐⭐ — search-grounded medical lookup

### Ce câștigi

- **Modele Sonar** (small/large) cu **search web încorporat** — răspunsuri cu citations live
- **$5 credit signup** + **Sonar small gratis NELIMITAT**
- Util pentru drug interaction lookup în Mami_Docs (RxNorm + medical literature search)

### Pași (~3 min)

1. [Perplexity signup](https://www.perplexity.ai/) → Google/email
2. [API Settings](https://www.perplexity.ai/settings/api) → **Generate API Key** → copy (`pplx-...`)

### Test imediat

```powershell
$body = @{ model = "sonar"; messages = @(@{ role = "user"; content = "Ce e paracetamolul?" }) } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "https://api.perplexity.ai/chat/completions" `
    -Headers @{ Authorization = "Bearer $env:PERPLEXITY_API_KEY"; "Content-Type" = "application/json" } -Body $body
```

### Note

- Sonar small = grounded în web search live (Brave backend)
- Latency: 2-5s (include search round-trip)
- Rate limit: 50 req/min free tier

### Link-uri

- 🔧 [API Keys](https://www.perplexity.ai/settings/api) | 📚 [Docs](https://docs.perplexity.ai/)

### 📥 TEMPLATE — completare credențiale

```markdown
### Perplexity API

- **Key:** <paste_pplx_key_here>
- **Env Var:** PERPLEXITY_API_KEY
- **Tip:** LLM Search-Grounded
- **Limita:** $5 credit + sonar-small gratis nelimitat
- **Base URL:** https://api.perplexity.ai/chat/completions
- **Note:** Răspunsuri cu citations din web. Util pentru lookup medical/factual real-time.
```

---

## 4. Voyage AI ⭐⭐ — embeddings best-in-class 2026

### Ce câștigi

- **200M tokens/lună GRATIS PERMANENT** pe `voyage-3`
- Cele mai bune embedding-uri 2026 (scor MTEB top-3) — recomandat oficial Anthropic
- Multilingv RO nativ excellent, context 32K
- Înlocuiește/complementează Cohere/Gemini embed în chain RAG Mami_Docs

### Pași (~3 min)

1. [Voyage Dashboard](https://dash.voyageai.com/) → email signup
2. Email verification → login
3. **API Keys** sectiune → **Create Key** → copy (`pa-...`)

### Test imediat

```powershell
$body = @{ input = @("Salut mami"); model = "voyage-3-lite" } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "https://api.voyageai.com/v1/embeddings" `
    -Headers @{ Authorization = "Bearer $env:VOYAGE_API_KEY"; "Content-Type" = "application/json" } -Body $body
```

### Note

- `voyage-3` = 1024-dim (default high quality)
- `voyage-3-lite` = 512-dim (rapid, suficient pentru majoritatea)
- `voyage-multilingual-2` = optimizat non-EN
- Are și **rerank API** (`rerank-2`) pentru îmbunătățire RAG post-search

### Link-uri

- 🔧 [API Keys](https://dash.voyageai.com/api-keys) | 📚 [Docs](https://docs.voyageai.com/) | 📊 [Usage](https://dash.voyageai.com/usage)

### 📥 TEMPLATE — completare credențiale

```markdown
### Voyage AI

- **Key:** <paste_voyage_key_here>
- **Env Var:** VOYAGE_API_KEY
- **Tip:** Embeddings + Reranking
- **Limita:** 200M tokens/luna gratis (voyage-3 / voyage-3-lite)
- **Base URL:** https://api.voyageai.com/v1
- **Note:** Cele mai bune embedding-uri 2026 (recomandat Anthropic). Multilingv RO. 32K ctx.
```

---

## 5. Nebius AI Studio ⭐ — Llama 405B EU GDPR-compliant

### Ce câștigi

- **$1 credit signup** + acces gratuit la **Llama 3.3 405B**, **DeepSeek-R1**, Qwen 2.5 72B
- Servere EU (Frankfurt) → **GDPR-compliant** pentru date personale Mami_Docs
- OpenAI-compatible API
- Throughput excellent: 50-100 tokens/sec pe Llama 70B

### Pași (~3 min)

1. [Nebius Studio](https://studio.nebius.com/) → email signup
2. Verifică email → login
3. Header → `Settings → API Keys` → **Create Key** → copy

### Test imediat

```powershell
$body = @{ model = "meta-llama/Llama-3.3-70B-Instruct"; messages = @(@{ role = "user"; content = "Reply OK" }); max_tokens = 5 } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "https://api.studio.nebius.ai/v1/chat/completions" `
    -Headers @{ Authorization = "Bearer $env:NEBIUS_API_KEY"; "Content-Type" = "application/json" } -Body $body
```

### Note

- EU-hosted = GDPR-OK pentru date mama (single din top fără DeepSeek/Z.ai/Qwen care sunt în Asia)
- Rate limit: 600 req/oră free tier

### Link-uri

- 🔧 [API Keys](https://studio.nebius.com/settings/api-keys) | 📚 [Docs](https://docs.nebius.com/studio/inference/api)

### 📥 TEMPLATE — completare credențiale

```markdown
### Nebius AI Studio

- **Key:** <paste_nebius_key_here>
- **Env Var:** NEBIUS_API_KEY
- **Tip:** LLM Multi-Model (frontier OS, EU-hosted)
- **Limita:** $1 signup + free tier Llama 3.3 405B / DeepSeek-R1
- **Base URL:** https://api.studio.nebius.ai/v1
- **Note:** Servere EU (GDPR OK). OpenAI-compatible. Llama 405B BF16 precizie maximă.
```

---

## 6. AssemblyAI ⭐⭐ — STT premium ro-RO

### Ce câștigi

- **$50 credit signup** (~16h audio transcript pe `Universal-2`)
- **STT best-in-class ro-RO** + diarization (cine vorbește) + sentiment
- Webhooks async pentru transcripts batch
- ~5% WER pe RO (vs Whisper Large-v3: ~8% WER)

### Pași (~3 min)

1. [AssemblyAI signup](https://www.assemblyai.com/dashboard/signup) → email
2. Email verification → onboarding
3. Dashboard → cheia generată automat → **Copy** (sau `Account → API Key`)

### Test imediat (cu sample audio public)

```powershell
$body = @{ audio_url = "https://storage.googleapis.com/aai-web-samples/news.mp3"; language_code = "ro" } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "https://api.assemblyai.com/v2/transcript" `
    -Headers @{ authorization = $env:ASSEMBLYAI_API_KEY; "Content-Type" = "application/json" } -Body $body
```

### Note

- $50 ≈ 16h audio = mama poate înregistra 30 min/zi pentru ~32 zile
- Pricing post-credit: $0.12/oră Universal-2

### Link-uri

- 🔧 [API Key](https://www.assemblyai.com/app/api-keys) | 📚 [Docs](https://www.assemblyai.com/docs/)

### 📥 TEMPLATE — completare credențiale

```markdown
### AssemblyAI

- **Key:** <paste_assemblyai_key_here>
- **Env Var:** ASSEMBLYAI_API_KEY
- **Tip:** STT Best-in-Class
- **Limita:** $50 credit signup (~16h audio Universal-2)
- **Base URL:** https://api.assemblyai.com/v2
- **Note:** Suport ro-RO + diarization + sentiment + summary. Webhooks async.
```

---

## 7. ElevenLabs ⭐⭐ — TTS premium voci RO

### Ce câștigi

- **10.000 caractere/lună GRATIS PERMANENT** (~10 min audio TTS lunar)
- **Voci ro-RO native** premium (mult superior Web Speech API)
- Voice cloning din 1 minut audio
- Util pentru mesaje vocale personalizate către mama (vocea lui Roland citindu-i meniu)

### Pași (~3 min)

1. [ElevenLabs signup](https://elevenlabs.io/sign-up) → email/Google
2. Email verification → onboarding (skip plan paid → alege Free)
3. **Profile (right top) → API Keys** → **Create New Secret Key** → copy

### Test imediat (returnează audio binary)

```powershell
$body = @{ text = "Salut mama, e ora 8, ia pastila galbenă"; model_id = "eleven_multilingual_v2" } | ConvertTo-Json
Invoke-WebRequest -Method POST -Uri "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL" `
    -Headers @{ "xi-api-key" = $env:ELEVENLABS_API_KEY; "Content-Type" = "application/json" } -Body $body -OutFile "test_tts.mp3"
```

### Note

- Voice ID `EXAVITQu4vr4xnSDxMaL` = Sarah (default RO support)
- 10k chars/lună = ~50 mesaje scurte sau ~10 min audio
- Pentru voce custom Roland: înregistrezi 1 min audio curat → upload Voice Lab → primești voice_id

### Link-uri

- 🔧 [API Keys](https://elevenlabs.io/app/settings/api-keys) | 📚 [Docs](https://elevenlabs.io/docs)

### 📥 TEMPLATE — completare credențiale

```markdown
### ElevenLabs

- **Key:** <paste_elevenlabs_key_here>
- **Env Var:** ELEVENLABS_API_KEY
- **Tip:** TTS Premium
- **Limita:** 10.000 chars/luna gratis (free PERMANENT)
- **Base URL:** https://api.elevenlabs.io/v1
- **Note:** Voci ro-RO native. Voice cloning 1-min sample. Util pentru personalizare mesaje mama.
```

---

## 8. Cartesia ⭐ — TTS ultra-low latency conversațional

### Ce câștigi

- **Sonic-2** = TTS sub 75ms latency (cel mai rapid 2026)
- Free tier credite signup + voci pre-built
- Util pentru TTS conversațional real-time (răspunsuri AI rostite la mama în <100ms)

### Pași (~3 min)

1. [Cartesia signup](https://play.cartesia.ai/sign-up) → email/Google
2. Email verification → playground
3. **Profile → API Keys** → **Create Key** → copy

### Test imediat

```powershell
$body = @{ model_id = "sonic-2"; transcript = "Salut mama"; voice = @{ mode = "id"; id = "<VOICE_ID>" }; output_format = @{ container = "wav"; encoding = "pcm_f32le"; sample_rate = 44100 } } | ConvertTo-Json -Depth 5
Invoke-WebRequest -Method POST -Uri "https://api.cartesia.ai/tts/bytes" `
    -Headers @{ "X-API-Key" = $env:CARTESIA_API_KEY; "Cartesia-Version" = "2024-06-10"; "Content-Type" = "application/json" } -Body $body -OutFile "test.wav"
```

### Note

- Sonic-2 < 75ms time-to-first-byte → excellent voice agents conversaționali
- Pricing post-free: $0.05/1M chars

### Link-uri

- 🔧 [API Keys](https://play.cartesia.ai/keys) | 📚 [Docs](https://docs.cartesia.ai/)

### 📥 TEMPLATE — completare credențiale

```markdown
### Cartesia

- **Key:** <paste_cartesia_key_here>
- **Env Var:** CARTESIA_API_KEY
- **Tip:** TTS Ultra-Low-Latency
- **Limita:** Free tier signup credits
- **Base URL:** https://api.cartesia.ai/v1
- **Note:** Sonic-2 sub 75ms. Stream audio. Folosit pentru TTS conversational real-time.
```

---

## 9. Hume AI ⭐⭐ — Emotion AI UNIC pentru Wellness mama

### Ce câștigi

- **Emotion AI unic** — detectează emoții din voce (38 categorii) + expresii faciale + text sentiment
- **Free dev tier** ~10.000 minute audio analysis/lună
- Util ULTRA-relevant pentru Mami_Docs Wellness — detectează automat dispoziția mamei când înregistrează jurnal vocal
- Empathic Voice Interface (EVI) — chat conversational care răspunde la emoția user-ului

### Pași (~3 min)

1. [Hume signup](https://platform.hume.ai/sign-up) → email
2. Email verification → onboarding (alege "Build with Hume APIs")
3. **API Keys** → **Create new key** → copy

### Test imediat

```powershell
$body = @{ models = @{ prosody = @{} }; transcription = @{ language = "ro" }; urls = @("https://hume-tutorials.s3.amazonaws.com/faces.zip") } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Method POST -Uri "https://api.hume.ai/v0/batch/jobs" `
    -Headers @{ "X-Hume-Api-Key" = $env:HUME_API_KEY; "Content-Type" = "application/json" } -Body $body
```

### Note

- **Use-case Mami_Docs:** mama spune "azi mă simt rău" → Hume detectează `Sadness:0.7, Anxiety:0.5` → admin Roland primește alertă cu prioritate ridicată
- 38 emoții detectate (vs 7 standard) — granularitate utilă pentru pattern detection wellness

### Link-uri

- 🔧 [API Keys](https://platform.hume.ai/settings/keys) | 📚 [Docs](https://dev.hume.ai/docs/)

### 📥 TEMPLATE — completare credențiale

```markdown
### Hume AI

- **Key:** <paste_hume_key_here>
- **Env Var:** HUME_API_KEY
- **Tip:** Emotion AI (Voice/Face/Text)
- **Limita:** ~10k min audio/luna dev tier
- **Base URL:** https://api.hume.ai/v0
- **Note:** Detectie emotii din voce mama (relevant Wellness). 38 categorii sentiment.
```

---

## 10. Resend ⭐⭐ — Email API modern

### Ce câștigi

- **3000 emails/lună + 100/zi GRATIS PERMANENT** (free tier real, nu trial)
- API modern (TypeScript-first), Markdown / React Email support
- Domain custom verificat în 5 minute (DKIM/SPF auto)
- Util pentru alerte admin Roland (storage 80%, errors, weekly digest mama)

### Pași (~5 min cu domeniu / 3 min fără)

1. [Resend signup](https://resend.com/signup) → email/GitHub
2. Email verification → onboarding
3. **API Keys → Create API Key** → permission `Sending access` → copy (`re_...`)
4. (Opțional cu domeniu custom) **Domains → Add Domain** → adaugă DNS records (DKIM/SPF) → wait verify

### Test imediat

```powershell
$body = @{ from = "onboarding@resend.dev"; to = @("petrilarolly@gmail.com"); subject = "Test Mami_Docs"; html = "<p>Salut Roland!</p>" } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "https://api.resend.com/emails" `
    -Headers @{ Authorization = "Bearer $env:RESEND_API_KEY"; "Content-Type" = "application/json" } -Body $body
```

### Note

- Folosește pentru: alerte storage 80%, weekly digest wellness mama, error reports
- Combinare cu Telegram Bot existent → multi-channel admin notifications
- Webhook events pentru bounce/spam tracking

### Link-uri

- 🔧 [API Keys](https://resend.com/api-keys) | 📚 [Docs](https://resend.com/docs/introduction)

### 📥 TEMPLATE — completare credențiale

```markdown
### Resend

- **Key:** <paste_resend_key_here>
- **Env Var:** RESEND_API_KEY
- **Tip:** Email API Modern
- **Limita:** 3000 emails/luna + 100/zi PERMANENT
- **Base URL:** https://api.resend.com
- **Note:** From: onboarding@resend.dev (default) sau noreply@<domeniu> dacă verificat. Markdown/React.
```

---

## 11. Sentry ⭐⭐ — Error monitoring + performance

### Ce câștigi

- **5.000 errors + 10.000 transactions performance/lună GRATIS** (Developer plan)
- Source maps + breadcrumbs + release tracking + Slack/Telegram alerts
- Critical pentru stabilitate Mami_Docs production
- Suport Vite plugin oficial + Cloudflare Workers SDK

### Pași (~5 min)

1. [Sentry signup](https://sentry.io/signup/) → email/Google/GitHub
2. **Create new project** → platform: `JavaScript (Vite)` sau `Cloudflare Workers`
3. Project name: `mami-docs` → **Create**
4. Sentry afișează DSN (`https://<key>@o<orgid>.ingest.sentry.io/<projectid>`) → **Copy**

### Test în cod Vite frontend

```javascript
import * as Sentry from "@sentry/browser";
Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN });
Sentry.captureException(new Error("Test from Mami_Docs setup"));
```

### Note

- Setup Vite: `npm install @sentry/vite-plugin --save-dev` + config `vite.config.ts`
- Setup CF Worker: `import { Sentry } from "@sentry/cloudflare"`
- Free tier suficient pentru ~50 users activi

### Link-uri

- 🔧 [Create project](https://sentry.io/organizations/_/projects/new/) | 📚 [Docs Vite](https://docs.sentry.io/platforms/javascript/guides/vite/) | [CF Workers](https://docs.sentry.io/platforms/javascript/guides/cloudflare/)

### 📥 TEMPLATE — completare credențiale

```markdown
### Sentry

- **Key:** <paste_sentry_DSN_here>
- **Env Var:** SENTRY_DSN
- **Tip:** Error Monitoring + Performance
- **Limita:** 5k errors + 10k transactions/luna gratis
- **Base URL:** (DSN-specific)
- **Note:** Vite plugin official. CF Workers SDK. Project: mami-docs.
```

---

## 12. Neon Postgres ⭐ — DB serverless 500MB permanent

### Ce câștigi

- **500MB DB + 100h compute + branching git-like GRATIS PERMANENT**
- Postgres 16 cu pgvector pre-instalat
- **Scale-to-zero** (zero cost când inactiv)
- Util ca fallback Supabase sau pentru dev/preview branches Mami_Docs

### Pași (~3 min)

1. [Neon signup](https://console.neon.tech/signup) → GitHub/Google/email
2. **Create your first project** → name `mami-docs-dev` → region `Frankfurt (eu-central-1)`
3. Postgres version `16` → **Create project**
4. Dashboard → **Connection string** → copy (`postgresql://<user>:<pass>@<host>/<db>`)

### Test imediat

```powershell
psql $env:NEON_DATABASE_URL -c "SELECT version();"
```

### Note

- Branching unic: branch DB pentru dev/staging fără cost extra
- Compute pause după 5 min inactivitate (cold start ~500ms)
- pgvector pre-instalat (`CREATE EXTENSION vector;`)

### Link-uri

- 🔧 [Create project](https://console.neon.tech/app/projects) | 📚 [Docs](https://neon.tech/docs)

### 📥 TEMPLATE — completare credențiale

```markdown
### Neon Postgres

- **Key:** <paste_neon_connection_string_here>
- **Env Var:** NEON_DATABASE_URL
- **Tip:** Postgres Serverless
- **Limita:** 500MB + 100h compute/luna gratis PERMANENT
- **Base URL:** (în connection string)
- **Note:** Postgres 16 + pgvector. Branching git-like. Scale-to-zero. Frankfurt EU.
```

---

## 13. Leonardo.AI ⭐⭐⭐ — image gen 1500-2250/lună

### Ce câștigi

- **150 tokens/zi (~1500-2250 imagini/lună)** — direct cel mai generos free tier
- Modele: Phoenix, Lucid Origin, Flux Dev — stiluri PhotoReal unice
- Brand consistency tools (Elements, characters, style references)

### Pași (~3 min)

1. [Leonardo signup](https://app.leonardo.ai/auth/signup) → email/Google
2. Verifică email → activare
3. **Settings → API Keys** ([direct](https://app.leonardo.ai/settings/api-keys)) → **Create**
4. Copy (`<token>`)

### Test imediat

```powershell
$body = @{ height = 512; width = 512; modelId = "1e60896f-3c26-4296-8060-9e2fc9e1bc7b"; prompt = "a cute cat with red hat" } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "https://cloud.leonardo.ai/api/rest/v1/generations" `
    -Headers @{ Authorization = "Bearer $env:LEONARDO_API_KEY"; "Content-Type" = "application/json" } -Body $body
```

### Note

- 150 tokens/zi = aproximativ 15-20 imagini standard sau 5-6 PhotoReal
- Model PhotoReal e unic (nu există pe Replicate cu aceeași calitate)

### Link-uri

- 🔧 [API Keys](https://app.leonardo.ai/settings/api-keys) | 📚 [Docs](https://docs.leonardo.ai/)

### 📥 TEMPLATE — completare credențiale

```markdown
### Leonardo.AI

- **Key:** <paste_leonardo_key_here>
- **Env Var:** LEONARDO_API_KEY
- **Tip:** Image Generation Premium
- **Limita:** 150 tokens/zi (~1500-2250 imagini/lună)
- **Base URL:** https://cloud.leonardo.ai/api/rest/v1
- **Note:** Phoenix/Lucid Origin/Flux Dev. PhotoReal unic. Brand kits.
```

---

## 14. Ideogram ⭐⭐⭐ — text-in-image (cel mai bun)

### Ce câștigi

- **10 prompts/zi × 4 imagini = ~1200/lună** direct
- **CEL MAI BUN la text rendering în imagini** (logo cu cuvinte, postere cu text)
- Imposibil de matchat de SDXL/Flux la text accuracy
- Ideogram 2.0 + Magic Prompt

### Pași (~3 min)

1. [Ideogram login](https://ideogram.ai/login) → Google
2. [API Manage](https://ideogram.ai/manage-api) → **Create API Key**
3. Copy

### Test imediat

```powershell
$body = @{ image_request = @{ prompt = "Logo cu text 'Mami Docs' pe fundal albastru"; aspect_ratio = "ASPECT_1_1"; model = "V_2" } } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Method POST -Uri "https://api.ideogram.ai/generate" `
    -Headers @{ "Api-Key" = $env:IDEOGRAM_API_KEY; "Content-Type" = "application/json" } -Body $body
```

### Note

- Excelent pentru: logo cu text, postere, infografice, screenshots cu text
- 10 prompts/zi × 4 imagini = 40 imagini/zi gratis

### Link-uri

- 🔧 [API Manage](https://ideogram.ai/manage-api) | 📚 [Docs](https://developer.ideogram.ai/)

### 📥 TEMPLATE — completare credențiale

```markdown
### Ideogram

- **Key:** <paste_ideogram_key_here>
- **Env Var:** IDEOGRAM_API_KEY
- **Tip:** Image Generation (text-in-image best)
- **Limita:** 10 prompts/zi × 4 imagini = ~1200/lună
- **Base URL:** https://api.ideogram.ai
- **Note:** CEL MAI BUN la text rendering. Logo, postere cu text, infografice.
```

---

## 15. Adobe Firefly ⭐ — commercial-safe brand assets

### Ce câștigi

- **25 generative credits/lună** (gratis cu Adobe ID free)
- **Commercial-safe** — antrenat doar pe Adobe Stock + public domain (zero risc copyright)
- SEPARATE de `ADOBE_API_KEY` existent (PDF/Acrobat) — proiect Firefly diferit
- Util pentru asseturi UI Mami_Docs care pot fi folosite comercial fără frică

### Pași (~5 min)

1. [Firefly](https://firefly.adobe.com/) → login cu Adobe ID (free)
2. [Developer Console](https://developer.adobe.com/console/projects) → **Create new project**
3. **Add API → Firefly API** → autorize → genereaza JWT credentials
4. Salvezi `Client ID` + `Client Secret`

### Test imediat (necesită schimb JWT → access_token)

```powershell
$tokenBody = "client_id=$env:FIREFLY_CLIENT_ID&client_secret=$env:FIREFLY_CLIENT_SECRET&grant_type=client_credentials&scope=openid,AdobeID,session,additional_info,read_organizations,firefly_api,ff_apis"
$tokenResp = Invoke-RestMethod -Method POST -Uri "https://ims-na1.adobelogin.com/ims/token/v3" -Body $tokenBody -Headers @{ "Content-Type" = "application/x-www-form-urlencoded" }
# $tokenResp.access_token = bearer pentru apel Firefly
```

### Note

- Refresh token la fiecare 24h (auto-renewable)
- Single din top safe pentru asseturi care pot deveni publice (logo, materiale marketing)

### Link-uri

- 🔧 [Console](https://developer.adobe.com/console/projects) | 📚 [Docs](https://developer.adobe.com/firefly-services/docs/firefly-api/)

### 📥 TEMPLATE — completare credențiale (DOUĂ valori)

```markdown
### Adobe Firefly

- **Client ID:** <paste_firefly_client_id_here>
- **Client Secret:** <paste_firefly_client_secret_here>
- **Env Var:** FIREFLY_CLIENT_ID + FIREFLY_CLIENT_SECRET
- **Tip:** Image Generation Commercial-Safe
- **Limita:** 25 generative credits/lună
- **Base URL:** https://firefly-api.adobe.io
- **Note:** SEPARATE de ADOBE_API_KEY (PDF). Proiect Firefly distinct. JWT-based auth.
```

---

## 16. Luma Dream Machine ⭐ — video generation 30/lună

### Ce câștigi

- **30 video gens/lună** 720p (5-10 sec fiecare)
- **Best image-to-video** la calitate (mai bun decât Kling/Runway free tiers)
- Camera motion control (orbit, zoom, pan, dolly)

### Pași (~3 min)

1. [Luma signup](https://lumalabs.ai/dream-machine/api) → Google/email
2. Verifică email → onboarding
3. [API Keys](https://lumalabs.ai/api/keys) → **Create** → copy

### Test imediat

```powershell
$body = @{ prompt = "a cute cat in a sunny garden"; aspect_ratio = "16:9" } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "https://api.lumalabs.ai/dream-machine/v1/generations" `
    -Headers @{ Authorization = "Bearer $env:LUMA_API_KEY"; "Content-Type" = "application/json" } -Body $body
```

### Note

- Image-to-video: trimit URL imagine + prompt → video 5s
- 30/lună = 1 video/zi suficient pentru proiecte mici

### Link-uri

- 🔧 [API Keys](https://lumalabs.ai/api/keys) | 📚 [Docs](https://docs.lumalabs.ai/)

### 📥 TEMPLATE — completare credențiale

```markdown
### Luma Dream Machine

- **Key:** <paste_luma_key_here>
- **Env Var:** LUMA_API_KEY
- **Tip:** Video Generation (image-to-video best)
- **Limita:** 30 video gens/lună 720p
- **Base URL:** https://api.lumalabs.ai
- **Note:** Camera motion control. Best i2v gratuit. 5-10 sec video.
```

---

## 17. Hailuo MiniMax ⭐⭐ — video + voice + LLM unified

### Ce câștigi

- **Free credits signup** ($5-30 variabil + bonus phone verify)
- **Hailuo T2V/I2V video** (calitate top, mai bun decât Luma la realistic motion)
- **Voice cloning** unic + LLM
- Multi-modal real într-un singur provider

### Pași (~5 min)

1. [International signup](https://www.minimax.io/login) → email
2. Verify phone (opțional pentru bonus credits)
3. [API Keys](https://www.minimax.io/user-center/basic-information/interface-key) → **Create**
4. Salvezi `API Key` + `Group ID` (ambele necesare)

### Test imediat (text-to-video)

```powershell
$body = @{ model = "video-01"; prompt = "a cat playing in a garden"; group_id = $env:MINIMAX_GROUP_ID } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "https://api.minimaxi.chat/v1/video_generation" `
    -Headers @{ Authorization = "Bearer $env:MINIMAX_API_KEY"; "Content-Type" = "application/json" } -Body $body
```

### Note

- Hailuo Video 01 = calitate apropiată Sora în motion realism
- Voice cloning în 10 secunde audio sample
- LLM `abab6.5s` = competitive cu GPT-4o

### Link-uri

- 🔧 [API Keys](https://www.minimax.io/user-center/basic-information/interface-key) | 📚 [Docs](https://www.minimax.io/document)

### 📥 TEMPLATE — completare credențiale (DOUĂ valori)

```markdown
### Hailuo MiniMax

- **API Key:** <paste_minimax_key_here>
- **Group ID:** <paste_minimax_group_id_here>
- **Env Var:** MINIMAX_API_KEY + MINIMAX_GROUP_ID
- **Tip:** Multi-modal (Video + Voice + LLM)
- **Limita:** $5-30 free credits signup + bonus phone
- **Base URL:** https://api.minimaxi.chat/v1
- **Note:** Hailuo T2V/I2V. Voice cloning. LLM abab6.5s. Phone verify pentru bonus.
```

---

## 18. Fish Audio ⭐⭐ — TTS multi-voice (2M voci RO)

### Ce câștigi

- **Free permanent** + access la 2M+ voci community în 8 limbi (RO inclus)
- Voice cloning din 10 secunde audio
- Modele Fish Speech 1.5 + S1 — calitate apropiată ElevenLabs cu free tier mai generos

### Pași (~3 min)

1. [Fish Audio signup](https://fish.audio/auth/sign-up) → email/Google
2. Verifică email → onboarding
3. [API Keys](https://fish.audio/go-api/api-keys) → **Create** → copy

### Test imediat

```powershell
$body = @{ text = "Salut mama"; reference_id = "<voice_id>"; format = "mp3" } | ConvertTo-Json
Invoke-WebRequest -Method POST -Uri "https://api.fish.audio/v1/tts" `
    -Headers @{ Authorization = "Bearer $env:FISHAUDIO_API_KEY"; "Content-Type" = "application/json" } -Body $body -OutFile "test.mp3"
```

### Note

- Voice library 2M+ — căutați pe [fish.audio](https://fish.audio/) voci RO
- Free permanent = sustainable long-term (vs ElevenLabs 10k chars/lună)
- Voice cloning în 10 sec sample → unique pentru personalizare rapidă

### Link-uri

- 🔧 [API Keys](https://fish.audio/go-api/api-keys) | 📚 [Docs](https://docs.fish.audio/)

### 📥 TEMPLATE — completare credențiale

```markdown
### Fish Audio

- **Key:** <paste_fishaudio_key_here>
- **Env Var:** FISHAUDIO_API_KEY
- **Tip:** TTS Multi-Voice + Voice Cloning
- **Limita:** Free permanent + 2M+ voci community
- **Base URL:** https://api.fish.audio/v1
- **Note:** Voci RO disponibile în library. Cloning din 10s sample. Fish Speech 1.5/S1.
```

---

## 19. D-ID ⭐⭐ — Talking head video personalizat

### Ce câștigi

- **5 min video/lună GRATIS**
- Image + audio → talking head video cu lip sync RO
- **Use-case Mami_Docs:** poză Roland + voce ElevenLabs/Fish → mesaj video personalizat pentru mama
- Calitate superior vs open-source (sadtalker pe Replicate are artefacte vizibile)

### Pași (~3 min)

1. [D-ID Studio signup](https://studio.d-id.com/) → email/Google
2. Verifică email → onboarding (skip plan paid)
3. [API page](https://studio.d-id.com/api) → **Create API Key** → copy

### Test imediat

```powershell
$body = @{ source_url = "https://create-images-results.d-id.com/api_docs/assets/noelle.jpeg"; script = @{ type = "text"; input = "Salut mama, te iubesc!" } } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Method POST -Uri "https://api.d-id.com/talks" `
    -Headers @{ Authorization = "Basic $env:DID_API_KEY"; "Content-Type" = "application/json" } -Body $body
```

### Note

- 5 min/lună = ~10 mesaje 30s sau 5 mesaje 1 min
- Lip sync RO funcțional (calitate medie spre bună)
- Combine cu ElevenLabs voice pentru fluxul: text → voce custom → video talking head Roland

### Link-uri

- 🔧 [API Page](https://studio.d-id.com/api) | 📚 [Docs](https://docs.d-id.com/)

### 📥 TEMPLATE — completare credențiale

```markdown
### D-ID

- **Key:** <paste_did_key_here>
- **Env Var:** DID_API_KEY
- **Tip:** Talking Head Video (image + audio → video)
- **Limita:** 5 min video/lună gratis
- **Base URL:** https://api.d-id.com
- **Note:** Lip sync RO. Use-case: poză Roland + voce ElevenLabs → mesaj video mama.
```

---

## 20. Meshy AI ⭐⭐ — 3D modeling 200/lună permanent

### Ce câștigi

- **200 credits/lună GRATIS PERMANENT** (cel mai sustainable 3D free tier 2026)
- Text/Image → 3D mesh (.glb / .obj / .fbx) + retexturizare
- Auto-rigging pentru personaje
- Util pentru: assets 3D viitor pentru app-uri secundare, prototipare rapidă

### Pași (~3 min)

1. [Meshy signup](https://www.meshy.ai/auth/sign-up) → email/Google
2. Email verification → onboarding
3. [API Settings](https://www.meshy.ai/api) → **Create API Key** → copy

### Test imediat (text-to-3D preview)

```powershell
$body = @{ mode = "preview"; prompt = "a cute cartoon cat"; art_style = "realistic" } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "https://api.meshy.ai/openapi/v2/text-to-3d" `
    -Headers @{ Authorization = "Bearer $env:MESHY_API_KEY"; "Content-Type" = "application/json" } -Body $body
```

### Note

- 200 credits/lună = ~10-20 modele 3D simple sau ~5 complexe cu retexturare
- Permanent, nu expiră — sustainable long-term

### Link-uri

- 🔧 [API](https://www.meshy.ai/api) | 📚 [Docs](https://docs.meshy.ai/)

### 📥 TEMPLATE — completare credențiale

```markdown
### Meshy AI

- **Key:** <paste_meshy_key_here>
- **Env Var:** MESHY_API_KEY
- **Tip:** 3D Modeling (Text/Image → 3D)
- **Limita:** 200 credits/lună permanent
- **Base URL:** https://api.meshy.ai/openapi/v2
- **Note:** .glb/.obj/.fbx export. Auto-rigging. Sustainable long-term free.
```

---

## 📋 Sumar prioritate semnare (recomandare)

**Wave 1 — primele 3 (15 min, valoare maximă):**

1. ⭐⭐ **Reka** — recurring lunar (singura care se reîncarcă)
2. ⭐⭐⭐ **Ideogram** — text-in-image unic, 1200/lună
3. ⭐⭐⭐ **Leonardo.AI** — 1500-2250 imagini/lună PhotoReal

**Wave 2 — Wellness mama (15 min):**

4. ⭐⭐ **Hume AI** — emotion analysis pentru jurnal vocal mama (UNIC)
5. ⭐⭐ **AssemblyAI** — STT premium ro-RO ($50 credit)
6. ⭐⭐ **ElevenLabs** — TTS RO native voice cloning

**Wave 3 — Infrastructure (15 min):**

7. ⭐⭐ **Resend** — email alerts admin
8. ⭐⭐ **Sentry** — error monitoring production
9. ⭐ **Neon** — DB alt branching git-like

**Wave 4 — RAG + Long context (15 min):**

10. ⭐⭐ **Voyage AI** — best embeddings (înlocuiește Cohere/Gemini în RAG)
11. ⭐⭐ **Perplexity** — search-grounded medical lookup
12. ⭐ **AI21** — 256K context jurnale lungi
13. ⭐ **Nebius** — Llama 405B EU GDPR pentru date mama

**Wave 5 — Multimedia (15 min):**

14. ⭐ **Cartesia** — TTS sub 75ms voice agents
15. ⭐ **Luma Dream Machine** — video gen 30/lună
16. ⭐⭐ **Hailuo MiniMax** — multi-modal video+voice+LLM
17. ⭐⭐ **Fish Audio** — TTS 2M voci permanent
18. ⭐⭐ **D-ID** — talking head video mama
19. ⭐⭐ **Meshy AI** — 3D modeling 200/lună permanent
20. ⭐ **Adobe Firefly** — commercial-safe brand assets

---

## 🎯 După ce obții token-urile — proces standard

1. **Lipești blocul `📥 TEMPLATE`** corespunzător serviciului (cu valoarea reală în loc de `<paste...>`) în `C:\Users\ALIENWARE\.api-keys\INBOX.md`
2. **Deschizi Claude Code** în `C:\Users\ALIENWARE\.api-keys\`
3. **Spui** `proceseaza inbox` → AI procesează:
   - Adaugă în master file
   - Setează Windows User env var
   - Regenerează `catalog.md`
   - Marchează `[PROCESAT YYYY-MM-DD]` în INBOX
4. **Pentru integrare în Mami_Docs AI Gateway** — anunță-mă (Claude într-o sesiune Mami_Docs):
   - Ex: _"Reka e setat, integrează ca fallback chat după Mistral"_
   - Eu adaug `callRekaChat()`, actualizez `CHAT_PROVIDERS`, deploy worker
5. **Toate operațiunile sunt automatizate** — admin face DOAR pașii fizici (creare cont + click "Generate token")

---

## 📊 Sumar capacități după adăugare 20 servicii

| Capacitate            | Înainte (existing)                                     | După adăugare 20                                 |
| --------------------- | ------------------------------------------------------ | ------------------------------------------------ |
| **Chat LLM frontier** | Anthropic, OpenAI, xAI, GitHub Models                  | + Reka, Perplexity, AI21, Nebius                 |
| **Chat LLM OS**       | Groq, SambaNova, Cerebras, NVIDIA, Mistral, OpenRouter | (existing acoperă)                               |
| **Embeddings**        | Gemini, Cohere, Mistral, Jina                          | + **Voyage** (best 2026)                         |
| **STT**               | Groq Whisper, CF Workers AI                            | + **AssemblyAI** (~5% WER ro-RO)                 |
| **TTS**               | Web Speech API                                         | + **ElevenLabs** + **Cartesia** + **Fish Audio** |
| **Image gen**         | Replicate (catalog mare)                               | + **Leonardo** + **Ideogram** + **Firefly**      |
| **Video gen**         | Replicate (LTX/Hunyuan)                                | + **Luma** + **Hailuo MiniMax**                  |
| **Talking head**      | Replicate (sadtalker)                                  | + **D-ID** (premium quality)                     |
| **3D**                | Replicate (TripoSR)                                    | + **Meshy** (200/lună permanent)                 |
| **Emotion AI**        | (none)                                                 | + **Hume AI** (UNIC voice/face)                  |
| **Email**             | Telegram + ntfy + CallMeBot                            | + **Resend** (3k/lună permanent)                 |
| **Error monitoring**  | (log only)                                             | + **Sentry** (5k errors/lună)                    |
| **DB Postgres**       | Supabase                                               | + **Neon** (branching)                           |
| **Long-context**      | OpenRouter rotation                                    | + **AI21 Jamba 1.5** (256K)                      |

---

## 🛡 GDPR pentru date medicale Mami_Docs

**✅ OK pentru date personale mama:**

- Reka (US), AI21 (US), Nebius (EU Frankfurt), AssemblyAI (US), ElevenLabs (US), Cartesia (US)
- Hume (US), Resend (US), Sentry (EU/US), Neon (EU Frankfurt)
- Leonardo, Ideogram, Firefly, Luma, D-ID, Meshy (US/EU)

**⛔ NU pentru date personale mama:**

- Hailuo MiniMax (China), Fish Audio (servere mixed) → folosi DOAR pentru asseturi non-personale (logo, ilustrații generice, voice samples non-mama)

---

**Versiune ghid:** 5.0 | **Data:** 2026-05-06 | **Sursă:** v4 (36 servicii) → v5 (20 cu signup necesar; 16 mutate în memoria sistemului `system_no_key_services.md` pentru auto-execute via chei existente)

> **Pentru servicii FĂRĂ signup necesar (Replicate covers, Pollinations, UI-only equivalents) → vezi memorie sistem `~/.claude/projects/C--Proiecte-Mami-Docs/memory/system_no_key_services.md`. Le execut automat când îmi spui ce conținut vrei generat.**
