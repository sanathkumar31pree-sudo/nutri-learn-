-- ============================================================
-- Fix: Grant INSERT/SELECT permissions to the anon role
-- Run in Supabase SQL Editor (Project → SQL Editor)
-- ============================================================

-- 1. Grant table-level permissions to anon and authenticated roles
GRANT SELECT, INSERT ON public.quiz_responses TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.quiz_responses_id_seq TO anon, authenticated;

-- 2. Drop existing policies and recreate with explicit role targeting
DROP POLICY IF EXISTS "allow insert" ON public.quiz_responses;
DROP POLICY IF EXISTS "allow select" ON public.quiz_responses;

CREATE POLICY "anon_insert" ON public.quiz_responses
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "anon_select" ON public.quiz_responses
  FOR SELECT TO anon, authenticated
  USING (true);

-- 3. Also fix weekly_behavioral_logs while we're here
GRANT SELECT, INSERT ON public.weekly_behavioral_logs TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.weekly_behavioral_logs_id_seq TO anon, authenticated;

DROP POLICY IF EXISTS "Users can view own weekly logs" ON public.weekly_behavioral_logs;
DROP POLICY IF EXISTS "Users can insert own weekly logs" ON public.weekly_behavioral_logs;

CREATE POLICY "wbl_insert" ON public.weekly_behavioral_logs
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "wbl_select" ON public.weekly_behavioral_logs
  FOR SELECT TO anon, authenticated
  USING (true);
