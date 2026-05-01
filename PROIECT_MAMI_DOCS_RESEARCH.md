# Raport de Cercetare — PWA "mami-docs"
## Validare arhitectură, alternative gratuite, modele AI și funcționalități inovatoare (verificat aprilie 2026)

---

## TL;DR

- **Arhitectura propusă (GitHub Pages + Supabase + Cloudflare Workers + AI fallback) este 100% viabilă pe planuri gratuite pentru cazul "o mamă, un admin"**, dar trei limite ascunse trebuie gestionate: (1) Supabase Free pune proiectul pe pauză după 7 zile de inactivitate (cron de "ping" săptămânal rezolvă), (2) Gemini Free a fost redus în decembrie 2025 (Flash ~250→50 RPD; 2.5 Pro doar 100 RPD), (3) GitHub Pages e public și interzice "transmitere de date sensibile" — datele medicale trebuie să stea în Supabase Storage privat, NU în repo.
- **Pentru fallback AI cu 4 nivele, combinația optimă 100% gratuită este: Groq (viteză, 14.4K RPD pe Llama 8B) → Cerebras (volum, 1M tokens/zi) → Gemini 2.5 Flash-Lite (1000 RPD, 1M context, vision/OCR nativ) → OpenRouter free models (DeepSeek R1, Llama 3.3 70B, ~200 RPD/model)**, cu Mistral Experiment (1B tokens/lună, 2 RPM) ca rezervă pentru embeddings europene și româna nativă. Ollama local pe laptopul admin acoperă cazurile offline-extreme.
- **Pentru ca telefonul mamei să SUNE (nu doar să notifice) la medicamente, fără a afecta admin-ul**, soluția gratuită cea mai fiabilă este **ntfy.sh cu prioritate 5 ("urgent") + canal Android dedicat cu ringtone custom**, eventual stivuit cu **CallMeBot Telegram Voice Call** (gratuit personal, generează apel TTS în Telegram) sau **un cron Cloudflare Workers → Telegram Bot API** (gratuit nelimitat). Web Push pur PWA NU poate genera ringtone; orice "sunet de alarmă" cere fie ntfy/Telegram/FCM cu canal de notificare configurat manual pe telefonul mamei, fie creare de evenimente .ics descărcate cu alarmă nativă Android.

---

## SECȚIUNEA 1 — Validarea Arhitecturii Existente

### 1.1 GitHub Pages — Free tier (verificat docs.github.com, aprilie 2026)

**Ce funcționează gratuit cu limite generoase:**
- **Bandwidth**: 100 GB/lună (soft limit) — suficient pentru ~1 utilizator + admin de mii de ori peste.
- **Repo size**: 1 GB recomandat pentru sursă, **1 GB hard limit pentru site-ul publicat**.
- **Limit fișier individual**: 100 MB (peste, e necesar Git LFS — care are doar 1 GB free).
- **Build limits**: 10 builds/oră (soft), timeout 10 minute. **Important: nu se aplică dacă folosești workflow custom GitHub Actions** — deci nelimitat practic.
- **HTTPS automat** prin Let's Encrypt + custom domain gratuit.
- **GitHub Actions pentru repo public**: **minute NELIMITATE pe runner-e standard** (Ubuntu/Windows/macOS), cron scheduling cu sintaxă standard.

**Limite și blocaje de care trebuie să fii conștient:**
- ❗ **GitHub Pages cere repo PUBLIC pe planul Free.** Tot codul, structura și conținutul în Markdown/JSON va fi vizibil. Pentru "documentație personală a mamei" cu informații medicale, trebuie respectată o regulă strictă: **doar conținutul ne-sensibil în repo public**, restul (poze documente, înregistrări audio, date medicale) în Supabase Storage privat referențiat prin URL semnat.
- ❗ ToS GitHub interzic explicit "sensitive transactions like sending passwords or credit card numbers" pe Pages. Nu e o problemă pentru un PWA care doar afișează; auth-ul se face prin Cloudflare Worker → Supabase.
- ❗ **Cron-urile schedulate se DEZACTIVEAZĂ automat după 60 de zile fără activitate** în repo (commit/PR/issue). Soluție: workflow lunar care face un commit "keepalive" pe un fișier de timestamp.
- ❗ Cron-urile nu se execută la timpul exact — întârzieri de 10–30 min sunt comune la oră fixă; programează la `:13`, `:27` etc., nu la `:00`.
- ❗ Cron mai des de 5 minute e ignorat tăcut. Pentru reminder-e medicamente la minut precis, **Cloudflare Workers Cron este superior** (granularitate 1 min, fără întârzieri).

### 1.2 Cloudflare Workers — Free tier (developers.cloudflare.com, 2026)

**Ce funcționează gratuit cu limite generoase:**
- **100.000 requests/zi** (reset la 00:00 UTC) — suficient pentru două persoane de aproximativ 100x.
- **10 ms CPU time / request** pe planul Free (nu wall-time — apelurile de rețea/AI nu consumă CPU). Worker-ul ca proxy AI consumă tipic 2–10 ms.
- **Cron Triggers**: incluse gratuit, granularitate 1 minut, garantate să ruleze.
- **Workers KV (Free)**: 100.000 reads/zi, 1.000 writes/zi, 1 GB storage, 1.000 deletes/zi, 1.000 list ops/zi. Reset zilnic 00:00 UTC.
- **Environment variables / Secrets**: gratuit, neîngrădit ca număr (limită 5 KB per binding, ~1 MB metadata totale per script).
- **R2 Storage (pentru backup-uri)**: **10 GB stocare/lună GRATUIT, EGRESS ZERO PE TOATE PLANURILE**, 1M Class A ops (write) /lună, 10M Class B ops (read) /lună. Compatibil S3 API.
- **Durable Objects SQLite (Free)**: până la 5 GB total — variantă pentru rate-limiting complex sau memorie pe utilizator.

**Limite și blocaje:**
- Memorie izolat: **128 MB heap** per invocation. Suficient pentru proxy + small AI logic.
- Subrequest limit: max 50 fetch-uri din interiorul unui Worker (Free) — pentru fan-out AI fallback chain e mai mult decât suficient.
- Bundle size: max 3 MB compresat. Folosește dynamic imports pentru librării mari.
- Nu poți rula vector DB local în Worker — dependențele compute-heavy se duc la Supabase pgvector sau Workers AI.

### 1.3 Supabase — Free tier (supabase.com/pricing, 2026)

**Ce funcționează gratuit cu limite generoase:**
- **500 MB Database PostgreSQL** (cu pgvector, pg_cron, PostGIS — toate extensiile relevante).
- **1 GB File Storage** (S3-compatible) — suficient pentru ~500–2000 poze comprimate sau ~50 PDF-uri scan medical.
- **5 GB egress din storage + 5 GB cached** = 10 GB/lună bandwidth total per organizație.
- **50.000 Monthly Active Users** la Auth — practic infinit pentru două persoane.
- **Unlimited API requests**.
- **2 GB transferuri DB egress.**
- **Row-Level Security** (RLS) — funcționează complet pe Free, inclusiv policy-uri tip "doar mama poate șterge conținutul mamei". Sintaxă: `CREATE POLICY ... USING (auth.uid() = owner_id);`
- **2 proiecte Free active** (un proiect dev + un proiect prod).
- **Edge Functions**: 500.000 invocații/lună, suficient pentru funcții auxiliare.
- **pgvector**: complet suportat — alegerea ideală pentru memorie AI / RAG (vezi Secțiunea 4A).

**Limite și blocaje critice:**
- ❗❗ **Proiectele Free se pun în PAUZĂ după 7 zile de inactivitate.** Repornirea e manuală din dashboard, durează 1–2 minute. **Soluție obligatorie**: cron Cloudflare Workers (sau GitHub Actions) care face un `SELECT 1` la fiecare 4–5 zile pe o tabelă publică, ținând proiectul "viu". E un pattern foarte folosit; rezolvă problema.
- Fără SLA, fără backup-uri zilnice automate. Pentru mami-docs, recomandare puternică: backup săptămânal manual prin GitHub Actions → R2 (zero egress).
- Compute partajat (1 vCPU, 500 MB RAM) — query-urile complexe pot fi lente, dar pentru doi utilizatori e irelevant.
- Image transformation NU e inclus în Free (folosit pentru thumbnail-uri storage). Soluție gratuită: Cloudflare Workers Image Resizing (gratuit pentru cont gratuit cu volume mici) sau prelucrare client-side cu canvas API.
- IPv4 add-on costă $4/lună — pentru clienți care nu pot rezolva IPv6. PWA în Chrome Android merge perfect pe IPv6 nativ.

### 1.4 Web Speech API în limba română (ro-RO) pe Chrome Android

**Realitate (verificată MDN + Hadrien Gardeur recommended-voices project):**

- **Speech Synthesis (TTS) ro-RO pe Chrome Android**: voci Google "Romanian" disponibile prin pachetul Google Speech Services (`Android Speech Recognition and Synthesis from Google`). Calitate: **decentă, nu excelentă** — vocea de bază e robotică; pe versiunile recente Android (13+) Google a început să distribuie "Natural Voices" pentru română (offline, mult mai naturale), dar nu pe toate device-urile.
- **Bug semnificativ Chrome Android**: `speechSynthesis.getVoices()` returnează o listă incompletă de limbi/regiuni localizate; nu returnează numele real al vocii instalate. Dacă pachetul ro-RO nu e instalat, browser-ul poate face fallback în engleză tăcut. **Soluție**: la primul lansare a PWA, afișează un buton "Test voce română" care rulează `speak("Bună mama")` și cere utilizatorul să confirme; dacă nu se aude, ghid de instalare pachet vocal Google → Settings → Limbă & Input → Text-to-Speech → Google → Limbi → Română.
- **Speech Recognition (STT) ro-RO**: suportat nativ pe Chrome Android prin Google's recognition service. Acuratețea pentru română conversațională e bună — cea folosită de Google Assistant. Dar cere CONEXIUNE INTERNET (recunoașterea e server-side); nu e on-device pentru română (doar pentru engleză majoră, cu flag în Chrome).
- ❗ Limita: după ~14 secunde fără rezultat, recunoașterea se oprește. Pentru un utilizator de 60 ani care vorbește lent, configurează `continuous=true` și `interimResults=true`, plus auto-restart on `onend`.

### 1.5 PWA pe Chrome Android — capabilități critice (developer.chrome.com, MDN)

| API | Status pe Chrome Android (aprilie 2026) | Aplicabilitate mami-docs |
|---|---|---|
| **Web Push (notificări când app închisă)** | ✅ Suportat complet via FCM (transparent). Funcționează cu Service Worker registrat. | Pentru notificări medicamente — DA, dar fără ringtone custom. |
| **Notifications API (sunet, vibration)** | ✅ Sunet implicit din canalul de notificare Android. **Customizare ringtone NU e posibilă din PWA** — dependentă de canal. | Limitare cheie pentru "sună la medicament". Soluție: ntfy/Telegram/FCM topic dedicat cu canal Android setat de utilizator pe ringtone alarm. |
| **Background Sync (one-shot)** | ✅ Stabil de la 2016. Pentru retry când offline-online. | Da — pentru sincronizare oferte mâncare/cumpărături mama înregistrează offline. |
| **Periodic Background Sync** | ⚠️ Implementat doar în Chrome, **cere PWA instalat + utilizare frecventă (browser engagement score)**. Frecvența minimă efectivă e de obicei o dată / 12h. | Util pentru pre-fetch zilnic știri/sezonalitate, NU pentru reminder-e cu timp exact. |
| **Vibration API** | ✅ Suportat (cu user gesture cerut). | Alarm vibrațional intens pentru medicamente: `navigator.vibrate([500,200,500,200,500])`. |
| **Web Share API** | ✅ Suportat. | Mama poate partaja document către fiul ei rapid. |
| **Service Worker** | ✅ Stabil. | Backbone-ul PWA. |
| **PWA install prompt (`beforeinstallprompt`)** | ✅ Suportat, dar Chrome 2026 a strâns frecvența prompt-urilor (anti-spam). | Să afișezi un buton vizibil "Instalează" în UI. |

**Limite specifice fundamentale:**
- ❗ **Niciun PWA nu poate iniția un apel telefonic propriu-zis** care să sune ca un apel întrant pe Android. Cel mai aproape: Notifications cu high-priority canal + sunet de alarmă (necesită setare manuală canal pe telefonul mamei).
- ❗ Push payload-ul e limitat la ~4 KB.
- ❗ Service worker-ul are buget de execuție limitat (~30 secunde pentru push event).

---

## SECȚIUNEA 2 — Servicii Alternative Gratuite cu Limite Generoase

### 2.1 Hosting alternativ la GitHub Pages (verificat agentdeals.dev, aprilie 2026)

| Platformă | Free tier — limite cheie | Avantaj vs GitHub Pages |
|---|---|---|
| **Cloudflare Pages** | **Bandwidth NELIMITAT**, 500 build minutes/lună, 100 site-uri, repo public/privat, custom domain + SSL gratuit, integrare Workers nativă | **Cea mai bună alternativă** — fără bandwidth cap, repo-ul poate fi privat (rezolvă problema "datele mamei vizibile pe GitHub"). Edge global 300+ locații. |
| **Netlify** | 100 GB bandwidth/lună, 300 build minutes/lună, 125.000 invocații funcții | Generos dar bandwidth limitat. ❗ Plan a fost restructurat 2025 (mai puțin generos decât trecut). |
| **Vercel Hobby** | 100 GB bandwidth, 1M invocații funcții, 100K edge requests | ❗ **Hobby plan INTERZICE explicit uz comercial** — chiar dacă mami-docs e personal, e ambiguu. Mai bine evitat dacă vrei domeniu propriu. |

**Recomandare**: Migrează din GitHub Pages la **Cloudflare Pages cu repo PRIVAT** dacă vrei să păstrezi confidențialitatea conținutului care nu e în Supabase. Beneficiul suplimentar: **funcțiile Cloudflare Pages = Workers gratuit integrate**, deci proxy-ul AI și frontend-ul stau la aceeași echipă (auth simplu cu cookies same-origin).

### 2.2 Backend-uri alternative la Supabase

| Serviciu | Free tier | Caracteristici cheie | Verdict |
|---|---|---|---|
| **Firebase Spark plan** | Cloud Messaging (FCM) **NELIMITAT GRATUIT**, Auth, Firestore 1 GiB / 50K reads/zi / 20K writes/zi, no-cost forever | ❗ Cloud Storage scos din Spark în feb 2026 — folosește alt provider pentru fișiere. Lock-in Google. | Bun ca **secundar pentru push notifications via FCM** chiar dacă DB-ul e în Supabase. |
| **Appwrite Cloud** | 5 GB bandwidth, 2 GB storage, 750K function executions, **75K MAU**, 1 DB / 1 bucket / 5 funcții, 2 proiecte | Free tier mai generos pe MAU decât Supabase. Self-hostable open source. | Alternativă viabilă; lipsește RLS Postgres puternic. |
| **PocketBase** (self-hosted) | **100% gratuit, MIT, fără limite** — dar self-hosted; rulează pe orice VPS sau pe laptop admin local | SQLite + Auth + Storage + Realtime într-un singur binar 20 MB. | Excelent pentru dev; pentru prod ar trebui un VPS (Oracle Free Tier ARM e free for life). |
| **Neon Postgres** | 0.5 GB storage/proiect, **100 compute-hours/lună**, scale-to-zero, **branching nelimitat**, **pgvector inclus** | Excelent pentru DB-only. Scale-to-zero înseamnă cold start ~500 ms la prima query după inactivitate. | Bună alternativă dacă renunți la Auth/Storage Supabase. |
| **Turso** (libSQL/SQLite edge) | 5 GB storage, 500M row reads/lună, 25M row writes/lună, 500 baze de date | Edge replicat. ❗ Scale-to-zero deprecat pentru noi în ian 2026. Nu are pgvector / full-text search puternic — slab pentru RAG. | Dacă nu ai nevoie de vector. |
| **Railway** | $5 trial credit, apoi pay-as-you-go (NU mai e free perpetual) | A pierdut atractivitatea în 2025–2026. | Evită pentru free permanent. |

**Concluzie Secțiunea 2.2**: **Supabase rămâne cea mai bună alegere** pentru mami-docs (Postgres + pgvector + RLS + Storage + Auth + Realtime, toate la liber). FCM Firebase merită luat ca al doilea cont SOLO pentru push gratuit nelimitat.

### 2.3 Auth proxy alternative la Cloudflare Workers

| Platformă | Free tier | Note |
|---|---|---|
| **Cloudflare Workers** | 100K req/zi, 10ms CPU, KV inclus, R2 inclus | **Câștigătorul clar.** Edge global, cron, KV, R2 — toate gratuit. |
| **Deno Deploy** | 1M req/lună, 100 GB egress, edge global, 50 ms CPU/req | Foarte bun, JS/TS first-class. |
| **Vercel Edge Functions** (Hobby) | 1M invocații, 100 GB bandwidth | ❗ Restricția "no commercial use" pe Hobby. |
| **Netlify Functions** | 125K invocații/lună | Mai limitat decât Workers. |

**Recomandare**: Păstrează Cloudflare Workers — superior la free tier inclusiv pe KV/R2 integrate.

### 2.4 Backup storage alternative

| Serviciu | Free tier | Comentariu |
|---|---|---|
| **Cloudflare R2** | **10 GB stocare, 1M Class A, 10M Class B ops/lună, EGRESS GRATUIT** | **Cea mai bună alegere absolută** pentru mami-docs. Compatibil S3. |
| **Backblaze B2** | 10 GB stocare, 1 GB/zi download free, **3× monthly storage egress free** (free pass-through prin Cloudflare CDN gratuit nelimitat) | Alternativă solidă; egress se plătește la $0.01/GB peste 3× stocare. |
| **GitHub LFS** | 1 GB stocare + 1 GB bandwidth/lună | Foarte limitat — evită pentru orice fișiere mari. |
| **Storj** | 25 GB stocare, 25 GB bandwidth/lună gratuit | Distribuit decentralizat, S3 API. Bun ca al doilea backup off-platform. |

**Strategie recomandată**: backup zilnic Supabase → R2 (egress=0), copiere săptămânală R2 → Storj sau Backblaze B2 (al doilea sit, "3-2-1 rule").

### 2.5 Email/SMS/Push notifications gratuite

| Serviciu | Limite Free | Pentru ce e bun |
|---|---|---|
| **Telegram Bot API** | **NELIMITAT GRATUIT** (max 30 msg/sec/bot, 1 msg/sec/chat) | ⭐ **Cheia pentru reminder-e medicamente.** Bot trimite mesaj text, foto, document către un chat ID — primește instant pe Telegram cu sunet propriu. |
| **CallMeBot Telegram Voice Call** | **GRATUIT pentru uz personal**, generează apel TTS în Telegram (sună ca un apel Telegram întrant) | ⭐⭐ **APROAPE de ce vrei**: face telefonul să sune ca un apel real Telegram, citește mesajul cu TTS. Multilingv (ro suportat prin Google Cloud TTS voci). |
| **CallMeBot WhatsApp** | Gratuit, mesaj text + imagini | Alternativă fără Telegram. |
| **Discord Webhooks** | Nelimitat gratuit | Dacă mama folosește Discord (puțin probabil). |
| **ntfy.sh** | **250 mesaje/zi gratuit pe instanța oficială**, self-hostable nelimitat. Burst 60 / 5 minute. App Android dedicat. | ⭐⭐ **Cea mai bună soluție pentru "telefonul mamei să sune"**: 5 nivele de prioritate, fiecare cu canal Android propriu — nivelul "urgent" (5) poate avea ringtone custom configurat manual de utilizator. Suport email + apeluri telefonice TTS prin opțiuni paid (free tier: doar push). |
| **SendGrid** | 100 email/zi gratuit forever | Cere card, restrictiv. |
| **Mailgun** | 100 email/zi prima lună, apoi pay | Slab. |
| **Brevo (Sendinblue)** | **300 email/zi gratuit forever, fără card** | Bun pentru email tranzacțional. |
| **OneSignal** | Push web/mobil **NELIMITAT** — 10K subscribers per send pe Free | Generos pentru un caz cu 1–2 utilizatori. Suportă target individual prin player-id. |
| **Pushy** | 500 device-uri free, push nelimitat | Independent de FCM. |
| **Firebase Cloud Messaging** | **NELIMITAT GRATUIT** | Standard de aur. Suportă "topic-uri" — abonezi telefonul mamei la `medicamente`, NU abonezi laptop-ul admin. |

**Recomandare cheie pentru mami-docs**: **Stiva ntfy.sh + Telegram Bot + FCM** — toate gratuite, redundante. Vezi Secțiunea 4B.

### 2.6 Push notifications care vizează DOAR telefonul mamei

Toate sistemele moderne (FCM, OneSignal, ntfy, Telegram) **vizează tokeni/topicuri/chat ID-uri, nu utilizatori**. Soluție:
- Backend-ul stochează în Supabase un câmp `device_role` per device-token: `"mom"` sau `"admin"`.
- Reminder-urile medicale filtrează doar `device_role='mom'`.
- Chat ID-ul Telegram al mamei e în secret env Cloudflare; chat-ul admin e separat (sau notificat doar la erori critice).

---

## SECȚIUNEA 3 — Modele AI Gratuite în 2026 (Lanțul de Fallback)

### 3.1 Tabel comparativ furnizori AI free (verificat aprilie 2026)

| Furnizor | Modele cheie free | Limite zilnice | Vision/OCR | Embeddings | Function calling | Card cerut? | Suport română |
|---|---|---|---|---|---|---|---|
| **Google Gemini** | 2.5 Pro, 2.5 Flash, 2.5 Flash-Lite, **3 Flash Preview**, **3.1 Flash-Lite Preview** | Pro: 5 RPM / **100 RPD**; Flash: 10 RPM / **250 RPD** (250K TPM); Flash-Lite: 15 RPM / **1.000 RPD**. **Embedding 10M tokens/min!** | ✅ Excelent (multimodal nativ — text, imagine, audio, video). 1M context. | ✅ `gemini-embedding-001` — 10M TPM gratuit. | ✅ | NU | ⭐⭐⭐ Foarte bună (Gemini e cel mai bun model multilingv free) |
| **Groq** | Llama 3.1 8B, Llama 3.3 70B, Llama 4 Scout, Llama 4 Maverick, Qwen3 32B, DeepSeek R1 Distill, GPT-OSS 120B, **Whisper Large v3 + Turbo** | 30 RPM, 6K TPM, **14.400 RPD pe Llama 8B**, **1.000 RPD pe celelalte**. Whisper 2.000 RPD + 7.200 sec audio/oră | ⚠️ Llama 4 Scout/Maverick au capabilități multimodale dar sunt mai limitate. | ❌ | ✅ | NU | ⭐⭐ Decent prin Llama 70B. |
| **Cerebras** | Llama 3.1 8B/70B, Llama 4 Scout, Qwen3 32B / 235B, GPT-OSS 120B | 30 RPM, **1.000.000 tokens/zi**, context limitat la 8.192 tokens free | ❌ Doar text. | ❌ | ✅ | NU | ⭐⭐ Decent. ⚡ Cel mai rapid hardware (~2.600 tps). |
| **Mistral** ("Experiment") | Toate modelele: Large 2, Small, Codestral, Pixtral, **Mistral Embed**, **Mistral OCR** | 1 RPS, 500K TPM, **1.000.000.000 tokens/lună** | ✅ Pixtral, Mistral OCR (model dedicat OCR!) | ✅ Mistral Embed | ✅ | ❌ Doar telefon verificat | ⭐⭐ Bună (model european, română decent). |
| **Cohere** | Command R+, Command A, **Embed v3 multilingv (100+ limbi inclusiv ro)**, **Rerank 3.5** | 20 RPM Chat, 5 RPM Embed, **1.000 calls/lună total** | ❌ Vision limitat. | ✅ ⭐ Embed Multilingual e printre cele mai bune pentru română | ✅ | NU | ⭐⭐⭐ Excelent prin Embed Multilingual. |
| **OpenRouter** | DeepSeek R1, DeepSeek V3.2, Qwen3 Coder 480B, Llama 3.3 70B, Gemma 3, ~30 modele cu sufix `:free` | **20 RPM, 200 RPD per model** dacă <10 credite; **1.000 RPD/model dacă ai depus măcar $10** | ✅ Unele modele (Llama 4, Gemini Flash route) | ⚠️ Limitat | ✅ | NU pentru free | ⭐⭐ Variabil (depinde de model). |
| **GitHub Models** | GPT-4.1, GPT-5, Llama, Phi, Mistral, **DeepSeek**, embeddings | Limite "low/high/embedding" diferite — tipic 50–150 req/zi pe modele frontier | ✅ GPT-4.1 vision, etc. | ✅ | ✅ | NU (cere doar GitHub account) | ⭐⭐⭐ Foarte bună prin GPT-5/4.1. |
| **DeepSeek API** | DeepSeek V4 Flash, V4 Pro, R1 | **5M tokens free la cont nou**, apoi pay-as-you-go (foarte ieftin: $0.14/M input) | ❌ Text-only oficial | ❌ | ✅ | DA pentru a top-up | ⭐ Decent pe română. |
| **SambaNova Cloud** | Llama 3.1 8B/70B/405B, Llama 3.3 70B, Qwen 2.5 72B, QwQ | $5 credite gratis (~30M tokens Llama 8B) + Free tier permanent (10–30 RPM/model) | ❌ | ❌ | ✅ | NU pentru Free | ⭐⭐ Bună prin 70B/405B. |
| **HuggingFace Inference Providers** | Acces la 800.000+ modele open source via routare la providers (Together, fal, Replicate, SambaNova) | "Generous credits" lunar (nu publicat exact, ~$0.10 echivalent), 200+ modele rulează gratuit | ✅ Multe modele vision | ✅ ⭐ Cele mai bune sentence-transformers (e.g., `paraphrase-multilingual-mpnet-base-v2` cu suport ro) | ⚠️ Depinde de model | NU | ⭐⭐ Modele ro-tuned disponibile. |
| **Cloudflare Workers AI** | Llama 3.1/3.2/3.3, Mistral, Whisper, FLUX.2, embeddings BGE | **10.000 neuroni/zi gratuit** (~1.000–10.000 inference-uri în funcție de model) | ✅ Llama 3.2 Vision, FLUX | ✅ BGE | ⚠️ Limitat | NU | ⭐⭐ Decent. |
| **Ollama (local)** | Orice model open-weight (Llama 3.1 8B, Phi-3, Qwen 2.5, etc.) | NELIMITAT — limitat de hardware-ul laptop-ului | Depinde de model | ✅ | ✅ | — | Depinde de model |

### 3.2 OCR — soluții free pentru scan documente fizice

Mama va face poză unei rețete medicale, ambalaj de pastilă, formular fizic. Recomandări:

1. **Tesseract.js (browser-side, ZERO cost, fără API)** — port WebAssembly al Tesseract OCR. Suportă **română nativ** (`'ron'` language pack, ~10 MB). Acuratețe 95–99% pe text printat curat la 300 DPI; scade la 70–80% pe fotografii la lumină slabă. **Procesare 1–3 secunde/pagină pe laptop, ~5–10 sec pe Android.** ❗ Nu suportă scris de mână, tabele cu structură, layout multi-coloană. Funcționează offline, perfect pentru PWA.
2. **Google Gemini 2.5 Flash Vision** (gratuit prin AI Studio, 250 RPD) — OCR multimodal AI care înțelege și **structura semantică** (extrage automat câmpurile rețetei: medicament, doză, frecvență). Acuratețe net superioară Tesseract pentru poze de telefon. **Recomandarea de bază pentru OCR în mami-docs.**
3. **Mistral OCR** (Mistral Experiment, 1B tokens/lună free) — model dedicat OCR, suport multilingv inclusiv română. Foarte bună pentru documente structurate.
4. **Google Cloud Vision API** — 1.000 unități gratuit/lună permanent pe Free tier, OCR de calitate enterprise. Cere card.
5. **Microsoft Azure Computer Vision Free** — 5.000 tranzacții/lună, 20 calls/min. Cere card.

**Strategia recomandată mami-docs (cascadă)**:
- Mama face poză → încărcată în Supabase Storage privat.
- Tesseract.js rulează prima oară pe imagine (instant, offline-capable).
- Dacă încrederea Tesseract <80%, automat trimite la Gemini 2.5 Flash via Cloudflare Worker pentru re-OCR + extragere structurată.
- Rezultat structurat (medicament, doză, frecvență) salvat în Postgres.

### 3.3 Embeddings pentru RAG (căutare semantică în documentele mamei)

| Model | Dimensiuni | Suport română | Free tier | Recomandare |
|---|---|---|---|---|
| **Google `gemini-embedding-001`** | 768 / 1536 / 3072 | ⭐⭐⭐ Excelent | **10M tokens/min gratuit** | ⭐ **Alegerea de bază.** Multimodal (text + imagine). |
| **Cohere Embed v3 Multilingual** | 1024 | ⭐⭐⭐ Excelent (100+ limbi optimizate) | 1.000 calls/lună (pe trial key) | Best-in-class pentru română semantic, dar volume mic. |
| **Mistral Embed** | 1024 | ⭐⭐ Bună | În cadrul 1B tokens/lună | Alternativă europeană solidă. |
| **HuggingFace `paraphrase-multilingual-mpnet-base-v2`** | 768 | ⭐⭐⭐ Optimizat ro | Gratuit prin Inference API + **rulează gratuit local prin Tesseract.js-style WASM (transformers.js)** | ⭐ **Cea mai bună opțiune offline-first** — embeddings client-side în browser, fără costuri API. |
| **OpenAI text-embedding-3-small** | 1536 | ⭐⭐ Bună | Plătit | Doar ca referință. |
| **Voyage AI** | 1024 | Nedocumentat | $200 credite la signup, apoi paid | Nu îl recomand pentru free strict. |

### 3.4 Lanțul de fallback recomandat 4-nivele pentru mami-docs

**Configurat în Cloudflare Worker (proxy AI)**:

1. **Nivelul 1 — Cerere normală conversațională (text)**: **Groq Llama 3.1 8B** (cel mai rapid, 14.4K RPD). Fallback la **Groq Llama 3.3 70B** (mai inteligent, 1K RPD) pentru cereri care necesită raționament.
2. **Nivelul 2 — Vision/OCR/multimodal**: **Google Gemini 2.5 Flash** (250 RPD, 1M context, vision nativ excelent). Fallback la **Gemini 2.5 Flash-Lite** (1.000 RPD, OCR mai slab dar funcționează).
3. **Nivelul 3 — Volum mare batch / sumarizare lungă**: **Cerebras Llama 70B** (1M tokens/zi, ultra-rapid). Excelent pentru auto-summary noaptea.
4. **Nivelul 4 — Backup când totul a căzut**: **OpenRouter free models** (DeepSeek R1, Qwen3 Coder) cu rotație automată între 5–10 modele `:free`. Fallback final: **Ollama local pe laptop admin** (când admin e online).

**Pentru embeddings (RAG memorie lungă)**: Gemini Embedding (10M TPM) ca primar, **transformers.js cu `paraphrase-multilingual-mpnet-base-v2` rulând în browser** ca offline backup. Stocare în **Supabase pgvector** (gratuit, 500 MB DB acoperă ~100K embeddings 768-dim).

**Note despre modele plătite (doar mențiune)**: Anthropic Claude (Sonnet $3/M, Opus $5/M, **fără free tier API permanent** — doar credite la signup) și OpenAI GPT-5 (paid only, $1.25/M+) sunt excluse din lanțul mami-docs. Claude e accesibil GRATUIT doar prin GitHub Models într-o formă limitată (50–150 req/zi).

---

## SECȚIUNEA 4 — Funcționalități Inteligente și Inovatoare

### A) Capabilități AI avansate (memorie lungă, RAG, agenți specializați)

#### A1. Arhitectură memorie pe termen lung
**Stack recomandat 100% gratuit**:
- **Storage embeddings**: Supabase Postgres + pgvector (extensie nativă, gratuit pe Free tier).
- **Generare embeddings**: Google `gemini-embedding-001` (10M TPM) sau transformers.js `paraphrase-multilingual-mpnet-base-v2` (offline, browser-side).
- **Pattern**: fiecare conversație și fiecare document salvat de mama generează un chunk + embedding în tabela `memory(id, content, embedding vector(768), tab text, created_at, importance int)`.
- **Recuperare la query nou**: top-k similarity search (cosine) pe ultimele 30 zile + boost importance score.
- **Complexitate implementare**: **medie**. Fază: după MVP (Faza 2).

#### A2. RAG (Retrieval Augmented Generation)
- Toate documentele scrise de mama (rețete, jurnal, sfaturi de la admin) → segmentate în chunk-uri 500–1000 tokens → embedding → salvate în pgvector.
- La fiecare cerere AI, Worker-ul: (1) face embedding al query-ului, (2) caută top-5 cele mai similare chunk-uri, (3) le adaugă în prompt înainte de a apela LLM-ul.
- **Complexitate**: **medie–înaltă**. Fază: **Faza 3** (după ce există suficient conținut).
- **Limită realistă**: pe Supabase Free 500 MB → ~100K chunk-uri 768-dim cu metadate. Pentru 5–10 ani de jurnal personal, suficient.

#### A3. Agenți specializați per tab
Implementare prin **system prompts dedicate** (NU prin modele separate). Pattern:
- Tab "Rețete bucătărie" → system prompt "Ești un ajutor culinar bunic, răspunde simplu, cu unități metrice românești, propune substituiri pentru ingrediente lipsă..."
- Tab "Sănătate" → system prompt "Ești un asistent medical informativ, NU dai diagnostice, sugerezi întrebări pentru medic, folosești limbaj simplu..."
- Tab "Livadă/grădină" → system prompt expert horticol cu sezon românesc.
- Toți partajează aceeași memorie pgvector, dar filtrată pe `tab`.
- **Complexitate**: **scăzută**. Fază: MVP+1.

#### A4. Auto-sumarizare conținut nou
- Cron Cloudflare Worker la 03:00 noaptea: pentru fiecare document nou adăugat în ziua respectivă, apel Cerebras Llama 70B (rapid, 1M tokens/zi) pentru a genera sumar 2 propoziții.
- Sumarul e atât în prompt-ul context, cât și afișat ca "preview" în UI pentru mama.
- **Complexitate**: scăzută. Fază: Faza 2.

#### A5. AI proactiv pe baza timpului/sezonului
- Cron zilnic 08:00: query către Gemini cu "Ce ar fi util să-i amintesc lui [nume mamă] în [data] în [județul X, România], având istoricul recent: [ultimele 7 zile]?".
- Răspunsul e trimis ca notificare prin ntfy/Telegram. Exemple: "E sezonul gutuilor — vrei rețete?", "Săptămâna trecută ai zis că plouă mult — verifică plantele de pe geam", "Mâine e ziua surorii tale — vrei să-i scriem împreună?".
- **Free services**: Cron Workers + Gemini Flash + ntfy/Telegram.
- **Complexitate**: medie. Fază: Faza 3.

### B) Wellness și sănătate pasivă cu notificări telefonice

#### B1. CHEIA: Cum face telefonul mamei să SUNE la medicamente, NU al admin-ului

**Realitate tehnică**: PWA pur nu poate genera apel întrant. Web Push pe Chrome Android folosește canalele de notificare Android, care **pot avea sunet de alarmă custom dacă utilizatorul îl setează manual o singură dată**. Apoi push-ul vine cu acel sunet (până la 60 sec de "ringtone").

**Strategia recomandată — combinație stratificată**:

| Soluție | Cum funcționează | Free tier | Sunet ca apel |
|---|---|---|---|
| ⭐ **ntfy.sh prioritate 5 ("urgent")** | Cron Workers la 08:00, 14:00, 20:00 → POST la `ntfy.sh/medicamente-mami-secret-uuid` cu `Priority: 5`. App ntfy Android pe telefonul mamei (instalat manual o dată); admin NU instalează app-ul. | 250 msg/zi (mai mult decât suficient) | ✅ Da, dacă mama configurează canalul Android de prioritate "Urgent" cu ringtone alarmă (lung, intruziv) — exact ca un telefon. |
| ⭐⭐ **CallMeBot Telegram Voice Call** | Cron Workers → `https://api.callmebot.com/start.php?user=@mami&text=Mama+e+ora+8+ia+pastila+galbenă&apikey=XXX`. Generează apel întrant în Telegram cu TTS în română. | Gratuit personal (TTS via Google voci, română suportată) | ⭐⭐ **Cea mai apropiată de "apel real"** — sună exact ca un Telegram call de la prieten. Cere ca Telegram să fie pe telefon și să accepte apeluri. |
| **Telegram Bot text mesaj cu 🔴 emoji + sunet bot** | Cron → Telegram Bot API `sendMessage`. Mama doar trebuie să aibă chat-ul cu bot-ul activ. Sunet implicit Telegram. | Nelimitat | Doar notificare cu sunet. |
| **FCM topic dedicat** | Service Worker se abonează la topic `medicamente`. Doar telefonul mamei se abonează (admin nu). Cron Workers → FCM REST API. | Nelimitat | Sunet canal Android, configurabil. |
| **Eveniment .ics descărcat** | La crearea reminder-ului, generezi un fișier `.ics` cu `VALARM` la timpul respectiv. Mama îl deschide → Google Calendar Android creează alarmă nativă. | Nelimitat | ✅ Alarmă Android nativă completă (cu snooze). |
| **Pushover** | $4.99 lifetime — nu free; menționat doar ca rezervă paid. | (paid one-time) | — |

**Recomandarea finală pentru "telefonul mamei să sune"**:
1. **Setup primar**: ntfy.sh app instalat pe telefonul mamei + canal "medicamente" cu prioritate 5 + ringtone custom = "alarm_clock_loop.mp3" în setările Android.
2. **Backup redundant**: în paralel, același cron trimite și Telegram message + FCM push (în caz că ntfy e jos).
3. **Pentru reminder-e absolut critice (medicație vitală)**: CallMeBot Telegram voice call, care sună cu TTS în română. Aproape imposibil de ratat.
4. **Niciodată** notificare către dispozitivul admin pe topic-ul medical — separare strictă în backend pe `device_role`.

**Complexitate**: medie (un setup inițial atent pe telefonul mamei). Fază: Faza 2 imediat după MVP.

#### B2. Jurnal de stare/wellness cu AI tracking
- Mama spune zilnic 30 sec voice (Web Speech API ro-RO → text).
- Text trimis la Gemini Flash cu prompt "extrage starea emoțională (1-10), starea fizică, simptome menționate, evenimente notabile" — JSON structurat.
- Salvat în Postgres ca `wellness_log(date, mood int, energy int, symptoms jsonb, raw_text)`.
- Săptămânal, AI detectează tendințe: "Trei zile la rând ai menționat dureri de cap; vrei să-l anunț pe [admin]?".
- **Servicii free**: Web Speech + Gemini Flash + Supabase + Cloudflare Workers + Telegram bot.
- **Complexitate**: medie. Fază: Faza 3. Dependență: agenții specializați.
- **Limită**: AI-ul NU înlocuiește medic — disclaim explicit.

#### B3. Hidratare legată de vreme
- Cron orar Workers → Open-Meteo API (**100% gratuit, fără API key, deschis**) pentru weather Cluj/București/zona mamei.
- Dacă T° > 28°C și umiditate < 40%, frecvență reminder hidratare crește de la 3/zi la 6/zi via ntfy notă scurtă.
- **Complexitate**: scăzută. Fază: Faza 2.

#### B4. Tracking semne vitale (input manual)
- UI butoane mari "Tensiune azi", "Glicemie azi", "Greutate" — input numeric mare, voice optional.
- Stocare în Postgres cu trigger pentru a calcula media mobilă 7-zile.
- Vizualizare cu chart.js (offline-friendly).
- AI generează automat un raport săptămânal: "Tensiunea sistolică a crescut de la 130 la 142 față de săptămâna trecută."
- **Complexitate**: scăzută–medie. Fază: Faza 2.

#### B5. Tracker simptome cu pattern recognition
- Lista simptome predefinite + posibilitate "altul" voice.
- AI rulează lunar peste log: "Toate durerile de cap apar luni dimineața — corelația cu somnul de duminică?".
- **Complexitate**: medie. Fază: Faza 3 (cere date pe min 30 zile).

#### B6. Avertizări interacțiuni medicamente (FREE)
- **RxNorm REST API** la NLM/NIH: complet gratuit, **fără API key, 20 req/sec**. Endpoint `/interaction/list.json?rxcuis=...` returnează interacțiuni din DrugBank + ONCHigh cu severitate.
- **openFDA Drug API**: complet gratuit, fără cheie, evenimente adverse FDA.
- Workflow: mama scanează ambalaj → OCR Gemini extrage numele → căutare RxNorm pentru RxCUI → check `/interaction/list` cu RxCUI-urile din toate medicamentele active.
- Avertizare în UI cu severitate codificată color.
- ❗ **Limitare critică**: bazele americane — denumirile românești nu se mapează direct. Soluție: Gemini Flash trad nume RO→EN și caută. Acuratețe ~70%, suficient pentru "atenție potențială" + recomandare "întreabă farmacistul".
- **Complexitate**: înaltă. Fază: Faza 4.

#### B7. Tracker somn
- Input simplu: "ora la care m-am culcat" + "ora la care m-am trezit" + "calitate 1–5" (3 butoane mari).
- Vizualizare grafică cu zone "bune / proaste".
- **Complexitate**: scăzută. Fază: Faza 2.

#### B8. Check-in emoțional zilnic cu răspuns empatic
- Notificare zilnică 19:00: "Cum a fost ziua ta, mama?" — voice answer 30 sec.
- Gemini Flash răspunde empatic, în română conversațională, cu un sfat sau încurajare scurtă, nu lecție.
- ❗ Atenție disclaim AI: nu înlocuiește companie umană / terapie.
- **Complexitate**: scăzută. Fază: Faza 2.

#### B9. Family wellness sharing (cu acord explicit)
- Mama bifează "trimite zilnic admin un sumar 3 linii al stării mele".
- Fiecare seară, Cron generează sumarul cu Gemini și-l trimite admin pe Telegram.
- Admin poate răspunde cu un mesaj de încurajare care apare la mama în UI.
- ❗ Implementare RLS strictă în Supabase: nimeni nu poate citi `wellness_log` fără ca mama să fi acordat explicit `share_with_user_id`.
- **Complexitate**: medie. Fază: Faza 3.

#### B10. Generare sumar medical PDF pentru consultație
- Buton "Pregătire vizită medic" → AI compunere automată (Gemini): "Sumar ultimele X zile: tensiune medie 138/85, două episoade dureri cap, medicamente actuale: ...". 
- Generare PDF client-side cu **jsPDF** sau **pdf-lib** (libraries free, NPM, browser).
- PDF are layout simplu, font mare, printabil.
- **Complexitate**: medie. Fază: Faza 3.

### Sinteză tabelară Funcționalități Faza 4

| # | Funcție | Complexitate | Fază | Servicii free | Limitare realistă |
|---|---|---|---|---|---|
| A1 | Memorie lungă cu vector DB | Medie | 2 | Supabase pgvector + Gemini Embed | 100K chunks pe Free |
| A2 | RAG | Medie–Înaltă | 3 | pgvector + Gemini Flash | Necesită ≥1.000 docs |
| A3 | Agenți pe tab | Scăzută | 1.5 | System prompts | — |
| A4 | Auto-sumar | Scăzută | 2 | Cerebras 70B + Cron | — |
| A5 | AI proactiv | Medie | 3 | Gemini Flash + Cron + ntfy | Calitate variabilă |
| B1 | Reminder telefon sună | Medie | 2 | ntfy.sh + Telegram + CallMeBot | Setup canal Android necesar |
| B2 | Jurnal wellness AI | Medie | 3 | Web Speech + Gemini + Supabase | ro-RO TTS dependent device |
| B3 | Hidratare vremuri | Scăzută | 2 | Open-Meteo + Workers + ntfy | — |
| B4 | Semne vitale | Scăzută | 2 | Postgres + chart.js | Input manual |
| B5 | Pattern simptome | Medie | 3 | Gemini + pgvector | Necesită ≥30 zile date |
| B6 | Interacțiuni medicamente | Înaltă | 4 | RxNorm + openFDA + Gemini | Mapare RO→EN ~70% |
| B7 | Tracker somn | Scăzută | 2 | Postgres | Input manual |
| B8 | Check-in emoțional | Scăzută | 2 | Web Speech + Gemini | — |
| B9 | Family sharing | Medie | 3 | RLS Supabase + Telegram | Doar cu acord scris |
| B10 | PDF medical | Medie | 3 | Gemini + jsPDF client-side | — |

---

## Caveats și Considerații Critice

1. **Toate "free tier"-urile sunt schimbabile fără preaviz.** Google a tăiat Gemini Free cu 50–80% în decembrie 2025; Netlify a redus în 2025 minute build-urilor; Heroku a eliminat free permanent în 2022. **Mami-docs trebuie să aibă fallback chains la fiecare nivel** — exact ce face arhitectura propusă. Configurează monitorizare automată (un cron care testează fiecare API zilnic cu o cerere mică și alertează admin via Telegram dacă răspunde 429/403/eroare).

2. **GitHub Pages + repo public ≠ private data**. Reține regula: **fișiere medicale, foto rețete, jurnal personal NU intră în repo.** Doar UI-ul și conținut public-by-default (etichete, schema). Datele sensibile = Supabase Storage privat cu URL-uri semnate generate de Worker la cerere.

3. **Calitatea recunoașterii vocale române Chrome Android variază mult între device-uri** — de la "excelentă" (Samsung Galaxy A50+, Pixel cu pachet vocal Google instalat) la "neutilizabilă" (telefoane mai vechi cu ROM-uri non-stock). Înainte de oricel altceva, testează personal pe TELEFONUL exact al mamei — instalează Google Speech Services dacă lipsește.

4. **"Telefonul sună la medicament" este 100% dependent de configurarea Android pe telefonul mamei** (canal de notificare cu sunet de alarmă lung). Nu există API care să forțeze Chrome PWA să suprime "Do Not Disturb". Singura modalitate ca un PWA să "depășească" DND e dacă utilizatorul a aprobat manual canalul ca "Override DND" în settings Android — care, în practică, doar Android 12+ permite limpede.

5. **Avertismente medicale obligatorii**: orice funcție de tracking simptome / interacțiuni medicamente / sumar pentru medic trebuie să aibă disclaim mare în UI: "Aceasta NU este consultație medicală. Verifică întotdeauna cu medicul / farmacistul." Inclusiv în output-ul AI prin system prompt forțat. Fără asta, riscul juridic și etic e real.

6. **Supabase Free pause după 7 zile**: dacă nu implementezi keepalive-ul, într-o săptămână când admin e în vacanță și mama nu deschide app-ul, totul cade. **Implementează keepalive-ul cron CHIAR DE LA MVP**, nu lăsa pentru mai târziu.

7. **CallMeBot rulează ca hobby project pe AWS al unei singure persoane** — disponibilitatea nu e garantată, "free pentru uz personal" e regula casei. Pentru reminder vital, NU baza arhitectura doar pe el; folosește-l ca al doilea sau al treilea nivel de redundanță, nu ca primar.

8. **DeepSeek (servere în China)**: pentru date medicale sensibile, evită. Italia a interzis DeepSeek la începutul lui 2025 pe motive GDPR; România e în UE. Folosește-l doar pentru cereri non-personale (rețete bucătărie generice, sfaturi grădină) sau evită complet în mami-docs.

9. **Open-Meteo**: chiar dacă e gratuit fără API key, pune un User-Agent identificabil în request-uri și respectă politicile (max ~10K calls/zi pentru personal). Pentru un singur utilizator e ireperabil sub limită.

10. **Embeddings cross-provider sunt INCOMPATIBILE.** Dacă schimbi de la Gemini Embedding la HuggingFace mpnet, trebuie să re-embedding-uiești toate documentele (nu poți căuta în pgvector cu vectori de la modele diferite). Decide DE LA START care e modelul de embedding și nu-l schimba ușor — sau implementează versionare în coloana `embedding_model_version` și suport multi-model.

11. **Plan privat de "exit"**: dacă într-un an Cloudflare Workers Free schimbă politica, codul e portabil la Deno Deploy într-o săptămână. Dacă Supabase devine restrictiv, datele se exportă oricând prin `pg_dump` (fiind Postgres standard) și se mută la Neon sau self-hosted. Această portabilitate e parte din valoarea arhitecturii alese.