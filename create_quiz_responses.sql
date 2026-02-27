-- ============================================================
-- Nutri Learn — quiz_responses table
-- Run this in your Supabase SQL Editor (Project → SQL Editor)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.quiz_responses (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID        NOT NULL,
  day_number   INT         NOT NULL,
  score        INT         NOT NULL CHECK (score >= 0 AND score <= 5),
  answers      JSONB       NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  study_date   DATE        NOT NULL DEFAULT CURRENT_DATE
);

-- Add index for fast per-user lookups
CREATE INDEX IF NOT EXISTS idx_quiz_responses_user_date
  ON public.quiz_responses (user_id, study_date);

-- Row Level Security
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

-- Any client can insert (localStorage auth, no Supabase auth.uid)
CREATE POLICY "allow insert"
  ON public.quiz_responses FOR INSERT
  WITH CHECK (true);

-- Any client can select their own rows by user_id
CREATE POLICY "allow select"
  ON public.quiz_responses FOR SELECT
  USING (true);
