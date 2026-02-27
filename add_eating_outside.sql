-- Add eating_outside column to weekly_behavioral_logs
-- Run in Supabase SQL Editor
ALTER TABLE public.weekly_behavioral_logs
  ADD COLUMN IF NOT EXISTS eating_outside TEXT;
