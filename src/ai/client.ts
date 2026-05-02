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

// Set VITE_AI_GATEWAY_URL în .env.local pentru dev (http://localhost:8787)
// și în Cloudflare Pages env vars pentru producție
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

export async function sendChat(
  messages: ChatMessage[],
  systemPrompt: string,
  signal?: AbortSignal,
): Promise<string> {
  if (!GATEWAY_URL) {
    throw new AiGatewayError(
      "VITE_AI_GATEWAY_URL nesetat — configurează .env.local sau Pages env vars",
    );
  }

  let resp: Response;
  try {
    resp = await fetch(`${GATEWAY_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, systemPrompt }),
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
      const body = (await resp.json()) as { error?: string };
      detail = body.error ?? "";
    } catch {
      // ignore parse error
    }
    throw new AiGatewayError(detail || `HTTP ${resp.status}`, resp.status);
  }

  const data = (await resp.json()) as GatewayResponse;
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
  if (!GATEWAY_URL) throw new AiGatewayError("VITE_AI_GATEWAY_URL nesetat");
  let resp: Response;
  try {
    resp = await fetch(`${GATEWAY_URL}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, to, from }),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new AiGatewayError(
      `Eroare rețea: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (!resp.ok) throw new AiGatewayError(`HTTP ${resp.status}`, resp.status);
  const data = (await resp.json()) as { text: string };
  return data.text;
}

export async function analyzeImage(
  imageBase64: string,
  mimeType: string,
  prompt?: string,
  signal?: AbortSignal,
): Promise<string> {
  if (!GATEWAY_URL) throw new AiGatewayError("VITE_AI_GATEWAY_URL nesetat");
  let resp: Response;
  try {
    resp = await fetch(`${GATEWAY_URL}/vision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, mimeType, prompt }),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new AiGatewayError(
      `Eroare rețea: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (!resp.ok) throw new AiGatewayError(`HTTP ${resp.status}`, resp.status);
  const data = (await resp.json()) as { text: string };
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
  if (!GATEWAY_URL) throw new AiGatewayError("VITE_AI_GATEWAY_URL nesetat");
  let resp: Response;
  try {
    resp = await fetch(`${GATEWAY_URL}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new AiGatewayError(
      `Eroare rețea: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (!resp.ok) throw new AiGatewayError(`HTTP ${resp.status}`, resp.status);
  const data = (await resp.json()) as { results: SearchResult[] };
  return data.results ?? [];
}

export async function transcribeAudio(
  audioBlob: Blob,
  signal?: AbortSignal,
): Promise<string> {
  if (!GATEWAY_URL) {
    throw new AiGatewayError("VITE_AI_GATEWAY_URL nesetat");
  }

  const formData = new FormData();
  formData.append("file", audioBlob, "audio.webm");

  let resp: Response;
  try {
    resp = await fetch(`${GATEWAY_URL}/transcribe`, {
      method: "POST",
      body: formData,
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new AiGatewayError(
      `Eroare rețea: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (!resp.ok) {
    throw new AiGatewayError(`HTTP ${resp.status}`, resp.status);
  }

  const data = (await resp.json()) as { text: string };
  return data.text;
}
