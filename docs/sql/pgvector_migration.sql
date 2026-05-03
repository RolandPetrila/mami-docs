-- ====================================================
-- Mami Docs — Supabase SQL Migrations
-- Rulează în Supabase SQL Editor (Settings → SQL Editor)
-- ====================================================

-- 1. pgvector extension
-- (necesară pentru embeddings semantice în RAG)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Tabel embeddings documente (RAG)
CREATE TABLE IF NOT EXISTS doc_embeddings (
  id          TEXT PRIMARY KEY,
  ts          TIMESTAMPTZ NOT NULL DEFAULT now(),
  doc_id      TEXT NOT NULL,         -- filename/path
  doc_name    TEXT NOT NULL,
  chunk_index INT  NOT NULL,
  chunk_text  TEXT NOT NULL,
  embedding   vector(384),           -- multilingual-e5-small dim
  UNIQUE (doc_id, chunk_index)
);
CREATE INDEX IF NOT EXISTS doc_embeddings_doc_id_idx ON doc_embeddings(doc_id);
CREATE INDEX IF NOT EXISTS doc_embeddings_embedding_idx ON doc_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

-- 3. Profil utilizator cu device_role
CREATE TABLE IF NOT EXISTS user_profiles (
  device_id    TEXT PRIMARY KEY,     -- fingerprint localStorage
  device_role  TEXT NOT NULL DEFAULT 'mom' CHECK (device_role IN ('mom', 'admin')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Funcție utilitate: dimensiune bază de date (pentru alerta 80%)
CREATE OR REPLACE FUNCTION get_db_size_bytes()
RETURNS bigint
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT pg_database_size(current_database());
$$;

-- 5. RLS — Row Level Security
-- Activează RLS pe tabele (restricționează accesul public implicit)
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

-- 6. Politici RLS — anon_key poate scrie/citi (local-first device)
-- Wellness tables: read+insert oricine (pentru device local)
CREATE POLICY "anon_read_write" ON hydration FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_write" ON vitals    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_write" ON emotion   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_write" ON sleep     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_write" ON photos_meta FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_write" ON bookmarks   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_write" ON highlights  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_write" ON doc_notes   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_write" ON daily_summaries FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_write" ON doc_embeddings  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_write" ON user_profiles   FOR ALL TO anon USING (true) WITH CHECK (true);

-- 7. Trigger: auto-update updated_at pe user_profiles
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ====================================================
-- NOTE: Dacă tabelele principale (hydration, vitals etc.)
-- nu există încă, rulează mai întâi schema inițială din
-- docs/CREDENTIALS_NEEDED.md §1 Supabase.
-- ====================================================
