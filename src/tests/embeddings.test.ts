import { describe, it, expect, vi, beforeEach } from "vitest";
import { cosineSim, generateEmbedding } from "../ai/embeddings";

// Transformers.js face fetch-uri interne la loading model — mock complet pentru a evita consumarea mock-urilor fetch
vi.mock("@xenova/transformers", () => ({
  pipeline: vi.fn().mockRejectedValue(new Error("No model in test env")),
}));

// ---- cosineSim — pur matematic, nu necesită mock ----

describe("cosineSim", () => {
  it("vectori identici → 1", () => {
    expect(cosineSim([1, 0, 0], [1, 0, 0])).toBeCloseTo(1);
  });

  it("vectori opuși → -1", () => {
    expect(cosineSim([1, 0], [-1, 0])).toBeCloseTo(-1);
  });

  it("vectori ortogonali → 0", () => {
    expect(cosineSim([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it("vectori zero → 0", () => {
    expect(cosineSim([0, 0], [0, 0])).toBe(0);
  });

  it("array-uri de lungimi diferite → 0", () => {
    expect(cosineSim([1, 2, 3], [1, 2])).toBe(0);
  });

  it("array gol → 0", () => {
    expect(cosineSim([], [])).toBe(0);
  });

  it("vectori non-normalizați — rezultat corect", () => {
    // [3,4] și [6,8] sunt același unghi → cosine = 1
    expect(cosineSim([3, 4], [6, 8])).toBeCloseTo(1);
  });

  it("similaritate parțială", () => {
    const a = [1, 1, 0];
    const b = [1, 0, 0];
    // cos(45°) ≈ 0.707
    expect(cosineSim(a, b)).toBeCloseTo(0.707, 2);
  });
});

// ---- generateEmbedding — mock chain ----

describe("generateEmbedding", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returnează vector gol la text gol", async () => {
    const result = await generateEmbedding("   ");
    expect(result.vector).toEqual([]);
    expect(result.dim).toBe(0);
  });

  it("folosește Gemini când gateway disponibil și răspunde OK", async () => {
    const mockVector = [0.1, 0.2, 0.3];
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ vector: mockVector }), { status: 200 }),
    );

    const result = await generateEmbedding("test text");
    expect(result.provider).toBe("gemini");
    expect(result.vector).toEqual(mockVector);
    expect(result.dim).toBe(3);
  });

  it("fallback la Cohere dacă Gemini răspunde non-ok", async () => {
    const cohereVector = [0.5, 0.6, 0.7];
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("", { status: 500 })) // Gemini fail
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ vector: cohereVector }), { status: 200 }),
      ); // Cohere ok (transformers.js e mock-uit să eșueze fără fetch)

    const result = await generateEmbedding("test text");
    expect(result.provider).toBe("cohere");
    expect(result.vector).toEqual(cohereVector);
  });

  it("aruncă eroare dacă toți providerii eșuează", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 500 }),
    );
    await expect(generateEmbedding("test")).rejects.toThrow(
      "No embedding provider available",
    );
  });
});
