const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

const DEVICE_ID_KEY = "mami:device-id";

// T6.1 — fingerprint stabil per browser (localStorage).
// Folosit ca header X-Device-Id la fiecare request Supabase pentru RLS strict.
function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id =
      crypto.randomUUID?.() ??
      `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function deviceId(): string {
  return getDeviceId();
}

let _client: any | null = null;
let _initialized = false;

export async function getSupabaseClient(): Promise<any | null> {
  if (_initialized) return _client;
  _initialized = true;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn(
      "[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY lipsesc.",
    );
    return null;
  }
  const { createClient } = await import("@supabase/supabase-js");
  _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        "X-Device-Id": getDeviceId(),
      },
    },
  });
  return _client;
}

// Backward-compat sync export — null until getSupabaseClient() is called
export const supabase = null;
