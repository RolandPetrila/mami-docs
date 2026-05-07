// Client-side wrapper pentru AI Gateway Cloudflare Worker.
// URL-ul worker-ului e public (nu secret) — folosim VITE_ prefix.
// NICIODATĂ nu trece GROQ_API_KEY prin client — cheia rămâne în Worker Secrets.

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface GroqChoice {
  message: {
    role: string;
    content: string;
  };
}

interface GatewayResponse {
  choices: GroqChoice[];
}

const GATEWAY_URL =
  (import.meta.env.VITE_AI_GATEWAY_URL as string | undefined) ?? "";

// Auto-retry dacă Retry-After <= acest prag (ms). > prag → throw cu mesaj UX.
const MAX_AUTO_RETRY_WAIT_MS = 15_000;

export class AiGatewayError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "AiGatewayError";
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// T9.11 — DRY helper pentru toate endpoint-urile AI Gateway.
// Body acceptă obiect (auto-JSON) sau FormData (multipart pentru /transcribe).
// Pe 429: retry automat dacă Retry-After ≤ 15s (single-user, no thundering herd).
// Pe non-ok → încearcă să citească { error } din JSON pentru detail.
async function fetchJson<T>(
  path: string,
  body: unknown | FormData,
  signal?: AbortSignal,
  _attempt = 0,
): Promise<T> {
  if (!GATEWAY_URL) {
    throw new AiGatewayError(
      "VITE_AI_GATEWAY_URL nesetat — configurează .env.local sau Pages env vars",
    );
  }

  const isForm = body instanceof FormData;
  let resp: Response;
  try {
    resp = await fetch(`${GATEWAY_URL}${path}`, {
      method: "POST",
      headers: isForm ? undefined : { "Content-Type": "application/json" },
      body: isForm ? body : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new AiGatewayError(
      `Eroare rețea: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // 429 — rate limit propriu gateway. Worker setează Retry-After: 60 (RATE_LIMIT_WINDOW_SEC).
  // Retry automat dacă Retry-After ≤ 15s (mic window). Altfel mesaj UX clar.
  if (resp.status === 429 && _attempt === 0) {
    const retryAfterSec = parseInt(resp.headers.get("Retry-After") ?? "60");
    const waitMs = retryAfterSec * 1000;
    if (waitMs <= MAX_AUTO_RETRY_WAIT_MS) {
      await sleep(waitMs + Math.random() * 500);
      return fetchJson<T>(path, body, signal, 1);
    }
    throw new AiGatewayError(
      `Prea multe cereri — încearcă din nou în ${retryAfterSec} secunde`,
      429,
    );
  }

  if (!resp.ok) {
    let detail = "";
    try {
      const errBody = (await resp.json()) as { error?: string };
      detail = errBody.error ?? "";
    } catch (err) {
      console.warn(
        "[ai/client] eroare parsare răspuns:",
        err instanceof Error ? err.message : String(err),
      );
    }
    throw new AiGatewayError(detail || `HTTP ${resp.status}`, resp.status);
  }

  return (await resp.json()) as T;
}

export async function sendChat(
  messages: ChatMessage[],
  systemPrompt: string,
  signal?: AbortSignal,
): Promise<string> {
  const data = await fetchJson<GatewayResponse>(
    "/chat",
    { messages, systemPrompt },
    signal,
  );
  const content = data.choices[0]?.message.content;
  if (typeof content !== "string") {
    throw new AiGatewayError("Răspuns invalid de la AI Gateway");
  }
  return content;
}

export async function translateText(
  text: string,
  to: string,
  from?: string,
  signal?: AbortSignal,
): Promise<string> {
  const data = await fetchJson<{ text: string }>(
    "/translate",
    { text, to, from },
    signal,
  );
  return data.text;
}

export async function analyzeImage(
  imageBase64: string,
  mimeType: string,
  prompt?: string,
  signal?: AbortSignal,
): Promise<string> {
  const data = await fetchJson<{ text: string }>(
    "/vision",
    { imageBase64, mimeType, prompt },
    signal,
  );
  return data.text;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export async function searchWeb(
  query: string,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  const data = await fetchJson<{ results: SearchResult[] }>(
    "/search",
    { query },
    signal,
  );
  return data.results ?? [];
}

export async function transcribeAudio(
  audioBlob: Blob,
  signal?: AbortSignal,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", audioBlob, "audio.webm");
  const data = await fetchJson<{ text: string }>(
    "/transcribe",
    formData,
    signal,
  );
  return data.text;
}

// T7.E.1 — SSE streaming chat. onChunk primește text incremental (chunk-by-chunk).
// Fallback automat la /chat non-stream dacă /chat-stream eșuează.
export async function sendChatStream(
  messages: ChatMessage[],
  systemPrompt: string,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  if (!GATEWAY_URL) {
    throw new AiGatewayError("VITE_AI_GATEWAY_URL nesetat");
  }
  let resp: Response;
  try {
    resp = await fetch(`${GATEWAY_URL}/chat-stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, systemPrompt }),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new AiGatewayError(
      `Stream rețea: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (!resp.ok || !resp.body) {
    // 429 pe stream — avertizează sau retry cu Retry-After înainte de fallback non-stream
    if (resp.status === 429) {
      const retryAfterSec = parseInt(resp.headers.get("Retry-After") ?? "60");
      const waitMs = retryAfterSec * 1000;
      if (waitMs <= MAX_AUTO_RETRY_WAIT_MS) {
        await sleep(waitMs + Math.random() * 500);
        return sendChatStream(messages, systemPrompt, onChunk, signal);
      }
      throw new AiGatewayError(
        `Prea multe cereri — încearcă din nou în ${retryAfterSec} secunde`,
        429,
      );
    }
    // Fallback la non-stream pentru orice alt non-ok
    const fallback = await sendChat(messages, systemPrompt, signal);
    onChunk(fallback);
    return fallback;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n\n")) !== -1) {
      const event = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 2);
      if (!event || event.startsWith(":")) continue; // heartbeat
      const dataLine = event
        .split("\n")
        .find((l) => l.startsWith("data: "))
        ?.slice(6);
      if (!dataLine) continue;
      if (dataLine === "[DONE]") return full;
      try {
        const parsed = JSON.parse(dataLine) as {
          choices?: Array<{ delta?: { content?: string } }>;
          error?: string;
        };
        if (parsed.error) throw new AiGatewayError(parsed.error);
        const piece = parsed.choices?.[0]?.delta?.content;
        if (piece) {
          full += piece;
          onChunk(piece);
        }
      } catch (err) {
        if (err instanceof AiGatewayError) throw err;
        // ignore parse errors per chunk
      }
    }
  }
  return full;
}
