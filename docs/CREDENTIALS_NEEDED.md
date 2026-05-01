# Credențiale necesare — Mami_Docs

> **Pentru admin (Roland).** Fiecare secțiune = o cheie sau set de chei lipsă din sistemul global `~/.api-keys/`. Urmează pașii numerotați și completează fiecare valoare în `INBOX.md`. La final, deschide Claude Code în folderul `~/.api-keys/` și scrie `proceseaza inbox` pentru a propaga valorile în Windows env vars + Cloudflare Secrets.
>
> **Data:** 2026-05-01 | **Status:** 4 secțiuni = 4 servicii externe de configurat
>
> **Cele deja existente** (toate 54 din catalog) **NU se ating** — sunt deja SET în env vars și folosite corect prin `process.env.X` / `import.meta.env.VITE_*`.

---

## ⚠ Important înainte de a începe

1. **Niciodată** nu lipi valori în chat Claude. După ce le obții, le pui exclusiv în `C:\Users\ALIENWARE\.api-keys\INBOX.md` (offline, pe disk).
2. **Niciodată** nu commiti fișiere `.env*` în git (deja blocat de `.gitignore`).
3. **Pentru fiecare secțiune** — rezultatul final e o linie `NUME_VAR=valoare` în `INBOX.md`. După ce ai toate, rulezi o singură dată "proceseaza inbox" și gata.

---

## Sectiunea 1 — Supabase (obligatoriu pentru Faza 1.5+)

**De ce ai nevoie:** Bază de date privată pentru wellness (tensiune, hidratare, somn, foto), auth pentru sharing cu familia (Faza 3), backup automat.

**Cost:** Gratuit — Free tier (500MB DB, 1GB Storage, 2GB bandwidth/lună). Card NU e necesar.

**Linkuri:**

- Înregistrare: https://supabase.com/dashboard/sign-up
- Documentație: https://supabase.com/docs/guides/getting-started

### Pași

1. Deschide **https://supabase.com/dashboard/sign-up** → cont nou cu GitHub (recomandat — folosește deja `petrilarolly` GitHub).
2. **Create new organization** → numele oricare (ex. „Petrila Personal"). Plan: **Free**.
3. **New project**:
   - **Name:** `mami-docs`
   - **Database Password:** generează unul tare (Supabase oferă buton "Generate"). **Salvează-l** — nu îl mai vezi după.
   - **Region:** `Central EU (Frankfurt)` — cel mai aproape de România, latency minim.
   - **Pricing Plan:** Free
   - Click **Create new project** → așteaptă ~2 min să se provisioneze.
4. **Settings → API** (meniu stânga jos, ⚙️):
   - Copiază **Project URL** (ex. `https://xxxxxxxxx.supabase.co`)
   - Copiază **Project API Keys → `anon` `public`** (lung, începe cu `eyJ...`)
   - Copiază **Project API Keys → `service_role` `secret`** (lung, începe cu `eyJ...`) — ⚠ ATENȚIE: această cheie ocolește RLS, NICIODATĂ în client. Doar Cloudflare Secrets.
5. **Database → SQL Editor** → rulează schema inițială (Faza 1.5):

   ```sql
   -- Wellness tables (RLS dezactivat la început, activ în Faza 3 cu auth)
   CREATE TABLE hydration (
     id text PRIMARY KEY,
     ts timestamptz NOT NULL DEFAULT now(),
     amount_ml int NOT NULL
   );
   CREATE TABLE vitals (
     id text PRIMARY KEY,
     ts timestamptz NOT NULL DEFAULT now(),
     systolic int NOT NULL,
     diastolic int NOT NULL,
     pulse int
   );
   CREATE TABLE emotion (
     id text PRIMARY KEY,
     ts timestamptz NOT NULL DEFAULT now(),
     level int NOT NULL CHECK (level BETWEEN 1 AND 5),
     note text
   );
   CREATE TABLE sleep (
     id text PRIMARY KEY,
     start_ts timestamptz NOT NULL,
     end_ts timestamptz NOT NULL,
     hours numeric NOT NULL
   );
   CREATE TABLE photos_meta (
     id text PRIMARY KEY,
     ts timestamptz NOT NULL DEFAULT now(),
     caption text,
     blob_size int NOT NULL
   );

   -- Funcție ping pentru keepalive (workers/keepalive)
   CREATE OR REPLACE FUNCTION public.ping()
   RETURNS json LANGUAGE sql AS $$ SELECT json_build_object('ok', true); $$;
   ```

6. **Database → Webhooks** (opțional Faza 3) — lasă pe pauză.
7. **Adaugă în `~/.api-keys/INBOX.md`:**
   ```
   SUPABASE_URL=https://xxxxxxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

**Ce deblochează:**

- `workers/keepalive` deploy (cron 4 zile preventie hibernare)
- Sincronizare automată wellness local → cloud (`mirrorAllToSupabase()`)
- Galerie foto cloud (Faza 3)
- Auth Google + RLS family sharing (Faza 3)

---

## Sectiunea 2 — ntfy.sh (recomandat pentru Faza 2)

**De ce ai nevoie:** Notificări push către telefonul mamei când app-ul e închis (reminder medicament, alertă senzori). Free, **fără cont, fără card**.

**Linkuri:**

- Site: https://ntfy.sh
- Documentație: https://docs.ntfy.sh
- Aplicație Android: https://play.google.com/store/apps/details?id=io.heckel.ntfy

### Pași

1. **Generează un topic random unic** (servește drept "secret URL" — oricine îl știe poate trimite/primi notificări).
   - Format recomandat: `mami-docs-` + 8 caractere random.
   - Exemplu: `mami-docs-x7k2p9q4`
   - Generator simplu: deschide https://ntfy.sh/app, click "Subscribe to topic", folosește un nume unic.
2. **Pe telefonul mamei:**
   - Instalează aplicația ntfy din Play Store (linkul de sus)
   - Deschide app → "+" (subscribe to topic) → introdu **același** nume topic (ex. `mami-docs-x7k2p9q4`)
   - **Notification settings:** activează "High priority" + "Sound + Vibration"
3. **Test rapid din terminal admin** (după setup):
   ```powershell
   curl -d "Test mama" https://ntfy.sh/mami-docs-x7k2p9q4
   ```
   → trebuie să sune pe telefonul mamei în 1-2 secunde.
4. **Adaugă în `~/.api-keys/INBOX.md`:**
   ```
   NTFY_URL=https://ntfy.sh/mami-docs-x7k2p9q4
   ```
   Notă: e _URL public_ — singura "protecție" e că numele topic e neghicit. Nu trimite informații sensibile prin ntfy.sh public. Pentru date private → self-host ntfy pe Cloudflare Worker (Faza 4).

**Ce deblochează:**

- Notificări push când mama nu are app deschis (reminder medicament, hidratare)
- Funcția `notify()` din `src/services/notifications.ts` va trimite și push, nu doar local

---

## Sectiunea 3 — CallMeBot WhatsApp (opțional, Faza 2 reminder telefon)

**De ce ai nevoie:** Apel voce pe WhatsApp către mama în caz de alertă critică (ex. tensiune > 180/120, n-a apăsat „M-am trezit" 3 zile la rând). Gratuit, dar necesită setup manual cu mama (o singură dată).

**Linkuri:**

- Site: https://www.callmebot.com
- Setup WhatsApp: https://www.callmebot.com/blog/free-api-whatsapp-messages/

### Pași (necesită prezență mama lângă tine)

1. **Pe telefonul mamei**, deschide WhatsApp → adaugă contact:
   - **Nume:** `CallMeBot`
   - **Număr:** `+34 644 51 95 23` (numărul oficial CallMeBot)
2. Trimite-i un mesaj: `I allow callmebot to send me messages`
3. Așteaptă răspunsul (~5 minute, depinde de încărcarea API-ului). Mesajul de răspuns conține o cheie de tipul:
   ```
   API Activated for your phone number. Your APIKEY is 1234567
   ```
4. **Salvează cheia + numărul mamei în format internațional** (fără `+`, fără spații).
   - Exemplu: dacă numărul mamei e `+40 712 345 678`, valoarea e `40712345678`.
5. **Test rapid** (înlocuiește valorile):
   ```
   https://api.callmebot.com/whatsapp.php?phone=40712345678&text=Test+Mami&apikey=1234567
   ```
   Deschide în browser. Trebuie să primească mama mesaj WhatsApp în câteva secunde.
6. **Adaugă în `~/.api-keys/INBOX.md`:**
   ```
   CALLMEBOT_API_KEY=1234567
   PHONE_NUMBER=40712345678
   ```

**Limitări CallMeBot:**

- Gratuit ~50 mesaje/zi pe număr (suficient pentru reminder critic 1-2/zi)
- Numărul `+34 644...` e singurul oficial — orice alt număr e scam
- WhatsApp poate bloca dacă spam → folosește doar pentru critical, nu reminder banale

**Ce deblochează:**

- `makeVoiceCall()` din `notifications.ts` (apel cu text-to-speech)
- Notificare critică cu voce (`level: "critical", voice: true`)

---

## Sectiunea 4 — Firebase Cloud Messaging (opțional, Faza 2 push Android nativ)

**De ce ai nevoie:** Push notifications native Android (mai fiabil decât ntfy.sh când telefonul e în Doze mode). Recomandat doar dacă ntfy se dovedește unreliable.

**Cost:** Gratuit (Spark plan — nelimitat FCM messages).

**Linkuri:**

- Console: https://console.firebase.google.com
- Documentație FCM: https://firebase.google.com/docs/cloud-messaging
- Web setup: https://firebase.google.com/docs/cloud-messaging/js/client

### Pași

1. **https://console.firebase.google.com** → login cu Google (folosește contul `petrilarolly@gmail.com`).
2. **Add project**:
   - **Project name:** `mami-docs`
   - **Google Analytics:** OFF (nu e necesar pentru proiect personal)
   - **Create**.
3. **Add app → Web** (icon `</>`):
   - **App nickname:** `mami-docs-web`
   - **Firebase Hosting:** OFF (folosim Cloudflare Pages)
   - **Register app**.
4. **Project Settings → General → Your apps → Web app:**
   - Copiază obiectul `firebaseConfig`:
     ```javascript
     const firebaseConfig = {
       apiKey: "AIza...",
       authDomain: "mami-docs.firebaseapp.com",
       projectId: "mami-docs",
       storageBucket: "mami-docs.appspot.com",
       messagingSenderId: "123456789",
       appId: "1:123456789:web:xxxxx",
     };
     ```
5. **Project Settings → Cloud Messaging:**
   - **Web Push certificates → Generate key pair** → copiază **Key pair** (VAPID public key, ex. `BNzZ...`)
6. **Project Settings → Service accounts → Generate new private key** → descarcă fișier JSON → salvează în `C:\Users\ALIENWARE\.api-keys\firebase-service-account.json` (NU în repo!).
7. **Adaugă în `~/.api-keys/INBOX.md`:**
   ```
   FIREBASE_API_KEY=AIza...
   FIREBASE_AUTH_DOMAIN=mami-docs.firebaseapp.com
   FIREBASE_PROJECT_ID=mami-docs
   FIREBASE_STORAGE_BUCKET=mami-docs.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=123456789
   FIREBASE_APP_ID=1:123456789:web:xxxxx
   FIREBASE_VAPID_KEY=BNzZ...
   FIREBASE_SERVICE_ACCOUNT_JSON_PATH=C:\Users\ALIENWARE\.api-keys\firebase-service-account.json
   ```

**Notă:** Firebase config (mai puțin service-account.json) e _public_ — apare în bundle client. Securitatea vine din regulile Firebase, nu din ascundere chei.

**Ce deblochează:**

- Push notif native Android via FCM (mai fiabil ca ntfy în Doze mode)
- Topic subscriptions per device (mama vs admin)

---

## Sectiunea 5 — Cloudflare R2 bucket (opțional, Faza 2 backup)

**De ce ai nevoie:** Backup zilnic Supabase → R2 (Cloudflare's S3-compatible storage). Free tier: 10GB storage, 1M ops/lună — mult peste nevoile proiectului.

**Cost:** Gratuit până la 10GB. **Card NU e necesar** pentru free tier.

**Linkuri:**

- Dashboard: https://dash.cloudflare.com (login cu contul `petrilarolly`)
- Documentație R2: https://developers.cloudflare.com/r2/

### Pași

1. **Cloudflare dashboard → R2** (meniu stânga) → click **Create bucket**.
   - **Bucket name:** `mami-docs-backup`
   - **Location:** `Automatic` (Cloudflare alege EU)
   - **Storage class:** Standard
   - Click **Create bucket**.
2. Deschide bucket-ul → **Settings → R2.dev subdomain** = OFF (nu vrem public).
3. **R2 → Manage R2 API Tokens → Create API Token**:
   - **Token name:** `mami-docs-backup`
   - **Permissions:** Object Read & Write
   - **Specify bucket:** `mami-docs-backup`
   - **TTL:** Forever
   - Click **Create API Token** → salvează **Access Key ID** + **Secret Access Key** (nu le mai vezi după).
4. **Adaugă în `~/.api-keys/INBOX.md`:**
   ```
   R2_ACCESS_KEY_ID=...
   R2_SECRET_ACCESS_KEY=...
   R2_BUCKET=mami-docs-backup
   R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
   ```
   (înlocuiește `<account_id>` cu valoarea din `CLOUDFLARE_ACCOUNT_ID` deja existentă).
5. **Wrangler binding** — în `workers/keepalive/wrangler.toml`:
   ```toml
   [[r2_buckets]]
   binding = "MAMI_DOCS_BACKUP"
   bucket_name = "mami-docs-backup"
   ```

**Ce deblochează:**

- Cron daily 02:00 UTC din `workers/keepalive` → dump Supabase → R2
- Recovery la dezastru (proiect Supabase șters / quota depășită)

---

## După ce ai toate cheile — pași finali

1. **Editează `~/.api-keys/INBOX.md`** cu toate liniile de mai sus.
2. Deschide PowerShell în `C:\Users\ALIENWARE\.api-keys\` → `claude` (Claude Code session în acel folder).
3. Scrie: `proceseaza inbox` → AI propagă valorile în Windows env vars + actualizează catalog.md.
4. **Verifică:**
   ```powershell
   & "C:\Users\ALIENWARE\.api-keys\verify.ps1"
   ```
   Trebuie să vezi `[SET]` pentru toate cheile noi.
5. **Restart terminal** (Windows env vars noi nu sunt vizibile în terminale deschise anterior).
6. Deschide Claude Code în `C:\Proiecte\Mami_Docs\` și scrie:
   ```
   continuă deploy worker keepalive + setup pages env vars + sync wellness local→cloud
   ```
   AI va executa secvența completă (cu confirmare admin la fiecare pas remote).

---

## Sumar — Cheile relevante

| Cheie                                | Sursă                           | Status acum | Blochează                                 |
| ------------------------------------ | ------------------------------- | ----------- | ----------------------------------------- |
| `SUPABASE_URL`                       | supabase.com → API              | ❌ LIPSĂ    | Faza 1.5 keepalive, Faza 2 wellness cloud |
| `SUPABASE_ANON_KEY`                  | supabase.com → API              | ❌ LIPSĂ    | Frontend Supabase client                  |
| `SUPABASE_SERVICE_ROLE_KEY`          | supabase.com → API              | ❌ LIPSĂ    | Worker admin operations                   |
| `NTFY_URL`                           | ntfy.sh (topic random)          | ❌ LIPSĂ    | Push notif când app închis                |
| `CALLMEBOT_API_KEY`                  | WhatsApp +34 644 51 95 23       | ❌ LIPSĂ    | Apel voce alerte critice                  |
| `PHONE_NUMBER`                       | număr mama format internațional | ❌ LIPSĂ    | Destinatar CallMeBot                      |
| `FIREBASE_*` (7 chei)                | console.firebase.google.com     | ❌ LIPSĂ    | Push native Android (alternativ ntfy)     |
| `R2_ACCESS_KEY_ID` + secret + bucket | Cloudflare R2                   | ❌ LIPSĂ    | Backup zilnic Supabase                    |

**Restul (54 chei catalog actual)** = ✅ deja SET, niciun acțiune necesară.

---

## Note de securitate

- **GROQ, GEMINI, MISTRAL, COHERE etc.** — folosite EXCLUSIV server-side via Cloudflare Worker (`workers/ai-gateway`). Niciodată în bundle client.
- **SUPABASE_ANON_KEY** — e public-safe (RLS protejează). Apare în bundle client cu prefix `VITE_`.
- **SUPABASE_SERVICE_ROLE_KEY** — bypass RLS, EXCLUSIV în Cloudflare Secrets (`wrangler secret put`).
- **FIREBASE\_\*** (web config) — public-safe (regulile Firebase sunt sursa securității).
- **firebase-service-account.json** — secret, EXCLUSIV pe disk admin + Cloudflare Secrets dacă ajunge în Worker.
- **R2 keys** — server-side only, Cloudflare Worker Secrets.
- **ntfy.sh URL** — semi-public (oricine ghicește topic-ul vede mesajele) → nu trimite date medicale prin el. Pentru privat → self-host (Faza 4).
