# Notification Stack — Mami_Docs

**Data:** 2026-05-01 | **Versiune:** 1.1 (ordine corectată conform SPEC adendă §17.2 #12)
**Sursă:** Anexa C v2, Decizia D12 (confirmată admin 2026-05-01)

---

## Arhitectură Stratificată

Notificările sunt livrate în straturi: dacă stratul superior nu livrează, cel următor intră automat.

```
[Cloudflare Worker Cron]
        │
        ▼
  1. ntfy.sh priority 5 (PRIMAR — bypass DND, ringtone alarm dedicat
     pe canal Android configurat manual o dată pe telefon mama)
        │ eșec (server ntfy down sau client offline)
        ▼
  2. Telegram Bot (NELIMITAT, mama are Telegram, mesaj text/foto)
        │ eșec (mama nu are Telegram deschis sau bot blocat)
        ▼
  3. CallMeBot Voice (apel TTS în română via Telegram —
     pentru medicament critic, ultimul resort comunicare directă)
        │ eșec (mama refuză apelul sau CallMeBot down)
        ▼
  4. FCM topic dedicat (REDUNDANȚĂ — push pură silent fallback,
     se afișează la deschiderea următoare a app-ului)
```

---

## Strategie device_role

**Regulă critică:** Admin NU primește reminder-ele mamei. Mama NU primește alertele de sistem admin.

| device_role | Primește                                                                           |
| ----------- | ---------------------------------------------------------------------------------- |
| `mom`       | Remindere hidratare, medicamente, check-in, vreme, sumar nocturn, alarme personale |
| `admin`     | Erori sistem, alert 80% storage, backup eșuat, keepalive eșuat, erori critice API  |

**Implementare Supabase:**

```sql
-- Tabela profiles
ALTER TABLE profiles ADD COLUMN device_role TEXT NOT NULL DEFAULT 'mom'
  CHECK (device_role IN ('mom', 'admin'));

-- Exemple
UPDATE profiles SET device_role = 'admin' WHERE email = 'petrilarolly@gmail.com';
```

**La trimitere notificare:**

```javascript
const targets = await supabase
  .from("profiles")
  .select("push_token, telegram_chat_id, ntfy_topic")
  .eq("device_role", targetRole); // 'mom' sau 'admin'
```

---

## Stratul 1 — ntfy.sh Priority 5 (Primar)

**Rol:** Primar — bypass DND (Do Not Disturb), ringtone alarm dedicat, funcționează chiar dacă mama nu e în app.

**Priority 5 = max** → bypass DND pe Android, sunet și vibrație puternică.

**Setup pe telefon mama (instrucțiuni pas cu pas):**

1. Deschide Google Play Store
2. Caută **"ntfy"** → instalează app-ul oficial (publicat de: Philipp C. Heckel)
3. Deschide ntfy → tap **"+"** (Subscribe to topic)
4. Introdu topic name: `mami-docs-reminders` → Subscribe
5. Tap pe topicul nou → Settings (roată dințată)
6. Activează **"Instant delivery"** (menține conexiune permanentă)
7. Setează **"Minimum priority"** la: Default (primește toate)
8. Întoarce-te la Settings principale → **"Battery optimization"** → dezactivează pentru ntfy

**Trimitere din Cloudflare Worker:**

```javascript
await fetch("https://ntfy.sh/mami-docs-reminders", {
  method: "POST",
  headers: {
    Title: "Reminder Mami",
    Priority: "5",
    Tags: "pill",
    "Content-Type": "text/plain; charset=utf-8",
  },
  body: "Ai luat medicamentele de dimineață?",
});
```

**Env vars:** niciuna (ntfy.sh e public pentru topic-uri simple; pentru topic privat cu auth: `NTFY_TOKEN`)

---

## Stratul 2 — Telegram Bot

**Rol:** Al doilea nivel, nelimitat, rapid și familiar mamei. Funcționează pe orice conexiune.

**Setup bot (deja configurat conform catalog .api-keys):**

- Token: `TELEGRAM_BOT_TOKEN` (SET în env vars)
- Chat ID mama: `TELEGRAM_CHAT_ID` (SET)
- Chat ID admin: separat (configurat în Supabase per profil)

**Trimitere mesaj:**

```javascript
const response = await fetch(
  `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text: "💊 Reminder: medicamentele de dimineață",
      parse_mode: "HTML",
    }),
  },
);
```

**Env vars:** `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_BOT_URL`

---

## Stratul 3 — CallMeBot Voice

**Rol:** Al treilea nivel — apel TTS în română pentru medicamente critice. Ultimul resort de comunicare directă.

**Funcționare:** CallMeBot apelează numărul de telefon al mamei și citește mesajul cu TTS.

**Setup:**

1. Mama trimite WhatsApp la `+34 644 58 43 99` cu mesajul: `I allow callmebot to send me messages`
2. Primește API key pe WhatsApp
3. Stochează API key în Cloudflare Secrets (nu în env vars publice)

**Trimitere apel:**

```javascript
// WhatsApp message (mai simplu, mai fiabil)
const phone = "40XXXXXXXXX"; // numărul mamei fără +
const apikey = env.CALLMEBOT_API_KEY;
const message = encodeURIComponent("Mama, ai luat medicamentele?");

await fetch(
  `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${message}&apikey=${apikey}`,
);
```

**Env vars:** `CALLMEBOT_API_KEY` (de adăugat în catalog după setup)

---

## Stratul 4 — FCM (Redundanță)

**Rol:** Al patrulea nivel — redundanță push pură, silent fallback. Se afișează la deschiderea următoare a app-ului.

**Setup:**

1. Crează proiect Firebase la https://console.firebase.google.com
2. Adaugă app web → copiază config (nu sunt chei secrete în client)
3. Activează Cloud Messaging
4. În Cloudflare Worker: folosește FCM HTTP v1 API cu `GOOGLE_API_KEY` sau service account JWT

**Topic dedicat:** `mami-docs-mom` (pentru mama), `mami-docs-admin` (pentru admin)

**Env vars:** `GOOGLE_API_KEY` sau service account JSON (stocat în Cloudflare Secrets)

**Payload exemplu:**

```json
{
  "message": {
    "topic": "mami-docs-mom",
    "notification": {
      "title": "Mami Docs",
      "body": "Reminder: Ai luat medicamentele de dimineață? 💊"
    },
    "android": {
      "priority": "HIGH",
      "notification": { "channel_id": "reminders" }
    }
  }
}
```

---

## Workflow Cron → Notificare

```
[Cloudflare Cron Trigger]
   │
   ├─ 08:00 UTC → Reminder medicament dimineață (device_role: mom)
   ├─ 12:00 UTC → Reminder hidratare (device_role: mom)
   ├─ 14:00 UTC → Reminder medicament prânz (dacă configurat)
   ├─ 17:00 UTC → Reminder hidratare după-amiază
   ├─ 20:00 UTC → Reminder medicament seară
   ├─ 22:30 UTC → Auto-sumar nocturn (Faza 2)
   └─ */4 zile  → Supabase keepalive SELECT 1 (intern, fără notificare)
```

**Logică Worker:**

1. Citește profil user din Supabase (`device_role`, `push_tokens`, `reminder_config`)
2. Verifică dacă reminder e activat (mama poate dezactiva din UI)
3. Construiește mesaj personalizat
4. Încearcă ntfy → la eșec: Telegram → la eșec: CallMeBot Voice → la eșec: FCM redundanță
5. Loghează rezultat în Supabase (`notification_log` table)

---

## Tipuri de Notificări

| Tip                 | device_role | Prioritate ntfy | Când                    |
| ------------------- | ----------- | --------------- | ----------------------- |
| Reminder medicament | mom         | 4               | Dimineață/prânz/seară   |
| Reminder hidratare  | mom         | 2               | La 2-3 ore              |
| Check-in emoțional  | mom         | 2               | 10:00 UTC zilnic        |
| Sumar nocturn       | mom         | 2               | 22:30 UTC               |
| Alarmă urgentă      | mom         | 5 (bypass DND)  | La cerere sau detecție  |
| Eroare sistem       | admin       | 4               | La orice eroare critică |
| Alert 80% storage   | admin       | 4               | Când Supabase >800MB    |
| Backup eșuat        | admin       | 5               | La 3 retry eșuate       |
| Keepalive eșuat     | admin       | 5               | Supabase nu răspunde    |

> **Notă:** "Prioritate ntfy" sunt valori native ntfy (1-5), NU ordinea în stack. Prioritatea 5 = bypass DND, prioritatea 1 = silențios.

---

## Note Implementare Faza 2

- `CALLMEBOT_API_KEY` trebuie adăugat în catalog `.api-keys` după setup cu mama
- Testează fiecare strat separat înainte de integrare completă
- UI mama: toggle on/off per tip de reminder (nu dezactiva tot-sau-nimic)
- Fusul orar mama: Europa/București (UTC+2 iarnă, UTC+3 vară) — folosește `Intl.DateTimeFormat`
- ntfy.sh canal Android pe telefon mama: ringtone `alarm_clock_loop.mp3` setat manual o singură dată în Settings → Notifications → ntfy → mami-docs-reminders → Sound → Custom
