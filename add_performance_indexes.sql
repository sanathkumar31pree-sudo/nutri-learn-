-- ============================================================
-- Performance Indexes for NutriLearn
-- Run in Supabase SQL Editor (Project → SQL Editor)
-- ============================================================

-- 1. Composite index for quiz fetching
--    Every quiz load queries: WHERE difficulty = X ORDER BY week, question
--    Without this index, Postgres does a sequential scan on every request.
CREATE INDEX IF NOT EXISTS idx_quizzes_difficulty_week_question
  ON public.quizzes (difficulty, week, question);

-- 2. Index for "has user submitted today?" check
--    Used by getTodayResponse(): WHERE user_id = X AND study_date = Y
CREATE INDEX IF NOT EXISTS idx_quiz_responses_user_date
  ON public.quiz_responses (user_id, study_date);

-- 3. Index for "what day is the user on?" check
--    Used by getStudyDay(): WHERE user_id = X ORDER BY day_number DESC LIMIT 1
CREATE INDEX IF NOT EXISTS idx_quiz_responses_user_day
  ON public.quiz_responses (user_id, day_number DESC);

-- 4. Index for weekly log duplicate check
--    Used by checkWeeklyLogSubmitted(): WHERE user_id = X AND week_start_date = Y
CREATE INDEX IF NOT EXISTS idx_weekly_logs_user_week
  ON public.weekly_behavioral_logs (user_id, week_start_date);
