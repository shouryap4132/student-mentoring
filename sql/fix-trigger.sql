-- fix-trigger.sql
-- Patch for databases that already ran supabase-setup.sql.
-- Replaces the auth trigger with the full-metadata version and
-- adds any missing columns introduced in the rewrite.
-- Safe to run multiple times (idempotent).

-- 1. Add missing columns (ALTER TABLE is a no-op when column already exists
--    via the IF NOT EXISTS guard added in PG 9.6+)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS grade_level     text,
  ADD COLUMN IF NOT EXISTS subjects        text[]       NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS bio             text         NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS avatar_url      text,
  ADD COLUMN IF NOT EXISTS qualifications  text         NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS availability    text         NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS roles           text[]       NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS knowledge_level text         NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS profile_complete boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS goal_hours      integer      NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS avg_rating      numeric(3,2) NOT NULL DEFAULT 5.00;

ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS accepted_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS accepted_at  timestamptz;

-- 2. Replace trigger function with full-metadata version
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger AS $$
DECLARE
  meta jsonb;
  v_role text;
  v_subjects text[];
BEGIN
  meta := COALESCE(NEW.raw_user_meta_data::jsonb, '{}'::jsonb);
  v_role := COALESCE(NULLIF(meta->>'role', ''), 'student');

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

-- Re-attach the trigger (DROP IF EXISTS + CREATE is idempotent)
DROP TRIGGER IF EXISTS trigger_auth_user_created ON auth.users;
CREATE TRIGGER trigger_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_created();

-- 3. Ensure the get_my_role() helper exists (guards against recursive RLS)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 4. Set master user roles (run after adroit.shourya@gmail.com has signed up)
-- Uncomment once the account exists:
-- UPDATE public.profiles
-- SET role = 'master', roles = ARRAY['master', 'tutor']
-- WHERE email = 'adroit.shourya@gmail.com';
