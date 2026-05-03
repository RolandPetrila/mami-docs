// Cloudflare Worker: Supabase keepalive + backup R2 + auto-sumar nocturn
// Cron triggers (configurate în wrangler.toml):
//   "0 2 */4 * *"  → keepalive Supabase (la 4 zile)
//   "0 2 * * *"    → backup zilnic Supabase → R2
//   "30 0 * * *"   → auto-sumar nocturn (00:30 UTC = ~03:30 EET)

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

// ---- MAIN ----

export default {
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    if (event.cron === "0 2 * * *") {
      ctx.waitUntil(runR2Backup(env).then(() => runStorageCheck(env)));
    } else if (event.cron === "30 0 * * *") {
      ctx.waitUntil(runAutoSummary(env));
    } else {
      ctx.waitUntil(runKeepalive(env));
    }
  },
};
