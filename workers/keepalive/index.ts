// Cloudflare Worker: Supabase keepalive + backup R2 + auto-sumar nocturn + mentenanță săptămânală
// Cron triggers (configurate în wrangler.toml):
//   "0 2 */4 * *"  → keepalive Supabase (la 4 zile)
//   "0 2 * * *"    → backup zilnic Supabase → R2
//   "30 0 * * *"   → auto-sumar nocturn (00:30 UTC = ~03:30 EET)
//   "0 3 * * sun"  → mentenanță săptămânală duminică (archive 60d, cleanup invites)

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  GROQ_API_KEY?: string;
  AI_GATEWAY_URL?: string;
  NTFY_TOPIC?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  MAMI_DOCS_BACKUP?: R2Bucket;
  // T6.2 — CallMeBot moved server-side (era VITE_CALLMEBOT_API_KEY/VITE_PHONE_NUMBER în client).
  CALLMEBOT_API_KEY?: string;
  CALLMEBOT_PHONE?: string;
  ALLOWED_ORIGIN?: string;
}

// ---- KEEPALIVE ----

async function runKeepalive(env: Env): Promise<void> {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error(
      "[keepalive] SUPABASE_URL sau SUPABASE_ANON_KEY lipsesc din Secrets",
    );
    return;
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/ping`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    if (res.ok) {
      console.info(`[keepalive] ✅ Supabase activ — status ${res.status}`);
    } else {
      const text = await res.text().catch(() => "(no body)");
      console.warn(
        `[keepalive] ⚠️ Supabase răspuns neașteptat — status ${res.status}: ${text}`,
      );
    }
  } catch (err) {
    console.error(
      "[keepalive] ❌ Eroare:",
      err instanceof Error ? err.message : String(err),
    );
  }
}

// ---- BACKUP R2 ----

async function runR2Backup(env: Env): Promise<void> {
  console.log("[backup] Starting daily Supabase → R2 backup");

  if (!env.MAMI_DOCS_BACKUP) {
    console.warn(
      "[backup] MAMI_DOCS_BACKUP R2 binding lipsă. Adaugă binding în wrangler.toml.",
    );
    return;
  }
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("[backup] SUPABASE_SERVICE_ROLE_KEY lipsă. Backup skip.");
    return;
  }

  const tables = [
    "hydration",
    "vitals",
    "emotion",
    "sleep",
    "photos_meta",
    "bookmarks",
    "highlights",
    "doc_notes",
  ];
  const now = new Date().toISOString().slice(0, 10);
  let totalRows = 0;
  const backup: Record<string, unknown[]> = {};

  for (const table of tables) {
    try {
      const resp = await fetch(
        `${env.SUPABASE_URL}/rest/v1/${table}?select=*&order=id`,
        {
          headers: {
            apikey: env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (resp.ok) {
        const rows = (await resp.json()) as unknown[];
        backup[table] = rows;
        totalRows += rows.length;
      } else {
        console.warn(`[backup] table ${table}: HTTP ${resp.status}`);
        backup[table] = [];
      }
    } catch (err) {
      console.warn(
        `[backup] table ${table}:`,
        err instanceof Error ? err.message : err,
      );
      backup[table] = [];
    }
  }

  const key = `backups/${now}/mami-backup-${now}.json`;
  try {
    await env.MAMI_DOCS_BACKUP.put(key, JSON.stringify(backup, null, 2), {
      httpMetadata: { contentType: "application/json" },
      customMetadata: { rows: String(totalRows), date: now },
    });
    console.info(`[backup] ✅ Salvat ${key} — ${totalRows} rows total`);

    // Keep only last 30 backups
    const list = await env.MAMI_DOCS_BACKUP.list({ prefix: "backups/" });
    const old = list.objects
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(0, Math.max(0, list.objects.length - 30));
    for (const obj of old) {
      await env.MAMI_DOCS_BACKUP.delete(obj.key);
      console.log(`[backup] Deleted old backup: ${obj.key}`);
    }
  } catch (err) {
    console.error(
      "[backup] ❌ R2 write failed:",
      err instanceof Error ? err.message : err,
    );
    await notifyAdmin(
      env,
      `❌ Backup Mami Docs eșuat: ${err instanceof Error ? err.message : "R2 write error"}`,
    );
  }
}

// ---- AUTO-SUMAR NOCTURN ----

interface WellnessData {
  hydration: Array<{ ts: string; amount_ml: number }>;
  vitals: Array<{
    ts: string;
    systolic: number;
    diastolic: number;
    pulse: number | null;
  }>;
  emotion: Array<{ ts: string; level: number; note: string }>;
  sleep: Array<{
    ts: string;
    start_ts?: string;
    end_ts?: string;
    hours?: number;
  }>;
}

async function fetchTodayData(env: Env): Promise<WellnessData> {
  const today = new Date().toISOString().slice(0, 10);
  const result: WellnessData = {
    hydration: [],
    vitals: [],
    emotion: [],
    sleep: [],
  };

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return result;

  const headers = {
    apikey: env.SUPABASE_ANON_KEY,
    Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };

  const queries = [
    {
      key: "hydration" as const,
      url: `${env.SUPABASE_URL}/rest/v1/hydration?ts=gte.${today}&select=ts,amount_ml`,
    },
    {
      key: "vitals" as const,
      url: `${env.SUPABASE_URL}/rest/v1/vitals?ts=gte.${today}&select=ts,systolic,diastolic,pulse`,
    },
    {
      key: "emotion" as const,
      url: `${env.SUPABASE_URL}/rest/v1/emotion?ts=gte.${today}&select=ts,level,note`,
    },
    {
      key: "sleep" as const,
      url: `${env.SUPABASE_URL}/rest/v1/sleep?start_ts=gte.${today}&select=ts,start_ts,end_ts,hours`,
    },
  ] as const;

  await Promise.all(
    queries.map(async ({ key, url }) => {
      try {
        const resp = await fetch(url, { headers });
        if (resp.ok) result[key] = (await resp.json()) as never;
      } catch {
        /* ignore */
      }
    }),
  );

  return result;
}

function buildSummaryPrompt(data: WellnessData): string {
  const hydTotal = data.hydration.reduce((s, h) => s + h.amount_ml, 0);
  const lastVitals = data.vitals[data.vitals.length - 1];
  const lastEmotion = data.emotion[data.emotion.length - 1];
  const lastSleep = data.sleep[data.sleep.length - 1];

  const lines: string[] = [`Rezumat wellness pentru ziua de astăzi:`];

  if (hydTotal > 0) lines.push(`- Hidratare: ${hydTotal}ml`);
  if (lastVitals)
    lines.push(
      `- Tensiune: ${lastVitals.systolic}/${lastVitals.diastolic}${lastVitals.pulse ? `, puls ${lastVitals.pulse}` : ""}`,
    );
  if (lastEmotion)
    lines.push(
      `- Stare emoțională: ${lastEmotion.level}/5${lastEmotion.note ? ` (${lastEmotion.note})` : ""}`,
    );
  if (lastSleep?.hours) lines.push(`- Somn: ${lastSleep.hours}h`);

  if (lines.length === 1) return ""; // No data for today

  lines.push(
    "\nGenerează un mesaj cald și scurt (2-3 propoziții) pentru mama, în română, care:",
  );
  lines.push("- Recapitulează ziua în mod pozitiv");
  lines.push(
    "- Oferă o recomandare blândă dacă e cazul (ex: hidratare insuficientă, somn prea puțin)",
  );
  lines.push("- Urează noapte bună");
  lines.push("Ton: cald, ca un fiu grijuliu. NU jargon medical.");

  return lines.join("\n");
}

async function generateSummary(prompt: string, env: Env): Promise<string> {
  // Try AI Gateway first
  if (env.AI_GATEWAY_URL) {
    try {
      const resp = await fetch(`${env.AI_GATEWAY_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          systemPrompt:
            "Ești un asistent medical prietenos care vorbește în română.",
        }),
      });
      if (resp.ok) {
        const data = (await resp.json()) as {
          choices: Array<{ message: { content: string } }>;
        };
        return data.choices[0]?.message.content ?? "";
      }
    } catch {
      /* fallback to Groq direct */
    }
  }

  // Fallback: Groq direct
  if (env.GROQ_API_KEY) {
    try {
      const resp = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              {
                role: "system",
                content:
                  "Ești un asistent medical prietenos care vorbește în română.",
              },
              { role: "user", content: prompt },
            ],
            max_tokens: 300,
          }),
        },
      );
      if (resp.ok) {
        const data = (await resp.json()) as {
          choices: Array<{ message: { content: string } }>;
        };
        return data.choices[0]?.message.content ?? "";
      }
    } catch {
      /* ignore */
    }
  }

  return "";
}

async function runAutoSummary(env: Env): Promise<void> {
  console.log("[summary] Starting daily auto-summary");

  const data = await fetchTodayData(env);
  const prompt = buildSummaryPrompt(data);

  if (!prompt) {
    console.log("[summary] No wellness data for today, skipping summary");
    return;
  }

  const summary = await generateSummary(prompt, env);

  if (!summary) {
    console.warn("[summary] Could not generate summary (no AI provider)");
    return;
  }

  console.info("[summary] Generated:", summary.slice(0, 100));

  // Send via ntfy + Telegram
  await notifyAdmin(
    env,
    `🌙 Rezumat zi:\n\n${summary}`,
    "Rezumat Wellness Zilnic",
  );

  // Save to Supabase as a note
  if (env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
    try {
      await fetch(`${env.SUPABASE_URL}/rest/v1/daily_summaries`, {
        method: "POST",
        headers: {
          apikey: env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          ts: new Date().toISOString(),
          summary,
          data_snapshot: data,
        }),
      });
    } catch {
      /* ignore */
    }
  }

  console.info("[summary] ✅ Auto-summary completed");
}

// ---- NOTIFICATIONS ----

async function notifyAdmin(
  env: Env,
  message: string,
  title = "Mami Docs",
): Promise<void> {
  // ntfy.sh
  if (env.NTFY_TOPIC) {
    try {
      await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
        method: "POST",
        headers: { "Content-Type": "text/plain; charset=utf-8", Title: title },
        body: message,
      });
    } catch {
      /* ignore */
    }
  }

  // Telegram
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    try {
      await fetch(
        `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: env.TELEGRAM_CHAT_ID,
            text: `*${title}*\n\n${message}`,
            parse_mode: "Markdown",
          }),
        },
      );
    } catch {
      /* ignore */
    }
  }
}

// ---- STORAGE ALERT ----

const SUPABASE_FREE_STORAGE_BYTES = 500 * 1024 * 1024; // 500 MB
const STORAGE_ALERT_THRESHOLD = 0.8; // 80%

async function runStorageCheck(env: Env): Promise<void> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return;

  try {
    const resp = await fetch(
      `${env.SUPABASE_URL}/rest/v1/rpc/get_db_size_bytes`,
      {
        method: "POST",
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: "{}",
      },
    );

    if (!resp.ok) {
      console.warn(
        `[storage-check] RPC get_db_size_bytes HTTP ${resp.status} — funcția lipsă? Rulează docs/sql/pgvector_migration.sql`,
      );
      return;
    }

    const sizeBytes = (await resp.json()) as number;
    const pct = sizeBytes / SUPABASE_FREE_STORAGE_BYTES;
    const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(1);

    console.info(
      `[storage-check] DB size: ${sizeMb} MB (${(pct * 100).toFixed(1)}%)`,
    );

    if (pct >= STORAGE_ALERT_THRESHOLD) {
      await notifyAdmin(
        env,
        `⚠️ Storage Supabase la ${(pct * 100).toFixed(0)}% (${sizeMb} MB din 500 MB free tier). Consideră upgrade sau curățare date vechi.`,
        "ALERTĂ Storage Mami Docs",
      );
    }
  } catch (err) {
    console.warn(
      "[storage-check] eroare:",
      err instanceof Error ? err.message : err,
    );
  }
}

// ---- WEEKLY MAINTENANCE ----

interface PhotoMetaRow {
  id: string;
  ts: string;
  caption?: string;
  blob_size?: number;
  archived_at?: string | null;
  deleted_at?: string | null;
}

async function runWeeklyMaintenance(env: Env): Promise<void> {
  console.log("[maintenance] Starting weekly maintenance");

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("[maintenance] SUPABASE_SERVICE_ROLE_KEY lipsă. Skip.");
    return;
  }

  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };

  const cutoff60 = new Date(
    Date.now() - 60 * 24 * 60 * 60 * 1000,
  ).toISOString();
  let archivedCount = 0;
  let invitesCleared = 0;
  const errors: string[] = [];

  // 1) Marchează photos_meta neaccesate >60 zile cu archived_at
  try {
    const listResp = await fetch(
      `${env.SUPABASE_URL}/rest/v1/photos_meta?select=id,ts,archived_at,deleted_at&ts=lt.${cutoff60}&archived_at=is.null&deleted_at=is.null`,
      { headers },
    );
    if (listResp.ok) {
      const rows = (await listResp.json()) as PhotoMetaRow[];
      if (rows.length > 0) {
        const ids = rows.map((r) => r.id);
        const updateResp = await fetch(
          `${env.SUPABASE_URL}/rest/v1/photos_meta?id=in.(${ids.map((i) => `"${i}"`).join(",")})`,
          {
            method: "PATCH",
            headers: { ...headers, Prefer: "return=minimal" },
            body: JSON.stringify({ archived_at: new Date().toISOString() }),
          },
        );
        if (updateResp.ok) {
          archivedCount = rows.length;
        } else {
          errors.push(`photos archive PATCH: HTTP ${updateResp.status}`);
        }
      }
    } else {
      errors.push(`photos_meta list: HTTP ${listResp.status}`);
    }
  } catch (err) {
    errors.push(`photos archive: ${err instanceof Error ? err.message : err}`);
  }

  // 2) Cleanup invitații expirate via RPC (cleanup_expired_invites)
  try {
    const resp = await fetch(
      `${env.SUPABASE_URL}/rest/v1/rpc/cleanup_expired_invites`,
      { method: "POST", headers, body: "{}" },
    );
    if (resp.ok) {
      invitesCleared = (await resp.json()) as number;
    } else if (resp.status === 404) {
      console.warn(
        "[maintenance] cleanup_expired_invites RPC lipsă — rulează docs/sql/family_sharing.sql",
      );
    } else {
      errors.push(`cleanup_expired_invites: HTTP ${resp.status}`);
    }
  } catch (err) {
    errors.push(`invites cleanup: ${err instanceof Error ? err.message : err}`);
  }

  // 3) Raport admin
  const summary = [
    `🔧 Mentenanță săptămânală Mami Docs:`,
    `- 📷 Foto arhivate (>60 zile): ${archivedCount}`,
    `- 👨‍👩‍👧 Invitații expirate șterse: ${invitesCleared}`,
  ];
  if (errors.length > 0) {
    summary.push(`- ⚠️ Erori: ${errors.length}`);
    summary.push(...errors.map((e) => `  • ${e}`));
  }
  console.info(summary.join("\n"));

  // Notifică doar dacă sunt erori sau lucru de raportat
  if (archivedCount > 0 || invitesCleared > 0 || errors.length > 0) {
    await notifyAdmin(
      env,
      summary.join("\n"),
      "Mentenanță săptămânală Mami Docs",
    );
  }

  console.info("[maintenance] ✅ Weekly maintenance completed");
}

// ---- MAIN ----

// T6.2 — POST /notify proxy for CallMeBot voice. Keeps API key server-side.
async function handleNotify(
  request: Request,
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  if (!env.CALLMEBOT_API_KEY || !env.CALLMEBOT_PHONE) {
    return new Response(
      JSON.stringify({ ok: false, error: "CallMeBot not configured" }),
      { status: 503, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
  let body: { text?: string };
  try {
    body = (await request.json()) as { text?: string };
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  const text = body.text?.trim();
  if (!text) {
    return new Response(JSON.stringify({ ok: false, error: "text required" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  if (text.length > 500) {
    return new Response(
      JSON.stringify({ ok: false, error: "text too long (max 500)" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
  const url = new URL("https://api.callmebot.com/start.php");
  url.searchParams.set("user", env.CALLMEBOT_PHONE);
  url.searchParams.set("text", text);
  url.searchParams.set("lang", "ro-RO-Standard-A");
  url.searchParams.set("rpt", "2");
  url.searchParams.set("apikey", env.CALLMEBOT_API_KEY);
  try {
    const resp = await fetch(url.toString(), { method: "GET" });
    return new Response(JSON.stringify({ ok: resp.ok, status: resp.status }), {
      status: resp.ok ? 200 : 502,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(
      "[notify] CallMeBot fetch failed:",
      err instanceof Error ? err.message : String(err),
    );
    return new Response(
      JSON.stringify({ ok: false, error: "CallMeBot unreachable" }),
      { status: 502, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin") ?? "";
    const allowed = env.ALLOWED_ORIGIN ?? "";
    const corsOrigin = allowed ? (origin === allowed ? allowed : "") : origin;
    const cors: Record<string, string> = {
      "Access-Control-Allow-Origin": corsOrigin,
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      Vary: "Origin",
    };

    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers: cors });

    const { pathname } = new URL(request.url);

    if (pathname === "/notify" && request.method === "POST") {
      if (allowed && origin !== allowed) {
        return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), {
          status: 403,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      return handleNotify(request, env, cors);
    }

    return new Response(
      "mami-docs-keepalive — Worker is alive (scheduled cron + POST /notify).",
      {
        status: 200,
        headers: { ...cors, "Content-Type": "text/plain; charset=utf-8" },
      },
    );
  },

  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    if (event.cron === "0 2 * * *") {
      ctx.waitUntil(runR2Backup(env).then(() => runStorageCheck(env)));
    } else if (event.cron === "30 0 * * *") {
      ctx.waitUntil(runAutoSummary(env));
    } else if (event.cron === "0 3 * * sun") {
      ctx.waitUntil(runWeeklyMaintenance(env));
    } else {
      ctx.waitUntil(runKeepalive(env));
    }
  },
};
