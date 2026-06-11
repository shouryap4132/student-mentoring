-- enable-rls.sql
-- Enable row level security for profiles and create policies allowing:
--  - authenticated users to manage their own profile
--  - a master account to SELECT all profiles (needed for master dashboard)

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow authenticated user to manage own profile"
  ON public.profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow the master email to SELECT all profiles (useful for admin tooling)
CREATE POLICY IF NOT EXISTS "Allow master select all profiles"
  ON public.profiles
  FOR SELECT
  USING (auth.jwt() ->> 'email' = 'adroit.shourya@gmail.com');

-- Note: Run this after your migration. If you use Supabase, run this in the SQL editor.
