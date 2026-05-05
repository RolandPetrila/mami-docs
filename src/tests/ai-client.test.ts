import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  sendChat,
  translateText,
  analyzeImage,
  searchWeb,
  transcribeAudio,
  AiGatewayError,
} from "../ai/client";

const GATEWAY = "http://localhost:8787";

function makeResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

// ---- sendChat ----

describe("sendChat", () => {
  it("returnează conținut la răspuns valid", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      makeResp({
        choices: [{ message: { role: "assistant", content: "Bună ziua!" } }],
      }),
    );
    const result = await sendChat(
      [{ role: "user", content: "Salut" }],
      "Ești asistentul mamei.",
    );
    expect(result).toBe("Bună ziua!");
  });

  it("aruncă AiGatewayError la HTTP 503", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      makeResp({ error: "Serviciu indisponibil" }, 503),
    );
    await expect(
      sendChat([{ role: "user", content: "test" }], ""),
    ).rejects.toThrow(AiGatewayError);
  });

  it("AiGatewayError conține status code", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(makeResp({}, 429));
    try {
      await sendChat([{ role: "user", content: "test" }], "");
    } catch (e) {
      expect(e).toBeInstanceOf(AiGatewayError);
      expect((e as AiGatewayError).status).toBe(429);
    }
  });

  it("aruncă AiGatewayError la eroare de rețea", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new TypeError("Failed to fetch"),
    );
    await expect(
      sendChat([{ role: "user", content: "test" }], ""),
    ).rejects.toThrow(AiGatewayError);
  });

  it("aruncă AiGatewayError când choices lipsesc", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      makeResp({ choices: [] }),
    );
    await expect(
      sendChat([{ role: "user", content: "test" }], ""),
    ).rejects.toThrow("Răspuns invalid de la AI Gateway");
  });

  it("AbortError se propagă neschimbat", async () => {
    const abortErr = new DOMException("Aborted", "AbortError");
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(abortErr);
    await expect(
      sendChat([{ role: "user", content: "test" }], ""),
    ).rejects.toThrow("Aborted");
  });

  it("trimite URL corect", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        makeResp({
          choices: [{ message: { role: "assistant", content: "ok" } }],
        }),
      );
    await sendChat([{ role: "user", content: "test" }], "system");
    expect(fetchSpy).toHaveBeenCalledWith(
      `${GATEWAY}/chat`,
      expect.objectContaining({ method: "POST" }),
    );
  });
});

// ---- translateText ----

describe("translateText", () => {
  it("returnează text tradus", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      makeResp({ text: "Hello" }),
    );
    const result = await translateText("Bună ziua", "en");
    expect(result).toBe("Hello");
  });

  it("aruncă la HTTP error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(makeResp({}, 500));
    await expect(translateText("test", "en")).rejects.toThrow(AiGatewayError);
  });

  it("trimite parametrul `from` când e specificat", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(makeResp({ text: "Hello" }));
    await translateText("Bună", "en", "ro");
    const body = JSON.parse(
      (spy.mock.calls[0]![1] as RequestInit).body as string,
    );
    expect(body.from).toBe("ro");
  });
});

// ---- analyzeImage ----

describe("analyzeImage", () => {
  it("returnează text din imagine", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      makeResp({ text: "Rețetă tort cu ciocolată" }),
    );
    const result = await analyzeImage("base64data==", "image/jpeg");
    expect(result).toBe("Rețetă tort cu ciocolată");
  });

  it("aruncă AiGatewayError la 503", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(makeResp({}, 503));
    await expect(analyzeImage("data", "image/png")).rejects.toThrow(
      AiGatewayError,
    );
  });
});

// ---- searchWeb ----

describe("searchWeb", () => {
  it("returnează results array", async () => {
    const mockResults = [
      { title: "Titlu", url: "https://example.com", snippet: "Descriere" },
    ];
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      makeResp({ results: mockResults }),
    );
    const results = await searchWeb("rețete românești");
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe("Titlu");
  });

  it("returnează [] dacă results lipsesc din răspuns", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(makeResp({}));
    const results = await searchWeb("test");
    expect(results).toEqual([]);
  });
});

// ---- transcribeAudio ----

describe("transcribeAudio", () => {
  it("returnează textul transcris", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      makeResp({ text: "Astăzi mă simt bine" }),
    );
    const blob = new Blob(["audio-data"], { type: "audio/webm" });
    const result = await transcribeAudio(blob);
    expect(result).toBe("Astăzi mă simt bine");
  });

  it("trimite formData cu câmpul 'file'", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(makeResp({ text: "ok" }));
    const blob = new Blob(["data"], { type: "audio/webm" });
    await transcribeAudio(blob);
    const [url, init] = spy.mock.calls[0]!;
    expect(url).toBe(`${GATEWAY}/transcribe`);
    expect((init as RequestInit).body).toBeInstanceOf(FormData);
  });

  it("aruncă la HTTP error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(makeResp({}, 400));
    await expect(
      transcribeAudio(new Blob(["x"], { type: "audio/webm" })),
    ).rejects.toThrow(AiGatewayError);
  });
});
