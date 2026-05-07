# Ghid Pas-cu-Pas — Credențiale ce trebuie obținute manual (v8 - 2026-05-07)

> **Versiune 8** - Reka AI integrat 2026-05-07 (eliminat din lista). Fisierul contine **14 servicii pending signup manual**.
> Status chei deja obținute → vezi `~/.api-keys/catalog.md` (rulează `verify.ps1` pentru status).
> Servicii respinse / cu echivalent automat → mutate în `~/.claude/projects/C--Proiecte-Mami-Docs/memory/system_no_key_services.md`.
>
> **Criterii admin (obligatoriu simultan):**
> 1. **Necesită semnare manuală** (signup + click "Generate API Key" — pași fizici imposibili pentru AI)
> 2. **Au free tier LUNAR / PERMANENT** (NU trial one-shot care expiră) — *"daca imi ofera doar pt 30 zile nu le vreau, mie imi trebuie lunar sa fie functionale"*
>
> **La fiecare serviciu am adăugat un bloc `📥 TEMPLATE` la final** — copiezi blocul, înlocuiești `<paste...>` cu valoarea reală, lipești în `~/.api-keys/INBOX.md`, scrii `proceseaza inbox` în Claude Code din `.api-keys`. Restul (Windows env var + catalog + worker secret + integrare AI Gateway) îl fac eu automat.

---

## 🆕 TOP 14 servicii — necesită signup manual + tier permanent

| Cat              | #  | Provider           | Free tier permanent             | Env var propus                      |
| ---------------- | -- | ------------------ | ------------------------------- | ----------------------------------- |
| **LLM**          | 2  | Perplexity         | Sonar gratis nelimitat + $5     | `PERPLEXITY_API_KEY`                |
|                  | 3  | Voyage AI          | 200M tokens/lună embed          | `VOYAGE_API_KEY`                    |
| **Speech**       | 4  | ElevenLabs         | 10k chars/lună permanent        | `ELEVENLABS_API_KEY`                |
| **Multimodal**   | 5  | Hume AI            | 10k min/lună emotion analysis   | `HUME_API_KEY`                      |
| **Email**        | 6  | Resend             | 3000 emails/lună permanent      | `RESEND_API_KEY`                    |
| **Monitoring**   | 7  | Sentry             | 5k errors + 10k tx/lună         | `SENTRY_DSN`                        |
| **DB**           | 8  | Neon Postgres      | 500MB + branching permanent     | `NEON_DATABASE_URL`                 |
| **Image**        | 9  | Leonardo.AI        | 1500-2250 imagini/lună          | `LEONARDO_API_KEY`                  |
|                  | 10 | Ideogram           | 1200 imagini/lună (text-best)   | `IDEOGRAM_API_KEY`                  |
|                  | 11 | Adobe Firefly      | 25 credits/lună commercial      | `FIREFLY_CLIENT_ID` + `_SECRET`     |
| **Video**        | 12 | Luma Dream Machine | 30 video gens/lună              | `LUMA_API_KEY`                      |
| **Audio**        | 13 | Fish Audio         | Free permanent + 2M voci RO     | `FISHAUDIO_API_KEY`                 |
| **Talking head** | 14 | D-ID               | 5 min video/lună                | `DID_API_KEY`                       |
| **3D**           | 15 | Meshy AI           | 200 credits/lună permanent      | `MESHY_API_KEY`                     |

**Timp total semnare manuală:** ~50 min pentru toate 15 (~3-5 min fiecare).

---

## 📥 Workflow standard (după ce obții o cheie)

1. Copiezi blocul `TEMPLATE` de la finalul serviciului
2. Înlocuiești `<paste...>` cu valoarea reală
3. Lipești blocul în `C:\Users\ALIENWARE\.api-keys\INBOX.md`
4. Deschizi Claude Code în `C:\Users\ALIENWARE\.api-keys\` și scrii `proceseaza inbox`
5. **Eu fac restul automat** (master + Windows env var + catalog + worker secret + AI Gateway integration)

---

## 2. Perplexity API ⭐⭐ — search-grounded medical lookup

### Ce câștigi

- **Sonar small gratis NELIMITAT PERMANENT** + $5 credit signup pentru Sonar large
- Modele Sonar cu **search web încorporat** — răspunsuri cu citations live
- Util pentru drug interaction lookup în Mami_Docs (RxNorm + medical literature)

### Pași (~3 min)

1. [Perplexity signup](https://www.perplexity.ai/) → Google/email
2. [API Settings](https://www.perplexity.ai/settings/api) → **Generate API Key** → copy (`pplx-...`)

### Test

```powershell
$body = @{ model = "sonar"; messages = @(@{ role = "user"; content = "Ce e paracetamolul?" }) } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "https://api.perplexity.ai/chat/completions" `
    -Headers @{ Authorization = "Bearer $env:PERPLEXITY_API_KEY"; "Content-Type" = "application/json" } -Body $body
```

### Note

- Sonar small = grounded în web search live (Brave backend)
- Latency: 2-5s | Rate limit: 50 req/min

### 📥 TEMPLATE — completare credențiale

```markdown
### Perplexity API

- **Key:** <paste_pplx_key_here>
- **Env Var:** PERPLEXITY_API_KEY
- **Tip:** LLM Search-Grounded
- **Limita:** Sonar small gratis nelimitat PERMANENT + $5 credit
- **Base URL:** https://api.perplexity.ai/chat/completions
- **Note:** Răspunsuri cu citations din web. Util pentru lookup medical/factual real-time.
```

---

## 3. Voyage AI ⭐⭐ — embeddings best-in-class 2026

### Ce câștigi

- **200M tokens/lună GRATIS PERMANENT** pe `voyage-3`
- Cele mai bune embedding-uri 2026 (top-3 MTEB) — recomandat oficial Anthropic
- Multilingv RO nativ excellent, context 32K
- Rerank API pentru îmbunătățire RAG post-search

### Pași (~3 min)

1. [Voyage Dashboard](https://dash.voyageai.com/) → email signup
2. **API Keys** → **Create Key** → copy (`pa-...`)

### Test

```powershell
$body = @{ input = @("Salut mami"); model = "voyage-3-lite" } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "https://api.voyageai.com/v1/embeddings" `
    -Headers @{ Authorization = "Bearer $env:VOYAGE_API_KEY"; "Content-Type" = "application/json" } -Body $body
```

### Note

- `voyage-3` = 1024-dim default | `voyage-3-lite` = 512-dim rapid
- `voyage-multilingual-2` optimizat non-EN | `rerank-2` pentru reranking RAG

### 📥 TEMPLATE — completare credențiale

```markdown
### Voyage AI

- **Key:** <paste_voyage_key_here>
- **Env Var:** VOYAGE_API_KEY
- **Tip:** Embeddings + Reranking
- **Limita:** 200M tokens/luna gratis PERMANENT (voyage-3 / voyage-3-lite)
- **Base URL:** https://api.voyageai.com/v1
- **Note:** Best embeddings 2026 (recomandat Anthropic). Multilingv RO. 32K ctx.
```

---

## 4. ElevenLabs ⭐⭐ — TTS premium voci RO

### Ce câștigi

- **10.000 caractere/lună GRATIS PERMANENT** (~10 min audio TTS lunar)
- Voci ro-RO native premium (mult superior Web Speech API)
- Voice cloning din 1 minut audio
- Util pentru mesaje vocale personalizate către mama

### Pași (~3 min)

1. [ElevenLabs signup](https://elevenlabs.io/sign-up) → email/Google
2. Email verification → onboarding (skip plan paid → Free)
3. **Profile → API Keys** → **Create New Secret Key** → copy

### Test (returnează audio binary)

```powershell
$body = @{ text = "Salut mama, e ora 8, ia pastila galbenă"; model_id = "eleven_multilingual_v2" } | ConvertTo-Json
Invoke-WebRequest -Method POST -Uri "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL" `
    -Headers @{ "xi-api-key" = $env:ELEVENLABS_API_KEY; "Content-Type" = "application/json" } -Body $body -OutFile "test.mp3"
```

### Note

- Voice ID `EXAVITQu4vr4xnSDxMaL` = Sarah (default RO support)
- 10k chars/lună = ~50 mesaje scurte sau ~10 min audio
- Pentru voce custom Roland: înregistrezi 1 min audio curat → upload Voice Lab → primești voice_id

### 📥 TEMPLATE — completare credențiale

```markdown
### ElevenLabs

- **Key:** <paste_elevenlabs_key_here>
- **Env Var:** ELEVENLABS_API_KEY
- **Tip:** TTS Premium
- **Limita:** 10.000 chars/luna gratis PERMANENT
- **Base URL:** https://api.elevenlabs.io/v1
- **Note:** Voci ro-RO native. Voice cloning 1-min sample. Util pentru personalizare mesaje mama.
```

---

## 5. Hume AI ⭐⭐ — Emotion AI UNIC pentru Wellness mama

### Ce câștigi

- **Emotion AI unic** — detectează emoții din voce (38 categorii) + expresii faciale + text sentiment
- **Free dev tier** ~10.000 minute audio analysis/lună permanent
- Util ULTRA-relevant Mami_Docs Wellness — detectează automat dispoziția mamei
- Empathic Voice Interface (EVI) — chat conversational care răspunde la emoția user-ului

### Pași (~3 min)

1. [Hume signup](https://platform.hume.ai/sign-up) → email
2. Email verification → onboarding (alege "Build with Hume APIs")
3. **API Keys** → **Create new key** → copy

### Test

```powershell
$body = @{ models = @{ prosody = @{} }; transcription = @{ language = "ro" }; urls = @("https://hume-tutorials.s3.amazonaws.com/faces.zip") } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Method POST -Uri "https://api.hume.ai/v0/batch/jobs" `
    -Headers @{ "X-Hume-Api-Key" = $env:HUME_API_KEY; "Content-Type" = "application/json" } -Body $body
```

### Note

- **Use-case:** mama spune "azi mă simt rău" → Hume detectează `Sadness:0.7, Anxiety:0.5` → admin Roland primește alertă
- 38 emoții (vs 7 standard) — granularitate utilă pattern detection wellness

### 📥 TEMPLATE — completare credențiale

```markdown
### Hume AI

- **Key:** <paste_hume_key_here>
- **Env Var:** HUME_API_KEY
- **Tip:** Emotion AI (Voice/Face/Text)
- **Limita:** ~10k min audio/luna dev tier permanent
- **Base URL:** https://api.hume.ai/v0
- **Note:** Detectie emotii din voce mama (relevant Wellness). 38 categorii sentiment.
```

---

## 6. Resend ⭐⭐ — Email API modern

### Ce câștigi

- **3000 emails/lună + 100/zi GRATIS PERMANENT**
- API modern (TypeScript-first), Markdown / React Email support
- Domain custom verificat în 5 minute (DKIM/SPF auto)
- Util pentru alerte admin Roland (storage 80%, errors, weekly digest mama)

### Pași (~5 min cu domeniu / 3 min fără)

1. [Resend signup](https://resend.com/signup) → email/GitHub
2. **API Keys → Create API Key** → permission `Sending access` → copy (`re_...`)
3. (Opțional cu domeniu) **Domains → Add Domain** → DNS records (DKIM/SPF) → wait verify

### Test

```powershell
$body = @{ from = "onboarding@resend.dev"; to = @("petrilarolly@gmail.com"); subject = "Test"; html = "<p>Salut!</p>" } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "https://api.resend.com/emails" `
    -Headers @{ Authorization = "Bearer $env:RESEND_API_KEY"; "Content-Type" = "application/json" } -Body $body
```

### Note

- Folosește pentru: alerte storage 80%, weekly digest wellness mama, error reports
- Combinare cu Telegram Bot existent → multi-channel admin notifications

### 📥 TEMPLATE — completare credențiale

```markdown
### Resend

- **Key:** <paste_resend_key_here>
- **Env Var:** RESEND_API_KEY
- **Tip:** Email API Modern
- **Limita:** 3000 emails/luna + 100/zi PERMANENT
- **Base URL:** https://api.resend.com
- **Note:** From: onboarding@resend.dev (default) sau noreply@<domeniu>. Markdown/React.
```

---

## 7. Sentry ⭐⭐ — Error monitoring + performance

### Ce câștigi

- **5.000 errors + 10.000 transactions/lună GRATIS PERMANENT**
- Source maps + breadcrumbs + release tracking + Slack/Telegram alerts
- Critical pentru stabilitate Mami_Docs production
- Suport Vite plugin oficial + Cloudflare Workers SDK

### Pași (~5 min)

1. [Sentry signup](https://sentry.io/signup/) → email/Google/GitHub
2. **Create new project** → platform: `JavaScript (Vite)` sau `Cloudflare Workers`
3. Project name: `mami-docs` → **Create**
4. Sentry afișează DSN → **Copy**

### Test

```javascript
import * as Sentry from "@sentry/browser";
Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN });
Sentry.captureException(new Error("Test"));
```

### Note

- Setup Vite: `npm install @sentry/vite-plugin --save-dev`
- Setup CF Worker: `import { Sentry } from "@sentry/cloudflare"`

### 📥 TEMPLATE — completare credențiale

```markdown
### Sentry

- **Key:** <paste_sentry_DSN_here>
- **Env Var:** SENTRY_DSN
- **Tip:** Error Monitoring + Performance
- **Limita:** 5k errors + 10k transactions/luna gratis PERMANENT
- **Base URL:** (DSN-specific)
- **Note:** Vite plugin official. CF Workers SDK. Project: mami-docs.
```

---

## 8. Neon Postgres ⭐ — DB serverless 500MB permanent

### Ce câștigi

- **500MB DB + 100h compute + branching git-like GRATIS PERMANENT**
- Postgres 16 cu pgvector pre-instalat
- **Scale-to-zero** (zero cost când inactiv)
- Util ca fallback Supabase sau dev/preview branches Mami_Docs

### Pași (~3 min)

1. [Neon signup](https://console.neon.tech/signup)
2. **Create your first project** → name `mami-docs-dev` → region `Frankfurt (eu-central-1)`
3. Postgres `16` → **Create project**
4. Dashboard → **Connection string** → copy

### Test

```powershell
psql $env:NEON_DATABASE_URL -c "SELECT version();"
```

### Note

- Branching unic: branch DB pentru dev/staging fără cost extra
- Compute pause după 5 min inactivitate (cold start ~500ms)
- pgvector pre-instalat

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

## 9. Leonardo.AI ⭐⭐⭐ — image gen 1500-2250/lună

### Ce câștigi

- **150 tokens/zi (~1500-2250 imagini/lună) PERMANENT** — direct cel mai generos free tier
- Modele: Phoenix, Lucid Origin, Flux Dev — stiluri PhotoReal unice
- Brand consistency tools (Elements, characters, style references)

### Pași (~3 min)

1. [Leonardo signup](https://app.leonardo.ai/auth/signup) → email/Google
2. **Settings → API Keys** ([direct](https://app.leonardo.ai/settings/api-keys)) → **Create**
3. Copy

### Test

```powershell
$body = @{ height = 512; width = 512; modelId = "1e60896f-3c26-4296-8060-9e2fc9e1bc7b"; prompt = "a cute cat with red hat" } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "https://cloud.leonardo.ai/api/rest/v1/generations" `
    -Headers @{ Authorization = "Bearer $env:LEONARDO_API_KEY"; "Content-Type" = "application/json" } -Body $body
```

### Note

- 150 tokens/zi = ~15-20 imagini standard sau 5-6 PhotoReal
- Model PhotoReal e unic (nu există pe Replicate cu aceeași calitate)

### 📥 TEMPLATE — completare credențiale

```markdown
### Leonardo.AI

- **Key:** <paste_leonardo_key_here>
- **Env Var:** LEONARDO_API_KEY
- **Tip:** Image Generation Premium
- **Limita:** 150 tokens/zi (~1500-2250 imagini/lună) PERMANENT
- **Base URL:** https://cloud.leonardo.ai/api/rest/v1
- **Note:** Phoenix/Lucid Origin/Flux Dev. PhotoReal unic. Brand kits.
```

---

## 10. Ideogram ⭐⭐⭐ — text-in-image (cel mai bun)

### Ce câștigi

- **10 prompts/zi × 4 imagini = ~1200/lună PERMANENT**
- **CEL MAI BUN la text rendering în imagini** (logo cu cuvinte, postere cu text)
- Imposibil de matchat de SDXL/Flux la text accuracy
- Ideogram 2.0 + Magic Prompt

### Pași (~3 min)

1. [Ideogram login](https://ideogram.ai/login) → Google
2. [API Manage](https://ideogram.ai/manage-api) → **Create API Key** → copy

### Test

```powershell
$body = @{ image_request = @{ prompt = "Logo cu text 'Mami Docs'"; aspect_ratio = "ASPECT_1_1"; model = "V_2" } } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Method POST -Uri "https://api.ideogram.ai/generate" `
    -Headers @{ "Api-Key" = $env:IDEOGRAM_API_KEY; "Content-Type" = "application/json" } -Body $body
```

### Note

- Excelent pentru: logo cu text, postere, infografice, screenshots cu text
- 10 prompts/zi × 4 imagini = 40 imagini/zi gratis

### 📥 TEMPLATE — completare credențiale

```markdown
### Ideogram

- **Key:** <paste_ideogram_key_here>
- **Env Var:** IDEOGRAM_API_KEY
- **Tip:** Image Generation (text-in-image best)
- **Limita:** 10 prompts/zi × 4 imagini = ~1200/lună PERMANENT
- **Base URL:** https://api.ideogram.ai
- **Note:** CEL MAI BUN la text rendering. Logo, postere, infografice.
```

---

## 11. Adobe Firefly ⭐ — commercial-safe brand assets

### Ce câștigi

- **25 generative credits/lună PERMANENT** (gratis cu Adobe ID free)
- **Commercial-safe** — antrenat doar pe Adobe Stock + public domain (zero risc copyright)
- SEPARATE de `ADOBE_API_KEY` existent (PDF/Acrobat)
- Util pentru asseturi UI care pot fi folosite comercial fără frică

### Pași (~5 min)

1. [Firefly](https://firefly.adobe.com/) → login Adobe ID free
2. [Developer Console](https://developer.adobe.com/console/projects) → **Create new project**
3. **Add API → Firefly API** → genereaza JWT credentials
4. Salvezi `Client ID` + `Client Secret`

### Test (necesită schimb JWT → access_token)

```powershell
$tokenBody = "client_id=$env:FIREFLY_CLIENT_ID&client_secret=$env:FIREFLY_CLIENT_SECRET&grant_type=client_credentials&scope=openid,AdobeID,session,additional_info,read_organizations,firefly_api,ff_apis"
$resp = Invoke-RestMethod -Method POST -Uri "https://ims-na1.adobelogin.com/ims/token/v3" -Body $tokenBody -Headers @{ "Content-Type" = "application/x-www-form-urlencoded" }
```

### Note

- Refresh token la fiecare 24h (auto-renewable)
- Single din top safe pentru asseturi care pot deveni publice

### 📥 TEMPLATE — completare credențiale (DOUĂ valori)

```markdown
### Adobe Firefly

- **Client ID:** <paste_firefly_client_id_here>
- **Client Secret:** <paste_firefly_client_secret_here>
- **Env Var:** FIREFLY_CLIENT_ID + FIREFLY_CLIENT_SECRET
- **Tip:** Image Generation Commercial-Safe
- **Limita:** 25 generative credits/lună PERMANENT
- **Base URL:** https://firefly-api.adobe.io
- **Note:** SEPARATE de ADOBE_API_KEY (PDF). Proiect Firefly distinct. JWT-based auth.
```

---

## 12. Luma Dream Machine ⭐ — video generation 30/lună

### Ce câștigi

- **30 video gens/lună PERMANENT** 720p (5-10 sec fiecare)
- **Best image-to-video** la calitate (mai bun decât Kling/Runway free tiers)
- Camera motion control (orbit, zoom, pan, dolly)

### Pași (~3 min)

1. [Luma signup](https://lumalabs.ai/dream-machine/api) → Google/email
2. [API Keys](https://lumalabs.ai/api/keys) → **Create** → copy

### Test

```powershell
$body = @{ prompt = "a cute cat in a sunny garden"; aspect_ratio = "16:9" } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "https://api.lumalabs.ai/dream-machine/v1/generations" `
    -Headers @{ Authorization = "Bearer $env:LUMA_API_KEY"; "Content-Type" = "application/json" } -Body $body
```

### Note

- Image-to-video: trimit URL imagine + prompt → video 5s
- 30/lună = 1 video/zi suficient pentru proiecte mici

### 📥 TEMPLATE — completare credențiale

```markdown
### Luma Dream Machine

- **Key:** <paste_luma_key_here>
- **Env Var:** LUMA_API_KEY
- **Tip:** Video Generation (image-to-video best)
- **Limita:** 30 video gens/lună 720p PERMANENT
- **Base URL:** https://api.lumalabs.ai
- **Note:** Camera motion control. Best i2v gratuit. 5-10 sec video.
```

---

## 13. Fish Audio ⭐⭐ — TTS multi-voice (2M voci RO)

### Ce câștigi

- **Free PERMANENT** + access la 2M+ voci community în 8 limbi (RO inclus)
- Voice cloning din 10 secunde audio
- Modele Fish Speech 1.5 + S1 — calitate apropiată ElevenLabs cu free tier mai generos

### Pași (~3 min)

1. [Fish Audio signup](https://fish.audio/auth/sign-up) → email/Google
2. [API Keys](https://fish.audio/go-api/api-keys) → **Create** → copy

### Test

```powershell
$body = @{ text = "Salut mama"; reference_id = "<voice_id>"; format = "mp3" } | ConvertTo-Json
Invoke-WebRequest -Method POST -Uri "https://api.fish.audio/v1/tts" `
    -Headers @{ Authorization = "Bearer $env:FISHAUDIO_API_KEY"; "Content-Type" = "application/json" } -Body $body -OutFile "test.mp3"
```

### Note

- Voice library 2M+ — căutați pe [fish.audio](https://fish.audio/) voci RO
- Free permanent = sustainable long-term (vs ElevenLabs 10k chars/lună)
- Voice cloning în 10 sec sample

### 📥 TEMPLATE — completare credențiale

```markdown
### Fish Audio

- **Key:** <paste_fishaudio_key_here>
- **Env Var:** FISHAUDIO_API_KEY
- **Tip:** TTS Multi-Voice + Voice Cloning
- **Limita:** Free PERMANENT + 2M+ voci community
- **Base URL:** https://api.fish.audio/v1
- **Note:** Voci RO disponibile în library. Cloning din 10s sample. Fish Speech 1.5/S1.
```

---

## 14. D-ID ⭐⭐ — Talking head video personalizat

### Ce câștigi

- **5 min video/lună GRATIS PERMANENT**
- Image + audio → talking head video cu lip sync RO
- **Use-case:** poză Roland + voce ElevenLabs → mesaj video pentru mama
- Calitate superior vs open-source (sadtalker pe Replicate are artefacte)

### Pași (~3 min)

1. [D-ID Studio signup](https://studio.d-id.com/) → email/Google
2. [API page](https://studio.d-id.com/api) → **Create API Key** → copy

### Test

```powershell
$body = @{ source_url = "https://create-images-results.d-id.com/api_docs/assets/noelle.jpeg"; script = @{ type = "text"; input = "Salut mama!" } } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Method POST -Uri "https://api.d-id.com/talks" `
    -Headers @{ Authorization = "Basic $env:DID_API_KEY"; "Content-Type" = "application/json" } -Body $body
```

### Note

- 5 min/lună = ~10 mesaje 30s sau 5 mesaje 1 min
- Lip sync RO funcțional (calitate medie spre bună)

### 📥 TEMPLATE — completare credențiale

```markdown
### D-ID

- **Key:** <paste_did_key_here>
- **Env Var:** DID_API_KEY
- **Tip:** Talking Head Video (image + audio → video)
- **Limita:** 5 min video/lună gratis PERMANENT
- **Base URL:** https://api.d-id.com
- **Note:** Lip sync RO. Use-case: poză Roland + voce ElevenLabs → mesaj video mama.
```

---

## 15. Meshy AI ⭐⭐ — 3D modeling 200/lună permanent

### Ce câștigi

- **200 credits/lună GRATIS PERMANENT** (cel mai sustainable 3D free tier 2026)
- Text/Image → 3D mesh (.glb / .obj / .fbx) + retexturizare
- Auto-rigging pentru personaje
- Util pentru: assets 3D viitor, prototipare rapidă

### Pași (~3 min)

1. [Meshy signup](https://www.meshy.ai/auth/sign-up)
2. [API Settings](https://www.meshy.ai/api) → **Create API Key** → copy

### Test

```powershell
$body = @{ mode = "preview"; prompt = "a cute cartoon cat"; art_style = "realistic" } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "https://api.meshy.ai/openapi/v2/text-to-3d" `
    -Headers @{ Authorization = "Bearer $env:MESHY_API_KEY"; "Content-Type" = "application/json" } -Body $body
```

### Note

- 200 credits/lună = ~10-20 modele 3D simple sau ~5 complexe cu retexturare
- Permanent — sustainable long-term

### 📥 TEMPLATE — completare credențiale

```markdown
### Meshy AI

- **Key:** <paste_meshy_key_here>
- **Env Var:** MESHY_API_KEY
- **Tip:** 3D Modeling (Text/Image → 3D)
- **Limita:** 200 credits/lună PERMANENT
- **Base URL:** https://api.meshy.ai/openapi/v2
- **Note:** .glb/.obj/.fbx export. Auto-rigging. Sustainable long-term free.
```

---

## 📋 Sumar prioritate semnare (recomandare)

**Wave 1 - primele 2 (10 min, valoare maxima vizuala):**

1. ⭐⭐⭐ **Ideogram** — text-in-image unic 1200/lună
2. ⭐⭐⭐ **Leonardo.AI** — 1500-2250 imagini/lună PhotoReal

**Wave 2 — Wellness mama (10 min):**

4. ⭐⭐ **Hume AI** — emotion analysis voce mama (UNIC)
5. ⭐⭐ **ElevenLabs** — TTS RO native voice cloning

**Wave 3 — Infrastructure (10 min):**

6. ⭐⭐ **Resend** — email alerts admin
7. ⭐⭐ **Sentry** — error monitoring production
8. ⭐ **Neon** — DB alt branching git-like

**Wave 4 — RAG + Search (5 min):**

9. ⭐⭐ **Voyage AI** — best embeddings 2026
10. ⭐⭐ **Perplexity** — search-grounded medical lookup

**Wave 5 — Multimedia (10 min):**

11. ⭐ **Luma Dream Machine** — video gen 30/lună
12. ⭐⭐ **Fish Audio** — TTS 2M voci permanent
13. ⭐⭐ **D-ID** — talking head video mama
14. ⭐⭐ **Meshy AI** — 3D modeling 200/lună
15. ⭐ **Adobe Firefly** — commercial-safe brand assets

---

## 🎯 Workflow auto-routing

**Imediat ce semnezi un serviciu nou:**

1. Lipești blocul `📥 TEMPLATE` în `~/.api-keys/INBOX.md` cu valorile reale
2. Rulezi `proceseaza inbox` în Claude Code din `.api-keys`
3. **Sistemul auto-update `routing_decision_trees.md`** (vezi `~/.claude/projects/.../memory/`) — adaug providerul nou în decision tree per categorie
4. Anunță-mă în Mami_Docs și integrez fallback-ul în AI Gateway

**Decision tree per categorie:** `routing_decision_trees.md` în memorie. Eu îl consult INAINTE de orice apel AI.

---

## 🛡 GDPR pentru date medicale Mami_Docs

**✅ OK pentru date personale mama:**

Voyage (US), ElevenLabs (US), Hume (US), Resend (US), Sentry (EU/US), Neon (EU Frankfurt), Leonardo, Ideogram, Firefly, Luma, D-ID, Meshy (US/EU)

**⛔ NU pentru date personale mama:**

- Fish Audio (servere mixed) → folosi DOAR pentru asseturi non-personale (logo, voice samples non-mama)
- Perplexity Sonar (search rezultate trec prin Brave) → OK pentru lookup info publică (drug names), NU date private mama

---

**Versiune ghid:** 8.0 | **Data:** 2026-05-07 | **Sursa:** v7 (15 servicii) -> v8 (Reka AI integrat in AI Gateway worker frontier chain -> eliminat din lista pending; raman 14 servicii)
