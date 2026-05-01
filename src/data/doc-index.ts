export type DocType = "docx" | "pdf" | "md" | "xlsx" | "image" | "audio";

export interface DocEntry {
  id: string;
  name: string;
  type: DocType;
  preview: string;
  added: string;
}

const STORAGE_KEY = "mami-doc-index";
const MAX_PREVIEW_WORDS = 200;

function load(): DocEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DocEntry[];
  } catch {
    return [];
  }
}

function persist(entries: DocEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function indexDoc(name: string, type: DocType, text: string): void {
  const entries = load();
  const preview = text
    .trim()
    .split(/\s+/)
    .slice(0, MAX_PREVIEW_WORDS)
    .join(" ");
  const entry: DocEntry = {
    id: genId(),
    name,
    type,
    preview,
    added: new Date().toISOString(),
  };
  const existingIdx = entries.findIndex(
    (e) => e.name === name && e.type === type,
  );
  if (existingIdx >= 0) {
    entries[existingIdx] = entry;
  } else {
    entries.unshift(entry);
  }
  persist(entries);
}

export function searchDocs(query: string): DocEntry[] {
  const all = load();
  const q = query.trim().toLowerCase();
  if (!q) return all;
  return all.filter(
    (e) =>
      e.name.toLowerCase().includes(q) || e.preview.toLowerCase().includes(q),
  );
}

export function removeDoc(id: string): void {
  persist(load().filter((e) => e.id !== id));
}

export function clearIndex(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getAllDocs(): DocEntry[] {
  return load();
}
