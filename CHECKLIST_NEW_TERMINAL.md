# Checklist Sesiune Nouă — Mami_Docs

> **Citește la deschiderea unui terminal/sesiune nouă.** Bootstrap sub 5 minute.
> Ultim update: sesiune precedentă a făcut deploy Supabase + Pages env vars + 6 commits + push.

---

## 🔍 Pas 1 — Verificare context (30 sec)

```powershell
cd C:\Proiecte\Mami_Docs
git log --oneline -8
git status --short
```

**Așteptat:** ultim commit `dca70ef chore(workers): scripturi deploy + smoke test`. Working tree clean (sau doar fișiere noi documentație).

---

## 🔑 Pas 2 — Verificare credențiale (30 sec)

```powershell
& "C:\Users\ALIENWARE\.api-keys\verify.ps1"
```

**Așteptat:** `Total: 57 setate, 0 nesetate` (54 inițial + 3 Supabase).

Dacă lipsesc: rulează `& "C:\Users\ALIENWARE\.api-keys\sync-env-vars.ps1"`.

---

## 🌐 Pas 3 — Smoke test endpoints live (60 sec)

```powershell
cd C:\Proiecte\Mami_Docs
powershell -ExecutionPolicy Bypass -File "workers\smoke-test.ps1"
```

**Așteptat:**
- ✅ Test 4 AI Gateway `/chat` → reply "OK"
- ❌ Test 1-3 încă eșuează cu 404 până când SQL schema rulează în Supabase

---

## ⚠ Pas 4 — Ce e blocant ACUM

| Item | Status | Acțiune |
|---|---|---|
| Tabele Supabase wellness | ❌ NU există | **Rulează SQL în Supabase SQL Editor** ← blocant Faza 2 |
| App live `mami-docs.pages.dev` | ✅ Funcțional | Wellness scrie local; mirror Supabase după ce tabelele există |

**👉 [SQL Editor Supabase](https://supabase.com/dashboard/project/zfeaoiafzeygwwjskevt/sql/new)**

SQL-ul de rulat (clean, fără funcția problematică `ping`):

```sql
CREATE TABLE IF NOT EXISTS hydration (id text PRIMARY KEY, ts timestamptz NOT NULL DEFAULT now(), amount_ml int NOT NULL);
CREATE TABLE IF NOT EXISTS vitals (id text PRIMARY KEY, ts timestamptz NOT NULL DEFAULT now(), systolic int NOT NULL, diastolic int NOT NULL, pulse int);
CREATE TABLE IF NOT EXISTS emotion (id text PRIMARY KEY, ts timestamptz NOT NULL DEFAULT now(), level int NOT NULL CHECK (level BETWEEN 1 AND 5), note text);
CREATE TABLE IF NOT EXISTS sleep (id text PRIMARY KEY, start_ts timestamptz NOT NULL, end_ts timestamptz NOT NULL, hours numeric NOT NULL);
CREATE TABLE IF NOT EXISTS photos_meta (id text PRIMARY KEY, ts timestamptz NOT NULL DEFAULT now(), caption text, blob_size int NOT NULL);

ALTER TABLE hydration ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotion ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_hydration" ON hydration FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_vitals" ON vitals FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_emotion" ON emotion FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_sleep" ON sleep FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_photos_meta" ON photos_meta FOR ALL TO anon USING (true) WITH CHECK (true);
```

**Pași:**
1. Tap link → Login Supabase
2. Lipește SQL → **Run**
3. Verifică: 👉 [Table Editor](https://supabase.com/dashboard/project/zfeaoiafzeygwwjskevt/editor) — trebuie 5 tabele
4. Re-rulează `workers\smoke-test.ps1` — toate verde

---

## 🚀 Pas 5 — Continuă cu următoarele credentiale (după Supabase verde)

În ordine de prioritate (din `docs/CREDENTIALS_NEEDED.md`):

| Pas | Serviciu | Timp | Link tap-direct |
|---|---|---|---|
| §2 | ntfy.sh | 3 min | [Play Store ntfy](https://play.google.com/store/apps/details?id=io.heckel.ntfy) |
| §3 | CallMeBot WhatsApp | 10 min (cu mama) | [Trimite mesaj activare](https://wa.me/34644519523?text=I%20allow%20callmebot%20to%20send%20me%20messages) |
| §4 | Firebase FCM (opțional) | 15 min | [Firebase Console](https://console.firebase.google.com/) |
| §5 | Cloudflare R2 backup | 5 min | [R2 Buckets](https://dash.cloudflare.com/?to=/:account/r2/overview/buckets) |

Workflow procesare: lipește valori în `C:\Users\ALIENWARE\.api-keys\INBOX.md` → în acel folder, sesiune Claude → `proceseaza inbox`.

---

## 🛠 Comenzi utile la îndemână

### Build + deploy Pages (când modifici frontend)

```powershell
cd C:\Proiecte\Mami_Docs
npm run build
npx wrangler pages deploy dist --project-name=mami-docs --branch=main --commit-dirty=true
```

### Redeploy worker AI Gateway

```powershell
cd C:\Proiecte\Mami_Docs\workers\ai-gateway
npx wrangler deploy
```

### Trigger manual cron keepalive (test)

```powershell
cd C:\Proiecte\Mami_Docs\workers\keepalive
npx wrangler tail
# (pe alt terminal) așteaptă să se declanșeze sau redeploy pentru a forța execuție
```

### Logs live worker

```powershell
cd C:\Proiecte\Mami_Docs\workers\ai-gateway
npx wrangler tail
```

### Re-set Pages env vars (dacă schimbi chei Supabase)

```powershell
cd C:\Proiecte\Mami_Docs
powershell -ExecutionPolicy Bypass -File "workers\set-pages-vars.ps1"
```

---

## 📋 Status componente deployed

| Componentă | URL / Identifier | Status |
|---|---|---|
| Frontend PWA | https://mami-docs.pages.dev | ✅ LIVE |
| AI Gateway Worker | https://mami-docs-ai.petrilarolly.workers.dev | ✅ LIVE (cu fix `/transcribe`) |
| Keepalive Worker | https://mami-docs-keepalive.petrilarolly.workers.dev | ✅ Deployed (cron `0 2 */4 * *`) |
| Supabase Project | `zfeaoiafzeygwwjskevt` (Frankfurt) | ⚠ Tabele nerulate încă |
| Pages env vars | `VITE_AI_GATEWAY_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | ✅ SET |
| Worker secrets keepalive | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | ✅ SET |
| GitHub remote | `https://github.com/RolandPetrila/mami-docs` (main) | ✅ Sincronizat (commit `dca70ef`) |

---

## 🔗 Linkuri rapide tap-direct

- **App live** (vizitabil pe telefonul mamei): https://mami-docs.pages.dev
- **GitHub repo**: https://github.com/RolandPetrila/mami-docs
- **Supabase Dashboard**: https://supabase.com/dashboard/project/zfeaoiafzeygwwjskevt
- **Cloudflare Pages mami-docs**: https://dash.cloudflare.com/?to=/:account/pages/view/mami-docs
- **Cloudflare Workers**: https://dash.cloudflare.com/?to=/:account/workers/services
- **Ghid credentiale complet**: `docs/CREDENTIALS_NEEDED.md`

---

## ❓ Comenzi de început sesiune (copy-paste rapid)

```
verifica si raporteaza status mami_docs + ce mai e de facut
```

sau (mai specific):

```
ruleaza smoke-test workers + verifica daca Supabase tabele exista + propune urmatorul pas
```
