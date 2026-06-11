-- fix-rls-policies.sql
-- Run this in the Supabase SQL editor to fix the recursive RLS policies
-- that caused 500 errors on profile reads.
-- You do NOT need to re-run the full supabase-setup.sql.

-- ─── 1. Helper function (bypasses RLS to read current user's role) ───────────
-- SECURITY DEFINER makes it run as the function owner, not the caller,
-- so it skips RLS and won't cause infinite recursion.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ─── 2. Drop the recursive policies ─────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_leadership_select_all" ON public.profiles;
DROP POLICY IF EXISTS "requests_leadership_all"        ON public.requests;
DROP POLICY IF EXISTS "hours_leadership_all"           ON public.hours_logs;

-- ─── 3. Recreate them using the helper function ───────────────────────────────

-- Leadership / master can read all profiles (for grant-leadership search)
CREATE POLICY "profiles_leadership_select_all"
  ON public.profiles FOR SELECT
  USING (public.get_my_role() IN ('leadership', 'master'));

-- Leadership / master: full access to requests
CREATE POLICY "requests_leadership_all"
  ON public.requests FOR ALL
  USING (public.get_my_role() IN ('leadership', 'master'));

-- Leadership / master: full access to hours_logs (for approval)
CREATE POLICY "hours_leadership_all"
  ON public.hours_logs FOR ALL
  USING (public.get_my_role() IN ('leadership', 'master'));
