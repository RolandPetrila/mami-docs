// Local-first storage abstraction.
// Defaultul scrie în localStorage (mereu disponibil, fără credentiale).
// Dacă Supabase e configurat (chei prezente), automat se sincronizează în plus.
// Migrarea ulterioară din local → cloud se face cu `mirrorAllToSupabase()`.

import { supabase } from "./supabase";

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
  // blob-ul e salvat separat în IndexedDB (vezi photo-blob-store.ts)
  // aici păstrăm doar metadata, ușor de serializat în localStorage
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
  } catch {
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
  if (!supabase) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from(table).insert(row as any);
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
  return readArr<PhotoEntry>(KEY_PHOTOS);
}

export function deletePhotoMeta(id: string): void {
  const all = readArr<PhotoEntry>(KEY_PHOTOS).filter((p) => p.id !== id);
  writeArr(KEY_PHOTOS, all);
}

// ---- Migration helper (rulat o dată după ce admin conectează Supabase) ----

export async function mirrorAllToSupabase(): Promise<{
  inserted: number;
  failed: number;
}> {
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
