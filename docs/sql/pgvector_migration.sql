-- ====================================================
-- Mami Docs — Supabase SQL Migrations (cu RLS strict device_id)
-- Rulează în Supabase SQL Editor (Settings → SQL Editor)
--
-- T6.1 (audit CRITICA-7): policy strict bazat pe device_id propagat ca header HTTP
--   X-Device-Id (citit din `current_setting('request.headers')`).
-- Pre-condiție client: supabase-js inițializat cu global headers `X-Device-Id: <id>`
--   (vezi src/data/supabase.ts — `globalHeaders`).
-- ====================================================

-- 1. pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Tabel embeddings documente (RAG)
CREATE TABLE IF NOT EXISTS doc_embeddings (
  id          TEXT PRIMARY KEY,
  ts          TIMESTAMPTZ NOT NULL DEFAULT now(),
  doc_id      TEXT NOT NULL,
  doc_name    TEXT NOT NULL,
  chunk_index INT  NOT NULL,
  chunk_text  TEXT NOT NULL,
  embedding   vector(384),
  device_id   TEXT,
  UNIQUE (doc_id, chunk_index)
);
CREATE INDEX IF NOT EXISTS doc_embeddings_doc_id_idx ON doc_embeddings(doc_id);
CREATE INDEX IF NOT EXISTS doc_embeddings_embedding_idx ON doc_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
CREATE INDEX IF NOT EXISTS doc_embeddings_device_id_idx ON doc_embeddings(device_id);

-- 3. Profil utilizator cu device_role
CREATE TABLE IF NOT EXISTS user_profiles (
  device_id    TEXT PRIMARY KEY,
  device_role  TEXT NOT NULL DEFAULT 'mom' CHECK (device_role IN ('mom', 'admin')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Adaugă device_id pe tabelele wellness/photos/etc. dacă nu există.
-- Migrare safe: ADD COLUMN IF NOT EXISTS, apoi backfill cu un default placeholder dacă tabelul e gol;
-- altfel, datele existente vor avea device_id=NULL și NU vor mai fi vizibile sub policy strictă —
-- admin trebuie să facă UPDATE manual cu device_id-ul mamei pentru date pre-existente.
ALTER TABLE hydration       ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE vitals          ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE emotion         ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE sleep           ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE photos_meta     ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE bookmarks       ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE highlights      ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE doc_notes       ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE daily_summaries ADD COLUMN IF NOT EXISTS device_id TEXT;

CREATE INDEX IF NOT EXISTS hydration_device_id_idx       ON hydration(device_id);
CREATE INDEX IF NOT EXISTS vitals_device_id_idx          ON vitals(device_id);
CREATE INDEX IF NOT EXISTS emotion_device_id_idx         ON emotion(device_id);
CREATE INDEX IF NOT EXISTS sleep_device_id_idx           ON sleep(device_id);
CREATE INDEX IF NOT EXISTS photos_meta_device_id_idx     ON photos_meta(device_id);
CREATE INDEX IF NOT EXISTS bookmarks_device_id_idx       ON bookmarks(device_id);
CREATE INDEX IF NOT EXISTS highlights_device_id_idx      ON highlights(device_id);
CREATE INDEX IF NOT EXISTS doc_notes_device_id_idx       ON doc_notes(device_id);
CREATE INDEX IF NOT EXISTS daily_summaries_device_id_idx ON daily_summaries(device_id);

-- 5. Funcție utilitate: dimensiune bază de date (pentru alerta 80%)
CREATE OR REPLACE FUNCTION get_db_size_bytes()
RETURNS bigint
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT pg_database_size(current_database());
$$;

-- 6. RLS — Row Level Security cu device_id strict
ALTER TABLE hydration       ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotion         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep           ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos_meta     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights      ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_notes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_embeddings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles   ENABLE ROW LEVEL SECURITY;

-- 7. Helper: device_id curent din header HTTP X-Device-Id
-- PostgREST expune `request.headers` ca JSON GUC; folosim o funcție STABLE pentru ca
-- planificatorul să cache-uiască valoarea în cadrul tranzacției.
CREATE OR REPLACE FUNCTION current_device_id()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(
    current_setting('request.headers', true)::json->>'x-device-id',
    ''
  );
$$;

-- 8. Drop policiile vechi permisive (dacă există)
DROP POLICY IF EXISTS "anon_read_write" ON hydration;
DROP POLICY IF EXISTS "anon_read_write" ON vitals;
DROP POLICY IF EXISTS "anon_read_write" ON emotion;
DROP POLICY IF EXISTS "anon_read_write" ON sleep;
DROP POLICY IF EXISTS "anon_read_write" ON photos_meta;
DROP POLICY IF EXISTS "anon_read_write" ON bookmarks;
DROP POLICY IF EXISTS "anon_read_write" ON highlights;
DROP POLICY IF EXISTS "anon_read_write" ON doc_notes;
DROP POLICY IF EXISTS "anon_read_write" ON daily_summaries;
DROP POLICY IF EXISTS "anon_read_write" ON doc_embeddings;
DROP POLICY IF EXISTS "anon_read_write" ON user_profiles;

-- 9. Policii strict device_id — aplicate fiecărui tabel cu date wellness/private.
-- Refuză orice request fără header X-Device-Id (current_device_id() = NULL → falsy).
DO $$
DECLARE
  t text;
  tbls text[] := ARRAY[
    'hydration','vitals','emotion','sleep','photos_meta',
    'bookmarks','highlights','doc_notes','daily_summaries','doc_embeddings'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    EXECUTE format('CREATE POLICY %I ON %I FOR SELECT TO anon USING (device_id = current_device_id())',
                   'device_select_' || t, t);
    EXECUTE format('CREATE POLICY %I ON %I FOR INSERT TO anon WITH CHECK (device_id = current_device_id())',
                   'device_insert_' || t, t);
    EXECUTE format('CREATE POLICY %I ON %I FOR UPDATE TO anon USING (device_id = current_device_id()) WITH CHECK (device_id = current_device_id())',
                   'device_update_' || t, t);
    EXECUTE format('CREATE POLICY %I ON %I FOR DELETE TO anon USING (device_id = current_device_id())',
                   'device_delete_' || t, t);
  END LOOP;
END $$;

-- user_profiles: anon poate citi propriul profil (device_id = ăl propriu) și upsert pe acesta.
CREATE POLICY "device_select_user_profiles" ON user_profiles
  FOR SELECT TO anon USING (device_id = current_device_id());
CREATE POLICY "device_insert_user_profiles" ON user_profiles
  FOR INSERT TO anon WITH CHECK (device_id = current_device_id());
CREATE POLICY "device_update_user_profiles" ON user_profiles
  FOR UPDATE TO anon USING (device_id = current_device_id()) WITH CHECK (device_id = current_device_id());

-- 10. Trigger: auto-update updated_at pe user_profiles
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS user_profiles_updated_at ON user_profiles;
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ====================================================
-- BACKFILL DEVICE_ID PENTRU DATE PRE-EXISTENTE (manual, după aplicare):
--   1. Identifică device_id-ul mamei: SELECT device_id FROM user_profiles WHERE device_role='mom';
--   2. UPDATE hydration SET device_id = '<id>' WHERE device_id IS NULL; (idem pt restul tabelelor)
-- DUPĂ backfill, datele rămân vizibile DOAR cu header X-Device-Id corect setat.
--
-- TEST staging înainte de prod (mitigation R3):
--   - Creează un proiect Supabase staging.
--   - Rulează acest SQL acolo.
--   - Test din client cu device_id mock → date OK; fără header → 0 rezultate (RLS blocked).
--   - Test din curl direct cu anon key fără X-Device-Id → 0 rows.
-- ====================================================
