-- ============================================================
-- Supabase Auth Migration: Update RLS Policies
-- Run in Supabase SQL Editor after enabling Supabase Auth
-- ============================================================

-- ── profiles ─────────────────────────────────────────────────
-- Allow authenticated users to insert their own profile on signup
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- Grant table access
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- ── quiz_responses ────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_insert" ON public.quiz_responses;
DROP POLICY IF EXISTS "anon_select" ON public.quiz_responses;

CREATE POLICY "auth_insert" ON public.quiz_responses
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "auth_select" ON public.quiz_responses
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT ON public.quiz_responses TO authenticated;

-- ── weekly_behavioral_logs ────────────────────────────────────
DROP POLICY IF EXISTS "wbl_insert" ON public.weekly_behavioral_logs;
DROP POLICY IF EXISTS "wbl_select" ON public.weekly_behavioral_logs;

CREATE POLICY "wbl_auth_insert" ON public.weekly_behavioral_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wbl_auth_select" ON public.weekly_behavioral_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT ON public.weekly_behavioral_logs TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.weekly_behavioral_logs_id_seq TO authenticated;
