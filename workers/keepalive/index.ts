// Cloudflare Worker: Supabase keepalive cron
// Fires SELECT 1 la Supabase la fiecare 4 zile (cron: "0 2 */4 * *")
// Previne hibernarea proiectului Supabase free (pauze la inactivitate >7 zile)

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  MAMI_DOCS_BACKUP?: any; // R2 Bucket binding
}

export default {
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    if (event.cron === "0 2 * * *") {
      ctx.waitUntil(runR2Backup(env));
    } else if (event.cron === "30 0 * * *") {
      ctx.waitUntil(runAutoSummary(env));
    } else {
      ctx.waitUntil(runKeepalive(env));
    }
  },
};

async function runAutoSummary(env: Env): Promise<void> {
  console.log("[summary] Starting daily auto-summary (stub)");
  // Logic to fetch today's data from Supabase and summarize via AI
  console.info("[summary] ✅ Auto-summary completed (stub)");
}

async function runR2Backup(env: Env): Promise<void> {
  console.log("[backup] Starting daily Supabase to R2 backup (stub)");
  if (!env.MAMI_DOCS_BACKUP) {
    console.warn("[backup] MAMI_DOCS_BACKUP R2 binding lipsă.");
    return;
  }
  // Logic to fetch Supabase dump and put to R2
  console.info("[backup] ✅ Backup completed (stub)");
}

async function runKeepalive(env: Env): Promise<void> {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error(
      "[keepalive] SUPABASE_URL sau SUPABASE_ANON_KEY lipsesc din Secrets",
    );
    return;
  }

  const url = `${SUPABASE_URL}/rest/v1/rpc/ping`;

  try {
    const res = await fetch(url, {
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
      "[keepalive] ❌ Eroare fetch Supabase:",
      err instanceof Error ? err.message : String(err),
    );
  }
}
