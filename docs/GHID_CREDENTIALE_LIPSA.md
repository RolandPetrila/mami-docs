# Ghid Pas-cu-Pas — Credențiale AI/Apps Gratuite Noi (v3 — 2026-05-06)

> **Versiune 3** — extins de la 8 la **20 servicii** (LLM + Speech + Image + Email + Monitoring + DB). Acoperire largă a stack-ului tipic dezvoltare AI/web modern, toate cu free tier semnificativ.
>
> **Surse:** `API_de_adaugat.md` (TOP 10 LLM v1) + research web 2026-05 pentru #9-20 (Perplexity/Voyage/Nebius/Lambda/AssemblyAI/ElevenLabs/Cartesia/Fal/Hume/Resend/Sentry/Neon)

---

## ✅ Status v1 — credențiale obținute (2026-05-06)

Recap rapid din v1 (toate setate în Windows env + worker secrets `mami-docs-ai`):

| Cred v1                  | Env Var                      | Status               | Notes                                    |
| ------------------------ | ---------------------------- | -------------------- | ---------------------------------------- |
| GitHub Models PAT        | `GITHUB_MODELS_TOKEN`        | ✅ SET (93 chars)    | gpt-4o-mini fallback chat live           |
| Azure Doc Intel Key      | `AZURE_DOC_INTEL_KEY` + `_2` | ✅ SET (84/84 chars) | resource `mami-docs-docintel` westeurope |
| Azure Doc Intel Endpoint | `AZURE_DOC_INTEL_ENDPOINT`   | ✅ SET               | folosit prin worker `/ocr-document`      |
| CF Workers AI Token      | `CF_AI_TOKEN`                | ✅ SET (53 chars)    | scope dedicat `Workers AI:Read`          |

---

## ⛔ Excluse din v2 (motivate)

| #   | Provider  | Motiv excludere                                                          |
| --- | --------- | ------------------------------------------------------------------------ |
| 9   | Replicate | **Deja deținut** — `REPLICATE_API_TOKEN` SET (40 chars)                  |
| 10  | Chutes.AI | **Friction mare** — necesită Bittensor wallet; verdict user `[MEDIOCRU]` |

---

## 🆕 TOP 20 AI / Apps de adăugat (sortate după categorie + valoare)

### LLM / Inference (12)

| Prio     | Provider              | Free tier                                     | Card? | Verdict             | Env var propus                  |
| -------- | --------------------- | --------------------------------------------- | ----- | ------------------- | ------------------------------- |
| ⭐⭐ #1  | **Z.ai (Zhipu GLM)**  | GLM-4.7-Flash + 4.5-Flash **PERMANENT**       | NU    | RECOMANDAT          | `ZAI_API_KEY`                   |
| ⭐⭐ #2  | **Alibaba Qwen Intl** | 1M+1M tokens/90 zile per model                | NU    | RECOMANDAT          | `DASHSCOPE_API_KEY`             |
| ⭐⭐ #3  | **Reka AI**           | $10 **RECURRING LUNAR** (unic!)               | NU    | RELEVANT (unic)     | `REKA_API_KEY`                  |
| ⭐ #4    | **AI21 Studio**       | $10 / 3 luni, **256K context**                | NU    | RELEVANT (long-ctx) | `AI21_API_KEY`                  |
| ⭐ #5    | **Together AI**       | $1–25 credit signup, 200+ modele OS           | NU    | RELEVANT            | `TOGETHER_API_KEY`              |
| ⭐ #6    | **DeepInfra**         | $5 credit signup, Llama/Qwen/Mistral          | NU    | RELEVANT            | `DEEPINFRA_API_KEY`             |
| 🆓 #7    | **Pollinations.AI**   | GPT-5/Claude/Gemini proxy **fără signup**     | NU    | FALLBACK PREMIUM    | `POLLINATIONS_TOKEN` (opțional) |
| ⚠ #8     | **ApiFreeLLM**        | "Forever free, no token limits" (`[INCERT]`)  | NU    | RELEVANT            | `APIFREELLM_TOKEN`              |
| ⭐⭐ #9  | **Perplexity API**    | $5 credit + Sonar models **gratis nelimitat** | NU    | RECOMANDAT (search) | `PERPLEXITY_API_KEY`            |
| ⭐⭐ #10 | **Voyage AI**         | **200M tokens** embed/luna gratis             | NU    | RECOMANDAT (embed)  | `VOYAGE_API_KEY`                |
| ⭐ #11   | **Nebius AI Studio**  | $1 + Llama 3.3 405B / DeepSeek-R1 free tier   | NU    | RELEVANT            | `NEBIUS_API_KEY`                |
| ⭐ #12   | **Lambda Inference**  | $5 credit signup, OpenAI-compat, GPU pe edge  | NU    | RELEVANT            | `LAMBDA_API_KEY`                |

### Speech / Audio (3)

| Prio     | Provider       | Free tier                                       | Card? | Verdict             | Env var propus       |
| -------- | -------------- | ----------------------------------------------- | ----- | ------------------- | -------------------- |
| ⭐⭐ #13 | **AssemblyAI** | $50 credit signup + STT multilingv ro-RO        | NU    | RECOMANDAT (STT)    | `ASSEMBLYAI_API_KEY` |
| ⭐⭐ #14 | **ElevenLabs** | 10k chars/lună gratis **PERMANENT** + voci RO   | NU    | RECOMANDAT (TTS)    | `ELEVENLABS_API_KEY` |
| ⭐ #15   | **Cartesia**   | Free tier Sonic-2 ultra-low-latency TTS (~75ms) | NU    | RELEVANT (TTS edge) | `CARTESIA_API_KEY`   |

### Image / Multimodal (2)

| Prio     | Provider    | Free tier                                        | Card? | Verdict              | Env var propus |
| -------- | ----------- | ------------------------------------------------ | ----- | -------------------- | -------------- |
| ⭐ #16   | **Fal.ai**  | Flux Schnell free tier + $10 signup, image rapid | NU    | RELEVANT (image gen) | `FAL_API_KEY`  |
| ⭐⭐ #17 | **Hume AI** | Emotion AI free dev tier (voice/face emotion)    | NU    | UNIC (wellness mama) | `HUME_API_KEY` |

### Infrastructure / Apps (3)

| Prio     | Provider          | Free tier                                      | Card? | Verdict                | Env var propus      |
| -------- | ----------------- | ---------------------------------------------- | ----- | ---------------------- | ------------------- |
| ⭐⭐ #18 | **Resend**        | 3000 emails/lună + 100/zi gratis **PERMANENT** | NU    | RECOMANDAT (email)     | `RESEND_API_KEY`    |
| ⭐⭐ #19 | **Sentry**        | 5k errors + 10k transactions/lună free         | NU    | RECOMANDAT (error mon) | `SENTRY_DSN`        |
| ⭐ #20   | **Neon Postgres** | 500MB DB + branching **gratis PERMANENT**      | NU    | RELEVANT (DB alt)      | `NEON_DATABASE_URL` |

---

## 1. Z.ai (Zhipu GLM) — RECOMANDAT ⭐⭐

### Ce câștigi

- **GLM-4.7-Flash** + **GLM-4.5-Flash** GRATIS PERMANENT (nu trial, nu expiră)
- Modele frontier-class chinezești cu performanță apropiată GPT-4o pentru cost zero
- OpenAI-compatible API (drop-in replacement în chain-uri existente)
- Credite signup adiționale pentru modele non-Flash (GLM-4.7, GLM-4.5)

### Prerequisites

- Cont Z.ai ([signup](https://z.ai/) — necesită email + verificare; număr de telefon poate fi solicitat dacă semnezi cu IP din afara Chinei)
- ⚠ **GDPR considerare** — servere China; pentru date medicale Mami_Docs **NU folosi** (per ADR exclus DeepSeek pe același motiv). OK pentru cazuri non-personale (rețete generice, traducere meniu, etc.).

### Pași pas-cu-pas (~5 min)

1. **Deschide** [z.ai signup](https://z.ai/) → click **Sign Up** (colț dreapta sus)
2. **Înregistrează** cu email Google/GitHub/email custom
3. **Verifică email** — primești link click activare
4. **Login** → mergi la [API Keys](https://z.ai/manage-apikey/apikey-list) (sau `Console → API Keys`)
5. **Create API Key** → name `claude-code-mami-docs` → **Generate**
6. **Copiază** valoarea (`<token>`) — **APARE DOAR O DATĂ**, dacă pierzi regenerezi

### Persistare valoare

Editează `C:\Users\ALIENWARE\.api-keys\INBOX.md` cu Format 3:

```markdown
### Z.ai Zhipu GLM

- **Key:** <paste>
- **Env Var:** ZAI_API_KEY
- **Tip:** LLM Multi-Model (GLM-4.x)
- **Limita:** GLM-4.x-Flash gratis permanent + credite signup pentru tier mai mare
- **Base URL:** https://api.z.ai/api/paas/v4/chat/completions
- **Note:** OpenAI-compatible. ⚠ servere China, NU pentru date medicale (GDPR risk).
```

Apoi `proceseaza inbox` în sesiune Claude Code din `~/.api-keys/`.

### Test imediat

```powershell
$body = @{
  model = "glm-4-flash"
  messages = @(@{ role = "user"; content = "Reply OK" })
  max_tokens = 5
} | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "https://api.z.ai/api/paas/v4/chat/completions" `
    -Headers @{ Authorization = "Bearer $env:ZAI_API_KEY"; "Content-Type" = "application/json" } `
    -Body $body
```

Output: `choices[0].message.content` = `"OK"`

### Note

- Rate limit Flash: ~30 RPM gratis (rezonabil)
- Modelele Flash sunt model "small" optimizat — pentru raționament complex, folosește credite signup pe `glm-4-plus`
- Rotation: nu necesită; revoke manual dacă scapă

### Link-uri rapide

- 🔧 [API Keys](https://z.ai/manage-apikey/apikey-list)
- 📚 [Documentație Z.ai](https://docs.z.ai/)
- 📊 [Console](https://z.ai/manage-apikey)

---

## 2. Alibaba Qwen International (Model Studio) — RECOMANDAT ⭐⭐

### Ce câștigi

- **1M tokens input + 1M tokens output / 90 zile per model** (Qwen-Max, Qwen-Plus, Qwen-Turbo, Qwen2.5-Coder, etc.)
- 256K context maxim pe `qwen-plus`
- OpenAI-compatible API
- International endpoint (`-intl`) → fără VPN/restricție geo

### Prerequisites

- Cont Alibaba Cloud International ([signup](https://www.alibabacloud.com/account) — emails simplu, NU card pentru free tier)
- ⚠ **GDPR considerare** — Alibaba International servere în Singapore/SUA (mai bine decât China mainland), dar pentru date medicale evaluează riscul. OK pentru workload non-personal.

### Pași pas-cu-pas (~7 min)

1. **Deschide** [Alibaba Cloud signup](https://www.alibabacloud.com/account)
2. **Click** Sign Up → folosește email/Google
3. **Activate Account** — primești email cu link
4. **Deschide** [Model Studio Console](https://modelstudio.console.alibabacloud.com/)
5. **Top-right** → click profil → `API-KEY` (sau direct [API-KEY page](https://modelstudio.console.alibabacloud.com/?tab=model#/api-key))
6. **Create New API Key** → confirm
7. **Copy** valoarea (`sk-...`) — **APARE DOAR O DATĂ**

### Persistare

INBOX.md Format 3:

```markdown
### Alibaba Qwen International

- **Key:** <paste>
- **Env Var:** DASHSCOPE_API_KEY
- **Tip:** LLM Multi-Model (Qwen family)
- **Limita:** 1M input + 1M output tokens/90 zile per model (Qwen-Max/Plus/Turbo/Coder)
- **Base URL:** https://dashscope-intl.aliyuncs.com/compatible-mode/v1
- **Note:** OpenAI-compatible. International endpoint. 256K ctx pe qwen-plus.
```

### Test imediat

```powershell
$body = @{
  model = "qwen-plus"
  messages = @(@{ role = "user"; content = "Reply OK" })
  max_tokens = 5
} | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions" `
    -Headers @{ Authorization = "Bearer $env:DASHSCOPE_API_KEY"; "Content-Type" = "application/json" } `
    -Body $body
```

### Note

- Free tier per model — dacă consumi 1M pe Qwen-Plus, **alte modele rămân disponibile**
- După 90 zile, free tier se resetează automat dacă rămâi cu zero spent
- Rate limit: ~60 RPM gratis pe modelele cele mai mari

### Link-uri rapide

- 🔧 [API Keys](https://modelstudio.console.alibabacloud.com/?tab=model#/api-key)
- 📚 [First API call docs](https://www.alibabacloud.com/help/en/model-studio/first-api-call-to-qwen)
- 📊 [Usage dashboard](https://modelstudio.console.alibabacloud.com/?tab=usage)

---

## 3. Reka AI — RELEVANT unic ⭐⭐ ($10 LUNAR RECURRING!)

### Ce câștigi

- **$10 RECURRING LUNAR (resetabil)** — singurul din listă cu credit care se reîncarcă automat
- Modele Reka Core (frontier multimodal) + Reka Flash (rapid)
- Suport multimodal: text + imagine + video + audio (modele specializate cross-modal)
- API OpenAI-compatible

### Prerequisites

- Cont Reka ([signup](https://platform.reka.ai/) — email + verificare, fără card)

### Pași pas-cu-pas (~4 min)

1. **Deschide** [Reka platform signup](https://platform.reka.ai/)
2. **Click** Sign Up → continuă cu Google/email
3. **Verifică email** → click link activare
4. **Login** → meniu lateral `Settings` → `API Keys` (sau direct [API Keys](https://platform.reka.ai/apikeys))
5. **Generate New Key** → name `claude-code-mami` → **Create**
6. **Copy** (`reka_...`) — **DOAR O DATĂ**

### Persistare

INBOX.md:

```markdown
### Reka AI

- **Key:** <paste>
- **Env Var:** REKA_API_KEY
- **Tip:** LLM Multimodal Frontier
- **Limita:** $10 RECURRING LUNAR (reset automat fiecare lună)
- **Base URL:** https://api.reka.ai/v1/chat
- **Note:** Multimodal text+image+video+audio. Modele: reka-core, reka-flash, reka-edge.
```

### Test imediat

```powershell
$body = @{
  model = "reka-flash"
  messages = @(@{ role = "user"; content = @(@{ type = "text"; text = "Reply OK" }) })
} | ConvertTo-Json -Depth 5
Invoke-RestMethod -Method POST -Uri "https://api.reka.ai/v1/chat" `
    -Headers @{ "X-Api-Key" = $env:REKA_API_KEY; "Content-Type" = "application/json" } `
    -Body $body
```

### Note

- **CRITIC**: $10/lună e suficient pentru ~5,000 mesaje pe Reka Flash sau ~1,000 mesaje pe Reka Core — **resetabil**, deci poate fi sustainable long-term ca fallback
- Rate limit: 60 RPM gratis
- Suport multimodal real (image/video/audio understanding) — util pentru extensii future Mami_Docs

### Link-uri rapide

- 🔧 [API Keys](https://platform.reka.ai/apikeys)
- 📚 [Reka docs](https://docs.reka.ai/)
- 📊 [Usage](https://platform.reka.ai/usage)

---

## 4. AI21 Studio — RELEVANT long-context ⭐ (256K)

### Ce câștigi

- **$10 free credit / 3 luni** (~10M tokens echivalent)
- **Jamba 1.5 Large** și **Jamba 1.5 Mini** — arhitectură Mamba+Transformer hibrid
- **256K context window** — printre cele mai mari pe free tier
- Util pentru documente lungi (rețete medicale lungi, contracte, jurnale wellness extensive)

### Prerequisites

- Cont AI21 ([signup](https://studio.ai21.com/) — email simplu, NU card)

### Pași pas-cu-pas (~3 min)

1. **Deschide** [AI21 Studio signup](https://studio.ai21.com/sign-up)
2. **Sign up** cu email sau Google
3. **Verifică email** → activare
4. **Login** → header dropdown nume → `Settings` (sau direct [API Key page](https://studio.ai21.com/account/api-key))
5. Cheia e **deja generată** automat la signup → **Copy**
6. (Opțional) Regenerate dacă vrei o cheie nouă

### Persistare

INBOX.md:

```markdown
### AI21 Studio

- **Key:** <paste>
- **Env Var:** AI21_API_KEY
- **Tip:** LLM Long-Context (Jamba family)
- **Limita:** $10 credit / 3 luni; după → costuri standard
- **Base URL:** https://api.ai21.com/studio/v1
- **Note:** Jamba 1.5 Large/Mini. 256K context window. Util pentru documente lungi.
```

### Test imediat

```powershell
$body = @{
  model = "jamba-1.5-mini"
  messages = @(@{ role = "user"; content = "Reply OK" })
  max_tokens = 5
} | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "https://api.ai21.com/studio/v1/chat/completions" `
    -Headers @{ Authorization = "Bearer $env:AI21_API_KEY"; "Content-Type" = "application/json" } `
    -Body $body
```

### Note

- După $10 consumat → blocare clean (nu surprize de cost)
- Mini suficient pentru chat normal; Large pentru context lung (>32K tokens)
- Rate limit: 100 RPM gratis

### Link-uri rapide

- 🔧 [API Key](https://studio.ai21.com/account/api-key)
- 📚 [Docs](https://docs.ai21.com/)
- 📊 [Usage](https://studio.ai21.com/account/usage)

---

## 5. Together AI — RELEVANT ⭐ (200+ modele open-source)

### Ce câștigi

- **$1–25 credit signup** (variază; tipic $5)
- **200+ modele open-source** — Llama 3.3 70B/405B, Qwen 2.5, Mistral, DeepSeek-R1, Flux, Stable Diffusion
- Inferență rapidă (~70-200 tokens/sec)
- OpenAI-compatible API + dedicated endpoints multimodal

### Prerequisites

- Cont Together ([signup](https://api.together.ai/signin) — email/Google, fără card pentru signup)

### Pași pas-cu-pas (~3 min)

1. **Deschide** [Together AI signup](https://api.together.ai/signin)
2. **Sign up** cu email/Google/GitHub
3. **Verifică email** → click link
4. **Login** → header dreapta sus avatar → `Settings → API Keys` (sau [API Keys](https://api.together.ai/settings/api-keys))
5. Cheia e generată automat la signup → **Copy** (`<token>`)
6. (Opțional) Create New Key cu nume separat per proiect

### Persistare

INBOX.md:

```markdown
### Together AI

- **Key:** <paste>
- **Env Var:** TOGETHER_API_KEY
- **Tip:** LLM Multi-Model OS + Vision + Image Gen
- **Limita:** $1-25 credit signup, apoi pay-per-use
- **Base URL:** https://api.together.xyz/v1
- **Note:** 200+ modele open-source. Llama 3.3 405B, Qwen 2.5, DeepSeek-R1, Flux. OpenAI-compatible.
```

### Test imediat

```powershell
$body = @{
  model = "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free"
  messages = @(@{ role = "user"; content = "Reply OK" })
  max_tokens = 5
} | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "https://api.together.xyz/v1/chat/completions" `
    -Headers @{ Authorization = "Bearer $env:TOGETHER_API_KEY"; "Content-Type" = "application/json" } `
    -Body $body
```

### Note

- Multe modele au sufixe `-Free` care nu consumă credit (rate-limited dar gratuit)
- Pentru `405B` model, `-Turbo` quantizat e suficient pentru majoritatea cazurilor
- Rate limit free: 60 RPM (sufficient pentru folosire normală)

### Link-uri rapide

- 🔧 [API Keys](https://api.together.ai/settings/api-keys)
- 📚 [Docs](https://docs.together.ai/docs/)
- 📊 [Models catalog](https://api.together.ai/models)

---

## 6. DeepInfra — RELEVANT ⭐ ($5 free + modele OS)

### Ce câștigi

- **$5 credit signup** (~10M tokens pe Llama 70B)
- **Llama 3.3, Qwen 2.5, Mistral, Phi-4, DeepSeek-V3** — open-source mainstream
- Pricing competitiv post-trial (~$0.20/1M tokens)
- OpenAI-compatible API

### Prerequisites

- Cont DeepInfra ([signup](https://deepinfra.com/login) — GitHub/Google/email, fără card pentru signup)

### Pași pas-cu-pas (~3 min)

1. **Deschide** [DeepInfra login/signup](https://deepinfra.com/login)
2. **Sign Up** cu GitHub/Google
3. (Auto-login după autorizare)
4. **Mergi la** [API Keys page](https://deepinfra.com/dash/api_keys)
5. **Create New Token** → name `claude-code-mami` → **Create**
6. **Copy** (`<token>`)

### Persistare

INBOX.md:

```markdown
### DeepInfra

- **Key:** <paste>
- **Env Var:** DEEPINFRA_API_KEY
- **Tip:** LLM Multi-Model OS
- **Limita:** $5 credit signup, pay-per-use după
- **Base URL:** https://api.deepinfra.com/v1/openai
- **Note:** Llama/Qwen/Mistral/Phi-4. OpenAI-compatible.
```

### Test imediat

```powershell
$body = @{
  model = "meta-llama/Meta-Llama-3.1-70B-Instruct"
  messages = @(@{ role = "user"; content = "Reply OK" })
  max_tokens = 5
} | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "https://api.deepinfra.com/v1/openai/chat/completions" `
    -Headers @{ Authorization = "Bearer $env:DEEPINFRA_API_KEY"; "Content-Type" = "application/json" } `
    -Body $body
```

### Note

- Latency tipic 200-500ms pentru Llama 70B (rapid)
- Rate limit: 200 RPM gratis
- $5 → ~10M tokens pe Llama 70B sau ~50M pe modele 8B

### Link-uri rapide

- 🔧 [API Keys](https://deepinfra.com/dash/api_keys)
- 📚 [Docs](https://deepinfra.com/docs/deep_infra_api)
- 📊 [Usage](https://deepinfra.com/dash/usage)

---

## 7. Pollinations.AI — FALLBACK PREMIUM 🆓 (FĂRĂ SIGNUP!)

### Ce câștigi

- **GPT-5 / Claude / Gemini proxy GRATIS FĂRĂ SIGNUP** — cea mai unică propunere din listă
- Folosește direct prin URL/API fără autentificare (anonim) cu rate limit moderat
- Cu signup gratuit obții token pentru rate limit higher tier
- Folositor ca **safety net ultim** când toate celelalte providere eșuează

### Prerequisites

- **NICIUNUL** pentru tier anonim
- (Opțional) Cont Pollinations ([signup](https://enter.pollinations.ai/) — pentru token authenticated cu rate limit higher)

### Pași pas-cu-pas

#### Variantă A — fără signup (anonim, rate limit moderat) — 0 minute

Direct, fără cont:

```powershell
# Anonim — niciun token necesar
Invoke-RestMethod -Uri "https://text.pollinations.ai/openai" -Method POST `
    -Headers @{ "Content-Type" = "application/json" } `
    -Body (@{ model = "openai"; messages = @(@{role="user"; content="Reply OK"}) } | ConvertTo-Json)
```

#### Variantă B — cu token (rate limit higher tier) — ~3 min

1. **Deschide** [enter.pollinations.ai](https://enter.pollinations.ai/)
2. **Sign Up** — email simplu sau GitHub
3. Mergi la **Dashboard → API Tokens** (sau secțiunea de generare token)
4. **Create token** → **Copy**

### Persistare (doar pentru variantă B)

INBOX.md:

```markdown
### Pollinations.AI

- **Key:** <paste_token_optional>
- **Env Var:** POLLINATIONS_TOKEN
- **Tip:** LLM Proxy (GPT-5/Claude/Gemini)
- **Limita:** Anonim = rate limit moderat; cu token = higher tier
- **Base URL:** https://text.pollinations.ai/openai
- **Note:** Funcționează FĂRĂ token (anonim). Token = rate limit upgrade. Util ca safety net.
```

### Test imediat (anonim — fără env var)

```powershell
$body = @{
  model = "openai"
  messages = @(@{ role = "user"; content = "Reply OK" })
} | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "https://text.pollinations.ai/openai" `
    -Headers @{ "Content-Type" = "application/json" } `
    -Body $body
```

### Note

- **Modele disponibile** (anonim): `openai` (GPT proxy), `claude`, `gemini`, `mistral` — pollinations multiplexează
- ⚠ **Calitate variabilă** — provider e proxy, latency și availability depind de upstream
- ⚠ **GDPR** — cererile trec prin server-ele Pollinations; nu folosi pentru date personale sensibile
- Rate limit anonim: ~10-30 RPM (variază); cu token: ~100 RPM

### Link-uri rapide

- 🔧 [Signup token](https://enter.pollinations.ai/)
- 📚 [APIDOCS GitHub](https://github.com/pollinations/pollinations/blob/main/APIDOCS.md)
- 📊 [Status](https://status.pollinations.ai/)

---

## 8. ApiFreeLLM — RELEVANT (stabilitate `[INCERT]`)

### Ce câștigi

- **"Forever free, no token limits"** — promisiune mare; stabilitate `[INCERT]` per verdict user
- Util ca **fallback ultim ultim** când totul cade
- API simplu, OpenAI-like

### Prerequisites

- Cont ApiFreeLLM ([signup](https://apifreellm.com/) — email simplu, fără card)

### Pași pas-cu-pas (~3 min)

1. **Deschide** [apifreellm.com](https://apifreellm.com/)
2. **Click** Sign Up / Get Started
3. **Înregistrează** cu email
4. **Verifică email** → click link activare
5. **Login** → secțiunea `API Keys` sau `Dashboard → Tokens`
6. **Generate token** → **Copy**

### Persistare

INBOX.md:

```markdown
### ApiFreeLLM

- **Key:** <paste>
- **Env Var:** APIFREELLM_TOKEN
- **Tip:** LLM Multi-Model (incert quality)
- **Limita:** "Forever free, no token limits" (verdict stabilitate INCERT)
- **Base URL:** https://apifreellm.com/api/...
- **Note:** Folosit ca safety net ultim. NU baza dependențe critice pe el.
```

### Test imediat

```powershell
# Verifică docs.apifreellm.com pentru endpoint exact (API documentation)
$body = @{
  model = "default"
  messages = @(@{ role = "user"; content = "Reply OK" })
} | ConvertTo-Json
# Endpoint TBD din docs:
Invoke-RestMethod -Method POST -Uri "https://apifreellm.com/api/v1/chat/completions" `
    -Headers @{ Authorization = "Bearer $env:APIFREELLM_TOKEN"; "Content-Type" = "application/json" } `
    -Body $body
```

### Note

- ⚠ **Stabilitate incertă** — verifică [docs](https://www.apifreellm.com/docs) pentru endpoint exact înainte de integrare
- ⚠ **Quality unknown** — testează cu use-case real înainte de a integra în chain critic
- NU folosi ca primary; NU folosi pentru date sensibile
- Rotation: la suspiciune de leak

### Link-uri rapide

- 🔧 [Signup](https://apifreellm.com/)
- 📚 [Docs](https://www.apifreellm.com/docs)
- 📊 (Dashboard variază — verifică după signup)

---

## 9. Perplexity API — RECOMANDAT search-grounded ⭐⭐

### Ce câștigi

- **Modele Sonar** (small/large) cu **search web încorporat** — răspunsuri cu citations live
- **$5 credit signup** + Sonar small **gratis NELIMITAT** pentru free tier
- Util pentru drug interaction lookup în Mami_Docs (RxNorm + medical literature search)

### Prerequisites

- Cont Perplexity ([signup](https://www.perplexity.ai/) — Google/email, fără card pentru API tier)

### Pași (~3 min)

1. [Perplexity API Settings](https://www.perplexity.ai/settings/api)
2. **Generate API Key** → copy (`pplx-...`)
3. (Opțional) Setup billing dacă vrei modelele Sonar Pro după consumarea creditului

### Persistare INBOX.md

```markdown
### Perplexity API

- **Key:** <paste>
- **Env Var:** PERPLEXITY_API_KEY
- **Tip:** LLM Search-Grounded
- **Limita:** $5 credit + sonar-small gratis nelimitat
- **Base URL:** https://api.perplexity.ai/chat/completions
- **Note:** Răspunsuri cu citations din web. Util pentru lookup medical/factual real-time.
```

### Test

```powershell
$body = @{ model = "sonar"; messages = @(@{ role = "user"; content = "Ce e paracetamolul?" }) } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "https://api.perplexity.ai/chat/completions" `
    -Headers @{ Authorization = "Bearer $env:PERPLEXITY_API_KEY"; "Content-Type" = "application/json" } -Body $body
```

### Note

- Sonar small = grounded în web search live (folosește Brave Search backend)
- Latency: 2-5s (include search round-trip)
- Rate limit: 50 req/min free tier

### Link-uri

- 🔧 [API Keys](https://www.perplexity.ai/settings/api)
- 📚 [Docs](https://docs.perplexity.ai/)
- 📊 [Usage](https://www.perplexity.ai/settings/api)

---

## 10. Voyage AI — RECOMANDAT embeddings ⭐⭐

### Ce câștigi

- **200M tokens/lună gratis PERMANENT** pe `voyage-3` (cele mai bune embedding-uri din 2026, scor MTEB top-3)
- Recomandat oficial de Anthropic ca embedding provider preferat
- Multilingv (RO support nativ excellent), context 32K
- Înlocuiește/complementează Cohere/Gemini embed în chain-ul Mami_Docs RAG

### Prerequisites

- Cont Voyage ([signup](https://dash.voyageai.com/) — email, fără card)

### Pași (~3 min)

1. [Voyage Dashboard signup](https://dash.voyageai.com/)
2. Email verification → login
3. **API Keys** sectiune → **Create Key** → copy (`pa-...`)

### Persistare INBOX.md

```markdown
### Voyage AI

- **Key:** <paste>
- **Env Var:** VOYAGE_API_KEY
- **Tip:** Embeddings + Reranking
- **Limita:** 200M tokens/luna gratis (voyage-3 / voyage-3-lite)
- **Base URL:** https://api.voyageai.com/v1
- **Note:** Cele mai bune embedding-uri 2026 (recomandat de Anthropic). Multilingv RO. 32K ctx.
```

### Test

```powershell
$body = @{ input = @("Salut mami"); model = "voyage-3-lite" } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "https://api.voyageai.com/v1/embeddings" `
    -Headers @{ Authorization = "Bearer $env:VOYAGE_API_KEY"; "Content-Type" = "application/json" } -Body $body
```

### Note

- `voyage-3` = 1024-dim vector (high quality, default)
- `voyage-3-lite` = 512-dim (mai rapid, suficient pentru majoritatea cazurilor)
- `voyage-multilingual-2` = optimizat pentru limbi non-EN
- Are și **rerank API** (`rerank-2`) pentru îmbunătățire RAG post-search

### Link-uri

- 🔧 [API Keys](https://dash.voyageai.com/api-keys)
- 📚 [Docs](https://docs.voyageai.com/)
- 📊 [Usage](https://dash.voyageai.com/usage)

---

## 11. Nebius AI Studio — RELEVANT ⭐ ($1 + Llama 405B free)

### Ce câștigi

- **$1 credit signup** + acces gratuit la **Llama 3.3 405B Instruct**, **DeepSeek-R1**, Qwen 2.5 72B
- Inferență rapidă (servere EU — GDPR-compliant)
- OpenAI-compatible API

### Prerequisites

- Cont Nebius ([signup](https://nebius.com/services/studio) — email/Google, NU card pentru free)

### Pași (~3 min)

1. [Nebius Studio signup](https://studio.nebius.com/)
2. Verifică email → login
3. Header → `Settings → API Keys` → **Create Key** → copy

### Persistare

```markdown
### Nebius AI Studio

- **Key:** <paste>
- **Env Var:** NEBIUS_API_KEY
- **Tip:** LLM Multi-Model (frontier OS)
- **Limita:** $1 signup + free tier Llama 3.3 405B / DeepSeek-R1
- **Base URL:** https://api.studio.nebius.ai/v1
- **Note:** Servere EU (GDPR OK). OpenAI-compatible. Llama 405B BF16 precizie maximă.
```

### Test

```powershell
$body = @{ model = "meta-llama/Llama-3.3-70B-Instruct"; messages = @(@{ role = "user"; content = "Reply OK" }); max_tokens = 5 } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "https://api.studio.nebius.ai/v1/chat/completions" `
    -Headers @{ Authorization = "Bearer $env:NEBIUS_API_KEY"; "Content-Type" = "application/json" } -Body $body
```

### Note

- EU-hosted = GDPR-OK pentru date personale (mama)
- Throughput excellent: 50-100 tokens/sec pe Llama 70B
- Rate limit: 600 req/oră free tier

### Link-uri

- 🔧 [API Keys](https://studio.nebius.com/settings/api-keys)
- 📚 [Docs](https://docs.nebius.com/studio/inference/api)
- 📊 [Usage](https://studio.nebius.com/billing)

---

## 12. Lambda Inference — RELEVANT ⭐ ($5 credit + GPU edge)

### Ce câștigi

- **$5 credit signup** pentru `Llama 3.3 70B Instruct`, `Hermes 3` (modele OSS premium)
- Lambda Labs e provider GPU originar — inferență pe edge cu latență joasă
- OpenAI-compatible API

### Prerequisites

- Cont Lambda ([signup](https://cloud.lambdalabs.com/sign-up) — email + password)

### Pași (~3 min)

1. [Lambda Cloud signup](https://cloud.lambdalabs.com/sign-up)
2. Email verification → login
3. **API → API Keys** → **Generate Key** → copy

### Persistare

```markdown
### Lambda Inference

- **Key:** <paste>
- **Env Var:** LAMBDA_API_KEY
- **Tip:** LLM Inference (GPU edge)
- **Limita:** $5 credit signup
- **Base URL:** https://api.lambdalabs.com/v1
- **Note:** Llama 3.3 70B + Hermes 3. OpenAI-compatible. GPU edge low latency.
```

### Test

```powershell
$body = @{ model = "llama3.3-70b-instruct-fp8"; messages = @(@{ role = "user"; content = "Reply OK" }); max_tokens = 5 } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "https://api.lambdalabs.com/v1/chat/completions" `
    -Headers @{ Authorization = "Bearer $env:LAMBDA_API_KEY"; "Content-Type" = "application/json" } -Body $body
```

### Note

- Latency: 200-400ms pentru Llama 70B FP8
- Best pentru workload care cere GPU dedicat (custom fine-tune via Lambda Cloud)
- $5 ≈ 10M tokens output Llama 70B

### Link-uri

- 🔧 [API Keys](https://cloud.lambdalabs.com/api-keys)
- 📚 [Docs](https://docs.lambdalabs.com/cloud/inference-api/)
- 📊 [Billing](https://cloud.lambdalabs.com/billing)

---

## 13. AssemblyAI — RECOMANDAT STT ⭐⭐

### Ce câștigi

- **$50 credit signup** (~16h audio transcript pe `Universal-2`)
- **Speech-to-Text best-in-class** cu suport ro-RO + diarization (cine vorbește) + sentiment
- Webhooks pentru transcripts async, batch processing
- Util ca **fallback ULTRA-quality** pentru Mami_Docs Whisper chain (mama înregistrează jurnal vocal)

### Prerequisites

- Cont AssemblyAI ([signup](https://www.assemblyai.com/dashboard/signup) — email, fără card)

### Pași (~3 min)

1. [AssemblyAI signup](https://www.assemblyai.com/dashboard/signup)
2. Email verification → onboarding
3. Dashboard → cheia e generată automat → **Copy** (sau `Account → API Key`)

### Persistare

```markdown
### AssemblyAI

- **Key:** <paste>
- **Env Var:** ASSEMBLYAI_API_KEY
- **Tip:** STT Best-in-Class
- **Limita:** $50 credit signup (~16h audio Universal-2)
- **Base URL:** https://api.assemblyai.com/v2
- **Note:** Suport ro-RO + diarization + sentiment + summary. Webhooks async.
```

### Test (necesită fișier audio — folosește un sample public)

```powershell
$body = @{ audio_url = "https://storage.googleapis.com/aai-web-samples/news.mp3"; language_code = "ro" } | ConvertTo-Json
$resp = Invoke-RestMethod -Method POST -Uri "https://api.assemblyai.com/v2/transcript" `
    -Headers @{ authorization = $env:ASSEMBLYAI_API_KEY; "Content-Type" = "application/json" } -Body $body
Write-Host "Transcript ID: $($resp.id) | Status: $($resp.status)"
```

### Note

- Calitate top: ~5% WER pe RO (Whisper Large-v3: ~8% WER)
- $50 = 16h audio = mama poate înregistra 30 min/zi pentru ~32 zile
- Pricing post-credit: $0.12/oră audio Universal-2

### Link-uri

- 🔧 [API Key](https://www.assemblyai.com/app/api-keys)
- 📚 [Docs](https://www.assemblyai.com/docs/)
- 📊 [Usage](https://www.assemblyai.com/app/usage)

---

## 14. ElevenLabs — RECOMANDAT TTS ⭐⭐

### Ce câștigi

- **10.000 caractere/lună GRATIS PERMANENT** (~10 minute audio TTS lunar)
- **Voci ro-RO native** de calitate premium (mult superior Web Speech API)
- Voice cloning (clonezi vocea ta în 1 minut audio)
- Util pentru **mesaje vocale personalizate către mama** (ex: vocea lui Roland citindu-i meniu zilnic)

### Prerequisites

- Cont ElevenLabs ([signup](https://elevenlabs.io/sign-up) — email/Google)

### Pași (~3 min)

1. [ElevenLabs signup](https://elevenlabs.io/sign-up)
2. Email verification → onboarding (skip plan paid, alege Free)
3. **Profile dropdown (right top) → API Keys** → **Create New Secret Key** → copy

### Persistare

```markdown
### ElevenLabs

- **Key:** <paste>
- **Env Var:** ELEVENLABS_API_KEY
- **Tip:** TTS Premium
- **Limita:** 10.000 chars/luna gratis (free PERMANENT)
- **Base URL:** https://api.elevenlabs.io/v1
- **Note:** Voci ro-RO native. Voice cloning 1-min sample. Util pentru personalizare mesaje mama.
```

### Test (returnează audio binary — salvează în fișier)

```powershell
$body = @{ text = "Salut mama, e ora 8, ia pastila galbenă"; model_id = "eleven_multilingual_v2" } | ConvertTo-Json
Invoke-WebRequest -Method POST -Uri "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL" `
    -Headers @{ "xi-api-key" = $env:ELEVENLABS_API_KEY; "Content-Type" = "application/json" } -Body $body -OutFile "test_tts.mp3"
```

### Note

- Voice ID `EXAVITQu4vr4xnSDxMaL` = Sarah (default RO support); pentru voce custom clonezi în UI
- Free tier 10k chars/lună = ~50 mesaje scurte (200 chars fiecare) sau ~10 min audio
- Pentru mesaje cu vocea lui Roland: înregistrezi 1 min audio curat → upload în Voice Lab → primești voice_id

### Link-uri

- 🔧 [API Keys](https://elevenlabs.io/app/settings/api-keys)
- 📚 [Docs](https://elevenlabs.io/docs)
- 📊 [Usage](https://elevenlabs.io/app/subscription)

---

## 15. Cartesia — RELEVANT TTS ultra-low latency ⭐

### Ce câștigi

- **Sonic-2** = TTS sub 75ms latency (cel mai rapid din lume 2026)
- Free tier credite signup + voci pre-built
- Util pentru **TTS conversațional real-time** (răspunsuri AI rostite la mama în <100ms)

### Prerequisites

- Cont Cartesia ([signup](https://play.cartesia.ai/) — email/Google)

### Pași (~3 min)

1. [Cartesia signup](https://play.cartesia.ai/sign-up)
2. Email verification → playground
3. **Profile → API Keys** → **Create Key** → copy

### Persistare

```markdown
### Cartesia

- **Key:** <paste>
- **Env Var:** CARTESIA_API_KEY
- **Tip:** TTS Ultra-Low-Latency
- **Limita:** Free tier signup credits
- **Base URL:** https://api.cartesia.ai/v1
- **Note:** Sonic-2 sub 75ms. Stream audio. Folosit pentru TTS conversational real-time.
```

### Test

```powershell
$body = @{ model_id = "sonic-2"; transcript = "Salut mama"; voice = @{ mode = "id"; id = "<VOICE_ID>" }; output_format = @{ container = "wav"; encoding = "pcm_f32le"; sample_rate = 44100 } } | ConvertTo-Json -Depth 5
Invoke-WebRequest -Method POST -Uri "https://api.cartesia.ai/tts/bytes" `
    -Headers @{ "X-API-Key" = $env:CARTESIA_API_KEY; "Cartesia-Version" = "2024-06-10"; "Content-Type" = "application/json" } -Body $body -OutFile "test.wav"
```

### Note

- Cei mai rapizi TTS din 2026 (Sonic-2 < 75ms time-to-first-byte)
- Excellent pentru voice agents conversaționali (turn-taking natural)
- Pricing post-free: $0.05/1M chars (printre cei mai ieftini)

### Link-uri

- 🔧 [API Keys](https://play.cartesia.ai/keys)
- 📚 [Docs](https://docs.cartesia.ai/)
- 📊 [Usage](https://play.cartesia.ai/usage)

---

## 16. Fal.ai — RELEVANT image generation ⭐

### Ce câștigi

- **$10 credit signup** + Flux Schnell free tier
- Generare imagini ultra-rapidă (Flux Schnell = ~1 sec)
- Modele: Flux Pro/Dev/Schnell, SD3.5, Stable Cascade, Recraft
- Util pentru **ilustrații povești seara** sau **avatar mama personalizat** în Mami_Docs

### Prerequisites

- Cont Fal.ai ([signup](https://fal.ai/login) — GitHub/Google/email)

### Pași (~3 min)

1. [Fal.ai signup](https://fal.ai/login)
2. Auth via GitHub (recomandat)
3. **Dashboard → API Keys** → **Add Key** → copy (`<token>`)

### Persistare

```markdown
### Fal.ai

- **Key:** <paste>
- **Env Var:** FAL_API_KEY
- **Tip:** Image Generation
- **Limita:** $10 credit + Flux Schnell free tier
- **Base URL:** https://fal.run
- **Note:** Flux Schnell ~1s/imagine. Util pentru ilustrații povești mama.
```

### Test

```powershell
$body = @{ prompt = "o pisica cu palarie rosie"; image_size = "square_hd" } | ConvertTo-Json
$resp = Invoke-RestMethod -Method POST -Uri "https://fal.run/fal-ai/flux/schnell" `
    -Headers @{ Authorization = "Key $env:FAL_API_KEY"; "Content-Type" = "application/json" } -Body $body
Write-Host "Image URL: $($resp.images[0].url)"
```

### Note

- Flux Schnell free tier = ~1000 imagini/lună (sufficient pentru hobby)
- Webhooks pentru long jobs async
- Suport video (LTX-Video) + audio (TTS) în model catalog

### Link-uri

- 🔧 [API Keys](https://fal.ai/dashboard/keys)
- 📚 [Docs](https://fal.ai/docs)
- 📊 [Usage](https://fal.ai/dashboard/usage)

---

## 17. Hume AI — UNIC emotion analysis ⭐⭐

### Ce câștigi

- **Emotion AI** unic — detectează emoții din voce (38 categorii) + expresii faciale (vision) + text sentiment
- **Free dev tier** ~10.000 minute audio analysis/lună
- Util ULTRA-relevant pentru Mami_Docs Wellness — **detectează automat dispoziția mamei** când înregistrează jurnal vocal (tristețe / anxietate / bucurie etc.)
- Empathic Voice Interface (EVI) — chat conversational care răspunde la emoția user-ului

### Prerequisites

- Cont Hume ([signup](https://platform.hume.ai/sign-up) — email)

### Pași (~3 min)

1. [Hume signup](https://platform.hume.ai/sign-up)
2. Email verification → onboarding (alege "Build with Hume APIs")
3. **API Keys page** → **Create new key** → copy (`<key>`)
4. (Opțional) Pentru EVI: **Config → Create voice config** cu voce custom

### Persistare

```markdown
### Hume AI

- **Key:** <paste>
- **Env Var:** HUME_API_KEY
- **Tip:** Emotion AI (Voice/Face/Text)
- **Limita:** ~10k min audio/luna dev tier
- **Base URL:** https://api.hume.ai/v0
- **Note:** Detectie emotii din voce mama (relevant Wellness). 38 categorii sentiment.
```

### Test

```powershell
$body = @{ models = @{ prosody = @{} }; transcription = @{ language = "ro" }; urls = @("https://hume-tutorials.s3.amazonaws.com/faces.zip") } | ConvertTo-Json -Depth 5
$resp = Invoke-RestMethod -Method POST -Uri "https://api.hume.ai/v0/batch/jobs" `
    -Headers @{ "X-Hume-Api-Key" = $env:HUME_API_KEY; "Content-Type" = "application/json" } -Body $body
Write-Host "Job ID: $($resp.job_id)"
```

### Note

- **Use-case Mami_Docs:** mama spune "azi mă simt rău" → Hume detectează `Sadness:0.7, Anxiety:0.5` → admin Roland primește alertă cu prioritate ridicată
- 38 emoții detectate (vs 7 standard) — granularitate utilă pentru pattern detection wellness
- EVI pentru chat empatic real-time (alternative la chat-ul text-based)

### Link-uri

- 🔧 [API Keys](https://platform.hume.ai/settings/keys)
- 📚 [Docs](https://dev.hume.ai/docs/)
- 📊 [Playground](https://platform.hume.ai/playground)

---

## 18. Resend — RECOMANDAT email ⭐⭐

### Ce câștigi

- **3000 emails/lună + 100/zi GRATIS PERMANENT** (free tier real, nu trial)
- API modern (TypeScript-first), Markdown / React Email support
- Domain custom verificat în 5 minute (DKIM/SPF auto)
- Util pentru **alerte admin Roland** (storage 80%, errors, weekly digest mama)

### Prerequisites

- Cont Resend ([signup](https://resend.com/signup) — email/GitHub)
- (Opțional) Domeniu propriu pentru `from: noreply@<domeniu>.com` (altfel folosești `onboarding@resend.dev`)

### Pași (~5 min cu domeniu / 3 min fără)

1. [Resend signup](https://resend.com/signup)
2. Email verification → onboarding
3. **API Keys → Create API Key** → permission `Sending access` → copy (`re_...`)
4. (Opțional cu domeniu custom) **Domains → Add Domain** → adaugă DNS records (DKIM/SPF) → wait verify

### Persistare

```markdown
### Resend

- **Key:** <paste>
- **Env Var:** RESEND_API_KEY
- **Tip:** Email API Modern
- **Limita:** 3000 emails/luna + 100/zi PERMANENT
- **Base URL:** https://api.resend.com
- **Note:** From: onboarding@resend.dev (default) sau noreply@<domeniu> dacă verificat. Markdown/React.
```

### Test

```powershell
$body = @{ from = "onboarding@resend.dev"; to = @("petrilarolly@gmail.com"); subject = "Test Mami_Docs"; html = "<p>Salut Roland!</p>" } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "https://api.resend.com/emails" `
    -Headers @{ Authorization = "Bearer $env:RESEND_API_KEY"; "Content-Type" = "application/json" } -Body $body
```

### Note

- Folosește pentru: alerte storage 80%, weekly digest wellness mama, error reports
- Combinare cu Telegram Bot existent (deja în Mami_Docs) → multi-channel admin notifications
- Webhook events pentru bounce/spam tracking

### Link-uri

- 🔧 [API Keys](https://resend.com/api-keys)
- 📚 [Docs](https://resend.com/docs/introduction)
- 📊 [Usage](https://resend.com/dashboard)

---

## 19. Sentry — RECOMANDAT error monitoring ⭐⭐

### Ce câștigi

- **5.000 errors + 10.000 transactions performance/lună GRATIS** (Developer plan)
- Source maps + breadcrumbs + release tracking + Slack/Telegram alerts
- Critical pentru **stabilitate Mami_Docs production** (mama deschide PWA, ceva pică, primești instant alertă cu stack trace exact)
- Suport Vite plugin oficial + Cloudflare Workers SDK

### Prerequisites

- Cont Sentry ([signup](https://sentry.io/signup/) — email/Google/GitHub)

### Pași (~5 min)

1. [Sentry signup](https://sentry.io/signup/)
2. **Create new project** → platform: `JavaScript (Vite)` sau `Cloudflare Workers`
3. **Project name:** `mami-docs` → **Create**
4. Sentry afișează DSN (`https://<key>@o<orgid>.ingest.sentry.io/<projectid>`) → **Copy**

### Persistare

```markdown
### Sentry

- **Key:** <paste_DSN>
- **Env Var:** SENTRY_DSN
- **Tip:** Error Monitoring + Performance
- **Limita:** 5k errors + 10k transactions/luna gratis
- **Base URL:** (DSN-specific)
- **Note:** Vite plugin official. CF Workers SDK. Project: mami-docs.
```

### Test (în cod Vite frontend)

```javascript
import * as Sentry from "@sentry/browser";
Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN });
Sentry.captureException(new Error("Test from Mami_Docs setup"));
```

Verifică în [Sentry Issues](https://sentry.io/organizations/_/issues/) că eroarea apare.

### Note

- Setup Vite: `npm install @sentry/vite-plugin --save-dev` + config în `vite.config.ts`
- Setup CF Worker: `import { Sentry } from "@sentry/cloudflare"` (SDK separat)
- Free tier suficient pentru ~50 users activi (Mami_Docs are 1-2)
- Combinare cu existing logger din `ai-gateway` worker → toate erorile centralizate

### Link-uri

- 🔧 [Create project](https://sentry.io/organizations/_/projects/new/)
- 📚 [Docs Vite](https://docs.sentry.io/platforms/javascript/guides/vite/) | [Docs CF Workers](https://docs.sentry.io/platforms/javascript/guides/cloudflare/)
- 📊 [Issues dashboard](https://sentry.io/issues/)

---

## 20. Neon Postgres — RELEVANT DB alternativ ⭐ (500MB free permanent)

### Ce câștigi

- **500MB DB + 100h compute + branching git-like GRATIS PERMANENT**
- Postgres 16 cu pgvector pre-instalat
- **Scale-to-zero** (zero cost când inactiv)
- Util ca **fallback Supabase** sau pentru **dev/preview branches** Mami_Docs

### Prerequisites

- Cont Neon ([signup](https://console.neon.tech/signup) — GitHub/Google/email)

### Pași (~3 min)

1. [Neon signup](https://console.neon.tech/signup)
2. **Create your first project** → name `mami-docs-dev` → region `Frankfurt (eu-central-1)`
3. Postgres version `16` → **Create project**
4. Dashboard afișează **Connection string** → copy (`postgresql://<user>:<pass>@<host>/<db>`)

### Persistare

```markdown
### Neon Postgres

- **Key:** <paste_connection_string>
- **Env Var:** NEON_DATABASE_URL
- **Tip:** Postgres Serverless
- **Limita:** 500MB + 100h compute/luna gratis PERMANENT
- **Base URL:** (în connection string)
- **Note:** Postgres 16 + pgvector. Branching git-like. Scale-to-zero. Frankfurt EU.
```

### Test (necesită psql instalat sau folosește Node.js cu `pg`)

```powershell
psql $env:NEON_DATABASE_URL -c "SELECT version();"
```

### Note

- **Branching unic:** creezi branch DB pentru dev/staging fără cost extra (vs Supabase care necesită proiecte separate)
- Compute pause după 5 min inactivitate (cold start ~500ms)
- pgvector pre-instalat (`CREATE EXTENSION vector;`) — direct embedding-uri RAG
- Combinare cu Mami_Docs: branch `mami-docs-staging` pentru testare migration-uri înainte de prod

### Link-uri

- 🔧 [Create project](https://console.neon.tech/app/projects)
- 📚 [Docs](https://neon.tech/docs)
- 📊 [Console](https://console.neon.tech/)

---

## 📋 Sumar acțiuni admin (max 60 min total pentru toate 20)

| #   | Provider         | Timp estimat | Link tap-direct                                                              | Prioritate adăugare             |
| --- | ---------------- | ------------ | ---------------------------------------------------------------------------- | ------------------------------- |
| 1   | Z.ai             | 5 min        | [API Keys](https://z.ai/manage-apikey/apikey-list)                           | ⭐⭐ Imediat                    |
| 2   | Alibaba Qwen     | 7 min        | [API Keys](https://modelstudio.console.alibabacloud.com/?tab=model#/api-key) | ⭐⭐ Imediat                    |
| 3   | Reka AI          | 4 min        | [API Keys](https://platform.reka.ai/apikeys)                                 | ⭐⭐ Imediat (recurring lunar!) |
| 4   | AI21             | 3 min        | [API Key](https://studio.ai21.com/account/api-key)                           | ⭐ Long-context                 |
| 5   | Together AI      | 3 min        | [API Keys](https://api.together.ai/settings/api-keys)                        | ⭐ Catalog mare                 |
| 6   | DeepInfra        | 3 min        | [API Keys](https://deepinfra.com/dash/api_keys)                              | ⭐ Latency bună                 |
| 7   | Pollinations     | 0-3 min      | (anonim funcționează direct)                                                 | 🆓 Safety net                   |
| 8   | ApiFreeLLM       | 3 min        | [Signup](https://apifreellm.com/)                                            | ⚠ Cu rezerve                    |
| 9   | Perplexity API   | 3 min        | [API](https://www.perplexity.ai/settings/api)                                | ⭐⭐ Search-grounded medical    |
| 10  | Voyage AI        | 3 min        | [Dashboard](https://dash.voyageai.com/)                                      | ⭐⭐ Embed best 2026            |
| 11  | Nebius AI        | 3 min        | [Studio](https://studio.nebius.com/)                                         | ⭐ Llama 405B EU GDPR           |
| 12  | Lambda Inference | 3 min        | [Cloud](https://cloud.lambdalabs.com/sign-up)                                | ⭐ GPU edge $5                  |
| 13  | AssemblyAI       | 3 min        | [Signup](https://www.assemblyai.com/dashboard/signup)                        | ⭐⭐ STT $50 ro-RO              |
| 14  | ElevenLabs       | 3 min        | [Signup](https://elevenlabs.io/sign-up)                                      | ⭐⭐ TTS RO 10k chars/lună      |
| 15  | Cartesia         | 3 min        | [Playground](https://play.cartesia.ai/sign-up)                               | ⭐ TTS sub 75ms                 |
| 16  | Fal.ai           | 3 min        | [Signup](https://fal.ai/login)                                               | ⭐ Image gen $10 + Flux         |
| 17  | Hume AI          | 3 min        | [Platform](https://platform.hume.ai/sign-up)                                 | ⭐⭐ Emotion AI Wellness mama   |
| 18  | Resend           | 3 min        | [Signup](https://resend.com/signup)                                          | ⭐⭐ Email 3k/lună permanent    |
| 19  | Sentry           | 5 min        | [Signup](https://sentry.io/signup/)                                          | ⭐⭐ Error monitoring           |
| 20  | Neon Postgres    | 3 min        | [Signup](https://console.neon.tech/signup)                                   | ⭐ DB alt 500MB permanent       |

**Recomandarea mea de ordine:**

1. **Pornește cu #1, #2, #3** (cele 3 ⭐⭐) — valoare maximă, free permanent / recurring / unic
2. **Continuă cu #4, #5, #6** dacă ai timp — diversitate modele OS + long-context
3. **#7 Pollinations** îl adaugi la sfârșit (sau folosești anonim direct fără token) — safety net
4. **#8 ApiFreeLLM** — opțional, doar dacă vrei un strat ultim incert

---

## 🎯 După ce obții token-urile — proces standard

Pentru fiecare cheie obținută:

1. **Lipește în INBOX.md** cu Format 3 (vezi exemple per provider mai sus)
2. **Deschide Claude Code** în `C:\Users\ALIENWARE\.api-keys\`
3. **Spune** `proceseaza inbox` → AI procesează:
   - Adaugă în master file
   - Setează Windows User env var
   - Regenerează `catalog.md`
   - Marchează `[PROCESAT YYYY-MM-DD]` în INBOX
4. **Pentru integrare în Mami_Docs AI Gateway** — anunță-mă (Claude într-o sesiune Mami_Docs):
   - Ex: _"Z.ai e setat, integrează ca fallback în chat chain"_
   - Eu adaug funcția `callZaiChat()`, actualizez `CHAT_PROVIDERS`, deploy worker
5. **Toate operațiunile sunt automatizate** — admin face DOAR pașii fizici (creare cont + click "Generate token")

---

## 📊 Comparație finală — capacități acoperite cu adăugarea celor 20

### Înainte (chain chat actual mami-docs-ai)

```
groq-8b → sambanova-70b → cerebras-70b → xai-grok-mini → mistral-large → github-gpt4o-mini → openrouter-free
(7 providere, ~7K req/zi cumulat free)
```

### După (potențial cu cele 8 noi adăugate)

```
groq-8b → sambanova-70b → cerebras-70b → xai-grok-mini → mistral-large
  → github-gpt4o-mini → zai-glm-flash → qwen-plus → reka-flash
  → ai21-jamba-mini → together-llama-405b → deepinfra-llama-70b
  → pollinations-anonim → apifreellm → openrouter-free
(15 providere, ~50K+ req/zi cumulat free, 256K ctx max, frontier+OS-mix)
```

**Beneficii cumulate:**

- 🛡 **Resilience** — 15 straturi fallback (vs 7 actual) → chat chain virtual indestructibil
- 💰 **Zero cost** — toate gratuite (cu mențiunea Reka recurring lunar)
- 🎯 **Diversitate** — frontier (GPT-5/Grok-3-mini/Claude proxy) + OS (Llama/Qwen/DeepSeek-R1) + multimodal (Reka)
- 📐 **Long-context** — 256K via AI21 Jamba pentru jurnale wellness extensive
- 🌍 **Geografic split** — US (GitHub/AI21/Together/DeepInfra) + EU (Mistral) + Asia (Z.ai/Qwen) + Decentralized (Pollinations)

**Mențiuni GDPR pentru date medicale Mami_Docs:**

- ⛔ **NU folosi pentru date mama:** Z.ai (China), Qwen (Asia infra), Pollinations (proxy), ApiFreeLLM (incert)
- ✅ **OK pentru date personale:** Reka, AI21, Together, DeepInfra (US/EU servers, GDPR-compliant tier)
- ✅ **OK pentru toate:** providere existente Mami_Docs (Groq/SambaNova/Cerebras/Mistral/Cohere/Gemini)

---

**Versiune ghid:** 3.0 | **Data:** 2026-05-06 | **Sursă:** `API_de_adaugat.md` TOP 10 + research web 2026-05 (12 servicii adiționale: Perplexity/Voyage/Nebius/Lambda/AssemblyAI/ElevenLabs/Cartesia/Fal/Hume/Resend/Sentry/Neon)

## 🎁 Bonus — Matrix capabilități acoperite (deținute + cele 20 noi)

| Capabilitate             | Înainte (deținute existing)                                      | După adăugare 20 noi                                               |
| ------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Chat LLM frontier**    | Anthropic, OpenAI, xAI Grok, GitHub Models                       | + Reka, Z.ai, Qwen, Perplexity (search), AI21 (256K)               |
| **Chat LLM OS**          | Groq, SambaNova, Cerebras, NVIDIA, Mistral, OpenRouter, DeepSeek | + Together (200+), DeepInfra, Nebius, Lambda, ApiFreeLLM           |
| **Embeddings**           | Gemini, Cohere, Mistral, Jina                                    | + **Voyage** (best-in-class 2026, 200M tokens free)                |
| **STT**                  | Groq Whisper, CF Workers AI Whisper                              | + **AssemblyAI** (best ro-RO ~5% WER)                              |
| **TTS**                  | Web Speech API native                                            | + **ElevenLabs** (voci RO premium), Cartesia (sub 75ms)            |
| **Image generation**     | (none)                                                           | + **Fal.ai** (Flux Schnell ~1s/imagine)                            |
| **Vision/OCR**           | Tesseract, Gemini, Mistral, Azure Doc Intel                      | (suficient existent)                                               |
| **Search web**           | Brave, Tavily, Jina                                              | + Perplexity (Sonar grounded)                                      |
| **Translate**            | DeepL ×2, Azure ×2, Gemini                                       | (suficient existent)                                               |
| **Emotion AI**           | (none)                                                           | + **Hume AI** (38 categorii voce/față — UNIC pentru Wellness mama) |
| **Proxy fără signup**    | (none)                                                           | + Pollinations (GPT-5/Claude/Gemini anonim)                        |
| **Email API**            | Telegram Bot, ntfy, CallMeBot                                    | + **Resend** (3k emails/lună permanent)                            |
| **Error monitoring**     | (none — log only)                                                | + **Sentry** (5k errors + perf tracking)                           |
| **DB Postgres**          | Supabase                                                         | + **Neon** (500MB + branching, scale-to-zero)                      |
| **Recurring credits**    | (none)                                                           | + **Reka** ($10 lunar resetabil — UNIC)                            |
| **Long-context (>200K)** | OpenRouter rotation                                              | + **AI21 Jamba 1.5** (256K nativ)                                  |

> Pentru blueprint universal de obținere credențiale (orice serviciu, nu doar AI), vezi `~/.claude/blueprints/CREDENTIALS_ACQUISITION_GUIDE.md`.
