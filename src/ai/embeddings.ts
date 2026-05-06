// Embeddings cu lanț de fallback:
//   1. Gemini gemini-embedding-001 (server-side via AI Gateway — necesită cheie)
//   2. @huggingface/transformers Xenova/multilingual-e5-small (client offline, ~120MB descărcare la prima rulare)
//   3. Cohere embed-multilingual-v3.0 (server-side — necesită cheie)
//
// Faza 1.5: doar transformers.js e funcțional fără credentiale.
// Faza 3: Gemini + Cohere se activează când AI Gateway expune /embed cu chei.
// T8.4 — migrat @xenova/transformers (abandoned 18+ luni) → @huggingface/transformers v4
// (WebGPU support + bundle -53%; API pipeline() compatibil v2→v3→v4).

export interface EmbeddingResult {
  vector: number[];
  provider: "gemini" | "transformers" | "cohere";
  dim: number;
}

const GATEWAY_URL =
  (import.meta.env.VITE_AI_GATEWAY_URL as string | undefined) ?? "";
const TRANSFORMERS_MODEL = "Xenova/multilingual-e5-small";

// Lazy-loaded singleton — transformers.js e ~12MB JS + ~120MB model la prima rulare.
let _pipelinePromise: Promise<unknown> | null = null;

async function getTransformersPipeline(): Promise<
  (text: string, opts?: unknown) => Promise<{ data: Float32Array }>
> {
  if (!_pipelinePromise) {
    _pipelinePromise = (async () => {
      const mod = (await import(
        /* @vite-ignore */ "@huggingface/transformers"
      )) as {
        pipeline: (
          task: string,
          model: string,
          opts?: Record<string, unknown>,
        ) => Promise<
          (text: string, opts?: unknown) => Promise<{ data: Float32Array }>
        >;
      };
      // v4: `quantized` redenumit ca `dtype: "q8"` în noul API. Fallback safe.
      return mod.pipeline("feature-extraction", TRANSFORMERS_MODEL, {
        dtype: "q8",
      });
    })();
  }
  return _pipelinePromise as Promise<
    (text: string, opts?: unknown) => Promise<{ data: Float32Array }>
  >;
}

async function generateGemini(text: string): Promise<EmbeddingResult | null> {
  if (!GATEWAY_URL) return null;
  try {
    const resp = await fetch(`${GATEWAY_URL}/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, provider: "gemini" }),
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as { vector?: number[] };
    if (!Array.isArray(data.vector)) return null;
    return { vector: data.vector, provider: "gemini", dim: data.vector.length };
  } catch (err) {
    console.warn(
      "[embeddings/gemini] eroare:",
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}

async function generateTransformers(text: string): Promise<EmbeddingResult> {
  const extractor = await getTransformersPipeline();
  // E5 modelele cer prefix "query: " sau "passage: " pentru rezultate optime.
  const prepared = `passage: ${text}`;
  const out = await extractor(prepared, { pooling: "mean", normalize: true });
  const vector = Array.from(out.data);
  return { vector, provider: "transformers", dim: vector.length };
}

async function generateCohere(text: string): Promise<EmbeddingResult | null> {
  if (!GATEWAY_URL) return null;
  try {
    const resp = await fetch(`${GATEWAY_URL}/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, provider: "cohere" }),
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as { vector?: number[] };
    if (!Array.isArray(data.vector)) return null;
    return { vector: data.vector, provider: "cohere", dim: data.vector.length };
  } catch (err) {
    console.warn(
      "[embeddings/cohere] eroare:",
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}

export async function generateEmbedding(
  text: string,
): Promise<EmbeddingResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { vector: [], provider: "transformers", dim: 0 };
  }

  // 1. Gemini (preferat când AI Gateway expune /embed)
  const gem = await generateGemini(trimmed);
  if (gem) return gem;

  // 2. transformers.js client (mereu disponibil, offline după primul download)
  try {
    return await generateTransformers(trimmed);
  } catch (err) {
    console.warn("[embeddings] transformers fallback failed:", err);
  }

  // 3. Cohere (server-side)
  const coh = await generateCohere(trimmed);
  if (coh) return coh;

  throw new Error("No embedding provider available");
}

// Cosine similarity — pentru RAG la Faza 3.
export function cosineSim(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += (a[i] ?? 0) * (b[i] ?? 0);
    normA += (a[i] ?? 0) ** 2;
    normB += (b[i] ?? 0) ** 2;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
