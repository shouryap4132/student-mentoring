-- update-roles.sql
-- Adds a roles array to profiles, backfills from legacy "role", and grants adroit.shourya@gmail.com master+tutor roles.

-- 1) Add roles column if missing
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS roles text[];

-- 2) Backfill roles from existing single role column where roles is empty
UPDATE profiles
SET roles = ARRAY[role]
WHERE (roles IS NULL OR array_length(roles, 1) IS NULL) AND role IS NOT NULL;

-- 3) Ensure adroit user has both 'master' and 'tutor' (no duplicates)
UPDATE profiles
SET roles = (
  SELECT array_agg(DISTINCT val) FROM (
    SELECT unnest(coalesce(roles, ARRAY[role])) AS val
    UNION SELECT 'master' UNION SELECT 'tutor'
  ) sub
)
WHERE email = 'adroit.shourya@gmail.com';

-- 4) (Optional) Keep legacy single role column compatible by setting primary role to 'master'
UPDATE profiles
SET role = 'master'
WHERE email = 'adroit.shourya@gmail.com';

-- 5) Optional: RLS policy to allow authenticated users to insert/update their own profile
-- Uncomment and run only if you want RLS enabled and policies applied.
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow authenticated user to manage own profile" ON public.profiles
--   FOR ALL
--   USING (auth.uid() = id)
--   WITH CHECK (auth.uid() = id);

-- Notes:
-- Run this in the Supabase SQL editor or via psql connected to your database. If RLS is disabled (as you usually do), policies are moot; these statements are safe.
