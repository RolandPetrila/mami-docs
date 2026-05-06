-- ====================================================
-- Mami Docs — Family Sharing + RLS
-- Rulează în Supabase SQL Editor după pgvector_migration.sql
-- Versiune: 2026-05-05
-- ====================================================

-- 1. family_groups — un grup per familie (admin generează cod)
CREATE TABLE IF NOT EXISTS family_groups (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code  TEXT UNIQUE NOT NULL,           -- 8-char alfanumeric (ex. AB12CD34)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by   TEXT NOT NULL,                   -- device_id al admin-ului
  expires_at   TIMESTAMPTZ                      -- cod invitație valid 7 zile
);

CREATE INDEX IF NOT EXISTS family_groups_invite_code_idx ON family_groups(invite_code);

-- 2. family_members — toți utilizatorii dintr-un grup
CREATE TABLE IF NOT EXISTS family_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  device_id    TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  display_name TEXT,                           -- ex. "Mama", "Roland"
  UNIQUE (group_id, device_id)
);

CREATE INDEX IF NOT EXISTS family_members_device_id_idx ON family_members(device_id);
CREATE INDEX IF NOT EXISTS family_members_group_id_idx ON family_members(group_id);

-- 3. Adaugă coloana group_id pe tabelele wellness (opțional pentru sharing per grup)
-- Default NULL = data privată (nu e shareată)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='hydration' AND column_name='group_id') THEN
    ALTER TABLE hydration   ADD COLUMN group_id UUID REFERENCES family_groups(id) ON DELETE SET NULL;
    ALTER TABLE vitals      ADD COLUMN group_id UUID REFERENCES family_groups(id) ON DELETE SET NULL;
    ALTER TABLE emotion     ADD COLUMN group_id UUID REFERENCES family_groups(id) ON DELETE SET NULL;
    ALTER TABLE sleep       ADD COLUMN group_id UUID REFERENCES family_groups(id) ON DELETE SET NULL;
    ALTER TABLE photos_meta ADD COLUMN group_id UUID REFERENCES family_groups(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS hydration_group_id_idx   ON hydration(group_id);
CREATE INDEX IF NOT EXISTS vitals_group_id_idx      ON vitals(group_id);
CREATE INDEX IF NOT EXISTS emotion_group_id_idx     ON emotion(group_id);
CREATE INDEX IF NOT EXISTS sleep_group_id_idx       ON sleep(group_id);
CREATE INDEX IF NOT EXISTS photos_meta_group_id_idx ON photos_meta(group_id);

-- 4. RPC: get_my_groups — toate grupurile în care e device-ul curent
-- Apel din client: supabase.rpc('get_my_groups', { p_device_id: localDeviceId })
CREATE OR REPLACE FUNCTION get_my_groups(p_device_id TEXT)
RETURNS TABLE(group_id UUID, invite_code TEXT, role TEXT, joined_at TIMESTAMPTZ, member_count BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT
    fg.id           AS group_id,
    fg.invite_code,
    fm.role,
    fm.joined_at,
    (SELECT COUNT(*) FROM family_members fm2 WHERE fm2.group_id = fg.id) AS member_count
  FROM family_members fm
  JOIN family_groups  fg ON fg.id = fm.group_id
  WHERE fm.device_id = p_device_id;
$$;

-- 5. RPC: create_family_group — admin generează cod nou
-- Returnează invite_code generat. Cod valabil 7 zile.
CREATE OR REPLACE FUNCTION create_family_group(p_device_id TEXT, p_display_name TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_code      TEXT;
  v_group_id  UUID;
  v_attempts  INT := 0;
BEGIN
  -- Generare cod unic 8 caractere
  LOOP
    v_code := upper(substring(md5(random()::text || clock_timestamp()::text) FROM 1 FOR 8));
    BEGIN
      INSERT INTO family_groups (invite_code, created_by, expires_at)
      VALUES (v_code, p_device_id, now() + interval '7 days')
      RETURNING id INTO v_group_id;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      v_attempts := v_attempts + 1;
      IF v_attempts > 10 THEN
        RAISE EXCEPTION 'Nu am putut genera un cod unic după 10 încercări';
      END IF;
    END;
  END LOOP;

  -- Adaugă creator-ul ca admin în grup
  INSERT INTO family_members (group_id, device_id, role, display_name)
  VALUES (v_group_id, p_device_id, 'admin', COALESCE(p_display_name, 'Admin'));

  RETURN v_code;
END;
$$;

-- 6. RPC: join_family_group — member se conectează cu cod
-- Returnează group_id la succes, NULL dacă cod invalid/expirat.
CREATE OR REPLACE FUNCTION join_family_group(
  p_invite_code  TEXT,
  p_device_id    TEXT,
  p_display_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_group_id UUID;
  v_expired  BOOLEAN;
BEGIN
  SELECT id, (expires_at IS NOT NULL AND expires_at < now())
  INTO v_group_id, v_expired
  FROM family_groups
  WHERE invite_code = upper(p_invite_code);

  IF v_group_id IS NULL THEN
    RETURN NULL; -- cod invalid
  END IF;

  IF v_expired THEN
    RETURN NULL; -- cod expirat
  END IF;

  INSERT INTO family_members (group_id, device_id, role, display_name)
  VALUES (v_group_id, p_device_id, 'member', COALESCE(p_display_name, 'Membru'))
  ON CONFLICT (group_id, device_id) DO UPDATE
    SET display_name = COALESCE(p_display_name, family_members.display_name);

  RETURN v_group_id;
END;
$$;

-- 7. RPC: leave_family_group — un device părăsește grupul
CREATE OR REPLACE FUNCTION leave_family_group(p_group_id UUID, p_device_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM family_members
  WHERE group_id = p_group_id AND device_id = p_device_id;

  -- Dacă grupul rămâne fără membri, șterge-l
  IF NOT EXISTS (SELECT 1 FROM family_members WHERE group_id = p_group_id) THEN
    DELETE FROM family_groups WHERE id = p_group_id;
  END IF;

  RETURN TRUE;
END;
$$;

-- 8. RLS pe tabele family_*
ALTER TABLE family_groups  ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- anon poate citi/insera (local-first; sharing-ul se face prin RPC-uri SECURITY DEFINER)
DROP POLICY IF EXISTS "anon_read_write" ON family_groups;
DROP POLICY IF EXISTS "anon_read_write" ON family_members;
CREATE POLICY "anon_read_write" ON family_groups  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_write" ON family_members FOR ALL TO anon USING (true) WITH CHECK (true);

-- 9. Coloana archived_at pe photos_meta (pentru archive R2 60 zile)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='photos_meta' AND column_name='archived_at') THEN
    ALTER TABLE photos_meta ADD COLUMN archived_at TIMESTAMPTZ;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS photos_meta_archived_at_idx ON photos_meta(archived_at);

-- 10. Cleanup automat: invitații expirate (rulează la backup zilnic).
-- T6.7 fix (audit MED-11): șterge imediat ce expires_at a trecut, nu după 30 zile suplimentare.
-- Membrii deja conectați NU sunt afectați (gardați de NOT EXISTS).
CREATE OR REPLACE FUNCTION cleanup_expired_invites()
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM family_groups
  WHERE expires_at IS NOT NULL
    AND expires_at < now()
    AND NOT EXISTS (SELECT 1 FROM family_members WHERE family_members.group_id = family_groups.id);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- ====================================================
-- TESTARE manuală (în Supabase SQL Editor):
--
-- SELECT create_family_group('d_test_admin', 'Roland');
-- → returnează invite_code (ex: 'AB12CD34')
--
-- SELECT join_family_group('AB12CD34', 'd_test_member', 'Mama');
-- → returnează group_id (UUID)
--
-- SELECT * FROM get_my_groups('d_test_admin');
-- → un row cu role='admin', member_count=2
-- ====================================================
