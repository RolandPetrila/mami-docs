// RAG (Retrieval-Augmented Generation) client-side.
// Indexează documente în localStorage (vectori) și caută semantic.
// Faza 3: când Supabase + pgvector sunt disponibile, mirrorAllToSupabase() mută indexul.

import { cosineSim, generateEmbedding } from "./embeddings";
import {
  clearDocIndex,
  getDocChunks,
  saveDocChunk,
  type DocIndexEntry,
} from "../data/local-store";

const CHUNK_SIZE = 400; // chars per chunk
const CHUNK_OVERLAP = 80; // chars overlap between chunks
const TOP_K = 5;

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end).trim());
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks.filter((c) => c.length > 20);
}

export async function indexDocument(
  docId: string,
  docName: string,
  plainText: string,
  onProgress?: (pct: number) => void,
): Promise<number> {
  clearDocIndex(docId);
  const chunks = chunkText(plainText);
  let indexed = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk) continue;
    try {
      const { vector } = await generateEmbedding(chunk);
      saveDocChunk(docId, docName, i, chunk, vector);
      indexed++;
    } catch {
      // skip failed chunk — embeddings best-effort
    }
    onProgress?.(Math.round(((i + 1) / chunks.length) * 100));
  }

  return indexed;
}

export interface RagResult {
  docId: string;
  docName: string;
  chunkText: string;
  score: number;
}

export async function semanticSearch(
  query: string,
  topK = TOP_K,
): Promise<RagResult[]> {
  if (!query.trim()) return [];

  let queryVec: number[];
  try {
    const { vector } = await generateEmbedding(query);
    queryVec = vector;
  } catch {
    return [];
  }

  if (queryVec.length === 0) return [];

  const allChunks: DocIndexEntry[] = getDocChunks();
  const scored = allChunks
    .map((entry) => ({
      docId: entry.docId,
      docName: entry.docName,
      chunkText: entry.chunkText,
      score: cosineSim(queryVec, entry.vector),
    }))
    .filter((r) => r.score > 0.2)
    .sort((a, b) => b.score - a.score);

  // Deduplicate: keep best chunk per doc
  const seen = new Set<string>();
  const results: RagResult[] = [];
  for (const r of scored) {
    if (results.length >= topK) break;
    if (!seen.has(r.docId)) {
      seen.add(r.docId);
      results.push(r);
    }
  }
  return results;
}

export function buildRagContext(results: RagResult[]): string {
  if (results.length === 0) return "";
  return results
    .map((r, i) => `[Sursa ${i + 1}: ${r.docName}]\n${r.chunkText}`)
    .join("\n\n---\n\n");
}

// Mitigation R2 (Risk Register PLAN v2.1):
// topK=3 + maxContextChars=1500 keeps token cost bounded — prevents quota exhaust
// during long chat sessions when many documents are indexed.
export async function getRagContextForQuery(
  query: string,
  topK = 3,
  maxContextChars = 1500,
): Promise<string> {
  const results = await semanticSearch(query, topK);
  const ctx = buildRagContext(results);
  return ctx.length > maxContextChars
    ? ctx.slice(0, maxContextChars) + "\n…[trunchiat]"
    : ctx;
}
