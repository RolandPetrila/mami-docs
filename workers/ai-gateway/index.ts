// Mami_Docs AI Gateway — Cloudflare Worker proxy
// CRITIC SECURITATE: cheile API trăiesc exclusiv în Cloudflare Secrets.
//
// Endpoint: POST /chat          { messages[], systemPrompt?, category?: "rapid"|"frontier"|"all" }
// Endpoint: POST /transcribe    multipart/form-data { file: Blob }
// Endpoint: POST /embed         { text: string, provider?: "gemini"|"cohere"|"mistral" }
// Endpoint: POST /translate     { text: string, to: string, from?: string }
// Endpoint: POST /vision        { imageBase64: string, mimeType: string, prompt?: string }
// Endpoint: POST /ocr-document  { fileBase64: string, model?: "prebuilt-document"|"prebuilt-receipt"|"prebuilt-layout"|"prebuilt-invoice"|"prebuilt-idDocument" }
// Endpoint: POST /search        { query: string }
// Endpoint: GET  /health        → { ok: true }
//
// Fallback chains (ADR D4 + 2026-05-06 extension + 2026-05-07 category routing):
//   Chat:      Groq 8B → SambaNova 70B → Cerebras 70B → xAI Grok-3-mini → Mistral Large → GitHub Models → OpenRouter :free
//              Body opțional `category="rapid"` (doar Groq/SambaNova/Cerebras/OpenRouter free)
//              sau `category="frontier"` (xAI Grok / Mistral Large / GitHub gpt-4o-mini).
//              Default = toate (fallback complet). Reflectă `memory/routing_decision_trees.md`.
//   Embed:     Gemini gemini-embedding-001 → Cohere multilingual-v3 → Mistral embed
//   STT:       Groq Whisper → CF Workers AI Whisper
//   Translate: DeepL → Azure Translator → Gemini Flash
//   Vision:    Gemini 2.5 Flash → Mistral OCR
//   OCR-Doc:   Azure Document Intelligence (prebuilt-document/receipt/layout/invoice/idDocument)
//   Search:    Brave → Tavily → Jina Reader

export interface Env {
  GROQ_API_KEY: string;
  SAMBANOVA_API_KEY?: string;
  CEREBRAS_API_KEY?: string;
  XAI_API_KEY?: string;
  REKA_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  GEMINI_API_KEY?: string;
  COHERE_API_KEY?: string;
  MISTRAL_API_KEY?: string;
  DEEPL_API_KEY?: string;
  AZURE_TRANSLATOR_KEY?: string;
  AZURE_TRANSLATOR_REGION?: string;
  AZURE_DOC_INTEL_KEY?: string;
  AZURE_DOC_INTEL_ENDPOINT?: string;
  GITHUB_MODELS_TOKEN?: string;
  BRAVE_API_KEY?: string;
  TAVILY_API_KEY?: string;
  AI?: { run: (model: string, inputs: unknown) => Promise<unknown> }; // CF Workers AI binding
  ALLOWED_ORIGIN?: string;
  RATE_LIMIT_KV?: KVNamespace;
}

// Rate limiting (T6.4). Mitigation R4: 30 req/min/IP — single-user case (mama),
// monitored manually before tightening. Higher than the conservative 10/min so a
// long chat session never gets blocked.
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_SEC = 60;

interface RateLimitDecision {
  allowed: boolean;
  retryAfter: number;
  remaining: number;
}

async function checkRateLimit(
  ip: string,
  env: Env,
): Promise<RateLimitDecision> {
  // KV not bound = no rate limiting (dev or initial deploy without RATE_LIMIT_KV).
  // Returning allowed=true so the worker still serves traffic; admin sets up KV
  // via `wrangler kv:namespace create RATE_LIMIT_KV` and adds the id to wrangler.toml.
  if (!env.RATE_LIMIT_KV) {
    return { allowed: true, retryAfter: 0, remaining: RATE_LIMIT_MAX };
  }
  const key = `rl:${ip}`;
  const raw = await env.RATE_LIMIT_KV.get(key);
  const count = raw ? parseInt(raw, 10) : 0;
  if (count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      retryAfter: RATE_LIMIT_WINDOW_SEC,
      remaining: 0,
    };
  }
  await env.RATE_LIMIT_KV.put(key, String(count + 1), {
    expirationTtl: RATE_LIMIT_WINDOW_SEC,
  });
  return {
    allowed: true,
    retryAfter: 0,
    remaining: RATE_LIMIT_MAX - count - 1,
  };
}

function clientIp(request: Request): string {
  return (
    request.headers.get("CF-Connecting-IP") ??
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface CircuitState {
  failures: number;
  openUntil: number;
}

const CIRCUIT_THRESHOLD = 3;
const CIRCUIT_TIMEOUT_MS = 5 * 60_000;
const REQUEST_TIMEOUT_MS = 15_000;
const AUDIO_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;
const MAX_TOKENS = 1_024;

const GROQ_CHAT_API = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_AUDIO_API = "https://api.groq.com/openai/v1/audio/transcriptions";
const SAMBANOVA_API = "https://api.sambanova.ai/v1/chat/completions";
const CEREBRAS_API = "https://api.cerebras.ai/v1/chat/completions";
const XAI_API = "https://api.x.ai/v1/chat/completions";
const REKA_API = "https://api.reka.ai/v1/chat";
const GITHUB_MODELS_API = "https://models.github.ai/inference/chat/completions";
const OPENROUTER_API = "https://openrouter.ai/api/v1/chat/completions";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
const COHERE_EMBED_API = "https://api.cohere.com/v2/embed";
const MISTRAL_API = "https://api.mistral.ai/v1";
const MISTRAL_CHAT_API = "https://api.mistral.ai/v1/chat/completions";
const DEEPL_API = "https://api-free.deepl.com/v2/translate";
const AZURE_TRANSLATOR_BASE = "https://api.cognitive.microsofttranslator.com";
const BRAVE_API = "https://api.search.brave.com/res/v1/web/search";
const TAVILY_API = "https://api.tavily.com/search";

// Chain order: rapid → puternic → frontier → safety net
// Categoria reflectă routing_decision_trees.md (memory): "rapid" = LLM Open-source rapid,
// "frontier" = LLM Frontier pentru cazuri complexe (medical, contextual, raționament).
// Client poate cere category="frontier" pentru lookup medical / drug interactions /
// întrebări complexe. Default (no category) = toate cu fallback complet.
// SambaNova testat 939ms latency pe Llama 3.3-70B (3-7x mai rapid decât Groq 70B).
// xAI Grok-3-mini = frontier-class. Mistral Large = 1B tokens/lună gratuit.
const CHAT_PROVIDERS = [
  {
    id: "groq-8b",
    model: "llama-3.1-8b-instant",
    provider: "groq",
    category: "rapid",
  },
  {
    id: "sambanova-70b",
    model: "Meta-Llama-3.3-70B-Instruct",
    provider: "sambanova",
    category: "rapid",
  },
  {
    id: "cerebras-70b",
    model: "llama3.3-70b",
    provider: "cerebras",
    category: "rapid",
  },
  {
    id: "xai-grok-mini",
    model: "grok-3-mini",
    provider: "xai",
    category: "frontier",
  },
  {
    id: "reka-flash",
    model: "reka-flash",
    provider: "reka",
    category: "frontier",
  },
  {
    id: "mistral-large",
    model: "mistral-large-latest",
    provider: "mistral",
    category: "frontier",
  },
  {
    id: "github-gpt4o-mini",
    model: "openai/gpt-4o-mini",
    provider: "github",
    category: "frontier",
  },
  {
    id: "openrouter-free",
    model: "meta-llama/llama-3.1-8b-instruct:free",
    provider: "openrouter",
    category: "rapid",
  },
] as const;

type ChatCategory = "rapid" | "frontier" | "all";

const circuit = new Map<string, CircuitState>();

function isOpen(id: string): boolean {
  const s = circuit.get(id);
  if (!s) return false;
  if (Date.now() < s.openUntil) return true;
  if (s.openUntil > 0) circuit.set(id, { failures: 0, openUntil: 0 });
  return false;
}

function onFailure(id: string): void {
  const s = circuit.get(id) ?? { failures: 0, openUntil: 0 };
  s.failures += 1;
  if (s.failures >= CIRCUIT_THRESHOLD) {
    s.openUntil = Date.now() + CIRCUIT_TIMEOUT_MS;
    console.warn(`[circuit-open] provider=${id}`);
  }
  circuit.set(id, s);
}

function onSuccess(id: string): void {
  circuit.set(id, { failures: 0, openUntil: 0 });
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, rej) =>
      setTimeout(() => rej(new Error(`Timeout ${ms}ms`)), ms),
    ),
  ]);
}

function jsonResp(
  payload: unknown,
  status: number,
  cors: Record<string, string>,
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// ---- CHAT ----

async function callGroqChat(
  model: string,
  messages: ChatMessage[],
  apiKey: string,
): Promise<string> {
  const resp = await withTimeout(
    fetch(GROQ_CHAT_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, max_tokens: MAX_TOKENS }),
    }),
    REQUEST_TIMEOUT_MS,
  );
  if (!resp.ok)
    throw new Error(
      `Groq HTTP ${resp.status}: ${await resp.text().then((t) => t.slice(0, 200))}`,
    );
  const data = (await resp.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const content = data.choices[0]?.message.content;
  if (typeof content !== "string")
    throw new Error("Groq: invalid response shape");
  return content;
}

// T7.E.1 — SSE streaming Groq → client.
// Returnează ReadableStream care emite "data: {chunk}\n\n" + "data: [DONE]\n\n".
async function callGroqChatStream(
  model: string,
  messages: ChatMessage[],
  apiKey: string,
): Promise<ReadableStream<Uint8Array>> {
  const resp = await fetch(GROQ_CHAT_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: MAX_TOKENS,
      stream: true,
    }),
  });
  if (!resp.ok || !resp.body) {
    throw new Error(`Groq stream HTTP ${resp.status}`);
  }
  return resp.body;
}

async function callCerebrasChat(
  model: string,
  messages: ChatMessage[],
  apiKey: string,
): Promise<string> {
  const resp = await withTimeout(
    fetch(CEREBRAS_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, max_tokens: MAX_TOKENS }),
    }),
    REQUEST_TIMEOUT_MS,
  );
  if (!resp.ok) throw new Error(`Cerebras HTTP ${resp.status}`);
  const data = (await resp.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const content = data.choices[0]?.message.content;
  if (typeof content !== "string")
    throw new Error("Cerebras: invalid response");
  return content;
}

async function callSambaNovaChat(
  model: string,
  messages: ChatMessage[],
  apiKey: string,
): Promise<string> {
  const resp = await withTimeout(
    fetch(SAMBANOVA_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, max_tokens: MAX_TOKENS }),
    }),
    REQUEST_TIMEOUT_MS,
  );
  if (!resp.ok)
    throw new Error(
      `SambaNova HTTP ${resp.status}: ${await resp.text().then((t) => t.slice(0, 200))}`,
    );
  const data = (await resp.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const content = data.choices[0]?.message.content;
  if (typeof content !== "string")
    throw new Error("SambaNova: invalid response");
  return content;
}

async function callXAIChat(
  model: string,
  messages: ChatMessage[],
  apiKey: string,
): Promise<string> {
  const resp = await withTimeout(
    fetch(XAI_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, max_tokens: MAX_TOKENS }),
    }),
    REQUEST_TIMEOUT_MS,
  );
  if (!resp.ok) throw new Error(`xAI HTTP ${resp.status}`);
  const data = (await resp.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const content = data.choices[0]?.message.content;
  if (typeof content !== "string") throw new Error("xAI: invalid response");
  return content;
}

async function callRekaChat(
  model: string,
  messages: ChatMessage[],
  apiKey: string,
): Promise<string> {
  // Reka native API: messages.content = Array<{type:"text", text}>, response.responses[0].message.content
  const rekaMessages = messages.map((m) => ({
    role: m.role,
    content: [{ type: "text", text: m.content }],
  }));
  const resp = await withTimeout(
    fetch(REKA_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({
        model,
        messages: rekaMessages,
        max_tokens: MAX_TOKENS,
      }),
    }),
    REQUEST_TIMEOUT_MS,
  );
  if (!resp.ok) throw new Error(`Reka HTTP ${resp.status}`);
  const data = (await resp.json()) as {
    responses: Array<{ message: { content: string } }>;
  };
  const content = data.responses[0]?.message.content;
  if (typeof content !== "string") throw new Error("Reka: invalid response");
  return content.trim();
}

async function callMistralChat(
  model: string,
  messages: ChatMessage[],
  apiKey: string,
): Promise<string> {
  const resp = await withTimeout(
    fetch(MISTRAL_CHAT_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, max_tokens: MAX_TOKENS }),
    }),
    REQUEST_TIMEOUT_MS,
  );
  if (!resp.ok) throw new Error(`Mistral HTTP ${resp.status}`);
  const data = (await resp.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const content = data.choices[0]?.message.content;
  if (typeof content !== "string") throw new Error("Mistral: invalid response");
  return content;
}

async function callGitHubModelsChat(
  model: string,
  messages: ChatMessage[],
  apiKey: string,
): Promise<string> {
  const resp = await withTimeout(
    fetch(GITHUB_MODELS_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, max_tokens: MAX_TOKENS }),
    }),
    REQUEST_TIMEOUT_MS,
  );
  if (!resp.ok) throw new Error(`GitHub Models HTTP ${resp.status}`);
  const data = (await resp.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const content = data.choices[0]?.message.content;
  if (typeof content !== "string")
    throw new Error("GitHub Models: invalid response");
  return content;
}

async function callOpenRouterChat(
  model: string,
  messages: ChatMessage[],
  apiKey: string,
): Promise<string> {
  const resp = await withTimeout(
    fetch(OPENROUTER_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://mami-docs.pages.dev",
        "X-Title": "Mami Docs",
      },
      body: JSON.stringify({ model, messages, max_tokens: MAX_TOKENS }),
    }),
    REQUEST_TIMEOUT_MS,
  );
  if (!resp.ok) throw new Error(`OpenRouter HTTP ${resp.status}`);
  const data = (await resp.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const content = data.choices[0]?.message.content;
  if (typeof content !== "string")
    throw new Error("OpenRouter: invalid response");
  return content;
}

async function handleChat(
  body: {
    messages: ChatMessage[];
    systemPrompt?: string;
    category?: ChatCategory;
  },
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  const messages: ChatMessage[] = body.systemPrompt
    ? [{ role: "system", content: body.systemPrompt }, ...body.messages]
    : body.messages;

  let lastError = "no provider available";

  const providers =
    body.category === "rapid"
      ? CHAT_PROVIDERS.filter((p) => p.category === "rapid")
      : body.category === "frontier"
        ? CHAT_PROVIDERS.filter((p) => p.category === "frontier")
        : CHAT_PROVIDERS;

  if (providers.length === 0) {
    return jsonResp(
      { error: `No providers for category=${body.category}` },
      400,
      cors,
    );
  }

  for (const { id, model, provider } of providers) {
    if (isOpen(id)) {
      console.warn(`[skip] circuit open id=${id}`);
      continue;
    }

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (attempt > 0)
        await new Promise<void>((r) => setTimeout(r, 1_000 * attempt));
      try {
        let content: string;
        if (provider === "groq") {
          if (!env.GROQ_API_KEY) throw new Error("GROQ_API_KEY missing");
          content = await callGroqChat(model, messages, env.GROQ_API_KEY);
        } else if (provider === "sambanova") {
          if (!env.SAMBANOVA_API_KEY)
            throw new Error("SAMBANOVA_API_KEY missing");
          content = await callSambaNovaChat(
            model,
            messages,
            env.SAMBANOVA_API_KEY,
          );
        } else if (provider === "cerebras") {
          if (!env.CEREBRAS_API_KEY)
            throw new Error("CEREBRAS_API_KEY missing");
          content = await callCerebrasChat(
            model,
            messages,
            env.CEREBRAS_API_KEY,
          );
        } else if (provider === "xai") {
          if (!env.XAI_API_KEY) throw new Error("XAI_API_KEY missing");
          content = await callXAIChat(model, messages, env.XAI_API_KEY);
        } else if (provider === "reka") {
          if (!env.REKA_API_KEY) throw new Error("REKA_API_KEY missing");
          content = await callRekaChat(model, messages, env.REKA_API_KEY);
        } else if (provider === "mistral") {
          if (!env.MISTRAL_API_KEY) throw new Error("MISTRAL_API_KEY missing");
          content = await callMistralChat(model, messages, env.MISTRAL_API_KEY);
        } else if (provider === "github") {
          if (!env.GITHUB_MODELS_TOKEN)
            throw new Error("GITHUB_MODELS_TOKEN missing");
          content = await callGitHubModelsChat(
            model,
            messages,
            env.GITHUB_MODELS_TOKEN,
          );
        } else {
          if (!env.OPENROUTER_API_KEY)
            throw new Error("OPENROUTER_API_KEY missing");
          content = await callOpenRouterChat(
            model,
            messages,
            env.OPENROUTER_API_KEY,
          );
        }
        onSuccess(id);
        console.log(`[chat-ok] provider=${id} attempt=${attempt}`);
        return jsonResp(
          { choices: [{ message: { role: "assistant", content } }] },
          200,
          cors,
        );
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        console.warn(
          `[chat-fail] provider=${id} attempt=${attempt}: ${lastError}`,
        );
      }
    }
    onFailure(id);
  }

  console.error(`[chat-all-failed] ${lastError}`);
  return jsonResp(
    {
      error:
        "Serviciul AI nu este disponibil momentan. Încearcă din nou în câteva minute.",
    },
    503,
    cors,
  );
}

// T7.E.1 — Streaming chat (Groq doar; fallback la /chat non-stream e responsabilitatea clientului).
// Field `category` acceptat forward-compat cu /chat dar ignorat aici (streaming = Groq fixed).
async function handleChatStream(
  body: {
    messages: ChatMessage[];
    systemPrompt?: string;
    category?: ChatCategory;
  },
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  const messages: ChatMessage[] = body.systemPrompt
    ? [{ role: "system", content: body.systemPrompt }, ...body.messages]
    : body.messages;

  if (!env.GROQ_API_KEY) {
    return jsonResp({ error: "Streaming nu este disponibil" }, 503, cors);
  }

  const groqProvider = CHAT_PROVIDERS.find((p) => p.provider === "groq");
  const model = groqProvider?.model ?? "llama-3.1-8b-instant";

  try {
    const upstream = await callGroqChatStream(
      model,
      messages,
      env.GROQ_API_KEY,
    );

    // Re-stream cu heartbeat keep-alive 25s pentru a evita timeout CF Workers
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    let heartbeatId: ReturnType<typeof setInterval> | null = setInterval(() => {
      writer.write(encoder.encode(": ping\n\n")).catch(() => {});
    }, 25_000);

    (async () => {
      try {
        const reader = upstream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(value);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await writer
          .write(
            encoder.encode(
              `data: ${JSON.stringify({ error: msg })}\n\ndata: [DONE]\n\n`,
            ),
          )
          .catch(() => {});
      } finally {
        if (heartbeatId) clearInterval(heartbeatId);
        heartbeatId = null;
        await writer.close().catch(() => {});
      }
    })().catch(() => {});

    return new Response(readable, {
      headers: {
        ...cors,
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonResp({ error: `Stream init failed: ${msg}` }, 503, cors);
  }
}

// ---- STT ----

async function handleTranscribe(
  request: Request,
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonResp({ error: "Invalid form-data" }, 400, cors);
  }

  const file = formData.get("file");
  if (!(file instanceof Blob))
    return jsonResp({ error: "Missing 'file'" }, 400, cors);

  // Primary: Groq Whisper
  if (env.GROQ_API_KEY) {
    try {
      const upstream = new FormData();
      upstream.append("file", file, "audio.webm");
      upstream.append("model", "whisper-large-v3");
      upstream.append("language", "ro");
      upstream.append("response_format", "json");

      const resp = await withTimeout(
        fetch(GROQ_AUDIO_API, {
          method: "POST",
          headers: { Authorization: `Bearer ${env.GROQ_API_KEY}` },
          body: upstream,
        }),
        AUDIO_TIMEOUT_MS,
      );

      if (resp.ok) {
        const data = (await resp.json()) as { text: string };
        console.log("[transcribe-ok] provider=groq-whisper");
        return jsonResp({ text: data.text }, 200, cors);
      }
      console.warn(`[transcribe-groq-fail] HTTP ${resp.status}`);
    } catch (err) {
      console.warn(
        "[transcribe-groq-fail]",
        err instanceof Error ? err.message : err,
      );
    }
  }

  // Fallback: Cloudflare Workers AI Whisper
  if (env.AI) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = (await env.AI.run("@cf/openai/whisper", {
        audio: [...new Uint8Array(arrayBuffer)],
      })) as { text: string };
      console.log("[transcribe-ok] provider=cf-workers-ai");
      return jsonResp({ text: result.text }, 200, cors);
    } catch (err) {
      console.warn(
        "[transcribe-cf-fail]",
        err instanceof Error ? err.message : err,
      );
    }
  }

  return jsonResp({ error: "Transcription failed" }, 503, cors);
}

// ---- EMBED ----

async function handleEmbed(
  body: { text: string; provider?: string },
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  const text = body.text?.trim();
  if (!text) return jsonResp({ error: "text required" }, 400, cors);

  // Gemini gemini-embedding-001
  if (
    env.GEMINI_API_KEY &&
    body.provider !== "cohere" &&
    body.provider !== "mistral"
  ) {
    try {
      const resp = await withTimeout(
        fetch(
          `${GEMINI_BASE}/models/gemini-embedding-001:embedContent?key=${env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "models/gemini-embedding-001",
              content: { parts: [{ text }] },
            }),
          },
        ),
        REQUEST_TIMEOUT_MS,
      );

      if (resp.ok) {
        const data = (await resp.json()) as { embedding: { values: number[] } };
        const vector = data.embedding?.values;
        if (Array.isArray(vector)) {
          console.log("[embed-ok] provider=gemini");
          return jsonResp(
            { vector, provider: "gemini", dim: vector.length },
            200,
            cors,
          );
        }
      }
      console.warn(`[embed-gemini-fail] HTTP ${resp.status}`);
    } catch (err) {
      console.warn(
        "[embed-gemini-fail]",
        err instanceof Error ? err.message : err,
      );
    }
  }

  // Cohere embed-multilingual-v3.0
  if (env.COHERE_API_KEY && body.provider !== "mistral") {
    try {
      const resp = await withTimeout(
        fetch(COHERE_EMBED_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.COHERE_API_KEY}`,
          },
          body: JSON.stringify({
            model: "embed-multilingual-v3.0",
            texts: [text],
            input_type: "search_document",
            embedding_types: ["float"],
          }),
        }),
        REQUEST_TIMEOUT_MS,
      );

      if (resp.ok) {
        const data = (await resp.json()) as {
          embeddings: { float: number[][] };
        };
        const vector = data.embeddings?.float?.[0];
        if (Array.isArray(vector)) {
          console.log("[embed-ok] provider=cohere");
          return jsonResp(
            { vector, provider: "cohere", dim: vector.length },
            200,
            cors,
          );
        }
      }
      console.warn(`[embed-cohere-fail] HTTP ${resp.status}`);
    } catch (err) {
      console.warn(
        "[embed-cohere-fail]",
        err instanceof Error ? err.message : err,
      );
    }
  }

  // Mistral embed
  if (env.MISTRAL_API_KEY) {
    try {
      const resp = await withTimeout(
        fetch(`${MISTRAL_API}/embeddings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.MISTRAL_API_KEY}`,
          },
          body: JSON.stringify({ model: "mistral-embed", input: [text] }),
        }),
        REQUEST_TIMEOUT_MS,
      );

      if (resp.ok) {
        const data = (await resp.json()) as {
          data: Array<{ embedding: number[] }>;
        };
        const vector = data.data?.[0]?.embedding;
        if (Array.isArray(vector)) {
          console.log("[embed-ok] provider=mistral");
          return jsonResp(
            { vector, provider: "mistral", dim: vector.length },
            200,
            cors,
          );
        }
      }
      console.warn(`[embed-mistral-fail] HTTP ${resp.status}`);
    } catch (err) {
      console.warn(
        "[embed-mistral-fail]",
        err instanceof Error ? err.message : err,
      );
    }
  }

  return jsonResp({ error: "No embedding provider available" }, 503, cors);
}

// ---- TRANSLATE ----

async function handleTranslate(
  body: { text: string; to: string; from?: string },
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  const { text, to, from } = body;
  if (!text?.trim() || !to)
    return jsonResp({ error: "text and to required" }, 400, cors);

  // DeepL free
  if (env.DEEPL_API_KEY) {
    try {
      const params = new URLSearchParams({
        text,
        target_lang: to.toUpperCase(),
      });
      if (from) params.set("source_lang", from.toUpperCase());

      const resp = await withTimeout(
        fetch(DEEPL_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `DeepL-Auth-Key ${env.DEEPL_API_KEY}`,
          },
          body: params.toString(),
        }),
        REQUEST_TIMEOUT_MS,
      );

      if (resp.ok) {
        const data = (await resp.json()) as {
          translations: Array<{
            text: string;
            detected_source_language: string;
          }>;
        };
        const translation = data.translations?.[0]?.text;
        if (translation) {
          console.log("[translate-ok] provider=deepl");
          return jsonResp({ text: translation, provider: "deepl" }, 200, cors);
        }
      }
      console.warn(`[translate-deepl-fail] HTTP ${resp.status}`);
    } catch (err) {
      console.warn(
        "[translate-deepl-fail]",
        err instanceof Error ? err.message : err,
      );
    }
  }

  // Azure Translator
  if (env.AZURE_TRANSLATOR_KEY && env.AZURE_TRANSLATOR_REGION) {
    try {
      const url = `${AZURE_TRANSLATOR_BASE}/translate?api-version=3.0&to=${encodeURIComponent(to)}${from ? `&from=${encodeURIComponent(from)}` : ""}`;
      const resp = await withTimeout(
        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": env.AZURE_TRANSLATOR_KEY,
            "Ocp-Apim-Subscription-Region": env.AZURE_TRANSLATOR_REGION,
          },
          body: JSON.stringify([{ text }]),
        }),
        REQUEST_TIMEOUT_MS,
      );

      if (resp.ok) {
        const data = (await resp.json()) as Array<{
          translations: Array<{ text: string }>;
        }>;
        const translation = data[0]?.translations?.[0]?.text;
        if (translation) {
          console.log("[translate-ok] provider=azure");
          return jsonResp({ text: translation, provider: "azure" }, 200, cors);
        }
      }
      console.warn(`[translate-azure-fail] HTTP ${resp.status}`);
    } catch (err) {
      console.warn(
        "[translate-azure-fail]",
        err instanceof Error ? err.message : err,
      );
    }
  }

  // Gemini Flash fallback
  if (env.GEMINI_API_KEY) {
    try {
      const prompt = `Translate the following text to ${to}. Return ONLY the translated text, no explanations:\n\n${text}`;
      const resp = await withTimeout(
        fetch(
          `${GEMINI_BASE}/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          },
        ),
        REQUEST_TIMEOUT_MS,
      );

      if (resp.ok) {
        const data = (await resp.json()) as {
          candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
        };
        const translation =
          data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (translation) {
          console.log("[translate-ok] provider=gemini");
          return jsonResp({ text: translation, provider: "gemini" }, 200, cors);
        }
      }
      console.warn(`[translate-gemini-fail] HTTP ${resp.status}`);
    } catch (err) {
      console.warn(
        "[translate-gemini-fail]",
        err instanceof Error ? err.message : err,
      );
    }
  }

  return jsonResp({ error: "Translation service unavailable" }, 503, cors);
}

// ---- VISION ----

async function handleVision(
  body: { imageBase64: string; mimeType: string; prompt?: string },
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  const {
    imageBase64,
    mimeType,
    prompt = "Extrage tot textul din această imagine. Răspunde în română.",
  } = body;
  if (!imageBase64 || !mimeType)
    return jsonResp({ error: "imageBase64 and mimeType required" }, 400, cors);

  // Gemini 2.5 Flash
  if (env.GEMINI_API_KEY) {
    try {
      const resp = await withTimeout(
        fetch(
          `${GEMINI_BASE}/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { inline_data: { mime_type: mimeType, data: imageBase64 } },
                    { text: prompt },
                  ],
                },
              ],
            }),
          },
        ),
        REQUEST_TIMEOUT_MS,
      );

      if (resp.ok) {
        const data = (await resp.json()) as {
          candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
        };
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          console.log("[vision-ok] provider=gemini");
          return jsonResp({ text, provider: "gemini" }, 200, cors);
        }
      }
      console.warn(`[vision-gemini-fail] HTTP ${resp.status}`);
    } catch (err) {
      console.warn(
        "[vision-gemini-fail]",
        err instanceof Error ? err.message : err,
      );
    }
  }

  // Mistral OCR
  if (env.MISTRAL_API_KEY) {
    try {
      const resp = await withTimeout(
        fetch(`${MISTRAL_API}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.MISTRAL_API_KEY}`,
          },
          body: JSON.stringify({
            model: "pixtral-12b-2409",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:${mimeType};base64,${imageBase64}`,
                    },
                  },
                  { type: "text", text: prompt },
                ],
              },
            ],
            max_tokens: 2048,
          }),
        }),
        REQUEST_TIMEOUT_MS,
      );

      if (resp.ok) {
        const data = (await resp.json()) as {
          choices: Array<{ message: { content: string } }>;
        };
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) {
          console.log("[vision-ok] provider=mistral");
          return jsonResp({ text, provider: "mistral" }, 200, cors);
        }
      }
      console.warn(`[vision-mistral-fail] HTTP ${resp.status}`);
    } catch (err) {
      console.warn(
        "[vision-mistral-fail]",
        err instanceof Error ? err.message : err,
      );
    }
  }

  return jsonResp({ error: "Vision service unavailable" }, 503, cors);
}

// ---- SEARCH ----

async function handleSearch(
  body: { query: string },
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  const { query } = body;
  if (!query?.trim()) return jsonResp({ error: "query required" }, 400, cors);

  // Brave Search
  if (env.BRAVE_API_KEY) {
    try {
      const url = `${BRAVE_API}?q=${encodeURIComponent(query)}&count=5&country=ro&search_lang=ro`;
      const resp = await withTimeout(
        fetch(url, {
          headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip",
            "X-Subscription-Token": env.BRAVE_API_KEY,
          },
        }),
        REQUEST_TIMEOUT_MS,
      );

      if (resp.ok) {
        const data = (await resp.json()) as {
          web?: {
            results?: Array<{
              title: string;
              url: string;
              description: string;
            }>;
          };
        };
        const results = (data.web?.results ?? []).map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.description,
        }));
        console.log("[search-ok] provider=brave");
        return jsonResp({ results, provider: "brave" }, 200, cors);
      }
      console.warn(`[search-brave-fail] HTTP ${resp.status}`);
    } catch (err) {
      console.warn(
        "[search-brave-fail]",
        err instanceof Error ? err.message : err,
      );
    }
  }

  // Tavily
  if (env.TAVILY_API_KEY) {
    try {
      const resp = await withTimeout(
        fetch(TAVILY_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: env.TAVILY_API_KEY,
            query,
            max_results: 5,
          }),
        }),
        REQUEST_TIMEOUT_MS,
      );

      if (resp.ok) {
        const data = (await resp.json()) as {
          results?: Array<{ title: string; url: string; content: string }>;
        };
        const results = (data.results ?? []).map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.content?.slice(0, 300),
        }));
        console.log("[search-ok] provider=tavily");
        return jsonResp({ results, provider: "tavily" }, 200, cors);
      }
      console.warn(`[search-tavily-fail] HTTP ${resp.status}`);
    } catch (err) {
      console.warn(
        "[search-tavily-fail]",
        err instanceof Error ? err.message : err,
      );
    }
  }

  // Jina Reader (no key needed)
  try {
    const jinaUrl = `https://r.jina.ai/https://www.google.com/search?q=${encodeURIComponent(query)}`;
    const resp = await withTimeout(
      fetch(jinaUrl, {
        headers: { Accept: "application/json" },
      }),
      REQUEST_TIMEOUT_MS,
    );

    if (resp.ok) {
      const text = await resp.text();
      console.log("[search-ok] provider=jina");
      return jsonResp(
        {
          results: [
            { title: "Jina Reader", url: jinaUrl, snippet: text.slice(0, 500) },
          ],
          provider: "jina",
        },
        200,
        cors,
      );
    }
  } catch (err) {
    console.warn(
      "[search-jina-fail]",
      err instanceof Error ? err.message : err,
    );
  }

  return jsonResp({ error: "Search service unavailable" }, 503, cors);
}

// ---- OCR Document (Azure Document Intelligence) ----

const ALLOWED_DOC_INTEL_MODELS = new Set([
  "prebuilt-document",
  "prebuilt-receipt",
  "prebuilt-layout",
  "prebuilt-invoice",
  "prebuilt-idDocument",
  "prebuilt-healthInsuranceCard.us",
  "prebuilt-read",
]);

const DOC_INTEL_POLL_INTERVAL_MS = 2_000;
const DOC_INTEL_MAX_POLLS = 12; // ~24s total max
const DOC_INTEL_API_VERSION = "2024-11-30";

interface DocIntelResult {
  status: string;
  analyzeResult?: {
    content?: string;
    pages?: Array<{ pageNumber?: number; words?: unknown[] }>;
    tables?: unknown[];
    documents?: Array<{ docType?: string; fields?: Record<string, unknown> }>;
  };
}

async function handleOcrDocument(
  body: { fileBase64: string; model?: string },
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  if (!env.AZURE_DOC_INTEL_KEY || !env.AZURE_DOC_INTEL_ENDPOINT) {
    return jsonResp({ error: "Azure Doc Intel not configured" }, 503, cors);
  }

  const fileBase64 = body.fileBase64?.trim();
  if (!fileBase64) {
    return jsonResp({ error: "fileBase64 required" }, 400, cors);
  }

  const model =
    body.model && ALLOWED_DOC_INTEL_MODELS.has(body.model)
      ? body.model
      : "prebuilt-document";

  const endpoint = env.AZURE_DOC_INTEL_ENDPOINT.replace(/\/$/, "");
  const submitUrl = `${endpoint}/documentintelligence/documentModels/${model}:analyze?api-version=${DOC_INTEL_API_VERSION}`;

  // Submit document
  let operationLocation: string | null;
  try {
    const submitResp = await withTimeout(
      fetch(submitUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": env.AZURE_DOC_INTEL_KEY,
        },
        body: JSON.stringify({ base64Source: fileBase64 }),
      }),
      REQUEST_TIMEOUT_MS,
    );

    if (submitResp.status !== 202) {
      const errText = (await submitResp.text()).slice(0, 300);
      console.warn(`[ocr-submit-fail] HTTP ${submitResp.status}: ${errText}`);
      return jsonResp(
        { error: `Doc Intel submit failed: ${submitResp.status}` },
        submitResp.status >= 400 && submitResp.status < 500 ? 400 : 502,
        cors,
      );
    }

    operationLocation = submitResp.headers.get("Operation-Location");
    if (!operationLocation) {
      return jsonResp(
        { error: "Doc Intel: no Operation-Location header" },
        502,
        cors,
      );
    }
  } catch (err) {
    console.warn(
      "[ocr-submit-error]",
      err instanceof Error ? err.message : err,
    );
    return jsonResp({ error: "Doc Intel submit error" }, 502, cors);
  }

  // Poll for result
  for (let i = 0; i < DOC_INTEL_MAX_POLLS; i++) {
    await new Promise<void>((r) => setTimeout(r, DOC_INTEL_POLL_INTERVAL_MS));
    try {
      const pollResp = await withTimeout(
        fetch(operationLocation, {
          headers: { "Ocp-Apim-Subscription-Key": env.AZURE_DOC_INTEL_KEY },
        }),
        REQUEST_TIMEOUT_MS,
      );

      if (!pollResp.ok) {
        console.warn(`[ocr-poll-fail] HTTP ${pollResp.status} attempt=${i}`);
        continue;
      }

      const data = (await pollResp.json()) as DocIntelResult;
      if (data.status === "succeeded") {
        const content = data.analyzeResult?.content ?? "";
        const tables = data.analyzeResult?.tables ?? [];
        const documents = data.analyzeResult?.documents ?? [];
        console.log(
          `[ocr-ok] model=${model} chars=${content.length} tables=${tables.length} polls=${i + 1}`,
        );
        return jsonResp(
          {
            content,
            tables,
            documents,
            model,
            polls: i + 1,
          },
          200,
          cors,
        );
      }
      if (data.status === "failed") {
        return jsonResp({ error: "Doc Intel analysis failed" }, 502, cors);
      }
      // status: "running" or "notStarted" → continue polling
    } catch (err) {
      console.warn(
        "[ocr-poll-error]",
        err instanceof Error ? err.message : err,
      );
    }
  }

  return jsonResp(
    { error: "Doc Intel timeout (analysis still running)" },
    504,
    cors,
  );
}

// ---- MAIN HANDLER ----

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin") ?? "";
    const allowed = env.ALLOWED_ORIGIN ?? "";

    // T6.5 — CORS strict: never fall back to "*". When ALLOWED_ORIGIN is set,
    // only the exact match is echoed; otherwise echo whatever Origin the caller
    // sent (still never wildcard). Browsers will block calls from any origin
    // not echoed here.
    const corsOrigin = allowed ? (origin === allowed ? allowed : "") : origin;

    const cors: Record<string, string> = {
      "Access-Control-Allow-Origin": corsOrigin,
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    };

    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers: cors });

    const { pathname } = new URL(request.url);

    if (pathname === "/health" && request.method === "GET") {
      return jsonResp(
        {
          ok: true,
          providers: {
            chat: [
              "groq-8b",
              "sambanova-70b",
              "cerebras-70b",
              "xai-grok-mini",
              "mistral-large",
              "github-gpt4o-mini",
              "openrouter-free",
            ],
            embed: ["gemini", "cohere", "mistral"],
            stt: ["groq-whisper", "cf-workers-ai"],
            translate: ["deepl", "azure", "gemini"],
            vision: ["gemini", "mistral"],
            "ocr-document": env.AZURE_DOC_INTEL_KEY ? ["azure-doc-intel"] : [],
            search: ["brave", "tavily", "jina"],
          },
        },
        200,
        cors,
      );
    }

    if (allowed && origin !== allowed) {
      console.warn(`[forbidden] origin="${origin}" expected="${allowed}"`);
      return jsonResp({ error: "Forbidden" }, 403, cors);
    }

    // T6.4 — Rate limiting (KV-backed, 30 req/min/IP).
    const ip = clientIp(request);
    const rl = await checkRateLimit(ip, env);
    if (!rl.allowed) {
      console.warn(`[rate-limit] ip=${ip} exceeded ${RATE_LIMIT_MAX}/min`);
      return jsonResp(
        { error: "Rate limit depășit. Reîncearcă în câteva secunde." },
        429,
        { ...cors, "Retry-After": String(rl.retryAfter) },
      );
    }

    if (pathname === "/transcribe" && request.method === "POST") {
      return handleTranscribe(request, env, cors);
    }

    if (request.method !== "POST")
      return jsonResp({ error: "Method not allowed" }, 405, cors);

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return jsonResp({ error: "Invalid JSON" }, 400, cors);
    }

    if (pathname === "/chat") {
      if (
        !Array.isArray((body as { messages?: unknown }).messages) ||
        (body as { messages: unknown[] }).messages.length === 0
      ) {
        return jsonResp({ error: "messages[] required" }, 400, cors);
      }
      return handleChat(
        body as {
          messages: ChatMessage[];
          systemPrompt?: string;
          category?: ChatCategory;
        },
        env,
        cors,
      );
    }

    if (pathname === "/chat-stream") {
      if (
        !Array.isArray((body as { messages?: unknown }).messages) ||
        (body as { messages: unknown[] }).messages.length === 0
      ) {
        return jsonResp({ error: "messages[] required" }, 400, cors);
      }
      return handleChatStream(
        body as {
          messages: ChatMessage[];
          systemPrompt?: string;
          category?: ChatCategory;
        },
        env,
        cors,
      );
    }

    if (pathname === "/embed") {
      return handleEmbed(
        body as { text: string; provider?: string },
        env,
        cors,
      );
    }

    if (pathname === "/translate") {
      return handleTranslate(
        body as { text: string; to: string; from?: string },
        env,
        cors,
      );
    }

    if (pathname === "/vision") {
      return handleVision(
        body as { imageBase64: string; mimeType: string; prompt?: string },
        env,
        cors,
      );
    }

    if (pathname === "/search") {
      return handleSearch(body as { query: string }, env, cors);
    }

    if (pathname === "/ocr-document") {
      return handleOcrDocument(
        body as { fileBase64: string; model?: string },
        env,
        cors,
      );
    }

    return jsonResp({ error: "Not found" }, 404, cors);
  },
};
