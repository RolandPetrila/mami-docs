import { describe, it, expect, vi, beforeEach } from "vitest";
import worker from "./index";

type Env = Parameters<typeof worker.fetch>[1];

const BASE_ENV: Env = {
  GROQ_API_KEY: "test-groq-key",
  CEREBRAS_API_KEY: "test-cerebras-key",
  OPENROUTER_API_KEY: "test-openrouter-key",
  GEMINI_API_KEY: "test-gemini-key",
  COHERE_API_KEY: "test-cohere-key",
  MISTRAL_API_KEY: "test-mistral-key",
  DEEPL_API_KEY: "test-deepl-key",
  BRAVE_API_KEY: "test-brave-key",
  TAVILY_API_KEY: "test-tavily-key",
  ALLOWED_ORIGIN: "https://mami-docs.pages.dev",
};

const ORIGIN = "https://mami-docs.pages.dev";

function req(
  path: string,
  method = "GET",
  body?: unknown,
  origin = ORIGIN,
): Request {
  return new Request(`https://worker.example.com${path}`, {
    method,
    headers: {
      "Content-Type": method === "POST" ? "application/json" : "text/plain",
      Origin: origin,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function groqOk(content: string) {
  return new Response(
    JSON.stringify({ choices: [{ message: { role: "assistant", content } }] }),
    { status: 200 },
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

// ---- CORS / OPTIONS ----

describe("CORS", () => {
  it("OPTIONS returnează 204 cu headers CORS", async () => {
    const resp = await worker.fetch(
      new Request("https://worker.example.com/chat", {
        method: "OPTIONS",
        headers: { Origin: ORIGIN },
      }),
      BASE_ENV,
    );
    expect(resp.status).toBe(204);
    expect(resp.headers.get("Access-Control-Allow-Methods")).toContain("POST");
  });

  it("Origin neautorizat returnează 403", async () => {
    const resp = await worker.fetch(
      req(
        "/chat",
        "POST",
        { messages: [{ role: "user", content: "test" }] },
        "https://attacker.com",
      ),
      BASE_ENV,
    );
    expect(resp.status).toBe(403);
    const body = (await resp.json()) as { error: string };
    expect(body.error).toBe("Forbidden");
  });

  it("fără ALLOWED_ORIGIN acceptă orice origin", async () => {
    const envNoOrigin = { ...BASE_ENV, ALLOWED_ORIGIN: undefined };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(groqOk("ok"));
    const resp = await worker.fetch(
      req("/health", "GET", undefined, "https://orice.com"),
      envNoOrigin,
    );
    expect(resp.status).toBe(200);
  });
});

// ---- /health ----

describe("GET /health", () => {
  it("returnează ok: true și lista de providers", async () => {
    const resp = await worker.fetch(req("/health"), BASE_ENV);
    expect(resp.status).toBe(200);
    const body = (await resp.json()) as {
      ok: boolean;
      providers: Record<string, string[]>;
    };
    expect(body.ok).toBe(true);
    expect(body.providers.chat).toContain("groq-8b");
    expect(body.providers.embed).toContain("gemini");
    expect(body.providers.search).toContain("brave");
  });
});

// ---- Routing edge cases ----

describe("Routing", () => {
  it("rută necunoscută returnează 404", async () => {
    const resp = await worker.fetch(req("/unknown", "POST", {}), BASE_ENV);
    expect(resp.status).toBe(404);
  });

  it("GET pe /chat returnează 405", async () => {
    const resp = await worker.fetch(req("/chat", "GET"), BASE_ENV);
    expect(resp.status).toBe(405);
  });

  it("JSON invalid returnează 400", async () => {
    const badReq = new Request("https://worker.example.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: ORIGIN },
      body: "INVALID JSON{{{",
    });
    const resp = await worker.fetch(badReq, BASE_ENV);
    expect(resp.status).toBe(400);
    const body = (await resp.json()) as { error: string };
    expect(body.error).toBe("Invalid JSON");
  });

  it("/chat fără messages returnează 400", async () => {
    const resp = await worker.fetch(
      req("/chat", "POST", { messages: [] }),
      BASE_ENV,
    );
    expect(resp.status).toBe(400);
  });

  it("/chat cu messages null returnează 400", async () => {
    const resp = await worker.fetch(
      req("/chat", "POST", { messages: null }),
      BASE_ENV,
    );
    expect(resp.status).toBe(400);
  });
});

// ---- /chat ----

describe("POST /chat", () => {
  it("returnează răspuns AI la Groq OK", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(groqOk("Bună ziua!"));
    const resp = await worker.fetch(
      req("/chat", "POST", { messages: [{ role: "user", content: "Salut" }] }),
      BASE_ENV,
    );
    expect(resp.status).toBe(200);
    const body = (await resp.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    expect(body.choices[0]!.message.content).toBe("Bună ziua!");
  });

  it("prepend systemPrompt ca mesaj system", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(groqOk("ok"));
    await worker.fetch(
      req("/chat", "POST", {
        messages: [{ role: "user", content: "test" }],
        systemPrompt: "Ești asistentul mamei.",
      }),
      BASE_ENV,
    );
    const sentBody = JSON.parse(
      (fetchSpy.mock.calls[0]![1] as RequestInit).body as string,
    );
    expect(sentBody.messages[0].role).toBe("system");
    expect(sentBody.messages[0].content).toBe("Ești asistentul mamei.");
  });

  it("failover la Groq 70b când Groq 8b eșuează", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("rate limited", { status: 429 })) // groq-8b fail
      .mockResolvedValueOnce(new Response("rate limited", { status: 429 })) // retry groq-8b
      .mockResolvedValueOnce(groqOk("Răspuns din 70b")); // groq-70b ok
    const resp = await worker.fetch(
      req("/chat", "POST", { messages: [{ role: "user", content: "test" }] }),
      BASE_ENV,
    );
    expect(resp.status).toBe(200);
    const body = (await resp.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    expect(body.choices[0]!.message.content).toBe("Răspuns din 70b");
  });

  it("returnează 503 când toți providerii eșuează", async () => {
    // Chain de 7 provideri × MAX_RETRIES (2) × delay-uri retry — 5s timeout default e prea mic.
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("fail", { status: 500 }),
    );
    const resp = await worker.fetch(
      req("/chat", "POST", {
        messages: [{ role: "user", content: "test" }],
      }),
      {
        ...BASE_ENV,
        SAMBANOVA_API_KEY: "k",
        CEREBRAS_API_KEY: "k",
        XAI_API_KEY: "k",
        MISTRAL_API_KEY: "k",
        GITHUB_MODELS_TOKEN: "k",
        OPENROUTER_API_KEY: "k",
      },
    );
    expect(resp.status).toBe(503);
    const body = (await resp.json()) as { error: string };
    expect(body.error).toContain("disponibil");
  }, 20_000);
});

// ---- /embed ----

describe("POST /embed", () => {
  it("returnează vector la Gemini OK", async () => {
    const mockVector = [0.1, 0.2, 0.3];
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ embedding: { values: mockVector } }), {
        status: 200,
      }),
    );
    const resp = await worker.fetch(
      req("/embed", "POST", { text: "test" }),
      BASE_ENV,
    );
    expect(resp.status).toBe(200);
    const body = (await resp.json()) as { vector: number[]; provider: string };
    expect(body.provider).toBe("gemini");
    expect(body.vector).toEqual(mockVector);
  });

  it("returnează 400 la text gol", async () => {
    const resp = await worker.fetch(
      req("/embed", "POST", { text: "   " }),
      BASE_ENV,
    );
    expect(resp.status).toBe(400);
  });

  it("returnează 503 când toți providerii embed eșuează", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("fail", { status: 500 }),
    );
    const resp = await worker.fetch(
      req("/embed", "POST", { text: "test" }),
      BASE_ENV,
    );
    expect(resp.status).toBe(503);
  });
});

// ---- /translate ----

describe("POST /translate", () => {
  it("returnează text tradus via DeepL", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          translations: [{ text: "Hello", detected_source_language: "RO" }],
        }),
        { status: 200 },
      ),
    );
    const resp = await worker.fetch(
      req("/translate", "POST", { text: "Salut", to: "en" }),
      BASE_ENV,
    );
    expect(resp.status).toBe(200);
    const body = (await resp.json()) as { text: string; provider: string };
    expect(body.text).toBe("Hello");
    expect(body.provider).toBe("deepl");
  });

  it("returnează 400 fără `to`", async () => {
    const resp = await worker.fetch(
      req("/translate", "POST", { text: "test" }),
      BASE_ENV,
    );
    expect(resp.status).toBe(400);
  });
});

// ---- /vision ----

describe("POST /vision", () => {
  it("returnează 400 fără imageBase64", async () => {
    const resp = await worker.fetch(
      req("/vision", "POST", { mimeType: "image/jpeg" }),
      BASE_ENV,
    );
    expect(resp.status).toBe(400);
  });

  it("returnează text la Gemini OK", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: "Text din imagine" }] } }],
        }),
        { status: 200 },
      ),
    );
    const resp = await worker.fetch(
      req("/vision", "POST", { imageBase64: "abc123", mimeType: "image/jpeg" }),
      BASE_ENV,
    );
    expect(resp.status).toBe(200);
    const body = (await resp.json()) as { text: string };
    expect(body.text).toBe("Text din imagine");
  });
});

// ---- /search ----

describe("POST /search", () => {
  it("returnează 400 la query gol", async () => {
    const resp = await worker.fetch(
      req("/search", "POST", { query: "" }),
      BASE_ENV,
    );
    expect(resp.status).toBe(400);
  });

  it("returnează rezultate via Brave", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          web: {
            results: [
              {
                title: "Rezultat",
                url: "https://ex.com",
                description: "Descriere",
              },
            ],
          },
        }),
        { status: 200 },
      ),
    );
    const resp = await worker.fetch(
      req("/search", "POST", { query: "rețete" }),
      BASE_ENV,
    );
    expect(resp.status).toBe(200);
    const body = (await resp.json()) as {
      results: unknown[];
      provider: string;
    };
    expect(body.provider).toBe("brave");
    expect(body.results).toHaveLength(1);
  });
});

// ---- T6.4 Rate limiting (KV-backed) ----

interface KvStore {
  get: (k: string) => Promise<string | null>;
  put: (k: string, v: string, opts?: unknown) => Promise<void>;
}

function makeKv(initial: Record<string, string> = {}): KvStore & {
  store: Record<string, string>;
} {
  const store = { ...initial };
  return {
    store,
    get: async (k: string) => store[k] ?? null,
    put: async (k: string, v: string) => {
      store[k] = v;
    },
  };
}

describe("T6.4 rate limiting", () => {
  it("permite request când KV nu e legat (graceful fallback)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(groqOk("ok"));
    const resp = await worker.fetch(
      req("/chat", "POST", { messages: [{ role: "user", content: "x" }] }),
      BASE_ENV,
    );
    expect(resp.status).toBe(200);
  });

  it("permite primul request când KV legat și counter 0", async () => {
    const kv = makeKv();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(groqOk("ok"));
    const resp = await worker.fetch(
      req("/chat", "POST", { messages: [{ role: "user", content: "x" }] }),
      // @ts-expect-error — RATE_LIMIT_KV are tipul KVNamespace în prod, mock minimal aici
      { ...BASE_ENV, RATE_LIMIT_KV: kv },
    );
    expect(resp.status).toBe(200);
    expect(Object.keys(kv.store).length).toBe(1);
  });

  it("blochează cu 429 + Retry-After când counter ≥ 30", async () => {
    const kv = makeKv({ "rl:unknown": "30" });
    const resp = await worker.fetch(
      req("/chat", "POST", { messages: [{ role: "user", content: "x" }] }),
      // @ts-expect-error — mock KV
      { ...BASE_ENV, RATE_LIMIT_KV: kv },
    );
    expect(resp.status).toBe(429);
    expect(resp.headers.get("Retry-After")).toBe("60");
    const body = (await resp.json()) as { error: string };
    expect(body.error).toMatch(/rate limit/i);
  });

  it("incrementează contor pe IP la fiecare request permis", async () => {
    const kv = makeKv({ "rl:1.2.3.4": "5" });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(groqOk("ok"));
    const r = new Request("https://worker.example.com/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: ORIGIN,
        "CF-Connecting-IP": "1.2.3.4",
      },
      body: JSON.stringify({ messages: [{ role: "user", content: "x" }] }),
    });
    await worker.fetch(
      r,
      // @ts-expect-error — mock KV
      { ...BASE_ENV, RATE_LIMIT_KV: kv },
    );
    expect(kv.store["rl:1.2.3.4"]).toBe("6");
  });
});

// ---- T6.5 CORS strict ----

describe("T6.5 CORS strict", () => {
  it("Access-Control-Allow-Origin nu mai e `*` chiar fără ALLOWED_ORIGIN", async () => {
    const envNoOrigin = { ...BASE_ENV, ALLOWED_ORIGIN: undefined };
    const resp = await worker.fetch(
      new Request("https://worker.example.com/health", {
        method: "GET",
        headers: { Origin: "https://orice.com" },
      }),
      envNoOrigin,
    );
    expect(resp.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://orice.com",
    );
    expect(resp.headers.get("Access-Control-Allow-Origin")).not.toBe("*");
  });

  it("Origin match → echo allowed origin", async () => {
    const resp = await worker.fetch(req("/health"), BASE_ENV);
    expect(resp.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
  });

  it("Vary: Origin prezent în răspuns", async () => {
    const resp = await worker.fetch(req("/health"), BASE_ENV);
    expect(resp.headers.get("Vary")).toBe("Origin");
  });
});
