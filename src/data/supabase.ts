const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

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
  _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _client;
}

// Backward-compat sync export — null until getSupabaseClient() is called
export const supabase = null;
