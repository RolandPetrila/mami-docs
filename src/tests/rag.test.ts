import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildRagContext, semanticSearch } from "../ai/rag";
import type { RagResult } from "../ai/rag";

// Mock dependențe externe
vi.mock("../ai/embeddings", () => ({
  generateEmbedding: vi.fn(),
  cosineSim: vi.fn(),
}));

vi.mock("../data/local-store", () => ({
  getDocChunks: vi.fn(),
  saveDocChunk: vi.fn(),
  clearDocIndex: vi.fn(),
}));

import { generateEmbedding, cosineSim } from "../ai/embeddings";
import { getDocChunks } from "../data/local-store";

const mockGenerateEmbedding = vi.mocked(generateEmbedding);
const mockCosineSim = vi.mocked(cosineSim);
const mockGetDocChunks = vi.mocked(getDocChunks);

beforeEach(() => {
  vi.clearAllMocks();
});

// ---- buildRagContext ----

describe("buildRagContext", () => {
  it("returnează string gol la results goale", () => {
    expect(buildRagContext([])).toBe("");
  });

  it("formatează un singur rezultat corect", () => {
    const results: RagResult[] = [
      {
        docId: "d1",
        docName: "Rețete",
        chunkText: "Tort cu ciocolată",
        score: 0.9,
      },
    ];
    const ctx = buildRagContext(results);
    expect(ctx).toContain("[Sursa 1: Rețete]");
    expect(ctx).toContain("Tort cu ciocolată");
  });

  it("numerotează sursele corect pentru multiple rezultate", () => {
    const results: RagResult[] = [
      { docId: "d1", docName: "Doc1", chunkText: "Text 1", score: 0.9 },
      { docId: "d2", docName: "Doc2", chunkText: "Text 2", score: 0.7 },
    ];
    const ctx = buildRagContext(results);
    expect(ctx).toContain("[Sursa 1: Doc1]");
    expect(ctx).toContain("[Sursa 2: Doc2]");
    expect(ctx).toContain("---");
  });
});

// ---- semanticSearch ----

describe("semanticSearch", () => {
  it("returnează [] la query gol", async () => {
    const results = await semanticSearch("   ");
    expect(results).toEqual([]);
    expect(mockGenerateEmbedding).not.toHaveBeenCalled();
  });

  it("returnează [] când generateEmbedding aruncă", async () => {
    mockGenerateEmbedding.mockRejectedValueOnce(new Error("no provider"));
    const results = await semanticSearch("test query");
    expect(results).toEqual([]);
  });

  it("returnează [] la vector gol din embedding", async () => {
    mockGenerateEmbedding.mockResolvedValueOnce({
      vector: [],
      provider: "transformers",
      dim: 0,
    });
    const results = await semanticSearch("test");
    expect(results).toEqual([]);
  });

  it("filtrează rezultate cu score < 0.2", async () => {
    mockGenerateEmbedding.mockResolvedValueOnce({
      vector: [1, 0],
      provider: "gemini",
      dim: 2,
    });
    mockGetDocChunks.mockReturnValueOnce([
      {
        id: "c1",
        ts: "",
        docId: "d1",
        docName: "Doc1",
        chunkIndex: 0,
        chunkText: "text",
        vector: [0, 1],
      },
    ]);
    mockCosineSim.mockReturnValueOnce(0.1); // sub threshold

    const results = await semanticSearch("test");
    expect(results).toHaveLength(0);
  });

  it("returnează rezultate sortate descrescător după score", async () => {
    mockGenerateEmbedding.mockResolvedValueOnce({
      vector: [1, 0],
      provider: "gemini",
      dim: 2,
    });
    mockGetDocChunks.mockReturnValueOnce([
      {
        id: "c1",
        ts: "",
        docId: "d1",
        docName: "Doc1",
        chunkIndex: 0,
        chunkText: "text1",
        vector: [1, 0],
      },
      {
        id: "c2",
        ts: "",
        docId: "d2",
        docName: "Doc2",
        chunkIndex: 0,
        chunkText: "text2",
        vector: [0.5, 0.5],
      },
    ]);
    mockCosineSim
      .mockReturnValueOnce(0.6) // d1
      .mockReturnValueOnce(0.8); // d2

    const results = await semanticSearch("test", 5);
    expect(results[0]!.docId).toBe("d2");
    expect(results[1]!.docId).toBe("d1");
  });

  it("deduplică — păstrează cel mai bun chunk per document", async () => {
    mockGenerateEmbedding.mockResolvedValueOnce({
      vector: [1, 0],
      provider: "gemini",
      dim: 2,
    });
    mockGetDocChunks.mockReturnValueOnce([
      {
        id: "c1",
        ts: "",
        docId: "d1",
        docName: "Doc",
        chunkIndex: 0,
        chunkText: "chunk 1",
        vector: [1, 0],
      },
      {
        id: "c2",
        ts: "",
        docId: "d1",
        docName: "Doc",
        chunkIndex: 1,
        chunkText: "chunk 2",
        vector: [0.9, 0.1],
      },
    ]);
    mockCosineSim.mockReturnValueOnce(0.9).mockReturnValueOnce(0.7);

    const results = await semanticSearch("test", 5);
    expect(results).toHaveLength(1);
    expect(results[0]!.chunkText).toBe("chunk 1"); // scorul mai mare
  });

  it("respectă topK", async () => {
    mockGenerateEmbedding.mockResolvedValueOnce({
      vector: [1, 0],
      provider: "gemini",
      dim: 2,
    });
    const chunks = Array.from({ length: 5 }, (_, i) => ({
      id: `c${i}`,
      ts: "",
      docId: `d${i}`,
      docName: `Doc${i}`,
      chunkIndex: 0,
      chunkText: `text${i}`,
      vector: [1, 0],
    }));
    mockGetDocChunks.mockReturnValueOnce(chunks);
    mockCosineSim.mockReturnValue(0.5);

    const results = await semanticSearch("test", 3);
    expect(results).toHaveLength(3);
  });
});
