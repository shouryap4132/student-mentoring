-- =============================================================
-- supabase-setup.sql
-- Complete schema + RLS + trigger setup for the mentoring app.
-- Run this once in the Supabase SQL editor (replaces all prior SQL files).
-- =============================================================

-- ─── 1. DROP EXISTING TABLES ────────────────────────────────
DROP TABLE IF EXISTS messages        CASCADE;
DROP TABLE IF EXISTS conversations   CASCADE;
DROP TABLE IF EXISTS email_queue     CASCADE;
DROP TABLE IF EXISTS notifications   CASCADE;
DROP TABLE IF EXISTS requests        CASCADE;
DROP TABLE IF EXISTS hours_logs      CASCADE;
DROP TABLE IF EXISTS profiles        CASCADE;
DROP TABLE IF EXISTS auth_trigger_errors CASCADE;

-- ─── 2. PROFILES ─────────────────────────────────────────────
-- role has a DEFAULT so the auth trigger can omit it safely.
CREATE TABLE profiles (
  id               uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email            text        UNIQUE NOT NULL,
  full_name        text        NOT NULL,
  role             text        NOT NULL DEFAULT 'student'
                               CHECK (role IN ('student','tutor','leadership','master')),
  roles            text[]      NOT NULL DEFAULT '{}',
  grade_level      text,
  subjects         text[]      NOT NULL DEFAULT '{}',
  bio              text        DEFAULT '',
  avatar_url       text,
  qualifications   text        DEFAULT '',
  availability     text        DEFAULT '',
  knowledge_level  text        DEFAULT '',
  profile_complete boolean     NOT NULL DEFAULT false,
  goal_hours       integer     NOT NULL DEFAULT 30,
  avg_rating       numeric(3,2) NOT NULL DEFAULT 5.00,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ─── 3. REQUESTS ─────────────────────────────────────────────
CREATE TABLE requests (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tutor_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject     text        NOT NULL,
  status      text        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','accepted','scheduled','completed','declined')),
  meeting_date timestamptz,
  notes       text,
  accepted_by uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  accepted_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── 4. HOURS_LOGS ───────────────────────────────────────────
CREATE TABLE hours_logs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id   uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_date timestamptz NOT NULL,
  hours        numeric(5,2) NOT NULL,
  subject      text        NOT NULL,
  notes        text,
  approved     boolean     NOT NULL DEFAULT false,
  approved_by  uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── 5. CONVERSATIONS ────────────────────────────────────────
CREATE TABLE conversations (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant2_id uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message    text,
  last_message_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX conversations_pair_idx
  ON conversations (
    LEAST(participant1_id, participant2_id),
    GREATEST(participant1_id, participant2_id)
  );

-- ─── 6. MESSAGES ─────────────────────────────────────────────
CREATE TABLE messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content         text        NOT NULL,
  read            boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── 7. NOTIFICATIONS ────────────────────────────────────────
CREATE TABLE notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title      text        NOT NULL,
  body       text        NOT NULL,
  link       text,
  read       boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── 8. EMAIL QUEUE ──────────────────────────────────────────
CREATE TABLE email_queue (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id  uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_email    text        NOT NULL,
  subject            text        NOT NULL,
  body               text        NOT NULL,
  status             text        NOT NULL DEFAULT 'pending',
  metadata           jsonb,
  sent_at            timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- ─── 9. TRIGGER ERROR LOG ────────────────────────────────────
CREATE TABLE auth_trigger_errors (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  error_message text,
  error_detail  text,
  payload       jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── 10. INDEXES ─────────────────────────────────────────────
CREATE INDEX requests_student_idx     ON requests       (student_id);
CREATE INDEX requests_tutor_idx       ON requests       (tutor_id);
CREATE INDEX hours_logs_student_idx   ON hours_logs     (student_id);
CREATE INDEX hours_logs_tutor_idx     ON hours_logs     (tutor_id);
CREATE INDEX messages_conv_idx        ON messages       (conversation_id);
CREATE INDEX notifications_user_idx   ON notifications  (user_id);
CREATE INDEX email_queue_user_idx     ON email_queue    (recipient_user_id);

-- ─── 11. AUTH TRIGGER ────────────────────────────────────────
-- Auto-creates a full profile row from metadata when a new user signs up.
-- SignUp.tsx passes all fields via options.data — no separate frontend upsert needed.
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger AS $$
DECLARE
  meta jsonb;
  v_role text;
  v_subjects text[];
BEGIN
  meta := COALESCE(NEW.raw_user_meta_data::jsonb, '{}'::jsonb);
  v_role := COALESCE(NULLIF(meta->>'role', ''), 'student');

  -- Normalise subjects: accept a JSON array or a single string value
  IF meta->'subjects' IS NOT NULL AND jsonb_typeof(meta->'subjects') = 'array' THEN
    SELECT array_agg(x) INTO v_subjects FROM jsonb_array_elements_text(meta->'subjects') AS x;
  ELSIF meta->>'subjects' IS NOT NULL AND meta->>'subjects' <> '' THEN
    v_subjects := ARRAY[meta->>'subjects'];
  ELSE
    v_subjects := '{}';
  END IF;

  BEGIN
    INSERT INTO public.profiles (
      id, email, full_name, role, roles,
      grade_level, subjects, bio, qualifications,
      created_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NULLIF(meta->>'full_name', ''), NEW.email),
      v_role,
      ARRAY[v_role],
      NULLIF(meta->>'grade_level', ''),
      v_subjects,
      COALESCE(NULLIF(meta->>'bio', ''), ''),
      COALESCE(NULLIF(meta->>'qualifications', ''), ''),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name      = EXCLUDED.full_name,
      role           = EXCLUDED.role,
      roles          = EXCLUDED.roles,
      grade_level    = EXCLUDED.grade_level,
      subjects       = EXCLUDED.subjects,
      bio            = EXCLUDED.bio,
      qualifications = EXCLUDED.qualifications;
  EXCEPTION
    WHEN others THEN
      BEGIN
        INSERT INTO public.auth_trigger_errors (error_message, error_detail, payload, created_at)
        VALUES (SQLERRM, SQLSTATE, row_to_json(NEW), now());
      EXCEPTION WHEN others THEN NULL;
      END;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auth_user_created ON auth.users;
CREATE TRIGGER trigger_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_created();

-- ─── 12. ENABLE ROW LEVEL SECURITY ───────────────────────────
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE hours_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue   ENABLE ROW LEVEL SECURITY;

-- ─── 13. HELPER FUNCTION (avoids recursive RLS) ─────────────
-- SECURITY DEFINER bypasses RLS when reading the caller's own role,
-- preventing infinite recursion in policies that need to check roles.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ─── 14. RLS POLICIES: PROFILES ──────────────────────────────

-- Own profile: full CRUD
CREATE POLICY "profiles_own_crud"
  ON profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Any authenticated user can read tutor profiles (needed for FindTutor)
CREATE POLICY "profiles_read_tutors"
  ON profiles FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND role = 'tutor'
  );

-- Master can read ALL profiles (user management table)
CREATE POLICY "profiles_master_select_all"
  ON profiles FOR SELECT
  USING (auth.jwt()->>'email' = 'adroit.shourya@gmail.com');

-- Master can update ALL profiles (role changes)
CREATE POLICY "profiles_master_update_all"
  ON profiles FOR UPDATE
  USING (auth.jwt()->>'email' = 'adroit.shourya@gmail.com');

-- Leadership can read all profiles (for grant-leadership search)
-- Uses get_my_role() to avoid recursive policy evaluation on profiles table
CREATE POLICY "profiles_leadership_select_all"
  ON profiles FOR SELECT
  USING (public.get_my_role() IN ('leadership', 'master'));

-- ─── 15. RLS POLICIES: REQUESTS ──────────────────────────────

-- Students: insert and read own requests
CREATE POLICY "requests_student_insert"
  ON requests FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "requests_student_select"
  ON requests FOR SELECT
  USING (auth.uid() = student_id OR auth.uid() = tutor_id);

-- Tutors: update their own incoming requests
CREATE POLICY "requests_tutor_update"
  ON requests FOR UPDATE
  USING (auth.uid() = tutor_id);

-- Leadership / master: full access
CREATE POLICY "requests_leadership_all"
  ON requests FOR ALL
  USING (public.get_my_role() IN ('leadership', 'master'));

-- ─── 16. RLS POLICIES: HOURS_LOGS ────────────────────────────

-- Tutors: insert and read own logs
CREATE POLICY "hours_tutor_insert"
  ON hours_logs FOR INSERT
  WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "hours_own_select"
  ON hours_logs FOR SELECT
  USING (auth.uid() = tutor_id OR auth.uid() = student_id);

-- Leadership / master: full access (for approval)
CREATE POLICY "hours_leadership_all"
  ON hours_logs FOR ALL
  USING (public.get_my_role() IN ('leadership', 'master'));

-- ─── 16. RLS POLICIES: CONVERSATIONS ─────────────────────────

CREATE POLICY "conversations_participants"
  ON conversations FOR ALL
  USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- ─── 17. RLS POLICIES: MESSAGES ──────────────────────────────

CREATE POLICY "messages_participants"
  ON messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    )
  );

-- ─── 18. RLS POLICIES: NOTIFICATIONS ─────────────────────────

CREATE POLICY "notifications_own"
  ON notifications FOR ALL
  USING (auth.uid() = user_id);

-- ─── 19. RLS POLICIES: EMAIL_QUEUE ───────────────────────────

-- Any authenticated user can insert (to queue notifications)
CREATE POLICY "email_queue_insert"
  ON email_queue FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can read their own queued emails
CREATE POLICY "email_queue_own_select"
  ON email_queue FOR SELECT
  USING (auth.uid() = recipient_user_id);

-- ─── 20. MASTER USER SETUP ───────────────────────────────────
-- Run AFTER adroit.shourya@gmail.com has signed up.
-- This grants the master+tutor roles to that account.
--
-- Uncomment and run separately once the account exists:
--
-- UPDATE profiles
-- SET role = 'master', roles = ARRAY['master', 'tutor']
-- WHERE email = 'adroit.shourya@gmail.com';
