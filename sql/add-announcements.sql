-- ─────────────────────────────────────────────────────────────
-- add-announcements.sql
-- Run once in the Supabase SQL editor to enable the Announcements feature.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS announcements (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  body        text        NOT NULL,
  pinned      boolean     NOT NULL DEFAULT false,
  target_role text        NOT NULL DEFAULT 'all'
                          CHECK (target_role IN ('all', 'student', 'tutor')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS announcements_created_idx ON announcements (created_at DESC);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read announcements
CREATE POLICY "announcements_read_authenticated"
  ON announcements FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only leadership/master can insert, update, delete
CREATE POLICY "announcements_leadership_all"
  ON announcements FOR ALL
  USING (public.get_my_role() IN ('leadership', 'master'))
  WITH CHECK (public.get_my_role() IN ('leadership', 'master'));
