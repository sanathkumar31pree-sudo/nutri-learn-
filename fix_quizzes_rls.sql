-- ============================================================
-- Fix: Allow authenticated users to read from the quizzes table
-- Run this in Supabase SQL Editor (Project → SQL Editor)
-- ============================================================

-- Enable RLS (may already be enabled)
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Grant SELECT to authenticated users
GRANT SELECT ON public.quizzes TO authenticated;

-- Also grant to anon in case some users aren't fully authenticated yet
GRANT SELECT ON public.quizzes TO anon;

-- Drop any conflicting policies
DROP POLICY IF EXISTS "quizzes_select" ON public.quizzes;
DROP POLICY IF EXISTS "allow_read_quizzes" ON public.quizzes;

-- Create a policy that allows everyone to read quizzes (they are public content)
CREATE POLICY "allow_read_quizzes" ON public.quizzes
  FOR SELECT TO authenticated, anon
  USING (true);
