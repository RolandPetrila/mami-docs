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

export class AiGatewayError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "AiGatewayError";
  }
}

// T9.11 — DRY helper pentru toate endpoint-urile AI Gateway.
// Body acceptă obiect (auto-JSON) sau FormData (multipart pentru /transcribe).
// Pe non-ok → încearcă să citească { error } din JSON pentru detail.
async function fetchJson<T>(
  path: string,
  body: unknown | FormData,
  signal?: AbortSignal,
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
