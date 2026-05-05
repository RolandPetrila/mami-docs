# Ghid Pas-cu-Pas — Credențiale Lipsă

> Ghid pentru obținerea credențialelor care îmbunătățesc capacitățile AI ale Mami_Docs.
> Toate sunt **opționale** — proiectul funcționează deja fără ele. Le adăugăm dacă vrei mai multe straturi de fallback / capabilități noi.

---

## 1. GitHub Models — `GITHUB_TOKEN` cu scope `Models`

### Ce câștigi

- 50-150 cereri/zi gratuite la modele frontier (GPT-4o, Llama 3.3, Phi-4, DeepSeek, Mistral) prin un singur endpoint OpenAI-compatible.
- Util ca strat suplimentar de fallback chat când Groq/SambaNova/Cerebras sunt indisponibile.

### De ce nu funcționează cheia actuală

PAT-ul actual (folosit de `gh CLI`) are scope `repo` + `workflow`, dar **nu** are `models:read`. GitHub a adăugat scope-ul `Models` separat în 2025.

### Pași (5 minute)

1. **Deschide** [github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new) (Fine-grained PAT, recomandat de GitHub).
2. **Token name:** `claude-code-models` (sau orice nume vrei să recunoști)
3. **Expiration:** 1 year (sau Custom dacă vrei mai mult)
4. **Repository access:** `Public Repositories (read-only)` (Models nu are nevoie de acces la repo-uri)
5. **Permissions → Account permissions:**
   - Scroll la `Models` → setează la `Read-only`
   - Restul permisiunilor: lasă pe `No access` (least privilege)
6. **Click** `Generate token` → copiază token-ul (`github_pat_...`)
7. **Update env var:**

```powershell
# Lipește valoarea când o cere — NU în chat
$env:NEW_TOKEN = Read-Host "Paste GitHub PAT cu Models scope" -AsSecureString
$plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($env:NEW_TOKEN))
[Environment]::SetEnvironmentVariable('GITHUB_MODELS_TOKEN', $plain, 'User')
Remove-Variable plain
```

> Notă: folosim env var nouă `GITHUB_MODELS_TOKEN` ca să nu suprascriem `GITHUB_TOKEN` (care e folosit de `gh CLI`). După set, redeschide terminalul.

8. **Test:**

```powershell
$body = @{ model = "openai/gpt-4o-mini"; messages = @(@{ role = "user"; content = "OK?" }); max_tokens = 5 } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "https://models.github.ai/inference/chat/completions" `
    -Headers @{ Authorization = "Bearer $env:GITHUB_MODELS_TOKEN"; "Content-Type" = "application/json" } `
    -Body $body
```

9. **Confirm valid** → spune-mi "GitHub Models OK" și adaug în AI Gateway worker ca fallback chat suplimentar.

### Link-uri direct

- [Generare PAT fine-grained](https://github.com/settings/personal-access-tokens/new)
- [Documentația GitHub Models](https://docs.github.com/en/github-models/use-github-models/prototyping-with-ai-models)
- [Catalog modele disponibile](https://github.com/marketplace?type=models)

---

## 2. Azure Document Intelligence — endpoint URL

### Ce câștigi

- 500 pagini/lună OCR specializat documente medicale (rețete, formulare, analize de laborator) — mult superior Tesseract pentru documente cu structură.
- Modele preantrenate: `prebuilt-document` (orice document), `prebuilt-receipt`, `prebuilt-idDocument`, `prebuilt-invoice`.
- Layout API care detectează tabele, paragrafe, semnături, casete bifabile (esențial pentru rețete).

### Cheile pe care le-ai trimis

Ambele au format Azure Cognitive Services valid (84 caractere). **NU pot fi validate fără endpoint URL** — Azure are wildcard DNS, deci orice subdomeniu `*.cognitiveservices.azure.com` returnează 401, nu 404.

Am testat 16 pattern-uri comune (`mami-docs`, `documentintelligence`, `doc-intel`, `mami`, `petrilarolly`, etc.) → toate 401, ceea ce confirmă că resursa NU folosește un nume comun.

### Pași — varianta A: ai deja resursă creată

1. **Deschide** [portal.azure.com → Cognitive services](https://portal.azure.com/#view/Microsoft_Azure_ProjectOxford/CognitiveServicesHub/~/AzureAIServices)
2. **Caută** în lista resurselor: orice cu tipul `Document Intelligence` sau `Form Recognizer`
3. **Click pe resursă** → meniul stâng → `Keys and Endpoint`
4. **Copiază:**
   - `Endpoint` (URL complet, ex: `https://mami-docintel-rolland.cognitiveservices.azure.com/`)
   - Verifică că `KEY 1` sau `KEY 2` se potrivesc cu cele pe care mi le-ai dat
5. **Trimite-mi endpoint-ul** în chat sau lipește-l direct, eu îl validez și salvez.

### Pași — varianta B: nu ai resursă, vrei să creezi una nouă

1. **Deschide** [portal.azure.com → Create Document Intelligence resource](https://portal.azure.com/#create/Microsoft.CognitiveServicesFormRecognizer)
2. **Subscription:** alege subscripția ta (probabil "Free Trial" sau Pay-As-You-Go)
3. **Resource group:** creează nou `mami-docs-rg` (sau folosește unul existent)
4. **Region:** `West Europe` (cel mai aproape de România, EU GDPR-compliant)
5. **Name:** `mami-docs-docintel` (alfanumeric, devine subdomeniul endpoint-ului)
6. **Pricing tier:** `Free F0` — **CRITIC** pentru a rămâne pe gratuit (500 pagini/lună gratuit)
7. **Network:** `All networks` (mai simplu) sau `Selected networks` dacă vrei whitelist IP
8. **Tags:** opțional `project=mami-docs` `env=prod`
9. **Review + Create** → așteaptă 1-2 min validation → **Create**
10. **După deploy:** click `Go to resource` → `Keys and Endpoint` → copiază endpoint și KEY 1

### Link-uri direct

- [Azure Portal cu filtru Document Intelligence](https://portal.azure.com/#view/Microsoft_Azure_ProjectOxford/CognitiveServicesHub/~/FormRecognizer)
- [Quickstart oficial](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/quickstarts/get-started-sdks-rest-api)
- [Lista regiunilor disponibile](https://azure.microsoft.com/en-us/explore/global-infrastructure/products-by-region/?products=cognitive-services)

### După ce trimiți endpoint

Configurez automat în Worker `mami-docs-ai`:

- Adaug rută `/ocr-document` care trimite blob → Azure Doc Intel
- Adaug în chain vision: Tesseract.js (client) → Azure Doc Intel (medical) → Gemini 2.5 Flash (general)
- Stochează `AZURE_DOC_INTEL_ENDPOINT` ca secret în worker via `wrangler secret put`

---

## 3. Cloudflare API Token dedicat — `Workers AI:Read` scope

### Ce câștigi (DETALIAT, conform întrebării tale)

**Cloudflare Workers AI** = inferență AI gratuită rulată direct pe edge-ul Cloudflare. Nu este același cu Pages/Workers deploy — e un produs separat care expune modele AI prin REST API sau prin binding `env.AI` în workers.

**Limita free tier:** **10.000 neurons/zi** (reset la 00:00 UTC).

- 1 neuron ≈ 1 inferență mică (chat scurt 200 tokens, embedding 1 frază, transcript 5 sec audio)
- 10k neurons/zi = ~5.000 mesaje chat scurte sau ~3.000 transcripts audio sau ~10.000 embeddings

**Modele disponibile gratuite pe CF Workers AI (selecție):**

| Categorie        | Model                                      | Utilitate Mami_Docs                               |
| ---------------- | ------------------------------------------ | ------------------------------------------------- |
| Chat             | `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | Fallback chat 70B ULTRA-rapid (CF edge)           |
| Chat mic         | `@cf/meta/llama-3.1-8b-instruct`           | Fallback chat ultra-rapid                         |
| STT              | `@cf/openai/whisper-large-v3-turbo`        | Backup pentru Groq Whisper                        |
| Embed            | `@cf/baai/bge-m3`                          | Fallback embeddings multilingv (RO support nativ) |
| Vision           | `@cf/llava-hf/llava-1.5-7b-hf`             | OCR/descriere imagini ca alternativă              |
| Generare imagini | `@cf/black-forest-labs/flux-1-schnell`     | Generare ilustrații pentru povești seara mama     |
| Re-ranking       | `@cf/baai/bge-reranker-base`               | Îmbunătățește rezultate RAG după embed search     |

**De ce token DEDICAT separat de cel admin?**

1. **Principle of Least Privilege:** token-ul actual `CLOUDFLARE_API_TOKEN` are scope larg (Pages deploy, Workers deploy, Account info). Dacă scapă, atacatorul poate face deploy/șterge proiecte. Un token cu DOAR `Workers AI:Read` poate face exclusiv inferențe AI — risc minim.
2. **Worker secret separat:** îl pui în secret-ul worker-ului `mami-docs-ai` ca `CF_AI_TOKEN`, separat de token-ul tău admin care rămâne pe laptop.
3. **Audit log clar:** în Cloudflare Dashboard vezi exact câte requesturi a făcut tokenul AI vs. token admin.
4. **Rotation independent:** poți rota tokenul AI fără să afectezi deploy-urile.

### Funcționalități noi pe care le-ar adăuga în Mami_Docs

1. **Chat fallback la 5-lea nivel** (după Groq → SambaNova → Cerebras → xAI → CF AI Llama 3.3 70B)
2. **STT redundant** — al doilea nivel după Groq Whisper, în caz că Groq e jos
3. **Embeddings backup** — `bge-m3` e mai bun pentru română decât Cohere
4. **OCR vision opțional** — alternativă la Tesseract pentru imagini complexe
5. **Generare ilustrații** — pentru povesti seara, mesaje motivaționale cu imagine

### Pași (3 minute)

1. **Deschide** [dash.cloudflare.com → My Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. **Click** `Create Token`
3. **Search** "Workers AI" → click `Use template` la `Workers AI`
   - Sau click `Get started` la `Custom token` și setează manual:
4. **Token name:** `mami-docs-ai-inference`
5. **Permissions:** doar
   - `Account` → `Workers AI` → `Read`
6. **Account Resources:** `Include` → `petrilarolly's Account`
7. **Client IP Filtering:** opțional `is in` cu IP-ul Cloudflare Workers (poți lăsa gol — token e folosit din worker, nu de pe laptop)
8. **TTL:** opțional 1 an
9. **Continue to summary** → **Create Token** → copiază token-ul (`v1.0-...`)
10. **Set ca secret în worker:**

```powershell
cd C:\Proiecte\Mami_Docs\workers\ai-gateway
npx wrangler secret put CF_AI_TOKEN
# Lipește token-ul când îți cere
```

11. **Confirm valid** → spune-mi "CF AI token OK" și adaug rutele AI binding + fallback în worker.

### Link-uri direct

- [Cloudflare Dashboard API Tokens](https://dash.cloudflare.com/profile/api-tokens)
- [Workers AI documentation](https://developers.cloudflare.com/workers-ai/)
- [Catalog modele Workers AI](https://developers.cloudflare.com/workers-ai/models/)
- [Pricing & limits free tier](https://developers.cloudflare.com/workers-ai/platform/pricing/)

---

## Sumar acțiuni necesare de la admin (max 10 minute total)

| #   | Sarcină                                                                                           | Estimat | Link direct                                                                                                                                    |
| --- | ------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Generează GitHub PAT cu scope `Models:read` → trimite token sau set env var `GITHUB_MODELS_TOKEN` | 3 min   | [github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new)                                       |
| 2   | Găsește/creează Azure Doc Intel resource → trimite endpoint URL                                   | 4 min   | [portal.azure.com → Document Intelligence](https://portal.azure.com/#view/Microsoft_Azure_ProjectOxford/CognitiveServicesHub/~/FormRecognizer) |
| 3   | Creează CF API token cu scope `Workers AI:Read` → set ca secret worker                            | 3 min   | [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)                                                       |

După fiecare pas: **spune-mi rezultatul** (token în env var sau în chat — fără frecuș, am regula de a nu mai avertiza la chei expuse) și **eu fac restul automat** (integrare worker, secrets, fallback chain, deploy).
