// Local-first storage abstraction.
// Defaultul scrie în localStorage (mereu disponibil, fără credentiale).
// Dacă Supabase e configurat (chei prezente), automat se sincronizează în plus.
// Migrarea ulterioară din local → cloud se face cu `mirrorAllToSupabase()`.

import { getSupabaseClient } from "./supabase";

export interface HydrationEntry {
  id: string;
  ts: string; // ISO
  amount_ml: number;
}

export interface VitalsEntry {
  id: string;
  ts: string;
  systolic: number;
  diastolic: number;
  pulse: number | null;
}

export interface EmotionEntry {
  id: string;
  ts: string;
  level: 1 | 2 | 3 | 4 | 5;
  note: string;
}

export interface SleepEntry {
  id: string;
  start_ts: string;
  end_ts: string;
  hours: number;
}

export interface PhotoEntry {
  id: string;
  ts: string;
  caption: string;
  blob_size: number;
  deleted_at?: string; // soft-delete — blob-ul se șterge fizic după 30 zile
}

const KEY_HYDRATION = "mami:hydration";
const KEY_VITALS = "mami:vitals";
const KEY_EMOTION = "mami:emotion";
const KEY_SLEEP = "mami:sleep";
const KEY_PHOTOS = "mami:photos";

// Cap maxim 365 entries per categorie (~1 an la 1/zi). Peste, FIFO drop.
const MAX_ENTRIES = 365;

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readArr<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch (err) {
    console.warn(
      `[local-store] eroare parsare ${key}:`,
      err instanceof Error ? err.message : String(err),
    );
    return [];
  }
}

function writeArr<T>(key: string, arr: T[]): void {
  try {
    const trimmed = arr.length > MAX_ENTRIES ? arr.slice(-MAX_ENTRIES) : arr;
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch (err) {
    console.warn(`[local-store] write failed for ${key}:`, err);
  }
}

async function pushSupabase(table: string, row: unknown): Promise<void> {
  const client = await getSupabaseClient();
  if (!client) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await client.from(table).insert(row as any);
    if (error) console.warn(`[supabase] insert ${table}:`, error.message);
  } catch (err) {
    console.warn(`[supabase] unreachable ${table}:`, err);
  }
}

// ---- Hydration ----

export async function addHydration(amount_ml: number): Promise<HydrationEntry> {
  const entry: HydrationEntry = {
    id: uid(),
    ts: new Date().toISOString(),
    amount_ml,
  };
  const all = readArr<HydrationEntry>(KEY_HYDRATION);
  all.push(entry);
  writeArr(KEY_HYDRATION, all);
  await pushSupabase("hydration", entry);
  return entry;
}

export function listHydration(): HydrationEntry[] {
  return readArr<HydrationEntry>(KEY_HYDRATION);
}

export function getHydrationToday(): number {
  const today = new Date().toISOString().slice(0, 10);
  return listHydration()
    .filter((e) => e.ts.startsWith(today))
    .reduce((sum, e) => sum + e.amount_ml, 0);
}

// ---- Vitals ----

export async function addVitals(
  systolic: number,
  diastolic: number,
  pulse: number | null,
): Promise<VitalsEntry> {
  const entry: VitalsEntry = {
    id: uid(),
    ts: new Date().toISOString(),
    systolic,
    diastolic,
    pulse,
  };
  const all = readArr<VitalsEntry>(KEY_VITALS);
  all.push(entry);
  writeArr(KEY_VITALS, all);
  await pushSupabase("vitals", entry);
  return entry;
}

export function listVitals(limit = 30): VitalsEntry[] {
  return readArr<VitalsEntry>(KEY_VITALS).slice(-limit);
}

// ---- Emotion ----

export async function addEmotion(
  level: 1 | 2 | 3 | 4 | 5,
  note: string,
): Promise<EmotionEntry> {
  const entry: EmotionEntry = {
    id: uid(),
    ts: new Date().toISOString(),
    level,
    note,
  };
  const all = readArr<EmotionEntry>(KEY_EMOTION);
  all.push(entry);
  writeArr(KEY_EMOTION, all);
  await pushSupabase("emotion", entry);
  return entry;
}

export function listEmotion(limit = 30): EmotionEntry[] {
  return readArr<EmotionEntry>(KEY_EMOTION).slice(-limit);
}

// ---- Sleep ----

export async function addSleep(
  start_ts: string,
  end_ts: string,
): Promise<SleepEntry> {
  const hours = (Date.parse(end_ts) - Date.parse(start_ts)) / (1000 * 60 * 60);
  const entry: SleepEntry = {
    id: uid(),
    start_ts,
    end_ts,
    hours: Math.max(0, Math.round(hours * 10) / 10),
  };
  const all = readArr<SleepEntry>(KEY_SLEEP);
  all.push(entry);
  writeArr(KEY_SLEEP, all);
  await pushSupabase("sleep", entry);
  return entry;
}

export function listSleep(limit = 30): SleepEntry[] {
  return readArr<SleepEntry>(KEY_SLEEP).slice(-limit);
}

// ---- Photos (metadata only — blob-urile sunt în IndexedDB) ----

export async function addPhotoMeta(
  id: string,
  caption: string,
  blob_size: number,
): Promise<PhotoEntry> {
  const entry: PhotoEntry = {
    id,
    ts: new Date().toISOString(),
    caption,
    blob_size,
  };
  const all = readArr<PhotoEntry>(KEY_PHOTOS);
  all.push(entry);
  writeArr(KEY_PHOTOS, all);
  await pushSupabase("photos_meta", entry);
  return entry;
}

export function listPhotos(): PhotoEntry[] {
  return readArr<PhotoEntry>(KEY_PHOTOS).filter((p) => !p.deleted_at);
}

export function listDeletedPhotos(): PhotoEntry[] {
  return readArr<PhotoEntry>(KEY_PHOTOS).filter((p) => !!p.deleted_at);
}

export function softDeletePhotoMeta(id: string): void {
  const all = readArr<PhotoEntry>(KEY_PHOTOS).map((p) =>
    p.id === id ? { ...p, deleted_at: new Date().toISOString() } : p,
  );
  writeArr(KEY_PHOTOS, all);
}

// Returnează ID-urile foto șterse mai vechi de N zile (blob-ul trebuie șters separat)
export function purgeDeletedPhotosMeta(olderThanDays: number): string[] {
  const cutoff = new Date(
    Date.now() - olderThanDays * 24 * 60 * 60 * 1000,
  ).toISOString();
  const all = readArr<PhotoEntry>(KEY_PHOTOS);
  const toDelete = all.filter((p) => p.deleted_at && p.deleted_at < cutoff);
  const remaining = all.filter((p) => !p.deleted_at || p.deleted_at >= cutoff);
  writeArr(KEY_PHOTOS, remaining);
  return toDelete.map((p) => p.id);
}

export function deletePhotoMeta(id: string): void {
  writeArr(
    KEY_PHOTOS,
    readArr<PhotoEntry>(KEY_PHOTOS).filter((p) => p.id !== id),
  );
}

// ---- Bookmarks ----

export interface BookmarkEntry {
  id: string;
  ts: string;
  docId: string; // filename or tab:filename
  docName: string;
  scrollPct: number; // 0-1
  note: string;
}

const KEY_BOOKMARKS = "mami:bookmarks";

export async function addBookmark(
  docId: string,
  docName: string,
  scrollPct: number,
  note = "",
): Promise<BookmarkEntry> {
  const entry: BookmarkEntry = {
    id: uid(),
    ts: new Date().toISOString(),
    docId,
    docName,
    scrollPct,
    note,
  };
  const all = readArr<BookmarkEntry>(KEY_BOOKMARKS);
  const deduped = all.filter((b) => b.docId !== docId); // one bookmark per doc
  deduped.push(entry);
  writeArr(KEY_BOOKMARKS, deduped);
  await pushSupabase("bookmarks", entry);
  return entry;
}

export function listBookmarks(): BookmarkEntry[] {
  return readArr<BookmarkEntry>(KEY_BOOKMARKS);
}

export function removeBookmark(docId: string): void {
  writeArr(
    KEY_BOOKMARKS,
    readArr<BookmarkEntry>(KEY_BOOKMARKS).filter((b) => b.docId !== docId),
  );
}

// ---- Highlights ----

export interface HighlightEntry {
  id: string;
  ts: string;
  docId: string;
  docName: string;
  text: string;
  color: string; // hex
  note: string;
}

const KEY_HIGHLIGHTS = "mami:highlights";

export async function addHighlight(
  docId: string,
  docName: string,
  text: string,
  color = "#ffe066",
  note = "",
): Promise<HighlightEntry> {
  const entry: HighlightEntry = {
    id: uid(),
    ts: new Date().toISOString(),
    docId,
    docName,
    text,
    color,
    note,
  };
  const all = readArr<HighlightEntry>(KEY_HIGHLIGHTS);
  all.push(entry);
  writeArr(KEY_HIGHLIGHTS, all);
  await pushSupabase("highlights", entry);
  return entry;
}

export function listHighlights(docId?: string): HighlightEntry[] {
  const all = readArr<HighlightEntry>(KEY_HIGHLIGHTS);
  return docId ? all.filter((h) => h.docId === docId) : all;
}

export function removeHighlight(id: string): void {
  writeArr(
    KEY_HIGHLIGHTS,
    readArr<HighlightEntry>(KEY_HIGHLIGHTS).filter((h) => h.id !== id),
  );
}

// ---- Doc Notes ----

export interface DocNote {
  id: string;
  ts: string;
  docId: string;
  docName: string;
  text: string;
}

const KEY_DOC_NOTES = "mami:doc-notes";

export async function addDocNote(
  docId: string,
  docName: string,
  text: string,
): Promise<DocNote> {
  const entry: DocNote = {
    id: uid(),
    ts: new Date().toISOString(),
    docId,
    docName,
    text,
  };
  const all = readArr<DocNote>(KEY_DOC_NOTES);
  all.push(entry);
  writeArr(KEY_DOC_NOTES, all);
  await pushSupabase("doc_notes", entry);
  return entry;
}

export function listDocNotes(docId?: string): DocNote[] {
  const all = readArr<DocNote>(KEY_DOC_NOTES);
  return docId ? all.filter((n) => n.docId === docId) : all;
}

export function removeDocNote(id: string): void {
  writeArr(
    KEY_DOC_NOTES,
    readArr<DocNote>(KEY_DOC_NOTES).filter((n) => n.id !== id),
  );
}

// ---- Weekly Menu ----

export interface MenuEntry {
  id: string;
  ts: string;
  weekStart: string; // ISO date YYYY-MM-DD
  menu: Record<
    string,
    { breakfast: string; lunch: string; dinner: string; snack?: string }
  >;
  generatedBy: "ai" | "manual";
}

const KEY_MENUS = "mami:menus";

export function saveMenu(
  weekStart: string,
  menu: MenuEntry["menu"],
  generatedBy: "ai" | "manual" = "ai",
): MenuEntry {
  const entry: MenuEntry = {
    id: uid(),
    ts: new Date().toISOString(),
    weekStart,
    menu,
    generatedBy,
  };
  const all = readArr<MenuEntry>(KEY_MENUS);
  const deduped = all.filter((m) => m.weekStart !== weekStart);
  deduped.push(entry);
  writeArr(KEY_MENUS, deduped.slice(-8)); // keep last 8 weeks
  return entry;
}

export function getMenu(weekStart: string): MenuEntry | undefined {
  return readArr<MenuEntry>(KEY_MENUS).find((m) => m.weekStart === weekStart);
}

export function listMenus(): MenuEntry[] {
  return readArr<MenuEntry>(KEY_MENUS);
}

// ---- RAG Document Index ----

export interface DocIndexEntry {
  id: string;
  ts: string;
  docId: string;
  docName: string;
  chunkIndex: number;
  chunkText: string;
  vector: number[];
}

const KEY_DOC_INDEX = "mami:doc-index";

export function saveDocChunk(
  docId: string,
  docName: string,
  chunkIndex: number,
  chunkText: string,
  vector: number[],
): DocIndexEntry {
  const entry: DocIndexEntry = {
    id: uid(),
    ts: new Date().toISOString(),
    docId,
    docName,
    chunkIndex,
    chunkText,
    vector,
  };
  const all = readArr<DocIndexEntry>(KEY_DOC_INDEX);
  const filtered = all.filter(
    (e) => !(e.docId === docId && e.chunkIndex === chunkIndex),
  );
  filtered.push(entry);
  // Cap: 2000 chunks (~20 large docs)
  writeArr(
    KEY_DOC_INDEX,
    filtered.length > 2000 ? filtered.slice(-2000) : filtered,
  );
  return entry;
}

export function getDocChunks(docId?: string): DocIndexEntry[] {
  const all = readArr<DocIndexEntry>(KEY_DOC_INDEX);
  return docId ? all.filter((e) => e.docId === docId) : all;
}

export function clearDocIndex(docId: string): void {
  writeArr(
    KEY_DOC_INDEX,
    readArr<DocIndexEntry>(KEY_DOC_INDEX).filter((e) => e.docId !== docId),
  );
}

// ---- Migration helper (rulat o dată după ce admin conectează Supabase) ----

export async function mirrorAllToSupabase(): Promise<{
  inserted: number;
  failed: number;
}> {
  const supabase = await getSupabaseClient();
  if (!supabase) return { inserted: 0, failed: 0 };
  let inserted = 0;
  let failed = 0;
  const batches: Array<[string, unknown[]]> = [
    ["hydration", listHydration()],
    ["vitals", listVitals(MAX_ENTRIES)],
    ["emotion", listEmotion(MAX_ENTRIES)],
    ["sleep", listSleep(MAX_ENTRIES)],
    ["photos_meta", listPhotos()],
  ];
  for (const [table, rows] of batches) {
    if (rows.length === 0) continue;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from(table).insert(rows as any);
      if (error) {
        console.warn(`[mirror] ${table}:`, error.message);
        failed += rows.length;
      } else {
        inserted += rows.length;
      }
    } catch (err) {
      console.warn(`[mirror] ${table} unreachable:`, err);
      failed += rows.length;
    }
  }
  return { inserted, failed };
}
