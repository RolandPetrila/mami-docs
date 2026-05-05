// Mami_Docs AI Gateway — Cloudflare Worker proxy
// CRITIC SECURITATE: cheile API trăiesc exclusiv în Cloudflare Secrets.
//
// Endpoint: POST /chat        { messages[], systemPrompt? }
// Endpoint: POST /transcribe  multipart/form-data { file: Blob }
// Endpoint: POST /embed       { text: string, provider?: "gemini"|"cohere"|"mistral" }
// Endpoint: POST /translate   { text: string, to: string, from?: string }
// Endpoint: POST /vision      { imageBase64: string, mimeType: string, prompt?: string }
// Endpoint: POST /search      { query: string }
// Endpoint: GET  /health      → { ok: true }
//
// Fallback chains (ADR D4 + 2026-05-06 extension):
//   Chat:      Groq 8B → SambaNova 70B → Cerebras 70B → xAI Grok-3-mini → Mistral Large → OpenRouter :free
//   Embed:     Gemini gemini-embedding-001 → Cohere multilingual-v3 → Mistral embed
//   STT:       Groq Whisper → CF Workers AI Whisper
//   Translate: DeepL → Azure Translator → Gemini Flash
//   Vision:    Gemini 2.5 Flash → Mistral OCR
//   Search:    Brave → Tavily → Jina Reader

export interface Env {
  GROQ_API_KEY: string;
  SAMBANOVA_API_KEY?: string;
  CEREBRAS_API_KEY?: string;
  XAI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  GEMINI_API_KEY?: string;
  COHERE_API_KEY?: string;
  MISTRAL_API_KEY?: string;
  DEEPL_API_KEY?: string;
  AZURE_TRANSLATOR_KEY?: string;
  AZURE_TRANSLATOR_REGION?: string;
  BRAVE_API_KEY?: string;
  TAVILY_API_KEY?: string;
  AI?: { run: (model: string, inputs: unknown) => Promise<unknown> }; // CF Workers AI binding
  ALLOWED_ORIGIN?: string;
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
// SambaNova testat 939ms latency pe Llama 3.3-70B (3-7x mai rapid decât Groq 70B).
// xAI Grok-3-mini = frontier-class pentru cazuri complexe (medical, contextual).
// Mistral Large = 1B tokens/lună gratuit, redundanță suplimentară.
const CHAT_PROVIDERS = [
  { id: "groq-8b", model: "llama-3.1-8b-instant", provider: "groq" },
  {
    id: "sambanova-70b",
    model: "Meta-Llama-3.3-70B-Instruct",
    provider: "sambanova",
  },
  { id: "cerebras-70b", model: "llama3.3-70b", provider: "cerebras" },
  { id: "xai-grok-mini", model: "grok-3-mini", provider: "xai" },
  { id: "mistral-large", model: "mistral-large-latest", provider: "mistral" },
  {
    id: "openrouter-free",
    model: "meta-llama/llama-3.1-8b-instruct:free",
    provider: "openrouter",
  },
] as const;

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
  body: { messages: ChatMessage[]; systemPrompt?: string },
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  const messages: ChatMessage[] = body.systemPrompt
    ? [{ role: "system", content: body.systemPrompt }, ...body.messages]
    : body.messages;

  let lastError = "no provider available";

  for (const { id, model, provider } of CHAT_PROVIDERS) {
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
        } else if (provider === "mistral") {
          if (!env.MISTRAL_API_KEY) throw new Error("MISTRAL_API_KEY missing");
          content = await callMistralChat(model, messages, env.MISTRAL_API_KEY);
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

// ---- MAIN HANDLER ----

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
              "openrouter-free",
            ],
            embed: ["gemini", "cohere", "mistral"],
            stt: ["groq-whisper", "cf-workers-ai"],
            translate: ["deepl", "azure", "gemini"],
            vision: ["gemini", "mistral"],
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
        body as { messages: ChatMessage[]; systemPrompt?: string },
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

    return jsonResp({ error: "Not found" }, 404, cors);
  },
};
