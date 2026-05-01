// Mami_Docs AI Gateway — Cloudflare Worker proxy
// CRITIC SECURITATE: GROQ_API_KEY trăiește exclusiv în Cloudflare Secrets,
// NICIODATĂ în bundle client (VITE_* prefix).
//
// Endpoint: POST /chat        { messages: ChatMessage[], systemPrompt?: string }
// Endpoint: POST /transcribe  multipart/form-data { file: Blob }
// Endpoint: GET  /health      → { ok: true }
//
// Fallback chain (Categoria 1 — Conversațional Text):
//   1. Groq llama-3.1-8b-instant   (primar, rapid)
//   2. Groq llama-3.3-70b-versatile (fallback, mai puternic)
// Circuit breaker: 3 eșecuri → skip provider 5 min

export interface Env {
  GROQ_API_KEY: string;
  ALLOWED_ORIGIN?: string;
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  systemPrompt?: string;
}

interface GroqResponseBody {
  choices: Array<{ message: { role: string; content: string } }>;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

interface GroqAudioResponse {
  text: string;
}

interface CircuitState {
  failures: number;
  openUntil: number; // epoch ms; 0 = closed
}

const CIRCUIT_THRESHOLD = 3;
const CIRCUIT_TIMEOUT_MS = 5 * 60 * 1_000;
const REQUEST_TIMEOUT_MS = 10_000;
const AUDIO_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;
const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_AUDIO_API = "https://api.groq.com/openai/v1/audio/transcriptions";
const MAX_TOKENS = 1_024;
const WHISPER_MODEL = "whisper-large-v3";

const PROVIDERS: ReadonlyArray<{
  readonly id: string;
  readonly model: string;
}> = [
  { id: "groq-8b", model: "llama-3.1-8b-instant" },
  { id: "groq-70b", model: "llama-3.3-70b-versatile" },
];

// Module-level: persists across requests within the same Worker instance
const circuit = new Map<string, CircuitState>();

function isOpen(id: string): boolean {
  const s = circuit.get(id);
  if (!s) return false;
  if (Date.now() < s.openUntil) return true;
  if (s.openUntil > 0) circuit.set(id, { failures: 0, openUntil: 0 }); // auto-reset
  return false;
}

function onFailure(id: string): void {
  const s = circuit.get(id) ?? { failures: 0, openUntil: 0 };
  s.failures += 1;
  if (s.failures >= CIRCUIT_THRESHOLD) {
    s.openUntil = Date.now() + CIRCUIT_TIMEOUT_MS;
    console.warn(`[circuit-open] provider=${id} skip for 5min`);
  }
  circuit.set(id, s);
}

function onSuccess(id: string): void {
  circuit.set(id, { failures: 0, openUntil: 0 });
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout ${ms}ms`)), ms),
    ),
  ]);
}

async function callGroq(
  model: string,
  messages: ChatMessage[],
  apiKey: string,
): Promise<GroqResponseBody> {
  const resp = await withTimeout(
    fetch(GROQ_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, max_tokens: MAX_TOKENS }),
    }),
    REQUEST_TIMEOUT_MS,
  );
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`HTTP ${resp.status}: ${body.slice(0, 200)}`);
  }
  return resp.json() as Promise<GroqResponseBody>;
}

async function callGroqAudio(
  formData: FormData,
  apiKey: string,
): Promise<GroqAudioResponse> {
  // Groq audio API expects: file (Blob), model, language (optional), response_format
  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    throw new Error("Missing 'file' in form-data");
  }

  const upstream = new FormData();
  upstream.append("file", file, "audio.webm");
  upstream.append("model", WHISPER_MODEL);
  upstream.append("language", "ro");
  upstream.append("response_format", "json");

  const resp = await withTimeout(
    fetch(GROQ_AUDIO_API, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
    }),
    AUDIO_TIMEOUT_MS,
  );
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`HTTP ${resp.status}: ${body.slice(0, 200)}`);
  }
  return resp.json() as Promise<GroqAudioResponse>;
}

function jsonResp(
  payload: unknown,
  status: number,
  corsHeaders: Record<string, string>,
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin") ?? "";
    const allowed = env.ALLOWED_ORIGIN ?? "";

    const cors: Record<string, string> = {
      "Access-Control-Allow-Origin": allowed || origin || "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    };

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const { pathname } = new URL(request.url);

    // Health check — public, no Origin restriction (smoke test din terminal)
    if (pathname === "/health" && request.method === "GET") {
      return jsonResp({ ok: true }, 200, cors);
    }

    // Origin check pentru rute care consumă quota (skip dacă ALLOWED_ORIGIN gol — dev mode)
    if (allowed && origin !== allowed) {
      console.warn(`[forbidden] origin="${origin}" expected="${allowed}"`);
      return jsonResp({ error: "Forbidden" }, 403, cors);
    }

    if (pathname === "/transcribe" && request.method === "POST") {
      try {
        const formData = await request.formData();
        const data = await callGroqAudio(formData, env.GROQ_API_KEY);
        return jsonResp(data, 200, cors);
      } catch (err) {
        const lastError = err instanceof Error ? err.message : String(err);
        console.error(`[transcribe-failed] ${lastError}`);
        return jsonResp({ error: "Transcription failed" }, 500, cors);
      }
    }

    if (pathname !== "/chat") {
      return jsonResp({ error: "Not found" }, 404, cors);
    }
    if (request.method !== "POST") {
      return jsonResp({ error: "Method not allowed" }, 405, cors);
    }

    let body: ChatRequestBody;
    try {
      body = (await request.json()) as ChatRequestBody;
    } catch {
      return jsonResp({ error: "Invalid JSON" }, 400, cors);
    }

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return jsonResp({ error: "messages[] required" }, 400, cors);
    }

    const messages: ChatMessage[] = body.systemPrompt
      ? [
          { role: "system" as const, content: body.systemPrompt },
          ...body.messages,
        ]
      : body.messages;

    let lastError = "no provider available";

    for (const { id, model } of PROVIDERS) {
      if (isOpen(id)) {
        console.warn(`[skip] provider=${id} circuit open`);
        continue;
      }
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (attempt > 0) {
          await new Promise<void>((r) => setTimeout(r, 1_000 * attempt));
        }
        try {
          const data = await callGroq(model, messages, env.GROQ_API_KEY);
          onSuccess(id);
          console.log(`[ok] provider=${id} model=${model} attempt=${attempt}`);
          return jsonResp(data, 200, cors);
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
          console.warn(
            `[fail] provider=${id} attempt=${attempt}: ${lastError}`,
          );
        }
      }
      onFailure(id);
    }

    console.error(`[all-failed] ${lastError}`);
    return jsonResp({ error: "AI service temporarily unavailable" }, 503, cors);
  },
};
